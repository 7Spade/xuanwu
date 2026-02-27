/**
 * identity-account.auth — _token-refresh-listener.ts
 *
 * Frontend Party [S6] — Client Token Refresh Listener
 *
 * Per logic-overview.md [S6] three-way Claims refresh handshake:
 *   Party 1 (VS1) — CLAIMS_HANDLER emits TOKEN_REFRESH_SIGNAL to `tokenRefreshSignals/{accountId}`
 *   Party 2 (IER) — routes RoleChanged / PolicyChanged via CRITICAL_LANE to CLAIMS_HANDLER
 *   Party 3 (Frontend — this file) — listens for TOKEN_REFRESH_SIGNAL and force-refreshes token
 *
 * Client obligation per SK_TOKEN_REFRESH_CONTRACT:
 *   On receiving TOKEN_REFRESH_SIGNAL → getIdToken(true) → new token attached to requests
 *
 * Invariant: this listener MUST be mounted once per authenticated session in the shell layout.
 */

import { useEffect } from 'react';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '@/shared/infra/firestore/firestore.client';
import { auth } from '@/shared/infra/auth/auth.client';
import type { ImplementsTokenRefreshContract } from '@/features/shared.kernel.token-refresh-contract';

// Marker — confirms this module fulfils Party 3 of the SK_TOKEN_REFRESH_CONTRACT [S6]
const _contractConformance: ImplementsTokenRefreshContract = {
  implementsTokenRefreshContract: true,
};
void _contractConformance;

/**
 * React hook — mounts an onSnapshot listener on `tokenRefreshSignals/{accountId}`.
 * When the document changes (TOKEN_REFRESH_SIGNAL received), force-refreshes the
 * Firebase ID token so subsequent requests carry updated Custom Claims.
 *
 * Call once per authenticated session (e.g. in (shell)/layout.tsx).
 *
 * @param accountId - The authenticated user's account ID, or null/undefined when not signed in.
 */
export function useTokenRefreshListener(accountId: string | null | undefined): void {
  useEffect(() => {
    if (!accountId) return;

    // Guard: accountId must be a valid Firestore document ID
    if (!/^[\w-]+$/.test(accountId)) return;

    const signalRef = doc(db, 'tokenRefreshSignals', accountId);

    // onSnapshot fires on first attach (initial state) and on every subsequent change.
    // We skip the first emission to avoid unnecessary token refreshes on mount.
    let isFirstEmission = true;

    const unsubscribe = onSnapshot(signalRef, () => {
      if (isFirstEmission) {
        isFirstEmission = false;
        return;
      }

      const currentUser = auth.currentUser;
      if (!currentUser) return;

      // [S6] CLIENT_TOKEN_REFRESH_OBLIGATION: force-refresh so subsequent requests
      // carry updated Custom Claims reflecting the new role or policy.
      void currentUser.getIdToken(/* forceRefresh */ true).catch(() => {
        // Non-fatal: the token will be refreshed on the next natural expiry cycle.
        // Governance slices will detect stale claims via DLQ SECURITY_BLOCK if required.
      });
    });

    return () => {
      unsubscribe();
    };
  }, [accountId]);
}
