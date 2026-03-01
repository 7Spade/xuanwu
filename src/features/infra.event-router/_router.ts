/**
 * infra.event-router — _router.ts
 *
 * [IER] Integration Event Router [R2]
 *
 * Per logic-overview.md [R2]:
 *   OUTBOX_RELAY_WORKER -->|deliver| IER
 *   IER -.->|CRITICAL_LANE|    WALLET_AGG / AUTH
 *   IER -.->|STANDARD_LANE|   SCHEDULE / MEMBER / ROLE
 *   IER -.->|BACKGROUND_LANE| TAG_SUBSCRIBER / AUDIT / FCM
 *
 * Responsibilities:
 *   - Receive events from infra.outbox-relay via publishToLane (IerDeliveryFn)
 *   - Route by lane + eventType to all registered subscribers (fan-out)
 *   - Provide registerSubscriber for slices to declare interest
 *
 * Invariants:
 *   D9 — traceId is read from the envelope and forwarded; never overwritten by IER.
 *   R8 — All events carry traceId from the originating Command.
 */

import type { EventEnvelope } from '@/features/shared-kernel';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** IER delivery lane classification. [R2] */
export type IerLane = 'CRITICAL_LANE' | 'STANDARD_LANE' | 'BACKGROUND_LANE';

type EventHandler = (envelope: EventEnvelope) => Promise<void>;

interface Subscriber {
  readonly eventType: string | '*';
  readonly lane: IerLane | '*';
  readonly handler: EventHandler;
}

// ---------------------------------------------------------------------------
// Subscriber registry (module-level singleton)
// ---------------------------------------------------------------------------

const registry: Subscriber[] = [];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Register a handler for a specific event type and lane.
 * Use `'*'` for eventType to match all event types.
 * Use `'*'` for lane to receive events from all lanes.
 * Returns an unsubscribe function.
 *
 * Example (VS4_TAG_SUBSCRIBER):
 *   const unsub = registerSubscriber('tag:created', onTagCreated, 'BACKGROUND_LANE');
 */
export function registerSubscriber(
  eventType: string | '*',
  handler: EventHandler,
  lane: IerLane | '*' = '*'
): () => void {
  const sub: Subscriber = { eventType, lane, handler };
  registry.push(sub);
  return () => {
    const idx = registry.indexOf(sub);
    if (idx !== -1) registry.splice(idx, 1);
  };
}

/**
 * Route an event envelope to all subscribers matching the event type and lane.
 * Called by publishToLane after the relay delivers an outbox entry.
 */
export async function routeEvent(envelope: EventEnvelope, lane: IerLane): Promise<void> {
  const matched = registry.filter(
    (s) =>
      (s.eventType === '*' || s.eventType === envelope.eventType) &&
      (s.lane === '*' || s.lane === lane)
  );
  if (!matched.length) return;
  const results = await Promise.allSettled(matched.map((s) => s.handler(envelope)));
  results.forEach((result) => {
    if (result.status === 'rejected') {
      console.error(
        `[infra.event-router] handler failed for eventType="${envelope.eventType}" lane="${lane}":`,
        result.reason
      );
    }
  });
}

/**
 * IER delivery entry point — compatible with IerDeliveryFn from infra.outbox-relay.
 *
 * Wire this as the delivery function when starting outbox relay workers:
 *   startOutboxRelay('tagOutbox', publishToLane);
 *   startOutboxRelay('workspaceOutbox', publishToLane);
 */
export async function publishToLane(
  lane: IerLane,
  envelope: unknown
): Promise<void> {
  await routeEvent(envelope as EventEnvelope, lane);
}
