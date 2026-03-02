/**
 * global-search.slice — _actions.ts
 *
 * Cross-cutting Authority — Server actions for the sole search portal. [D3]
 *
 * Per logic-overview.md [D26]:
 *   global-search.slice is the system's sole search authority.
 *   All cross-domain search requests route through these actions.
 *
 * Architecture:
 *   [D3]  All search mutations go through _actions.ts.
 *   [D26] Owns _actions.ts / _services.ts; does not parasitize shared-kernel.
 *
 * L6 Query Gateway: searches via semantic-graph's (VS8) semantic index.
 */

import type { CommandResult } from '@/features/shared-kernel';
import { commandSuccess, commandFailureFrom } from '@/features/shared-kernel';

import { executeSearch as executeSearchService } from './_services';
import type { ExecuteSearchInput } from './_types';

// =================================================================
// Search Execution Action
// =================================================================

/**
 * Execute a cross-domain search through the semantic index.
 * This is the ONLY entry point for cross-domain search in the system.
 *
 * Routes the query through semantic-graph.slice's (VS8) semantic index,
 * groups results by domain, and returns a unified SearchResponse.
 *
 * Returns CommandResult per [R4]. For search queries, aggregateId is the
 * query string and version is always 0 (read-only operation).
 */
export async function executeSearch(
  input: ExecuteSearchInput
): Promise<CommandResult> {
  try {
    await executeSearchService(input);
    return commandSuccess(input.query, 0);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return commandFailureFrom('GLOBAL_SEARCH_FAILED', message);
  }
}
