/**
 * Module: skill-outbox
 * Purpose: Encapsulate skill-xp event publishing behind an outbox boundary
 * Responsibilities: provide a single enqueue API for VS3 skill events
 * Constraints: deterministic logic, respect module boundaries
 */

import {
  publishOrgEvent,
  type OrganizationEventKey,
  type OrganizationEventPayloadMap,
} from '@/features/organization.slice';
import type { DlqTier } from '@/shared-kernel';

export type SkillOutboxLane = 'STANDARD_LANE' | 'CRITICAL_LANE';

export interface SkillOutboxRouting {
  lane: SkillOutboxLane;
  dlqTier: DlqTier;
}

export interface SkillOutboxAck {
  lane: SkillOutboxLane;
  dlqTier: DlqTier;
}

const DEFAULT_SKILL_OUTBOX_ROUTING: SkillOutboxRouting = {
  lane: 'STANDARD_LANE',
  dlqTier: 'SAFE_AUTO',
};

export async function enqueueSkillOutboxEvent<K extends OrganizationEventKey>(
  eventKey: K,
  payload: OrganizationEventPayloadMap[K],
  routing: SkillOutboxRouting = DEFAULT_SKILL_OUTBOX_ROUTING,
): Promise<SkillOutboxAck> {
  await publishOrgEvent(eventKey, payload);
  return {
    lane: routing.lane,
    dlqTier: routing.dlqTier,
  };
}
