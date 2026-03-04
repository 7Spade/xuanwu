# Architecture Audit Archive — Resolved Issues

> **Purpose**: Permanent record of architectural issues that have been confirmed fixed and removed from `docs/issues.md`.  
> **Source of truth**: `docs/logic-overview.md`  
> **Note**: Fix references below point to the nearest available git history. Full commit SHAs are unavailable for pre-PR-52 entries because the branch was squash-merged and grafted.

---

## ARCH-D5-001 — `workspace-provider.tsx` Direct Firestore Import (D5)

**Rule**: D5 — `src/app/` 與 UI 元件禁止 import `src/shared/infra/firestore`  
**Severity at filing**: Major  
**Fixed**: 2026-03 (merged in PR #52 pre-history)  
**Fix reference**: `src/features/workspace.slice/gov.audit/_actions.ts` (writeAuditLog introduced as the sanctioned write path); `workspace-provider.tsx` migrated to call `_actions.ts` instead

**Original Violation**:  
`src/features/workspace.slice/core/_components/workspace-provider.tsx` imported and called `@/shared/infra/firestore/firestore.write.adapter` directly inside a UI component, bypassing `_actions.ts`. This was the first D5 violation discovered and fixed, establishing the pattern referenced in later issues (ARCH-D3-003: "the already-applied ARCH-D5-001 pattern").

**Resolution**:  
`writeAuditLog` was introduced in `gov.audit/_actions.ts` and exported through the slice barrel. `workspace-provider.tsx` replaced its direct Firestore calls with calls to `writeAuditLog`. All `@/shared/infra/firestore` imports were removed from the component.

---

## ARCH-D7-001 — Shared-Kernel Sub-Path Imports (57 files)

**Rule**: D7 — Feature slices must import `shared-kernel` modules via their public `index.ts`, not via sub-directory paths  
**Severity at filing**: Major (systematic)  
**Fixed**: 2026-03 (merged in PR #52 pre-history)  
**Fix reference**: Commit `fix(D7): align all shared-kernel imports to public index + enforce via ESLint`; ESLint rule added to `eslint.config.mts`

**Original Violation**:  
57+ files across `scheduling.slice`, `workspace.slice`, `projection.bus`, `account.slice`, and `skill-xp.slice` imported directly from `@/features/shared-kernel/{sub-module}` sub-directories instead of the public `@/features/shared-kernel` barrel. This bypassed encapsulation and made the internal structure of shared-kernel a leaking implementation detail.

**Example violation**:
```ts
// Before (sub-path — D7 violation)
import { TIER_DEFINITIONS } from '@/features/shared-kernel/skill-tier';
import { CommandResult } from '@/features/shared-kernel/command-result-contract';

// After (public barrel — D7 compliant)
import { TIER_DEFINITIONS, CommandResult } from '@/features/shared-kernel';
```

**Resolution**:  
All 57 import sites were rewritten to reference `@/features/shared-kernel` (the public barrel `index.ts`). An ESLint rule was added to `eslint.config.mts` to enforce this going forward and prevent regressions.

---

## ARCH-D7-002 — `projection.bus/_funnel.ts` Sub-Path Import

**Rule**: D7 — Feature slices must import `shared-kernel` via public `index.ts`  
**Severity at filing**: Major  
**Fixed**: 2026-03 (merged in PR #52 pre-history)  
**Fix reference**: Commit `fix(arch): fix D7 violation in _funnel.ts, fix VS8→L5 label, consolidate skill-tier imports`

**Original Violation**:  
`src/features/projection.bus/_funnel.ts` imported `skill-tier` via a sub-directory path (`@/features/shared-kernel/skill-tier`) instead of the public `@/features/shared-kernel` barrel, violating D7. Additionally, the diagram label for the semantic-graph slice incorrectly showed `VS8` instead of `L5`.

**Resolution**:  
Import in `_funnel.ts` was updated to use the public `@/features/shared-kernel` barrel. Diagram labels were corrected in `logic-overview.md`.

---

## ARCH-D24-001 — Direct `firebase/firestore` Imports in Feature Slices (43 files)

**Rule**: D24 — Feature slices must not import `firebase/*` directly; all SDK calls must go through `FIREBASE_ACL` adapters at `src/shared/infra/{auth,firestore,messaging,storage}/`  
**Severity at filing**: Critical (systematic)  
**Fixed**: 2026-03 (merged in PR #52 pre-history)  
**Fix reference**: Commit `fix(D24): eliminate all direct firebase/firestore imports from feature slices`

**Original Violation**:  
43 files across `account.slice`, `identity.slice`, `notification-hub.slice`, `organization.slice`, `projection.bus`, `scheduling.slice`, `skill-xp.slice`, and `workspace.slice` imported directly from `firebase/firestore` (e.g., `import { doc, collection, onSnapshot } from 'firebase/firestore'`). This bypassed the ACL adapter layer that provides testability, mocking, and platform isolation.

**Resolution**:  
All 43 direct Firebase SDK import sites were migrated to use the `@/shared/infra/firestore/firestore.read.adapter` and `@/shared/infra/firestore/firestore.write.adapter` ACL adapters. An architecture compliance test in `src/features/workspace.slice/business.parsing-intent/architecture-compliance.test.ts` validates that no direct `firebase/firestore` imports remain.

---

## ARCH-D24-002 — `FirestoreTimestamp` Defined in `shared/types` Instead of `shared-kernel`

**Rule**: D24 — Firebase SDK types must not leak into feature boundaries via `shared/types`; D19 — cross-BC types belong in `shared-kernel`  
**Severity at filing**: Major  
**Fixed**: 2026-03 (merged in PR #52 pre-history)  
**Fix reference**: Commit `fix(D24): move FirestoreTimestamp to shared-kernel ports, remove firebase/* from shared/types`

**Original Violation**:  
`FirestoreTimestamp` was defined in `src/shared/types/` (re-exported from the Firebase SDK), making the Firebase SDK a transitive dependency of every feature slice that needed timestamp types. This violated both D24 (no SDK leakage) and D19 (cross-BC types should live in `shared-kernel`).

**Resolution**:  
`FirestoreTimestamp` was moved to `src/features/shared-kernel/infrastructure-ports/` and exported from the public `@/features/shared-kernel` barrel. All feature files that previously imported `FirestoreTimestamp` from `@/shared/types` were updated to use `@/features/shared-kernel`.

---

## ARCH-D24-003 — Last 3 `firebase/Timestamp` Type Imports

**Rule**: D24 — No direct Firebase SDK imports in feature slices  
**Severity at filing**: Major  
**Fixed**: 2026-03 (merged in PR #52 pre-history)  
**Fix reference**: Commit `fix(D8/D24): fix dead ESLint guard, remove last 3 firebase Timestamp type-imports, add D24 warn rule`

**Original Violation**:  
After the ARCH-D24-001 sweep, 3 residual `import type { Timestamp } from 'firebase/firestore'` statements remained in feature files. Additionally, the ESLint guard for D24 had a dead-code path that never triggered.

**Affected files**:
```
src/features/scheduling.slice/_components/schedule-proposal-content.tsx
src/features/scheduling.slice/_components/unified-calendar-grid.tsx
src/features/workspace.slice/core/_hooks/use-workspace-event-handler.tsx
```

**Resolution**:  
The 3 residual `firebase/Timestamp` type imports were replaced with `FirestoreTimestamp` from `@/features/shared-kernel`. The ESLint guard was corrected. A D24 `warn` rule was added to the ESLint config to catch future regressions.

---

## ARCH-D2-001 — Duplicate `shared.kernel.*` Flat Directories

**Rule**: D2 — Feature slices are self-contained; no duplicate module hierarchies; canonical shared-kernel location is `src/features/shared-kernel/`  
**Severity at filing**: Major (structural confusion)  
**Fixed**: 2026-03 (merged in PR #52 pre-history)  
**Fix reference**: Commit `feat: eliminate shared.kernel.* duplicate dirs — rewrite all imports to @/features/shared-kernel, delete flat dirs and old centralized-tag`

**Original Violation**:  
The repository contained both:
- `src/features/shared-kernel/` — the intended canonical location
- Flat `shared.kernel.*` directories (e.g., `src/features/shared.kernel.skill-tier/`, `src/features/shared.kernel.command-result/`) that duplicated the same modules

This created ambiguity about which path was authoritative, caused D7 and D20 violations, and made the shared-kernel surface area difficult to audit.

**Resolution**:  
All flat `shared.kernel.*` directories were deleted. All import sites previously referencing the flat directories were migrated to `@/features/shared-kernel`. The old `centralized-tag` flat module was similarly removed; its content was consolidated into `src/features/shared-kernel/centralized-tag/`.

---

## TYPE-D20-001 — Import Priority Order: `shared/types` Used Over Available `shared-kernel` Equivalent

**Rule**: D20 — 匯入優先序：`shared.kernel.*` > feature slice `index.ts` > `shared/types`  
**Severity at filing**: Major (systematic)  
**Fixed**: 2026-03 (merged in PR #52 pre-history)  
**Fix reference**: Part of the D7-001 and D2-001 fix wave; imports realigned to `@/features/shared-kernel` barrel

**Original Violation**:  
Multiple feature files imported `SkillTier`, `TierDefinition`, and `SkillRequirement` from `@/shared/types/skill.types` even though `@/features/shared-kernel/skill-tier` (later `@/features/shared-kernel`) was the D20-preferred source. The D20 rule mandates that `shared.kernel.*` imports take precedence over `shared/types` imports.

**Affected pattern** (pre-fix):
```ts
// D20 violation — using lower-priority shared/types when shared-kernel was available
import type { SkillTier } from '@/shared/types/skill.types';
```

**Post-fix** (D20 compliant):
```ts
import type { SkillTier } from '@/features/shared-kernel';
```

**Resolution**:  
All feature-slice import sites for `SkillTier`, `TierDefinition`, and `SkillRequirement` were updated to source from `@/features/shared-kernel` as part of the D7-001 and D2-001 sweep. The D20 ordering is now enforced via the D7 ESLint rule.

**Note**: The underlying type ownership inversion (`SkillTier` defined in `shared/types` and re-exported from `shared-kernel`) remains as TYPE-D19-001 in the open issues tracker. That issue is distinct from this D20 import-priority violation.

---

## Archive — 2026 March (Session 2026-03-04)

The following issues were filed and resolved in the same audit session (2026-03-04) and are migrated here from `docs/management/issues.md`.

---

### ARCH-D7-003 — D7 Regression: `_actions.ts` Three Sub-Path Shared-Kernel Imports

**ID**: #ISSUE-20260304-001  
**Rule**: D7 — Feature slices must import `shared-kernel` via public `index.ts`, not sub-directory paths  
**Severity**: Major  
**Fixed**: 2026-03-04 (this PR — commit `fix(D7): add centralized-tag exports to shared-kernel barrel, fix 6 D7 regression sites`)

**Problem file**: `src/features/semantic-graph.slice/centralized-tag/_actions.ts`

**Resolution**: Added `publishTagEvent`, `CentralizedTagEntry`, and `TagDeleteRule` to the `shared-kernel/index.ts` barrel; consolidated three sub-path imports into a single barrel import.

---

### ARCH-D7-004 — D7 Regression: `semantic-graph.slice/index.ts` Sub-Path Re-Export

**ID**: #ISSUE-20260304-002  
**Rule**: D7 — Feature slice barrels must not re-export types via `shared-kernel` sub-directory paths  
**Severity**: Major  
**Fixed**: 2026-03-04 (this PR)

**Problem file**: `src/features/semantic-graph.slice/index.ts`

**Resolution**: Changed `export type { CentralizedTagEntry, TagDeleteRule } from '@/features/shared-kernel/centralized-tag'` to `from '@/features/shared-kernel'`.

---

### ARCH-D7-005 — D7 Regression: `notification-hub.slice/_types.ts` Sub-Path Import

**ID**: #ISSUE-20260304-003  
**Rule**: D7 — Feature slices must import `shared-kernel` via public `index.ts`  
**Severity**: Major  
**Fixed**: 2026-03-04 (this PR)

**Problem file**: `src/features/notification-hub.slice/_types.ts`

**Resolution**: Updated `NotificationChannel` and `NotificationPriority` imports to use the public `@/features/shared-kernel` barrel.

---

### ARCH-D7-006 — D7 Regression: `scheduling.slice` Test Files Sub-Path Imports

**ID**: #ISSUE-20260304-004  
**Rule**: D7 — All imports of `shared-kernel` (including in tests) must use the public barrel  
**Severity**: Minor (tests only)  
**Fixed**: 2026-03-04 (this PR)

**Problem files**: `scheduling.slice/_saga.test.ts`, `scheduling.slice/_saga.eligibility.test.ts`

**Resolution**: Replaced `@/features/shared-kernel/skill-tier` sub-path imports with `@/features/shared-kernel` barrel in both test files.

---

### ARCH-D7-007 — D7 Regression: `semantic-graph.slice/_aggregate.test.ts` Sub-Path Import

**ID**: #ISSUE-20260304-005  
**Rule**: D7 — All imports of `shared-kernel` (including in tests) must use the public barrel  
**Severity**: Minor (test only)  
**Fixed**: 2026-03-04 (this PR)

**Problem file**: `src/features/semantic-graph.slice/_aggregate.test.ts`

**Resolution**: Changed `import type { TaxonomyNode } from '@/features/shared-kernel/semantic-primitives'` to `from '@/features/shared-kernel'`.

---

### ARCH-D7-008 — D7 Regression: `scheduling.slice` Sub-Path Import from `projection.bus`

**ID**: #ISSUE-20260304-006  
**Rule**: D7 — Feature slices must import other feature slices via their public `index.ts`  
**Severity**: Major  
**Fixed**: 2026-03-04 (this PR)

**Problem files**: `scheduling.slice/index.ts`, `scheduling.slice/_projectors/demand-board.ts`

**Resolution**: Added demand-board projector functions to `projection.bus/index.ts` barrel; updated both files to import via the public barrel.

---

### ARCH-D20-001 — D20 Violation: `workspace.slice` Re-Exports `GlobalSearch` from `global-search.slice`

**ID**: #ISSUE-20260304-007  
**Rule**: D20 — Feature slices must not cross-import from each other  
**Severity**: Major  
**Fixed**: 2026-03-04 (this PR)

**Problem files**: `workspace.slice/core/index.ts`, `workspace.slice/index.ts`

**Resolution**: Removed the `export { GlobalSearch }` re-export and its backward-compatibility comment from both barrel files. The direct consumer (`header.tsx`) already imported from the correct source.

---

_Archive last updated: 2026-03-04 — 15 entries (8 pre-PR-52 + 7 from 2026-03-04 session)_

---

### DOC-PARSER-D14-001 — Write Idempotency Failure in `saveParsingIntent` [D14/D15]

**ID**: #ISSUE-20260304-008
**Rule**: D14/D15 — Version-protected writes must be idempotent; duplicate document creation must be prevented.
**Severity**: Critical
**Fixed**: 2026-03-04 (this PR — commit `fix(D14/D15): add sourceFileId idempotency guard to saveParsingIntent`)

**Problem file**: `src/features/workspace.slice/business.document-parser/_intent-actions.ts`

**Root cause**: `saveParsingIntent` called `createParsingIntentFacade` (backed by `addDocument`) unconditionally on every invocation. Re-uploading the same document or a network-retry re-call would create a second distinct `ParsingIntent`, triggering independent task-materialisation import runs and causing **task duplication**.

**Resolution**:
1. Added `getParsingIntentBySourceFileId` to `workspace-business.document-parser.repository.ts`.
2. `saveParsingIntent` now queries for an existing non-superseded intent when `options.sourceFileId` is provided.
3. Same `semanticHash` → immediate no-op return.
4. Different `semanticHash` → auto-supersede old intent before creating new one.
Full details preserved in the pre-archive `issues.md` entry above.

---

### BUG-冪等性失效 — Document Parser Duplicate Import Causes Task Doubling [D14/D15]

**ID**: #BUG-20260304-001
**Rule**: D14/D15 — TOCTOU race in `importItems()` allowed both async guards to be bypassed under concurrency.
**Severity**: Critical
**Fixed**: 2026-03-04 (this PR)

**Problem file**: `src/features/workspace.slice/core/_hooks/use-workspace-event-handler.tsx`

**Root cause**: Both the `hasTasksForSourceIntent` check and the `startParsingImport` idempotency check were async. Two concurrent calls to `importItems()` (double-click, React StrictMode double-invoke, or duplicate event delivery) both passed the async read check before either committed any writes — a classic TOCTOU race.

**Resolution**: Added a **synchronous in-memory lock** (`inProgressImports: useRef<Set<string>>`) acquired before any `await`. The lock is released in `.finally()`. The pre-existing async guards remain as a defence-in-depth second layer for cross-session duplicates.
Full details preserved in the pre-archive `issues.md` entry above.

---

_Archive last updated: 2026-03-04 — 17 entries (8 pre-PR-52 + 7 from 2026-03-04 session + 2 archived this PR)_
