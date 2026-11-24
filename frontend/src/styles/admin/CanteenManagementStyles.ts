import { StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../../config/theme';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.heavy,
    color: colors.textPrimary,
  },
  listContent: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  canteenCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleArea: {
    flex: 1,
    marginRight: spacing.sm,
  },
  name: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  metaText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  toggleCol: {
    alignItems: 'center',
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
    marginBottom: 2,
  },
  openText: {
    color: colors.accentGreen,
  },
  closedText: {
    color: colors.accentRed,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  typeTag: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  modeTag: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: 4,
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.primaryDark,
  },
  deleteBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.accentRed,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { width: '90%', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, elevation: 5 },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  inputField: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 14, color: '#111827' },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#4B5563', marginBottom: 8 },
  saveBtn: { backgroundColor: '#079FA7', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  radioGroup: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  radioBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center' },
  radioBtnActive: { backgroundColor: '#079FA7', borderColor: '#079FA7' },
  radioText: { fontSize: 12, fontWeight: '600', color: '#4B5563' },
  radioTextActive: { color: '#FFFFFF' },
  addHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  addHeaderBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
});