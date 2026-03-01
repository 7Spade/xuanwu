/**
 * messaging.types.ts — FCM Internal Types
 *
 * [D24] These types must NOT be exported outside src/shared/infra/messaging/.
 *       Feature slices use IMessaging / PushNotificationPayload from '@/shared/ports'.
 * [R8]  traceId must appear in every FCM message metadata object.
 */

/** Raw FCM message payload shape (matches firebase-admin MulticastMessage data field). */
export interface FcmData {
  readonly [key: string]: string;
}

/** Internal FCM message envelope (includes traceId for [R8] compliance). */
export interface FcmMessage {
  readonly token: string;
  readonly notification: {
    readonly title: string;
    readonly body: string;
  };
  /** [R8] traceId forwarded from EventEnvelope. Never regenerated here. */
  readonly data: FcmData & { readonly traceId: string };
}
