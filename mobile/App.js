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
    primary: '#2457A6',
    onPrimary: '#FFFFFF',
    primaryContainer: '#E7EEFB',
    onPrimaryContainer: '#173B73',
    secondary: '#5A6B85',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#E8EDF5',
    onSecondaryContainer: '#22324A',
    tertiary: '#4D7B72',
    onTertiary: '#FFFFFF',
    tertiaryContainer: '#E4F1EE',
    onTertiaryContainer: '#163C35',
    background: '#F4F6FA',
    surface: '#FFFFFF',
    surfaceVariant: '#EDF2F7',
    onSurface: '#132033',
    onSurfaceVariant: '#5A6578',
    outline: '#D4DCE8',
    outlineVariant: '#E1E8F1'
  }
};

const navTheme = {
  ...NavigationDefaultTheme,
  colors: {
    ...NavigationDefaultTheme.colors,
    background: paperTheme.colors.background,
    card: paperTheme.colors.surface,
    primary: paperTheme.colors.primary,
    text: paperTheme.colors.onSurface
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
