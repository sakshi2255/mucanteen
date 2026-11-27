import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Trash2,
  Plus,
  Minus,
  Clock,
  Zap,
  ShoppingBag,
  Check,
  CreditCard,
  Banknote,
  Calendar,
} from 'lucide-react-native';
import { colors } from '../../config/theme';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { createOrderInFirestore, listenCanteens } from '../../services/firestoreService';
import { getISTDateString } from '../../services/tokenService';
import { styles } from '../../styles/student/CartStyles';
import type { Canteen } from '../../models/types';

interface CartScreenProps {
  navigation: any;
}

const PREORDER_SLOTS = [
  '10:30 AM (Morning Recess)',
  '12:45 PM (Lunch Break)',
  '02:15 PM (Afternoon Break)',
  '04:30 PM (Evening Tea)',
];

function parseScheduledIsoForToday(timeStr: string): string | null {
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridiem = match[3]?.toUpperCase();
  if (meridiem === 'PM' && hours < 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

  const target = new Date();
  target.setHours(hours, minutes, 0, 0);
  return target.toISOString();
}

export const CartScreen: React.FC<CartScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const {
    items,
    activeCanteenId,
    activeCanteenName,
    subtotal,
    total,
    orderType,
    setOrderType,
    pickupTime,
    setPickupTime,
    paymentMethod,
    setPaymentMethod,
    policyAccepted,
    addToCart,
    removeFromCart,
    clearCart,
  } = useCart();

  const [canteens, setCanteens] = useState<Canteen[]>([]);
  const [useCustomTime, setUseCustomTime] = useState(false);
  const [customTimeInput, setCustomTimeInput] = useState('');
  const [loading, setLoading] = useState(false);
  const todayIST = getISTDateString();

  useEffect(() => {
    const unsub = listenCanteens((list) => setCanteens(list));
    return unsub;
  }, []);

  const activeCanteen = canteens.find((c) => c.canteen_id === activeCanteenId) || canteens[0];

  const handleClearCart = () => {
    clearCart();
    showToast('Your cart has been cleared.', 'info', 'Cart Cleared');
  };

  const handleProceed = async () => {
    if (items.length === 0 || !activeCanteen) return;
    if (!user) {
      showToast('Please sign in to place an order.', 'error', 'Authentication Required');
      return;
    }
    if (!activeCanteen.is_open) {
      showToast(`${activeCanteen.name} is currently closed.`, 'error', 'Canteen Closed');
      return;
    }
    if (orderType === 'preorder' && !policyAccepted) {
      navigation.navigate('PreorderPolicy');
      return;
    }

    const effectivePickupTime =
      orderType === 'preorder'
        ? useCustomTime
          ? customTimeInput.trim()
          : pickupTime
        : 'Immediate';

    let scheduledReleaseAt: string | null = null;
    if (orderType === 'preorder') {
      scheduledReleaseAt = parseScheduledIsoForToday(effectivePickupTime);
      if (!scheduledReleaseAt) {
        showToast(
          'Please enter a valid time such as "01:30 PM" or "13:30".',
          'error',
          'Invalid Time'
        );
        return;
      }
      if (new Date(scheduledReleaseAt).getTime() <= Date.now()) {
        showToast('Please select a future time for your pre-order.', 'error', 'Past Time Selected');
        return;
      }
    }

    setLoading(true);
    try {
      const orderItems = items.map((i) => ({
        menu_item_id: i.item.menu_item_id,
        item_name: i.item.item_name,
        price: i.item.price,
        quantity: i.quantity,
        subtotal: i.item.price * i.quantity,
        is_veg: i.item.is_veg,
        placeholder_key: i.item.placeholder_key,
      }));

      const created = await createOrderInFirestore({
        user,
        canteen: activeCanteen,
        items: orderItems,
        subtotal,
        total,
        order_type: orderType,
        pickup_time: effectivePickupTime,
        scheduled_release_at: scheduledReleaseAt,
        payment_method: paymentMethod,
        policy_version: '1.0.0',
        policy_accepted: orderType === 'preorder',
      });

      clearCart();
      showToast(
        `Order #${created.token_display} placed at ${activeCanteen.name}.`,
        'success',
        'Order Placed'
      );
      navigation.navigate('OrderTracking', { order: created });
    } catch (e: any) {
      showToast(e?.message || 'Could not place order. Please try again.', 'error', 'Checkout Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={26} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cart Summary</Text>
        {items.length > 0 ? (
          <TouchableOpacity onPress={handleClearCart} style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>CLEAR</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ShoppingBag size={80} color={colors.borderLight} />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>
            Good food is always cooking! Go ahead and order some delicious items.
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => navigation.navigate('StudentHome')}
          >
            <Text style={styles.browseButtonText}>Browse Canteens</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {activeCanteen && (
            <View style={styles.canteenBanner}>
              <Text style={styles.canteenBannerTitle}>
                {activeCanteenName || activeCanteen.name}
              </Text>
              <Text style={styles.canteenBannerSubtitle}>
                Floor {activeCanteen.floor === 0 ? 'Ground' : activeCanteen.floor} • Token Prefix [
                {activeCanteen.token_prefix || 'A'}]
              </Text>
            </View>
          )}

          <View style={styles.itemsCard}>
            {items.map(({ item, quantity }) => (
              <View key={item.menu_item_id} style={styles.cartItemRow}>
                <View style={styles.itemInfo}>
                  <View
                    style={[
                      styles.vegIndicatorDot,
                      item.is_veg ? styles.vegDotGreen : styles.vegDotRed,
                    ]}
                  />
                  <View>
                    <Text style={styles.itemName}>{item.item_name}</Text>
                    <Text style={styles.itemPrice}>₹{item.price}</Text>
                  </View>
                </View>

                <View style={styles.stepperSubtotalGroup}>
                  <View style={styles.stepper}>
                    <TouchableOpacity onPress={() => removeFromCart(item)} style={styles.stepBtn}>
                      {quantity === 1 ? (
                        <Trash2 size={15} color={colors.accentRed} />
                      ) : (
                        <Minus size={15} color={colors.primaryDark} />
                      )}
                    </TouchableOpacity>
                    <Text style={styles.stepQty}>{quantity}</Text>
                    <TouchableOpacity onPress={() => addToCart(item)} style={styles.stepBtn}>
                      <Plus size={15} color={colors.primaryDark} />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.itemSubtotal}>₹{item.price * quantity}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeading}>Ordering Mode</Text>
            <View style={styles.typeToggleRow}>
              <TouchableOpacity
                style={[styles.typeButton, orderType === 'instant' && styles.activeTypeButton]}
                onPress={() => setOrderType('instant')}
                activeOpacity={0.9}
              >
                <Zap
                  size={18}
                  color={orderType === 'instant' ? '#FFFFFF' : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.typeButtonText,
                    orderType === 'instant' && styles.activeTypeButtonText,
                  ]}
                >
                  Instant
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeButton, orderType === 'preorder' && styles.activeTypeButton]}
                onPress={() => setOrderType('preorder')}
                activeOpacity={0.9}
              >
                <Clock
                  size={18}
                  color={orderType === 'preorder' ? '#FFFFFF' : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.typeButtonText,
                    orderType === 'preorder' && styles.activeTypeButtonText,
                  ]}
                >
                  Preorder
                </Text>
              </TouchableOpacity>
            </View>

            {orderType === 'preorder' && (
              <View style={styles.slotsContainer}>
                <View style={styles.sameDayNotice}>
                  <Calendar size={14} color={colors.primaryDark} />
                  <Text style={styles.sameDayText}>Scheduling for Today ({todayIST})</Text>
                </View>
                <Text style={styles.slotHeading}>Select Break Slot or Custom Time:</Text>
                {PREORDER_SLOTS.map((slot) => {
                  const isSelected = !useCustomTime && pickupTime === slot;
                  return (
                    <TouchableOpacity
                      key={slot}
                      style={[styles.slotItem, isSelected && styles.activeSlotItem]}
                      onPress={() => {
                        setUseCustomTime(false);
                        setPickupTime(slot);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.slotText, isSelected && styles.activeSlotText]}>
                        {slot}
                      </Text>
                      {isSelected && <Check size={18} color={colors.primary} />}
                    </TouchableOpacity>
                  );
                })}

                <TouchableOpacity
                  style={[styles.slotItem, useCustomTime && styles.activeSlotItem]}
                  onPress={() => setUseCustomTime(true)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.slotText, useCustomTime && styles.activeSlotText]}>
                    Custom Time
                  </Text>
                  {useCustomTime && <Check size={18} color={colors.primary} />}
                </TouchableOpacity>

                {useCustomTime && (
                  <>
                    <TextInput
                      style={styles.customTimeInput}
                      placeholder="Enter time (e.g. 01:30 PM or 13:30)"
                      placeholderTextColor={colors.textMuted}
                      value={customTimeInput}
                      onChangeText={setCustomTimeInput}
                    />
                    <Text style={styles.customTimeHint}>
                      Your order will remain Scheduled and automatically release to the canteen at
                      this exact time.
                    </Text>
                  </>
                )}
              </View>
            )}
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeading}>Payment Method</Text>
            <TouchableOpacity
              style={[
                styles.paymentCard,
                paymentMethod === 'online_demo' && styles.activePaymentCard,
              ]}
              onPress={() => setPaymentMethod('online_demo')}
            >
              <CreditCard
                size={22}
                color={paymentMethod === 'online_demo' ? colors.primary : colors.textSecondary}
              />
              <View style={styles.paymentTextCol}>
                <Text
                  style={[
                    styles.paymentTitle,
                    paymentMethod === 'online_demo' && styles.activePaymentTitle,
                  ]}
                >
                  Online Payment
                </Text>
                <Text style={styles.paymentSub}>Campus UPI & card payment</Text>
              </View>
              {paymentMethod === 'online_demo' && <Check size={20} color={colors.primary} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.paymentCard, paymentMethod === 'cash' && styles.activePaymentCard]}
              onPress={() => setPaymentMethod('cash')}
            >
              <Banknote
                size={22}
                color={paymentMethod === 'cash' ? '#D97706' : colors.textSecondary}
              />
              <View style={styles.paymentTextCol}>
                <Text
                  style={[
                    styles.paymentTitle,
                    paymentMethod === 'cash' && styles.activePaymentTitle,
                  ]}
                >
                  Pay with Cash
                </Text>
                <Text style={styles.paymentSub}>Pay at the canteen counter</Text>
              </View>
              {paymentMethod === 'cash' && <Check size={20} color={colors.primary} />}
            </TouchableOpacity>
          </View>

          <View style={styles.billCard}>
            <Text style={styles.sectionHeading}>Bill Details</Text>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Item Total</Text>
              <Text style={styles.billValue}>₹{subtotal}</Text>
            </View>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Platform Fee</Text>
              <Text style={[styles.billValue, styles.freeValue]}>FREE</Text>
            </View>
            <View style={styles.billDivider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>TO PAY</Text>
              <Text style={styles.totalValue}>₹{total}</Text>
            </View>
          </View>
        </ScrollView>
      )}

      {items.length > 0 && (
        <View style={styles.bottomCheckoutBar}>
          <TouchableOpacity
            style={[styles.checkoutBtn, loading && styles.disabledBtn]}
            onPress={handleProceed}
            disabled={loading}
            activeOpacity={0.9}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <View>
                  <Text style={styles.btnTotalLabel}>₹{total}</Text>
                  <Text style={styles.btnTotalSub}>TOTAL</Text>
                </View>
                <Text style={styles.checkoutBtnText}>
                  {orderType === 'preorder' && !policyAccepted
                    ? 'REVIEW POLICY  >'
                    : 'PLACE ORDER  >'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};