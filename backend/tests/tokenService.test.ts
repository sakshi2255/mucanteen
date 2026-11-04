import assert from 'node:assert';
import { calculateNextTokenWithPrefix, getISTDateString } from '../src/services/tokenService.js';
import type { OrderCounter } from '../src/models/types.js';

export function runTokenServiceTests() {
  console.log('🧪 Running Prefixed Daily Token Service Tests...');

  const today = '2026-11-03';
  const canteenA = 'canteen_main_1';
  const canteenB = 'canteen_main_2';
  const canteenC = 'canteen_law_1';

  // Test 1: Daily token starts at 1 for fresh canteen with prefix 'A'
  const res1 = calculateNextTokenWithPrefix(null, today, canteenA, 'A');
  assert.strictEqual(res1.allocatedToken, 1, 'First token must be 1');
  assert.strictEqual(res1.tokenDisplay, 'A1', 'Display must be A1');
  assert.strictEqual(res1.newCounter.lifetime_order_count, 1, 'Lifetime count should be 1');
  assert.strictEqual(res1.newCounter.token_date, today);

  // Test 2: Next order receives A2, then A3
  const res2 = calculateNextTokenWithPrefix(res1.newCounter, today, canteenA, 'A');
  assert.strictEqual(res2.allocatedToken, 2, 'Second token must be 2');
  assert.strictEqual(res2.tokenDisplay, 'A2', 'Display must be A2');
  assert.strictEqual(res2.newCounter.lifetime_order_count, 2, 'Lifetime count should be 2');

  const res3 = calculateNextTokenWithPrefix(res2.newCounter, today, canteenA, 'A');
  assert.strictEqual(res3.allocatedToken, 3, 'Third token must be 3');
  assert.strictEqual(res3.tokenDisplay, 'A3', 'Display must be A3');

  // Test 3: Canteen B has its own independent daily counter with prefix 'B'
  const resB1 = calculateNextTokenWithPrefix(null, today, canteenB, 'B');
  assert.strictEqual(resB1.allocatedToken, 1, 'Canteen B first token must be 1');
  assert.strictEqual(resB1.tokenDisplay, 'B1', 'Display must be B1');
  assert.strictEqual(resB1.newCounter.canteen_id, canteenB);

  // Test 4: Canteen C has its own independent daily counter with prefix 'C'
  const resC1 = calculateNextTokenWithPrefix(null, today, canteenC, 'C');
  assert.strictEqual(resC1.allocatedToken, 1, 'Canteen C first token must be 1');
  assert.strictEqual(resC1.tokenDisplay, 'C1', 'Display must be C1');

  // Test 5: Next day reset (Asia/Kolkata date changes from 2026-11-03 to 2026-11-04)
  const tomorrow = '2026-11-04';
  const resNextDay = calculateNextTokenWithPrefix(res3.newCounter, tomorrow, canteenA, 'A');
  assert.strictEqual(resNextDay.allocatedToken, 1, 'Token must reset to 1 on the next calendar day in IST');
  assert.strictEqual(resNextDay.tokenDisplay, 'A1', 'Display must reset to A1');
  assert.strictEqual(resNextDay.newCounter.last_token_number, 1);
  assert.strictEqual(resNextDay.newCounter.lifetime_order_count, 4, 'Lifetime order count MUST continue increasing after daily reset (was 3, now 4)');
  assert.strictEqual(resNextDay.newCounter.token_date, tomorrow);

  // Test 6: Verify IST Date string format YYYY-MM-DD
  const istDate = getISTDateString();
  assert.match(istDate, /^\d{4}-\d{2}-\d{2}$/, 'IST date string must match YYYY-MM-DD');

  console.log('✅ Prefixed Token Service Tests Passed (6/6)');
}
