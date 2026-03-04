# Architecture Audit — Open / In-Progress Issues

> **Source of truth**: `docs/logic-overview.md`  
> **Auditor**: 架構合規審計官 (Architectural Compliance Auditor)  
> **Audit date**: 2026-03-04  
> **Note**: Items resolved in the same session they were filed are marked **✅ Fixed** with a commit reference.

---

## ARCH-D7-003 — D7 Regression: `_actions.ts` Three Sub-Path Shared-Kernel Imports

**ID**: #ISSUE-20260304-001  
**Rule**: D7 — Feature slices must import `shared-kernel` via public `index.ts`, not sub-directory paths  
**Severity**: Major  
**Status**: ✅ Fixed (this PR — commit `fix(D7): add centralized-tag exports to shared-kernel barrel, fix 6 D7 regression sites`)

**Problem files**:
- `src/features/semantic-graph.slice/centralized-tag/_actions.ts`

**Violating imports**:
```ts
// ❌ D7 violation — 3 sub-path imports
import {
  publishTagEvent,
  type CentralizedTagEntry,
  type TagDeleteRule,
} from '@/features/shared-kernel/centralized-tag';

import {
  buildIdempotencyKey,
  type DlqTier,
} from '@/features/shared-kernel/outbox-contract';

import type { TagCategory } from '@/features/shared-kernel/tag-authority';
```

**Root cause**:  
`CentralizedTagEntry`, `TagDeleteRule` (centralized-tag aggregate version), and `publishTagEvent` were never forwarded through the `shared-kernel/index.ts` barrel, forcing `_actions.ts` to bypass the public API. The `outbox-contract` and `tag-authority` types were already in the barrel but the import was not updated.

**Fix applied**:  
1. Added `publishTagEvent`, `CentralizedTagEntry`, and `TagDeleteRule` (centralized-tag) exports to `src/features/shared-kernel/index.ts` under a new `🏷️ Centralized Tag Aggregate` section.  
2. Removed the duplicate `TagDeleteRule` re-export from the tag-authority section (the centralized-tag version is the one actually consumed; the tag-authority version was unreferenced from the barrel).  
3. Consolidated all three sub-path imports in `_actions.ts` to a single barrel import:
```ts
// ✅ D7 compliant
import { commandSuccess, commandFailureFrom, publishTagEvent, buildIdempotencyKey } from '@/features/shared-kernel';
import type { CommandResult, CentralizedTagEntry, TagDeleteRule, TagCategory, DlqTier } from '@/features/shared-kernel';
```

---

## ARCH-D7-004 — D7 Regression: `semantic-graph.slice/index.ts` Sub-Path Re-Export

**ID**: #ISSUE-20260304-002  
**Rule**: D7 — Feature slice barrels must not re-export types via `shared-kernel` sub-directory paths  
**Severity**: Major  
**Status**: ✅ Fixed (this PR)

**Problem file**:
- `src/features/semantic-graph.slice/index.ts`

**Violating export**:
```ts
// ❌ D7 violation — sub-path re-export leaks internal shared-kernel structure
export type { CentralizedTagEntry, TagDeleteRule } from '@/features/shared-kernel/centralized-tag';
```

**Root cause**:  
`CentralizedTagEntry` and `TagDeleteRule` were re-exported from a sub-path because they were not yet in the barrel. This was introduced simultaneously with ARCH-D7-003 above.

**Fix applied**:
```ts
// ✅ D7 compliant
export type { CentralizedTagEntry, TagDeleteRule } from '@/features/shared-kernel';
```

---

## ARCH-D7-005 — D7 Regression: `notification-hub.slice/_types.ts` Sub-Path Import

**ID**: #ISSUE-20260304-003  
**Rule**: D7 — Feature slices must import `shared-kernel` via public `index.ts`  
**Severity**: Major  
**Status**: ✅ Fixed (this PR)

**Problem file**:
- `src/features/notification-hub.slice/_types.ts`

**Violating import**:
```ts
// ❌ D7 violation
import type {
  NotificationChannel,
  NotificationPriority,
} from '@/features/shared-kernel/semantic-primitives';
```

**Root cause**:  
`NotificationChannel` and `NotificationPriority` are exported from `shared-kernel/index.ts`. The `_types.ts` file was authored after the original ARCH-D7-001 fix but used the sub-path without checking the barrel.

**Fix applied**:
```ts
// ✅ D7 compliant
import type {
  NotificationChannel,
  NotificationPriority,
} from '@/features/shared-kernel';
```

---

## ARCH-D7-006 — D7 Regression: `scheduling.slice` Test Files Sub-Path Imports

**ID**: #ISSUE-20260304-004  
**Rule**: D7 — All imports of `shared-kernel` (including in tests) must use the public barrel  
**Severity**: Minor (tests only)  
**Status**: ✅ Fixed (this PR)

**Problem files**:
- `src/features/scheduling.slice/_saga.test.ts`
- `src/features/scheduling.slice/_saga.eligibility.test.ts`

**Violating imports**:
```ts
// ❌ D7 violation — _saga.test.ts
import { tierSatisfies, TIER_DEFINITIONS } from '@/features/shared-kernel/skill-tier';

// ❌ D7 violation — _saga.eligibility.test.ts
import { tierSatisfies } from '@/features/shared-kernel/skill-tier';
```

**Root cause**:  
`tierSatisfies` and `TIER_DEFINITIONS` are fully exported from `shared-kernel/index.ts`. The tests used sub-paths, which is the same regression pattern the ESLint rule blocks for production code — but was not caught in test files.

**Fix applied** (both files):
```ts
// ✅ D7 compliant
import { tierSatisfies, TIER_DEFINITIONS } from '@/features/shared-kernel';
```

