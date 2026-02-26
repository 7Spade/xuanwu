/**
 * projection.tag-snapshot — _projector.ts
 *
 * Tag Authority global read model.
 * Final-consistent snapshot of the global tag dictionary.
 *
 * Per logic-overview.md (VS8 Tag Lifecycle Views):
 *   TAG_SNAPSHOT["projection.tag-snapshot\ntagSlug / label / category\n組織作用域快照\n來源: TagLifecycleEvent\n消費方唯讀快取"]
 *
 * Invariants:
 *   T5 — TAG_SNAPSHOT is the final-consistent read model; consumers must not write.
 *   #9  — Projections must be fully rebuildable from events.
 *   A7  — Event Funnel composes projections; does not enforce cross-BC invariants.
 *
 * Stored at: tagSnapshot/{tagSlug}
 */

import { setDocument, updateDocument, deleteDocument } from '@/shared/infra/firestore/firestore.write.adapter';
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
import { versionGuardAllows } from '@/features/shared.kernel.version-guard';
import type { TagCreatedPayload, TagUpdatedPayload, TagDeprecatedPayload, TagDeletedPayload } from '@/features/centralized-tag';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TagSnapshotEntry {
  tagSlug: string;
  label: string;
  category: string;
  /** Present when the tag has been deprecated. */
  deprecatedAt?: string;
  /** Suggested replacement tag, if specified at deprecation time. */
  replacedByTagSlug?: string;
  readModelVersion: number;
  /** Last aggregate version processed by this projection [S2] */
  lastProcessedVersion?: number;
  /** TraceId from the originating EventEnvelope [R8] */
  traceId?: string;
}

// ---------------------------------------------------------------------------
// Projector functions (called by Event Funnel — Invariant A7)
// ---------------------------------------------------------------------------

/** applyTagCreated — no version guard needed; creates are idempotent. */
export async function applyTagCreated(payload: TagCreatedPayload, traceId?: string): Promise<void> {
  await setDocument(`tagSnapshot/${payload.tagSlug}`, {
    tagSlug: payload.tagSlug,
    label: payload.label,
    category: payload.category,
    readModelVersion: Date.now(),
    ...(traceId !== undefined ? { traceId } : {}),
  } satisfies TagSnapshotEntry);
}

export async function applyTagUpdated(
  payload: TagUpdatedPayload,
  aggregateVersion?: number,
  traceId?: string
): Promise<void> {
  if (aggregateVersion !== undefined) {
    const existing = await getDocument<TagSnapshotEntry>(`tagSnapshot/${payload.tagSlug}`);
    if (!versionGuardAllows({
      eventVersion: aggregateVersion,
      viewLastProcessedVersion: existing?.lastProcessedVersion ?? 0,
    })) {
      return;
    }
  }

  await setDocument(`tagSnapshot/${payload.tagSlug}`, {
    tagSlug: payload.tagSlug,
    label: payload.label,
    category: payload.category,
    readModelVersion: Date.now(),
    ...(aggregateVersion !== undefined ? { lastProcessedVersion: aggregateVersion } : {}),
    ...(traceId !== undefined ? { traceId } : {}),
  } satisfies TagSnapshotEntry);
}

export async function applyTagDeprecated(
  payload: TagDeprecatedPayload,
  aggregateVersion?: number,
  traceId?: string
): Promise<void> {
  if (aggregateVersion !== undefined) {
    const existing = await getDocument<TagSnapshotEntry>(`tagSnapshot/${payload.tagSlug}`);
    if (!versionGuardAllows({
      eventVersion: aggregateVersion,
      viewLastProcessedVersion: existing?.lastProcessedVersion ?? 0,
    })) {
      return;
    }
  }

  await updateDocument(`tagSnapshot/${payload.tagSlug}`, {
    deprecatedAt: payload.deprecatedAt,
    ...(payload.replacedByTagSlug ? { replacedByTagSlug: payload.replacedByTagSlug } : {}),
    readModelVersion: Date.now(),
    ...(aggregateVersion !== undefined ? { lastProcessedVersion: aggregateVersion } : {}),
    ...(traceId !== undefined ? { traceId } : {}),
  });
}

/** applyTagDeleted — no version guard needed; deletes are final. */
export async function applyTagDeleted(payload: TagDeletedPayload): Promise<void> {
  await deleteDocument(`tagSnapshot/${payload.tagSlug}`);
}
