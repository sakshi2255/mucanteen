import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Alert, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Utensils, Lock, Mail, Shield, ChevronDown, ArrowLeft } from 'lucide-react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';
import { colors } from '../../config/theme';
import { useAuth } from '../../context/AuthContext';
import { styles } from '../../styles/auth/LoginStyles';
import type { UserRole, UserProfile } from '../../models/types';

interface LoginScreenProps { navigation: any; }

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const { login, switchDemoUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [dropdownStep, setDropdownStep] = useState<1 | 2>(1);
  const [selectedDemoRole, setSelectedDemoRole] = useState<UserRole | null>(null);
  const [fetchedUsers, setFetchedUsers] = useState<UserProfile[]>([]);
  const [fetchingUsers, setFetchingUsers] = useState(false);

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

  const handleSelectRole = async (role: UserRole) => {
    setSelectedDemoRole(role);
    setDropdownStep(2);
    setFetchingUsers(true);

    try {
      const q = query(collection(db, 'users'), where('role_id', '==', role));
      const snapshot = await getDocs(q);

      const realUsers: UserProfile[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as UserProfile;
        if (data.is_deleted !== true) {
          realUsers.push({ ...data, user_id: data.user_id || docSnap.id });
        }
      });

      setFetchedUsers(realUsers);
    } catch (error: any) {
      Alert.alert(
        'Database Access Error',
        error?.code === 'permission-denied'
          ? 'Firestore rules are blocking unauthenticated reads on the users collection. Update firestore.rules to allow read on users.'
          : error?.message || 'Failed to fetch users from the database.'
      );
      setDropdownStep(1);
    } finally {
      setFetchingUsers(false);
    }
  };

  const handleSelectUser = (user: UserProfile) => {
    setShowRoleDropdown(false);
    setDropdownStep(1);
    switchDemoUser(user);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.brandContainer}>
            <View style={styles.logoBadge}><Utensils size={36} color="#FFFFFF" /></View>
            <Text style={styles.brandTitle}>MU CANTEEN</Text>
            <Text style={styles.brandSubtitle}>Marwadi University • Rajkot</Text>
            <Text style={styles.reviewBadge}>CAMPUS PORTAL</Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Sign In</Text>

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

            <TouchableOpacity style={styles.signInButton} onPress={handleLogin} disabled={submitting} activeOpacity={0.85}>
              {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.signInButtonText}>Sign In</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.registerLink} onPress={() => navigation.navigate('Register')} activeOpacity={0.7}>
              <Text style={styles.registerPrompt}>New to MU Canteen? <Text style={styles.registerHighlight}>Create Account</Text></Text>
            </TouchableOpacity>
          </View>

          <View style={styles.demoCard}>
            <View style={styles.demoHeader}>
              <Shield size={14} color={colors.primary} />
              <Text style={styles.demoTitle}>QUICK ROLE ACCESS</Text>
            </View>
            <Text style={styles.demoDescription}>Select an account role to sign in directly:</Text>

            <TouchableOpacity style={styles.demoDropdownBtn} onPress={() => setShowRoleDropdown(true)}>
              <Text style={styles.demoDropdownText}>Select Account Role...</Text>
              <ChevronDown size={18} color={colors.primaryDark} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={showRoleDropdown} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.menuContainer}>
            {dropdownStep === 1 ? (
              <>
                <Text style={styles.menuHeader}>Step 1: Select Role</Text>
                {(['student', 'faculty', 'operator', 'admin'] as UserRole[]).map((role) => (
                  <TouchableOpacity key={role} style={styles.menuItem} onPress={() => handleSelectRole(role)}>
                    <Text style={styles.menuItemText}>{role.charAt(0).toUpperCase() + role.slice(1)}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={[styles.menuItem, styles.cancelItem]} onPress={() => setShowRoleDropdown(false)}>
                  <Text style={[styles.menuItemText, styles.cancelText]}>Cancel</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity style={styles.backBtnRow} onPress={() => setDropdownStep(1)}>
                  <ArrowLeft size={16} color={colors.primary} />
                  <Text style={styles.backBtnText}>Back to Roles</Text>
                </TouchableOpacity>
                <Text style={styles.menuHeader}>Step 2: Select {selectedDemoRole?.toUpperCase()} User</Text>

                {fetchingUsers ? (
                  <ActivityIndicator size="large" color={colors.primary} style={styles.loaderMargin} />
                ) : (
                  <FlatList
                    data={fetchedUsers}
                    keyExtractor={(item) => item.user_id}
                    renderItem={({ item }) => (
                      <TouchableOpacity style={styles.menuItem} onPress={() => handleSelectUser(item)}>
                        <Text style={styles.menuItemText}>{item.name}</Text>
                        <Text style={styles.menuItemSubText}>{item.email}</Text>
                      </TouchableOpacity>
                    )}
                    ListEmptyComponent={<Text style={styles.menuItemSubText}>No active users found for this role.</Text>}
                  />
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};