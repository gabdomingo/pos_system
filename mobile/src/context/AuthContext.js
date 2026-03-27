import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login, register, requestPasswordReset, resetPassword } from '../api/client';

const STORAGE_KEY = '@pos_mobile_auth';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [hydrating, setHydrating] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          setToken(parsed.token || null);
          setUser(parsed.user || null);
        }
      } catch (e) {
        // ignore bad storage payload
      } finally {
        setHydrating(false);
      }
    })();
  }, []);

  async function persist(nextToken, nextUser) {
    setToken(nextToken);
    setUser(nextUser);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ token: nextToken, user: nextUser }));
  }

  async function signIn(payload) {
    const data = await login(payload);
    await persist(data.token, data.user);
    return data.user;
  }

  async function signUp(payload) {
    const data = await register(payload);
    await persist(data.token, data.user);
    return data.user;
  }

  async function signOut() {
    setToken(null);
    setUser(null);
    await AsyncStorage.removeItem(STORAGE_KEY);
  }

  async function startPasswordReset(email) {
    return requestPasswordReset({ email });
  }

  async function completePasswordReset(payload) {
    return resetPassword(payload);
  }

  const value = useMemo(
    () => ({ token, user, hydrating, signIn, signUp, signOut, startPasswordReset, completePasswordReset }),
    [token, user, hydrating]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
