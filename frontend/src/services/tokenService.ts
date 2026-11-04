export interface OrderCounter {
  canteen_id: string;
  token_prefix: string;
  token_date: string;
  last_token_number: number;
  lifetime_order_count: number;
  updated_at: string;
}

/**
 * Formats current date string (YYYY-MM-DD) in Asia/Kolkata timezone
 */
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
    // Fallback if Intl timeZone is not supported in Hermes
    const d = new Date(date.getTime() + (5.5 * 60 + date.getTimezoneOffset()) * 60000);
    return d.toISOString().split('T')[0]!;
  }
}

/**
 * Pure function to calculate the next prefixed token (e.g. A1, B2)
 * Resets daily to 1 in Asia/Kolkata timezone
 */
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
