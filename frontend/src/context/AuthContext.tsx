import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { collection, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { auth, db } from '../config/firebaseConfig';
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
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const manualSwitchRef = useRef<boolean>(false);

  const fetchUserProfile = async (fbUser: FirebaseUser): Promise<UserProfile | null> => {
    const directSnap = await getDoc(doc(db, 'users', fbUser.uid));
    if (directSnap.exists()) {
      return { ...(directSnap.data() as UserProfile), user_id: directSnap.id };
    }
    if (fbUser.email) {
      const q = query(collection(db, 'users'), where('email', '==', fbUser.email));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const first = snap.docs[0];
        return { ...(first.data() as UserProfile), user_id: first.id };
      }
    }
    return null;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);

      if (manualSwitchRef.current) {
        setIsLoading(false);
        return;
      }

      if (fbUser && !fbUser.isAnonymous) {
        try {
          const profile = await fetchUserProfile(fbUser);
          if (profile) {
            setUser(profile);
          } else {
            const newProfile: UserProfile = {
              user_id: fbUser.uid,
              name: fbUser.displayName || fbUser.email?.split('@')[0] || 'MU User',
              enrollment_number: '',
              email: fbUser.email || '',
              role_id: 'student',
              role: 'Student',
              account_status: 'active',
              is_deleted: false,
              assigned_canteen_ids: [],
              favourite_canteen_ids: [],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            await setDoc(doc(db, 'users', fbUser.uid), newProfile);
            setUser(newProfile);
          }
        } catch (err) {
          console.warn('Auth user doc fetch notice:', err);
        }
      } else if (!fbUser) {
        setUser(null);
      }

      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, pass: string) => {
    manualSwitchRef.current = false;
    setIsLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      const profile = await fetchUserProfile(cred.user);
      if (profile) setUser(profile);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    name: string,
    email: string,
    pass: string,
    enrollmentNumber: string,
    role: UserRole
  ) => {
    manualSwitchRef.current = false;
    setIsLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      const roleName =
        role === 'admin'
          ? 'College Administrator'
          : role === 'operator'
            ? 'Canteen Operator'
            : role === 'faculty'
              ? 'Faculty'
              : 'Student';

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
        favourite_canteen_ids: [],
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
    manualSwitchRef.current = false;
    try {
      await signOut(auth);
    } catch {}
    setUser(null);
    setFirebaseUser(null);
  };

  const switchDemoUser = (targetUser: UserProfile) => {
    manualSwitchRef.current = true;
    setUser(targetUser);

    if (targetUser.email) {
      signInWithEmailAndPassword(auth, targetUser.email, 'password123').catch(() => {
        signInAnonymously(auth).catch(() => {});
      });
    } else {
      signInAnonymously(auth).catch(() => {});
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        isLoading,
        role: user?.role_id || 'student',
        login,
        register,
        logout,
        switchDemoUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);