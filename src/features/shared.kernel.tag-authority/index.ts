/**
 * shared.kernel.tag-authority — Legacy shim (→ @/features/shared.kernel/tag-authority)
 *
 * ⚠️  This flat directory is a BACKWARD-COMPATIBILITY shim.
 *     New code MUST import from `@/features/shared.kernel` or
 *     `@/features/shared.kernel/tag-authority` directly.
 *     This shim will be removed after all consumers are migrated.
 *
 * IMPORTANT: This shim re-exports CONTRACT TYPES ONLY.
 *   CRUD operations (createTag, updateTag, deprecateTag, deleteTag) live in
 *   `src/features/centralized-tag/` and MUST NOT be imported via shared.kernel.
 *   Architectural rule: shared.kernel contains contracts, not implementations.
 */
export {
  TAG_CATEGORIES,
  tagSlugRef,
} from '@/features/shared-kernel/tag-authority';
export type {
  TagCategory,
  TagDeleteRule,
  TagSlugRef,
  TagLifecycleEventPayloadMap,
  TagLifecycleEventKey,
  TagCreatedPayload,
  TagUpdatedPayload,
  TagDeprecatedPayload,
  TagDeletedPayload,
  ITagReadPort,
  ImplementsTagStaleGuard,
} from '@/features/shared-kernel/tag-authority';
