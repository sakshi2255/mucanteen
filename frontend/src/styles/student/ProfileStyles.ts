import { StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../../config/theme';

export const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  backBtn: { padding: 6 },
  headerTitle: { fontSize: 16, fontWeight: typography.fontWeights.heavy, color: colors.textPrimary },
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: spacing.lg, gap: spacing.md },
  
  avatarCard: {
    alignItems: 'center', backgroundColor: '#FFFFFF', padding: spacing.lg,
    borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm,
  },
  avatarCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
  userName: { fontSize: 18, fontWeight: typography.fontWeights.heavy, color: colors.textPrimary, marginTop: spacing.md },
  roleBadge: { backgroundColor: colors.primaryLight, paddingHorizontal: 12, paddingVertical: 4, borderRadius: borderRadius.full, marginTop: 6 },
  roleBadgeText: { fontSize: 10, fontWeight: typography.fontWeights.heavy, color: colors.primaryDark, letterSpacing: 0.5 },
  
  navSection: { backgroundColor: '#FFFFFF', borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.borderLight, overflow: 'hidden', ...shadows.sm },
  navRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  navText: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.textPrimary, marginLeft: spacing.md },
  
  sectionCard: { backgroundColor: '#FFFFFF', padding: spacing.md, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm },
  sectionHeading: { fontSize: 13, fontWeight: typography.fontWeights.heavy, color: colors.textPrimary, marginBottom: spacing.md, textTransform: 'uppercase', letterSpacing: 0.5 },
  detailRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  detailLabel: { fontSize: 11, color: colors.textSecondary, fontWeight: '500' },
  detailValue: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginTop: 2 },
  
  roleSwitchCard: { backgroundColor: '#F0FDFA', borderWidth: 1, borderColor: '#99F6E4', padding: spacing.md, borderRadius: borderRadius.lg },
  roleSwitchHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  roleSwitchTitle: { fontSize: 11, fontWeight: typography.fontWeights.heavy, color: colors.primaryDark, letterSpacing: 0.5 },
  roleSwitchDesc: { fontSize: 11, color: colors.textSecondary, marginVertical: spacing.xs, lineHeight: 16 },
  rolesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  roleBtn: { flex: 1, minWidth: '45%', backgroundColor: '#FFFFFF', paddingVertical: 10, borderRadius: borderRadius.md, borderWidth: 1, borderColor: '#CCFBF1', alignItems: 'center' },
  activeRoleBtn: { backgroundColor: colors.primary, borderColor: colors.primary },
  roleBtnText: { fontSize: 12, fontWeight: '700', color: colors.primaryDark },
  activeRoleBtnText: { color: '#FFFFFF' },
  
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', paddingVertical: 14, borderRadius: borderRadius.lg, gap: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  menuContainer: { width: '85%', maxHeight: '80%', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, elevation: 5 },
  menuHeader: { fontSize: 16, fontWeight: '700', color: '#4B5563', marginBottom: 12 },
  menuSubHeader: { fontSize: 12, color: '#6B7280', marginBottom: 8, fontWeight: '600' },
  menuItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  menuItemText: { fontSize: 15, color: '#111827', fontWeight: '600' },
  menuItemSubText: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  backBtnRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  backBtnText: { fontSize: 14, color: '#079FA7', marginLeft: 8, fontWeight: '600' },
  demoDropdownBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CCFBF1', borderRadius: borderRadius.md, paddingHorizontal: 12, paddingVertical: 10, marginTop: 8 },
  demoDropdownText: { fontSize: 13, fontWeight: '600', color: colors.primaryDark },
  logoutBtnText: { color: '#EF4444', fontWeight: typography.fontWeights.heavy, fontSize: 14 },
});