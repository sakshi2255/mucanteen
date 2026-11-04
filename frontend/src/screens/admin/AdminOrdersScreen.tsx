import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  SafeAreaView 
} from 'react-native';
import { ArrowLeft, Filter } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '../../config/theme';
import { OrderCardCompact } from '../../components/common/OrderCardCompact';
import { listenAllOrders, listenCanteens } from '../../services/firestoreService';
import type { Order, Canteen } from '../../models/types';

interface AdminOrdersScreenProps {
  navigation: any;
}

export const AdminOrdersScreen: React.FC<AdminOrdersScreenProps> = ({ navigation }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [canteens, setCanteens] = useState<Canteen[]>([]);
  const [selectedCanteenId, setSelectedCanteenId] = useState<string>('all');

  useEffect(() => {
    const unsubOrders = listenAllOrders((list) => setOrders(list));
    const unsubCanteens = listenCanteens((list) => setCanteens(list));
    return () => {
      unsubOrders();
      unsubCanteens();
    };
  }, []);

  const filteredOrders = useMemo(() => {
    if (selectedCanteenId === 'all') return orders;
    return orders.filter((o) => o.canteen_id === selectedCanteenId);
  }, [orders, selectedCanteenId]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Campus-Wide Orders Feed</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* Canteen Filter Chips */}
      <View style={styles.chipsBar}>
        <TouchableOpacity 
          style={[styles.chip, selectedCanteenId === 'all' && styles.activeChip]}
          onPress={() => setSelectedCanteenId('all')}
        >
          <Text style={[styles.chipText, selectedCanteenId === 'all' && styles.activeChipText]}>
            All Canteens ({orders.length})
          </Text>
        </TouchableOpacity>

        {canteens.map((c) => {
          const isSelected = selectedCanteenId === c.canteen_id;
          return (
            <TouchableOpacity
              key={c.canteen_id}
              style={[styles.chip, isSelected && styles.activeChip]}
              onPress={() => setSelectedCanteenId(c.canteen_id)}
            >
              <Text style={[styles.chipText, isSelected && styles.activeChipText]} numberOfLines={1}>
                {c.name.split('—')[0]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={filteredOrders}
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
  chipsBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.md,
    backgroundColor: colors.surface,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: borderRadius.round,
    backgroundColor: colors.surfaceAlt,
  },
  activeChip: {
    backgroundColor: colors.primary,
  },
  chipText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  activeChipText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
    padding: spacing.lg,
  },
});

