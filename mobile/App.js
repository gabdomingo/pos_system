import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer, DefaultTheme as NavigationDefaultTheme } from '@react-navigation/native';
import { MD3LightTheme, Provider as PaperProvider } from 'react-native-paper';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';

const paperTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#0057D9',
    secondary: '#2E7D32',
    tertiary: '#6A1B9A',
    background: '#F4F6FA',
    surface: '#FFFFFF'
  }
};

const navTheme = {
  ...NavigationDefaultTheme,
  colors: {
    ...NavigationDefaultTheme.colors,
    background: paperTheme.colors.background,
    card: paperTheme.colors.surface,
    primary: paperTheme.colors.primary,
    text: '#101828'
  }
};

export default function App() {
  return (
    <PaperProvider theme={paperTheme}>
      <AuthProvider>
        <CartProvider>
          <NavigationContainer theme={navTheme}>
            <AppNavigator />
          </NavigationContainer>
        </CartProvider>
      </AuthProvider>
    </PaperProvider>
  );
}
