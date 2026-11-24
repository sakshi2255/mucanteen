import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronDown, Calendar, X } from 'lucide-react-native';
import { colors } from '../../config/theme';
import { OrderCardCompact } from '../../components/common/OrderCardCompact';
import { listenAllOrders, listenCanteens } from '../../services/firestoreService';
import { styles } from '../../styles/admin/AdminOrdersStyles';
import type { Order, Canteen } from '../../models/types';

interface AdminOrdersScreenProps { navigation: any; }

const TIME_FILTER_OPTIONS = [
  { id: 'today', label: 'Today (Since Midnight)' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'week', label: 'This Week (Last 7 Days)' },
  { id: 'month', label: 'This Month (Last 30 Days)' },
  { id: 'all', label: 'All Time' },
];

export const AdminOrdersScreen: React.FC<AdminOrdersScreenProps> = ({ navigation }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [canteens, setCanteens] = useState<Canteen[]>([]);

  const [selectedCanteenId, setSelectedCanteenId] = useState<string>('all');
  const [selectedTime, setSelectedTime] = useState<string>('all');
  const [customDate, setCustomDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const [showCanteenDropdown, setShowCanteenDropdown] = useState(false);
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);

  useEffect(() => {
    const unsubOrders = listenAllOrders((list) => setOrders(list));
    const unsubCanteens = listenCanteens((list) => setCanteens(list));
    return () => {
      unsubOrders();
      unsubCanteens();
    };
  }, []);

  const filteredOrders = useMemo(() => {
    let result = orders;

    if (selectedCanteenId !== 'all') {
      result = result.filter((o) => o.canteen_id === selectedCanteenId);
    }

    if (customDate.trim()) {
      const targetDate = customDate.trim();
      result = result.filter((o) => {
        const d = new Date(o.created_at);
        if (d.toISOString().split('T')[0] !== targetDate) return false;
        const hhmm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        if (startTime.trim() && hhmm < startTime.trim()) return false;
        if (endTime.trim() && hhmm > endTime.trim()) return false;
        return true;
      });
    } else if (selectedTime !== 'all') {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const startOfYesterday = startOfToday - 86400000;

      if (selectedTime === 'today') {
        result = result.filter((o) => new Date(o.created_at).getTime() >= startOfToday);
      } else if (selectedTime === 'yesterday') {
        result = result.filter((o) => {
          const t = new Date(o.created_at).getTime();
          return t >= startOfYesterday && t < startOfToday;
        });
      } else if (selectedTime === 'week') {
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).getTime();
        result = result.filter((o) => new Date(o.created_at).getTime() >= startOfWeek);
      } else if (selectedTime === 'month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30).getTime();
        result = result.filter((o) => new Date(o.created_at).getTime() >= startOfMonth);
      }
    }

    return [...result].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [orders, selectedCanteenId, selectedTime, customDate, startTime, endTime]);

  const selectedCanteenName =
    selectedCanteenId === 'all'
      ? 'All Canteens'
      : canteens.find((c) => c.canteen_id === selectedCanteenId)?.name.split('—')[0] || 'Unknown';

  const selectedTimeOption = TIME_FILTER_OPTIONS.find((t) => t.id === selectedTime);
  const timeLabel = selectedTimeOption ? selectedTimeOption.label.split(' (')[0] : 'All Time';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Campus-Wide Orders Feed</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.dropdownBar}>
        <TouchableOpacity style={styles.dropdownBtn} onPress={() => setShowCanteenDropdown(true)}>
          <Text style={styles.dropdownText} numberOfLines={1}>{selectedCanteenName}</Text>
          <ChevronDown size={16} color={colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.dropdownBtn} onPress={() => setShowTimeDropdown(true)}>
          <Text style={styles.dropdownText}>{timeLabel}</Text>
          <ChevronDown size={16} color={colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.dateBtn, !!customDate && styles.dateBtnActive]}
          onPress={() => setShowDateModal(true)}
        >
          <Calendar size={14} color={customDate ? '#FFFFFF' : colors.primary} />
          <Text style={[styles.dateBtnText, !!customDate && styles.dateBtnTextActive]}>
            {customDate || 'Date'}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.order_id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <OrderCardCompact
            order={item}
            isOperatorView={false}
            onPressTrack={(ord) => navigation.navigate('OrderTracking', { order: ord })}
          />
        )}
      />

      <Modal visible={showCanteenDropdown} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowCanteenDropdown(false)}>
          <View style={styles.menuContainer}>
            <Text style={styles.menuHeader}>Filter by Canteen</Text>
            <ScrollView style={styles.dropdownScroll}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setSelectedCanteenId('all');
                  setShowCanteenDropdown(false);
                }}
              >
                <Text style={[styles.menuItemText, selectedCanteenId === 'all' && styles.menuItemTextActive]}>All Canteens</Text>
              </TouchableOpacity>
              {canteens.map((c) => (
                <TouchableOpacity
                  key={c.canteen_id}
                  style={styles.menuItem}
                  onPress={() => {
                    setSelectedCanteenId(c.canteen_id);
                    setShowCanteenDropdown(false);
                  }}
                >
                  <Text style={[styles.menuItemText, selectedCanteenId === c.canteen_id && styles.menuItemTextActive]}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showTimeDropdown} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowTimeDropdown(false)}>
          <View style={styles.menuContainer}>
            <Text style={styles.menuHeader}>Filter by Time</Text>
            {TIME_FILTER_OPTIONS.map((t) => (
              <TouchableOpacity
                key={t.id}
                style={styles.menuItem}
                onPress={() => {
                  setSelectedTime(t.id);
                  setCustomDate('');
                  setShowTimeDropdown(false);
                }}
              >
                <Text style={[styles.menuItemText, selectedTime === t.id && styles.menuItemTextActive]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showDateModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.menuContainer}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.menuHeader}>Filter by Date & Time</Text>
              <TouchableOpacity onPress={() => setShowDateModal(false)}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Date (YYYY-MM-DD)</Text>
            <TextInput style={styles.textInput} placeholder="e.g. 2026-11-24" value={customDate} onChangeText={setCustomDate} />
            <Text style={styles.inputLabel}>From Time (HH:MM, optional)</Text>
            <TextInput style={styles.textInput} placeholder="e.g. 09:00" value={startTime} onChangeText={setStartTime} />
            <Text style={styles.inputLabel}>To Time (HH:MM, optional)</Text>
            <TextInput style={styles.textInput} placeholder="e.g. 17:00" value={endTime} onChangeText={setEndTime} />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.resetBtn}
                onPress={() => {
                  setCustomDate('');
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