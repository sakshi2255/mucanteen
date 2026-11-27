import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Edit2,
  Trash2,
  X,
  Plus,
  Store,
  UserPlus,
  Image as ImageIcon,
  Users,
} from 'lucide-react-native';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';
import { colors } from '../../config/theme';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  listenCanteens,
  toggleCanteenStatus,
  addCanteenFirestore,
  editCanteenFirestore,
  deleteCanteenFirestore,
  recordAuditLog,
} from '../../services/firestoreService';
import { styles } from '../../styles/admin/CanteenManagementStyles';
import type { AcceptanceMode, Canteen, CanteenType, UserProfile } from '../../models/types';

interface CanteenManagementScreenProps {
  navigation: any;
}

const BANNER_PRESETS = [
  {
    label: 'Cafeteria',
    url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=80',
  },
  {
    label: 'Dining Hall',
    url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80',
  },
  {
    label: 'Snack Counter',
    url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80',
  },
];

const BUILDING_PRESETS = [
  { id: 'bldg_main', label: 'Main Building' },
  { id: 'bldg_law', label: 'Law Building' },
  { id: 'bldg_hostel', label: 'Hostel Block' },
];

const CANTEEN_TYPES: { value: CanteenType; label: string }[] = [
  { value: 'common', label: 'Common' },
  { value: 'faculty_only', label: 'Faculty Only' },
  { value: 'law_canteen', label: 'Law Canteen' },
  { value: 'hostel_mess', label: 'Hostel Mess' },
];

