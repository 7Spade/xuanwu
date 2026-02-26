# Feature Slice: `projection.event-funnel`

## Domain

Event Funnel (`EVENT_FUNNEL_INPUT`) — the Projection Layer's **only external entry point**.

Receives events from both the Workspace Event Bus and the Organization Event Bus, then routes them to the appropriate projections.

## Responsibilities

- Subscribe to all `WORKSPACE_EVENT_BUS` events and forward to workspace projections
- Subscribe to all `ORGANIZATION_EVENT_BUS` events and forward to org/skill projections
- Update `projection.registry` (PROJECTION_VERSION) with stream offsets after each event
- Support event replay from `workspace-core.event-store` to rebuild projections

## Internal Files (Projection Slice Specialization)

| File | Purpose |
|------|---------|
| `_funnel.ts` | `registerWorkspaceFunnel`, `registerOrganizationFunnel`, `replayWorkspaceProjections` |
| `index.ts` | Public API |

## Public API (`index.ts`)

```ts
export { registerWorkspaceFunnel, registerOrganizationFunnel, replayWorkspaceProjections } from './_funnel';
```

## Dependencies

- `@/features/workspace-core.event-bus` — `WorkspaceEventBus` type
- `@/features/account-organization.event-bus` — `onOrgEvent`
- `@/features/projection.registry` — `upsertProjectionVersion`
- `@/features/projection.account-audit` — `appendAuditEntry`
- `@/features/projection.account-schedule` — `applyScheduleAssigned`
- `@/features/projection.organization-view` — `applyMemberJoined`, `applyMemberLeft`
- `@/features/projection.account-skill-view` — `applySkillXpAdded`, `applySkillXpDeducted`
- `@/features/projection.org-eligible-member-view` — `applyOrgMemberSkillXp`, `initOrgMemberEntry`, `removeOrgMemberEntry`
- `@/features/account-organization.schedule` — `handleScheduleProposed`

## Architecture Note [S2][R1][R8]

`logic-overview.md` [SK_VERSION_GUARD S2] [R1][R8]:

Event flow (v10):
```
ALL_OUTBOXES → OUTBOX_RELAY_WORKER → IER (Integration Event Router)
IER ==>|唯一 Projection 寫入路徑 #9| FUNNEL
FUNNEL → CRITICAL_PROJ_LANE + STANDARD_PROJ_LANE → projection.*
```

**[S2] SK_VERSION_GUARD** — v10 泛化 #19 (previously only eligible-view; now ALL Projections):
```
event.aggregateVersion > view.lastProcessedVersion → allow write
otherwise → discard (stale event; do NOT overwrite newer state)
```
FUNNEL enforces this rule uniformly across all Projection lanes (D14).

`event-funnel` is the Projection Layer's **only external entry point** — fed
exclusively by the `infra.event-router` (IER), not directly by event buses.

R8 TraceID propagation: FUNNEL reads `envelope.traceId` from each incoming event
and injects it into `DOMAIN_METRICS` for End-to-End command traceability.
FUNNEL must NOT overwrite `traceId` (D9).

`workspace-core.event-bus` re-exports from this slice for backwards compatibility.
