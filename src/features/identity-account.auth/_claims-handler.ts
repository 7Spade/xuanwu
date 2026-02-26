/**
 * identity-account.auth — _claims-handler.ts
 *
 * CLAIMS_HANDLER — single Claims refresh trigger point [E6][S6]
 *
 * Per logic-overview.md [S6]:
 *   RoleChanged | PolicyChanged → IER CRITICAL_LANE → CLAIMS_HANDLER
 *   CLAIMS_HANDLER emits TOKEN_REFRESH_SIGNAL on success.
 *   Failure routes to DLQ SECURITY_BLOCK → DOMAIN_ERRORS alert.
 *
 * Three-way handshake parties [SK_TOKEN_REFRESH_CONTRACT S6]:
 *   VS1 (this file) — CLAIMS_HANDLER, emitter of TOKEN_REFRESH_SIGNAL
 *   IER             — routes account:role:changed / account:policy:changed via CRITICAL_LANE
 *   Frontend        — force-refreshes Firebase token on TOKEN_REFRESH_SIGNAL
 *
 * Invariant: This is the ONLY place in VS1 that handles claims refresh dispatch.
 *            Do NOT duplicate this logic elsewhere in the identity slice.
 */

import { registerSubscriber } from '@/features/infra.event-router';
import { logDomainError } from '@/features/infra.observability';
import type { EventEnvelope } from '@/features/shared.kernel.event-envelope';
import { setDocument } from '@/shared/infra/firestore/firestore.write.adapter';

// ---------------------------------------------------------------------------
// Internal — TOKEN_REFRESH_SIGNAL emission
// ---------------------------------------------------------------------------

/**
 * Writes the TOKEN_REFRESH_SIGNAL document that the frontend listens on
 * via `onSnapshot('tokenRefreshSignals/{accountId}')`.
 *
 * On receiving this signal, the frontend MUST force-refresh the Firebase token
 * (getIdToken(true)) so subsequent requests carry updated Claims.
 * Per [SK_TOKEN_REFRESH_CONTRACT: CLIENT_TOKEN_REFRESH_OBLIGATION].
 */
async function emitRefreshSignal(accountId: string, traceId: string): Promise<void> {
  // Guard against path-traversal: accountId must be a safe Firestore document ID
  // (alphanumeric, hyphens, underscores only — no slashes or special chars).
  if (!/^[\w-]+$/.test(accountId)) {
    throw new Error(`Invalid accountId format: "${accountId}" — must match /^[\\w-]+$/`);
  }
  await setDocument(`tokenRefreshSignals/${accountId}`, {
    accountId,
    reason: 'claims:refreshed',
    issuedAt: new Date().toISOString(),
    traceId,
  });
}

// ---------------------------------------------------------------------------
// Internal — CRITICAL_LANE event handler
// ---------------------------------------------------------------------------

/**
 * Processes a claims-refresh trigger event received from IER CRITICAL_LANE.
 *
 * Success path: emits TOKEN_REFRESH_SIGNAL for the affected account.
 * Failure path: logs a SECURITY_BLOCK severity domain error [GEMINI.md §4][S6].
 *               The SECURITY_BLOCK DLQ entry is written by infra.outbox-relay when
 *               `identity:claims:refreshFailed` is emitted; this log provides the alert.
 */
async function handleClaimsRefreshTrigger(envelope: EventEnvelope): Promise<void> {
  const payload = envelope.payload as Record<string, unknown> | undefined;
  const accountId = typeof payload?.accountId === 'string' ? payload.accountId : undefined;
  const traceId = envelope.traceId ?? envelope.eventId;

  if (!accountId) {
    logDomainError({
      occurredAt: new Date().toISOString(),
      traceId,
      source: 'identity-account.auth:claims-handler',
      message: `SECURITY_BLOCK — ClaimsRefresh received event without accountId: eventType="${envelope.eventType}" eventId="${envelope.eventId}"`,
    });
    return;
  }

  try {
    await emitRefreshSignal(accountId, traceId);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // ClaimsRefresh failure → SECURITY_BLOCK alert [S6][GEMINI.md §4]
    logDomainError({
      occurredAt: new Date().toISOString(),
      traceId,
      source: 'identity-account.auth:claims-handler',
      message: `SECURITY_BLOCK — ClaimsRefresh failed for account "${accountId}": ${message}`,
      detail: `eventType=${envelope.eventType} eventId=${envelope.eventId}`,
    });
  }
}

// ---------------------------------------------------------------------------
// Public — registration
// ---------------------------------------------------------------------------

/**
 * Registers the CLAIMS_HANDLER on IER CRITICAL_LANE for all Claims refresh triggers.
 *
 * Must be called ONCE at app startup (e.g., in app-provider or root layout server init).
 * Returns an unsubscribe function for cleanup.
 *
 * Covered trigger event types [SK_TOKEN_REFRESH_CONTRACT]:
 *   - `account:role:changed`   → RoleChanged trigger
 *   - `account:policy:changed` → PolicyChanged trigger
 */
export function registerClaimsHandler(): () => void {
  const unsubRoleChanged = registerSubscriber(
    'account:role:changed',
    handleClaimsRefreshTrigger,
    'CRITICAL_LANE'
  );

  const unsubPolicyChanged = registerSubscriber(
    'account:policy:changed',
    handleClaimsRefreshTrigger,
    'CRITICAL_LANE'
  );

  return () => {
    unsubRoleChanged();
    unsubPolicyChanged();
  };
}
