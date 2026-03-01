/**
 * src/shared/infra/storage/index.ts
 *
 * [D24] Only exports the IFileStore Port interface.
 *       Firebase SDK types must NOT be re-exported from this boundary.
 */

export type { IFileStore, UploadOptions } from '@/shared/ports/i-file-store';
