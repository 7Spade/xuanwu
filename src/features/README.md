# src/features — Business Feature Layer

## Architecture Role

`src/features` is the **core domain layer** of the system. It owns all domain aggregates, use-cases, Server Actions, event buses, and outbox contracts. Every vertical slice is **autonomous** — slices may not reach into each other's internals; cross-slice communication happens exclusively through typed integration events routed via the Integration Event Router (IER).

```
L0 External Triggers
  └─> L1 Command Boundary Gateway (CBG)
        └─> L2 Domain Slices  ← THIS LAYER (src/features)
              ├── account.slice
              ├── identity.slice
              ├── organization.slice
              ├── workspace.slice
              ├── scheduling.slice
              ├── skill-xp.slice
              ├── notification-hub.slice
              ├── semantic-graph.slice
              ├── global-search.slice
              ├── projection.bus
              ├── infra.*          (shared infra runners)
              └── shared-kernel    (cross-cutting contracts only)
```

---

## Feature Slices

| Slice directory | Domain abbreviation | Responsibility |
|-----------------|--------------------|-|
| `account.slice` | VS2 | User account, wallet, governance policy |
| `identity.slice` | VS1 | Authentication, active context, token refresh |
| `organization.slice` | VS3 | Org membership, roles, partner management |
| `workspace.slice` | VS5 | Workspace tasks, workflow, document parsing |
| `scheduling.slice` | VS6 | Schedule proposals, assignment sagas |
| `skill-xp.slice` | VS7 | Skill XP tracking, tag-lifecycle |
| `notification-hub.slice` | VS8 | Push notification routing, FCM |
| `semantic-graph.slice` | VS9 | Semantic tag graph, indexed search backend |
| `global-search.slice` | — | Cross-slice semantic search (Cmd+K) [D26] |
| `projection.bus` | — | Event projections → read-model views [L5] |
| `infra.event-router` | — | Integration Event Router (IER) [L4] |
| `infra.gateway-command` | — | Command Boundary Gateway (CBG) [L1] |
| `infra.gateway-query` | — | Query Gateway [L6] |
| `infra.outbox-relay` | — | Outbox relay worker [R1] |
| `infra.dlq-manager` | — | Dead-Letter Queue manager [R5] |
| `infra.external-triggers` | — | Webhook / Cloud Scheduler ingestion |
| `observability` | — | Metrics, error log, trace sinks [L9] |
| `shared-kernel` | SK | Cross-cutting contracts (ports, envelopes, primitives) |

---

## Slice Autonomy Rules

Each feature slice is a **self-contained vertical unit**. The following rules enforce autonomy [D7]:

### ✅ Allowed Within a Slice

- Importing from the slice's own `_*` private files (actions, queries, hooks, components, events).
- Importing from `src/shared` (utilities, UI components, types).
- Importing from `src/config`.
- Importing from `src/features/shared-kernel` (contracts, ports, envelopes).
- Importing via the slice's `index.ts` public API.

### ❌ Forbidden Cross-Slice Imports

```
// ❌ account.slice must NOT reach into workspace.slice internals
import { _workflowReducer } from '@/features/workspace.slice/business.workflow/_reducer'

// ✅ Correct: consume workspace.slice's public API
import { WorkspacePublicAPI } from '@/features/workspace.slice'
```

### ❌ Forbidden Direct Firebase Access

All Firebase SDK calls **must** go through `SK_PORTS` adapters in `src/shared/infra/` [D24]. Feature slices must never import from `firebase/*` directly — this is enforced by ESLint rule `D24`.

> **Current tracked D24 violations** (43 files — active migration targets, not new regressions): see `docs/logic-overview.md` for the full list.

---

## Intra-Slice Directory Convention

Each slice follows this private directory layout:

```
{slice}/
├── index.ts                    # Public API — only export here [D7]
├── _task.rules.ts              # Slice-specific ESLint rule overrides (workspace.slice only)
├── core/                       # Context, aggregate root, use-cases, event handler
│   ├── _use-cases.ts
│   ├── _hooks/
│   ├── _components/            # Slice-owned UI components (not shared)
│   └── _actions.ts
├── business.{domain}/          # Sub-domain modules within the slice
│   ├── _actions.ts             # Server Actions / command handlers
│   ├── _queries.ts             # Read queries
│   ├── _contract.ts            # Public sub-domain contract types
│   ├── _components/            # React components (client boundary)
│   └── _hooks/                 # React hooks
├── core.event-bus/             # Intra-slice event definitions [#10]
│   └── _events.ts
├── core.event-store/           # Domain event store (write model)
├── gov.{domain}/               # Governance sub-domains (members, roles, etc.)
└── infra.outbox/               # Outbox contract & writer
```

---

## Cross-Slice Communication

Slices communicate **only** via the Integration Event Router (IER) lane system [L4]:

| Lane | SLA | Example events |
|------|-----|---------------|
| `CRITICAL_LANE` | As soon as possible | `RoleChanged`, `WalletDeducted`, `OrgContextProvisioned` |
| `STANDARD_LANE` | < 2 s | `SkillXpAdded`, `ScheduleAssigned`, `MemberJoined` |
| `BACKGROUND_LANE` | < 30 s | `TagLifecycleEvent`, `AuditEvents` |

**Invariant [#10]:** Intra-slice events use the in-process event bus. Inter-slice events go through the Outbox → IER pipeline.

---

## Shared-Kernel Contracts

`src/features/shared-kernel` contains **cross-cutting primitives** that all slices depend on. It is not a feature slice — it has no commands or domain logic. It exposes:

| Export | Purpose |
|--------|---------|
| `SK_PORTS` | Infrastructure port interfaces (`IAuthService`, `IFirestoreRepo`, …) |
| `SK_INFRA` | Infrastructure contracts (staleness SLA, version guard) [S2 S4] |
| `event-envelope` | Canonical event envelope shape with `traceId` [R8] |
| `command-result-contract` | `CommandResult<T>` type |
| `outbox-contract` | Outbox DLQ classification levels |
| `resilience-contract` | Circuit breaker / rate-limiter shape |

---

## Dependency Rules

| Direction | Rule |
|-----------|------|
| ✅ Allowed | `src/features/{slice}` → `src/shared` |
| ✅ Allowed | `src/features/{slice}` → `src/config` |
| ✅ Allowed | `src/features/{slice}` → `src/features/shared-kernel` |
| ✅ Allowed | `src/features/{slice}` → other slice's `index.ts` public API |
| ❌ Forbidden | Direct private file imports across slices |
| ❌ Forbidden | Any feature slice importing from `firebase/*` directly [D24] |
| ❌ Forbidden | `src/features` imported by `src/shared`, `src/config`, or `src/shared-infra` |

---

## Compliance Check

| Rule | Status | Notes |
|------|--------|-------|
| Slices export only via `index.ts` | ✅ | Enforced by ESLint `[D7]` |
| No direct `firebase/*` imports in new code | ✅ | 43 legacy violations tracked, no new regressions |
| Cross-slice communication via IER lanes | ✅ | Outbox → Relay → IER pipeline |
| `shared-kernel` contains no business logic | ✅ | Contracts and port interfaces only |
| Workspace slice emits `workspace:workflow:blocked/unblocked` | ✅ | Via `useWorkspaceEventHandler` |
| ParsingIntent is proposal-only (no direct task mutation) | ✅ | `[#A3 #A4]` — see `workspace.slice-guide.md` |
