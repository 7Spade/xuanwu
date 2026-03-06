/**
 * Module: semantic-graph.slice/centralized-neural-net — Context Attention [D21-F]
 *
 * Filters tag slugs by the current Workspace context so that neural-network
 * computations operate on a per-Workspace sub-graph rather than the global
 * semantic graph [D21-F].
 *
 * This prevents cross-domain semantic pollution: a tag from Workspace-A
 * must not influence distance calculations inside Workspace-B unless the tag
 * is explicitly flagged as globally shared.
 *
 * Design contract:
 *   - A slug is "local" when it carries the workspace prefix `ws:<id>:`.
 *   - A slug that does NOT carry ANY workspace prefix is treated as globally
 *     shared and is included for all workspaces.
 *   - Unknown workspaces receive only global slugs.
 *
 * Dependency rule: ZERO infrastructure imports (no Firebase, no React, no I/O).
 */

import type { TagSlugRef } from '@/shared-kernel';

// ─── Constants ────────────────────────────────────────────────────────────────

const WORKSPACE_PREFIX_SEPARATOR = ':';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function _workspacePrefix(workspaceId: string): string {
  return `ws${WORKSPACE_PREFIX_SEPARATOR}${workspaceId}${WORKSPACE_PREFIX_SEPARATOR}`;
}

function _isGlobalSlug(slug: string): boolean {
  // A slug that does not start with "ws:" is globally shared.
  return !slug.startsWith('ws' + WORKSPACE_PREFIX_SEPARATOR);
}

function _belongsToWorkspace(slug: string, workspaceId: string): boolean {
  return slug.startsWith(_workspacePrefix(workspaceId));
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Filter a list of tag slugs to those relevant for the given Workspace.
 *
 * A slug is included when:
 *   (a) it is a globally shared slug (no workspace prefix), OR
 *   (b) it is scoped to `workspaceId` via the `ws:<id>:` prefix.
 *
 * @param allSlugs    - The full set of slugs to filter.
 * @param workspaceId - The active workspace identifier.
 */
export function filterTagsByWorkspaceContext(
  allSlugs: readonly TagSlugRef[],
  workspaceId: string
): TagSlugRef[] {
  return allSlugs.filter((slug) => {
    const raw = slug as string;
    return _isGlobalSlug(raw) || _belongsToWorkspace(raw, workspaceId);
  });
}
