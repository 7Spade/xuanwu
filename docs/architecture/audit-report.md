# Architecture Consistency Audit Report

**Generated:** 2026-03-07  
**Prompt:** `.github/prompts/x-repomix-skill-generate-and-logic-overview-audit-v0.prompt.md`  
**Primary SSOT:** `docs/architecture/00-LogicOverview.md`  
**Codebase snapshot:** `skills/references/files.md` (Repomix, 15 k+ lines)

---

## 1. Execution Status

Completed sequential phases from the requested prompt:

1. Environment bootstrap validated — `node v24.13.0`, `npm 11.6.2`, `repomix 1.12.0`
2. Repomix context generated — `skills/references/files.md` exists and is non-empty
3. `00-LogicOverview.md` (6 800+ lines) and `skills/references/files.md` cross-referenced
4. Architecture consistency audit performed across all D-rules, A-invariants, S-contracts, and VS0–VS8 slice structures
5. Actionable refactoring checklist produced

---

## 2. Executive Summary

The repository follows the six-layer DDD/Event-Sourcing architecture described in
`00-LogicOverview.md` with high overall fidelity.  Most core contracts (D12, D15,
D16, S2, S6, A1–A16) are honoured.  Outstanding issues fall into two tiers:

**Active violations (must fix):**

| ID | Rule | Location | Severity |
|----|------|----------|----------|
| V-1 | D1 | `notification-hub.slice/gov.notification-router/_router.ts` line 19 | HIGH |
| V-2 | D6 | `app/…/workspaces/[id]/locations/page.tsx` line 2 | MEDIUM |

**Structural drift (architecture ↔ implementation name/path mismatch):**

| ID | Issue | Severity |
|----|-------|----------|
| N-1 | `governance/` → `semantic-governance-portal/` | HIGH |
| N-2 | `projection.bus/` → `projection-bus/` (legacy alias) | MEDIUM |
| N-3 | `routing/workflows/workflows/` extra nesting level | LOW |
| MP-1 | `output/subscribers/` should be at slice root | HIGH |
| MP-2 | `output/outbox/` should be at slice root | HIGH |
| MP-3 | `_cost-classifier.ts` should live inside `decision/` | MEDIUM |
| M-1 | `decision/` folder missing | MEDIUM |

**Accepted technical debt (43 tracked D24 violations):** All documented in
`.github/copilot-instructions.md`; no new violations should be introduced.

---

## 3. Phase 4 — Detailed Findings

### 3.1 Naming Inconsistencies

| # | Current path | Expected path (00-LogicOverview.md) | SSOT line |
|---|-------------|-------------------------------------|-----------|
| N-1 | `src/features/semantic-graph.slice/governance/` | `src/features/semantic-graph.slice/semantic-governance-portal/` | 570 |
| N-2 | `src/shared-infra/projection.bus/` | `src/shared-infra/projection-bus/` | 38, 86 |
| N-3 | `routing/workflows/workflows/` (doubly nested) | `routing/workflows/` (single level) | 633 |

**N-1 detail — VS8 governance portal rename:**

`00-LogicOverview.md` line 570 defines the Semantic Governance Portal as:

```
src/features/semantic-graph.slice/semantic-governance-portal/
```

The codebase uses `governance/` as the parent.  The `guards/` sub-folder
(`governance/guards/invariant-guard.ts`, `staleness-monitor.ts`, `semantic-guard.ts`)
is correctly named and should become `semantic-governance-portal/guards/` after the
rename.  The four sibling sub-folders — `wiki-editor/`, `proposal-stream/`,
`consensus-engine/`, `relationship-visualizer/` — match the expected contents (lines
573–575) and require only a parent rename, not internal restructuring.

**N-2 detail — Projection Bus legacy alias:**

`00-LogicOverview.md` line 86 explicitly designates `projection.bus/` as:

> *"legacy alias only（遷移期相容；目標 src/shared-infra/projection-bus）"*

The canonical path is `projection-bus` (lines 36, 38, 76, 131, 132, 452).  All
projector files and consumers must be updated to the canonical import path after the
folder rename.

**N-3 detail — Redundant workflow nesting:**

`routing/workflows/` already contains `dispatch-bridge/`, `policy-mapper/`, and
`tag-lifecycle.workflow.ts`.  An extra nested `routing/workflows/workflows/` folder
introduces a second level not present in the architecture.  Files inside the nested
folder must be lifted one level and the empty `workflows/workflows/` removed.

---

### 3.2 Missing Elements

| # | Rule | Missing artifact | Expected location | SSOT ref |
|---|------|-----------------|-------------------|----------|
| M-1 | D21/VS8_RL | `decision/` folder | `src/features/semantic-graph.slice/decision/` | L649, L667 |

**M-1 detail — VS8 Output Layer `decision/` sub-domain:**

`00-LogicOverview.md` line 649 enumerates the VS8 Output Layer as four sibling
sub-domains at the VS8 slice root:

```
{projections, subscribers, outbox, decision}
```

