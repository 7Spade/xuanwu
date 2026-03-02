/**
 * centralized-tag — _events.ts
 *
 * TagLifecycleEvent payload types — re-exported from the canonical tag-authority contract.
 *
 * Per logic-overview.md (VS0 Tag Authority Center):
 *   CTA -->|"標籤異動廣播"| TAG_EVENTS
 *   TAG_EVENTS["TagLifecycleEvent\nTagCreated · TagUpdated\nTagDeprecated · TagDeleted\n→ Integration Event Router"]
 *
 * Architecture: tag-authority owns the CONTRACT (payload interfaces).
 *   centralized-tag owns the IMPLEMENTATION (aggregate + event bus).
 *   All consumers subscribe via onTagEvent; payload types flow from the single source of truth.
 *
 * Invariant #17: CENTRALIZED_TAG_AGGREGATE manages tagSlug uniqueness and deletion rules;
 *   all consumers hold read-only tagSlug references.
 * Invariant T1: New slices needing tag semantics subscribe to TagLifecycleEvent only;
 *   they must not maintain their own tag master data.
 */

// Re-export canonical payload types from the tag-authority contract layer.
// This ensures onTagEvent() callbacks and consumer handlers share a single type definition.
export type {
  TagCreatedPayload,
  TagUpdatedPayload,
  TagDeprecatedPayload,
  TagDeletedPayload,
  TagLifecycleEventPayloadMap,
  TagLifecycleEventKey,
} from '../tag-authority';
