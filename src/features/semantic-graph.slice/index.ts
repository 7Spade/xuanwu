/**
 * semantic-graph.slice ??Public API
 *
 * VS8 Semantic Graph: The Brain ??manages tag taxonomy, temporal conflict
 * detection for scheduling, and semantic indexing for cross-domain queries.
 *
 * Per 00-LogicOverview.md (VS8):
 *   ??Everything as a Tag: all domain concepts modelled as semantic tags,
 *      governed by VS8 (Semantic Graph).
 *
 * Sub-modules:
 *   _types      ??Domain types (temporal conflict, taxonomy, semantic index)
 *   _aggregate  ??Temporal conflict detection + taxonomy validation
 *   _services   ??Semantic index management (to be implemented)
 *   _queries    ??[D4] QGWAY_SEARCH read-out port
 *
 * Architecture rules:
 *   [D3]  All entity changes via _actions.ts only.
 *   [D7]  Unique public API: only selectors and Commands are exposed.
 *         Internal modules (nodes, edges, workflows, utils) are HIDDEN.
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

// Centralized types exposed for consumers (read-only query types only) [D7]
export type {
  EligibleTagsQuery,
  EligibleTagResult,
  SemanticEdge,
  SemanticRelationType,
  TagLifecycleState,
  TagLifecycleEvent,
  TagLifecycleEventType,
  TagLifecycleRecord,
  StaleTagWarning,
  TagEntity,
  // Neural Network types [D21-3 D21-4 D21-6]
  SemanticDistanceEntry,
  AffectedNode,
  CausalityReason,
  DownstreamEvent,
  CausalityChain,
} from './core/types';

// =================================================================
// Aggregate ??Temporal Conflict Detection + Taxonomy Validation
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
  // Semantic edge commands [D3]
  addSemanticEdge,
  removeSemanticEdge,
  // Tag lifecycle commands [T1]
  registerTagLifecycle,
  activateTagLifecycle,
  transitionTagLifecycle,
} from './_actions';

// =================================================================
// Services ??Semantic Index (query interface for global-search)
// =================================================================
export {
  indexEntity,
  removeFromIndex,
  querySemanticIndex,
  getIndexStats,
} from './_services';

export { SEARCH_DOMAINS, TAXONOMY_DIMENSIONS } from './_semantic-authority';

// =================================================================
// Read Queries ??[D4] QGWAY_SEARCH outbound port (VS8 Global Search)
// All reads go through _queries.ts; internal stores are HIDDEN [D7].
// =================================================================
export {
  getEligibleTags,
  satisfiesSemanticRequirement,
  buildEligibilityMatrix,
  getIsAEdges,
  getRequiresEdges,
  queryStaleTagWarnings,
  // Neural Network queries [D21-3 D21-4]
  computeSemanticDistance,
  computeSemanticDistanceMatrix,
  findIsolatedNodes,
  // Causality Tracer queries [D21-6]
  traceAffectedNodes,
  rankAffectedNodes,
  buildDownstreamEvents,
  buildCausalityChain,
} from './_queries';

// =================================================================
// Tag Entity Node Factory ??centralized-nodes [D21]
// Builds TE1~TE6 nodes; exposed so composition-root can seed nodes.
// =================================================================
export { buildTagEntity } from './core/nodes/tag-entity.factory';
export type { TagEntityFactoryInput } from './core/nodes/tag-entity.factory';

// =================================================================
// Embedding Port ??centralized-embeddings [D24][D26]
// IEmbeddingPort is exposed so the composition root can inject an adapter.
// buildTagEmbedding and batch variant are exposed for projection integration.
// =================================================================
export type { IEmbeddingPort } from './core/embeddings/embedding-port';
export {
  injectEmbeddingPort,
  NOOP_EMBEDDING_PORT,
  buildTagEmbedding,
  buildTagEmbeddingsBatch,
} from './core/embeddings/embedding-port';

// =================================================================
// Cost Item Classification ??Layer-2 Semantic Classification [D8][D21]
// Pure keyword-based classifier; no SDK imports (classifies during parse phase).
// =================================================================
export {
  classifyCostItem,
  classifyCostItemWithSemanticTag,
  CostItemType,
  shouldMaterializeAsTask,
} from './_cost-classifier';
export type {
  CostItemType as CostItemTypeValue,
  SemanticTagSlug,
  CostItemSemanticClassification,
} from './_cost-classifier';

export {
  getTagSnapshotPresentation,
  getTagSnapshotPresentationMap,
} from './output/projections/tag-snapshot.slice';
export type {
  TagSnapshotPresentation,
  TagSnapshotColorToken,
  TagSnapshotIconToken,
} from './output/projections/tag-snapshot.slice';

// =================================================================
// CTA Operations ??Centralized Tag Aggregate [D3][D8]
// Firestore-backed CRUD for tagDictionary; D8-compliant (not in shared-kernel).
// =================================================================
export {
  createTag,
  updateTag,
  deprecateTag,
  deleteTag,
  getTag,
} from './core/tags/_actions';
export { onTagEvent, publishTagEvent } from './core/tags';
export type {
  CentralizedTagEntry,
  CentralizedTagDeleteRule,
  TagDeleteRule,
  TagLifecycleEventPayloadMap,
  TagLifecycleEventKey,
  TagCreatedPayload,
  TagUpdatedPayload,
  TagDeprecatedPayload,
  TagDeletedPayload,
} from './core/tags';

// =================================================================
// L5 Blood-Brain Barrier ??InvariantGuard [D21-H D21-K]
// Supreme arbiter of semantic-graph validity.  Call validateEdgeProposal()
// BEFORE addEdge() to enforce all graph invariants at the BBB layer.
// External slices must never bypass this guard to write edges directly.
// =================================================================
export { validateEdgeProposal } from './governance/guards/invariant-guard';
export type {
  EdgeProposal,
  SemanticGuardDecision,
  SemanticGuardRejectionCode,
  SemanticGuardResult,
} from './governance/guards/invariant-guard';

// =================================================================
// L8 Global Consensus Engine ??ConsensusEngine [D21-I D21-K]
// Validates tag governance proposals for logical consistency before
// forwarding to the L5 BBB InvariantGuard.  Call validateConsensus()
// BEFORE validateEdgeProposal() in the proposal-stream pipeline.
// =================================================================
export { validateConsensus } from './governance/semantic-governance-portal/consensus-engine';
export type {
  ConsensusDecision,
  ConsensusRejectionCode,
  ConsensusResult,
} from './governance/semantic-governance-portal/consensus-engine';
