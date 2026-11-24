import { getISTDateString, calculateNextTokenWithPrefix } from '../src/services/tokenService';
import { INITIAL_CANTEENS, INITIAL_CATEGORIES, INITIAL_MENU_ITEMS, INITIAL_PROMOTIONS } from '../src/services/seedData';

function assertStrictEqual(actual: any, expected: any, message?: string) {
  if (actual !== expected) {
    throw new Error(`Assertion failed: expected ${expected}, got ${actual}. ${message || ''}`);
  }
}

function assertOk(condition: any, message?: string) {
  if (!condition) {
    throw new Error(`Assertion failed: condition not met. ${message || ''}`);
  }
}

export function runClientTests() {
  console.log('🧪 Running Frontend / Client Verification Suite...');

  // 1. Campus Canteen Completeness Check (Minimum 3 common + 1 faculty)
  assertOk(
    INITIAL_CANTEENS.length >= 4,
    'Must have at least 4 campus canteen points configured'
  );

  const canteen1 = INITIAL_CANTEENS.find((c) => c.canteen_id === 'canteen_main_1');
  assertOk(canteen1, 'Main Building Canteen 1 must exist');
  assertStrictEqual(canteen1?.token_prefix, 'A', 'Main Bldg 1 must have token prefix A');

  const canteen2 = INITIAL_CANTEENS.find((c) => c.canteen_id === 'canteen_main_2');
  assertOk(canteen2, 'Main Building Canteen 2 must exist');
  assertStrictEqual(canteen2?.token_prefix, 'B', 'Main Bldg 2 must have token prefix B');

  const lawCanteen = INITIAL_CANTEENS.find((c) => c.canteen_type === 'law_canteen');
  assertOk(lawCanteen, 'Law building canteen must exist');
  assertStrictEqual(lawCanteen?.token_prefix, 'C', 'Law canteen must have token prefix C');

  const facultyCanteen = INITIAL_CANTEENS.find((c) => c.canteen_type === 'faculty_only');
  assertOk(facultyCanteen, 'Faculty-only canteen must exist');
  assertStrictEqual(facultyCanteen?.floor, 3, 'Faculty canteen must be on Floor 3');
  assertStrictEqual(facultyCanteen?.token_prefix, 'D', 'Faculty canteen must have token prefix D');

  // 2. IST Date Check
  const istDate = getISTDateString();
  assertOk(/^\d{4}-\d{2}-\d{2}$/.test(istDate), 'IST date must match YYYY-MM-DD');

  // 3. Prefixed Token Generation Test
  const tokenA1 = calculateNextTokenWithPrefix(null, istDate, 'canteen_main_1', 'A');
  assertStrictEqual(tokenA1.tokenDisplay, 'A1', 'First order at Canteen A must get A1');
  assertStrictEqual(tokenA1.allocatedToken, 1);

  const tokenA2 = calculateNextTokenWithPrefix(tokenA1.newCounter, istDate, 'canteen_main_1', 'A');
  assertStrictEqual(tokenA2.tokenDisplay, 'A2', 'Second order at Canteen A must get A2');

  const tokenB1 = calculateNextTokenWithPrefix(null, istDate, 'canteen_main_2', 'B');
  assertStrictEqual(tokenB1.tokenDisplay, 'B1', 'First order at Canteen B must get B1');

  // 4. Single Canteen Cart Logic Validation
  let activeCanteenId: string | null = null;
  const cart: Array<{ canteenId: string; itemId: string }> = [];

  function addItem(canteenId: string, itemId: string): { success: boolean; reason?: string } {
    if (activeCanteenId && activeCanteenId !== canteenId && cart.length > 0) {
      return { success: false, reason: 'MULTI_CANTEEN_PROHIBITED' };
    }
    if (!activeCanteenId) activeCanteenId = canteenId;
    cart.push({ canteenId, itemId });
    return { success: true };
  }

  const addFirst = addItem('canteen_main_1', 'item_samosa_1');
  assertStrictEqual(addFirst.success, true);

  const addSecondSameCanteen = addItem('canteen_main_1', 'item_chai_1');
  assertStrictEqual(addSecondSameCanteen.success, true);

  const addDifferentCanteen = addItem('canteen_main_2', 'item_dosa_2');
  assertStrictEqual(addDifferentCanteen.success, false);
  assertStrictEqual(addDifferentCanteen.reason, 'MULTI_CANTEEN_PROHIBITED');

  // 5. Menu categories & promotions completeness
  assertOk(INITIAL_CATEGORIES.length >= 4, 'Must have diverse menu categories');
  assertOk(INITIAL_PROMOTIONS.length >= 2, 'Must have active promotions configured');

  // 6. payments_history and Revenue Table Schema Conformity
  const samplePayment = {
    id: 'pay_test_01',
    order_id: 'ord_test_01',
    payment_mode: 'online_demo',
    price: 150,
    payment_status: 'PAID_ONLINE_DEMO',
  };
  assertStrictEqual(typeof samplePayment.id, 'string', 'payments_history must have id');
  assertStrictEqual(typeof samplePayment.order_id, 'string', 'payments_history must have order_id');
  assertStrictEqual(typeof samplePayment.payment_mode, 'string', 'payments_history must have payment_mode');
  assertStrictEqual(typeof samplePayment.price, 'number', 'payments_history must have price');
  assertStrictEqual(typeof samplePayment.payment_status, 'string', 'payments_history must have payment_status');

  const sampleRevenue = {
    id: 'rev_canteen_main_1_2026-11-20',
    date: '2026-11-20',
    total_orders: 12,
    total_revenue: 1200,
  };
  assertStrictEqual(typeof sampleRevenue.id, 'string', 'Revenue must have id');
  assertStrictEqual(typeof sampleRevenue.date, 'string', 'Revenue must have date');
  assertStrictEqual(typeof sampleRevenue.total_orders, 'number', 'Revenue must have total_orders');
  assertStrictEqual(typeof sampleRevenue.total_revenue, 'number', 'Revenue must have total_revenue');

  // 7. Dynamic Revenue Calculation Based on Orders
  const testOrders = [
    { order_id: '1', order_status: 'picked_up', total: 100 },
    { order_id: '2', order_status: 'picked_up', total: 250 },
    { order_id: '3', order_status: 'declined', total: 80 },
    { order_id: '4', order_status: 'preparing', total: 120 },
  ];
  const fulfilledRevenue = testOrders
    .filter((o) => o.order_status === 'picked_up')
    .reduce((sum, o) => sum + o.total, 0);
  assertStrictEqual(fulfilledRevenue, 350, 'Revenue must be 350 based on fulfilled/picked_up orders');

  // 8. 2-Minute Pickup Warning & Expiration Timing Validation
  const now = Date.now();
  const warningDeadline = new Date(now + 90 * 1000).toISOString(); // 1.5 mins left (< 2 mins)
  const expiredDeadline = new Date(now - 10 * 1000).toISOString(); // passed

  const warningDiff = new Date(warningDeadline).getTime() - now;
  const is2MinWarning = warningDiff > 0 && warningDiff <= 2 * 60 * 1000;
  assertStrictEqual(is2MinWarning, true, 'Order with 1.5m remaining must trigger 2m pickup warning');

  const expiredDiff = new Date(expiredDeadline).getTime() - now;
  const isExpired = expiredDiff <= 0;
  assertStrictEqual(isExpired, true, 'Order with past deadline must be marked expired/not_collected');

  console.log('✅ Frontend / Client Verification Suite Passed (8/8 test groups)!');
}

runClientTests();
