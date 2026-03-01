# Project Structure

> **SSOT**: `docs/logic-overview.md` (rules D1–D23) · `docs/domain-glossary.md` (domain terms)
> Canonical directory layout. Dependency rules enforced by D1–D23.

---

## Top-Level Directory Tree

```
/
├── src/
│   ├── app/                     # Next.js App Router composition only
│   ├── features/                # Vertical slice business domain code
│   └── shared/                  # Cross-cutting infrastructure utilities
├── functions/                   # Firebase Functions (outbox-relay, dlq-manager)
├── docs/                        # Architecture documentation
├── public/                      # Static assets
├── firestore.rules              # Firestore security rules
├── firestore.indexes.json       # Firestore index definitions
├── storage.rules                # Firebase Storage rules
├── firebase.json                # Firebase project config
├── apphosting.yaml              # Firebase App Hosting config
├── next.config.ts               # Next.js configuration
├── tailwind.config.ts           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration (strict mode)
└── eslint.config.mts            # ESLint flat config
```

---

## VS0 Shared Kernel — `src/features/shared.kernel.*`

All 12 shared kernel slices. These contain ONLY contracts and pure functions — no I/O, no side effects (D8).

```
src/features/
├── shared.kernel.event-envelope/         # SK_ENV: EventEnvelope type + idempotency-key format
│   └── index.ts
├── shared.kernel.authority-snapshot/     # SK_AUTH_SNAP: AuthoritySnapshot + TTL contract
│   └── index.ts
├── shared.kernel.skill-tier/             # SK_SKILL_TIER: getTier(xp)→SkillTier pure function (#12)
│   └── index.ts
├── shared.kernel.contract-interfaces/    # [R4] SK_CMD_RESULT: CommandSuccess/CommandFailure union
│   ├── command-result-contract.ts
│   └── index.ts
├── shared.kernel.constants/              # Cross-slice status enums (WorkflowStatus) + error codes
│   └── index.ts
├── shared.kernel.tag-authority/          # Tag read-only reference rules (T1–T5)
│   └── index.ts
├── shared.kernel.outbox-contract/        # [S1] SK_OUTBOX_CONTRACT: at-least-once + idempotency + DLQ
│   └── index.ts
├── shared.kernel.version-guard/          # [S2] SK_VERSION_GUARD: aggregateVersion monotonic check
│   └── index.ts
├── shared.kernel.read-consistency/       # [S3] SK_READ_CONSISTENCY: STRONG_READ vs EVENTUAL_READ
│   └── index.ts
├── shared.kernel.staleness-contract/     # [S4] SK_STALENESS_CONTRACT: SLA constants single source
│   └── index.ts
├── shared.kernel.resilience-contract/    # [S5] SK_RESILIENCE_CONTRACT: rate-limit+CB+bulkhead spec
│   └── index.ts
└── shared.kernel.token-refresh-contract/ # [S6] SK_TOKEN_REFRESH_CONTRACT: claims refresh handshake
    └── index.ts
```

> `SkillRequirement` (cross-BC staffing contract) is exported from `shared.kernel.skill-tier` as part of the `SK_SKILL_REQ` contract — feature slices **must** import it from `@/features/shared.kernel.skill-tier`, not from `@/shared/types` (D19, D20).

### Type Ownership Matrix (Authoritative)

| Location | Owns what | Not allowed |
| --- | --- | --- |
| `src/features/shared.kernel.*` | Cross-BC contracts and pure cross-slice domain functions (VS0 SK contracts) | Infra I/O, feature-specific persistence/read-model shapes |
| `src/features/{slice}` | Slice-owned aggregate/event/projection/persistence/view types | Exporting private slice internals across slices |
| `src/shared/types` | Legacy/common app DTOs used by multiple layers when no VS0/slice owner exists | New cross-BC domain contracts (use `shared.kernel.*` instead) |

**Import precedence rule**:
1. If a type is defined/exported in `shared.kernel.*`, import from `@/features/shared.kernel.*`.
2. If type is slice-owned, import from that slice `index.ts` public API.
3. Use `src/shared/types/*` only when neither of the above applies (legacy/common DTO use).

---

## VS1 — Identity Slice