export const CanteenManagementScreen: React.FC<CanteenManagementScreenProps> = ({
  navigation,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [canteens, setCanteens] = useState<Canteen[]>([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingCanteen, setEditingCanteen] = useState<Canteen | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    building_id: 'bldg_main',
    floor: '0',
    token_prefix: 'A',
    operating_hours: '08:00 AM - 06:00 PM',
    summary: '',
    banner_url: '',
    canteen_type: 'common' as CanteenType,
    acceptance_mode: 'manual' as AcceptanceMode,
  });

  const [operatorForm, setOperatorForm] = useState({
    name: '',
    email: '',
    phone: '',
    enrollment_number: '',
  });

  useEffect(() => {
    const unsub = listenCanteens((list) => {
      setCanteens(list.filter((c) => c.is_active !== false));
    });
    return unsub;
  }, []);

  const actor = {
    id: user?.user_id || 'admin',
    name: user?.name || 'Administrator',
    role: 'admin',
  };

  const handleCloseModal = () => {
    if (!saving) {
      setModalVisible(false);
    }
  };

  const handleToggle = async (canteenId: string, canteenName: string, currentOpen: boolean) => {
    try {
      await toggleCanteenStatus(canteenId, !currentOpen, actor);
      showToast(
        `${canteenName} is now ${!currentOpen ? 'OPEN' : 'CLOSED'}.`,
        !currentOpen ? 'success' : 'info',
        'Status Updated'
      );
    } catch {
      showToast('Failed to update canteen serving status.', 'error');
    }
  };

  const openAddModal = () => {
    setEditingCanteen(null);
    setFormData({
      name: '',
      building_id: 'bldg_main',
      floor: '0',
      token_prefix: 'A',
      operating_hours: '08:00 AM - 06:00 PM',
      summary: 'Campus Dining Point',
      banner_url: '',
      canteen_type: 'common',
      acceptance_mode: 'manual',
    });
    setOperatorForm({
      name: '',
      email: '',
      phone: '',
      enrollment_number: '',
    });
    setModalVisible(true);
  };

  const openEditModal = (canteen: Canteen) => {
    setEditingCanteen(canteen);
    setFormData({
      name: canteen.name || '',
      building_id: canteen.building_id || 'bldg_main',
      floor: String(canteen.floor ?? 0),
      token_prefix: canteen.token_prefix || 'A',
      operating_hours: canteen.operating_hours || '08:00 AM - 06:00 PM',
      summary: canteen.summary || '',
      banner_url: canteen.banner_url || '',
      canteen_type: canteen.canteen_type || 'common',
      acceptance_mode: canteen.acceptance_mode || 'manual',
    });
    setModalVisible(true);
  };

  const handleSaveCanteen = async () => {
    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      showToast('Please enter a canteen name.', 'error', 'Validation Error');
      return;
    }

    const opName = operatorForm.name.trim();
    const opEmail = operatorForm.email.trim().toLowerCase();
    const opPhone = operatorForm.phone.trim();
    const opStaffId = operatorForm.enrollment_number.trim();

    if (!editingCanteen) {
      if (!opName) {
        showToast('Please enter the default operator name.', 'error', 'Operator Required');
        return;
      }
      if (!opEmail || !opEmail.includes('@')) {
        showToast('Please enter a valid operator email address.', 'error', 'Operator Required');
        return;
      }
    }

    const floorNum = parseInt(formData.floor, 10);
    const safeFloor = isNaN(floorNum) ? 0 : floorNum;
    const safePrefix = (formData.token_prefix.trim() || 'A').toUpperCase().slice(0, 2);
    const safeBanner = formData.banner_url.trim() || null;

    setSaving(true);
    try {
      if (editingCanteen) {
        await editCanteenFirestore(
          editingCanteen.canteen_id,
          {
            name: trimmedName,
            building_id: formData.building_id.trim() || 'bldg_main',
            floor: safeFloor,
            token_prefix: safePrefix,
            operating_hours: formData.operating_hours.trim() || '08:00 AM - 06:00 PM',
            summary: formData.summary.trim() || 'Campus Dining Point',
            banner_url: safeBanner,
            canteen_type: formData.canteen_type,
            acceptance_mode: formData.acceptance_mode,
          },
          actor
        );
        showToast(`Updated ${trimmedName} successfully.`, 'success', 'Canteen Saved');
      } else {
        const nowIso = new Date().toISOString();
        const timestamp = Date.now();
        const newCanteenId = `canteen_${timestamp}`;
        const newOperatorId = `op_${timestamp}`;

        const newCanteen: Canteen = {
          canteen_id: newCanteenId,
          name: trimmedName,
          building_id: formData.building_id.trim() || 'bldg_main',
          floor: safeFloor,
          token_prefix: safePrefix,
          canteen_type: formData.canteen_type,
          operator_ids: [newOperatorId],
          email: opEmail,
          phone: opPhone,
          is_open: true,
          acceptance_mode: formData.acceptance_mode,
          operating_hours: formData.operating_hours.trim() || '08:00 AM - 06:00 PM',
          summary: formData.summary.trim() || 'Campus Dining Point',
          banner_url: safeBanner,
          is_active: true,
          created_at: nowIso,
          updated_at: nowIso,
        };

        const defaultOperator: UserProfile = {
          user_id: newOperatorId,
          name: opName,
          email: opEmail,
          phone: opPhone,
          enrollment_number: opStaffId || `OP-${String(timestamp).slice(-5)}`,
          role_id: 'operator',
          role: 'Canteen Operator',
          account_status: 'active',
          is_deleted: false,
          assigned_canteen_ids: [newCanteenId],
          favourite_canteen_ids: [],
          created_at: nowIso,
          updated_at: nowIso,
        };

        await addCanteenFirestore(newCanteen, actor);
        await setDoc(doc(db, 'users', newOperatorId), defaultOperator);
        await recordAuditLog({
          actor_id: actor.id,
          actor_name_snapshot: actor.name,
          actor_role: actor.role,
          action: 'DEFAULT_OPERATOR_CREATED',
          entity_type: 'user',
          entity_id: newOperatorId,
          canteen_id: newCanteenId,
          description: `Created default operator ${opName} for ${trimmedName}`,
          before_data: null,
          after_data: defaultOperator as unknown as Record<string, unknown>,
        });

        showToast(
          `Created ${trimmedName} with default operator ${opName}.`,
          'success',
          'Canteen & Operator Added'
        );
      }
      setModalVisible(false);
    } catch (error: any) {
      showToast(error?.message || 'Failed to save canteen details.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (canteen: Canteen) => {
    Alert.alert(
      'Deactivate Canteen',
      `Are you sure you want to deactivate ${canteen.name}? It will be removed from the student view.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCanteenFirestore(canteen.canteen_id, actor);
              showToast(`${canteen.name} has been deactivated.`, 'success', 'Canteen Deactivated');
            } catch {
              showToast('Failed to deactivate canteen.', 'error');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Campus Canteens</Text>
        <TouchableOpacity onPress={openAddModal} style={styles.addHeaderBtn} activeOpacity={0.8}>
          <Plus size={16} color="#FFFFFF" />
          <Text style={styles.addHeaderBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={canteens}
        keyExtractor={(item) => item.canteen_id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No active canteens found. Tap Add to create one.</Text>
        }
        renderItem={({ item }) => {
          const safeType = (item.canteen_type || 'common').replace(/_/g, ' ').toUpperCase();
          const safeMode = (item.acceptance_mode || 'manual').toUpperCase();
          const operatorCount = Array.isArray(item.operator_ids) ? item.operator_ids.length : 0;

          return (
            <View style={styles.canteenCard}>
              {!!item.banner_url && (
                <Image
                  source={{ uri: item.banner_url }}
                  style={styles.cardBanner}
                  resizeMode="cover"
                />
              )}

              <View style={styles.cardBody}>
                <View style={styles.cardHeader}>
                  <View style={styles.titleArea}>
                    <Text style={styles.name}>{item.name}</Text>
                    <View style={styles.metaRow}>
                      <MapPin size={12} color={colors.textSecondary} />
                      <Text style={styles.metaText}>
                        Floor {item.floor === 0 ? 'Ground' : item.floor} • {item.building_id}
                      </Text>
                    </View>
                    <View style={styles.metaRow}>
                      <Clock size={12} color={colors.textSecondary} />
                      <Text style={styles.metaText}>
                        {item.operating_hours || '08:00 AM - 06:00 PM'}
                      </Text>
                    </View>
                    <View style={styles.metaRow}>
                      <Users size={12} color={colors.textSecondary} />
                      <Text style={styles.metaText}>
                        {operatorCount > 0
                          ? `${operatorCount} Assigned Operator${operatorCount > 1 ? 's' : ''}`
                          : item.email
                            ? `Operator: ${item.email}`
                            : 'Assign operator in User Management'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.toggleCol}>
                    <Text
                      style={[
                        styles.statusText,
                        item.is_open ? styles.openText : styles.closedText,
                      ]}
                    >
                      {item.is_open ? 'OPEN' : 'CLOSED'}
                    </Text>
                    <Switch
                      value={item.is_open}
                      onValueChange={() => handleToggle(item.canteen_id, item.name, item.is_open)}
                      trackColor={{ false: '#FECACA', true: '#A7F3D0' }}
                      thumbColor={item.is_open ? colors.accentGreen : '#EF4444'}
                    />
                  </View>
                </View>

                <View style={styles.footerRow}>
                  <Text style={styles.typeTag}>Type: {safeType}</Text>
                  <Text style={styles.modeTag}>
                    Token [{item.token_prefix || 'A'}] • {safeMode}
                  </Text>
                </View>

                <View style={styles.actionRow}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => openEditModal(item)}>
                    <Edit2 size={14} color={colors.primaryDark} />
                    <Text style={styles.editBtnText}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item)}>
                    <Trash2 size={14} color={colors.accentRed} />
                    <Text style={styles.deleteBtnText}>Deactivate</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        }}
      />

      {/* Add / Edit Canteen Modal */}
      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalKeyboardWrap}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>
                  {editingCanteen ? 'Edit Canteen Details' : 'Add New Canteen'}
                </Text>
                <TouchableOpacity style={styles.modalCloseBtn} onPress={handleCloseModal}>
                  <X size={22} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.modalScroll}
                contentContainerStyle={styles.modalScrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {/* SECTION 1: CANTEEN DETAILS & BANNER */}
                <View style={styles.formSectionCard}>
                  <View style={styles.sectionHeaderRow}>
                    <Store size={15} color={colors.primaryDark} />
                    <Text style={styles.sectionHeaderTitle}>
                      {editingCanteen ? 'Canteen Details & Banner' : 'Section 1 · Canteen Details'}
                    </Text>
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.inputLabel}>Canteen Photo / Banner</Text>
                    <View style={styles.bannerPreviewWrap}>
                      {formData.banner_url.trim() ? (
                        <Image
                          source={{ uri: formData.banner_url.trim() }}
                          style={styles.bannerPreviewImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.bannerPlaceholder}>
                          <ImageIcon size={22} color={colors.textMuted} />
                          <Text style={styles.bannerPlaceholderText}>
                            Paste an image URL or pick a preset banner below
                          </Text>
                        </View>
                      )}
                    </View>
                    <TextInput
                      style={styles.inputField}
                      placeholder="https://example.com/canteen-banner.jpg"
                      placeholderTextColor={colors.textMuted}
                      autoCapitalize="none"
                      value={formData.banner_url}
                      onChangeText={(t) => setFormData({ ...formData, banner_url: t })}
                    />
                    <View style={styles.presetRow}>
                      {BANNER_PRESETS.map((preset) => {
                        const isSelected = formData.banner_url.trim() === preset.url;
                        return (
                          <TouchableOpacity
                            key={preset.label}
                            style={[styles.presetChip, isSelected && styles.presetChipActive]}
                            onPress={() => setFormData({ ...formData, banner_url: preset.url })}
                          >
                            <Text
                              style={[
                                styles.presetChipText,
                                isSelected && styles.presetChipTextActive,
                              ]}
                            >
                              {preset.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                      {!!formData.banner_url.trim() && (
                        <TouchableOpacity
                          style={styles.presetChip}
                          onPress={() => setFormData({ ...formData, banner_url: '' })}
                        >
                          <Text style={styles.presetChipText}>Clear</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.inputLabel}>Canteen Name *</Text>
                    <TextInput
                      style={styles.inputField}
                      placeholder="e.g. Main Building Canteen 3"
                      placeholderTextColor={colors.textMuted}
                      value={formData.name}
                      onChangeText={(t) => setFormData({ ...formData, name: t })}
                    />
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.inputLabel}>Building Location</Text>
                    <TextInput
                      style={styles.inputField}
                      placeholder="bldg_main / bldg_law / bldg_hostel"
                      placeholderTextColor={colors.textMuted}
                      value={formData.building_id}
                      onChangeText={(t) => setFormData({ ...formData, building_id: t })}
                    />
                    <View style={styles.presetRow}>
                      {BUILDING_PRESETS.map((b) => {
                        const isSelected = formData.building_id === b.id;
                        return (
                          <TouchableOpacity
                            key={b.id}
                            style={[styles.presetChip, isSelected && styles.presetChipActive]}
                            onPress={() => setFormData({ ...formData, building_id: b.id })}
                          >
                            <Text
                              style={[
                                styles.presetChipText,
                                isSelected && styles.presetChipTextActive,
                              ]}
                            >
                              {b.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  <View style={[styles.rowTwoCol, styles.fieldGroup]}>
                    <View style={styles.colHalf}>
                      <Text style={styles.inputLabel}>Floor (0 = Ground)</Text>
                      <TextInput
                        style={styles.inputField}
                        keyboardType="numeric"
                        placeholder="0"
                        placeholderTextColor={colors.textMuted}
                        value={formData.floor}
                        onChangeText={(t) => setFormData({ ...formData, floor: t })}
                      />
                    </View>
                    <View style={styles.colHalf}>
                      <Text style={styles.inputLabel}>Token Prefix</Text>
                      <TextInput
                        style={styles.inputField}
                        maxLength={2}
                        autoCapitalize="characters"
                        placeholder="A"
                        placeholderTextColor={colors.textMuted}
                        value={formData.token_prefix}
                        onChangeText={(t) => setFormData({ ...formData, token_prefix: t })}
                      />
                    </View>
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.inputLabel}>Operating Hours</Text>
                    <TextInput
                      style={styles.inputField}
                      placeholder="08:00 AM - 06:00 PM"
                      placeholderTextColor={colors.textMuted}
                      value={formData.operating_hours}
                      onChangeText={(t) => setFormData({ ...formData, operating_hours: t })}
                    />
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.inputLabel}>Short Description</Text>
                    <TextInput
                      style={styles.inputField}
                      placeholder="e.g. Fast Food, Beverages & South Indian"
                      placeholderTextColor={colors.textMuted}
                      value={formData.summary}
                      onChangeText={(t) => setFormData({ ...formData, summary: t })}
                    />
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.inputLabel}>Access Type</Text>
                    <View style={styles.radioGroup}>
                      {CANTEEN_TYPES.map((ct) => {
                        const isSelected = formData.canteen_type === ct.value;
                        return (
                          <TouchableOpacity
                            key={ct.value}
                            style={[styles.radioBtn, isSelected && styles.radioBtnActive]}
                            onPress={() => setFormData({ ...formData, canteen_type: ct.value })}
                          >
                            <Text style={[styles.radioText, isSelected && styles.radioTextActive]}>
                              {ct.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  <View style={styles.fieldGroupLast}>
                    <Text style={styles.inputLabel}>Order Acceptance Mode</Text>
                    <View style={styles.radioGroup}>
                      <TouchableOpacity
                        style={[
                          styles.radioBtn,
                          formData.acceptance_mode === 'manual' && styles.radioBtnActive,
                        ]}
                        onPress={() => setFormData({ ...formData, acceptance_mode: 'manual' })}
                      >
                        <Text
                          style={[
                            styles.radioText,
                            formData.acceptance_mode === 'manual' && styles.radioTextActive,
                          ]}
                        >
                          Manual
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.radioBtn,
                          formData.acceptance_mode === 'automatic' && styles.radioBtnActive,
                        ]}
                        onPress={() => setFormData({ ...formData, acceptance_mode: 'automatic' })}
                      >
                        <Text
                          style={[
                            styles.radioText,
                            formData.acceptance_mode === 'automatic' && styles.radioTextActive,
                          ]}
                        >
                          Auto-Accept
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* SECTION 2: DEFAULT OPERATOR DETAILS (REQUIRED WHEN ADDING A NEW CANTEEN) */}
                {!editingCanteen && (
                  <View style={styles.formSectionCard}>
                    <View style={styles.sectionHeaderRow}>
                      <UserPlus size={15} color={colors.primaryDark} />
                      <Text style={styles.sectionHeaderTitle}>
                        Section 2 · Default Operator Details
                      </Text>
                    </View>
                    <Text style={styles.sectionHelperText}>
                      Every new canteen requires at least 1 default operator. This account will be
                      created and automatically assigned to this canteen.
                    </Text>

                    <View style={styles.fieldGroup}>
                      <Text style={styles.inputLabel}>Operator Full Name *</Text>
                      <TextInput
                        style={styles.inputField}
                        placeholder="e.g. Rajesh Patel"
                        placeholderTextColor={colors.textMuted}
                        value={operatorForm.name}
                        onChangeText={(t) => setOperatorForm({ ...operatorForm, name: t })}
                      />
                    </View>

                    <View style={styles.fieldGroup}>
                      <Text style={styles.inputLabel}>Operator Email *</Text>
                      <TextInput
                        style={styles.inputField}
                        placeholder="e.g. operator.canteen3@marwadiuniversity.ac.in"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={operatorForm.email}
                        onChangeText={(t) => setOperatorForm({ ...operatorForm, email: t })}
                      />
                    </View>

                    <View style={[styles.rowTwoCol, styles.fieldGroupLast]}>
                      <View style={styles.colHalf}>
                        <Text style={styles.inputLabel}>Staff / Operator ID</Text>
                        <TextInput
                          style={styles.inputField}
                          placeholder="e.g. OP-104"
                          placeholderTextColor={colors.textMuted}
                          value={operatorForm.enrollment_number}
                          onChangeText={(t) =>
                            setOperatorForm({ ...operatorForm, enrollment_number: t })
                          }
                        />
                      </View>
                      <View style={styles.colHalf}>
                        <Text style={styles.inputLabel}>Phone (Optional)</Text>
                        <TextInput
                          style={styles.inputField}
                          keyboardType="phone-pad"
                          placeholder="9876543210"
                          placeholderTextColor={colors.textMuted}
                          value={operatorForm.phone}
                          onChangeText={(t) => setOperatorForm({ ...operatorForm, phone: t })}
                        />
                      </View>
                    </View>
                  </View>
                )}
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  disabled={saving}
                  onPress={handleCloseModal}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                  disabled={saving}
                  onPress={handleSaveCanteen}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.saveBtnText}>
                      {editingCanteen ? 'Save Changes' : 'Create Canteen & Operator'}
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