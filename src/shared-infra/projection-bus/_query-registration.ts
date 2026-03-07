/**
 * projection-bus — _query-registration.ts
 *
 * Registers all v9 GW_QUERY routes with infra.gateway-query at startup.
 *
 * Per 00-LogicOverview.md GW_QUERY subgraph:
 *   QGWAY_SCHED  → projection-bus/org-eligible-member-view  [#14][#15][#16][P4][R7]
 *   QGWAY_NOTIF  → projection-bus/account-view             [#6 FCM Token]
 *   QGWAY_SCOPE  → projection-bus/workspace-scope-guard    [#A9]
 *   QGWAY_WALLET → projection-bus/wallet-balance (EVENTUAL_READ [Q8][D5])
 *
 * Call registerAllQueryHandlers() once at app startup, after all projection
 * slices are initialized. Follows the same pattern as registerWorkspaceFunnel().
 */

import { registerQuery, QUERY_ROUTES } from '@/shared-infra/gateway-query';

import { getAccountView } from './account-view';
import { getOrgEligibleMembersWithTier } from './org-eligible-member-view';
import { getDisplayWalletBalance } from './wallet-balance';
import { queryWorkspaceAccess } from './workspace-scope-guard';

/**
 * Register all four v9 QUERY_ROUTES with their projection handlers.
 *
 * Call once at app startup after all projection slices are initialized,
 * following the same pattern as registerWorkspaceFunnel().
 * Calling this multiple times is safe — registerQuery() overwrites any
 * existing handler with the same name.
 *
 * @returns Array of un-register functions for cleanup in tests or hot-reload.
 */
export function registerAllQueryHandlers(): Array<() => void> {
  const unregOrgEligible = registerQuery(
    QUERY_ROUTES.ORG_ELIGIBLE_MEMBERS,
    ({ orgId }: { orgId: string }) => getOrgEligibleMembersWithTier(orgId),
    '[P4][R7] projection-bus/org-eligible-member-view — schedule eligibility'
  );

  const unregAccountView = registerQuery(
    QUERY_ROUTES.ACCOUNT_VIEW,
    ({ accountId }: { accountId: string }) => getAccountView(accountId),
    '[#6] projection-bus/account-view — FCM token / user profile'
  );

  const unregScopeGuard = registerQuery(
    QUERY_ROUTES.WORKSPACE_SCOPE_GUARD,
    ({ workspaceId, userId }: { workspaceId: string; userId: string }) =>
      queryWorkspaceAccess(workspaceId, userId),
    '[#A9] projection-bus/workspace-scope-guard — scope resolution for CBG_AUTH'
  );

  const unregWallet = registerQuery(
    QUERY_ROUTES.WALLET_BALANCE,
    ({ accountId }: { accountId: string }) => getDisplayWalletBalance(accountId),
    '[Q8][D5] projection-bus/wallet-balance — EVENTUAL_READ display balance'
  );

  return [unregOrgEligible, unregAccountView, unregScopeGuard, unregWallet];
}
