import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  SafeAreaView 
} from 'react-native';
import { 
  ArrowLeft, 
  Trash2, 
  Plus, 
  Minus, 
  Clock, 
  Zap, 
  ShieldAlert, 
  ShoppingBag, 
  Check,
  CreditCard,
  Banknote,
  Calendar
} from 'lucide-react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../../config/theme';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { createOrderInFirestore } from '../../services/firestoreService';
import { getISTDateString } from '../../services/tokenService';
import { INITIAL_CANTEENS } from '../../services/seedData';
import type { OrderType, Canteen, PaymentMethod } from '../../models/types';

interface CartScreenProps {
  navigation: any;
}

const PREORDER_SLOTS = [
  '10:30 AM (Morning Recess)',
  '12:45 PM (Lunch Break)',
  '02:15 PM (Afternoon Break)',
  '04:30 PM (Evening Tea)',
];

export const CartScreen: React.FC<CartScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
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
    clearCart 
  } = useCart();

  const [loading, setLoading] = useState(false);
  const todayIST = getISTDateString();

  const activeCanteen = INITIAL_CANTEENS.find(
    (c) => c.canteen_id === activeCanteenId
  ) || INITIAL_CANTEENS[0];

  const handleProceed = async () => {
    if (items.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to your cart.');
      return;
    }

    if (!user) {
      Alert.alert('Authentication Required', 'Please sign in to place an order.');
      return;
    }

    // If Preorder, must accept preorder policy first
    if (orderType === 'preorder' && !policyAccepted) {
      navigation.navigate('PreorderPolicy');
      return;
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
        pickup_time: orderType === 'preorder' ? pickupTime : 'Immediate',
        payment_method: paymentMethod,
        policy_version: '1.0.0',
        policy_accepted: orderType === 'preorder' ? true : false,
      });

      clearCart();
      navigation.navigate('OrderTracking', { order: created });
    } catch (e: any) {
      Alert.alert('Checkout Failed', e.message || 'Could not place order.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Canteen Cart</Text>
        {items.length > 0 && (
          <TouchableOpacity onPress={clearCart} style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ShoppingBag size={54} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>
            Browse our campus canteens and add delicious snacks & meals!
          </Text>
          <TouchableOpacity 
            style={styles.browseButton}
            onPress={() => navigation.navigate('StudentHome')}
          >
            <Text style={styles.browseButtonText}>Browse Food</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView 
          style={styles.container} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Canteen Banner */}
          <View style={styles.canteenBanner}>
            <Text style={styles.canteenBannerTitle}>{activeCanteenName || activeCanteen.name}</Text>
            <Text style={styles.canteenBannerSubtitle}>
              Floor {activeCanteen.floor === 0 ? 'Ground' : activeCanteen.floor} • Token Prefix [{activeCanteen.token_prefix || 'A'}] • Pickup Only
            </Text>
          </View>

          {/* Order Type Toggle: Instant vs Preorder */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeading}>Select Ordering Mode</Text>
            <View style={styles.typeToggleRow}>
              <TouchableOpacity 
                style={[styles.typeButton, orderType === 'instant' && styles.activeTypeButton]}
                onPress={() => setOrderType('instant')}
                activeOpacity={0.8}
              >
                <Zap size={15} color={orderType === 'instant' ? '#FFFFFF' : colors.primaryDark} />
                <Text style={[styles.typeButtonText, orderType === 'instant' && styles.activeTypeButtonText]}>
                  Instant Order
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.typeButton, orderType === 'preorder' && styles.activeTypeButton]}
                onPress={() => setOrderType('preorder')}
                activeOpacity={0.8}
              >
                <Clock size={15} color={orderType === 'preorder' ? '#FFFFFF' : colors.primaryDark} />
                <Text style={[styles.typeButtonText, orderType === 'preorder' && styles.activeTypeButtonText]}>
                  Preorder for Break
                </Text>
              </TouchableOpacity>
            </View>

            {/* Same-Day Preorder Time Slot Selection */}
            {orderType === 'preorder' && (
              <View style={styles.slotsContainer}>
                <View style={styles.sameDayNotice}>
                  <Calendar size={13} color={colors.primary} />
                  <Text style={styles.sameDayText}>Same-Day Preorder: Today ({todayIST})</Text>
                </View>

                <Text style={styles.slotHeading}>Select Campus Break Slot:</Text>
                {PREORDER_SLOTS.map((slot) => {
                  const isSelected = pickupTime === slot;
                  return (
                    <TouchableOpacity
                      key={slot}
                      style={[styles.slotItem, isSelected && styles.activeSlotItem]}
                      onPress={() => setPickupTime(slot)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.slotText, isSelected && styles.activeSlotText]}>
                        {slot}
                      </Text>
                      {isSelected && <Check size={16} color={colors.primary} />}
                    </TouchableOpacity>
                  );
                })}

                {!policyAccepted && (
                  <View style={styles.policyNotice}>
                    <ShieldAlert size={14} color="#B45309" />
                    <Text style={styles.policyNoticeText}>
                      Preorders require acknowledging the 6-point campus preorder policy.
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Payment Method Selector */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeading}>Payment Mode</Text>
            
            {/* Online Demo */}
            <TouchableOpacity
              style={[styles.paymentCard, paymentMethod === 'online_demo' && styles.activePaymentCard]}
              onPress={() => setPaymentMethod('online_demo')}
              activeOpacity={0.8}
            >
              <View style={styles.paymentLeft}>
                <CreditCard size={18} color={paymentMethod === 'online_demo' ? colors.primary : colors.textSecondary} />
                <View>
                  <Text style={[styles.paymentTitle, paymentMethod === 'online_demo' && styles.activePaymentTitle]}>
                    Online (Demo Checkout)
                  </Text>
                  <Text style={styles.paymentSub}>Instant simulated confirmation (Review 1)</Text>
                </View>
              </View>
              {paymentMethod === 'online_demo' && <Check size={16} color={colors.primary} />}
            </TouchableOpacity>

            {/* Cash at Counter */}
            <TouchableOpacity
              style={[styles.paymentCard, paymentMethod === 'cash' && styles.activePaymentCard]}
              onPress={() => setPaymentMethod('cash')}
              activeOpacity={0.8}
            >
              <View style={styles.paymentLeft}>
                <Banknote size={18} color={paymentMethod === 'cash' ? '#D97706' : colors.textSecondary} />
                <View>
                  <Text style={[styles.paymentTitle, paymentMethod === 'cash' && styles.activePaymentTitle]}>
                    Cash at Canteen Counter
                  </Text>
                  <Text style={styles.paymentSub}>Pay physical cash upon collection</Text>
                </View>
              </View>
              {paymentMethod === 'cash' && <Check size={16} color={colors.primary} />}
            </TouchableOpacity>
          </View>

          {/* Selected Items List */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeading}>Your Selected Items ({items.length})</Text>
            {items.map(({ item, quantity }) => (
              <View key={item.menu_item_id} style={styles.cartItemRow}>
                <View style={styles.itemInfo}>
                  <View style={styles.vegIndicatorRow}>
                    <View style={[styles.vegIndicatorDot, { backgroundColor: item.is_veg ? colors.accentGreen : colors.accentRed }]} />
                    <Text style={styles.itemName}>{item.item_name}</Text>
                  </View>
                  <Text style={styles.itemPrice}>₹{item.price} each</Text>
                </View>

                {/* Stepper Buttons */}
                <View style={styles.stepper}>
                  <TouchableOpacity 
                    onPress={() => removeFromCart(item)}
                    style={styles.stepBtn}
                    activeOpacity={0.7}
                  >
                    {quantity === 1 ? (
                      <Trash2 size={13} color={colors.accentRed} />
                    ) : (
                      <Minus size={13} color={colors.primaryDark} />
                    )}
                  </TouchableOpacity>
                  <Text style={styles.stepQty}>{quantity}</Text>
                  <TouchableOpacity 
                    onPress={() => addToCart(item)}
                    style={styles.stepBtn}
                    activeOpacity={0.7}
                  >
                    <Plus size={13} color={colors.primaryDark} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.itemSubtotal}>₹{item.price * quantity}</Text>
              </View>
            ))}
          </View>

          {/* Bill Summary */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeading}>Bill Breakdown</Text>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Item Total</Text>
              <Text style={styles.billValue}>₹{subtotal}</Text>
            </View>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Campus Convenience Fee</Text>
              <Text style={[styles.billValue, { color: colors.accentGreen }]}>FREE</Text>
            </View>
            <View style={[styles.billRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>To Pay</Text>
              <Text style={styles.totalValue}>₹{total}</Text>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Sticky Bottom Action */}
      {items.length > 0 && (
        <View style={styles.bottomBar}>
          <View>
            <Text style={styles.bottomTotalLabel}>Total Amount</Text>
            <Text style={styles.bottomTotal}>₹{total}</Text>
          </View>

          <TouchableOpacity
            style={[styles.checkoutBtn, loading && styles.disabledBtn]}
            onPress={handleProceed}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : orderType === 'preorder' && !policyAccepted ? (
              <Text style={styles.checkoutBtnText}>Review Policy & Confirm</Text>
            ) : (
              <Text style={styles.checkoutBtnText}>
                {paymentMethod === 'cash' ? 'Place Order (Cash)' : 'Pay & Place Order'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
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
  clearBtn: {
    padding: 4,
  },
  clearBtnText: {
    fontSize: 12,
    color: colors.accentRed,
    fontWeight: typography.fontWeights.bold,
  },
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSoft,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 110,
    gap: spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: typography.fontWeights.heavy,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  browseButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  browseButtonText: {
    color: '#FFFFFF',
    fontWeight: typography.fontWeights.bold,
    fontSize: 14,
  },
  canteenBanner: {
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  canteenBannerTitle: {
    fontSize: 15,
    fontWeight: typography.fontWeights.heavy,
    color: colors.primaryDark,
  },
  canteenBannerSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: typography.fontWeights.heavy,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  typeToggleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.backgroundSoft,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: 6,
  },
  activeTypeButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  activeTypeButtonText: {
    color: '#FFFFFF',
  },
  slotsContainer: {
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.sm,
  },
  sameDayNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
    gap: 6,
  },
  sameDayText: {
    fontSize: 11,
    fontWeight: typography.fontWeights.bold,
    color: colors.primaryDark,
  },
  slotHeading: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  slotItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: 4,
    backgroundColor: colors.backgroundSoft,
  },
  activeSlotItem: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  slotText: {
    fontSize: 12,
    color: colors.textPrimary,
  },
  activeSlotText: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  policyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
    marginTop: spacing.xs,
    gap: 6,
  },
  policyNoticeText: {
    fontSize: 10,
    color: '#92400E',
    flex: 1,
  },
  paymentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.xs,
    backgroundColor: colors.backgroundSoft,
  },
  activePaymentCard: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  paymentTitle: {
    fontSize: 13,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  activePaymentTitle: {
    color: colors.primaryDark,
  },
  paymentSub: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 1,
  },
  cartItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  itemInfo: {
    flex: 1,
  },
  vegIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  vegIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  itemName: {
    fontSize: 13,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  itemPrice: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSoft,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginHorizontal: spacing.sm,
  },
  stepBtn: {
    padding: 6,
  },
  stepQty: {
    paddingHorizontal: 8,
    fontSize: 12,
    fontWeight: typography.fontWeights.bold,
    color: colors.primaryDark,
  },
  itemSubtotal: {
    fontSize: 13,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
    minWidth: 45,
    textAlign: 'right',
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  billLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  billValue: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: 8,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: typography.fontWeights.heavy,
    color: colors.textPrimary,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: typography.fontWeights.heavy,
    color: colors.primaryDark,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shadows.md,
  },
  bottomTotalLabel: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  bottomTotal: {
    fontSize: 18,
    fontWeight: typography.fontWeights.heavy,
    color: colors.primaryDark,
  },
  checkoutBtn: {
    backgroundColor: colors.accentOrange,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderRadius: borderRadius.md,
    minWidth: 180,
    alignItems: 'center',
  },
  disabledBtn: {
    opacity: 0.6,
  },
  checkoutBtnText: {
    color: '#FFFFFF',
    fontWeight: typography.fontWeights.heavy,
    fontSize: 13,
  },
});
