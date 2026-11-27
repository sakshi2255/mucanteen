import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Banknote, CreditCard, Calendar, X } from 'lucide-react-native';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';
import { colors } from '../../config/theme';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { styles } from '../../styles/student/PaymentHistoryStyles';
import type { Order, PaymentMethod } from '../../models/types';

type DerivedStatus = 'done' | 'pending' | 'refunded';

interface UnifiedPaymentItem {
  id: string;
  order_id: string;
  token_display: string;
  user_name: string;
  canteen_name: string;
  payment_mode: PaymentMethod;
  order_type: 'instant' | 'preorder';
  price: number;
  status: DerivedStatus;
  statusLabel: string;
  timestamp: string;
}

export const PaymentHistoryScreen = ({ navigation, route }: any) => {
  const { user, firebaseUser } = useAuth();
  const { showToast } = useToast();

  const isCanteenScope = route?.params?.scope === 'canteen' || user?.role_id === 'operator';
  const assignedCanteenId = user?.assigned_canteen_ids?.[0] || 'canteen_main_1';

  const [orders, setOrders] = useState<Order[]>([]);
  const [modeFilter, setModeFilter] = useState<'all' | 'online_demo' | 'cash'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | DerivedStatus>('all');
  const [dateFilter, setDateFilter] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (!user) {
      setOrders([]);
      return;
    }

    let q;
    if (isCanteenScope) {
      q = query(collection(db, 'orders'), where('canteen_id', '==', assignedCanteenId));
    } else {
      const ids = new Set<string>([user.user_id]);
      if (firebaseUser?.uid && firebaseUser.email?.toLowerCase() === user.email?.toLowerCase()) {
        ids.add(firebaseUser.uid);
      }
      const idList = Array.from(ids).filter(Boolean);
      q =
        idList.length > 1
          ? query(collection(db, 'orders'), where('user_id', 'in', idList))
          : query(collection(db, 'orders'), where('user_id', '==', idList[0]));
    }

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs
          .map((d) => d.data() as Order)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setOrders(list);
      },
      (error) => {
        console.warn('Payment history orders listener error:', error.message);
        showToast('Could not load payment history.', 'error');
      }
    );

    return unsub;
  }, [user, firebaseUser?.uid, firebaseUser?.email, isCanteenScope, assignedCanteenId, showToast]);

  const paymentItems = useMemo<UnifiedPaymentItem[]>(() => {
    return orders.map((order) => {
      const isCancelledOrDeclined =
        order.order_status === 'declined' || order.order_status === 'cancelled';

      let status: DerivedStatus = 'done';
      let statusLabel = 'DONE';

      if (
        order.payment_status === 'REFUNDED' ||
        (order.payment_method === 'online_demo' && isCancelledOrDeclined)
      ) {
        status = 'refunded';
        statusLabel = 'REFUNDED';
      } else if (order.payment_status === 'CASH_PENDING' && !isCancelledOrDeclined) {
        status = 'pending';
        statusLabel = 'PENDING';
      } else if (order.payment_status === 'CASH_PENDING' && isCancelledOrDeclined) {
        status = 'refunded';
        statusLabel = 'CANCELLED';
      } else {
        status = 'done';
        statusLabel = order.payment_method === 'online_demo' ? 'ONLINE PAID' : 'CASH PAID';
      }

      return {
        id: order.order_id,
        order_id: order.order_id,
        token_display: order.token_display || order.order_id.slice(-6).toUpperCase(),
        user_name: order.user_name_snapshot || 'Customer',
        canteen_name: order.canteen_name_snapshot || 'MU Canteen',
        payment_mode: order.payment_method,
        order_type: order.order_type,
        price: Number(order.total) || 0,
        status,
        statusLabel,
        timestamp: order.cash_received_at || order.created_at,
      };
    });
  }, [orders]);

  const filteredPayments = useMemo(() => {
    return paymentItems.filter((item) => {
      if (modeFilter !== 'all' && item.payment_mode !== modeFilter) return false;
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (dateFilter.trim()) {
        const d = new Date(item.timestamp);
        if (d.toISOString().split('T')[0] !== dateFilter.trim()) return false;
        const hhmm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        if (startTime.trim() && hhmm < startTime.trim()) return false;
        if (endTime.trim() && hhmm > endTime.trim()) return false;
      }
      return true;
    });
  }, [paymentItems, modeFilter, statusFilter, dateFilter, startTime, endTime]);

  const stats = useMemo(() => {
    let totalDone = 0;
    let onlineTotal = 0;
    let cashTotal = 0;
    let pendingTotal = 0;
    let refundedTotal = 0;

    for (const item of filteredPayments) {
      if (item.status === 'done') {
        totalDone += item.price;
        if (item.payment_mode === 'online_demo') onlineTotal += item.price;
        else cashTotal += item.price;
      } else if (item.status === 'pending') {
        pendingTotal += item.price;
      } else if (item.status === 'refunded') {
        refundedTotal += item.price;
      }
    }

    return { totalDone, onlineTotal, cashTotal, pendingTotal, refundedTotal };
  }, [filteredPayments]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isCanteenScope ? 'Canteen Payment Stats' : 'Payment History & Stats'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.statsCard}>
        <Text style={styles.statsLabel}>
          {isCanteenScope ? 'Total Payments Received (Online + Cash)' : 'Total Paid (Filtered)'}
        </Text>
        <Text style={styles.statsValue}>₹{stats.totalDone}</Text>

        <View style={styles.statsBreakdownRow}>
          <View style={styles.statsMiniItem}>
            <Text style={styles.statsMiniLabel}>Online</Text>
            <Text style={styles.statsMiniVal}>₹{stats.onlineTotal}</Text>
          </View>
          <View style={styles.statsMiniItem}>
            <Text style={styles.statsMiniLabel}>Cash</Text>
            <Text style={styles.statsMiniVal}>₹{stats.cashTotal}</Text>
          </View>
          <View style={styles.statsMiniItem}>
            <Text style={styles.statsMiniLabel}>Pending</Text>
            <Text style={styles.statsMiniVal}>₹{stats.pendingTotal}</Text>
          </View>
          <View style={styles.statsMiniItem}>
            <Text style={styles.statsMiniLabel}>Refunds</Text>
            <Text style={styles.statsMiniVal}>₹{stats.refundedTotal}</Text>
          </View>
        </View>
      </View>

      <View style={styles.filterRow}>
        {[
          { id: 'all', label: 'All Modes' },
          { id: 'online_demo', label: 'Online' },
          { id: 'cash', label: 'Cash' },
        ].map((f) => (
          <TouchableOpacity
            key={f.id}
            style={[styles.filterChip, modeFilter === f.id && styles.filterChipActive]}
            onPress={() => setModeFilter(f.id as 'all' | 'online_demo' | 'cash')}
          >
            <Text style={[styles.filterChipText, modeFilter === f.id && styles.filterChipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[styles.filterChip, !!dateFilter && styles.filterChipActive]}
          onPress={() => setModalVisible(true)}
        >
          <Calendar size={13} color={dateFilter ? '#FFFFFF' : colors.textSecondary} />
          <Text style={[styles.filterChipText, !!dateFilter && styles.filterChipTextActive]}>
            {dateFilter || 'Date & Time'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        {(
          [
            { id: 'all', label: 'All Status' },
            { id: 'done', label: 'Done' },
            { id: 'pending', label: 'Pending' },
            { id: 'refunded', label: 'Refunded' },
          ] as const
        ).map((s) => (
          <TouchableOpacity
            key={s.id}
            style={[styles.filterChip, statusFilter === s.id && styles.filterChipActive]}
            onPress={() => setStatusFilter(s.id)}
          >
            <Text style={[styles.filterChipText, statusFilter === s.id && styles.filterChipTextActive]}>
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredPayments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No payments match your selected filters.</Text>
        }
        renderItem={({ item }) => {
          const pillStyle =
            item.status === 'pending'
              ? styles.statusPillPending
              : item.status === 'refunded'
                ? styles.statusPillRefunded
                : styles.statusPillPaid;
          const textStyle =
            item.status === 'pending'
              ? styles.statusTextPending
              : item.status === 'refunded'
                ? styles.statusTextRefunded
                : styles.statusTextPaid;

          return (
            <View style={styles.paymentCard}>
              <View style={styles.iconBox}>
                {item.payment_mode === 'cash' ? (
                  <Banknote size={20} color="#D97706" />
                ) : (
                  <CreditCard size={20} color={colors.primary} />
                )}
              </View>
              <View style={styles.detailsCol}>
                <Text style={styles.orderId}>
                  Token #{item.token_display} • {item.order_type.toUpperCase()}
                </Text>
                <Text style={styles.canteenName}>
                  {isCanteenScope ? item.user_name : item.canteen_name}
                </Text>
                <Text style={styles.dateText}>{new Date(item.timestamp).toLocaleString()}</Text>
              </View>
              <View style={styles.priceCol}>
                <Text style={styles.priceText}>₹{item.price}</Text>
                <View style={[styles.statusPill, pillStyle]}>
                  <Text style={[styles.statusText, textStyle]}>{item.statusLabel}</Text>
                </View>
              </View>
            </View>
          );
        }}
      />

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter by Date & Time</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 2026-11-27"
              placeholderTextColor={colors.textMuted}
              value={dateFilter}
              onChangeText={setDateFilter}
            />

            <Text style={styles.inputLabel}>From Time (HH:MM, optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 09:00"
              placeholderTextColor={colors.textMuted}
              value={startTime}
              onChangeText={setStartTime}
            />

            <Text style={styles.inputLabel}>To Time (HH:MM, optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 17:00"
              placeholderTextColor={colors.textMuted}
              value={endTime}
              onChangeText={setEndTime}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.resetBtn}
                onPress={() => {
                  setDateFilter('');
                  setStartTime('');
                  setEndTime('');
                  setModalVisible(false);
                  showToast('Payment date filter cleared.', 'info');
                }}
              >
                <Text style={styles.resetBtnText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyBtn}
                onPress={() => {
                  setModalVisible(false);
                  if (dateFilter.trim()) {
                    showToast(`Filtered payments for ${dateFilter.trim()}.`, 'success');
                  }
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