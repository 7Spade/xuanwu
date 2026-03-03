/**
 * centralized-tag — _bus.ts
 *
 * In-process tag lifecycle event bus.
 * Mirrors the organization event bus pattern.
 *
 * Per logic-overview.md (VS0):
 *   CTA -->|"標籤異動廣播"| TAG_EVENTS --> IER
 *   TAG_EVENTS -.->|"契約遵循"| SK_ENV
 */

import type { ImplementsEventEnvelopeContract } from '../event-envelope';

import type { TagLifecycleEventPayloadMap, TagLifecycleEventKey } from './_events';

type TagEventHandler<K extends TagLifecycleEventKey> = (
  payload: TagLifecycleEventPayloadMap[K]
) => void | Promise<void>;

type TagEventHandlerMap = {
  [K in TagLifecycleEventKey]?: Array<TagEventHandler<K>>;
};

/** Marker: this module implements the shared-kernel.event-envelope contract (Invariant #8). */
export const implementsEventEnvelope: ImplementsEventEnvelopeContract['implementsEventEnvelope'] = true;

const handlers: TagEventHandlerMap = {};

/**
 * Subscribe to a tag lifecycle event.
 * Returns an unsubscribe function.
 */
export function onTagEvent<K extends TagLifecycleEventKey>(
  eventKey: K,
  handler: TagEventHandler<K>
): () => void {
  if (!handlers[eventKey]) {
    (handlers as Record<string, unknown[]>)[eventKey] = [];
  }
  (handlers[eventKey] as Array<TagEventHandler<K>>).push(handler);

  return () => {
    const list = handlers[eventKey] as Array<TagEventHandler<K>> | undefined;
    if (list) {
      const idx = list.indexOf(handler);
      if (idx !== -1) list.splice(idx, 1);
    }
  };
}

/**
 * Publish a tag lifecycle event to all subscribers.
 *
 * [D8] sync fire-and-forget — shared-kernel must not have async functions.
 * Handlers may themselves be async; their errors are swallowed to avoid
 * disrupting the caller.  Callers that need completion guarantees should
 * use the durable outbox pattern (tagOutbox) instead.
 */
export function publishTagEvent<K extends TagLifecycleEventKey>(
  eventKey: K,
  payload: TagLifecycleEventPayloadMap[K]
): void {
  const list = handlers[eventKey] as Array<TagEventHandler<K>> | undefined;
  if (!list?.length) return;
  for (const h of list) {
    try {
      const result = h(payload);
      if (result && typeof result.catch === 'function') {
        result.catch((err: unknown) =>
          console.error(
            '[centralized-tag] async handler error for',
            eventKey,
            `(handler #${list.indexOf(h as TagEventHandler<K>)})`,
            err
          )
        );
      }
    } catch (err) {
      console.error('[centralized-tag] sync handler error for', eventKey, err);
    }
  }
}
