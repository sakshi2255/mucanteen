import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  SafeAreaView 
} from 'react-native';
import { ArrowLeft, TrendingUp, DollarSign, PackageCheck, AlertCircle } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../../config/theme';
import { useAuth } from '../../context/AuthContext';
import { listenOperatorOrders } from '../../services/firestoreService';
import type { Order } from '../../models/types';

interface OperatorReportsScreenProps {
  navigation: any;
}

export const OperatorReportsScreen: React.FC<OperatorReportsScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const assignedCanteenId = user?.assigned_canteen_ids?.[0] || 'canteen-mb-f1';

  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const unsub = listenOperatorOrders(assignedCanteenId, (list) => {
      setOrders(list);
    });
    return unsub;
  }, [assignedCanteenId]);

  const completed = orders.filter((o) => o.order_status === 'picked_up');
  const active = orders.filter((o) => ['awaiting_acceptance', 'preparing', 'ready_for_pickup'].includes(o.order_status));
  const declined = orders.filter((o) => ['declined', 'cancelled'].includes(o.order_status));
  const revenue = completed.reduce((sum, o) => sum + o.total, 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Canteen Daily Report</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Revenue Card */}
        <View style={styles.revenueCard}>
          <Text style={styles.revenueTitle}>TODAY'S FULFILLED REVENUE</Text>
          <Text style={styles.revenueValue}>₹{revenue}</Text>
          <Text style={styles.revenueSub}>Based on {completed.length} collected orders</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.grid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Received</Text>
            <Text style={styles.statNumber}>{orders.length}</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Completed</Text>
            <Text style={[styles.statNumber, { color: colors.accentGreen }]}>{completed.length}</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>In Progress</Text>
            <Text style={[styles.statNumber, { color: colors.primaryDark }]}>{active.length}</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Declined / Cancel</Text>
            <Text style={[styles.statNumber, { color: colors.accentRed }]}>{declined.length}</Text>
          </View>
        </View>

        {/* Notice for Review 2 */}
        <View style={styles.review2Notice}>
          <Text style={styles.review2Title}>Review 2 Upcoming Analytics</Text>
          <Text style={styles.review2Body}>
            Automated ingredient tracking, hourly peak-period distribution charts, and flash-sale revenue recovery will be introduced in Review 2.
          </Text>
        </View>
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
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  revenueCard: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  revenueTitle: {
    color: '#E0F2FE',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  revenueValue: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: typography.fontWeights.heavy,
    marginVertical: 4,
  },
  revenueSub: {
    color: '#E0F2FE',
    fontSize: typography.fontSizes.xs,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  statNumber: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.heavy,
    color: colors.textPrimary,
    marginTop: 4,
  },
  review2Notice: {
    backgroundColor: colors.surfaceAlt,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  review2Title: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  review2Body: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
    lineHeight: 16,
  },
});

