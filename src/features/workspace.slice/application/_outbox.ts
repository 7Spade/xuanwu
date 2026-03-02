/**
 * workspace-application/_outbox.ts
 *
 * In-process transaction outbox: collects domain events during a transaction,
 * then flushes them to the workspace event bus after commit.
 *
 * Per logic-overview.md invariants #4a / #4b:
 * Domain Events are produced only by Aggregates (#4a); Transaction Runner only
 * collects already-produced events and delivers them to the Outbox (#4b).
 *
 * Flow: WORKSPACE_TRANSACTION_RUNNER →|彙整事件後寫入| WORKSPACE_OUTBOX → WORKSPACE_EVENT_BUS
 *
 * Firestore Persistence Layer [S1][E5]:
 * Events flagged in WS_OUTBOX_PERSISTED_EVENTS are ALSO written to the
 * `wsOutbox/{id}` Firestore collection so the OUTBOX_RELAY_WORKER [R1] can
 * deliver them to IER via STANDARD_LANE with at-least-once semantics.
 *
 * Per logic-overview.md WS_OB [SK_OUTBOX: SAFE_AUTO][E5]:
 *   WS_TX_R -->|"pending events [E5]"| WS_OB
 *   WS_OB -->|"STANDARD_LANE [E5]"| IER
 */

import { logDomainError } from '@/features/observability';
import { buildIdempotencyKey, type DlqTier } from '@/features/shared-kernel';
import { setDocument } from '@/shared/infra/firestore/firestore.write.adapter';

import type {
  WorkspaceEventName,
  WorkspaceEventPayloadMap,
} from '../core.event-bus';

export type OutboxEvent = {
  [K in WorkspaceEventName]: { type: K; payload: WorkspaceEventPayloadMap[K] };
}[WorkspaceEventName];

export interface Outbox {
  /** Collect a domain event produced by the aggregate. */
  collect<T extends WorkspaceEventName>(type: T, payload: WorkspaceEventPayloadMap[T]): void;
  /** Flush all collected events to the event bus. Does not modify internal state. */
  flush(publish: (type: string, payload: unknown) => void): void;
  /** Drain and return all collected events (empties the buffer). */
  drain(): OutboxEvent[];
}

// =============================================================================
// Firestore persistence layer [S1][E5]
// =============================================================================

/**
 * Events that require Firestore Outbox persistence for at-least-once delivery [S1].
 *
 * Per logic-overview.md WS_OB [E5]: ws-outbox is the sole IER delivery path.
 * Add new event types here when they require cross-process at-least-once semantics.
 *
 * All workspace outbox entries use SAFE_AUTO tier and STANDARD_LANE.
 * [logic-overview.md: WS_OB["ws-outbox [SK_OUTBOX: SAFE_AUTO]"]]
 */
const WS_OUTBOX_PERSISTED_EVENTS = new Set<WorkspaceEventName>([
  'workspace:parsing-intent:deltaProposed',
]);

/** DLQ tier for all ws-outbox entries — per logic-overview.md WS_OB annotation. */
const WS_OUTBOX_DLQ_TIER: DlqTier = 'SAFE_AUTO';

/** IER lane for ws-outbox delivery — per logic-overview.md WS_OB [E5]. */
const WS_OUTBOX_IER_LANE = 'STANDARD_LANE' as const;

/** Firestore collection path for the workspace outbox. */
const WS_OUTBOX_COLLECTION = 'wsOutbox';

/** Typed shape of each `wsOutbox/{id}` Firestore document. */
interface WsOutboxDocument {
  outboxId: string;
  eventType: WorkspaceEventName;
  envelopeJson: string;
  lane: typeof WS_OUTBOX_IER_LANE;
  dlqTier: DlqTier;
  idempotencyKey: string;
  status: 'pending';
  createdAt: string;
  attemptCount: 0;
}

/** Extracts the traceId from an event payload when present, for [R8] audit trail. */
function extractTraceIdFromPayload(payload: unknown): string | undefined {
  if (payload != null && typeof payload === 'object' && 'traceId' in payload) {
    const { traceId } = payload as { traceId?: unknown };
    if (typeof traceId === 'string') return traceId;
  }
  return undefined;
}

