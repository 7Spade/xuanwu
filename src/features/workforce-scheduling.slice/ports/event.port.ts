/**
 * Module: event.port.ts
 * Purpose: Define VS6 event publication port contracts.
 * Responsibilities: Standardize scheduling domain event enqueue boundaries.
 * Constraints: deterministic logic, respect module boundaries
 */

import type {
  OrganizationEventKey,
  OrganizationEventPayloadMap,
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

export interface SchedulingEventPort {
  enqueueSchedulingOutboxEvent<K extends OrganizationEventKey>(
    eventKey: K,
    payload: OrganizationEventPayloadMap[K],
    routing?: SchedulingOutboxRouting,
  ): Promise<SchedulingOutboxAck>;
}
