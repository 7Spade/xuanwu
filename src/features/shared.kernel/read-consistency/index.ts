/**
 * shared.kernel/read-consistency — SK_READ_CONSISTENCY [S3]
 *
 * VS0 Shared Kernel: Unified read-pattern decision contract.
 *
 * Per logic-overview.md [S3]:
 *   STRONG_READ  → Domain Aggregate  (source of truth; strong consistency)
 *   EVENTUAL_READ → Projection       (read model; accepts short staleness window)
 *
 * Decision rule:
 *   financial | security | irreversible → STRONG_READ (mandatory)
 *   display   | statistics | listing   → EVENTUAL_READ (preferred)
 *
 * Enforced at:
 *   — account-user.wallet         (all balance reads) [D5]
 *   — infra.gateway-command       (authorization checks)
 *   — scheduling.slice            (conflict detection)
 *
 * Dependency rule: ZERO infrastructure imports (no Firebase, no React, no I/O).
 */

// ─── Mode ─────────────────────────────────────────────────────────────────────

/**
 * Read consistency mode. [S3]
 *
 * STRONG_READ   — queries the Domain Aggregate directly.
 *                 High latency; guarantees strong consistency.
 *                 Required for any financial, security, or irreversible operation.
 *
 * EVENTUAL_READ — queries the Projection (read model).
 *                 Low latency; accepts staleness within the SK_STALENESS_CONTRACT SLA [S4].
 *                 Suitable for display, statistics, list views.
 */
export type ReadConsistencyMode = 'STRONG_READ' | 'EVENTUAL_READ';

// ─── Decision context ─────────────────────────────────────────────────────────

/**
 * Inputs to the consistency routing decision. [S3]
 */
export interface ReadConsistencyContext {
  /** True when the operation involves financial data (wallet balance, transactions). */
  readonly isFinancial: boolean;
  /** True when the operation involves security decisions (auth, claims, ACL). */
  readonly isSecurity: boolean;
  /** True when the operation is irreversible (deduction, schedule assignment). */
  readonly isIrreversible: boolean;
}

// ─── Resolver ─────────────────────────────────────────────────────────────────

/**
 * Determine the required read consistency mode for a given operation. [S3]
 *
 * Returns STRONG_READ when ANY safety condition is true;
 * returns EVENTUAL_READ otherwise.
 */
export function resolveReadConsistency(ctx: ReadConsistencyContext): ReadConsistencyMode {
  return (ctx.isFinancial || ctx.isSecurity || ctx.isIrreversible)
    ? 'STRONG_READ'
    : 'EVENTUAL_READ';
}

// ─── Conformance marker ───────────────────────────────────────────────────────

/**
 * Marker interface — read-path implementations declare their consistency mode. [S3]
 */
export interface ImplementsReadConsistency {
  readonly readConsistencyMode: ReadConsistencyMode;
}
