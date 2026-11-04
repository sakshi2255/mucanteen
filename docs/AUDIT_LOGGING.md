# MU Canteen — Immutable Audit Logging System

## 1. Overview & Purpose

The MU Canteen audit logging architecture guarantees end-to-end operational accountability across Marwadi University's multiple campus canteens.

Every state change — including order placement, status transitions, cash payments, menu availability changes, and administrative updates — is recorded as an **immutable, append-only document** in Cloud Firestore under the `/auditLogs` collection.

---

## 2. Audit Log Schema (`/auditLogs/{audit_log_id}`)

| Field | Type | Description | Example |
|---|---|---|---|
| `audit_log_id` | string | Unique document identifier | `log_1793731800_x9a2b` |
| `actor_id` | string | Firebase UID or internal system identifier | `student_101` |
| `actor_name_snapshot` | string | Display name of the user who performed the action | `Aarav Patel` |
| `actor_role` | string | Role at time of action (`student`, `faculty`, `operator`, `admin`, `system`) | `student` |
| `action` | string | Standardized uppercase action verb | `ORDER_CREATED`, `ORDER_STATUS_PREPARING` |
| `entity_type` | string | Subject entity category (`order`, `menuItem`, `canteen`, `category`, `user`) | `order` |
| `entity_id` | string | Target entity identifier | `ord_1793731200_k9` |
| `canteen_id` | string \| null | Associated canteen ID | `canteen_main_1` |
| `description` | string | Human-readable explanation of the event | `Order A1 placed at Main Building Canteen 1 (instant, PAID_ONLINE_DEMO)` |
| `before_data` | map \| null | State snapshot prior to mutation | `{"status": "awaiting_acceptance"}` |
| `after_data` | map \| null | State snapshot after mutation | `{"status": "preparing"}` |
| `timestamp` | string | ISO 8601 UTC timestamp | `2026-11-03T18:20:00.000Z` |
| `source` | string | Originating execution context (`client`, `function`, `system`) | `client` |

---

## 3. Audited Action Events

| Event Code | Trigger Condition | Actor Role |
|---|---|---|
| `ORDER_CREATED` | New order placed by student/faculty | `student` / `faculty` |
| `ORDER_STATUS_PREPARING` | Operator accepts order and begins food preparation | `operator` |
| `ORDER_STATUS_READY_FOR_PICKUP` | Operator marks food ready (starts 12-min countdown) | `operator` |
| `ORDER_STATUS_PICKED_UP` | Operator verifies token and hands over food | `operator` |
| `ORDER_STATUS_DECLINED` | Operator declines order | `operator` |
| `ORDER_STATUS_CANCELLED` | Student cancels while in queue | `student` |
| `ORDER_STATUS_NOT_COLLECTED` | 12-minute window expires without pickup | `system` |
| `PAYMENT_CASH_RECEIVED` | Operator marks cash received for cash order | `operator` |
| `MENU_ITEM_AVAILABLE` | Item marked available by operator/admin | `operator` / `admin` |
| `MENU_ITEM_SOLDOUT` | Item marked sold out by operator/admin | `operator` / `admin` |
| `MENU_ITEM_CREATED` | New item added to canteen menu | `operator` / `admin` |
| `MENU_ITEM_UPDATED` | Existing item price/name edited | `operator` / `admin` |
| `MENU_ITEM_DEACTIVATED` | Item deactivated from menu | `operator` / `admin` |
| `CANTEEN_OPENED` | Canteen opened for business | `admin` |
| `CANTEEN_CLOSED` | Canteen closed | `admin` |

---

## 4. Security & Immutability Rules

The `/auditLogs` collection is protected by Firestore Security Rules:
- **Append-only:** Authenticated users can only **create** audit logs (`allow create: if request.auth != null`).
- **No Updates:** `allow update: if false;` (logs cannot be modified once written).
- **No Deletions:** `allow delete: if false;` (logs cannot be deleted).
- **Restricted Reading:** Only College Administrators (`admin`) can read and query audit logs (`allow read: if isAdmin();`).

