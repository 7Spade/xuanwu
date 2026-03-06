/**
 * Module: semantic-graph.slice/centralized-learning — [L6 VS8_PLAST] Learning Engine
 *
 * Plasticity layer: synaptic weight feedback loop driven exclusively by real
 * domain facts from VS2 (AccountCreated) and VS3 (SkillXpChanged) [D21-G].
 *
 * Invariants:
 *   [D21-G]  Only this module may write synaptic weights; manual updates are forbidden.
 *   [D21-9]  Weights are monotonically non-decreasing after each learning step.
 *   [D24]    No direct Firebase import — weight writes go through centralized-edges/.
 *
 * @see docs/architecture/slices/semantic-graph.md — L6 VS8_PLAST
 */

import type { TagSlugRef } from '@/shared-kernel';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WeightDeltaEvent {
  readonly fromSlug: TagSlugRef;
  readonly toSlug: TagSlugRef;
  /** Positive delta [0, 1]; capped to ensure weight stays in (0, 1]. */
  readonly delta: number;
  readonly triggeredBy: 'ACCOUNT_CREATED' | 'SKILL_XP_CHANGED';
  readonly triggeredAt: string;
}

export interface LearningResult {
  readonly fromSlug: TagSlugRef;
  readonly toSlug: TagSlugRef;
  readonly previousWeight: number;
  readonly newWeight: number;
}

// ─── Internal weight registry ─────────────────────────────────────────────────

/** In-process weight cache keyed by "fromSlug→toSlug". */
const _weights = new Map<string, number>();

function _edgeKey(from: TagSlugRef, to: TagSlugRef): string {
  return `${from as string}→${to as string}`;
}

// ─── Core logic ───────────────────────────────────────────────────────────────

/**
 * Apply a positive weight delta to the edge from→to.
 *
 * Invariants:
 *   [D21-G] Weights are monotonically non-decreasing after each learning step.
 *   [D21-9] Weight is clamped to (0, 1].
 *   [D24]   No direct Firebase import — caller persists the returned result.
 */
export function _applyWeightDelta(fromSlug: TagSlugRef, toSlug: TagSlugRef, delta: number): LearningResult {
  const key = _edgeKey(fromSlug, toSlug);
  const previous = _weights.get(key) ?? 1.0;
  const newWeight = Math.min(1.0, Math.max(Number.EPSILON, previous + delta));
  _weights.set(key, newWeight);
  return { fromSlug, toSlug, previousWeight: previous, newWeight };
}

/**
 * React to an AccountCreated domain event by reinforcing any tag edges
 * associated with the new account's profile tags [D21-G].
 *
 * @param fromSlug - Source tag in the edge to reinforce.
 * @param toSlug   - Target tag in the edge to reinforce.
 * @returns LearningResult for persistence by the caller.
 */
export function onAccountCreated(fromSlug: TagSlugRef, toSlug: TagSlugRef): LearningResult {
  return _applyWeightDelta(fromSlug, toSlug, 0.05);
}

/**
 * React to a SkillXpChanged domain event by reinforcing the skill edge [D21-G].
 *
 * @param fromSlug  - Source skill tag.
 * @param toSlug    - Target skill / role tag.
 * @param xpDelta   - XP change; larger deltas trigger stronger reinforcement.
 * @returns LearningResult for persistence by the caller.
 */
export function onSkillXpChanged(fromSlug: TagSlugRef, toSlug: TagSlugRef, xpDelta: number): LearningResult {
  const delta = Math.min(0.1, Math.abs(xpDelta) / 1000);
  return _applyWeightDelta(fromSlug, toSlug, delta);
}

/** Return the current cached weight for an edge (defaults to 1.0 if unknown). */
export function getCachedWeight(fromSlug: TagSlugRef, toSlug: TagSlugRef): number {
  return _weights.get(_edgeKey(fromSlug, toSlug)) ?? 1.0;
}

/** Clear the in-process cache (used in tests). */
export function _clearLearningCacheForTest(): void {
  _weights.clear();
}
