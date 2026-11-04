import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert 
} from 'react-native';
import { Utensils, Lock, Mail, User, CreditCard } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../../config/theme';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../models/types';

interface RegisterScreenProps {
  navigation: any;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [enrollment, setEnrollment] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [submitting, setSubmitting] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim() || !enrollment.trim()) {
      Alert.alert('Required Fields', 'Please fill in all registration fields.');
      return;
    }

    setSubmitting(true);
    try {
      await register(name.trim(), email.trim(), password, enrollment.trim(), role);
      Alert.alert('Account Created', 'Registration successful! Welcome to MU Canteen.');
    } catch (err: any) {
      Alert.alert('Registration Failed', err.message || 'Error creating account.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.brandContainer}>
          <View style={styles.logoBadge}>
            <Utensils size={32} color="#FFFFFF" />
          </View>
          <Text style={styles.brandTitle}>Create MU Account</Text>
          <Text style={styles.brandSubtitle}>Student & Faculty Campus Dining</Text>
        </View>

        {/* Card */}
        <View style={styles.formCard}>
          {/* Role Selector Tabs */}
          <View style={styles.roleTabs}>
            <TouchableOpacity 
              style={[styles.roleTab, role === 'student' && styles.activeRoleTab]}
              onPress={() => setRole('student')}
              activeOpacity={0.8}
            >
              <Text style={[styles.roleTabText, role === 'student' && styles.activeRoleTabText]}>
                Student
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.roleTab, role === 'faculty' && styles.activeRoleTab]}
              onPress={() => setRole('faculty')}
              activeOpacity={0.8}
            >
              <Text style={[styles.roleTabText, role === 'faculty' && styles.activeRoleTabText]}>
                Faculty
              </Text>
            </TouchableOpacity>
          </View>

          {/* Full Name */}
          <View style={styles.inputContainer}>
            <User size={18} color={colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* University Email */}
          <View style={styles.inputContainer}>
            <Mail size={18} color={colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="University Email (@marwadiuniversity.ac.in)"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Enrollment or Faculty ID */}
          <View style={styles.inputContainer}>
            <CreditCard size={18} color={colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={role === 'student' ? 'Enrollment Number (e.g. 92100103001)' : 'Faculty ID (e.g. FAC-CE-108)'}
              placeholderTextColor={colors.textMuted}
              value={enrollment}
              onChangeText={setEnrollment}
            />
          </View>

          {/* Password */}
          <View style={styles.inputContainer}>
            <Lock size={18} color={colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password (minimum 6 characters)"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {/* Register Button */}
          <TouchableOpacity 
            style={styles.signUpButton}
            onPress={handleRegister}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.signUpButtonText}>Register</Text>
            )}
          </TouchableOpacity>

          {/* Back to Login */}
          <TouchableOpacity 
            style={styles.loginLink}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Text style={styles.loginPrompt}>
              Already have an account? <Text style={styles.loginHighlight}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.xl,
    justifyContent: 'center',
    flexGrow: 1,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.md,
  },
  brandTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.heavy,
    color: colors.primaryDark,
    marginTop: spacing.md,
  },
  brandSubtitle: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.md,
  },
  roleTabs: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.md,
    padding: 3,
    marginBottom: spacing.lg,
  },
  roleTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  activeRoleTab: {
    backgroundColor: colors.primary,
  },
  roleTabText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.textSecondary,
  },
  activeRoleTabText: {
    color: '#FFFFFF',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    height: 48,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.fontSizes.sm,
  },
  signUpButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
    ...shadows.sm,
  },
  signUpButtonText: {
    color: '#FFFFFF',
    fontWeight: typography.fontWeights.bold,
    fontSize: typography.fontSizes.base,
    letterSpacing: 0.5,
  },
  loginLink: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  loginPrompt: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
  },
  loginHighlight: {
    color: colors.primary,
    fontWeight: typography.fontWeights.bold,
  },
});

