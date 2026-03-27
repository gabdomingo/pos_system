import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { formatNumber } from '../utils/format';
import { useResponsiveLayout } from '../utils/responsive';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ProductsScreen from '../screens/ProductsScreen';
import CartScreen from '../screens/CartScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import AdminProductsScreen from '../screens/AdminProductsScreen';
import AdminSalesScreen from '../screens/AdminSalesScreen';
import AdminStaffScreen from '../screens/AdminStaffScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function getTabScreenOptions(labelPosition) {
  return ({ route }) => ({
    headerTitleAlign: 'center',
    headerTintColor: '#173B73',
    tabBarActiveTintColor: '#2457A6',
    tabBarInactiveTintColor: '#667085',
    tabBarLabelPosition: labelPosition,
    tabBarStyle: {
      height: labelPosition === 'beside-icon' ? 68 : 62,
      paddingHorizontal: labelPosition === 'beside-icon' ? 12 : 0,
      paddingBottom: 8,
      paddingTop: 8,
      backgroundColor: '#FFFFFF',
      borderTopColor: '#DDE4EF'
    },
    tabBarItemStyle: labelPosition === 'beside-icon'
      ? {
          borderRadius: 14,
          marginHorizontal: 4
        }
      : undefined,
    tabBarIcon: ({ color, size }) => {
      const iconByRoute = route.name === 'Dashboard'
        ? 'view-dashboard-outline'
        : route.name === 'Products'
          ? 'package-variant-closed'
          : route.name === 'Sales'
            ? 'chart-line'
            : route.name === 'Staff'
              ? 'account-multiple-outline'
            : route.name === 'Shop'
              ? 'shopping-outline'
              : route.name === 'Cart'
                ? 'cart-outline'
                : route.name === 'Profile'
                  ? 'account-circle-outline'
                  : 'circle-outline';
      return <MaterialCommunityIcons name={iconByRoute} color={color} size={size} />;
    }
  });
}

function buildTabScreenOptions(labelPosition) {
  return ({ route }) => ({
    ...getTabScreenOptions(labelPosition)({ route })
  });
}

function AuthStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Create Account' }} />
    </Stack.Navigator>
  );
}

function ShopTabs() {
  const { totalItems } = useCart();
  const { tabLabelPosition } = useResponsiveLayout();
  return (
    <Tab.Navigator
      screenOptions={buildTabScreenOptions(tabLabelPosition)}
    >
      <Tab.Screen name="Shop" component={ProductsScreen} />
      <Tab.Screen name="Cart" component={CartScreen} options={{ tabBarBadge: totalItems > 0 ? formatNumber(totalItems, { maximumFractionDigits: 0 }) : undefined }} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AdminTabs() {
  const { tabLabelPosition } = useResponsiveLayout();
  return (
    <Tab.Navigator
      screenOptions={buildTabScreenOptions(tabLabelPosition)}
    >
      <Tab.Screen name="Dashboard" component={AdminDashboardScreen} />
      <Tab.Screen name="Products" component={AdminProductsScreen} />
      <Tab.Screen name="Sales" component={AdminSalesScreen} />
      <Tab.Screen name="Staff" component={AdminStaffScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function CashierTabs() {
  const { totalItems } = useCart();
  const { tabLabelPosition } = useResponsiveLayout();
  return (
    <Tab.Navigator
      screenOptions={buildTabScreenOptions(tabLabelPosition)}
    >
      <Tab.Screen name="Shop" component={ProductsScreen} options={{ title: 'Counter Products', tabBarLabel: 'Counter' }} />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          title: 'Process Payment',
          tabBarLabel: 'Payment',
          tabBarBadge: totalItems > 0 ? formatNumber(totalItems, { maximumFractionDigits: 0 }) : undefined
        }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, hydrating } = useAuth();

  if (hydrating) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!user) return <AuthStack />;

  if (user.role === 'admin') return <AdminTabs />;
  if (user.role === 'cashier') return <CashierTabs />;
  return <ShopTabs />;
}

const styles = StyleSheet.create({
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  }
});
