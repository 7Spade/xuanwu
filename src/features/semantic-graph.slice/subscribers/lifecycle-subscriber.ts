/**
 * Module: semantic-graph.slice/subscribers — [L10 VS8_IO] Lifecycle Subscriber
 *
 * Inbound broadcast listener for the VS8 I/O layer [D21-6, S1].
 *
 * Subscribes to external domain events (e.g. TagLifecycleEvent from the IER)
 * and drives the appropriate internal VS8 state transitions.
 *
 * Invariants:
 *   [S1]   Subscribers must be idempotent — duplicate events must be safe to replay.
 *   [D24]  No direct Firebase import — Firestore I/O goes through SK_PORTS adapters.
 *
 * @see docs/architecture/slices/semantic-graph.md — L10 VS8_IO
 */

import type { TagLifecycleEvent } from '../centralized-types';
import { emitTagLifecycleEvent } from '../outbox/tag-outbox';

// ─── Types ────────────────────────────────────────────────────────────────────

/** Function returned by createLifecycleSubscriber() that cancels the subscription. */
export type Unsubscribe = () => void;

/** Handler shape for external lifecycle event sources. */
export type LifecycleEventSource = (handler: (event: TagLifecycleEvent) => void) => Unsubscribe;

// ─── Internal handler registry ────────────────────────────────────────────────

const _handlers: Array<(event: TagLifecycleEvent) => void> = [];

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Subscribe to an external lifecycle event source.
 *
 * Received events are:
 *   1. Forwarded to the tag outbox for L10 broadcast [D21-10].
 *   2. Dispatched to all registered internal handlers.
 *
 * Idempotency: duplicate events (same eventId) are filtered before outbox write [S1].
 *
 * @param source - An event-emitting function that returns an unsubscribe callback.
 * @returns Unsubscribe callback; call it to detach this subscriber.
 */
export function createLifecycleSubscriber(source: LifecycleEventSource): Unsubscribe {
  const unsubscribe = source((event: TagLifecycleEvent) => {
    // 1. Broadcast via outbox (idempotent).
    emitTagLifecycleEvent(event);
    // 2. Notify internal handlers (e.g. projection-cache invalidation).
    for (const handler of _handlers) {
      handler(event);
    }
  });
  return unsubscribe;
}

/**
 * Register an internal handler that is called for every lifecycle event.
 * Returns an unsubscribe function.
 */
export function onLifecycleEvent(handler: (event: TagLifecycleEvent) => void): Unsubscribe {
  _handlers.push(handler);
  return () => {
    const idx = _handlers.indexOf(handler);
    if (idx !== -1) _handlers.splice(idx, 1);
  };
}

/** Clear all registered handlers (used in tests). */
export function _clearHandlersForTest(): void {
  _handlers.length = 0;
}
