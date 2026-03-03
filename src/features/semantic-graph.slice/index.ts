/**
 * semantic-graph.slice — Public API
 *
 * VS8 Semantic Graph: The Brain — manages tag taxonomy, temporal conflict
 * detection for scheduling, and semantic indexing for cross-domain queries.
 *
 * Per logic-overview.md (VS8):
 *   ⑥ Everything as a Tag: all domain concepts modelled as semantic tags,
 *      governed by VS8 (Semantic Graph).
 *
 * Sub-modules:
 *   _types      — Domain types (temporal conflict, taxonomy, semantic index)
 *   _aggregate  — Temporal conflict detection + taxonomy validation
 *   _services   — Semantic index management (to be implemented)
 *
 * Architecture rules:
 *   [D3]  All entity changes via _actions.ts only.
 *   [D8]  Tag logic resides HERE, not in shared-kernel (shared-kernel holds contracts only).
 *   [D19] Core contracts defined in shared-kernel/semantic-primitives.
 *   [D21] New tag categories only defined via VS8.
 *   [D26] semantic-graph.slice owns _actions.ts / _services.ts; does not parasitize shared-kernel.
 *
 * External consumers import from '@/features/semantic-graph.slice'.
 */

// =================================================================
// Domain Types
// =================================================================
export type {
  TemporalTagAssignment,
  TemporalConflict,
  TemporalConflictCheckInput,
  TemporalConflictCheckResult,
  TaxonomyTree,
  TaxonomyValidationResult,
  TaxonomyValidationError,
  TaxonomyErrorCode,
  SemanticIndexEntry,
  SemanticIndexStats,
} from './_types';

// Re-export shared primitives for consumers who import from this slice
export type {
  TaxonomyDimension,
  TaxonomyNode,
  SemanticSearchHit,
} from './_types';

// =================================================================
// Aggregate — Temporal Conflict Detection + Taxonomy Validation
// =================================================================
export {
  detectTemporalConflicts,
  checkTemporalConflict,
  validateTaxonomyAssignment,
  validateTaxonomyPath,
} from './_aggregate';

// =================================================================
// Server Actions (all tag mutations go through here) [D3]
// =================================================================
export {
  upsertTagWithConflictCheck,
  assignSemanticTag,
  removeTag,
} from './_actions';

// =================================================================
// Services — Semantic Index (query interface for global-search)
// =================================================================
export {
  indexEntity,
  removeFromIndex,
  querySemanticIndex,
  getIndexStats,
} from './_services';

// =================================================================
// CTA Operations — Centralized Tag Aggregate [D3][D8]
// Firestore-backed CRUD for tagDictionary; D8-compliant (not in shared-kernel).
// =================================================================
export {
  createTag,
  updateTag,
  deprecateTag,
  deleteTag,
  getTag,
} from './centralized-tag/_actions';
export type { CentralizedTagEntry, TagDeleteRule } from '@/features/shared-kernel/centralized-tag';
