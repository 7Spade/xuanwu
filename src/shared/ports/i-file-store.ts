/**
 * i-file-store.ts — IFileStore Port Interface
 *
 * [D24] Feature slices depend on this interface, NOT on firebase/storage directly.
 * [D25] New storage features must implement this Port in storage.facade.ts.
 *
 * VS5 workspace-business.files is the primary consumer.
 */

export interface UploadOptions {
  readonly contentType?: string;
}

export interface IFileStore {
  /**
   * Upload a file to the given storage path.
   * @returns The public download URL of the uploaded file.
   */
  upload(path: string, file: File | Blob, options?: UploadOptions): Promise<string>;

  /**
   * Get the public download URL for a file at the given storage path.
   */
  getDownloadURL(path: string): Promise<string>;

  /**
   * Delete a file at the given storage path.
   */
  deleteFile(path: string): Promise<void>;
}
