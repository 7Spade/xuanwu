# Architecture Consistency Audit Report

Date: 2026-03-07
Prompt executed: `.github/prompts/x-repomix-skill-generate-and-logic-overview-audit-v0.prompt.md`
Primary SSOT: `docs/architecture/00-LogicOverview.md`
Implementation snapshot: `docs/ai/repomix-output.context.md`

## 1. Execution Status

Completed sequential phases from the requested prompt:

1. Environment bootstrap validated:
	 - `node -v` -> `v24.13.0`
	 - `npm -v` -> `11.6.2`
	 - `repomix --version` -> `1.12.0`
2. Repomix context generated:
	 - `docs/ai/repomix-output.context.md` exists and is non-empty.
3. Repomix skill generated:
	 - `skills/` exists and contains generated outputs.

## 2. High-Impact Findings

### A. Missing Modules/Folders (expected by SSOT, not present as canonical layout)

1. Missing canonical L7 path family:
	 - Expected by SSOT: `src/shared/infra/{auth,firestore,messaging,storage}/`
	 - Evidence in snapshot points to legacy layout instead: `src/shared-infra/frontend-firebase/...`
	 - Rule reference: Layering section + `D24`, `D25` in `00-LogicOverview.md`
	 - Suggested target:
		 - Create `src/shared/infra/auth/`
		 - Create `src/shared/infra/firestore/`
		 - Create `src/shared/infra/messaging/`
		 - Create `src/shared/infra/storage/`
		 - Migrate adapters from `src/shared-infra/frontend-firebase/` to those modules.

### B. Misplaced Elements

1. Read-side projector logic is partially implemented inside VS6 slice instead of L5 projection bus:
	 - Current: `src/features/workforce-scheduling.slice/_projectors/*`
	 - Expected: L5 ownership under `src/features/projection.bus/*`
	 - Evidence: `docs/ai/repomix-output.context.md:391`, `docs/ai/repomix-output.context.md:392`, `docs/ai/repomix-output.context.md:393`
	 - Rule reference: `L5-Bus`, `P5`, `S2`, `#9`
	 - Suggested target:
		 - Move projection materialization to `src/features/projection.bus/workforce-scheduling-*`
		 - Keep VS6 focused on command/domain decisions.

2. Timeline read behavior split into separate slice likely outside L5 read model boundary:
	 - Current: `src/features/timelineing.slice/*`
	 - Evidence: `docs/ai/repomix-output.context.md:347` to `docs/ai/repomix-output.context.md:358`
	 - Rule reference: `Timeline` invariant and L5 read-side requirement in `00-LogicOverview.md`
	 - Suggested target:
		 - Keep timeline rendering in UI/components,
		 - Move overlap/grouping/read-model shaping to `projection.bus` query model.

### C. Naming Inconsistencies

1. `timelineing.slice` -> expected `timeline.slice` (or absorbed into `workforce-scheduling.slice` read side)
	 - Evidence: `docs/ai/repomix-output.context.md:347`
	 - Rule reference: naming clarity and SSOT folder naming consistency.

2. `shared-infra/frontend-firebase` -> expected canonical `shared/infra/*` ACL boundary naming
	 - Evidence: repeated imports, e.g. `docs/ai/repomix-output.context.md:8305`, `docs/ai/repomix-output.context.md:10602`
	 - Rule reference: `D24`, `D25`.

### D. Boundary Violations

1. Feature slices directly depend on `@/shared-infra/frontend-firebase/*`.
	 - Evidence samples:
		 - `src/features/account.slice/gov.policy/_queries.ts` via `docs/ai/repomix-output.context.md:10766`-`docs/ai/repomix-output.context.md:10768`
		 - `src/features/account.slice/user.profile/_actions.ts` via `docs/ai/repomix-output.context.md:10794`-`docs/ai/repomix-output.context.md:10795`
		 - `src/features/organization.slice/gov.policy/_actions.ts` via `docs/ai/repomix-output.context.md:11315`-`docs/ai/repomix-output.context.md:11316`
		 - `src/features/projection.bus/account-audit/_projector.ts` via `docs/ai/repomix-output.context.md:11440`-`docs/ai/repomix-output.context.md:11443`
	 - Rule reference: `D24` + explicit FORBIDDEN clause (feature slices must not import `@/shared-infra/*` directly).
	 - Impact:
		 - Tight coupling to infrastructure implementation,
		 - weakens ACL and SK_PORTS anti-corruption boundary.

2. Potential cross-slice internal API leakage (non-index deep imports) exists and should be reduced.
	 - Evidence sample:
		 - `docs/ai/repomix-output.context.md:2479` imports `_events` deep path.
	 - Rule reference: `D7` (cross-slice through public `index.ts` only).
	 - Note:
		 - Some examples may still be intra-slice; targeted dependency graph validation is recommended before final migration PR.

### E. Event Flow Gaps

1. Outbox status contract drift between shared contract and relay implementation.
	 - Shared contract: `OutboxStatus = 'pending' | 'relayed' | 'dlq'`
		 - Evidence: `docs/ai/repomix-output.context.md:3283`
	 - Relay implementation: `OutboxStatus = 'pending' | 'delivered' | 'dlq'`
		 - Evidence: `docs/ai/repomix-output.context.md:11007`
	 - Rule reference: `S1` (OUTBOX contract single source), consistency invariants.
	 - Impact:
		 - Status mismatch risks relay/read-model confusion and monitoring inconsistency.

### F. Responsibility Violations

1. Semantic tag persistence still uses weak string typing in infrastructure DTOs.
	 - Evidence:
		 - `semanticTagSlug: string` and `costItemType: string`
		 - `src/shared-infra/frontend-firebase/firestore/repositories/workspace-business.finance.repository.ts`
		 - Snapshot lines: `docs/ai/repomix-output.context.md:7491`-`docs/ai/repomix-output.context.md:7492`
	 - Rule reference: `D22` (strong typed tag reference), `D21-2`.
	 - Impact:
		 - Increased semantic drift risk and weaker compile-time safety.

## 3. Actionable Refactoring Checklist

- [ ] Introduce canonical `src/shared/infra/*` ACL folders and migrate `shared-infra/frontend-firebase/*` adapters.
- [ ] Replace direct `@/shared-infra/*` imports in feature slices with SK_PORTS interfaces (`D24`).
- [ ] Move `workforce-scheduling.slice/_projectors/*` into `projection.bus` and keep VS6 command/domain focused (`L5-Bus`, `S2`, `P5`).
- [ ] Normalize `timelineing.slice` naming and align timeline overlap/grouping to L5 read-side processing.
- [ ] Unify outbox status enum with shared contract (`relayed` vs `delivered`) across relay, projectors, and monitoring (`S1`).
- [ ] Replace weak semantic strings with typed semantic refs where applicable (`D22`, `D21-2`).
- [ ] Run post-migration architecture checks for `D7/D24/D26` and regression tests on gateway-command -> IER -> projection -> query flow.

## 4. Summary

The repository has strong foundational alignment with SSOT (L2/L4/L5/L6 modules, VS8 semantic engine, notification hub authority, global search authority all exist), but the main architecture debt remains boundary hardening and canonical path alignment:

1. Infrastructure boundary naming and import discipline (`shared-infra` -> `shared/infra`, `D24`),
2. Projection responsibility placement (L5 consolidation),
3. Contract consistency (outbox status enum),
4. Strong typed semantic references (`D22`).
