'use client';

/**
 * notification-hub.slice/user.notification — _hooks/use-user-notifications.ts
 *
 * React hook that subscribes to a user's personal notification stream.
 * Delegates Firestore subscription to createNotificationListener per [D3].
 * Implements optimistic UI for mark-as-read operations per [D15].
 */

import { useState, useEffect, useCallback } from 'react';

import type { HubNotification } from '@/features/notification-hub.slice/_contract';
import { createNotificationListener } from '@/features/notification-hub.slice/_services/notification-listener';
import { markNotificationRead } from '../_queries';

export function useUserNotifications(accountId: string | undefined, maxCount = 20) {
  const [notifications, setNotifications] = useState<HubNotification[]>([]);

  useEffect(() => {
    if (!accountId) return;

    const cleanup = createNotificationListener(accountId, setNotifications, maxCount);
    return cleanup;
  }, [accountId, maxCount]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  /**
   * Optimistic mark-as-read: immediately removes unread dot in the UI,
   * then persists to Firestore (eventual consistency [D15]).
   */
  const markRead = useCallback(
    async (notificationId: string) => {
      if (!accountId) return;
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      await markNotificationRead(accountId, notificationId);
    },
    [accountId]
  );

  /**
   * Optimistic mark-all-as-read: reflects immediately in UI,
   * then flushes each unread item to Firestore in parallel.
   * Uses functional state update to avoid stale notifications closure.
   */
  const markAllRead = useCallback(async () => {
    if (!accountId) return;
    let unread: HubNotification[] = [];
    setNotifications((prev) => {
      unread = prev.filter((n) => !n.read);
      return prev.map((n) => ({ ...n, read: true }));
    });
    await Promise.all(unread.map((n) => markNotificationRead(accountId, n.id)));
  }, [accountId]);

  return { notifications, unreadCount, markRead, markAllRead };
}
