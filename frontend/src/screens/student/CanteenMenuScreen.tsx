import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Search, ShoppingBag, MapPin, Flame } from 'lucide-react-native';
import { colors } from '../../config/theme';
import { FoodCard } from '../../components/common/FoodCard';
import { FloatingCategoryModal } from '../../components/common/FloatingCategoryModal';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { listenMenuItems, listenCategories } from '../../services/firestoreService';
import { styles } from '../../styles/student/CanteenMenuStyles';
import type { Canteen, MenuCategory, MenuItem } from '../../models/types';

interface CanteenMenuScreenProps {
  navigation: any;
  route?: any;
}

export const CanteenMenuScreen: React.FC<CanteenMenuScreenProps> = ({ route, navigation }) => {
  const canteen: Canteen = route?.params?.canteen;
  const { items: cartItems, subtotal, itemCount, addToCart, removeFromCart } = useCart();
  const { showToast } = useToast();

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [pureVegOnly, setPureVegOnly] = useState(false);
  const [availableNowOnly, setAvailableNowOnly] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (!canteen?.canteen_id) return;
    const unsubMenu = listenMenuItems(canteen.canteen_id, (items) => setMenuItems(items));
    const unsubCats = listenCategories((cats) => setCategories(cats));
    return () => {
      unsubMenu();
      unsubCats();
    };
  }, [canteen?.canteen_id]);

  const categoryItemCounts = useMemo(() => {
    const counts: Record<string, number> = { all: menuItems.length };
    for (const cat of categories) {
      if (cat.menu_category_id !== 'all') {
        counts[cat.menu_category_id] = menuItems.filter(
          (i) => i.menu_category_id === cat.menu_category_id
        ).length;
      }
    }
    return counts;
  }, [menuItems, categories]);

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        if (
          !(
            item.item_name.toLowerCase().includes(q) ||
            item.description.toLowerCase().includes(q)
          )
        ) {
          return false;
        }
      }
      if (selectedCategory !== 'all' && item.menu_category_id !== selectedCategory) return false;
      if (pureVegOnly && !item.is_veg) return false;
      if (availableNowOnly && !item.is_available) return false;
      return true;
    });
  }, [menuItems, search, selectedCategory, pureVegOnly, availableNowOnly]);

  const getCartQuantity = (itemId: string) =>
    cartItems.find((i) => i.item.menu_item_id === itemId)?.quantity || 0;

  const handleAddItem = (item: MenuItem) => {
    if (!canteen.is_open) {
      showToast('This canteen is currently closed for orders.', 'error', 'Canteen Closed');
      return;
    }
    addToCart(item, canteen.name);
    showToast(`Added ${item.item_name} to cart.`, 'success', 'Cart Updated');
  };

  if (!canteen) return null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topNav}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={26} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>
          {canteen.name}
        </Text>
        <TouchableOpacity
          style={styles.cartIconWrapper}
          onPress={() => navigation.navigate('StudentRoot', { screen: 'Cart' })}
        >
          <ShoppingBag size={22} color={colors.textPrimary} />
          {itemCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{itemCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {!!canteen.banner_url && (
          <Image
            source={{ uri: canteen.banner_url }}
            style={styles.canteenBannerImage}
            resizeMode="cover"
          />
        )}

        <View style={styles.canteenHeaderCard}>
          <View style={styles.canteenTitleRow}>
            <View style={styles.canteenTitleCol}>
              <Text style={styles.canteenName}>{canteen.name}</Text>
              <Text style={styles.tokenPrefixNote}>
                Prefix [{canteen.token_prefix || 'A'}] • Floor {canteen.floor}
              </Text>
            </View>
            <View style={[styles.statusPill, canteen.is_open ? styles.openPill : styles.closedPill]}>
              <Text
                style={[
                  styles.statusPillText,
                  canteen.is_open ? styles.openText : styles.closedText,
                ]}
              >
                {canteen.is_open ? 'OPEN' : 'CLOSED'}
              </Text>
            </View>
          </View>
          <View style={styles.metaRow}>
            <MapPin size={14} color={colors.textSecondary} />
            <Text style={styles.metaText}>
              Floor {canteen.floor === 0 ? 'Ground' : canteen.floor} •{' '}
              {canteen.building_id.includes('law')
                ? 'Law Building'
                : canteen.building_id.includes('hostel')
                  ? 'Hostel Block'
                  : 'Main Academic Building'}
            </Text>
          </View>
        </View>

        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Search size={18} color={colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={`Search dishes in ${canteen.name}...`}
              placeholderTextColor={colors.textMuted}
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>

        <View style={styles.singleFilterBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            <TouchableOpacity
              style={[styles.categoryPill, pureVegOnly && styles.vegActivePill]}
              onPress={() => setPureVegOnly(!pureVegOnly)}
              activeOpacity={0.7}
            >
              <Text style={[styles.categoryPillText, pureVegOnly && styles.activeCategoryPillText]}>
                Pure Veg
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.categoryPill, availableNowOnly && styles.activeCategoryPill]}
              onPress={() => setAvailableNowOnly(!availableNowOnly)}
              activeOpacity={0.7}
            >
              <Text
                style={[styles.categoryPillText, availableNowOnly && styles.activeCategoryPillText]}
              >
                Available
              </Text>
            </TouchableOpacity>

            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.menu_category_id}
                style={[
                  styles.categoryPill,
                  selectedCategory === cat.menu_category_id && styles.activeCategoryPill,
                ]}
                onPress={() => setSelectedCategory(cat.menu_category_id)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    selectedCategory === cat.menu_category_id && styles.activeCategoryPillText,
                  ]}
                >
                  {cat.category_name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Flame size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>All Dishes ({filteredItems.length})</Text>
          </View>

          {filteredItems.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No menu items available</Text>
            </View>
          ) : (
            <View style={styles.gridContainer}>
              {filteredItems.map((item) => (
                <View key={item.menu_item_id} style={styles.gridColumn}>
                  <FoodCard
                    item={item}
                    quantityInCart={getCartQuantity(item.menu_item_id)}
                    onAddToCart={handleAddItem}
                    onRemoveFromCart={removeFromCart}
                    style={styles.uniformFoodCard}
                  />
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <FloatingCategoryModal
        visible={modalVisible}
        onToggleVisible={() => setModalVisible((prev) => !prev)}
        categories={categories}
        categoryItemCounts={categoryItemCounts}
        selectedCategoryId={selectedCategory}
        onSelectCategory={(catId) => setSelectedCategory(catId)}
      />

      {itemCount > 0 && (
        <View style={styles.bottomDock}>
          <View style={styles.stickyCartBar}>
            <View>
              <Text style={styles.cartBarCount}>{itemCount} ITEMS</Text>
              <Text style={styles.cartBarTotal}>₹{subtotal}</Text>
            </View>
            <TouchableOpacity
              style={styles.cartBarButton}
              onPress={() => navigation.navigate('StudentRoot', { screen: 'Cart' })}
              activeOpacity={0.85}
            >
              <Text style={styles.cartBarButtonText}>VIEW CART</Text>
              <ShoppingBag size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};