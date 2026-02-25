/**
 * shared-kernel.event-envelope
 *
 * Shared Kernel contract for all domain events across Bounded Contexts.
 *
 * Per logic-overview.v3.md S4 Integration Contracts:
 *   WORKSPACE_EVENT_BUS -.->|事件契約遵循| SK_EVENT_ENVELOPE
 *   ORGANIZATION_EVENT_BUS -.->|事件契約遵循| SK_EVENT_ENVELOPE
 *
 * %% Shared Kernel 區塊的虛線表示「契約遵循（implements contract）」而非跨 BC 讀寫依賴
 *
 * All domain events published on any event bus MUST conform to this envelope contract.
 * This ensures observability, replay, and cross-BC traceability without coupling BCs.
 */

/**
 * Base event envelope — every domain event published on any bus must satisfy this shape.
 *
 * Fields:
 *   eventId        — globally unique event identifier (UUID)
 *   eventType      — namespaced event name, e.g. "workspace:tasks:assigned"
 *   occurredAt     — ISO 8601 timestamp of when the event was produced
 *   sourceId       — ID of the aggregate or entity that produced this event
 *   payload        — event-specific data (typed per event bus contract)
 *   version        — aggregate version at the time the event was produced [Q3]
 *   traceId        — original Command TraceID; shared across the entire event chain,
 *                    must NOT be overwritten by IER/FUNNEL consumers [R8][D9]
 *   idempotencyKey — de-duplication key = eventId + aggregateId + version [Q3][D2]
 *                    FUNNEL upserts by this key; DLQ replay must preserve it [D8]
 */
export interface EventEnvelope<TPayload = unknown> {
  /** Globally unique event identifier (UUID). */
  readonly eventId: string;
  /** Namespaced event name, e.g. "workspace:tasks:assigned" or "organization:skill:xpAdded". */
  readonly eventType: string;
  /** ISO 8601 timestamp when the domain event occurred. */
  readonly occurredAt: string;
  /** ID of the aggregate or entity that produced this event. */
  readonly sourceId: string;
  /** Event-specific payload. Typed per event bus contract. */
  readonly payload: TPayload;
  /**
   * Aggregate version when the event was produced. [Q3]
   * Used to construct idempotencyKey and for ELIGIBLE_UPDATE_GUARD monotonic checks [R7].
   */
  readonly version?: number;
  /**
   * Original Command TraceID — shared across the entire event chain (Command → OUTBOX → IER → FUNNEL → FCM).
   * Consumers (IER, FUNNEL, FCM) MUST read this value from the envelope and MUST NOT overwrite it. [R8][D9]
   */
  readonly traceId?: string;
  /**
   * De-duplication key = eventId + aggregateId + version. [Q3][D2]
   * FUNNEL performs upsert by this key to prevent duplicate projection writes.
   * DLQ replay MUST preserve the original key — do NOT regenerate. [D8]
   */
  readonly idempotencyKey?: string;
}

/** Marker interface — event bus implementations must declare conformance. */
export interface ImplementsEventEnvelopeContract {
  readonly implementsEventEnvelope: true;
}
