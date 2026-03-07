/**
 * Module: adjacency-list
 * Purpose: VS8_SL Synapse Layer ??Topology closure operations [D21-10]
 * Responsibilities: Build and expose adjacency-list representations of the
 *   semantic graph for efficient BFS/DFS traversals; provide topology-closure
 *   operations that business slices are forbidden to implement directly
 * Constraints: deterministic logic, ZERO infrastructure imports, respect module boundaries
 *
 * semantic-graph.slice/centralized-edges ??Adjacency List [D21-10]
 *
 * Provides an adjacency-list view of the semantic edge graph optimised for
 * BFS and DFS traversal.  Business slices (workspace, scheduling, ?? MUST
 * NOT replicate this logic; they access topology through the _queries.ts
 * outbound port [D4 D7 D21-10].
 *
 * Topology-closure operations:
 *   - buildAdjacencyList()        ??full graph: all relation types
 *   - buildIsAAdjacencyList()     ??IS_A sub-graph only
 *   - buildRequiresAdjacencyList() ??REQUIRES sub-graph only
 *   - getReachableNodes()         ??BFS reachability from a source node
 *   - getTopologicalOrder()       ??Kahn's algorithm for DAG topological sort
 *
 * Rules:
 *   [D21-10] Topology observability ??all topology queries go through this
 *             module; no direct edge-store traversal by consumers.
 *
 * Dependency rule: imports from semantic-edge-store ONLY.
 * ZERO infrastructure imports (no Firebase, no React, no I/O).
 */

import type { SemanticEdge, SemanticRelationType } from '../core/types';

import { getAllEdges } from './semantic-edge-store';

// ?€?€?€ Types ?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€

/** Adjacency list: node slug ??set of neighbour slugs. */
export type AdjacencyList = Map<string, Set<string>>;

// ?€?€?€ Internal helpers ?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€

function _buildFromEdges(
  edges: readonly SemanticEdge[],
  filterType?: SemanticRelationType
): AdjacencyList {
  const list: AdjacencyList = new Map();

  for (const edge of edges) {
    if (filterType !== undefined && edge.relationType !== filterType) continue;

    const from = edge.fromTagSlug as string;
    const to = edge.toTagSlug as string;

    if (!list.has(from)) list.set(from, new Set());
    if (!list.has(to)) list.set(to, new Set());

    list.get(from)!.add(to);
  }

  return list;
}

// ?€?€?€ Public API ?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€

/**
 * Build a full adjacency list from all edges currently in the edge store.
 * [D21-10] Topology observability.
 */
export function buildAdjacencyList(): AdjacencyList {
  return _buildFromEdges(getAllEdges());
}

/**
 * Build an adjacency list for the IS_A sub-graph only.
 * Used for subsumption hierarchy traversal and cycle detection.
 */
export function buildIsAAdjacencyList(): AdjacencyList {
  return _buildFromEdges(getAllEdges(), 'IS_A');
}

/**
 * Build an adjacency list for the REQUIRES sub-graph only.
 * Used for transitive dependency resolution.
 */
export function buildRequiresAdjacencyList(): AdjacencyList {
  return _buildFromEdges(getAllEdges(), 'REQUIRES');
}

/**
 * Return all nodes reachable from `sourceSlug` via BFS in `graph`.
 * The source node itself is NOT included in the result set.
 *
 * [D21-10] Topology observability.
 */
export function getReachableNodes(sourceSlug: string, graph: AdjacencyList): ReadonlySet<string> {
  const visited = new Set<string>();
  const queue = [sourceSlug];

  while (queue.length > 0) {
    const node = queue.shift()!;
    if (visited.has(node)) continue;
    if (node !== sourceSlug) visited.add(node);

    const neighbours = graph.get(node);
    if (neighbours) {
      for (const n of neighbours) {
        if (!visited.has(n)) queue.push(n);
      }
    }
  }

  return visited;
}

/**
 * Compute a topological order of nodes in `graph` using Kahn's algorithm.
 * Returns `null` if the graph contains a cycle (not a DAG).
 *
 * Useful for determining evaluation order for transitive dependency resolution.
 * [D21-10] Topology observability.
 */
export function getTopologicalOrder(graph: AdjacencyList): readonly string[] | null {
  // Compute in-degree for every node
  const inDegree = new Map<string, number>();
  for (const node of graph.keys()) {
    if (!inDegree.has(node)) inDegree.set(node, 0);
    for (const neighbour of graph.get(node)!) {
      inDegree.set(neighbour, (inDegree.get(neighbour) ?? 0) + 1);
    }
  }

  // Initialize queue with zero-in-degree nodes
  const queue: string[] = [];
  for (const [node, degree] of inDegree) {
    if (degree === 0) queue.push(node);
  }

  const order: string[] = [];
  while (queue.length > 0) {
    const node = queue.shift()!;
    order.push(node);

    for (const neighbour of graph.get(node) ?? new Set<string>()) {
      const newDegree = (inDegree.get(neighbour) ?? 1) - 1;
      inDegree.set(neighbour, newDegree);
      if (newDegree === 0) queue.push(neighbour);
    }
  }

  // If not all nodes are in the order, there is a cycle
  return order.length === inDegree.size ? order : null;
}
