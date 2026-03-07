/**
 * Module: _tag-funnel
 * Purpose: Tag lifecycle funnel registration
 * Responsibilities: sync tag snapshot and skill tag pool projections from tag events
 * Constraints: deterministic logic, respect module boundaries
 */

import { onTagEvent } from '@/features/semantic-graph.slice';
import {
  handleTagDeletedForPool,
  handleTagDeprecatedForPool,
  handleTagUpdatedForPool,
} from '@/features/skill-xp.slice';

import { createVersionStamp } from './_funnel.shared';
import { upsertProjectionVersion } from './_registry';
import { applyTagCreated, applyTagDeleted, applyTagDeprecated, applyTagUpdated } from './tag-snapshot';

export function registerTagFunnel(): () => void {
  const unsubscribers: Array<() => void> = [];

  unsubscribers.push(
    onTagEvent('tag:created', async (payload) => {
      await applyTagCreated(payload);

      const stamp = createVersionStamp();
      await upsertProjectionVersion('tag-snapshot', stamp.version, stamp.updatedAt);
    })
  );

  unsubscribers.push(
    onTagEvent('tag:updated', async (payload) => {
      await applyTagUpdated(payload);
      await handleTagUpdatedForPool(payload);

      const stamp = createVersionStamp();
      await upsertProjectionVersion('tag-snapshot', stamp.version, stamp.updatedAt);
    })
  );

  unsubscribers.push(
    onTagEvent('tag:deprecated', async (payload) => {
      await applyTagDeprecated(payload);
      await handleTagDeprecatedForPool(payload);

      const stamp = createVersionStamp();
      await upsertProjectionVersion('tag-snapshot', stamp.version, stamp.updatedAt);
    })
  );

  unsubscribers.push(
    onTagEvent('tag:deleted', async (payload) => {
      await applyTagDeleted(payload);
      await handleTagDeletedForPool(payload);

      const stamp = createVersionStamp();
      await upsertProjectionVersion('tag-snapshot', stamp.version, stamp.updatedAt);
    })
  );

  return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
}
