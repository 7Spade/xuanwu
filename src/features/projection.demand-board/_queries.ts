/**
 * projection.demand-board — _queries.ts
 *
 * Read-side queries for the Demand Board projection.
 * Per docs/prd-schedule-workforce-skills.md FR-W0:
 *   - Open + assigned demands are visible to org HR (Demand Board view).
 *   - Closed demands are hidden from the default board view.
 *
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
import type { ScheduleDemand } from '@/shared/types';
import type { ImplementsStalenessContract } from '@/features/shared.kernel.staleness-contract';

/** Demand Board staleness declaration. [S4] */
export const DEMAND_BOARD_STALENESS: ImplementsStalenessContract = {
  stalenessTier: 'DEMAND_BOARD',
} as const;

/**
 * Fetches all visible (open + assigned) demands for a given org.
 * Per FR-W0: closed demands are excluded from the default board.
 */
export async function getActiveDemands(orgId: string): Promise<ScheduleDemand[]> {
  const col = collection(db, `orgDemandBoard/${orgId}/demands`);
  const q = query(col, where('status', 'in', ['open', 'assigned']));
  const snap = await getDocs(q);
  return snap.docs.map((d: QueryDocumentSnapshot) => d.data() as ScheduleDemand);
}

/**
 * Real-time subscription to the org Demand Board (open + assigned only).
 * Returns an unsubscribe function.
 * Staleness: PROJ_STALE_DEMAND_BOARD ≤ 5s — Firestore onSnapshot satisfies this.
 */
export function subscribeToDemandBoard(
  orgId: string,
  onChange: (demands: ScheduleDemand[]) => void
): Unsubscribe {
  const col = collection(db, `orgDemandBoard/${orgId}/demands`);
  const q = query(col, where('status', 'in', ['open', 'assigned']));
  return onSnapshot(q, (snap: QuerySnapshot) => {
    onChange(snap.docs.map((d: QueryDocumentSnapshot) => d.data() as ScheduleDemand));
  });
}

/**
 * Fetches all demands for an org (including closed), for audit/history view.
 */
export async function getAllDemands(orgId: string): Promise<ScheduleDemand[]> {
  const col = collection(db, `orgDemandBoard/${orgId}/demands`);
  const snap = await getDocs(col);
  return snap.docs.map((d: QueryDocumentSnapshot) => d.data() as ScheduleDemand);
}
