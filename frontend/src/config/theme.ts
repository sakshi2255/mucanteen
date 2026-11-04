export const colors = {
  // Official Marwadi University & Food-Oriented Palette
  primary: '#079FA7',        // Primary Teal
  primaryDark: '#087B82',    // Deep Teal
  primaryLight: '#E6F6F7',   // Soft Teal surface tint
  primarySubtle: '#B2E5E8',  // Light Teal border
  
  // Accents (Playful Food Aesthetics)
  accentOrange: '#FF9B54',   // Warm Orange for offers & badges
  accentYellow: '#FFD166',   // Mustard Yellow for discounts & ratings
  accentAmber: '#F59E0B',    // Amber for In Queue & preparing states
  accentGreen: '#2E9D70',    // Success Green (Pure Veg & Completed)
  accentRed: '#D9534F',      // Error Red (Sold Out & Cancelled)
  
  // Neutrals
  background: '#F6F8FA',     // Soft clean background
  backgroundSoft: '#F6F8FA', // Soft grey background alias
  surface: '#FFFFFF',        // Card & container white
  surfaceAlt: '#EFF2F5',     // Soft grey surface
  border: '#E2E8F0',         // Subtle card border
  borderLight: '#EDF2F7',    // Divider border
  
  // Typography
  textPrimary: '#252B32',    // High-contrast Charcoal
  textSecondary: '#5A6573',  // Slate grey secondary
  textMuted: '#94A3B8',      // Muted placeholder text
  textInverse: '#FFFFFF',    // White text on dark/teal
  
  // Veg / Non-Veg
  vegColor: '#2E9D70',       // Pure Veg Green
  nonVegColor: '#D9534F',    // Non-Veg Red
  
  // Heart / Favourites
  heartColor: '#EF4444',
  
  // Shadows
  shadowColor: '#252B32',
};

export const typography = {
  fontSizes: {
    xxs: 10,
    xs: 12,
    sm: 13,
    base: 15,
    md: 17,
    lg: 19,
    xl: 22,
    xxl: 26,
    huge: 32,
  },
  fontWeights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    heavy: '800' as const,
  },
};

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  huge: 32,
};

export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 9999,
  full: 9999,
};

export const shadows = {
  none: {},
  sm: {
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 6,
    elevation: 8,
  },
};

export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
};

export default theme;
