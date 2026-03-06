/**
 * Module: i-messaging.ts
 * Purpose: define SK_PORTS messaging interface in shared-kernel
 * Responsibilities: abstract push delivery and foreground subscription contracts
 * Constraints: deterministic logic, respect module boundaries
 */

export interface PushNotificationPayload {
  readonly title: string;
  readonly body: string;
  readonly data?: Record<string, string>;
}

export interface IMessaging {
  send(
    fcmToken: string,
    payload: PushNotificationPayload,
    traceId: string,
  ): Promise<void>;

  getToken(): Promise<string | null>;

  onForegroundMessage(
    callback: (payload: PushNotificationPayload) => void,
  ): () => void;
}
