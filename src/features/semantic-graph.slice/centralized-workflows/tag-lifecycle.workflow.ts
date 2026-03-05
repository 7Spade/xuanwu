/**
 * semantic-graph.slice/centralized-workflows — [T1] Tag Lifecycle Workflow
 *
 * Implements the Draft → Active → Stale → Deprecated state machine for tags.
 *
 * Key guarantees:
 *  - State transitions fire a TagLifecycleEvent [T1]
 *  - Events are outbox-decorated (BACKGROUND_LANE) [S1]
 *  - StaleTagWarning is emitted when staleness exceeds TAG_MAX_STALENESS [S4]
 *  - All writes carry aggregateVersion for idempotency [S2]
 *
 * Dependency rule: ZERO infrastructure imports (no Firebase, no React, no I/O).
 */

import { buildIdempotencyKey, StalenessMs } from '@/features/shared-kernel';
import type { TagSlugRef } from '@/features/shared-kernel';

import type {
  TagLifecycleRecord,
  TagLifecycleState,
  TagLifecycleEvent,
  TagLifecycleEventType,
  StaleTagWarning,
} from '../centralized-types';

// ─── In-memory lifecycle registry ────────────────────────────────────────────

const _records = new Map<string, TagLifecycleRecord>();

// ─── Outbox event representation ─────────────────────────────────────────────

/**
 * An outbox-decorated lifecycle event, tagged as BACKGROUND_LANE [S1].
 */
export interface OutboxLifecycleEvent {
  readonly outboxLane: 'BACKGROUND_LANE';
  readonly idempotencyKey: string;
  readonly payload: TagLifecycleEvent;
}

// ─── Allowed transitions ─────────────────────────────────────────────────────

type TransitionMap = Partial<Record<TagLifecycleState, readonly TagLifecycleState[]>>;

const ALLOWED_TRANSITIONS: TransitionMap = {
  Draft: ['Active'],
  Active: ['Stale', 'Deprecated'],
  Stale: ['Active', 'Deprecated'],
  Deprecated: [],
};

function isAllowed(from: TagLifecycleState, to: TagLifecycleState): boolean {
  const allowed = ALLOWED_TRANSITIONS[from] ?? [];
  return (allowed as readonly string[]).includes(to);
}

// ─── Workflow operations ──────────────────────────────────────────────────────

/**
 * Register a new tag in the Draft state.
 */
export function registerTagDraft(
  tagSlug: TagSlugRef,
  triggeredBy: string,
  aggregateVersion: number
): OutboxLifecycleEvent {
  const now = new Date().toISOString();
  const record: TagLifecycleRecord = {
    tagSlug,
    state: 'Draft',
    aggregateVersion,
    lastTransitionedAt: now,
    createdAt: now,
  };
  _records.set(tagSlug, record);

  const event = _buildEvent(tagSlug, 'Draft', 'Draft', triggeredBy, aggregateVersion, now);
  return _wrapOutbox(event);
}

/**
 * Transition a tag to a new lifecycle state.
 *
 * Returns an OutboxLifecycleEvent that must be persisted by the caller.
 * Throws if the transition is not allowed by the state machine.
 */
export function transitionTagState(
  tagSlug: TagSlugRef,
  toState: TagLifecycleState,
  triggeredBy: string,
  nextVersion: number
): OutboxLifecycleEvent {
  const record = _records.get(tagSlug);
  if (!record) {
    throw new Error(`[centralized-workflows] Tag "${tagSlug}" is not registered.`);
  }
  if (!isAllowed(record.state, toState)) {
    throw new Error(
      `[centralized-workflows] Transition ${record.state} → ${toState} is not allowed.`
    );
  }

  const now = new Date().toISOString();
  const updated: TagLifecycleRecord = {
    ...record,
    state: toState,
    aggregateVersion: nextVersion,
    lastTransitionedAt: now,
  };
  _records.set(tagSlug, updated);

  const event = _buildEvent(tagSlug, record.state, toState, triggeredBy, nextVersion, now);
  return _wrapOutbox(event);
}

/**
 * Convenience: activate a Draft tag (Draft → Active).
 */
export function activateTag(
  tagSlug: TagSlugRef,
  triggeredBy: string,
  nextVersion: number
): OutboxLifecycleEvent {
  return transitionTagState(tagSlug, 'Active', triggeredBy, nextVersion);
}

// ─── Stale-tag detection ─────────────────────────────────────────────────────

/**
 * Scan all registered tags and return StaleTagWarning for any
 * Active tag that has not transitioned within TAG_MAX_STALENESS [S4].
 */
export function detectStaleTagWarnings(): readonly StaleTagWarning[] {
  const now = Date.now();
  const warnings: StaleTagWarning[] = [];
  for (const record of _records.values()) {
    if (record.state !== 'Active') continue;
    const lastMs = new Date(record.lastTransitionedAt).getTime();
    const stalenessMs = now - lastMs;
    if (stalenessMs > StalenessMs.TAG_MAX_STALENESS) {
      warnings.push({
        tagSlug: record.tagSlug,
        stalenessMs,
        detectedAt: new Date(now).toISOString(),
      });
    }
  }
  return warnings;
}

// ─── Read helpers ─────────────────────────────────────────────────────────────

/** Get the current lifecycle record for a tag. */
export function getLifecycleRecord(tagSlug: TagSlugRef): TagLifecycleRecord | undefined {
  return _records.get(tagSlug);
}

/** Return all records (read-only snapshot). */
export function getAllLifecycleRecords(): readonly TagLifecycleRecord[] {
  return Array.from(_records.values());
}

/** Clear all records (used in tests). */
export function _clearLifecycleRecordsForTest(): void {
  _records.clear();
}

// ─── Private helpers ──────────────────────────────────────────────────────────

function _buildEvent(
  tagSlug: TagSlugRef,
  fromState: TagLifecycleState,
  toState: TagLifecycleState,
  triggeredBy: string,
  aggregateVersion: number,
  transitionedAt: string
): TagLifecycleEvent {
  const eventId = buildIdempotencyKey(
    `lifecycle:${fromState}→${toState}`,
    tagSlug,
    aggregateVersion
  );
  const eventType: TagLifecycleEventType =
    toState === 'Active'
      ? 'TAG_ACTIVATED'
      : toState === 'Deprecated'
        ? 'TAG_DEPRECATED'
        : toState === 'Stale'
          ? 'TAG_STALE_FLAGGED'
          : 'TAG_CREATED';
  return {
    eventId,
    tagSlug,
    eventType,
    fromState,
    toState,
    transitionedAt,
    triggeredBy,
    aggregateVersion,
  };
}

function _wrapOutbox(payload: TagLifecycleEvent): OutboxLifecycleEvent {
  return {
    outboxLane: 'BACKGROUND_LANE',
    idempotencyKey: payload.eventId,
    payload,
  };
}
