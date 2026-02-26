/**
 * infra.outbox-relay — _relay.ts
 *
 * OUTBOX_RELAY_WORKER [R1] — shared Relay Worker used by ALL outbox collections.
 *
 * Per logic-overview.md [R1] OUTBOX_RELAY_WORKER and tree.md:
 *   infra.outbox-relay = [R1] 搬運工 (掃描所有 OUTBOX 投遞至 IER)
 *
 *   - Scan strategy: Firestore onSnapshot (CDC) — listens for `pending` entries
 *   - Delivery: OUTBOX → IER corresponding Lane
 *   - Failure handling: retry with exponential backoff; after 3 attempts → DLQ
 *   - Monitoring: relay_lag / relay_error_rate → VS9 DOMAIN_METRICS
 *
 * All OUTBOX collections share this single Relay Worker — no per-BC duplication.
 *
 * Invariants:
 *   D8  — idempotencyKey must be preserved on DLQ entry (never regenerated).
 *   R5  — DLQ entries carry a `dlqLevel` tag (SAFE_AUTO / REVIEW_REQUIRED / SECURITY_BLOCK).
 *   D9  — traceId is read from the envelope and forwarded; never overwritten.
 */

import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  setDoc,
  serverTimestamp,
  type Unsubscribe,
  type QuerySnapshot,
  type DocumentData,
  type DocumentChange,
} from 'firebase/firestore';
import { db } from '@/shared/infra/firestore/firestore.client';
import { getDlqLevel, type DlqEntry } from '@/features/infra.dlq-manager';
import { logDomainError } from '@/features/infra.observability';

/** Delivery status of an outbox entry. */
export type OutboxStatus = 'pending' | 'delivered' | 'dlq';

/** Shape of a document stored in any OUTBOX collection. */
export interface OutboxDocument {
  readonly outboxId: string;
  readonly eventType: string;
  /** Serialized EventEnvelope — includes idempotencyKey and traceId [D8][D9]. */
  readonly envelopeJson: string;
  /** Destination IER lane. */
  readonly lane: 'CRITICAL_LANE' | 'STANDARD_LANE' | 'BACKGROUND_LANE';
  status: OutboxStatus;
  readonly createdAt: ReturnType<typeof serverTimestamp>;
  /** Number of delivery attempts. */
  attemptCount: number;
  lastAttemptAt?: string;
  lastError?: string;
}

const MAX_ATTEMPTS = 3;

/** Exponential backoff delays (ms) per attempt index (0-based). */
const BACKOFF_MS = [500, 2000, 8000] as const;

/**
 * Callback invoked by the relay worker to deliver an event to IER.
 * The caller (application bootstrap) wires this to the actual IER publish function.
 *
 * @param lane  - Destination lane in IER.
 * @param envelope - Deserialized EventEnvelope object.
 */
export type IerDeliveryFn = (
  lane: OutboxDocument['lane'],
  envelope: unknown
) => Promise<void>;

/**
 * Starts the OUTBOX_RELAY_WORKER for a given Firestore collection path.
 *
 * Usage (call once per OUTBOX collection at app startup):
 * ```ts
 * const stop = startOutboxRelay('workspaceOutbox', ierDeliveryFn);
 * // At shutdown:
 * stop();
 * ```
 *
 * @param outboxCollectionPath - Firestore collection path, e.g. "workspaceOutbox".
 * @param deliver - IER delivery callback.
 * @returns Cleanup function that unsubscribes the CDC listener.
 */
export function startOutboxRelay(
  outboxCollectionPath: string,
  deliver: IerDeliveryFn
): Unsubscribe {
  const q = query(
    collection(db, outboxCollectionPath),
    where('status', '==', 'pending')
  );

  const unsubscribe = onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
    snapshot.docChanges().forEach((change: DocumentChange<DocumentData>) => {
      if (change.type !== 'added' && change.type !== 'modified') return;
      const data = change.doc.data() as OutboxDocument;
      if (data.status !== 'pending') return;

      void relayEntry(outboxCollectionPath, change.doc.id, data, deliver);
    });
  }, (err: Error) => {
    // Log listener errors — network failure, permission denied, etc.
    // The onSnapshot listener will NOT auto-reconnect after an error;
    // the caller should restart the relay worker on app restart.
    console.error(`[outbox-relay] CDC listener error on "${outboxCollectionPath}":`, err);
  });

  return unsubscribe;
}

