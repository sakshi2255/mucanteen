import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Plus, Minus } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../../config/theme';
import { FoodImagePlaceholder } from './FoodImagePlaceholder';
import type { MenuItem } from '../../models/types';

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
      {/* Food Image Placeholder */}
      <View style={styles.imageContainer}>
        <FoodImagePlaceholder 
          placeholderKey={item.placeholder_key} 
          isVeg={item.is_veg}
          size="medium"
        />
        {!isAvailable && (
          <View style={styles.soldOutOverlay}>
            <Text style={styles.soldOutText}>SOLD OUT</Text>
          </View>
        )}
      </View>

      {/* Details */}
      <View style={styles.content}>
        <Text style={styles.itemName} numberOfLines={2}>
          {item.item_name}
        </Text>

        <Text style={styles.description} numberOfLines={1}>
          {item.description}
        </Text>

        <View style={styles.footerRow}>
          <Text style={styles.priceText}>
            ₹{item.price}
          </Text>

          {/* ADD / Quantity Stepper Button */}
          {isAvailable ? (
            quantityInCart > 0 ? (
              <View style={styles.stepperContainer}>
                <TouchableOpacity 
                  style={styles.stepperButton}
                  onPress={() => onRemoveFromCart(item)}
                  activeOpacity={0.7}
                >
                  <Minus size={14} color="#FFFFFF" />
                </TouchableOpacity>

                <Text style={styles.stepperQuantity}>{quantityInCart}</Text>

                <TouchableOpacity 
                  style={styles.stepperButton}
                  onPress={() => onAddToCart(item)}
                  activeOpacity={0.7}
                >
                  <Plus size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => onAddToCart(item)}
                activeOpacity={0.8}
              >
                <Text style={styles.addButtonText}>ADD</Text>
                <Plus size={13} color={colors.primary} />
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

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xs,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  soldOutOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  soldOutText: {
    color: '#FFFFFF',
    fontWeight: typography.fontWeights.heavy,
    fontSize: typography.fontSizes.xs,
    letterSpacing: 1,
  },
  content: {
    padding: spacing.xs,
    paddingTop: spacing.sm,
  },
  itemName: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
    lineHeight: 18,
  },
  description: {
    fontSize: typography.fontSizes.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  priceText: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.heavy,
    color: colors.textPrimary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    gap: 3,
  },
  addButtonText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.primary,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    paddingVertical: 2,
    paddingHorizontal: 4,
    gap: 6,
  },
  stepperButton: {
    padding: 3,
  },
  stepperQuantity: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.heavy,
    color: '#FFFFFF',
    minWidth: 16,
    textAlign: 'center',
  },
  unavailableBadge: {
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: borderRadius.xs,
  },
  unavailableText: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: typography.fontWeights.medium,
  },
});
