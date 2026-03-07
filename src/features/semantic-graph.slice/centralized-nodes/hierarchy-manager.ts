/**
 * Module: semantic-graph.slice/centralized-nodes — Hierarchy Manager [D21-C]
 *
 * Enforces the parent-mount invariant: every tag node must be connected to
 * at least one parent in the IS_A / taxonomy hierarchy before it may be
 * treated as a live node [D21-C].
 *
 * Invariants:
 *   [D21-C]  No isolated nodes — every tag must be mounted to a parent or be
 *            a designated root (roots are registered without a parentSlug).
 *   [D24]    No direct Firebase import — parent data is kept in-memory and
 *            synchronised by the command path (_actions.ts).
 *
 * Dependency rule: ZERO infrastructure imports (no Firebase, no React, no I/O).
 */

import { tagSlugRef } from '@/shared-kernel';
import type { TagSlugRef } from '@/shared-kernel';

// ─── Internal parent registry ─────────────────────────────────────────────────

const _parentMap = new Map<string, string>();

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Mount a child tag node under a parent node.
 * Must be called during tag creation [D21-C].
 *
 * @param childSlug  - The slug of the node being mounted.
 * @param parentSlug - The slug of the parent node.
 */
export function mountToParent(childSlug: TagSlugRef, parentSlug: TagSlugRef): void {
  _parentMap.set(childSlug as string, parentSlug as string);
}

/**
 * Return true if the node is connected to a parent (i.e. not isolated).
 *
 * A root node that was registered via mountToParent() pointing to itself,
 * or any node with a known parent, is considered non-isolated.
 *
 * @param slug - The tag slug to test.
 */
export function validateNotIsolated(slug: TagSlugRef): boolean {
  return _parentMap.has(slug as string);
}

/**
 * Return the parent slug for a given node, or null if the node has no
 * registered parent (isolated or unknown).
 *
 * @param slug - The tag slug to look up.
 */
export function getParent(slug: TagSlugRef): TagSlugRef | null {
  const parent = _parentMap.get(slug as string);
  return parent !== undefined ? tagSlugRef(parent) : null;
}

/** Clear the parent registry (used in tests). */
export function _clearHierarchyForTest(): void {
  _parentMap.clear();
}
