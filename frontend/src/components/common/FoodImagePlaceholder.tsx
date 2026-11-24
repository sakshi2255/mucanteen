import React from 'react';
import { View, Text } from 'react-native';
import { 
  Utensils, 
  Coffee, 
  Pizza, 
  Soup, 
  Sandwich, 
  Flame, 
  Cookie,
  Apple
} from 'lucide-react-native';
import { colors } from '../../config/theme';
import { styles } from '../../styles/comman/FoodImagePlaceholderStyles';

interface FoodImagePlaceholderProps {
  placeholderKey: string;
  isVeg?: boolean;
  size?: 'small' | 'medium' | 'large';
  style?: object;
}

export const FoodImagePlaceholder: React.FC<FoodImagePlaceholderProps> = ({
  placeholderKey,
  isVeg = true,
  size = 'medium',
  style,
}) => {
  // Determine placeholder style and icon based on food type
  const getIconAndBg = () => {
    switch (placeholderKey.toLowerCase()) {
      case 'chai':
      case 'coldcoffee':
      case 'coffee':
        return {
          icon: <Coffee size={size === 'small' ? 22 : 36} color="#B45309" />,
          bgColor: '#FEF3C7',
          tag: 'Beverage',
        };
      case 'dosa':
      case 'idli':
      case 'south-indian':
        return {
          icon: <Soup size={size === 'small' ? 22 : 36} color="#047857" />,
          bgColor: '#ECFDF5',
          tag: 'South Indian',
        };
      case 'thali':
      case 'biryani':
        return {
          icon: <Utensils size={size === 'small' ? 22 : 36} color="#B91C1C" />,
          bgColor: '#FEE2E2',
          tag: 'Meal',
        };
      case 'pizza':
        return {
          icon: <Pizza size={size === 'small' ? 22 : 36} color="#C2410C" />,
          bgColor: '#FFEDD5',
          tag: 'Pizza',
        };
      case 'sandwich':
      case 'burger':
        return {
          icon: <Sandwich size={size === 'small' ? 22 : 36} color="#A16207" />,
          bgColor: '#FEF9C3',
          tag: 'Fast Food',
        };
      case 'samosa':
      case 'vadapav':
        return {
          icon: <Flame size={size === 'small' ? 22 : 36} color="#EA580C" />,
          bgColor: '#FFF7ED',
          tag: 'Snack',
        };
      default:
        return {
          icon: <Utensils size={size === 'small' ? 22 : 36} color={colors.primary} />,
          bgColor: colors.primaryLight,
          tag: 'MU Canteen',
        };
    }
  };

  const { icon, bgColor, tag } = getIconAndBg();

  const containerSizes = {
    small: { height: 75, width: 75 },
    medium: { height: 110, width: '100%' as const },
    large: { height: 160, width: '100%' as const },
  };

  return (
    <View style={[styles.container, containerSizes[size], { backgroundColor: bgColor }, style]}>
      {/* Pure Veg / Non-Veg Indicator Badge */}
      <View style={styles.vegIndicatorBadge}>
        <View style={[styles.vegOuter, { borderColor: isVeg ? colors.vegColor : colors.nonVegColor }]}>
          <View style={[styles.vegInnerDot, { backgroundColor: isVeg ? colors.vegColor : colors.nonVegColor }]} />
        </View>
      </View>

      {/* Main Vector Food Icon */}
      <View style={styles.iconWrapper}>
        {icon}
      </View>

      {/* Subtle Tag */}
      {size !== 'small' && (
        <View style={styles.tagBadge}>
          <Text style={styles.tagText}>{tag}</Text>
        </View>
      )}
    </View>
  );
};

