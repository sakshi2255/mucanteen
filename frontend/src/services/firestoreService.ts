import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  runTransaction, 
  limit,
  Unsubscribe 
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { getISTDateString, calculateNextTokenWithPrefix, type OrderCounter } from './tokenService';
import { 
  INITIAL_CANTEENS, 
  INITIAL_CATEGORIES, 
  INITIAL_MENU_ITEMS,
  INITIAL_PROMOTIONS 
} from './seedData';
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
  AuditLog 
} from '../models/types';

// In-memory runtime mirror for instant local response & offline resilience
let localOrders: Order[] = [];
let localCanteens: Canteen[] = [...INITIAL_CANTEENS];
let localMenuItems: MenuItem[] = [...INITIAL_MENU_ITEMS];
let localPromotions: Promotion[] = [...INITIAL_PROMOTIONS];
let localCategories: MenuCategory[] = [...INITIAL_CATEGORIES];

/**
 * Initializes Firestore default seed data if collections are empty.
 */
export async function initializeFirestoreIfNeeded(): Promise<void> {
  try {
    const canteensSnap = await getDocs(collection(db, 'canteens'));
    if (canteensSnap.empty) {
      console.log('Seeding initial campus canteens to Firestore...');
      for (const canteen of INITIAL_CANTEENS) {
        await setDoc(doc(db, 'canteens', canteen.canteen_id), canteen);
      }
    }

    const categoriesSnap = await getDocs(collection(db, 'menuCategories'));
    if (categoriesSnap.empty) {
      console.log('Seeding initial menu categories to Firestore...');
      for (const cat of INITIAL_CATEGORIES) {
        await setDoc(doc(db, 'menuCategories', cat.menu_category_id), cat);
      }
    }

    const itemsSnap = await getDocs(collection(db, 'menuItems'));
    if (itemsSnap.empty) {
      console.log('Seeding initial menu items to Firestore...');
      for (const item of INITIAL_MENU_ITEMS) {
        await setDoc(doc(db, 'menuItems', item.menu_item_id), item);
      }
    }

    const promoSnap = await getDocs(collection(db, 'promotions'));
    if (promoSnap.empty) {
      console.log('Seeding initial promotions to Firestore...');
      for (const promo of INITIAL_PROMOTIONS) {
        await setDoc(doc(db, 'promotions', promo.promotion_id), promo);
      }
    }
  } catch (error) {
    console.warn('Firestore initialization notice (operating with memory store if offline):', error);
  }
}

/**
 * Real-time listener for campus canteens
 */
export function listenCanteens(callback: (canteens: Canteen[]) => void): Unsubscribe {
  try {
    const q = query(collection(db, 'canteens'), where('is_active', '==', true));
    return onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const canteens = snapshot.docs.map((d) => d.data() as Canteen);
          localCanteens = canteens;
          callback(canteens);
        } else {
          callback(localCanteens);
        }
      },
      (error) => {
        console.warn('Canteens listener fallback:', error.message);
        callback(localCanteens);
      }
    );
  } catch (err) {
    callback(localCanteens);
    return () => {};
  }
}

/**
 * Real-time listener for promotions & discounts
 */
export function listenPromotions(callback: (promotions: Promotion[]) => void): Unsubscribe {
  try {
    const q = query(collection(db, 'promotions'), where('is_active', '==', true));
    return onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const promos = snapshot.docs.map((d) => d.data() as Promotion);
          localPromotions = promos;
          callback(promos);
        } else {
          callback(localPromotions);
        }
      },
      (error) => {
        console.warn('Promotions listener fallback:', error.message);
        callback(localPromotions);
      }
    );
  } catch (err) {
    callback(localPromotions);
    return () => {};
  }
}

/**
 * Real-time listener for menu categories
 */
