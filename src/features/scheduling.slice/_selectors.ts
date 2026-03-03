import { endOfDay, isFuture, isWithinInterval, startOfDay, subDays } from 'date-fns';

import type { ScheduleItem } from '@/features/shared-kernel';

export type ScheduleItemWithWorkspaceName = ScheduleItem & { workspaceName?: string };
export type ScheduleItemWithMembers<TMember> = ScheduleItemWithWorkspaceName & { members: TMember[] };

export function selectAllScheduleItems(
  scheduleItems: Record<string, ScheduleItem> | undefined,
  workspaces: Record<string, { name?: string }> | undefined,
): ScheduleItemWithWorkspaceName[] {
  return Object.values(scheduleItems ?? {}).map((item) => ({
    ...item,
    workspaceName: workspaces?.[item.workspaceId]?.name ?? 'Unknown Workspace',
  }));
}

export function selectPendingProposals(items: ScheduleItemWithWorkspaceName[]): ScheduleItemWithWorkspaceName[] {
  return items.filter((item) => item.status === 'PROPOSAL');
}

export function selectDecisionHistory(
  items: ScheduleItemWithWorkspaceName[],
  now: Date = new Date(),
): ScheduleItemWithWorkspaceName[] {
  const sevenDaysAgo = subDays(now, 7);
  return items
    .filter((item) =>
      (item.status === 'OFFICIAL' || item.status === 'REJECTED') &&
      (item.updatedAt?.toDate() ?? new Date(0)) > sevenDaysAgo
    )
    .sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0));
}

export function selectUpcomingEvents<TMember>(
  items: ScheduleItemWithWorkspaceName[],
  organizationMembers: TMember[],
): ScheduleItemWithMembers<TMember>[] {
  return items
    .filter((item) => item.status === 'OFFICIAL' && item.startDate && isFuture(item.startDate.toDate()))
    .map((item) => ({
      ...item,
      members: organizationMembers,
    }))
    .sort((a, b) => (a.startDate?.seconds || 0) - (b.startDate?.seconds || 0));
}

export function selectPresentEvents<TMember>(
  items: ScheduleItemWithWorkspaceName[],
  organizationMembers: TMember[],
  now: Date = new Date(),
): ScheduleItemWithMembers<TMember>[] {
  return items
    .filter((item) => {
      if (item.status !== 'OFFICIAL' || !item.startDate) return false;
      const start = item.startDate.toDate();
      const end = item.endDate?.toDate() || start;
      return isWithinInterval(now, { start: startOfDay(start), end: endOfDay(end) });
    })
    .map((item) => ({
      ...item,
      members: organizationMembers,
    }))
    .sort((a, b) => (a.startDate?.seconds || 0) - (b.startDate?.seconds || 0));
}
