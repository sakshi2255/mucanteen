import { StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../config/theme';

export const styles = StyleSheet.create({
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
