import { StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../config/theme';

export const styles = StyleSheet.create({
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
