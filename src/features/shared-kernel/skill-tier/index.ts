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
 * Type definitions from @/shared/types/skill.types are acceptable (shared→features direction).
 */

import type { SkillTier, TierDefinition } from '@/shared/types/skill.types';
export type { SkillTier, TierDefinition };

// ─── Canonical tier table ─────────────────────────────────────────────────────

/**
 * Canonical seven-tier proficiency scale. [#12]
 *
 * Single source of truth for XP thresholds, display labels and design tokens.
 * All downstream helpers derive automatically from this table.
 */
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

// ─── Tier computation (Invariant #12 canonical function) ─────────────────────

/** Returns the full TierDefinition for a SkillTier identifier. */
export function getTierDefinition(tier: SkillTier): TierDefinition {
  const def = TIER_BY_ID.get(tier);
  if (!def) throw new Error(`Unknown SkillTier: "${tier}"`);
  return def;
}

/**
 * Canonical getTier(xp) → SkillTier pure function. [#12]
 *
 * This is the ONLY legitimate way to derive a tier from XP.
 * Result MUST NOT be stored in any DB field.
 */
export function getTier(xp: number): SkillTier {
  for (const def of TIER_DEFINITIONS) {
    if (xp < def.maxXp) return def.tier;
  }
  return 'titan';
}

/** Alias for getTier — matches logic-overview.md canonical name. */
export const resolveSkillTier = getTier;

/** Returns the numeric rank for a tier (1 = lowest, 7 = highest). */
export function getTierRank(tier: SkillTier): number {
  return getTierDefinition(tier).rank;
}

/**
 * Returns true if `grantedTier` satisfies the `minimumTier` requirement.
 * Higher rank (or equal) always satisfies a lower minimum.
 */
export function tierSatisfies(grantedTier: SkillTier, minimumTier: SkillTier): boolean {
  return getTierRank(grantedTier) >= getTierRank(minimumTier);
}

// ─── Cross-BC staffing contract (SK_SKILL_REQ) ───────────────────────────────

/**
 * Cross-BC staffing requirement: a skill (identified by tagSlug) with a
 * minimum XP threshold.
 *
 * Re-exported from @/shared/types/skill.types to keep the dependency direction clean.
 */
import type { SkillRequirement } from '@/shared/types/skill.types';
export type { SkillRequirement };

// ─── Cross-BC event payload (Workspace BC → Organization BC) [A5] ────────────

/**
 * Payload carried by the `workspace:schedule:proposed` cross-BC event.
 *
 * Workspace BC emits → Organization BC consumes (scheduling.slice).
 * Placing this in shared.kernel removes the scheduling.slice dependency on
 * workspace internal event bus implementations.
 *
 * [R8] traceId MUST be propagated end-to-end through the scheduling saga.
 */
export interface WorkspaceScheduleProposedPayload {
  /** Workspace-local schedule item identifier. */
  readonly scheduleItemId: string;
  /** Workspace that initiated the proposal. */
  readonly workspaceId: string;
  /** Organization that owns the workspace. */
  readonly orgId: string;
  /** Human-readable schedule title. */
  readonly title: string;
  /** ISO 8601 start date. */
  readonly startDate: string;
  /** ISO 8601 end date. */
  readonly endDate: string;
  /** accountId of the proposer. */
  readonly proposedBy: string;
  /** SourcePointer: IntentID of the ParsingIntent that triggered this proposal. */
  readonly intentId?: string;
  /** Staffing requirements extracted from parsed document. */
  readonly skillRequirements?: SkillRequirement[];
  /** Sub-location within the workspace. [FR-L2] */
  readonly locationId?: string;
  /** [R8] TraceID from CBG_ENTRY — must propagate through the scheduling saga. */
  readonly traceId?: string;
}

/** Conformance marker for org schedule handlers consuming this payload. */
export interface ImplementsScheduleProposedPayloadContract {
  readonly implementsScheduleProposedPayload: true;
}
