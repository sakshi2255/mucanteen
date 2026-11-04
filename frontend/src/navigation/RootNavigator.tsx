import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { 
  Utensils, 
  Store, 
  ShoppingBag, 
  Clock, 
  User, 
  ListOrdered, 
  UtensilsCrossed, 
  CheckCircle2, 
  FileText, 
  LayoutDashboard 
} from 'lucide-react-native';

import { colors, typography } from '../config/theme';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

// Auth Screens
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';

// Student Screens
import { StudentHomeScreen } from '../screens/student/StudentHomeScreen';
import { CanteenDirectoryScreen } from '../screens/student/CanteenDirectoryScreen';
import { CanteenMenuScreen } from '../screens/student/CanteenMenuScreen';
import { CartScreen } from '../screens/student/CartScreen';
import { PreorderPolicyScreen } from '../screens/student/PreorderPolicyScreen';
import { OrderTrackingScreen } from '../screens/student/OrderTrackingScreen';
import { OrderHistoryScreen } from '../screens/student/OrderHistoryScreen';
import { ProfileScreen } from '../screens/student/ProfileScreen';

// Operator Screens
import { OperatorDashboardScreen } from '../screens/operator/OperatorDashboardScreen';
import { OperatorQueueScreen } from '../screens/operator/OperatorQueueScreen';
import { MenuManagementScreen } from '../screens/operator/MenuManagementScreen';
import { PickupVerificationScreen } from '../screens/operator/PickupVerificationScreen';
import { OperatorReportsScreen } from '../screens/operator/OperatorReportsScreen';

// Admin Screens
import { AdminDashboardScreen } from '../screens/admin/AdminDashboardScreen';
import { UserManagementScreen } from '../screens/admin/UserManagementScreen';
import { CanteenManagementScreen } from '../screens/admin/CanteenManagementScreen';
import { AdminOrdersScreen } from '../screens/admin/AdminOrdersScreen';
import { AuditLogsScreen } from '../screens/admin/AuditLogsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Student Tab Navigator
function StudentTabs() {
  const { itemCount } = useCart();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.borderLight,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="StudentHome"
        component={StudentHomeScreen}
        options={{
          tabBarLabel: 'Food',
          tabBarIcon: ({ color, size }) => <Utensils size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="CanteenDirectory"
        component={CanteenDirectoryScreen}
        options={{
          tabBarLabel: 'Canteens',
          tabBarIcon: ({ color, size }) => <Store size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          tabBarLabel: 'Cart',
          tabBarBadge: itemCount > 0 ? itemCount : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.primary, fontSize: 10 },
          tabBarIcon: ({ color, size }) => <ShoppingBag size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="OrderHistory"
        component={OrderHistoryScreen}
        options={{
          tabBarLabel: 'Orders',
          tabBarIcon: ({ color, size }) => <Clock size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

// Operator Tab Navigator
function OperatorTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.borderLight,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="OperatorDashboard"
        component={OperatorDashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="OperatorQueue"
        component={OperatorQueueScreen}
        options={{
          tabBarLabel: 'Queue',
          tabBarIcon: ({ color, size }) => <ListOrdered size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="MenuManagement"
        component={MenuManagementScreen}
        options={{
          tabBarLabel: 'Menu',
          tabBarIcon: ({ color, size }) => <UtensilsCrossed size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="PickupVerification"
        component={PickupVerificationScreen}
        options={{
          tabBarLabel: 'Verification',
          tabBarIcon: ({ color, size }) => <CheckCircle2 size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

// Admin Tab Navigator
function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.borderLight,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="AdminDashboard"
        component={AdminDashboardScreen}
        options={{
          tabBarLabel: 'Overview',
          tabBarIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="AdminOrders"
        component={AdminOrdersScreen}
        options={{
          tabBarLabel: 'All Orders',
          tabBarIcon: ({ color, size }) => <ListOrdered size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="CanteenManagement"
        component={CanteenManagementScreen}
        options={{
          tabBarLabel: 'Canteens',
          tabBarIcon: ({ color, size }) => <Store size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="AuditLogs"
        component={AuditLogsScreen}
        options={{
          tabBarLabel: 'Audit Logs',
          tabBarIcon: ({ color, size }) => <FileText size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const { user, role } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          // Auth Stack
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : role === 'operator' ? (
          // Operator Stack
          <>
            <Stack.Screen name="OperatorRoot" component={OperatorTabs} />
            <Stack.Screen name="OperatorReports" component={OperatorReportsScreen} />
          </>
        ) : role === 'admin' ? (
          // Administrator Stack
          <>
            <Stack.Screen name="AdminRoot" component={AdminTabs} />
            <Stack.Screen name="UserManagement" component={UserManagementScreen} />
            <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} />
          </>
        ) : (
          // Student & Faculty Stack
          <>
            <Stack.Screen name="StudentRoot" component={StudentTabs} />
            <Stack.Screen name="CanteenMenu" component={CanteenMenuScreen} />
            <Stack.Screen name="PreorderPolicy" component={PreorderPolicyScreen} />
            <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

