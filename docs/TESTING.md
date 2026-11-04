# MU Canteen — Verification & Testing Suite

## 1. Overview

The MU Canteen codebase features automated testing across frontend models and backend business logic, combined with TypeScript static verification and Android Hermes bytecode compilation.

---

## 2. Automated Test Execution Commands

### 2.1 Backend Test Suite (Node.js & tsx)
Runs 20 automated unit and integration tests verifying token allocation, state machine transitions, role access rules, price calculations, and multi-device order queues:

```powershell
cd backend
npm test
```

Expected result:
```text
🧪 Running Prefixed Daily Token Service Tests...
✅ Prefixed Token Service Tests Passed (6/6)

🧪 Running Order Service & State Machine Tests...
✅ Order Service & State Machine Tests Passed (8/8)

🧪 Running Multi-Device Shared Queue & Student Privacy Tests...
✅ Multi-Device Shared Queue & Student Privacy Tests Passed (7/7)

🎉 ALL 20 BACKEND UNIT & INTEGRATION TESTS PASSED PERFECTLY!
```

---

### 2.2 Backend TypeScript Compilation
Verifies that Cloud Functions, models, services, and scripts compile with zero TypeScript errors:

```powershell
cd backend
npm run build
```

---

### 2.3 Frontend Client Test Suite
Runs tests verifying canteen completeness, single-canteen cart restrictions, prefixed token generation, and catalog structures:

```powershell
cd Frontend
npm test
```

Expected result:
```text
🧪 Running Frontend / Client Verification Suite...
✅ Frontend / Client Verification Suite Passed (5/5 test groups)!
```

---

### 2.4 Frontend TypeScript Verification
Verifies strict type correctness across all React Native components, screens, navigators, and contexts:

```powershell
cd Frontend
npx tsc --noEmit
```

Expected result: Exits with Code 0 and zero errors.

---

### 2.5 Android Production Hermes Bytecode Build
Verifies that Metro can resolve, bundle, and compile all 3,070+ modules into Hermes bytecode:

```powershell
cd Frontend
npx expo export --platform android
```

Expected result:
```text
Android Bundled index.ts (3073 modules)
Exported: dist
```

---

## 3. Test Coverage Matrix

| Area | Component / Service | Verified Criteria |
|---|---|---|
| **Daily Tokens** | `tokenService.ts` | Daily sequence reset at midnight IST (`Asia/Kolkata`), independent counters per canteen, uppercase prefixes (`A1`, `B2`, `C1`), continuous lifetime count. |
| **Faculty Access** | `orderService.ts` | Non-faculty students rejected with friendly error from Faculty Dining Hall (Floor 3); faculty and admin accepted. |
| **Preorder Policy** | `orderService.ts` | Preorders blocked without explicit 6-point policy acceptance; same-day validation strictly enforced. |
| **Inventory** | `orderService.ts` | Sold out items blocked from order creation. |
| **State Machine** | `orderService.ts` | Strict lifecycle transitions: `awaiting_acceptance` -> `preparing` -> `ready_for_pickup` -> `picked_up`. Direct skips blocked. |
| **Cash Payment** | `orderService.ts` | Cash pending status blocks `ready_for_pickup` until operator records cash received. |
| **12-Min Window** | `orderService.ts` | Ready orders automatically expire to `not_collected` if uncollected after 12 minutes. |
| **Single Canteen** | `CartContext.tsx` | Items from multiple canteens cannot be mixed in the cart. Prompts user to clear or switch. |
| **Multi-Device Queue** | `firestoreService.ts` | Orders placed by student A appear instantly in operator queue; student B's private history isolates only student B's orders. |
| **Audit Logs** | `auditService.ts` | Immutable append-only log generated for every state mutation with actor role, entity ID, and canteen ID. |

---

## 4. Manual Verification Flow (Review 1 Demo)

1. **Student Ordering (Device 1):**
   - Log in as `student@marwadiuniversity.ac.in` / `Student@123`.
   - Browse Home Page: see promotional banners and 2-column canteen grid (`C1`, `C2`, `C3`, `C4`).
   - Tap Canteen 1 (`A`), add Samosa + Chai.
   - Choose `Instant Order` + `Online (Demo)` or `Cash at Counter`.
   - Place Order: receive prefixed token `A1`.

2. **Operator Live Queue (Device 2 / Browser):**
   - Log in as `operator1@marwadiuniversity.ac.in` / `Operator@123`.
   - Open Queue tab: see Order `A1` appear in real time.
   - Click `Accept (Start Prep)` -> status moves to `Preparing`.
   - If cash order: click `Mark Cash Received` -> status becomes `CASH_RECEIVED`.
   - Click `Mark Ready for Pickup` -> 12-minute countdown timer begins!
   - Verify token with customer and click `Verify & Handover` -> status completes to `Picked Up`.

3. **Admin Oversight:**
   - Log in as `admin@marwadiuniversity.ac.in` / `Admin@123`.
   - View overview dashboard, manage canteens, and review live `/auditLogs`.

