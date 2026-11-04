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
  ShieldCheck, 
  Clock, 
  AlertTriangle, 
  CheckSquare, 
  Square, 
  ArrowLeft,
  X 
} from 'lucide-react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../../config/theme';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { createOrderInFirestore } from '../../services/firestoreService';
import { INITIAL_CANTEENS } from '../../services/seedData';

interface PreorderPolicyScreenProps {
  navigation: any;
}

const POLICY_POINTS = [
  {
    title: '1. Same-Day Preorders Only',
    desc: 'All preorders must be scheduled for today during active canteen operating hours. Next-day scheduling is strictly prohibited.',
  },
  {
    title: '2. Punctual Collection Slot',
    desc: 'Meals are freshly prepared for your chosen recess or lunch break slot. Please arrive on time at the canteen counter.',
  },
  {
    title: '3. 12-Minute Collection Window',
    desc: 'When your order status turns "Ready for Pickup", a 12-minute countdown timer begins. Tokens expire after 12 minutes.',
  },
  {
    title: '4. Non-Refundable on Abandonment',
    desc: 'Prepared hot food cannot be restocked or reused. Orders abandoned past the 12-minute window are marked Unclaimed.',
  },
  {
    title: '5. Cancellation Cutoff Rule',
    desc: 'Cancellations are accepted ONLY while order is "In Queue" (Awaiting Acceptance). Once preparation starts, cancellations are rejected.',
  },
  {
    title: '6. Campus Decorum & Token Handover',
    desc: 'Present your alphanumeric token (e.g. A1, B2) to the operator. Respect canteen staff and student queues at all times.',
  },
];

export const PreorderPolicyScreen: React.FC<PreorderPolicyScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const { 
    items, 
    activeCanteenId, 
    subtotal, 
    total, 
    pickupTime, 
    paymentMethod,
    setPolicyAccepted, 
    clearCart 
  } = useCart();

  const [hasAgreed, setHasAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const activeCanteen = INITIAL_CANTEENS.find(
    (c) => c.canteen_id === activeCanteenId
  ) || INITIAL_CANTEENS[0];

  const handleAcceptAndPlaceOrder = async () => {
    if (!hasAgreed) {
      Alert.alert('Agreement Required', 'You must agree to the 6-point preorder policy before placing your order.');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'User profile not found. Please log in.');
      return;
    }

    setSubmitting(true);
    try {
      setPolicyAccepted(true);

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
        order_type: 'preorder',
        pickup_time: pickupTime,
        payment_method: paymentMethod,
        policy_version: '1.0.0',
        policy_accepted: true,
      });

      clearCart();
      navigation.navigate('OrderTracking', { order: created });
    } catch (err: any) {
      Alert.alert('Preorder Failed', err.message || 'Unable to place preorder.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecline = () => {
    setPolicyAccepted(false);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topNav}>
        <TouchableOpacity onPress={handleDecline} style={styles.backButton}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Preorder Policy & Terms</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.headerBox}>
          <View style={styles.iconCircle}>
            <ShieldCheck size={28} color={colors.primary} />
          </View>
          <Text style={styles.headerTitle}>Marwadi University Preorder Policy</Text>
          <Text style={styles.headerSubtitle}>
            To minimize food waste and manage rush-hour queues, all campus preorders are subject to the following rules:
          </Text>
        </View>

        <View style={styles.policyCard}>
          {POLICY_POINTS.map((point, index) => (
            <View key={index} style={styles.pointRow}>
              <View style={styles.pointDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.pointTitle}>{point.title}</Text>
                <Text style={styles.pointDesc}>{point.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity 
          style={styles.agreementRow} 
          onPress={() => setHasAgreed(!hasAgreed)}
          activeOpacity={0.8}
        >
          {hasAgreed ? (
            <CheckSquare size={22} color={colors.primary} />
          ) : (
            <Square size={22} color={colors.textSecondary} />
          )}
          <Text style={styles.agreementText}>
            I have read, understood and agree to the 6-point MU Canteen Preorder Policy.
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Docked Sticky Action Buttons */}
      <View style={styles.stickyActionContainer}>
        <TouchableOpacity 
          style={styles.declineButton} 
          onPress={handleDecline}
          activeOpacity={0.7}
        >
          <Text style={styles.declineButtonText}>Decline</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.acceptButton, (!hasAgreed || submitting) && styles.disabledButton]} 
          onPress={handleAcceptAndPlaceOrder}
          disabled={!hasAgreed || submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.acceptButtonText}>Accept & Place Order (₹{total})</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  topNav: {
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
  navTitle: {
    fontSize: 15,
    fontWeight: typography.fontWeights.heavy,
    color: colors.textPrimary,
  },
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSoft,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 130, // Guaranteed clearance for docked buttons on smaller screens
  },
  headerBox: {
    alignItems: 'center',
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: typography.fontWeights.heavy,
    color: colors.primaryDark,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  policyCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: spacing.md,
    ...shadows.sm,
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  pointDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginTop: 6,
  },
  pointTitle: {
    fontSize: 13,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  pointDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  agreementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  agreementText: {
    flex: 1,
    fontSize: 12,
    color: colors.textPrimary,
    fontWeight: typography.fontWeights.medium,
    lineHeight: 16,
  },
  stickyActionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    flexDirection: 'row',
    gap: spacing.sm,
    ...shadows.md,
  },
  declineButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundSoft,
  },
  declineButtonText: {
    fontSize: 13,
    fontWeight: typography.fontWeights.bold,
    color: colors.textSecondary,
  },
  acceptButton: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: borderRadius.md,
    backgroundColor: colors.accentOrange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  acceptButtonText: {
    fontSize: 13,
    fontWeight: typography.fontWeights.heavy,
    color: '#FFFFFF',
  },
});
