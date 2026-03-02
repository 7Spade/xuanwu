/**
 * shared-kernel/semantic-primitives — SK_SEMANTIC [D19][D21]
 *
 * VS0 Shared Kernel: Core tag taxonomy and semantic search contracts.
 *
 * Per logic-overview.md [D19] TYPE AUTHORITY:
 *   Core tag categories, search query contracts, and notification channel
 *   contracts are defined here — the single source of truth for cross-slice
 *   semantic interfaces.
 *
 * Consumers:
 *   - semantic-graph.slice (VS8): implements taxonomy validation + semantic index
 *   - global-search.slice:       implements cross-domain search via these contracts
 *   - notification-hub.slice:    implements tag-aware routing via these contracts
 *
 * Dependency rule: ZERO infrastructure imports (no Firebase, no React, no I/O).
 */

// ─── Semantic Search Contracts ────────────────────────────────────────────────

/**
 * Supported entity domains for cross-domain search.
 * Each domain maps to a VS or aggregate that the Global Search authority can query.
 */
export const SEARCH_DOMAINS = [
  'workspace',
  'member',
  'schedule',
  'tag',
  'skill',
  'organization',
  'document',
] as const;

export type SearchDomain = (typeof SEARCH_DOMAINS)[number];

/**
 * Cross-domain search query contract.
 * Global Search (VS9) is the sole consumer of this contract. [D26]
 */
export interface SemanticSearchQuery {
  /** Free-text query string. */
  readonly query: string;
  /** Restrict results to specific domains. Empty = search all. */
  readonly domains: readonly SearchDomain[];
  /** Optional tag-based filter (intersection — AND semantics). */
  readonly tagFilters?: readonly string[];
  /** Maximum results per domain. */
  readonly limit?: number;
  /** Pagination cursor (opaque string from previous result). */
  readonly cursor?: string;
  /** [R8] TraceID propagated from the originating command. */
  readonly traceId?: string;
}

/**
 * A single search hit returned by the semantic index.
 */
export interface SemanticSearchHit {
  readonly id: string;
  readonly domain: SearchDomain;
  readonly title: string;
  readonly subtitle?: string;
  /** Relevance score (0–1). */
  readonly score: number;
  /** Tag slugs associated with this entity. */
  readonly tags: readonly string[];
  /** Navigation path within the application. */
  readonly href?: string;
}

/**
 * Paginated search result envelope.
 */
export interface SemanticSearchResult {
  readonly hits: readonly SemanticSearchHit[];
  readonly totalCount: number;
  readonly cursor?: string;
  readonly traceId?: string;
}

// ─── Notification Channel Contracts ──────────────────────────────────────────

/**
 * Delivery channels supported by the Notification Hub.
 */
export const NOTIFICATION_CHANNELS = [
  'push',
  'in-app',
  'email',
  'sms',
] as const;

export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

/**
 * Severity / urgency classification for notification routing.
 */
export const NOTIFICATION_PRIORITIES = ['low', 'normal', 'high', 'critical'] as const;
export type NotificationPriority = (typeof NOTIFICATION_PRIORITIES)[number];

// ─── Taxonomy Classification Contracts ───────────────────────────────────────

/**
 * Taxonomy dimension for multi-dimensional tag classification.
 * VS8 (Semantic Graph) validates that every tag belongs to exactly one dimension.
 */
export const TAXONOMY_DIMENSIONS = [
  'skill',
  'location',
  'temporal',
  'organizational',
  'compliance',
] as const;

export type TaxonomyDimension = (typeof TAXONOMY_DIMENSIONS)[number];

/**
 * Taxonomy node — hierarchical classification entry managed by VS8.
 * Pure data contract; no infrastructure dependencies.
 */
export interface TaxonomyNode {
  readonly slug: string;
  readonly label: string;
  readonly dimension: TaxonomyDimension;
  readonly parentSlug?: string;
  readonly depth: number;
  readonly metadata?: Record<string, unknown>;
}
