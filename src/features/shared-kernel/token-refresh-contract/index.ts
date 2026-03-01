/**
 * shared.kernel/token-refresh-contract — SK_TOKEN_REFRESH_CONTRACT [S6]
 *
 * VS0 Shared Kernel: Claims refresh three-way handshake protocol.
 *
 * Per logic-overview.md [S6]:
 *   Claims refresh spans three parties — VS1, IER, and the frontend client.
 *   It is NOT internal to VS1 alone.
 *
 *   Trigger : RoleChanged | PolicyChanged event
 *   Lane    : IER CRITICAL_LANE → CLAIMS_HANDLER (VS1)
 *   Signal  : TOKEN_REFRESH_SIGNAL (emitted after successful Claims write)
 *   Client  : MUST force-refresh Firebase Token on receiving the signal
 *   Failure : DLQ SECURITY_BLOCK → DOMAIN_ERRORS alert → aggregate frozen
 *
 * Rule: All three parties (VS1, IER, frontend) MUST reference this single contract.
 *   Do NOT declare TOKEN_REFRESH_SIGNAL or ClaimsRefreshTrigger locally in any party.
 *   Any change to Claims refresh logic MUST update all three parties simultaneously [D18].
 *
 * Dependency rule: ZERO infrastructure imports (no Firebase, no React, no I/O).
 */

// ─── Trigger events ───────────────────────────────────────────────────────────

/**
 * Domain events that trigger a Claims refresh cycle. [S6]
 *
 * These MUST be routed via IER CRITICAL_LANE to the CLAIMS_HANDLER.
 * Any new event that changes effective permissions MUST be added here.
 */
export type ClaimsRefreshTrigger = 'RoleChanged' | 'PolicyChanged';

// ─── Signal ───────────────────────────────────────────────────────────────────

/**
 * Signal emitted after Claims are successfully written. [S6]
 *
 * All three parties respond to this signal:
 *   VS1  — records outcome, updates audit log
 *   IER  — routes failure to DLQ SECURITY_BLOCK
 *   Client — force-refreshes Firebase Token (ClientTokenRefreshObligation)
 */
export const TOKEN_REFRESH_SIGNAL = 'TOKEN_REFRESH_SIGNAL' as const;
export type TokenRefreshSignal = typeof TOKEN_REFRESH_SIGNAL;

// ─── Handshake lifecycle ──────────────────────────────────────────────────────

/** Outcome of a single Claims refresh attempt. [S6] */
export type ClaimsRefreshOutcome = 'success' | 'failure';

/**
 * Metadata record for a single Claims refresh handshake cycle. [S6]
 *
 * VS1 emits this when CLAIMS_HANDLER completes (success or failure).
 * IER routes failure outcomes to DLQ SECURITY_BLOCK.
 */
export interface ClaimsRefreshHandshake {
  readonly trigger: ClaimsRefreshTrigger;
  readonly accountId: string;
  readonly outcome: ClaimsRefreshOutcome;
  readonly completedAt: string;
  /** [R8] TraceID from the originating command chain — must be propagated. */
  readonly traceId: string;
}

// ─── Client obligation ────────────────────────────────────────────────────────

/**
 * Client-side obligation upon receiving TOKEN_REFRESH_SIGNAL. [S6]
 *
 * The frontend MUST:
 *   1. Force-refresh the Firebase ID token.
 *   2. Re-attach the new token to all subsequent requests.
 */
export interface ClientTokenRefreshObligation {
  readonly signal: TokenRefreshSignal;
  readonly action: 'force_refresh_and_reattach';
}

/** Canonical client obligation constant. [S6] */
export const CLIENT_TOKEN_REFRESH_OBLIGATION: ClientTokenRefreshObligation = {
  signal: TOKEN_REFRESH_SIGNAL,
  action: 'force_refresh_and_reattach',
} as const;

// ─── Conformance marker ───────────────────────────────────────────────────────

/**
 * Marker interface — VS1, IER, and frontend implementations declare conformance. [S6]
 */
export interface ImplementsTokenRefreshContract {
  readonly implementsTokenRefreshContract: true;
}
