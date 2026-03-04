/**
 * semantic-graph.slice/centralized-nodes — [D21] TE1~TE6 Tag Entity Node Factory
 *
 * Builds typed semantic tag entity nodes from a CentralizedTagEntry.
 * Each node carries a `semanticUri` in the `tag::{category}/{slug}` format [D21],
 * a branded `tagSlug` per [T2], and `aggregateVersion` for SK_VERSION_GUARD [S2].
 *
 * Dependency rule: ZERO infrastructure imports (no Firebase, no React, no I/O).
 */

import { tagSlugRef, type TagCategory } from '@/features/shared-kernel';

import type {
  TagEntity,
  TE1_SkillTagEntity,
  TE2_SkillTierTagEntity,
  TE3_UserLevelTagEntity,
  TE4_RoleTagEntity,
  TE5_TeamTagEntity,
  TE6_PartnerTagEntity,
} from '../centralized-types';

// ─── Factory input ────────────────────────────────────────────────────────────

/**
 * Minimal input required by the factory.
 * Mirrors the writable fields of CentralizedTagEntry (slug + label + category + version).
 */
export interface TagEntityFactoryInput {
  readonly tagSlug: string;
  readonly label: string;
  readonly category: TagCategory;
  readonly aggregateVersion: number;
}

// ─── Per-category builders (TE1–TE6) ─────────────────────────────────────────

function buildTE1(input: TagEntityFactoryInput): TE1_SkillTagEntity {
  const slug = input.tagSlug;
  return {
    _teVariant: 'TE1_skill',
    tagSlug: tagSlugRef(slug),
    label: input.label,
    category: 'skill',
    semanticUri: `tag::skill/${slug}`,
    aggregateVersion: input.aggregateVersion,
  };
}

function buildTE2(input: TagEntityFactoryInput): TE2_SkillTierTagEntity {
  const slug = input.tagSlug;
  return {
    _teVariant: 'TE2_skill_tier',
    tagSlug: tagSlugRef(slug),
    label: input.label,
    category: 'skill_tier',
    semanticUri: `tag::skill_tier/${slug}`,
    aggregateVersion: input.aggregateVersion,
  };
}

function buildTE3(input: TagEntityFactoryInput): TE3_UserLevelTagEntity {
  const slug = input.tagSlug;
  return {
    _teVariant: 'TE3_user_level',
    tagSlug: tagSlugRef(slug),
    label: input.label,
    category: 'user_level',
    semanticUri: `tag::user_level/${slug}`,
    aggregateVersion: input.aggregateVersion,
  };
}

function buildTE4(input: TagEntityFactoryInput): TE4_RoleTagEntity {
  const slug = input.tagSlug;
  return {
    _teVariant: 'TE4_role',
    tagSlug: tagSlugRef(slug),
    label: input.label,
    category: 'role',
    semanticUri: `tag::role/${slug}`,
    aggregateVersion: input.aggregateVersion,
  };
}

function buildTE5(input: TagEntityFactoryInput): TE5_TeamTagEntity {
  const slug = input.tagSlug;
  return {
    _teVariant: 'TE5_team',
    tagSlug: tagSlugRef(slug),
    label: input.label,
    category: 'team',
    semanticUri: `tag::team/${slug}`,
    aggregateVersion: input.aggregateVersion,
  };
}

function buildTE6(input: TagEntityFactoryInput): TE6_PartnerTagEntity {
  const slug = input.tagSlug;
  return {
    _teVariant: 'TE6_partner',
    tagSlug: tagSlugRef(slug),
    label: input.label,
    category: 'partner',
    semanticUri: `tag::partner/${slug}`,
    aggregateVersion: input.aggregateVersion,
  };
}

// ─── Main factory ─────────────────────────────────────────────────────────────

/**
 * Build a typed TagEntity node from a factory input.
 *
 * Dispatches to TE1–TE6 based on `category`.
 * Throws if an unrecognised category is supplied.
 *
 * Invariant [S2]: the returned node includes `aggregateVersion` so upstream
 * callers can apply versionGuardAllows() before persisting updates.
 */
export function buildTagEntity(input: TagEntityFactoryInput): TagEntity {
  switch (input.category) {
    case 'skill':
      return buildTE1(input);
    case 'skill_tier':
      return buildTE2(input);
    case 'user_level':
      return buildTE3(input);
    case 'role':
      return buildTE4(input);
    case 'team':
      return buildTE5(input);
    case 'partner':
      return buildTE6(input);
    default: {
      const exhaustive: never = input.category;
      throw new Error(`[centralized-nodes] Unknown tag category: ${String(exhaustive)}`);
    }
  }
}
