/**
 * projection.schedule-timeline-view — _projector.ts
 *
 * Maintains the per-org resource-dimension timeline read model for schedule items.
 * Overlap detection and resource-grouping are pre-computed here at L5 (projection
 * layer) so the UI never needs to query VS6 or Firestore directly.
 *
 * Per 00-LogicOverview.md (VS6 → STD_PROJ_LANE):
 *   TL_PROJ["projection.schedule-timeline-view\n資源維度 Read Model [L5-Bus]\noverlap/resource-grouping 下沉 L5\napplyVersionGuard() [S2]"]
 *   QGWAY_TL["→ .schedule-timeline-view\n資源維度（overlap/grouping 已預計算）"]
 *
 * Stored at: scheduleTimelineView/{orgId}/members/{memberId}
 *
 * [S2] SK_VERSION_GUARD: versionGuardAllows enforced before every write.
 * [R8] traceId from the originating EventEnvelope is propagated into the record.
 * [#14] Schedule reads only ORG_ELIGIBLE_MEMBER_VIEW. Eligibility concerns stay
 *        in VS6; this projector only maintains the member-keyed timeline snapshot.
 *
 * Feed path: IER STANDARD_LANE → FUNNEL → STD_PROJ_LANE → here.
 */

import { getDocument } from '@/shared-infra/frontend-firebase/firestore/firestore.read.adapter';
import {
  setDocument,
  serverTimestamp,
} from '@/shared-infra/frontend-firebase/firestore/firestore.write.adapter';
import { versionGuardAllows } from '@/shared-kernel';
import type { ScheduleItem } from '@/shared-kernel';

// ---------------------------------------------------------------------------
// Read model shape
// ---------------------------------------------------------------------------

/** A timeline block representing one schedule item assigned to a member. */
export interface TimelineBlock {
  readonly scheduleItemId: string;
  readonly workspaceId: string;
  readonly title: string;
  /** ISO-8601 timestamp string derived from ScheduleItem.startDate */
  readonly startAt: string;
  /** ISO-8601 timestamp string derived from ScheduleItem.endDate */
  readonly endAt: string;
  readonly status: ScheduleItem['status'];
  /**
   * Pre-computed overlap group index.
   * 0 = no overlap; positive integers indicate concurrent-block column position.
   * Computed relative to all blocks for this member.
   */
  overlapGroup: number;
  /** Last aggregate version processed [S2] */
  lastProcessedVersion: number;
}

/**
 * Per-member timeline view.
 * Document key: scheduleTimelineView/{orgId}/members/{memberId}
 */
