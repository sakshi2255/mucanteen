import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  User,
  Mail,
  CreditCard,
  LogOut,
  Layers,
  Clock,
  Banknote,
  ChevronRight,
  ChevronDown,
  Sliders,
  FileText,
  Store,
  MapPin,
} from 'lucide-react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';
import { colors } from '../../config/theme';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { listenCanteens } from '../../services/firestoreService';
import { styles } from '../../styles/student/ProfileStyles';
import type { Canteen, UserRole, UserProfile } from '../../models/types';

interface ProfileScreenProps {
  navigation: any;
}

const getRoleDisplayLabel = (roleId: UserRole): string => {
  switch (roleId) {
    case 'admin':
      return 'COLLEGE ADMINISTRATOR';
    case 'operator':
      return 'CANTEEN OPERATOR';
    case 'faculty':
      return 'FACULTY';
    default:
      return 'STUDENT';
  }
};

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { user, role, logout, switchDemoUser } = useAuth();
  const { showToast } = useToast();

  const [canteens, setCanteens] = useState<Canteen[]>([]);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [dropdownStep, setDropdownStep] = useState<1 | 2>(1);
  const [selectedDemoRole, setSelectedDemoRole] = useState<UserRole | null>(null);
  const [fetchedUsers, setFetchedUsers] = useState<UserProfile[]>([]);
  const [fetchingUsers, setFetchingUsers] = useState(false);

  const activeRole: UserRole = user?.role_id || role || 'student';

  useEffect(() => {
    if (activeRole !== 'operator') return;
    const unsub = listenCanteens((list) => setCanteens(list));
    return unsub;
  }, [activeRole]);

  const assignedCanteens = useMemo(() => {
    if (activeRole !== 'operator') return [];
    const assignedIds =
      user?.assigned_canteen_ids && user.assigned_canteen_ids.length > 0
        ? user.assigned_canteen_ids
        : ['canteen_main_1'];
    return canteens.filter((c) => assignedIds.includes(c.canteen_id));
  }, [activeRole, user?.assigned_canteen_ids, canteens]);

  const handleSelectRole = async (selectedRole: UserRole) => {
    setSelectedDemoRole(selectedRole);
    setDropdownStep(2);
    setFetchingUsers(true);

    try {
      const q = query(collection(db, 'users'), where('role_id', '==', selectedRole));
      const snapshot = await getDocs(q);

      const realUsers: UserProfile[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as UserProfile;
        if (data.is_deleted !== true) {
          realUsers.push({
            ...data,
            user_id: data.user_id || docSnap.id,
          });
        }
      });

      setFetchedUsers(realUsers);
    } catch (error) {
      console.error('Error fetching live users:', error);
      showToast('Failed to load accounts from database.', 'error');
      setDropdownStep(1);
    } finally {
      setFetchingUsers(false);
    }
  };

  const handleSelectUser = (selectedUser: UserProfile) => {
    setShowRoleDropdown(false);
    setDropdownStep(1);
    switchDemoUser(selectedUser);
    showToast(
      `Switched to ${selectedUser.name} (${getRoleDisplayLabel(selectedUser.role_id)})`,
      'success',
      'Role Switched'
    );
  };

  const handleSignOut = async () => {
    try {
      await logout();
      showToast('You have been signed out.', 'info', 'Signed Out');
    } catch {
      showToast('Could not sign out. Please try again.', 'error');
    }
  };

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        {navigation.canGoBack() ? (
          <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
            <ArrowLeft size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerSpacer} />
        )}
        <Text style={styles.headerTitle}>User Profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.avatarCard}>
          <View style={styles.avatarCircle}>
            <User size={32} color={colors.primaryDark} />
          </View>
          <Text style={styles.userName}>{user?.name || 'MU User'}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>{getRoleDisplayLabel(activeRole)}</Text>
          </View>
        </View>

        {/* Role-Specific Navigation Section */}
        {activeRole === 'student' && (
          <View style={styles.navSection}>
            <TouchableOpacity
              style={styles.navRow}
              onPress={() => navigation.navigate('OrderHistory', { mode: 'history' })}
              activeOpacity={0.7}
            >
              <Clock size={18} color={colors.textSecondary} />
              <Text style={styles.navText}>My Order History</Text>
              <ChevronRight size={18} color={colors.border} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.navRow}
              onPress={() => navigation.navigate('NotificationSettings')}
              activeOpacity={0.7}
            >
              <Sliders size={18} color={colors.textSecondary} />
              <Text style={styles.navText}>Notification Preferences</Text>
              <ChevronRight size={18} color={colors.border} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.navRow, styles.navRowLast]}
              onPress={() => navigation.navigate('PaymentHistory')}
              activeOpacity={0.7}
            >
              <Banknote size={18} color={colors.textSecondary} />
              <Text style={styles.navText}>Payment History & Stats</Text>
              <ChevronRight size={18} color={colors.border} />
            </TouchableOpacity>
          </View>
        )}

        {activeRole === 'faculty' && (
          <View style={styles.navSection}>
            <TouchableOpacity
              style={styles.navRow}
              onPress={() => navigation.navigate('OrderHistory', { mode: 'history' })}
              activeOpacity={0.7}
            >
              <Clock size={18} color={colors.textSecondary} />
              <Text style={styles.navText}>My Order History</Text>
              <ChevronRight size={18} color={colors.border} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.navRow, styles.navRowLast]}
              onPress={() => navigation.navigate('PaymentHistory')}
              activeOpacity={0.7}
            >
              <Banknote size={18} color={colors.textSecondary} />
              <Text style={styles.navText}>Payment History & Stats</Text>
              <ChevronRight size={18} color={colors.border} />
            </TouchableOpacity>
          </View>
        )}

        {activeRole === 'operator' && (
          <>
            <View style={styles.navSection}>
              <TouchableOpacity
                style={styles.navRow}
                onPress={() =>
                  navigation.navigate('OrderHistory', { mode: 'history', scope: 'canteen' })
                }
                activeOpacity={0.7}
              >
                <Clock size={18} color={colors.textSecondary} />
                <Text style={styles.navText}>Canteen Order History</Text>
                <ChevronRight size={18} color={colors.border} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.navRow}
                onPress={() => navigation.navigate('NotificationSettings')}
                activeOpacity={0.7}
              >
                <Sliders size={18} color={colors.textSecondary} />
                <Text style={styles.navText}>Notification Preferences</Text>
                <ChevronRight size={18} color={colors.border} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.navRow, styles.navRowLast]}
                onPress={() => navigation.navigate('PaymentHistory', { scope: 'canteen' })}
                activeOpacity={0.7}
              >
                <Banknote size={18} color={colors.textSecondary} />
                <Text style={styles.navText}>Payment History & Stats</Text>
                <ChevronRight size={18} color={colors.border} />
              </TouchableOpacity>
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeading}>Assigned Canteen</Text>
              {assignedCanteens.length === 0 ? (
                <Text style={styles.canteenMetaText}>
                  Assigned Canteen ID: {user?.assigned_canteen_ids?.[0] || 'canteen_main_1'}
                </Text>
              ) : (
                assignedCanteens.map((c) => (
                  <View key={c.canteen_id} style={styles.canteenItemBox}>
                    <View style={styles.canteenItemTopRow}>
                      <View style={styles.canteenTitleRow}>
                        <Store size={16} color={colors.primaryDark} />
                        <Text style={styles.canteenNameText}>{c.name}</Text>
                      </View>
                      <View
                        style={[
                          styles.canteenStatusBadge,
                          c.is_open ? styles.canteenStatusOpen : styles.canteenStatusClosed,
                        ]}
                      >
                        <Text
                          style={[
                            styles.canteenStatusText,
                            c.is_open
                              ? styles.canteenStatusTextOpen
                              : styles.canteenStatusTextClosed,
                          ]}
                        >
                          {c.is_open ? 'OPEN' : 'CLOSED'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.canteenMetaRow}>
                      <MapPin size={13} color={colors.textSecondary} />
                      <Text style={styles.canteenMetaText}>
                        Floor {c.floor === 0 ? 'Ground' : c.floor} • {c.building_id}
                      </Text>
                    </View>
                    <View style={styles.canteenMetaRow}>
                      <Clock size={13} color={colors.textSecondary} />
                      <Text style={styles.canteenMetaText}>
                        {c.operating_hours || '08:00 AM - 06:00 PM'}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </>
        )}

        {activeRole === 'admin' && (
          <View style={styles.navSection}>
            <TouchableOpacity
              style={[styles.navRow, styles.navRowLast]}
              onPress={() => navigation.navigate('AuditLogs')}
              activeOpacity={0.7}
            >
              <FileText size={18} color={colors.textSecondary} />
              <Text style={styles.navText}>Logs History</Text>
              <ChevronRight size={18} color={colors.border} />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>University Credentials</Text>
          <View style={styles.detailRow}>
            <CreditCard size={18} color={colors.primary} />
            <View style={styles.detailTextCol}>
              <Text style={styles.detailLabel}>Enrollment / ID</Text>
              <Text style={styles.detailValue}>{user?.enrollment_number || 'N/A'}</Text>
            </View>
          </View>
          <View style={[styles.detailRow, styles.detailRowLast]}>
            <Mail size={18} color={colors.primary} />
            <View style={styles.detailTextCol}>
              <Text style={styles.detailLabel}>Email</Text>
              <Text style={styles.detailValue}>{user?.email || 'N/A'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.roleSwitchCard}>
          <View style={styles.roleSwitchHeader}>
            <Layers size={16} color={colors.primaryDark} />
            <Text style={styles.roleSwitchTitle}>SWITCH ACTIVE ROLE</Text>
          </View>
          <Text style={styles.roleSwitchDesc}>
            Experience the app from any of the 4 role perspectives:
          </Text>
          <TouchableOpacity
            style={styles.demoDropdownBtn}
            onPress={() => setShowRoleDropdown(true)}
          >
            <Text style={styles.demoDropdownText}>Select Account Role...</Text>
            <ChevronDown size={18} color={colors.primaryDark} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleSignOut} activeOpacity={0.7}>
          <LogOut size={18} color="#EF4444" />
          <Text style={styles.logoutBtnText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={showRoleDropdown} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.menuContainer}>
            {dropdownStep === 1 ? (
              <>
                <Text style={styles.menuHeader}>Step 1: Select Role</Text>
                {(['student', 'faculty', 'operator', 'admin'] as UserRole[]).map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={styles.menuItem}
                    onPress={() => handleSelectRole(r)}
                  >
                    <Text style={styles.menuItemText}>
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={styles.cancelMenuItem}
                  onPress={() => setShowRoleDropdown(false)}
                >
                  <Text style={styles.cancelMenuText}>Cancel</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity style={styles.backBtnRow} onPress={() => setDropdownStep(1)}>
                  <ArrowLeft size={16} color={colors.primary} />
                  <Text style={styles.backBtnText}>Back to Roles</Text>
                </TouchableOpacity>
                <Text style={styles.menuHeader}>
                  Step 2: Select {selectedDemoRole?.toUpperCase()} User
                </Text>

                {fetchingUsers ? (
                  <ActivityIndicator
                    size="large"
                    color={colors.primary}
                    style={styles.loaderSpacing}
                  />
                ) : (
                  <FlatList
                    data={fetchedUsers}
                    keyExtractor={(item) => item.user_id}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => handleSelectUser(item)}
                      >
                        <Text style={styles.menuItemText}>{item.name}</Text>
                        <Text style={styles.menuItemSubText}>{item.email}</Text>
                      </TouchableOpacity>
                    )}
                    ListEmptyComponent={
                      <Text style={styles.menuItemSubText}>
                        No active users found for this role.
                      </Text>
                    }
                  />
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};