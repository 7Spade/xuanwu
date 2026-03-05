/**
 * semantic-graph.slice — _queries.ts
 *
 * [D4] QGWAY_SEARCH read-out port for semantic-graph.slice.
 *
 * This file is the query gateway adaptor — it bridges the in-memory
 * semantic services and projections to external consumers
 * who access the slice only through its index.ts barrel.
 *
 * Architecture rules:
 *   [D4]  Read-only; no mutations allowed here.
 *   [D7]  Exposed via index.ts only — internal modules NOT re-exported here.
 *   [D24] No direct firebase/* import.
 *   [D26] VS8 is the Global Search authority; this file is its outbound query API.
 *
 * Dependency rule: ZERO infrastructure imports (no Firebase, no React, no I/O).
 */

import { querySemanticIndex, getIndexStats } from './_services';
import {
  traceAffectedNodes,
  rankAffectedNodes,
  buildDownstreamEvents,
  buildCausalityChain,
} from './centralized-causality/causality-tracer';
import { getEdgesByType } from './centralized-edges/semantic-edge-store';
import {
  computeSemanticDistance,
  computeSemanticDistanceMatrix,
  findIsolatedNodes,
} from './centralized-neural-net/neural-network';
import type { SemanticEdge, StaleTagWarning } from './centralized-types';
import { detectStaleTagWarnings } from './centralized-workflows/tag-lifecycle.workflow';
import { getEligibleTags, satisfiesSemanticRequirement, buildEligibilityMatrix } from './projections/graph-selectors';


// ─── Tag eligibility reads (VS6 / VS4) ───────────────────────────────────────

export {
  /**
   * Return eligible tags filtered by category/state/limit.
   * Primary entry point for VS6 scheduling eligibility queries.
   */
  getEligibleTags,
  /**
   * Check if a candidate slug semantically satisfies a required slug (IS_A).
   */
  satisfiesSemanticRequirement,
  /**
   * Build a full eligibility matrix: required → candidates.
   */
  buildEligibilityMatrix,
};

// ─── Semantic index reads (VS8 / Global Search) ───────────────────────────────

/**
 * Query the semantic index — delegates to _services.querySemanticIndex.
 * Used by Global Search (QGWAY_SEARCH) cross-domain retrieval.
 */
export { querySemanticIndex, getIndexStats };

// ─── Edge graph reads ─────────────────────────────────────────────────────────

/**
 * Return all registered IS_A edges (inheritance graph).
 */
export function getIsAEdges(): readonly SemanticEdge[] {
  return getEdgesByType('IS_A');
}

/**
 * Return all registered REQUIRES edges (dependency graph).
 */
export function getRequiresEdges(): readonly SemanticEdge[] {
  return getEdgesByType('REQUIRES');
}

// ─── Stale tag query ──────────────────────────────────────────────────────────

/**
 * Return all tags currently exceeding TAG_MAX_STALENESS.
 */
export function queryStaleTagWarnings(): readonly StaleTagWarning[] {
  return detectStaleTagWarnings();
}

// ─── Neural Network reads [D21-3 D21-4] ──────────────────────────────────────

export {
  /**
   * Compute the shortest weighted semantic distance between two nodes.
   * Returns null when no path exists within maxHops. [D21-3]
   */
  computeSemanticDistance,
  /**
   * Compute the full pairwise semantic-distance matrix for a set of slugs.
   * Unreachable pairs are omitted (treat absence as Infinity). [D21-3]
   */
  computeSemanticDistanceMatrix,
  /**
   * Return all isolated nodes (no edges) from a set of slugs. [D21-3]
   * Isolated nodes violate the connectivity constraint of the Neural Network.
   */
  findIsolatedNodes,
};

// ─── Causality Tracer reads [D21-6] ──────────────────────────────────────────

export {
  /**
   * Return all nodes directly or transitively affected by a TagLifecycleEvent,
   * filtered to candidateSlugs allow-list, ranked by (hopCount asc, semanticWeight desc). [D21-6]
   */
  traceAffectedNodes,
  /**
   * Sort affected nodes by (hopCount asc, semanticWeight desc). [D21-6]
   */
  rankAffectedNodes,
  /**
   * Build advisory downstream lifecycle events for an event + affected-node set. [D21-6]
   * TAG_DELETED source → no downstream events.
   */
  buildDownstreamEvents,
  /**
   * Build the full CausalityChain for a TagLifecycleEvent.
   * Consumed by VS8_ROUT to dispatch downstream commands. [D21-6]
   */
  buildCausalityChain,
};

