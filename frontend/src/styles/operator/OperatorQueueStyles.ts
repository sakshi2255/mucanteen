import { StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../config/theme';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: typography.fontWeights.heavy,
    color: colors.textPrimary,
  },
  headerSub: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: 6,
  },
  tab: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.backgroundSoft,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  headerSpacer: { width: 22 },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSoft,
  },
  listContent: {
    padding: spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
});
