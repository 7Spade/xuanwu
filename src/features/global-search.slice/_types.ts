/**
 * global-search.slice — _types.ts
 *
 * Cross-cutting Authority — Domain Types for the system's sole search portal.
 *
 * Per logic-overview.md [D26]:
 *   global-search.slice = sole search authority.
 *   All cross-domain search MUST route through this slice.
 *
 * Architecture:
 *   [D3]  Search execution via _actions.ts only.
 *   [D19] Core search contracts in shared-kernel/semantic-primitives.
 *   [D26] global-search.slice owns _actions.ts / _services.ts per D3;
 *         must not parasitize shared-kernel per D8.
 *
 * Dependency rule: ZERO infrastructure imports.
 */

import type {
  SearchDomain,
  SemanticSearchQuery,
  SemanticSearchHit,
  SemanticSearchResult,
} from '@/features/shared-kernel/semantic-primitives';

// ─── Search Filter Types ──────────────────────────────────────────────────────

/**
 * Date range filter for scoping search results.
 */
export interface DateRangeFilter {
  readonly from?: string;
  readonly to?: string;
}

/**
 * Unified search filters combining domain, tag, and temporal constraints.
 */
export interface SearchFilters {
  readonly domains?: readonly SearchDomain[];
  readonly tagSlugs?: readonly string[];
  readonly dateRange?: DateRangeFilter;
  readonly orgId?: string;
  readonly workspaceId?: string;
  readonly createdBy?: string;
}

// ─── Search State (Client-side) ───────────────────────────────────────────────

/**
 * Client-side search state for the Cmd+K search portal.
 */
export interface SearchState {
  readonly query: string;
  readonly filters: SearchFilters;
  readonly results: SemanticSearchResult | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  /** Recent search queries for autocomplete. */
  readonly recentQueries: readonly string[];
}

/**
 * Initial (empty) search state.
 */
export const INITIAL_SEARCH_STATE: SearchState = {
  query: '',
  filters: {},
  results: null,
  isLoading: false,
  error: null,
  recentQueries: [],
};

// ─── Search Action Input/Output ───────────────────────────────────────────────

/**
 * Input for executing a cross-domain search.
 * Wraps SemanticSearchQuery with UI-level filters.
 */
export interface ExecuteSearchInput {
  readonly query: string;
  readonly filters?: SearchFilters;
  readonly limit?: number;
  readonly cursor?: string;
  readonly traceId?: string;
}

/**
 * Aggregated search output with per-domain grouping.
 */
export interface GroupedSearchResult {
  readonly domain: SearchDomain;
  readonly hits: readonly SemanticSearchHit[];
  readonly count: number;
}

/**
 * Final search response returned to the UI layer.
 */
export interface SearchResponse {
  readonly query: string;
  readonly groups: readonly GroupedSearchResult[];
  readonly totalCount: number;
  readonly cursor?: string;
  readonly executedAt: string;
  readonly traceId?: string;
}

// ─── Re-exports ───────────────────────────────────────────────────────────────

export type {
  SearchDomain,
  SemanticSearchQuery,
  SemanticSearchHit,
  SemanticSearchResult,
};
