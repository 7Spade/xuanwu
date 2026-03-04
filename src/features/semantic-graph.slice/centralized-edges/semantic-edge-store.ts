/**
 * semantic-graph.slice/centralized-edges — Semantic Edge Store
 *
 * In-memory registry for IS_A (inheritance) and REQUIRES (dependency)
 * semantic relations between tag entity nodes.
 *
 * Business value:
 *   - VS6 scheduling eligibility: "skill:expert IS_A skill:senior" means
 *     a candidate with skill:expert automatically satisfies a skill:senior requirement.
 *   - VS4 workspace queries: REQUIRES edges reveal transitive dependencies.
 *
 * Dependency rule: ZERO infrastructure imports (no Firebase, no React, no I/O).
 */

import { tagSlugRef } from '@/features/shared-kernel';

import type { SemanticEdge, SemanticRelationType } from '../centralized-types';

// ─── Internal edge registry ───────────────────────────────────────────────────

const _edges = new Map<string, SemanticEdge>();

function _makeEdgeId(fromSlug: string, toSlug: string, relationType: SemanticRelationType): string {
  return `${relationType}:${fromSlug}→${toSlug}`;
}

// ─── Edge mutation API ────────────────────────────────────────────────────────

/**
 * Register or overwrite a semantic edge.
 * Called exclusively from _actions.ts (Command path).
 */
export function addEdge(
  fromTagSlug: string,
  toTagSlug: string,
  relationType: SemanticRelationType
): SemanticEdge {
  const edgeId = _makeEdgeId(fromTagSlug, toTagSlug, relationType);
  const edge: SemanticEdge = {
    edgeId,
    fromTagSlug: tagSlugRef(fromTagSlug),
    toTagSlug: tagSlugRef(toTagSlug),
    relationType,
    createdAt: new Date().toISOString(),
  };
  _edges.set(edgeId, edge);
  return edge;
}

/**
 * Remove a semantic edge by (from, to, type).
 */
export function removeEdge(
  fromTagSlug: string,
  toTagSlug: string,
  relationType: SemanticRelationType
): boolean {
  const edgeId = _makeEdgeId(fromTagSlug, toTagSlug, relationType);
  return _edges.delete(edgeId);
}

// ─── Edge query API ───────────────────────────────────────────────────────────

/**
 * Return all edges of a given relation type.
 */
export function getEdgesByType(relationType: SemanticRelationType): readonly SemanticEdge[] {
  return Array.from(_edges.values()).filter((e) => e.relationType === relationType);
}

/**
 * Return all edges originating from a given tagSlug.
 */
export function getEdgesFrom(fromTagSlug: string): readonly SemanticEdge[] {
  return Array.from(_edges.values()).filter((e) => e.fromTagSlug === fromTagSlug);
}

/**
 * Return all edges terminating at a given tagSlug.
 */
export function getEdgesTo(toTagSlug: string): readonly SemanticEdge[] {
  return Array.from(_edges.values()).filter((e) => e.toTagSlug === toTagSlug);
}

/**
 * Check whether `candidateSlug` semantically satisfies `requiredSlug` via IS_A
 * transitive closure.
 *
 * Example:
 *   addEdge('skill:expert',  'skill:senior', 'IS_A')
 *   addEdge('skill:artisan', 'skill:expert', 'IS_A')
 *   isSupersetOf('skill:artisan', 'skill:senior') → true  (artisan IS_A expert IS_A senior)
 *
 * Used by VS6 scheduling eligibility to check if a candidate tag covers a requirement.
 */
export function isSupersetOf(candidateSlug: string, requiredSlug: string): boolean {
  if (candidateSlug === requiredSlug) return true;
  const visited = new Set<string>();
  const stack = [candidateSlug];
  while (stack.length > 0) {
    const current = stack.pop()!;
    if (visited.has(current)) continue;
    visited.add(current);
    for (const edge of getEdgesFrom(current)) {
      if (edge.relationType !== 'IS_A') continue;
      if (edge.toTagSlug === requiredSlug) return true;
      stack.push(edge.toTagSlug);
    }
  }
  return false;
}

/**
 * Return all tagSlugs that a given slug REQUIRES (transitively).
 */
export function getTransitiveRequirements(tagSlug: string): readonly string[] {
  const result = new Set<string>();
  const stack = [tagSlug];
  while (stack.length > 0) {
    const current = stack.pop()!;
    for (const edge of getEdgesFrom(current)) {
      if (edge.relationType !== 'REQUIRES') continue;
      if (!result.has(edge.toTagSlug)) {
        result.add(edge.toTagSlug);
        stack.push(edge.toTagSlug);
      }
    }
  }
  return Array.from(result);
}

/** Returns a snapshot of all registered edges (read-only copy for tests/debug). */
export function getAllEdges(): readonly SemanticEdge[] {
  return Array.from(_edges.values());
}

/** Clear all edges (used in tests). */
export function _clearEdgesForTest(): void {
  _edges.clear();
}
