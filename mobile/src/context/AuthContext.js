import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '../api';
import { setToken, setUnauthorizedHandler } from '../api/client';

const TOKEN_KEY = 'community.token';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true); // true while we check for a saved login

  const logout = useCallback(async () => {
    setToken(null);
    setUser(null);
    await AsyncStorage.removeItem(TOKEN_KEY).catch(() => {});
  }, []);

  // restore the session on app start
  useEffect(() => {
    setUnauthorizedHandler(logout);

    (async () => {
      try {
        const saved = await AsyncStorage.getItem(TOKEN_KEY);
        if (saved) {
          setToken(saved);
          const data = await authApi.me();
          setUser(data.user);
        }
      } catch (err) {
        // bad/expired token: forget it. Network problem: just show the login screen
        // and leave the saved token alone so the next launch can try again.
        setToken(null);
        if (err.status === 401 || err.status === 403) await logout();
      } finally {
        setBooting(false);
      }
    })();
  }, [logout]);

  const startSession = useCallback(async (data) => {
    setToken(data.token);
    await AsyncStorage.setItem(TOKEN_KEY, data.token);
    setUser(data.user);
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await authApi.login(email.trim(), password);
    await startSession(data);
  }, [startSession]);

  const register = useCallback(async (body) => {
    const data = await authApi.register(body);
    await startSession(data);
  }, [startSession]);

  const value = useMemo(
    () => ({ user, booting, login, register, logout, setUser }),
    [user, booting, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
