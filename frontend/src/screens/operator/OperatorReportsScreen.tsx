import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Calendar, X } from 'lucide-react-native';
import { colors } from '../../config/theme';
import { useAuth } from '../../context/AuthContext';
import {
  listenOperatorOrders,
  listenRevenueForCanteen,
  listenCanteenPaymentHistory,
} from '../../services/firestoreService';
import { getISTDateString } from '../../services/tokenService';
import type { Order, PaymentHistory, Revenue } from '../../models/types';
import { styles } from '../../styles/operator/OperatorReportsStyles';

interface OperatorReportsScreenProps { navigation: any; }

export const OperatorReportsScreen: React.FC<OperatorReportsScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const assignedCanteenId = user?.assigned_canteen_ids?.[0] || 'canteen_main_1';
  const todayStr = getISTDateString();

  const [activeTab, setActiveTab] = useState<'summary' | 'orders' | 'payments'>('summary');
  const [orders, setOrders] = useState<Order[]>([]);
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [payments, setPayments] = useState<PaymentHistory[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [dateModalVisible, setDateModalVisible] = useState(false);

  useEffect(() => {
    const unsubOrders = listenOperatorOrders(assignedCanteenId, (list) => setOrders(list));
    const unsubRevenue = listenRevenueForCanteen(assignedCanteenId, (revs) => setRevenues(revs));
    const unsubPayments = listenCanteenPaymentHistory(assignedCanteenId, (pays) => setPayments(pays));
    return () => {
      unsubOrders();
      unsubRevenue();
      unsubPayments();
    };
  }, [assignedCanteenId]);

  const todayRevDoc = revenues.find((r) => r.date === todayStr);
  const completed = orders.filter((o) => o.order_status === 'picked_up');
  const active = orders.filter((o) => ['awaiting_acceptance', 'preparing', 'ready_for_pickup'].includes(o.order_status));
  const declined = orders.filter((o) => ['declined', 'cancelled', 'not_collected'].includes(o.order_status));
  const liveRevenue = completed.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  const displayRevenue = Math.max(liveRevenue, Number(todayRevDoc?.total_revenue) || 0);
  const displayOrders = Math.max(completed.length, Number(todayRevDoc?.total_orders) || 0);

  const matchesDateTime = (iso: string) => {
    if (!dateFilter.trim()) return true;
    const d = new Date(iso);
    if (d.toISOString().split('T')[0] !== dateFilter.trim()) return false;
    const hhmm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    if (startTime.trim() && hhmm < startTime.trim()) return false;
    if (endTime.trim() && hhmm > endTime.trim()) return false;
    return true;
  };

  const filteredPastOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return orders.filter((o) => {
      if (!['picked_up', 'declined', 'cancelled', 'not_collected'].includes(o.order_status)) return false;
      if (q && !(o.order_id.toLowerCase().includes(q) || o.user_name_snapshot.toLowerCase().includes(q) || o.token_display.toLowerCase().includes(q))) {
        return false;
      }
      return matchesDateTime(o.created_at);
    });
  }, [orders, searchQuery, dateFilter, startTime, endTime]);

  const filteredPayments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return payments.filter((p) => {
      if (q && !(p.order_id.toLowerCase().includes(q) || p.payment_id.toLowerCase().includes(q) || (p.user_name_snapshot || '').toLowerCase().includes(q))) {
        return false;
      }
      return matchesDateTime(p.timestamp);
    });
  }, [payments, searchQuery, dateFilter, startTime, endTime]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Canteen Reports & History</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.sectionTabs}>
        {[
          { id: 'summary', label: 'Summary' },
          { id: 'orders', label: 'Order History' },
          { id: 'payments', label: 'Payments' },
        ].map((t) => (
          <TouchableOpacity
            key={t.id}
            style={[styles.sectionTab, activeTab === t.id && styles.sectionTabActive]}
            onPress={() => setActiveTab(t.id as 'summary' | 'orders' | 'payments')}
          >
            <Text style={[styles.sectionTabText, activeTab === t.id && styles.sectionTabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'summary' && (
          <>
            <View style={styles.revenueCard}>
              <Text style={styles.revenueTitle}>TODAY'S FULFILLED REVENUE</Text>
              <Text style={styles.revenueValue}>₹{displayRevenue}</Text>
              <Text style={styles.revenueSub}>Based on {displayOrders} collected orders</Text>
            </View>

            {todayRevDoc && (
              <View style={styles.firestoreCard}>
                <Text style={styles.firestoreCardTitle}>FIRESTORE REVENUE RECORD · {todayStr}</Text>
                <View style={styles.firestoreRow}>
                  <Text style={styles.firestoreLabel}>Total Revenue</Text>
                  <Text style={styles.firestoreValue}>₹{Number(todayRevDoc.total_revenue) || 0}</Text>
                </View>
                <View style={styles.firestoreRow}>
                  <Text style={styles.firestoreLabel}>Total Orders</Text>
                  <Text style={styles.firestoreValue}>{Number(todayRevDoc.total_orders) || 0}</Text>
                </View>
              </View>
            )}

            <View style={styles.grid}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Total Received</Text>
                <Text style={styles.statNumber}>{orders.length}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Completed</Text>
                <Text style={[styles.statNumber, styles.statGreen]}>{completed.length}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>In Progress</Text>
                <Text style={[styles.statNumber, styles.statPrimary]}>{active.length}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Declined / Cancel</Text>
                <Text style={[styles.statNumber, styles.statRed]}>{declined.length}</Text>
              </View>
            </View>
          </>
        )}

        {(activeTab === 'orders' || activeTab === 'payments') && (
          <>
            <View style={styles.searchFilterRow}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search by Order ID or Student Name..."
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <TouchableOpacity
                style={[styles.dateFilterBtn, !!dateFilter && styles.dateFilterBtnActive]}
                onPress={() => setDateModalVisible(true)}
              >
                <Calendar size={14} color={dateFilter ? '#FFFFFF' : colors.textSecondary} />
                <Text style={[styles.dateFilterText, !!dateFilter && styles.dateFilterTextActive]}>
                  {dateFilter || 'Date'}
                </Text>
              </TouchableOpacity>
            </View>

            {activeTab === 'orders' && (
              filteredPastOrders.length === 0 ? (
                <Text style={styles.emptyText}>No past orders found for this canteen.</Text>
              ) : (
                filteredPastOrders.map((ord) => (
                  <View key={ord.order_id} style={styles.recordCard}>
                    <View style={styles.recordTopRow}>
                      <Text style={styles.recordTitle}>Token #{ord.token_display} · {ord.user_name_snapshot}</Text>
                      <Text style={styles.recordAmount}>₹{ord.total}</Text>
                    </View>
                    <Text style={styles.recordMeta}>Order ID: {ord.order_id.slice(-8).toUpperCase()} • Status: {ord.order_status.toUpperCase()}</Text>
                    <Text style={styles.recordTime}>{new Date(ord.created_at).toLocaleString()}</Text>
                  </View>
                ))
              )
            )}

            {activeTab === 'payments' && (
              filteredPayments.length === 0 ? (
                <Text style={styles.emptyText}>No payment records found for this canteen.</Text>
              ) : (
                filteredPayments.map((pay) => (
                  <View key={pay.payment_id} style={styles.recordCard}>
                    <View style={styles.recordTopRow}>
                      <Text style={styles.recordTitle}>{pay.user_name_snapshot || 'Student'} ({pay.payment_mode === 'cash' ? 'CASH' : 'ONLINE'})</Text>
                      <Text style={styles.recordAmount}>₹{pay.price}</Text>
                    </View>
                    <Text style={styles.recordMeta}>Payment ID: {pay.payment_id.slice(-8).toUpperCase()} • Order ID: {pay.order_id.slice(-8).toUpperCase()}</Text>
                    <Text style={styles.recordMeta}>Status: {pay.payment_status}</Text>
                    <Text style={styles.recordTime}>{new Date(pay.timestamp).toLocaleString()}</Text>
                  </View>
                ))
              )
            )}
          </>
        )}
      </ScrollView>

      <Modal visible={dateModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter by Date & Time</Text>
              <TouchableOpacity onPress={() => setDateModalVisible(false)}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.inputLabel}>Date (YYYY-MM-DD)</Text>
            <TextInput style={styles.modalInput} placeholder="e.g. 2026-11-23" value={dateFilter} onChangeText={setDateFilter} />
            <Text style={styles.inputLabel}>From Time (HH:MM, optional)</Text>
            <TextInput style={styles.modalInput} placeholder="e.g. 09:00" value={startTime} onChangeText={setStartTime} />
            <Text style={styles.inputLabel}>To Time (HH:MM, optional)</Text>
            <TextInput style={styles.modalInput} placeholder="e.g. 17:00" value={endTime} onChangeText={setEndTime} />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.resetBtn}
                onPress={() => {
                  setDateFilter('');
                  setStartTime('');
                  setEndTime('');
                  setDateModalVisible(false);
                }}
              >
                <Text style={styles.resetBtnText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyBtn} onPress={() => setDateModalVisible(false)}>
                <Text style={styles.applyBtnText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};