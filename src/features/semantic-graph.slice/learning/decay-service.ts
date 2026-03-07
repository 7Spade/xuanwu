/**
 * Module: semantic-graph.slice/centralized-learning - [L6 VS8_PLAST] Decay Service
 *
 * Natural synaptic weight decay: edges that are not reinforced by real facts
 * gradually decay toward a configurable floor, preventing stale relationships
 * from dominating Dijkstra routing [D21-G].
 *
 * Invariants:
 *   [D21-G]  Decay is the only mechanism that may decrease a synaptic weight.
 *   [D21-9]  Weights must remain > 0 after decay (floor = DECAY_FLOOR constant).
 *   [D24]    No direct Firebase import.
 *
 * @see docs/architecture/slices/semantic-graph.md - L6 VS8_PLAST
 */

import type { SemanticEdge } from '../core/types';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

/** Fraction removed from a weight on each decay run [D21-G]. */
export const DECAY_RATE = 0.01;

/** Minimum weight after decay; weights must stay > 0 [D21-9]. */
export const DECAY_FLOOR = 0.05;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DecayResult {
  readonly edgeId: string;
  readonly previousWeight: number;
  readonly newWeight: number;
  readonly decayedAt: string;
}

// ---------------------------------------------------------------------------
// Core logic
// ---------------------------------------------------------------------------

/**
 * Compute the decayed weight for a single edge without mutating it.
 *
 * Invariants enforced:
 *   [D21-G] Decay is the only mechanism that may decrease synaptic weight.
 *   [D21-9] Result is clamped to DECAY_FLOOR (never reaches 0).
 */
export function computeDecayedWeight(currentWeight: number): number {
  const decayed = currentWeight - DECAY_RATE;
  return Math.max(decayed, DECAY_FLOOR);
}

/**
 * Apply one decay step to the given edge object.
 * Returns a new edge record with the updated weight.
 *
 * [D21-G] Caller is responsible for persisting the returned record.
 * [D24]   No Firebase import; persistence is the infra adapter's concern.
 */
export function applyDecay(edge: SemanticEdge): DecayResult {
  const newWeight = computeDecayedWeight(edge.weight);
  return {
    edgeId: edge.edgeId,
    previousWeight: edge.weight,
    newWeight,
    decayedAt: new Date().toISOString(),
  };
}

/**
 * Apply one decay step to every edge in the provided list.
 * Returns the list of DecayResult records for persistence.
 *
 * Called by a scheduled Cloud Function [D21-G].
 */
export function scheduleDecayRun(edges: readonly SemanticEdge[]): readonly DecayResult[] {
  return edges.map(applyDecay);
}
