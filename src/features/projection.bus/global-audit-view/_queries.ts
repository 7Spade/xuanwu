// projection.global-audit-view · queries · logic-overview.md [R8]
// Read-only access to GLOBAL_AUDIT_VIEW. T5-equivalent: consumers MUST NOT write here.

import { getDocs, collection, where, limit, query as firestoreQuery } from 'firebase/firestore';
import { db } from '@/shared/infra/firestore/firestore.client';
import type { GlobalAuditRecord, GlobalAuditQuery } from './_projector';

/**
 * Returns global audit events, optionally filtered by accountId/workspaceId.
 */
export async function getGlobalAuditEvents(
  query: GlobalAuditQuery = {}
): Promise<GlobalAuditRecord[]> {
  const constraints = [];

  if (query.accountId != null) {
    constraints.push(where('accountId', '==', query.accountId));
  }
  if (query.workspaceId != null) {
    constraints.push(where('workspaceId', '==', query.workspaceId));
  }
  if (query.limit != null) {
    constraints.push(limit(query.limit));
  }

  const ref = collection(db, 'globalAuditView');
  const snap = await getDocs(firestoreQuery(ref, ...constraints));
  return snap.docs.map(d => d.data() as GlobalAuditRecord);
}

/**
 * Returns global audit events scoped to a specific workspace.
 */
export async function getGlobalAuditEventsByWorkspace(
  workspaceId: string,
  maxResults = 50
): Promise<GlobalAuditRecord[]> {
  return getGlobalAuditEvents({ workspaceId, limit: maxResults });
}
