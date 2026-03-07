/**
 * projection.bus — _query-registration.ts
 *
 * Registers all v9 GW_QUERY routes with infra.gateway-query at startup.
 *
 * Per 00-LogicOverview.md GW_QUERY subgraph:
 *   QGWAY_SCHED     → projection.org-eligible-member-view  [#14][#15][#16][P4][R7]
 *   QGWAY_NOTIF     → projection.account-view              [#6 FCM Token]
 *   QGWAY_SCOPE     → projection.workspace-scope-guard     [#A9]
 *   QGWAY_WALLET    → projection.wallet-balance (EVENTUAL_READ [Q8][D5])
 *   QGWAY_CAL       → projection.schedule-calendar-view    [S4] 日期維度
 *   QGWAY_TL        → projection.schedule-timeline-view    [S4] 資源維度
 *   QGWAY_SEM_GOV   → projection.semantic-governance-view  [A6] 治理頁
 *
 * Call registerAllQueryHandlers() once at app startup, after all projection
 * slices are initialized. Follows the same pattern as registerWorkspaceFunnel().
 */

import { registerQuery, QUERY_ROUTES } from '@/shared-infra/gateway-query';

import { getAccountView } from './account-view';
import { getOrgEligibleMembersWithTier } from './org-eligible-member-view';
import { getAllScheduleCalendarDays, getScheduleCalendarDay } from './schedule-calendar-view';
import { getAllScheduleTimelines, getScheduleTimelineForMember } from './schedule-timeline-view';
import { getSemanticGovernanceView } from './semantic-governance-view';
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
    ({ accountId }: { accountId: string }) => getDisplayWalletBalance(accountId),
    '[Q8][D5] projection.wallet-balance — EVENTUAL_READ display balance'
  );

  const unregCalendar = registerQuery(
    QUERY_ROUTES.SCHEDULE_CALENDAR,
    ({ orgId, dateKey }: { orgId: string; dateKey?: string }) =>
      dateKey
        ? getScheduleCalendarDay(orgId, dateKey)
        : getAllScheduleCalendarDays(orgId),
    '[S4] projection.schedule-calendar-view — 日期維度 (UI 禁止直讀 VS6/Firebase)'
  );

  const unregTimeline = registerQuery(
    QUERY_ROUTES.SCHEDULE_TIMELINE,
    ({ orgId, memberId }: { orgId: string; memberId?: string }) =>
      memberId
        ? getScheduleTimelineForMember(orgId, memberId)
        : getAllScheduleTimelines(orgId),
    '[S4] projection.schedule-timeline-view — 資源維度 (overlap/grouping 已預計算)'
  );

  const unregSemanticGov = registerQuery(
    QUERY_ROUTES.SEMANTIC_GOVERNANCE,
    ({ tagSlug }: { tagSlug: string }) => getSemanticGovernanceView(tagSlug),
    '[A6] projection.semantic-governance-view — 語義治理頁讀模型 (提案/共識/關係)'
  );

  return [unregOrgEligible, unregAccountView, unregScopeGuard, unregWallet, unregCalendar, unregTimeline, unregSemanticGov];
}
