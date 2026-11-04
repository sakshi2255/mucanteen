import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: "AIzaSyBID6aEpDYUdZPW-Dq1lhOaMLtIbeo-Rng",
  authDomain: "mu-canteen-b895a.firebaseapp.com",
  projectId: "mu-canteen-b895a",
  storageBucket: "mu-canteen-b895a.firebasestorage.app",
  messagingSenderId: "231604059707",
  appId: "1:231604059707:android:cabf8e38c301d1a3fc261e"
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  console.warn('Firebase initialization notice:', error);
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
}

export { app, auth, db };

