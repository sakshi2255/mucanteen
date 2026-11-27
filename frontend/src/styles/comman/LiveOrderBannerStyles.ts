import { StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../../config/theme';

export const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    marginBottom: 8,
    marginTop: 2,
    backgroundColor: '#0cb6bc',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#076468',
    borderLeftWidth: 4,
    ...shadows.lg,
  },
  infoCol: {
    flex: 1,
    marginLeft: spacing.sm,
    marginRight: spacing.xs,
  },
  multiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  orderIndexBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  orderIndexText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
  statusText: {
    fontSize: 13,
    fontWeight: typography.fontWeights.heavy,
    color: '#ffffff',
    marginBottom: 2,
  },
  canteenText: {
    fontSize: 11,
    color: '#f4f3f3',
    fontWeight: '500',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  activeDot: {
    width: 14,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#ffffff',
  },
  actionsCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  navArrowBtn: {
    padding: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
  },
  trackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  trackBtnText: {
    fontSize: 11,
    fontWeight: typography.fontWeights.bold,
    color: colors.primaryDark,
  },
});