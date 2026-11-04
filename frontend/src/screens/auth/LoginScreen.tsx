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
import { Utensils, Lock, Mail, UserCheck, Shield } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../../config/theme';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../models/types';

interface LoginScreenProps {
  navigation: any;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const { login, switchDemoRole, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Required Fields', 'Please enter your email and password.');
      return;
    }

    setSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (err: any) {
      Alert.alert('Login Failed', err.message || 'Invalid credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickDemoSelect = (role: UserRole) => {
    switchDemoRole(role);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Brand Header */}
        <View style={styles.brandContainer}>
          <View style={styles.logoBadge}>
            <Utensils size={36} color="#FFFFFF" />
          </View>
          <Text style={styles.brandTitle}>MU CANTEEN</Text>
          <Text style={styles.brandSubtitle}>Marwadi University • Rajkot</Text>
          <Text style={styles.reviewBadge}>REVIEW 1 READY</Text>
        </View>

        {/* Login Form Card */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Sign In</Text>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Mail size={18} color={colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="University Email or ID"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Lock size={18} color={colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {/* Sign In Button */}
          <TouchableOpacity 
            style={styles.signInButton}
            onPress={handleLogin}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.signInButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Register Link */}
          <TouchableOpacity 
            style={styles.registerLink}
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.7}
          >
            <Text style={styles.registerPrompt}>
              New to MU Canteen? <Text style={styles.registerHighlight}>Create Account</Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Demo Switcher Card for Reviewers & Testing */}
        <View style={styles.demoCard}>
          <View style={styles.demoHeader}>
            <Shield size={14} color={colors.primary} />
            <Text style={styles.demoTitle}>QUICK REVIEW LOGIN (1-TAP)</Text>
          </View>
          <Text style={styles.demoDescription}>
            Tap any role below to immediately test the application with that role:
          </Text>

          <View style={styles.demoButtonsGrid}>
            <TouchableOpacity 
              style={styles.demoPill} 
              onPress={() => handleQuickDemoSelect('student')}
              activeOpacity={0.7}
            >
              <Text style={styles.demoPillRole}>Student</Text>
              <Text style={styles.demoPillName}>Aarav Patel</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.demoPill} 
              onPress={() => handleQuickDemoSelect('faculty')}
              activeOpacity={0.7}
            >
              <Text style={styles.demoPillRole}>Faculty</Text>
              <Text style={styles.demoPillName}>Prof. Rajesh</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.demoPill} 
              onPress={() => handleQuickDemoSelect('operator')}
              activeOpacity={0.7}
            >
              <Text style={styles.demoPillRole}>Operator</Text>
              <Text style={styles.demoPillName}>F1 Canteen</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.demoPill} 
              onPress={() => handleQuickDemoSelect('admin')}
              activeOpacity={0.7}
            >
              <Text style={styles.demoPillRole}>Admin</Text>
              <Text style={styles.demoPillName}>Campus Dir.</Text>
            </TouchableOpacity>
          </View>
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
    width: 68,
    height: 68,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.md,
  },
  brandTitle: {
    fontSize: typography.fontSizes.xxl,
    fontWeight: typography.fontWeights.heavy,
    color: colors.primaryDark,
    marginTop: spacing.md,
    letterSpacing: 1,
  },
  brandSubtitle: {
    fontSize: typography.fontSizes.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeights.medium,
    marginTop: 2,
  },
  reviewBadge: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primary,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 6,
    letterSpacing: 0.8,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.md,
  },
  formTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
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
  signInButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
    ...shadows.sm,
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontWeight: typography.fontWeights.bold,
    fontSize: typography.fontSizes.base,
    letterSpacing: 0.5,
  },
  registerLink: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  registerPrompt: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
  },
  registerHighlight: {
    color: colors.primary,
    fontWeight: typography.fontWeights.bold,
  },
  demoCard: {
    marginTop: spacing.xl,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  demoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  demoTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primaryDark,
    letterSpacing: 0.5,
  },
  demoDescription: {
    fontSize: 11,
    color: colors.textSecondary,
    marginVertical: 6,
  },
  demoButtonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  demoPill: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    alignItems: 'center',
  },
  demoPillRole: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  demoPillName: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 1,
  },
});

