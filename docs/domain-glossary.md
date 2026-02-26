# Domain Glossary

> Source of truth: `docs/logic-overview.md`
> All terms, invariants, and rules below are derived from the v10 spec (v9 R1–R8 + v10 S1–S6).

---

## Core Architectural Concepts

| Term | Definition |
|------|-----------|
| **VSA** | Vertical Slice Architecture — code organised by business domain, not technical layer. Each slice owns its own types, actions, queries, and components. |
| **VS0–VS9** | Version-stamped vertical slice groups: VS0 = Shared Kernel + Tag Authority, VS1 = Identity, VS2 = Account, VS3 = Skill XP, VS4 = Organization, VS5 = Workspace, VS6 = Scheduling, VS7 = Notification, VS8 = Projection Bus, VS9 = Observability. |
| **BC** | Bounded Context — a named region of the domain with an explicit linguistic boundary. A BC only writes to its own aggregates (`#1`). |
| **Aggregate** | A cluster of domain objects treated as a single unit of consistency. Commands target one aggregate (`#A8`). |
| **Command** | An intent to change state, routed via `workspace-application` Command Handler through `_actions.ts`. |
| **Domain Event** | A named fact emitted by an aggregate after a successful state change. Always wrapped in an `EventEnvelope` (`SK_ENV`). |
| **EventEnvelope** | Canonical wrapper for every domain event. Fields: `version`, `traceId`, `timestamp`, `idempotency-key = eventId+aggId+version` (`Q3`, `R8`). |
| **Outbox** | A Firestore sub-collection written transactionally with the aggregate state change. Guarantees at-least-once delivery. Six outboxes: `acc-outbox`, `org-outbox`, `sched-outbox`, `skill-outbox`, `tag-outbox`, `ws-outbox`. |
| **OUTBOX_RELAY_WORKER** | Shared infra worker (`infra.outbox-relay`) that scans all OUTBOX collections via Firestore `onSnapshot` (CDC) and delivers to IER (`R1`). |
| **IER** | Integration Event Router (`infra.event-router`) — receives events from OUTBOX_RELAY and fan-outs to subscribers by lane: `CRITICAL_LANE`, `STANDARD_LANE`, `BACKGROUND_LANE` (`R2`). |
| **Event Funnel** | `projection.event-funnel` — the single write path into all Projection read models (`#9`). Applies upsert by `idempotency-key` (`Q3`) and propagates `traceId` into DOMAIN_METRICS (`R8`). |
| **Projection** | A read-optimised view rebuilt from the event stream. Cannot be the source of truth for writes. |
| **Server Action** | Next.js `"use server"` function in `_actions.ts`; the unified entry point for all mutations. Routed through the Command Gateway. |
| **ACTIVE_CTX** | `active-account-context` — the currently selected account context for the authenticated user. TTL = Token lifetime. When conflicts with Claims, `ACTIVE_CTX` wins (`Q4`). |

---

## Lanes (IER Delivery Priorities)

| Lane | SLA | Use Cases | DLQ Policy |
|------|-----|-----------|-----------|
| `CRITICAL_LANE` | Highest priority, eventual consistency | `RoleChanged`, `OrgContextProvisioned`, `WalletDeducted/Credited`, `ClaimsRefresh` | `REVIEW_REQUIRED` or `SECURITY_BLOCK` |
| `STANDARD_LANE` | < 10 s | `MemberJoined`, `AccountCreated`, `SkillXpAdded`, `ScheduleAssigned` | `SAFE_AUTO` or `REVIEW_REQUIRED` |
| `BACKGROUND_LANE` | Best-effort | `TagLifecycleEvent` | `SAFE_AUTO` |

---

## DLQ (Dead Letter Queue) Policies — `R5`

| Policy | Behaviour | Example Events |
|--------|-----------|---------------|
| `SAFE_AUTO` | Idempotent; auto-retry | `TagLifecycleEvent`, `MemberJoined` |
| `REVIEW_REQUIRED` | Requires human review before replay | `WalletDeducted`, `ScheduleAssigned`, `RoleChanged` |
| `SECURITY_BLOCK` | Security incident; alert + freeze | `ClaimsRefresh` failure |