/**
 * Attempts to relay a single outbox entry to IER.
 * Implements retry with exponential backoff; routes to DLQ after MAX_ATTEMPTS.
 */
async function relayEntry(
  collectionPath: string,
  docId: string,
  data: OutboxDocument,
  deliver: IerDeliveryFn
): Promise<void> {
  const docRef = doc(db, collectionPath, docId);
  const attempt = (data.attemptCount ?? 0) + 1;

  // Malformed JSON is a data-corruption issue — skip retries and go directly to DLQ.
  let envelope: unknown;
  try {
    envelope = JSON.parse(data.envelopeJson);
  } catch {
    await routeToDlq(
      collectionPath,
      docId,
      data,
      attempt,
      'Malformed envelopeJson — JSON.parse failed; data corruption suspected'
    );
    return;
  }

  try {
    await deliver(data.lane, envelope);

    await updateDoc(docRef, {
      status: 'delivered' as OutboxStatus,
      attemptCount: attempt,
      lastAttemptAt: new Date().toISOString(),
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);

    if (attempt >= MAX_ATTEMPTS) {
      await routeToDlq(collectionPath, docId, data, attempt, errorMessage);
      return;
    }

    // Back off and mark for retry (leave status as pending)
    const backoffMs = BACKOFF_MS[Math.min(attempt - 1, BACKOFF_MS.length - 1)];
    await new Promise((resolve) => setTimeout(resolve, backoffMs));

    await updateDoc(docRef, {
      attemptCount: attempt,
      lastAttemptAt: new Date().toISOString(),
      lastError: errorMessage,
    });
  }
}

/**
 * Routes a permanently-failed outbox entry to the DLQ with the correct tier. [R5]
 *
 * The original envelopeJson is preserved so that DLQ replay can re-submit with
 * the same idempotencyKey [D8].
 */
async function routeToDlq(
  collectionPath: string,
  docId: string,
  data: OutboxDocument,
  attemptCount: number,
  lastError: string
): Promise<void> {
  const dlqLevel = getDlqLevel(data.eventType);
  const dlqId = `${collectionPath}__${docId}`;

  const dlqEntry: DlqEntry = {
    dlqId,
    dlqLevel,
    sourceLane: data.lane,
    originalEnvelopeJson: data.envelopeJson,
    firstFailedAt: data.lastAttemptAt ?? new Date().toISOString(),
    attemptCount,
    lastError,
  };

  await setDoc(doc(db, 'deadLetterQueue', dlqId), dlqEntry);

  await updateDoc(doc(db, collectionPath, docId), {
    status: 'dlq' as OutboxStatus,
    attemptCount,
    lastAttemptAt: new Date().toISOString(),
    lastError,
  });

  // [GEMINI.md §4][S6] SECURITY_BLOCK tier: fire VS9 domain-error-log alert immediately.
  // Auto-replay is FORBIDDEN for SECURITY_BLOCK — alert must be raised so ops can review.
  if (dlqLevel === 'SECURITY_BLOCK') {
    let resolvedTraceId = dlqId;
    try {
      const env = JSON.parse(data.envelopeJson) as { traceId?: string };
      resolvedTraceId = env.traceId ?? dlqId;
    } catch (parseErr) {
      // Log parse failure so operators know the envelope was malformed on the alert path
      console.error(
        `[outbox-relay] SECURITY_BLOCK: could not parse envelopeJson for traceId — dlqId="${dlqId}":`,
        parseErr
      );
    }
    logDomainError({
      occurredAt: new Date().toISOString(),
      traceId: resolvedTraceId,
      source: 'infra.outbox-relay:SECURITY_BLOCK',
      message: `SECURITY_BLOCK DLQ — eventType="${data.eventType}" lane="${data.lane}" dlqId="${dlqId}". ` +
        `Auto-replay is FORBIDDEN. Manual review required. lastError: ${lastError}`,
      detail: `collection=${collectionPath} docId=${docId} attempts=${attemptCount}`,
    });
  }
}
