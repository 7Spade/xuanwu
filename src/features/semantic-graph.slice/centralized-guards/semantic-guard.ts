/**
 * semantic-graph.slice/centralized-guards — L5 Blood-Brain Barrier (BBB) [D21-H D21-K]
 *
 * SemanticGuard is the **supreme arbiter** of semantic-graph validity.
 * It intercepts EdgeProposals BEFORE they enter the SemanticEdgeStore and
 * rejects any proposal that would violate the graph invariants defined in
 * logic-overview.md [D21].
 *
 * Rules enforced:
 *   [D21-H] 血腦屏障 — invariant-guard owns final veto over all edge proposals.
 *   [D21-K] 語義衝突裁決 — proposals violating semantic / physical logic are
 *            rejected directly; they never reach the edge store.
 *   [D21-9] Synaptic weight invariant — weight ∈ (0.0, 1.0]; cost = 1/weight.
 *   [D21-3] No isolated nodes — self-loop proposals are always rejected.
 *   [D21-A] Uniqueness — exact-duplicate edges are rejected.
 *   [D21-C] No-cycle rule in IS_A hierarchy — cycles make Dijkstra's cost
 *            computation degenerate and violate the subsumption hierarchy.
 *
 * Dependency rule: reads from centralized-edges for cycle detection and
 * duplicate checking ONLY.  ZERO infrastructure imports (no Firebase, no React).
 *
 * 此實作已交叉參考 INDEX.md 並符合 logic-overview.md 之 [D21-H D21-K D21-9 D21-3] 規範
 */

import { getAllEdges } from '../centralized-edges/semantic-edge-store';
import type { SemanticEdge, SemanticRelationType } from '../centralized-types';

// ─── Proposal type ────────────────────────────────────────────────────────────

/**
 * An edge proposal submitted to SemanticGuard for validation before
 * being written to SemanticEdgeStore.
 */
export interface EdgeProposal {
  readonly fromTagSlug: string;
  readonly toTagSlug: string;
  readonly relationType: SemanticRelationType;
  /** Relation strength (0.0, 1.0]; must satisfy weight > 0. [D21-9] */
  readonly weight?: number;
}

// ─── Decision types ───────────────────────────────────────────────────────────

/** Codes explaining why the BBB rejected an edge proposal. */
export type SemanticGuardRejectionCode =
  | 'SELF_LOOP' // fromTagSlug === toTagSlug [D21-3]
  | 'INVALID_WEIGHT' // weight ≤ 0 or weight > 1 [D21-9]
  | 'DUPLICATE_EDGE' // exact same edge already registered [D21-A]
  | 'IS_A_CYCLE' // proposed IS_A edge would create a cycle [D21-C / D21-K]
  | 'SELF_REQUIRES'; // a tag cannot REQUIRE itself (logical absurdity) [D21-K]

/** The decision produced by SemanticGuard.validate(). */
export type SemanticGuardDecision = 'APPROVED' | 'REJECTED';

