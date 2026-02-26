// projection.global-audit-view · VS8 STANDARD_PROJ_LANE · logic-overview_v10.md [S2][R8]
// GLOBAL_AUDIT_VIEW — cross-slice governance audit projection
// Feed path: AUDIT_COLLECTOR → IER BACKGROUND_LANE → FUNNEL → STANDARD_PROJ_LANE → here

import type { EventEnvelope } from '@/features/shared.kernel.event-envelope';

export interface GlobalAuditRecord {
  readonly auditEventId: string;
  /** traceId carried through the full event chain [R8] */
  readonly traceId: string;
  readonly accountId: string;
  readonly workspaceId?: string;
  readonly eventType: string;
  readonly payload: Record<string, unknown>;
  readonly timestamp: number;
}

export interface GlobalAuditQuery {
  accountId?: string;
  workspaceId?: string;
  limit?: number;
}

/**
 * Appends a cross-slice audit record.
 * Extracts `traceId` from the EventEnvelope; MUST NOT omit it [R8].
 * Version guard is enforced upstream by FUNNEL [SK_VERSION_GUARD S2].
 */
export async function applyAuditEvent(
  envelope: EventEnvelope,
  payload: Record<string, unknown>,
  context: { accountId: string; workspaceId?: string }
): Promise<void> {
  const { getFirestore, setDoc, doc, serverTimestamp } = await import('firebase/firestore');
  const db = getFirestore();
  const record: Omit<GlobalAuditRecord, 'timestamp'> & { timestamp: ReturnType<typeof serverTimestamp> } = {
    auditEventId: envelope.eventId,
    traceId: envelope.traceId ?? envelope.eventId,
    accountId: context.accountId,
    ...(context.workspaceId !== undefined && { workspaceId: context.workspaceId }),
    eventType: envelope.eventType,
    payload,
    timestamp: serverTimestamp(),
  };
  await setDoc(doc(db, 'globalAuditView', envelope.eventId), record);
}
