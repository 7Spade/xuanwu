/**
 * @test VS8 Semantic Graph ??Neural Network [D21-3 D21-4]
 *
 * Validates pure business logic in centralized-neural-net/neural-network.ts:
 *   1. computeSemanticDistance   ??Dijkstra weighted shortest-path
 *   2. computeSemanticDistanceMatrix ??pairwise matrix
 *   3. findIsolatedNodes / isIsolatedNode ??D21-3 connectivity enforcement
 *   4. computeRelationWeight     ??product-of-weights along IS_A path
 *   5. getAllGraphNodes           ??slug enumeration from edge registry
 *
 * Architecture:
 *   [D21-3] Isolated nodes violate Neural Network connectivity.
 *   [D21-4] CTA enforces lifecycle; Neural Network computes weights & distances.
 *   [D8]    All tag logic lives in semantic-graph.slice, not shared-kernel.
 */
import { describe, it, expect, beforeEach } from 'vitest';

import { addEdge, _clearEdgesForTest } from '../graph/edges/semantic-edge-store';

import {
  computeSemanticDistance,
  computeSemanticDistanceMatrix,
  findIsolatedNodes,
  isIsolatedNode,
  computeRelationWeight,
  getAllGraphNodes,
} from './semantic-distance';

// ??? Setup ????????????????????????????????????????????????????????????????????

beforeEach(() => {
  _clearEdgesForTest();
});

// ????????????????????????????????????????????????????????????????????
// computeSemanticDistance
// ????????????????????????????????????????????????????????????????????

describe('computeSemanticDistance', () => {
  it('returns hopCount=0 and weightedDistance=0 for identical slugs', () => {
    const result = computeSemanticDistance('skill:welding', 'skill:welding');
    expect(result).not.toBeNull();
    expect(result!.hopCount).toBe(0);
    expect(result!.weightedDistance).toBe(0);
    expect(result!.fromSlug).toBe('skill:welding');
    expect(result!.toSlug).toBe('skill:welding');
  });

  it('returns null when nodes are not connected', () => {
    addEdge('a', 'b', 'IS_A');
    const result = computeSemanticDistance('a', 'c');
    expect(result).toBeNull();
  });

  it('returns hopCount=1 and weightedDistance=1.0 for a direct default-weight edge', () => {
    addEdge('skill:expert', 'skill:senior', 'IS_A');
    const result = computeSemanticDistance('skill:expert', 'skill:senior');
    expect(result).not.toBeNull();
    expect(result!.hopCount).toBe(1);
    // weight=1.0 ??cost = 1/1.0 = 1.0
    expect(result!.weightedDistance).toBeCloseTo(1.0);
  });

  it('returns hopCount=2 for a two-hop IS_A chain', () => {
    addEdge('skill:artisan', 'skill:expert', 'IS_A');
    addEdge('skill:expert', 'skill:senior', 'IS_A');
    const result = computeSemanticDistance('skill:artisan', 'skill:senior');
    expect(result).not.toBeNull();
    expect(result!.hopCount).toBe(2);
    expect(result!.weightedDistance).toBeCloseTo(2.0);
  });

  it('finds path via undirected edge (reverse traversal)', () => {
    // Only a forward edge a ??b; distance from b to a should also resolve
    addEdge('a', 'b', 'IS_A');
    const result = computeSemanticDistance('b', 'a');
    expect(result).not.toBeNull();
    expect(result!.hopCount).toBe(1);
  });

  it('prefers lower cost path (higher weight edge)', () => {
    // Two paths from X to Z:
    //   X --(weight 0.5)--> Y --(weight 1.0)--> Z  cost = 2 + 1 = 3
    //   X --(weight 1.0)--> Z                      cost = 1
    addEdge('x', 'y', 'IS_A', 0.5);
    addEdge('y', 'z', 'IS_A', 1.0);
    addEdge('x', 'z', 'IS_A', 1.0);
    const result = computeSemanticDistance('x', 'z');
    expect(result).not.toBeNull();
    // Direct hop wins: hopCount=1, weightedDistance=1.0
    expect(result!.hopCount).toBe(1);
    expect(result!.weightedDistance).toBeCloseTo(1.0);
  });

  it('returns null when maxHops is exceeded', () => {
    addEdge('a', 'b', 'IS_A');
    addEdge('b', 'c', 'IS_A');
    // Allow only 1 hop ??cannot reach c
    const result = computeSemanticDistance('a', 'c', 1);
    expect(result).toBeNull();
  });

  it('handles REQUIRES edges as well as IS_A', () => {
    addEdge('role:lead', 'skill:leadership', 'REQUIRES');
    const result = computeSemanticDistance('role:lead', 'skill:leadership');
    expect(result).not.toBeNull();
    expect(result!.hopCount).toBe(1);
  });

  it('lower-weight edge results in higher cost (longer semantic distance)', () => {
    addEdge('a', 'b', 'IS_A', 0.1); // cost = 10
    const result = computeSemanticDistance('a', 'b');
    expect(result).not.toBeNull();
    expect(result!.weightedDistance).toBeGreaterThan(1.0);
  });
});

