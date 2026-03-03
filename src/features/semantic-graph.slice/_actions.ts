/**
 * semantic-graph.slice — _actions.ts
 *
 * VS8 Semantic Graph: server actions for tag management. [D3]
 *
 * Per logic-overview.md [D3] SIDE_EFFECT_FUNNELLING:
 *   All entity mutations (Firestore set/update) MUST go through _actions.ts.
 *   UI and external callers MUST NOT call Firestore directly.
 *
 * Architecture:
 *   [D3]  All writes funnelled through these actions.
 *   [D8]  Validation logic delegated to _aggregate.ts (pure).
 *   [D21] Tag categories governed by VS8.
 *   [D26] semantic-graph.slice owns _actions.ts; does not parasitize shared-kernel.
 */

import { commandSuccess, commandFailureFrom } from '@/features/shared-kernel';
import type { CommandResult } from '@/features/shared-kernel';
import type { TaxonomyNode } from '@/features/shared-kernel';

import { detectTemporalConflicts, validateTaxonomyAssignment } from './_aggregate';
import { indexEntity, removeFromIndex } from './_services';
import type {
  TemporalTagAssignment,
  SemanticIndexEntry,
} from './_types';

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
          .map((c) => `${c.overlapStartDate}–${c.overlapEndDate}`)
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
 * Assigns a semantic tag — semantic alias for upsertTagWithConflictCheck.
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
