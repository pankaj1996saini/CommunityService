import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { notificationApi } from '../api';
import { useAuth } from './AuthContext';

const POLL_MS = 20000;
const NotificationContext = createContext(null);

// Local notifications only make sense on a device, not in the browser.
const canNotify = Platform.OS !== 'web';

if (canNotify) {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
  } catch {
    // some Expo Go versions complain here, the in-app bell still works without it
  }
}

async function setupDevice() {
  if (!canNotify) return;
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Complaint updates',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
    const current = await Notifications.getPermissionsAsync();
    if (!current.granted) await Notifications.requestPermissionsAsync();
  } catch {
    // permission prompt failed or isn't supported, nothing to do
  }
}

async function showLocal(title, body) {
  if (!canNotify) return;
  try {
    await Notifications.scheduleNotificationAsync({ content: { title, body }, trigger: null });
  } catch {
    // ignore, the in-app list is the source of truth anyway
  }
}

// There's no push server in this project, so we poll the API every few seconds
// and pop a local notification for anything new that we haven't shown yet.
export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const userId = user ? user._id : null;

  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const shownIds = useRef(null); // null until the first fetch, so old ones don't all fire at once

  const refresh = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await notificationApi.list();
      if (shownIds.current === null) {
        shownIds.current = new Set(data.items.map((n) => n._id));
      } else {
        data.items
          .filter((n) => !n.read && !shownIds.current.has(n._id))
          .reverse()
          .forEach((n) => {
            shownIds.current.add(n._id);
            showLocal(n.title, n.message);
          });
      }
      setItems(data.items);
      setUnread(data.unread);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, [userId]);

  useEffect(() => {
    shownIds.current = null;
    setItems([]);
    setUnread(0);
    setError(null);
    if (!userId) return undefined;

    setLoading(true);
    refresh().finally(() => setLoading(false));
    setupDevice();

    const timer = setInterval(refresh, POLL_MS);
    return () => clearInterval(timer);
  }, [userId, refresh]);

  const markRead = useCallback(async (id) => {
    setItems((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
    setUnread((u) => Math.max(0, u - 1));
    try {
      await notificationApi.markRead(id);
    } catch {
      refresh();
    }
  }, [refresh]);

  const markAllRead = useCallback(async () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
    try {
      await notificationApi.markAllRead();
    } catch {
      refresh();
    }
  }, [refresh]);

  const value = useMemo(
    () => ({ items, unread, loading, error, refresh, markRead, markAllRead }),
    [items, unread, loading, error, refresh, markRead, markAllRead]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export const useNotifications = () => useContext(NotificationContext);
