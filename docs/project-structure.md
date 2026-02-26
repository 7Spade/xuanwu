# Project Structure

> Source of truth: `docs/overview/logic-overview_v9.md`
> Architecture: Vertical Slice Architecture (VSA)

---

## Top-Level Layout

```
xuanwu/
├── src/
│   ├── app/          ← Next.js App Router — routing & layout composition only
│   ├── features/     ← Vertical feature slices (business domain)
│   ├── shared/       ← Cross-cutting infrastructure
│   └── ai/           ← Genkit AI flows (dev entry point)
├── functions/        ← Firebase Functions workspace (Outbox Relay, DLQ)
├── docs/             ← Architecture documentation
│   └── overview/     ← logic-overview_v9.md (sole source of truth)
└── public/           ← Static assets
```

**Dependency direction:**
```
app/  →  features/{slice}/index.ts  →  shared/*
```

- `app/` imports from `features/*/index.ts` (public API) and `shared/*`
- `features/*` imports from `shared/*` and other features via `index.ts` only
- `shared/*` has zero feature dependencies
- Private files inside a slice use the `_` prefix (e.g. `_actions.ts`, `_queries.ts`)

---

## Feature Slice Standard Layout

```
features/{name}/
├── GEMINI.md          ← AI instructions for this slice (required)
├── _actions.ts        ← "use server" mutations (Server Actions)
├── _queries.ts        ← Firestore reads / onSnapshot
├── _types.ts          ← Feature-specific type extensions
├── _hooks/            ← React hooks
├── _components/       ← UI components
└── index.ts           ← Public API — only exports visible to other slices
```

---

## VS0 — Shared Kernel + Tag Authority

```
src/features/
├── shared-kernel/                     ← Convenience barrel only (index.ts + GEMINI.md)
├── shared.kernel.event-envelope/      ← EventEnvelope contract [Q3][R8]
├── shared.kernel.authority-snapshot/  ← AuthoritySnapshot contract [Q4]
├── shared.kernel.skill-tier/          ← SkillTier + SkillRequirement + ScheduleProposedPayload [#12][A5]
├── shared.kernel.contract-interfaces/ ← CommandSuccess / CommandFailure / DomainError [R4]
├── shared.kernel.constants/           ← WorkflowStatus, ErrorCodes
└── shared.kernel.tag-authority/       ← Re-export stub → centralized-tag
```

```
src/features/
└── centralized-tag/                   ← Tag Authority Center [#17][A6]
    ├── _aggregate.ts                  ← CTA aggregate (tagSlug authority)
    ├── _bus.ts                        ← In-process TagLifecycleEvent bus
    └── index.ts
```

---

## VS1 — Identity

```
src/features/
└── identity-account.auth/             ← Login, register, reset password, Token Refresh Handshake [R2]
```

---

## VS2 — Account

```
src/features/
├── account/                           ← Organization CRUD, stats, permissions
├── account-governance.notification-router/  ← FCM Layer 2 by TargetAccountID [E3][R8]
├── account-governance.policy/         ← Account policy management
├── account-governance.role/           ← Account role → CUSTOM_CLAIMS signing [E6]
├── account-organization.core/         ← Organization aggregate + binding [A2]
├── account-organization.event-bus/    ← Org event bus (Producer-only [P2])
├── account-organization.member/       ← Org member invite/remove
├── account-organization.partner/      ← Partner management (external group)
├── account-organization.policy/       ← Organization policy management
├── account-organization.schedule/     ← HR scheduling [R7][R5][Q6]
├── account-organization.skill-tag/    ← Skill tag pool [R3][VS4_TAG_SUBSCRIBER]
├── account-organization.team/         ← Team management (internal group)
├── account-user.notification/         ← Personal push notification FCM Layer 3 [R8]
├── account-user.profile/              ← User profile, preferences, security
├── account-user.skill/                ← User skill XP aggregate [#11][#13]
└── account-user.wallet/               ← User wallet [Q8][R2][R5] CRITICAL_LANE
```

---

## VS5 — Workspace

