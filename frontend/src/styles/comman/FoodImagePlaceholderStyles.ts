import { StyleSheet } from 'react-native';
import { colors, borderRadius } from '../../config/theme';

export const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  iconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  vegIndicatorBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    zIndex: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
    padding: 2,
    elevation: 2,
  },
  vegOuter: {
    width: 14,
    height: 14,
    borderWidth: 1.5,
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vegInnerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tagBadge: {
    position: 'absolute',
    bottom: 5,
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.3,
  },
});