```
src/features/
├── identity-account.auth/
│   ├── _aggregate.ts            # authenticated-identity, account-identity-link
│   ├── _actions.ts              # login, logout, register Server Actions
│   ├── _queries.ts              # identity link queries
│   ├── _components/             # Login/Register UI components ("use client")
│   └── index.ts                 # Public API
```

Context lifecycle is managed inside `identity-account.auth` via the `_claims-handler.ts` module. Claims refresh [S6] is triggered by the `TOKEN_REFRESH_SIGNAL` emitted from `_actions.ts`.

---

## VS2 — Account Slice

```
src/features/
├── account-user.profile/
│   ├── _aggregate.ts            # user-account aggregate + FCM token (weakly consistent)
│   ├── _actions.ts
│   ├── _queries.ts
│   ├── _hooks/
│   ├── _components/
│   └── index.ts
├── account-user.notification/
│   ├── _actions.ts              # FCM token registration
│   ├── _hooks/
│   ├── _components/
│   └── index.ts
├── account-organization.member/
│   ├── _aggregate.ts            # organization-account + binding (ACL #A2)
│   ├── _actions.ts
│   ├── _queries.ts
│   ├── _hooks/
│   ├── _components/
│   └── index.ts
├── account-organization.partner/
│   ├── _hooks/
│   ├── _components/
│   └── index.ts
├── account-organization.policy/
│   ├── _aggregate.ts            # account-governance.policy
│   ├── _hooks/
│   └── index.ts
├── account-governance.notification-router/
│   └── index.ts                 # Stateless notification router (#A10)
└── account-user.wallet/         # Strong-consistency financial ledger [SK_READ_CONSISTENCY: STRONG_READ] (#A1)
    ├── _actions.ts
    ├── _queries.ts
    └── index.ts
```

---

## VS3 — Skill XP Slice

```
src/features/
└── account-skill/               # account-skill aggregate + xp-ledger
    ├── _aggregate.ts            # accountId / skillId(→tagSlug) / xp / version
    ├── _actions.ts              # AddXp, DeductXp Server Actions
    ├── _queries.ts
    └── index.ts
```

---

## VS4 — Organization Slice

```
src/features/
├── account-organization.core/   # organization-core aggregate + event-bus
│   ├── _aggregate.ts
│   ├── _actions.ts
│   ├── _queries.ts
│   └── index.ts
├── account-organization.event-bus/  # Org in-process event bus [E5]
│   └── index.ts
├── account-organization.member/  # (see VS2 — shared membership model)
├── account-organization.partner/ # (see VS2)
├── account-organization.team/
│   └── index.ts
├── account-organization.policy/  # (see VS2)
├── organization-skill-recognition/
│   └── index.ts                 # SKILL_TAG_POOL + VS4_TAG_SUBSCRIBER [T1, T2]
└── account-organization.schedule/ # HR scheduling (VS6 coordination)
    ├── _hooks/
    ├── _components/
    └── index.ts
```

---

## VS5 — Workspace Slice

