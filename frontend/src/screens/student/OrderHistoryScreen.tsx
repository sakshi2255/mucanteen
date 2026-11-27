import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, ScrollView, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, History, Calendar, X } from 'lucide-react-native';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';
import { colors } from '../../config/theme';
import { OrderCardCompact } from '../../components/common/OrderCardCompact';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { styles } from '../../styles/student/OrderHistoryStyles';
import type { Order, OrderStatus } from '../../models/types';

interface OrderHistoryScreenProps {
  navigation: any;
  route?: { params?: { mode?: 'live' | 'history'; scope?: 'user' | 'canteen' } };
}

const LIVE_STATUSES: OrderStatus[] = ['scheduled', 'awaiting_acceptance', 'preparing', 'ready_for_pickup'];
const PAST_STATUSES: OrderStatus[] = ['picked_up', 'not_collected', 'declined', 'cancelled'];

export const OrderHistoryScreen: React.FC<OrderHistoryScreenProps> = ({ navigation, route }) => {
  const { user, firebaseUser } = useAuth();
  const { showToast } = useToast();

  const mode = route?.params?.mode || 'history';
  const isLiveMode = mode === 'live';
  const isCanteenScope = route?.params?.scope === 'canteen' || user?.role_id === 'operator';
  const assignedCanteenId = user?.assigned_canteen_ids?.[0] || 'canteen_main_1';

  const [orders, setOrders] = useState<Order[]>([]);
  const [statusScope, setStatusScope] = useState<'all' | 'past' | 'active'>(
    isCanteenScope ? 'past' : 'all'
  );
  const [timePreset, setTimePreset] = useState<'all' | 'today' | 'week' | 'custom'>('all');
  const [customDate, setCustomDate] = useState('');
  const [customStartTime, setCustomStartTime] = useState('');
  const [customEndTime, setCustomEndTime] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  useEffect(() => {
    setStatusScope(isCanteenScope ? 'past' : 'all');
  }, [isCanteenScope]);

  useEffect(() => {
    if (!user) {
      setOrders([]);
      return;
    }

    if (isCanteenScope) {
      const q = query(collection(db, 'orders'), where('canteen_id', '==', assignedCanteenId));
      const unsub = onSnapshot(
        q,
        (snapshot) => {
          const list = snapshot.docs
            .map((d) => d.data() as Order)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          setOrders(list);
        },
        (error) => {
          console.warn('Canteen order history listener error:', error.message);
          showToast('Could not load canteen order history.', 'error');
        }
      );
      return unsub;
    }

    const userIds = new Set<string>([user.user_id]);
    if (firebaseUser?.uid && firebaseUser.email?.toLowerCase() === user.email?.toLowerCase()) {
      userIds.add(firebaseUser.uid);
    }

    const idList = Array.from(userIds).filter(Boolean);
    const q =
      idList.length > 1
        ? query(collection(db, 'orders'), where('user_id', 'in', idList))
        : query(collection(db, 'orders'), where('user_id', '==', idList[0]));

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs
          .map((d) => d.data() as Order)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setOrders(list);
      },
      (error) => {
        console.warn('User order history listener error:', error.message);
        showToast('Could not load your orders.', 'error');
      }
    );

    return unsub;
  }, [user, firebaseUser?.uid, firebaseUser?.email, isCanteenScope, assignedCanteenId, showToast]);

  const filteredOrders = useMemo(() => {
    let result = orders;

    if (isLiveMode) {
      result = result.filter((o) => LIVE_STATUSES.includes(o.order_status));
    } else if (statusScope === 'past') {
      result = result.filter((o) => PAST_STATUSES.includes(o.order_status));
    } else if (statusScope === 'active') {
      result = result.filter((o) => LIVE_STATUSES.includes(o.order_status));
    }

    if (!isLiveMode && timePreset !== 'all') {
      const now = new Date();
      if (timePreset === 'today') {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        result = result.filter((o) => new Date(o.created_at).getTime() >= start);
      } else if (timePreset === 'week') {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).getTime();
        result = result.filter((o) => new Date(o.created_at).getTime() >= start);
      } else if (timePreset === 'custom' && customDate.trim()) {
        const dateStr = customDate.trim();
        result = result.filter((o) => {
          const d = new Date(o.created_at);
          const isoDate = d.toISOString().split('T')[0];
          if (isoDate !== dateStr) return false;
          const hhmm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
          if (customStartTime.trim() && hhmm < customStartTime.trim()) return false;
          if (customEndTime.trim() && hhmm > customEndTime.trim()) return false;
          return true;
        });
      }
    }

    return result;
  }, [orders, isLiveMode, statusScope, timePreset, customDate, customStartTime, customEndTime]);

  const screenTitle = isLiveMode
    ? 'Live Orders'
    : isCanteenScope
      ? 'Canteen Order History'
      : 'My Order History';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        {navigation.canGoBack() ? (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerSpacer} />
        )}
        <Text style={styles.headerTitle}>{screenTitle}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {!isLiveMode && (
        <View style={styles.filterBarWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterBar}
          >
            {(
              [
                { id: 'past', label: 'Past Orders' },
                { id: 'all', label: 'All Orders' },
                { id: 'active', label: 'Active' },
              ] as const
            ).map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[styles.filterChip, statusScope === tab.id && styles.filterChipActive]}
                onPress={() => setStatusScope(tab.id)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    statusScope === tab.id && styles.filterChipTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}

            {(['all', 'today', 'week'] as const).map((preset) => (
              <TouchableOpacity
                key={preset}
                style={[styles.filterChip, timePreset === preset && styles.filterChipActive]}
                onPress={() => setTimePreset(preset)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    timePreset === preset && styles.filterChipTextActive,
                  ]}
                >
                  {preset === 'all' ? 'All Time' : preset === 'today' ? 'Today' : 'Last 7 Days'}
                </Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[styles.filterChip, timePreset === 'custom' && styles.filterChipActive]}
              onPress={() => setFilterModalVisible(true)}
            >
              <Calendar
                size={13}
                color={timePreset === 'custom' ? '#FFFFFF' : colors.textSecondary}
              />
              <Text
                style={[
                  styles.filterChipText,
                  timePreset === 'custom' && styles.filterChipTextActive,
                ]}
              >
                {timePreset === 'custom' && customDate ? customDate : 'Date & Time'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      <View style={styles.container}>
        {filteredOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <History size={64} color={colors.borderLight} />
            <Text style={styles.emptyTitle}>
              {isLiveMode ? 'No active orders' : 'No orders found'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {isLiveMode
                ? 'Orders currently in queue, preparing, or ready for pickup will appear here.'
                : isCanteenScope
                  ? 'Completed, cancelled, declined, or expired orders for your canteen will appear here.'
                  : 'Orders placed from your account will appear here.'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredOrders}
            keyExtractor={(item) => item.order_id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <OrderCardCompact
                order={item}
                isOperatorView={isCanteenScope}
                onPressTrack={
                  isCanteenScope
                    ? undefined
                    : (ord) => navigation.navigate('OrderTracking', { order: ord })
                }
              />
            )}
          />
        )}
      </View>

      <Modal visible={filterModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter by Date & Time</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 2026-11-27"
              placeholderTextColor={colors.textMuted}
              value={customDate}
              onChangeText={setCustomDate}
            />

            <Text style={styles.inputLabel}>From Time (HH:MM, optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 09:00"
              placeholderTextColor={colors.textMuted}
              value={customStartTime}
              onChangeText={setCustomStartTime}
            />

            <Text style={styles.inputLabel}>To Time (HH:MM, optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 17:00"
              placeholderTextColor={colors.textMuted}
              value={customEndTime}
              onChangeText={setCustomEndTime}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.resetBtn}
                onPress={() => {
                  setCustomDate('');
                  setCustomStartTime('');
                  setCustomEndTime('');
                  setTimePreset('all');
                  setFilterModalVisible(false);
                  showToast('Date filter cleared.', 'info');
                }}
              >
                <Text style={styles.resetBtnText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyBtn}
                onPress={() => {
                  if (customDate.trim()) {
                    setTimePreset('custom');
                    showToast(`Filtered orders for ${customDate.trim()}.`, 'success');
                  }
                  setFilterModalVisible(false);
                }}
              >
                <Text style={styles.applyBtnText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};