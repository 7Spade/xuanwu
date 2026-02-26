# Features Layer (`src/features/`)

## Role

Vertical feature slices. Each slice is the **single source of truth** for its business domain —
it owns types, server actions, queries, hooks, and UI components.

> **Architecture reference:** `docs/logic-overview.md` (唯一事實來源)
> v9 → v10 change: six new VS0 infrastructure behavior contracts (S1~S6) added to shared.kernel.

## The Golden Rule

> An AI assistant implementing any feature reads **only one folder**.

## Slice Index

### VS0 · Shared Kernel + Tag Authority Center

| Slice | Domain | Status |
|-------|--------|--------|
| `shared-kernel/` | Cross-BC domain contracts: EventEnvelope [R8], AuthoritySnapshot, SkillTier, SkillRequirement, CommandResult [R4] | ✅ |
| `centralized-tag/` | Tag Authority Center — global tagSlug dictionary; sole authority (Invariant #17, A6) | ✅ |
| `shared.kernel.event-envelope/` | Boundary stub — re-exports EventEnvelope from shared-kernel [R8] | 🔧 |
| `shared.kernel.tag-authority/` | Boundary stub — re-exports from centralized-tag [R3] | 🔧 |
| `shared.kernel.contract-interfaces/` | Boundary stub — re-exports CommandResult [R4] | 🔧 |
| `shared.kernel.constants/` | Canonical cross-slice constants: WorkflowStatus, ErrorCodes | 🔧 |
| `shared.kernel.outbox-contract/` | SK_OUTBOX_CONTRACT [S1] — at-least-once + idempotency-key + DLQ tier | ✅ |
| `shared.kernel.version-guard/` | SK_VERSION_GUARD [S2] — monotonic version protection for all Projection writes | ✅ |
| `shared.kernel.read-consistency/` | SK_READ_CONSISTENCY [S3] — STRONG_READ vs EVENTUAL_READ routing | ✅ |
| `shared.kernel.staleness-contract/` | SK_STALENESS_CONTRACT [S4] — TAG/CRITICAL/STANDARD staleness SLA constants | ✅ |
| `shared.kernel.resilience-contract/` | SK_RESILIENCE_CONTRACT [S5] — rate-limit + circuit-break + bulkhead for entry points | ✅ |
| `shared.kernel.token-refresh-contract/` | SK_TOKEN_REFRESH_CONTRACT [S6] — Claims refresh three-way handshake (VS1 ↔ IER ↔ frontend) | ✅ |

### Infra Building Blocks (GW layer)

| Slice | Domain | Status |
|-------|--------|--------|
| `infra.outbox-relay/` | [R1] OUTBOX_RELAY_WORKER — CDC polling → IER delivery; retry + DLQ | ✅ |
| `infra.dlq-manager/` | [R5] DLQ 三級策略: SAFE_AUTO / REVIEW_REQUIRED / SECURITY_BLOCK | ✅ |
| `infra.observability/` | [VS9] trace-identifier [R8], domain-metrics, domain-error-log | ✅ |
| `infra.event-router/` | [IER] Integration Event Router — CRITICAL/STANDARD/BACKGROUND lanes [R2] | 🔧 |
| `infra.gateway-command/` | [GW] Command Gateway — auth guard, rate limit, command entry | 🔧 |
| `infra.gateway-query/` | [GW] Query Gateway — read model registry, projection routing | 🔧 |

### VS6 · Scheduling Saga

| Slice | Domain | Status |
|-------|--------|--------|
| `scheduling-core.saga/` | [VS6] Cross-org scheduling saga coordinator · compensating events [A5][R7] | 🔧 |

### VS1 · Identity Layer

| Slice | Domain | Status |
|-------|--------|--------|
| `identity-account.auth/` | Login, register, reset password · Token Refresh Handshake [R2] | ✅ |

### VS2 · Account Layer — Shared & Governance

| Slice | Domain | Status |
|-------|--------|--------|
| `account/` | Multi-account provider · AccountGrid · stats (cross-org management UI) | ✅ |
| `account-governance.role/` | Account role management → CUSTOM_CLAIMS signing [E6] | 🆕 |
| `account-governance.policy/` | Account policy management | 🆕 |
| `account-governance.notification-router/` | Notification router (FCM Layer 2 — by TargetAccountID) [E3][R8] | 🆕 |

### VS2 · Account Layer — User Sub-type

| Slice | Domain | Status |
|-------|--------|--------|
| `account-user.profile/` | User profile, preferences, FCM token (weak consistency) | ✅ |
| `account-user.wallet/` | User personal wallet · CRITICAL_LANE [Q8][R2] · DLQ REVIEW_REQUIRED [R5] | 🔧 |
| `account-user.notification/` | Personal push notification (FCM Layer 3) · traceId metadata [R8] | 🆕 |
| `account-user.skill/` | Personal skill XP growth · Ledger · Tier derivation (Invariants #11-13) [E1] | ✅ |

### VS4 · Account Layer — Organization Sub-type

| Slice | Domain | Status |
|-------|--------|--------|
| `account-organization.core/` | Organization aggregate entity + binding [A2] | 🆕 |
| `account-organization.event-bus/` | Organization event bus (pure Producer-only [P2]) | 🆕 |
| `account-organization.member/` | Org-level member invite/remove (stub) | 🔧 |
| `account-organization.team/` | Team management (internal group view) | 🆕 |
| `account-organization.partner/` | Partner management (external group view) | 🆕 |
| `account-organization.policy/` | Organization policy management | 🆕 |
| `account-organization.skill-tag/` | Skill tag pool · VS4_TAG_SUBSCRIBER updates from TagLifecycleEvent [R3] | 🆕 |
| `account-organization.schedule/` | HR scheduling · ScheduleAssigned + aggregateVersion [R7] · DLQ REVIEW_REQUIRED [R5] | 🆕 |

### VS5 · Workspace Application Layer

| Slice | Domain | Status |
|-------|--------|--------|
| `workspace-application/` | Command handler · Scope Guard · Policy Engine · Transaction Runner · Outbox · CommandResult [R4] | 🆕 |

### VS5 · Workspace Core

| Slice | Domain | Status |
|-------|--------|--------|
| `workspace-core/` | Workspace CRUD, shell, provider, list | ✅ |
| `workspace-core.event-bus/` | Intra-workspace event bus (in-process only [E5]) | ✅ |
| `workspace-core.event-store/` | Event store (replay/audit only #9) | 🆕 |

### VS5 · Workspace Governance

| Slice | Domain | Status |
|-------|--------|--------|
| `workspace-governance.members/` | Workspace member access & roles | ✅ |
| `workspace-governance.role/` | Role management (split from members) · inherits org-governance.policy #18 | 🆕 |
| `workspace-governance.teams/` | Stub — team views migrated to `account-organization.team` | 🔧 |
| `workspace-governance.partners/` | Stub — partner views migrated to `account-organization.partner` | 🔧 |
| `workspace-governance.schedule/` | Stub — implementation migrated to `workspace-business.schedule` | 🔧 |
| `workspace-governance.audit/` | Audit trail · audit-event-collector [Q5] → global-audit-view [R8] | ✅ |

### VS5 · Workspace Business — Support & Static Units

| Slice | Domain | Status |
|-------|--------|--------|
| `workspace-business.daily/` | Daily logs, comments, bookmarks | ✅ |
| `workspace-business.schedule/` | Schedule items, proposals, decisions · tagSlug T4 · TAG_STALE_GUARD [Q6] | ✅ |
| `workspace-business.files/` | File upload, management | ✅ |
| `workspace-business.document-parser/` | AI document parsing · ParsingIntent (Digital Twin #A4) | ✅ |
| `workspace-business.workflow/` | A-track state machine · WORKFLOW_STATE_CONTRACT [R6] · blockedBy Set [A3] | ✅ |
| `workspace-business.parsing-intent/` | ParsingIntent versions, SourcePointer, IntentDelta proposals [A4] | ✅ |

### VS5 · Workspace Business — A-Track (Main Flow)

| Slice | Domain | Status |
|-------|--------|--------|
| `workspace-business.tasks/` | Task tree, CRUD (A-track start) | ✅ |
| `workspace-business.quality-assurance/` | Quality assurance (A-track) | ✅ |
| `workspace-business.acceptance/` | Acceptance view (A-track) | ✅ |
| `workspace-business.finance/` | Finance processing (A-track end) | ✅ |

### VS5 · Workspace Business — B-Track (Exception Center)

| Slice | Domain | Status |
|-------|--------|--------|
| `workspace-business.issues/` | Issue tracking · IssueResolved → blockedBy.delete(issueId) [R6][A3] | ✅ |

### VS8 · Projection Layer

| Slice | Domain | Status |
|-------|--------|--------|
| `projection.event-funnel/` | Event Funnel — fed by IER [R1][R8] · traceId injection to DOMAIN_METRICS | ✅ |
| `projection.workspace-view/` | Workspace read model (workspace projection view) | ✅ |
| `projection.workspace-scope-guard/` | Scope Guard dedicated read model [A9] | ✅ |
| `projection.account-view/` | Account read model · authority snapshot contract | ✅ |
| `projection.account-audit/` | Account audit projection | ✅ |
| `projection.account-schedule/` | Account schedule projection (filter available accounts) | ✅ |
| `projection.organization-view/` | Organization read model | ✅ |
| `projection.account-skill-view/` | Account skill read model (accountId / skillId / xp · tier derived, not stored #12) | ✅ |
| `projection.org-eligible-member-view/` | Schedule eligibility · ELIGIBLE_UPDATE_GUARD [R7][S2] · Invariant #14 #19 | ✅ |
| `projection.tag-snapshot/` | Tag read model · [SK_STALENESS_CONTRACT S4] TAG_MAX_STALENESS ≤ 30s [Q6] · consumers must not write (T5) | ✅ |
| `projection.global-audit-view/` | Global cross-slice audit projection · traceId preserved [R8] · GLOBAL_AUDIT_VIEW VS8 | ✅ |
| `projection.registry/` | Event stream offset · read model version table | ✅ |

> **Status legend:** ✅ implemented · 🔧 partial stub (structure created, implementation deferred) · 🆕 new in v6+

## Standard Slice Layout

```
features/{name}/
├── GEMINI.md        ← AI instructions (required)
├── _actions.ts      ← "use server" mutations (optional)
├── _queries.ts      ← Firestore reads / onSnapshot (optional)
├── _types.ts        ← Feature-specific type extensions (optional)
├── _hooks/          ← React hooks (optional)
├── _components/     ← UI components (optional)
└── index.ts         ← Public API (required)
```

## Import Rules

```ts
// ✅ Allowed: shared infrastructure
import type { ScheduleItem } from "@/shared/types";
import { canTransitionScheduleStatus } from "@/shared/lib";
import { scheduleRepository } from "@/shared/infra";
import { Button } from "@/shared/ui/shadcn-ui/button";

// ✅ Allowed: other slices via public API only
import { AccountScheduleSection } from "@/features/workspace-business.schedule";
//                                  ↑ root only, never subpath

// ❌ Forbidden: other slice private paths
import { useWorkspaceSchedule } from "@/features/workspace-business.schedule/_hooks/use-workspace-schedule";
```

## Who Depends on This Layer?

`src/app/` (route files) — imports only from `features/*/index.ts`.
