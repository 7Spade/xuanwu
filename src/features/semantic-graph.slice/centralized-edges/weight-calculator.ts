/**
 * Module: semantic-graph.slice/centralized-edges — Weight Calculator [D21-E]
 *
 * Semantic similarity weight computation for graph edges.
 *
 * D21-E mandates that edge weights are derived from semantic features
 * (taxonomy depth, relation type, reinforcement signals) rather than being
 * hand-coded by callers.  This module is the single source of truth for
 * weight derivation [D21-E].
 *
 * Weight semantics (consistent with [D21-9]):
 *   - Result is always in (0.0, 1.0].
 *   - IS_A direct parent   → 1.0
 *   - REQUIRES direct dep  → 0.8  (slightly weaker; dependency ≠ identity)
 *   - IS_A cross-category  → 0.5  (indirect / metaphorical inheritance)
 *   - Unknown relation     → 0.1  (minimal confidence)
 *
 * The [D21-G] learning feedback loop (centralized-learning/) is expected to
 * call adjustWeight() to nudge values based on real domain events.
 *
 * Dependency rule: ZERO infrastructure imports (no Firebase, no React, no I/O).
 */

import type { TagSlugRef } from '@/shared-kernel';
import type { SemanticRelationType } from '../centralized-types';

// ─── Base-weight table ────────────────────────────────────────────────────────

const BASE_WEIGHTS: Record<SemanticRelationType, number> = {
  IS_A: 1.0,
  REQUIRES: 0.8,
};

// ─── Per-edge weight overrides (applied by the learning engine) ───────────────

const _overrides = new Map<string, number>();

function _overrideKey(
  fromSlug: TagSlugRef,
  toSlug: TagSlugRef,
  relationType: SemanticRelationType
): string {
  return `${relationType}:${fromSlug as string}→${toSlug as string}`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Calculate the semantic similarity weight for an edge (fromSlug → toSlug).
 *
 * The result reflects the strength of the semantic relationship and is always
 * in (0.0, 1.0] per [D21-9].  Cross-category edges receive a 0.5× penalty
 * because they represent looser semantic ties.
 *
 * @param fromSlug     - Source tag slug.
 * @param toSlug       - Target tag slug.
 * @param relationType - Semantic relation kind.
 */
export function calculateSimilarityWeight(
  fromSlug: TagSlugRef,
  toSlug: TagSlugRef,
  relationType: SemanticRelationType
): number {
  // 1. Check for a learning-engine override.
  const key = _overrideKey(fromSlug, toSlug, relationType);
  const override = _overrides.get(key);
  if (override !== undefined) return override;

  // 2. Derive base weight from relation type.
  const base = BASE_WEIGHTS[relationType] ?? 0.1;

  // 3. Apply cross-category penalty when the tag prefixes differ.
  //    Tags follow the convention `category:slug` (e.g. "skill:expert").
  const fromCategory = (fromSlug as string).split(':')[0];
  const toCategory = (toSlug as string).split(':')[0];
  const weight = fromCategory !== toCategory ? base * 0.5 : base;

  // 4. Clamp to (0.0, 1.0] — should never be needed but keeps the contract safe.
  return Math.min(1.0, Math.max(0.01, weight));
}

/**
 * Override the computed weight for a specific edge.
 * Called exclusively by the learning engine [D21-G] after reinforcement events.
 *
 * @throws {Error} if newWeight is not in (0.0, 1.0] [D21-9]
 */
export function adjustWeight(
  fromSlug: TagSlugRef,
  toSlug: TagSlugRef,
  relationType: SemanticRelationType,
  newWeight: number
): void {
  if (newWeight <= 0 || newWeight > 1) {
    throw new Error(`[D21-9] Weight override must be in (0.0, 1.0]; received ${newWeight}`);
  }
  const key = _overrideKey(fromSlug, toSlug, relationType);
  _overrides.set(key, newWeight);
}

/** Clear all overrides (used in tests). */
export function _clearWeightOverridesForTest(): void {
  _overrides.clear();
}
