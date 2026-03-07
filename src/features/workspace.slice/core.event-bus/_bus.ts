// [?瑁痊] 鈭辣?澆?/閮撘? (The Bus)
// Per 00-LogicOverview.md:
//   WORKSPACE_EVENT_BUS -.->|鈭辣憟??萄儐| SK_EVENT_ENVELOPE
//   WORKSPACE_EVENT_BUS --> TRACE_IDENTIFIER (Observability)
//   WORKSPACE_EVENT_BUS --> DOMAIN_METRICS   (Observability)
import { recordEventPublished } from "@/shared-kernel/observability"
import type { ImplementsEventEnvelopeContract } from '@/shared-kernel'

import type {
  WorkspaceEventName,
  WorkspaceEventHandler,
  PublishFn,
  SubscribeFn,
  WorkspaceEventPayloadMap,
} from "./_events"

// A map where keys are event names (strings) and values are arrays of handler functions (Observers).
// [V-ANY-01] Use WorkspaceEventName as the generic bound rather than `any` to preserve
// type discipline; the per-event payload narrowing is enforced at the subscribe/publish call-sites.
type HandlerRegistry = Map<WorkspaceEventName, WorkspaceEventHandler<WorkspaceEventName>[]>

/**
 * The Subject in the Observer pattern. It maintains a list of Observers (handlers)
 * and notifies them when an event occurs.
 *
 * Implements shared-kernel.event-envelope contract (Invariant #8).
 */
export class WorkspaceEventBus implements ImplementsEventEnvelopeContract {
  /** Marker: this bus implements the shared-kernel.event-envelope contract. */
  readonly implementsEventEnvelope = true as const;

  private handlers: HandlerRegistry

  constructor() {
    this.handlers = new Map()
  }

  publish: PublishFn = <T extends WorkspaceEventName>(
    type: T,
    payload: WorkspaceEventPayloadMap[T]
  ) => {
    // DOMAIN_METRICS ??record every published event
    recordEventPublished(type)
    const eventHandlers = this.handlers.get(type)
    if (eventHandlers) {
      const handlersCopy = [...eventHandlers]
      handlersCopy.forEach((handler) => {
        try {
          handler(payload)
        } catch (error) {
          console.error(`Error in event handler for ${type}:`, error)
        }
      })
    }
  }

  emit: PublishFn = this.publish

  subscribe: SubscribeFn = <T extends WorkspaceEventName>(
    type: T,
    handler: (payload: WorkspaceEventPayloadMap[T]) => void
  ) => {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, [])
    }

    const handlerList = this.handlers.get(type)!
    // Type-cast is safe: `type` and `handler` are constrained to the same T at the
    // subscribe() call-site. The registry stores them together, so the handler will
    // always be invoked with the matching payload type via `publish`.
    handlerList.push(handler as WorkspaceEventHandler<WorkspaceEventName>)

    return () => {
      const index = handlerList.indexOf(handler as WorkspaceEventHandler<WorkspaceEventName>)
      if (index > -1) {
        handlerList.splice(index, 1)
      }
    }
  }

  on: SubscribeFn = this.subscribe
}
