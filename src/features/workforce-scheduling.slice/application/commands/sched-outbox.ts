/**
 * Module: sched-outbox
 * Purpose: Encapsulate scheduling domain event publishing behind an outbox boundary
 * Responsibilities: provide a single enqueue API for VS6 scheduling events
 * Constraints: deterministic logic, respect module boundaries
 */

import {
  publishOrgEvent,
  type OrganizationEventKey,
  type OrganizationEventPayloadMap,
} from '@/features/organization.slice';
import type { DlqTier } from '@/shared-kernel';

export type SchedulingOutboxLane = 'STANDARD_LANE' | 'CRITICAL_LANE';

export interface SchedulingOutboxRouting {
  lane: SchedulingOutboxLane;
  dlqTier: DlqTier;
}

export interface SchedulingOutboxAck {
  lane: SchedulingOutboxLane;
  dlqTier: DlqTier;
}

const DEFAULT_SCHEDULING_OUTBOX_ROUTING: SchedulingOutboxRouting = {
  lane: 'STANDARD_LANE',
  dlqTier: 'SAFE_AUTO',
};

export async function enqueueSchedulingOutboxEvent<K extends OrganizationEventKey>(
  eventKey: K,
  payload: OrganizationEventPayloadMap[K],
  routing: SchedulingOutboxRouting = DEFAULT_SCHEDULING_OUTBOX_ROUTING,
): Promise<SchedulingOutboxAck> {
  await publishOrgEvent(eventKey, payload);
  return {
    lane: routing.lane,
    dlqTier: routing.dlqTier,
  };
}
