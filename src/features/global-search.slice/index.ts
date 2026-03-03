/**
 * global-search.slice — Public API
 *
 * Cross-cutting Authority: the system's sole search portal. [D26]
 *
 * Per logic-overview.md:
 *   global-search.slice = 語義門戶 (Semantic Portal)
 *   唯一跨域搜尋權威 · 對接 VS8 語義索引
 *
 * All cross-domain search in the system MUST route through this slice.
 * Internally delegates to semantic-graph.slice (VS8) semantic index
 * for DRY search with multi-dimensional intersection.
 *
 * Architecture:
 *   [D3]  Search mutations via _actions.ts.
 *   [D8]  Search logic in _services.ts, not shared-kernel.
 *   [D19] Core contracts defined in shared-kernel/semantic-primitives.
 *   [D26] Owns _actions.ts / _services.ts; does not parasitize shared-kernel.
 *   [#A12] Atomicity invariant: search boundary.
 *
 * External consumers import from '@/features/global-search.slice'.
 */

// =================================================================
// Domain Types
// =================================================================
export type {
  DateRangeFilter,
  SearchFilters,
  SearchState,
  ExecuteSearchInput,
  GroupedSearchResult,
  SearchResponse,
} from './_types';

export { INITIAL_SEARCH_STATE } from './_types';

// Re-exported shared-kernel contracts for consumer convenience
export type {
  SearchDomain,
  SemanticSearchQuery,
  SemanticSearchHit,
  SemanticSearchResult,
} from './_types';

// =================================================================
// Server Actions (all search operations go through here) [D3]
// =================================================================
export { executeSearch, executeGlobalSearch } from './_actions';
export type { ExecuteGlobalSearchResult } from './_actions';

// =================================================================
// Services (L6 Query Gateway — internal, re-exported for testing)
// =================================================================
export { executeSearch as executeSearchService } from './_services';

// =================================================================
// UI Components — Cmd+K Portal [D26][A12]
// All cross-domain search UI MUST be owned here; business slices
// MUST NOT implement their own Cmd+K or cross-domain search UI.
// =================================================================
export { GlobalSearchDialog, GlobalSearch } from './_components/global-search-dialog';
export type { GlobalSearchDialogProps } from './_components/global-search-dialog';
