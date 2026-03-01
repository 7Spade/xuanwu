/**
 * account-organization.schedule — _queries.ts
 *
 * Read queries for the org schedule proposal read model.
 * Single source of truth: accounts/{orgId}/schedule_items
 *
 * Per logic-overview.md:
 *   WORKSPACE_OUTBOX → ORGANIZATION_SCHEDULE (writes proposals)
 *   ORGANIZATION_SCHEDULE → (queries expose proposals for org governance UI)
 *
 * Invariant #2: reads only from accounts/{orgId}/schedule_items (ScheduleItem SSOT).
 */

import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/shared/infra/firestore/firestore.client';
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
import type { ScheduleItem, ScheduleStatus } from '@/shared/types';

/**
 * Fetches a single schedule item by orgId + scheduleItemId.
 */
export async function getOrgScheduleItem(
  orgId: string,
  scheduleItemId: string
): Promise<ScheduleItem | null> {
  return getDocument<ScheduleItem>(`accounts/${orgId}/schedule_items/${scheduleItemId}`);
}

/** @deprecated Use getOrgScheduleItem. Kept for backward compatibility. */
export const getOrgScheduleProposal = getOrgScheduleItem;

/**
 * Subscribes to schedule items for a given orgId, optionally filtered by status.
 * Returns an unsubscribe function.
 *
 * Primary consumer: org governance UI (approve/reject pending proposals).
 */
export function subscribeToOrgScheduleProposals(
  orgId: string,
  onUpdate: (items: ScheduleItem[]) => void,
  opts?: {
    status?: ScheduleStatus;
    maxItems?: number;
  }
): Unsubscribe {
  const ref = collection(db, `accounts/${orgId}/schedule_items`);

  const constraints: Parameters<typeof query>[1][] = [
    orderBy('createdAt', 'desc'),
  ];
  if (opts?.status) {
    constraints.push(where('status', '==', opts.status));
  }
  if (opts?.maxItems) {
    constraints.push(limit(opts.maxItems));
  }

  const q = query(ref, ...constraints);

  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => ({ ...d.data(), id: d.id } as ScheduleItem));
    onUpdate(items);
  });
}

/**
 * Subscribes to pending proposals only (status = 'PROPOSAL').
 * Convenience wrapper for the governance approval UI.
 */
export function subscribeToPendingProposals(
  orgId: string,
  onUpdate: (items: ScheduleItem[]) => void
): Unsubscribe {
  return subscribeToOrgScheduleProposals(orgId, onUpdate, { status: 'PROPOSAL' });
}

/**
 * Subscribes to confirmed (OFFICIAL) items only.
 * Used by the governance UI to show active assignments that can be completed. (FR-S6)
 */
export function subscribeToConfirmedProposals(
  orgId: string,
  onUpdate: (items: ScheduleItem[]) => void
): Unsubscribe {
  return subscribeToOrgScheduleProposals(orgId, onUpdate, { status: 'OFFICIAL' });
}
