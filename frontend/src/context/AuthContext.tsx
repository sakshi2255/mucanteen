import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebaseConfig';
import { DEMO_PROFILES } from '../services/seedData';
import type { UserProfile, UserRole } from '../models/types';

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  role: UserRole;
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string, enrollmentNumber: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  switchDemoUser: (targetUser: UserProfile) => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(DEMO_PROFILES[0]);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!auth.currentUser) {
      signInWithEmailAndPassword(auth, 'student@marwadiuniversity.ac.in', 'password123').catch(() => {});
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
          if (userDoc.exists()) {
            setUser(userDoc.data() as UserProfile);
          } else {
            const matchedDemo = DEMO_PROFILES.find((p) => p.email.toLowerCase() === (fbUser.email || '').toLowerCase());
            const defaultProfile: UserProfile = matchedDemo ? { ...matchedDemo, user_id: fbUser.uid } : {
              user_id: fbUser.uid,
              name: fbUser.displayName || fbUser.email?.split('@')[0] || 'MU Student',
              enrollment_number: '92100103001',
              email: fbUser.email || '',
              role_id: 'student',
              role: 'Student',
              account_status: 'active',
              is_deleted: false,
              assigned_canteen_ids: [],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            await setDoc(doc(db, 'users', fbUser.uid), defaultProfile);
            setUser(defaultProfile);
          }
        } catch (err) {
          console.warn('Auth user doc fetch notice:', err);
        }
      }
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      const userDoc = await getDoc(doc(db, 'users', cred.user.uid));
      if (userDoc.exists()) {
        setUser(userDoc.data() as UserProfile);
      }
    } catch (e: any) {
      const matched = DEMO_PROFILES.find((p) => p.email.toLowerCase() === email.toLowerCase());
      if (matched) setUser(matched);
      else throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, pass: string, enrollmentNumber: string, role: UserRole) => {
    setIsLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      const roleName = role === 'admin' ? 'College Administrator' : role === 'operator' ? 'Canteen Operator' : role === 'faculty' ? 'Faculty' : 'Student';
      const newProfile: UserProfile = {
        user_id: cred.user.uid,
        name,
        enrollment_number: enrollmentNumber,
        email,
        role_id: role,
        role: roleName,
        account_status: 'active',
        is_deleted: false,
        assigned_canteen_ids: role === 'operator' ? ['canteen_main_1'] : [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      await setDoc(doc(db, 'users', cred.user.uid), newProfile);
      setUser(newProfile);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try { await signOut(auth); } catch (e) {}
    setUser(null);
    setFirebaseUser(null);
  };

  // Upgraded to accept specific user profiles from Firestore
  const switchDemoUser = (targetUser: UserProfile) => {
    setUser(targetUser);
    if (targetUser.email) {
      // Attempt backend auth silently if they have standard password
      signInWithEmailAndPassword(auth, targetUser.email, 'password123').catch(() => {});
    }
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, isLoading, role: user?.role_id || 'student', login, register, logout, switchDemoUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);