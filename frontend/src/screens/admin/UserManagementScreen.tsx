import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, TextInput, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, User, Plus, X, Edit2 } from 'lucide-react-native';
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';
import { colors } from '../../config/theme';
import { styles } from '../../styles/admin/UserManagementStyles';
import { modalStyles } from '../../styles/admin/UserManagementModalStyles';
import type { UserProfile, UserRole } from '../../models/types';

interface UserManagementScreenProps { navigation: any; }

export const UserManagementScreen: React.FC<UserManagementScreenProps> = ({ navigation }) => {
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    enrollment_number: '',
    role_id: 'student' as UserRole,
  });

  // Real-time listener for users
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersList: UserProfile[] = [];
      snapshot.forEach((doc) => {
        usersList.push({ ...doc.data() } as UserProfile);
      });
      setUsers(usersList);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching users:", error);
      setLoading(false);
    });
    return unsub;
  }, []);

  const filteredUsers = users.filter((u) => {
    if (selectedRoleFilter === 'all') return true;
    return u.role_id === selectedRoleFilter;
  });

  const openAddModal = () => {
    setEditingUser(null);
    setFormData({ name: '', email: '', enrollment_number: '', role_id: 'student' });
    setModalVisible(true);
  };

  const openEditModal = (user: UserProfile) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      enrollment_number: user.enrollment_number || '',
      role_id: user.role_id,
    });
    setModalVisible(true);
  };

  const handleSaveUser = async () => {
    if (!formData.name || !formData.email) {
      Alert.alert('Error', 'Name and Email are required.');
      return;
    }

    try {
      const userId = editingUser ? editingUser.user_id : formData.email.split('@')[0]; // Simple ID generator for manual adds
      const userRef = doc(db, 'users', userId);
      
      const payload: UserProfile = {
        user_id: userId,
        name: formData.name,
        email: formData.email,
        enrollment_number: formData.enrollment_number || '',
        role_id: formData.role_id,
        created_at: editingUser ? editingUser.created_at : new Date().toISOString(),
        assigned_canteen_ids: editingUser ? editingUser.assigned_canteen_ids : [],
        favourite_canteen_ids: editingUser ? editingUser.favourite_canteen_ids : [],
        role: 'Faculty',
        account_status: 'active',
        is_deleted: false,
        updated_at: ''
      };

      await setDoc(userRef, payload, { merge: true });
      setModalVisible(false);
    } catch (error) {
      console.error("Error saving user:", error);
      Alert.alert('Error', 'Failed to save user data.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>User & Role Management</Text>
        <TouchableOpacity onPress={openAddModal} style={{ padding: 4 }}>
          <Plus size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.filterTabs}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['all', 'student', 'faculty', 'operator', 'admin'].map((r) => {
            const isSelected = selectedRoleFilter === r;
            return (
              <TouchableOpacity key={r} style={[styles.tab, isSelected && styles.activeTab]} onPress={() => setSelectedRoleFilter(r)}>
                <Text style={[styles.tabText, isSelected && styles.activeTabText]}>{r.toUpperCase()}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.user_id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.userCard}>
              <View style={styles.userHeader}>
                <View style={styles.userAvatar}><User size={18} color={colors.primaryDark} /></View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.userName}>{item.name}</Text>
                  <Text style={styles.userEmail}>{item.email}</Text>
                </View>
                <TouchableOpacity onPress={() => openEditModal(item)} style={{ padding: 4, marginRight: 8 }}>
                  <Edit2 size={16} color={colors.textMuted} />
                </TouchableOpacity>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>{item.role_id.toUpperCase()}</Text>
                </View>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>ID / Enrollment: </Text>
                <Text style={styles.metaValue}>{item.enrollment_number || 'N/A'}</Text>
              </View>
            </View>
          )}
        />
      )}

      {/* Add / Edit User Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={modalStyles.overlay}>
          <View style={modalStyles.sheet}>
            <View style={modalStyles.sheetHeader}>
              <Text style={modalStyles.sheetTitle}>
                {editingUser ? 'Edit User Profile' : 'Add New User'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}><X size={24} color={colors.textSecondary} /></TouchableOpacity>
            </View>

            <TextInput style={modalStyles.input} placeholder="Full Name" value={formData.name} onChangeText={(t) => setFormData({ ...formData, name: t })} />
            <TextInput style={modalStyles.input} placeholder="Email Address" value={formData.email} keyboardType="email-address" autoCapitalize="none" onChangeText={(t) => setFormData({ ...formData, email: t })} />
            <TextInput style={modalStyles.input} placeholder="Enrollment / ID (Optional)" value={formData.enrollment_number} onChangeText={(t) => setFormData({ ...formData, enrollment_number: t })} />
            
            <Text style={modalStyles.roleLabel}>Assign Role:</Text>
            <View style={modalStyles.roleRow}>
              {(['student', 'faculty', 'operator', 'admin'] as UserRole[]).map((r) => (
                <TouchableOpacity key={r} style={[modalStyles.roleChip, formData.role_id === r && modalStyles.roleChipActive]} onPress={() => setFormData({ ...formData, role_id: r })}>
                  <Text style={[modalStyles.roleChipText, formData.role_id === r && modalStyles.roleChipTextActive]}>{r.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={modalStyles.saveBtn} onPress={handleSaveUser}>
              <Text style={modalStyles.saveBtnText}>{editingUser ? 'Save Changes' : 'Create User'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};