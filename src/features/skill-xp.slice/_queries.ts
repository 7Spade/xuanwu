/**
 * skill-xp.slice — _queries.ts
 *
 * Read queries for:
 *   1. Account skill XP read model (accountSkillView)
 *   2. Skill Tag Pool (orgSkillTagPool)
 *   3. Org Skill Recognition (orgSkillRecognition)
 *
 * Per logic-overview.md:
 *   W_B_SCHEDULE -.→ ACCOUNT_SKILL_VIEW (読み取り only — via ORG_ELIGIBLE_MEMBER_VIEW)
 *   SKILL_TAG_POOL_AGGREGATE → SKILL_TAG_POOL (read model)
 *   ORG_SKILL_RECOGNITION["...organizationId / accountId / skillId / minXpRequired / status"]
 *
 * Boundary constraint:
 *   These queries read ONLY this slice's own Firestore collections.
 *   They do NOT read Account aggregate data directly — use projection views for that.
 */

import { getDocs, collection, type QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '@/shared/infra/firestore/firestore.client';
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
import type { AccountSkillEntry } from './_projector';
import type { OrgSkillTagEntry } from './_tag-pool';
import type { OrgSkillRecognitionRecord } from './_org-recognition';

// ---------------------------------------------------------------------------
// Account skill view queries
// ---------------------------------------------------------------------------

/**
 * Retrieves the skill XP entry for a specific account + skill combination.
 */
export async function getAccountSkillEntry(
  accountId: string,
  skillId: string
): Promise<AccountSkillEntry | null> {
  return getDocument<AccountSkillEntry>(
    `accountSkillView/${accountId}/skills/${skillId}`
  );
}

/**
 * Returns all skill entries for a given account.
 * Callers derive tier via resolveSkillTier(entry.xp).
 */
export async function getAccountSkillView(
  accountId: string
): Promise<AccountSkillEntry[]> {
  const snap = await getDocs(
    collection(db, `accountSkillView/${accountId}/skills`)
  );
  return snap.docs.map((d: QueryDocumentSnapshot) => d.data() as AccountSkillEntry);
}

// ---------------------------------------------------------------------------
// Skill Tag Pool queries
// ---------------------------------------------------------------------------

/**
 * Retrieves a single skill tag from the org pool by tagSlug.
 * Returns null if the tag is not in the pool.
 */
export async function getOrgSkillTag(
  orgId: string,
  tagSlug: string
): Promise<OrgSkillTagEntry | null> {
  return getDocument<OrgSkillTagEntry>(`orgSkillTagPool/${orgId}/tags/${tagSlug}`);
}

/**
 * Returns all skill tags currently in the organization's pool.
 * Used by UI to display and manage the org's skill tag library.
 */
export async function getOrgSkillTags(orgId: string): Promise<OrgSkillTagEntry[]> {
  const snap = await getDocs(collection(db, `orgSkillTagPool/${orgId}/tags`));
  return snap.docs.map((d: QueryDocumentSnapshot) => d.data() as OrgSkillTagEntry);
}

// ---------------------------------------------------------------------------
// Org Skill Recognition queries
// ---------------------------------------------------------------------------

/**
 * Returns the current recognition record for a specific member skill, or null.
 */
export async function getSkillRecognition(
  organizationId: string,
  accountId: string,
  skillId: string
): Promise<OrgSkillRecognitionRecord | null> {
  return getDocument<OrgSkillRecognitionRecord>(
    `orgSkillRecognition/${organizationId}/members/${accountId}/skills/${skillId}`
  );
}

/**
 * Returns all skill recognition records for a specific member within an org.
 * Includes both active and revoked records for full audit visibility.
 */
export async function getMemberSkillRecognitions(
  organizationId: string,
  accountId: string
): Promise<OrgSkillRecognitionRecord[]> {
  const snap = await getDocs(
    collection(db, `orgSkillRecognition/${organizationId}/members/${accountId}/skills`)
  );
  return snap.docs.map((d: QueryDocumentSnapshot) => d.data() as OrgSkillRecognitionRecord);
}
