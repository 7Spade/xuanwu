/**
 * shared.kernel.event-envelope — Public API
 *
 * [R8/R7] 統一信封 (TraceID, AggregateVersion)
 *
 * Per logic-overview.md: shared.kernel.event-envelope = 系統的「法律與度量衡」
 *   — All domain events on any bus must conform to EventEnvelope.
 *   — Carries TraceID (D9), AggregateVersion (R7), and idempotencyKey (D8).
 */
export type {
  EventEnvelope,
  ImplementsEventEnvelopeContract,
} from './event-envelope';
