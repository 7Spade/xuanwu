/**
 * Module: _timeline.queries.ts
 * Purpose: Query/subscription factories for timeline workflows under workforce-scheduling.slice.
 * Responsibilities: timeline item subscriptions and timeline-safe mapping.
 * Constraints: deterministic logic, respect module boundaries
 */

import { subscribeToWorkspaceTimelineItemsFromGateway } from '@/shared-infra/gateway-query';
import type { ScheduleItem } from '@/shared-kernel';

type Unsubscribe = () => void;

export function subscribeToWorkspaceTimelineItems(
  accountId: string,
  workspaceId: string,
  onUpdate: (items: ScheduleItem[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return subscribeToWorkspaceTimelineItemsFromGateway(
    accountId,
    workspaceId,
    onUpdate,
    onError,
  );
}
