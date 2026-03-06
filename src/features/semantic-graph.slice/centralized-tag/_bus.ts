import type { ImplementsEventEnvelopeContract } from '@/shared-kernel';
import type { TagLifecycleEventPayloadMap, TagLifecycleEventKey } from './_events';

type TagEventHandler<K extends TagLifecycleEventKey> = (
  payload: TagLifecycleEventPayloadMap[K]
) => void | Promise<void>;

type TagEventHandlerMap = {
  [K in TagLifecycleEventKey]?: Array<TagEventHandler<K>>;
};

export const implementsEventEnvelope: ImplementsEventEnvelopeContract['implementsEventEnvelope'] = true;

const handlers: TagEventHandlerMap = {};

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

export function publishTagEvent<K extends TagLifecycleEventKey>(
  eventKey: K,
  payload: TagLifecycleEventPayloadMap[K]
): void {
  const list = handlers[eventKey] as Array<TagEventHandler<K>> | undefined;
  if (!list?.length) return;
  for (const handler of list) {
    try {
      const result = handler(payload);
      if (result && typeof result.catch === 'function') {
        result.catch((err: unknown) =>
          console.error('[centralized-tag] async handler error for', eventKey, err)
        );
      }
    } catch (err) {
      console.error('[centralized-tag] sync handler error for', eventKey, err);
    }
  }
}
