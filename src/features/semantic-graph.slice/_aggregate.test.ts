/**
 * @test VS8 Semantic Graph ??Aggregate: temporal conflict + taxonomy validation
 *
 * Validates pure business logic in _aggregate.ts:
 *   1. detectTemporalConflicts ??scheduling-aware overlap detection
 *   2. checkTemporalConflict ??convenience wrapper
 *   3. validateTaxonomyAssignment ??node validation against tree
 *   4. validateTaxonomyPath ??slug path validation against TaxonomyTree
 *
 * Architecture:
 *   [D8]  All tag logic resides in semantic-graph.slice, not shared-kernel.
 *   [D21] Tag categories governed by VS8.
 */
import { describe, it, expect } from 'vitest';

import type { TaxonomyNode } from '@/shared-kernel';
import { tagSlugRef } from '@/shared-kernel';

import {
  detectTemporalConflicts,
  checkTemporalConflict,
  validateTaxonomyAssignment,
  validateTaxonomyPath,
} from './_aggregate';
import type {
  TemporalTagAssignment,
  TaxonomyTree,
} from './_types';

// ??? Helpers ??????????????????????????????????????????????????????????????????

function makeAssignment(
  overrides: Partial<TemporalTagAssignment> = {}
): TemporalTagAssignment {
  return {
    tagSlug: tagSlugRef('skill-welding'),
    entityId: 'member-1',
    entityType: 'member',
    startDate: '2025-01-01',
    endDate: '2025-01-31',
    ...overrides,
  };
}

function makeNode(overrides: Partial<TaxonomyNode> = {}): TaxonomyNode {
  return {
    slug: 'welding',
    label: 'Welding',
    dimension: 'skill',
    depth: 0,
    ...overrides,
  };
}

// ????????????????????????????????????????????????????????????????????
// detectTemporalConflicts
// ????????????????????????????????????????????????????????????????????

describe('detectTemporalConflicts', () => {
  it('returns no conflict when there are no existing assignments', () => {
    const result = detectTemporalConflicts({
      candidate: makeAssignment(),
      existingAssignments: [],
    });
    expect(result.hasConflict).toBe(false);
    expect(result.conflicts).toHaveLength(0);
  });

  it('detects overlap when same entity + same tag have overlapping windows', () => {
    const existing = makeAssignment({
      startDate: '2025-01-15',
      endDate: '2025-02-15',
    });
    const candidate = makeAssignment({
      startDate: '2025-01-01',
      endDate: '2025-01-31',
    });
    const result = detectTemporalConflicts({
      candidate,
      existingAssignments: [existing],
    });
    expect(result.hasConflict).toBe(true);
    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0]!.overlapStartDate).toBe('2025-01-15');
    expect(result.conflicts[0]!.overlapEndDate).toBe('2025-01-31');
  });

  it('returns no conflict when windows are adjacent (no overlap)', () => {
    const existing = makeAssignment({
      startDate: '2025-02-01',
      endDate: '2025-02-28',
    });
    const candidate = makeAssignment({
      startDate: '2025-01-01',
      endDate: '2025-01-31',
    });
    const result = detectTemporalConflicts({
      candidate,
      existingAssignments: [existing],
    });
    expect(result.hasConflict).toBe(false);
  });

  it('returns no conflict for different entities with same tag', () => {
    const existing = makeAssignment({
      entityId: 'member-2',
      startDate: '2025-01-01',
      endDate: '2025-01-31',
    });
    const candidate = makeAssignment({
      entityId: 'member-1',
      startDate: '2025-01-01',
      endDate: '2025-01-31',
    });
    const result = detectTemporalConflicts({
      candidate,
      existingAssignments: [existing],
    });
    expect(result.hasConflict).toBe(false);
  });

  it('returns no conflict for same entity with different tags', () => {
    const existing = makeAssignment({
      tagSlug: tagSlugRef('skill-painting'),
      startDate: '2025-01-01',
      endDate: '2025-01-31',
    });
    const candidate = makeAssignment({
      tagSlug: tagSlugRef('skill-welding'),
      startDate: '2025-01-01',
      endDate: '2025-01-31',
    });
    const result = detectTemporalConflicts({
      candidate,
      existingAssignments: [existing],
    });
    expect(result.hasConflict).toBe(false);
  });

  it('detects multiple conflicts against several overlapping assignments', () => {
    const existing = [
      makeAssignment({ startDate: '2025-01-05', endDate: '2025-01-20' }),
      makeAssignment({ startDate: '2025-01-15', endDate: '2025-02-05' }),
    ];
    const candidate = makeAssignment({
      startDate: '2025-01-10',
      endDate: '2025-01-25',
    });
    const result = detectTemporalConflicts({
      candidate,
      existingAssignments: existing,
    });
    expect(result.hasConflict).toBe(true);
    expect(result.conflicts).toHaveLength(2);
  });
});

// ????????????????????????????????????????????????????????????????????
// checkTemporalConflict (convenience wrapper)
// ????????????????????????????????????????????????????????????????????

