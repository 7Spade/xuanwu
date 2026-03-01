// projection.global-audit-view · VS8 STANDARD_PROJ_LANE · logic-overview.md [S2][R8]
// GLOBAL_AUDIT_VIEW — cross-slice governance audit projection
// Feed path: AUDIT_COLLECTOR → IER BACKGROUND_LANE → FUNNEL → STANDARD_PROJ_LANE → here

import { serverTimestamp } from 'firebase/firestore';
import { setDocument } from '@/shared/infra/firestore/firestore.write.adapter';
import type { EventEnvelope } from '@/features/shared-kernel/event-envelope';

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
 *
 * [S2] Idempotency: this projector uses `setDoc(envelope.eventId)` as the
 * document key.  Processing the same event twice overwrites with identical data
 * — preventing duplicate global-audit entries on event-store replay.
 * This is the append-only analogue of the versionGuardAllows check used by
 * state-update projections.
 */
export async function applyAuditEvent(
  envelope: EventEnvelope,
  payload: Record<string, unknown>,
  context: { accountId: string; workspaceId?: string }
): Promise<void> {
  const record: Omit<GlobalAuditRecord, 'timestamp'> & { timestamp: ReturnType<typeof serverTimestamp> } = {
    auditEventId: envelope.eventId,
    traceId: envelope.traceId ?? envelope.eventId,
    accountId: context.accountId,
    ...(context.workspaceId !== undefined && { workspaceId: context.workspaceId }),
    eventType: envelope.eventType,
    payload,
    timestamp: serverTimestamp(),
  };
  // [S2] Use eventId as document key for idempotent writes on event-store replay.
  await setDocument(`globalAuditView/${envelope.eventId}`, record);
}
