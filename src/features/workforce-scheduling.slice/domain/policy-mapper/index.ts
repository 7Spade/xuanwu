/**
 * Module: workforce-scheduling.slice/policy-mapper — [D27-A] Semantic Assignment Policy Mapper
 *
 * Translates a SemanticContext (workspace + skill requirements) into an
 * AssignmentPolicy that drives candidate selection in the scheduling saga,
 * and maps a specific tag + policy pair to a concrete ScheduleSlot.
 *
 * Design rule D27-A:
 *   All scheduling dispatch MUST go through policy-mapper.
 *   Hard-coded ID routing is forbidden; semantic graph projections determine
 *   the eligibility strategy for each slot.
 *
 * Strategy selection logic:
 *   'open'        — no skill requirements; any eligible member qualifies.
 *   'tier-gated'  — requirements present but all share the same minimumTier
 *                   and the slug carries no sub-category prefix (generic tiers).
 *   'skill-gated' — at least one requirement references a specific, named skill
 *                   tag slug; candidate must hold that exact skill at the required tier.
 *
 * Dependency rule: ZERO infrastructure imports (no Firebase, no React, no I/O).
 */

import type { TagSlugRef, SkillRequirement, SkillTier } from '@/shared-kernel';
import { getTierRank } from '@/shared-kernel';

// ─── Public types ─────────────────────────────────────────────────────────────

/**
 * The semantic context derived from an incoming schedule proposal.
 * Populated from WorkspaceScheduleProposedPayload before the saga starts.
 */
export interface SemanticContext {
  readonly workspaceId: string;
  readonly orgId: string;
  /** Skill requirements from the parsed schedule proposal. Empty → 'open' strategy. */
  readonly skillRequirements: readonly SkillRequirement[];
  readonly startDate: string;
  readonly endDate: string;
  readonly locationId?: string;
}

/**
 * The assignment strategy, resolved from the semantic context.
 *
 * - 'open'        No skill requirements; any eligible member qualifies.
 * - 'tier-gated'  Requirements exist but only constrain by tier (no specific skill tag).
 * - 'skill-gated' Requirements specify concrete tag slugs; assignment is per-skill.
 */
export type AssignmentStrategy = 'open' | 'tier-gated' | 'skill-gated';

/**
 * The resolved policy that tells the scheduling saga HOW to select candidates.
 * Produced by resolveAssignmentPolicy(); consumed by findEligibleCandidatesForRequirements().
 */
export interface AssignmentPolicy {
  /** Strategy that governs candidate selection. */
  readonly strategy: AssignmentStrategy;
  /** Total number of candidates required across all skill slots. */
  readonly maxCandidates: number;
  /** The original skill requirements (empty array for 'open' strategy). */
  readonly requiredSkills: readonly SkillRequirement[];
  /** Highest minimum tier across all requirements; undefined for 'open'. */
  readonly minimumTier: SkillTier | undefined;
}

/**
 * A concrete schedule slot: one (tag, policy) binding with date-range resolution.
 * Returned by mapToScheduleSlot() and forwarded to the saga assignment path.
 */
export interface ScheduleSlot {
  /** The skill tag slug that this slot is assigned to. */
  readonly tagSlug: TagSlugRef;
  /** Strategy derived from the policy. */
  readonly strategy: AssignmentStrategy;
  /** Minimum required tier for this slot; undefined for 'open' slots. */
  readonly minimumTier: SkillTier | undefined;
  readonly startDate: string;
  readonly endDate: string;
  /** Human-readable descriptor for logging and UI display. */
  readonly slotLabel: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Determine whether a skill requirement references a generic tier slug
 * (i.e. the tagSlug has no sub-category prefix such as "skill:" or "role:").
 * Generic slugs are tier identifiers like "journeyman" or "expert" that apply
 * across the whole taxonomy rather than targeting a specific skill.
 */
function _isGenericTierSlug(tagSlug: TagSlugRef): boolean {
  const raw = tagSlug as string;
  return !raw.includes(':');
}

/**
 * Select the highest (most demanding) tier from a list of requirements.
 * Returns undefined when the list is empty.
 */
function _highestTier(requirements: readonly SkillRequirement[]): SkillTier | undefined {
  if (requirements.length === 0) return undefined;
  return requirements.reduce<SkillTier>((best, req) => {
    return getTierRank(req.minimumTier) > getTierRank(best) ? req.minimumTier : best;
  }, requirements[0].minimumTier);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Resolve an AssignmentPolicy from the given SemanticContext.
 *
 * The strategy is determined as follows:
 *   1. Empty skillRequirements → 'open'
 *   2. All tagSlugs are generic tier slugs (no category prefix) → 'tier-gated'
 *   3. At least one tagSlug is category-specific → 'skill-gated'
 *
 * @param semanticContext - The workspace + skill context from the proposal.
 * @returns AssignmentPolicy ready for use by the scheduling saga.
 */
export function resolveAssignmentPolicy(semanticContext: SemanticContext): AssignmentPolicy {
  const { skillRequirements } = semanticContext;

  // Strategy: open — no constraints
  if (skillRequirements.length === 0) {
    return {
      strategy: 'open',
      maxCandidates: 1,
      requiredSkills: [],
      minimumTier: undefined,
    };
  }

  // Total candidates = sum of all quantities
  const maxCandidates = skillRequirements.reduce((sum, req) => sum + req.quantity, 0);
  const minimumTier = _highestTier(skillRequirements);

  // Strategy: tier-gated when ALL slugs are generic (no category prefix)
  const allGeneric = skillRequirements.every((req) => _isGenericTierSlug(req.tagSlug));
  if (allGeneric) {
    return {
      strategy: 'tier-gated',
      maxCandidates,
      requiredSkills: skillRequirements,
      minimumTier,
    };
  }

  // Strategy: skill-gated — at least one requirement has a specific skill tag
  return {
    strategy: 'skill-gated',
    maxCandidates,
    requiredSkills: skillRequirements,
    minimumTier,
  };
}

/**
 * Map a (tagSlug, policy) pair to a ScheduleSlot with full date-range context.
 *
 * The slot label is synthesised from the tag slug and strategy so that
 * downstream consumers (saga, UI) have a human-readable descriptor without
 * needing to re-derive it from the raw policy fields.
 *
 * @param tagSlug - The skill tag being assigned to this slot.
 * @param policy  - The resolved assignment policy for the schedule item.
 * @returns A fully-resolved ScheduleSlot ready for the assignment path.
 */
export function mapToScheduleSlot(
  tagSlug: TagSlugRef,
  policy: AssignmentPolicy,
  startDate: string,
  endDate: string,
): ScheduleSlot {
  const tierSuffix = policy.minimumTier ? ` (≥${policy.minimumTier})` : '';
  const slotLabel = `${tagSlug as string}${tierSuffix} [${policy.strategy}]`;

  return {
    tagSlug,
    strategy: policy.strategy,
    minimumTier: policy.minimumTier,
    startDate,
    endDate,
    slotLabel,
  };
}