```
src/features/
├── workspace-core/
│   ├── _aggregate.ts            # workspace-core.aggregate
│   ├── _actions.ts
│   ├── _queries.ts
│   ├── _hooks/
│   ├── _components/
│   ├── _shell/                  # Shell layout components
│   └── index.ts
├── workspace-core.event-bus/    # in-process event bus [E5]
│   └── index.ts
├── workspace-core.event-store/  # replay/audit only (#9)
│   └── index.ts
├── workspace-application/       # Application coordinator: cmd-handler, scope-guard, policy-engine, tx-runner
│   └── index.ts
├── workspace-governance.role/
│   ├── _hooks/
│   └── index.ts
├── workspace-governance.audit/
│   ├── _hooks/
│   ├── _components/
│   └── index.ts
├── workspace-governance.audit-convergence/  # Audit bridge: query adapter for projection.account-audit
│   └── index.ts
├── workspace-governance.members/  # Workspace member grants + member panel UI
│   ├── _components/
│   ├── _queries.ts
│   └── index.ts
├── workspace-governance.partners/  # Stub — views migrated to account-organization.partner
│   └── index.ts
├── workspace-governance.schedule/
│   └── index.ts
├── workspace-governance.teams/
│   └── index.ts
├── workspace-business.files/
│   ├── _hooks/
│   ├── _components/
│   └── index.ts
├── workspace-business.document-parser/ # Document parsing [A4] → ParsingIntent digital twin
│   ├── _actions.ts
│   ├── _form-actions.ts
│   └── index.ts
├── workspace-business.parsing-intent/  # ParsingIntent digital twin contract (#A4)
│   ├── _contract.ts
│   └── index.ts
├── workspace-business.tasks/
│   ├── _actions.ts
│   ├── _components/
│   ├── _queries.ts
│   └── index.ts
├── workspace-business.daily/           # 施工日誌 (A-track daily log)
│   ├── _actions.ts
│   ├── _components/
│   ├── _hooks/
│   ├── _queries.ts
│   └── index.ts
├── workspace-business.schedule/
│   ├── _hooks/
│   ├── _components/
│   └── index.ts
├── workspace-business.issues/          # B-track: issues + IssueResolved → unblock workflow (#A3)
│   ├── _actions.ts
│   ├── _components/
│   └── index.ts
├── workspace-business.workflow/        # workflow.aggregate + state machine [R6]
│   ├── _aggregate.ts
│   ├── _issue-handler.ts
│   ├── _persistence.ts
│   └── index.ts
├── workspace-business.finance/
│   ├── _components/
│   └── index.ts
├── workspace-business.acceptance/
│   ├── _components/
│   └── index.ts
└── workspace-business.quality-assurance/
    ├── _components/
    └── index.ts
```

---

## VS6 — Scheduling Slice

All VS6 scheduling code is consolidated in `scheduling.slice`. Old slice directories are
kept as **deprecated shims** that re-export from `@/features/scheduling.slice`.

```
src/features/
└── scheduling.slice/                # UNIFIED VS6 scheduling slice [S1][S4]
    ├── _aggregate.ts                # OrgScheduleProposal domain aggregate
    ├── _actions.ts                  # Server Actions (createScheduleItem, approve, complete…)
    ├── _queries.ts                  # Read-only queries (subscriptions, demand board, account)
    ├── _saga.ts                     # Cross-org saga coordinator (ScheduleAssignRejected [A5])
    ├── _hooks/
    │   ├── use-org-schedule.ts      # Org-scoped subscription hooks
    │   ├── use-global-schedule.ts   # Global schedule state hook
    │   ├── use-schedule-commands.ts # Assign/unassign/status update commands
    │   ├── use-workspace-schedule.ts
    │   └── use-schedule-event-handler.ts
    ├── _components/
    │   ├── schedule.account-view.tsx   # AccountScheduleSection (3 tabs)
    │   ├── schedule.workspace-view.tsx # WorkspaceSchedule
    │   ├── org-schedule-governance.tsx # OrgScheduleGovernance (HR tab)
    │   ├── demand-board.tsx
    │   ├── unified-calendar-grid.tsx
    │   └── …
    ├── _projectors/
    │   ├── demand-board.ts          # Demand Board projection handlers
    │   ├── demand-board-queries.ts
    │   ├── account-schedule.ts      # Account schedule availability projection
    │   └── account-schedule-queries.ts
    └── index.ts                     # Public API barrel

# Deprecated shims (re-export from scheduling.slice):
├── account-organization.schedule/index.ts
├── workspace-business.schedule/index.ts
├── projection.demand-board/index.ts
├── projection.account-schedule/index.ts
└── scheduling-saga/index.ts
```

---

## VS7 — Notification Slice

```
src/features/
├── account-user.notification/       # FCM delivery + device token management
│   ├── _hooks/
│   ├── _components/
│   └── index.ts
└── account-governance.notification-router/  # Stateless router (#A10)
    └── index.ts
```

---

## VS8 — Projection Bus

All projection slices are prefixed `projection.*`:

