import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  runTransaction,
  limit,
  Unsubscribe,
} from 'firebase/firestore';
import { auth, db } from '../config/firebaseConfig';
import { getISTDateString, calculateNextTokenWithPrefix, type OrderCounter } from './tokenService';
import { INITIAL_CANTEENS, INITIAL_CATEGORIES, INITIAL_MENU_ITEMS, INITIAL_PROMOTIONS } from './seedData';
import type {
  Canteen,
  MenuCategory,
  MenuItem,
  Order,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Promotion,
  UserProfile,
  AuditLog,
  PaymentHistory,
  Revenue,
  AppNotification,
  NotificationSettings,
} from '../models/types';

let localOrders: Order[] = [];
let localCanteens: Canteen[] = [...INITIAL_CANTEENS];
let localMenuItems: MenuItem[] = [...INITIAL_MENU_ITEMS];
let localPromotions: Promotion[] = [...INITIAL_PROMOTIONS];
let localCategories: MenuCategory[] = [...INITIAL_CATEGORIES];
let localPaymentHistory: PaymentHistory[] = [];
let localRevenue: Revenue[] = [];
let localNotifications: AppNotification[] = [];

export async function initializeFirestoreIfNeeded(): Promise<void> {
  try {
    const canteensSnap = await getDocs(collection(db, 'canteens'));
    if (canteensSnap.empty) {
      for (const canteen of INITIAL_CANTEENS) {
        await setDoc(doc(db, 'canteens', canteen.canteen_id), canteen);
      }
    }
    const categoriesSnap = await getDocs(collection(db, 'menuCategories'));
    if (categoriesSnap.empty) {
      for (const cat of INITIAL_CATEGORIES) {
        await setDoc(doc(db, 'menuCategories', cat.menu_category_id), cat);
      }
    }
    const itemsSnap = await getDocs(collection(db, 'menuItems'));
    if (itemsSnap.empty) {
      for (const item of INITIAL_MENU_ITEMS) {
        await setDoc(doc(db, 'menuItems', item.menu_item_id), item);
      }
    }
    const promoSnap = await getDocs(collection(db, 'promotions'));
    if (promoSnap.empty) {
      for (const promo of INITIAL_PROMOTIONS) {
        await setDoc(doc(db, 'promotions', promo.promotion_id), promo);
      }
    }
  } catch (error) {
    console.warn('Firestore initialization notice:', error);
  }
}

export function listenCanteens(callback: (canteens: Canteen[]) => void): Unsubscribe {
  try {
    const q = query(collection(db, 'canteens'), where('is_active', '==', true));
    return onSnapshot(
      q,
      (snapshot) => {
        const canteens = snapshot.docs.map((d) => d.data() as Canteen);
        localCanteens = canteens;
        callback(canteens);
      },
      (error) => {
        console.warn('Canteens listener error:', error.message);
        callback(localCanteens);
      }
    );
  } catch {
    callback(localCanteens);
    return () => {};
  }
}

export function listenPromotions(callback: (promotions: Promotion[]) => void): Unsubscribe {
  try {
    const q = query(collection(db, 'promotions'), where('is_active', '==', true));
    return onSnapshot(
      q,
      (snapshot) => {
        const promos = snapshot.docs.map((d) => d.data() as Promotion);
        localPromotions = promos;
        callback(promos);
      },
      (error) => {
        console.warn('Promotions listener error:', error.message);
        callback(localPromotions);
      }
    );
  } catch {
    callback(localPromotions);
    return () => {};
  }
}

export function listenCategories(callback: (categories: MenuCategory[]) => void): Unsubscribe {
  try {
    const q = query(collection(db, 'menuCategories'), where('is_active', '==', true));
    return onSnapshot(
      q,
      (snapshot) => {
        const cats = snapshot.docs.map((d) => d.data() as MenuCategory);
        cats.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
        localCategories = cats;
        callback(cats);
      },
      (error) => {
        console.warn('Categories listener error:', error.message);
        callback(localCategories);
      }
    );
  } catch {
    callback(localCategories);
    return () => {};
  }
}