---

## ARCH-D7-007 — D7 Regression: `semantic-graph.slice/_aggregate.test.ts` Sub-Path Import

**ID**: #ISSUE-20260304-005  
**Rule**: D7 — All imports of `shared-kernel` (including in tests) must use the public barrel  
**Severity**: Minor (test only)  
**Status**: ✅ Fixed (this PR)

**Problem file**:
- `src/features/semantic-graph.slice/_aggregate.test.ts`

**Violating import**:
```ts
// ❌ D7 violation
import type { TaxonomyNode } from '@/features/shared-kernel/semantic-primitives';
```

**Root cause**:  
`TaxonomyNode` is already exported from `shared-kernel/index.ts`. The test was authored without checking the barrel.

**Fix applied**:
```ts
// ✅ D7 compliant
import type { TaxonomyNode } from '@/features/shared-kernel';
```

---

---

## ARCH-D7-008 — D7 Regression: `scheduling.slice` Sub-Path Import from `projection.bus`

**ID**: #ISSUE-20260304-006  
**Rule**: D7 — Feature slices must import other feature slices via their public `index.ts`, not sub-directory paths  
**Severity**: Major  
**Status**: ✅ Fixed (this PR)

**Problem files**:
- `src/features/scheduling.slice/index.ts`
- `src/features/scheduling.slice/_projectors/demand-board.ts`

**Violating imports**:
```ts
// ❌ D7 violation — scheduling.slice/index.ts:110
} from '@/features/projection.bus/demand-board';

// ❌ D7 violation — scheduling.slice/_projectors/demand-board.ts:12
} from '@/features/projection.bus/demand-board';
```

**Root cause**:  
The six demand-board projector functions (`applyDemandProposed`, `applyDemandAssigned`, etc.) were never forwarded through the `projection.bus/index.ts` barrel, so both the deprecated compatibility shim and the slice's main barrel were forced to bypass the public API via a sub-path. The `demand-board` sub-module existed in `projection.bus/` but was not included in its `index.ts`.

**Fix applied**:  
1. Added a new `demand-board` section to `src/features/projection.bus/index.ts`, forwarding all six projector functions.  
2. Updated both files to import via the barrel:
```ts
// ✅ D7 compliant
} from '@/features/projection.bus';
```

---

## ARCH-D20-001 — D20 Violation: `workspace.slice` Re-Exports `GlobalSearch` from `global-search.slice`

**ID**: #ISSUE-20260304-007  
**Rule**: D20 — Feature slices must not cross-import from each other; one slice must not re-export symbols owned by another slice  
**Severity**: Major  
**Status**: ✅ Fixed (this PR)

**Problem files**:
- `src/features/workspace.slice/core/index.ts`
- `src/features/workspace.slice/index.ts`

**Violating code**:
```ts
// ❌ D20 violation — workspace.slice/core/index.ts:33-34
// GlobalSearch is owned by global-search.slice [D26]; re-exported here for backward compatibility
export { GlobalSearch } from '@/features/global-search.slice'

// ❌ D20 violation (transitive) — workspace.slice/index.ts:52
GlobalSearch,  // pulled via core/index.ts
```

**Root cause**:  
`GlobalSearch` is a component owned by `global-search.slice`. It was incorrectly re-exported through `workspace.slice/core/index.ts` (and transitively through `workspace.slice/index.ts`) under a "backward compatibility" comment referencing a non-existent rule [D26]. The actual consumer — `header.tsx` — already imported `GlobalSearch` directly from `@/features/global-search.slice` (the correct pattern), so the re-exports were dead code and served only to create a false D20 dependency chain.

**Fix applied**:  
1. Removed the `export { GlobalSearch } from '@/features/global-search.slice'` line and its comment from `workspace.slice/core/index.ts`.  
2. Removed `GlobalSearch` from the re-export list in `workspace.slice/index.ts`.  
3. `header.tsx` is unchanged — it already imports from the correct source (`@/features/global-search.slice`).

---

## Audit Summary — 2026-03-04 (Updated)

| Issue ID | File(s) | Rule | Severity | Status |
|---|---|---|---|---|
| #ISSUE-20260304-001 | `semantic-graph.slice/centralized-tag/_actions.ts` | D7 | Major | ✅ Fixed |
| #ISSUE-20260304-002 | `semantic-graph.slice/index.ts` | D7 | Major | ✅ Fixed |
| #ISSUE-20260304-003 | `notification-hub.slice/_types.ts` | D7 | Major | ✅ Fixed |
| #ISSUE-20260304-004 | `scheduling.slice/_saga.test.ts`, `_saga.eligibility.test.ts` | D7 | Minor | ✅ Fixed |
| #ISSUE-20260304-005 | `semantic-graph.slice/_aggregate.test.ts` | D7 | Minor | ✅ Fixed |
| #ISSUE-20260304-006 | `scheduling.slice/index.ts`, `scheduling.slice/_projectors/demand-board.ts` | D7 | Major | ✅ Fixed |
| #ISSUE-20260304-007 | `workspace.slice/core/index.ts`, `workspace.slice/index.ts` | D20 | Major | ✅ Fixed |

**Total violations found**: 8 (across 8 files, comprising 10 individual bad import/export statements)  
**All resolved in this session.**

**Preventive notes**:
- The `projection.bus/demand-board` sub-module was missing from `projection.bus/index.ts`, forcing consumers to use sub-paths. New modules added to `projection.bus/` must be immediately forwarded through its barrel.  
- The D20 `GlobalSearch` re-export was guarded by a comment referencing a non-existent rule [D26]. Cross-slice component embeds must go directly through the owning slice's barrel at the point of use; intermediate re-exports through foreign slices are always D20 violations.
