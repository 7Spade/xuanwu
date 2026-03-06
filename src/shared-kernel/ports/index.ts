/**
 * Module: index.ts
 * Purpose: provide flattened SK_PORTS public exports
 * Responsibilities: aggregate canonical infrastructure port interfaces
 * Constraints: deterministic logic, respect module boundaries
 */

export type { IAuthService, AuthUser } from './i-auth.service';
export type {
  IFirestoreRepo,
  FirestoreDoc,
  Timestamp,
  WriteOptions,
} from './i-firestore.repo';
export type { IMessaging, PushNotificationPayload } from './i-messaging';
export type { IFileStore, UploadOptions } from './i-file-store';
