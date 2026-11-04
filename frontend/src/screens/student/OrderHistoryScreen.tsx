import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  SafeAreaView 
} from 'react-native';
import { ArrowLeft, Clock, History, ShoppingBag } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '../../config/theme';
import { OrderCardCompact } from '../../components/common/OrderCardCompact';
import { useAuth } from '../../context/AuthContext';
import { listenStudentOrders } from '../../services/firestoreService';
import type { Order } from '../../models/types';

interface OrderHistoryScreenProps {
  navigation: any;
}

export const OrderHistoryScreen: React.FC<OrderHistoryScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!user) return;
    const unsub = listenStudentOrders(user.user_id, (data) => {
      setOrders(data);
    });
    return unsub;
  }, [user]);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Order History</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.container}>
        {orders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <History size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No past orders found</Text>
            <Text style={styles.emptySubtitle}>
              Your placed orders and daily pickup tokens will appear here.
            </Text>
          </View>
        ) : (
          <FlatList
            data={orders}
            keyExtractor={(item) => item.order_id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <OrderCardCompact
                order={item}
                isOperatorView={false}
                onPressTrack={(ord) => navigation.navigate('OrderTracking', { order: ord })}
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
  listContent: {
    padding: spacing.lg,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    fontSize: typography.fontSizes.xs,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
});

