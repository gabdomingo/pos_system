import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { formatNumber } from '../utils/format';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ProductsScreen from '../screens/ProductsScreen';
import CartScreen from '../screens/CartScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import AdminProductsScreen from '../screens/AdminProductsScreen';
import AdminSalesScreen from '../screens/AdminSalesScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

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
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerTitleAlign: 'center',
        tabBarActiveTintColor: '#0057D9',
        tabBarIcon: ({ color, size }) => {
          const iconByRoute = {
            Shop: 'shopping-outline',
            Cart: 'cart-outline',
            Profile: 'account-circle-outline'
          };
          return <MaterialCommunityIcons name={iconByRoute[route.name] || 'circle-outline'} color={color} size={size} />;
        }
      })}
    >
      <Tab.Screen name="Shop" component={ProductsScreen} />
      <Tab.Screen name="Cart" component={CartScreen} options={{ tabBarBadge: totalItems > 0 ? formatNumber(totalItems, { maximumFractionDigits: 0 }) : undefined }} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerTitleAlign: 'center',
        tabBarActiveTintColor: '#0057D9',
        tabBarIcon: ({ color, size }) => {
          const iconByRoute = {
            Dashboard: 'view-dashboard-outline',
            Products: 'package-variant-closed',
            Sales: 'chart-line',
            Profile: 'account-cog-outline'
          };
          return <MaterialCommunityIcons name={iconByRoute[route.name] || 'circle-outline'} color={color} size={size} />;
        }
      })}
    >
      <Tab.Screen name="Dashboard" component={AdminDashboardScreen} />
      <Tab.Screen name="Products" component={AdminProductsScreen} />
      <Tab.Screen name="Sales" component={AdminSalesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function CashierTabs() {
  const { totalItems } = useCart();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerTitleAlign: 'center',
        tabBarActiveTintColor: '#0057D9',
        tabBarIcon: ({ color, size }) => {
          const iconByRoute = {
            Shop: 'shopping-outline',
            Cart: 'cart-outline',
            Products: 'package-variant-closed',
            Profile: 'account-cog-outline'
          };
          return <MaterialCommunityIcons name={iconByRoute[route.name] || 'circle-outline'} color={color} size={size} />;
        }
      })}
    >
      <Tab.Screen name="Shop" component={ProductsScreen} />
      <Tab.Screen name="Cart" component={CartScreen} options={{ tabBarBadge: totalItems > 0 ? formatNumber(totalItems, { maximumFractionDigits: 0 }) : undefined }} />
      <Tab.Screen name="Products" component={AdminProductsScreen} options={{ title: 'Manage Products' }} />
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
