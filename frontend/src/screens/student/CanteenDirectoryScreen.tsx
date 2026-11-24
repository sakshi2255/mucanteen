import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TextInput, 
  TouchableOpacity 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, ArrowLeft, Store } from 'lucide-react-native';
import { colors } from '../../config/theme';
import { CanteenCard } from '../../components/common/CanteenCard';
import { useAuth } from '../../context/AuthContext';
import { listenCanteens } from '../../services/firestoreService';
import { styles } from '../../styles/student/CanteenDirectoryStyles';
import type { Canteen } from '../../models/types';

interface CanteenDirectoryScreenProps {
  navigation: any;
}

export const CanteenDirectoryScreen: React.FC<CanteenDirectoryScreenProps> = ({ navigation }) => {
  const { role } = useAuth();
  const [canteens, setCanteens] = useState<Canteen[]>([]);
  const [search, setSearch] = useState('');
  const [selectedBldg, setSelectedBldg] = useState<string>('all');

  useEffect(() => {
    const unsub = listenCanteens((data) => setCanteens(data));
    return unsub;
  }, []);

  const filteredCanteens = useMemo(() => {
    return canteens.filter((c) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches = c.name.toLowerCase().includes(q) || c.canteen_id.toLowerCase().includes(q);
        if (!matches) return false;
      }

      if (selectedBldg === 'bldg-main' || selectedBldg === 'bldg_main') {
        return c.building_id.includes('main');
      }
      if (selectedBldg === 'bldg-law' || selectedBldg === 'bldg_law') {
        return c.building_id.includes('law');
      }
      if (selectedBldg === 'bldg-hostel' || selectedBldg === 'bldg_hostel') {
        return c.building_id.includes('hostel');
      }

      return true;
    });
  }, [canteens, search, selectedBldg]);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Bar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={26} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Dining Halls</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Search */}
        <View style={styles.searchBar}>
          <Search size={22} color={colors.primary} style={{ marginRight: 12 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search canteens or locations..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Building Filter Tabs */}
        <View style={styles.buildingTabsRow}>
          <TouchableOpacity 
            style={[styles.tab, selectedBldg === 'all' && styles.activeTab]}
            onPress={() => setSelectedBldg('all')}
          >
            <Text style={[styles.tabText, selectedBldg === 'all' && styles.activeTabText]}>
              All ({canteens.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tab, (selectedBldg === 'bldg-main' || selectedBldg === 'bldg_main') && styles.activeTab]}
            onPress={() => setSelectedBldg('bldg_main')}
          >
            <Text style={[styles.tabText, (selectedBldg === 'bldg-main' || selectedBldg === 'bldg_main') && styles.activeTabText]}>
              Main Building
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tab, (selectedBldg === 'bldg-law' || selectedBldg === 'bldg_law') && styles.activeTab]}
            onPress={() => setSelectedBldg('bldg_law')}
          >
            <Text style={[styles.tabText, (selectedBldg === 'bldg-law' || selectedBldg === 'bldg_law') && styles.activeTabText]}>
              Law Bldg
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tab, (selectedBldg === 'bldg-hostel' || selectedBldg === 'bldg_hostel') && styles.activeTab]}
            onPress={() => setSelectedBldg('bldg_hostel')}
          >
            <Text style={[styles.tabText, (selectedBldg === 'bldg-hostel' || selectedBldg === 'bldg_hostel') && styles.activeTabText]}>
              Hostel Mess
            </Text>
          </TouchableOpacity>
        </View>

        {/* Canteen Cards List (Full width Swiggy Style) */}
        <View style={styles.list}>
          {filteredCanteens.map((canteen) => (
            <CanteenCard
              key={canteen.canteen_id}
              canteen={canteen}
              userRole={role}
              compactGrid={false}
              onPress={(c) => {
                if (c.canteen_type === 'faculty_only' && role !== 'faculty' && role !== 'admin') {
                  alert('Faculty Only: Access to this dining hall is restricted to university faculty.');
                  return;
                }
                navigation.navigate('CanteenMenu', { canteen: c });
              }}
            />
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
    </SafeAreaView>
  );
};