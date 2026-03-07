/**
 * semantic-graph.slice ??_actions.ts
 *
 * VS8 Semantic Graph: server actions for tag management. [D3]
 *
 * Per 00-LogicOverview.md [D3] SIDE_EFFECT_FUNNELLING:
 *   All entity mutations (Firestore set/update) MUST go through _actions.ts.
 *   UI and external callers MUST NOT call Firestore directly.
 *
 * Architecture:
 *   [D3]  All writes funnelled through these actions.
 *   [D8]  Validation logic delegated to _aggregate.ts (pure).
 *   [D21] Tag categories governed by VS8.
 *   [D26] semantic-graph.slice owns _actions.ts; does not parasitize shared-kernel.
 *
 * New subsystem commands (centralized-*):
 *   addSemanticEdge        ??register IS_A / REQUIRES edge [D3]
 *   removeSemanticEdge     ??deregister edge [D3]
 *   registerTagLifecycle   ??create a Tag lifecycle record in Draft state [T1]
 *   activateTagLifecycle   ??transition Draft ??Active [T1]
 *   transitionTagLifecycle ??generic state transition [T1]
 */

import { commandSuccess, commandFailureFrom } from '@/shared-kernel';
import type { CommandResult, TagSlugRef } from '@/shared-kernel';
import type { TaxonomyNode } from '@/shared-kernel';

import { detectTemporalConflicts, validateTaxonomyAssignment } from './_aggregate';
import { indexEntity, removeFromIndex } from './_services';
import type {
  TemporalTagAssignment,
  SemanticIndexEntry,
} from './_types';
import {
  addEdge,
  removeEdge,
} from './graph/edges/semantic-edge-store';
import type { SemanticRelationType, TagLifecycleState } from './core/types';
import {
  registerTagDraft,
  activateTag,
  transitionTagState,
} from './routing/tag-lifecycle.workflow';
import type { OutboxLifecycleEvent } from './routing/tag-lifecycle.workflow';

// =================================================================
// Tag Upsert with Conflict Check
// =================================================================

/**
 * Upserts a tag assignment after passing temporal conflict detection
 * and taxonomy validation.
 *
 * Flow:
 *   1. Validate taxonomy constraints via _aggregate.ts
 *   2. Detect temporal conflicts via _aggregate.ts
 *   3. If valid, index the entity in the semantic index
 *   4. Return CommandResult per [R4]
 *
 * Actual Firestore persistence is deferred to the infrastructure layer;
 * this action validates and updates the in-memory semantic index.
 */
export async function upsertTagWithConflictCheck(
  node: TaxonomyNode,
  temporalAssignment: TemporalTagAssignment | null,
  existingNodes: readonly TaxonomyNode[],
  existingAssignments: readonly TemporalTagAssignment[]
): Promise<CommandResult> {
  try {
    const taxonomyResult = validateTaxonomyAssignment(node, existingNodes);
    if (!taxonomyResult.valid) {
      const messages = taxonomyResult.errors.map((e) => e.message).join('; ');
      return commandFailureFrom(
        taxonomyResult.errors[0]?.code ?? 'TAXONOMY_VALIDATION_FAILED',
        messages,
        { tagSlug: node.slug, errorCount: taxonomyResult.errors.length }
      );
    }

    if (temporalAssignment) {
      const conflictResult = detectTemporalConflicts({
        candidate: temporalAssignment,
        existingAssignments,
      });

      if (conflictResult.hasConflict) {
        const conflictSummary = conflictResult.conflicts
          .map((c) => `${c.overlapStartDate}??{c.overlapEndDate}`)
          .join(', ');
        return commandFailureFrom(
          'TEMPORAL_CONFLICT',
          `Tag "${node.slug}" has temporal conflicts: ${conflictSummary}`,
          {
            tagSlug: node.slug,
            conflictCount: conflictResult.conflicts.length,
            conflicts: conflictResult.conflicts.map((c) => ({
              overlapStart: c.overlapStartDate,
              overlapEnd: c.overlapEndDate,
            })),
          }
        );
      }
    }

    const entry: SemanticIndexEntry = {
      id: node.slug,
      domain: 'tag',
      title: node.label,
      subtitle: `${node.dimension} · depth ${node.depth}`,
      tags: [node.slug, node.dimension],
      searchableText: `${node.label} ${node.slug} ${node.dimension}`,
      updatedAt: new Date().toISOString(),
    };
    indexEntity(entry);

    return commandSuccess(node.slug, 1);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return commandFailureFrom('TAG_UPSERT_FAILED', message);
  }
}

// =================================================================
// Tag Removal
// =================================================================

/**
 * Removes a tag from the semantic index.
 * Returns CommandResult per [R4].
 */
export async function removeTag(tagSlug: string): Promise<CommandResult> {
  try {
    removeFromIndex('tag', tagSlug);
    return commandSuccess(tagSlug, 0);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return commandFailureFrom('TAG_REMOVAL_FAILED', message);
  }
}

// =================================================================
// Tag Assignment Action (D3)
// =================================================================

