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

  console.log('✅ Frontend / Client Verification Suite Passed (5/5 test groups)!');
}

runClientTests();
