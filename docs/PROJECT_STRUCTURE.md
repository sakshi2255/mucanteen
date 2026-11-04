# Complete Project File Structure

```text
MU-Canteen/
│
├── frontend/
│   ├── assets/                             # App icons, splash screens, & adaptive icons
│   │   ├── icon.png
│   │   ├── splash-icon.png
│   │   └── android-icon-foreground.png
│   ├── src/
│   │   ├── config/
│   │   │   ├── theme.ts                    # MU brand theme, Teal #079FA7, typography, elevation
│   │   │   └── firebaseConfig.ts           # Firebase client initialization (mu-canteen-b895a)
│   │   ├── models/
│   │   │   └── types.ts                    # TypeScript data contracts & models
│   │   ├── services/
│   │   │   ├── tokenService.ts             # Asia/Kolkata date and token helpers
│   │   │   ├── seedData.ts                 # Default campus canteens, categories & demo accounts
│   │   │   └── firestoreService.ts         # Real-time multi-device listeners & CRUD operations
│   │   ├── context/
│   │   │   ├── AuthContext.tsx             # Authentication, session, & demo role switcher
│   │   │   └── CartContext.tsx             # Single-canteen cart enforcement, modes & totals
│   │   ├── components/
│   │   │   └── common/
│   │   │       ├── Header.tsx              # MU Canteen header with campus context & role badge
│   │   │       ├── FilterChips.tsx         # Pure Veg toggle, Available Now, building & price filters
│   │   │       ├── FoodCard.tsx            # 2-column food card with placeholder & ADD buttons
│   │   │       ├── FoodImagePlaceholder.tsx# High-resolution vector food placeholder with veg indicators
│   │   │       ├── CanteenCard.tsx         # Compact canteen card with floor, hours, & eligibility
│   │   │       ├── FloatingCategoryModal.tsx# Bottom-sheet category modal matching Swiggy reference
│   │   │       ├── OrderCardCompact.tsx    # Compact horizontal order card with state action buttons
│   │   │       ├── StatusBadge.tsx         # Visual status pill (In Queue, Preparing, Ready, Collected)
│   │   │       └── DashboardNavCard.tsx    # Portal-inspired navigation cards
│   │   ├── screens/
│   │   │   ├── auth/
│   │   │   │   ├── LoginScreen.tsx         # Email/password login with 1-tap demo role selector
│   │   │   │   └── RegisterScreen.tsx      # Student & Faculty registration form
│   │   │   ├── student/
│   │   │   │   ├── StudentHomeScreen.tsx   # Food discovery home page
│   │   │   │   ├── CanteenDirectoryScreen.tsx # 10 campus dining locations
│   │   │   │   ├── CanteenMenuScreen.tsx   # Specific canteen menu with single-canteen cart
│   │   │   │   ├── CartScreen.tsx          # Order mode toggle, slots, & checkout
│   │   │   │   ├── PreorderPolicyScreen.tsx# Safe-area scrollable agreement screen
│   │   │   │   ├── OrderTrackingScreen.tsx # Live progress timeline with prominent daily token #
│   │   │   │   ├── OrderHistoryScreen.tsx  # Private personal order history
│   │   │   │   └── ProfileScreen.tsx       # User profile & instant role switch
│   │   │   ├── operator/
│   │   │   │   ├── OperatorDashboardScreen.tsx # Canteen status toggle, auto-mode & live counts
│   │   │   │   ├── OperatorQueueScreen.tsx     # Real-time multi-device queue with state buttons
│   │   │   │   ├── MenuManagementScreen.tsx    # Available vs Sold Out instant toggling
│   │   │   │   ├── PickupVerificationScreen.tsx# Daily token number lookup and confirmation
│   │   │   │   └── OperatorReportsScreen.tsx   # Fulfilled orders and revenue report
│   │   │   └── admin/
│   │   │       ├── AdminDashboardScreen.tsx    # Campus overview & facility status
│   │   │       ├── UserManagementScreen.tsx    # Campus user list by role
│   │   │       ├── CanteenManagementScreen.tsx # Facility hours & status controls
│   │   │       ├── AdminOrdersScreen.tsx       # Live multi-canteen order feed
│   │   │       └── AuditLogsScreen.tsx         # Immutable security & operational audit trail
│   │   └── navigation/
│   │       └── RootNavigator.tsx           # Multi-role navigation tree (Student, Operator, Admin)
│   ├── tests/
│   │   └── clientSuite.test.ts             # Client verification test suite
│   ├── App.tsx                             # Application entrypoint
│   ├── app.json                            # Expo & Android package configuration
│   ├── google-services.json                # Firebase Android configuration file
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── models/
│   │   │   └── types.ts                    # Backend data interfaces
│   │   ├── services/
│   │   │   ├── tokenService.ts             # Asia/Kolkata atomic daily token allocator
│   │   │   ├── orderService.ts             # Order validation & state machine rules
│   │   │   └── auditService.ts             # Append-only audit log payloads
│   │   ├── scripts/
│   │   │   └── seedData.ts                 # Campus canteens & realistic menu seed data
│   │   └── index.ts                        # Cloud Functions callable entrypoints
│   ├── tests/
│   │   ├── tokenService.test.ts            # Token reset & lifetime count tests
│   │   ├── orderService.test.ts            # State transitions & faculty eligibility tests
│   │   ├── multiDeviceQueue.test.ts        # Multi-client queue & privacy simulation tests
│   │   └── runAllTests.ts                  # Master backend test runner
│   ├── dist/                               # Compiled Cloud Functions JavaScript
│   ├── firestore.rules                     # RBAC & privacy security rules
│   ├── firestore.indexes.json              # Query performance indexes
│   ├── firebase.json                       # Firebase deployment configuration
│   └── package.json
│
└── docs/
    ├── README.md
    ├── ARCHITECTURE.md
    ├── DATABASE_DESIGN.md
    ├── FIREBASE_SETUP.md
    ├── FIRESTORE_SECURITY.md
    ├── ORDER_WORKFLOW.md
    ├── PROJECT_STRUCTURE.md
    ├── ANDROID_BUILD.md
    └── DEMO_INSTRUCTIONS.md
```

