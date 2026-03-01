/**
 * scheduling.slice — _queries.ts
 *
 * Read-only queries for the VS6 Scheduling domain.
 * Single source of truth: accounts/{orgId}/schedule_items
 */

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
} from 'firebase/firestore';
import { db } from '@/shared/infra/firestore/firestore.client';
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
import { getScheduleItems as getScheduleItemsFacade } from '@/shared/infra/firestore/firestore.facade';
import type { ScheduleItem, ScheduleStatus } from '@/shared/types';
import type { ImplementsStalenessContract } from '@/features/shared.kernel.staleness-contract';
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