export interface ScheduleTimelineMemberView {
  readonly orgId: string;
  readonly memberId: string;
  /** Map of scheduleItemId → block */
  blocks: Record<string, TimelineBlock>;
  /** Monotonically increasing projection version for this member [S2] */
  lastProcessedVersion: number;
  /** TraceId from the originating EventEnvelope [R8] */
  traceId?: string;
  updatedAt: ReturnType<typeof serverTimestamp>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Firestore path for a member timeline document. */
function timelineMemberPath(orgId: string, memberId: string): string {
  return `scheduleTimelineView/${orgId}/members/${memberId}`;
}

/**
 * Re-computes overlapGroup for all blocks in the map.
 * Two blocks overlap when their [startAt, endAt) intervals intersect.
 * Each overlapping cluster is assigned the same group index (1-based).
 * Non-overlapping blocks keep overlapGroup = 0.
 */
function computeOverlapGroups(
  blocks: Record<string, TimelineBlock>
): Record<string, TimelineBlock> {
  const entries = Object.values(blocks);
  if (entries.length === 0) return blocks;

  const updated = entries.map((b) => ({ ...b, overlapGroup: 0 }));

  let groupCounter = 0;
  for (let i = 0; i < updated.length; i++) {
    for (let j = i + 1; j < updated.length; j++) {
      const a = updated[i];
      const b = updated[j];
      const aStart = new Date(a.startAt).getTime();
      const aEnd = new Date(a.endAt).getTime();
      const bStart = new Date(b.startAt).getTime();
      const bEnd = new Date(b.endAt).getTime();

      if (aStart < bEnd && aEnd > bStart) {
        // Overlapping — assign group
        if (a.overlapGroup === 0 && b.overlapGroup === 0) {
          groupCounter++;
          updated[i] = { ...a, overlapGroup: groupCounter };
          updated[j] = { ...b, overlapGroup: groupCounter };
        } else if (a.overlapGroup !== 0) {
          updated[j] = { ...b, overlapGroup: a.overlapGroup };
        } else {
          updated[i] = { ...a, overlapGroup: b.overlapGroup };
        }
      }
    }
  }

  return Object.fromEntries(updated.map((b) => [b.scheduleItemId, b]));
}

/**
 * Converts a Firestore Timestamp-compatible value to an ISO-8601 string.
 */
function toIsoString(value: { toDate?: () => Date } | Date | string): string {
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof (value as { toDate?: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return new Date().toISOString();
}

// ---------------------------------------------------------------------------
// Projector functions (called by Event Funnel)
// ---------------------------------------------------------------------------

/**
 * Upserts a timeline block for each assignee when a schedule item is proposed
 * or updated. Recalculates overlap groups after insert.
 *
 * [S2] Version guard per member-block.
 * [R8] traceId forwarded.
 */
export async function applyTimelineUpsert(params: {
  orgId: string;
  scheduleItem: Pick<
    ScheduleItem,
    | 'id'
    | 'workspaceId'
    | 'title'
    | 'startDate'
    | 'endDate'
    | 'status'
    | 'assigneeIds'
  >;
  aggregateVersion: number;
  traceId?: string;
}): Promise<void> {
  const { orgId, scheduleItem, aggregateVersion, traceId } = params;

  for (const memberId of scheduleItem.assigneeIds) {
    const docPath = timelineMemberPath(orgId, memberId);
    const existing = await getDocument<ScheduleTimelineMemberView>(docPath);
    const currentBlock = existing?.blocks?.[scheduleItem.id];

    if (
      !versionGuardAllows({
        eventVersion: aggregateVersion,
        viewLastProcessedVersion: currentBlock?.lastProcessedVersion ?? 0,
      })
    ) {
      continue;
    }

    const newBlock: TimelineBlock = {
      scheduleItemId: scheduleItem.id,
      workspaceId: scheduleItem.workspaceId,
      title: scheduleItem.title,
      startAt: toIsoString(scheduleItem.startDate as Parameters<typeof toIsoString>[0]),
      endAt: toIsoString(scheduleItem.endDate as Parameters<typeof toIsoString>[0]),
      status: scheduleItem.status,
      overlapGroup: 0,
      lastProcessedVersion: aggregateVersion,
    };

    const rawBlocks: Record<string, TimelineBlock> = {
      ...(existing?.blocks ?? {}),
      [scheduleItem.id]: newBlock,
    };

    const blocksWithOverlap = computeOverlapGroups(rawBlocks);

    const view: Omit<ScheduleTimelineMemberView, 'updatedAt'> & {
      updatedAt: ReturnType<typeof serverTimestamp>;
    } = {
      orgId,
      memberId,
      blocks: blocksWithOverlap,
      lastProcessedVersion: aggregateVersion,
      ...(traceId !== undefined && { traceId }),
      updatedAt: serverTimestamp(),
    };

    await setDocument(docPath, view);
  }
}

/**
 * Removes a block from every member's timeline document when a schedule item
 * is cancelled, rejected, or completed.
 *
 * [S2] Version guard per member-block.
 * [R8] traceId forwarded.
 */
export async function applyTimelineRemove(params: {
  orgId: string;
  scheduleItemId: string;
  assigneeIds: string[];
  aggregateVersion: number;
  traceId?: string;
}): Promise<void> {
  const { orgId, scheduleItemId, assigneeIds, aggregateVersion, traceId } = params;

  for (const memberId of assigneeIds) {
    const docPath = timelineMemberPath(orgId, memberId);
    const existing = await getDocument<ScheduleTimelineMemberView>(docPath);
    if (!existing) continue;

    const currentBlock = existing.blocks?.[scheduleItemId];
    if (!currentBlock) continue;

    if (
      !versionGuardAllows({
        eventVersion: aggregateVersion,
        viewLastProcessedVersion: currentBlock.lastProcessedVersion,
      })
    ) {
      continue;
    }

    const { [scheduleItemId]: _removed, ...remainingBlocks } = existing.blocks;
    const blocksWithOverlap = computeOverlapGroups(remainingBlocks);

    const view: Omit<ScheduleTimelineMemberView, 'updatedAt'> & {
      updatedAt: ReturnType<typeof serverTimestamp>;
    } = {
      ...existing,
      blocks: blocksWithOverlap,
      lastProcessedVersion: aggregateVersion,
      ...(traceId !== undefined && { traceId }),
      updatedAt: serverTimestamp(),
    };

    await setDocument(docPath, view);
  }
}
