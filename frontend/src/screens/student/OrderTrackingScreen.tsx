import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert, 
  SafeAreaView 
} from 'react-native';
import { 
  ArrowLeft, 
  CheckCircle, 
  Clock, 
  MapPin, 
  AlertCircle, 
  Store, 
  Timer, 
  Banknote, 
  CreditCard 
} from 'lucide-react-native';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';
import { colors, typography, spacing, borderRadius, shadows } from '../../config/theme';
import { updateOrderStatusInFirestore } from '../../services/firestoreService';
import { useAuth } from '../../context/AuthContext';
import type { Order, OrderStatus } from '../../models/types';

interface OrderTrackingScreenProps {
  route?: any;
  navigation?: any;
}

export const OrderTrackingScreen: React.FC<OrderTrackingScreenProps> = ({ route, navigation }) => {
  const { user } = useAuth();
  const initialOrder: Order = route?.params?.order || {
    order_id: 'ord_sample_demo',
    token_display: 'A1',
    daily_token_number: 1,
    token_prefix: 'A',
    token_date: '2026-11-03',
    canteen_id: 'canteen_main_1',
    canteen_name_snapshot: 'Main Building Canteen 1',
    user_id: user?.user_id || 'student',
    user_name_snapshot: user?.name || 'Aarav Patel',
    user_role_snapshot: 'student',
    order_type: 'instant',
    items_snapshot: [],
    subtotal: 0,
    total: 0,
    payment_method: 'online_demo',
    payment_status: 'PAID_ONLINE_DEMO',
    order_status: 'awaiting_acceptance',
    pickup_time: 'Immediate',
    pickup_date: '2026-11-03',
    policy_version: '1.0.0',
    policy_accepted_at: null,
    ready_at: null,
    collection_deadline: null,
    collected_time: null,
    collected_status: 'pending',
    cash_received_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    idempotency_key: 'sample',
  };
  const [order, setOrder] = useState<Order>(initialOrder);

  // Real-time Firestore sync
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'orders', order.order_id),
      (docSnap) => {
        if (docSnap.exists()) {
          setOrder(docSnap.data() as Order);
        }
      },
      (err) => {
        console.warn('Realtime tracking fallback:', err.message);
      }
    );

    return () => unsub();
  }, [order.order_id]);

  // 12-Minute Countdown Timer for Ready Orders
  const [timeLeftStr, setTimeLeftStr] = useState<string>('');
  const [isExpired, setIsExpired] = useState<boolean>(false);

  useEffect(() => {
    if (order.order_status !== 'ready_for_pickup' || !order.collection_deadline) {
      return;
    }

    const updateTimer = () => {
      const deadline = new Date(order.collection_deadline!).getTime();
      const diffMs = deadline - Date.now();

      if (diffMs <= 0) {
        setTimeLeftStr('Window Expired (12m)');
        setIsExpired(true);
      } else {
        const totalSecs = Math.floor(diffMs / 1000);
        const mins = Math.floor(totalSecs / 60);
        const secs = totalSecs % 60;
        setTimeLeftStr(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')} min`);
        setIsExpired(false);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [order.order_status, order.collection_deadline]);

  const handleCancelOrder = async () => {
    if (order.order_status !== 'awaiting_acceptance') {
      Alert.alert('Cannot Cancel', 'The canteen has already started preparing your food.');
      return;
    }

    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await updateOrderStatusInFirestore(
                order.order_id,
                'cancelled',
                { id: user?.user_id || 'student', name: user?.name || 'Student', role: 'student' }
              );
              Alert.alert('Order Cancelled', 'Your order was cancelled successfully.');
            } catch (e: any) {
              Alert.alert('Cancellation Error', e.message || 'Could not cancel order.');
            }
          },
        },
      ]
    );
  };

  const steps: Array<{ status: OrderStatus; label: string; desc: string }> = [
    { status: 'awaiting_acceptance', label: 'In Queue', desc: 'Order received by canteen' },
    { status: 'preparing', label: 'Preparing Food', desc: 'Kitchen is preparing your items' },
    { status: 'ready_for_pickup', label: 'Ready for Pickup', desc: 'Proceed to canteen counter' },
    { status: 'picked_up', label: 'Picked Up', desc: 'Order completed & verified' },
  ];

  const getStepIndex = (status: OrderStatus) => {
    switch (status) {
      case 'awaiting_acceptance': return 0;
      case 'preparing': return 1;
      case 'ready_for_pickup': return 2;
      case 'picked_up': return 3;
      default: return -1;
    }
  };

  const currentStep = getStepIndex(order.order_status);
  const tokenDisplay = order.token_display || `${order.token_prefix || 'A'}${order.daily_token_number}`;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={() => navigation.navigate('StudentHome')} style={styles.backButton}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Tracking</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Prominent Daily Token Display */}
        <View style={styles.tokenCard}>
          <Text style={styles.tokenCardSubtitle}>YOUR DIGITAL PICKUP TOKEN</Text>
          <View style={styles.tokenHeroRow}>
            <Text style={styles.tokenHeroNumber}>{tokenDisplay}</Text>
          </View>
          <Text style={styles.tokenDateText}>
            Date: {order.token_date} • Asia/Kolkata
          </Text>
          <Text style={styles.tokenNotice}>
            Show this token code at the counter when collecting your meal.
          </Text>
        </View>

        {/* Payment Status Card */}
        <View style={styles.paymentInfoCard}>
          {order.payment_status === 'PAID_ONLINE_DEMO' ? (
            <View style={styles.paymentRow}>
              <CreditCard size={18} color={colors.accentGreen} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.paymentTitle, { color: colors.accentGreen }]}>
                  Payment Settled: Paid Online (Demo)
                </Text>
                <Text style={styles.paymentDesc}>Simulated cashless transaction for Review 1</Text>
              </View>
            </View>
          ) : order.payment_status === 'CASH_RECEIVED' ? (
            <View style={styles.paymentRow}>
              <Banknote size={18} color={colors.accentGreen} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.paymentTitle, { color: colors.accentGreen }]}>
                  Cash Payment Confirmed (₹{order.total})
                </Text>
                <Text style={styles.paymentDesc}>Cash was collected by the counter operator</Text>
              </View>
            </View>
          ) : (
            <View style={styles.paymentRow}>
              <Banknote size={18} color="#D97706" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.paymentTitle, { color: '#D97706' }]}>
                  Cash Due at Counter: ₹{order.total}
                </Text>
                <Text style={styles.paymentDesc}>
                  Please pay exact cash to the operator before food handover.
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* 12-Minute Countdown Banner if Ready */}
        {order.order_status === 'ready_for_pickup' && (
          <View style={[styles.timerBanner, isExpired && styles.timerExpiredBanner]}>
            <Timer size={18} color={isExpired ? colors.accentRed : '#B45309'} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.timerTitle, isExpired && styles.timerExpiredText]}>
                Pickup Countdown: {timeLeftStr}
              </Text>
              <Text style={styles.timerSub}>
                {isExpired 
                  ? 'Pickup window passed. Please speak with the counter operator.'
                  : 'Your food is hot & ready! Arrive at the counter within 12 minutes.'}
              </Text>
            </View>
          </View>
        )}

        {/* Canteen Location Info */}
        <View style={styles.canteenCard}>
          <View style={styles.canteenIconCircle}>
            <Store size={20} color={colors.primary} />
          </View>
          <View style={{ marginLeft: spacing.md, flex: 1 }}>
            <Text style={styles.canteenName}>{order.canteen_name_snapshot}</Text>
            <View style={styles.canteenMetaRow}>
              <Clock size={12} color={colors.textSecondary} />
              <Text style={styles.canteenMetaText}>
                {order.order_type === 'preorder' ? `Preorder for ${order.pickup_time}` : 'Instant Order'}
              </Text>
            </View>
          </View>
        </View>

        {/* Order Status Timeline */}
        <View style={styles.timelineCard}>
          <Text style={styles.timelineTitle}>Live Order Progress</Text>

          {order.order_status === 'declined' ? (
            <View style={styles.specialStatusBox}>
              <AlertCircle size={22} color={colors.accentRed} />
              <Text style={styles.declinedText}>Order was declined by the canteen.</Text>
            </View>
          ) : order.order_status === 'cancelled' ? (
            <View style={styles.specialStatusBox}>
              <AlertCircle size={22} color={colors.textMuted} />
              <Text style={styles.cancelledText}>Order was cancelled.</Text>
            </View>
          ) : order.order_status === 'not_collected' ? (
            <View style={styles.specialStatusBox}>
              <AlertCircle size={22} color={colors.accentRed} />
              <Text style={styles.declinedText}>Order expired (not collected within 12 minutes).</Text>
            </View>
          ) : (
            <View style={styles.stepsList}>
              {steps.map((step, idx) => {
                const isPassed = currentStep > idx;
                const isCurrent = currentStep === idx;

                return (
                  <View key={step.status} style={styles.stepRow}>
                    <View style={styles.stepIndicatorCol}>
                      <View 
                        style={[
                          styles.stepDot, 
                          isPassed && styles.stepDotPassed,
                          isCurrent && styles.stepDotCurrent
                        ]}
                      >
                        {isPassed ? (
                          <CheckCircle size={14} color="#FFFFFF" />
                        ) : (
                          <View style={[styles.innerMiniDot, isCurrent && styles.innerMiniDotActive]} />
                        )}
                      </View>
                      {idx < steps.length - 1 && (
                        <View 
                          style={[
                            styles.stepLine, 
                            isPassed && styles.stepLinePassed
                          ]} 
                        />
                      )}
                    </View>

                    <View style={styles.stepContent}>
                      <Text style={[styles.stepLabel, isCurrent && styles.stepLabelActive]}>
                        {step.label}
                      </Text>
                      <Text style={styles.stepDesc}>{step.desc}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Order Items Snapshot */}
        <View style={styles.itemsCard}>
          <Text style={styles.itemsTitle}>Items Ordered</Text>
          {order.items_snapshot.map((item, idx) => (
            <View key={idx} style={styles.itemRow}>
              <Text style={styles.itemQty}>{item.quantity}x</Text>
              <Text style={styles.itemName}>{item.item_name}</Text>
              <Text style={styles.itemPrice}>₹{item.price * item.quantity}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Paid / Due</Text>
            <Text style={styles.totalValue}>₹{order.total}</Text>
          </View>
        </View>

        {/* Cancel Button (allowed ONLY in awaiting_acceptance) */}
        {order.order_status === 'awaiting_acceptance' && (
          <TouchableOpacity 
            style={styles.cancelBtn} 
            onPress={handleCancelOrder}
            activeOpacity={0.8}
          >
            <Text style={styles.cancelBtnText}>Cancel Order</Text>
          </TouchableOpacity>
        )}

        {order.order_status === 'preparing' && (
          <View style={styles.lockedNotice}>
            <Text style={styles.lockedNoticeText}>
              Food is currently being prepared in the kitchen. Per university canteen policy, cancellations are no longer permitted.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.surface,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: typography.fontWeights.heavy,
    color: colors.textPrimary,
  },
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSoft,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 40,
    gap: spacing.md,
  },
  tokenCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    ...shadows.md,
  },
  tokenCardSubtitle: {
    fontSize: 11,
    fontWeight: typography.fontWeights.heavy,
    color: colors.primary,
    letterSpacing: 1,
  },
  tokenHeroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  tokenHeroNumber: {
    fontSize: 44,
    fontWeight: typography.fontWeights.heavy,
    color: colors.primaryDark,
    letterSpacing: 1,
  },
  tokenDateText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  tokenNotice: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  paymentInfoCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  paymentTitle: {
    fontSize: 13,
    fontWeight: typography.fontWeights.bold,
  },
  paymentDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  timerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#FDE68A',
    gap: spacing.sm,
  },
  timerExpiredBanner: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  timerTitle: {
    fontSize: 14,
    fontWeight: typography.fontWeights.heavy,
    color: '#92400E',
  },
  timerExpiredText: {
    color: colors.accentRed,
  },
  timerSub: {
    fontSize: 11,
    color: '#78350F',
    marginTop: 2,
  },
  canteenCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  canteenIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  canteenName: {
    fontSize: 14,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  canteenMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  canteenMetaText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  timelineCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  timelineTitle: {
    fontSize: 13,
    fontWeight: typography.fontWeights.heavy,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  specialStatusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.backgroundSoft,
    borderRadius: borderRadius.sm,
  },
  declinedText: {
    fontSize: 13,
    color: colors.accentRed,
    fontWeight: '600',
  },
  cancelledText: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '600',
  },
  stepsList: {
    gap: 0,
  },
  stepRow: {
    flexDirection: 'row',
    minHeight: 52,
  },
  stepIndicatorCol: {
    alignItems: 'center',
    width: 28,
  },
  stepDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  stepDotPassed: {
    backgroundColor: colors.accentGreen,
  },
  stepDotCurrent: {
    backgroundColor: colors.primary,
  },
  innerMiniDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surface,
  },
  innerMiniDotActive: {
    backgroundColor: '#FFFFFF',
  },
  stepLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 2,
  },
  stepLinePassed: {
    backgroundColor: colors.accentGreen,
  },
  stepContent: {
    flex: 1,
    paddingLeft: spacing.sm,
    paddingBottom: spacing.sm,
  },
  stepLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  stepLabelActive: {
    color: colors.primaryDark,
    fontWeight: typography.fontWeights.heavy,
  },
  stepDesc: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  itemsCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  itemsTitle: {
    fontSize: 13,
    fontWeight: typography.fontWeights.heavy,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  itemQty: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.primary,
    width: 26,
  },
  itemName: {
    fontSize: 12,
    color: colors.textPrimary,
    flex: 1,
  },
  itemPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.sm,
    marginTop: spacing.sm,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  totalValue: {
    fontSize: 15,
    fontWeight: typography.fontWeights.heavy,
    color: colors.primaryDark,
  },
  cancelBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingVertical: 12,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: colors.accentRed,
    fontWeight: typography.fontWeights.bold,
    fontSize: 13,
  },
  lockedNotice: {
    backgroundColor: '#FFFBEB',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  lockedNoticeText: {
    fontSize: 11,
    color: '#92400E',
    textAlign: 'center',
    lineHeight: 15,
  },
});
