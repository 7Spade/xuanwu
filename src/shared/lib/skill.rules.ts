/**
 * @fileoverview shared/lib/skill — Skill domain utilities backed by shared-kernel.
 * No async, no I/O, no React, no Firebase.
 *
 * Type definitions live in @/shared/types/skill.types.
 * Runtime functions (resolveSkillTier, TIER_DEFINITIONS, etc.) live in
 * @/features/shared.kernel.skill-tier — import directly from there.
 */

import type { SkillGrant, SkillTier, SkillRequirement } from '@/shared/types'

// ---------------------------------------------------------------------------
// Local tier rank lookup (avoids a feature dependency for a trivial computation)
// ---------------------------------------------------------------------------

const TIER_RANK: Readonly<Record<SkillTier, number>> = {
  apprentice: 1, journeyman: 2, expert: 3, artisan: 4,
  grandmaster: 5, legendary: 6, titan: 7,
};

// ---------------------------------------------------------------------------
// Account BC helper — requires SkillGrant (has Timestamp; stays in shared/lib)
// ---------------------------------------------------------------------------

/**
 * Returns true if the given SkillGrant array satisfies a single SkillRequirement.
 * Matches on `tagSlug` (portable, primary key) with fallback to `tagId` for
 * backward compatibility with older grant records.
 * Does not check quantity — only verifies that the skill & tier threshold is met.
 */
export function grantSatisfiesRequirement(
  grants: SkillGrant[],
  requirement: SkillRequirement
): boolean {
  return grants.some(g => {
    const slugMatch = g.tagSlug === requirement.tagSlug;
    const idMatch = requirement.tagId !== undefined && g.tagId !== undefined && g.tagId === requirement.tagId;
    return (slugMatch || idMatch) && (TIER_RANK[g.tier] ?? 0) >= (TIER_RANK[requirement.minimumTier] ?? 0);
  });
}

