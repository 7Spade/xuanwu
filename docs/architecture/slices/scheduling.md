# VS6 · Scheduling Slice

## Domain Responsibility

The Scheduling slice manages **schedule aggregates, task assignments, and schedule saga orchestration**.
It relies on VS8 for semantic routing of assignments (matching task requirements to human skills)
and on VS4 for org eligibility. It is the primary consumer of VS8's neural routing layer.

## Main Entities

| Entity | Description |
|--------|-------------|
| `schedule` aggregate | Time-boxed plan; contains `ScheduleItem[]`. |
| `schedule-item` | One assignable unit within a schedule. |
| `assignment` | Records who is assigned to a `schedule-item`. |
| `schedule-saga` | Orchestration saga for multi-step schedule creation / modification. |
| `schedule-conflict` | Detected overlap or over-allocation for a person + time slot. |

## Assignment Routing via VS8

When an assignment is created, VS8's `VS8_NG` (Neural Computation layer) performs:
- Dijkstra/distance-matrix computation to find the nearest-qualified available person.
- `rankAffectedNodes` to surface best candidates by semantic distance.

This means VS6 must never implement its own matching logic; it delegates to VS8.

## Incoming Dependencies

| Source | What is consumed |
|--------|-----------------|
| VS4 Organization | `org-eligible-member-view` (team/partner eligibility) |
| VS8 Semantic Graph | `VS8_NG` neural routing, `rankAffectedNodes`, skill-requirement matching |
| VS5 Workspace | Workspace task data that generates scheduling demand |
| Shared Kernel [VS0] | `skill-requirement`, `SK_READ_CONSISTENCY` |

## Outgoing Dependencies

| Target | What is produced |
|--------|-----------------|
| IER | `ScheduleAssigned`, `ScheduleConflictDetected` events |
| notification-hub | Assignment notifications [D26 #A13] |
| Projection Bus [L5] | `schedule-view` read model |

## Events Emitted

| Event | DLQ Level | Description |
|-------|-----------|-------------|
| `ScheduleCreated` | SAFE_AUTO | New schedule initialised. |
| `ScheduleItemAssigned` | SAFE_AUTO | Person assigned to a schedule item. |
| `ScheduleConflictDetected` | REVIEW_REQUIRED | Overlap detected; requires human review. |
| `ScheduleSagaCompleted` | SAFE_AUTO | Saga finished successfully. |
| `ScheduleSagaFailed` | REVIEW_REQUIRED | Saga failed; human review needed. |

## Key Invariants

- **[A8]** One command touches the `schedule` aggregate only.
- **[D26 #A12]** No private search; uses global-search for schedule content indexing.
- **[D26 #A13]** Notifications dispatched via `notification-hub`.
- **[S3]** Conflict detection reads must use `STRONG_READ`.
- Circular dependency: VS6 must **not** import `projection.bus` barrel (which re-exports `_funnel` which imports VS6); import projector files directly.
