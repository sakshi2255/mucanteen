import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { 
  getISTDateString, 
  allocateDailyTokenInTransaction 
} from './services/tokenService.js';
import { 
  validateOrderCreation, 
  isValidStatusTransition,
  type CreateOrderInput 
} from './services/orderService.js';
import { createAuditLogPayload } from './services/auditService.js';
import type { 
  Order, 
  OrderStatus, 
  PaymentStatus,
  Canteen, 
  MenuItem, 
  UserProfile 
} from './models/types.js';

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Callable Cloud Function: Validate and Create Order
 * Guarantees atomic daily prefixed token generation (e.g. A1, B2) in Asia/Kolkata,
 * revalidates menu item prices and availability server-side,
 * enforces single-canteen constraint, and creates immutable audit log.
 */
export const createOrder = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated.');
  }

  const userId = request.auth.uid;
  const data = request.data as CreateOrderInput;

  return await db.runTransaction(async (transaction) => {
    // 1. Fetch User Profile
    const userDocRef = db.collection('users').doc(userId);
    const userSnap = await transaction.get(userDocRef);
    if (!userSnap.exists) {
      throw new HttpsError('not-found', 'User profile not found in Firestore.');
    }
    const userProfile = userSnap.data() as UserProfile;

    // 2. Fetch Canteen
    const canteenRef = db.collection('canteens').doc(data.canteen.canteen_id);
    const canteenSnap = await transaction.get(canteenRef);
    if (!canteenSnap.exists) {
      throw new HttpsError('not-found', 'Selected canteen does not exist.');
    }
    const canteen = canteenSnap.data() as Canteen;

    // 3. Fetch Menu Items to revalidate prices & availability
    const itemIds = data.items.map((i) => i.menu_item_id);
    const fetchedMenuItems: MenuItem[] = [];
    for (const itemId of itemIds) {
      const itemRef = db.collection('menuItems').doc(itemId);
      const itemSnap = await transaction.get(itemRef);
      if (itemSnap.exists) {
        fetchedMenuItems.push(itemSnap.data() as MenuItem);
      }
    }

    // 4. Validate order
    const validation = validateOrderCreation({
      user: userProfile,
      canteen,
      items: data.items,
      availableMenuItems: fetchedMenuItems,
      order_type: data.order_type,
      pickup_time: data.pickup_time,
      policy_accepted: data.policy_accepted,
      policy_version: data.policy_version,
      payment_method: data.payment_method,
      idempotency_key: data.idempotency_key,
    });

    if (!validation.isValid) {
      throw new HttpsError(
        'invalid-argument',
        validation.errors.join(' | ')
      );
    }

    const targetDateIST = getISTDateString();
    const tokenPrefix = (canteen.token_prefix || 'A').toUpperCase();

    // 5. Concurrency-Safe Daily Token Allocation (starts at 1 per canteen per day in Asia/Kolkata)
    const tokenResult = await allocateDailyTokenInTransaction(
      transaction,
      db,
      canteen.canteen_id,
      tokenPrefix,
      targetDateIST
    );

    const orderRef = db.collection('orders').doc();
    const orderId = orderRef.id;
    const nowIso = new Date().toISOString();

    const paymentStatus: PaymentStatus = 
      data.payment_method === 'online_demo' ? 'PAID_ONLINE_DEMO' : 'CASH_PENDING';

    const newOrder: Order = {
      order_id: orderId,
      token_display: tokenResult.tokenDisplay,
      daily_token_number: tokenResult.dailyToken,
      token_prefix: tokenResult.tokenPrefix,
      token_date: tokenResult.tokenDate,
      canteen_id: canteen.canteen_id,
      canteen_name_snapshot: canteen.name,
      user_id: userId,
      user_name_snapshot: userProfile.name,
      user_role_snapshot: userProfile.role_id,
      order_type: data.order_type,
      items_snapshot: validation.validatedItems!,
      subtotal: validation.subtotal!,
      total: validation.total!,
      payment_method: data.payment_method || 'online_demo',
      payment_status: paymentStatus,
      order_status: validation.initialStatus!,
      pickup_time: data.pickup_time || 'Immediate',
      pickup_date: targetDateIST,
      policy_version: data.policy_version || '1.0.0',
      policy_accepted_at: data.policy_accepted ? nowIso : null,
      ready_at: null,
      collection_deadline: null,
      collected_time: null,
      collected_status: 'pending',
      cash_received_at: null,
      created_at: nowIso,
      updated_at: nowIso,
      idempotency_key: data.idempotency_key,
    };

    transaction.set(orderRef, newOrder);

    // Write initial audit log
    const auditPayload = createAuditLogPayload({
      actorId: userId,
      actorName: userProfile.name,
      actorRole: userProfile.role_id,
      action: 'ORDER_CREATED',
      entityType: 'order',
      entityId: orderId,
      canteenId: canteen.canteen_id,
      description: `Order ${newOrder.token_display} placed at ${canteen.name} (${data.order_type}, ${paymentStatus})`,
      afterData: newOrder as unknown as Record<string, unknown>,
      source: 'function',
    });
    const auditRef = db.collection('auditLogs').doc(auditPayload.audit_log_id);
    transaction.set(auditRef, auditPayload);

    return {
      order_id: orderId,
      token_display: newOrder.token_display,
      daily_token_number: newOrder.daily_token_number,
      token_date: newOrder.token_date,
      order_status: newOrder.order_status,
      canteen_name: canteen.name,
      total: newOrder.total,
    };
  });
});

/**
 * Callable Cloud Function: Mark Cash Received
 * Confirms receipt of cash payment for a cash order.
 */
