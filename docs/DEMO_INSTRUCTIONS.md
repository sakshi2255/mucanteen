# Review 1 Evaluator Demo Instructions

**Project:** MU Canteen  
**Demonstration Scope:** Review 1 Academic Evaluation  
**Audience:** Faculty Project Reviewers & Evaluators

---

## 1. Fast Role Switching for Evaluators

To test all four user personas without logging out and re-entering credentials repeatedly, the application provides a **1-Tap Role Switcher**:
1. Open the application. On the **Login Screen**, a prominent banner labeled `QUICK REVIEW LOGIN (1-TAP)` is available:
   - **Student (Aarav Patel)**: Demonstrates the student food ordering experience.
   - **Faculty (Prof. Rajesh)**: Demonstrates access to the exclusive Main Building Floor 3 Faculty Canteen.
   - **Operator (F1 Canteen)**: Demonstrates the real-time kitchen queue and menu toggling.
   - **Admin (Campus Director)**: Demonstrates campus-wide oversight and audit logs.
2. At any point while using the app, go to **Profile** tab to switch roles dynamically.

---

## 2. Test Script 1: Instant Order Placement & Daily Token Allocation

1. **Sign In as Student (Aarav Patel)**.
2. On the **Food Home Screen**, notice:
   - MU Teal branding (`#079FA7`).
   - Pure Veg filter toggle and Available Now filter.
   - Horizontal category bar (Quick Bites, South Indian, Thali, etc.).
   - Tap the floating circular **MENU** button at the bottom-right: notice the sleek dark bottom sheet showing category names and item counts (matching Swiggy reference layout).
3. Tap **ADD** on `Aloo Samosa (2 Pcs)` and `Masala Chai`.
4. Notice the **Sticky Cart Bar** appears at the bottom with item count and total.
5. Tap **VIEW CART**.
6. Select **Instant Order**.
7. Tap **Place Order**.
8. **Result**:
   - Order is created and assigned a numeric token (e.g. **#1** or **#2**).
   - The student is transitioned to the **Order Tracking Screen** with a prominent token badge and live progress indicator showing `In Queue`.

---

## 3. Test Script 2: Multi-Device Shared Queue & Operator State Machine

1. Switch role to **Canteen Operator (F1 Canteen)**.
2. On the **Operator Dashboard**, observe:
   - Serving Status toggle (Open / Closed).
   - In Queue, Preparing, Ready, and Revenue metrics.
3. Tap **Live Order Queue**.
4. In the **Active Queue** tab, the student's order appears instantly:
   - Displays Token `#`, Customer Name, Items ordered, and Total.
   - Notice the two contextual action buttons: `[Decline]` and `[Accept (Start Prep)]`.
5. Tap `[Accept (Start Prep)]`:
   - Order status immediately updates to `Preparing` in Cloud Firestore.
   - Next button changes to `[Mark Ready for Pickup]`.
6. Tap `[Mark Ready for Pickup]`:
   - Order status transitions to `Ready for Pickup`.
   - Next button changes to `[Verify & Mark Collected]`.
7. Switch back to **Student** role and open **Order Tracking**:
   - Student's screen automatically reflects `Ready for Pickup - Proceed to canteen counter` without manual refresh!
8. Return to **Operator**, tap `[Verify & Mark Collected]`:
   - Operator confirms token and marks order as `Picked Up`.
   - Order moves cleanly to the `Completed` tab.

---

## 4. Test Script 3: Preorder with Policy Agreement & Small-Screen Scroll Fix

1. Switch to **Student** role.
2. Open menu, add `Mysore Masala Dosa` or `Deluxe Gujarati Thali`.
3. In cart, switch ordering mode to **Preorder for Break**.
4. Select a campus slot: `12:45 PM (Lunch Break)`.
5. Tap **Review Policy & Checkout**.
6. The **Preorder Policy Screen** opens:
   - Notice smooth, uninterrupted vertical scrolling on small screens.
   - Action buttons (`Decline` and `Accept & Place Order`) remain securely docked at the bottom.
   - The `Accept & Place Order` button is disabled by default.
7. Attempt to tap Accept: disabled.
8. Check the mandatory checkbox: *"I have read, understood, and explicitly agree to the Marwadi University Preorder Policy."*
9. Tap **Accept & Place Order**:
   - Order is recorded with preorder pickup time and policy timestamp.
   - Token is allocated and student transitions to tracking screen.

---

## 5. Test Script 4: Faculty Canteen Eligibility Enforcement

1. Switch role to **Student (Aarav Patel)**.
2. Tap **Canteens** tab.
3. Select **Main Building F3 — Executive Faculty Canteen**.
4. Notice the restriction prompt: access is blocked for non-faculty students.
5. Switch role to **Faculty (Prof. Rajesh)**.
6. Open the Faculty Canteen: access is granted!
7. Faculty menu items (e.g. *Executive Special Thali*, *South Indian Filter Kaapi*) can be added and ordered.

---

## 6. Test Script 5: Operator Menu Availability Toggle

1. In **Operator** console, tap **Menu Availability**.
2. Toggle `Aloo Samosa` to **SOLD OUT**.
3. Switch back to **Student** role:
   - Samosa immediately displays a prominent dark `SOLD OUT` overlay.
   - The `ADD` button is replaced with an `Unavailable` badge, preventing new orders.
4. Toggle back to **AVAILABLE** from operator console: immediately re-enabled.

---

## 7. Test Script 6: Administrator Campus Oversight & Audit Logs

1. Switch role to **Administrator (Campus Director)**.
2. On **Admin Dashboard**, review campus-wide metrics across all 10 dining points.
3. Tap **Campus-Wide Order Monitor**:
   - Observe live real-time orders stream across all canteens with Canteen filter pills.
4. Tap **System Audit Logs**:
   - View immutable, timestamped event log capturing every order creation, state transition (`ORDER_STATUS_PREPARING`, `ORDER_STATUS_READY_FOR_PICKUP`), and menu toggle.
   - Filter logs by Entity: Orders, Menu Items, or Canteens.

