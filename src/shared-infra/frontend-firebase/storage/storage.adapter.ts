/**
 * Module: storage.adapter.ts
 * Purpose: Implement IFileStore using Firebase Web Storage SDK
 * Responsibilities: upload, resolve URL, and delete files through Storage APIs
 * Constraints: deterministic logic, respect module boundaries
 */

import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';

import type { IFileStore, UploadOptions } from '@/shared-kernel/ports';

import { storage } from './storage.client';

class FirebaseFileStore implements IFileStore {
  async upload(path: string, file: File | Blob, options?: UploadOptions): Promise<string> {
    const targetRef = ref(storage, path);
    await uploadBytes(targetRef, file, options?.contentType ? { contentType: options.contentType } : undefined);
    return getDownloadURL(targetRef);
  }

  async getDownloadURL(path: string): Promise<string> {
    return getDownloadURL(ref(storage, path));
  }

  async deleteFile(path: string): Promise<void> {
    await deleteObject(ref(storage, path));
  }
}

export const fileStore: IFileStore = new FirebaseFileStore();
