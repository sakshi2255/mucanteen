import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Switch, 
  SafeAreaView 
} from 'react-native';
import { ArrowLeft, Store, MapPin, Clock } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../../config/theme';
import { useAuth } from '../../context/AuthContext';
import { listenCanteens, toggleCanteenStatus } from '../../services/firestoreService';
import type { Canteen } from '../../models/types';

interface CanteenManagementScreenProps {
  navigation: any;
}

export const CanteenManagementScreen: React.FC<CanteenManagementScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [canteens, setCanteens] = useState<Canteen[]>([]);

  useEffect(() => {
    const unsub = listenCanteens((list) => setCanteens(list));
    return unsub;
  }, []);

  const handleToggle = async (canteenId: string, currentOpen: boolean) => {
    await toggleCanteenStatus(
      canteenId,
      !currentOpen,
      { id: user?.user_id || 'admin', name: user?.name || 'Administrator', role: 'admin' }
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Campus Canteens Management</Text>
        <View style={{ width: 22 }} />
      </View>

      <FlatList
        data={canteens}
        keyExtractor={(item) => item.canteen_id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.canteenCard}>
            <View style={styles.cardHeader}>
              <View style={styles.titleArea}>
                <Text style={styles.name}>{item.name}</Text>
                <View style={styles.metaRow}>
                  <MapPin size={12} color={colors.textSecondary} />
                  <Text style={styles.metaText}>
                    Floor {item.floor === 0 ? 'Ground' : item.floor} • {item.building_id}
                  </Text>
                </View>
                <View style={styles.metaRow}>
                  <Clock size={12} color={colors.textSecondary} />
                  <Text style={styles.metaText}>{item.operating_hours}</Text>
                </View>
              </View>

              <View style={styles.toggleCol}>
                <Text style={[styles.statusText, item.is_open ? styles.openText : styles.closedText]}>
                  {item.is_open ? 'OPEN' : 'CLOSED'}
                </Text>
                <Switch
                  value={item.is_open}
                  onValueChange={() => handleToggle(item.canteen_id, item.is_open)}
                  trackColor={{ false: '#FECACA', true: '#A7F3D0' }}
                  thumbColor={item.is_open ? colors.accentGreen : '#EF4444'}
                />
              </View>
            </View>

            <View style={styles.footerRow}>
              <Text style={styles.typeTag}>Type: {item.canteen_type.replace('_', ' ').toUpperCase()}</Text>
              <Text style={styles.modeTag}>Mode: {item.acceptance_mode.toUpperCase()}</Text>
            </View>
          </View>
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
  listContent: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  canteenCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleArea: {
    flex: 1,
    marginRight: spacing.sm,
  },
  name: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  metaText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  toggleCol: {
    alignItems: 'center',
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
    marginBottom: 2,
  },
  openText: {
    color: colors.accentGreen,
  },
  closedText: {
    color: colors.accentRed,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  typeTag: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  modeTag: {
    fontSize: 10,
    color: colors.textSecondary,
  },
});

