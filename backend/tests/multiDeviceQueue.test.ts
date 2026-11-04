import assert from 'node:assert';
import type { Order, OrderStatus } from '../src/models/types.js';

/**
 * In-memory simulated Firestore collection to model multi-client listeners & queries
 */
class MockFirestoreDatabase {
  private orders = new Map<string, Order>();

  addOrder(order: Order) {
    this.orders.set(order.order_id, { ...order });
  }

  updateOrderStatus(orderId: string, newStatus: OrderStatus): Order {
    const existing = this.orders.get(orderId);
    if (!existing) {
      throw new Error(`Order ${orderId} not found`);
    }
    const updated = {
      ...existing,
      order_status: newStatus,
      updated_at: new Date().toISOString(),
    };
    this.orders.set(orderId, updated);
    return updated;
  }

  // Student private history query: where('user_id', '==', studentId)
  queryStudentOrders(studentId: string): Order[] {
    return Array.from(this.orders.values())
      .filter((o) => o.user_id === studentId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  // Operator queue query: where('canteen_id', '==', canteenId)
  queryOperatorQueue(canteenId: string): Order[] {
    return Array.from(this.orders.values())
      .filter((o) => o.canteen_id === canteenId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
}

export function runMultiDeviceQueueTests() {
  console.log('🧪 Running Multi-Device Shared Queue & Student Privacy Tests...');

  const db = new MockFirestoreDatabase();
  const canteenId = 'canteen-mb-f1';

  // 1. Student A places order on Device A
  const orderStudentA: Order = {
    order_id: 'ord_dev_a_101',
    daily_token_number: 1,
    token_date: '2026-11-03',
    canteen_id: canteenId,
    canteen_name_snapshot: 'MB Floor 1 Canteen',
    user_id: 'student_a_uid',
    user_name_snapshot: 'Aarav Patel',
    user_role_snapshot: 'student',
    order_type: 'instant',
    items_snapshot: [
      {
        menu_item_id: 'item-samosa-f1',
        item_name: 'Aloo Samosa (2 Pcs)',
        price: 30,
        quantity: 2,
        subtotal: 60,
        is_veg: true,
        placeholder_key: 'samosa',
      },
    ],
    subtotal: 60,
    total: 60,
    payment_method: 'demo_pay',
    payment_status: 'completed',
    order_status: 'awaiting_acceptance',
    pickup_time: 'Immediate',
    policy_version: '1.0.0',
    policy_accepted_at: null,
    collected_time: null,
    collected_status: 'pending',
    created_at: new Date('2026-11-03T10:00:00Z').toISOString(),
    updated_at: new Date('2026-11-03T10:00:00Z').toISOString(),
    idempotency_key: 'idemp-student-a-1',
  };
  db.addOrder(orderStudentA);

  // 2. Student B places order on Device B at the SAME canteen
  const orderStudentB: Order = {
    order_id: 'ord_dev_b_102',
    daily_token_number: 2,
    token_date: '2026-11-03',
    canteen_id: canteenId,
    canteen_name_snapshot: 'MB Floor 1 Canteen',
    user_id: 'student_b_uid',
    user_name_snapshot: 'Pooja Mehta',
    user_role_snapshot: 'student',
    order_type: 'preorder',
    items_snapshot: [
      {
        menu_item_id: 'item-sandwich-f1',
        item_name: 'Veg Cheese Grilled Sandwich',
        price: 70,
        quantity: 1,
        subtotal: 70,
        is_veg: true,
        placeholder_key: 'sandwich',
      },
    ],
    subtotal: 70,
    total: 70,
    payment_method: 'demo_pay',
    payment_status: 'completed',
    order_status: 'awaiting_acceptance',
    pickup_time: '12:30 PM',
    policy_version: '1.0.0',
    policy_accepted_at: new Date('2026-11-03T10:05:00Z').toISOString(),
    collected_time: null,
    collected_status: 'pending',
    created_at: new Date('2026-11-03T10:05:00Z').toISOString(),
    updated_at: new Date('2026-11-03T10:05:00Z').toISOString(),
    idempotency_key: 'idemp-student-b-1',
  };
  db.addOrder(orderStudentB);

  // 3. Operator on Device C (Tablet) views Canteen A's queue
  const operatorQueue = db.queryOperatorQueue(canteenId);
  assert.strictEqual(
    operatorQueue.length,
    2,
    'Operator must see BOTH Student A and Student B orders in the shared queue'
  );
  assert.ok(
    operatorQueue.some((o) => o.order_id === 'ord_dev_a_101' && o.daily_token_number === 1),
    'Order from Student A is visible in Operator Queue'
  );
  assert.ok(
    operatorQueue.some((o) => o.order_id === 'ord_dev_b_102' && o.daily_token_number === 2),
    'Order from Student B is visible in Operator Queue'
  );

  // 4. Privacy Check: Student A views history on Device A
  const studentAOrders = db.queryStudentOrders('student_a_uid');
  assert.strictEqual(studentAOrders.length, 1, 'Student A must only see their own 1 order');
  assert.strictEqual(studentAOrders[0].order_id, 'ord_dev_a_101');

  // 5. Privacy Check: Student B views history on Device B
  const studentBOrders = db.queryStudentOrders('student_b_uid');
  assert.strictEqual(studentBOrders.length, 1, 'Student B must only see their own 1 order');
  assert.strictEqual(studentBOrders[0].order_id, 'ord_dev_b_102');

  // 6. Operator marks Student A's order as "preparing", then "ready_for_pickup"
  db.updateOrderStatus('ord_dev_a_101', 'preparing');
  db.updateOrderStatus('ord_dev_a_101', 'ready_for_pickup');

  // 7. Verify real-time propagation to Student A
  const updatedStudentA = db.queryStudentOrders('student_a_uid');
  assert.strictEqual(
    updatedStudentA[0].order_status,
    'ready_for_pickup',
    'Student A device receives updated status ready_for_pickup'
  );

  // Student B status is unaffected
  const updatedStudentB = db.queryStudentOrders('student_b_uid');
  assert.strictEqual(
    updatedStudentB[0].order_status,
    'awaiting_acceptance',
    'Student B order remains awaiting_acceptance'
  );

  console.log('✅ Multi-Device Shared Queue & Student Privacy Tests Passed (7/7)');
}

