/**
 * src/shared/infra/messaging/index.ts
 *
 * [D24] Only exports the IMessaging Port interface.
 *       Firebase SDK types must NOT be re-exported from this boundary.
 * [R8]  Implementations must forward envelope.traceId into FCM metadata unchanged.
 */

export type { IMessaging, PushNotificationPayload } from '@/shared/ports/i-messaging';
