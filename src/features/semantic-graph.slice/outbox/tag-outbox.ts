/**
 * Module: semantic-graph.slice/outbox — [L10 VS8_IO] Tag Outbox
 *
 * Outbound broadcast for the VS8 I/O layer [D21-6, S1].
 *
 * All topology mutations (addEdge, removeEdge, tag FSM transitions) must route
 * their resulting domain events through this outbox before any subscriber
 * outside VS8 is notified [D21-10, SK_OUTBOX SAFE_AUTO].
 *
 * Invariants:
 *   [D21-10] Every graph topology change emits SemanticTopologyChanged via this outbox.
 *   [S1]     Outbox writes are idempotent (deduplication key = eventId).
 *   [D24]    No direct Firebase import — writes go through the SK_OUTBOX adapter.
 *
 * @see docs/architecture/slices/semantic-graph.md — L10 VS8_IO
 */

import type { TagLifecycleEvent, SemanticEdge } from '../centralized-types';

// ─── Outbox entry ─────────────────────────────────────────────────────────────

export type OutboxEventKind =
  | 'TAG_LIFECYCLE'
  | 'TOPOLOGY_CHANGED'
  | 'WEIGHT_UPDATED';

export interface OutboxEntry {
  readonly eventId: string;
  readonly kind: OutboxEventKind;
  readonly payload: TagLifecycleEvent | TopologyChangedPayload | WeightUpdatedPayload;
  readonly enqueuedAt: string;
  /** True once the entry has been delivered to all subscribers. */
  delivered: boolean;
}

export interface TopologyChangedPayload {
  readonly edge: SemanticEdge;
  readonly mutation: 'ADDED' | 'REMOVED';
}

export interface WeightUpdatedPayload {
  readonly edgeId: string;
  readonly previousWeight: number;
  readonly newWeight: number;
}

// ─── In-memory outbox queue ───────────────────────────────────────────────────

const _queue: OutboxEntry[] = [];
let _counter = 0;

function _nextId(): string {
  return `outbox-${Date.now()}-${++_counter}`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Enqueue a TagLifecycleEvent for broadcast to downstream subscribers [D21-10].
 * Idempotent: if an entry with the same eventId already exists it is skipped [S1].
 */
export function emitTagLifecycleEvent(event: TagLifecycleEvent): void {
  if (_queue.some((e) => e.kind === 'TAG_LIFECYCLE' && (e.payload as TagLifecycleEvent).eventId === event.eventId)) {
    return;
  }
  _queue.push({
    eventId: _nextId(),
    kind: 'TAG_LIFECYCLE',
    payload: event,
    enqueuedAt: new Date().toISOString(),
    delivered: false,
  });
}

/**
 * Enqueue a topology-changed event (edge added or removed) [D21-10].
 */
export function emitSemanticTopologyChanged(payload: TopologyChangedPayload): void {
  _queue.push({
    eventId: _nextId(),
    kind: 'TOPOLOGY_CHANGED',
    payload,
    enqueuedAt: new Date().toISOString(),
    delivered: false,
  });
}

/**
 * Enqueue a weight-updated event (learning engine feedback) [D21-10].
 */
export function emitNeuralWeightUpdated(payload: WeightUpdatedPayload): void {
  _queue.push({
    eventId: _nextId(),
    kind: 'WEIGHT_UPDATED',
    payload,
    enqueuedAt: new Date().toISOString(),
    delivered: false,
  });
}

/**
 * Drain all pending (undelivered) entries from the queue and mark them delivered.
 * Called by the outbox relay (infra layer) to forward events to external consumers.
 */
export function drainPendingEntries(): OutboxEntry[] {
  const pending = _queue.filter((e) => !e.delivered);
  pending.forEach((e) => { e.delivered = true; });
  return pending;
}

/** Clear the outbox (used in tests). */
export function _clearOutboxForTest(): void {
  _queue.length = 0;
  _counter = 0;
}
