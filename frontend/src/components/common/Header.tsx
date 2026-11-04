import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ShoppingBag, User as UserIcon, Heart, Utensils } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '../../config/theme';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  role?: string;
  cartItemCount?: number;
  favouritesCount?: number;
  onPressProfile?: () => void;
  onPressCart?: () => void;
  onPressFavourites?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title = 'MU CANTEEN',
  subtitle = 'Marwadi University',
  role = 'Student',
  cartItemCount = 0,
  favouritesCount = 0,
  onPressProfile,
  onPressCart,
  onPressFavourites,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.leftContainer}>
        <View style={styles.logoBadgeContainer}>
          <View style={styles.logoBox}>
            <Utensils size={16} color="#FFFFFF" />
          </View>
          <View style={styles.textContainer}>
            <View style={styles.brandingRow}>
              <Text style={styles.titleText}>{title}</Text>
              {role ? (
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>{role.toUpperCase()}</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.subtitleText} numberOfLines={1}>
              {subtitle}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.rightContainer}>
        {onPressFavourites && (
          <TouchableOpacity 
            style={styles.iconButton} 
            onPress={onPressFavourites}
            activeOpacity={0.7}
            accessibilityLabel="Favourites"
          >
            <Heart size={20} color={favouritesCount > 0 ? colors.accentOrange : colors.textPrimary} fill={favouritesCount > 0 ? colors.accentOrange : 'none'} />
            {favouritesCount > 0 && (
              <View style={[styles.badge, styles.favBadge]}>
                <Text style={styles.badgeText}>
                  {favouritesCount > 9 ? '9+' : favouritesCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        {onPressCart && (
          <TouchableOpacity 
            style={styles.iconButton} 
            onPress={onPressCart}
            activeOpacity={0.7}
            accessibilityLabel="Shopping Cart"
          >
            <ShoppingBag size={20} color={colors.textPrimary} />
            {cartItemCount > 0 && (
              <View style={[styles.badge, styles.cartBadge]}>
                <Text style={styles.badgeText}>
                  {cartItemCount > 9 ? '9+' : cartItemCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        {onPressProfile && (
          <TouchableOpacity 
            style={[styles.iconButton, styles.profileButton]} 
            onPress={onPressProfile}
            activeOpacity={0.7}
            accessibilityLabel="User Profile"
          >
            <UserIcon size={19} color={colors.primaryDark} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