```
src/features/
├── projection.registry/             # read-model-registry + version mapping
│   └── index.ts
├── projection.event-funnel/         # event-funnel: sole projection write path (#9, #A7, S2)
│   └── index.ts
├── projection.workspace-scope-guard/ # CRITICAL SLA ≤500ms; writes workspace-scope-guard-view #A9
│   └── index.ts
├── projection.org-eligible-member-view/    # CRITICAL SLA ≤500ms, #14–#16, T3, #19
│   └── index.ts
├── projection.workspace-view/        # STANDARD ≤10s
│   └── index.ts
├── projection.account-schedule/      # STANDARD ≤10s
│   └── index.ts
├── projection.account-view/          # STANDARD ≤10s, exposes FCM token (#6)
│   └── index.ts
├── projection.organization-view/     # STANDARD ≤10s
│   └── index.ts
├── projection.account-skill-view/    # STANDARD ≤10s, tier derived not stored (#12)
│   └── index.ts
├── projection.account-audit/         # STANDARD ≤10s, per-account audit entries [R8]
│   └── index.ts
├── projection.global-audit-view/     # STANDARD ≤10s, every record has traceId [R8]
│   └── index.ts
└── projection.tag-snapshot/          # BACKGROUND ≤30s, read-only T5, [S4]
    └── index.ts
```

> **Note**: The `wallet-balance` is a logical read model (used for display) served by `account-user.wallet/_queries.ts`. Precise financial transactions use STRONG_READ directly against the wallet aggregate [S3].

---

## Infra Slices

```
src/features/
├── infra.gateway-command/     # unified-command-gateway: CBG_ENTRY + CBG_AUTH + CBG_ROUTE
│   └── index.ts
├── infra.gateway-query/       # read-model-registry query routing [S2][S3]
│   └── index.ts
├── infra.event-router/        # IER: integration-event-router + lane dispatch [P1]
│   └── index.ts
├── infra.outbox-relay/        # Outbox relay worker client-side interface [R1][S1]
│   └── index.ts
├── infra.dlq-manager/         # DLQ three-tier handler: SAFE_AUTO/REVIEW_REQUIRED/SECURITY_BLOCK [R5]
│   └── index.ts
└── infra.observability/       # VS9: trace-identifier, domain-metrics, domain-error-log [R8]
    ├── _trace.ts
    ├── _metrics.ts
    ├── _error-log.ts
    └── index.ts
```

---

## Shared Infrastructure — `src/shared/`

```
src/shared/
├── app-providers/             # Global React context providers (auth, theme, etc.)
├── ui/                        # Design system: shadcn/ui wrapper components
├── shadcn-ui/                 # Raw shadcn component primitives
├── constants/                 # Application-wide constants
├── lib/                       # Utility libraries (date, string, etc.)
├── utils/                     # Pure utility functions
├── types/                     # Shared TypeScript type definitions
├── utility-hooks/             # Cross-cutting React hooks (useDebounce, etc.)
├── i18n-types/                # Internationalization type definitions
└── infra/
    ├── auth/                  # Firebase Auth client wrappers
    ├── firestore/             # Firestore client + repository base
    │   └── repositories/      # Low-level Firestore CRUD helpers
    ├── analytics/             # Analytics integrations
    ├── storage/               # Firebase Storage client
    ├── messaging/             # FCM client (token management, send)
    └── ai/                    # Genkit AI flow wrappers
```

---

## App Router — `src/app/`

The App Router is for **composition only** — no business logic in layouts or pages (D3, D4).