export function listenMenuItems(canteenId: string | null, callback: (items: MenuItem[]) => void): Unsubscribe {
  try {
    const coll = collection(db, 'menuItems');
    const q = canteenId
      ? query(coll, where('canteen_id', '==', canteenId), where('is_active', '==', true))
      : query(coll, where('is_active', '==', true));
    return onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((d) => d.data() as MenuItem);
        callback(items);
      },
      (error) => {
        console.warn('Menu items listener error:', error.message);
        const filtered = canteenId
          ? localMenuItems.filter((i) => i.canteen_id === canteenId && i.is_active)
          : localMenuItems.filter((i) => i.is_active);
        callback(filtered);
      }
    );
  } catch {
    callback(
      canteenId
        ? localMenuItems.filter((i) => i.canteen_id === canteenId && i.is_active)
        : localMenuItems.filter((i) => i.is_active)
    );
    return () => {};
  }
}

export function listenOperatorOrders(canteenId: string, callback: (orders: Order[]) => void): Unsubscribe {
  try {
    const q = query(collection(db, 'orders'), where('canteen_id', '==', canteenId), orderBy('created_at', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const orders = snapshot.docs.map((d) => d.data() as Order);
        for (const order of orders) {
          const idx = localOrders.findIndex((o) => o.order_id === order.order_id);
          if (idx >= 0) localOrders[idx] = order;
          else localOrders.push(order);
        }
        callback(orders);
      },
      (error) => {
        console.warn('Operator orders listener error:', error.message);
        const filtered = localOrders
          .filter((o) => o.canteen_id === canteenId)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        callback(filtered);
      }
    );
  } catch {
    const filtered = localOrders
      .filter((o) => o.canteen_id === canteenId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    callback(filtered);
    return () => {};
  }
}

export function listenStudentOrders(userId: string, callback: (orders: Order[]) => void): Unsubscribe {
  try {
    const q = query(collection(db, 'orders'), where('user_id', '==', userId), orderBy('created_at', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const orders = snapshot.docs.map((d) => d.data() as Order);
        callback(orders);
      },
      (error) => {
        console.warn('Student orders listener error:', error.message);
        const filtered = localOrders
          .filter((o) => o.user_id === userId)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        callback(filtered);
      }
    );
  } catch {
    const filtered = localOrders
      .filter((o) => o.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    callback(filtered);
    return () => {};
  }
}

export function listenAllOrders(callback: (orders: Order[]) => void): Unsubscribe {
  try {
    const q = query(collection(db, 'orders'), orderBy('created_at', 'desc'), limit(200));
    return onSnapshot(
      q,
      (snapshot) => {
        const orders = snapshot.docs.map((d) => d.data() as Order);
        callback(orders);
      },
      (error) => {
        console.warn('Admin orders listener error:', error.message);
        callback([...localOrders].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      }
    );
  } catch {
    callback([...localOrders].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    return () => {};
  }
}

export async function recordPaymentHistory(payment: Omit<PaymentHistory, 'payment_id'>): Promise<void> {
  const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const fullPayment: PaymentHistory = {
    ...payment,
    payment_id: paymentId,
    price: Number(payment.price) || 0,
  };
  try {
    await setDoc(doc(db, 'payment_history', paymentId), fullPayment);
  } catch (e) {
    console.warn('Payment logging error:', e);
  }
  localPaymentHistory.push(fullPayment);
}

export async function updateDailyRevenue(
  canteenId: string,
  amount: number,
  date: string = getISTDateString()
): Promise<void> {
  const safeAmount = Number(amount) || 0;
  const revenueId = `rev_${canteenId}_${date}`;
  try {
    const ref = doc(db, 'revenue', revenueId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data() as Partial<Revenue>;
      const currentOrders = Number(data.total_orders) || 0;
      const currentRevenue = Number(data.total_revenue) || 0;
      await updateDoc(ref, {
        total_orders: currentOrders + 1,
        total_revenue: currentRevenue + safeAmount,
        updated_at: new Date().toISOString(),
      });
    } else {
      const revDoc: Revenue = {
        revenue_id: revenueId,
        canteen_id: canteenId,
        date,
        total_orders: 1,
        total_revenue: safeAmount,
        updated_at: new Date().toISOString(),
      };
      await setDoc(ref, revDoc);
    }
  } catch (e) {
    console.warn('Revenue update error:', e);
  }
}

export async function createOrderInFirestore(orderInput: {
  user: UserProfile;
  canteen: Canteen;
  items: Order['items_snapshot'];
  subtotal: number;
  total: number;
  order_type: 'instant' | 'preorder';
  pickup_time: string;
  scheduled_release_at?: string | null;
  payment_method: PaymentMethod;
  policy_version: string;
  policy_accepted: boolean;
}): Promise<Order> {
  const targetDateIST = getISTDateString();
  const canteenId = orderInput.canteen.canteen_id;
  const tokenPrefix = (orderInput.canteen.token_prefix || 'A').toUpperCase();
  const orderDocRef = doc(collection(db, 'orders'));
  const orderId = orderDocRef.id;
  const nowIso = new Date().toISOString();
  const effectiveUserId = orderInput.user.user_id || auth.currentUser?.uid || 'unknown_user';

  const paymentStatus: PaymentStatus =
    orderInput.payment_method === 'online_demo' ? 'PAID_ONLINE_DEMO' : 'CASH_PENDING';
  const isScheduledPreorder = orderInput.order_type === 'preorder' && !!orderInput.scheduled_release_at;

  let allocatedToken = 1;
  let tokenDisplay = `${tokenPrefix}1`;

  await runTransaction(db, async (transaction) => {
    const counterRef = doc(db, 'orderCounters', canteenId);
    const counterSnap = await transaction.get(counterRef);
    const currentCounter = counterSnap.exists() ? (counterSnap.data() as OrderCounter) : null;

    const calc = calculateNextTokenWithPrefix(currentCounter, targetDateIST, canteenId, tokenPrefix);
    allocatedToken = calc.allocatedToken;
    tokenDisplay = calc.tokenDisplay;
    transaction.set(counterRef, calc.newCounter);

    const initialStatus: OrderStatus = isScheduledPreorder
      ? 'scheduled'
      : orderInput.canteen.acceptance_mode === 'automatic'
        ? 'preparing'
        : 'awaiting_acceptance';

    const newOrder: Order = {
      order_id: orderId,
      token_display: tokenDisplay,
      daily_token_number: allocatedToken,
      token_prefix: tokenPrefix,
      token_date: targetDateIST,
      canteen_id: canteenId,
      canteen_name_snapshot: orderInput.canteen.name,
      user_id: effectiveUserId,
      user_name_snapshot: orderInput.user.name,
      user_role_snapshot: orderInput.user.role_id,
      order_type: orderInput.order_type,
      items_snapshot: orderInput.items,
      subtotal: Number(orderInput.subtotal) || 0,
      total: Number(orderInput.total) || 0,
      payment_method: orderInput.payment_method,
      payment_status: paymentStatus,
      order_status: initialStatus,
      pickup_time: orderInput.pickup_time,
      pickup_date: targetDateIST,
      scheduled_release_at: orderInput.scheduled_release_at || null,
      policy_version: orderInput.policy_version,
      policy_accepted_at: orderInput.policy_accepted ? nowIso : null,
      ready_at: null,
      collection_deadline: null,
      collected_time: null,
      collected_status: 'pending',
      cash_received_at: null,
      created_at: nowIso,
      updated_at: nowIso,
      idempotency_key: `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };

    transaction.set(orderDocRef, newOrder);
  });

  const createdSnap = await getDoc(orderDocRef);
  if (!createdSnap.exists()) throw new Error('Order creation failed.');
  const createdOrder = createdSnap.data() as Order;

  await recordPaymentHistory({
    order_id: orderId,
    user_id: effectiveUserId,
    canteen_id: canteenId,
    user_name_snapshot: orderInput.user.name,
    canteen_name_snapshot: orderInput.canteen.name,
    payment_mode: orderInput.payment_method,
    price: Number(orderInput.total) || 0,
    payment_status: paymentStatus,
    timestamp: nowIso,
  });

  if (paymentStatus === 'PAID_ONLINE_DEMO') {
    await updateDailyRevenue(canteenId, Number(orderInput.total) || 0, targetDateIST);
  }

  await createNotificationForUser(effectiveUserId, {
    order_id: orderId,
    title: isScheduledPreorder ? 'Pre-order Scheduled' : 'Order Placed',
    body: isScheduledPreorder
      ? `Your pre-order #${createdOrder.token_display} at ${orderInput.canteen.name} is scheduled for ${orderInput.pickup_time}.`
      : `Your order #${createdOrder.token_display} has been placed at ${orderInput.canteen.name}.`,
    type: 'order_placed',
  });

  if (!isScheduledPreorder) {
    try {
      const operatorsSnap = await getDocs(query(collection(db, 'users'), where('role_id', '==', 'operator')));
      operatorsSnap.forEach((opDoc) => {
        const op = opDoc.data() as UserProfile;
        if (
          !op.assigned_canteen_ids ||
          op.assigned_canteen_ids.length === 0 ||
          op.assigned_canteen_ids.includes(canteenId)
        ) {
          createNotificationForUser(op.user_id, {
            order_id: orderId,
            title: `New Order: Token #${createdOrder.token_display}`,
            body: `New ${orderInput.order_type} order with ${orderInput.items.length} item(s) at ${orderInput.canteen.name}.`,
            type: 'order_placed',
          });
        }
      });
    } catch (opErr) {
      console.warn('Operator notification notice:', opErr);
    }
  }

  await recordAuditLog({
    actor_id: effectiveUserId,
    actor_name_snapshot: orderInput.user.name,
    actor_role: orderInput.user.role_id,
    action: 'ORDER_CREATED',
    entity_type: 'order',
    entity_id: orderId,
    canteen_id: canteenId,
    description: `Order ${createdOrder.token_display} placed at ${orderInput.canteen.name} (${orderInput.order_type}, ${paymentStatus})`,
    before_data: null,
    after_data: createdOrder as unknown as Record<string, unknown>,
  });

  return createdOrder;
}

export async function updateOrderStatusInFirestore(
  orderId: string,
  newStatus: OrderStatus,
  actor: { id: string; name: string; role: string }
): Promise<void> {
  const nowIso = new Date().toISOString();
  const orderSnap = await getDoc(doc(db, 'orders', orderId));
  const existingOrder = orderSnap.exists()
    ? (orderSnap.data() as Order)
    : localOrders.find((o) => o.order_id === orderId);

  if (existingOrder) {
    if (newStatus === 'cancelled' && !['awaiting_acceptance', 'scheduled'].includes(existingOrder.order_status)) {
      throw new Error('Order cannot be cancelled at this stage.');
    }
    if (newStatus === 'ready_for_pickup' && existingOrder.payment_status === 'CASH_PENDING') {
      throw new Error('Cannot mark order ready: Cash pending.');
    }
  }

  const updates: Partial<Order> = { order_status: newStatus, updated_at: nowIso };

  if (newStatus === 'ready_for_pickup') {
    updates.ready_at = nowIso;
    updates.collection_deadline = new Date(Date.now() + 12 * 60 * 1000).toISOString();
  }
  if (newStatus === 'picked_up') {
    if (existingOrder?.collection_deadline && Date.now() > new Date(existingOrder.collection_deadline).getTime()) {
      updates.order_status = 'not_collected';
      updates.collected_status = 'expired';
    } else {
      updates.collected_time = nowIso;
      updates.collected_status = 'verified';
    }
  }

  await updateDoc(doc(db, 'orders', orderId), updates);

  const idx = localOrders.findIndex((o) => o.order_id === orderId);
  if (idx >= 0) localOrders[idx] = { ...localOrders[idx], ...updates };

  if (existingOrder) {
    const cName = existingOrder.canteen_name_snapshot;
    const tDisp = existingOrder.token_display;
    const uId = existingOrder.user_id;

    if (newStatus === 'preparing') {
      await createNotificationForUser(uId, {
        order_id: orderId,
        title: 'Preparing Your Order',
        body: `Your order #${tDisp} at ${cName} is now being prepared.`,
        type: 'order_preparing',
      });
    } else if (newStatus === 'ready_for_pickup') {
      await createNotificationForUser(uId, {
        order_id: orderId,
        title: 'Ready for Pickup!',
        body: `Your order #${tDisp} at ${cName} is ready! Please collect within 12 minutes.`,
        type: 'order_ready',
      });
    } else if (newStatus === 'picked_up') {
      await createNotificationForUser(uId, {
        order_id: orderId,
        title: 'Order Collected',
        body: `Your order #${tDisp} from ${cName} was successfully collected.`,
        type: 'order_ready',
      });
    } else if (newStatus === 'declined') {
      await createNotificationForUser(uId, {
        order_id: orderId,
        title: 'Order Declined',
        body: `Your order #${tDisp} was declined by ${cName}.`,
        type: 'order_declined',
      });
    } else if (newStatus === 'cancelled') {
      await createNotificationForUser(uId, {
        order_id: orderId,
        title: 'Order Cancelled',
        body: `Your order #${tDisp} has been cancelled.`,
        type: 'order_cancelled',
      });
    } else if (newStatus === 'not_collected') {
      await createNotificationForUser(uId, {
        order_id: orderId,
        title: 'Order Not Collected',
        body: `Your order #${tDisp} from ${cName} was not collected in time and has expired.`,
        type: 'pickup_failed',
      });
    }
  }

  await recordAuditLog({
    actor_id: actor.id,
    actor_name_snapshot: actor.name,
    actor_role: actor.role,
    action: `ORDER_STATUS_${newStatus.toUpperCase()}`,
    entity_type: 'order',
    entity_id: orderId,
    canteen_id: existingOrder?.canteen_id || null,
    description: `Order status updated to ${newStatus}`,
    before_data: existingOrder ? { status: existingOrder.order_status } : null,
    after_data: updates as unknown as Record<string, unknown>,
  });
}

export async function markCashReceivedInFirestore(
  orderId: string,
  actor: { id: string; name: string; role: string }
): Promise<void> {
  const nowIso = new Date().toISOString();
  const orderSnap = await getDoc(doc(db, 'orders', orderId));
  const existingOrder = orderSnap.exists()
    ? (orderSnap.data() as Order)
    : localOrders.find((o) => o.order_id === orderId);
  const updates: Partial<Order> = {
    payment_status: 'CASH_RECEIVED',
    cash_received_at: nowIso,
    updated_at: nowIso,
  };

  await updateDoc(doc(db, 'orders', orderId), updates);

  const idx = localOrders.findIndex((o) => o.order_id === orderId);
  if (idx >= 0) localOrders[idx] = { ...localOrders[idx], ...updates };

  if (existingOrder) {
    await recordPaymentHistory({
      order_id: orderId,
      user_id: existingOrder.user_id,
      canteen_id: existingOrder.canteen_id,
      user_name_snapshot: existingOrder.user_name_snapshot,
      canteen_name_snapshot: existingOrder.canteen_name_snapshot,
      payment_mode: 'cash',
      price: Number(existingOrder.total) || 0,
      payment_status: 'CASH_RECEIVED',
      timestamp: nowIso,
    });
    await updateDailyRevenue(existingOrder.canteen_id, Number(existingOrder.total) || 0, existingOrder.token_date);
  }

  await recordAuditLog({
    actor_id: actor.id,
    actor_name_snapshot: actor.name,
    actor_role: actor.role,
    action: 'PAYMENT_CASH_RECEIVED',
    entity_type: 'order',
    entity_id: orderId,
    canteen_id: existingOrder?.canteen_id || null,
    description: `Cash received for order ${orderId}`,
    before_data: { payment_status: 'CASH_PENDING' },
    after_data: { payment_status: 'CASH_RECEIVED' },
  });
}

export async function checkAndExpireOrders(canteenId?: string): Promise<number> {
  const now = Date.now();
  let expiredCount = 0;
  const ordersToCheck = localOrders.filter(
    (o) =>
      o.order_status === 'ready_for_pickup' &&
      (!canteenId || o.canteen_id === canteenId) &&
      o.collection_deadline
  );

  for (const order of ordersToCheck) {
    const deadlineMs = new Date(order.collection_deadline!).getTime();
    const diffMs = deadlineMs - now;

    if (diffMs > 0 && diffMs <= 2 * 60 * 1000) {
      const alreadyWarned = localNotifications.some(
        (n) => n.order_id === order.order_id && n.type === 'pickup_warning'
      );
      if (!alreadyWarned) {
        await createNotificationForUser(order.user_id, {
          order_id: order.order_id,
          title: 'Pickup Deadline Soon!',
          body: `You have 2 minutes left to collect order #${order.token_display} from ${order.canteen_name_snapshot}.`,
          type: 'pickup_warning',
        });
      }
    }

    if (diffMs <= 0) {
      await updateOrderStatusInFirestore(order.order_id, 'not_collected', {
        id: 'system',
        name: 'Automated Timer System',
        role: 'system',
      });
      expiredCount++;
    }
  }
  return expiredCount;
}

export async function toggleFavouriteCanteen(userId: string, canteenId: string): Promise<string[]> {
  try {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    const favs: string[] = snap.exists() ? (snap.data() as UserProfile).favourite_canteen_ids || [] : [];
    const idx = favs.indexOf(canteenId);
    if (idx >= 0) favs.splice(idx, 1);
    else favs.push(canteenId);
    await updateDoc(userRef, { favourite_canteen_ids: favs, updated_at: new Date().toISOString() });
    return favs;
  } catch {
    return [];
  }
}

export async function toggleMenuItemAvailability(
  itemId: string,
  isAvailable: boolean,
  actor: { id: string; name: string; role: string }
): Promise<void> {
  await updateDoc(doc(db, 'menuItems', itemId), {
    is_available: isAvailable,
    updated_at: new Date().toISOString(),
  });
  await recordAuditLog({
    actor_id: actor.id,
    actor_name_snapshot: actor.name,
    actor_role: actor.role,
    action: isAvailable ? 'MENU_ITEM_AVAILABLE' : 'MENU_ITEM_SOLDOUT',
    entity_type: 'menuItem',
    entity_id: itemId,
    canteen_id: null,
    description: `Menu item marked as ${isAvailable ? 'AVAILABLE' : 'SOLD OUT'}`,
    before_data: null,
    after_data: { is_available: isAvailable },
  });
}

export async function addMenuItemFirestore(
  item: MenuItem,
  actor: { id: string; name: string; role: string }
): Promise<MenuItem> {
  await setDoc(doc(db, 'menuItems', item.menu_item_id), item);
  await recordAuditLog({
    actor_id: actor.id,
    actor_name_snapshot: actor.name,
    actor_role: actor.role,
    action: 'MENU_ITEM_CREATED',
    entity_type: 'menuItem',
    entity_id: item.menu_item_id,
    canteen_id: item.canteen_id,
    description: `Added menu item ${item.item_name}`,
    before_data: null,
    after_data: item as unknown as Record<string, unknown>,
  });
  return item;
}

export async function editMenuItemFirestore(
  itemId: string,
  updates: Partial<MenuItem>,
  actor: { id: string; name: string; role: string }
): Promise<void> {
  const fullUpdates = { ...updates, updated_at: new Date().toISOString() };
  await updateDoc(doc(db, 'menuItems', itemId), fullUpdates);
  await recordAuditLog({
    actor_id: actor.id,
    actor_name_snapshot: actor.name,
    actor_role: actor.role,
    action: 'MENU_ITEM_UPDATED',
    entity_type: 'menuItem',
    entity_id: itemId,
    canteen_id: null,
    description: 'Updated menu item',
    before_data: null,
    after_data: fullUpdates,
  });
}

export async function deleteMenuItemFirestore(
  itemId: string,
  actor: { id: string; name: string; role: string }
): Promise<void> {
  await updateDoc(doc(db, 'menuItems', itemId), { is_active: false, updated_at: new Date().toISOString() });
  await recordAuditLog({
    actor_id: actor.id,
    actor_name_snapshot: actor.name,
    actor_role: actor.role,
    action: 'MENU_ITEM_DEACTIVATED',
    entity_type: 'menuItem',
    entity_id: itemId,
    canteen_id: null,
    description: 'Deactivated menu item',
    before_data: null,
    after_data: { is_active: false },
  });
}

export async function addCanteenFirestore(
  canteen: Canteen,
  actor: { id: string; name: string; role: string }
): Promise<Canteen> {
  await setDoc(doc(db, 'canteens', canteen.canteen_id), canteen);
  await recordAuditLog({
    actor_id: actor.id,
    actor_name_snapshot: actor.name,
    actor_role: actor.role,
    action: 'CANTEEN_CREATED',
    entity_type: 'canteen',
    entity_id: canteen.canteen_id,
    canteen_id: canteen.canteen_id,
    description: `Created canteen ${canteen.name}`,
    before_data: null,
    after_data: canteen as unknown as Record<string, unknown>,
  });
  return canteen;
}

export async function editCanteenFirestore(
  canteenId: string,
  updates: Partial<Canteen>,
  actor: { id: string; name: string; role: string }
): Promise<void> {
  const fullUpdates = { ...updates, updated_at: new Date().toISOString() };
  await updateDoc(doc(db, 'canteens', canteenId), fullUpdates);
  await recordAuditLog({
    actor_id: actor.id,
    actor_name_snapshot: actor.name,
    actor_role: actor.role,
    action: 'CANTEEN_UPDATED',
    entity_type: 'canteen',
    entity_id: canteenId,
    canteen_id: canteenId,
    description: 'Updated canteen',
    before_data: null,
    after_data: fullUpdates,
  });
}

export async function deleteCanteenFirestore(
  canteenId: string,
  actor: { id: string; name: string; role: string }
): Promise<void> {
  await updateDoc(doc(db, 'canteens', canteenId), { is_active: false, updated_at: new Date().toISOString() });
  await recordAuditLog({
    actor_id: actor.id,
    actor_name_snapshot: actor.name,
    actor_role: actor.role,
    action: 'CANTEEN_DEACTIVATED',
    entity_type: 'canteen',
    entity_id: canteenId,
    canteen_id: canteenId,
    description: 'Deactivated canteen',
    before_data: null,
    after_data: { is_active: false },
  });
}

export async function toggleCanteenStatus(
  canteenId: string,
  isOpen: boolean,
  actor: { id: string; name: string; role: string }
): Promise<void> {
  await updateDoc(doc(db, 'canteens', canteenId), { is_open: isOpen, updated_at: new Date().toISOString() });
  await recordAuditLog({
    actor_id: actor.id,
    actor_name_snapshot: actor.name,
    actor_role: actor.role,
    action: isOpen ? 'CANTEEN_OPENED' : 'CANTEEN_CLOSED',
    entity_type: 'canteen',
    entity_id: canteenId,
    canteen_id: canteenId,
    description: `Canteen was ${isOpen ? 'OPENED' : 'CLOSED'}`,
    before_data: null,
    after_data: { is_open: isOpen },
  });
}

export async function addCategoryFirestore(
  cat: MenuCategory,
  actor: { id: string; name: string; role: string }
): Promise<void> {
  await setDoc(doc(db, 'menuCategories', cat.menu_category_id), cat);
  await recordAuditLog({
    actor_id: actor.id,
    actor_name_snapshot: actor.name,
    actor_role: actor.role,
    action: 'CATEGORY_CREATED',
    entity_type: 'category',
    entity_id: cat.menu_category_id,
    canteen_id: null,
    description: `Created category ${cat.category_name}`,
    before_data: null,
    after_data: cat as unknown as Record<string, unknown>,
  });
}

export async function updateUserProfileFirestore(
  userId: string,
  updates: Partial<UserProfile>,
  actor: { id: string; name: string; role: string }
): Promise<void> {
  const fullUpdates = { ...updates, updated_at: new Date().toISOString() };
  await updateDoc(doc(db, 'users', userId), fullUpdates);
  await recordAuditLog({
    actor_id: actor.id,
    actor_name_snapshot: actor.name,
    actor_role: actor.role,
    action: 'USER_UPDATED',
    entity_type: 'user',
    entity_id: userId,
    canteen_id: null,
    description: 'Updated profile',
    before_data: null,
    after_data: fullUpdates,
  });
}

export async function recordAuditLog(
  log: Omit<AuditLog, 'audit_log_id' | 'timestamp' | 'source'>
): Promise<void> {
  const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const fullLog: AuditLog = {
    ...log,
    audit_log_id: logId,
    actor_id: log.actor_id || auth.currentUser?.uid || 'system',
    timestamp: new Date().toISOString(),
    source: 'client',
  };
  try {
    await setDoc(doc(db, 'auditLogs', logId), fullLog);
  } catch {}
}

export async function fetchAuditLogs(): Promise<AuditLog[]> {
  try {
    const snap = await getDocs(query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'), limit(100)));
    if (!snap.empty) return snap.docs.map((d) => d.data() as AuditLog);
  } catch {}
  return [];
}

export function listenRevenueForCanteen(
  canteenId: string,
  callback: (revenues: Revenue[]) => void
): Unsubscribe {
  try {
    const q = query(collection(db, 'revenue'), where('canteen_id', '==', canteenId));
    return onSnapshot(
      q,
      (snapshot) => {
        const revenues = snapshot.docs.map((d) => {
          const raw = d.data() as Partial<Revenue>;
          return {
            revenue_id: raw.revenue_id || d.id,
            canteen_id: raw.canteen_id || canteenId,
            date: raw.date || getISTDateString(),
            total_orders: Number(raw.total_orders) || 0,
            total_revenue: Number(raw.total_revenue) || 0,
            updated_at: raw.updated_at || new Date().toISOString(),
          };
        });
        revenues.sort((a, b) => b.date.localeCompare(a.date));
        localRevenue = revenues;
        callback(revenues);
      },
      (error) => {
        console.warn('Revenue listener error:', error.message);
        callback([]);
      }
    );
  } catch {
    callback([]);
    return () => {};
  }
}

export function listenPaymentHistory(
  userId: string | null,
  callback: (payments: PaymentHistory[]) => void
): Unsubscribe {
  try {
    const coll = collection(db, 'payment_history');
    const q = userId ? query(coll, where('user_id', '==', userId)) : query(coll, limit(200));
    return onSnapshot(
      q,
      (snapshot) => {
        const payments = snapshot.docs.map((d) => {
          const raw = d.data() as Partial<PaymentHistory>;
          return {
            ...raw,
            payment_id: raw.payment_id || d.id,
            price: Number(raw.price) || 0,
          } as PaymentHistory;
        });
        payments.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        callback(payments);
      },
      (error) => {
        console.warn('Payment history listener error:', error.message);
        callback([]);
      }
    );
  } catch {
    callback([]);
    return () => {};
  }
}

export function listenCanteenPaymentHistory(
  canteenId: string,
  callback: (payments: PaymentHistory[]) => void
): Unsubscribe {
  try {
    const q = query(collection(db, 'payment_history'), where('canteen_id', '==', canteenId));
    return onSnapshot(
      q,
      (snapshot) => {
        const payments = snapshot.docs.map((d) => {
          const raw = d.data() as Partial<PaymentHistory>;
          return {
            ...raw,
            payment_id: raw.payment_id || d.id,
            price: Number(raw.price) || 0,
          } as PaymentHistory;
        });
        payments.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        callback(payments);
      },
      (error) => {
        console.warn('Canteen payment history listener error:', error.message);
        callback([]);
      }
    );
  } catch {
    callback([]);
    return () => {};
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

export async function createNotificationForUser(
  userId: string,
  data: { order_id: string; title: string; body: string; type: AppNotification['type'] }
): Promise<AppNotification> {
  const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const notif: AppNotification = {
    notification_id: notifId,
    user_id: userId,
    order_id: data.order_id,
    title: data.title,
    body: data.body,
    type: data.type,
    is_read: false,
    created_at: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'notifications', notifId), notif);
  } catch (e) {
    console.warn('Failed to save notification to Firestore:', e);
  }

  localNotifications.unshift(notif);
  sendPushToUser(userId, data.title, data.body, {
    order_id: data.order_id,
    type: data.type,
  }).catch(() => {});

  return notif;
}

export function listenUserNotifications(
  userId: string,
  callback: (notifs: AppNotification[]) => void
): Unsubscribe {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('user_id', '==', userId),
      orderBy('created_at', 'desc'),
      limit(50)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        callback(snapshot.docs.map((d) => d.data() as AppNotification));
      },
      () => {
        callback(localNotifications.filter((n) => n.user_id === userId));
      }
    );
  } catch {
    callback(localNotifications.filter((n) => n.user_id === userId));
    return () => {};
  }
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'notifications', notificationId), { is_read: true });
  } catch {}
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  try {
    const q = query(collection(db, 'notifications'), where('user_id', '==', userId), where('is_read', '==', false));
    const snap = await getDocs(q);
    await Promise.all(snap.docs.map((d) => updateDoc(d.ref, { is_read: true })));
  } catch {}
}

export async function getUserNotificationSettings(userId: string): Promise<NotificationSettings> {
  const defaultSettings: NotificationSettings = {
    user_id: userId,
    order_placed: true,
    order_accepted: true,
    order_preparing: true,
    order_ready: true,
    pickup_warning: true,
    pickup_failed: true,
    order_declined: true,
  };
  try {
    const snap = await getDoc(doc(db, 'notification_settings', userId));
    if (snap.exists()) return { ...defaultSettings, ...(snap.data() as NotificationSettings) };
  } catch {}
  return defaultSettings;
}

export async function updateUserNotificationSettings(
  userId: string,
  settings: NotificationSettings
): Promise<void> {
  try {
    await setDoc(doc(db, 'notification_settings', userId), settings, { merge: true });
  } catch {}
}