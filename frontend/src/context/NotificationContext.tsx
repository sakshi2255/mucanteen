import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useAuth } from './AuthContext';
import {
  listenUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getUserNotificationSettings,
  updateUserNotificationSettings,
  checkAndExpireOrders,
} from '../services/firestoreService';
import {
  registerAndSavePushToken,
  requestPermissions,
  triggerLocalSystemNotification,
} from '../services/notificationService';
import type { AppNotification, NotificationSettings } from '../models/types';

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  settings: NotificationSettings | null;
  permissionGranted: boolean;
  requestSystemPermission: () => Promise<boolean>;
  updateSettings: (key: keyof Omit<NotificationSettings, 'user_id'>, value: boolean) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({} as NotificationContextType);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [permissionGranted, setPermissionGranted] = useState<boolean>(true);

  const seenIdsRef = useRef<Set<string>>(new Set());
  const initialLoadRef = useRef<boolean>(true);
  const settingsRef = useRef<NotificationSettings | null>(null);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  // Check permission status on mount and when returning from System Settings
  const refreshPermissionStatus = useCallback(async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setPermissionGranted(status === 'granted');
  }, []);

  useEffect(() => {
    refreshPermissionStatus();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshPermissionStatus();
    });
    return () => sub.remove();
  }, [refreshPermissionStatus]);

  // Ask for permission & register Expo Push Token when user logs in
  useEffect(() => {
    if (!user?.user_id) return;
    registerAndSavePushToken(user.user_id).then((token) => {
      refreshPermissionStatus();
      if (token) setPermissionGranted(true);
    });
  }, [user?.user_id, refreshPermissionStatus]);

  // Periodic check for 2-min warning and auto-expiring orders
  useEffect(() => {
    const timer = setInterval(() => {
      checkAndExpireOrders().catch(() => {});
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Listen to Firestore notifications in real time & fire native OS notifications for new ones
  useEffect(() => {
    if (!user?.user_id) {
      setNotifications([]);
      seenIdsRef.current.clear();
      initialLoadRef.current = true;
      return;
    }

    const unsubscribe = listenUserNotifications(user.user_id, (notifs: AppNotification[]) => {
      if (initialLoadRef.current) {
        notifs.forEach((n) => seenIdsRef.current.add(n.notification_id));
        initialLoadRef.current = false;
      } else {
        for (const n of notifs) {
          if (!seenIdsRef.current.has(n.notification_id)) {
            seenIdsRef.current.add(n.notification_id);
            const currentSettings = settingsRef.current;
            const isEnabled = !currentSettings || currentSettings[n.type] !== false;
            if (!n.is_read && isEnabled) {
              triggerLocalSystemNotification(n.title, n.body, {
                order_id: n.order_id,
                type: n.type,
              });
            }
          }
        }
      }
      setNotifications(notifs);
    });

    return () => unsubscribe();
  }, [user?.user_id]);

  // Load notification settings
  useEffect(() => {
    if (!user?.user_id) {
      setSettings(null);
      return;
    }
    getUserNotificationSettings(user.user_id).then((s: NotificationSettings) => setSettings(s));
  }, [user?.user_id]);

  const requestSystemPermission = useCallback(async () => {
    const granted = await requestPermissions(true);
    setPermissionGranted(granted);
    if (granted && user?.user_id) {
      await registerAndSavePushToken(user.user_id);
    }
    return granted;
  }, [user?.user_id]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const updateSettings = useCallback(
    async (key: keyof Omit<NotificationSettings, 'user_id'>, value: boolean) => {
      if (!user?.user_id) return;

      const defaultSettings: NotificationSettings = {
        user_id: user.user_id,
        order_placed: true,
        order_accepted: true,
        order_preparing: true,
        order_ready: true,
        pickup_warning: true,
        pickup_failed: true,
        order_declined: true,
      };

      const updated: NotificationSettings = {
        ...(settings || defaultSettings),
        user_id: user.user_id,
        [key]: value,
      };

      setSettings(updated);
      await updateUserNotificationSettings(user.user_id, updated);
    },
    [user?.user_id, settings]
  );

  const markAsRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.notification_id === id ? { ...n, is_read: true } : n))
    );
    await markNotificationRead(id);
  }, []);

  const markAllRead = useCallback(async () => {
    if (!user?.user_id) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    await markAllNotificationsRead(user.user_id);
  }, [user?.user_id]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        settings,
        permissionGranted,
        requestSystemPermission,
        updateSettings,
        markAsRead,
        markAllRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);