```
src/app/
├── (auth)/
│   └── login/
│       └── page.tsx           # Login/register page (uses identity-account.auth)
│
└── (shell)/
    └── (account)/
        ├── (dashboard)/
        │   └── dashboard/
        │       ├── layout.tsx           # Dashboard shell layout
        │       ├── page.tsx             # Dashboard home
        │       ├── @header/             # Parallel route: header slot
        │       │   └── page.tsx
        │       ├── @modal/              # Parallel route: modal slot
        │       │   ├── default.tsx
        │       │   └── (.)account/new/  # Intercepting route: new account modal
        │       │       └── page.tsx
        │       └── account/
        │           ├── settings/
        │           ├── members/
        │           ├── partners/
        │           │   └── [id]/
        │           ├── teams/
        │           │   └── [id]/
        │           ├── schedule/        # VS6 scheduling
        │           ├── org-schedule/    # VS4 org-level schedule
        │           ├── audit/           # VS5 global audit view
        │           ├── matrix/          # Skill matrix view
        │           ├── daily/           # Daily log
        │           └── new/             # New account creation
        │
        └── (workspaces)/
            └── workspaces/
                ├── layout.tsx
                ├── page.tsx             # Workspace list
                ├── @header/             # Parallel route: header slot
                ├── @modal/              # Parallel route: modal slot
                │   └── (.)new/          # Intercepting route: new workspace modal
                ├── new/                 # Full-page workspace creation
                └── [id]/               # Workspace detail
                    ├── layout.tsx
                    ├── page.tsx
                    ├── @modal/          # Parallel route: modal slot
                    │   ├── (.)settings/
                    │   ├── (.)daily-log/[logId]/
                    │   └── (.)schedule-proposal/
                    ├── @panel/          # Parallel route: side panel slot
                    │   └── (.)governance/
                    ├── @businesstab/    # Parallel route: business tab slot
                    │   ├── quality-assurance/
                    │   ├── acceptance/
                    │   ├── audit/
                    │   ├── capabilities/
                    │   ├── schedule/
                    │   ├── members/
                    │   ├── files/
                    │   ├── finance/
                    │   └── issues/
                    ├── settings/
                    ├── governance/
                    └── schedule-proposal/
```

---

## D1–D23 Path Constraints

| Rule | Path Constraint |
|------|----------------|
| D1 | Event delivery only via `infra.outbox-relay`; no direct `infra.event-router` imports from domain slices |
| D2 | Cross-slice imports: `import ... from '@/features/{slice}/index'` only; `_*.ts` files are private |
| D3 | All mutations: `src/features/{slice}/_actions.ts` only |
| D4 | All reads: `src/features/{slice}/_queries.ts` only |
| D5 | No `src/shared/infra/firestore` imports in `src/app/` or UI components |
| D6 | `"use client"` in `_components/` leaf nodes only; never in layout or page server components |
| D7 | `import ... from '@/features/{other-slice}/index'`; NEVER `import ... from '@/features/{other-slice}/_private'` |
| D8 | `src/features/shared.kernel.*` files contain no async functions, no Firestore calls, no side effects |
| D9 | `workspace-application/` TX Runner coordinates mutations; slices do not mutate each other |
| D10 | `EventEnvelope.traceId` set only in `infra.gateway-command/CBG_ENTRY`; read-only everywhere else |
| D11 | `workspace-core.event-store` enables projection rebuild; must be kept current |
| D12 | `getTier()` import always from `shared.kernel.skill-tier`; tier field never in Firestore writes |
| D13 | New OUTBOX: must declare DLQ tier in `SK_OUTBOX_CONTRACT`; do not re-define at-least-once semantics locally [S1] |
| D14 | New Projection: must apply `SK_VERSION_GUARD` before writing; do not skip `aggregateVersion` check [S2] |
| D15 | Read routing: consult `SK_READ_CONSISTENCY` first — financial/auth/irreversible → STRONG_READ; otherwise EVENTUAL_READ [S3] |
| D16 | SLA values must not be hardcoded in node text; always reference `SK_STALENESS_CONTRACT` constants [S4] |
| D17 | New external entry point (non-`_actions.ts`): must satisfy `SK_RESILIENCE_CONTRACT` before going to production [S5] |
| D18 | Claims refresh logic changes: `SK_TOKEN_REFRESH_CONTRACT` is the sole spec; all three parties (VS1, IER, frontend) must be updated together [S6] |
| D19 | Type ownership: cross-BC contracts must live in `shared.kernel.*` first; `shared/types` is legacy/common DTO fallback only |
| D20 | Import precedence: `shared.kernel.*` > feature slice `index.ts` > `shared/types`; when the same concept exists in both `shared.kernel` and `shared/types`, `shared.kernel` is authoritative |
| D21 | New tag category: must define in CTA `TAG_ENTITIES`; slices must not create their own semantic tag categories |
| D22 | Cross-slice tag reference: must point to TAG_USER_LEVEL / TAG_SKILL / TAG_SKILL_TIER / TAG_TEAM / TAG_ROLE / TAG_PARTNER; implicit tagSlug strings forbidden |
| D23 | Tag annotation format: node text `→ tag::{category} [{NODE_NAME}]`; semantic edge `-.->|"{dim} tag 語義"| NODE_NAME` |