```
src/features/
├── workspace-application/             ← Command handler, Scope Guard, Policy Engine, TX Runner, Outbox [R4]
├── workspace-core/                    ← Workspace CRUD, shell, provider, list
├── workspace-core.event-bus/          ← Intra-workspace event bus (in-process only [E5])
├── workspace-core.event-store/        ← Event store (replay/audit [#9])
├── workspace-governance.audit/        ← Audit trail [Q5]
├── workspace-governance.audit-convergence/ ← Audit convergence helper
├── workspace-governance.members/      ← Workspace member access & roles
├── workspace-governance.partners/     ← Stub (migrated to account-organization.partner)
├── workspace-governance.role/         ← Role management [#18]
├── workspace-governance.schedule/     ← Stub (migrated to workspace-business.schedule)
├── workspace-governance.teams/        ← Stub (migrated to account-organization.team)
├── workspace-business.acceptance/     ← Acceptance plugin
├── workspace-business.daily/          ← Daily logs, comments, bookmarks
├── workspace-business.document-parser/ ← AI document parsing [A4]
├── workspace-business.files/          ← File upload, management
├── workspace-business.finance/        ← Finance plugin
├── workspace-business.issues/         ← Issue tracking; IssueResolved → blockedBy.delete(issueId) [R6]
├── workspace-business.parsing-intent/ ← ParsingIntent versions, SourcePointer, IntentDelta [A4]
├── workspace-business.quality-assurance/ ← QA plugin
├── workspace-business.schedule/       ← Schedule items, proposals, decisions [Q6]
├── workspace-business.tasks/          ← Task tree, CRUD
└── workspace-business.workflow/       ← A-track state machine [R6][WORKFLOW_STATE_CONTRACT]
```

---

## VS6 — Scheduling

```
src/features/
└── scheduling-core.saga/              ← Cross-org scheduling saga, compensating events [A5][R7]
```

---

## Infra (VS0 boundary + GW layer)

```
src/features/
├── infra.dlq-manager/                 ← DLQ three-tier policy [R5]
├── infra.event-router/                ← IER: CRITICAL/STANDARD/BACKGROUND lanes [R2]
├── infra.gateway-command/             ← Command Gateway stub [E4][R8]
├── infra.gateway-query/               ← Query Gateway stub
├── infra.observability/               ← trace-identifier [R8], domain-metrics, domain-error-log
└── infra.outbox-relay/                ← OUTBOX_RELAY_WORKER CDC relay [R1]
```

---

## VS8 — Projection Bus

```
src/features/
├── projection.account-audit/          ← Account audit projection
├── projection.account-schedule/       ← Account schedule projection
├── projection.account-skill-view/     ← Account skill read model (xp; tier derived [#12])
├── projection.account-view/           ← Account read model + authority snapshot
├── projection.event-funnel/           ← Event Funnel [#9][Q3][R8]
├── projection.org-eligible-member-view/ ← Schedule eligibility [R7][ELIGIBLE_UPDATE_GUARD][#14][#19]
├── projection.organization-view/      ← Organization read model
├── projection.registry/               ← Event stream offset, read model version table
├── projection.tag-snapshot/           ← Tag read model [Q6][T5] Max Staleness ≤ 30s
├── projection.workspace-scope-guard/  ← Scope Guard read model [A9]
└── projection.workspace-view/         ← Workspace read model
```

---

## Shared Infrastructure

```
src/shared/
├── ai/           ← Genkit AI flows
├── infra/        ← Firebase adapters + Firestore repositories
│   └── firestore/
│       ├── repositories/  ← Per-aggregate repository implementations
│       ├── firestore.client.ts
│       ├── firestore.facade.ts
│       ├── firestore.converter.ts
│       ├── firestore.read.adapter.ts
│       └── firestore.write.adapter.ts
├── lib/          ← Pure utilities + domain rules
├── types/        ← All TypeScript domain types
│   ├── account.types.ts
│   ├── audit.types.ts
│   ├── daily.types.ts
│   ├── schedule.types.ts
│   ├── skill.types.ts
│   ├── task.types.ts
│   └── workspace.types.ts
└── ui/           ← shadcn/ui components, app-providers, i18n, constants
```

---

## App Router Layout

```
src/app/
├── (auth)/                   ← Unauthenticated routes (login, register)
├── (dashboard)/              ← Authenticated shell
│   └── dashboard/
│       ├── @header/          ← Parallel route: top navigation
│       ├── @sidebar/         ← Parallel route: left navigation
│       ├── @modal/           ← Parallel route: modal overlays
│       ├── account/          ← Account settings
│       └── workspaces/       ← Workspace views
│           └── [id]/         ← Dynamic workspace
│               ├── @plugintab/ ← Parallel route: plugin tabs
│               └── ...
├── api/                      ← Route handlers (Genkit, webhooks)
└── layout.tsx                ← Root layout
```

---

## AI Flows

```
src/ai/
├── dev.ts              ← Genkit dev server entry (genkit:dev / genkit:watch)
└── flows/              ← Genkit Flow definitions per domain
```

---

## Firebase Functions

```
functions/
├── src/
│   ├── outbox-relay/   ← OUTBOX_RELAY_WORKER implementation [R1]
│   └── dlq/            ← DLQ Manager [R5]
└── package.json
```
