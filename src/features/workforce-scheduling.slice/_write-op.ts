/**
 * workforce-scheduling.slice — _write-op.ts
 *
 * Shared WriteOp executor. [D3]
 *
 * Single implementation used by both _actions.ts (Server Actions) and
 * _saga.ts (saga coordinator). Eliminates the previously duplicated inline
 * `executeWriteOp` function that existed in both files.
 *
 * [D3] All Firestore writes must flow through WriteOp objects returned by
 *       the aggregate — never written from components directly.
 */

import { updateDocument, arrayUnion } from '@/shared/infra/firestore/firestore.write.adapter';

import type { WriteOp } from './_aggregate';

/**
 * Executes a WriteOp returned by an aggregate function. [D3]
 *
 * Resolves `arrayUnionFields` entries into Firestore `arrayUnion` FieldValue
 * sentinels before writing. All other fields in `op.data` are written as-is.
 */
export async function executeWriteOp(op: WriteOp): Promise<void> {
  const data: Record<string, unknown> = { ...op.data };
  for (const [field, values] of Object.entries(op.arrayUnionFields ?? {})) {
    data[field] = arrayUnion(...values);
  }
  await updateDocument(op.path, data);
}
