/**
 * storage.types.ts — Firebase Storage Internal Types
 *
 * [D24] These types must NOT be exported outside src/shared/infra/storage/.
 *       Feature slices use IFileStore / UploadOptions from '@/shared/ports'.
 */

import type {
  StorageReference,
  UploadMetadata,
  UploadResult,
} from 'firebase/storage';

/** Re-alias Firebase Storage SDK types for internal use only. */
export type { StorageReference, UploadMetadata, UploadResult };

/** Internal upload task result. */
export interface UploadTaskResult {
  readonly downloadURL: string;
  readonly storagePath: string;
}
