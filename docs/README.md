# MU Canteen — Marwadi University Food Ordering System

**Institution:** Marwadi University, Rajkot  
**Academic Program:** Final-Year B.Tech Computer Engineering Project  
**Review Stage:** Review 1 Implementation  
**Platform:** Android-first mobile application (React Native + Expo)  
**Backend:** Google Cloud Firebase (Cloud Firestore, Authentication, Cloud Functions)

---

## 1. Executive Summary

MU Canteen is a campus-wide centralized canteen ordering application designed for Marwadi University students, faculty, canteen operators, and administrators. It connects campus dining points across the Main Academic Building (Floors 1–6), Law Building, and Hostel Mess into a unified, real-time food discovery and ordering ecosystem.

The system supports two core ordering modes:
1. **Instant Order**: Fast order placement during breaks.
2. **Scheduled Same-Day Preorder**: Reserved ordering with mandatory 6-point policy acceptance.

Both ordering modes utilize a **daily prefixed numeric token allocation system** (e.g. `A1`, `B2`, `C3`) that resets each day at midnight in `Asia/Kolkata` timezone and synchronizes across all campus devices via Cloud Firestore.

---

## 2. Key Review 1 Features

- **Mobile-First Android Application**: React Native with Expo, strict TypeScript, and React Navigation.
- **Refined Playful MU Palette**: Teal (`#079FA7`), Deep Teal (`#087B82`), Accent Orange (`#FF9B54`), Accent Yellow (`#FFD166`), Soft Background (`#F6F8FA`), and Charcoal (`#252B32`).
- **Student & Faculty Home Screen**: Faithfully implements the hand-drawn layout:
  - Top Navigation Bar (MU logo left; Heart/Favourites, Cart with badge, Profile right).
  - Horizontal Promotional & Discount Offers Banner (`Today's Discounts & Offers`).
  - Building & Category Filter Tabs (`All`, `Main Building`, `Law Building`, `Hostel Mess`, `Favourites`).
  - 2-Column Canteen Grid (`C1`, `C2`, `C3`, `C4`...) navigating directly to each canteen's menu.
- **Swiggy-Inspired Canteen Menu**:
  - Horizontal **"Want to repeat?"** Past Orders carousel with working single-tap **Reorder** action.
  - Top Picks & Recommended Food list.
  - Floating bottom-sheet category selector with item counts.
  - Single-canteen cart restriction to prevent cross-canteen ordering errors.
- **Flexible Payment Modes**:
  - **Online (Demo)**: Instant token confirmation with simulated Review 1 checkout (`PAID_ONLINE_DEMO`).
  - **Cash at Counter**: Order placed with `CASH_PENDING`. Operator collects physical cash and clicks `Mark Cash Received` -> status becomes `CASH_RECEIVED`. Only then can the operator mark the order `Ready for Pickup`!
- **12-Minute Pickup Countdown Timer**:
  - Starts the moment food is marked `Ready for Pickup`.
  - Live countdown on both Student tracking and Operator queue screens.
  - Automatically transitions uncollected food to `not_collected` / expired.
- **Strict Cancellation Policy**:
  - Students can cancel if and only if the order is still "In Queue" (`awaiting_acceptance`).
  - Once kitchen preparation begins (`preparing`), cancellations are strictly rejected.
- **Immutable Audit Logging**:
  - All critical mutations written to `/auditLogs` in Firestore and visible on the Administrator screen.
- **Multi-Device Shared Queue**:
  - Orders placed from any student's phone instantly appear on the operator's screen.
  - Student private history query protects student privacy.

---

## 3. Directory Layout

The workspace root contains strictly the three required folders:

```text
MU-Canteen/
│
├── frontend/    # React Native / Expo Android application
├── backend/     # Firebase Cloud Functions, rules, indexes, & seed scripts
└── docs/        # Complete architectural & operational documentation
```

---

## 4. How to Run the Application

### 4.1 Running on Physical Android Device via USB Debugging
1. Enable **Developer Options** and **USB Debugging** on your Android smartphone.
2. Connect your phone to your PC via a USB data cable and tap "Allow USB Debugging" on your phone.
3. Start Expo with localhost forwarding:
```powershell
cd Frontend
npx expo start --localhost
```
4. Press `a` in the terminal to automatically launch on your connected Android phone via ADB.

### 4.2 Running in the Web Browser
```powershell
cd Frontend
npx expo start --web
```
Press `w` in the terminal to open the application at `http://localhost:8081`.

### 4.3 Running Automated Tests
```powershell
# Run Backend Tests (20 tests: tokens, state machine, multi-device queue)
cd backend
npm test

# Run Frontend Tests (5 test suites)
cd Frontend
npm test

# Verify TypeScript Cleanliness
cd Frontend
npx tsc --noEmit
```

---

## 5. Review Documentation Index

1. [README.md](./README.md) — System overview, deliverables, and quick start commands.
2. [ARCHITECTURE.md](./ARCHITECTURE.md) — MVC design, real-time sync, and system layers.
3. [DATABASE_DESIGN.md](./DATABASE_DESIGN.md) — Firestore collections, indexes, and document schemas.
4. [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) — Configuration guide for project `mu-canteen-b895a`.
5. [FIRESTORE_SECURITY.md](./FIRESTORE_SECURITY.md) — Role-based security rules and append-only audit enforcement.
6. [ORDER_WORKFLOW.md](./ORDER_WORKFLOW.md) — Order state transitions and operator lifecycle.
7. [TOKEN_SYSTEM.md](./TOKEN_SYSTEM.md) — Prefixed numeric token allocation (`A1`, `B2`), daily reset, and concurrency safety.
8. [AUDIT_LOGGING.md](./AUDIT_LOGGING.md) — Immutable append-only audit logging in `/auditLogs`.
9. [TESTING.md](./TESTING.md) — Automated test suite execution, coverage matrix, and manual verification scripts.
10. [ANDROID_BUILD.md](./ANDROID_BUILD.md) — Android APK compilation and Hermes export workflow.
11. [DEMO_INSTRUCTIONS.md](./DEMO_INSTRUCTIONS.md) — Step-by-step evaluator script for Review 1.
