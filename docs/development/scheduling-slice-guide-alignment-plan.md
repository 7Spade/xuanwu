# Scheduling Slice Alignment Plan (VS6)

> Scope:
> - `/src/features/scheduling.slice`
> - `docs/logic-overview.md`
> - `docs/knowledge-graph.json`
> - `package.json` dependencies
>
> Note: `docs/development/scheduling-slice-guide.md` is not present in this repository revision.
> This plan is aligned to current SSOT files (`logic-overview.md` + `knowledge-graph.json`).

## 1. Current Gap Summary

1. **Mutation helper duplicated across actions/saga**
   - `_actions.ts` and `_saga.ts` each keep local `executeWriteOp` implementations.
   - This increases drift risk and weakens D3 mutation-path consistency.

2. **Selector logic embedded in UI hook**
   - `use-global-schedule.ts` contains multiple derived-state pipelines.
   - Harder to test independently and less reusable for non-hook consumers.

3. **Type boundaries are mostly correct**
   - `ScheduleItem` / `ScheduleStatus` are already sourced from `@/features/shared-kernel`.
   - No new cross-slice type duplication needed.

4. **Dependency opportunities**
   - Existing `date-fns` is suitable for deterministic time filtering/sorting in selectors.
   - `immer` / `rxjs` are not required for this minimal alignment pass.

## 2. Implemented Refactor (Minimal, Behavior-Preserving)

1. **WriteOp execution centralized**
   - Added `src/features/scheduling.slice/_write-op.ts`
   - `_actions.ts` and `_saga.ts` now reuse this helper.

2. **Selectors extracted from hook**
   - Added `src/features/scheduling.slice/_selectors.ts` with pure selectors:
     - `selectAllScheduleItems`
     - `selectPendingProposals`
     - `selectDecisionHistory`
     - `selectUpcomingEvents`
     - `selectPresentEvents`
   - `use-global-schedule.ts` now delegates derivation to selectors.

3. **Focused test coverage added**
   - Added `src/features/scheduling.slice/_selectors.test.ts`
   - Covers workspace name fallback, pending filtering, decision history window, and event time classification.

## 3. Next-Step Suggestions (Not in this patch)

1. **State modeling**
   - Consider consolidating multi-pass list filtering into a single memoized classification step if dataset size grows.

2. **Saga boundary hardening**
   - Keep write-path orchestration in actions/command layer where possible; saga should remain coordination-focused.

3. **Selector contract typing**
   - If org-member structure stabilizes, constrain selector generic member typing to a concrete member view type exported from a shared contract.

4. **Performance monitoring**
   - Add lightweight timing instrumentation around large schedule list projections in UI-heavy pages if rendering latency appears.

## 4. Dependency Fit

- **date-fns**: already used and appropriate for schedule-time logic.
- **zod**: already used in aggregate validation; maintain current use for input contracts.
- **xstate / zustand**: available, but not required for this minimal alignment and would increase migration scope.
- **immer / rxjs**: not currently installed; no need to introduce for this patch.
