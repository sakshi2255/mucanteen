import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Alert,
  SafeAreaView 
} from 'react-native';
import { ArrowLeft, CheckCircle2, Search, Hash } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../../config/theme';
import { useAuth } from '../../context/AuthContext';
import { listenOperatorOrders, updateOrderStatusInFirestore } from '../../services/firestoreService';
import type { Order } from '../../models/types';

interface PickupVerificationScreenProps {
  navigation: any;
}

export const PickupVerificationScreen: React.FC<PickupVerificationScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const assignedCanteenId = user?.assigned_canteen_ids?.[0] || 'canteen-mb-f1';

  const [orders, setOrders] = useState<Order[]>([]);
  const [tokenInput, setTokenInput] = useState('');
  const [matchedOrder, setMatchedOrder] = useState<Order | null>(null);

  useEffect(() => {
    const unsub = listenOperatorOrders(assignedCanteenId, (list) => {
      setOrders(list);
    });
    return unsub;
  }, [assignedCanteenId]);

  const handleSearchToken = () => {
    const num = parseInt(tokenInput.trim(), 10);
    if (isNaN(num)) {
      Alert.alert('Invalid Token', 'Please enter a valid numeric token number.');
      return;
    }

    const found = orders.find(
      (o) => o.daily_token_number === num && o.order_status === 'ready_for_pickup'
    );

    if (found) {
      setMatchedOrder(found);
    } else {
      const anyOrder = orders.find((o) => o.daily_token_number === num);
      if (anyOrder) {
        Alert.alert(
          'Order Status Note',
          `Order #${num} found, but current status is "${anyOrder.order_status}". Food must be marked "Ready for Pickup" before collection.`
        );
      } else {
        Alert.alert('Token Not Found', `No active order found for Token #${num} today.`);
      }
      setMatchedOrder(null);
    }
  };

  const handleConfirmPickup = async () => {
    if (!matchedOrder) return;

    try {
      await updateOrderStatusInFirestore(
        matchedOrder.order_id,
        'picked_up',
        { id: user?.user_id || 'op', name: user?.name || 'Operator', role: 'operator' }
      );
      Alert.alert('Pickup Verified', `Token #${matchedOrder.daily_token_number} marked as Collected.`);
      setMatchedOrder(null);
      setTokenInput('');
    } catch (e: any) {
      Alert.alert('Verification Error', e.message || 'Could not verify pickup.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pickup Token Verification</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.content}>
        {/* Token Input Box */}
        <View style={styles.inputCard}>
          <Text style={styles.inputPrompt}>Enter Customer Daily Token Number:</Text>
          <View style={styles.inputRow}>
            <View style={styles.hashBadge}>
              <Hash size={20} color={colors.primary} />
            </View>
            <TextInput
              style={styles.tokenTextInput}
              placeholder="e.g. 1, 2, 3..."
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              value={tokenInput}
              onChangeText={setTokenInput}
            />
            <TouchableOpacity 
              style={styles.verifyBtn}
              onPress={handleSearchToken}
            >
              <Text style={styles.verifyBtnText}>Lookup</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Matched Order Card */}
        {matchedOrder ? (
          <View style={styles.orderResultCard}>
            <View style={styles.resultHeader}>
              <View style={styles.tokenHeroBadge}>
                <Text style={styles.tokenHeroText}>#{matchedOrder.daily_token_number}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={styles.customerName}>{matchedOrder.user_name_snapshot}</Text>
                <Text style={styles.orderIdText}>ID: {matchedOrder.order_id}</Text>
                <Text style={styles.readyTag}>✓ Ready for Pickup</Text>
              </View>
            </View>

            {/* Items */}
            <View style={styles.itemsBox}>
              <Text style={styles.itemsBoxTitle}>Items to Hand Over:</Text>
              {matchedOrder.items_snapshot.map((it, idx) => (
                <Text key={idx} style={styles.itemLine}>
                  • {it.quantity}x {it.item_name} (₹{it.subtotal})
                </Text>
              ))}
            </View>

            {/* One Tap Collect Button */}
            <TouchableOpacity 
              style={styles.confirmPickupButton}
              onPress={handleConfirmPickup}
              activeOpacity={0.85}
            >
              <CheckCircle2 size={18} color="#FFFFFF" />
              <Text style={styles.confirmPickupText}>Confirm Food Handover & Complete</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.helperCard}>
            <Text style={styles.helperTitle}>Quick Verification Instructions</Text>
            <Text style={styles.helperStep}>1. Ask student for their Daily Token Number.</Text>
            <Text style={styles.helperStep}>2. Enter the number and tap Lookup.</Text>
            <Text style={styles.helperStep}>3. Verify items match and tap Confirm Food Handover.</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.heavy,
    color: colors.textPrimary,
  },
  content: {
    padding: spacing.lg,
  },
  inputCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  inputPrompt: {
    fontSize: typography.fontSizes.xs,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  hashBadge: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tokenTextInput: {
    flex: 1,
    height: 44,
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    fontSize: typography.fontSizes.md,
    fontWeight: '700',
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  verifyBtn: {
    backgroundColor: colors.primary,
    height: 44,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  verifyBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: typography.fontSizes.xs,
  },
  orderResultCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.accentGreen,
    ...shadows.md,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenHeroBadge: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  tokenHeroText: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  customerName: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  orderIdText: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  readyTag: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accentGreen,
    marginTop: 3,
  },
  itemsBox: {
    backgroundColor: colors.surfaceAlt,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    marginVertical: spacing.md,
  },
  itemsBoxTitle: {
    fontSize: typography.fontSizes.xs,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  itemLine: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  confirmPickupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentGreen,
    paddingVertical: 12,
    borderRadius: borderRadius.md,
    gap: 8,
  },
  confirmPickupText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: typography.fontSizes.xs,
    letterSpacing: 0.3,
  },
  helperCard: {
    backgroundColor: colors.surfaceAlt,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  helperTitle: {
    fontSize: typography.fontSizes.xs,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  helperStep: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    marginBottom: 6,
    lineHeight: 18,
  },
});