The `decision/` folder is absent.  `_cost-classifier.ts` (pure function, `[D8][D27]`)
currently sits at the VS8 slice root and is semantically the only file that belongs
inside `decision/`.  Creating the folder and moving the file is the complete fix
(see MP-3 below).

---

### 3.3 Misplaced Elements

| # | Current location | Expected location | SSOT ref |
|---|-----------------|-------------------|----------|
| MP-1 | `semantic-graph.slice/output/subscribers/` | `semantic-graph.slice/subscribers/` | L661 |
| MP-2 | `semantic-graph.slice/output/outbox/` | `semantic-graph.slice/outbox/` | L661 |
| MP-3 | `semantic-graph.slice/_cost-classifier.ts` | `semantic-graph.slice/decision/_cost-classifier.ts` | L669 |

**MP-1 & MP-2 detail:**

`00-LogicOverview.md` line 649 lists the four VS8 Output Layer sub-domains as
siblings at the slice root.  The codebase groups `subscribers/` and `outbox/`
under an extra `output/` wrapper not described in the architecture.  Recommended
fix: lift both folders to the VS8 slice root alongside the existing `projections/`
sub-domain, then remove the now-empty `output/` parent.

**MP-3 detail:**

`_cost-classifier.ts` is the sole file of the `decision-policy` sub-domain (VS8_RL,
line 667).  Moving it to `decision/_cost-classifier.ts` requires no logic change —
only a file move and an import-path update in its sole consumer:
`workspace.slice/business.document-parser/`.

---

### 3.4 Boundary Violations

#### V-1 — D1: Slice must not directly import `infra.event-router`

| Property | Value |
|----------|-------|
| File | `src/features/notification-hub.slice/gov.notification-router/_router.ts` |
| Line | 19 |
| Import | `import { registerSubscriber } from '@/shared-infra/event-router';` |
| Rule | D1 — *"events only via infra.outbox-relay; slice禁止直import infra.event-router"* |
| Status | Active — marked `@deprecated`, awaiting D26 migration |
| Severity | **HIGH** |

**Fix:** Replace the `registerSubscriber` call with an outbox-relay write
(`@/shared-infra/outbox-relay`) so the IER registers the subscriber from the infra
layer, not from within the slice.  Remove the `@deprecated` marker once the
migration is complete.

---

#### V-2 — D6: `'use client'` forbidden in page/layout Server Components

| Property | Value |
|----------|-------|
| File | `src/app/(shell)/(portal)/(account)/(workspaces)/workspaces/[id]/locations/page.tsx` |
| Line | 2 |
| Directive | `'use client';` |
| Rule | D6 — *"'use client'只在_components/或_hooks/葉節點; layout/page server禁用"* |
| Status | Active |
| Severity | **MEDIUM** |

The page uses `useRouter()` and `useWorkspace()` — both hooks require a client
context.  This causes the entire route segment to opt out of SSR.

**Fix:** Extract hook-driven logic into a leaf-node client component, e.g.
`workspaces/[id]/locations/_components/locations-panel-client.tsx`.  Convert
`page.tsx` back to a Server Component (remove `'use client'`).

---

#### D24 — 43 tracked direct-Firebase import violations (accepted technical debt)

**Rule:** D24 — *"Feature slices MUST NOT import firebase/* directly; all SDK calls
must go through FIREBASE_ACL adapters."*

These violations are fully catalogued in `.github/copilot-instructions.md` (D24
section) and are designated migration targets — not regressions introduced by recent
work.  **No new code should add to this list.**

| Slice | Active D24 files |
|-------|-----------------|
| `workforce-scheduling.slice` | 9 |
| `workspace.slice` | 10 |
| `organization.slice` | 5 |
| `skill-xp.slice` | 3 |
| `account.slice` | 4 |
| `notification-hub.slice` | 2 |
| `identity.slice` | 1 |
| `shared-infra/projection.bus` | 9 |
| **Total** | **43** |

Migration priority order (highest DLQ risk first):
`workforce-scheduling.slice` (REVIEW_REQUIRED events) → `organization.slice` →
`notification-hub.slice` → `workspace.slice` → `skill-xp.slice` → others.

---

### 3.5 Event Flow Gaps

No critical event-flow gaps found.  All three core pipeline stages exist:

```
outbox-relay → event-router → projection-bus
```

Specific checks:

| Check | Status |
|-------|--------|
| CRITICAL / STANDARD / BACKGROUND IER lanes | ✅ Defined in `shared-infra/event-router/` |
| DLQ tiers (SAFE_AUTO / REVIEW_REQUIRED / SECURITY_BLOCK) | ✅ Declared per D13 across all Outbox contracts |
| SK_VERSION_GUARD referenced in projectors | ✅ D14, S2 honoured |
| `aggregateVersion` monotonic invariant #19 | ✅ Enforced in projectors |
| Outbox status enum uses `relayed` (not `delivered`) | ✅ Aligned with `outbox-contract/index.ts` |

**One observation (not a violation):** projector files inside `projection.bus/`
contain direct firebase imports (D24 technical debt); these are already in the
tracked migration scope.

---

### 3.6 Responsibility Violations

