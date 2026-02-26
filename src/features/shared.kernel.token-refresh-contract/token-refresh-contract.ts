/**
 * shared.kernel.token-refresh-contract — SK_TOKEN_REFRESH_CONTRACT [S6]
 *
 * Per logic-overview_v10.md [S6]:
 *   Claims 刷新是跨 VS1 / IER / 前端 的三方協議，不只是 VS1 內部邏輯
 *
 *   觸發條件：RoleChanged | PolicyChanged → IER CRITICAL_LANE → CLAIMS_HANDLER
 *   完成信號：TOKEN_REFRESH_SIGNAL（Claims 設定完成後發出）
 *   客端義務：收到信號 → 強制重取 Firebase Token → 下次 Request 帶新 Claims
 *   失敗處理：→ DLQ SECURITY_BLOCK → DOMAIN_ERRORS 安全告警
 *
 * v9 problem: TOKEN_REFRESH_SIGNAL was defined in VS1 only, but IER CRITICAL_LANE
 *   and VS9 DOMAIN_ERRORS both referenced it, and frontend handshake lacked a contract.
 *
 * This contract is the single reference point for all three parties (VS1, IER, frontend).
 *
 * Invariant: Zero infrastructure dependencies (no Firebase, no React, no I/O).
 */

/**
 * Events that trigger a Claims refresh cycle. [S6]
 * These MUST be routed via IER CRITICAL_LANE to the CLAIMS_HANDLER.
 */
export type ClaimsRefreshTrigger = 'RoleChanged' | 'PolicyChanged';

/**
 * The handshake signal emitted after Claims are successfully set. [S6]
 * All three parties (VS1, IER, frontend) respond to this signal.
 */
export const TOKEN_REFRESH_SIGNAL = 'TOKEN_REFRESH_SIGNAL' as const;
export type TokenRefreshSignal = typeof TOKEN_REFRESH_SIGNAL;

/**
 * Outcome of a Claims refresh attempt. [S6]
 */
export type ClaimsRefreshOutcome = 'success' | 'failure';

/**
 * Contract metadata for a single Claims refresh handshake cycle. [S6]
 *
 * VS1 emits this when CLAIMS_HANDLER completes (success or failure).
 * IER routes failure to DLQ SECURITY_BLOCK.
 * Frontend responds to TOKEN_REFRESH_SIGNAL by force-refreshing the Firebase token.
 */
export interface ClaimsRefreshHandshake {
  /** The event that triggered the refresh. */
  readonly trigger: ClaimsRefreshTrigger;
  /** Account ID whose Claims were refreshed. */
  readonly accountId: string;
  /** Outcome of the refresh operation. */
  readonly outcome: ClaimsRefreshOutcome;
  /** ISO 8601 timestamp when the handshake completed. */
  readonly completedAt: string;
  /** TraceID for the originating command chain. */
  readonly traceId: string;
}

/**
 * Client-side obligation upon receiving TOKEN_REFRESH_SIGNAL. [S6]
 *
 * Frontend MUST:
 *   1. Force-refresh the Firebase ID token.
 *   2. Attach the new token to all subsequent requests.
 *
 * This interface describes the expected client action contract.
 */
export interface ClientTokenRefreshObligation {
  /** The signal that triggers this obligation. */
  readonly signal: TokenRefreshSignal;
  /** Action: force-refresh Firebase token and re-attach to requests. */
  readonly action: 'force_refresh_and_reattach';
}

/**
 * Canonical client obligation constant. [S6]
 */
export const CLIENT_TOKEN_REFRESH_OBLIGATION: ClientTokenRefreshObligation = {
  signal: TOKEN_REFRESH_SIGNAL,
  action: 'force_refresh_and_reattach',
} as const;

/**
 * Marker interface — parties declare conformance to the three-way handshake. [S6]
 */
export interface ImplementsTokenRefreshContract {
  readonly implementsTokenRefreshContract: true;
}
