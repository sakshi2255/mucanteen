import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ShoppingBag, User as UserIcon, Heart, Utensils } from 'lucide-react-native';
import { colors } from '../../config/theme';
import { styles } from '../../styles/comman/HeaderStyles';

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
