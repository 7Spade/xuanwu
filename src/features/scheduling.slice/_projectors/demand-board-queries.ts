/**
 * scheduling.slice/_projectors — demand-board-queries.ts
 *
 * Read-side queries for the Demand Board projection.
 * Per docs/prd-schedule-workforce-skills.md FR-W0:
 *   - PROPOSAL + OFFICIAL items are visible to org HR (Demand Board view).
 *   - REJECTED / COMPLETED items are hidden from the default board view.
 *
 * Single source of truth: accounts/{orgId}/schedule_items
 * Staleness: PROJ_STALE_DEMAND_BOARD ≤ 5s (SK_STALENESS_CONTRACT).
 */

import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  type Unsubscribe,
  type QueryDocumentSnapshot,
  type QuerySnapshot,
} from 'firebase/firestore';
import { db } from '@/shared/infra/firestore/firestore.client';
import type { ScheduleItem } from '@/shared/types';
import type { ImplementsStalenessContract } from '@/features/shared-kernel/staleness-contract';

/** Demand Board staleness declaration. [S4] */
export const DEMAND_BOARD_STALENESS: ImplementsStalenessContract = {
  stalenessTier: 'DEMAND_BOARD',
} as const;

/**
 * Fetches all visible (PROPOSAL + OFFICIAL) schedule items for a given org.
 * Per FR-W0: REJECTED / COMPLETED items are excluded from the default board.
 */
export async function getActiveDemands(orgId: string): Promise<ScheduleItem[]> {
  const col = collection(db, `accounts/${orgId}/schedule_items`);
  const q = query(col, where('status', 'in', ['PROPOSAL', 'OFFICIAL']));
  const snap = await getDocs(q);
  return snap.docs.map((d: QueryDocumentSnapshot) => ({ ...d.data(), id: d.id } as ScheduleItem));
}

/**
 * Real-time subscription to org schedule items visible on the Demand Board.
 * (PROPOSAL + OFFICIAL only.)
 * Returns an unsubscribe function.
 * Staleness: PROJ_STALE_DEMAND_BOARD ≤ 5s — Firestore onSnapshot satisfies this.
 */
export function subscribeToDemandBoard(
  orgId: string,
  onChange: (items: ScheduleItem[]) => void
): Unsubscribe {
  const col = collection(db, `accounts/${orgId}/schedule_items`);
  const q = query(col, where('status', 'in', ['PROPOSAL', 'OFFICIAL']));
  return onSnapshot(q, (snap: QuerySnapshot) => {
    onChange(
      snap.docs.map((d: QueryDocumentSnapshot) => ({ ...d.data(), id: d.id } as ScheduleItem))
    );
  });
}

/**
 * Fetches all schedule items for an org (including REJECTED/COMPLETED), for audit/history view.
 */
export async function getAllDemands(orgId: string): Promise<ScheduleItem[]> {
  const col = collection(db, `accounts/${orgId}/schedule_items`);
  const snap = await getDocs(col);
  return snap.docs.map((d: QueryDocumentSnapshot) => ({ ...d.data(), id: d.id } as ScheduleItem));
}
