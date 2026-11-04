import assert from 'node:assert';
import { validateOrderCreation, isValidStatusTransition } from '../src/services/orderService.js';
import type { Canteen, MenuItem, UserProfile } from '../src/models/types.js';

export function runOrderServiceTests() {
  console.log('🧪 Running Order Service & State Machine Tests...');

  const studentUser: UserProfile = {
    user_id: 'student-101',
    name: 'Rohit Sharma',
    enrollment_number: '92100103099',
    email: 'rohit@marwadiuniversity.ac.in',
    role_id: 'student',
    role: 'Student',
    account_status: 'active',
    is_deleted: false,
    assigned_canteen_ids: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const facultyUser: UserProfile = {
    ...studentUser,
    user_id: 'faculty-201',
    name: 'Dr. Anand Verma',
    role_id: 'faculty',
    role: 'Faculty',
  };

  const commonCanteen: Canteen = {
    canteen_id: 'canteen-mb-f1',
    name: 'MB Floor 1 Canteen',
    building_id: 'bldg-main',
    floor: 1,
    canteen_type: 'common',
    operator_ids: ['op-1'],
    email: 'canteen1@mu.ac.in',
    phone: '9876543210',
    is_open: true,
    acceptance_mode: 'manual',
    operating_hours: '08:00 AM - 06:00 PM',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const facultyCanteen: Canteen = {
    ...commonCanteen,
    canteen_id: 'canteen-mb-f3-faculty',
    name: 'Faculty Lounge Canteen',
    canteen_type: 'faculty_only',
  };

  const availableItem: MenuItem = {
    menu_item_id: 'item-samosa',
    menu_category_id: 'cat-snacks',
    canteen_id: 'canteen-mb-f1',
    item_name: 'Hot Samosa',
    description: 'Crispy samosa',
    price: 30,
    is_veg: true,
    placeholder_key: 'samosa',
    image_url: null,
    is_available: true,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const soldOutItem: MenuItem = {
    ...availableItem,
    menu_item_id: 'item-vadapav',
    item_name: 'Vada Pav',
    is_available: false, // Sold Out
  };

  // Test 1: Student attempting to order at Faculty-Only canteen must be blocked
  const facultyCanteenResult = validateOrderCreation({
    user: studentUser,
    canteen: facultyCanteen,
    items: [{ menu_item_id: availableItem.menu_item_id, quantity: 1 }],
    availableMenuItems: [{ ...availableItem, canteen_id: facultyCanteen.canteen_id }],
    order_type: 'instant',
    policy_accepted: false,
    idempotency_key: 'key-1',
  });
  assert.strictEqual(facultyCanteenResult.isValid, false);
  assert.ok(
    facultyCanteenResult.errors.some((e) => e.includes('strictly restricted to Faculty')),
    'Non-faculty student should be rejected from Faculty Canteen'
  );

  // Test 2: Faculty user CAN order from Faculty Canteen
  const facultyAllowedResult = validateOrderCreation({
    user: facultyUser,
    canteen: facultyCanteen,
    items: [{ menu_item_id: availableItem.menu_item_id, quantity: 2 }],
    availableMenuItems: [{ ...availableItem, canteen_id: facultyCanteen.canteen_id }],
    order_type: 'instant',
    policy_accepted: false,
    idempotency_key: 'key-2',
  });
  assert.strictEqual(facultyAllowedResult.isValid, true);
  assert.strictEqual(facultyAllowedResult.subtotal, 60, 'Subtotal should be 2 x 30 = 60');

  // Test 3: Sold out item must be rejected
  const soldOutResult = validateOrderCreation({
    user: studentUser,
    canteen: commonCanteen,
    items: [{ menu_item_id: soldOutItem.menu_item_id, quantity: 1 }],
    availableMenuItems: [soldOutItem],
    order_type: 'instant',
    policy_accepted: false,
    idempotency_key: 'key-3',
  });
  assert.strictEqual(soldOutResult.isValid, false);
  assert.ok(
    soldOutResult.errors.some((e) => e.includes('SOLD OUT')),
    'Sold out item must be caught and rejected'
  );

  // Test 4: Preorder requires explicit policy acceptance and valid pickup slot
  const preorderNoPolicy = validateOrderCreation({
    user: studentUser,
    canteen: commonCanteen,
    items: [{ menu_item_id: availableItem.menu_item_id, quantity: 1 }],
    availableMenuItems: [availableItem],
    order_type: 'preorder',
    policy_accepted: false, // Declined/not accepted
    pickup_time: '12:30 PM',
    idempotency_key: 'key-4',
  });
  assert.strictEqual(preorderNoPolicy.isValid, false);
  assert.ok(
    preorderNoPolicy.errors.some((e) => e.includes('explicitly accept the Preorder Policy')),
    'Preorder without policy acceptance must be blocked'
  );

  // Test 5: State Machine — Accept automatically moves to 'preparing'
  const acceptTransition = isValidStatusTransition('awaiting_acceptance', 'preparing', 'operator');
  assert.strictEqual(acceptTransition.isValid, true, 'Accepting order must transition to preparing');

  // Test 6: Next state after preparing can only be 'ready_for_pickup'
  const readyTransition = isValidStatusTransition('preparing', 'ready_for_pickup', 'operator');
  assert.strictEqual(readyTransition.isValid, true, 'Preparing -> Ready for Pickup is valid');

  const invalidSkipToPickedUp = isValidStatusTransition('preparing', 'picked_up', 'operator');
  assert.strictEqual(invalidSkipToPickedUp.isValid, false, 'Preparing cannot skip directly to picked_up without being Ready');

  // Test 7: Ready -> Picked Up
  const collectedTransition = isValidStatusTransition('ready_for_pickup', 'picked_up', 'operator');
  assert.strictEqual(collectedTransition.isValid, true, 'Ready for Pickup -> Picked Up is valid');

  // Test 8: Finalized order cannot be mutated
  const finalizedMutation = isValidStatusTransition('picked_up', 'preparing', 'operator');
  assert.strictEqual(finalizedMutation.isValid, false, 'Finalized order cannot be changed back');

  console.log('✅ Order Service & State Machine Tests Passed (8/8)');
}

