/**
 * account-organization.team ??_queries.ts
 *
 * Read queries for org-level internal team management.
 *
 * Teams are stored as `accounts/{orgId}.teams[]` (type === 'internal').
 * onSnapshot on the org account document provides real-time updates.
 *
 * Per 00-LogicOverview.md:
 *   ORGANIZATION_TEAM["organization-governance.team嚗??恣??繚 ?折蝯???"]
 *   ORGANIZATION_TEAM -.->|蝯撣唾?璅惜??閬?嚗霈嚗 SKILL_TAG_POOL
 *
 * Boundary constraint:
 *   These queries read ONLY from this org's account document.
 *   Skill tag data is referenced by tagSlug ??read from skill-xp.slice.
 */

import type { Account, Team } from '@/shared-kernel';
import { db } from '@/shared-infra/frontend-firebase';
import { doc, onSnapshot, type Unsubscribe } from '@/shared/infra/firestore/firestore.read.adapter';
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';

/**
 * Fetches all internal teams for an organization.
 * Internal teams have `type === 'internal'`.
 */
export async function getOrgTeams(orgId: string): Promise<Team[]> {
  const account = await getDocument<Account>(`accounts/${orgId}`);
  return (account?.teams ?? []).filter((t: Team) => t.type === 'internal');
}

/**
 * Subscribes to real-time updates of an organization's internal team list.
 * Teams are stored inline on the organization account document.
 * Returns an unsubscribe function.
 */
export function subscribeToOrgTeams(
  orgId: string,
  onUpdate: (teams: Team[]) => void
): Unsubscribe {
  const ref = doc(db, 'accounts', orgId);
  return onSnapshot(ref, (snap) => {
    if (!snap.exists()) {
      onUpdate([]);
      return;
    }
    const data = snap.data() as Account;
    onUpdate((data.teams ?? []).filter((t: Team) => t.type === 'internal'));
  });
}
