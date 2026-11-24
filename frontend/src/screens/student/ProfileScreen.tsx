import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, FlatList, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, User, Mail, CreditCard, LogOut, Layers, Clock, Banknote, ChevronRight, ChevronDown, Bell, Sliders } from 'lucide-react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';
import { colors } from '../../config/theme';
import { useAuth } from '../../context/AuthContext';
import { styles } from '../../styles/student/ProfileStyles';
import type { UserRole, UserProfile } from '../../models/types';

interface ProfileScreenProps { navigation: any; }

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
// Old: const { user, role, logout, switchDemoRole } = useAuth();
  const { user, role, logout, switchDemoUser } = useAuth();
  
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [dropdownStep, setDropdownStep] = useState<1 | 2>(1);
  const [selectedDemoRole, setSelectedDemoRole] = useState<UserRole | null>(null);
  const [fetchedUsers, setFetchedUsers] = useState<UserProfile[]>([]);
  const [fetchingUsers, setFetchingUsers] = useState(false);

const handleSelectRole = async (selectedRole: UserRole) => {
    setSelectedDemoRole(selectedRole);
    setDropdownStep(2);
    setFetchingUsers(true);
    
    try {
      // 1. Fetch real users from Firestore based ONLY on the selected role
      const q = query(collection(db, 'users'), where('role_id', '==', selectedRole));
      const snapshot = await getDocs(q);
      
      const realUsers: UserProfile[] = [];
      snapshot.forEach(doc => {
        const data = doc.data() as UserProfile;
        // 2. Filter out soft-deleted accounts locally to bypass Firebase Index errors
        if (data.is_deleted !== true) {
          realUsers.push(data);
        }
      });
      
      setFetchedUsers(realUsers);
    } catch (error) {
      console.error("Error fetching live users:", error);
      Alert.alert('Error', 'Failed to fetch users from the database.');
      setDropdownStep(1);
    } finally {
      setFetchingUsers(false);
    }
  };
  const handleSelectUser = (selectedUser: UserProfile) => {
    setShowRoleDropdown(false);
    setDropdownStep(1);
    // Old: switchDemoRole(selectedUser.role_id);
    switchDemoUser(selectedUser);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><ArrowLeft size={22} color={colors.textPrimary} /></TouchableOpacity>
        <Text style={styles.headerTitle}>User Profile</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarCard}>
          <View style={styles.avatarCircle}><User size={32} color={colors.primaryDark} /></View>
          <Text style={styles.userName}>{user?.name || 'MU Student'}</Text>
          <View style={styles.roleBadge}><Text style={styles.roleBadgeText}>{user?.role?.toUpperCase() || role.toUpperCase()}</Text></View>
        </View>

        <View style={styles.navSection}>
          <TouchableOpacity style={styles.navRow} onPress={() => navigation.navigate('OrderHistory')} activeOpacity={0.7}>
            <Clock size={18} color={colors.textSecondary} />
            <Text style={styles.navText}>My Order History</Text>
            <ChevronRight size={18} color={colors.border} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navRow} onPress={() => navigation.navigate('Notifications')} activeOpacity={0.7}>
            <Bell size={18} color={colors.textSecondary} />
            <Text style={styles.navText}>Notification Center</Text>
            <ChevronRight size={18} color={colors.border} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navRow} onPress={() => navigation.navigate('NotificationSettings')} activeOpacity={0.7}>
            <Sliders size={18} color={colors.textSecondary} />
            <Text style={styles.navText}>Notification Preferences</Text>
            <ChevronRight size={18} color={colors.border} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.navRow, { borderBottomWidth: 0 }]} onPress={() => navigation.navigate('PaymentHistory')} activeOpacity={0.7}>
            <Banknote size={18} color={colors.textSecondary} />
            <Text style={styles.navText}>Payment History & Stats</Text>
            <ChevronRight size={18} color={colors.border} />
          </TouchableOpacity>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>University Credentials</Text>
          <View style={styles.detailRow}>
            <CreditCard size={18} color={colors.primary} />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.detailLabel}>Enrollment / ID</Text>
              <Text style={styles.detailValue}>{user?.enrollment_number || 'N/A'}</Text>
            </View>
          </View>
          <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
            <Mail size={18} color={colors.primary} />
            <View style={{ marginLeft: 12 }}>
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
          <Text style={styles.roleSwitchDesc}>Experience the app from any of the 4 role perspectives:</Text>
          <TouchableOpacity style={styles.demoDropdownBtn} onPress={() => setShowRoleDropdown(true)}>
            <Text style={styles.demoDropdownText}>Select Account Role...</Text>
            <ChevronDown size={18} color={colors.primaryDark} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.7}>
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
                {(['student', 'faculty', 'operator', 'admin'] as UserRole[]).map(r => (
                  <TouchableOpacity key={r} style={styles.menuItem} onPress={() => handleSelectRole(r)}>
                    <Text style={styles.menuItemText}>{r.charAt(0).toUpperCase() + r.slice(1)}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0, marginTop: 10 }]} onPress={() => setShowRoleDropdown(false)}>
                  <Text style={[styles.menuItemText, { color: '#EF4444', textAlign: 'center' }]}>Cancel</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity style={styles.backBtnRow} onPress={() => setDropdownStep(1)}>
                  <ArrowLeft size={16} color={colors.primary} />
                  <Text style={styles.backBtnText}>Back to Roles</Text>
                </TouchableOpacity>
                <Text style={styles.menuHeader}>Step 2: Select {selectedDemoRole?.toUpperCase()} User</Text>
                
                {fetchingUsers ? (
                  <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 20 }} />
                ) : (
                  <FlatList
                    data={fetchedUsers}
                    keyExtractor={(item) => item.user_id}
                    renderItem={({ item }) => (
                      <TouchableOpacity style={styles.menuItem} onPress={() => handleSelectUser(item)}>
                        <Text style={styles.menuItemText}>{item.name}</Text>
                        <Text style={styles.menuItemSubText}>{item.email}</Text>
                      </TouchableOpacity>
                    )}
                    ListEmptyComponent={<Text style={styles.menuItemSubText}>No active users found for this role.</Text>}
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