---

## Key Contracts (SK_CONTRACTS)

| Contract | Slice | Purpose |
|----------|-------|---------|
| `EventEnvelope` | `shared.kernel.event-envelope` | Canonical event wrapper with `traceId`, `version`, `idempotency-key` |
| `AuthoritySnapshot` | `shared.kernel.authority-snapshot` | Claims/roles/scopes snapshot; TTL = Token lifetime |
| `SkillTier` + `getTier(xp)` | `shared.kernel.skill-tier` | Pure function; tier is always derived, never stored (`#12`) |
| `SkillRequirement` | `shared.kernel.skill-tier` | Cross-slice workforce skill demand contract (`A5`) |
| `ScheduleProposedPayload` | `shared.kernel.skill-tier` | Scheduling saga payload contract |
| `CommandSuccess / CommandFailure` | `shared.kernel.contract-interfaces` | `{ aggregateId, version }` on success; `DomainError { code, message, context }` on failure (`R4`) |
| `WorkflowStatus / ErrorCodes` | `shared.kernel.constants` | Cross-slice string enumerations |
| Tag Authority re-export | `shared.kernel.tag-authority` | Delegates to `centralized-tag` |

---

## Consistency Invariants (`#1–#19`)

| # | Rule |
|---|------|
| `#1` | Each BC may only modify its own aggregate |
| `#2` | Cross-BC communication only via Event / Projection / ACL |
| `#3` | Application Layer coordinates only; carries no domain rules |
| `#4` | Domain Events emitted only by Aggregates; TX Runner only delivers Outbox |
| `#5` | Custom Claims are a snapshot only — not the authoritative permission source |
| `#6` | Notification reads Projection only |
| `#7` | Scope Guard reads only its own Context Read Model |
| `#8` | Shared Kernel symbols must be explicitly marked |
| `#9` | Projections must be fully rebuildable from the event stream |
| `#10` | If a module requires another module's internal state → boundary design error |
| `#11` | XP belongs to Account BC; Organisation only sets thresholds |
| `#12` | Tier is always a derived value; never stored in DB |
| `#13` | Every XP change must write to the XP Ledger |
| `#14` | Scheduling reads only `ORG_ELIGIBLE_MEMBER_VIEW` |
| `#15` | `eligible` lifecycle: joined→`true` · assigned→`false` · completed/cancelled→`true` |
| `#16` | Talent Repository = member + partner + team |
| `#17` | `centralized-tag.aggregate` is the single source of truth for `tagSlug` semantics |
| `#18` | `workspace-governance` role inherits hard constraints from `org-governance.policy` |
| `#19` | `ORG_ELIGIBLE_VIEW` update requires monotonically increasing `aggregateVersion` (`R7`) |

---

## Atomicity Audit (`#A1–#A11`)

| # | Rule |
|---|------|
| `#A1` | `wallet` is strongly consistent; `profile`/`notification` are weakly consistent |
| `#A2` | `org-account.binding` uses ACL/Projection anti-corruption only |
| `#A3` | `blockWorkflow` → `blockedBy: Set<issueId>`; `unblockWorkflow` precondition: `blockedBy.isEmpty()` (`R6`) |
| `#A4` | `ParsingIntent` emits proposal events only |
| `#A5` | Scheduling is a cross-BC saga with compensating events |
| `#A6` | `CENTRALIZED_TAG_AGGREGATE` is the sole semantic authority |
| `#A7` | Event Funnel is compose-only |
| `#A8` | TX Runner: 1 command / 1 aggregate, atomic commit |
| `#A9` | Scope Guard: fast path reads snapshot; high-risk operations re-source to aggregate |
| `#A10` | Notification Router is stateless |
| `#A11` | `eligible` is a "no scheduling conflict" snapshot, not a static flag |

---

## v9 Production-Ready Fixes (`R1–R8`)

