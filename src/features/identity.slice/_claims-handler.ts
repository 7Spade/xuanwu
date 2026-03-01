/**
 * identity.slice — _claims-handler.ts
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
 *
 * Architecture note — Dual-path TOKEN_REFRESH_SIGNAL pattern [S6]:
 *   In the current implementation, governance slices (account-governance.role,
 *   account-governance.policy) also write TOKEN_REFRESH_SIGNAL directly to Firestore
 *   as a "fast path" within the same process (zero-latency, no outbox round-trip).
 *   The IER subscriptions below act as a DEFENSIVE / FALLBACK path that handles
 *   role or policy changes arriving through the event bus from external systems
 *   or cross-process flows. Neither path is dead code — they serve different latency
 *   and isolation requirements:
 *     • Governance direct write = same-process, synchronous, low-latency [FAST PATH]
 *     • IER CRITICAL_LANE subscription = cross-process, async, fully audited [FALLBACK]
 *
 *   Migration guidance — when to move to IER-only dispatch:
 *   Consider removing the governance direct writes and routing exclusively through IER when:
 *   (a) outbox relay latency becomes acceptable for token refresh UX (< 500 ms P95), OR
 *   (b) stricter auditability / replay guarantees are required for ALL refresh events.
 *   Migration steps: (1) Remove emitTokenRefreshSignal calls from governance _actions.ts;
 *   (2) publish account:role:changed / account:policy:changed events through the outbox;
 *   (3) verify CLAIMS_HANDLER subscriptions here fire reliably in load testing.
 *   After migration, this handler becomes the sole claims dispatcher as the invariant states.
 */

import { logDomainError } from '@/features/observability';
import type { EventEnvelope } from '@/features/shared-kernel/event-envelope';
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
    throw new Error(`Invalid accountId format — must match /^[\\w-]+$/`);
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
      source: 'identity.slice:claims-handler',
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
      source: 'identity.slice:claims-handler',
      message: `SECURITY_BLOCK — ClaimsRefresh failed for account "${accountId}": ${message}`,
      detail: `eventType=${envelope.eventType} eventId=${envelope.eventId}`,
    });
  }
}

// ---------------------------------------------------------------------------
// Public — registration
// ---------------------------------------------------------------------------
// Public — IER lane type (mirrored from infra.event-router to avoid direct import [D1])
// ---------------------------------------------------------------------------

/** IER delivery lane — mirrors infra.event-router IerLane [D1 compliance].
 *  Keep in sync with `IerLane` in @/features/infra.event-router/_router.ts. */
type IerLane = 'CRITICAL_LANE' | 'STANDARD_LANE' | 'BACKGROUND_LANE';

/**
 * Subscriber registrar function — injected by the caller so that identity.slice
 * does not import infra.event-router directly [D1].
 *
 * Callers (e.g., app bootstrap or infra.* coordinator) should pass
 * `registerSubscriber` from `@/features/infra.event-router`.
 */
export type ClaimsSubscriberRegistrar = (
  eventType: string,
  handler: (envelope: EventEnvelope) => Promise<void>,
  lane: IerLane
) => () => void;

/**
 * Registers the CLAIMS_HANDLER on IER CRITICAL_LANE for all Claims refresh triggers.
 *
 * Must be called ONCE at app startup (e.g., in app-provider or root layout server init).
 * Returns an unsubscribe function for cleanup.
 *
 * The `registerFn` parameter is the IER `registerSubscriber` function, injected by the
 * caller to avoid a direct infra.event-router import from this domain slice [D1].
 *
 * Example:
 *   import { registerSubscriber } from '@/features/infra.event-router';
 *   import { registerClaimsHandler } from '@/features/identity.slice';
 *   const unsub = registerClaimsHandler(registerSubscriber);
 *
 * Covered trigger event types [SK_TOKEN_REFRESH_CONTRACT]:
 *   - `account:role:changed`   → RoleChanged trigger
 *   - `account:policy:changed` → PolicyChanged trigger
 */
export function registerClaimsHandler(registerFn: ClaimsSubscriberRegistrar): () => void {
  const unsubRoleChanged = registerFn(
    'account:role:changed',
    handleClaimsRefreshTrigger,
    'CRITICAL_LANE'
  );

  const unsubPolicyChanged = registerFn(
    'account:policy:changed',
    handleClaimsRefreshTrigger,
    'CRITICAL_LANE'
  );

  return () => {
    unsubRoleChanged();
    unsubPolicyChanged();
  };
}
