/**
 * src/shared/infra/firestore/index.ts
 *
 * [D24] Only exports the IFirestoreRepo Port interface.
 *       Firebase SDK types must NOT be re-exported from this boundary.
 * [S2]  All Projection writes must pass through applyVersionGuard before calling IFirestoreRepo.
 */

export type { IFirestoreRepo, FirestoreDoc, WriteOptions } from '@/shared/ports/i-firestore.repo';
