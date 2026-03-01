/**
 * SK_PORTS — Infrastructure Port Interface unified exports
 *
 * [D24] Feature slices import from '@/shared/ports', NOT from firebase/* directly.
 * [D25] Every new Firebase feature must add a Port here and an Adapter in src/shared/infra/.
 *
 * Port → Adapter → Firebase mapping:
 *   IAuthService   → auth.adapter.ts      → firebase/auth       (VS1)
 *   IFirestoreRepo → firestore.facade.ts  → firebase/firestore  (VS8 [S2])
 *   IMessaging     → messaging.adapter.ts → firebase/messaging  (VS7 [R8])
 *   IFileStore     → storage.facade.ts    → firebase/storage    (VS5)
 */

export type { IAuthService, AuthUser } from './i-auth.service';
export type { IFirestoreRepo, FirestoreDoc, FirestoreTimestamp, WriteOptions } from './i-firestore.repo';
export type { IMessaging, PushNotificationPayload } from './i-messaging';
export type { IFileStore, UploadOptions } from './i-file-store';
