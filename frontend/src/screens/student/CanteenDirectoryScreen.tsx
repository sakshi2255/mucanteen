import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  TouchableOpacity,
  SafeAreaView 
} from 'react-native';
import { Search, ArrowLeft, Building2 } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '../../config/theme';
import { CanteenCard } from '../../components/common/CanteenCard';
import { useAuth } from '../../context/AuthContext';
import { listenCanteens } from '../../services/firestoreService';
import type { Canteen } from '../../models/types';

interface CanteenDirectoryScreenProps {
  navigation: any;
}

export const CanteenDirectoryScreen: React.FC<CanteenDirectoryScreenProps> = ({ navigation }) => {
  const { role } = useAuth();
  const [canteens, setCanteens] = useState<Canteen[]>([]);
  const [search, setSearch] = useState('');
  const [selectedBldg, setSelectedBldg] = useState<string>('all');

  useEffect(() => {
    const unsub = listenCanteens((data) => setCanteens(data));
    return unsub;
  }, []);

  const filteredCanteens = useMemo(() => {
    return canteens.filter((c) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches = c.name.toLowerCase().includes(q) || c.canteen_id.toLowerCase().includes(q);
        if (!matches) return false;
      }

      if (selectedBldg !== 'all' && c.building_id !== selectedBldg) {
        return false;
      }

      return true;
    });
  }, [canteens, search, selectedBldg]);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Bar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Campus Canteen Directory</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Search */}
        <View style={styles.searchBar}>
          <Search size={18} color={colors.textSecondary} style={{ marginRight: spacing.sm }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search canteens by floor, building or name..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Building Filter Tabs */}
        <View style={styles.buildingTabsRow}>
          <TouchableOpacity 
            style={[styles.tab, selectedBldg === 'all' && styles.activeTab]}
            onPress={() => setSelectedBldg('all')}
          >
            <Text style={[styles.tabText, selectedBldg === 'all' && styles.activeTabText]}>
              All ({canteens.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tab, selectedBldg === 'bldg-main' && styles.activeTab]}
            onPress={() => setSelectedBldg('bldg-main')}
          >
            <Text style={[styles.tabText, selectedBldg === 'bldg-main' && styles.activeTabText]}>
              Main Building (F1–F6)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tab, selectedBldg === 'bldg-law' && styles.activeTab]}
            onPress={() => setSelectedBldg('bldg-law')}
          >
            <Text style={[styles.tabText, selectedBldg === 'bldg-law' && styles.activeTabText]}>
              Law Bldg
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tab, selectedBldg === 'bldg-hostel' && styles.activeTab]}
            onPress={() => setSelectedBldg('bldg-hostel')}
          >
            <Text style={[styles.tabText, selectedBldg === 'bldg-hostel' && styles.activeTabText]}>
              Hostel Mess
            </Text>
          </TouchableOpacity>
        </View>

        {/* Canteen Cards List */}
        <View style={styles.list}>
          {filteredCanteens.map((canteen) => (
            <CanteenCard
              key={canteen.canteen_id}
              canteen={canteen}
              userRole={role}
              onPress={(c) => {
                if (c.canteen_type === 'faculty_only' && role !== 'faculty' && role !== 'admin') {
                  alert('Faculty Only: Access to this dining hall is restricted to university faculty.');
                  return;
                }
                navigation.navigate('CanteenMenu', { canteen: c });
              }}
            />
          ))}
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
  backButton: {
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSizes.xs,
    color: colors.textPrimary,
  },
  buildingTabsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: spacing.lg,
  },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.round,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeTab: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  tabText: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  list: {
    gap: spacing.sm,
  },
});

