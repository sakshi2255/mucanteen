import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import * as FirebaseAuth from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const firebaseConfig = {
  apiKey: "AIzaSyBID6aEpDYUdZPW-Dq1lhOaMLtIbeo-Rng",
  authDomain: "mu-canteen-b895a.firebaseapp.com",
  projectId: "mu-canteen-b895a",
  storageBucket: "mu-canteen-b895a.firebasestorage.app",
  messagingSenderId: "231604059707",
  appId: "1:231604059707:android:cabf8e38c301d1a3fc261e"
};

let app: FirebaseApp;
let auth: FirebaseAuth.Auth;

const getReactNativePersistence = (FirebaseAuth as any).getReactNativePersistence;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  auth =
    typeof getReactNativePersistence === 'function'
      ? FirebaseAuth.initializeAuth(app, {
          persistence: getReactNativePersistence(AsyncStorage),
        })
      : FirebaseAuth.getAuth(app);
} else {
  app = getApp();
  auth = FirebaseAuth.getAuth(app);
}

const db: Firestore = getFirestore(app);

export { app, auth, db };