export function listenCategories(callback: (categories: MenuCategory[]) => void): Unsubscribe {
  try {
    const q = query(collection(db, 'menuCategories'), where('is_active', '==', true));
    return onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const cats = snapshot.docs.map((d) => d.data() as MenuCategory);
          localCategories = cats;
          callback(cats);
        } else {
          callback(localCategories);
        }
      },
      (error) => {
        console.warn('Categories listener fallback:', error.message);
        callback(localCategories);
      }
    );
  } catch (err) {
    callback(localCategories);
    return () => {};
  }
}

/**
 * Real-time listener for menu items
 */
export function listenMenuItems(
  canteenId: string | null,
  callback: (items: MenuItem[]) => void
): Unsubscribe {
  try {
    const coll = collection(db, 'menuItems');
    const q = canteenId 
      ? query(coll, where('canteen_id', '==', canteenId), where('is_active', '==', true))
      : query(coll, where('is_active', '==', true));

    return onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const items = snapshot.docs.map((d) => d.data() as MenuItem);
          callback(items);
        } else {
          const filtered = canteenId 
            ? localMenuItems.filter((i) => i.canteen_id === canteenId)
            : localMenuItems;
          callback(filtered);
        }
      },
      (error) => {
        console.warn('Menu items listener fallback:', error.message);
        const filtered = canteenId 
          ? localMenuItems.filter((i) => i.canteen_id === canteenId)
          : localMenuItems;
        callback(filtered);
      }
    );
  } catch (err) {
    callback(canteenId ? localMenuItems.filter((i) => i.canteen_id === canteenId) : localMenuItems);
    return () => {};
  }
}

/**
 * Real-time listener for Canteen Operators order queue
 */
export function listenOperatorOrders(
  canteenId: string,
  callback: (orders: Order[]) => void
): Unsubscribe {
  try {
    const q = query(
      collection(db, 'orders'),
      where('canteen_id', '==', canteenId),
      orderBy('created_at', 'desc')
    );

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
        console.warn('Operator orders listener fallback (using synced memory):', error.message);
        const filtered = localOrders
          .filter((o) => o.canteen_id === canteenId)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        callback(filtered);
      }
    );
  } catch (err) {
    const filtered = localOrders
      .filter((o) => o.canteen_id === canteenId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    callback(filtered);
    return () => {};
  }
}

/**
 * Real-time listener for Student Private Order History
 */
export function listenStudentOrders(
  userId: string,
  callback: (orders: Order[]) => void
): Unsubscribe {
  try {
    const q = query(
      collection(db, 'orders'),
      where('user_id', '==', userId),
      orderBy('created_at', 'desc')
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const orders = snapshot.docs.map((d) => d.data() as Order);
        callback(orders);
      },
      (error) => {
        console.warn('Student orders listener fallback:', error.message);
        const filtered = localOrders
          .filter((o) => o.user_id === userId)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        callback(filtered);
      }
    );
  } catch (err) {
    const filtered = localOrders
      .filter((o) => o.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    callback(filtered);
    return () => {};
  }
}

/**
 * Real-time listener for Admin campus-wide orders
 */
