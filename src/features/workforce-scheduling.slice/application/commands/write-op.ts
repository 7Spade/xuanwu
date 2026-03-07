/**
 * workforce-scheduling.slice ??_write-op.ts
 *
 * Shared WriteOp executor. [D3]
 *
 * Single implementation used by both _actions.ts (Server Actions) and
 * _saga.ts (saga coordinator). Eliminates the previously duplicated inline
 * `executeWriteOp` function that existed in both files.
 *
 * [D3] All Firestore writes must flow through WriteOp objects returned by
 *       the aggregate ??never written from components directly.
 */

import { executeWriteOpThroughGateway } from '@/shared-infra/gateway-command';

import type { WriteOp } from './_aggregate';

/**
 * Executes a WriteOp returned by an aggregate function. [D3]
 *
 * Resolves `arrayUnionFields` entries into Firestore `arrayUnion` FieldValue
 * sentinels before writing. All other fields in `op.data` are written as-is.
 */
export async function executeWriteOp(op: WriteOp): Promise<void> {
  await executeWriteOpThroughGateway(op);
}
