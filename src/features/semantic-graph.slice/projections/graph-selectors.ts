/**
 * Module: semantic-graph.slice/projections ??[L7 VS8_PROJ] Graph Selectors
 *
 * Exposes read-only query functions for use by:
 *   - VS6 scheduling eligibility (checks whether a candidate's tags satisfy requirements)
 *   - VS4 workspace queries (filtering tags per workspace scope)
 *   - Global Search VS8 (QGWAY_SEARCH integration)
 *
 * Architecture rules:
 *   [L7]  Projections are pure, side-effect-free, and read-only [D21-7, T5].
 *   [D7]  Only selectors exported via index.ts (edges/nodes/workflows are private).
 *   [D24] No direct Firebase import ??data is passed in or read from in-memory stores.
 *
 * Dependency rule: ZERO infrastructure imports (no Firebase, no React, no I/O).
 */

import type { TagCategory } from '@/shared-kernel';

import { isSupersetOf } from '../centralized-edges/semantic-edge-store';
import type {
  EligibleTagsQuery,
  EligibleTagResult,
  TagLifecycleRecord,
  TagEntity,
} from '../centralized-types';
import { getAllLifecycleRecords } from '../centralized-workflows/tag-lifecycle.workflow';

// ??? Eligible tags query [VS6 / VS4] ?????????????????????????????????????????

/**
 * Return all tags that satisfy the eligibility query.
 *
 * Used by VS6 scheduling eligibility and VS4 workspace queries.
 *
 * The `state` filter defaults to 'Active' to exclude Draft/Stale/Deprecated tags.
 * The `category` filter narrows to a single tag category if provided.
 *
 * @param tagEntities - All in-memory tag entity nodes (from centralized-nodes)
 * @param query - Optional filters (category, state, limit)
 */
export function getEligibleTags(
  tagEntities: readonly TagEntity[],
  query: EligibleTagsQuery = {}
): readonly EligibleTagResult[] {
  const { category, state = 'Active', limit = 100 } = query;

  const lifecycleMap = _buildLifecycleMap();

  const results: EligibleTagResult[] = [];
  for (const entity of tagEntities) {
    if (category !== undefined && entity.category !== category) continue;

    const lifecycle = lifecycleMap.get(entity.tagSlug);
    const currentState = lifecycle?.state ?? 'Draft';
    if (state !== undefined && currentState !== state) continue;

    results.push({
      tagSlug: entity.tagSlug,
      label: entity.label,
      category: entity.category as TagCategory,
      semanticUri: entity.semanticUri,
      state: currentState,
      aggregateVersion: entity.aggregateVersion,
    });

    if (results.length >= limit) break;
  }
  return results;
}

// ??? Supersetting query for VS6 scheduling eligibility ???????????????????????

/**
 * Returns true if the `candidateTagSlug` semantically covers the `requiredTagSlug`
 * via IS_A transitive closure.
 *
 * Example:
 *   skill:expert IS_A skill:senior ??satisfiesSemanticRequirement('skill:expert', 'skill:senior') = true
 */
export function satisfiesSemanticRequirement(
  candidateTagSlug: string,
  requiredTagSlug: string
): boolean {
  return isSupersetOf(candidateTagSlug, requiredTagSlug);
}

// ??? Active tags by category ??????????????????????????????????????????????????

/**
 * Convenience selector: return all active tags for a category.
 */
export function getActiveTagsByCategory(
  tagEntities: readonly TagEntity[],
  category: TagCategory
): readonly EligibleTagResult[] {
  return getEligibleTags(tagEntities, { category, state: 'Active' });
}

// ??? Tag eligibility matrix ???????????????????????????????????????????????????

/**
 * For a list of required tag slugs, return which candidate tags satisfy at least
 * one requirement (via IS_A supersetting).
 *
 * Result: Record<requiredSlug, candidateSlug[]>
 */
export function buildEligibilityMatrix(
  candidateSlugs: readonly string[],
  requiredSlugs: readonly string[]
): Readonly<Record<string, readonly string[]>> {
  const matrix: Record<string, string[]> = {};
  for (const req of requiredSlugs) {
    matrix[req] = candidateSlugs.filter((c) => satisfiesSemanticRequirement(c, req));
  }
  return matrix;
}

// ??? Private helpers ??????????????????????????????????????????????????????????

function _buildLifecycleMap(): Map<string, TagLifecycleRecord> {
  const map = new Map<string, TagLifecycleRecord>();
  for (const record of getAllLifecycleRecords()) {
    map.set(record.tagSlug, record);
  }
  return map;
}