export function listenAllOrders(callback: (orders: Order[]) => void): Unsubscribe {
  try {
    const q = query(collection(db, 'orders'), orderBy('created_at', 'desc'), limit(100));
    return onSnapshot(
      q,
      (snapshot) => {
        const orders = snapshot.docs.map((d) => d.data() as Order);
        callback(orders);
      },
      (error) => {
        console.warn('Admin orders listener fallback:', error.message);
        callback([...localOrders].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      }
    );
  } catch (err) {
    callback([...localOrders].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    return () => {};
  }
}

/**
 * Concurrency-Safe Prefixed Order Creation in Firestore
 * Formats daily prefixed token: e.g. A1, B2, C3
 */
export async function createOrderInFirestore(orderInput: {
  user: UserProfile;
  canteen: Canteen;
  items: Order['items_snapshot'];
  subtotal: number;
  total: number;
  order_type: 'instant' | 'preorder';
  pickup_time: string;
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

  const paymentStatus: PaymentStatus = 
    orderInput.payment_method === 'online_demo' ? 'PAID_ONLINE_DEMO' : 'CASH_PENDING';

  let allocatedToken = 1;
  let tokenDisplay = `${tokenPrefix}1`;

  try {
    // Attempt Firestore Transaction
    await runTransaction(db, async (transaction) => {
      const counterRef = doc(db, 'orderCounters', canteenId);
      const counterSnap = await transaction.get(counterRef);

      const currentCounter = counterSnap.exists()
        ? (counterSnap.data() as OrderCounter)
        : null;

      const calc = calculateNextTokenWithPrefix(
        currentCounter,
        targetDateIST,
        canteenId,
        tokenPrefix
      );

      allocatedToken = calc.allocatedToken;
      tokenDisplay = calc.tokenDisplay;

      transaction.set(counterRef, calc.newCounter);

      const initialStatus: OrderStatus = 
        orderInput.canteen.acceptance_mode === 'automatic' ? 'preparing' : 'awaiting_acceptance';

      const newOrder: Order = {
        order_id: orderId,
        token_display: tokenDisplay,
        daily_token_number: allocatedToken,
        token_prefix: tokenPrefix,
        token_date: targetDateIST,
        canteen_id: canteenId,
        canteen_name_snapshot: orderInput.canteen.name,
        user_id: orderInput.user.user_id,
        user_name_snapshot: orderInput.user.name,
        user_role_snapshot: orderInput.user.role_id,
        order_type: orderInput.order_type,
        items_snapshot: orderInput.items,
        subtotal: orderInput.subtotal,
        total: orderInput.total,
        payment_method: orderInput.payment_method,
        payment_status: paymentStatus,
        order_status: initialStatus,
        pickup_time: orderInput.pickup_time,
        pickup_date: targetDateIST,
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
  } catch (error) {
    console.warn('Transaction fallback to local state:', error);
    const todayOrders = localOrders.filter(
      (o) => o.canteen_id === canteenId && o.token_date === targetDateIST
    );
    allocatedToken = todayOrders.length + 1;
    tokenDisplay = `${tokenPrefix}${allocatedToken}`;

    const initialStatus: OrderStatus = 
      orderInput.canteen.acceptance_mode === 'automatic' ? 'preparing' : 'awaiting_acceptance';

    const fallbackOrder: Order = {
      order_id: orderId,
      token_display: tokenDisplay,
      daily_token_number: allocatedToken,
      token_prefix: tokenPrefix,
      token_date: targetDateIST,
      canteen_id: canteenId,
      canteen_name_snapshot: orderInput.canteen.name,
      user_id: orderInput.user.user_id,
      user_name_snapshot: orderInput.user.name,
      user_role_snapshot: orderInput.user.role_id,
      order_type: orderInput.order_type,
      items_snapshot: orderInput.items,
      subtotal: orderInput.subtotal,
      total: orderInput.total,
      payment_method: orderInput.payment_method,
      payment_status: paymentStatus,
      order_status: initialStatus,
      pickup_time: orderInput.pickup_time,
      pickup_date: targetDateIST,
      policy_version: orderInput.policy_version,
      policy_accepted_at: orderInput.policy_accepted ? nowIso : null,
      ready_at: null,
      collection_deadline: null,
      collected_time: null,
      collected_status: 'pending',
      cash_received_at: null,
      created_at: nowIso,
      updated_at: nowIso,
      idempotency_key: `idemp_${Date.now()}`,
    };

    localOrders.unshift(fallbackOrder);
    return fallbackOrder;
  }

  // Fetch created order to return
  let createdOrder: Order;
  try {
    const createdSnap = await getDoc(orderDocRef);
    createdOrder = createdSnap.data() as Order;
  } catch {
    createdOrder = {
      order_id: orderId,
      token_display: tokenDisplay,
      daily_token_number: allocatedToken,
      token_prefix: tokenPrefix,
      token_date: targetDateIST,
      canteen_id: canteenId,
      canteen_name_snapshot: orderInput.canteen.name,
      user_id: orderInput.user.user_id,
      user_name_snapshot: orderInput.user.name,
      user_role_snapshot: orderInput.user.role_id,
      order_type: orderInput.order_type,
      items_snapshot: orderInput.items,
      subtotal: orderInput.subtotal,
      total: orderInput.total,
      payment_method: orderInput.payment_method,
      payment_status: paymentStatus,
      order_status: orderInput.canteen.acceptance_mode === 'automatic' ? 'preparing' : 'awaiting_acceptance',
      pickup_time: orderInput.pickup_time,
      pickup_date: targetDateIST,
      policy_version: orderInput.policy_version,
      policy_accepted_at: orderInput.policy_accepted ? nowIso : null,
      ready_at: null,
      collection_deadline: null,
      collected_time: null,
      collected_status: 'pending',
      cash_received_at: null,
      created_at: nowIso,
      updated_at: nowIso,
      idempotency_key: `idemp_${Date.now()}`,
    };
  }
  localOrders.unshift(createdOrder);

  // Write audit log
  await recordAuditLog({
    actor_id: orderInput.user.user_id,
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

/**
 * Updates order status with strict lifecycle rules:
 * - Ready for Pickup: blocked if cash pending. Sets ready_at and 12-min deadline.
 * - Picked Up: verifies 12-minute window.
 * - Cancelled: student can cancel only in awaiting_acceptance.
 */
export async function updateOrderStatusInFirestore(
  orderId: string,
  newStatus: OrderStatus,
  actor: { id: string; name: string; role: string }
): Promise<void> {
  const nowIso = new Date().toISOString();
  const existingOrder = localOrders.find((o) => o.order_id === orderId);

  // Validation rules
  if (existingOrder) {
    if (newStatus === 'cancelled' && existingOrder.order_status !== 'awaiting_acceptance') {
      throw new Error('Order is already being prepared or ready and cannot be cancelled.');
    }
    if (newStatus === 'ready_for_pickup' && existingOrder.payment_status === 'CASH_PENDING') {
      throw new Error('Cannot mark order ready: Cash payment has not been received yet. Please mark cash received first.');
    }
  }

  const updates: Partial<Order> = {
    order_status: newStatus,
    updated_at: nowIso,
  };

  if (newStatus === 'ready_for_pickup') {
    updates.ready_at = nowIso;
    // 12-minute collection timer
    const deadline = new Date(Date.now() + 12 * 60 * 1000);
    updates.collection_deadline = deadline.toISOString();
  }

  if (newStatus === 'picked_up') {
    // Check if expired
    if (existingOrder?.collection_deadline) {
      const deadlineTime = new Date(existingOrder.collection_deadline).getTime();
      if (Date.now() > deadlineTime) {
        updates.order_status = 'not_collected';
        updates.collected_status = 'expired';
      } else {
        updates.collected_time = nowIso;
        updates.collected_status = 'verified';
      }
    } else {
      updates.collected_time = nowIso;
      updates.collected_status = 'verified';
    }
  }

  try {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, updates);
  } catch (error) {
    console.warn('Update order doc notice:', error);
  }

  // Update in local memory
  const idx = localOrders.findIndex((o) => o.order_id === orderId);
  if (idx >= 0) {
    localOrders[idx] = { ...localOrders[idx], ...updates };
  }

  await recordAuditLog({
    actor_id: actor.id,
    actor_name_snapshot: actor.name,
    actor_role: actor.role,
    action: `ORDER_STATUS_${newStatus.toUpperCase()}`,
    entity_type: 'order',
    entity_id: orderId,
    canteen_id: existingOrder?.canteen_id || null,
    description: `Order ${existingOrder?.token_display || orderId} status updated to ${newStatus}`,
    before_data: existingOrder ? { status: existingOrder.order_status } : null,
    after_data: updates as unknown as Record<string, unknown>,
  });
}

/**
 * Marks cash received for a cash order.
 * Required before order can be marked ready.
 */
export async function markCashReceivedInFirestore(
  orderId: string,
  actor: { id: string; name: string; role: string }
): Promise<void> {
  const nowIso = new Date().toISOString();
  const existingOrder = localOrders.find((o) => o.order_id === orderId);

  const updates: Partial<Order> = {
    payment_status: 'CASH_RECEIVED',
    cash_received_at: nowIso,
    updated_at: nowIso,
  };

  try {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, updates);
  } catch (error) {
    console.warn('Mark cash received notice:', error);
  }

  const idx = localOrders.findIndex((o) => o.order_id === orderId);
  if (idx >= 0) {
    localOrders[idx] = { ...localOrders[idx], ...updates };
  }

  await recordAuditLog({
    actor_id: actor.id,
    actor_name_snapshot: actor.name,
    actor_role: actor.role,
    action: 'PAYMENT_CASH_RECEIVED',
    entity_type: 'order',
    entity_id: orderId,
    canteen_id: existingOrder?.canteen_id || null,
    description: `Cash received for order ${existingOrder?.token_display || orderId}`,
    before_data: { payment_status: 'CASH_PENDING' },
    after_data: { payment_status: 'CASH_RECEIVED', cash_received_at: nowIso },
  });
}

/**
 * Checks for expired ready orders that exceeded the 12-minute window
 */
export async function checkAndExpireOrders(canteenId?: string): Promise<number> {
  const now = Date.now();
  let expiredCount = 0;

  const ordersToCheck = localOrders.filter((o) => {
    if (o.order_status !== 'ready_for_pickup') return false;
    if (canteenId && o.canteen_id !== canteenId) return false;
    if (!o.collection_deadline) return false;
    return now > new Date(o.collection_deadline).getTime();
  });

  for (const order of ordersToCheck) {
    await updateOrderStatusInFirestore(order.order_id, 'not_collected', {
      id: 'system',
      name: 'Automated Timer System',
      role: 'system',
    });
    expiredCount++;
  }

  return expiredCount;
}

/**
 * Toggle favourite canteen for user
 */
export async function toggleFavouriteCanteen(
  userId: string,
  canteenId: string
): Promise<string[]> {
  try {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    let favs: string[] = [];
    if (snap.exists()) {
      const data = snap.data() as UserProfile;
      favs = data.favourite_canteen_ids || [];
    }
    const idx = favs.indexOf(canteenId);
    if (idx >= 0) {
      favs.splice(idx, 1);
    } else {
      favs.push(canteenId);
    }
    await updateDoc(userRef, {
      favourite_canteen_ids: favs,
      updated_at: new Date().toISOString(),
    });
    return favs;
  } catch (e) {
    console.warn('Favourite toggle notice:', e);
    return [];
  }
}

/**
 * Toggle menu item availability (Available vs Sold Out)
 */
export async function toggleMenuItemAvailability(
  itemId: string,
  isAvailable: boolean,
  actor: { id: string; name: string; role: string }
): Promise<void> {
  try {
    const itemRef = doc(db, 'menuItems', itemId);
    await updateDoc(itemRef, {
      is_available: isAvailable,
      updated_at: new Date().toISOString(),
    });
  } catch (e) {
    console.warn('Menu toggle fallback:', e);
  }

  const idx = localMenuItems.findIndex((i) => i.menu_item_id === itemId);
  if (idx >= 0) {
    localMenuItems[idx].is_available = isAvailable;
  }

  await recordAuditLog({
    actor_id: actor.id,
    actor_name_snapshot: actor.name,
    actor_role: actor.role,
    action: isAvailable ? 'MENU_ITEM_AVAILABLE' : 'MENU_ITEM_SOLDOUT',
    entity_type: 'menuItem',
    entity_id: itemId,
    canteen_id: localMenuItems[idx]?.canteen_id || null,
    description: `Menu item marked as ${isAvailable ? 'AVAILABLE' : 'SOLD OUT'}`,
    before_data: null,
    after_data: { is_available: isAvailable },
  });
}

/**
 * Operator / Admin: Add Menu Item
 */
export async function addMenuItemFirestore(
  item: MenuItem,
  actor: { id: string; name: string; role: string }
): Promise<MenuItem> {
  try {
    const ref = doc(collection(db, 'menuItems'), item.menu_item_id);
    await setDoc(ref, item);
  } catch (e) {
    console.warn('Add menu item fallback:', e);
  }

  localMenuItems.push(item);

  await recordAuditLog({
    actor_id: actor.id,
    actor_name_snapshot: actor.name,
    actor_role: actor.role,
    action: 'MENU_ITEM_CREATED',
    entity_type: 'menuItem',
    entity_id: item.menu_item_id,
    canteen_id: item.canteen_id,
    description: `Added menu item ${item.item_name} (₹${item.price})`,
    before_data: null,
    after_data: item as unknown as Record<string, unknown>,
  });

  return item;
}

/**
 * Operator / Admin: Edit Menu Item
 */
export async function editMenuItemFirestore(
  itemId: string,
  updates: Partial<MenuItem>,
  actor: { id: string; name: string; role: string }
): Promise<void> {
  const nowIso = new Date().toISOString();
  const fullUpdates = { ...updates, updated_at: nowIso };

  try {
    const ref = doc(db, 'menuItems', itemId);
    await updateDoc(ref, fullUpdates);
  } catch (e) {
    console.warn('Edit menu item fallback:', e);
  }

  const idx = localMenuItems.findIndex((i) => i.menu_item_id === itemId);
  if (idx >= 0) {
    localMenuItems[idx] = { ...localMenuItems[idx], ...fullUpdates };
  }

  await recordAuditLog({
    actor_id: actor.id,
    actor_name_snapshot: actor.name,
    actor_role: actor.role,
    action: 'MENU_ITEM_UPDATED',
    entity_type: 'menuItem',
    entity_id: itemId,
    canteen_id: localMenuItems[idx]?.canteen_id || null,
    description: `Updated menu item ${localMenuItems[idx]?.item_name || itemId}`,
    before_data: null,
    after_data: fullUpdates as unknown as Record<string, unknown>,
  });
}

/**
 * Operator / Admin: Delete Menu Item (Soft Delete)
 */
export async function deleteMenuItemFirestore(
  itemId: string,
  actor: { id: string; name: string; role: string }
): Promise<void> {
  try {
    const ref = doc(db, 'menuItems', itemId);
    await updateDoc(ref, { is_active: false, updated_at: new Date().toISOString() });
  } catch (e) {
    console.warn('Delete menu item fallback:', e);
  }

  const idx = localMenuItems.findIndex((i) => i.menu_item_id === itemId);
  const canteenId = idx >= 0 ? localMenuItems[idx].canteen_id : null;
  if (idx >= 0) {
    localMenuItems[idx].is_active = false;
  }

  await recordAuditLog({
    actor_id: actor.id,
    actor_name_snapshot: actor.name,
    actor_role: actor.role,
    action: 'MENU_ITEM_DEACTIVATED',
    entity_type: 'menuItem',
    entity_id: itemId,
    canteen_id: canteenId,
    description: `Deactivated menu item ${itemId}`,
    before_data: null,
    after_data: { is_active: false },
  });
}

/**
 * Admin: Add Canteen
 */
export async function addCanteenFirestore(
  canteen: Canteen,
  actor: { id: string; name: string; role: string }
): Promise<Canteen> {
  try {
    await setDoc(doc(db, 'canteens', canteen.canteen_id), canteen);
  } catch (e) {
    console.warn('Add canteen fallback:', e);
  }

  localCanteens.push(canteen);

  await recordAuditLog({
    actor_id: actor.id,
    actor_name_snapshot: actor.name,
    actor_role: actor.role,
    action: 'CANTEEN_CREATED',
    entity_type: 'canteen',
    entity_id: canteen.canteen_id,
    canteen_id: canteen.canteen_id,
    description: `Created canteen ${canteen.name} (Prefix ${canteen.token_prefix})`,
    before_data: null,
    after_data: canteen as unknown as Record<string, unknown>,
  });

  return canteen;
}

/**
 * Admin: Edit Canteen
 */
export async function editCanteenFirestore(
  canteenId: string,
  updates: Partial<Canteen>,
  actor: { id: string; name: string; role: string }
): Promise<void> {
  const fullUpdates = { ...updates, updated_at: new Date().toISOString() };
  try {
    await updateDoc(doc(db, 'canteens', canteenId), fullUpdates);
  } catch (e) {
    console.warn('Edit canteen fallback:', e);
  }

  const idx = localCanteens.findIndex((c) => c.canteen_id === canteenId);
  if (idx >= 0) {
    localCanteens[idx] = { ...localCanteens[idx], ...fullUpdates };
  }

  await recordAuditLog({
    actor_id: actor.id,
    actor_name_snapshot: actor.name,
    actor_role: actor.role,
    action: 'CANTEEN_UPDATED',
    entity_type: 'canteen',
    entity_id: canteenId,
    canteen_id: canteenId,
    description: `Updated canteen ${localCanteens[idx]?.name || canteenId}`,
    before_data: null,
    after_data: fullUpdates as unknown as Record<string, unknown>,
  });
}

/**
 * Toggle canteen open / closed
 */
export async function toggleCanteenStatus(
  canteenId: string,
  isOpen: boolean,
  actor: { id: string; name: string; role: string }
): Promise<void> {
  try {
    const canteenRef = doc(db, 'canteens', canteenId);
    await updateDoc(canteenRef, {
      is_open: isOpen,
      updated_at: new Date().toISOString(),
    });
  } catch (e) {
    console.warn('Canteen toggle fallback:', e);
  }

  const idx = localCanteens.findIndex((c) => c.canteen_id === canteenId);
  if (idx >= 0) {
    localCanteens[idx].is_open = isOpen;
  }

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

/**
 * Admin: Add Menu Category
 */
export async function addCategoryFirestore(
  cat: MenuCategory,
  actor: { id: string; name: string; role: string }
): Promise<void> {
  try {
    await setDoc(doc(db, 'menuCategories', cat.menu_category_id), cat);
  } catch (e) {
    console.warn('Add category fallback:', e);
  }

  localCategories.push(cat);

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

/**
 * Admin: Update User Profile
 */
export async function updateUserProfileFirestore(
  userId: string,
  updates: Partial<UserProfile>,
  actor: { id: string; name: string; role: string }
): Promise<void> {
  const fullUpdates = { ...updates, updated_at: new Date().toISOString() };
  try {
    await updateDoc(doc(db, 'users', userId), fullUpdates);
  } catch (e) {
    console.warn('Update user fallback:', e);
  }

  await recordAuditLog({
    actor_id: actor.id,
    actor_name_snapshot: actor.name,
    actor_role: actor.role,
    action: 'USER_UPDATED',
    entity_type: 'user',
    entity_id: userId,
    canteen_id: null,
    description: `Updated profile for user ${userId}`,
    before_data: null,
    after_data: fullUpdates as unknown as Record<string, unknown>,
  });
}

/**
 * Writes append-only audit log
 */
export async function recordAuditLog(log: Omit<AuditLog, 'audit_log_id' | 'timestamp' | 'source'>): Promise<void> {
  const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const fullLog: AuditLog = {
    audit_log_id: logId,
    ...log,
    timestamp: new Date().toISOString(),
    source: 'client',
  };

  try {
    await setDoc(doc(db, 'auditLogs', logId), fullLog);
  } catch (e) {
    // Append-only in memory
  }
}

/**
 * Fetch audit logs for Admin screen
 */
export async function fetchAuditLogs(): Promise<AuditLog[]> {
  try {
    const q = query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'), limit(50));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs.map((d) => d.data() as AuditLog);
    }
  } catch (e) {
    console.warn('Fetch audit logs notice:', e);
  }
  return [];
}
