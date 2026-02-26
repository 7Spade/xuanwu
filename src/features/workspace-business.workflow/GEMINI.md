# Feature Slice: `workspace-business.workflow`

## Domain

Workspace A-track workflow aggregate baseline.

This slice provides the minimal state machine boundary for:

- `tasks`
- `quality-assurance`
- `acceptance`
- `finance`

## Responsibilities

- Define workflow aggregate state shape
- Define canonical stage order
- Enforce forward-only stage transition rules

## Internal Files

| File | Purpose |
|------|---------|
| `_aggregate.ts` | Workflow aggregate state and pure transition helpers |
| `index.ts` | Public API |

## Public API (`index.ts`)

```ts
export {
  WORKFLOW_STAGE_ORDER,
  createWorkflowAggregate,
  canAdvanceWorkflowStage,
  advanceWorkflowStage,
  blockWorkflow,
  unblockWorkflow,
} from './_aggregate';
export type { WorkflowStage, WorkflowAggregateState } from './_aggregate';
```

## WORKFLOW_STATE_CONTRACT [R6]

Per `logic-overview.md` R6 — stage transitions and block rules:

```
Stage order: Draft → InProgress → QA → Acceptance → Finance → Completed

blockWorkflow:
  blockedBy: Set<issueId>  — additive; multiple issues can block simultaneously
  Command is valid in any stage except Completed

unblockWorkflow:
  Precondition: `blockedBy.isEmpty()` — ALL issues must be resolved before unblocking
  D10: Command handler MUST verify `blockedBy.isEmpty()` before executing `unblockWorkflow`
```

## Architecture Note

Aligned with `logic-overview.md` [R6] and D10:
`workspace-business.workflow.aggregate` is the single invariant boundary
for A-track stage progression.

- `advanceWorkflowStage`: validate current Stage is legal for transition (D10)
- `blockWorkflow`: uses `blockedBy.add(issueId)` — additive stacking (#A3)
- `unblockWorkflow`: guarded by `blockedBy.isEmpty()` — all Issues resolved (#A3)
