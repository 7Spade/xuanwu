/**
 * account-organization.skill-tag — _tag-lifecycle-subscriber.ts
 *
 * VS4_TAG_SUBSCRIBER [R3] — keeps SKILL_TAG_POOL up to date when TagLifecycleEvents arrive.
 *
 * Per logic-overview_v9.md [R3] SKILL_TAG_POOL 更新路徑閉環:
 *   IER BACKGROUND_LANE → VS4_TAG_SUBSCRIBER → SKILL_TAG_POOL
 *
 * This subscriber is the explicit named handler the Event Funnel delegates to.
 * It stays within the account-organization.skill-tag slice boundary (切片內部消費,
 * 不穿透邊界) and MUST NOT import from other feature slices.
 *
 * Cross-org fan-out strategy:
 *   Firestore collectionGroup query on `tags` sub-collections lets us find every
 *   org that has activated the affected tagSlug without needing a global org list.
 *
 * Invariant T2: SKILL_TAG_POOL = Tag Authority's org-scope projection.
 *   Only passive sync here — no active tag creation.
 * Invariant #17: centralized-tag is the sole authority for tagSlug semantics.
 */

import {
  collectionGroup,
  query,
  where,
  getDocs,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/shared/infra/firestore/firestore.client';
import type {
  TagUpdatedPayload,
  TagDeprecatedPayload,
  TagDeletedPayload,
} from '@/features/centralized-tag';
import {
  syncTagUpdateToPool,
  syncTagDeprecationToPool,
  syncTagDeletionToPool,
} from './_skill-tag-pool';
import type { OrgSkillTagEntry } from './_skill-tag-pool';

// ---------------------------------------------------------------------------
// Internal helper — find all orgs that have activated a given tagSlug
// ---------------------------------------------------------------------------

/**
 * Returns the list of orgIds that have activated the given tagSlug in their pool.
 *
 * Uses Firestore collectionGroup so we can fan-out without a global org list.
 * Requires a Firestore collectionGroup index on `tags` collection group with `tagSlug`.
 */
async function getOrgsWithTag(tagSlug: string): Promise<string[]> {
  const q = query(
    collectionGroup(db, 'tags'),
    where('tagSlug', '==', tagSlug)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d: QueryDocumentSnapshot) => (d.data() as OrgSkillTagEntry).orgId);
}

// ---------------------------------------------------------------------------
// Public subscriber handlers — called by projection.event-funnel [R3]
// ---------------------------------------------------------------------------

/**
 * Handles a tag:updated event by syncing the new label to all org pools
 * that have activated this tag. [R3][T2]
 *
 * Uses Promise.allSettled so a failure in one org does not block others.
 * Called by registerTagFunnel() on IER BACKGROUND_LANE.
 */
export async function handleTagUpdatedForPool(
  payload: TagUpdatedPayload
): Promise<void> {
  const orgIds = await getOrgsWithTag(payload.tagSlug);
  const results = await Promise.allSettled(
    orgIds.map((orgId) => syncTagUpdateToPool(orgId, payload))
  );
  results.forEach((result, i) => {
    if (result.status === 'rejected') {
      console.error(`[tag-lifecycle-subscriber] handleTagUpdatedForPool failed for org "${orgIds[i]}":`, result.reason);
    }
  });
}

/**
 * Handles a tag:deprecated event by marking the tag as deprecated in all org pools. [R3][T2]
 *
 * Uses Promise.allSettled so a failure in one org does not block others.
 * Called by registerTagFunnel() on IER BACKGROUND_LANE.
 */
export async function handleTagDeprecatedForPool(
  payload: TagDeprecatedPayload
): Promise<void> {
  const orgIds = await getOrgsWithTag(payload.tagSlug);
  const results = await Promise.allSettled(
    orgIds.map((orgId) => syncTagDeprecationToPool(orgId, payload))
  );
  results.forEach((result, i) => {
    if (result.status === 'rejected') {
      console.error(`[tag-lifecycle-subscriber] handleTagDeprecatedForPool failed for org "${orgIds[i]}":`, result.reason);
    }
  });
}

/**
 * Handles a tag:deleted event by removing the tag from all org pools where
 * refCount is 0. [R3][T2]
 *
 * Uses Promise.allSettled so a failure in one org does not block others.
 * Called by registerTagFunnel() on IER BACKGROUND_LANE.
 */
export async function handleTagDeletedForPool(
  payload: TagDeletedPayload
): Promise<void> {
  const orgIds = await getOrgsWithTag(payload.tagSlug);
  const results = await Promise.allSettled(
    orgIds.map((orgId) => syncTagDeletionToPool(orgId, payload))
  );
  results.forEach((result, i) => {
    if (result.status === 'rejected') {
      console.error(`[tag-lifecycle-subscriber] handleTagDeletedForPool failed for org "${orgIds[i]}":`, result.reason);
    }
  });
}
