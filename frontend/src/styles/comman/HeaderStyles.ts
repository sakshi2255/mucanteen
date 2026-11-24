import { StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../config/theme';

export const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  leftContainer: {
    flex: 1,
  },
  logoBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBox: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  textContainer: {
    flex: 1,
  },
  brandingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleText: {
    fontSize: 16,
    fontWeight: typography.fontWeights.heavy,
    color: colors.primaryDark,
    letterSpacing: 0.5,
  },
  roleBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.xs,
  },
  roleBadgeText: {
    fontSize: 9,
    fontWeight: typography.fontWeights.bold,
    color: colors.primaryDark,
  },
  subtitleText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: typography.fontWeights.medium,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconButton: {
    position: 'relative',
    width: 38,
    height: 38,
    borderRadius: borderRadius.full,
    backgroundColor: colors.backgroundSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileButton: {
    backgroundColor: colors.primaryLight,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  cartBadge: {
    backgroundColor: colors.accentOrange,
  },
  favBadge: {
    backgroundColor: colors.accentYellow,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: typography.fontWeights.heavy,
  },
});
