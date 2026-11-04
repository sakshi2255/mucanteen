import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  SafeAreaView 
} from 'react-native';
import { ArrowLeft, Shield, Clock, User, Tag, Store } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../../config/theme';
import { fetchAuditLogs } from '../../services/firestoreService';
import type { AuditLog } from '../../models/types';

interface AuditLogsScreenProps {
  navigation: any;
}

export const AuditLogsScreen: React.FC<AuditLogsScreenProps> = ({ navigation }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    const list = await fetchAuditLogs();
    setLogs(list);
  };

  const filteredLogs = logs.filter((l) => {
    if (filterType === 'all') return true;
    return l.entity_type.toLowerCase() === filterType.toLowerCase();
  });

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

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        {['all', 'order', 'menuItem', 'canteen'].map((f) => {
          const isSelected = filterType === f;
          return (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, isSelected && styles.activeFilterChip]}
              onPress={() => setFilterType(f)}
            >
              <Text style={[styles.filterChipText, isSelected && styles.activeFilterChipText]}>
                {f.toUpperCase()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Logs List */}
      <FlatList
        data={filteredLogs}
        keyExtractor={(item) => item.audit_log_id}
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
        renderItem={({ item }) => (
          <View style={styles.logCard}>
            <View style={styles.logHeader}>
              <View style={styles.actionPill}>
                <Text style={styles.actionText}>{item.action}</Text>
              </View>
              <Text style={styles.timestampText}>
                {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </Text>
            </View>

            <Text style={styles.descriptionText}>{item.description}</Text>

            <View style={styles.footerRow}>
              <View style={styles.metaCol}>
                <Text style={styles.actorText}>
                  Actor: {item.actor_name_snapshot} ({item.actor_role || (item as any).actor_role_snapshot || 'user'})
                </Text>
                <Text style={styles.entityText}>
                  {item.entity_type.toUpperCase()} • ID: {item.entity_id.slice(-8)}
                  {item.canteen_id ? ` • Canteen: ${item.canteen_id}` : ''}
                </Text>
              </View>

              <View style={styles.sourceTag}>
                <Text style={styles.sourceText}>{item.source.toUpperCase()}</Text>
              </View>
            </View>
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: typography.fontWeights.heavy,
    color: colors.textPrimary,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: spacing.xs,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    backgroundColor: colors.backgroundSoft,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  activeFilterChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  activeFilterChipText: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  logCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  actionPill: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  actionText: {
    fontSize: 10,
    fontWeight: typography.fontWeights.heavy,
    color: colors.primaryDark,
  },
  timestampText: {
    fontSize: 10,
    color: colors.textMuted,
  },
  descriptionText: {
    fontSize: 12,
    color: colors.textPrimary,
    lineHeight: 16,
    marginVertical: 4,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: 6,
  },
  metaCol: {
    flex: 1,
  },
  actorText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  entityText: {
    fontSize: 9,
    color: colors.textMuted,
    marginTop: 1,
  },
  sourceTag: {
    backgroundColor: colors.backgroundSoft,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 3,
  },
  sourceText: {
    fontSize: 8,
    color: colors.textSecondary,
    fontWeight: 'bold',
  },
});
