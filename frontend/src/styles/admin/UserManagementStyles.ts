import { StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../../config/theme';

export const styles = StyleSheet.create({
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
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: borderRadius.round,
    backgroundColor: colors.surfaceAlt,
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  userCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  userEmail: {
    fontSize: 11,
    color: colors.textMuted,
  },
  roleBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  roleBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  metaRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  metaLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  metaValue: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});