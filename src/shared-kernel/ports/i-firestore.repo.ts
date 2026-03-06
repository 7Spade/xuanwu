/**
 * Module: i-firestore.repo.ts
 * Purpose: define SK_PORTS Firestore repository interface in shared-kernel
 * Responsibilities: provide SDK-agnostic document read/write and subscription contracts
 * Constraints: deterministic logic, respect module boundaries
 */

export interface Timestamp {
  readonly seconds: number;
  readonly nanoseconds: number;
  toDate(): Date;
  toMillis(): number;
}

export interface FirestoreDoc<T = Record<string, unknown>> {
  readonly id: string;
  readonly data: T;
}

export interface WriteOptions {
  readonly aggregateVersion?: number;
  readonly merge?: boolean;
}

export interface IFirestoreRepo {
  getDoc<T>(collectionPath: string, docId: string): Promise<FirestoreDoc<T> | null>;
  getDocs<T>(collectionPath: string): Promise<FirestoreDoc<T>[]>;
  setDoc<T>(collectionPath: string, docId: string, data: T, opts?: WriteOptions): Promise<void>;
  deleteDoc(collectionPath: string, docId: string): Promise<void>;
  onSnapshot<T>(
    collectionPath: string,
    callback: (docs: FirestoreDoc<T>[]) => void,
  ): () => void;
}
