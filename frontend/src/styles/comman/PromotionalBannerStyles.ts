import { StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../config/theme';

export const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: typography.fontWeights.heavy,
    color: colors.textSecondary,
    letterSpacing: 0.6,
  },
  counterText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: typography.fontWeights.bold,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  card: {
    width: 250,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    justifyContent: 'space-between',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  tagText: {
    fontSize: 9,
    fontWeight: typography.fontWeights.heavy,
  },
  percentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    gap: 2,
  },
  percentText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: typography.fontWeights.bold,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: typography.fontWeights.heavy,
    color: '#FFFFFF',
    marginVertical: 4,
    lineHeight: 19,
  },
  cardSubtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.88)',
    fontWeight: typography.fontWeights.medium,
    marginBottom: spacing.sm,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  useCodeLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: typography.fontWeights.semibold,
  },
  codePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderStyle: 'dashed',
  },
  codeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: typography.fontWeights.heavy,
    letterSpacing: 0.5,
  },
});
