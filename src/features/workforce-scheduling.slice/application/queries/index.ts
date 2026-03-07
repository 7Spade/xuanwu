/**
 * workforce-scheduling.slice ??_queries.ts
 *
 * Read-only queries for the VS6 Scheduling domain.
 * Single source of truth: accounts/{orgId}/schedule_items
 *
 * QGWAY_SCHED [#14 #15 #16]:
 *   Eligible-member queries route through projection.org-eligible-member-view
 *   via the QGWAY_SCHED channel only.  workforce-scheduling.slice must NOT query
 *   Firestore for member eligibility directly (D7 cross-slice isolation).
 */

import {
  getScheduleItemsFromGateway,
  getOrgScheduleItemFromGateway,
  subscribeToOrgScheduleProposalsFromGateway,
  getActiveDemandsFromGateway,
  subscribeToDemandBoardFromGateway,
  getAllDemandsFromGateway,
  getAccountScheduleProjectionRawFromGateway,
  getEligibleMemberForScheduleFromGateway,
  getEligibleMembersForScheduleFromGateway,
  subscribeToWorkspaceScheduleItemsFromGateway,
  type OrgEligibleMemberView,
  type OrgMemberSkillWithTier,
} from '@/shared-infra/gateway-query';
import type { ScheduleItem, ScheduleStatus } from '@/shared-kernel';
import type { ImplementsStalenessContract } from '@/shared-kernel';

import type { AccountScheduleProjection, AccountScheduleAssignment } from './_projectors/account-schedule';

type Unsubscribe = () => void;

// =================================================================
// Staleness declarations [S4]
// =================================================================

export const DEMAND_BOARD_STALENESS: ImplementsStalenessContract = {
  stalenessTier: 'DEMAND_BOARD',
} as const;

// =================================================================
// Workspace-scoped queries
// =================================================================

/**
 * Fetches all schedule items for an account, optionally filtered by workspace.
 */
export async function getScheduleItems(
  accountId: string,
  workspaceId?: string
): Promise<ScheduleItem[]> {
  return getScheduleItemsFromGateway(accountId, workspaceId);
}

// =================================================================
// Org-scoped single-item lookup
// =================================================================

/**
 * Fetches a single schedule item by orgId + scheduleItemId.
 */
export async function getOrgScheduleItem(
  orgId: string,
  scheduleItemId: string
): Promise<ScheduleItem | null> {
  return getOrgScheduleItemFromGateway(orgId, scheduleItemId);
}

/** @deprecated Use getOrgScheduleItem. */
export const getOrgScheduleProposal = getOrgScheduleItem;

// =================================================================
// Org-scoped subscriptions (real-time)
// =================================================================

/**
 * Subscribes to schedule items for a given orgId, optionally filtered by status.
 */
export function subscribeToOrgScheduleProposals(
  orgId: string,
  onUpdate: (items: ScheduleItem[]) => void,
  opts?: { status?: ScheduleStatus; maxItems?: number }
): Unsubscribe {
  return subscribeToOrgScheduleProposalsFromGateway(orgId, onUpdate, opts);
}

export function subscribeToPendingProposals(
  orgId: string,
  onUpdate: (items: ScheduleItem[]) => void
): Unsubscribe {
  return subscribeToOrgScheduleProposals(orgId, onUpdate, { status: 'PROPOSAL' });
}

export function subscribeToConfirmedProposals(
  orgId: string,
  onUpdate: (items: ScheduleItem[]) => void
): Unsubscribe {
  return subscribeToOrgScheduleProposals(orgId, onUpdate, { status: 'OFFICIAL' });
}

// =================================================================
// Demand Board queries (FR-W0)
// =================================================================

/**
 * Fetches all visible (PROPOSAL + OFFICIAL) schedule items for a given org.
 */
export async function getActiveDemands(orgId: string): Promise<ScheduleItem[]> {
  return getActiveDemandsFromGateway(orgId);
}

/**
 * Real-time subscription for the Demand Board (PROPOSAL + OFFICIAL only).
 */
export function subscribeToDemandBoard(
  orgId: string,
  onChange: (items: ScheduleItem[]) => void
): Unsubscribe {
  return subscribeToDemandBoardFromGateway(orgId, onChange);
}

/**
 * Fetches all schedule items for an org (including REJECTED/COMPLETED), for audit/history.
 */
export async function getAllDemands(orgId: string): Promise<ScheduleItem[]> {
  return getAllDemandsFromGateway(orgId);
}

// =================================================================
// Account schedule projection queries
// =================================================================

export async function getAccountScheduleProjection(
  accountId: string
): Promise<AccountScheduleProjection | null> {
  const raw = await getAccountScheduleProjectionRawFromGateway(accountId);
  return raw as AccountScheduleProjection | null;
}

export async function getAccountActiveAssignments(
  accountId: string
): Promise<AccountScheduleAssignment[]> {
  const projection = await getAccountScheduleProjection(accountId);
  if (!projection) return [];
  return Object.values(projection.assignmentIndex).filter((a) => a.status !== 'completed');
}

// =================================================================
// QGWAY_SCHED ??Eligible member queries [#14 #15 #16]
// =================================================================
// All scheduling eligibility reads must pass through these functions.
// Direct Firestore access for member eligibility is forbidden (D7 D24).
// The underlying data source is projection.org-eligible-member-view (L5).

export type { OrgEligibleMemberView, OrgMemberSkillWithTier };

/**
 * Returns the full eligible-member view (with computed skill tiers) for a single
 * org member.  Routing: VS6 ??QGWAY_SCHED ??projection.org-eligible-member-view.
 *
 * Per 00-LogicOverview.md Invariant #14: scheduling reads ORG_ELIGIBLE_MEMBER_VIEW.
 */
export async function getEligibleMemberForSchedule(
  orgId: string,
  accountId: string
): Promise<OrgEligibleMemberView | null> {
  return getEligibleMemberForScheduleFromGateway(orgId, accountId);
}

/**
 * Returns all eligible members (eligible=true) for an org with computed tiers.
 * Used by the scheduling saga [A5] to find assignable candidates.
 *
 * Routing: VS6 ??QGWAY_SCHED ??projection.org-eligible-member-view [#14].
 */
export async function getEligibleMembersForSchedule(
  orgId: string
): Promise<OrgEligibleMemberView[]> {
  return getEligibleMembersForScheduleFromGateway(orgId);
}

// =================================================================
// Workspace-scoped schedule_items subscription
// =================================================================

/**
 * Opens a real-time listener on schedule_items filtered to a specific workspace.
 * Used by workspace-facing hooks that need live schedule state regardless of
 * which account is currently active (personal vs org).
 *
 * Path: accounts/{dimensionId}/schedule_items where workspaceId == workspaceId
 */
export function subscribeToWorkspaceScheduleItems(
  dimensionId: string,
  workspaceId: string,
  onUpdate: (items: ScheduleItem[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  return subscribeToWorkspaceScheduleItemsFromGateway(
    dimensionId,
    workspaceId,
    onUpdate,
    onError,
  );
}