export const markCashReceived = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated.');
  }

  const actorId = request.auth.uid;
  const { order_id } = request.data as { order_id: string };

  return await db.runTransaction(async (transaction) => {
    const actorSnap = await transaction.get(db.collection('users').doc(actorId));
    if (!actorSnap.exists) {
      throw new HttpsError('not-found', 'Actor profile not found.');
    }
    const actor = actorSnap.data() as UserProfile;

    const orderRef = db.collection('orders').doc(order_id);
    const orderSnap = await transaction.get(orderRef);
    if (!orderSnap.exists) {
      throw new HttpsError('not-found', 'Order not found.');
    }
    const order = orderSnap.data() as Order;

    if (actor.role_id === 'operator' && !actor.assigned_canteen_ids?.includes(order.canteen_id)) {
      throw new HttpsError('permission-denied', 'Operator not authorized for this canteen.');
    }

    const nowIso = new Date().toISOString();
    transaction.update(orderRef, {
      payment_status: 'CASH_RECEIVED',
      cash_received_at: nowIso,
      updated_at: nowIso,
    });

    const auditPayload = createAuditLogPayload({
      actorId,
      actorName: actor.name,
      actorRole: actor.role_id,
      action: 'PAYMENT_CASH_RECEIVED',
      entityType: 'order',
      entityId: order_id,
      canteenId: order.canteen_id,
      description: `Cash received for order ${order.token_display || order_id}`,
      beforeData: { payment_status: order.payment_status },
      afterData: { payment_status: 'CASH_RECEIVED', cash_received_at: nowIso },
      source: 'function',
    });
    transaction.set(db.collection('auditLogs').doc(auditPayload.audit_log_id), auditPayload);

    return { success: true, order_id, payment_status: 'CASH_RECEIVED' };
  });
});

/**
 * Callable Cloud Function: Update Order Status
 * Enforces:
 * - Cash pending blocks Ready for Pickup
 * - 12-minute collection countdown
 * - Student cancellation permitted only in Awaiting Acceptance
 */
export const updateOrderStatus = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated.');
  }

  const actorId = request.auth.uid;
  const data = request.data as {
    order_id: string;
    new_status: OrderStatus;
    verification_token?: number;
    note?: string;
  };

  return await db.runTransaction(async (transaction) => {
    // Fetch actor
    const actorSnap = await transaction.get(db.collection('users').doc(actorId));
    if (!actorSnap.exists) {
      throw new HttpsError('not-found', 'Actor profile not found.');
    }
    const actor = actorSnap.data() as UserProfile;

    // Fetch order
    const orderRef = db.collection('orders').doc(data.order_id);
    const orderSnap = await transaction.get(orderRef);
    if (!orderSnap.exists) {
      throw new HttpsError('not-found', 'Order not found.');
    }
    const order = orderSnap.data() as Order;

    // Check canteen operator authorization
    if (actor.role_id === 'operator') {
      if (!actor.assigned_canteen_ids?.includes(order.canteen_id)) {
        throw new HttpsError(
          'permission-denied',
          'Operator is not authorized to manage orders for this canteen.'
        );
      }
    } else if (actor.role_id === 'student' || actor.role_id === 'faculty') {
      if (order.user_id !== actorId) {
        throw new HttpsError('permission-denied', 'Cannot modify another user\'s order.');
      }
    }

    // Cancellation check
    if (data.new_status === 'cancelled' && order.order_status !== 'awaiting_acceptance') {
      throw new HttpsError(
        'failed-precondition',
        'Order is already being prepared and cannot be cancelled.'
      );
    }

    // Cash check before Ready
    if (data.new_status === 'ready_for_pickup' && order.payment_status === 'CASH_PENDING') {
      throw new HttpsError(
        'failed-precondition',
        'Cannot mark order ready: Cash payment has not been received yet. Please mark cash received first.'
      );
    }

    // Check transition validity
    const transition = isValidStatusTransition(order.order_status, data.new_status, actor.role_id);
    if (!transition.isValid) {
      throw new HttpsError('failed-precondition', transition.error || 'Invalid transition.');
    }

    const nowIso = new Date().toISOString();
    const updates: Partial<Order> = {
      order_status: data.new_status,
      updated_at: nowIso,
    };

    if (data.new_status === 'ready_for_pickup') {
      updates.ready_at = nowIso;
      // 12-minute collection timer
      const deadline = new Date(Date.now() + 12 * 60 * 1000);
      updates.collection_deadline = deadline.toISOString();
    }

    if (data.new_status === 'picked_up') {
      if (order.collection_deadline && Date.now() > new Date(order.collection_deadline).getTime()) {
        updates.order_status = 'not_collected';
        updates.collected_status = 'expired';
      } else {
        updates.collected_time = nowIso;
        updates.collected_status = 'verified';
      }
    }

    transaction.update(orderRef, updates);

    // Create Audit Log
    const auditPayload = createAuditLogPayload({
      actorId,
      actorName: actor.name,
      actorRole: actor.role_id,
      action: `ORDER_STATUS_${data.new_status.toUpperCase()}`,
      entityType: 'order',
      entityId: data.order_id,
      canteenId: order.canteen_id,
      description: `Order ${order.token_display || `#${order.daily_token_number}`} transitioned from ${order.order_status} to ${data.new_status}`,
      beforeData: { order_status: order.order_status },
      afterData: { order_status: data.new_status, ...updates },
      source: 'function',
    });
    transaction.set(db.collection('auditLogs').doc(auditPayload.audit_log_id), auditPayload);

    return {
      success: true,
      order_id: data.order_id,
      order_status: updates.order_status || data.new_status,
      token_display: order.token_display,
    };
  });
});
