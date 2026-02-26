// projection.global-audit-view · queries · logic-overview_v10.md [R8]
// Read-only access to GLOBAL_AUDIT_VIEW. T5-equivalent: consumers MUST NOT write here.

import type { GlobalAuditRecord, GlobalAuditQuery } from './_projector';

/**
 * Returns global audit events, optionally filtered by accountId/workspaceId.
 */
export async function getGlobalAuditEvents(
  query: GlobalAuditQuery = {}
): Promise<GlobalAuditRecord[]> {
  const { getFirestore, collection, getDocs, where, limit, query: firestoreQuery } = await import('firebase/firestore');
  const db = getFirestore();
  const constraints = [];

  if (query.accountId) {
    constraints.push(where('accountId', '==', query.accountId));
  }
  if (query.workspaceId) {
    constraints.push(where('workspaceId', '==', query.workspaceId));
  }
  if (query.limit) {
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
