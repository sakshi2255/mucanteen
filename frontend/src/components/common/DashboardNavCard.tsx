import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from '../../styles/comman/DashboardNavCardStyles';

interface DashboardNavCardProps {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  badge?: string | number;
  onPress: () => void;
  style?: object;
}

export const DashboardNavCard: React.FC<DashboardNavCardProps> = ({
  title,
  subtitle,
  icon,
  badge,
  onPress,
  style,
}) => {
  return (
    <TouchableOpacity 
      style={[styles.card, style]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={styles.iconContainer}>
        {icon}
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {subtitle && (
          <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
        )}
      </View>

      {badge !== undefined && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};
