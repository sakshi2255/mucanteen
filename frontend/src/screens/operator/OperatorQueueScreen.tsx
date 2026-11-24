import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { colors } from '../../config/theme';
import { styles } from '../../styles/operator/OperatorQueueStyles';
import { OrderCardCompact } from '../../components/common/OrderCardCompact';
import { useAuth } from '../../context/AuthContext';
import {
  listenOperatorOrders,
  updateOrderStatusInFirestore,
  markCashReceivedInFirestore,
  checkAndExpireOrders,
} from '../../services/firestoreService';
import type { Order } from '../../models/types';

interface OperatorQueueScreenProps {
  navigation: any;
  route?: { params?: { initialTab?: 'active' | 'ready' | 'completed' | 'declined' } };
}

export const OperatorQueueScreen: React.FC<OperatorQueueScreenProps> = ({ navigation, route }) => {
  const { user } = useAuth();
  const assignedCanteenId = user?.assigned_canteen_ids?.[0] || 'canteen_main_1';

  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'ready' | 'completed' | 'declined'>(
    route?.params?.initialTab || 'active'
  );

  useEffect(() => {
    if (route?.params?.initialTab) {
      setActiveTab(route.params.initialTab);
    }
  }, [route?.params?.initialTab]);

  useEffect(() => {
    const unsub = listenOperatorOrders(assignedCanteenId, (data) => {
      setOrders(data);
    });

    const interval = setInterval(() => {
      checkAndExpireOrders(assignedCanteenId).catch(() => {});
    }, 10000);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, [assignedCanteenId]);

  // Automatically release scheduled pre-orders when their scheduled timestamp is reached
  useEffect(() => {
    const releaseDuePreorders = async () => {
      const now = Date.now();
      const dueOrders = orders.filter(
        (o) =>
          o.order_status === 'scheduled' &&
          o.scheduled_release_at &&
          new Date(o.scheduled_release_at).getTime() <= now
      );
      for (const ord of dueOrders) {
        await updateOrderStatusInFirestore(ord.order_id, 'awaiting_acceptance', {
          id: 'system',
          name: 'Preorder Scheduler',
          role: 'system',
        }).catch(() => {});
      }
    };

    releaseDuePreorders();
    const timer = setInterval(releaseDuePreorders, 15000);
    return () => clearInterval(timer);
  }, [orders]);

  const actor = {
    id: user?.user_id || 'operator',
    name: user?.name || 'Canteen Operator',
    role: 'operator',
  };

  const handleAcceptOrder = async (order: Order) => {
    try {
      await updateOrderStatusInFirestore(order.order_id, 'preparing', actor);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not accept order.');
    }
  };

  const handleDeclineOrder = async (order: Order) => {
    Alert.alert('Decline Order', `Decline Order ${order.token_display || `#${order.daily_token_number}`}?`, [
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
    ]);
  };

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

  const handleMarkReady = async (order: Order) => {
    if (order.payment_status === 'CASH_PENDING') {
      Alert.alert(
        'Cash Payment Required',
        'Please collect cash and click "Mark Cash Received" before marking the food ready.'
      );
      return;
    }
    try {
      await updateOrderStatusInFirestore(order.order_id, 'ready_for_pickup', actor);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not mark order ready.');
    }
  };

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
      return orders.filter((o) => o.order_status === 'awaiting_acceptance' || o.order_status === 'preparing');
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
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.tabsRow}>
        <TouchableOpacity style={[styles.tab, activeTab === 'active' && styles.activeTab]} onPress={() => setActiveTab('active')}>
          <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>
            Prep ({orders.filter((o) => ['awaiting_acceptance', 'preparing'].includes(o.order_status)).length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.tab, activeTab === 'ready' && styles.activeTab]} onPress={() => setActiveTab('ready')}>
          <Text style={[styles.tabText, activeTab === 'ready' && styles.activeTabText]}>
            Ready ({orders.filter((o) => o.order_status === 'ready_for_pickup').length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.tab, activeTab === 'completed' && styles.activeTab]} onPress={() => setActiveTab('completed')}>
          <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>
            Done ({orders.filter((o) => o.order_status === 'picked_up').length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.tab, activeTab === 'declined' && styles.activeTab]} onPress={() => setActiveTab('declined')}>
          <Text style={[styles.tabText, activeTab === 'declined' && styles.activeTabText]}>Inactive</Text>
        </TouchableOpacity>
      </View>

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