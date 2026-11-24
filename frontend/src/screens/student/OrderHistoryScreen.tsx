import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, ScrollView, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, History, Calendar, X } from 'lucide-react-native';
import { colors } from '../../config/theme';
import { OrderCardCompact } from '../../components/common/OrderCardCompact';
import { useAuth } from '../../context/AuthContext';
import { listenStudentOrders } from '../../services/firestoreService';
import { styles } from '../../styles/student/OrderHistoryStyles';
import type { Order, OrderStatus } from '../../models/types';

interface OrderHistoryScreenProps {
  navigation: any;
  route?: { params?: { mode?: 'live' | 'history' } };
}

const LIVE_STATUSES: OrderStatus[] = ['scheduled', 'awaiting_acceptance', 'preparing', 'ready_for_pickup'];
const PAST_STATUSES: OrderStatus[] = ['picked_up', 'not_collected', 'declined', 'cancelled'];

export const OrderHistoryScreen: React.FC<OrderHistoryScreenProps> = ({ navigation, route }) => {
  const { user } = useAuth();
  const mode = route?.params?.mode || 'history';
  const isLiveMode = mode === 'live';

  const [orders, setOrders] = useState<Order[]>([]);
  const [timePreset, setTimePreset] = useState<'all' | 'today' | 'week' | 'custom'>('all');
  const [customDate, setCustomDate] = useState(''); // YYYY-MM-DD
  const [customStartTime, setCustomStartTime] = useState(''); // HH:MM
  const [customEndTime, setCustomEndTime] = useState(''); // HH:MM
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsub = listenStudentOrders(user.user_id, (data) => setOrders(data));
    return unsub;
  }, [user]);

  const filteredOrders = useMemo(() => {
    const allowedStatuses = isLiveMode ? LIVE_STATUSES : PAST_STATUSES;
    let result = orders.filter((o) => allowedStatuses.includes(o.order_status));

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
  }, [orders, isLiveMode, timePreset, customDate, customStartTime, customEndTime]);

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
        <Text style={styles.headerTitle}>{isLiveMode ? 'Live Orders' : 'Order History'}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {!isLiveMode && (
        <View style={styles.filterBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterBar}>
            {(['all', 'today', 'week'] as const).map((preset) => (
              <TouchableOpacity
                key={preset}
                style={[styles.filterChip, timePreset === preset && styles.filterChipActive]}
                onPress={() => setTimePreset(preset)}
              >
                <Text style={[styles.filterChipText, timePreset === preset && styles.filterChipTextActive]}>
                  {preset === 'all' ? 'All Time' : preset === 'today' ? 'Today' : 'Last 7 Days'}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.filterChip, timePreset === 'custom' && styles.filterChipActive]}
              onPress={() => setFilterModalVisible(true)}
            >
              <Calendar size={13} color={timePreset === 'custom' ? '#FFFFFF' : colors.textSecondary} />
              <Text style={[styles.filterChipText, timePreset === 'custom' && styles.filterChipTextActive]}>
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
            <Text style={styles.emptyTitle}>{isLiveMode ? 'No active orders' : 'No past orders found'}</Text>
            <Text style={styles.emptySubtitle}>
              {isLiveMode
                ? 'Orders currently in queue, preparing, or ready for pickup will appear here.'
                : 'Your completed, cancelled, or expired orders will appear here.'}
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
                isOperatorView={false}
                onPressTrack={(ord) => navigation.navigate('OrderTracking', { order: ord })}
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
              placeholder="e.g. 2026-11-23"
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
                }}
              >
                <Text style={styles.resetBtnText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyBtn}
                onPress={() => {
                  if (customDate.trim()) setTimePreset('custom');
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