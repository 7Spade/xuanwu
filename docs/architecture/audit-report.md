# Architecture Consistency Audit Report

Date: 2026-03-07
Prompt executed: `.github/prompts/x-repomix-skill-generate-and-logic-overview-audit-v0.prompt.md`
Primary SSOT: `docs/architecture/00-LogicOverview.md`
Implementation snapshot: `skills\references\files.md`

## 1. Execution Status

Completed sequential phases from the requested prompt:

1. Environment bootstrap validated:
	 - `node -v` -> `v24.13.0`
	 - `npm -v` -> `11.6.2`
	 - `repomix --version` -> `1.12.0`
2. Repomix context generated:
	 - `skills\references\files.md` exists and is non-empty.
3. Repomix skill generated:
	 - `skills/` exists and contains generated outputs.
4. Pre-migration architecture baseline clarified:
	 - `L1 Shared Kernel` and `Shared Infrastructure Plane (L6/L7/L8/L9)` are now explicitly separated in SSOT diagram and wording.
	 - Canonical ownership paths documented for L6/L7/L9.
5. Diagram path-annotation normalization completed:
	 - Core layer/slice/authority labels and major subgraph sections now include concrete repository paths to prevent interpretation drift during migration.

## 2. High-Impact Findings

### A. Missing Modules/Folders

1. No hard missing folder found for L7 ACL boundary.
	 - Clarification: this repository's active ACL convention is `src/shared-infra/frontend-firebase/*`.
	 - Resolution: prior mention of `src/shared/infra/*` was a document-path inconsistency, not an actual codebase gap.

### B. Misplaced Elements

1. Read-side projector logic is partially implemented inside VS6 slice instead of L5 projection bus:
	 - Current: `src/features/workforce-scheduling.slice/_projectors/*`
	 - Expected: L5 ownership under `src/shared-infra/projection.bus/*`
	 - Evidence: `skills\references\files.md:391`, `skills\references\files.md:392`, `skills\references\files.md:393`
	 - Rule reference: `L5-Bus`, `P5`, `S2`, `#9`
	 - Suggested target:
		 - Move projection materialization to `src/shared-infra/projection.bus/workforce-scheduling-*`
		 - Keep VS6 focused on command/domain decisions.

2. Timeline module consolidation completed:
	 - Previous issue: standalone `timelineing.slice` naming and placement.
	 - Current status: timeline module moved under `src/features/workforce-scheduling.slice/timeline/*` and consumed via `@/features/workforce-scheduling.slice` public API.
	 - Remaining recommendation: keep overlap/grouping/read-model shaping in `projection.bus` query model.

### C. Naming Inconsistencies

1. Naming issue resolved by consolidation into `workforce-scheduling.slice/timeline`.

2. Removed false-positive naming finding for `shared-infra/frontend-firebase`.
	 - Current naming is the repository baseline and now aligned with `00-LogicOverview.md`.

### D. Boundary Violations

1. Feature slices directly depend on `@/shared-infra/frontend-firebase/*`.
	 - Evidence samples:
		 - `src/features/account.slice/gov.policy/_queries.ts` via `skills\references\files.md:10766`-`skills\references\files.md:10768`
		 - `src/features/account.slice/user.profile/_actions.ts` via `skills\references\files.md:10794`-`skills\references\files.md:10795`
		 - `src/features/organization.slice/gov.policy/_actions.ts` via `skills\references\files.md:11315`-`skills\references\files.md:11316`
		 - `src/shared-infra/projection.bus/account-audit/_projector.ts` via `skills\references\files.md:11440`-`skills\references\files.md:11443`
	 - Rule reference: `D24` + explicit FORBIDDEN clause (feature slices must not import `@/shared-infra/*` directly).
	 - Impact:
		 - Tight coupling to infrastructure implementation,
		 - weakens ACL and SK_PORTS anti-corruption boundary.

2. Potential cross-slice internal API leakage (non-index deep imports) exists and should be reduced.
	 - Evidence sample:
		 - `skills\references\files.md:2479` imports `_events` deep path.
	 - Rule reference: `D7` (cross-slice through public `index.ts` only).
	 - Note:
		 - Some examples may still be intra-slice; targeted dependency graph validation is recommended before final migration PR.

### E. Event Flow Gaps

1. Outbox status contract drift resolved.
	 - Current status: relay implementation now aligns to shared contract value `relayed`.
	 - Files aligned:
		 - `src/shared-kernel/infra-contracts/outbox-contract/index.ts`
		 - `src/shared-infra/outbox-relay/_relay.ts`
	 - Rule reference: `S1` (OUTBOX contract single source).

### F. Responsibility Violations

1. Finance semantic persistence typing resolved at repository boundary.
	 - Current status:
		 - `semanticTagSlug` is persisted as `TagSlugRef`.
		 - `costItemType` is constrained to explicit semantic literals.
		 - repository save path normalizes incoming slug strings via `tagSlugRef(...)` before persistence.
	 - File aligned:
		 - `src/shared-infra/frontend-firebase/firestore/repositories/workspace-business.finance.repository.ts`
	 - Rule reference: `D22`, `D21-2`.

## 3. Actionable Refactoring Checklist

- [x] Establish folder-placement gate and phased D24 migration checklist in `docs/architecture/99-Checklist.md`.
- [ ] Replace direct `@/shared-infra/*` imports in feature slices with SK_PORTS interfaces (`D24`).
- [ ] Move `workforce-scheduling.slice/_projectors/*` into `projection.bus` and keep VS6 command/domain focused (`L5-Bus`, `S2`, `P5`).
- [x] Normalize `timelineing.slice` naming by consolidating into `workforce-scheduling.slice/timeline`.
- [x] Unify outbox status enum with shared contract (`relayed` vs `delivered`) across relay, projectors, and monitoring (`S1`).
- [x] Replace weak semantic strings with typed semantic refs where applicable (`D22`, `D21-2`).
- [ ] Run post-migration architecture checks for `D7/D24/D26` and regression tests on gateway-command -> IER -> projection -> query flow.

## 4. Summary

The repository has strong foundational alignment with SSOT (L2/L4/L5/L6 modules, VS8 semantic engine, notification hub authority, global search authority all exist), but the main architecture debt remains boundary hardening and canonical path alignment:

1. Infrastructure boundary import discipline (`D24`),
2. Projection responsibility placement (L5 consolidation).
