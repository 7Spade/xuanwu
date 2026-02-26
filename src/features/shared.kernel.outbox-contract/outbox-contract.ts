/**
 * shared.kernel.outbox-contract — SK_OUTBOX_CONTRACT [S1]
 *
 * Per logic-overview.md [S1]:
 *   所有 OUTBOX 共用的行為規格（三要素缺一不可）：
 *   ① at-least-once：EventBus(in-process) → OUTBOX → RELAY → IER
 *   ② idempotency-key 必帶（eventId + aggId + version）
 *   ③ DLQ 分級宣告：每個 OUTBOX 必須在此契約聲明其事件的 DLQ 類別
 *
 * All OUTBOX implementations MUST reference this contract.
 * Do NOT re-define at-least-once semantics locally in each OUTBOX node.
 *
 * Invariant: Zero infrastructure dependencies (no Firebase, no React, no I/O).
 */

/**
 * DLQ tier classification for OUTBOX events. [S1][R5]
 *
 * SAFE_AUTO       — idempotent events; can be auto-retried without human review.
 * REVIEW_REQUIRED — financial / scheduling / role-change events; require human audit.
 * SECURITY_BLOCK  — security events (auth, claims); freeze + alert on failure.
 */
export type DlqTier = 'SAFE_AUTO' | 'REVIEW_REQUIRED' | 'SECURITY_BLOCK';

/**
 * The three mandatory elements every OUTBOX record must satisfy. [S1]
 *
 * Delivery guarantee: at-least-once
 *   EventBus(in-process) → OUTBOX → RELAY → IER
 *
 * Idempotency key format: `${eventId}:${aggId}:${version}`
 *   FUNNEL upserts by this key; DLQ replay MUST preserve the original key.
 */
export interface OutboxRecord {
  /** OUTBOX document identifier (UUID). */
  readonly outboxId: string;
  /** Idempotency key = eventId + aggId + version. MUST be preserved through replay. */
  readonly idempotencyKey: string;
  /** DLQ tier for this event type — declared once per OUTBOX type. */
  readonly dlqTier: DlqTier;
  /** Serialized EventEnvelope payload. */
  readonly payload: string;
  /** ISO 8601 creation timestamp. */
  readonly createdAt: string;
  /** Processing status. */
  readonly status: OutboxStatus;
}

/** OUTBOX processing lifecycle. */
export type OutboxStatus = 'pending' | 'relayed' | 'dlq';

/**
 * Builds a canonical idempotency key from the three required components. [S1][Q3]
 *
 * Format: `${eventId}:${aggId}:${version}`
 */
export function buildIdempotencyKey(
  eventId: string,
  aggId: string,
  version: number,
): string {
  return `${eventId}:${aggId}:${version}`;
}

/**
 * Marker interface — OUTBOX implementations declare conformance to this contract. [S1]
 */
export interface ImplementsOutboxContract {
  readonly implementsOutboxContract: true;
}
