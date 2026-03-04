/**
 * notification-hub.slice/_services/notification-listener.ts
 *
 * Encapsulates real-time Firestore notification listening per [D3].
 * Components MUST NOT call Firestore SDK directly; all subscription
 * management goes through this service layer.
 *
 * Lifecycle:
 *   - Start: call createNotificationListener(accountId, handler)
 *   - Stop:  call the returned cleanup function (on logout / unmount)
 *
 * [D3]  FIREBASE_ACL — SDK access only via service/query modules, never components.
 * [D15] EVENTUAL consistency — notifications are delivered with eventual
 *       consistency; there is no strict ordering guarantee across sessions.
 */

import type { HubNotification, NotificationCategory, NotificationSemanticType } from '../_contract';
import { subscribeToNotifications } from '../user.notification/_queries';

export type NotificationListenerCleanup = () => void;

/**
 * Shape of optional classification fields that Firestore may store
 * on a notification document, used to avoid unsafe casting when mapping
 * raw Notification → HubNotification.
 */
interface RawHubFields {
  category?: NotificationCategory;
  semanticType?: NotificationSemanticType;
}

/**
 * Creates a real-time listener for a user's notifications.
 *
 * Per [D3], this is the only authorized path for setting up Firestore
 * subscriptions within the notification-hub slice. Components invoke
 * this via the `useUserNotifications` hook — never directly.
 *
 * @param accountId   The authenticated user's account ID.
 * @param onUpdate    Callback invoked whenever the notification list changes.
 * @param maxCount    Maximum number of notifications to load (default 20).
 * @returns A cleanup function that tears down the Firestore listener.
 */
export function createNotificationListener(
  accountId: string,
  onUpdate: (notifications: HubNotification[]) => void,
  maxCount = 20
): NotificationListenerCleanup {
  const unsubscribe = subscribeToNotifications(accountId, maxCount, (notifs) => {
    const hubNotifs: HubNotification[] = notifs.map((n) => {
      const raw = n as typeof n & RawHubFields;
      return {
        ...n,
        category: resolveCategory(raw.category, n.type),
        semanticType: resolveSemanticType(raw.semanticType, n.type),
      };
    });
    onUpdate(hubNotifs);
  });

  return unsubscribe;
}

// ─── Private helpers ──────────────────────────────────────────────────────────

function resolveCategory(
  stored: NotificationCategory | undefined,
  type: string
): NotificationCategory {
  if (stored === 'system' || stored === 'task' || stored === 'permission') {
    return stored;
  }
  if (type === 'alert') return 'system';
  if (type === 'success') return 'task';
  return 'system';
}

function resolveSemanticType(
  stored: NotificationSemanticType | undefined,
  type: string
): NotificationSemanticType {
  if (stored === 'ACTION_REQUIRED' || stored === 'INFO_ONLY') return stored;
  return type === 'alert' ? 'ACTION_REQUIRED' : 'INFO_ONLY';
}
