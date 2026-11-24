import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Switch, Alert, Modal, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, MapPin, Clock, Edit2, Trash2, X, Plus } from 'lucide-react-native';
import { colors } from '../../config/theme';
import { useAuth } from '../../context/AuthContext';
import {
  listenCanteens,
  toggleCanteenStatus,
  addCanteenFirestore,
  editCanteenFirestore,
  deleteCanteenFirestore,
} from '../../services/firestoreService';
import { styles } from '../../styles/admin/CanteenManagementStyles';
import type { AcceptanceMode, Canteen, CanteenType } from '../../models/types';

interface CanteenManagementScreenProps { navigation: any; }

export const CanteenManagementScreen: React.FC<CanteenManagementScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [canteens, setCanteens] = useState<Canteen[]>([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingCanteen, setEditingCanteen] = useState<Canteen | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    building_id: 'bldg_main',
    floor: '0',
    token_prefix: 'A',
    operating_hours: '08:00 AM - 06:00 PM',
    canteen_type: 'common' as CanteenType,
    acceptance_mode: 'manual' as AcceptanceMode,
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

  const handleToggle = async (canteenId: string, currentOpen: boolean) => {
    await toggleCanteenStatus(canteenId, !currentOpen, actor);
  };

  const openAddModal = () => {
    setEditingCanteen(null);
    setFormData({
      name: '',
      building_id: 'bldg_main',
      floor: '0',
      token_prefix: 'A',
      operating_hours: '08:00 AM - 06:00 PM',
      canteen_type: 'common',
      acceptance_mode: 'manual',
    });
    setModalVisible(true);
  };

  const openEditModal = (canteen: Canteen) => {
    setEditingCanteen(canteen);
    setFormData({
      name: canteen.name,
      building_id: canteen.building_id || 'bldg_main',
      floor: String(canteen.floor ?? 0),
      token_prefix: canteen.token_prefix || 'A',
      operating_hours: canteen.operating_hours || '',
      canteen_type: canteen.canteen_type || 'common',
      acceptance_mode: canteen.acceptance_mode || 'manual',
    });
    setModalVisible(true);
  };

  const handleSaveCanteen = async () => {
    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      Alert.alert('Validation Error', 'Please enter a canteen name.');
      return;
    }

    const floorNum = parseInt(formData.floor, 10);
    const safeFloor = isNaN(floorNum) ? 0 : floorNum;
    const safePrefix = (formData.token_prefix.trim() || 'A').toUpperCase().slice(0, 2);

    try {
      if (editingCanteen) {
        await editCanteenFirestore(
          editingCanteen.canteen_id,
          {
            name: trimmedName,
            building_id: formData.building_id.trim() || 'bldg_main',
            floor: safeFloor,
            token_prefix: safePrefix,
            operating_hours: formData.operating_hours.trim(),
            canteen_type: formData.canteen_type,
            acceptance_mode: formData.acceptance_mode,
          },
          actor
        );
      } else {
        const nowIso = new Date().toISOString();
        const newCanteenId = `canteen_${Date.now()}`;
        const newCanteen: Canteen = {
          canteen_id: newCanteenId,
          name: trimmedName,
          building_id: formData.building_id.trim() || 'bldg_main',
          floor: safeFloor,
          token_prefix: safePrefix,
          canteen_type: formData.canteen_type,
          operator_ids: [],
          email: '',
          phone: '',
          is_open: true,
          acceptance_mode: formData.acceptance_mode,
          operating_hours: formData.operating_hours.trim() || '08:00 AM - 06:00 PM',
          summary: 'Campus Dining Point',
          is_active: true,
          created_at: nowIso,
          updated_at: nowIso,
        };
        await addCanteenFirestore(newCanteen, actor);
      }
      setModalVisible(false);
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to save canteen details.');
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
            } catch {
              Alert.alert('Error', 'Failed to deactivate canteen.');
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
        renderItem={({ item }) => (
          <View style={styles.canteenCard}>
            <View style={styles.cardHeader}>
              <View style={styles.titleArea}>
                <Text style={styles.name}>{item.name}</Text>
                <View style={styles.metaRow}>
                  <MapPin size={12} color={colors.textSecondary} />
                  <Text style={styles.metaText}>Floor {item.floor === 0 ? 'Ground' : item.floor} • {item.building_id}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Clock size={12} color={colors.textSecondary} />
                  <Text style={styles.metaText}>{item.operating_hours}</Text>
                </View>
              </View>

              <View style={styles.toggleCol}>
                <Text style={[styles.statusText, item.is_open ? styles.openText : styles.closedText]}>
                  {item.is_open ? 'OPEN' : 'CLOSED'}
                </Text>
                <Switch
                  value={item.is_open}
                  onValueChange={() => handleToggle(item.canteen_id, item.is_open)}
                  trackColor={{ false: '#FECACA', true: '#A7F3D0' }}
                  thumbColor={item.is_open ? colors.accentGreen : '#EF4444'}
                />
              </View>
            </View>

            <View style={styles.footerRow}>
              <Text style={styles.typeTag}>Type: {item.canteen_type.replace('_', ' ').toUpperCase()}</Text>
              <Text style={styles.modeTag}>Mode: {item.acceptance_mode.toUpperCase()}</Text>
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
        )}
      />

      <Modal visible={modalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScrollContent}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>{editingCanteen ? 'Edit Canteen' : 'Add New Canteen'}</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <X size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Canteen Name *</Text>
              <TextInput
                style={styles.inputField}
                placeholder="e.g. Main Building Canteen 3"
                value={formData.name}
                onChangeText={(t) => setFormData({ ...formData, name: t })}
              />

              <Text style={styles.inputLabel}>Building ID</Text>
              <TextInput
                style={styles.inputField}
                placeholder="bldg_main / bldg_law / bldg_hostel"
                value={formData.building_id}
                onChangeText={(t) => setFormData({ ...formData, building_id: t })}
              />

              <Text style={styles.inputLabel}>Floor Number (0 for Ground)</Text>
              <TextInput
                style={styles.inputField}
                keyboardType="numeric"
                value={formData.floor}
                onChangeText={(t) => setFormData({ ...formData, floor: t })}
              />

              <Text style={styles.inputLabel}>Token Prefix (e.g. A, B, L)</Text>
              <TextInput
                style={styles.inputField}
                maxLength={2}
                autoCapitalize="characters"
                value={formData.token_prefix}
                onChangeText={(t) => setFormData({ ...formData, token_prefix: t })}
              />

              <Text style={styles.inputLabel}>Operating Hours</Text>
              <TextInput
                style={styles.inputField}
                placeholder="08:00 AM - 06:00 PM"
                value={formData.operating_hours}
                onChangeText={(t) => setFormData({ ...formData, operating_hours: t })}
              />

              <Text style={styles.inputLabel}>Access Type</Text>
              <View style={styles.radioGroup}>
                <TouchableOpacity
                  style={[styles.radioBtn, formData.canteen_type === 'common' && styles.radioBtnActive]}
                  onPress={() => setFormData({ ...formData, canteen_type: 'common' })}
                >
                  <Text style={[styles.radioText, formData.canteen_type === 'common' && styles.radioTextActive]}>Common</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.radioBtn, formData.canteen_type === 'faculty_only' && styles.radioBtnActive]}
                  onPress={() => setFormData({ ...formData, canteen_type: 'faculty_only' })}
                >
                  <Text style={[styles.radioText, formData.canteen_type === 'faculty_only' && styles.radioTextActive]}>Faculty Only</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Order Acceptance</Text>
              <View style={styles.radioGroup}>
                <TouchableOpacity
                  style={[styles.radioBtn, formData.acceptance_mode === 'manual' && styles.radioBtnActive]}
                  onPress={() => setFormData({ ...formData, acceptance_mode: 'manual' })}
                >
                  <Text style={[styles.radioText, formData.acceptance_mode === 'manual' && styles.radioTextActive]}>Manual</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.radioBtn, formData.acceptance_mode === 'automatic' && styles.radioBtnActive]}
                  onPress={() => setFormData({ ...formData, acceptance_mode: 'automatic' })}
                >
                  <Text style={[styles.radioText, formData.acceptance_mode === 'automatic' && styles.radioTextActive]}>Auto-Accept</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveCanteen}>
                <Text style={styles.saveBtnText}>{editingCanteen ? 'Save Changes' : 'Create Canteen'}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
};