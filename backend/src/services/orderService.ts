import type { 
  Order, 
  OrderStatus, 
  OrderItemSnapshot, 
  Canteen, 
  MenuItem, 
  UserProfile,
  PaymentMethod,
  PaymentStatus 
} from '../models/types.js';
import { getISTDateString } from './tokenService.js';

export interface CreateOrderInput {
  user: UserProfile;
  canteen: Canteen;
  items: Array<{
    menu_item_id: string;
    quantity: number;
  }>;
  availableMenuItems: MenuItem[];
  order_type: 'instant' | 'preorder';
  pickup_time?: string;
  pickup_date?: string; // Must be same day!
  policy_accepted: boolean;
  policy_version?: string;
  payment_method: PaymentMethod;
  idempotency_key: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  validatedItems?: OrderItemSnapshot[];
  subtotal?: number;
  total?: number;
  initialStatus?: OrderStatus;
  initialPaymentStatus?: PaymentStatus;
  pickupDate?: string;
}

export function validateOrderCreation(input: CreateOrderInput): ValidationResult {
  const errors: string[] = [];
  const todayIST = getISTDateString();

  // 1. Canteen active & open check
  if (!input.canteen.is_active) {
    errors.push('Selected canteen is not currently active.');
  }
  if (!input.canteen.is_open) {
    errors.push(`Canteen "${input.canteen.name}" is currently closed.`);
  }

  // 2. Faculty eligibility check
  if (input.canteen.canteen_type === 'faculty_only' && input.user.role_id !== 'faculty' && input.user.role_id !== 'admin') {
    errors.push('The Faculty Canteen is strictly restricted to Faculty members.');
  }

  // 3. Items validation & revalidation
  if (!input.items || input.items.length === 0) {
    errors.push('Order must contain at least one item.');
  }

  const itemsMap = new Map<string, MenuItem>();
  for (const item of input.availableMenuItems) {
    itemsMap.set(item.menu_item_id, item);
  }

  const validatedItems: OrderItemSnapshot[] = [];
  let calculatedSubtotal = 0;

  for (const requestedItem of input.items || []) {
    if (requestedItem.quantity <= 0) {
      errors.push(`Invalid quantity for item ${requestedItem.menu_item_id}`);
      continue;
    }

    const menuItem = itemsMap.get(requestedItem.menu_item_id);
    if (!menuItem) {
      errors.push(`Menu item "${requestedItem.menu_item_id}" was not found.`);
      continue;
    }

    if (menuItem.canteen_id !== input.canteen.canteen_id) {
      errors.push(`Item "${menuItem.item_name}" belongs to a different canteen.`);
      continue;
    }

    if (!menuItem.is_active) {
      errors.push(`Item "${menuItem.item_name}" is no longer active.`);
      continue;
    }

    if (!menuItem.is_available) {
      errors.push(`Item "${menuItem.item_name}" is currently SOLD OUT.`);
      continue;
    }

    const itemSubtotal = menuItem.price * requestedItem.quantity;
    calculatedSubtotal += itemSubtotal;

    validatedItems.push({
      menu_item_id: menuItem.menu_item_id,
      item_name: menuItem.item_name,
      price: menuItem.price,
      quantity: requestedItem.quantity,
      subtotal: itemSubtotal,
      is_veg: menuItem.is_veg,
      placeholder_key: menuItem.placeholder_key || 'samosa',
    });
  }

  // 4. Same-Day Preorder Validation
  if (input.order_type === 'preorder') {
    if (!input.pickup_time || input.pickup_time.trim() === '') {
      errors.push('A valid same-day pickup time must be selected for preorders.');
    }

    // Must be same-day only (no scheduling for future dates)
    if (input.pickup_date && input.pickup_date !== todayIST) {
      errors.push(`Preorders are allowed for today (${todayIST}) only. Future date scheduling is disabled.`);
    }

    // Must accept policy
    if (!input.policy_accepted) {
      errors.push('You must explicitly accept the Preorder Policy before placing a preorder.');
    }
  }

  // 5. Payment method assignment
  const initialPaymentStatus: PaymentStatus = 
    input.payment_method === 'cash' ? 'CASH_PENDING' : 'PAID_ONLINE_DEMO';

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  const initialStatus: OrderStatus = 
    input.canteen.acceptance_mode === 'automatic' ? 'preparing' : 'awaiting_acceptance';

  return {
    isValid: true,
    errors: [],
    validatedItems,
    subtotal: calculatedSubtotal,
    total: calculatedSubtotal,
    initialStatus,
    initialPaymentStatus,
    pickupDate: todayIST,
  };
}

export function isValidStatusTransition(
  currentStatus: OrderStatus,
  nextStatus: OrderStatus,
  actorRole: string,
  paymentStatus?: PaymentStatus
): { isValid: boolean; error?: string } {
  if (currentStatus === nextStatus) {
    return { isValid: false, error: `Order is already in state "${currentStatus}".` };
  }

  switch (currentStatus) {
    case 'awaiting_acceptance':
      if (nextStatus === 'preparing') {
        if (actorRole !== 'operator' && actorRole !== 'admin') {
          return { isValid: false, error: 'Only canteen operators or admins can accept orders.' };
        }
        return { isValid: true };
      }
      if (nextStatus === 'declined') {
        if (actorRole !== 'operator' && actorRole !== 'admin') {
          return { isValid: false, error: 'Only canteen operators or admins can decline orders.' };
        }
        return { isValid: true };
      }
      if (nextStatus === 'cancelled') {
        // Allowed: student can cancel before preparation begins
        return { isValid: true };
      }
      return { isValid: false, error: `Cannot transition from "${currentStatus}" to "${nextStatus}".` };

    case 'preparing':
      if (nextStatus === 'ready_for_pickup') {
        if (actorRole !== 'operator' && actorRole !== 'admin') {
          return { isValid: false, error: 'Only canteen operators or admins can mark orders ready.' };
        }
        // Strict cash check: if cash is pending, ready is blocked!
        if (paymentStatus === 'CASH_PENDING') {
          return { 
            isValid: false, 
            error: 'Cannot mark order Ready: Cash payment is pending. Please mark cash received first.' 
          };
        }
        return { isValid: true };
      }
      if (nextStatus === 'cancelled') {
        return { 
          isValid: false, 
          error: 'Cancellation policy violation: Students cannot cancel orders after preparation has begun.' 
        };
      }
      return { isValid: false, error: `Cannot transition from "preparing" to "${nextStatus}". Next step must be Ready.` };

    case 'ready_for_pickup':
      if (nextStatus === 'picked_up') {
        if (actorRole !== 'operator' && actorRole !== 'admin') {
          return { isValid: false, error: 'Only canteen operators or admins can mark orders collected.' };
        }
        return { isValid: true };
      }
      if (nextStatus === 'not_collected') {
        // 12-minute timer expiration
        return { isValid: true };
      }
      if (nextStatus === 'cancelled') {
        return { isValid: false, error: 'Order is ready for pickup and cannot be cancelled by student.' };
      }
      return { isValid: false, error: `Cannot transition from "ready_for_pickup" to "${nextStatus}".` };

    case 'not_collected':
      if (nextStatus === 'cancelled') {
        return { isValid: true }; // Final cancellation after 12-min expiration
      }
      return { isValid: false, error: 'Expired uncollected order cannot be revived.' };

    case 'picked_up':
    case 'declined':
    case 'cancelled':
      return { isValid: false, error: `Order is finalized as "${currentStatus}" and cannot be modified.` };

    default:
      return { isValid: false, error: `Unknown status "${currentStatus}".` };
  }
}
