/**
 * projection.account-skill-view — _queries.ts
 *
 * Read-side queries for the account skill XP read model.
 *
 * Per 00-LogicOverview.md (VS3 STD_PROJ_LANE):
 *   SKILL_V["projection.account-skill-view\n[S2: SK_VERSION_GUARD]"]
 *
 * [T5-equivalent] Consumers MUST NOT write to this collection.
 * [#12] getTier is derived from xp; tier is never stored.
 */

import { getDocument } from '@/shared-infra/frontend-firebase/firestore/firestore.read.adapter';

import type { AccountSkillEntry, AccountSkillView } from './_projector';

/**
 * Returns the full account skill view, or null if not initialised.
 */
export async function getAccountSkillView(
  accountId: string
): Promise<AccountSkillView | null> {
  return getDocument<AccountSkillView>(`accountSkillView/${accountId}`);
}

/**
 * Returns a single skill entry for an account by tagSlug.
 * Returns null if the account has no XP for the given skill.
 */
export async function getAccountSkillEntry(
  accountId: string,
  tagSlug: string
): Promise<AccountSkillEntry | null> {
  const view = await getAccountSkillView(accountId);
  return view?.skills?.[tagSlug] ?? null;
}

/**
 * Returns all skills with their current XP for an account.
 * Returns an empty array if no skill view exists.
 */
export async function getAllAccountSkills(
  accountId: string
): Promise<AccountSkillEntry[]> {
  const view = await getAccountSkillView(accountId);
  if (!view) return [];
  return Object.values(view.skills);
}
