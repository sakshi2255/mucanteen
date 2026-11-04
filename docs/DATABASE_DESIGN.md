# Cloud Firestore Database Design

**Project:** MU Canteen  
**Database Type:** NoSQL Document Store (Cloud Firestore)  
**Instance:** `(default)` in project `mu-canteen-b895a`

---

## 1. Architectural Philosophy

Firestore is a NoSQL document database. It does not employ relational SQL foreign keys, auto-incrementing serial primary keys, or SQL `JOIN` clauses. Referential integrity, snapshot denormalization, and sequential counters are enforced through backend transactions and Cloud Functions.

---

## 2. Collections and Document Schemas

### 2.1 `users`
- **Path:** `/users/{user_id}`
- **Key:** Firebase Auth UID
- **Fields:**
  ```typescript
  {
    user_id: string;              // Auth UID
    name: string;                 // e.g. "Aarav Patel"
    enrollment_number: string;    // e.g. "92100103001" or "FAC-CE-108"
    email: string;                // e.g. "aarav.patel@marwadiuniversity.ac.in"
    role_id: "student" | "faculty" | "operator" | "admin";
    role: string;                 // Display label
    account_status: "active" | "suspended";
    is_deleted: boolean;          // Soft delete flag
    assigned_canteen_ids: string[]; // e.g. ["canteen-mb-f1"] for operators
    created_at: string;           // ISO 8601
    updated_at: string;           // ISO 8601
  }
  ```

### 2.2 `canteens`
- **Path:** `/canteens/{canteen_id}`
- **Key:** Deterministic slug (e.g. `canteen-mb-f1`, `canteen-mb-f3-faculty`)
- **Fields:**
  ```typescript
  {
    canteen_id: string;
    name: string;
    building_id: string;          // "bldg-main" | "bldg-law" | "bldg-hostel"
    floor: number;                // 0 for ground, 1-6 for floors
    canteen_type: "common" | "faculty_only" | "stationery_canteen" | "law_canteen" | "hostel_mess";
    operator_ids: string[];       // Assigned operator UIDs
    email: string;
    phone: string;
    is_open: boolean;             // Live toggle for student orders
    acceptance_mode: "manual" | "automatic";
    operating_hours: string;      // e.g. "08:00 AM - 06:00 PM"
    is_active: boolean;
    created_at: string;
    updated_at: string;
  }
  ```

### 2.3 `menuCategories`
- **Path:** `/menuCategories/{menu_category_id}`
- **Fields:**
  ```typescript
  {
    menu_category_id: string;     // e.g. "cat-quick-bites"
    category_name: string;        // "Quick Bites & Snacks"
    description: string;
    sort_order: number;
    is_active: boolean;
  }
  ```

### 2.4 `menuItems`
- **Path:** `/menuItems/{menu_item_id}`
- **Fields:**
  ```typescript
  {
    menu_item_id: string;         // e.g. "item-samosa-f1"
    menu_category_id: string;     // Reference to menuCategories
    item_name: string;            // e.g. "Aloo Samosa (2 Pcs)"
    description: string;
    canteen_id: string;           // Reference to canteens
    price: number;                // In INR
    is_veg: boolean;              // Pure veg indicator
    is_popular?: boolean;
    is_recommended?: boolean;
    placeholder_key: string;      // e.g. "samosa", "chai", "dosa"
    image_url: string | null;     // Remote URL if available
    is_available: boolean;        // Live operator toggle (Available vs Sold Out)
    is_active: boolean;
    created_at: string;
    updated_at: string;
  }
  ```

### 2.5 `orders`
- **Path:** `/orders/{order_id}`
- **Key:** Firestore generated document ID
- **Fields:**
  ```typescript
  {
    order_id: string;
    daily_token_number: number;   // 1, 2, 3... (resets daily per canteen)
    token_date: string;           // "YYYY-MM-DD" in Asia/Kolkata
    canteen_id: string;
    canteen_name_snapshot: string;// Historical snapshot
    user_id: string;
    user_name_snapshot: string;
    user_role_snapshot: string;
    order_type: "instant" | "preorder";
    items_snapshot: Array<{
      menu_item_id: string;
      item_name: string;
      price: number;
      quantity: number;
      subtotal: number;
      is_veg: boolean;
      placeholder_key: string;
    }>;
    subtotal: number;
    total: number;
    payment_method: "demo_pay" | "pay_at_counter";
    payment_status: "pending" | "completed" | "refunded";
    order_status: "awaiting_acceptance" | "preparing" | "ready_for_pickup" | "picked_up" | "declined" | "cancelled";
    pickup_time: string;          // e.g. "12:45 PM (Lunch Break)" or "Immediate"
    policy_version: string;       // "1.0.0"
    policy_accepted_at: string | null;
    collected_time: string | null;
    collected_status: "pending" | "verified";
    created_at: string;
    updated_at: string;
    idempotency_key: string;
  }
  ```

### 2.6 `orderCounters`
- **Path:** `/orderCounters/{canteen_id}`
- **Key:** `canteen_id`
- **Fields:**
  ```typescript
  {
    canteen_id: string;
    token_date: string;           // "YYYY-MM-DD"
    last_token_number: number;    // Last allocated token for today
    lifetime_order_count: number; // Persistent cumulative count
    updated_at: string;
  }
  ```

### 2.7 `auditLogs`
- **Path:** `/auditLogs/{audit_log_id}`
- **Key:** Append-only unique ID
- **Fields:**
  ```typescript
  {
    audit_log_id: string;
    actor_id: string;
    actor_name_snapshot: string;
    actor_role_snapshot: string;
    action: string;               // e.g. "ORDER_CREATED", "ORDER_STATUS_PREPARING"
    entity_type: string;          // "order" | "canteen" | "menuItem"
    entity_id: string;
    description: string;
    before_data: object | null;
    after_data: object | null;
    timestamp: string;
    source: "client" | "function" | "system";
  }
  ```

---

## 3. Composite Indexes (`firestore.indexes.json`)

To ensure low-latency performance at university break times, the following composite indexes are configured:

1. **`orders`**: `canteen_id` (ASC) + `created_at` (DESC) — Powers the live Operator Queue.
2. **`orders`**: `user_id` (ASC) + `created_at` (DESC) — Powers the student's private Order History.
3. **`orders`**: `canteen_id` (ASC) + `order_status` (ASC) + `created_at` (DESC) — Powers the tabbed operator views.
4. **`menuItems`**: `canteen_id` (ASC) + `is_active` (ASC) + `price` (ASC) — Powers canteen menu filtering.
5. **`auditLogs`**: `entity_type` (ASC) + `timestamp` (DESC) — Powers admin compliance audits.

