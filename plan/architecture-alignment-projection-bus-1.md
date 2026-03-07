---
goal: Align codebase with docs/architecture/00-LogicOverview.md — rename projection.bus → projection-bus and fix all consumer imports
version: 1.0
date_created: 2026-03-07
last_updated: 2026-03-07
owner: Architecture / Platform
status: 'Completed'
tags: [architecture, migration, refactor, infra]
---

# Introduction

![Status: Completed](https://img.shields.io/badge/status-Completed-brightgreen)

This plan captures the gap analysis between the running codebase and the canonical
architecture document (`docs/architecture/00-LogicOverview.md`) and records the
surgical changes made to close those gaps.

The primary gap was a **directory-name mismatch**: the architecture doc consistently
refers to the projection bus infra-slice as `projection-bus` (kebab-case), while the
actual directory was named `projection.bus` (dot-notation).  This caused:

1. A failing SSOT compliance test (`PROJECTION_BUS_ROOT` resolved to a nonexistent
   path `src/features/projection.bus`).
2. ~17 consumer import paths (`@/shared-infra/projection.bus`) that deviated from the
   kebab-case `@/shared-infra/projection-bus` standard required by the architecture doc.
3. Dozens of internal comments, mermaid node labels, and module headers that used the
   dot-notation name, creating documentation drift.

---

## 1. Requirements & Constraints

- **REQ-001**: All `src/shared-infra/` directories must use kebab-case naming
  (consistent with `gateway-query`, `frontend-firebase`, `backend-firebase`, etc.).
- **REQ-002**: `PROJECTION_BUS_ROOT` in the compliance test must resolve to the actual
  directory on disk.
- **REQ-003**: Every `@/shared-infra/projection.bus` import alias must become
  `@/shared-infra/projection-bus`.
- **REQ-004**: Internal comments, JSDoc module headers, mermaid diagrams, and string
  labels inside the slice must use the canonical `projection-bus/` prefix.
- **CON-001**: Zero new TypeScript errors — `npm run typecheck` must stay at the same
  baseline (67 errors, all in `firebase/functions/`, unrelated to this change).
- **CON-002**: Zero ESLint errors — `npm run lint` must produce 0 errors (warnings are
  acceptable if they existed before this change).
- **CON-003**: The compliance test
  `src/shared-infra/projection-bus/architecture-ssot-compliance.test.ts` must pass.
- **GUD-001**: Follow the governance rules documented in
  `docs/architecture/00-LogicOverview.md` (D1–D31, R101–R106, invariants #1–#19).
- **PAT-001**: `shared-infra/` uses kebab-case for all sub-directory names — align
  with this existing convention.

---

## 2. Implementation Steps

### Implementation Phase 1 — Rename directory and fix compliance test

- **GOAL-001**: Rename `src/shared-infra/projection.bus/` to
  `src/shared-infra/projection-bus/` and repair the compliance test root path.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-001 | `git mv src/shared-infra/projection.bus src/shared-infra/projection-bus` | ✅ | 2026-03-07 |
| TASK-002 | In `architecture-ssot-compliance.test.ts`, change `PROJECTION_BUS_ROOT` from `path.join(FEATURES_ROOT, 'projection.bus')` to `path.join(SHARED_INFRA_ROOT, 'projection-bus')` | ✅ | 2026-03-07 |
| TASK-003 | Run `npx vitest run .../architecture-ssot-compliance.test.ts` — confirm 2/2 pass | ✅ | 2026-03-07 |

### Implementation Phase 2 — Update all consumer import paths

- **GOAL-002**: Replace every `@/shared-infra/projection.bus` import alias with
  `@/shared-infra/projection-bus` in all feature slices that consume the bus.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-004 | `src/features/workforce-scheduling.slice/_aggregate.ts` — update import | ✅ | 2026-03-07 |
| TASK-005 | `src/features/workforce-scheduling.slice/_queries.ts` — update import | ✅ | 2026-03-07 |
| TASK-006 | `src/features/workforce-scheduling.slice/_saga.ts` — update import | ✅ | 2026-03-07 |
| TASK-007 | `src/features/workforce-scheduling.slice/_eligibility.ts` — update import | ✅ | 2026-03-07 |
| TASK-008 | `src/features/workforce-scheduling.slice/_hooks/use-schedule-commands.ts` — update import | ✅ | 2026-03-07 |
| TASK-009 | `src/features/workforce-scheduling.slice/_components/org-schedule-governance.tsx` — update imports | ✅ | 2026-03-07 |
| TASK-010 | `src/features/workforce-scheduling.slice/_components/org-schedule-governance.shared.tsx` — update imports | ✅ | 2026-03-07 |
| TASK-011 | `src/features/workforce-scheduling.slice/index.ts` — update import | ✅ | 2026-03-07 |
| TASK-012 | `src/features/organization.slice/gov.members/_components/members-view.tsx` — update import | ✅ | 2026-03-07 |
| TASK-013 | `src/features/semantic-graph.slice/output/projections/tag-snapshot.slice.ts` — update import | ✅ | 2026-03-07 |
| TASK-014 | `src/features/workspace.slice/application/_org-policy-cache.ts` — update import | ✅ | 2026-03-07 |
| TASK-015 | `src/features/workspace.slice/application/_scope-guard.ts` — update import | ✅ | 2026-03-07 |
| TASK-016 | `src/features/workspace.slice/core.event-bus/_event-funnel.ts` — update import | ✅ | 2026-03-07 |
| TASK-017 | `src/features/notification-hub.slice/_services.ts` — update import | ✅ | 2026-03-07 |
| TASK-018 | `src/features/notification-hub.slice/_types.ts` — update import | ✅ | 2026-03-07 |
| TASK-019 | `src/features/notification-hub.slice/index.ts` — update import | ✅ | 2026-03-07 |
| TASK-020 | `src/features/workforce-scheduling.slice/_saga.test.ts` — update import | ✅ | 2026-03-07 |

### Implementation Phase 3 — Fix internal comments and string labels

- **GOAL-003**: Replace all `projection.` (dot-notation) occurrences inside the
  `src/shared-infra/projection-bus/` module itself: JSDoc headers, mermaid node labels,
  registration string labels, and inline comments.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-021 | Top-level `index.ts` module header: `projection.bus` → `projection-bus` | ✅ | 2026-03-07 |
| TASK-022 | `_event-funnel.ts` module header | ✅ | 2026-03-07 |
| TASK-023 | `_query-registration.ts` string label arguments (restore opening `'` stripped by sed) | ✅ | 2026-03-07 |
| TASK-024 | Per-sub-module `index.ts` and `_projector.ts` mermaid node labels and headers | ✅ | 2026-03-07 |
| TASK-025 | `global-audit-view/index.ts` inline comment line 1 | ✅ | 2026-03-07 |
| TASK-026 | Run `npm run check` — confirm 0 errors | ✅ | 2026-03-07 |

---

## 3. Alternatives

- **ALT-001**: Keep the `projection.bus` dot-notation name and update the architecture
  doc instead — rejected because the doc is the SSOT and all other `shared-infra/`
  sub-directories already use kebab-case.
- **ALT-002**: Create a TypeScript path alias `@/shared-infra/projection.bus` as a
  forwarding shim — rejected because it would maintain the naming inconsistency and
  add complexity with no benefit.

---

## 4. Dependencies

- **DEP-001**: `docs/architecture/00-LogicOverview.md` — canonical SSOT for all naming
  and layering decisions (L5 Projection Bus section, ~lines 780–850).
- **DEP-002**: `src/shared-infra/projection-bus/architecture-ssot-compliance.test.ts` —
  the automated guard that verifies the directory structure matches the SSOT.
- **DEP-003**: `tsconfig.json` `paths` entry `@/shared-infra/*` — resolved automatically
  after directory rename; no tsconfig change needed.

---

## 5. Files

| ID | File | Change |
|----|------|--------|
| FILE-001 | `src/shared-infra/projection-bus/` (entire dir) | Renamed from `projection.bus` |
| FILE-002 | `src/shared-infra/projection-bus/architecture-ssot-compliance.test.ts` | Fixed `PROJECTION_BUS_ROOT` |
| FILE-003 | `src/shared-infra/projection-bus/_query-registration.ts` | Fixed stripped `'` from string literals |
| FILE-004 | `src/shared-infra/projection-bus/index.ts` + sub-module headers | Updated dot-notation comments |
| FILE-005–021 | 17 consumer files in `src/features/` | Updated import alias |

---

## 6. Testing

- **TEST-001**: `src/shared-infra/projection-bus/architecture-ssot-compliance.test.ts`
  — 2 tests, both pass (`✓ directory structure` and `✓ index exports`).
- **TEST-002**: `npm run check` — 0 errors, 21 pre-existing import-order warnings
  (unrelated to this change).

---

## 7. Risks & Assumptions

- **RISK-001**: Any future code generation tool that hardcodes `projection.bus` will
  produce broken imports — mitigated by the compliance test.
- **ASSUMPTION-001**: The 21 import-order lint warnings are pre-existing and tracked
  separately (D24 migration backlog); they are not introduced by this change.
- **ASSUMPTION-002**: `firebase/functions/` 67 TypeScript errors are a separate
  sub-package and are not in scope for this alignment.

---

## 8. Related Specifications / Further Reading

- [docs/architecture/00-LogicOverview.md](../docs/architecture/00-LogicOverview.md) — L5 Projection Bus (lines 780–850)
- [src/shared-infra/README.md](../src/shared-infra/README.md) — shared-infra directory conventions
- [src/shared-infra/projection-bus/architecture-ssot-compliance.test.ts](../src/shared-infra/projection-bus/architecture-ssot-compliance.test.ts) — automated SSOT guard
