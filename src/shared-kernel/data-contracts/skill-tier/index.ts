/**
 * shared.kernel/skill-tier — SK_SKILL_TIER + SK_SKILL_REQ
 *
 * VS0 Shared Kernel: Skill-tier computation contract and cross-BC staffing contract.
 *
 * Per logic-overview.md Invariant #12:
 *   "Tier 永遠是推導值（純函式 getTier(xp)），不得存入任何 DB 欄位"
 *   Tier is ALWAYS derived on-demand — NEVER persisted to any DB field.
 *
 * Per logic-overview.md SK_SKILL_REQ:
 *   skill-requirement = tagSlug × minXp — cross-BC staffing contract
 *   Flows: Workspace BC → Organization BC via WorkspaceScheduleProposed event [A5]
 *
 * Consumers:
 *   — skill-xp.slice         (SkillXpAdded / SkillXpDeducted events)
 *   — projection.org-eligible-member-view  (eligibility computed at query time)
 *   — scheduling.slice       (skill-tier eligibility gate)
 *   — workspace.slice/business.parsing-intent  (skill requirements from documents)
 *
 * Dependency rule: ZERO infrastructure imports (no Firebase, no React, no I/O).
 * [D19] Canonical type definitions live here. Import from `@/shared-kernel`.
 */

import type { Timestamp } from '@/shared/ports'

import type { TagSlugRef } from '../tag-authority'

// ─── Canonical type definitions (D19 — owned by shared-kernel) ───────────────

/**
 * Seven-tier proficiency scale.
 * Values are stable identifiers (safe for Firestore storage & AI prompts).
 */
export type SkillTier =
  | 'apprentice'
  | 'journeyman'
  | 'expert'
  | 'artisan'
  | 'grandmaster'
  | 'legendary'
  | 'titan';

/** Static metadata for a single tier. Used by UI and shared/lib. */
export interface TierDefinition {
  tier: SkillTier;
  rank: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  label: string;
  minXp: number;
  maxXp: number;
  color: string;
  cssVar: string;
}

/**
 * Expresses a staffing need inside a ScheduleItem proposal.
 * Flows from Workspace BC → Organization BC via WORKSPACE_OUTBOX events.
 */
export interface SkillRequirement {
  tagSlug: TagSlugRef;
  tagId?: string;
  /** Optional XP threshold form (SK_SKILL_REQ: tagSlug × minXp). */
  minXp?: number;
  /** Tier threshold form kept for current scheduling compatibility. */
  minimumTier: SkillTier;
  quantity: number;
}

// ─── Canonical tier table ─────────────────────────────────────────────────────

export const TIER_DEFINITIONS: readonly TierDefinition[] = [
  { tier: 'apprentice',  rank: 1, label: 'Apprentice',  minXp: 0,   maxXp: 75,  color: '#CCEDEB', cssVar: '--tier-1-apprentice'  },
  { tier: 'journeyman',  rank: 2, label: 'Journeyman',  minXp: 75,  maxXp: 150, color: '#A2C7C7', cssVar: '--tier-2-journeyman'  },
  { tier: 'expert',      rank: 3, label: 'Expert',      minXp: 150, maxXp: 225, color: '#78A1A3', cssVar: '--tier-3-expert'      },
  { tier: 'artisan',     rank: 4, label: 'Artisan',     minXp: 225, maxXp: 300, color: '#4D7A7F', cssVar: '--tier-4-artisan'     },
  { tier: 'grandmaster', rank: 5, label: 'Grandmaster', minXp: 300, maxXp: 375, color: '#23545B', cssVar: '--tier-5-grandmaster' },
  { tier: 'legendary',   rank: 6, label: 'Legendary',   minXp: 375, maxXp: 450, color: '#17393E', cssVar: '--tier-6-legendary'  },
  { tier: 'titan',       rank: 7, label: 'Titan',       minXp: 450, maxXp: 525, color: '#0A1F21', cssVar: '--tier-7-titan'      },
] as const;

const TIER_BY_ID = new Map<SkillTier, TierDefinition>(
  TIER_DEFINITIONS.map(d => [d.tier, d] as [SkillTier, TierDefinition]),
);

export function getTierDefinition(tier: SkillTier): TierDefinition {
  const def = TIER_BY_ID.get(tier);
  if (!def) throw new Error(`Unknown SkillTier: "${tier}"`);
  return def;
}

export function getTier(xp: number): SkillTier {
  for (const def of TIER_DEFINITIONS) {
    if (xp < def.maxXp) return def.tier;
  }
  return 'titan';
}

export const resolveSkillTier = getTier;

export function getTierRank(tier: SkillTier): number {
  return getTierDefinition(tier).rank;
}

export function tierSatisfies(grantedTier: SkillTier, minimumTier: SkillTier): boolean {
  return getTierRank(grantedTier) >= getTierRank(minimumTier);
}

export interface SkillTag {
  slug: string;
  name: string;
  category?: string;
  description?: string;
}

export interface SkillGrant {
  tagSlug: TagSlugRef;
  tagName?: string;
  tagId?: string;
  tier: SkillTier;
  xp: number;
  earnedInOrgId?: string;
  grantedAt?: Timestamp;
}

export interface WorkspaceScheduleProposedPayload {
  readonly scheduleItemId: string;
  readonly workspaceId: string;
  readonly orgId: string;
  readonly title: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly proposedBy: string;
  readonly intentId?: string;
  readonly skillRequirements?: SkillRequirement[];
  readonly locationId?: string;
  readonly traceId?: string;
}

export interface ImplementsScheduleProposedPayloadContract {
  readonly implementsScheduleProposedPayload: true;
}
