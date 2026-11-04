import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Store, MapPin, Clock, ShieldAlert } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '../../config/theme';
import type { Canteen } from '../../models/types';

interface CanteenCardProps {
  canteen: Canteen;
  onPress: (canteen: Canteen) => void;
  userRole?: string;
  isFavourite?: boolean;
  onToggleFavourite?: (canteenId: string) => void;
  compactGrid?: boolean;
}

export const CanteenCard: React.FC<CanteenCardProps> = ({
  canteen,
  onPress,
  userRole = 'student',
  compactGrid = true,
}) => {
  const isFacultyOnly = canteen.canteen_type === 'faculty_only';
  const isEligible = !isFacultyOnly || userRole === 'faculty' || userRole === 'admin';

  const buildingName = canteen.building_id.includes('law') 
    ? 'Law Building' 
    : canteen.building_id.includes('hostel') 
    ? 'Hostel Mess' 
    : 'Main Building';

  const shortCode = canteen.token_prefix 
    ? `C${canteen.floor || 1} • [${canteen.token_prefix}]`
    : `C${canteen.floor || 1}`;

  return (
    <TouchableOpacity
      style={[
        styles.gridCard,
        !isEligible && styles.ineligibleCard,
        !canteen.is_open && styles.closedCard,
      ]}
      onPress={() => onPress(canteen)}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`${canteen.name}, ${canteen.is_open ? 'Open' : 'Closed'}`}
    >
      {/* Top Header: Badge & Status */}
      <View style={styles.topRow}>
        <View style={styles.prefixBadge}>
          <Text style={styles.prefixText}>{shortCode}</Text>
        </View>
        <View style={[styles.statusBadge, canteen.is_open ? styles.openBadge : styles.closedBadge]}>
          <View style={[styles.statusDot, canteen.is_open ? styles.openDot : styles.closedDot]} />
          <Text style={[styles.statusText, canteen.is_open ? styles.openText : styles.closedText]}>
            {canteen.is_open ? 'OPEN' : 'CLOSED'}
          </Text>
        </View>
      </View>

      {/* Main Icon & Title */}
      <View style={styles.centerSection}>
        <View style={styles.iconCircle}>
          <Store size={22} color={colors.primary} />
        </View>
        <Text style={styles.canteenName} numberOfLines={2}>
          {canteen.name}
        </Text>
      </View>

      {/* Location & Restriction */}
      <View style={styles.bottomSection}>
        <View style={styles.locationRow}>
          <MapPin size={11} color={colors.textSecondary} />
          <Text style={styles.locationText} numberOfLines={1}>
            {buildingName} • Fl {canteen.floor}
          </Text>
        </View>

        {isFacultyOnly ? (
          <View style={styles.facultyBadge}>
            <ShieldAlert size={10} color="#B45309" />
            <Text style={styles.facultyBadgeText}>FACULTY ONLY</Text>
          </View>
        ) : (
          <View style={styles.hoursRow}>
            <Clock size={10} color={colors.textMuted} />
            <Text style={styles.hoursText} numberOfLines={1}>
              {canteen.operating_hours || '08:00 - 18:00'}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  gridCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    padding: spacing.sm + 2,
    justifyContent: 'space-between',
    minHeight: 155,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  ineligibleCard: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  closedCard: {
    opacity: 0.82,
    backgroundColor: '#F9FAFB',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  prefixBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  prefixText: {
    fontSize: 10,
    fontWeight: typography.fontWeights.heavy,
    color: colors.primaryDark,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  openBadge: {
    backgroundColor: '#ECFDF5',
  },
  closedBadge: {
    backgroundColor: '#FEF2F2',
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  openDot: {
    backgroundColor: colors.accentGreen,
  },
  closedDot: {
    backgroundColor: colors.accentRed,
  },
  statusText: {
    fontSize: 9,
    fontWeight: typography.fontWeights.heavy,
    letterSpacing: 0.4,
  },
  openText: {
    color: colors.accentGreen,
  },
  closedText: {
    color: colors.accentRed,
  },
  centerSection: {
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: colors.backgroundSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  canteenName: {
    fontSize: 13,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 16,
    minHeight: 32,
  },
  bottomSection: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: 6,
    gap: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  locationText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: typography.fontWeights.medium,
  },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  hoursText: {
    fontSize: 9,
    color: colors.textMuted,
  },
  facultyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    gap: 3,
  },
  facultyBadgeText: {
    fontSize: 8,
    fontWeight: typography.fontWeights.heavy,
    color: '#B45309',
  },
});
