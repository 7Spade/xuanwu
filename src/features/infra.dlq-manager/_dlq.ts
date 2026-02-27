/**
 * infra.dlq-manager — _dlq.ts
 *
 * Dead-Letter Queue tier classification [R5]
 *
 * Per logic-overview.md [R5] DLQ 三級策略:
 *
 *   SAFE_AUTO       — TagLifecycle・MemberJoined (idempotent, auto-retry)
 *   REVIEW_REQUIRED — WalletDeducted・ScheduleAssigned (financial/assignment, human review before replay)
 *   SECURITY_BLOCK  — RoleChanged・PolicyChanged・ClaimsRefresh failure
 *                     (security event: alert + entity freeze + manual authorization before any replay)
 *                     [GEMINI.md §4: auto-replay FORBIDDEN for SECURITY_BLOCK]
 *
 * The infra.outbox-relay worker attaches a `dlqLevel` to every entry it routes to the DLQ
 * so that DLQ consumers can enforce the correct replay policy without inspecting the
 * event payload again.
 *
 * Invariant: WalletDeducted MUST NOT be auto-replayed — double-deduction risk.
 * Invariant: RoleChanged/PolicyChanged MUST route to SECURITY_BLOCK — not REVIEW_REQUIRED.
 *            [logic-overview.md VS2 ACC_OUTBOX, GEMINI.md §4]
 * Invariant: ClaimsRefresh failure MUST trigger security alert and account freeze.
 */

/** The three DLQ safety tiers defined by v9 [R5]. */
export type DlqLevel = 'SAFE_AUTO' | 'REVIEW_REQUIRED' | 'SECURITY_BLOCK';

/**
 * A single entry in the Dead-Letter Queue.
 *
 * `originalEnvelopeJson` preserves the exact bytes of the failed event so that
 * replay can re-submit it with the original `idempotencyKey` intact [D8].
 */
export interface DlqEntry {
  /** Unique DLQ entry identifier. */
  readonly dlqId: string;
  /** Safety tier — determines replay policy. */
  readonly dlqLevel: DlqLevel;
  /** The outbox/OUTBOX lane this event originated from. */
  readonly sourceLane: string;
  /** Serialized original EventEnvelope (preserves idempotencyKey for replay). */
  readonly originalEnvelopeJson: string;
  /** ISO 8601 timestamp of when the event first failed. */
  readonly firstFailedAt: string;
  /** Number of delivery attempts made before entering DLQ. */
  readonly attemptCount: number;
  /** Human-readable reason for the last failure. */
  readonly lastError: string;
}

/**
 * Maps an event type to its DLQ safety tier. [R5]
 *
 * Any event type not in this map defaults to SAFE_AUTO — add entries
 * explicitly when a new high-risk event type is introduced.
 */
const EVENT_TYPE_DLQ_LEVEL: Readonly<Record<string, DlqLevel>> = {
  // SECURITY_BLOCK: security events — alert + entity freeze + manual authorization before any replay.
  // [logic-overview.md VS2 ACC_OUTBOX] [GEMINI.md §4: auto-replay FORBIDDEN]
  'identity:claims:refreshFailed': 'SECURITY_BLOCK',
  'account:role:changed': 'SECURITY_BLOCK',
  'account:policy:changed': 'SECURITY_BLOCK',

  // REVIEW_REQUIRED: financial and irreversible assignment events must not auto-replay.
  'account:wallet:deducted': 'REVIEW_REQUIRED',
  'account:wallet:credited': 'REVIEW_REQUIRED',
  'organization:schedule:assigned': 'REVIEW_REQUIRED',
  'organization:role:changed': 'REVIEW_REQUIRED',

  // SAFE_AUTO: compensating / lifecycle events are idempotent — safe to auto-retry.
  // Per logic-overview.md VS6 SCHED_OUTBOX: "Compensating Events → SAFE_AUTO".
  'organization:schedule:completed': 'SAFE_AUTO',
  'organization:schedule:assignmentCancelled': 'SAFE_AUTO',
  'organization:schedule:assignRejected': 'SAFE_AUTO',
};

/**
 * Returns the DLQ tier for a given event type.
 *
 * Defaults to SAFE_AUTO for unknown/unlisted event types (e.g. TagLifecycle,
 * MemberJoined) which are idempotent and safe to auto-retry.
 */
export function getDlqLevel(eventType: string): DlqLevel {
  return EVENT_TYPE_DLQ_LEVEL[eventType] ?? 'SAFE_AUTO';
}
