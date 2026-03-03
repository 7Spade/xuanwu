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

_Archive last updated: 2026-03-02 — 8 entries_
