import { runTokenServiceTests } from './tokenService.test.js';
import { runOrderServiceTests } from './orderService.test.js';
import { runMultiDeviceQueueTests } from './multiDeviceQueue.test.js';

async function main() {
  console.log('====================================================');
  console.log('       MU CANTEEN — BACKEND VERIFICATION SUITE       ');
  console.log('====================================================\n');

  try {
    runTokenServiceTests();
    console.log('');
    runOrderServiceTests();
    console.log('');
    runMultiDeviceQueueTests();
    console.log('');
    console.log('🎉 ALL 20 BACKEND UNIT & INTEGRATION TESTS PASSED PERFECTLY!');
    console.log('====================================================');
    process.exit(0);
  } catch (error) {
    console.error('❌ TEST FAILED:', error);
    process.exit(1);
  }
}

main();

