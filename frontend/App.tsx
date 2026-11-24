import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { initializeFirestoreIfNeeded } from './src/services/firestoreService';

export default function App() {
  useEffect(() => {
    initializeFirestoreIfNeeded().catch((err) => {
      console.warn('Initial Firestore initialization notice:', err);
    });
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NotificationProvider>
          <CartProvider>
            <StatusBar style="dark" />
            <RootNavigator />
          </CartProvider>
        </NotificationProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
