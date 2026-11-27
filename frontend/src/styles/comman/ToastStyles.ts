import { StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../../config/theme';

export const styles = StyleSheet.create({
  toastOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 9999,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderRadius: borderRadius.md,
    borderLeftWidth: 4,
    backgroundColor: colors.surface,
    ...shadows.lg,
  },
  toastSuccess: {
    borderLeftColor: colors.accentGreen,
    backgroundColor: '#ECFDF5',
  },
  toastError: {
    borderLeftColor: colors.accentRed,
    backgroundColor: '#FEF2F2',
  },
  toastInfo: {
    borderLeftColor: colors.primary,
    backgroundColor: '#F0FDFA',
  },
  iconWrap: {
    marginRight: spacing.sm,
  },
  textCol: {
    flex: 1,
  },
  toastTitle: {
    fontSize: 13,
    fontWeight: typography.fontWeights.heavy,
    color: colors.textPrimary,
  },
  toastMessage: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
    marginLeft: spacing.sm,
  },
});