| Tag | Name | Summary |
|-----|------|---------|
| `R1` | `OUTBOX_RELAY_WORKER` | Shared CDC relay for all OUTBOXes → IER; Firestore `onSnapshot` scan strategy |
| `R2` | CRITICAL_LANE semantics | Removed "synchronous" label; now = high-priority eventual consistency + Token Refresh Handshake |
| `R3` | `SKILL_TAG_POOL` loop closure | `VS4_TAG_SUBSCRIBER` explicitly responsible for consuming `TagLifecycleEvent` from `BACKGROUND_LANE` |
| `R4` | `COMMAND_RESULT_CONTRACT` | `CommandSuccess: { aggregateId, version }` / `CommandFailure: DomainError` — structured result path for front-end |
| `R5` | DLQ tiered strategy | Three levels: `SAFE_AUTO` / `REVIEW_REQUIRED` / `SECURITY_BLOCK` |
| `R6` | `WORKFLOW_STATE_CONTRACT` | Legal stage transitions; `blockedBy` Set; `unblockWorkflow` precondition: `blockedBy.isEmpty()` |
| `R7` | `ELIGIBLE_UPDATE_GUARD` | `event.aggregateVersion > view.lastProcessedVersion` required before updating; stale events discarded |
| `R8` | `TRACE_PROPAGATION_RULE` | `event-envelope.traceId` = original Command TraceID; propagated unchanged through IER → FUNNEL → FCM |

---

## v8 Development Foundation (`Q1–Q8`)

| Tag | Rule |
|-----|------|
| `Q1` | `SKILL_OUTBOX` at-least-once delivery for skill XP events |
| `Q2` | `TAG_OUTBOX` at-least-once delivery for tag lifecycle events |
| `Q3` | All `EventEnvelope` contain `idempotency-key`; Funnel upserts by key |
| `Q4` | `CONTEXT_LIFECYCLE_MANAGER` manages `ACTIVE_CTX`; conflicts resolved in favour of `ACTIVE_CTX` |
| `Q5` | `workspace-governance.audit` collector feeds `projection.global-audit-view` |
| `Q6` | `TAG_STALE_GUARD`: Max Staleness ≤ 30 s; validates `tagSlug` freshness before matching |
| `Q7` | Rate limiter + Circuit Breaker guard layer at Gateway entry |
| `Q8` | Wallet: display balance → Projection; precise transaction → `STRONG_READ` back to `WALLET_AGG` |

---

## Tag Authority Rules (`T1–T5`)

| Tag | Rule |
|-----|------|
| `T1` | New slices extend Tag Authority by subscribing to `TagLifecycleEvent` on `BACKGROUND_LANE` |
| `T2` | `SKILL_TAG_POOL` = Tag Authority read-only projection within the Org scope; updated by `VS4_TAG_SUBSCRIBER` (`R3`) |
| `T3` | `ORG_ELIGIBLE_MEMBER_VIEW.skills{tagSlug→xp}` is a cross-slice XP snapshot |
| `T4` | Scheduling skill requirements = `SK_SKILL_REQ × Tag Authority tagSlug` |
| `T5` | `TAG_SNAPSHOT` consumers are read-only; must not write |

---

## Unified Development Rules (`D1–D12`)

| Rule | Description |
|------|-------------|
| `D1` | Event output path: `Aggregate → EventBus(in-process) → OUTBOX → RELAY → IER` (no shortcuts) |
| `D2` | All `EventEnvelope` must contain `idempotency-key`; FUNNEL upserts by key |
| `D3` | IER routing rule changes must also update the GW routing table |
| `D4` | New slice onboarding checklist must be followed |
| `D5` | `wallet-balance`: display → Projection; transaction → `STRONG_READ` to aggregate |
| `D6` | Always call `TAG_STALE_GUARD` before scheduling / skill matching |
| `D7` | `ACTIVE_CTX` TTL synced with Token; context switch triggers `CTX_LIFECYCLE` rebuild |
| `D8` | DLQ Replay preserves original `idempotency-key`; must not regenerate |
| `D9` | `event-envelope.traceId` = original Command TraceID; IER/FUNNEL must not overwrite (`R8`) |
| `D10` | `WORKFLOW_AGG` must validate current Stage before executing a Command; `blockedBy` uses Set operations; `unblockWorkflow` only if `blockedBy.isEmpty()` (`R6`) |
| `D11` | `ORG_ELIGIBLE_VIEW` writes must compare `aggregateVersion` first; discard stale events (`R7`) |
| `D12` | DLQ handling by policy: `SAFE_AUTO` → auto; `REVIEW_REQUIRED` → human; `SECURITY_BLOCK` → security review (`R5`) |