/**
 * Writes a single event to the `wsOutbox` Firestore collection [S1][E5].
 *
 * This enables at-least-once delivery via the OUTBOX_RELAY_WORKER [R1]:
 *   wsOutbox(pending) --[RELAY]--> IER(STANDARD_LANE)
 *
 * Fire-and-forget — failures are logged via the Observability Layer but do NOT
 * block the in-process event bus (dual-write best-effort pattern).
 */
async function persistToWsOutbox(
  event: OutboxEvent,
  workspaceId: string,
): Promise<void> {
  // `crypto.randomUUID()` is available in all target runtimes (Node 18+, modern browsers).
  const outboxId = crypto.randomUUID();
  const occurredAt = new Date().toISOString();

  // [S1] idempotencyKey = eventId + aggId + version (version 0 for initial write)
  const idempotencyKey = buildIdempotencyKey(outboxId, workspaceId, 0);

  const traceId = extractTraceIdFromPayload(event.payload);

  const envelope = {
    eventId: outboxId,
    eventType: event.type,
    occurredAt,
    sourceId: workspaceId,
    payload: event.payload,
    idempotencyKey,
    ...(traceId !== undefined ? { traceId } : {}),
  };

  const document: WsOutboxDocument = {
    outboxId,
    eventType: event.type,
    envelopeJson: JSON.stringify(envelope),
    lane: WS_OUTBOX_IER_LANE,
    dlqTier: WS_OUTBOX_DLQ_TIER,
    idempotencyKey,
    status: 'pending',
    createdAt: occurredAt,
    attemptCount: 0,
  };

  await setDocument<WsOutboxDocument>(`${WS_OUTBOX_COLLECTION}/${outboxId}`, document);
}

// =============================================================================
// Direct persistence helper (for client-side handlers outside runTransaction)
// =============================================================================

/**
 * Persists an outbox event directly to Firestore — for use by client-side handlers
 * (e.g. document-parser-view) that cannot go through `runTransaction` but still
 * need at-least-once delivery semantics [S1][E5].
 *
 * Only persists event types registered in `WS_OUTBOX_PERSISTED_EVENTS`.
 * Fire-and-forget — the caller is responsible for `.catch()` handling.
 */
export async function persistWorkspaceOutboxEvent<T extends WorkspaceEventName>(
  workspaceId: string,
  type: T,
  payload: WorkspaceEventPayloadMap[T],
): Promise<void> {
  if (!WS_OUTBOX_PERSISTED_EVENTS.has(type)) {
    logDomainError({
      occurredAt: new Date().toISOString(),
      traceId: crypto.randomUUID(),
      source: 'workspace-application:persistWorkspaceOutboxEvent',
      message: `Event type "${type}" is not registered in WS_OUTBOX_PERSISTED_EVENTS — Firestore persistence skipped. Add it to the set if at-least-once delivery is required.`,
      detail: undefined,
    });
    return;
  }
  await persistToWsOutbox({ type, payload } as OutboxEvent, workspaceId);
}

/** Creates a new in-process Outbox for use within a single transaction.
 *
 * @param workspaceId - When provided, events in WS_OUTBOX_PERSISTED_EVENTS are
 *   ALSO persisted to the `wsOutbox` Firestore collection for at-least-once
 *   delivery via the OUTBOX_RELAY_WORKER [R1][S1][E5].
 */
export function createOutbox(workspaceId?: string): Outbox {
  const events: OutboxEvent[] = [];

  return {
    collect<T extends WorkspaceEventName>(type: T, payload: WorkspaceEventPayloadMap[T]) {
      const event = { type, payload } as OutboxEvent;
      events.push(event);

      // [S1][E5] Persist to Firestore for at-least-once delivery via OUTBOX_RELAY_WORKER.
      // Fire-and-forget: failures are logged but must not block the in-process flow.
      if (workspaceId && WS_OUTBOX_PERSISTED_EVENTS.has(type)) {
        persistToWsOutbox(event, workspaceId).catch((err: unknown) => {
          logDomainError({
            occurredAt: new Date().toISOString(),
            traceId: crypto.randomUUID(),
            source: 'workspace-application:outbox:persistToWsOutbox',
            message: `Firestore outbox persistence failed for event "${type}". In-process delivery continues.`,
            detail: err instanceof Error ? (err.stack ?? err.message) : String(err),
          });
        });
      }
    },
    flush(publish: (type: string, payload: unknown) => void) {
      // Flush without draining — caller decides when to drain
      for (const event of events) {
        publish(event.type, event.payload);
      }
    },
    drain() {
      return events.splice(0);
    },
  };
}