// ????????????????????????????????????????????????????????????????????
// computeSemanticDistanceMatrix
// ????????????????????????????????????????????????????????????????????

describe('computeSemanticDistanceMatrix', () => {
  it('returns empty array for empty slug set', () => {
    const matrix = computeSemanticDistanceMatrix([]);
    expect(matrix).toHaveLength(0);
  });

  it('returns empty array for single-element slug set', () => {
    addEdge('a', 'b', 'IS_A');
    const matrix = computeSemanticDistanceMatrix(['a']);
    expect(matrix).toHaveLength(0);
  });

  it('excludes disconnected pairs', () => {
    addEdge('a', 'b', 'IS_A');
    // c is isolated
    const matrix = computeSemanticDistanceMatrix(['a', 'b', 'c']);
    const involveC = matrix.filter((e) => e.fromSlug === 'c' || e.toSlug === 'c');
    expect(involveC).toHaveLength(0);
  });

  it('returns entries for all connected pairs (bidirectional)', () => {
    addEdge('a', 'b', 'IS_A');
    addEdge('b', 'c', 'IS_A');
    const matrix = computeSemanticDistanceMatrix(['a', 'b', 'c']);
    // All 6 ordered pairs should appear (a?, b?, a?, c?, b?, c?)
    expect(matrix.length).toBe(6);
  });

  it('omits self-pairs (fromSlug === toSlug)', () => {
    addEdge('a', 'b', 'IS_A');
    const matrix = computeSemanticDistanceMatrix(['a', 'b']);
    const selfPairs = matrix.filter((e) => e.fromSlug === e.toSlug);
    expect(selfPairs).toHaveLength(0);
  });

  it('produces consistent distances with computeSemanticDistance', () => {
    addEdge('x', 'y', 'IS_A', 0.8);
    addEdge('y', 'z', 'IS_A', 0.6);
    const matrix = computeSemanticDistanceMatrix(['x', 'y', 'z']);
    const xyEntry = matrix.find((e) => e.fromSlug === 'x' && e.toSlug === 'y');
    const xyDirect = computeSemanticDistance('x', 'y');
    expect(xyEntry).toBeDefined();
    expect(xyEntry!.weightedDistance).toBeCloseTo(xyDirect!.weightedDistance);
  });
});

// ????????????????????????????????????????????????????????????????????
// isIsolatedNode
// ????????????????????????????????????????????????????????????????????

describe('isIsolatedNode', () => {
  it('returns true for a slug with no edges', () => {
    expect(isIsolatedNode('orphan')).toBe(true);
  });

  it('returns false for a slug that has an outgoing edge', () => {
    addEdge('parent', 'child', 'IS_A');
    expect(isIsolatedNode('parent')).toBe(false);
  });

  it('returns false for a slug that has an incoming edge', () => {
    addEdge('parent', 'child', 'IS_A');
    expect(isIsolatedNode('child')).toBe(false);
  });

  it('returns false for a slug that has a REQUIRES outgoing edge', () => {
    addEdge('role:lead', 'skill:mgmt', 'REQUIRES');
    expect(isIsolatedNode('role:lead')).toBe(false);
  });
});

// ????????????????????????????????????????????????????????????????????
// findIsolatedNodes [D21-3]
// ????????????????????????????????????????????????????????????????????

