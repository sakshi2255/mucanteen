import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  SafeAreaView 
} from 'react-native';
import { ArrowLeft, User, Shield, CreditCard, Mail } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../../config/theme';
import { DEMO_PROFILES } from '../../services/seedData';
import type { UserProfile, UserRole } from '../../models/types';

interface UserManagementScreenProps {
  navigation: any;
}

export const UserManagementScreen: React.FC<UserManagementScreenProps> = ({ navigation }) => {
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [users, setUsers] = useState<UserProfile[]>(DEMO_PROFILES);

  const filteredUsers = users.filter((u) => {
    if (selectedRole === 'all') return true;
    return u.role_id === selectedRole;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>User & Role Management</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* Role Filter Tabs */}
      <View style={styles.filterTabs}>
        {['all', 'student', 'faculty', 'operator', 'admin'].map((r) => {
          const isSelected = selectedRole === r;
          return (
            <TouchableOpacity
              key={r}
              style={[styles.tab, isSelected && styles.activeTab]}
              onPress={() => setSelectedRole(r)}
            >
              <Text style={[styles.tabText, isSelected && styles.activeTabText]}>
                {r.toUpperCase()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.user_id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.userCard}>
            <View style={styles.userHeader}>
              <View style={styles.userAvatar}>
                <User size={18} color={colors.primaryDark} />
              </View>
              <View style={{ flex: 1, marginLeft: spacing.sm }}>
                <Text style={styles.userName}>{item.name}</Text>
                <Text style={styles.userEmail}>{item.email}</Text>
              </View>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>{item.role_id.toUpperCase()}</Text>
              </View>
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>ID / Enrollment: </Text>
              <Text style={styles.metaValue}>{item.enrollment_number}</Text>
            </View>

            {item.assigned_canteen_ids && item.assigned_canteen_ids.length > 0 && (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Assigned Canteen: </Text>
                <Text style={styles.metaValue}>{item.assigned_canteen_ids.join(', ')}</Text>
              </View>
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.heavy,
    color: colors.textPrimary,
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: borderRadius.round,
    backgroundColor: colors.surfaceAlt,
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  userCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  userEmail: {
    fontSize: 11,
    color: colors.textMuted,
  },
  roleBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  roleBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  metaRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  metaLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  metaValue: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});

