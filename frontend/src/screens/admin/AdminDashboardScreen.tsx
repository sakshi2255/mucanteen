import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  SafeAreaView 
} from 'react-native';
import { 
  ShieldAlert, 
  Users, 
  Store, 
  ListOrdered, 
  FileText, 
  TrendingUp,
  Settings 
} from 'lucide-react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../../config/theme';
import { DashboardNavCard } from '../../components/common/DashboardNavCard';
import { useAuth } from '../../context/AuthContext';
import { listenAllOrders, listenCanteens } from '../../services/firestoreService';
import type { Order, Canteen } from '../../models/types';

interface AdminDashboardScreenProps {
  navigation: any;
}

export const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [canteens, setCanteens] = useState<Canteen[]>([]);

  useEffect(() => {
    const unsubOrders = listenAllOrders((list) => setOrders(list));
    const unsubCanteens = listenCanteens((list) => setCanteens(list));
    return () => {
      unsubOrders();
      unsubCanteens();
    };
  }, []);

  const totalCampusRevenue = orders
    .filter((o) => o.order_status === 'picked_up')
    .reduce((sum, o) => sum + o.total, 0);

  const activeCanteensCount = canteens.filter((c) => c.is_open).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerRole}>ADMINISTRATION PORTAL</Text>
          <Text style={styles.headerTitle}>Marwadi University Canteens</Text>
        </View>
        <TouchableOpacity 
          style={styles.profileBtn}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.profileBtnText}>{user?.name?.slice(0, 2).toUpperCase() || 'AD'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Campus Overview Cards */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>CAMPUS FOOD SERVICE OVERVIEW</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{canteens.length}</Text>
              <Text style={styles.statDesc}>Dining Points</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Text style={styles.statValue}>{activeCanteensCount}</Text>
              <Text style={styles.statDesc}>Open Now</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Text style={styles.statValue}>{orders.length}</Text>
              <Text style={styles.statDesc}>Orders Today</Text>
            </View>
          </View>
        </View>

        {/* Administration Navigation Cards (MU Student Portal Inspired) */}
        <Text style={styles.sectionHeading}>Campus Governance</Text>

        <DashboardNavCard
          title="Campus-Wide Order Monitor"
          subtitle="Real-time multi-canteen order feed"
          icon={<ListOrdered size={20} color={colors.primary} />}
          badge={orders.length}
          onPress={() => navigation.navigate('AdminOrders')}
        />

        <DashboardNavCard
          title="Canteen Facility Management"
          subtitle="10 campus points: Main Bldg, Law & Mess"
          icon={<Store size={20} color={colors.primary} />}
          onPress={() => navigation.navigate('CanteenManagement')}
        />

        <DashboardNavCard
          title="User & Role Management"
          subtitle="Students, Faculty, Operators & Administrators"
          icon={<Users size={20} color={colors.primary} />}
          onPress={() => navigation.navigate('UserManagement')}
        />

        <DashboardNavCard
          title="System Audit Logs"
          subtitle="Immutable audit trail of order events & updates"
          icon={<FileText size={20} color={colors.primary} />}
          onPress={() => navigation.navigate('AuditLogs')}
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
  statsCard: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  statsTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#E0F2FE',
    letterSpacing: 0.8,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: typography.fontSizes.xxl,
    fontWeight: typography.fontWeights.heavy,
  },
  statDesc: {
    color: '#E0F2FE',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.25)',
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

