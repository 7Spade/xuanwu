/**
 * semantic-graph.slice — _services.ts
 *
 * VS8 Semantic Index Service:
 *   In-memory semantic index for cross-domain entity search.
 *   Consumed by global-search.slice (VS9) via the public API.
 *
 * Per logic-overview.md (VS8):
 *   SemanticGraph maintains the searchable semantic index.
 *   global-search.slice queries this index for cross-domain results.
 *
 * Architecture:
 *   [D3]  Write operations (index/remove) are service calls, not direct DB ops.
 *   [D8]  Index logic lives HERE, not in shared-kernel.
 *   [D26] semantic-graph.slice owns its services; does not parasitize shared-kernel.
 *
 * Dependency rule: Pure in-memory index. No infrastructure imports.
 */

import type { SearchDomain, SemanticSearchHit } from '@/features/shared-kernel';
import { SEARCH_DOMAINS } from '@/features/shared-kernel';

import type { SemanticIndexEntry, SemanticIndexStats } from './_types';

// ─── In-memory index store ────────────────────────────────────────────────────

const index = new Map<string, SemanticIndexEntry>();

// =================================================================
// Index Mutations
// =================================================================

/**
 * Add or update an entity in the semantic index.
 * Called by projection handlers when domain entities change.
 */
export function indexEntity(entry: SemanticIndexEntry): void {
  index.set(`${entry.domain}:${entry.id}`, entry);
}

/**
 * Remove an entity from the semantic index.
 */
export function removeFromIndex(domain: string, id: string): void {
  index.delete(`${domain}:${id}`);
}

// =================================================================
// Index Queries
// =================================================================

/**
 * Query the semantic index with a text query and optional domain/tag filters.
 *
 * Search strategy:
 *   1. Text match: query terms matched against searchableText + title + subtitle
 *   2. Tag intersection: if tagFilters provided, results must include ALL specified tags
 *   3. Domain filter: if domains provided, results restricted to those domains
 *
 * Returns hits sorted by relevance score (descending).
 */
export function querySemanticIndex(
  query: string,
  options?: {
    domains?: readonly string[];
    tagFilters?: readonly string[];
    limit?: number;
  }
): SemanticSearchHit[] {
  const queryLower = query.toLowerCase();
  const terms = queryLower.split(/\s+/).filter(Boolean);
  const limit = options?.limit ?? 50;

  const hits: SemanticSearchHit[] = [];

  for (const entry of index.values()) {
    if (options?.domains?.length && !options.domains.includes(entry.domain)) {
      continue;
    }

    if (options?.tagFilters?.length) {
      const hasAllTags = options.tagFilters.every((tag) => entry.tags.includes(tag));
      if (!hasAllTags) continue;
    }

    if (!isValidSearchDomain(entry.domain)) continue;

    const score = computeRelevanceScore(entry, terms);
    if (score > 0) {
      hits.push({
        id: entry.id,
        domain: entry.domain,
        title: entry.title,
        subtitle: entry.subtitle,
        score,
        tags: entry.tags,
        href: entry.href,
      });
    }
  }

  hits.sort((a, b) => b.score - a.score);
  return hits.slice(0, limit);
}

/**
 * Returns current semantic index statistics.
 */
export function getIndexStats(): SemanticIndexStats {
  const entriesByDomain: Record<string, number> = {};
  let lastUpdatedAt = '';

  for (const entry of index.values()) {
    entriesByDomain[entry.domain] = (entriesByDomain[entry.domain] ?? 0) + 1;
    if (entry.updatedAt > lastUpdatedAt) {
      lastUpdatedAt = entry.updatedAt;
    }
  }

  return {
    totalEntries: index.size,
    entriesByDomain,
    lastUpdatedAt: lastUpdatedAt || new Date(0).toISOString(),
  };
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function isValidSearchDomain(domain: string): domain is SearchDomain {
  return (SEARCH_DOMAINS as readonly string[]).includes(domain);
}

function computeRelevanceScore(entry: SemanticIndexEntry, terms: string[]): number {
  if (terms.length === 0) return 1;

  const searchable = entry.searchableText.toLowerCase();
  const title = entry.title.toLowerCase();
  let matched = 0;
  let titleBoost = 0;

  for (const term of terms) {
    if (searchable.includes(term)) {
      matched++;
      if (title.includes(term)) {
        titleBoost += 0.2;
      }
    }
  }

  if (matched === 0) return 0;

  const baseScore = matched / terms.length;
  return Math.min(1, baseScore + titleBoost);
}
