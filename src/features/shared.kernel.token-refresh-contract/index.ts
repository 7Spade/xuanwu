/**
 * shared.kernel.token-refresh-contract — Public API
 *
 * SK_TOKEN_REFRESH_CONTRACT [S6] — Claims refresh three-way handshake protocol.
 *
 * Per logic-overview.md [S6]:
 *   Shared by VS1 (emitter), IER (router), and frontend (consumer).
 *   Trigger: RoleChanged | PolicyChanged → IER CRITICAL_LANE → CLAIMS_HANDLER
 *   Signal:  TOKEN_REFRESH_SIGNAL (on success)
 *   Failure: DLQ SECURITY_BLOCK → DOMAIN_ERRORS alert
 *
 * Invariant: Zero infrastructure dependencies (no Firebase, no React, no I/O).
 */

export type {
  ClaimsRefreshTrigger,
  TokenRefreshSignal,
  ClaimsRefreshOutcome,
  ClaimsRefreshHandshake,
  ClientTokenRefreshObligation,
  ImplementsTokenRefreshContract,
} from './token-refresh-contract';

export {
  TOKEN_REFRESH_SIGNAL,
  CLIENT_TOKEN_REFRESH_OBLIGATION,
} from './token-refresh-contract';
