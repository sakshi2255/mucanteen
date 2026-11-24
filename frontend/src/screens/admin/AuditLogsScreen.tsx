import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Shield, Clock, ChevronDown, Calendar, X } from 'lucide-react-native';
import { colors } from '../../config/theme';
import { fetchAuditLogs } from '../../services/firestoreService';
import { styles } from '../../styles/admin/AuditLogsStyles';
import type { AuditLog } from '../../models/types';

interface AuditLogsScreenProps { navigation: any; }

const FILTER_OPTIONS = [
  { id: 'all', label: 'All Activities' },
  { id: 'order', label: 'Orders' },
  { id: 'menuItem', label: 'Menu Items' },
  { id: 'canteen', label: 'Canteens' },
  { id: 'user', label: 'Users' },
];

function getLogColorVariant(log: AuditLog) {
  const action = (log.action || '').toUpperCase();
  const entity = (log.entity_type || '').toLowerCase();

  if (action.includes('DECLINED') || action.includes('CANCELLED') || action.includes('DEACTIVATED') || action.includes('CLOSED') || action.includes('SOLDOUT')) {
    return { border: styles.logDangerBorder, pill: styles.pillDanger, text: styles.textDanger };
  }
  if (entity === 'order') {
    return { border: styles.logOrderBorder, pill: styles.pillOrder, text: styles.textOrder };
  }
  if (entity === 'menuitem' || entity === 'category') {
    return { border: styles.logMenuBorder, pill: styles.pillMenu, text: styles.textMenu };
  }
  if (entity === 'canteen') {
    return { border: styles.logCanteenBorder, pill: styles.pillCanteen, text: styles.textCanteen };
  }
  return { border: styles.logUserBorder, pill: styles.pillUser, text: styles.textUser };
}

export const AuditLogsScreen: React.FC<AuditLogsScreenProps> = ({ navigation }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const [showDropdown, setShowDropdown] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    const list = await fetchAuditLogs();
    setLogs(list);
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      if (filterType !== 'all' && l.entity_type?.toLowerCase() !== filterType.toLowerCase()) {
        return false;
      }
      if (dateFilter.trim() && l.timestamp) {
        const d = new Date(l.timestamp);
        if (d.toISOString().split('T')[0] !== dateFilter.trim()) return false;
        const hhmm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        if (startTime.trim() && hhmm < startTime.trim()) return false;
        if (endTime.trim() && hhmm > endTime.trim()) return false;
      }
      return true;
    });
  }, [logs, filterType, dateFilter, startTime, endTime]);

  const selectedFilterLabel = FILTER_OPTIONS.find((f) => f.id === filterType)?.label || 'All Activities';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Campus Audit Trail</Text>
        <TouchableOpacity onPress={loadLogs} style={styles.backBtn}>
          <Clock size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        <TouchableOpacity style={[styles.dropdownBtn, styles.dropdownBtnFlex]} onPress={() => setShowDropdown(true)}>
          <Text style={styles.dropdownText}>Filter: {selectedFilterLabel}</Text>
          <ChevronDown size={18} color={colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.dateBtn, !!dateFilter && styles.dateBtnActive]}
          onPress={() => setShowDateModal(true)}
        >
          <Calendar size={14} color={dateFilter ? '#FFFFFF' : colors.primary} />
          <Text style={[styles.dateBtnText, !!dateFilter && styles.dateBtnTextActive]}>
            {dateFilter || 'Date'}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredLogs}
        keyExtractor={(item) => item.audit_log_id || Math.random().toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Shield size={38} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>Audit Log Active</Text>
            <Text style={styles.emptySubtitle}>
              Actions performed by students, canteen operators, and administrators are recorded immutably here.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const variant = getLogColorVariant(item);
          return (
            <View style={[styles.logCard, styles.logCardBorder, variant.border]}>
              <View style={styles.logHeader}>
                <View style={[styles.actionPill, variant.pill]}>
                  <Text style={[styles.actionText, variant.text]}>{item.action || 'UPDATE'}</Text>
                </View>
                <Text style={styles.timestampText}>
                  {item.timestamp
                    ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                    : 'Unknown Time'}
                </Text>
              </View>
              <Text style={styles.descriptionText}>{item.description}</Text>
              <View style={styles.footerRow}>
                <View style={styles.metaCol}>
                  <Text style={styles.actorText}>
                    Actor: {item.actor_name_snapshot || 'System'} ({item.actor_role || 'user'})
                  </Text>
                  <Text style={styles.entityText}>
                    {item.entity_type ? `${item.entity_type.toUpperCase()} ID: ` : 'ID: '}
                    {item.entity_id ? item.entity_id.slice(-8) : 'N/A'}
                  </Text>
                </View>
              </View>
            </View>
          );
        }}
      />

      <Modal visible={showDropdown} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowDropdown(false)}>
          <View style={styles.menuContainer}>
            <Text style={styles.menuHeader}>Filter by Entity Type</Text>
            {FILTER_OPTIONS.map((f) => (
              <TouchableOpacity
                key={f.id}
                style={styles.menuItem}
                onPress={() => {
                  setFilterType(f.id);
                  setShowDropdown(false);
                }}
              >
                <Text style={[styles.menuItemText, filterType === f.id && styles.menuItemTextActive]}>{f.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showDateModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.menuContainer}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.menuHeader}>Filter Logs by Date & Time</Text>
              <TouchableOpacity onPress={() => setShowDateModal(false)}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.inputLabel}>Date (YYYY-MM-DD)</Text>
            <TextInput style={styles.textInput} placeholder="e.g. 2026-11-24" value={dateFilter} onChangeText={setDateFilter} />
            <Text style={styles.inputLabel}>From Time (HH:MM, optional)</Text>
            <TextInput style={styles.textInput} placeholder="e.g. 09:00" value={startTime} onChangeText={setStartTime} />
            <Text style={styles.inputLabel}>To Time (HH:MM, optional)</Text>
            <TextInput style={styles.textInput} placeholder="e.g. 17:00" value={endTime} onChangeText={setEndTime} />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.resetBtn}
                onPress={() => {
                  setDateFilter('');
                  setStartTime('');
                  setEndTime('');
                  setShowDateModal(false);
                }}
              >
                <Text style={styles.resetBtnText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyBtn} onPress={() => setShowDateModal(false)}>
                <Text style={styles.applyBtnText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};