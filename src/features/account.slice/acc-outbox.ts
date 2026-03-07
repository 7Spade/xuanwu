/**
 * Module: acc-outbox
 * Purpose: Encapsulate account role event publishing behind an outbox boundary
 * Responsibilities: provide a single enqueue API for VS2 account events
 * Constraints: deterministic logic, respect module boundaries
 */

import {
  publishOrgEvent,
  type OrganizationEventKey,
  type OrganizationEventPayloadMap,
} from '@/features/organization.slice';
import type { DlqTier } from '@/shared-kernel';

export type AccountOutboxLane = 'STANDARD_LANE' | 'CRITICAL_LANE';

export interface AccountOutboxRouting {
  lane: AccountOutboxLane;
  dlqTier: DlqTier;
}

export interface AccountOutboxAck {
  lane: AccountOutboxLane;
  dlqTier: DlqTier;
}

const DEFAULT_ACCOUNT_OUTBOX_ROUTING: AccountOutboxRouting = {
  lane: 'CRITICAL_LANE',
  dlqTier: 'SECURITY_BLOCK',
};

export async function enqueueAccountOutboxEvent<K extends OrganizationEventKey>(
  eventKey: K,
  payload: OrganizationEventPayloadMap[K],
  routing: AccountOutboxRouting = DEFAULT_ACCOUNT_OUTBOX_ROUTING,
): Promise<AccountOutboxAck> {
  await publishOrgEvent(eventKey, payload);
  return {
    lane: routing.lane,
    dlqTier: routing.dlqTier,
  };
}
