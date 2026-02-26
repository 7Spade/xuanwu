/**
 * infra.gateway-query — Public API
 *
 * [GW] Query Gateway — unified read entry point. [Q8][P4][R7]
 *
 * Per logic-overview.md GW_QUERY:
 *   read-model-registry: version comparison / snapshot routing
 *   QGWAY_SCHED  → projection.org-eligible-member-view  [#14][#15][#16][P4][R7]
 *   QGWAY_NOTIF  → projection.account-view             [#6 FCM Token]
 *   QGWAY_SCOPE  → projection.workspace-scope-guard-view [#A9]
 *   QGWAY_WALLET → projection.wallet-balance (STRONG_READ [Q8][D5])
 *
 * Usage (Server Component data fetching):
 *   import { executeQuery, QUERY_ROUTES } from '@/features/infra.gateway-query';
 *
 *   const members = await executeQuery(QUERY_ROUTES.ORG_ELIGIBLE_MEMBERS, { orgId });
 *
 * Usage (projection slice registration):
 *   import { registerQuery, QUERY_ROUTES } from '@/features/infra.gateway-query';
 *
 *   registerQuery(QUERY_ROUTES.ACCOUNT_VIEW, getAccountView, '[#6] FCM token');
 */

export { registerQuery, executeQuery, listRegisteredQueries, QUERY_ROUTES } from './_registry';
export type { QueryRouteName } from './_registry';