/**
 * Assigns a semantic tag ??semantic alias for upsertTagWithConflictCheck.
 *
 * Provides the assignSemanticTag entry point requested by the VS8
 * architecture spec. Currently delegates all validation and indexing
 * to upsertTagWithConflictCheck; exists as a distinct API name for
 * clarity in consumer code and future extensibility.
 */
export async function assignSemanticTag(
  node: TaxonomyNode,
  temporalAssignment: TemporalTagAssignment | null,
  existingNodes: readonly TaxonomyNode[],
  existingAssignments: readonly TemporalTagAssignment[]
): Promise<CommandResult> {
  return upsertTagWithConflictCheck(
    node,
    temporalAssignment,
    existingNodes,
    existingAssignments
  );
}

// =================================================================
// Semantic Edge Commands (centralized-edges) [D3]
// =================================================================

/**
 * Register a semantic edge between two tag nodes.
 *
 * Supported relation types:
 *   IS_A     ??inheritance / subsumption (skill:expert IS_A skill:senior)
 *   REQUIRES ??dependency (role:lead REQUIRES skill:leadership)
 *
 * [D3] All edge mutations go through this action.
 * [S2] aggregateVersion in the returned edge ensures idempotency on re-runs.
 */
export async function addSemanticEdge(
  fromTagSlug: string,
  toTagSlug: string,
  relationType: SemanticRelationType
): Promise<CommandResult> {
  try {
    if (!fromTagSlug || !toTagSlug) {
      return commandFailureFrom(
        'INVALID_EDGE_PARAMS',
        'fromTagSlug and toTagSlug must not be empty'
      );
    }
    if (fromTagSlug === toTagSlug) {
      return commandFailureFrom(
        'SELF_LOOP_EDGE',
        `Self-loop edge not allowed: "${fromTagSlug}" ??"${toTagSlug}"`
      );
    }
    const edge = addEdge(fromTagSlug, toTagSlug, relationType);
    return commandSuccess(edge.edgeId, 1);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return commandFailureFrom('EDGE_ADD_FAILED', message);
  }
}

/**
 * Remove a semantic edge between two tag nodes.
 *
 * Returns CommandResult with aggVersion=0 if the edge did not exist
 * (idempotent ??removing a non-existent edge is not an error).
 *
 * [D3] All edge mutations go through this action.
 */
export async function removeSemanticEdge(
  fromTagSlug: string,
  toTagSlug: string,
  relationType: SemanticRelationType
): Promise<CommandResult> {
  try {
    const removed = removeEdge(fromTagSlug, toTagSlug, relationType);
    return commandSuccess(`${relationType}:${fromTagSlug}??{toTagSlug}`, removed ? 1 : 0);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return commandFailureFrom('EDGE_REMOVE_FAILED', message);
  }
}

// =================================================================
// Tag Lifecycle Commands (centralized-workflows) [T1]
// =================================================================

/**
 * Create a new tag lifecycle record in the Draft state. [T1]
 *
 * Returns the outbox-decorated TagLifecycleEvent for persistence.
 * [S2] aggregateVersion must be 1 for brand-new lifecycle records.
 */
export async function registerTagLifecycle(
  tagSlug: TagSlugRef,
  triggeredBy: string,
  aggregateVersion: number
): Promise<CommandResult & { outboxEvent?: OutboxLifecycleEvent }> {
  try {
    const outboxEvent = registerTagDraft(tagSlug, triggeredBy, aggregateVersion);
    return { ...commandSuccess(tagSlug, aggregateVersion), outboxEvent };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return commandFailureFrom('LIFECYCLE_REGISTER_FAILED', message);
  }
}

/**
 * Transition a tag from Draft ??Active. [T1]
 *
 * Convenience shortcut over transitionTagLifecycle.
 * [S2] nextVersion must be greater than the current aggregateVersion.
 */
export async function activateTagLifecycle(
  tagSlug: TagSlugRef,
  triggeredBy: string,
  nextVersion: number
): Promise<CommandResult & { outboxEvent?: OutboxLifecycleEvent }> {
  try {
    const outboxEvent = activateTag(tagSlug, triggeredBy, nextVersion);
    return { ...commandSuccess(tagSlug, nextVersion), outboxEvent };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return commandFailureFrom('LIFECYCLE_ACTIVATE_FAILED', message);
  }
}

/**
 * Transition a tag to any allowed lifecycle state. [T1]
 *
 * Allowed transitions:
 *   Draft      ??Active
 *   Active     ??Stale | Deprecated
 *   Stale      ??Active | Deprecated
 *   Deprecated ??(terminal)
 *
 * [S2] nextVersion must be greater than the current aggregateVersion.
 * [S1] The returned outboxEvent is tagged BACKGROUND_LANE for async delivery.
 */
export async function transitionTagLifecycle(
  tagSlug: TagSlugRef,
  toState: TagLifecycleState,
  triggeredBy: string,
  nextVersion: number
): Promise<CommandResult & { outboxEvent?: OutboxLifecycleEvent }> {
  try {
    const outboxEvent = transitionTagState(tagSlug, toState, triggeredBy, nextVersion);
    return { ...commandSuccess(tagSlug, nextVersion), outboxEvent };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return commandFailureFrom('LIFECYCLE_TRANSITION_FAILED', message);
  }
}
