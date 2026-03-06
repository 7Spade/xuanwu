/**
 * semantic-graph.slice ??_types.ts
 *
 * VS8 Semantic Graph Domain Types.
 * The Brain ??manages tag taxonomy, temporal conflict detection,
 * and semantic indexing for cross-domain queries.
 *
 * Per logic-overview.md (VS8):
 *   SemanticGraph = 隤儔??撘? / The Brain
 *   ??Everything as a Tag: all domain concepts modelled as semantic tags,
 *      governed by VS8.
 *
 * Invariants:
 *   [D21] New tag categories only defined in VS8.
 *   [D3]  Side-effects only in _actions.ts.
 *   [D8]  Tag logic must NOT reside in shared-kernel ??only contracts there.
 *
 * Dependency rule: ZERO infrastructure imports.
 */

import type {
  TaxonomyDimension,
  TaxonomyNode,
  SemanticSearchHit,
  TagSlugRef,
} from '@/shared-kernel';

// ??? Temporal Conflict (Scheduling-aware) ?????????????????????????????????????

/**
 * Represents a time-bound tag assignment ??used for detecting scheduling
 * conflicts where the same tag (e.g., a member skill) is assigned to
 * overlapping time windows.
 */
export interface TemporalTagAssignment {
  readonly tagSlug: TagSlugRef;
  readonly entityId: string;
  readonly entityType: 'member' | 'workspace' | 'schedule';
  readonly startDate: string;
  readonly endDate: string;
  /** Optional location scope for location-aware conflict detection. */
  readonly locationId?: string;
}

/**
 * Result of temporal conflict detection.
 * A conflict occurs when the same entity has overlapping tag assignments
 * within the same time window.
 */
export interface TemporalConflict {
  readonly tagSlug: TagSlugRef;
  readonly entityId: string;
  readonly existingAssignment: TemporalTagAssignment;
  readonly conflictingAssignment: TemporalTagAssignment;
  readonly overlapStartDate: string;
  readonly overlapEndDate: string;
}

/**
 * Input for the temporal conflict detection algorithm.
 */
export interface TemporalConflictCheckInput {
  readonly candidate: TemporalTagAssignment;
  readonly existingAssignments: readonly TemporalTagAssignment[];
}

/**
 * Output of temporal conflict detection.
 */
export interface TemporalConflictCheckResult {
  readonly hasConflict: boolean;
  readonly conflicts: readonly TemporalConflict[];
}

// ??? Taxonomy Validation ??????????????????????????????????????????????????????

/**
 * Taxonomy tree structure ??hierarchical view of all tags in a dimension.
 */
export interface TaxonomyTree {
  readonly dimension: TaxonomyDimension;
  readonly roots: readonly TaxonomyNode[];
  /** Flat list of ALL nodes in the tree (roots + descendants). */
  readonly nodes?: readonly TaxonomyNode[];
  readonly nodeCount: number;
}

/**
 * Taxonomy validation result for a proposed tag assignment.
 */
export interface TaxonomyValidationResult {
  readonly valid: boolean;
  readonly errors: readonly TaxonomyValidationError[];
}

/**
 * Taxonomy validation error.
 */
export interface TaxonomyValidationError {
  readonly code: TaxonomyErrorCode;
  readonly message: string;
  readonly tagSlug: TagSlugRef;
  readonly dimension?: TaxonomyDimension;
}

export type TaxonomyErrorCode =
  | 'UNKNOWN_DIMENSION'
  | 'INVALID_PARENT'
  | 'CIRCULAR_REFERENCE'
  | 'DUPLICATE_SLUG'
  | 'DEPTH_EXCEEDED'
  | 'DEPRECATED_TAG';

// ??? Semantic Index ???????????????????????????????????????????????????????????

/**
 * An entry in the VS8 semantic index ??the in-memory searchable representation
 * of a domain entity. Consumed by global-search.slice for cross-domain queries.
 */
export interface SemanticIndexEntry {
  readonly id: string;
  readonly domain: string;
  readonly title: string;
  readonly subtitle?: string;
  readonly tags: readonly string[];
  /** Indexed text content for full-text search. */
  readonly searchableText: string;
  readonly href?: string;
  readonly updatedAt: string;
}

/**
 * Semantic index statistics ??used for observability.
 */
export interface SemanticIndexStats {
  readonly totalEntries: number;
  readonly entriesByDomain: Record<string, number>;
  readonly lastUpdatedAt: string;
}

// ??? Re-export shared primitives for consumer convenience ?????????????????????

export type { TaxonomyDimension, TaxonomyNode, SemanticSearchHit };
