import { Platform } from 'react-native';

const FALLBACK_API_BASE_URL = Platform.select({
  android: 'http://10.0.2.2:5001',
  default: 'http://localhost:5001'
});

// Real devices still need EXPO_PUBLIC_API_URL pointed to the Mac's LAN IP.
export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL || FALLBACK_API_BASE_URL).replace(/\/$/, '');

if (__DEV__) {
  console.log('ENV API:', process.env.EXPO_PUBLIC_API_URL);
  console.log('BASE URL:', API_BASE_URL);
}
