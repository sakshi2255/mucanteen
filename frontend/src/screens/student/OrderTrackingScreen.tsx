import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ArrowLeft, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Store, 
  Timer, 
  Banknote, 
  CreditCard 
} from 'lucide-react-native';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';
import { colors } from '../../config/theme';
import { updateOrderStatusInFirestore } from '../../services/firestoreService';
import { useAuth } from '../../context/AuthContext';
import { styles } from '../../styles/student/OrderTrackingStyles';
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
    token_date: new Date().toISOString().split('T')[0],
    canteen_id: 'canteen_main_1',
    canteen_name_snapshot: 'Main Building Canteen 1',
    user_id: user?.user_id || 'student',
    user_name_snapshot: user?.name || 'Student',
    user_role_snapshot: 'student',
    order_type: 'instant',
    items_snapshot: [],
    subtotal: 0,
    total: 0,
    payment_method: 'online_demo',
    payment_status: 'PAID_ONLINE_DEMO',
    order_status: 'awaiting_acceptance',
    pickup_time: 'Immediate',
    pickup_date: new Date().toISOString().split('T')[0],
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
  const [timeLeftStr, setTimeLeftStr] = useState<string>('');
  const [isExpired, setIsExpired] = useState<boolean>(false);

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

  useEffect(() => {
    if (order.order_status !== 'ready_for_pickup' || !order.collection_deadline) return;

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
    { status: 'picked_up', label: 'Picked Up', desc: 'Order completed and collected' },
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
      <View style={styles.topHeader}>
        <TouchableOpacity 
          onPress={() => {
            if (navigation.canGoBack()) navigation.goBack();
            else navigation.navigate('StudentRoot', { screen: 'StudentHome' });
          }} 
          style={styles.backButton}
        >
          <ArrowLeft size={26} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Tracking</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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

        <View style={styles.paymentInfoCard}>
          {order.payment_status === 'PAID_ONLINE_DEMO' ? (
            <View style={styles.paymentRow}>
              <CreditCard size={22} color={colors.accentGreen} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.paymentTitle, { color: colors.accentGreen }]}>Payment Settled: Paid Online</Text>
                <Text style={styles.paymentDesc}>Campus cashless transaction completed</Text>
              </View>
            </View>
          ) : order.payment_status === 'CASH_RECEIVED' ? (
            <View style={styles.paymentRow}>
              <Banknote size={22} color={colors.accentGreen} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.paymentTitle, { color: colors.accentGreen }]}>Cash Payment Confirmed (₹{order.total})</Text>
                <Text style={styles.paymentDesc}>Cash was collected by the counter operator</Text>
              </View>
            </View>
          ) : (
            <View style={styles.paymentRow}>
              <Banknote size={22} color="#D97706" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.paymentTitle, { color: '#D97706' }]}>Cash Due at Counter: ₹{order.total}</Text>
                <Text style={styles.paymentDesc}>Please pay exact cash to the operator before food handover.</Text>
              </View>
            </View>
          )}
        </View>

        {order.order_status === 'ready_for_pickup' && (
          <View style={[styles.timerBanner, isExpired && styles.timerExpiredBanner]}>
            <Timer size={22} color={isExpired ? colors.accentRed : '#B45309'} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.timerTitle, isExpired && styles.timerExpiredText]}>Pickup Countdown: {timeLeftStr}</Text>
              <Text style={styles.timerSub}>
                {isExpired ? 'Pickup window passed. Please speak with the counter operator.' : 'Your food is hot & ready! Arrive at the counter within 12 minutes.'}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.canteenCard}>
          <View style={styles.canteenIconCircle}>
            <Store size={22} color={colors.primary} />
          </View>
          <View style={{ marginLeft: 16, flex: 1 }}>
            <Text style={styles.canteenName}>{order.canteen_name_snapshot}</Text>
            <View style={styles.canteenMetaRow}>
              <Clock size={14} color={colors.textSecondary} />
              <Text style={styles.canteenMetaText}>
                {order.order_type === 'preorder' ? `Preorder for ${order.pickup_time}` : 'Instant Order'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.timelineCard}>
          <Text style={styles.timelineTitle}>Live Order Progress</Text>

          {order.order_status === 'declined' ? (
            <View style={styles.specialStatusBox}>
              <AlertCircle size={26} color={colors.accentRed} />
              <Text style={styles.declinedText}>Order was declined by the canteen.</Text>
            </View>
          ) : order.order_status === 'cancelled' ? (
            <View style={styles.specialStatusBox}>
              <AlertCircle size={26} color={colors.textMuted} />
              <Text style={styles.cancelledText}>Order was cancelled.</Text>
            </View>
          ) : order.order_status === 'not_collected' ? (
            <View style={styles.specialStatusBox}>
              <AlertCircle size={26} color={colors.accentRed} />
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
                      <View style={[styles.stepDot, isPassed && styles.stepDotPassed, isCurrent && styles.stepDotCurrent]}>
                        {isPassed ? (
                          <CheckCircle size={16} color="#FFFFFF" />
                        ) : (
                          <View style={[styles.innerMiniDot, isCurrent && styles.innerMiniDotActive]} />
                        )}
                      </View>
                      {idx < steps.length - 1 && <View style={[styles.stepLine, isPassed && styles.stepLinePassed]} />}
                    </View>

                    <View style={styles.stepContent}>
                      <Text style={[styles.stepLabel, isCurrent && styles.stepLabelActive]}>{step.label}</Text>
                      <Text style={styles.stepDesc}>{step.desc}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.itemsCard}>
          <Text style={styles.itemsTitle}>Items Ordered</Text>
          {(order.items_snapshot || []).map((item, idx) => (
            <View key={idx} style={styles.itemRow}>
              <Text style={styles.itemQty}>{item.quantity}x</Text>
              <Text style={styles.itemName}>{item.item_name}</Text>
              <Text style={styles.itemPrice}>₹{(item.price || 0) * (item.quantity || 1)}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Paid / Due</Text>
            <Text style={styles.totalValue}>₹{order.total}</Text>
          </View>
        </View>

        {order.order_status === 'awaiting_acceptance' && (
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelOrder} activeOpacity={0.8}>
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