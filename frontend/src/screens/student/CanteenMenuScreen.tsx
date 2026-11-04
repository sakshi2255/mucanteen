import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  TouchableOpacity,
  SafeAreaView,
  Alert
} from 'react-native';
import { 
  ArrowLeft, 
  Search, 
  ShoppingBag, 
  MapPin, 
  Clock, 
  ShieldCheck,
  Sparkles,
  Flame,
  RotateCcw,
  CheckCircle2
} from 'lucide-react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../../config/theme';
import { FilterChips } from '../../components/common/FilterChips';
import { FoodCard } from '../../components/common/FoodCard';
import { FloatingCategoryModal } from '../../components/common/FloatingCategoryModal';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { listenMenuItems, listenStudentOrders } from '../../services/firestoreService';
import { INITIAL_CATEGORIES, INITIAL_CANTEENS } from '../../services/seedData';
import type { Canteen, MenuItem, Order } from '../../models/types';

interface CanteenMenuScreenProps {
  route?: any;
  navigation?: any;
}

export const CanteenMenuScreen: React.FC<CanteenMenuScreenProps> = ({ route, navigation }) => {
  const canteen: Canteen = route?.params?.canteen || INITIAL_CANTEENS[0];
  const { user } = useAuth();
  const { 
    items: cartItems, 
    subtotal, 
    itemCount, 
    addToCart, 
    removeFromCart, 
    reorderItems 
  } = useCart();

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [pastOrders, setPastOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [pureVegOnly, setPureVegOnly] = useState(false);
  const [availableNowOnly, setAvailableNowOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const unsubMenu = listenMenuItems(canteen.canteen_id, (items) => {
      setMenuItems(items);
    });

    let unsubOrders = () => {};
    if (user?.user_id) {
      unsubOrders = listenStudentOrders(user.user_id, (orders) => {
        const canteenPast = orders.filter((o) => o.canteen_id === canteen.canteen_id);
        setPastOrders(canteenPast);
      });
    }

    return () => {
      unsubMenu();
      unsubOrders();
    };
  }, [canteen.canteen_id, user?.user_id]);

  const categoryItemCounts = useMemo(() => {
    const counts: Record<string, number> = { all: menuItems.length };
    for (const cat of INITIAL_CATEGORIES) {
      if (cat.menu_category_id !== 'all') {
        counts[cat.menu_category_id] = menuItems.filter(
          (i) => i.menu_category_id === cat.menu_category_id
        ).length;
      }
    }
    return counts;
  }, [menuItems]);

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches = item.item_name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
        if (!matches) return false;
      }

      if (selectedCategory !== 'all' && item.menu_category_id !== selectedCategory) {
        return false;
      }

      if (pureVegOnly && !item.is_veg) {
        return false;
      }

      if (availableNowOnly && !item.is_available) {
        return false;
      }

      if (maxPrice !== null && item.price > maxPrice) {
        return false;
      }

      return true;
    });
  }, [menuItems, search, selectedCategory, pureVegOnly, availableNowOnly, maxPrice]);

  const recommendedItems = useMemo(() => {
    return filteredItems.filter((i) => i.is_recommended).slice(0, 4);
  }, [filteredItems]);

  const getCartQuantity = (itemId: string) => {
    const found = cartItems.find((i) => i.item.menu_item_id === itemId);
    return found ? found.quantity : 0;
  };

  const handleReorder = (order: Order) => {
    reorderItems(order.items_snapshot, canteen.canteen_id, canteen.name, menuItems);
    Alert.alert(
      'Items Added to Cart',
      `Reordered ${order.items_snapshot.length} items from token #${order.token_display || order.daily_token_number}.`,
      [
        { text: 'Keep Browsing', style: 'cancel' },
        { text: 'Go to Cart', onPress: () => navigation.navigate('Cart') }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Navigation */}
      <View style={styles.topNav}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>{canteen.name}</Text>
        <TouchableOpacity 
          style={styles.cartIconWrapper}
          onPress={() => navigation.navigate('Cart')}
        >
          <ShoppingBag size={20} color={colors.textPrimary} />
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
        {/* Canteen Header Card */}
        <View style={styles.canteenHeaderCard}>
          <View style={styles.canteenTitleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.canteenName}>{canteen.name}</Text>
              <Text style={styles.tokenPrefixNote}>Prefix [{canteen.token_prefix || 'A'}] • Floor {canteen.floor}</Text>
            </View>
            <View style={[styles.statusPill, canteen.is_open ? styles.openPill : styles.closedPill]}>
              <Text style={[styles.statusPillText, canteen.is_open ? styles.openText : styles.closedText]}>
                {canteen.is_open ? 'OPEN' : 'CLOSED'}
              </Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <MapPin size={13} color={colors.primary} />
            <Text style={styles.metaText}>
              Floor {canteen.floor === 0 ? 'Ground' : canteen.floor} • {canteen.building_id.includes('law') ? 'Law Building' : 'Main Academic Building'}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <Clock size={13} color={colors.textSecondary} />
            <Text style={styles.metaText}>Hours: {canteen.operating_hours}</Text>
          </View>

          {canteen.canteen_type === 'faculty_only' && (
            <View style={styles.facultyBanner}>
              <ShieldCheck size={14} color="#B45309" />
              <Text style={styles.facultyBannerText}>Faculty-Exclusive Dining Hall</Text>
            </View>
          )}
        </View>

        {/* Search */}
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Search size={18} color={colors.textSecondary} style={{ marginRight: spacing.sm }} />
            <TextInput
              style={styles.searchInput}
              placeholder={`Search dishes in ${canteen.name}...`}
              placeholderTextColor={colors.textMuted}
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>

        {/* Filters */}
        <FilterChips
          pureVegOnly={pureVegOnly}
          onTogglePureVeg={() => setPureVegOnly(!pureVegOnly)}
          availableNowOnly={availableNowOnly}
          onToggleAvailableNow={() => setAvailableNowOnly(!availableNowOnly)}
          selectedBuilding={null}
          onSelectBuilding={() => {}}
          maxPrice={maxPrice}
          onSelectMaxPrice={setMaxPrice}
        />

        {/* SWIGGY-INSPIRED "WANT TO REPEAT?" PAST ORDERS HORIZONTAL SECTION */}
        {pastOrders.length > 0 && !search && (
          <View style={styles.repeatSection}>
            <View style={styles.sectionTitleRow}>
              <RotateCcw size={15} color={colors.primary} />
              <Text style={styles.sectionTitle}>Want to repeat?</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.repeatScroll}>
              {pastOrders.slice(0, 5).map((order) => {
                const summary = order.items_snapshot.map((i) => `${i.quantity}x ${i.item_name}`).join(', ');
                return (
                  <View key={order.order_id} style={styles.repeatCard}>
                    <View style={styles.repeatHeader}>
                      <View style={styles.repeatTokenBadge}>
                        <Text style={styles.repeatTokenText}>{order.token_display || `#${order.daily_token_number}`}</Text>
                      </View>
                      <Text style={styles.repeatDateText}>{order.token_date}</Text>
                    </View>
                    <Text style={styles.repeatItemsSummary} numberOfLines={2}>
                      {summary}
                    </Text>
                    <View style={styles.repeatBottomRow}>
                      <Text style={styles.repeatPrice}>₹{order.total}</Text>
                      <TouchableOpacity
                        style={styles.reorderBtn}
                        onPress={() => handleReorder(order)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.reorderBtnText}>REORDER</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Horizontal Category Nav */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {INITIAL_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.menu_category_id;
            return (
              <TouchableOpacity
                key={cat.menu_category_id}
                style={[styles.categoryPill, isSelected && styles.activeCategoryPill]}
                onPress={() => setSelectedCategory(cat.menu_category_id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.categoryPillText, isSelected && styles.activeCategoryPillText]}>
                  {cat.category_name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Recommended Items */}
        {recommendedItems.length > 0 && !search && (
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Sparkles size={16} color={colors.accentOrange} />
              <Text style={styles.sectionTitle}>Top Picks & Recommended</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recScroll}>
              {recommendedItems.map((item) => (
                <View key={item.menu_item_id} style={{ width: 165 }}>
                  <FoodCard
                    item={item}
                    quantityInCart={getCartQuantity(item.menu_item_id)}
                    onAddToCart={(i) => addToCart(i, canteen.name)}
                    onRemoveFromCart={removeFromCart}
                  />
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Food Items 2-Column Grid */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Flame size={16} color={colors.primary} />
            <Text style={styles.sectionTitle}>All Dishes ({filteredItems.length})</Text>
          </View>

          {filteredItems.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No menu items available</Text>
              <Text style={styles.emptySubtitle}>Try changing your category or filter selection</Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {filteredItems.map((item) => (
                <View key={item.menu_item_id} style={styles.gridItem}>
                  <FoodCard
                    item={item}
                    quantityInCart={getCartQuantity(item.menu_item_id)}
                    onAddToCart={(i) => addToCart(i, canteen.name)}
                    onRemoveFromCart={removeFromCart}
                  />
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Category Menu */}
      <FloatingCategoryModal
        categories={INITIAL_CATEGORIES}
        categoryItemCounts={categoryItemCounts}
        selectedCategoryId={selectedCategory}
        onSelectCategory={setSelectedCategory}
        visible={modalVisible}
        onToggleVisible={() => setModalVisible(!modalVisible)}
      />

      {/* Sticky Bottom Cart Summary */}
      {itemCount > 0 && (
        <View style={styles.stickyCartBar}>
          <View>
            <Text style={styles.cartBarCount}>{itemCount} {itemCount === 1 ? 'ITEM' : 'ITEMS'}</Text>
            <Text style={styles.cartBarTotal}>₹{subtotal}</Text>
          </View>

          <TouchableOpacity 
            style={styles.cartBarButton}
            onPress={() => navigation.navigate('Cart')}
            activeOpacity={0.85}
          >
            <Text style={styles.cartBarButtonText}>VIEW CART</Text>
            <ShoppingBag size={15} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.surface,
  },
  backButton: {
    padding: 4,
  },
  navTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: typography.fontWeights.heavy,
    color: colors.textPrimary,
    marginHorizontal: spacing.sm,
  },
  cartIconWrapper: {
    position: 'relative',
    padding: 6,
  },
  cartBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: colors.accentOrange,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSoft,
  },
  scrollContent: {
    paddingBottom: 110,
  },
  canteenHeaderCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: 4,
  },
  canteenTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  canteenName: {
    fontSize: 18,
    fontWeight: typography.fontWeights.heavy,
    color: colors.primaryDark,
  },
  tokenPrefixNote: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: typography.fontWeights.bold,
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  openPill: {
    backgroundColor: '#ECFDF5',
  },
  closedPill: {
    backgroundColor: '#FEF2F2',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  openText: {
    color: colors.accentGreen,
  },
  closedText: {
    color: colors.accentRed,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  facultyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
    gap: 6,
    marginTop: 4,
  },
  facultyBannerText: {
    fontSize: 11,
    color: '#92400E',
    fontWeight: '600',
  },
  searchSection: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSoft,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    height: 40,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.textPrimary,
  },
  repeatSection: {
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  repeatScroll: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    paddingVertical: 4,
  },
  repeatCard: {
    width: 200,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    justifyContent: 'space-between',
    ...shadows.sm,
  },
  repeatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  repeatTokenBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  repeatTokenText: {
    fontSize: 10,
    fontWeight: typography.fontWeights.heavy,
    color: colors.primaryDark,
  },
  repeatDateText: {
    fontSize: 9,
    color: colors.textMuted,
  },
  repeatItemsSummary: {
    fontSize: 11,
    color: colors.textPrimary,
    lineHeight: 15,
    minHeight: 30,
  },
  repeatBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: 4,
  },
  repeatPrice: {
    fontSize: 12,
    fontWeight: typography.fontWeights.bold,
    color: colors.primaryDark,
  },
  reorderBtn: {
    backgroundColor: colors.accentOrange,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  reorderBtnText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: typography.fontWeights.heavy,
  },
  categoryScroll: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  categoryPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  activeCategoryPill: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  activeCategoryPillText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  section: {
    marginTop: spacing.md,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
    gap: 6,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: typography.fontWeights.heavy,
    color: colors.textPrimary,
    letterSpacing: 0.4,
  },
  recScroll: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%',
    marginBottom: spacing.sm,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  stickyCartBar: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.primaryDark,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shadows.md,
  },
  cartBarCount: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '700',
  },
  cartBarTotal: {
    fontSize: 16,
    fontWeight: typography.fontWeights.heavy,
    color: '#FFFFFF',
  },
  cartBarButton: {
    backgroundColor: colors.accentOrange,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
    gap: 6,
  },
  cartBarButtonText: {
    color: '#FFFFFF',
    fontWeight: typography.fontWeights.heavy,
    fontSize: 12,
  },
});
