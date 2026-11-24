import { StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../../config/theme';

export const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  imageSection: {
    width: '100%',
    height: 110,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: colors.backgroundSoft,
    marginBottom: spacing.sm,
    position: 'relative',
  },
  vegIndicatorBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 2,
    borderRadius: 4,
    zIndex: 10,
  },
  vegOuter: {
    width: 12,
    height: 12,
    borderWidth: 1.5,
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vegInnerDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  soldOutOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  soldOutText: {
    color: colors.accentRed,
    fontWeight: typography.fontWeights.heavy,
    fontSize: 11,
    letterSpacing: 0.5,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
 

vegOuterGreen: { borderColor: colors.vegColor },
  vegOuterRed: { borderColor: colors.nonVegColor },
  vegInnerGreen: { backgroundColor: colors.vegColor },
  vegInnerRed: { backgroundColor: colors.nonVegColor },
  detailsContainer: { flex: 1, padding: spacing.sm, justifyContent: 'space-between' },



  itemName: {
    fontSize: 14,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
    lineHeight: 18,
    marginBottom: 2,
  },
  ingredientsText: {
    fontSize: 10,
    color: colors.textMuted,
    marginBottom: 6,
    fontStyle: 'italic',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  priceText: {
    fontSize: 14,
    fontWeight: typography.fontWeights.heavy,
    color: colors.primaryDark,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: 8,
    height: 30,
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: typography.fontWeights.bold,
    color: colors.primaryDark,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    height: 30,
    paddingHorizontal: 4,
    minWidth: 65,
  },
  stepperButton: {
    padding: 4,
  },
  stepperQuantity: {
    fontSize: 13,
    fontWeight: typography.fontWeights.heavy,
    color: '#FFFFFF',
  },
  unavailableBadge: {
    backgroundColor: colors.backgroundSoft,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: 8,
    height: 30,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unavailableText: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: typography.fontWeights.bold,
  },
});