import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Store, MapPin, Clock, ShieldAlert } from 'lucide-react-native';
import { colors } from '../../config/theme';
import { styles } from '../../styles/comman/CanteenCardStyles';
import type { Canteen } from '../../models/types';

interface CanteenCardProps {
  canteen: Canteen;
  onPress: (canteen: Canteen) => void;
  userRole?: string;
  isFavourite?: boolean;
  onToggleFavourite?: (canteenId: string) => void;
  compactGrid?: boolean;
}

export const CanteenCard: React.FC<CanteenCardProps> = ({
  canteen,
  onPress,
  userRole = 'student',
  compactGrid = true,
}) => {
  const isFacultyOnly = canteen.canteen_type === 'faculty_only';
  const isEligible = !isFacultyOnly || userRole === 'faculty' || userRole === 'admin';

  const buildingName = canteen.building_id.includes('law') 
    ? 'Law Building' 
    : canteen.building_id.includes('hostel') 
    ? 'Hostel Mess' 
    : 'Main Building';

  const shortCode = canteen.token_prefix 
    ? `C${canteen.floor || 1} • [${canteen.token_prefix}]`
    : `C${canteen.floor || 1}`;

  return (
    <TouchableOpacity
      style={[
        styles.gridCard,
        !isEligible && styles.ineligibleCard,
        !canteen.is_open && styles.closedCard,
      ]}
      onPress={() => onPress(canteen)}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`${canteen.name}, ${canteen.is_open ? 'Open' : 'Closed'}`}
    >
      {/* Top Header: Badge & Status */}
      <View style={styles.topRow}>
        <View style={styles.prefixBadge}>
          <Text style={styles.prefixText}>{shortCode}</Text>
        </View>
        <View style={[styles.statusBadge, canteen.is_open ? styles.openBadge : styles.closedBadge]}>
          <View style={[styles.statusDot, canteen.is_open ? styles.openDot : styles.closedDot]} />
          <Text style={[styles.statusText, canteen.is_open ? styles.openText : styles.closedText]}>
            {canteen.is_open ? 'OPEN' : 'CLOSED'}
          </Text>
        </View>
      </View>

      {/* Main Icon & Title */}
      <View style={styles.centerSection}>
        <View style={styles.iconCircle}>
          <Store size={22} color={colors.primary} />
        </View>
        <Text style={styles.canteenName} numberOfLines={2}>
          {canteen.name}
        </Text>
      </View>

      {/* Location & Restriction */}
      <View style={styles.bottomSection}>
        <View style={styles.locationRow}>
          <MapPin size={11} color={colors.textSecondary} />
          <Text style={styles.locationText} numberOfLines={1}>
            {buildingName} • Fl {canteen.floor}
          </Text>
        </View>

        {isFacultyOnly ? (
          <View style={styles.facultyBadge}>
            <ShieldAlert size={10} color="#B45309" />
            <Text style={styles.facultyBadgeText}>FACULTY ONLY</Text>
          </View>
        ) : (
          <View style={styles.hoursRow}>
            <Clock size={10} color={colors.textMuted} />
            <Text style={styles.hoursText} numberOfLines={1}>
              {canteen.operating_hours || '08:00 - 18:00'}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};
