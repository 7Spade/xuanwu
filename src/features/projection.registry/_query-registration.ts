/**
 * projection.registry — _query-registration.ts
 *
 * Registers all v9 GW_QUERY routes with infra.gateway-query at startup.
 *
 * Per logic-overview_v9.md GW_QUERY subgraph:
 *   QGWAY_SCHED  → projection.org-eligible-member-view  [#14][#15][#16][P4][R7]
 *   QGWAY_NOTIF  → projection.account-view             [#6 FCM Token]
 *   QGWAY_SCOPE  → projection.workspace-scope-guard    [#A9]
 *   QGWAY_WALLET → account-user.wallet (STRONG_READ [Q8][D5])
 *
 * Call registerAllQueryHandlers() once at app startup, after all projection
 * slices are initialized. Follows the same pattern as registerWorkspaceFunnel().
 */

import { registerQuery, QUERY_ROUTES } from '@/features/infra.gateway-query';
import { getOrgEligibleMembersWithTier } from '@/features/projection.org-eligible-member-view';
import { getAccountView } from '@/features/projection.account-view';
import { queryWorkspaceAccess } from '@/features/projection.workspace-scope-guard';
import { getWalletBalance } from '@/features/account-user.wallet';

/**
 * Register all four v9 QUERY_ROUTES with their projection handlers.
 * Returns an array of un-register functions for cleanup (tests / hot-reload).
 */
export function registerAllQueryHandlers(): Array<() => void> {
  const unregOrgEligible = registerQuery(
    QUERY_ROUTES.ORG_ELIGIBLE_MEMBERS,
    ({ orgId }: { orgId: string }) => getOrgEligibleMembersWithTier(orgId),
    '[P4][R7] projection.org-eligible-member-view — schedule eligibility'
  );

  const unregAccountView = registerQuery(
    QUERY_ROUTES.ACCOUNT_VIEW,
    ({ accountId }: { accountId: string }) => getAccountView(accountId),
    '[#6] projection.account-view — FCM token / user profile'
  );

  const unregScopeGuard = registerQuery(
    QUERY_ROUTES.WORKSPACE_SCOPE_GUARD,
    ({ workspaceId, userId }: { workspaceId: string; userId: string }) =>
      queryWorkspaceAccess(workspaceId, userId),
    '[#A9] projection.workspace-scope-guard — scope resolution for CBG_AUTH'
  );

  const unregWallet = registerQuery(
    QUERY_ROUTES.WALLET_BALANCE,
    ({ accountId }: { accountId: string }) => getWalletBalance(accountId),
    '[Q8][D5] account-user.wallet — STRONG_READ balance'
  );

  return [unregOrgEligible, unregAccountView, unregScopeGuard, unregWallet];
}
