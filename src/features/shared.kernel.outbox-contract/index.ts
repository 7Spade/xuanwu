/**
 * shared.kernel.outbox-contract — Public API
 *
 * SK_OUTBOX_CONTRACT [S1] — OUTBOX behavior specification contract.
 *
 * Per logic-overview.md [S1]:
 *   All OUTBOX implementations reference this slice as the single source of truth
 *   for at-least-once delivery guarantees, idempotency-key format, and DLQ tier declaration.
 *
 * Invariant: Zero infrastructure dependencies (no Firebase, no React, no I/O).
 */

export type {
  DlqTier,
  OutboxRecord,
  OutboxStatus,
  ImplementsOutboxContract,
} from './outbox-contract';

export { buildIdempotencyKey } from './outbox-contract';
