# Firebase Project Configuration & Setup

**Project Name:** MU Canteen  
**Project ID:** `mu-canteen-b895a`  
**Firestore Database:** `(default)`  
**Authentication Provider:** Email/Password (Already Enabled)

---

## 1. Firebase Project Credentials

The project is pre-configured with the official university project keys extracted from `google-services.json`:

```json
{
  "projectId": "mu-canteen-b895a",
  "projectNumber": "231604059707",
  "storageBucket": "mu-canteen-b895a.firebasestorage.app",
  "authDomain": "mu-canteen-b895a.firebaseapp.com",
  "appId": "1:231604059707:android:cabf8e38c301d1a3fc261e",
  "androidPackage": "com.marwadiuniversity.mucanteen"
}
```

---

## 2. Safe Deployment Procedures

To preserve existing remote data, authentication accounts, and configurations, never execute destructive scripts or overwrite production without testing.

### Step 2.1: Login to Firebase CLI
```bash
npx firebase login
```

### Step 2.2: Set Target Project
```bash
npx firebase use mu-canteen-b895a
```

### Step 2.3: Deploy Firestore Security Rules & Indexes
```bash
cd backend
npx firebase deploy --only firestore:rules,firestore:indexes
```

### Step 2.4: Deploy Cloud Functions
```bash
cd backend
npm run build
npx firebase deploy --only functions
```

---

## 3. Database Seeding Script

To safely seed initial campus canteens, categories, and menu items to Firestore without wiping existing test users:

```bash
cd backend
npm run seed
```

This verifies whether documents exist prior to writing and inserts default data idempotently.

