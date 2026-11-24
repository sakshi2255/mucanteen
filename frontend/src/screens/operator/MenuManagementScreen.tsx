import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Switch, Modal, TextInput, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, Edit2, Trash2, X, Check, ChevronDown } from 'lucide-react-native';
import { colors } from '../../config/theme';
import { useAuth } from '../../context/AuthContext';
import { styles } from '../../styles/operator/MenuManagementStyles';
import {
  listenMenuItems,
  listenCategories,
  toggleMenuItemAvailability,
  addMenuItemFirestore,
  editMenuItemFirestore,
  deleteMenuItemFirestore,
  addCategoryFirestore,
} from '../../services/firestoreService';
import type { MenuCategory, MenuItem } from '../../models/types';

interface MenuManagementScreenProps { navigation: any; }

export const MenuManagementScreen: React.FC<MenuManagementScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const assignedCanteenId = user?.assigned_canteen_ids?.[0] || 'canteen_main_1';

  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const [itemName, setItemName] = useState('');
  const [description, setDescription] = useState('');
  const [priceStr, setPriceStr] = useState('');
  const [isVeg, setIsVeg] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('cat_snacks');
  const [showCatDropdown, setShowCatDropdown] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  useEffect(() => {
    const unsubItems = listenMenuItems(assignedCanteenId, (list) => {
      setItems(list.filter((i) => i.is_active !== false));
    });
    const unsubCats = listenCategories((cats) => {
      setCategories(cats.filter((c) => c.menu_category_id !== 'all'));
    });
    return () => {
      unsubItems();
      unsubCats();
    };
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
    setSelectedCategory(categories[0]?.menu_category_id || 'cat_snacks');
    setShowCatDropdown(false);
    setNewCategoryName('');
    setModalVisible(true);
  };

  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setItemName(item.item_name);
    setDescription(item.description);
    setPriceStr(item.price.toString());
    setIsVeg(item.is_veg);
    setSelectedCategory(item.menu_category_id);
    setShowCatDropdown(false);
    setNewCategoryName('');
    setModalVisible(true);
  };

  const handleAddCategory = async () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    const newCatId = `cat_${trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${Date.now().toString().slice(-4)}`;
    const newCat: MenuCategory = {
      menu_category_id: newCatId,
      category_name: trimmed,
      description: `${trimmed} items`,
      sort_order: categories.length + 1,
      is_active: true,
    };
    try {
      await addCategoryFirestore(newCat, actor);
      setSelectedCategory(newCatId);
      setNewCategoryName('');
      setShowCatDropdown(false);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not add category.');
    }
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
      } else {
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
      }
      setModalVisible(false);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not save menu item.');
    }
  };

  const handleDeleteItem = (item: MenuItem) => {
    Alert.alert('Remove Item', `Deactivate "${item.item_name}" from the menu?`, [
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
    ]);
  };

  const selectedCategoryLabel =
    categories.find((c) => c.menu_category_id === selectedCategory)?.category_name || 'Select Category';

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
        <Text style={styles.infoBannerText}>Toggling an item to Sold Out instantly hides it from students.</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.menu_item_id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<Text style={styles.emptyListText}>No menu items found. Add one above.</Text>}
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <View style={styles.itemDetails}>
              <View style={styles.nameRow}>
                <View style={[styles.vegBadge, item.is_veg ? styles.vegBadgeGreen : styles.vegBadgeRed]}>
                  <View style={[styles.vegDot, item.is_veg ? styles.vegDotGreen : styles.vegDotRed]} />
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
                  <Text style={styles.actionBtnTextDestructive}>Remove</Text>
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

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScrollContent}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <X size={20} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Dish / Item Name *</Text>
              <TextInput style={styles.modalInput} placeholder="e.g. Kadak Masala Chai" value={itemName} onChangeText={setItemName} />

              <Text style={styles.inputLabel}>Category *</Text>
              <TouchableOpacity
                style={styles.categoryDropdownBtn}
                onPress={() => setShowCatDropdown((prev) => !prev)}
              >
                <Text style={styles.categoryDropdownText}>{selectedCategoryLabel}</Text>
                <ChevronDown size={16} color={colors.primary} />
              </TouchableOpacity>

              {showCatDropdown && (
                <View style={styles.categoryListBox}>
                  <ScrollView nestedScrollEnabled>
                    {categories.map((cat) => {
                      const active = cat.menu_category_id === selectedCategory;
                      return (
                        <TouchableOpacity
                          key={cat.menu_category_id}
                          style={[styles.categoryOption, active && styles.categoryOptionActive]}
                          onPress={() => {
                            setSelectedCategory(cat.menu_category_id);
                            setShowCatDropdown(false);
                          }}
                        >
                          <Text style={[styles.categoryOptionText, active && styles.categoryOptionTextActive]}>
                            {cat.category_name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              <View style={styles.addNewCatRow}>
                <TextInput
                  style={styles.addNewCatInput}
                  placeholder="Or add new category..."
                  value={newCategoryName}
                  onChangeText={setNewCategoryName}
                />
                <TouchableOpacity style={styles.addNewCatBtn} onPress={handleAddCategory}>
                  <Text style={styles.addNewCatBtnText}>+ Add</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Price (₹) *</Text>
              <TextInput style={styles.modalInput} placeholder="e.g. 20" keyboardType="numeric" value={priceStr} onChangeText={setPriceStr} />

              <Text style={styles.inputLabel}>Short Description</Text>
              <TextInput style={styles.modalInput} placeholder="Fresh hot ginger tea brewed with whole milk" value={description} onChangeText={setDescription} />

              <View style={styles.vegSwitchRow}>
                <Text style={styles.vegSwitchLabel}>Is Vegetarian Item?</Text>
                <Switch value={isVeg} onValueChange={setIsVeg} thumbColor={isVeg ? colors.accentGreen : colors.accentRed} />
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveItem} activeOpacity={0.85}>
                <Check size={16} color="#FFFFFF" />
                <Text style={styles.saveBtnText}>Save Dish to Menu</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
};