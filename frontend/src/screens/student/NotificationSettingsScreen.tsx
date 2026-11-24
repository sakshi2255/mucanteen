import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  ArrowLeft,
  Receipt,
  CheckCircle2,
  ChefHat,
  ShoppingBag,
  Clock,
  AlertTriangle,
  XCircle,
} from 'lucide-react-native';
import { useNotifications } from '../../context/NotificationContext';
import { colors } from '../../config/theme';
import { styles } from '../../styles/student/NotificationSettingsStyles';
import type { NotificationSettings } from '../../models/types';

type SettingKey = keyof Omit<NotificationSettings, 'user_id'>;

interface SettingRow {
  key: SettingKey;
  label: string;
  subtitle: string;
  IconComponent: React.ComponentType<{ size?: number; color?: string }>;
}

const SETTING_ROWS: SettingRow[] = [
  {
    key: 'order_placed',
    label: 'Order Placed',
    subtitle: 'When your order is successfully submitted',
    IconComponent: Receipt,
  },
  {
    key: 'order_accepted',
    label: 'Order Accepted',
    subtitle: 'When the canteen confirms your order',
    IconComponent: CheckCircle2,
  },
  {
    key: 'order_preparing',
    label: 'Order Preparing',
    subtitle: 'When the canteen starts preparing your food',
    IconComponent: ChefHat,
  },
  {
    key: 'order_ready',
    label: 'Ready for Pickup',
    subtitle: 'When your order is ready to be collected',
    IconComponent: ShoppingBag,
  },
  {
    key: 'pickup_warning',
    label: 'Pickup Deadline Warning',
    subtitle: '2-minute reminder before collection deadline',
    IconComponent: Clock,
  },
  {
    key: 'pickup_failed',
    label: 'Order Not Collected',
    subtitle: 'When your order expires due to late pickup',
    IconComponent: AlertTriangle,
  },
  {
    key: 'order_declined',
    label: 'Order Declined',
    subtitle: 'When the canteen is unable to fulfill your order',
    IconComponent: XCircle,
  },
];

export function NotificationSettingsScreen() {
  const navigation = useNavigation<any>();
  const { settings, updateSettings, permissionGranted, requestSystemPermission } = useNotifications();

  const getValue = (key: SettingKey): boolean => {
    if (!settings) return true;
    const val = settings[key];
    return typeof val === 'boolean' ? val : true;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification Preferences</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {!permissionGranted && (
          <View style={styles.permissionBanner}>
            <View style={styles.permissionTextCol}>
              <Text style={styles.permissionTitle}>System Notifications Disabled</Text>
              <Text style={styles.permissionSubtitle}>
                Enable system notifications to receive live order alerts even when the app is closed.
              </Text>
            </View>
            <TouchableOpacity style={styles.permissionBtn} onPress={requestSystemPermission}>
              <Text style={styles.permissionBtnText}>Enable</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.sectionLabel}>Order Notifications</Text>

        <View style={styles.card}>
          {SETTING_ROWS.map((row, index) => {
            const Icon = row.IconComponent;
            return (
              <View key={row.key} style={[styles.row, index > 0 && styles.rowBorder]}>
                <View style={styles.rowLeft}>
                  <View style={styles.iconBox}>
                    <Icon size={18} color={colors.primary} />
                  </View>
                  <View style={styles.rowTextCol}>
                    <Text style={styles.rowTitle}>{row.label}</Text>
                    <Text style={styles.rowSubtitle}>{row.subtitle}</Text>
                  </View>
                </View>
                <Switch
                  value={getValue(row.key)}
                  onValueChange={(val) => updateSettings(row.key, val)}
                  trackColor={{ false: colors.border, true: colors.primarySubtle }}
                  thumbColor={getValue(row.key) ? colors.primary : colors.textMuted}
                />
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default NotificationSettingsScreen;