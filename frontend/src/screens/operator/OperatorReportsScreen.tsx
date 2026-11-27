import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Calendar,
  X,
  CreditCard,
  Banknote,
  Zap,
  Clock,
  ChevronRight,
} from 'lucide-react-native';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';
import { colors } from '../../config/theme';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import type { Order } from '../../models/types';
import { styles } from '../../styles/operator/OperatorReportsStyles';

interface OperatorReportsScreenProps {
  navigation: any;
}

type DrilldownCategory = 'online' | 'cash' | 'instant' | 'preorder' | null;

export const OperatorReportsScreen: React.FC<OperatorReportsScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const assignedCanteenId = user?.assigned_canteen_ids?.[0] || 'canteen_main_1';

  const [activeTab, setActiveTab] = useState<'summary' | 'orders' | 'payments'>('summary');
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedDrilldown, setSelectedDrilldown] = useState<DrilldownCategory>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [dateModalVisible, setDateModalVisible] = useState(false);

  useEffect(() => {
    const ordersQuery = query(
      collection(db, 'orders'),
      where('canteen_id', '==', assignedCanteenId)
    );
    const unsubOrders = onSnapshot(
      ordersQuery,
      (snapshot) => {
        const list = snapshot.docs
          .map((d) => {
            const raw = d.data() as Partial<Order>;
            const safeOrderId = raw.order_id || d.id;
            return {
              ...raw,
              order_id: safeOrderId,
              token_display: raw.token_display || safeOrderId.slice(-6).toUpperCase(),
              user_name_snapshot: raw.user_name_snapshot || 'Customer',
              canteen_name_snapshot: raw.canteen_name_snapshot || 'MU Canteen',
              order_type: raw.order_type || 'instant',
              order_status: raw.order_status || 'awaiting_acceptance',
              payment_method: raw.payment_method || 'online_demo',
              payment_status: raw.payment_status || 'PAID_ONLINE_DEMO',
              total: Number(raw.total) || 0,
              created_at: raw.created_at || new Date().toISOString(),
            } as Order;
          })
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setOrders(list);
      },
      (error) => {
        console.warn('Operator reports orders listener error:', error.message);
        showToast('Could not load canteen revenue data.', 'error');
      }
    );

    return () => {
      unsubOrders();
    };
  }, [assignedCanteenId, showToast]);

  // Unified revenue dataset — exact match with OperatorDashboardScreen
  const validRevenueOrders = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.order_status !== 'declined' &&
          o.order_status !== 'cancelled' &&
          o.payment_status !== 'REFUNDED'
      ),
    [orders]
  );

  const overallRevenue = useMemo(
    () => validRevenueOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0),
    [validRevenueOrders]
  );

  const onlineOrders = useMemo(
    () => validRevenueOrders.filter((o) => o.payment_method === 'online_demo'),
    [validRevenueOrders]
  );
  const onlineInstantOrders = useMemo(
    () => onlineOrders.filter((o) => o.order_type === 'instant'),
    [onlineOrders]
  );
  const onlinePreorders = useMemo(
    () => onlineOrders.filter((o) => o.order_type === 'preorder'),
    [onlineOrders]
  );
  const onlineRevenue = useMemo(
    () => onlineOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0),
    [onlineOrders]
  );
  const onlineInstantRevenue = useMemo(
    () => onlineInstantOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0),
    [onlineInstantOrders]
  );
  const onlinePreorderRevenue = useMemo(
    () => onlinePreorders.reduce((sum, o) => sum + (Number(o.total) || 0), 0),
    [onlinePreorders]
  );

  const cashOrders = useMemo(
    () => validRevenueOrders.filter((o) => o.payment_method === 'cash'),
    [validRevenueOrders]
  );
  const cashRevenue = useMemo(
    () => cashOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0),
    [cashOrders]
  );

  const instantOrders = useMemo(
    () => validRevenueOrders.filter((o) => o.order_type === 'instant'),
    [validRevenueOrders]
  );
  const instantRevenue = useMemo(
    () => instantOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0),
    [instantOrders]
  );

  const preorderOrders = useMemo(
    () => validRevenueOrders.filter((o) => o.order_type === 'preorder'),
    [validRevenueOrders]
  );
  const preorderRevenue = useMemo(
    () => preorderOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0),
    [preorderOrders]
  );

  const completed = useMemo(
    () => orders.filter((o) => o.order_status === 'picked_up'),
    [orders]
  );
  const active = useMemo(
    () =>
      orders.filter((o) =>
        ['scheduled', 'awaiting_acceptance', 'preparing', 'ready_for_pickup'].includes(
          o.order_status
        )
      ),
    [orders]
  );
  const declined = useMemo(
    () =>
      orders.filter((o) =>
        ['declined', 'cancelled', 'not_collected'].includes(o.order_status)
      ),
    [orders]
  );

  const matchesDateTime = (iso?: string | null) => {
    if (!dateFilter.trim()) return true;
    if (!iso) return false;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return false;
    if (d.toISOString().split('T')[0] !== dateFilter.trim()) return false;
    const hhmm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    if (startTime.trim() && hhmm < startTime.trim()) return false;
    if (endTime.trim() && hhmm > endTime.trim()) return false;
    return true;
  };

  const filteredPastOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return orders.filter((o) => {
      if (!['picked_up', 'declined', 'cancelled', 'not_collected'].includes(o.order_status)) {
        return false;
      }
      if (q) {
        const orderId = (o.order_id || '').toLowerCase();
        const userName = (o.user_name_snapshot || '').toLowerCase();
        const token = (o.token_display || '').toLowerCase();
        if (!orderId.includes(q) && !userName.includes(q) && !token.includes(q)) {
          return false;
        }
      }
      return matchesDateTime(o.created_at);
    });
  }, [orders, searchQuery, dateFilter, startTime, endTime]);

  const filteredPaymentOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return orders.filter((o) => {
      if (q) {
        const orderId = (o.order_id || '').toLowerCase();
        const userName = (o.user_name_snapshot || '').toLowerCase();
        const token = (o.token_display || '').toLowerCase();
        if (!orderId.includes(q) && !userName.includes(q) && !token.includes(q)) {
          return false;
        }
      }
      return matchesDateTime(o.cash_received_at || o.created_at);
    });
  }, [orders, searchQuery, dateFilter, startTime, endTime]);

  const renderOrderRow = (ord: Order) => {
    const isCashPending = ord.payment_status === 'CASH_PENDING';
    const shortId = (ord.order_id || 'UNKNOWN').slice(-6).toUpperCase();
    const orderTypeLabel = (ord.order_type || 'instant').toUpperCase();
    const statusLabel = (ord.order_status || 'unknown').replace(/_/g, ' ').toUpperCase();
    const tokenLabel = ord.token_display || shortId;
    const customerLabel = ord.user_name_snapshot || 'Customer';
    const timeLabel = ord.created_at ? new Date(ord.created_at).toLocaleString() : 'Unknown time';

    return (
      <View key={ord.order_id} style={styles.recordCard}>
        <View style={styles.recordTopRow}>
          <Text style={styles.recordTitle}>
            Token #{tokenLabel} · {customerLabel}
          </Text>
          <Text style={styles.recordAmount}>₹{Number(ord.total) || 0}</Text>
        </View>
        <Text style={styles.recordMeta}>
          Order #{shortId} • {orderTypeLabel} • {statusLabel}
        </Text>
        <View style={styles.recordBottomRow}>
          <Text style={styles.recordTime}>{timeLabel}</Text>
          <View
            style={[
              styles.statusBadge,
              isCashPending ? styles.badgePending : styles.badgePaid,
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                isCashPending ? styles.badgeTextPending : styles.badgeTextPaid,
              ]}
            >
              {ord.payment_method === 'online_demo'
                ? 'ONLINE PAID'
                : isCashPending
                  ? 'CASH PENDING'
                  : 'CASH PAID'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const drilldownHeader = useMemo(() => {
    if (selectedDrilldown === 'online') {
      return {
        title: 'Online Payments Breakdown',
        subtitle: `₹${onlineRevenue} across ${onlineOrders.length} online orders`,
      };
    }
    if (selectedDrilldown === 'cash') {
      return {
        title: 'Cash Payments History',
        subtitle: `₹${cashRevenue} across ${cashOrders.length} cash orders`,
      };
    }
    if (selectedDrilldown === 'instant') {
      return {
        title: 'Total Instant Orders',
        subtitle: `₹${instantRevenue} across ${instantOrders.length} instant orders`,
      };
    }
    if (selectedDrilldown === 'preorder') {
      return {
        title: 'Total Preorders',
        subtitle: `₹${preorderRevenue} across ${preorderOrders.length} preorders`,
      };
    }
    return { title: '', subtitle: '' };
  }, [
    selectedDrilldown,
    onlineRevenue,
    onlineOrders.length,
    cashRevenue,
    cashOrders.length,
    instantRevenue,
    instantOrders.length,
    preorderRevenue,
    preorderOrders.length,
  ]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Canteen Revenue & Reports</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.sectionTabs}>
        {[
          { id: 'summary', label: 'Revenue' },
          { id: 'orders', label: 'Order History' },
          { id: 'payments', label: 'Payments' },
        ].map((t) => (
          <TouchableOpacity
            key={t.id}
            style={[styles.sectionTab, activeTab === t.id && styles.sectionTabActive]}
            onPress={() => setActiveTab(t.id as 'summary' | 'orders' | 'payments')}
          >
            <Text style={[styles.sectionTabText, activeTab === t.id && styles.sectionTabTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'summary' && (
          <>
            <View style={styles.revenueCard}>
              <Text style={styles.revenueTitle}>OVERALL CANTEEN REVENUE (ALL ORDERS)</Text>
              <Text style={styles.revenueValue}>₹{overallRevenue}</Text>
              <Text style={styles.revenueSub}>
                Cash + Online • Instant + Preorders ({validRevenueOrders.length} valid orders)
              </Text>
            </View>

            <Text style={styles.sectionHeading}>Payment & Order Breakdown (Tap to View List)</Text>

            <View style={styles.breakdownGrid}>
              <TouchableOpacity
                style={[styles.breakdownCard, styles.cardOnline]}
                activeOpacity={0.8}
                onPress={() => setSelectedDrilldown('online')}
              >
                <View style={styles.breakdownTopRow}>
                  <View style={[styles.breakdownIconBox, styles.iconOnlineBg]}>
                    <CreditCard size={16} color="#0284C7" />
                  </View>
                  <ChevronRight size={16} color={colors.textMuted} />
                </View>
                <Text style={styles.breakdownLabel}>Online Payments</Text>
                <Text style={styles.breakdownPrimaryVal}>₹{onlineRevenue}</Text>
                <Text style={styles.breakdownSubVal}>
                  {onlineInstantOrders.length} Instant • {onlinePreorders.length} Preorder
                </Text>
                <Text style={styles.tapHintText}>View Instant & Preorders</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.breakdownCard, styles.cardCash]}
                activeOpacity={0.8}
                onPress={() => setSelectedDrilldown('cash')}
              >
                <View style={styles.breakdownTopRow}>
                  <View style={[styles.breakdownIconBox, styles.iconCashBg]}>
                    <Banknote size={16} color="#D97706" />
                  </View>
                  <ChevronRight size={16} color={colors.textMuted} />
                </View>
                <Text style={styles.breakdownLabel}>Cash Payments</Text>
                <Text style={styles.breakdownPrimaryVal}>₹{cashRevenue}</Text>
                <Text style={styles.breakdownSubVal}>{cashOrders.length} Cash Orders</Text>
                <Text style={styles.tapHintText}>View Cash History</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.breakdownCard, styles.cardInstant]}
                activeOpacity={0.8}
                onPress={() => setSelectedDrilldown('instant')}
              >
                <View style={styles.breakdownTopRow}>
                  <View style={[styles.breakdownIconBox, styles.iconInstantBg]}>
                    <Zap size={16} color={colors.primaryDark} />
                  </View>
                  <ChevronRight size={16} color={colors.textMuted} />
                </View>
                <Text style={styles.breakdownLabel}>Total Instant Orders</Text>
                <Text style={styles.breakdownPrimaryVal}>{instantOrders.length}</Text>
                <Text style={styles.breakdownSubVal}>Total ₹{instantRevenue}</Text>
                <Text style={styles.tapHintText}>View Instant Orders</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.breakdownCard, styles.cardPreorder]}
                activeOpacity={0.8}
                onPress={() => setSelectedDrilldown('preorder')}
              >
                <View style={styles.breakdownTopRow}>
                  <View style={[styles.breakdownIconBox, styles.iconPreorderBg]}>
                    <Clock size={16} color="#7C3AED" />
                  </View>
                  <ChevronRight size={16} color={colors.textMuted} />
                </View>
                <Text style={styles.breakdownLabel}>Total Preorders</Text>
                <Text style={styles.breakdownPrimaryVal}>{preorderOrders.length}</Text>
                <Text style={styles.breakdownSubVal}>Total ₹{preorderRevenue}</Text>
                <Text style={styles.tapHintText}>View Preorders</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionHeading}>Order Fulfillment Summary</Text>
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
                placeholder="Search by Token, Order ID or Name..."
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

            {activeTab === 'orders' &&
              (filteredPastOrders.length === 0 ? (
                <Text style={styles.emptyText}>No past orders found for this canteen.</Text>
              ) : (
                filteredPastOrders.map((ord) => renderOrderRow(ord))
              ))}

            {activeTab === 'payments' &&
              (filteredPaymentOrders.length === 0 ? (
                <Text style={styles.emptyText}>No payment records found for this canteen.</Text>
              ) : (
                filteredPaymentOrders.map((ord) => renderOrderRow(ord))
              ))}
          </>
        )}
      </ScrollView>

      {/* Breakdown Drilldown Modal */}
      <Modal
        visible={selectedDrilldown !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedDrilldown(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailModalContainer}>
            <View style={styles.detailModalHeader}>
              <View>
                <Text style={styles.detailModalTitle}>{drilldownHeader.title}</Text>
                <Text style={styles.detailModalSub}>{drilldownHeader.subtitle}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedDrilldown(null)}>
                <X size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.detailModalBody} showsVerticalScrollIndicator={false}>
              {selectedDrilldown === 'online' && (
                <>
                  <View style={styles.subListHeader}>
                    <Text style={styles.subListHeaderText}>
                      ONLINE INSTANT ORDERS ({onlineInstantOrders.length})
                    </Text>
                    <Text style={styles.subListTotalText}>₹{onlineInstantRevenue}</Text>
                  </View>
                  {onlineInstantOrders.length === 0 ? (
                    <Text style={styles.emptyText}>No online instant orders yet.</Text>
                  ) : (
                    onlineInstantOrders.map((ord) => renderOrderRow(ord))
                  )}

                  <View style={styles.subListHeader}>
                    <Text style={styles.subListHeaderText}>
                      ONLINE PREORDERS ({onlinePreorders.length})
                    </Text>
                    <Text style={styles.subListTotalText}>₹{onlinePreorderRevenue}</Text>
                  </View>
                  {onlinePreorders.length === 0 ? (
                    <Text style={styles.emptyText}>No online preorders yet.</Text>
                  ) : (
                    onlinePreorders.map((ord) => renderOrderRow(ord))
                  )}
                </>
              )}

              {selectedDrilldown === 'cash' &&
                (cashOrders.length === 0 ? (
                  <Text style={styles.emptyText}>No cash orders recorded yet.</Text>
                ) : (
                  cashOrders.map((ord) => renderOrderRow(ord))
                ))}

              {selectedDrilldown === 'instant' &&
                (instantOrders.length === 0 ? (
                  <Text style={styles.emptyText}>No instant orders recorded yet.</Text>
                ) : (
                  instantOrders.map((ord) => renderOrderRow(ord))
                ))}

              {selectedDrilldown === 'preorder' &&
                (preorderOrders.length === 0 ? (
                  <Text style={styles.emptyText}>No preorders recorded yet.</Text>
                ) : (
                  preorderOrders.map((ord) => renderOrderRow(ord))
                ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Date & Time Filter Modal */}
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
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. 2026-11-27"
              placeholderTextColor={colors.textMuted}
              value={dateFilter}
              onChangeText={setDateFilter}
            />
            <Text style={styles.inputLabel}>From Time (HH:MM, optional)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. 09:00"
              placeholderTextColor={colors.textMuted}
              value={startTime}
              onChangeText={setStartTime}
            />
            <Text style={styles.inputLabel}>To Time (HH:MM, optional)</Text>
            <TextInput
              style={styles.modalInput}
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
                  setDateModalVisible(false);
                  showToast('Date filter cleared.', 'info');
                }}
              >
                <Text style={styles.resetBtnText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyBtn}
                onPress={() => {
                  setDateModalVisible(false);
                  if (dateFilter.trim()) {
                    showToast(`Filtered records for ${dateFilter.trim()}.`, 'success');
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