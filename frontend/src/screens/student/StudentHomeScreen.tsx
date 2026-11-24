import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, ArrowRight, Store, Heart } from 'lucide-react-native';
import { colors } from '../../config/theme';
import { Header } from '../../components/common/Header';
import { PromotionalBanner } from '../../components/common/PromotionalBanner';
import { CanteenCard } from '../../components/common/CanteenCard';
import { LiveOrderBanner } from '../../components/common/LiveOrderBanner';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { listenCanteens, listenPromotions, initializeFirestoreIfNeeded } from '../../services/firestoreService';
import type { Canteen, Promotion } from '../../models/types';
import { styles } from '../../styles/student/StudentHomeStyles';

interface StudentHomeScreenProps { navigation: any; }

export const StudentHomeScreen: React.FC<StudentHomeScreenProps> = ({ navigation }) => {
  const { user, role } = useAuth();
  const { items: cartItems, subtotal, itemCount } = useCart();
  const [canteens, setCanteens] = useState<Canteen[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState<string>('all');
  const [favouriteIds, setFavouriteIds] = useState<string[]>(user?.favourite_canteen_ids || []);

  useEffect(() => {
    setFavouriteIds(user?.favourite_canteen_ids || []);
  }, [user]);

  useEffect(() => {
    initializeFirestoreIfNeeded();
    const unsubCanteens = listenCanteens((data) => setCanteens(data));
    const unsubPromos = listenPromotions((data) => setPromotions(data));
    return () => { unsubCanteens(); unsubPromos(); };
  }, []);

  const handleCanteenPress = (canteen: Canteen) => {
    const isFacultyOnly = canteen.canteen_type === 'faculty_only';
    const isEligible = !isFacultyOnly || role === 'faculty' || role === 'admin';
    if (!isEligible) {
      Alert.alert('Faculty-Only Dining', 'This dining facility is strictly restricted to Faculty and Staff members.', [{ text: 'Understood' }]);
      return;
    }
    navigation.navigate('CanteenMenu', { canteen });
  };

  const filteredCanteens = useMemo(() => {
    return canteens.filter((canteen) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = canteen.name.toLowerCase().includes(q);
        const matchesSummary = canteen.summary?.toLowerCase().includes(q) || false;
        if (!matchesName && !matchesSummary) return false;
      }
      if (selectedBuilding === 'main') return canteen.building_id.includes('main');
      if (selectedBuilding === 'law') return canteen.building_id.includes('law');
      if (selectedBuilding === 'hostel') return canteen.building_id.includes('hostel');
      if (selectedBuilding === 'favourites') return favouriteIds.includes(canteen.canteen_id);
      return true;
    });
  }, [canteens, searchQuery, selectedBuilding, favouriteIds]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
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

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} stickyHeaderIndices={[2]}>
        <PromotionalBanner
          promotions={promotions}
          onSelectPromotion={(promo) => {
            Alert.alert(promo.title, `${promo.subtitle}\n\nUse Code: ${promo.discount_code} (${promo.discount_percent}% OFF)`);
          }}
        />
        <View style={styles.searchContainer}>
          <Search size={22} color={colors.primary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search canteens or campus dishes..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>
        <View style={styles.filterSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {['all', 'main', 'law', 'hostel'].map((bldg) => (
              <TouchableOpacity
                key={bldg}
                style={[styles.filterChip, selectedBuilding === bldg && styles.filterChipActive]}
                onPress={() => setSelectedBuilding(bldg)}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterChipText, selectedBuilding === bldg && styles.filterChipTextActive]}>
                  {bldg === 'all' ? 'All Canteens' : bldg === 'main' ? 'Main Bldg' : bldg === 'law' ? 'Law Bldg' : 'Hostel'}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.filterChip, selectedBuilding === 'favourites' && styles.filterChipActive]}
              onPress={() => setSelectedBuilding('favourites')}
              activeOpacity={0.8}
            >
              <Heart size={14} color={selectedBuilding === 'favourites' ? '#FFFFFF' : colors.accentOrange} />
              <Text style={[styles.filterChipText, selectedBuilding === 'favourites' && styles.filterChipTextActive]}>Saved</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>CAMPUS DINING OPTIONS</Text>
          <Text style={styles.canteenCountText}>{filteredCanteens.length} Canteens</Text>
        </View>

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
              <Store size={48} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No Canteens Found</Text>
              <Text style={styles.emptySubtitle}>Try adjusting your search or building filter</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {cartItems.length > 0 && (
        <View style={styles.stickyCartBar}>
          <View style={styles.cartBarInfo}>
            <View style={styles.cartCountBadge}><Text style={styles.cartCountText}>{itemCount}</Text></View>
            <View>
              <Text style={styles.cartBarTotal}>₹{subtotal}</Text>
              <Text style={styles.cartBarSubtitle}>Extra charges may apply</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.cartBarButton} onPress={() => navigation.navigate('Cart')} activeOpacity={0.8}>
            <Text style={styles.cartBarButtonText}>VIEW CART</Text>
            <ArrowRight size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* Flush above bottom navigation bar */}
      <LiveOrderBanner />
    </SafeAreaView>
  );
};