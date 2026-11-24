import React from 'react';
import { 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  TouchableWithoutFeedback,
  ScrollView 
} from 'react-native';
import { Menu, X, Check } from 'lucide-react-native';
import { colors } from '../../config/theme';
import { styles } from '../../styles/comman/FloatingCategoryModalStyles';
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
                         {isSelected && <Check size={16} color={colors.primary} style={styles.checkIcon} />}
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

