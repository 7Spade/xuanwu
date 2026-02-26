# Feature Slice: `centralized-tag`

## Domain

**Tag Authority Center** — global semantic dictionary for tagSlugs.

This slice is the **唯一** (sole) authority for tagSlug uniqueness and deletion rules across all Bounded Contexts (Invariant #17, A6).

## Responsibilities

- Maintain the global tag dictionary: tagSlug / label / category / deprecatedAt / deleteRule
- Enforce tagSlug uniqueness globally (createTag throws on duplicate)
- Manage tag lifecycle: create → active → (deprecated) → deleted
- Broadcast TagLifecycleEvents (TagCreated/Updated/Deprecated/Deleted) to all consumers via Integration Event Router

## Invariants Enforced

| # | Invariant | Enforcement |
|---|-----------|-------------|
| 17 | CTA is the sole tag authority | Only this slice writes `tagDictionary/{tagSlug}` |
| A6 | tagSlug uniqueness and deletion rules managed here | `createTag` throws on duplicate; `deleteTag` follows `deleteRule` |
| T1 | Consumers must subscribe to TagLifecycleEvent | No other slice writes to `tagDictionary` |
| T5 | TAG_SNAPSHOT is the final-consistent read model; consumers must not write | projection.tag-snapshot is read-only for consumers |

## Internal Files

| File | Purpose |
|------|---------|
| `_aggregate.ts` | `createTag`, `updateTag`, `deprecateTag`, `deleteTag`, `getTag` |
| `_events.ts` | `TagLifecycleEventPayloadMap` — TagCreated, TagUpdated, TagDeprecated, TagDeleted |
| `_bus.ts` | `onTagEvent`, `publishTagEvent` — in-process tag lifecycle event bus |
| `index.ts` | Public API |

## Firestore Paths

| Path | Data |
|------|------|
| `tagDictionary/{tagSlug}` | `CentralizedTagEntry` (tagSlug, label, category, deprecatedAt, deleteRule) |

## Public API (`index.ts`)

```ts
// Aggregate
export { createTag, updateTag, deprecateTag, deleteTag, getTag } from './_aggregate';
// Bus
export { onTagEvent, publishTagEvent } from './_bus';
// Event types
export type { TagLifecycleEventPayloadMap, TagCreatedPayload, ... } from './_events';
```

## Dependencies

- `@/shared/infra/firestore/` — read/write adapters
- `@/features/shared-kernel/events/event-envelope` — event envelope contract marker

## Consumer Contract

All slices that need tag semantics **MUST**:
1. Import tagSlugs as read-only references (string FKs)
2. Subscribe to `TagLifecycleEvent` via `onTagEvent()` to stay in sync
3. Never write to `tagDictionary` directly

## Architecture Note [S1][R3]

`logic-overview.md` [SK_OUTBOX_CONTRACT S1] [R3] T1 T2:
- `CTA --> TAG_EVENTS --> TAG_OUTBOX[SK_OUTBOX_CONTRACT: SAFE_AUTO] --> BACKGROUND_LANE --> IER`
- `IER --> BACKGROUND_LANE --> VS4_TAG_SUBSCRIBER --> SKILL_TAG_POOL` [R3]
- `CTA -.->|"唯讀引用契約"| TAG_READONLY`
- VS4_TAG_SUBSCRIBER is the explicit consumer responsible for updating `SKILL_TAG_POOL`
  from `TagLifecycleEvent` — consumption responsibility is scoped to VS4 (R3 closed loop)
- `TAG_READONLY["🔒 消費方唯讀引用規則\n所有 tagSlug 引用必須來自此處"]`

**[S1] SK_OUTBOX_CONTRACT** governs `tag-outbox`:
- at-least-once delivery via OUTBOX → RELAY → IER path
- idempotency-key = `eventId + aggId + version` (carried in EventEnvelope)
- DLQ tier: **SAFE_AUTO** — TagLifecycleEvents are idempotent, auto-retry is safe
