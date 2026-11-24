import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Users, Store, ListOrdered, FileText } from 'lucide-react-native';
import { colors } from '../../config/theme';
import { DashboardNavCard } from '../../components/common/DashboardNavCard';
import { useAuth } from '../../context/AuthContext';
import { listenAllOrders, listenCanteens } from '../../services/firestoreService';
import { styles } from '../../styles/admin/AdminDashboardStyles';
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
          subtitle={`${canteens.length} campus points: Main Bldg, Law & Mess`}
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