# Feature Slice: `projection.global-audit-view`

## Domain

Global audit view — cross-slice audit projection fed by `workspace-governance.audit`'s
`AUDIT_COLLECTOR` via the IER `BACKGROUND_LANE`. Every audit record carries `traceId` [R8].

This is distinct from `projection.account-audit` (which is account-scoped):
- `projection.account-audit` → account-level audit trail (account-specific events)
- `projection.global-audit-view` → workspace/org cross-slice governance audit (GLOBAL_AUDIT_VIEW)

## Responsibilities

- Receive audit events from `AUDIT_COLLECTOR` (subscribes IER `BACKGROUND_LANE`)
- Append cross-slice audit records to `globalAuditView` collection
- Each record MUST preserve `traceId` from the original EventEnvelope [R8]
- Provide read-only queries for compliance dashboards

## Invariants Enforced

| # | Invariant | Enforcement |
|---|-----------|-------------|
| R8 | Every audit record carries traceId | `applyAuditEvent` extracts `traceId` from EventEnvelope; never omits |
| #9 | Projection must be fully rebuildable from events | All writes driven by audit domain events |
| S2 | SK_VERSION_GUARD | FUNNEL enforces aggregateVersion monotonic order before writing |

## Internal Files

| File | Purpose |
|------|---------|
| `_projector.ts` | `applyAuditEvent` — append audit record to `globalAuditView` |
| `_queries.ts` | `getGlobalAuditEvents`, `getGlobalAuditEventsByWorkspace` |
| `index.ts` | Public API |

## Firestore Paths

| Path | Data |
|------|------|
| `globalAuditView/{auditEventId}` | `GlobalAuditRecord` (traceId, accountId, workspaceId?, eventType, payload, timestamp) |

## Public API (`index.ts`)

```ts
export { applyAuditEvent } from './_projector';
export { getGlobalAuditEvents, getGlobalAuditEventsByWorkspace } from './_queries';
export type { GlobalAuditRecord, GlobalAuditQuery } from './_projector';
```

## Dependencies

- `@/features/infra.observability` — TraceID type
- `@/shared/infra/firestore/` — append-only write adapters
- `@/features/shared.kernel.event-envelope` — EventEnvelope (traceId extraction)

## Architecture Note [S2][R8]

`logic-overview.md` [SK_VERSION_GUARD S2] VS8 STANDARD_PROJ_LANE:
```
IER ─► FUNNEL ─► STANDARD_PROJ_LANE ─► GLOBAL_AUDIT_VIEW
AUDIT_COLLECTOR -.→ GLOBAL_AUDIT_VIEW (跨片稽核)
```

**[R8]** Every `GlobalAuditRecord` MUST include `traceId` from the originating EventEnvelope.
This enables end-to-end trace correlation across the full command execution chain.

**[S2] SK_VERSION_GUARD**: This Projection is written via FUNNEL's STANDARD_PROJ_LANE.
FUNNEL enforces the version guard; this projector does NOT need to re-implement it.

Feed path:
```
Domain Events → workspace-governance.audit (AUDIT_COLLECTOR) 
→ IER BACKGROUND_LANE → FUNNEL → STANDARD_PROJ_LANE → GLOBAL_AUDIT_VIEW
```
