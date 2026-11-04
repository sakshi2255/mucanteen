import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  SafeAreaView 
} from 'react-native';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  CreditCard, 
  Shield, 
  LogOut, 
  Layers 
} from 'lucide-react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../../config/theme';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../models/types';

interface ProfileScreenProps {
  navigation: any;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { user, role, logout, switchDemoRole } = useAuth();

  const handleRoleSwitch = (targetRole: UserRole) => {
    switchDemoRole(targetRole);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>User Profile</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={styles.avatarCard}>
          <View style={styles.avatarCircle}>
            <User size={38} color={colors.primaryDark} />
          </View>
          <Text style={styles.userName}>{user?.name || 'MU Student'}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>{user?.role?.toUpperCase() || role.toUpperCase()}</Text>
          </View>
        </View>

        {/* User Details */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>University Credentials</Text>

          <View style={styles.detailRow}>
            <CreditCard size={18} color={colors.primary} />
            <View style={{ marginLeft: spacing.md }}>
              <Text style={styles.detailLabel}>Enrollment / ID</Text>
              <Text style={styles.detailValue}>{user?.enrollment_number || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Mail size={18} color={colors.primary} />
            <View style={{ marginLeft: spacing.md }}>
              <Text style={styles.detailLabel}>Email</Text>
              <Text style={styles.detailValue}>{user?.email || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Shield size={18} color={colors.primary} />
            <View style={{ marginLeft: spacing.md }}>
              <Text style={styles.detailLabel}>Account Status</Text>
              <Text style={[styles.detailValue, { color: colors.accentGreen }]}>Active • Verified</Text>
            </View>
          </View>
        </View>

        {/* Quick Role Switcher for Review 1 Testing */}
        <View style={styles.roleSwitchCard}>
          <View style={styles.roleSwitchHeader}>
            <Layers size={16} color={colors.primaryDark} />
            <Text style={styles.roleSwitchTitle}>SWITCH ROLE (REVIEW 1 DEMO)</Text>
          </View>
          <Text style={styles.roleSwitchDesc}>
            Easily experience the app from any of the 4 university role perspectives:
          </Text>

          <View style={styles.rolesGrid}>
            <TouchableOpacity 
              style={[styles.roleBtn, role === 'student' && styles.activeRoleBtn]}
              onPress={() => handleRoleSwitch('student')}
            >
              <Text style={[styles.roleBtnText, role === 'student' && styles.activeRoleBtnText]}>
                Student
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.roleBtn, role === 'faculty' && styles.activeRoleBtn]}
              onPress={() => handleRoleSwitch('faculty')}
            >
              <Text style={[styles.roleBtnText, role === 'faculty' && styles.activeRoleBtnText]}>
                Faculty
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.roleBtn, role === 'operator' && styles.activeRoleBtn]}
              onPress={() => handleRoleSwitch('operator')}
            >
              <Text style={[styles.roleBtnText, role === 'operator' && styles.activeRoleBtnText]}>
                Operator
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.roleBtn, role === 'admin' && styles.activeRoleBtn]}
              onPress={() => handleRoleSwitch('admin')}
            >
              <Text style={[styles.roleBtnText, role === 'admin' && styles.activeRoleBtnText]}>
                Administrator
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity 
          style={styles.logoutBtn}
          onPress={logout}
          activeOpacity={0.7}
        >
          <LogOut size={16} color="#EF4444" />
          <Text style={styles.logoutBtnText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
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
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  avatarCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  roleBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: borderRadius.round,
    marginTop: 6,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primaryDark,
    letterSpacing: 0.5,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  sectionHeading: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  detailLabel: {
    fontSize: 11,
    color: colors.textMuted,
  },
  detailValue: {
    fontSize: typography.fontSizes.sm,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 1,
  },
  roleSwitchCard: {
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  roleSwitchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  roleSwitchTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  roleSwitchDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginVertical: 6,
  },
  rolesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  roleBtn: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface,
    paddingVertical: 10,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    alignItems: 'center',
  },
  activeRoleBtn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  roleBtnText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  activeRoleBtnText: {
    color: '#FFFFFF',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 12,
    borderRadius: borderRadius.md,
    gap: 6,
  },
  logoutBtnText: {
    color: '#EF4444',
    fontWeight: '700',
    fontSize: typography.fontSizes.xs,
  },
});

