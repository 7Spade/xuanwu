/**
 * Module: messaging.adapter.ts
 * Purpose: Implement IMessaging in frontend boundary with safe constraints
 * Responsibilities: provide token retrieval and foreground message subscription
 * Constraints: deterministic logic, respect module boundaries
 */

import { getToken as getMessagingToken, onMessage } from 'firebase/messaging';

import type { IMessaging, PushNotificationPayload } from '@/shared-kernel/ports';

import { messaging } from './messaging.client';

class FrontendMessagingAdapter implements IMessaging {
  async send(
    _fcmToken: string,
    _payload: PushNotificationPayload,
    _traceId: string,
  ): Promise<void> {
    throw new Error('FRONTEND_MESSAGING_SEND_NOT_SUPPORTED');
  }

  async getToken(): Promise<string | null> {
    if (!messaging) {
      return null;
    }

    const vapidKey = process.env.NEXT_PUBLIC_VAPID_KEY;
    if (!vapidKey) {
      return null;
    }

    try {
      return await getMessagingToken(messaging, { vapidKey });
    } catch {
      return null;
    }
  }

  onForegroundMessage(callback: (payload: PushNotificationPayload) => void): () => void {
    if (!messaging) {
      return () => {};
    }

    return onMessage(messaging, (payload) => {
      callback({
        title: payload.notification?.title ?? '',
        body: payload.notification?.body ?? '',
        data: payload.data,
      });
    });
  }
}

export const messagingAdapter: IMessaging = new FrontendMessagingAdapter();
