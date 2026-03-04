/**
 * semantic-graph.slice/centralized-tag — _actions.ts
 *
 * CTA (Centralized Tag Aggregate) Firestore-backed operations.
 *
 * [D3]  All entity mutations go through _actions.ts.
 * [D8]  Firestore calls are prohibited in shared-kernel; they live here instead.
 * [D24] Infra imports (firestore.read/write.adapter) are allowed in feature slices.
 * [R4]  All exported command functions return CommandResult (SK_CMD_RESULT).
 *
 * Per logic-overview.md (VS8 + VS0):
 *   The centralized-tag CONTRACT (types, event bus) lives in shared-kernel.
 *   The centralized-tag IMPLEMENTATION (Firestore reads/writes) lives here.
 *
 * Consumers: import from '@/features/semantic-graph.slice'.
 */

import { commandSuccess, commandFailureFrom, publishTagEvent, buildIdempotencyKey } from '@/features/shared-kernel';
import type {
  CommandResult,
  CentralizedTagEntry,
  TagDeleteRule,
  TagCategory,
  DlqTier,
} from '@/features/shared-kernel';
import { Timestamp, getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
import {
  setDocument,
  updateDocument,
  deleteDocument,
} from '@/shared/infra/firestore/firestore.write.adapter';

// ---------------------------------------------------------------------------
// Outbox helper [Q2][S1][R8]
// Writes a pending OutboxDocument to tagOutbox/{id}.
// The OUTBOX_RELAY_WORKER (infra.outbox-relay) picks this up via CDC and
// delivers it to IER BACKGROUND_LANE → VS4_TAG_SUBSCRIBER.
//
// S1: uses buildIdempotencyKey(eventId, aggId, version) from shared.kernel.outbox-contract.
// R8: traceId carried in the envelope if supplied by the calling action.
// ---------------------------------------------------------------------------

async function writeTagOutbox(
  eventType: string,
  tagSlug: string,
  payload: unknown,
  traceId?: string
): Promise<void> {
  const outboxId = crypto.randomUUID();
  const occurredAt = Timestamp.now().toDate().toISOString();
  const idempotencyKey = buildIdempotencyKey(outboxId, tagSlug, 0);
  // NOTE: version=0 because centralized-tag does not maintain an event-sourced version counter.
  // The idempotency key is still unique per outbox record because eventId (outboxId) is a UUID.
  const envelope = {
    eventId: outboxId,
    eventType,
    occurredAt,
    sourceId: tagSlug,
    payload,
    idempotencyKey,
    ...(traceId ? { traceId } : {}),
  };

  await setDocument<Record<string, unknown>>(`tagOutbox/${outboxId}`, {
    outboxId,
    eventType,
    envelopeJson: JSON.stringify(envelope),
    lane: 'BACKGROUND_LANE',
    // [S1] dlqTier required by OutboxRecord contract — tag events are idempotent
    dlqTier: 'SAFE_AUTO' satisfies DlqTier,
    status: 'pending',
    createdAt: occurredAt,
    attemptCount: 0,
  });
}

// ---------------------------------------------------------------------------
// CTA Firestore operations [D3][R4]
// ---------------------------------------------------------------------------

/**
 * Creates a new tag in the global semantic dictionary. [R4]
 * Enforces uniqueness: returns a failure result if the tagSlug already exists.
 *
 * Publishes `tag:created`.
 */
export async function createTag(
  tagSlug: string,
  label: string,
  category: TagCategory,
  createdBy: string,
  deleteRule: TagDeleteRule = 'block-if-referenced',
  traceId?: string
): Promise<CommandResult> {
  try {
    const path = `tagDictionary/${tagSlug}`;
    const existing = await getDocument<CentralizedTagEntry>(path);
    if (existing) {
      return commandFailureFrom(
        'TAG_ALREADY_EXISTS',
        `Tag "${tagSlug}" already exists in the global dictionary. tagSlug must be unique.`,
        { tagSlug },
      );
    }

    const now = Timestamp.now().toDate().toISOString();
    const entry: CentralizedTagEntry = {
      tagSlug,
      label,
      category,
      deleteRule,
      createdBy,
      createdAt: now,
      updatedAt: now,
    };

    await setDocument(path, entry);

    const createdPayload = { tagSlug, label, category, createdBy, createdAt: now };
    await writeTagOutbox('tag:created', tagSlug, createdPayload, traceId).catch((err) =>
      console.error('[centralized-tag] tagOutbox write failed for tag:created', tagSlug, err)
    );
    publishTagEvent('tag:created', createdPayload); // D8: sync fire-and-forget, no await

    // version=0: centralized-tag does not maintain an event-sourced version counter;
    // see writeTagOutbox() for details on idempotency key construction.
    return commandSuccess(tagSlug, 0);
  } catch (err) {
    return commandFailureFrom(
      'TAG_CREATE_FAILED',
      err instanceof Error ? err.message : 'Failed to create tag',
      { tagSlug },
    );
  }
}

/**
 * Updates the label or category of an existing tag. [R4]
 * tagSlug is immutable once created (it is the stable cross-BC reference key).
 *
 * Publishes `tag:updated`.
 */
export async function updateTag(
  tagSlug: string,
  updates: { label?: string; category?: TagCategory },
  updatedBy: string,
  traceId?: string
): Promise<CommandResult> {
  try {
    const path = `tagDictionary/${tagSlug}`;
    const existing = await getDocument<CentralizedTagEntry>(path);
    if (!existing) {
      return commandFailureFrom(
        'TAG_NOT_FOUND',
        `Tag "${tagSlug}" not found in global dictionary.`,
        { tagSlug },
      );
    }

    const now = Timestamp.now().toDate().toISOString();
    const newLabel = updates.label ?? existing.label;
    const newCategory = updates.category ?? existing.category;

    await updateDocument(path, {
      label: newLabel,
      category: newCategory,
      updatedAt: now,
    });

    const updatedPayload = {
      tagSlug,
      label: newLabel,
      category: newCategory,
      updatedBy,
      updatedAt: now,
    };
    await writeTagOutbox('tag:updated', tagSlug, updatedPayload, traceId).catch((err) =>
      console.error('[centralized-tag] tagOutbox write failed for tag:updated', tagSlug, err)
    );
    publishTagEvent('tag:updated', updatedPayload); // D8: sync fire-and-forget, no await

    return commandSuccess(tagSlug, 0);
  } catch (err) {
    return commandFailureFrom(
      'TAG_UPDATE_FAILED',
      err instanceof Error ? err.message : 'Failed to update tag',
      { tagSlug },
    );
  }
}

/**
 * Marks a tag as deprecated. [R4]
 * Deprecated tags remain valid references but consumers should migrate to replacedByTagSlug.
 *
 * Publishes `tag:deprecated`.
 */
export async function deprecateTag(
  tagSlug: string,
  deprecatedBy: string,
  replacedByTagSlug?: string,
  traceId?: string
): Promise<CommandResult> {
  try {
    const path = `tagDictionary/${tagSlug}`;
    const existing = await getDocument<CentralizedTagEntry>(path);
    if (!existing) {
      return commandFailureFrom(
        'TAG_NOT_FOUND',
        `Tag "${tagSlug}" not found in global dictionary.`,
        { tagSlug },
      );
    }
    if (existing.deprecatedAt) {
      // Idempotent: tag already deprecated. Log for observability.
      console.debug('[centralized-tag] deprecateTag no-op — already deprecated', tagSlug);
      return commandSuccess(tagSlug, 0);
    }

    const now = Timestamp.now().toDate().toISOString();
    await updateDocument(path, {
      deprecatedAt: now,
      ...(replacedByTagSlug ? { replacedByTagSlug } : {}),
      updatedAt: now,
    });

    const deprecatedPayload = { tagSlug, replacedByTagSlug, deprecatedBy, deprecatedAt: now };
    await writeTagOutbox('tag:deprecated', tagSlug, deprecatedPayload, traceId).catch((err) =>
      console.error('[centralized-tag] tagOutbox write failed for tag:deprecated', tagSlug, err)
    );
    publishTagEvent('tag:deprecated', deprecatedPayload); // D8: sync fire-and-forget, no await

    return commandSuccess(tagSlug, 0);
  } catch (err) {
    return commandFailureFrom(
      'TAG_DEPRECATE_FAILED',
      err instanceof Error ? err.message : 'Failed to deprecate tag',
      { tagSlug },
    );
  }
}

/**
 * Deletes a tag from the global dictionary. [R4]
 *
 * Deletion rule: if `deleteRule === 'block-if-referenced'` the caller must
 * ensure all consumers have released their references before calling this.
 * This aggregate does NOT track cross-BC reference counts (that would violate #1).
 * The invariant is enforced by convention and governance process.
 *
 * Publishes `tag:deleted`.
 */
export async function deleteTag(
  tagSlug: string,
  deletedBy: string,
  traceId?: string
): Promise<CommandResult> {
  try {
    const path = `tagDictionary/${tagSlug}`;
    const existing = await getDocument<CentralizedTagEntry>(path);
    if (!existing) {
      // Idempotent: tag already absent. Log for observability.
      console.debug('[centralized-tag] deleteTag no-op — tag not found', tagSlug);
      return commandSuccess(tagSlug, 0);
    }

    await deleteDocument(path);

    const deletedPayload = { tagSlug, deletedBy, deletedAt: Timestamp.now().toDate().toISOString() };
    await writeTagOutbox('tag:deleted', tagSlug, deletedPayload, traceId).catch((err) =>
      console.error('[centralized-tag] tagOutbox write failed for tag:deleted', tagSlug, err)
    );
    publishTagEvent('tag:deleted', deletedPayload); // D8: sync fire-and-forget, no await

    return commandSuccess(tagSlug, 0);
  } catch (err) {
    return commandFailureFrom(
      'TAG_DELETE_FAILED',
      err instanceof Error ? err.message : 'Failed to delete tag',
      { tagSlug },
    );
  }
}

/**
 * Reads a single tag entry from the global dictionary.
 */
export async function getTag(tagSlug: string): Promise<CentralizedTagEntry | null> {
  return getDocument<CentralizedTagEntry>(`tagDictionary/${tagSlug}`);
}
