import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Switch,
  SafeAreaView 
} from 'react-native';
import { 
  Store, 
  ListOrdered, 
  UtensilsCrossed, 
  CheckCircle2, 
  BarChart3, 
  Clock, 
  Zap, 
  Layers,
  TrendingUp 
} from 'lucide-react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../../config/theme';
import { DashboardNavCard } from '../../components/common/DashboardNavCard';
import { useAuth } from '../../context/AuthContext';
import { 
  listenOperatorOrders, 
  listenCanteens, 
  toggleCanteenStatus 
} from '../../services/firestoreService';
import type { Canteen, Order } from '../../models/types';

interface OperatorDashboardScreenProps {
  navigation: any;
}

export const OperatorDashboardScreen: React.FC<OperatorDashboardScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const assignedCanteenId = user?.assigned_canteen_ids?.[0] || 'canteen-mb-f1';

  const [canteen, setCanteen] = useState<Canteen | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    // Listen to canteen status
    const unsubCanteens = listenCanteens((list) => {
      const match = list.find((c) => c.canteen_id === assignedCanteenId);
      if (match) setCanteen(match);
    });

    // Listen to orders for this assigned canteen
    const unsubOrders = listenOperatorOrders(assignedCanteenId, (orderList) => {
      setOrders(orderList);
    });

    return () => {
      unsubCanteens();
      unsubOrders();
    };
  }, [assignedCanteenId]);

  const handleToggleOpen = async (val: boolean) => {
    if (!canteen) return;
    await toggleCanteenStatus(
      canteen.canteen_id,
      val,
      { id: user?.user_id || 'op', name: user?.name || 'Operator', role: 'operator' }
    );
  };

  // Stats calculation
  const pendingCount = orders.filter((o) => o.order_status === 'awaiting_acceptance').length;
  const preparingCount = orders.filter((o) => o.order_status === 'preparing').length;
  const readyCount = orders.filter((o) => o.order_status === 'ready_for_pickup').length;
  const completedToday = orders.filter((o) => o.order_status === 'picked_up').length;
  const todayRevenue = orders
    .filter((o) => o.order_status === 'picked_up')
    .reduce((sum, o) => sum + o.total, 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerRole}>OPERATOR CONSOLE</Text>
          <Text style={styles.headerTitle}>{canteen?.name || 'Canteen F1'}</Text>
        </View>
        <TouchableOpacity 
          style={styles.profileBtn}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.profileBtnText}>{user?.name?.slice(0, 2).toUpperCase()}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Canteen Open / Closed & Acceptance Mode Card */}
        <View style={styles.canteenStatusCard}>
          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
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

        {/* Live Metrics Grid */}
        <View style={styles.metricsGrid}>
          <View style={[styles.metricCard, { borderLeftColor: '#F59E0B' }]}>
            <Text style={styles.metricLabel}>IN QUEUE</Text>
            <Text style={[styles.metricValue, { color: '#B45309' }]}>{pendingCount}</Text>
          </View>

          <View style={[styles.metricCard, { borderLeftColor: '#0284C7' }]}>
            <Text style={styles.metricLabel}>PREPARING</Text>
            <Text style={[styles.metricValue, { color: '#0369A1' }]}>{preparingCount}</Text>
          </View>

          <View style={[styles.metricCard, { borderLeftColor: colors.accentGreen }]}>
            <Text style={styles.metricLabel}>READY</Text>
            <Text style={[styles.metricValue, { color: '#047857' }]}>{readyCount}</Text>
          </View>

          <View style={[styles.metricCard, { borderLeftColor: colors.primary }]}>
            <Text style={styles.metricLabel}>REVENUE</Text>
            <Text style={[styles.metricValue, { color: colors.primaryDark }]}>₹{todayRevenue}</Text>
          </View>
        </View>

        {/* Navigation Cards (MU Student Portal Inspired) */}
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
          subtitle="Toggle Sold Out & available items instantly"
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
          title="Daily Reports & Revenue"
          subtitle="Summary of fulfilled orders & sales"
          icon={<BarChart3 size={20} color={colors.primary} />}
          onPress={() => navigation.navigate('OperatorReports')}
        />
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerRole: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.heavy,
    color: colors.textPrimary,
  },
  profileBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  canteenStatusCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  toggleSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: spacing.lg,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    ...shadows.sm,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.heavy,
    marginTop: 4,
  },
  sectionHeading: {
    fontSize: typography.fontSizes.xs,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
});

