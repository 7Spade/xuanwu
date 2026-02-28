/**
 * shared-kernel.skill-tier
 *
 * Cross-BC domain contract: the canonical seven-tier proficiency scale and its
 * computation rule.
 *
 * Per logic-overview.md Invariant #12:
 *   "Tier 永遠是推導值（純函式 getTier(xp)），不得存入任何 DB 欄位"
 *
 * Used by all four architectural layers:
 *   - Account BC    : account-skill, account-user.profile
 *   - Organization BC: account-organization.schedule
 *   - Workspace BC  : workspace-business.schedule
 *   - Projection layer: projection.account-skill-view, projection.org-eligible-member-view
 *
 * Type definitions live in @/shared/types/skill.types (shared → features direction).
 * This file re-exports types and adds the runtime computation functions.
 */

// Type definitions come from shared/types to keep dependency direction correct
// (features may import shared; shared must NOT import features)
export type { SkillTier, TierDefinition } from '@/shared/types/skill.types';
import type { SkillTier, TierDefinition } from '@/shared/types/skill.types';

/**
 * Canonical tier table — single source of truth for XP bounds, labels and
 * design tokens. All downstream helpers derive from this array automatically.
 */
export const TIER_DEFINITIONS: readonly TierDefinition[] = [
  { tier: 'apprentice',   rank: 1, label: 'Apprentice',   minXp: 0,   maxXp: 75,  color: '#CCEDEB', cssVar: '--tier-1-apprentice'   },
  { tier: 'journeyman',   rank: 2, label: 'Journeyman',   minXp: 75,  maxXp: 150, color: '#A2C7C7', cssVar: '--tier-2-journeyman'   },
  { tier: 'expert',       rank: 3, label: 'Expert',       minXp: 150, maxXp: 225, color: '#78A1A3', cssVar: '--tier-3-expert'       },
  { tier: 'artisan',      rank: 4, label: 'Artisan',      minXp: 225, maxXp: 300, color: '#4D7A7F', cssVar: '--tier-4-artisan'      },
  { tier: 'grandmaster',  rank: 5, label: 'Grandmaster',  minXp: 300, maxXp: 375, color: '#23545B', cssVar: '--tier-5-grandmaster'  },
  { tier: 'legendary',    rank: 6, label: 'Legendary',    minXp: 375, maxXp: 450, color: '#17393E', cssVar: '--tier-6-legendary'    },
  { tier: 'titan',        rank: 7, label: 'Titan',        minXp: 450, maxXp: 525, color: '#0A1F21', cssVar: '--tier-7-titan'        },
] as const;

// Indexed lookup map for O(1) access
const TIER_BY_ID = new Map<SkillTier, TierDefinition>(
  TIER_DEFINITIONS.map(d => [d.tier, d] as [SkillTier, TierDefinition])
);

// ---------------------------------------------------------------------------
// Tier computation (Invariant #12 canonical function)
// ---------------------------------------------------------------------------

/** Returns the TierDefinition for the given SkillTier identifier. */
export function getTierDefinition(tier: SkillTier): TierDefinition {
  const def = TIER_BY_ID.get(tier);
  if (!def) throw new Error(`Unknown SkillTier: "${tier}"`);
  return def;
}

/**
 * Derives the SkillTier from a raw XP value.
 *
 * This is the canonical implementation of Invariant #12:
 *   "Tier 永遠是推導值（純函式 getTier(xp)），不得存入任何 DB 欄位"
 *
 * Returns 'apprentice' for out-of-range values below 0,
 * and 'titan' for values above the maximum.
 */
export function resolveSkillTier(xp: number): SkillTier {
  for (const def of TIER_DEFINITIONS) {
    if (xp < def.maxXp) return def.tier;
  }
  return 'titan';
}

/** Alias for resolveSkillTier — canonical name per logic-overview.md. */
export const getTier = resolveSkillTier;

/** Returns the numeric rank for a tier (1 = lowest, 7 = highest). */
export function getTierRank(tier: SkillTier): number {
  return getTierDefinition(tier).rank;
}

/**
 * Returns true if `grantedTier` satisfies the `minimumTier` requirement.
 * A higher (or equal) tier always satisfies a lower minimum.
 */
export function tierSatisfies(grantedTier: SkillTier, minimumTier: SkillTier): boolean {
  return getTierRank(grantedTier) >= getTierRank(minimumTier);
}
