import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ListOrdered, UtensilsCrossed, CheckCircle2, BarChart3 } from 'lucide-react-native';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';
import { colors } from '../../config/theme';
import { DashboardNavCard } from '../../components/common/DashboardNavCard';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { listenCanteens, toggleCanteenStatus } from '../../services/firestoreService';
import type { Canteen, Order } from '../../models/types';
import { styles } from '../../styles/operator/OperatorDashboardStyles';

interface OperatorDashboardScreenProps {
  navigation: any;
}

export const OperatorDashboardScreen: React.FC<OperatorDashboardScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const assignedCanteenId = user?.assigned_canteen_ids?.[0] || 'canteen_main_1';

  const [canteen, setCanteen] = useState<Canteen | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const unsubCanteens = listenCanteens((list) => {
      const match = list.find((c) => c.canteen_id === assignedCanteenId);
      if (match) setCanteen(match);
    });

    const ordersQuery = query(
      collection(db, 'orders'),
      where('canteen_id', '==', assignedCanteenId)
    );
    const unsubOrders = onSnapshot(
      ordersQuery,
      (snapshot) => {
        const list = snapshot.docs
          .map((d) => d.data() as Order)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setOrders(list);
      },
      (error) => {
        console.warn('Operator dashboard orders error:', error.message);
        showToast('Could not sync canteen orders.', 'error');
      }
    );

    return () => {
      unsubCanteens();
      unsubOrders();
    };
  }, [assignedCanteenId, showToast]);

  const handleToggleOpen = async (val: boolean) => {
    if (!canteen) return;
    try {
      await toggleCanteenStatus(canteen.canteen_id, val, {
        id: user?.user_id || 'op',
        name: user?.name || 'Operator',
        role: 'operator',
      });
      showToast(
        val ? 'Canteen is now OPEN for orders.' : 'Canteen is now CLOSED.',
        val ? 'success' : 'info',
        'Status Updated'
      );
    } catch {
      showToast('Failed to update canteen status.', 'error');
    }
  };

  const pendingCount = useMemo(
    () => orders.filter((o) => o.order_status === 'awaiting_acceptance').length,
    [orders]
  );
  const preparingCount = useMemo(
    () => orders.filter((o) => o.order_status === 'preparing').length,
    [orders]
  );
  const readyCount = useMemo(
    () => orders.filter((o) => o.order_status === 'ready_for_pickup').length,
    [orders]
  );

  // Unified overall revenue across Cash + Online & Instant + Preorders (excluding declined/cancelled/refunded)
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerTextCol}>
          <Text style={styles.headerRole}>OPERATOR CONSOLE</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {canteen?.name || 'Canteen Console'}
          </Text>
        </View>
        <TouchableOpacity style={styles.profileBtn} onPress={() => navigation.navigate('Profile')}>
          <Text style={styles.profileBtnText}>{user?.name?.slice(0, 2).toUpperCase() || 'OP'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.canteenStatusCard}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleTextCol}>
              <Text style={styles.toggleTitle}>Canteen Serving Status</Text>
              <Text style={styles.toggleSubtitle}>
                {canteen?.is_open
                  ? 'Open — Accepting instant and preorders'
                  : 'Closed — Students cannot place new orders'}
              </Text>
            </View>
            <Switch
              value={canteen?.is_open ?? true}
              onValueChange={handleToggleOpen}
              trackColor={{ false: '#FECACA', true: '#A7F3D0' }}
              thumbColor={canteen?.is_open ? colors.accentGreen : '#EF4444'}
            />
          </View>
        </View>

        {/* Clickable Live Metrics Grid */}
        <View style={styles.metricsGrid}>
          <TouchableOpacity
            style={[styles.metricCard, styles.metricQueue]}
            onPress={() => navigation.navigate('OperatorQueue', { initialTab: 'active' })}
            activeOpacity={0.8}
          >
            <Text style={styles.metricLabel}>IN QUEUE</Text>
            <Text style={[styles.metricValue, styles.valueQueue]}>{pendingCount}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.metricCard, styles.metricPreparing]}
            onPress={() => navigation.navigate('OperatorQueue', { initialTab: 'active' })}
            activeOpacity={0.8}
          >
            <Text style={styles.metricLabel}>PREPARING</Text>
            <Text style={[styles.metricValue, styles.valuePreparing]}>{preparingCount}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.metricCard, styles.metricReady]}
            onPress={() => navigation.navigate('OperatorQueue', { initialTab: 'ready' })}
            activeOpacity={0.8}
          >
            <Text style={styles.metricLabel}>READY</Text>
            <Text style={[styles.metricValue, styles.valueReady]}>{readyCount}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.metricCard, styles.metricRevenue]}
            onPress={() => navigation.navigate('OperatorReports')}
            activeOpacity={0.8}
          >
            <Text style={styles.metricLabel}>OVERALL REVENUE</Text>
            <Text style={[styles.metricValue, styles.valueRevenue]}>₹{overallRevenue}</Text>
            <Text style={styles.metricSubtext}>{validRevenueOrders.length} total orders</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionHeading}>Management Actions</Text>

        <DashboardNavCard
          title="Live Order Queue"
          subtitle="Real-time multi-device orders & state machine"
          icon={<ListOrdered size={20} color={colors.primary} />}
          badge={pendingCount + preparingCount + readyCount}
          onPress={() => navigation.navigate('OperatorQueue')}
        />

        <DashboardNavCard
          title="Menu Availability"
          subtitle="Toggle Sold Out, edit dishes & manage categories"
          icon={<UtensilsCrossed size={20} color={colors.primary} />}
          onPress={() => navigation.navigate('MenuManagement')}
        />

        <DashboardNavCard
          title="Pickup Verification"
          subtitle="Verify student daily numeric token at counter"
          icon={<CheckCircle2 size={20} color={colors.primary} />}
          onPress={() => navigation.navigate('PickupVerification')}
        />

        <DashboardNavCard
          title="Reports, Orders & Payments"
          subtitle="Overall revenue, online/cash splits & order history"
          icon={<BarChart3 size={20} color={colors.primary} />}
          onPress={() => navigation.navigate('OperatorReports')}
        />
      </ScrollView>
    </SafeAreaView>
  );
};