| Rule | File(s) | Status |
|------|---------|--------|
| D1 | `notification-hub.slice/gov.notification-router/_router.ts` | Active — see V-1 above |
| D6 | `workspaces/[id]/locations/page.tsx` | Active — see V-2 above |
| D26 | all feature slices | ✅ Compliant — all notification side-effects route through `notification-hub.slice` |
| D21 | all non-VS8 slices | ✅ Compliant — no slice declares tag categories or performs tag mutations outside VS8 |
| D8 | `shared-kernel/` | ✅ Compliant — pure functions and types only, zero async/I/O |
| D9 | `workspace.slice` | ✅ Compliant — TX Runner is sole cross-aggregate coordinator |

**False-positive note — `pushNotification` in `workspace.slice`:**
The method name sounds like FCM but is a local React UI toast dispatch via context.
It does NOT call FCM and does NOT violate D26.

---

## 4. Actionable Refactoring Checklist

### Critical — active rule violations

- [ ] **[V-1 / D1]** Remove direct `event-router` import from
  `notification-hub.slice/gov.notification-router/_router.ts`.  Route subscriber
  registration through `outbox-relay` per the D26 migration plan.

- [ ] **[V-2 / D6]** Extract `useRouter()` + `useWorkspace()` from
  `workspaces/[id]/locations/page.tsx` into a leaf-node client component.
  Remove `'use client'` from the page and restore it as a Server Component.

### High — structural drift

- [ ] **[N-1 / VS8]** Rename `src/features/semantic-graph.slice/governance/`
  → `src/features/semantic-graph.slice/semantic-governance-portal/`.  Update all
  import paths referencing `governance/` within the slice and its `index.ts`.

- [ ] **[MP-1 / MP-2 / VS8]** Lift `output/subscribers/` and `output/outbox/` to
  the VS8 slice root.  Remove the now-empty `output/` wrapper.  Update all
  import paths.

- [ ] **[M-1 + MP-3 / D27]** Create `src/features/semantic-graph.slice/decision/`.
  Move `_cost-classifier.ts` into it.  Update the single consumer import in
  `workspace.slice/business.document-parser/`.

### Medium — technical debt

- [ ] **[N-2 / L5]** Rename `src/shared-infra/projection.bus/` →
  `src/shared-infra/projection-bus/` per the migration target in line 86.  Update
  all internal imports and external consumers.

- [ ] **[N-3 / VS8]** Collapse `routing/workflows/workflows/` — move its files
  one level up into `routing/workflows/`.

- [ ] **[D24-MIGRATION]** Migrate 43 tracked direct Firebase imports to the
  `IFirestoreRepo` Port pattern via `SK_PORTS`.  Deliver as one PR per slice.
  Do NOT introduce new D24 imports.

### Verify after each migration

- [ ] Run `npm run lint` — expect 0 errors (D24 warning baseline ~1 390)
- [ ] Run `npm run typecheck` — expect 0 errors in `src/` (Firebase Functions
  sub-package errors are unrelated)
- [ ] Run post-migration checks for D7, D24, D26 and the full
  gateway-command → IER → projection → query flow

---

## 5. Confirmed Compliant Items

| Rule | Evidence |
|------|---------|
| D5 | `src/app/` contains no direct `firebase/*` or `shared-infra/firestore` imports |
| D8 | `shared-kernel/` — pure functions, type definitions, constants only; zero async/I/O |
| D9 | TX Runner (`workspace.slice/application/_transaction-runner.ts`) is the sole cross-aggregate coordinator |
| D10 | `traceId` injected only at CBG Entry; read-only everywhere downstream |
| D12 | `getTier(xp)` imported from `@/shared-kernel` everywhere; no Tier field persisted |
| D15 | Finance reads use `STRONG_READ` (`finance-aggregate-query-gateway.ts`, `finance-strong-read.ts`) |
| D16 | All staleness SLA values reference `SK_STALENESS_CONTRACT.StalenessMs.*`; no hardcoded literals |
| D21 | Tag creation/mutation contained in `semantic-graph.slice`; other slices reference tag slugs read-only |
| D26 | All notification side-effects route through `notification-hub.slice`; no direct FCM/email calls in feature slices |
| D27 | `shouldMaterializeAsTask()` gate in `_cost-classifier.ts` honoured by VS5 Layer-3 router |
| S2 | `SK_VERSION_GUARD` referenced in projectors; `aggregateVersion` monotonically increasing enforced |
| S6 | `SK_TOKEN_REFRESH_CONTRACT` fulfilled — Party 1 (`_claims-handler.ts`) and Party 3 (`_token-refresh-listener.ts`) both present |
| A1 | Wallet uses `STRONG_READ`; profile/notification use eventual consistency |
| A12 | Global Search exit is `global-search.slice`; consumers import through slice index |
| A13 | Notification side-effects centralised in `notification-hub.slice` |
| #12 | Tier never stored in DB; always derived via `getTier(xp)` pure function |
| #13 | XP mutations write `account-skill-xp-ledger`; invariant enforced in `skill-xp.slice/_aggregate.ts` |
| #19 | All Projection upserts enforce `event.aggVersion > view.lastVersion` before applying |
