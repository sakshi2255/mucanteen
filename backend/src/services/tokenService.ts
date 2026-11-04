import type { OrderCounter } from '../models/types.js';

export function getISTDateString(date: Date = new Date()): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(date);
  } catch (e) {
    const d = new Date(date.getTime() + (5.5 * 60 + date.getTimezoneOffset()) * 60000);
    return d.toISOString().split('T')[0]!;
  }
}

export function calculateNextTokenWithPrefix(
  currentCounter: OrderCounter | null,
  targetDateIST: string,
  canteenId: string,
  tokenPrefix: string = 'A'
): {
  newCounter: OrderCounter;
  allocatedToken: number;
  tokenPrefix: string;
  tokenDisplay: string;
} {
  let nextDailyToken = 1;
  let nextLifetime = 1;

  if (currentCounter) {
    nextLifetime = (currentCounter.lifetime_order_count || 0) + 1;
    if (currentCounter.token_date === targetDateIST) {
      nextDailyToken = (currentCounter.last_token_number || 0) + 1;
    } else {
      nextDailyToken = 1; // Daily reset to 1 in Asia/Kolkata
    }
  }

  const prefix = tokenPrefix.trim().toUpperCase() || 'A';
  const tokenDisplay = `${prefix}${nextDailyToken}`;

  const newCounter: OrderCounter = {
    canteen_id: canteenId,
    token_prefix: prefix,
    token_date: targetDateIST,
    last_token_number: nextDailyToken,
    lifetime_order_count: nextLifetime,
    updated_at: new Date().toISOString(),
  };

  return {
    newCounter,
    allocatedToken: nextDailyToken,
    tokenPrefix: prefix,
    tokenDisplay,
  };
}

export const calculateNextToken = calculateNextTokenWithPrefix;

export async function allocateDailyTokenInTransaction(
  transaction: FirebaseFirestore.Transaction,
  firestore: FirebaseFirestore.Firestore,
  canteenId: string,
  tokenPrefix: string = 'A',
  targetDateIST: string = getISTDateString()
): Promise<{ 
  dailyToken: number; 
  tokenPrefix: string; 
  tokenDisplay: string; 
  tokenDate: string; 
  lifetimeCount: number 
}> {
  const counterRef = firestore.collection('orderCounters').doc(canteenId);
  const counterSnap = await transaction.get(counterRef);

  const currentCounter = counterSnap.exists
    ? (counterSnap.data() as OrderCounter)
    : null;

  const { newCounter, allocatedToken, tokenDisplay } = calculateNextTokenWithPrefix(
    currentCounter,
    targetDateIST,
    canteenId,
    tokenPrefix
  );

  transaction.set(counterRef, newCounter);

  return {
    dailyToken: allocatedToken,
    tokenPrefix: newCounter.token_prefix,
    tokenDisplay,
    tokenDate: targetDateIST,
    lifetimeCount: newCounter.lifetime_order_count,
  };
}
