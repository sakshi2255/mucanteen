import { Alert, Linking, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { createNotificationForUser } from './firestoreService';
import type { AppNotification, NotificationSettings } from '../models/types';

type NotificationType = AppNotification['type'];

// Show heads-up banner, sound, and badge even when the app is open
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function configureAndroidChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('mu-canteen-orders', {
      name: 'Order Updates & Alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#079FA7',
      sound: 'default',
      enableVibrate: true,
    });
  }
}

export async function requestPermissions(promptSettingsIfDenied = true): Promise<boolean> {
  await configureAndroidChannel();

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    if (promptSettingsIfDenied) {
      Alert.alert(
        'Enable Notifications',
        'MU Canteen needs notification permission to alert you when your food is preparing, ready for pickup, or nearing the pickup deadline.',
        [
          { text: 'Not Now', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
    }
    return false;
  }

  return true;
}

export async function registerAndSavePushToken(userId: string): Promise<string | null> {
  try {
    const granted = await requestPermissions(true);
    if (!granted || !Device.isDevice) return null;

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

    const tokenResponse = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    const pushToken = tokenResponse.data;

    if (pushToken && userId) {
      await updateDoc(doc(db, 'users', userId), {
        expo_push_token: pushToken,
        updated_at: new Date().toISOString(),
      }).catch(() => {});
    }

    return pushToken;
  } catch (err) {
    console.warn('Push token registration notice:', err);
    return null;
  }
}

export async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  data: Record<string, unknown> = {}
): Promise<void> {
  try {
    const userSnap = await getDoc(doc(db, 'users', userId));
    const pushToken = userSnap.exists() ? (userSnap.data() as any)?.expo_push_token : null;
    if (!pushToken) return;

    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: pushToken,
        sound: 'default',
        title,
        body,
        data,
        channelId: 'mu-canteen-orders',
        priority: 'high',
      }),
    });
  } catch (err) {
    console.warn('Remote push send notice:', err);
  }
}

export async function triggerLocalSystemNotification(
  title: string,
  body: string,
  data: Record<string, unknown> = {},
  delaySeconds = 0
): Promise<string | null> {
  try {
    await configureAndroidChannel();
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'default',
        data,
      },
      trigger:
        delaySeconds > 0
          ? { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: delaySeconds }
          : null,
    });
    return id;
  } catch (err) {
    console.warn('Local notification schedule notice:', err);
    return null;
  }
}

interface NotificationPayload {
  title: string;
  body: string;
  type: NotificationType;
}

function buildPayload(
  status: NotificationType,
  canteenName: string,
  tokenDisplay: string
): NotificationPayload {
  switch (status) {
    case 'order_placed':
      return {
        title: 'Order Placed',
        body: `Your order ${tokenDisplay} has been placed at ${canteenName}. Waiting for confirmation.`,
        type: 'order_placed',
      };
    case 'order_accepted':
      return {
        title: 'Order Accepted',
        body: `Your order ${tokenDisplay} at ${canteenName} has been accepted and will be prepared shortly.`,
        type: 'order_accepted',
      };
    case 'order_preparing':
      return {
        title: 'Preparing Your Order',
        body: `Your order ${tokenDisplay} at ${canteenName} is now being prepared.`,
        type: 'order_preparing',
      };
    case 'order_ready':
      return {
        title: 'Ready for Pickup!',
        body: `Your order ${tokenDisplay} at ${canteenName} is ready. Please collect within 12 minutes.`,
        type: 'order_ready',
      };
    case 'order_declined':
      return {
        title: 'Order Declined',
        body: `Your order ${tokenDisplay} at ${canteenName} was declined by the canteen.`,
        type: 'order_declined',
      };
    case 'order_cancelled':
      return {
        title: 'Order Cancelled',
        body: `Your order ${tokenDisplay} has been cancelled.`,
        type: 'order_cancelled',
      };
    case 'pickup_warning':
      return {
        title: 'Pickup Deadline Soon!',
        body: `You have 2 minutes left to collect order ${tokenDisplay} from ${canteenName}.`,
        type: 'pickup_warning',
      };
    case 'pickup_failed':
      return {
        title: 'Order Not Collected',
        body: `Your order ${tokenDisplay} from ${canteenName} was not collected in time and has expired.`,
        type: 'pickup_failed',
      };
    default:
      return {
        title: 'Order Update',
        body: `Your order ${tokenDisplay} status has been updated.`,
        type: status,
      };
  }
}

export async function scheduleOrderStatusNotification(
  userId: string,
  orderId: string,
  status: NotificationType,
  canteenName: string,
  tokenDisplay: string,
  settings?: NotificationSettings
): Promise<void> {
  if (settings) {
    const settingKey = status as keyof NotificationSettings;
    if (settingKey in settings && settings[settingKey] === false) {
      return;
    }
  }

  const payload = buildPayload(status, canteenName, tokenDisplay);

  await createNotificationForUser(userId, {
    order_id: orderId,
    title: payload.title,
    body: payload.body,
    type: payload.type,
  });

  await sendPushToUser(userId, payload.title, payload.body, {
    order_id: orderId,
    type: payload.type,
  });
}

export async function schedule2MinWarningNotification(
  userId: string,
  orderId: string,
  canteenName: string,
  tokenDisplay: string
): Promise<void> {
  const title = 'Pickup Deadline Soon!';
  const body = `You have 2 minutes left to collect order ${tokenDisplay} from ${canteenName}.`;

  await createNotificationForUser(userId, {
    order_id: orderId,
    title,
    body,
    type: 'pickup_warning',
  });
  await sendPushToUser(userId, title, body, { order_id: orderId, type: 'pickup_warning' });
}

export async function schedulePickupFailedNotification(
  userId: string,
  orderId: string,
  canteenName: string,
  tokenDisplay: string
): Promise<void> {
  const title = 'Order Not Collected';
  const body = `Your order ${tokenDisplay} from ${canteenName} was not collected in time.`;

  await createNotificationForUser(userId, {
    order_id: orderId,
    title,
    body,
    type: 'pickup_failed',
  });
  await sendPushToUser(userId, title, body, { order_id: orderId, type: 'pickup_failed' });
}

export async function cancelNotificationsForOrder(orderId: string): Promise<void> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notif of scheduled) {
      if (notif.content?.data?.order_id === orderId) {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      }
    }
  } catch {
    // ignore
  }
}