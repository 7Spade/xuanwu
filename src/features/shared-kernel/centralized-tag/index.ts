/**
 * shared-kernel/centralized-tag — Public API
 *
 * CENTRALIZED_TAG_AGGREGATE: pure domain types + in-process event bus.
 *
 * [D8] This module is intentionally side-effect-free.  All Firestore-backed
 *      write operations (createTag / updateTag / deprecateTag / deleteTag / getTag)
 *      live in semantic-graph.slice/centralized-tag/_actions.ts per D3 + D8.
 *
 * Per logic-overview.md (VS0 · L1 Shared Kernel · SK_TAG):
 *   CTA["centralized-tag.aggregate\n【全域語義字典・唯一真相】\ntagSlug / label / category\ndeprecatedAt / deleteRule"]
 *
 * Invariants:
 *   #17 — This aggregate is the sole authority for tagSlug uniqueness and deletion rules.
 *   T1  — Consumers must subscribe to TagLifecycleEvent; they must not maintain their own tag data.
 *   A6  — Tag deletion enforced here; consumers hold read-only references.
 */

// Domain types [D8: pure types only]
export type { CentralizedTagEntry, TagDeleteRule } from './_aggregate';

// Event bus (publish / subscribe) [D8: publishTagEvent is sync fire-and-forget]
export { onTagEvent, publishTagEvent } from './_bus';
export type {
  TagLifecycleEventPayloadMap,
  TagLifecycleEventKey,
  TagCreatedPayload,
  TagUpdatedPayload,
  TagDeprecatedPayload,
  TagDeletedPayload,
} from './_events';
