/**
 * shared.kernel.event-envelope — Public API
 *
 * [R8/R7] 統一信封 (TraceID, AggregateVersion)
 *
 * Per tree.md: shared.kernel.event-envelope = 系統的「法律與度量衡」
 *   — All domain events on any bus must conform to EventEnvelope.
 *   — Carries TraceID (D9), AggregateVersion (R7), and idempotencyKey (D8).
 *
 * Implementation lives in features/shared-kernel/events/event-envelope.ts.
 * This boundary stub re-exports the canonical contract for consumers that
 * import by tree.md slice name.
 */
export type {
  EventEnvelope,
  ImplementsEventEnvelopeContract,
} from '@/features/shared-kernel/events/event-envelope';
