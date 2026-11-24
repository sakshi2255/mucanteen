import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Banknote, CreditCard, Calendar, X } from 'lucide-react-native';
import { colors } from '../../config/theme';
import { useAuth } from '../../context/AuthContext';
import { listenPaymentHistory } from '../../services/firestoreService';
import { styles } from '../../styles/student/PaymentHistoryStyles';
import type { PaymentHistory } from '../../models/types';

export const PaymentHistoryScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<PaymentHistory[]>([]);
  const [modeFilter, setModeFilter] = useState<'all' | 'online_demo' | 'cash'>('all');
  const [dateFilter, setDateFilter] = useState(''); // YYYY-MM-DD
  const [startTime, setStartTime] = useState(''); // HH:MM
  const [endTime, setEndTime] = useState(''); // HH:MM
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsub = listenPaymentHistory(user.user_id, (data) => setPayments(data));
    return unsub;
  }, [user]);

  const filteredPayments = useMemo(() => {
    return payments.filter((item) => {
      if (modeFilter !== 'all' && item.payment_mode !== modeFilter) return false;
      if (dateFilter.trim()) {
        const d = new Date(item.timestamp);
        if (d.toISOString().split('T')[0] !== dateFilter.trim()) return false;
        const hhmm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        if (startTime.trim() && hhmm < startTime.trim()) return false;
        if (endTime.trim() && hhmm > endTime.trim()) return false;
      }
      return true;
    });
  }, [payments, modeFilter, dateFilter, startTime, endTime]);

  const totalSpent = useMemo(
    () => filteredPayments.reduce((sum, item) => sum + (Number(item.price) || 0), 0),
    [filteredPayments]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment History</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.statsCard}>
        <Text style={styles.statsLabel}>Total Filtered Spend</Text>
        <Text style={styles.statsValue}>₹{totalSpent}</Text>
      </View>

      <View style={styles.filterRow}>
        {[
          { id: 'all', label: 'All' },
          { id: 'online_demo', label: 'Online' },
          { id: 'cash', label: 'Cash' },
        ].map((f) => (
          <TouchableOpacity
            key={f.id}
            style={[styles.filterChip, modeFilter === f.id && styles.filterChipActive]}
            onPress={() => setModeFilter(f.id as 'all' | 'online_demo' | 'cash')}
          >
            <Text style={[styles.filterChipText, modeFilter === f.id && styles.filterChipTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[styles.filterChip, !!dateFilter && styles.filterChipActive]}
          onPress={() => setModalVisible(true)}
        >
          <Calendar size={13} color={dateFilter ? '#FFFFFF' : colors.textSecondary} />
          <Text style={[styles.filterChipText, !!dateFilter && styles.filterChipTextActive]}>
            {dateFilter ? dateFilter : 'Date & Time'}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredPayments}
        keyExtractor={(item) => item.payment_id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.emptyText}>No payments match your selected filters.</Text>}
        renderItem={({ item }) => {
          const isPending = item.payment_status === 'CASH_PENDING';
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
                <Text style={styles.orderId}>Order #{item.order_id.slice(-6).toUpperCase()}</Text>
                {item.canteen_name_snapshot && <Text style={styles.canteenName}>{item.canteen_name_snapshot}</Text>}
                <Text style={styles.dateText}>{new Date(item.timestamp).toLocaleString()}</Text>
              </View>
              <View style={styles.priceCol}>
                <Text style={styles.priceText}>₹{item.price}</Text>
                <View style={[styles.statusPill, isPending ? styles.statusPillPending : styles.statusPillPaid]}>
                  <Text style={[styles.statusText, isPending ? styles.statusTextPending : styles.statusTextPaid]}>
                    {isPending ? 'PENDING' : 'PAID'}
                  </Text>
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
              placeholder="e.g. 2026-11-23"
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
                }}
              >
                <Text style={styles.resetBtnText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.applyBtnText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};