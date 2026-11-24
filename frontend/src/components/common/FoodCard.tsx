import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Plus, Minus } from 'lucide-react-native';
import { FoodImagePlaceholder } from './FoodImagePlaceholder';
import type { MenuItem } from '../../models/types';
import { styles } from '../../styles/comman/FoodCardStyles';

interface FoodCardProps {
  item: MenuItem;
  quantityInCart: number;
  onAddToCart: (item: MenuItem) => void;
  onRemoveFromCart: (item: MenuItem) => void;
  style?: object;
}

export const FoodCard: React.FC<FoodCardProps> = ({
  item,
  quantityInCart,
  onAddToCart,
  onRemoveFromCart,
  style,
}) => {
  const isAvailable = item.is_available;

  return (
    <View style={[styles.card, style]}>
      <View style={styles.imageSection}>
        <FoodImagePlaceholder
          placeholderKey={item.placeholder_key}
          isVeg={item.is_veg}
          size="medium"
        />
        <View style={styles.vegIndicatorBadge}>
          <View style={[styles.vegOuter, item.is_veg ? styles.vegOuterGreen : styles.vegOuterRed]}>
            <View style={[styles.vegInnerDot, item.is_veg ? styles.vegInnerGreen : styles.vegInnerRed]} />
          </View>
        </View>
        {!isAvailable && (
          <View style={styles.soldOutOverlay}>
            <Text style={styles.soldOutText}>SOLD OUT</Text>
          </View>
        )}
      </View>

      <View style={styles.detailsContainer}>
        <View>
          <Text style={styles.itemName} numberOfLines={2}>{item.item_name}</Text>
          {item.ingredients && (
            <Text style={styles.ingredientsText} numberOfLines={1}>
              {item.ingredients}
            </Text>
          )}
        </View>

        <View style={styles.bottomRow}>
          <Text style={styles.priceText}>₹{item.price}</Text>

          {isAvailable ? (
            quantityInCart > 0 ? (
              <View style={styles.stepperContainer}>
                <TouchableOpacity style={styles.stepperButton} onPress={() => onRemoveFromCart(item)} activeOpacity={0.7}>
                  <Minus size={14} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.stepperQuantity}>{quantityInCart}</Text>
                <TouchableOpacity style={styles.stepperButton} onPress={() => onAddToCart(item)} activeOpacity={0.7}>
                  <Plus size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.addButton} onPress={() => onAddToCart(item)} activeOpacity={0.8}>
                <Text style={styles.addButtonText}>ADD</Text>
              </TouchableOpacity>
            )
          ) : (
            <View style={styles.unavailableBadge}>
              <Text style={styles.unavailableText}>Unavailable</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};