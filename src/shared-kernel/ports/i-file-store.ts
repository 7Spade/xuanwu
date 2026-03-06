/**
 * Module: i-file-store.ts
 * Purpose: define SK_PORTS file storage interface in shared-kernel
 * Responsibilities: abstract file upload, retrieval, and deletion operations
 * Constraints: deterministic logic, respect module boundaries
 */

export interface UploadOptions {
  readonly contentType?: string;
}

export interface IFileStore {
  upload(path: string, file: File | Blob, options?: UploadOptions): Promise<string>;
  getDownloadURL(path: string): Promise<string>;
  deleteFile(path: string): Promise<void>;
}
