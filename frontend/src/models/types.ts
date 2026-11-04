export type UserRole = 'student' | 'faculty' | 'operator' | 'admin';

export interface UserProfile {
  user_id: string;
  name: string;
  enrollment_number: string;
  email: string;
  role_id: UserRole;
  role: 'Student' | 'Faculty' | 'Canteen Operator' | 'College Administrator';
  account_status: 'active' | 'suspended';
  is_deleted: boolean;
  assigned_canteen_ids: string[];
  favourite_canteen_ids?: string[];
  created_at: string;
  updated_at: string;
}

export type CanteenType = 
  | 'common'
  | 'faculty_only'
  | 'stationery_canteen'
  | 'law_canteen'
  | 'hostel_mess';

export type AcceptanceMode = 'manual' | 'automatic';

export interface Canteen {
  canteen_id: string;
  name: string;
  building_id: string;
  floor: number;
  token_prefix: string; // e.g. 'A', 'B', 'C'
  canteen_type: CanteenType;
  operator_ids: string[];
  email: string;
  phone: string;
  is_open: boolean;
  acceptance_mode: AcceptanceMode;
  operating_hours: string;
  summary?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MenuCategory {
  menu_category_id: string;
  category_name: string;
  description: string;
  sort_order: number;
  is_active: boolean;
}

export interface MenuItem {
  menu_item_id: string;
  menu_category_id: string;
  item_name: string;
  description: string;
  canteen_id: string;
  price: number;
  is_veg: boolean;
  is_popular?: boolean;
  is_recommended?: boolean;
  placeholder_key: string;
  image_url: string | null;
  is_available: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrderItemSnapshot {
  menu_item_id: string;
  item_name: string;
  price: number;
  quantity: number;
  subtotal: number;
  is_veg: boolean;
  placeholder_key: string;
}

export type OrderType = 'instant' | 'preorder';

export type PaymentMethod = 'online_demo' | 'cash';

export type PaymentStatus = 'PAID_ONLINE_DEMO' | 'CASH_PENDING' | 'CASH_RECEIVED';

export type OrderStatus = 
  | 'awaiting_acceptance' // student sees "In Queue"
  | 'preparing'           // student sees "Preparing"
  | 'ready_for_pickup'    // student sees "Ready for Pickup"
  | 'picked_up'           // student sees "Collected"
  | 'not_collected'       // 12-minute timer expired
  | 'declined'            // operator declined
  | 'cancelled';          // student cancelled before preparing

export interface Order {
  order_id: string;
  token_display: string;         // e.g. 'A1', 'B2', 'C3'
  daily_token_number: number;    // 1, 2, 3...
  token_prefix: string;          // 'A', 'B', 'C'
  token_date: string;            // YYYY-MM-DD
  canteen_id: string;
  canteen_name_snapshot: string;
  user_id: string;
  user_name_snapshot: string;
  user_role_snapshot: UserRole;
  order_type: OrderType;
  items_snapshot: OrderItemSnapshot[];
  subtotal: number;
  total: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  pickup_time: string;           // 'Immediate' or custom e.g. '01:30 PM'
  pickup_date: string;           // Same-day YYYY-MM-DD
  policy_version: string;
  policy_accepted_at: string | null;
  ready_at: string | null;
  collection_deadline: string | null; // ready_at + 12 minutes
  collected_time: string | null;
  collected_status: 'pending' | 'verified' | 'expired';
  cash_received_at: string | null;
  created_at: string;
  updated_at: string;
  idempotency_key: string;
}

export interface Promotion {
  promotion_id: string;
  title: string;
  subtitle: string;
  tag: string;
  discount_code: string;
  discount_percent: number;
  image_key: string;
  is_active: boolean;
}

export interface CartItem {
  item: MenuItem;
  quantity: number;
}

export interface AuditLog {
  audit_log_id: string;
  actor_id: string;
  actor_name_snapshot: string;
  actor_role: string;
  action: string;
  entity_type: string;
  entity_id: string;
  canteen_id: string | null;
  description: string;
  before_data: Record<string, unknown> | null;
  after_data: Record<string, unknown> | null;
  timestamp: string;
  source: 'client' | 'function' | 'system';
}
