import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  Alert,
  FlatList,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { Search, ShoppingBag, ArrowRight, Store, Heart, Sparkles, Filter } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../../config/theme';
import { Header } from '../../components/common/Header';
import { PromotionalBanner } from '../../components/common/PromotionalBanner';
import { CanteenCard } from '../../components/common/CanteenCard';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { 
  listenCanteens, 
  listenPromotions, 
  initializeFirestoreIfNeeded 
} from '../../services/firestoreService';
import type { Canteen, Promotion } from '../../models/types';

interface StudentHomeScreenProps {
  navigation: any;
}

export const StudentHomeScreen: React.FC<StudentHomeScreenProps> = ({ navigation }) => {
  const { user, role } = useAuth();
  const { items: cartItems, subtotal, itemCount } = useCart();

  const [canteens, setCanteens] = useState<Canteen[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState<string>('all');
  const [favouriteIds, setFavouriteIds] = useState<string[]>(user?.favourite_canteen_ids || []);

  useEffect(() => {
    initializeFirestoreIfNeeded();
    const unsubCanteens = listenCanteens((data) => setCanteens(data));
    const unsubPromos = listenPromotions((data) => setPromotions(data));

    return () => {
      unsubCanteens();
      unsubPromos();
    };
  }, []);

  const handleCanteenPress = (canteen: Canteen) => {
    const isFacultyOnly = canteen.canteen_type === 'faculty_only';
    const isEligible = !isFacultyOnly || role === 'faculty' || role === 'admin';

    if (!isEligible) {
      Alert.alert(
        'Faculty-Only Dining',
        'This dining facility on Main Building Floor 3 is strictly restricted to Faculty and Staff members.',
        [{ text: 'Understood' }]
      );
      return;
    }

    navigation.navigate('CanteenMenu', { canteen });
  };

  // Filter canteens based on search and building tab
  const filteredCanteens = useMemo(() => {
    return canteens.filter((canteen) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = canteen.name.toLowerCase().includes(q);
        const matchesSummary = canteen.summary?.toLowerCase().includes(q) || false;
        if (!matchesName && !matchesSummary) return false;
      }

      // 2. Building Tab
      if (selectedBuilding === 'main') {
        return canteen.building_id.includes('main');
      }
      if (selectedBuilding === 'law') {
        return canteen.building_id.includes('law');
      }
      if (selectedBuilding === 'hostel') {
        return canteen.building_id.includes('hostel');
      }
      if (selectedBuilding === 'favourites') {
        return favouriteIds.includes(canteen.canteen_id);
      }

      return true;
    });
  }, [canteens, searchQuery, selectedBuilding, favouriteIds]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      {/* 1. Common Top Navbar */}
      <Header
        title="MU CANTEEN"
        subtitle="Marwadi University Campus"
        role={role === 'faculty' ? 'Faculty' : 'Student'}
        cartItemCount={itemCount}
        favouritesCount={favouriteIds.length}
        onPressCart={() => navigation.navigate('Cart')}
        onPressProfile={() => navigation.navigate('Profile')}
        onPressFavourites={() => setSelectedBuilding(selectedBuilding === 'favourites' ? 'all' : 'favourites')}
      />

      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. Horizontal Promotional / Discount Banner */}
        <PromotionalBanner 
          promotions={promotions}
          onSelectPromotion={(promo) => {
            Alert.alert(
              promo.title,
              `${promo.subtitle}\n\nUse Code: ${promo.discount_code} (${promo.discount_percent}% OFF)`
            );
          }}
        />

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search size={18} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search canteens, dishes, floors..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>

        {/* 3. Building Filter Tabs: ALL, MAIN, LAW, HOSTEL */}
        <View style={styles.filterSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            <TouchableOpacity
              style={[styles.filterChip, selectedBuilding === 'all' && styles.filterChipActive]}
              onPress={() => setSelectedBuilding('all')}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterChipText, selectedBuilding === 'all' && styles.filterChipTextActive]}>
                All Canteens
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, selectedBuilding === 'main' && styles.filterChipActive]}
              onPress={() => setSelectedBuilding('main')}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterChipText, selectedBuilding === 'main' && styles.filterChipTextActive]}>
                Main Building (Fl 1-6)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, selectedBuilding === 'law' && styles.filterChipActive]}
              onPress={() => setSelectedBuilding('law')}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterChipText, selectedBuilding === 'law' && styles.filterChipTextActive]}>
                Law Building
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, selectedBuilding === 'hostel' && styles.filterChipActive]}
              onPress={() => setSelectedBuilding('hostel')}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterChipText, selectedBuilding === 'hostel' && styles.filterChipTextActive]}>
                Hostel Mess
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, selectedBuilding === 'favourites' && styles.filterChipActive]}
              onPress={() => setSelectedBuilding('favourites')}
              activeOpacity={0.7}
            >
              <Heart size={12} color={selectedBuilding === 'favourites' ? '#FFFFFF' : colors.accentOrange} />
              <Text style={[styles.filterChipText, selectedBuilding === 'favourites' && styles.filterChipTextActive]}>
                Favourites ({favouriteIds.length})
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Section Title */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>SELECT CANTEEN TO ORDER</Text>
          <Text style={styles.canteenCountText}>{filteredCanteens.length} Available</Text>
        </View>

        {/* 4. 2-COLUMN CANTEEN CARDS GRID (C1, C2, C3, C4...) */}
        <View style={styles.gridContainer}>
          {filteredCanteens.map((canteen) => (
            <View key={canteen.canteen_id} style={styles.gridColumn}>
              <CanteenCard
                canteen={canteen}
                onPress={handleCanteenPress}
                userRole={role}
                isFavourite={favouriteIds.includes(canteen.canteen_id)}
                compactGrid={true}
              />
            </View>
          ))}

          {filteredCanteens.length === 0 && (
            <View style={styles.emptyContainer}>
              <Store size={40} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No Canteens Found</Text>
              <Text style={styles.emptySubtitle}>Try adjusting your search or building filter</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* 5. Sticky Bottom Cart Bar */}
      {cartItems.length > 0 && (
        <View style={styles.stickyCartBar}>
          <View style={styles.cartBarInfo}>
            <View style={styles.cartCountBadge}>
              <Text style={styles.cartCountText}>{itemCount}</Text>
            </View>
            <View>
              <Text style={styles.cartBarTotal}>₹{subtotal}</Text>
              <Text style={styles.cartBarSubtitle}>Tap to review & checkout</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.cartBarButton}
            onPress={() => navigation.navigate('Cart')}
            activeOpacity={0.8}
          >
            <Text style={styles.cartBarButtonText}>View Cart</Text>
            <ArrowRight size={16} color="#FFFFFF" />
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
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSoft,
  },
  scrollContent: {
    paddingBottom: 90,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    height: 44,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSizes.sm,
    color: colors.textPrimary,
  },
  filterSection: {
    marginBottom: spacing.sm,
  },
  filterScroll: {
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: 4,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: typography.fontWeights.semibold,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: typography.fontWeights.bold,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: typography.fontWeights.heavy,
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  canteenCountText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: typography.fontWeights.bold,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.sm,
    justifyContent: 'space-between',
  },
  gridColumn: {
    width: '49%',
    marginBottom: spacing.sm,
  },
  emptyContainer: {
    width: '100%',
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
    marginTop: spacing.sm,
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
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  cartBarInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cartCountBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accentOrange,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartCountText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: typography.fontWeights.heavy,
  },
  cartBarTotal: {
    fontSize: 15,
    fontWeight: typography.fontWeights.heavy,
    color: '#FFFFFF',
  },
  cartBarSubtitle: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  cartBarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
    gap: 4,
  },
  cartBarButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: typography.fontWeights.bold,
  },
});
