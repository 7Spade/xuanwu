/**
 * shared.kernel/event-envelope — SK_ENV
 *
 * VS0 Shared Kernel: Universal domain event envelope contract.
 *
 * Per logic-overview.md [R8][R7]:
 *   ① traceId is injected ONCE at CBG_ENTRY (unified-command-gateway) and
 *      MUST NOT be overwritten by any downstream node (IER, FUNNEL, FCM).
 *   ② Every domain event on every in-process bus MUST satisfy EventEnvelope<T>.
 *   ③ idempotencyKey = eventId + aggregateId + version prevents duplicate writes [Q3][D8].
 *
 * Dependency rule: ZERO infrastructure imports (no Firebase, no React, no I/O).
 */

// ─── Core envelope ───────────────────────────────────────────────────────────

/**
 * Universal event envelope that every domain event published on any bus must satisfy.
 *
 * [R8]  traceId carries the original Command trace from CBG_ENTRY end-to-end.
 *        Downstream consumers READ it — they MUST NOT overwrite or regenerate it.
 * [R7]  version is the aggregate version when the event was produced;
 *        used for SK_VERSION_GUARD monotonic checks.
 * [Q3]  idempotencyKey = eventId + aggregateId + version; FUNNEL upserts by this key.
 * [D8]  DLQ replay MUST preserve the original idempotencyKey.
 */
export interface EventEnvelope<TPayload = unknown> {
  /** Globally unique event identifier (UUID). */
  readonly eventId: string;
  /** Namespaced event type, e.g. "workspace:tasks:assigned". */
  readonly eventType: string;
  /** ISO 8601 timestamp when the event occurred. */
  readonly occurredAt: string;
  /** ID of the aggregate or entity that produced the event. */
  readonly sourceId: string;
  /** Event-specific payload — typed per event bus contract. */
  readonly payload: TPayload;
  /**
   * Aggregate version at event production time. [R7][Q3]
   * Used by SK_VERSION_GUARD and for constructing idempotencyKey.
   */
  readonly version?: number;
  /**
   * Original Command TraceID. [R8]
   * Injected once at CBG_ENTRY. All downstream nodes MUST propagate unchanged.
   */
  readonly traceId?: string;
  /**
   * Idempotency key = eventId + aggregateId + version. [Q3][D8]
   * FUNNEL upserts by this key. DLQ replay MUST NOT regenerate it.
   */
  readonly idempotencyKey?: string;
}

// ─── Conformance marker ───────────────────────────────────────────────────────

/**
 * Marker interface — event bus implementations declare conformance to SK_ENV. [R8]
 * Ensures every bus type-checks its events against the envelope contract.
 */
export interface ImplementsEventEnvelopeContract {
  readonly implementsEventEnvelope: true;
}
