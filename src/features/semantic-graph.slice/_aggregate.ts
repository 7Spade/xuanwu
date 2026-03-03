/**
 * semantic-graph.slice — _aggregate.ts
 *
 * VS8 Semantic Graph Aggregate:
 *   - Temporal Conflict Detection (scheduling-aware tag overlap)
 *   - Taxonomy Validation (hierarchical tag classification)
 *
 * Per logic-overview.md (VS8):
 *   ⑥ Everything as a Tag — conflict detection ensures tag assignments
 *      do not violate temporal or taxonomic constraints.
 *
 * Invariants:
 *   [D3]  Side-effects only in _actions.ts; this file is pure logic.
 *   [D8]  Tag logic lives HERE, not in shared-kernel.
 *   [D21] Tag categories governed by VS8.
 *
 * Dependency rule: ZERO infrastructure imports. Pure functions only.
 */

import { TAXONOMY_DIMENSIONS } from '@/features/shared-kernel';
import type { TaxonomyDimension, TaxonomyNode } from '@/features/shared-kernel';

import type {
  TemporalTagAssignment,
  TemporalConflict,
  TemporalConflictCheckInput,
  TemporalConflictCheckResult,
  TaxonomyTree,
  TaxonomyValidationResult,
  TaxonomyValidationError,
  TaxonomyErrorCode,
} from './_types';

// =================================================================
// Temporal Conflict Detection
// =================================================================

const MAX_TAXONOMY_DEPTH = 10;

/**
 * Detects temporal (time-window) conflicts for a candidate tag assignment
 * against a set of existing assignments.
 *
 * Two assignments conflict when:
 *   1. Same entityId AND same tagSlug
 *   2. Time windows overlap (start < other.end AND end > other.start)
 *
 * Designed for scheduling use-cases where a member or workspace
 * cannot be double-booked for the same skill tag in overlapping periods.
 */
export function detectTemporalConflicts(
  input: TemporalConflictCheckInput
): TemporalConflictCheckResult {
  const { candidate, existingAssignments } = input;
  const conflicts: TemporalConflict[] = [];

  for (const existing of existingAssignments) {
    if (
      existing.entityId === candidate.entityId &&
      existing.tagSlug === candidate.tagSlug &&
      isOverlapping(candidate, existing)
    ) {
      const overlapStart = candidate.startDate > existing.startDate
        ? candidate.startDate
        : existing.startDate;
      const overlapEnd = candidate.endDate < existing.endDate
        ? candidate.endDate
        : existing.endDate;

      conflicts.push({
        tagSlug: candidate.tagSlug,
        entityId: candidate.entityId,
        existingAssignment: existing,
        conflictingAssignment: candidate,
        overlapStartDate: overlapStart,
        overlapEndDate: overlapEnd,
      });
    }
  }

  return {
    hasConflict: conflicts.length > 0,
    conflicts,
  };
}

function isOverlapping(a: TemporalTagAssignment, b: TemporalTagAssignment): boolean {
  return a.startDate < b.endDate && a.endDate > b.startDate;
}

// =================================================================
// Taxonomy Validation
// =================================================================

/**
 * Validates a proposed taxonomy node against the existing taxonomy tree.
 *
 * Checks:
 *   - Dimension is known
 *   - Parent exists (if specified)
 *   - No circular reference
 *   - No duplicate slugs
 *   - Depth does not exceed maximum
 */
