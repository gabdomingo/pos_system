import { Platform } from 'react-native';

const HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || `http://${HOST}:5000`;
