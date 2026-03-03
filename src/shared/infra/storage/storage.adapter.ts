/**
 * storage.adapter.ts — StorageAdapter
 *
 * [D24] Sole legitimate firebase/storage call site (all SDK calls are confined to
 *       storage.write.adapter.ts and storage.read.adapter.ts; this class orchestrates
 *       through those modules and never imports firebase/storage directly).
 * [D25] Implements IFileStore Port so feature slices never import firebase/storage directly.
 *
 * Architecture ref: FIREBASE_ACL → STORE_ADP (logic-overview.md)
 *   STORE_ADP = Storage Adapter — implements IFileStore, handles path resolution and URL
 *   signing. All firebase/storage SDK calls are confined to the write/read adapter modules.
 *
 * Consumers (VS5 workspace-business.files) inject IFileStore; they never reference
 * firebase/storage types directly (D24).
 */

import type { IFileStore, UploadOptions } from '@/shared/ports/i-file-store';

import { getFileDownloadURL } from './storage.read.adapter';
import { deleteFile, uploadFile } from './storage.write.adapter';

/**
 * Adapter that implements the IFileStore port using Firebase Storage SDK calls.
 *
 * All firebase/storage SDK calls are confined to the write/read adapter modules;
 * this class only orchestrates and satisfies the IFileStore contract.
 */
export class StorageAdapter implements IFileStore {
  /**
   * Upload a file to the given storage path.
   * @returns The public download URL of the uploaded file.
   */
  async upload(path: string, file: File | Blob, options?: UploadOptions): Promise<string> {
    await uploadFile(
      path,
      file,
      options?.contentType ? { contentType: options.contentType } : undefined
    );
    return getFileDownloadURL(path);
  }

  /**
   * Get the public download URL for a file at the given storage path.
   */
  async getDownloadURL(path: string): Promise<string> {
    return getFileDownloadURL(path);
  }

  /**
   * Delete a file at the given storage path.
   */
  async deleteFile(path: string): Promise<void> {
    return deleteFile(path);
  }
}

/**
 * Singleton adapter instance for injection into VS5 workspace-business.files.
 * Feature slices depend on IFileStore (the port), not on this concrete class.
 */
export const storageAdapter: IFileStore = new StorageAdapter();
