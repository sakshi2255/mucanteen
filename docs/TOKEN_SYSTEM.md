# MU Canteen — Prefixed Daily Token System

## 1. Overview & Architecture

The MU Canteen token allocation system solves physical queue crowding and order ambiguity across Marwadi University's multiple dining locations.

Each campus canteen operates with an **independent alphanumeric daily token series**:
- **Main Building Canteen 1 (Floor 1):** Prefix **A** (Tokens: `A1`, `A2`, `A3`...)
- **Main Building Canteen 2 (Floor 2):** Prefix **B** (Tokens: `B1`, `B2`, `B3`...)
- **Law Building Canteen (Floor 1):** Prefix **C** (Tokens: `C1`, `C2`, `C3`...)
- **Faculty Canteen (Floor 3):** Prefix **D** (Tokens: `D1`, `D2`, `D3`...)

---

## 2. Token Lifecycle & Reset Mechanics

1. **Daily Reset at Midnight (Asia/Kolkata):**
   - Every day at `00:00:00 IST`, each canteen's daily token counter automatically resets to **1**.
   - The token date is validated strictly against the `Asia/Kolkata` timezone (e.g. `2026-11-03`).

2. **Continuous Lifetime Order Count:**
   - While the daily token number resets each morning (`last_token_number = 1`), the `lifetime_order_count` monotonically increments without resetting.
   - This provides lifetime business metrics for university administration and auditing.

3. **Concurrency Safety & Atomicity:**
   - Token allocation executes inside a Firestore atomic transaction (`runTransaction`).
   - The document `/orderCounters/{canteen_id}` is locked and updated atomically, ensuring that even under simultaneous order submissions during peak 10:30 AM recess or 12:45 PM lunch rush, **duplicate tokens can never be allocated**.

```text
Student App / Cloud Function
             │
             ▼
  ┌──────────────────────────────────────────────┐
  │         Firestore Atomic Transaction         │
  │                                              │
  │ 1. Read /orderCounters/{canteen_id}          │
  │ 2. Check token_date === todayIST?            │
  │    ├─ YES: nextToken = last_token + 1        │
  │    └─ NO:  nextToken = 1 (Midnight Reset)    │
  │ 3. lifetime_order_count += 1                 │
  │ 4. token_display = `${token_prefix}${token}` │
  │ 5. Save updated counter & order document     │
  └──────────────────────────────────────────────┘
```

---

## 3. Data Model (`/orderCounters/{canteen_id}`)

| Field | Type | Description |
|---|---|---|
| `canteen_id` | string | Unique canteen ID (e.g. `canteen_main_1`) |
| `token_prefix` | string | Assigned uppercase letter prefix (e.g. `A`, `B`, `C`) |
| `token_date` | string | Date in `YYYY-MM-DD` (`Asia/Kolkata`) |
| `last_token_number` | number | Highest daily sequence number allocated today |
| `lifetime_order_count` | number | Monotonically increasing lifetime counter |
| `updated_at` | string | ISO 8601 timestamp of last allocation |

---

## 4. 12-Minute Pickup Window & Expiration

When an operator marks an order as **Ready for Pickup** (`ready_for_pickup`):
1. `ready_at` is set to `nowIso`.
2. `collection_deadline` is set to `now + 12 minutes`.
3. A live countdown timer starts on both the student's order tracking screen and the operator's queue screen.
4. If the student does not collect the meal within 12 minutes:
   - The token status transitions to `not_collected`.
   - The order is marked expired.
   - Hot food abandonment is logged in audit logs to prevent queue congestion.

