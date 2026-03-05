/**
 * semantic-graph.slice/centralized-types — [D19] Local Type Authority
 *
 * All types that are INTERNAL to semantic-graph.slice live here.
 * Types needed across BCs must be promoted to shared-kernel first.
 *
 * Dependency rule: ZERO infrastructure imports (no Firebase, no React, no I/O).
 */

import type { TagSlugRef, TagCategory } from '@/features/shared-kernel';

// ─── Tag Entity Node identities (TE1–TE6) [D21] ──────────────────────────────

/**
 * TE1 — Skill tag entity
 */
export interface TE1_SkillTagEntity {
  readonly _teVariant: 'TE1_skill';
  readonly tagSlug: TagSlugRef;
  readonly label: string;
  readonly category: 'skill';
  readonly semanticUri: `tag::skill/${string}`;
  readonly aggregateVersion: number;
}

/**
 * TE2 — SkillTier tag entity
 */
export interface TE2_SkillTierTagEntity {
  readonly _teVariant: 'TE2_skill_tier';
  readonly tagSlug: TagSlugRef;
  readonly label: string;
  readonly category: 'skill_tier';
  readonly semanticUri: `tag::skill_tier/${string}`;
  readonly aggregateVersion: number;
}

/**
 * TE3 — UserLevel tag entity
 */
export interface TE3_UserLevelTagEntity {
  readonly _teVariant: 'TE3_user_level';
  readonly tagSlug: TagSlugRef;
  readonly label: string;
  readonly category: 'user_level';
  readonly semanticUri: `tag::user_level/${string}`;
  readonly aggregateVersion: number;
}

/**
 * TE4 — Role tag entity
 */
export interface TE4_RoleTagEntity {
  readonly _teVariant: 'TE4_role';
  readonly tagSlug: TagSlugRef;
  readonly label: string;
  readonly category: 'role';
  readonly semanticUri: `tag::role/${string}`;
  readonly aggregateVersion: number;
}

/**
 * TE5 — Team tag entity
 */
export interface TE5_TeamTagEntity {
  readonly _teVariant: 'TE5_team';
  readonly tagSlug: TagSlugRef;
  readonly label: string;
  readonly category: 'team';
  readonly semanticUri: `tag::team/${string}`;
  readonly aggregateVersion: number;
}

/**
 * TE6 — Partner tag entity
 */
export interface TE6_PartnerTagEntity {
  readonly _teVariant: 'TE6_partner';
  readonly tagSlug: TagSlugRef;
  readonly label: string;
  readonly category: 'partner';
  readonly semanticUri: `tag::partner/${string}`;
  readonly aggregateVersion: number;
}

/** Discriminated union of all tag entity variants. */
export type TagEntity =
  | TE1_SkillTagEntity
  | TE2_SkillTierTagEntity
  | TE3_UserLevelTagEntity
  | TE4_RoleTagEntity
  | TE5_TeamTagEntity
  | TE6_PartnerTagEntity;

// ─── Edge relation types ──────────────────────────────────────────────────────

/**
 * Supported semantic relation types for tag–tag edges.
 *
 * IS_A    — inheritance / subsumption (e.g. skill:expert IS_A skill:senior)
 * REQUIRES — dependency (e.g. role:team-lead REQUIRES skill:leadership)
 */
export type SemanticRelationType = 'IS_A' | 'REQUIRES';

/**
 * A directed semantic edge between two tag entity nodes.
 *
 * weight — relation strength in [0.0, 1.0]; 1.0 = direct relationship,
 *          lower values indicate weaker / indirect associations. [D21-3]
 */
export interface SemanticEdge {
  readonly edgeId: string;
  readonly fromTagSlug: TagSlugRef;
  readonly toTagSlug: TagSlugRef;
  readonly relationType: SemanticRelationType;
  /** Relation strength: 0.0 (weak) → 1.0 (direct). Defaults to 1.0. [D21-3] */
  readonly weight: number;
  readonly createdAt: string;
}

// ─── Embedding types ──────────────────────────────────────────────────────────

/**
 * A semantic vector for a tag entity — projected to TAG_SNAPSHOT.
 */
export interface TagEmbedding {
  readonly tagSlug: TagSlugRef;
  readonly vector: readonly number[];
  readonly model: string;
  readonly generatedAt: string;
}

// ─── Lifecycle types ─────────────────────────────────────────────────────────

/**
 * Tag lifecycle states (Draft → Active → Stale → Deprecated).
 */
export type TagLifecycleState = 'Draft' | 'Active' | 'Stale' | 'Deprecated';

