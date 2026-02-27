/**
 * projection.account-audit — _projector.ts
 *
 * Maintains the account audit projection.
 * Stored at: auditProjection/{accountId}/entries/{entryId}
 *
 * Per logic-overview.md:
 *   EVENT_FUNNEL_INPUT → ACCOUNT_PROJECTION_AUDIT
 *
 * [S2] Append-Only Idempotency Model:
 *   Unlike state-update projections, this projection APPENDS a new document per
 *   event — there is no existing record to overwrite.  The traditional
 *   versionGuardAllows check (aggregateVersion > lastProcessedVersion) does not
 *   apply here; instead idempotency is achieved by using the event-store `eventId`
 *   as the Firestore document key when available.
 *
 *   • In-process event bus path  (funnel → addDocument) — events fire once;
 *     duplicate exposure is not possible at this layer.
 *   • Event-store replay path    (replay → setDoc(eventId)) — identical events
 *     overwrite with identical data, preventing duplicate log entries.
 *
 *   Callers SHOULD pass `eventId` whenever one is available to enable idempotent
 *   writes on replay.
 */

import { serverTimestamp, doc, setDoc, collection } from 'firebase/firestore';
import { db } from '@/shared/infra/firestore/firestore.client';
import { addDocument } from '@/shared/infra/firestore/firestore.write.adapter';

export interface AuditProjectionEntry {
  id: string;
  accountId: string;
  eventType: string;
  actorId: string;
  targetId?: string;
  summary: string;
  /** traceId carried from the originating EventEnvelope [R8] */
  traceId?: string;
  metadata?: Record<string, unknown>;
  occurredAt: ReturnType<typeof serverTimestamp>;
}

/**
 * Appends an audit event to the account audit projection.
 *
 * @param accountId - Account that owns this audit log.
 * @param entry     - Audit fields (traceId MUST be forwarded from the originating
 *                    EventEnvelope per [R8]).
 * @param eventId   - Optional: stable event-store identifier.  When supplied the
 *                    write uses `setDoc(eventId)` to guarantee idempotency on
 *                    event-store replay [S2].  When omitted (in-process bus path)
 *                    an auto-generated ID is used via `addDocument`.
 * @returns The Firestore document ID of the written entry.
 */
export async function appendAuditEntry(
  accountId: string,
  entry: Omit<AuditProjectionEntry, 'id' | 'occurredAt'>,
  eventId?: string
): Promise<string> {
  const data = { ...entry, occurredAt: serverTimestamp() };

  if (eventId) {
    // [S2] Event-store replay path: use eventId as document key for idempotency.
    const ref = doc(collection(db, `auditProjection/${accountId}/entries`), eventId);
    await setDoc(ref, data, { merge: false });
    return eventId;
  }

  // In-process event bus path: auto-generated ID (events fire exactly once).
  const ref = await addDocument(`auditProjection/${accountId}/entries`, data);
  return ref.id;
}
