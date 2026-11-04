import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Switch, 
  Modal, 
  TextInput, 
  Alert, 
  SafeAreaView 
} from 'react-native';
import { ArrowLeft, Plus, Edit2, Trash2, X, Check } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../../config/theme';
import { useAuth } from '../../context/AuthContext';
import { 
  listenMenuItems, 
  toggleMenuItemAvailability,
  addMenuItemFirestore,
  editMenuItemFirestore,
  deleteMenuItemFirestore 
} from '../../services/firestoreService';
import { INITIAL_CATEGORIES } from '../../services/seedData';
import type { MenuItem } from '../../models/types';

interface MenuManagementScreenProps {
  navigation: any;
}

export const MenuManagementScreen: React.FC<MenuManagementScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const assignedCanteenId = user?.assigned_canteen_ids?.[0] || 'canteen_main_1';

  const [items, setItems] = useState<MenuItem[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Form states
  const [itemName, setItemName] = useState('');
  const [description, setDescription] = useState('');
  const [priceStr, setPriceStr] = useState('');
  const [isVeg, setIsVeg] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('snacks');

  useEffect(() => {
    const unsub = listenMenuItems(assignedCanteenId, (list) => {
      setItems(list.filter((i) => i.is_active));
    });
    return unsub;
  }, [assignedCanteenId]);

  const actor = {
    id: user?.user_id || 'operator',
    name: user?.name || 'Canteen Operator',
    role: 'operator',
  };

  const handleToggle = async (itemId: string, newAvailable: boolean) => {
    await toggleMenuItemAvailability(itemId, newAvailable, actor);
  };

  const openAddModal = () => {
    setEditingItem(null);
    setItemName('');
    setDescription('');
    setPriceStr('');
    setIsVeg(true);
    setSelectedCategory('snacks');
    setModalVisible(true);
  };

  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setItemName(item.item_name);
    setDescription(item.description);
    setPriceStr(item.price.toString());
    setIsVeg(item.is_veg);
    setSelectedCategory(item.menu_category_id);
    setModalVisible(true);
  };

  const handleSaveItem = async () => {
    const trimmedName = itemName.trim();
    const priceNum = parseFloat(priceStr);

    if (!trimmedName || isNaN(priceNum) || priceNum <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid item name and positive price.');
      return;
    }

    try {
      if (editingItem) {
        // Edit existing
        await editMenuItemFirestore(
          editingItem.menu_item_id,
          {
            item_name: trimmedName,
            description: description.trim(),
            price: priceNum,
            is_veg: isVeg,
            menu_category_id: selectedCategory,
          },
          actor
        );
        Alert.alert('Item Updated', `"${trimmedName}" has been updated.`);
      } else {
        // Add new
        const newItemId = `item_${Date.now()}`;
        const newItem: MenuItem = {
          menu_item_id: newItemId,
          menu_category_id: selectedCategory,
          item_name: trimmedName,
          description: description.trim(),
          canteen_id: assignedCanteenId,
          price: priceNum,
          is_veg: isVeg,
          placeholder_key: 'custom',
          image_url: null,
          is_available: true,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        await addMenuItemFirestore(newItem, actor);
        Alert.alert('Item Added', `"${trimmedName}" has been added to the canteen menu.`);
      }
      setModalVisible(false);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not save menu item.');
    }
  };

  const handleDeleteItem = (item: MenuItem) => {
    Alert.alert(
      'Remove Item',
      `Deactivate "${item.item_name}" from the menu?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMenuItemFirestore(item.menu_item_id, actor);
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Could not deactivate item.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Menu Management</Text>
        <TouchableOpacity onPress={openAddModal} style={styles.addBtn} activeOpacity={0.8}>
          <Plus size={18} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoBanner}>
        <Text style={styles.infoBannerText}>
          Toggling an item to Sold Out instantly hides it from students.
        </Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.menu_item_id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <View style={styles.itemDetails}>
              <View style={styles.nameRow}>
                <View style={[styles.vegBadge, { borderColor: item.is_veg ? colors.accentGreen : colors.accentRed }]}>
                  <View style={[styles.vegDot, { backgroundColor: item.is_veg ? colors.accentGreen : colors.accentRed }]} />
                </View>
                <Text style={styles.itemName}>{item.item_name}</Text>
              </View>

              <Text style={styles.itemDesc} numberOfLines={1}>{item.description}</Text>
              <Text style={styles.itemPrice}>₹{item.price}</Text>

              <View style={styles.cardActionsRow}>
                <TouchableOpacity onPress={() => openEditModal(item)} style={styles.actionBtn}>
                  <Edit2 size={12} color={colors.primary} />
                  <Text style={styles.actionBtnText}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => handleDeleteItem(item)} style={styles.actionBtn}>
                  <Trash2 size={12} color={colors.accentRed} />
                  <Text style={[styles.actionBtnText, { color: colors.accentRed }]}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.toggleSection}>
              <Text style={[styles.statusText, item.is_available ? styles.availableText : styles.soldOutText]}>
                {item.is_available ? 'AVAILABLE' : 'SOLD OUT'}
              </Text>
              <Switch
                value={item.is_available}
                onValueChange={(val) => handleToggle(item.menu_item_id, val)}
                trackColor={{ false: '#FECACA', true: '#A7F3D0' }}
                thumbColor={item.is_available ? colors.accentGreen : '#EF4444'}
              />
            </View>
          </View>
        )}
      />

      {/* Add / Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Dish / Item Name *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Kadak Masala Chai"
              value={itemName}
              onChangeText={setItemName}
            />

            <Text style={styles.inputLabel}>Price (₹) *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. 20"
              keyboardType="numeric"
              value={priceStr}
              onChangeText={setPriceStr}
            />

            <Text style={styles.inputLabel}>Short Description</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Fresh hot ginger tea brewed with whole milk"
              value={description}
              onChangeText={setDescription}
            />

            <View style={styles.vegSwitchRow}>
              <Text style={styles.vegSwitchLabel}>Is Vegetarian Item?</Text>
              <Switch
                value={isVeg}
                onValueChange={setIsVeg}
                thumbColor={isVeg ? colors.accentGreen : colors.accentRed}
              />
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveItem} activeOpacity={0.85}>
              <Check size={16} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>Save Dish to Menu</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: typography.fontWeights.heavy,
    color: colors.textPrimary,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: typography.fontWeights.bold,
    fontSize: 12,
  },
  infoBanner: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  infoBannerText: {
    fontSize: 11,
    color: colors.primaryDark,
    fontWeight: '500',
  },
  listContent: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  itemCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shadows.sm,
  },
  itemDetails: {
    flex: 1,
    marginRight: spacing.sm,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  vegBadge: {
    width: 14,
    height: 14,
    borderWidth: 1.5,
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vegDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  itemName: {
    fontSize: 14,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  itemDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginVertical: 2,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: typography.fontWeights.heavy,
    color: colors.primaryDark,
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: 6,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  actionBtnText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: typography.fontWeights.semibold,
  },
  toggleSection: {
    alignItems: 'center',
  },
  statusText: {
    fontSize: 9,
    fontWeight: typography.fontWeights.heavy,
    marginBottom: 4,
  },
  availableText: {
    color: colors.accentGreen,
  },
  soldOutText: {
    color: colors.accentRed,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: typography.fontWeights.heavy,
    color: colors.textPrimary,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: 4,
  },
  modalInput: {
    backgroundColor: colors.backgroundSoft,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.textPrimary,
  },
  vegSwitchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  vegSwitchLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: borderRadius.md,
    gap: 6,
    marginTop: spacing.xs,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: typography.fontWeights.bold,
    fontSize: 13,
  },
});