describe('findIsolatedNodes', () => {
  it('returns all slugs that have no edges', () => {
    addEdge('a', 'b', 'IS_A');
    const isolated = findIsolatedNodes(['a', 'b', 'c', 'd']);
    expect(isolated).toContain('c');
    expect(isolated).toContain('d');
    expect(isolated).not.toContain('a');
    expect(isolated).not.toContain('b');
  });

  it('returns empty array when all slugs are connected', () => {
    addEdge('a', 'b', 'IS_A');
    addEdge('b', 'c', 'IS_A');
    const isolated = findIsolatedNodes(['a', 'b', 'c']);
    expect(isolated).toHaveLength(0);
  });

  it('returns empty array when slug list is empty', () => {
    expect(findIsolatedNodes([])).toHaveLength(0);
  });

  it('marks every slug as isolated when no edges exist at all', () => {
    const isolated = findIsolatedNodes(['x', 'y', 'z']);
    expect(isolated).toEqual(expect.arrayContaining(['x', 'y', 'z']));
    expect(isolated).toHaveLength(3);
  });
});

// ????????????????????????????????????????????????????????????????????
// computeRelationWeight [D21-4]
// ????????????????????????????????????????????????????????????????????

describe('computeRelationWeight', () => {
  it('returns 1.0 for the same slug (identity)', () => {
    expect(computeRelationWeight('x', 'x')).toBe(1.0);
  });

  it('returns 0 when no IS_A path exists', () => {
    // No edges at all
    expect(computeRelationWeight('a', 'b')).toBe(0);
  });

  it('returns 0 for a REQUIRES edge only (no IS_A path)', () => {
    addEdge('role:lead', 'skill:mgmt', 'REQUIRES');
    expect(computeRelationWeight('role:lead', 'skill:mgmt')).toBe(0);
  });

  it('returns direct edge weight for a single IS_A hop', () => {
    addEdge('skill:expert', 'skill:senior', 'IS_A', 0.9);
    const w = computeRelationWeight('skill:expert', 'skill:senior');
    expect(w).toBeCloseTo(0.9);
  });

  it('returns default weight 1.0 for a default-weight IS_A edge', () => {
    addEdge('skill:expert', 'skill:senior', 'IS_A');
    expect(computeRelationWeight('skill:expert', 'skill:senior')).toBeCloseTo(1.0);
  });

  it('returns product of weights for a multi-hop IS_A chain', () => {
    addEdge('artisan', 'expert', 'IS_A', 0.8);
    addEdge('expert', 'senior', 'IS_A', 0.9);
    // artisan ??senior weight = 0.8 ? 0.9 = 0.72
    const w = computeRelationWeight('artisan', 'senior');
    expect(w).toBeCloseTo(0.72);
  });

  it('returns the best product when multiple IS_A paths exist', () => {
    // Two paths: A?? (0.8*0.9=0.72) and A?? (0.5*0.5=0.25)
    addEdge('a', 'b', 'IS_A', 0.8);
    addEdge('b', 'd', 'IS_A', 0.9);
    addEdge('a', 'c', 'IS_A', 0.5);
    addEdge('c', 'd', 'IS_A', 0.5);
    const w = computeRelationWeight('a', 'd');
    expect(w).toBeCloseTo(0.72); // best path
  });
});

// ????????????????????????????????????????????????????????????????????
// getAllGraphNodes
// ????????????????????????????????????????????????????????????????????

describe('getAllGraphNodes', () => {
  it('returns empty array when no edges are registered', () => {
    expect(getAllGraphNodes()).toHaveLength(0);
  });

  it('returns both from and to slugs from a single edge', () => {
    addEdge('parent', 'child', 'IS_A');
    const nodes = getAllGraphNodes();
    expect(nodes).toContain('parent');
    expect(nodes).toContain('child');
    expect(nodes).toHaveLength(2);
  });

  it('deduplicates slugs that appear in multiple edges', () => {
    addEdge('a', 'b', 'IS_A');
    addEdge('b', 'c', 'IS_A');
    const nodes = getAllGraphNodes();
    // a, b, c ??b appears in both but must be deduplicated
    expect(nodes).toHaveLength(3);
    expect(new Set(nodes).size).toBe(nodes.length);
  });

  it('includes nodes from REQUIRES edges as well', () => {
    addEdge('role:lead', 'skill:mgmt', 'REQUIRES');
    const nodes = getAllGraphNodes();
    expect(nodes).toContain('role:lead');
    expect(nodes).toContain('skill:mgmt');
  });
});

