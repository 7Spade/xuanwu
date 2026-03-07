/**
 * projection.account-audit ??_queries.ts
 *
 * Read-side queries for the account audit projection.
 */


import { db } from '@/shared-infra/frontend-firebase';
import { createConverter } from '@/shared-infra/frontend-firebase/firestore/firestore.converter';
import { collection, query, orderBy, limit } from '@/shared-infra/frontend-firebase/firestore/firestore.read.adapter';
import { getDocuments } from '@/shared-infra/frontend-firebase/firestore/firestore.read.adapter';

import type { AuditProjectionEntry } from './_projector';

export async function getAccountAuditEntries(
  accountId: string,
  maxEntries = 50
): Promise<AuditProjectionEntry[]> {
  const converter = createConverter<AuditProjectionEntry>();
  const colRef = collection(
    db,
    `auditProjection/${accountId}/entries`
  ).withConverter(converter);
  const q = query(colRef, orderBy('occurredAt', 'desc'), limit(maxEntries));
  return getDocuments(q);
}
