/**
 * firestore.types.ts — Firestore Internal Types
 *
 * [D24] These types must NOT be exported outside src/shared/infra/firestore/.
 *       Feature slices use IFirestoreRepo / FirestoreDoc from '@/shared/ports'.
 */

import type {
  DocumentData,
  QuerySnapshot,
  DocumentSnapshot,
  CollectionReference,
  DocumentReference,
  Timestamp,
} from 'firebase/firestore';

/** Re-alias Firebase Firestore SDK types for internal use only. */
export type {
  DocumentData,
  QuerySnapshot,
  DocumentSnapshot,
  CollectionReference,
  DocumentReference,
  Timestamp,
};

/** Standard Firestore document with timestamps. */
export interface FirestoreTimestampedDoc {
  readonly createdAt?: Timestamp;
  readonly updatedAt?: Timestamp;
}

/** Version-tracked Firestore projection document [S2]. */
export interface VersionedProjectionDoc extends FirestoreTimestampedDoc {
  /** [S2] Used by applyFirestoreVersionGuard to reject stale events. */
  readonly lastProcessedVersion: number;
  /** [R8] TraceId carried through from the originating EventEnvelope. */
  readonly traceId?: string;
}
