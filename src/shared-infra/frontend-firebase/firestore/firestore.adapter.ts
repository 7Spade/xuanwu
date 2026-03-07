/**
 * Module: firestore.adapter.ts
 * Purpose: Implement IFirestoreRepo using Firebase Web Firestore SDK
 * Responsibilities: map generic repository operations to Firestore document APIs
 * Constraints: deterministic logic, respect module boundaries
 */

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  setDoc,
} from 'firebase/firestore';

import type { FirestoreDoc, IFirestoreRepo, WriteOptions } from '@/shared-kernel/ports';

import { db } from './firestore.client';

class FirebaseFirestoreRepo implements IFirestoreRepo {
  async getDoc<T>(collectionPath: string, docId: string): Promise<FirestoreDoc<T> | null> {
    const snap = await getDoc(doc(db, collectionPath, docId));
    if (!snap.exists()) {
      return null;
    }
    return {
      id: snap.id,
      data: snap.data() as T,
    };
  }

  async getDocs<T>(collectionPath: string): Promise<FirestoreDoc<T>[]> {
    const snap = await getDocs(collection(db, collectionPath));
    return snap.docs.map((item) => ({
      id: item.id,
      data: item.data() as T,
    }));
  }

  async setDoc<T>(collectionPath: string, docId: string, data: T, opts?: WriteOptions): Promise<void> {
    await setDoc(doc(db, collectionPath, docId), data as Record<string, unknown>, {
      merge: opts?.merge ?? false,
    });
  }

  async deleteDoc(collectionPath: string, docId: string): Promise<void> {
    await deleteDoc(doc(db, collectionPath, docId));
  }

  onSnapshot<T>(
    collectionPath: string,
    callback: (docs: FirestoreDoc<T>[]) => void,
  ): () => void {
    return onSnapshot(collection(db, collectionPath), (snap) => {
      callback(
        snap.docs.map((item) => ({
          id: item.id,
          data: item.data() as T,
        })),
      );
    });
  }
}

export const firestoreRepo: IFirestoreRepo = new FirebaseFirestoreRepo();
