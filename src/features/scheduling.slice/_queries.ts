/**
 * scheduling.slice — _queries.ts
 *
 * Read-only queries for the VS6 Scheduling domain.
 * Single source of truth: accounts/{orgId}/schedule_items
 *
 * QGWAY_SCHED [#14 #15 #16]:
 *   Eligible-member queries route through projection.org-eligible-member-view
 *   via the QGWAY_SCHED channel only.  scheduling.slice must NOT query
 *   Firestore for member eligibility directly (D7 cross-slice isolation).
 */

import {
  getOrgMemberEligibilityWithTier,
  getOrgEligibleMembersWithTier,
  type OrgEligibleMemberView,
  type OrgMemberSkillWithTier,
} from '@/features/projection.bus';
import type { ImplementsStalenessContract } from '@/features/shared-kernel';
import { db } from '@/shared/infra/firestore/firestore.client';
import { getScheduleItems as getScheduleItemsFacade } from '@/shared/infra/firestore/firestore.facade';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  type Unsubscribe,
  type QueryDocumentSnapshot,
  type QuerySnapshot,
} from '@/shared/infra/firestore/firestore.read.adapter';
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
import type { ScheduleItem, ScheduleStatus } from '@/shared/types';

import type { AccountScheduleProjection, AccountScheduleAssignment } from './_projectors/account-schedule';

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
  return getScheduleItemsFacade(accountId, workspaceId);
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
  return getDocument<ScheduleItem>(`accounts/${orgId}/schedule_items/${scheduleItemId}`);
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
  const ref = collection(db, `accounts/${orgId}/schedule_items`);
  const constraints: Parameters<typeof query>[1][] = [orderBy('createdAt', 'desc')];
  if (opts?.status) constraints.push(where('status', '==', opts.status));
  if (opts?.maxItems) constraints.push(limit(opts.maxItems));
  const q = query(ref, ...constraints);
  return onSnapshot(q, (snap) => {
    onUpdate(snap.docs.map((d) => ({ ...d.data(), id: d.id } as ScheduleItem)));
  });
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
  const col = collection(db, `accounts/${orgId}/schedule_items`);
  const q = query(col, where('status', 'in', ['PROPOSAL', 'OFFICIAL']));
  const snap = await getDocs(q);
  return snap.docs.map((d: QueryDocumentSnapshot) => ({ ...d.data(), id: d.id } as ScheduleItem));
}

/**
 * Real-time subscription for the Demand Board (PROPOSAL + OFFICIAL only).
 */
export function subscribeToDemandBoard(
  orgId: string,
  onChange: (items: ScheduleItem[]) => void
): Unsubscribe {
  const col = collection(db, `accounts/${orgId}/schedule_items`);
  const q = query(col, where('status', 'in', ['PROPOSAL', 'OFFICIAL']));
  return onSnapshot(q, (snap: QuerySnapshot) => {
    onChange(snap.docs.map((d: QueryDocumentSnapshot) => ({ ...d.data(), id: d.id } as ScheduleItem)));
  });
}

/**
 * Fetches all schedule items for an org (including REJECTED/COMPLETED), for audit/history.
 */
export async function getAllDemands(orgId: string): Promise<ScheduleItem[]> {
  const col = collection(db, `accounts/${orgId}/schedule_items`);
  const snap = await getDocs(col);
  return snap.docs.map((d: QueryDocumentSnapshot) => ({ ...d.data(), id: d.id } as ScheduleItem));
}

// =================================================================
// Account schedule projection queries
// =================================================================

export async function getAccountScheduleProjection(
  accountId: string
): Promise<AccountScheduleProjection | null> {
  return getDocument<AccountScheduleProjection>(`scheduleProjection/${accountId}`);
}

export async function getAccountActiveAssignments(
  accountId: string
): Promise<AccountScheduleAssignment[]> {
  const projection = await getAccountScheduleProjection(accountId);
  if (!projection) return [];
  return Object.values(projection.assignmentIndex).filter((a) => a.status !== 'completed');
}

// =================================================================
// QGWAY_SCHED — Eligible member queries [#14 #15 #16]
// =================================================================
// All scheduling eligibility reads must pass through these functions.
// Direct Firestore access for member eligibility is forbidden (D7 D24).
// The underlying data source is projection.org-eligible-member-view (L5).

export type { OrgEligibleMemberView, OrgMemberSkillWithTier };

/**
 * Returns the full eligible-member view (with computed skill tiers) for a single
 * org member.  Routing: VS6 → QGWAY_SCHED → projection.org-eligible-member-view.
 *
 * Per logic-overview.md Invariant #14: scheduling reads ORG_ELIGIBLE_MEMBER_VIEW.
 */
export async function getEligibleMemberForSchedule(
  orgId: string,
  accountId: string
): Promise<OrgEligibleMemberView | null> {
  return getOrgMemberEligibilityWithTier(orgId, accountId);
}

/**
 * Returns all eligible members (eligible=true) for an org with computed tiers.
 * Used by the scheduling saga [A5] to find assignable candidates.
 *
 * Routing: VS6 → QGWAY_SCHED → projection.org-eligible-member-view [#14].
 */
export async function getEligibleMembersForSchedule(
  orgId: string
): Promise<OrgEligibleMemberView[]> {
  return getOrgEligibleMembersWithTier(orgId);
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
  const q = query(
    collection(db, 'accounts', dimensionId, 'schedule_items'),
    where('workspaceId', '==', workspaceId),
    orderBy('createdAt', 'desc'),
  );
  return onSnapshot(
    q,
    (snap) =>
      onUpdate(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ScheduleItem)),
    (err) => onError?.(err),
  );
}