describe('checkTemporalConflict', () => {
  it('delegates to detectTemporalConflicts and returns same result', () => {
    const existing = makeAssignment({
      startDate: '2025-01-10',
      endDate: '2025-01-20',
    });
    const candidate = makeAssignment({
      startDate: '2025-01-15',
      endDate: '2025-01-25',
    });
    const result = checkTemporalConflict(candidate, [existing]);
    expect(result.hasConflict).toBe(true);
    expect(result.conflicts).toHaveLength(1);
  });

  it('returns no conflict when windows do not overlap', () => {
    const existing = makeAssignment({
      startDate: '2025-03-01',
      endDate: '2025-03-31',
    });
    const candidate = makeAssignment({
      startDate: '2025-01-01',
      endDate: '2025-01-31',
    });
    const result = checkTemporalConflict(candidate, [existing]);
    expect(result.hasConflict).toBe(false);
  });
});

// ????????????????????????????????????????????????????????????????????
// validateTaxonomyAssignment
// ????????????????????????????????????????????????????????????????????

describe('validateTaxonomyAssignment', () => {
  it('accepts a valid root node with known dimension', () => {
    const node = makeNode({ slug: 'new-skill', dimension: 'skill', depth: 0 });
    const result = validateTaxonomyAssignment(node, []);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects unknown dimension', () => {
    const node = makeNode({ dimension: 'fantasy' as never });
    const result = validateTaxonomyAssignment(node, []);
    expect(result.valid).toBe(false);
    expect(result.errors[0]!.code).toBe('UNKNOWN_DIMENSION');
  });

  it('rejects duplicate slug', () => {
    const existing = [makeNode({ slug: 'welding' })];
    const node = makeNode({ slug: 'welding' });
    const result = validateTaxonomyAssignment(node, existing);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'DUPLICATE_SLUG')).toBe(true);
  });

  it('rejects missing parent', () => {
    const node = makeNode({ slug: 'child', parentSlug: 'nonexistent', depth: 1 });
    const result = validateTaxonomyAssignment(node, []);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'INVALID_PARENT')).toBe(true);
  });

  it('rejects cross-dimension parent', () => {
    const parent = makeNode({ slug: 'loc-root', dimension: 'location', depth: 0 });
    const node = makeNode({ slug: 'child', dimension: 'skill', parentSlug: 'loc-root', depth: 1 });
    const result = validateTaxonomyAssignment(node, [parent]);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'INVALID_PARENT')).toBe(true);
  });

  it('rejects depth exceeding maximum', () => {
    const node = makeNode({ slug: 'deep', depth: 11 });
    const result = validateTaxonomyAssignment(node, []);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'DEPTH_EXCEEDED')).toBe(true);
  });

  it('detects circular reference', () => {
    const a = makeNode({ slug: 'a', parentSlug: 'c', depth: 1 });
    const node = makeNode({ slug: 'c', parentSlug: 'a', depth: 1 });
    const result = validateTaxonomyAssignment(node, [a]);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'CIRCULAR_REFERENCE')).toBe(true);
  });

  it('accepts valid child node with correct parent', () => {
    const parent = makeNode({ slug: 'structural', dimension: 'skill', depth: 0 });
    const node = makeNode({ slug: 'welding', parentSlug: 'structural', depth: 1 });
    const result = validateTaxonomyAssignment(node, [parent]);
    expect(result.valid).toBe(true);
  });
});

// ????????????????????????????????????????????????????????????????????
// validateTaxonomyPath
// ????????????????????????????????????????????????????????????????????

describe('validateTaxonomyPath', () => {
  const tree: TaxonomyTree = {
    dimension: 'skill',
    roots: [
      makeNode({ slug: 'root', depth: 0 }),
    ],
    nodes: [
      makeNode({ slug: 'root', depth: 0 }),
      makeNode({ slug: 'mid', parentSlug: 'root', depth: 1 }),
      makeNode({ slug: 'leaf', parentSlug: 'mid', depth: 2 }),
    ],
    nodeCount: 3,
  };

  it('validates a correct root-to-leaf path', () => {
    const result = validateTaxonomyPath(['root', 'mid', 'leaf'], tree);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects empty path', () => {
    const result = validateTaxonomyPath([], tree);
    expect(result.valid).toBe(false);
    expect(result.errors[0]!.code).toBe('INVALID_PARENT');
  });

  it('rejects path with unknown slug', () => {
    const result = validateTaxonomyPath(['root', 'nonexistent'], tree);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.tagSlug === 'nonexistent')).toBe(true);
  });

  it('rejects path where root has a parent', () => {
    const treeWithBadRoot: TaxonomyTree = {
      dimension: 'skill',
      roots: [makeNode({ slug: 'child', parentSlug: 'someone', depth: 1 })],
      nodes: [makeNode({ slug: 'child', parentSlug: 'someone', depth: 1 })],
      nodeCount: 1,
    };
    const result = validateTaxonomyPath(['child'], treeWithBadRoot);
    expect(result.valid).toBe(false);
  });

  it('rejects path with broken parent chain', () => {
    const result = validateTaxonomyPath(['root', 'leaf'], tree);
    expect(result.valid).toBe(false);
  });

  it('uses nodes field over roots when available', () => {
    const treeNodesOnly: TaxonomyTree = {
      dimension: 'skill',
      roots: [],
      nodes: [
        makeNode({ slug: 'a', depth: 0 }),
        makeNode({ slug: 'b', parentSlug: 'a', depth: 1 }),
      ],
      nodeCount: 2,
    };
    const result = validateTaxonomyPath(['a', 'b'], treeNodesOnly);
    expect(result.valid).toBe(true);
  });
});
