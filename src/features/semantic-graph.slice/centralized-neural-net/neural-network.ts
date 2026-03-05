/**
 * semantic-graph.slice/centralized-neural-net — Neural Network [D21-3 D21-4]
 *
 * Implements the 🧬 Neural Network component of VS8_NG (Node/Graph Layer):
 *   - Weighted semantic-distance computation (Dijkstra on the edge graph)
 *   - Pairwise semantic-distance matrix
 *   - Isolated-node detection (孤立標籤 = D21-3 violation)
 *   - Relation-weight computation (cumulative weight along the shortest IS_A path)
 *
 * Dependency rule: ZERO infrastructure imports (no Firebase, no React, no I/O).
 * Reads the edge graph from centralized-edges only.
 */

import {
  getAllEdges,
  getEdgesFrom,
  getEdgesTo,
} from '../centralized-edges/semantic-edge-store';
import type { SemanticDistanceEntry } from '../centralized-types';

/** Minimum edge weight used as the divisor in the Dijkstra cost formula,
 *  preventing division by zero for zero-weight edges. */
const MIN_EDGE_WEIGHT = 0.001;

// ─── Internal Dijkstra queue helpers ─────────────────────────────────────────

interface _QueueEntry {
  slug: string;
  distance: number;
  hopCount: number;
}

/**
 * Run Dijkstra from `fromSlug` over the full edge graph (treated as undirected
 * for distance purposes).  Edge cost = 1.0 / weight so high-weight edges are
 * "shorter".
 *
 * Returns a map: slug → { distance, hopCount } for every reachable node.
 */
