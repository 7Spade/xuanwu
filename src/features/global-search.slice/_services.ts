/**
 * global-search.slice — _services.ts
 *
 * Cross-cutting Authority — L6 Query Gateway implementation.
 *
 * Queries semantic-graph.slice (VS8) semantic index for cross-domain
 * (Workspace / Member / Schedule / Tag) search results.
 *
 * Per logic-overview.md [D26]:
 *   global-search.slice is the sole search authority.
 *   Queries VS8 semantic index; does NOT access Firestore directly.
 *
 * Architecture:
 *   [D8]  Logic lives HERE, not in shared-kernel.
 *   [D24] No direct firebase imports — queries semantic index only.
 *   [D26] global-search.slice owns its services.
 */

import { querySemanticIndex } from '@/features/semantic-graph.slice';

import type {
  ExecuteSearchInput,
  SearchResponse,
  GroupedSearchResult,
  SearchDomain,
} from './_types';

// =================================================================
// L6 Query Gateway — Cross-Domain Search
// =================================================================

/**
 * Execute a cross-domain search via VS8's semantic index.
 * Groups results by domain for structured UI rendering.
 */
export function executeSearch(
  input: ExecuteSearchInput
): SearchResponse {
  const { query, filters, limit, traceId } = input;

  const hits = querySemanticIndex(query, {
    domains: filters?.domains,
    tagFilters: filters?.tagSlugs,
    limit: limit ?? 50,
  });

  const groupMap = new Map<SearchDomain, GroupedSearchResult>();

  for (const hit of hits) {
    const domain = hit.domain;
    const existing = groupMap.get(domain);
    if (existing) {
      groupMap.set(domain, {
        ...existing,
        hits: [...existing.hits, hit],
        count: existing.count + 1,
      });
    } else {
      groupMap.set(domain, {
        domain,
        hits: [hit],
        count: 1,
      });
    }
  }

  const groups = Array.from(groupMap.values());

  return {
    query,
    groups,
    totalCount: hits.length,
    cursor: input.cursor,
    executedAt: new Date().toISOString(),
    traceId,
  };
}
