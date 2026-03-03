import { updateDocument, arrayUnion } from '@/shared/infra/firestore/firestore.write.adapter';

import type { WriteOp } from './_aggregate';

/**
 * Executes a WriteOp returned by scheduling aggregate functions. [D3]
 */
export async function executeWriteOp(op: WriteOp): Promise<void> {
  const data: Record<string, unknown> = { ...op.data };
  for (const [field, values] of Object.entries(op.arrayUnionFields ?? {})) {
    data[field] = arrayUnion(...values);
  }
  await updateDocument(op.path, data);
}
