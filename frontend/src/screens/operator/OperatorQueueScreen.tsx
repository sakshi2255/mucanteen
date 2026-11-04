import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Alert, 
  SafeAreaView 
} from 'react-native';
import { ArrowLeft, RefreshCw, Filter, CheckCircle2 } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '../../config/theme';
import { OrderCardCompact } from '../../components/common/OrderCardCompact';
import { useAuth } from '../../context/AuthContext';
import { 
  listenOperatorOrders, 
  updateOrderStatusInFirestore,
  markCashReceivedInFirestore,
  checkAndExpireOrders 
} from '../../services/firestoreService';
import type { Order } from '../../models/types';

interface OperatorQueueScreenProps {
  navigation: any;
}

export const OperatorQueueScreen: React.FC<OperatorQueueScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const assignedCanteenId = user?.assigned_canteen_ids?.[0] || 'canteen_main_1';

  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'ready' | 'completed' | 'declined'>('active');

  useEffect(() => {
    // SHARED MULTI-DEVICE ORDER QUEUE LISTENER
    const unsub = listenOperatorOrders(assignedCanteenId, (data) => {
      setOrders(data);
    });

    // Check for 12-min collection expiry every 10 seconds
    const interval = setInterval(() => {
      checkAndExpireOrders(assignedCanteenId).catch(() => {});
    }, 10000);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, [assignedCanteenId]);

  const actor = {
    id: user?.user_id || 'operator',
    name: user?.name || 'Canteen Operator',
    role: 'operator',
  };

  // State Transition Actions:
  // 1. Accept: Automatically transitions to 'preparing'
  const handleAcceptOrder = async (order: Order) => {
    try {
      await updateOrderStatusInFirestore(order.order_id, 'preparing', actor);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not accept order.');
    }
  };

  // 2. Decline
  const handleDeclineOrder = async (order: Order) => {
    Alert.alert(
      'Decline Order',
      `Decline Order ${order.token_display || `#${order.daily_token_number}`}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              await updateOrderStatusInFirestore(order.order_id, 'declined', actor);
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Could not decline order.');
            }
          },
        },
      ]
    );
  };

  // 3. Mark Cash Received
  const handleMarkCashReceived = async (order: Order) => {
    Alert.alert(
      'Confirm Cash Payment',
      `Confirm cash receipt of ₹${order.total} for token ${order.token_display || `#${order.daily_token_number}`}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Cash Received',
          onPress: async () => {
            try {
              await markCashReceivedInFirestore(order.order_id, actor);
              Alert.alert('Payment Recorded', `Cash payment of ₹${order.total} recorded. You can now mark order Ready.`);
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Could not record cash payment.');
            }
          },
        },
      ]
    );
  };

  // 4. Ready: Transitions 'preparing' to 'ready_for_pickup' (blocked if cash pending!)
  const handleMarkReady = async (order: Order) => {
    if (order.payment_status === 'CASH_PENDING') {
      Alert.alert(
        'Cash Payment Required',
        'This is a cash-on-counter order. Please collect cash and click "Mark Cash Received" before marking the food ready.'
      );
      return;
    }

    try {
      await updateOrderStatusInFirestore(order.order_id, 'ready_for_pickup', actor);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not mark order ready.');
    }
  };

  // 5. Collected: Transitions 'ready_for_pickup' to 'picked_up'
  const handleMarkCollected = async (order: Order) => {
    Alert.alert(
      'Confirm Handover',
      `Verify customer token ${order.token_display || `#${order.daily_token_number}`} and handover food?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Handover & Complete',
          onPress: async () => {
            try {
              await updateOrderStatusInFirestore(order.order_id, 'picked_up', actor);
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Could not mark order picked up.');
            }
          },
        },
      ]
    );
  };

  const filteredOrders = useMemo(() => {
    if (activeTab === 'active') {
      return orders.filter(
        (o) => o.order_status === 'awaiting_acceptance' || o.order_status === 'preparing'
      );
    } else if (activeTab === 'ready') {
      return orders.filter((o) => o.order_status === 'ready_for_pickup');
    } else if (activeTab === 'completed') {
      return orders.filter((o) => o.order_status === 'picked_up');
    } else {
      return orders.filter(
        (o) => o.order_status === 'declined' || o.order_status === 'cancelled' || o.order_status === 'not_collected'
      );
    }
  }, [orders, activeTab]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Canteen Order Queue</Text>
          <Text style={styles.headerSub}>Canteen: {assignedCanteenId}</Text>
        </View>
        <View style={{ width: 22 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'active' && styles.activeTab]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>
            Prep ({orders.filter(o => ['awaiting_acceptance', 'preparing'].includes(o.order_status)).length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tab, activeTab === 'ready' && styles.activeTab]}
          onPress={() => setActiveTab('ready')}
        >
          <Text style={[styles.tabText, activeTab === 'ready' && styles.activeTabText]}>
            Ready ({orders.filter(o => o.order_status === 'ready_for_pickup').length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>
            Done ({orders.filter(o => o.order_status === 'picked_up').length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tab, activeTab === 'declined' && styles.activeTab]}
          onPress={() => setActiveTab('declined')}
        >
          <Text style={[styles.tabText, activeTab === 'declined' && styles.activeTabText]}>
            Inactive
          </Text>
        </TouchableOpacity>
      </View>

      {/* Real-time Order Cards List */}
      <View style={styles.container}>
        {filteredOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No orders in this tab</Text>
            <Text style={styles.emptySubtitle}>
              New student and faculty orders will appear here automatically in real time.
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredOrders}
            keyExtractor={(item) => item.order_id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <OrderCardCompact
                order={item}
                isOperatorView={true}
                onAccept={handleAcceptOrder}
                onDecline={handleDeclineOrder}
                onMarkCashReceived={handleMarkCashReceived}
                onMarkReady={handleMarkReady}
                onMarkCollected={handleMarkCollected}
              />
            )}
          />
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: typography.fontWeights.heavy,
    color: colors.textPrimary,
  },
  headerSub: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: 6,
  },
  tab: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.backgroundSoft,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSoft,
  },
  listContent: {
    padding: spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
});
