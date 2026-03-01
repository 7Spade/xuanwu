/**
 * i-messaging.ts — IMessaging Port Interface
 *
 * [D24] Feature slices depend on this interface, NOT on firebase/messaging directly.
 * [D25] New messaging features must implement this Port in messaging.adapter.ts.
 * [R8]  traceId from EventEnvelope must be forwarded into FCM metadata.
 *        Adapters must NOT generate new traceIds here.
 *
 * VS7 account-user.notification is the primary consumer.
 */

export interface PushNotificationPayload {
  readonly title: string;
  readonly body: string;
  readonly data?: Record<string, string>;
}

export interface IMessaging {
  /**
   * Send a push notification to a device token.
   * [R8] traceId is forwarded into FCM message metadata unchanged.
   */
  send(
    fcmToken: string,
    payload: PushNotificationPayload,
    traceId: string
  ): Promise<void>;

  /** Obtain the current FCM registration token for this device. */
  getToken(): Promise<string | null>;

  /** Subscribe to foreground messages. Returns unsubscribe function. */
  onForegroundMessage(
    callback: (payload: PushNotificationPayload) => void
  ): () => void;
}
