/**
 * shared.kernel/outbox-contract — SK_OUTBOX_CONTRACT [S1]
 *
 * VS0 Shared Kernel: OUTBOX at-least-once delivery specification.
 *
 * Per logic-overview.md [S1]:
 *   ① Delivery guarantee: at-least-once
 *        EventBus(in-process) → OUTBOX → RELAY → IER
 *   ② Idempotency key is mandatory on every OUTBOX record
 *        Format: eventId + aggregateId + version
 *   ③ DLQ tier must be declared per OUTBOX type (no defaults)
 *        SAFE_AUTO       — idempotent events; auto-retry permitted
 *        REVIEW_REQUIRED — financial / scheduling / role events; requires human audit
 *        SECURITY_BLOCK  — security events (auth, claims); freeze aggregate + alert
 *
 * Rule: All OUTBOX implementations reference this contract.
 *   Do NOT re-define at-least-once semantics locally in each OUTBOX node.
 *
 * Dependency rule: ZERO infrastructure imports (no Firebase, no React, no I/O).
 */

// ─── DLQ tier ─────────────────────────────────────────────────────────────────

/**
 * DLQ tier classification for OUTBOX events. [S1][R5]
 *
 * Declared once per OUTBOX type — implementations MUST NOT default or override
 * this classification without an explicit logic-overview.md invariant reference.
 */
export type DlqTier = 'SAFE_AUTO' | 'REVIEW_REQUIRED' | 'SECURITY_BLOCK';

// ─── OUTBOX record ────────────────────────────────────────────────────────────

/** OUTBOX processing lifecycle statuses. */
export type OutboxStatus = 'pending' | 'relayed' | 'dlq';

/**
 * Mandatory shape every OUTBOX record must satisfy. [S1]
 *
 * All three elements are non-negotiable:
 *   outboxId       — unique record identifier
 *   idempotencyKey — prevents duplicate IER delivery; MUST survive DLQ replay
 *   dlqTier        — routing tier declared per event type
 */
export interface OutboxRecord {
  /** Unique OUTBOX record identifier (UUID). */
  readonly outboxId: string;
  /** Idempotency key = eventId + aggId + version. MUST be preserved through replay. */
  readonly idempotencyKey: string;
  /** DLQ tier for this event type — declared once per OUTBOX type. */
  readonly dlqTier: DlqTier;
  /** Serialized EventEnvelope payload (JSON string). */
  readonly payload: string;
  /** ISO 8601 creation timestamp. */
  readonly createdAt: string;
  /** Processing status. */
  readonly status: OutboxStatus;
}

// ─── Key builder ─────────────────────────────────────────────────────────────

/**
 * Builds the canonical idempotency key from the three required components. [S1][Q3]
 *
 * Format: `${eventId}:${aggId}:${version}`
 *
 * Invariant: DLQ replay MUST preserve the key — do NOT regenerate it.
 */
export function buildIdempotencyKey(
  eventId: string,
  aggId: string,
  version: number,
): string {
  return `${eventId}:${aggId}:${version}`;
}

// ─── Conformance marker ───────────────────────────────────────────────────────

/**
 * Marker interface — OUTBOX implementations declare SK_OUTBOX_CONTRACT conformance. [S1]
 */
export interface ImplementsOutboxContract {
  readonly implementsOutboxContract: true;
}
