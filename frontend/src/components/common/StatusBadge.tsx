import React from 'react';
import { View, Text } from 'react-native';
import { colors } from '../../config/theme';
import { styles } from '../../styles/comman/StatusBadgeStyles';
import type { OrderStatus } from '../../models/types';

interface StatusBadgeProps {
  status: OrderStatus;
  style?: object;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, style }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'awaiting_acceptance':
        return {
          label: 'In Queue',
          bgColor: '#FEF3C7',
          textColor: '#92400E',
        };
      case 'preparing':
        return {
          label: 'Preparing',
          bgColor: '#E0F2FE',
          textColor: '#0369A1',
        };
      case 'ready_for_pickup':
        return {
          label: 'Ready for Pickup',
          bgColor: '#DCFCE7',
          textColor: '#15803D',
        };
      case 'picked_up':
        return {
          label: 'Picked Up',
          bgColor: '#F1F5F9',
          textColor: '#475569',
        };
      case 'declined':
        return {
          label: 'Declined',
          bgColor: '#FEE2E2',
          textColor: '#991B1B',
        };
      case 'cancelled':
        return {
          label: 'Cancelled',
          bgColor: '#F1F5F9',
          textColor: '#64748B',
        };
      default:
        return {
          label: status,
          bgColor: colors.surfaceAlt,
          textColor: colors.textSecondary,
        };
    }
  };

  const { label, bgColor, textColor } = getStatusConfig();

  return (
    <View style={[styles.badge, { backgroundColor: bgColor }, style]}>
      <Text style={[styles.badgeText, { color: textColor }]}>{label}</Text>
    </View>
  );
};