function _dijkstra(
  fromSlug: string,
  maxHops: number
): Map<string, { distance: number; hopCount: number }> {
  const dist = new Map<string, { distance: number; hopCount: number }>();
  dist.set(fromSlug, { distance: 0, hopCount: 0 });

  const queue: _QueueEntry[] = [{ slug: fromSlug, distance: 0, hopCount: 0 }];
  const visited = new Set<string>();

  while (queue.length > 0) {
    // Extract minimum-distance entry (simple linear scan — graph is small)
    let minIdx = 0;
    for (let i = 1; i < queue.length; i++) {
      if (queue[i].distance < queue[minIdx].distance) minIdx = i;
    }
    const current = queue.splice(minIdx, 1)[0];

    if (visited.has(current.slug)) continue;
    visited.add(current.slug);

    if (current.hopCount >= maxHops) continue;

    // Collect neighbours from both outgoing and incoming edges (undirected)
    const outEdges = getEdgesFrom(current.slug);
    const inEdges = getEdgesTo(current.slug);

    for (const edge of [...outEdges, ...inEdges]) {
      const neighborSlug =
        edge.fromTagSlug === current.slug ? edge.toTagSlug : edge.fromTagSlug;

      if (visited.has(neighborSlug)) continue;

      // cost is inverse of weight so stronger edges have shorter distance
      const edgeCost = 1.0 / Math.max(edge.weight, MIN_EDGE_WEIGHT);
      const newDist = current.distance + edgeCost;
      const existing = dist.get(neighborSlug);

      if (!existing || newDist < existing.distance) {
        const hopCount = current.hopCount + 1;
        dist.set(neighborSlug, { distance: newDist, hopCount });
        queue.push({ slug: neighborSlug, distance: newDist, hopCount });
      }
    }
  }

  return dist;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Compute the shortest weighted semantic distance between two nodes.
 *
 * Uses Dijkstra over the IS_A + REQUIRES edge graph (undirected for distance).
 * Returns `null` when no path exists within `maxHops`.
 *
 * @param fromSlug  — source tag slug
 * @param toSlug    — target tag slug
 * @param maxHops   — maximum edge hops to explore (default 10)
 */
export function computeSemanticDistance(
  fromSlug: string,
  toSlug: string,
  maxHops = 10
): SemanticDistanceEntry | null {
  if (fromSlug === toSlug) {
    return { fromSlug, toSlug, hopCount: 0, weightedDistance: 0 };
  }

  const reachable = _dijkstra(fromSlug, maxHops);
  const entry = reachable.get(toSlug);
  if (!entry) return null;

  return {
    fromSlug,
    toSlug,
    hopCount: entry.hopCount,
    weightedDistance: entry.distance,
  };
}

/**
 * Compute the full pairwise semantic-distance matrix for a set of tag slugs.
 *
 * Returns only entries where a finite path exists (unreachable pairs are
 * omitted — callers may treat absence as Infinity).
 *
 * @param slugs   — set of tag slugs to compare (order-independent)
 * @param maxHops — maximum edge hops per Dijkstra run (default 10)
 */
export function computeSemanticDistanceMatrix(
  slugs: readonly string[],
  maxHops = 10
): readonly SemanticDistanceEntry[] {
  const results: SemanticDistanceEntry[] = [];

  for (const from of slugs) {
    const reachable = _dijkstra(from, maxHops);
    for (const to of slugs) {
      if (from === to) continue;
      const entry = reachable.get(to);
      if (entry) {
        results.push({
          fromSlug: from,
          toSlug: to,
          hopCount: entry.hopCount,
          weightedDistance: entry.distance,
        });
      }
    }
  }

  return results;
}

/**
 * Determine whether a tag slug is an **isolated node** — i.e. has NO edges
 * (neither outgoing nor incoming, across all relation types).
 *
 * Isolated nodes violate D21-3 (node-connectivity rule).
 */
export function isIsolatedNode(tagSlug: string): boolean {
  return getEdgesFrom(tagSlug).length === 0 && getEdgesTo(tagSlug).length === 0;
}

/**
 * Return all isolated nodes from a given set of tag slugs [D21-3].
 *
 * These are candidates for D21-3 violations that must be resolved
 * by adding a `parentTagSlug` attribution (IS_A edge).
 */
export function findIsolatedNodes(allTagSlugs: readonly string[]): readonly string[] {
  return allTagSlugs.filter((slug) => isIsolatedNode(slug));
}

/**
 * Compute the cumulative relation weight from `fromSlug` to `toSlug` along
 * the shortest IS_A path.
 *
 * - Direct edge (1 hop, weight w) → returns w
 * - Multi-hop: returns the product of edge weights along the path
 * - No IS_A path: returns 0
 *
 * Used by the Causality Tracer to rank affected nodes by semantic proximity.
 */
export function computeRelationWeight(fromSlug: string, toSlug: string): number {
  if (fromSlug === toSlug) return 1.0;

  // BFS that tracks the product of weights along IS_A edges only
  const bestWeight = new Map<string, number>();
  bestWeight.set(fromSlug, 1.0);

  const queue: Array<{ slug: string; weight: number }> = [
    { slug: fromSlug, weight: 1.0 },
  ];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (visited.has(current.slug)) continue;
    visited.add(current.slug);

    for (const edge of getEdgesFrom(current.slug)) {
      if (edge.relationType !== 'IS_A') continue;

      const neighbor = edge.toTagSlug;
      const newWeight = current.weight * edge.weight;

      const existing = bestWeight.get(neighbor) ?? 0;
      if (newWeight > existing) {
        bestWeight.set(neighbor, newWeight);
        queue.push({ slug: neighbor, weight: newWeight });
      }
    }
  }

  return bestWeight.get(toSlug) ?? 0;
}

/**
 * Return all unique tag slugs present in the edge graph
 * (as either source or target of any edge).
 *
 * Useful for bootstrapping the distance matrix without an explicit slug list.
 */
export function getAllGraphNodes(): readonly string[] {
  const nodes = new Set<string>();
  for (const edge of getAllEdges()) {
    nodes.add(edge.fromTagSlug);
    nodes.add(edge.toTagSlug);
  }
  return Array.from(nodes);
}
