import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Check, Sparkles, Clock, Building as BuildingIcon } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '../../config/theme';

interface FilterChipsProps {
  pureVegOnly: boolean;
  onTogglePureVeg: () => void;
  availableNowOnly: boolean;
  onToggleAvailableNow: () => void;
  selectedBuilding: string | null;
  onSelectBuilding: (building: string | null) => void;
  maxPrice: number | null;
  onSelectMaxPrice: (price: number | null) => void;
}

export const FilterChips: React.FC<FilterChipsProps> = ({
  pureVegOnly,
  onTogglePureVeg,
  availableNowOnly,
  onToggleAvailableNow,
  selectedBuilding,
  onSelectBuilding,
  maxPrice,
  onSelectMaxPrice,
}) => {
  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Pure Veg Toggle */}
        <TouchableOpacity 
          style={[styles.chip, pureVegOnly && styles.activeVegChip]}
          onPress={onTogglePureVeg}
          activeOpacity={0.7}
        >
          <View style={[styles.vegSquare, pureVegOnly && styles.vegSquareActive]}>
            <View style={[styles.vegDot, pureVegOnly && styles.vegDotActive]} />
          </View>
          <Text style={[styles.chipText, pureVegOnly && styles.activeChipText]}>
            Pure Veg
          </Text>
          {pureVegOnly && <Check size={12} color={colors.vegColor} style={{ marginLeft: 2 }} />}
        </TouchableOpacity>

        {/* Available Now */}
        <TouchableOpacity 
          style={[styles.chip, availableNowOnly && styles.activeChip]}
          onPress={onToggleAvailableNow}
          activeOpacity={0.7}
        >
          <Clock size={13} color={availableNowOnly ? colors.primaryDark : colors.textSecondary} />
          <Text style={[styles.chipText, availableNowOnly && styles.activeChipText]}>
            Available Now
          </Text>
        </TouchableOpacity>

        {/* Main Building Filter */}
        <TouchableOpacity 
          style={[styles.chip, selectedBuilding === 'bldg-main' && styles.activeChip]}
          onPress={() => onSelectBuilding(selectedBuilding === 'bldg-main' ? null : 'bldg-main')}
          activeOpacity={0.7}
        >
          <BuildingIcon size={13} color={selectedBuilding === 'bldg-main' ? colors.primaryDark : colors.textSecondary} />
          <Text style={[styles.chipText, selectedBuilding === 'bldg-main' && styles.activeChipText]}>
            Main Bldg
          </Text>
        </TouchableOpacity>

        {/* Law Building Filter */}
        <TouchableOpacity 
          style={[styles.chip, selectedBuilding === 'bldg-law' && styles.activeChip]}
          onPress={() => onSelectBuilding(selectedBuilding === 'bldg-law' ? null : 'bldg-law')}
          activeOpacity={0.7}
        >
          <Text style={[styles.chipText, selectedBuilding === 'bldg-law' && styles.activeChipText]}>
            Law Bldg
          </Text>
        </TouchableOpacity>

        {/* Price Under ₹50 */}
        <TouchableOpacity 
          style={[styles.chip, maxPrice === 50 && styles.activeChip]}
          onPress={() => onSelectMaxPrice(maxPrice === 50 ? null : 50)}
          activeOpacity={0.7}
        >
          <Text style={[styles.chipText, maxPrice === 50 && styles.activeChipText]}>
            Under ₹50
          </Text>
        </TouchableOpacity>

        {/* Price Under ₹100 */}
        <TouchableOpacity 
          style={[styles.chip, maxPrice === 100 && styles.activeChip]}
          onPress={() => onSelectMaxPrice(maxPrice === 100 ? null : 100)}
          activeOpacity={0.7}
        >
          <Text style={[styles.chipText, maxPrice === 100 && styles.activeChipText]}>
            Under ₹100
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: borderRadius.round,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 5,
  },
  activeChip: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  activeVegChip: {
    backgroundColor: '#ECFDF5',
    borderColor: colors.vegColor,
  },
  chipText: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeights.medium,
  },
  activeChipText: {
    color: colors.primaryDark,
    fontWeight: typography.fontWeights.bold,
  },
  vegSquare: {
    width: 12,
    height: 12,
    borderWidth: 1.2,
    borderColor: colors.textMuted,
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vegSquareActive: {
    borderColor: colors.vegColor,
  },
  vegDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.textMuted,
  },
  vegDotActive: {
    backgroundColor: colors.vegColor,
  },
});

