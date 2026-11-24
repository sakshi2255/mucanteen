import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, CheckCircle2, Search, Hash } from 'lucide-react-native';
import { colors, spacing } from '../../config/theme';
import { styles } from '../../styles/operator/PickupVerificationStyles';
import { useAuth } from '../../context/AuthContext';
import { listenOperatorOrders, updateOrderStatusInFirestore } from '../../services/firestoreService';
import type { Order } from '../../models/types';

interface PickupVerificationScreenProps {
  navigation: any;
}

export const PickupVerificationScreen: React.FC<PickupVerificationScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const assignedCanteenId = user?.assigned_canteen_ids?.[0] || 'canteen_main_1';

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
              {(matchedOrder.items_snapshot || []).map((it, idx) => (
                <Text key={idx} style={styles.itemLine}>
                  • {it.quantity}x {it.item_name} (₹{it.subtotal || it.price * it.quantity})
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

