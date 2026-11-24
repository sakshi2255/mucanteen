import { StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../../config/theme';

export const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    backgroundColor: '#0F172A',
    borderRadius: borderRadius.round,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    gap: 8,
    ...shadows.lg,
    zIndex: 99,
  },
  floatingButtonText: {
    color: '#FFFFFF',
    fontWeight: typography.fontWeights.heavy,
    fontSize: typography.fontSizes.xs,
    letterSpacing: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 24,
  },
  sheetContainer: {
    width: '90%',
    maxHeight: '65%',
    backgroundColor: '#1E293B',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.lg,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingBottom: spacing.sm,
  },
  sheetTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  closeButton: {
    padding: 4,
  },
  categoriesList: {
    marginVertical: spacing.xs,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  selectedCategoryItem: {
    backgroundColor: 'rgba(7, 159, 167, 0.15)',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: typography.fontSizes.sm,
    color: '#E2E8F0',
    fontWeight: typography.fontWeights.medium,
  },
  selectedCategoryName: {
    color: '#38BDF8',
    fontWeight: typography.fontWeights.bold,
  },
  countBadge: {
    backgroundColor: '#334155',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.round,
  },
  selectedCountBadge: {
    backgroundColor: colors.primary,
  },
  countText: {
    color: '#94A3B8',
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
  },
  selectedCountText: {
    color: '#FFFFFF',
  },checkIcon: { marginLeft: 6 },
});
