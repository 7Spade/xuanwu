/**
 * shared.kernel.read-consistency — SK_READ_CONSISTENCY [S3]
 *
 * Per logic-overview.md [S3]:
 *   精確交易 → 回源 Aggregate；顯示/統計 → Projection
 *   是可重用的全域讀模式規則
 *
 *   STRONG_READ  → Domain Aggregate（強一致，回源，不依賴 Projection 狀態）
 *   EVENTUAL_READ → Projection（最終一致，高效，允許短暫落後）
 *
 *   決策規則：涉及金融/安全/不可逆操作 → STRONG_READ
 *   其餘顯示場景 → EVENTUAL_READ
 *
 * Use cases that must use STRONG_READ:
 *   - Wallet balance for transaction (account-user.wallet) [D5]
 *   - Authorization/permission check (infra.gateway-command)
 *   - Schedule conflict detection (workspace-business.schedule)
 *
 * Invariant: Zero infrastructure dependencies (no Firebase, no React, no I/O).
 */

/**
 * Read consistency mode. [S3]
 *
 * STRONG_READ   — source-of-truth read from Domain Aggregate.
 *                 Guarantees strong consistency at the cost of higher latency.
 *                 Required for financial, security, and irreversible operations.
 *
 * EVENTUAL_READ — read from Projection (read model).
 *                 High efficiency; accepts short staleness window.
 *                 Suitable for display, statistics, and list views.
 */
export type ReadConsistencyMode = 'STRONG_READ' | 'EVENTUAL_READ';

/**
 * Decision input for read consistency routing. [S3]
 */
export interface ReadConsistencyContext {
  /** True when the operation involves financial data (wallet balance, transactions). */
  readonly isFinancial: boolean;
  /** True when the operation involves security decisions (auth, claims, ACL). */
  readonly isSecurity: boolean;
  /** True when the operation is irreversible (deduction, assignment). */
  readonly isIrreversible: boolean;
}

/**
 * Determine the required read consistency mode for a given operation context. [S3]
 *
 * Returns STRONG_READ when any safety condition is true;
 * returns EVENTUAL_READ otherwise (safe for display/statistics).
 */
export function resolveReadConsistency(
  ctx: ReadConsistencyContext,
): ReadConsistencyMode {
  if (ctx.isFinancial || ctx.isSecurity || ctx.isIrreversible) {
    return 'STRONG_READ';
  }
  return 'EVENTUAL_READ';
}

/**
 * Marker interface — read paths declare their consistency mode. [S3]
 */
export interface ImplementsReadConsistency {
  readonly readConsistencyMode: ReadConsistencyMode;
}
