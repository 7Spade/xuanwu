/**
 * shared-kernel/centralized-tag — Public API
 *
 * CENTRALIZED_TAG_AGGREGATE: global semantic dictionary / Tag Authority Center.
 *
 * Per logic-overview.md (VS0 · L1 Shared Kernel · SK_TAG):
 *   CTA["centralized-tag.aggregate\n【全域語義字典・唯一真相】\ntagSlug / label / category\ndeprecatedAt / deleteRule"]
 *
 * This module lives inside the Shared Kernel (VS0) because logic-overview.md places
 * centralized-tag.aggregate inside the SK subgraph (SK_TAG section).
 *
 * Invariants:
 *   #17 — This aggregate is the sole authority for tagSlug uniqueness and deletion rules.
 *   T1  — Consumers must subscribe to TagLifecycleEvent; they must not maintain their own tag data.
 *   A6  — Tag deletion enforced here; consumers hold read-only references.
 */

// Aggregate operations
export {
  createTag,
  updateTag,
  deprecateTag,
  deleteTag,
  getTag,
} from './_aggregate';
export type { CentralizedTagEntry, TagDeleteRule } from './_aggregate';

// Event bus (publish / subscribe)
export { onTagEvent, publishTagEvent } from './_bus';
export type {
  TagLifecycleEventPayloadMap,
  TagLifecycleEventKey,
  TagCreatedPayload,
  TagUpdatedPayload,
  TagDeprecatedPayload,
  TagDeletedPayload,
} from './_events';