/**
 * Discriminator for TagLifecycleEvent — used by the Causality Tracer [D21-6].
 *
 * | Value              | Emitted when …                                         |
 * |--------------------|--------------------------------------------------------|
 * | `TAG_CREATED`      | A new tag enters Draft state                           |
 * | `TAG_ACTIVATED`    | Draft → Active transition                              |
 * | `TAG_DEPRECATED`   | Active → Deprecated; triggers downstream propagation  |
 * | `TAG_STALE_FLAGGED`| Active/Deprecated → Stale (staleness guard S4/D21-8)  |
 * | `TAG_DELETED`      | Tag permanently removed; no downstream events emitted  |
 */
export type TagLifecycleEventType =
  | 'TAG_CREATED'
  | 'TAG_ACTIVATED'
  | 'TAG_DEPRECATED'
  | 'TAG_STALE_FLAGGED'
  | 'TAG_DELETED';

export interface TagLifecycleEvent {
  readonly eventId: string;
  readonly tagSlug: TagSlugRef;
  /** Discriminates the kind of transition so the Causality Tracer can route correctly [D21-6]. */
  readonly eventType: TagLifecycleEventType;
  readonly fromState: TagLifecycleState;
  readonly toState: TagLifecycleState;
  readonly transitionedAt: string;
  readonly triggeredBy: string;
  readonly aggregateVersion: number;
}

/**
 * Stale tag warning — emitted when a tag exceeds TAG_MAX_STALENESS.
 */
export interface StaleTagWarning {
  readonly tagSlug: TagSlugRef;
  readonly stalenessMs: number;
  readonly detectedAt: string;
}

// ─── Lifecycle record ────────────────────────────────────────────────────────

/** Persisted lifecycle record for a tag managed by centralized-workflows. */
export interface TagLifecycleRecord {
  readonly tagSlug: TagSlugRef;
  readonly state: TagLifecycleState;
  readonly aggregateVersion: number;
  readonly lastTransitionedAt: string;
  readonly createdAt: string;
}

// ─── Eligible tag query types ────────────────────────────────────────────────

/**
 * Input for getEligibleTags selector (VS6 / VS4 compatibility).
 */
export interface EligibleTagsQuery {
  /** Filter by category. If omitted, all categories are returned. */
  readonly category?: TagCategory;
  /** Filter by lifecycle state. Defaults to 'Active'. */
  readonly state?: TagLifecycleState;
  /** Limit on number of results (default: 100). */
  readonly limit?: number;
}

/**
 * A single eligible tag result.
 */
export interface EligibleTagResult {
  readonly tagSlug: TagSlugRef;
  readonly label: string;
  readonly category: TagCategory;
  readonly semanticUri: string;
  readonly state: TagLifecycleState;
  readonly aggregateVersion: number;
}

// ─── Neural Network types [D21-3 D21-4] ──────────────────────────────────────

/**
 * Shortest weighted-distance entry between two nodes.
 *
 * weightedDistance = sum of (1 / edge.weight) along the shortest path.
 * When all edges have weight 1.0, weightedDistance equals hopCount.
 */
export interface SemanticDistanceEntry {
  readonly fromSlug: string;
  readonly toSlug: string;
  /** Number of edges traversed on the shortest path. */
  readonly hopCount: number;
  /** Sum of (1 / edge.weight) along the shortest path [D21-3]. */
  readonly weightedDistance: number;
}

// ─── Causality types [D21-6] ─────────────────────────────────────────────────

/** How a node is connected to the causality source. */
export type CausalityReason = 'IS_A_CHILD' | 'REQUIRES_DEPENDENCY' | 'TRANSITIVE';

/**
 * A node affected by a TagLifecycleEvent via the Neural Network graph [D21-6].
 */
export interface AffectedNode {
  readonly tagSlug: TagSlugRef;
  /** Relationship type connecting this node to the causality source. */
  readonly reason: CausalityReason;
  /** Edges traversed from the source to this node (1 = direct neighbour). */
  readonly hopCount: number;
  /** Cumulative product of edge weights along the shortest path (1.0 = direct). */
  readonly semanticWeight: number;
}

/**
 * A downstream lifecycle event suggested for an affected node.
 *
 * These are advisory signals; the caller decides whether to apply them.
 */
export interface DownstreamEvent {
  readonly targetTagSlug: TagSlugRef;
  readonly suggestedTransition: TagLifecycleState;
  readonly reason: string;
  /** 'immediate' = apply before next write; 'deferred' = schedule in background. */
  readonly priority: 'immediate' | 'deferred';
}

/**
 * Full causality chain emitted by the Causality Tracer [D21-6].
 *
 * Produced by buildCausalityChain(); consumed by the VS8 Reflection Arc
 * (VS8_ROUT) to dispatch downstream updates without hardcoding IDs [D21-5].
 */
export interface CausalityChain {
  readonly sourceEvent: TagLifecycleEvent;
  /** Nodes ordered by (hopCount asc, semanticWeight desc) — most affected first. */
  readonly affectedNodes: readonly AffectedNode[];
  /** Advisory events for downstream lifecycle management. */
  readonly downstreamEvents: readonly DownstreamEvent[];
  readonly computedAt: string;
}
