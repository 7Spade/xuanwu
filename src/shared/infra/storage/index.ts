/**
 * src/shared/infra/storage/index.ts
 *
 * [D24] Only exports the IFileStore Port interface + adapter implementation.
 *       Firebase SDK types must NOT be re-exported from this boundary.
 * [D25] StorageAdapter is the sole IFileStore implementation — the L7 FIREBASE_ACL
 *       boundary for firebase/storage.
 */

export type { IFileStore, UploadOptions } from '@/shared/ports/i-file-store';
export { StorageAdapter, storageAdapter } from './storage.adapter';