/** Full validation result returned by SemanticGuard. */
export interface SemanticGuardResult {
  readonly decision: SemanticGuardDecision;
  /** Present only when decision is 'REJECTED'. */
  readonly rejectionCode?: SemanticGuardRejectionCode;
  /** Human-readable explanation of the rejection. */
  readonly reason?: string;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Build a lookup map of IS_A edges keyed by fromTagSlug for quick cycle
 * detection.  Only IS_A edges are included because cycles are meaningful
 * only in the subsumption hierarchy; REQUIRES is allowed to form
 * inter-category dependency graphs.
 */
function _buildIsAGraph(edges: readonly SemanticEdge[]): Map<string, Set<string>> {
  const graph = new Map<string, Set<string>>();
  for (const edge of edges) {
    if (edge.relationType !== 'IS_A') continue;
    const neighbours = graph.get(edge.fromTagSlug) ?? new Set<string>();
    neighbours.add(edge.toTagSlug);
    graph.set(edge.fromTagSlug, neighbours);
  }
  return graph;
}

/**
 * DFS reachability check: can we reach `target` from `start` in `graph`?
 * Used to detect whether adding (proposed → target) would introduce a cycle.
 *
 * A cycle exists when `target` is reachable from `start` in the existing graph
 * AND we are about to add an edge `target → start` (or any edge whose "to"
 * can already reach "from").
 */
function _canReach(start: string, target: string, graph: Map<string, Set<string>>): boolean {
  if (start === target) return true;
  const visited = new Set<string>();
  const stack = [start];
  while (stack.length > 0) {
    const node = stack.pop()!;
    if (node === target) return true;
    if (visited.has(node)) continue;
    visited.add(node);
    const neighbours = graph.get(node);
    if (neighbours) {
      for (const n of neighbours) stack.push(n);
    }
  }
  return false;
}

/**
 * Checks whether the proposed IS_A edge (fromSlug → toSlug) would create a
 * cycle in the existing IS_A graph.
 *
 * A cycle would be introduced if `toSlug` can already reach `fromSlug` in the
 * existing graph, because after adding the edge we would have:
 *   fromSlug → toSlug → … → fromSlug
 */
function _wouldCreateIsACycle(
  fromSlug: string,
  toSlug: string,
  graph: Map<string, Set<string>>
): boolean {
  // Can `toSlug` already reach `fromSlug` in the current IS_A graph?
  return _canReach(toSlug, fromSlug, graph);
}

/**
 * Checks whether an identical edge already exists in the store.
 */
function _isDuplicateEdge(
  fromSlug: string,
  toSlug: string,
  relationType: SemanticRelationType,
  edges: readonly SemanticEdge[]
): boolean {
  return edges.some(
    (e) =>
      e.fromTagSlug === fromSlug &&
      e.toTagSlug === toSlug &&
      e.relationType === relationType
  );
}

// ─── SemanticGuard — the BBB ──────────────────────────────────────────────────

/**
 * Validate an EdgeProposal against all semantic invariants.
 *
 * Call this BEFORE invoking `addEdge()` in the centralized-edges store.
 * Returns an approved result for valid proposals and a rejection with an
 * explanatory code for invalid ones.
 *
 * @example
 * ```ts
 * const result = validateEdgeProposal({ fromTagSlug: 'skill:expert',
 *                                       toTagSlug:   'skill:senior',
 *                                       relationType: 'IS_A',
 *                                       weight: 1.0 });
 * if (result.decision === 'REJECTED') throw new Error(result.reason);
 * addEdge('skill:expert', 'skill:senior', 'IS_A', 1.0);
 * ```
 *
 * [D21-H] BBB owns final veto.
 * [D21-K] Semantic-conflict proposals are rejected at this layer.
 */
export function validateEdgeProposal(proposal: EdgeProposal): SemanticGuardResult {
  const { fromTagSlug, toTagSlug, relationType, weight = 1.0 } = proposal;

  // ── Rule 1: Self-loop check [D21-3] ──────────────────────────────────────
  if (fromTagSlug === toTagSlug) {
    return {
      decision: 'REJECTED',
      rejectionCode: relationType === 'REQUIRES' ? 'SELF_REQUIRES' : 'SELF_LOOP',
      reason: `A tag cannot have a ${relationType} edge pointing to itself: "${fromTagSlug}"`,
    };
  }

  // ── Rule 2: Weight invariant [D21-9] ──────────────────────────────────────
  if (weight <= 0 || weight > 1) {
    return {
      decision: 'REJECTED',
      rejectionCode: 'INVALID_WEIGHT',
      reason: `Edge weight must be in (0.0, 1.0]; received ${weight} for "${fromTagSlug} ${relationType} ${toTagSlug}"`,
    };
  }

  // Read current edge state once for both remaining checks
  const currentEdges = getAllEdges();

  // ── Rule 3: Duplicate edge check [D21-A] ─────────────────────────────────
  if (_isDuplicateEdge(fromTagSlug, toTagSlug, relationType, currentEdges)) {
    return {
      decision: 'REJECTED',
      rejectionCode: 'DUPLICATE_EDGE',
      reason: `Edge "${fromTagSlug} ${relationType} ${toTagSlug}" already exists in the semantic graph`,
    };
  }

  // ── Rule 4: IS_A cycle check [D21-C / D21-K] ─────────────────────────────
  if (relationType === 'IS_A') {
    const isAGraph = _buildIsAGraph(currentEdges);
    if (_wouldCreateIsACycle(fromTagSlug, toTagSlug, isAGraph)) {
      return {
        decision: 'REJECTED',
        rejectionCode: 'IS_A_CYCLE',
        reason: `Adding IS_A edge "${fromTagSlug} → ${toTagSlug}" would create a cycle in the subsumption hierarchy`,
      };
    }
  }

  return { decision: 'APPROVED' };
}
