import { StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../../config/theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.xl,
    justifyContent: 'center',
    flexGrow: 1,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.md,
  },
  brandTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.heavy,
    color: colors.primaryDark,
    marginTop: spacing.md,
  },
  brandSubtitle: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.md,
  },
  roleTabs: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.md,
    padding: 3,
    marginBottom: spacing.lg,
  },
  roleTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  activeRoleTab: {
    backgroundColor: colors.primary,
  },
  roleTabText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.textSecondary,
  },
  activeRoleTabText: {
    color: '#FFFFFF',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    height: 48,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.fontSizes.sm,
  },
  signUpButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
    ...shadows.sm,
  },
  signUpButtonText: {
    color: '#FFFFFF',
    fontWeight: typography.fontWeights.bold,
    fontSize: typography.fontSizes.base,
    letterSpacing: 0.5,
  },
  loginLink: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  loginPrompt: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
  },
  loginHighlight: {
    color: colors.primary,
    fontWeight: typography.fontWeights.bold,
  },
});
