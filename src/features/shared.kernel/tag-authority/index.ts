/**
 * shared.kernel/tag-authority — Tag Authority Center CONTRACT [#A6][#17][D21]
 *
 * VS0 Shared Kernel: Canonical tag contract — READ-ONLY reference rules and
 * lifecycle event types for cross-BC subscription.
 *
 * ┌─ Architecture boundary ────────────────────────────────────────────────────┐
 * │  IMPLEMENTATION: src/features/centralized-tag/  ← sole write authority     │
 * │  CONTRACT (this file): types + event payload + read-only interface          │
 * │  All other slices import from HERE — never from centralized-tag directly.  │
 * └────────────────────────────────────────────────────────────────────────────┘
 *
 * Per logic-overview.md:
 *
 * [#17][T1] READ-ONLY REFERENCE RULES:
 *   T1 — New slices subscribe to TagLifecycleEvent; MUST NOT maintain their own tag data.
 *   T2 — tagSlug references are the only cross-BC link (store slug, not label/category).
 *   T3 — Consumers MUST listen to TagDeprecated/TagDeleted events to invalidate local refs.
 *   T4 — SKILL_TAG_POOL is the only allowed local materialization; subject to TAG_MAX_STALENESS.
 *   T5 — Queries requiring tag labels join at read time via TAG_SNAPSHOT (EVENTUAL_READ).
 *
 * [D21] AI-READY SEMANTIC TAG ENTITIES:
 *   Canonical tag categories for automated agent classification:
 *   skill | skill_tier | user_level | role | team | partner
 *
 * [D24] Infrastructure port: ITagReadPort (read-only query port for tag-authority).
 *
 * Dependency rule: ZERO infrastructure imports (no Firebase, no React, no I/O).
 */

// ─── Canonical tag categories [D21] ──────────────────────────────────────────

/**
 * Canonical set of tag categories for D21 AI-ready semantic classification. [D21]
 *
 * `skill`      — skill-domain tags (e.g. "masonry", "welding")
 * `skill_tier` — derived tier labels (e.g. "expert", "artisan") — computed, not persisted
 * `user_level` — account role / seniority classification
 * `role`       — position / function tags
 * `team`       — team / workgroup identity tags
 * `partner`    — external partner / vendor tags
 */
export const TAG_CATEGORIES = [
  'skill',
  'skill_tier',
  'user_level',
  'role',
  'team',
  'partner',
] as const;

export type TagCategory = (typeof TAG_CATEGORIES)[number];

// ─── Delete rule ──────────────────────────────────────────────────────────────

/**
 * Deletion policy when a tag still has active consumer references.
 *
 * `block`   — delete is rejected until all references are removed
 * `archive` — tag is archived (deprecated) and hidden from new use
 * `cascade` — consumer references are nullified (use with caution)
 */
export type TagDeleteRule = 'block' | 'archive' | 'cascade';

// ─── Read-only tag reference ──────────────────────────────────────────────────

/**
 * Read-only tagSlug reference.
 *
 * This is the ONLY cross-BC link allowed. Slices MUST store only the tagSlug,
 * never the label or category. [T2]
 */
export type TagSlugRef = string & { readonly _brand: 'TagSlugRef' };

/** Create a type-safe TagSlugRef from a raw string. */
export function tagSlugRef(raw: string): TagSlugRef {
  return raw as TagSlugRef;
}

// ─── Tag lifecycle event payloads ─────────────────────────────────────────────

/**
 * Payload emitted when a new tag is created.
 * Subscribers use this to populate local SKILL_TAG_POOL or TAG_SNAPSHOT. [T4][T5]
 */
export interface TagCreatedPayload {
  readonly tagSlug: string;
  readonly label: string;
  readonly category: TagCategory;
  readonly createdBy: string;
  readonly createdAt: string;
}

/**
 * Payload emitted when a tag's label or category changes.
 * Subscribers must invalidate cached tag labels. [T3]
 */
export interface TagUpdatedPayload {
  readonly tagSlug: string;
  readonly label: string;
  readonly category: TagCategory;
  readonly updatedBy: string;
  readonly updatedAt: string;
}

/**
 * Payload emitted when a tag is deprecated (superseded by another).
 * Subscribers must display a deprecation warning and migrate to replacedByTagSlug. [T3]
 */
export interface TagDeprecatedPayload {
  readonly tagSlug: string;
  /** Suggested replacement tagSlug. Subscribers should migrate to this slug. */
  readonly replacedByTagSlug?: string;
  readonly deprecatedBy: string;
  readonly deprecatedAt: string;
}

/**
 * Payload emitted when a tag is permanently deleted.
 * Subscribers MUST remove all local references to this tagSlug. [T3]
 */
export interface TagDeletedPayload {
  readonly tagSlug: string;
  readonly deletedBy: string;
  readonly deletedAt: string;
}

/** Map of all TagLifecycleEvent keys to their payload types. */
export interface TagLifecycleEventPayloadMap {
  'tag:created':    TagCreatedPayload;
  'tag:updated':    TagUpdatedPayload;
  'tag:deprecated': TagDeprecatedPayload;
  'tag:deleted':    TagDeletedPayload;
}

export type TagLifecycleEventKey = keyof TagLifecycleEventPayloadMap;

// ─── Read-only access port [D24] ──────────────────────────────────────────────

/**
 * Minimal read-only port for accessing tag metadata at query time. [D24][T5]
 *
 * Implementations may query TAG_SNAPSHOT (EVENTUAL_READ) or
 * centralized-tag.aggregate directly (STRONG_READ).
 *
 * This interface is the ONLY legitimate way for other slices to read tag data.
 * Slices MUST NOT import from centralized-tag directly.
 */
export interface ITagReadPort {
  /** Look up the label for a tagSlug. Returns null if the tag does not exist or is deleted. */
  getLabelBySlug(tagSlug: string): Promise<string | null>;

  /** Resolve multiple tagSlugs to their labels in one batch. */
  getLabelsBySlug(tagSlugs: string[]): Promise<Record<string, string>>;

  /** Returns true if the tagSlug exists and is not deprecated. */
  isActive(tagSlug: string): Promise<boolean>;
}

// ─── Stale guard contract [S4][T4] ───────────────────────────────────────────

/**
 * Tag-derived local cache conformance contract.
 *
 * Any slice that materializes a local tag cache (SKILL_TAG_POOL or similar)
 * MUST reference TAG_MAX_STALENESS from SK_STALENESS_CONTRACT [S4] and
 * declare this marker interface. [T4]
 */
export interface ImplementsTagStaleGuard {
  readonly implementsTagStaleGuard: true;
  /**
   * Maximum cache age in milliseconds.
   * MUST equal StalenessMs.TAG_MAX_STALENESS — never a hardcoded literal.
   */
  readonly maxStalenessMs: number;
}
