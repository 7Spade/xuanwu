/**
 * Module: _funnel.shared
 * Purpose: Projection funnel shared helpers
 * Responsibilities: execute aggregate write ops, update projection version timestamps
 * Constraints: deterministic logic, respect module boundaries
 */

import { arrayUnion, updateDocument } from '@/shared/infra/firestore/firestore.write.adapter';

/** Execute a WriteOp returned by an aggregate function. [D3] */
export async function executeAggregateWriteOp(op: {
  path: string;
  data: Record<string, unknown>;
  arrayUnionFields?: Record<string, string[]>;
}): Promise<void> {
  const data: Record<string, unknown> = { ...op.data };
  for (const [field, values] of Object.entries(op.arrayUnionFields ?? {})) {
    data[field] = arrayUnion(...values);
  }
  await updateDocument(op.path, data);
}

export function createVersionStamp(): { version: number; updatedAt: string } {
  return { version: Date.now(), updatedAt: new Date().toISOString() };
}
