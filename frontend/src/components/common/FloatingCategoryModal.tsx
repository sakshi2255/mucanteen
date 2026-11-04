import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  TouchableWithoutFeedback,
  ScrollView 
} from 'react-native';
import { Menu, X, Check } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../../config/theme';
import type { MenuCategory } from '../../models/types';

interface FloatingCategoryModalProps {
  categories: MenuCategory[];
  categoryItemCounts: Record<string, number>;
  selectedCategoryId: string;
  onSelectCategory: (categoryId: string) => void;
  visible: boolean;
  onToggleVisible: () => void;
}

export const FloatingCategoryModal: React.FC<FloatingCategoryModalProps> = ({
  categories,
  categoryItemCounts,
  selectedCategoryId,
  onSelectCategory,
  visible,
  onToggleVisible,
}) => {
  return (
    <>
      {/* Floating Action Button at Bottom-Right */}
      <TouchableOpacity 
        style={styles.floatingButton}
        onPress={onToggleVisible}
        activeOpacity={0.85}
      >
        <Menu size={18} color="#FFFFFF" />
        <Text style={styles.floatingButtonText}>MENU</Text>
      </TouchableOpacity>

      {/* Bottom Sheet Modal */}
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onToggleVisible}
      >
        <TouchableWithoutFeedback onPress={onToggleVisible}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.sheetContainer}>
                {/* Header */}
                <View style={styles.sheetHeader}>
                  <Text style={styles.sheetTitle}>Browse Categories</Text>
                  <TouchableOpacity onPress={onToggleVisible} style={styles.closeButton}>
                    <X size={18} color="#94A3B8" />
                  </TouchableOpacity>
                </View>

                {/* Categories List */}
                <ScrollView 
                  style={styles.categoriesList} 
                  showsVerticalScrollIndicator={false}
                >
                  {categories.map((cat) => {
                    const isSelected = selectedCategoryId === cat.menu_category_id;
                    const count = categoryItemCounts[cat.menu_category_id] ?? 0;

                    return (
                      <TouchableOpacity
                        key={cat.menu_category_id}
                        style={[styles.categoryItem, isSelected && styles.selectedCategoryItem]}
                        onPress={() => {
                          onSelectCategory(cat.menu_category_id);
                          onToggleVisible();
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={styles.categoryInfo}>
                          <Text style={[styles.categoryName, isSelected && styles.selectedCategoryName]}>
                            {cat.category_name}
                          </Text>
                          {isSelected && <Check size={16} color={colors.primary} style={{ marginLeft: 6 }} />}
                        </View>

                        <View style={[styles.countBadge, isSelected && styles.selectedCountBadge]}>
                          <Text style={[styles.countText, isSelected && styles.selectedCountText]}>
                            {count}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    backgroundColor: '#0F172A', // Dark charcoal inspired by Swiggy floating button
    borderRadius: borderRadius.round,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    gap: 8,
    ...shadows.lg,
    zIndex: 99,
  },
  floatingButtonText: {
    color: '#FFFFFF',
    fontWeight: typography.fontWeights.heavy,
    fontSize: typography.fontSizes.xs,
    letterSpacing: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 24,
  },
  sheetContainer: {
    width: '90%',
    maxHeight: '65%',
    backgroundColor: '#1E293B', // Sleek dark slate bottom sheet as seen in screenshot
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.lg,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingBottom: spacing.sm,
  },
  sheetTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  closeButton: {
    padding: 4,
  },
  categoriesList: {
    marginVertical: spacing.xs,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  selectedCategoryItem: {
    backgroundColor: 'rgba(7, 159, 167, 0.15)',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: typography.fontSizes.sm,
    color: '#E2E8F0',
    fontWeight: typography.fontWeights.medium,
  },
  selectedCategoryName: {
    color: '#38BDF8',
    fontWeight: typography.fontWeights.bold,
  },
  countBadge: {
    backgroundColor: '#334155',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.round,
  },
  selectedCountBadge: {
    backgroundColor: colors.primary,
  },
  countText: {
    color: '#94A3B8',
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
  },
  selectedCountText: {
    color: '#FFFFFF',
  },
});

