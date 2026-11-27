import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, User, Plus, X, Edit2, Store, Check } from 'lucide-react-native';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';
import { colors } from '../../config/theme';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { listenCanteens, recordAuditLog } from '../../services/firestoreService';
import { styles } from '../../styles/admin/UserManagementStyles';
import { modalStyles } from '../../styles/admin/UserManagementModalStyles';
import type { Canteen, UserProfile, UserRole } from '../../models/types';

interface UserManagementScreenProps {
  navigation: any;
}

const mapRoleIdToDisplayName = (roleId: UserRole): UserProfile['role'] => {
  switch (roleId) {
    case 'admin':
      return 'College Administrator';
    case 'operator':
      return 'Canteen Operator';
    case 'faculty':
      return 'Faculty';
    default:
      return 'Student';
  }
};

export const UserManagementScreen: React.FC<UserManagementScreenProps> = ({ navigation }) => {
  const { user: currentAdmin } = useAuth();
  const { showToast } = useToast();

  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [canteens, setCanteens] = useState<Canteen[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    enrollment_number: '',
    role_id: 'student' as UserRole,
    assigned_canteen_id: '',
  });

  useEffect(() => {
    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const usersList: UserProfile[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as UserProfile;
          if (data.is_deleted !== true) {
            usersList.push({
              ...data,
              user_id: data.user_id || docSnap.id,
              role_id: data.role_id || 'student',
              role: mapRoleIdToDisplayName(data.role_id || 'student'),
              assigned_canteen_ids: Array.isArray(data.assigned_canteen_ids)
                ? data.assigned_canteen_ids
                : [],
            });
          }
        });
        setUsers(usersList);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching users:', error);
        showToast('Failed to load users list.', 'error');
        setLoading(false);
      }
    );

    const unsubCanteens = listenCanteens((list) => {
      setCanteens(list.filter((c) => c.is_active !== false));
    });

    return () => {
      unsubUsers();
      unsubCanteens();
    };
  }, [showToast]);

  const canteenNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    canteens.forEach((c) => {
      map[c.canteen_id] = c.name;
    });
    return map;
  }, [canteens]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (selectedRoleFilter === 'all') return true;
      return u.role_id === selectedRoleFilter;
    });
  }, [users, selectedRoleFilter]);

  const handleCloseModal = () => {
    if (!saving) {
      setModalVisible(false);
    }
  };

  const openAddModal = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      enrollment_number: '',
      role_id: 'student',
      assigned_canteen_id: canteens[0]?.canteen_id || '',
    });
    setModalVisible(true);
  };

  const openEditModal = (targetUser: UserProfile) => {
    setEditingUser(targetUser);
    setFormData({
      name: targetUser.name || '',
      email: targetUser.email || '',
      enrollment_number: targetUser.enrollment_number || '',
      role_id: targetUser.role_id || 'student',
      assigned_canteen_id:
        targetUser.assigned_canteen_ids?.[0] || canteens[0]?.canteen_id || '',
    });
    setModalVisible(true);
  };

  const handleRoleSelect = (roleId: UserRole) => {
    setFormData((prev) => ({
      ...prev,
      role_id: roleId,
      assigned_canteen_id:
        roleId === 'operator'
          ? prev.assigned_canteen_id || canteens[0]?.canteen_id || ''
          : prev.assigned_canteen_id,
    }));
  };

  const handleSaveUser = async () => {
    const trimmedName = formData.name.trim();
    const trimmedEmail = formData.email.trim().toLowerCase();
    const trimmedEnrollment = formData.enrollment_number.trim();

    if (!trimmedName || !trimmedEmail) {
      showToast('Full name and email address are required.', 'error', 'Validation Error');
      return;
    }

    if (!trimmedEmail.includes('@')) {
      showToast('Please enter a valid email address.', 'error', 'Validation Error');
      return;
    }

    if (formData.role_id === 'operator' && !formData.assigned_canteen_id) {
      showToast(
        'Please select a canteen to assign this operator to.',
        'error',
        'Canteen Required'
      );
      return;
    }

    setSaving(true);
    try {
      const nowIso = new Date().toISOString();
      const emailPrefix = trimmedEmail.split('@')[0].replace(/[^a-zA-Z0-9_-]/g, '');
      const userId = editingUser
        ? editingUser.user_id
        : `${formData.role_id}_${emailPrefix}_${String(Date.now()).slice(-4)}`;

      const assignedCanteenIds =
        formData.role_id === 'operator' && formData.assigned_canteen_id
          ? [formData.assigned_canteen_id]
          : [];

      const roleDisplayName = mapRoleIdToDisplayName(formData.role_id);

      const payload: UserProfile = {
        user_id: userId,
        name: trimmedName,
        email: trimmedEmail,
        enrollment_number: trimmedEnrollment,
        role_id: formData.role_id,
        role: roleDisplayName,
        account_status: editingUser?.account_status || 'active',
        is_deleted: false,
        assigned_canteen_ids: assignedCanteenIds,
        favourite_canteen_ids: editingUser?.favourite_canteen_ids || [],
        created_at: editingUser?.created_at || nowIso,
        updated_at: nowIso,
      };

      await setDoc(doc(db, 'users', userId), payload, { merge: true });

      // Sync operator_ids on canteens when role/assignment changes
      const prevCanteenIds = editingUser?.assigned_canteen_ids || [];
      const removedCanteenIds = prevCanteenIds.filter((id) => !assignedCanteenIds.includes(id));

      for (const oldCanteenId of removedCanteenIds) {
        try {
          await updateDoc(doc(db, 'canteens', oldCanteenId), {
            operator_ids: arrayRemove(userId),
            updated_at: nowIso,
          });
        } catch {
          // Ignore if legacy canteen doc does not exist
        }
      }

      if (formData.role_id === 'operator' && formData.assigned_canteen_id) {
        try {
          await updateDoc(doc(db, 'canteens', formData.assigned_canteen_id), {
            operator_ids: arrayUnion(userId),
            updated_at: nowIso,
          });
        } catch {
          // Ignore if canteen doc update fails
        }
      }

      await recordAuditLog({
        actor_id: currentAdmin?.user_id || 'admin',
        actor_name_snapshot: currentAdmin?.name || 'Administrator',
        actor_role: 'admin',
        action: editingUser ? 'USER_UPDATED' : 'USER_CREATED',
        entity_type: 'user',
        entity_id: userId,
        canteen_id: assignedCanteenIds[0] || null,
        description: `${editingUser ? 'Updated' : 'Created'} ${roleDisplayName} ${trimmedName}`,
        before_data: editingUser ? (editingUser as unknown as Record<string, unknown>) : null,
        after_data: payload as unknown as Record<string, unknown>,
      });

      setModalVisible(false);
      showToast(
        editingUser
          ? `Updated ${trimmedName} (${roleDisplayName}).`
          : `Added ${trimmedName} as ${roleDisplayName}.`,
        'success',
        editingUser ? 'User Updated' : 'User Created'
      );
    } catch (error: any) {
      console.error('Error saving user:', error);
      showToast(error?.message || 'Failed to save user data.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>User & Role Management</Text>
        <TouchableOpacity onPress={openAddModal} style={styles.addBtn}>
          <Plus size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.filterTabs}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterTabsContent}
        >
          {['all', 'student', 'faculty', 'operator', 'admin'].map((r) => {
            const isSelected = selectedRoleFilter === r;
            return (
              <TouchableOpacity
                key={r}
                style={[styles.tab, isSelected && styles.activeTab]}
                onPress={() => setSelectedRoleFilter(r)}
              >
                <Text style={[styles.tabText, isSelected && styles.activeTabText]}>
                  {r.toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.user_id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No users found for this role filter.</Text>
          }
          renderItem={({ item }) => {
            const assignedNames = (item.assigned_canteen_ids || [])
              .map((cid) => canteenNameMap[cid] || cid)
              .join(', ');

            return (
              <View style={styles.userCard}>
                <View style={styles.userHeader}>
                  <View style={styles.userAvatar}>
                    <User size={18} color={colors.primaryDark} />
                  </View>
                  <View style={styles.userInfoCol}>
                    <Text style={styles.userName}>{item.name}</Text>
                    <Text style={styles.userEmail}>{item.email}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => openEditModal(item)}
                    style={styles.editIconBtn}
                  >
                    <Edit2 size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                  <View style={styles.roleBadge}>
                    <Text style={styles.roleBadgeText}>
                      {(item.role_id || 'student').toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>ID / Enrollment: </Text>
                  <Text style={styles.metaValue}>{item.enrollment_number || 'N/A'}</Text>
                </View>

                {item.role_id === 'operator' && (
                  <View style={styles.canteenTagRow}>
                    <Store size={13} color={colors.primaryDark} />
                    <Text style={styles.canteenTagText} numberOfLines={1}>
                      Assigned Canteen: {assignedNames || 'Unassigned'}
                    </Text>
                  </View>
                )}
              </View>
            );
          }}
        />
      )}

      {/* Add / Edit User Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <View style={modalStyles.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={modalStyles.keyboardWrap}
          >
            <View style={modalStyles.sheet}>
              <View style={modalStyles.sheetHeader}>
                <Text style={modalStyles.sheetTitle}>
                  {editingUser ? 'Edit User Profile' : 'Add New User'}
                </Text>
                <TouchableOpacity style={modalStyles.closeBtn} onPress={handleCloseModal}>
                  <X size={22} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={modalStyles.sheetScroll}
                contentContainerStyle={modalStyles.sheetScrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <Text style={modalStyles.fieldLabel}>Full Name *</Text>
                <TextInput
                  style={modalStyles.input}
                  placeholder="Enter full name"
                  placeholderTextColor={colors.textMuted}
                  value={formData.name}
                  onChangeText={(t) => setFormData({ ...formData, name: t })}
                />

                <Text style={modalStyles.fieldLabel}>Email Address *</Text>
                <TextInput
                  style={modalStyles.input}
                  placeholder="name@marwadiuniversity.ac.in"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={formData.email}
                  onChangeText={(t) => setFormData({ ...formData, email: t })}
                />

                <Text style={modalStyles.fieldLabel}>Enrollment / Staff ID (Optional)</Text>
                <TextInput
                  style={modalStyles.input}
                  placeholder="e.g. 92100103001 or OP-102"
                  placeholderTextColor={colors.textMuted}
                  value={formData.enrollment_number}
                  onChangeText={(t) => setFormData({ ...formData, enrollment_number: t })}
                />

                <Text style={modalStyles.roleLabel}>Assign Role:</Text>
                <View style={modalStyles.roleRow}>
                  {(['student', 'faculty', 'operator', 'admin'] as UserRole[]).map((r) => (
                    <TouchableOpacity
                      key={r}
                      style={[
                        modalStyles.roleChip,
                        formData.role_id === r && modalStyles.roleChipActive,
                      ]}
                      onPress={() => handleRoleSelect(r)}
                    >
                      <Text
                        style={[
                          modalStyles.roleChipText,
                          formData.role_id === r && modalStyles.roleChipTextActive,
                        ]}
                      >
                        {r.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Conditional Operator Canteen Selector */}
                {formData.role_id === 'operator' && (
                  <View style={modalStyles.canteenSection}>
                    <View style={modalStyles.canteenSectionHeader}>
                      <Store size={15} color={colors.primaryDark} />
                      <Text style={modalStyles.canteenSectionTitle}>Assign to Canteen *</Text>
                    </View>
                    <Text style={modalStyles.canteenHelperText}>
                      Select which canteen this operator will manage:
                    </Text>

                    {canteens.length === 0 ? (
                      <Text style={modalStyles.noCanteenText}>
                        No active canteens available. Create a canteen first.
                      </Text>
                    ) : (
                      <View style={modalStyles.canteenList}>
                        {canteens.map((c) => {
                          const isSelected = formData.assigned_canteen_id === c.canteen_id;
                          return (
                            <TouchableOpacity
                              key={c.canteen_id}
                              style={[
                                modalStyles.canteenOption,
                                isSelected && modalStyles.canteenOptionActive,
                              ]}
                              onPress={() =>
                                setFormData({ ...formData, assigned_canteen_id: c.canteen_id })
                              }
                            >
                              <View style={modalStyles.canteenOptionTextCol}>
                                <Text
                                  style={[
                                    modalStyles.canteenOptionName,
                                    isSelected && modalStyles.canteenOptionNameActive,
                                  ]}
                                >
                                  {c.name}
                                </Text>
                                <Text
                                  style={[
                                    modalStyles.canteenOptionMeta,
                                    isSelected && modalStyles.canteenOptionMetaActive,
                                  ]}
                                >
                                  Floor {c.floor === 0 ? 'Ground' : c.floor} • {c.building_id}
                                </Text>
                              </View>
                              {isSelected && <Check size={16} color={colors.primaryDark} />}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                  </View>
                )}
              </ScrollView>

              <View style={modalStyles.footerRow}>
                <TouchableOpacity
                  style={modalStyles.cancelBtn}
                  disabled={saving}
                  onPress={handleCloseModal}
                >
                  <Text style={modalStyles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[modalStyles.saveBtn, saving && modalStyles.saveBtnDisabled]}
                  disabled={saving}
                  onPress={handleSaveUser}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={modalStyles.saveBtnText}>
                      {editingUser ? 'Save Changes' : 'Create User'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
};