/**
 * workforce-scheduling.slice ??_selectors.ts
 *
 * Pure data-derivation functions for the schedule domain.
 *
 * All selectors are plain TypeScript functions with no React dependencies,
 * making them directly unit-testable with Vitest and composable inside any
 * React hook via `useMemo`.
 *
 * Conventions:
 *   - Every selector is a pure function (no side-effects, no I/O).
 *   - Input types deliberately use `Record<string, ??` to decouple from
 *     specific store shapes and improve reusability.
 *   - Generic parameter <M> for members avoids a cross-BC type dependency
 *     on Account while still allowing callers to retain full type information.
 */

import { subDays, isFuture, isWithinInterval, startOfDay, endOfDay } from 'date-fns';

import type { ScheduleItem } from '@/shared-kernel';

// ?€?€?€ View-model types ?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€

/** ScheduleItem enriched with a resolved workspace display name. */
export interface ScheduleItemWithWorkspace extends ScheduleItem {
  workspaceName: string;
}

/** ScheduleItemWithWorkspace further enriched with a typed members array. */
export type ScheduleItemWithMembers<M> = ScheduleItemWithWorkspace & {
  members: M[];
};

// ?€?€?€ Selectors ?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€

/**
 * Enriches every ScheduleItem with the resolved `workspaceName` from the
 * workspaces map.  Unknown workspace ids fall back to "Unknown Workspace".
 */
export function selectAllScheduleItems(
  scheduleItems: Record<string, ScheduleItem>,
  workspaces: Record<string, { name?: string }>
): ScheduleItemWithWorkspace[] {
  return Object.values(scheduleItems ?? {}).map(item => ({
    ...item,
    workspaceName: workspaces[item.workspaceId]?.name ?? 'Unknown Workspace',
  }));
}

/**
 * Returns items that are awaiting org assignment (status === 'PROPOSAL').
 */
export function selectPendingProposals(
  items: ScheduleItemWithWorkspace[]
): ScheduleItemWithWorkspace[] {
  return items.filter(item => item.status === 'PROPOSAL');
}

/**
 * Returns OFFICIAL and REJECTED items updated within the last 7 days, sorted
 * by most-recently-updated first.
 */
export function selectDecisionHistory(
  items: ScheduleItemWithWorkspace[]
): ScheduleItemWithWorkspace[] {
  const sevenDaysAgo = subDays(new Date(), 7);
  return items
    .filter(
      item =>
        (item.status === 'OFFICIAL' || item.status === 'REJECTED') &&
        (item.updatedAt?.toDate() ?? new Date(0)) > sevenDaysAgo
    )
    .sort((a, b) => (b.updatedAt?.seconds ?? 0) - (a.updatedAt?.seconds ?? 0));
}

/**
 * Returns OFFICIAL items whose startDate is in the future, enriched with
 * the provided members list and sorted by startDate ascending.
 */
export function selectUpcomingEvents<M>(
  items: ScheduleItemWithWorkspace[],
  members: M[]
): ScheduleItemWithMembers<M>[] {
  return items
    .filter(
      item =>
        item.status === 'OFFICIAL' &&
        item.startDate != null &&
        isFuture(item.startDate.toDate())
    )
    .map(item => ({ ...item, members }))
    .sort((a, b) => (a.startDate?.seconds ?? 0) - (b.startDate?.seconds ?? 0));
}

/**
 * Returns OFFICIAL items that are currently in progress (today falls within
 * [startOfDay(startDate), endOfDay(endDate)]), enriched with the members list
 * and sorted by startDate ascending.
 */
export function selectPresentEvents<M>(
  items: ScheduleItemWithWorkspace[],
  members: M[]
): ScheduleItemWithMembers<M>[] {
  const today = new Date();
  return items
    .filter(item => {
      if (item.status !== 'OFFICIAL' || item.startDate == null) return false;
      const start = item.startDate.toDate();
      const end = item.endDate?.toDate() ?? start;
      return isWithinInterval(today, { start: startOfDay(start), end: endOfDay(end) });
    })
    .map(item => ({ ...item, members }))
    .sort((a, b) => (a.startDate?.seconds ?? 0) - (b.startDate?.seconds ?? 0));
}
