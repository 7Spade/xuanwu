/**
 * shared.kernel/infrastructure-ports — SK_PORTS [D24]
 *
 * VS0 Shared Kernel: Dependency-inversion port interfaces for all infrastructure adapters.
 *
 * Per logic-overview.md [D24]:
 *   Feature slices MUST depend on these Port interfaces, NOT on firebase/* directly.
 *   Each Port is backed by an Adapter in src/shared/infra/:
 *
 *   IAuthService   → auth.adapter.ts      → firebase/auth       (VS1 primary consumer)
 *   IFirestoreRepo → firestore.facade.ts  → firebase/firestore  (VS8 primary; [S2] guard)
 *   IMessaging     → messaging.adapter.ts → firebase/messaging  (VS7 primary; [R8] traceId)
 *   IFileStore     → storage.facade.ts    → firebase/storage    (VS5 primary)
 *
 * [D25] When adding a new Firebase feature:
 *   1. Add a Port interface here.
 *   2. Add an Adapter implementation in src/shared/infra/.
 *   3. Register the Adapter in the composition root.
 *
 * [R8] IMessaging.send() carries traceId from EventEnvelope — do NOT regenerate it.
 * [S2] IFirestoreRepo.setDoc() supports aggregateVersion for SK_VERSION_GUARD.
 *
 * These interfaces are re-exported from @/shared/ports to maintain a single
 * canonical definition while making them accessible via the shared.kernel import path.
 * Dependency flows: shared → features (one-way); shared.kernel acts as the re-export
 * façade so feature slices never need to import from @/shared/ports directly.
 */

// Re-export all Port interfaces from the canonical @/shared/ports location.
// The actual interface definitions live in src/shared/ports/ to avoid circular imports
// (shared → features is a one-way dependency; features/shared.kernel re-exports).
export type {
  IAuthService,
  AuthUser,
} from '@/shared/ports';

export type {
  IFirestoreRepo,
  FirestoreDoc,
  WriteOptions,
} from '@/shared/ports';

export type {
  IMessaging,
  PushNotificationPayload,
} from '@/shared/ports';

export type {
  IFileStore,
  UploadOptions,
} from '@/shared/ports';
