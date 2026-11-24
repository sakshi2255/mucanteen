// Frontend/src/styles/globalStyles.ts
import { StyleSheet, Platform } from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../../config/theme';

export const globalStyles = StyleSheet.create({
  // Base Layouts
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  screenContainer: {
    flex: 1,
    backgroundColor: colors.backgroundSoft,
  },
  scrollContentPadding: {
    padding: spacing.lg,
    paddingBottom: 120, // Extra padding for floating bottom bars
  },

  // Swiggy-Style Cards
  surfaceCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  compactCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },

  // Typography (Larger & More Readable)
  headingH1: {
    fontSize: 22,
    fontWeight: typography.fontWeights.heavy,
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  headingH2: {
    fontSize: 18,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: typography.fontWeights.heavy,
    color: colors.textPrimary,
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  bodyText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  mutedText: {
    fontSize: 12,
    color: colors.textMuted,
  },

  // Flexbox Utilities
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  // Floating Bottom Actions (Like Swiggy's "View Cart")
  stickyBottomBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? spacing.xl : spacing.lg,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.primaryDark,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shadows.md,
  },
  
  // Dividers
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.md,
  }
});