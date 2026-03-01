/**
 * i-firestore.repo.ts — IFirestoreRepo Port Interface
 *
 * [D24] Feature slices depend on this interface, NOT on firebase/firestore directly.
 * [D25] New Firestore features must implement this Port in firestore.facade.ts.
 * [S2]  aggregateVersion monotonic-increment guard must be applied before every write.
 *
 * VS8 projection.event-funnel is the primary consumer.
 */

/**
 * Structural Firestore Timestamp interface — D24 compliant.
 *
 * Matches the shape of firebase/firestore Timestamp without importing the SDK.
 * Use this type throughout domain types and shared-kernel contracts instead of
 * importing Timestamp directly from firebase/firestore.
 *
 * The concrete firebase Timestamp satisfies this interface at runtime; the
 * FIREBASE_ACL adapters in src/shared/infra/firestore/ hold the only real
 * firebase/* imports per [D24].
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
  /** [S2] Provide incoming event's aggregateVersion; write is rejected if stale. */
  readonly aggregateVersion?: number;
  /** Whether to merge with existing document or overwrite. Default: overwrite. */
  readonly merge?: boolean;
}

export interface IFirestoreRepo {
  /** Read a single document. Returns null if not found. */
  getDoc<T>(collectionPath: string, docId: string): Promise<FirestoreDoc<T> | null>;

  /** Read all documents in a collection (with optional where filter). */
  getDocs<T>(collectionPath: string): Promise<FirestoreDoc<T>[]>;

  /**
   * Write a document.
   * [S2] If aggregateVersion is supplied, applies SK_VERSION_GUARD before writing:
   *   new.aggregateVersion > existing.lastProcessedVersion → write; else discard.
   */
  setDoc<T>(collectionPath: string, docId: string, data: T, opts?: WriteOptions): Promise<void>;

  /** Delete a document. */
  deleteDoc(collectionPath: string, docId: string): Promise<void>;

  /** Subscribe to real-time updates on a collection. Returns unsubscribe function. */
  onSnapshot<T>(
    collectionPath: string,
    callback: (docs: FirestoreDoc<T>[]) => void
  ): () => void;
}
