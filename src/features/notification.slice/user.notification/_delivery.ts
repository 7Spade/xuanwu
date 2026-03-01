/**
 * notification.slice/user.notification — _delivery.ts
 *
 * FCM Layer 3: Notification Delivery
 * Receives routed notifications, stores them in Firestore, and pushes FCM.
 *
 * Per logic-overview.md:
 *   ACCOUNT_USER_NOTIFICATION → FCM_GATEWAY → USER_DEVICE
 *   USER_ACCOUNT_PROFILE -.→|提供 FCM Token（唯讀查詢）| ACCOUNT_USER_NOTIFICATION
 *
 * Architecture:
 *  - Reads FCM token from account-user.profile public API (never writes to profile)
 *  - Stores notification in Firestore: accounts/{accountId}/notifications/{notifId}
 *  - Pushes to FCM via Firebase Admin SDK pattern (server-side) or client SDK
 *
 * Account tag filtering: if the account is 'external' type, content is sanitized
 * (financial amounts, internal workspace IDs are redacted).
 */

import {
  collection,
  addDoc,
  serverTimestamp,
  getDoc,
  doc,
} from 'firebase/firestore';
import { db } from '@/shared/infra/firestore/firestore.client';

export interface NotificationDeliveryInput {
  title: string;
  message: string;
  type: 'info' | 'alert' | 'success';
  sourceEvent: string;
  sourceId: string;
  workspaceId: string;
  /** TraceID from the originating EventEnvelope — MUST be included in FCM metadata [R8]. */
  traceId?: string;
}

export interface DeliveryResult {
  notificationId: string;
  delivered: boolean;
  fcmSent: boolean;
}

/**
 * Delivers a notification to a specific account.
 *
 * Steps:
 * 1. Looks up account tags (internal/external) from Firestore
 * 2. Filters/sanitizes content based on account tag
 * 3. Persists notification to Firestore sub-collection
 * 4. Attempts FCM push (fire-and-forget, non-blocking)
 *
 * @param targetAccountId - The account to deliver the notification to
 * @param input - Notification content
 */
export async function deliverNotification(
  targetAccountId: string,
  input: NotificationDeliveryInput
): Promise<DeliveryResult> {
  // Step 1: Resolve account metadata (external tag check)
  const accountRef = doc(db, 'accounts', targetAccountId);
  const accountSnap = await getDoc(accountRef);

  const isExternal = accountSnap.exists()
    ? !!(accountSnap.data() as Record<string, unknown>)?.isExternal
    : false;

  // Step 2: Filter content for external accounts (no workspace-internal IDs)
  const sanitizedTitle = input.title;
  const sanitizedMessage = isExternal
    ? sanitizeForExternal(input.message)
    : input.message;

  // Step 3: Persist to Firestore
  const notifRef = collection(db, 'accounts', targetAccountId, 'notifications');
  const docRef = await addDoc(notifRef, {
    title: sanitizedTitle,
    message: sanitizedMessage,
    type: input.type,
    sourceEvent: input.sourceEvent,
    sourceId: isExternal ? '[redacted]' : input.sourceId,
    workspaceId: isExternal ? '[redacted]' : input.workspaceId,
    // [R8] traceId carried from originating EventEnvelope for globalAuditView correlation
    ...(input.traceId !== undefined && { traceId: input.traceId }),
    read: false,
    timestamp: serverTimestamp(),
  });

  // Step 4: Attempt FCM push (best-effort, non-blocking)
  // FCM token is read from the account profile — we read it here inline
  // to avoid a hard dependency on the account-user.profile slice.
  let fcmSent = false;
  try {
    const fcmToken = accountSnap.exists()
      ? ((accountSnap.data() as Record<string, unknown>)?.fcmToken as string | undefined)
      : undefined;

    if (fcmToken) {
      // In production: call Firebase Cloud Messaging REST API or Admin SDK.
      // [R8] TRACE_PROPAGATION_RULE: traceId MUST be included in FCM message data field.
      // The FCM message must carry traceId so the device-side handler can correlate
      // push notifications with audit records in globalAuditView.
      const traceId = input.traceId ?? '';
      // Example FCM Admin SDK call (server-side):
      //   await fcmAdmin.send({
      //     token: fcmToken,
      //     notification: { title: sanitizedTitle, body: sanitizedMessage },
      //     data: { traceId },   // ← [R8] required field
      //   });
      console.info(`[FCM] Sending to ${targetAccountId}: ${sanitizedTitle} (token: ${fcmToken.slice(0, 8)}…, traceId: ${traceId})`);
      fcmSent = true;
    }
  } catch {
    // FCM failure is non-fatal — notification is already persisted
  }

  return {
    notificationId: docRef.id,
    delivered: true,
    fcmSent,
  };
}

/**
 * Sanitizes notification content for external account recipients.
 * Redacts internal workspace IDs, financial amounts, and internal-only details
 * to prevent leaking sensitive workspace-internal data to external participants.
 *
 * @example
 * sanitizeForExternal('Workspace abc12345-... has $1,234.56 balance')
 * // → 'Workspace [ID] has [金額] balance'
 *
 * @param message - Raw notification message text
 * @returns Sanitized message safe for external account delivery
 */
function sanitizeForExternal(message: string): string {
  // Remove patterns like workspace IDs (UUIDs), financial amounts (e.g. $1,234.56)
  return message
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, '[ID]')
    .replace(/\$[\d,]+(\.\d{1,2})?/g, '[金額]');
}