---

## v6 Boundary Fixes (`E1–E6`)

| Tag | Rule |
|-----|------|
| `E1` | Aggregates must NOT import from cross-BC event buses |
| `E2` | `OrgContextProvisioned` → `CRITICAL_LANE` → `ORG_CONTEXT_ACL` anti-corruption |
| `E3` | `ScheduleAssigned` → `STANDARD_LANE` → Notification Router |
| `E4` | TraceID injected at `CBG_ENTRY` (Command Gateway entry) |
| `E5` | `workspace-core.event-bus` is in-process only; no cross-BC fan-out |
| `E6` | `claims-refresh-handler` is the single Claims refresh trigger; invoked by IER on `RoleChanged` |

---

## v10 VS0 Contract Consolidation (`S1–S6`)

v10 extracts six cross-slice infrastructure patterns from node-level text into explicit VS0 contracts.

| Tag | Contract | Summary |
|-----|----------|---------|
| `S1` | `SK_OUTBOX_CONTRACT` | Three mandatory elements for every OUTBOX: ① at-least-once delivery path, ② idempotency-key (eventId+aggId+version), ③ DLQ tier declaration (SAFE_AUTO / REVIEW_REQUIRED / SECURITY_BLOCK). Slices adding OUTBOX reference this contract; do not re-define at-least-once semantics locally. |
| `S2` | `SK_VERSION_GUARD` | All Projection writes MUST compare `event.aggregateVersion > view.lastProcessedVersion` before applying. Stale events are discarded. Generalises Invariant #19 from `eligible-view` to ALL Projections. FUNNEL enforces this centrally (D14). |
| `S3` | `SK_READ_CONSISTENCY` | Decision rule: financial/security/irreversible operations → `STRONG_READ` (Domain Aggregate); display/statistics/lists → `EVENTUAL_READ` (Projection). Prevents scattered STRONG_READ definitions across VS2/VS8 nodes. |
| `S4` | `SK_STALENESS_CONTRACT` | Canonical SLA constants: `TAG_MAX_STALENESS ≤ 30s`, `PROJ_STALE_CRITICAL ≤ 500ms`, `PROJ_STALE_STANDARD ≤ 10s`. SLA values MUST NOT be hardcoded in node text (D16); reference this contract. |
| `S5` | `SK_RESILIENCE_CONTRACT` | Minimum protection spec for all external trigger entry points (rate-limit / circuit-break / bulkhead). Applies to `_actions.ts`, Webhooks, and Edge Functions. New entry points require validation against this contract before going live (D17). |
| `S6` | `SK_TOKEN_REFRESH_CONTRACT` | Claims refresh three-party handshake: RoleChanged/PolicyChanged → IER CRITICAL_LANE → CLAIMS_HANDLER → TOKEN_REFRESH_SIGNAL. Frontend obligation: force re-fetch token on signal. Failure path: DLQ SECURITY_BLOCK → DOMAIN_ERRORS alert. All three parties (VS1 / IER / frontend) share this single spec (D18). |

### v10 Development Rules (`D13–D18`)

| Tag | Rule |
|-----|------|
| `D13` | New OUTBOX: declare DLQ tier in `SK_OUTBOX_CONTRACT`; do not re-define at-least-once semantics locally |
| `D14` | New Projection: reference `SK_VERSION_GUARD` in FUNNEL; do not skip `aggregateVersion` comparison |
| `D15` | Read-path decision: consult `SK_READ_CONSISTENCY` first; financial/auth/irreversible → STRONG_READ |
| `D16` | SLA numeric values (30s / 500ms / 10s) must NOT be hardcoded; import from `SK_STALENESS_CONTRACT` |
| `D17` | Non-`_actions.ts` external entry points (Webhook / Edge Function) require `SK_RESILIENCE_CONTRACT` sign-off |
| `D18` | Claims refresh logic changes: update `SK_TOKEN_REFRESH_CONTRACT` and synchronise all three parties (VS1 + IER + frontend) |