export function validateTaxonomyAssignment(
  node: TaxonomyNode,
  existingNodes: readonly TaxonomyNode[],
  validDimensions: readonly TaxonomyDimension[] = TAXONOMY_DIMENSIONS
): TaxonomyValidationResult {
  const errors: TaxonomyValidationError[] = [];

  if (!validDimensions.includes(node.dimension)) {
    errors.push(makeError('UNKNOWN_DIMENSION', node.slug, `Unknown taxonomy dimension: "${node.dimension}".`, node.dimension));
  }

  if (existingNodes.some((n) => n.slug === node.slug)) {
    errors.push(makeError('DUPLICATE_SLUG', node.slug, `Tag slug "${node.slug}" already exists in the taxonomy.`));
  }

  if (node.parentSlug) {
    const parent = existingNodes.find((n) => n.slug === node.parentSlug);
    if (!parent) {
      errors.push(makeError('INVALID_PARENT', node.slug, `Parent slug "${node.parentSlug}" not found in the taxonomy.`));
    } else if (parent.dimension !== node.dimension) {
      errors.push(makeError('INVALID_PARENT', node.slug, `Parent "${node.parentSlug}" belongs to dimension "${parent.dimension}", but node is in "${node.dimension}".`, node.dimension));
    }
  }

  if (node.depth > MAX_TAXONOMY_DEPTH) {
    errors.push(makeError('DEPTH_EXCEEDED', node.slug, `Taxonomy depth ${node.depth} exceeds maximum of ${MAX_TAXONOMY_DEPTH}.`));
  }

  if (node.parentSlug) {
    if (hasCircularReference(node.slug, node.parentSlug, existingNodes)) {
      errors.push(makeError('CIRCULAR_REFERENCE', node.slug, `Circular reference detected: "${node.slug}" → "${node.parentSlug}" creates a cycle.`));
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function hasCircularReference(
  nodeSlug: string,
  parentSlug: string,
  existingNodes: readonly TaxonomyNode[]
): boolean {
  const visited = new Set<string>();
  let current: string | undefined = parentSlug;

  while (current) {
    if (current === nodeSlug) return true;
    if (visited.has(current)) return false;
    visited.add(current);
    const parent = existingNodes.find((n) => n.slug === current);
    current = parent?.parentSlug;
  }

  return false;
}

// =================================================================
// Convenience Wrappers (requested API surface)
// =================================================================

/**
 * Simplified API for checking a single new assignment against
 * a set of existing assignments.
 *
 * Delegates to detectTemporalConflicts internally.
 */
export function checkTemporalConflict(
  newAssignment: TemporalTagAssignment,
  existingAssignments: readonly TemporalTagAssignment[]
): TemporalConflictCheckResult {
  return detectTemporalConflicts({
    candidate: newAssignment,
    existingAssignments,
  });
}

/**
 * Validates a taxonomy path (sequence of slugs from root to leaf)
 * against a TaxonomyTree, ensuring every segment exists, the chain is
 * unbroken (each node's parentSlug equals the previous), and the path
 * does not exceed maximum depth.
 */
export function validateTaxonomyPath(
  path: readonly string[],
  tree: TaxonomyTree
): TaxonomyValidationResult {
  const errors: TaxonomyValidationError[] = [];

  if (path.length === 0) {
    errors.push(makeError('INVALID_PARENT', '', 'Taxonomy path is empty.', tree.dimension));
    return { valid: false, errors };
  }

  const nodeMap = buildNodeMap(tree);

  for (let i = 0; i < path.length; i++) {
    const slug = path[i]!;
    const node = nodeMap.get(slug);

    if (!node) {
      errors.push(makeError('INVALID_PARENT', slug, `Slug "${slug}" not found in taxonomy "${tree.dimension}".`, tree.dimension));
      continue;
    }

    if (node.dimension !== tree.dimension) {
      errors.push(makeError('UNKNOWN_DIMENSION', slug, `Slug "${slug}" belongs to dimension "${node.dimension}", expected "${tree.dimension}".`, tree.dimension));
    }

    if (i === 0) {
      if (node.parentSlug) {
        errors.push(makeError('INVALID_PARENT', slug, `Root slug "${slug}" should not have a parent, but has "${node.parentSlug}".`, tree.dimension));
      }
    } else {
      const expectedParent = path[i - 1];
      if (node.parentSlug !== expectedParent) {
        errors.push(makeError('INVALID_PARENT', slug, `Expected parent "${expectedParent}" for slug "${slug}", but found "${node.parentSlug ?? 'none'}".`, tree.dimension));
      }
    }
  }

  if (path.length > MAX_TAXONOMY_DEPTH) {
    errors.push(makeError('DEPTH_EXCEEDED', path[path.length - 1]!, `Path depth ${path.length} exceeds maximum of ${MAX_TAXONOMY_DEPTH}.`, tree.dimension));
  }

  return { valid: errors.length === 0, errors };
}

function buildNodeMap(tree: TaxonomyTree): Map<string, TaxonomyNode> {
  const source = tree.nodes ?? tree.roots;
  const map = new Map<string, TaxonomyNode>();
  for (const node of source) {
    map.set(node.slug, node);
  }
  return map;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function makeError(
  code: TaxonomyErrorCode,
  tagSlug: string,
  message: string,
  dimension?: TaxonomyDimension
): TaxonomyValidationError {
  return { code, message, tagSlug, ...(dimension ? { dimension } : {}) };
}
