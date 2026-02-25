/**
 * shared.kernel.tag-authority — Public API
 *
 * [VS0] 全域標籤權力中心定義
 *
 * Per tree.md: shared.kernel.tag-authority = sole global authority for tagSlug semantics.
 *   — All other slices hold READ-ONLY tagSlug references.
 *   — TagLifecycleEvents (TagCreated/Updated/Deprecated/Deleted) broadcast
 *     semantic changes to all interested slices via Integration Event Router.
 *
 * Implementation lives in features/centralized-tag.
 * This boundary stub re-exports the canonical contract for consumers that
 * import by tree.md slice name.
 */
export {
  createTag,
  updateTag,
  deprecateTag,
  deleteTag,
  getTag,
  onTagEvent,
  publishTagEvent,
} from '@/features/centralized-tag';
export type {
  CentralizedTagEntry,
  TagDeleteRule,
  TagLifecycleEventPayloadMap,
  TagLifecycleEventKey,
  TagCreatedPayload,
  TagUpdatedPayload,
  TagDeprecatedPayload,
  TagDeletedPayload,
} from '@/features/centralized-tag';
