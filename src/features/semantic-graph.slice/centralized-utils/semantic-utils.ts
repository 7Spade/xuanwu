/**
 * semantic-graph.slice/centralized-utils — Internal Semantic Calculation Helpers
 *
 * Low-level utility functions for semantic-graph.slice.
 * These are PRIVATE to the slice; nothing is re-exported through index.ts.
 *
 * Dependency rule: ZERO infrastructure imports (no Firebase, no React, no I/O).
 */

import type { TagEntity } from '../centralized-types';

// ─── Semantic URI helpers ─────────────────────────────────────────────────────

/**
 * Derive the canonical D21 semantic URI for a tag.
 * Format: `tag::{category}/{slug}`
 */
export function buildSemanticUri(category: string, tagSlug: string): string {
  return `tag::${category}/${tagSlug}`;
}

/**
 * Parse a semantic URI back into category + slug.
 * Returns null if the URI does not match the expected format.
 */
export function parseSemanticUri(
  uri: string
): { category: string; tagSlug: string } | null {
  const match = /^tag::([^/]+)\/(.+)$/.exec(uri);
  if (!match) return null;
  return { category: match[1]!, tagSlug: match[2]! };
}

// ─── Tag entity helpers ───────────────────────────────────────────────────────

/**
 * Extract the human-readable display text for a TagEntity.
 * Used to build embedding input strings.
 */
export function tagEntityToText(entity: TagEntity): string {
  return `${entity.semanticUri} ${entity.label}`;
}

/**
 * Compute a deterministic sort key for a collection of TagEntities.
 * Ordered by category then label (lexicographic).
 */
export function sortTagEntities(entities: readonly TagEntity[]): TagEntity[] {
  return [...entities].sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return a.label.localeCompare(b.label);
  });
}

// ─── Staleness helpers ────────────────────────────────────────────────────────

/**
 * Compute the staleness in milliseconds for a timestamp string.
 */
export function computeStalenessMs(isoTimestamp: string): number {
  return Date.now() - new Date(isoTimestamp).getTime();
}

/**
 * Returns true when the given staleness exceeds the provided threshold.
 */
export function isStale(isoTimestamp: string, thresholdMs: number): boolean {
  return computeStalenessMs(isoTimestamp) > thresholdMs;
}

// ─── XP Tier derivation ───────────────────────────────────────────────────────

/**
 * The canonical tier thresholds in XP units. [#12]
 * Tier is NEVER stored — always computed at runtime from raw XP.
 */
const XP_TIER_THRESHOLDS: Record<string, number> = {
  apprentice: 0,
  journeyman: 500,
  expert: 1_500,
  artisan: 3_500,
  grandmaster: 7_500,
  legendary: 15_000,
  titan: 30_000,
};

/**
 * Derive the tier label from raw XP. [#12]
 * Returns the highest tier whose threshold is ≤ xp.
 */
export function deriveTierFromXp(xp: number): string {
  let current = 'apprentice';
  for (const [tier, threshold] of Object.entries(XP_TIER_THRESHOLDS)) {
    if (xp >= threshold) current = tier;
  }
  return current;
}
