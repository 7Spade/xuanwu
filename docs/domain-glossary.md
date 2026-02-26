# Domain Glossary

> **Source of truth**: `docs/logic-overview.md`
> This glossary defines all domain concepts, invariants, contracts, and rules used throughout the xuanwu system.

---

## Aggregates

| Term | Slice | Description |
|------|-------|-------------|
| `user-account` | VS2 | Personal account aggregate. Root of identity + wallet. |
| `account-user.wallet` | VS2 | Strong-consistency financial ledger. Balance invariant holder (#A1). STRONG_READ enforced [S3]. |
| `organization-core` | VS4 | Organization root aggregate. Owns member/partner/team relationships. |
| `organization-skill-recognition` | VS4 | Declares `minXpRequired` thresholds for org-level skill gates (#11). |
| `workspace-core` | VS5 | Workspace root aggregate. Owns workflow state machine [R6]. |
| `workflow` | VS5 | State machine: Draft → InProgress → QA → Acceptance → Finance → Completed. `blockedBy` Set manages B-track blocking (#A3). |
| `account-skill` | VS3 | Per-account skill XP tracker. All mutations write to XP ledger (#13). |
| `account-organization.schedule` | VS6 | HR scheduling aggregate. Reads only `ORG_ELIGIBLE_MEMBER_VIEW` (#14). Validates tag freshness before assignment [S4]. |
| `centralized-tag` | VS0 | **Global semantic dictionary master data** — the sole authority for `tagSlug` semantics (#17, #A6). |
| `authenticated-identity` | VS1 | Verified identity principal. Bridge between Firebase Auth and internal account. |
| `account-identity-link` | VS1 | 1:1 mapping `firebaseUserId ↔ accountId`. |
| `active-account-context` | VS1 | Session context. TTL = Firebase Token validity. Refreshed on OrgSwitched / WorkspaceSwitched. |

---

## Projections (Read Models)

| Projection | Lane | SLA | Description |
|-----------|------|-----|-------------|
| `workspace-scope-guard-view` | CRITICAL | ≤ 500ms | Authorization fast-path (#A9). Consumed by `CBG_AUTH`. |
| `org-eligible-member-view` | CRITICAL | ≤ 500ms | Schedule eligibility snapshot. Skills cross-snapshot (T3). Version monotonic (#19). |
| `wallet-balance` | CRITICAL | ≤ 500ms | Display-only wallet. Precise transactions use STRONG_READ [S3]. |
| `workspace-view` | STANDARD | ≤ 10s | Workspace list and status display. |
| `account-schedule` | STANDARD | ≤ 10s | Per-account assigned schedule view. |
| `account-view` | STANDARD | ≤ 10s | Account profile. Exposes FCM Token for notification routing (#6). |
| `organization-view` | STANDARD | ≤ 10s | Organization display data. |
| `account-skill-view` | STANDARD | ≤ 10s | Per-account skill XP + Tier (derived, not stored #12). |
| `global-audit-view` | STANDARD | ≤ 10s | Every record contains `traceId` [R8]. Append-only audit log. |
| `tag-snapshot` | BACKGROUND | ≤ 30s | Read-only tag data snapshot (T5). Staleness ≤ TAG_MAX_STALENESS [S4]. |

---

## Events

| Event | Producer | IER Lane | DLQ Tier |
|-------|----------|----------|----------|
| `RoleChanged` | VS2 acc-outbox | CRITICAL | SECURITY_BLOCK |
| `PolicyChanged` | VS2 acc-outbox | CRITICAL | SECURITY_BLOCK |
| `WalletDeducted` | VS2 acc-outbox | CRITICAL | REVIEW_REQUIRED |
| `WalletCredited` | VS2 acc-outbox | CRITICAL | REVIEW_REQUIRED |
| `AccountCreated` | VS2 acc-outbox | STANDARD | SAFE_AUTO |
| `OrgContextProvisioned` | VS4 org-outbox | CRITICAL | REVIEW_REQUIRED |
| `MemberJoined` | VS4 org-outbox | STANDARD | SAFE_AUTO |
| `MemberLeft` | VS4 org-outbox | STANDARD | SAFE_AUTO |
| `SkillRecognitionGranted` | VS4 org-outbox | STANDARD | REVIEW_REQUIRED |
| `SkillRecognitionRevoked` | VS4 org-outbox | STANDARD | REVIEW_REQUIRED |
| `SkillXpAdded` | VS3 skill-outbox | STANDARD | SAFE_AUTO |
| `SkillXpDeducted` | VS3 skill-outbox | STANDARD | SAFE_AUTO |
| `ScheduleAssigned` | VS6 sched-outbox | STANDARD | REVIEW_REQUIRED |
| `ScheduleProposed` | VS6 sched-outbox | STANDARD | SAFE_AUTO |
| `ScheduleAssignRejected` | VS6 sched-outbox (saga) | STANDARD | SAFE_AUTO |
| `TagLifecycleEvent` | VS0 tag-outbox | BACKGROUND | SAFE_AUTO |
| `IssueResolved` | VS5 ws-outbox | STANDARD | SAFE_AUTO |
| `AuditEvents` | VS5 audit-collector | BACKGROUND | SAFE_AUTO |

---

## #1–#19 Consistency Invariants

| # | Invariant | Description |
|---|-----------|-------------|
| **#1** | BC self-modification | Each Bounded Context can only modify its own Aggregates. No BC may mutate another BC's aggregate directly. |
| **#2** | Cross-BC communication | Cross-BC interaction is ONLY permitted via: Domain Event, Projection read, or ACL anti-corruption layer. |
| **#3** | Application layer coordination | The Application Layer coordinates only; it MUST NOT carry domain rules. Domain logic lives in Aggregates. |
| **#4** | Event production | Domain Events are only produced by Aggregates. The TX Runner only delivers to the Outbox — it MUST NOT create events. |
| **#5** | Custom Claims as snapshot | Custom Claims are a snapshot only — NOT the authoritative permission source. They expire with the Firebase token. |
| **#6** | Notification read-only | Notification Router reads only Projection data. It MUST NOT query Aggregates directly. |
| **#7** | Scope Guard isolation | Scope Guard reads only its own Context Read Model. It MUST NOT cross slice boundaries for authorization. |
| **#8** | Shared Kernel explicit labelling | Shared Kernel dependencies MUST be explicitly labelled. Unlabelled cross-BC sharing is treated as an architectural violation. |
| **#9** | Projection rebuildability | Every Projection MUST be fully reconstructible from its event stream. No projection state may exist without a corresponding event. |
| **#10** | Context locality | If any module requires another module's internal context state, this indicates a boundary design error. |
| **#11** | XP ownership | XP belongs to Account BC. Organization BC only declares thresholds (minXpRequired). Organization MUST NOT own XP. |
| **#12** | Tier is derived | `SkillTier` is ALWAYS a derived/computed value. It is NEVER persisted to the database. |
| **#13** | XP ledger write | Every XP mutation MUST write a corresponding `SkillXpLedgerEntry` with `sourceId`. |
| **#14** | Schedule reads eligible view | `account-organization.schedule` MUST only read `ORG_ELIGIBLE_MEMBER_VIEW` when assigning members. Direct aggregate queries are forbidden. |
| **#15** | Eligible lifecycle | `eligible` field lifecycle: `MemberJoined` → `true`; `ScheduleAssigned` → `false`; `ScheduleCompleted / ScheduleCancelled` → `true`. |
| **#16** | Talent Repository composition | Talent Repository = Member + Partner + Team. All three must be included in `ORG_ELIGIBLE_MEMBER_VIEW`. |
| **#17** | Tag singular authority | `centralized-tag.aggregate` is the SOLE authority for `tagSlug` semantics. No other aggregate may define or redefine tag semantics. |
| **#18** | Workspace governance inheritance | `workspace-governance.role` inherits `org-governance.policy` hard constraints. Workspace roles cannot override org-level policy. |
| **#19** | Projection version monotonicity | **ALL** Projection updates MUST satisfy `event.aggregateVersion > view.lastProcessedVersion`. Stale events MUST be discarded. (v10 generalization of v9's R7 which was limited to eligible-view only.) |

---

## #A1–#A11 Atomicity Audit

| # | Rule | Description |
|---|------|-------------|
| **#A1** | Wallet strong consistency | `account-user.wallet` requires STRONG_READ. `account-user.profile` and `notification` are weakly consistent. |
| **#A2** | Org-account binding ACL | `organization-account.binding` communicates only via ACL / Projection anti-corruption. No direct coupling. |
| **#A3** | Workflow blocking | `blockWorkflow` inserts `issueId` into `blockedBy` Set. `unblockWorkflow` requires `blockedBy.isEmpty()`. Only `IssueResolved` event triggers `blockedBy.delete(issueId)`. |
| **#A4** | ParsingIntent proposal only | `ParsingIntent` (Digital Twin) may only emit proposal events (`IntentDeltaProposed`). It MUST NOT directly mutate task/finance state. |
| **#A5** | Schedule cross-BC saga | Schedule assignment across BC boundaries uses Saga + compensating events (`ScheduleAssignRejected`, `ScheduleProposalCancelled`). |
| **#A6** | Tag semantic authority | `CENTRALIZED_TAG_AGGREGATE` is the sole semantic authority for tags. No other aggregate may create or redefine a `tagSlug`. |
| **#A7** | Event Funnel compose-only | `event-funnel` only composes/routes — it MUST NOT apply domain logic or transform event payload content. |
| **#A8** | 1-command-1-aggregate atomicity | TX Runner commits exactly 1 command to 1 aggregate per transaction. No multi-aggregate TX is permitted. |
| **#A9** | Scope Guard risk-based routing | Fast path: read `workspace-scope-guard-view`. High-risk operations: re-source from aggregate for authoritative check. |
| **#A10** | Notification Router stateless | `notification-router` is completely stateless. It routes by `TargetAccountID` matching only — no state accumulation. |
| **#A11** | Eligible is a snapshot | `eligible` represents "has no conflicting schedule assignment" — it is a dynamic snapshot, NOT a static status flag. |

---

## T1–T5 Tag Authority Extension Rules

| Rule | Description |
|------|-------------|
| **T1** | A new slice can extend Tag Authority support by subscribing to `TagLifecycleEvent` on IER `BACKGROUND_LANE`. No other mechanism is permitted. |
| **T2** | `SKILL_TAG_POOL` = Tag Authority organization-scoped read-only projection. Updated exclusively by `VS4_TAG_SUBSCRIBER`. |
| **T3** | `ORG_ELIGIBLE_MEMBER_VIEW.skills{tagSlug→xp}` is a cross-snapshot: it joins skill XP data with tag semantics. |
| **T4** | Scheduling skill requirements = `SK_SKILL_REQ × Tag Authority tagSlug`. The tagSlug in schedule always references Tag Authority. |
| **T5** | `TAG_SNAPSHOT` consumers are strictly forbidden from writing to this collection. It is a read-only projection. |

---

## S1–S6 VS0 Infrastructure Contracts

| Contract | ID | What it Prevents | What it Enables |
|----------|-----|-----------------|-----------------|
| SK_OUTBOX_CONTRACT | S1 | Duplicated at-least-once semantics across 6 outbox nodes; scattered DLQ tier definitions | Single authoritative outbox spec; new slices add outbox by referencing this contract |
| SK_VERSION_GUARD | S2 | Stale events overwriting newer projection state; #19 being enforced only on eligible-view | Universal monotonic version protection for ALL projections via FUNNEL |
| SK_READ_CONSISTENCY | S3 | STRONG_READ semantics being scattered across WALLET_AGG / QGWAY_WALLET / WALLET_PROJ | Clear decision rule for all read paths; future XP queries reference this directly |
| SK_STALENESS_CONTRACT | S4 | SLA numbers hardcoded in three separate nodes | Changing SLA requires modifying only VS0; all consumers reference constants |
| SK_RESILIENCE_CONTRACT | S5 | New entry points (Webhook/Edge Function) lacking protection standards | Auditable compliance: every entry point that reaches CBG_ENTRY must reference this contract |
| SK_TOKEN_REFRESH_CONTRACT | S6 | Token refresh handshake rules living only in VS1's node text | Three-party (VS1 ↔ IER ↔ Frontend) shared single specification for claims refresh |

---

## D1–D12 Development Rules (v9, retained)

| Rule | Description |
|------|-------------|
| **D1** | Event delivery path MUST be `Aggregate → EventBus (in-process) → OUTBOX → OUTBOX_RELAY → IER`. No direct EventBus-to-IER shortcuts. |
| **D2** | All slice public APIs are exposed only via `index.ts`. Private `_` files MUST NOT be imported across slice boundaries. |
| **D3** | `_actions.ts` is the ONLY entry point for Server Actions in a slice. |
| **D4** | `_queries.ts` is the ONLY entry point for read operations in a slice. |
| **D5** | No direct Firestore access from UI components. All reads via `_queries.ts`, all writes via `_actions.ts`. |
| **D6** | `"use client"` directive is used ONLY at leaf interaction nodes. Parent components default to Server Components. |
| **D7** | Cross-slice imports are ONLY via `{slice}/index.ts` public API. Never import `_{file}.ts` private files from another slice. |
| **D8** | `shared.kernel.*` slices contain contracts and pure functions only. No I/O, no side effects. |
| **D9** | Aggregate mutations MUST go through TX Runner (1 command / 1 aggregate — #A8). |
| **D10** | Domain Events MUST include `EventEnvelope` fields. Envelope `version` and `traceId` are immutable after `CBG_ENTRY` injection. |
| **D11** | Projection rebuilds MUST be possible from the event stream alone (#9). No projection may depend on non-event state. |
| **D12** | `SkillTier` is computed by `getTier(xp)` — a pure function. NEVER store tier values in the database (#12). |

---

## D13–D18 Development Rules (v10 additions)

| Rule | Contract | Description |
|------|----------|-------------|
| **D13** | [S1] | When adding a new Outbox, you MUST declare its DLQ tier in `SK_OUTBOX_CONTRACT`. You MUST NOT redefine at-least-once semantics in the Outbox node itself. The three elements (at-least-once, idempotency-key, DLQ tier declaration) are non-negotiable. |
| **D14** | [S2] | When adding a new Projection, it MUST be registered with the FUNNEL which applies `SK_VERSION_GUARD`. You MUST NOT skip `aggregateVersion` comparison and write directly. Stale events must be discarded. |
| **D15** | [S3] | For every new read use-case, consult `SK_READ_CONSISTENCY` first. Financial transactions, authorization checks, and irreversible operations → `STRONG_READ` (route to Aggregate). All display/statistics/listing scenarios → `EVENTUAL_READ` (route to Projection). |
| **D16** | [S4] | SLA numbers are FORBIDDEN in node/component text. All staleness values MUST reference `SK_STALENESS_CONTRACT` constants (`TAG_MAX_STALENESS`, `PROJ_STALE_CRITICAL`, `PROJ_STALE_STANDARD`). |
| **D17** | [S5] | Any new external trigger entry point (Webhook, Edge Function, scheduled job) that is NOT `_actions.ts` MUST be reviewed against `SK_RESILIENCE_CONTRACT` (rate-limit + circuit-break + bulkhead) before going to production. |
| **D18** | [S6] | Any change to Claims refresh logic MUST be coordinated using `SK_TOKEN_REFRESH_CONTRACT` as the single specification. All three parties (VS1 claims handler, IER CRITICAL_LANE, Frontend token listener) MUST be updated simultaneously. |

---

## IER Full Routing Table

| Lane | Event | Target Handler | Reference |
|------|-------|----------------|-----------|
| **CRITICAL** | `RoleChanged` | `CLAIMS_HANDLER` [S6][E6] + `TOKEN_REFRESH_SIGNAL` | SK_TOKEN_REFRESH_CONTRACT |
| **CRITICAL** | `PolicyChanged` | `CLAIMS_HANDLER` [S6][E6] + `TOKEN_REFRESH_SIGNAL` | SK_TOKEN_REFRESH_CONTRACT |
| **CRITICAL** | `WalletDeducted` | `FUNNEL` → CRITICAL_PROJ_LANE | SK_READ_CONSISTENCY |
| **CRITICAL** | `WalletCredited` | `FUNNEL` → CRITICAL_PROJ_LANE | SK_READ_CONSISTENCY |
| **CRITICAL** | `OrgContextProvisioned` | `ORG_CONTEXT_ACL` [E2] | #10 |
| **STANDARD** | `SkillXpAdded` | `FUNNEL` → CRITICAL_PROJ_LANE [P2] | #11, #12 |
| **STANDARD** | `SkillXpDeducted` | `FUNNEL` → CRITICAL_PROJ_LANE [P2] | #11, #12 |
| **STANDARD** | `ScheduleAssigned` | `NOTIF_ROUTER` + `FUNNEL` [E3] | #14, #15 |
| **STANDARD** | `ScheduleProposed` | `ORG_SCHEDULE` Saga [A5] | #A5 |
| **STANDARD** | `MemberJoined` | `FUNNEL` [#16] | #15, #16 |
| **STANDARD** | `MemberLeft` | `FUNNEL` [#16] | #15, #16 |
| **STANDARD** | All Domain Events | `FUNNEL` [#9] | #9 |
| **BACKGROUND** | `TagLifecycleEvent` | `FUNNEL` + `VS4_TAG_SUBSCRIBER` [T1][R3] | T1, T2 |
| **BACKGROUND** | `AuditEvents` | `AUDIT_COLLECTOR` [Q5] | Q5, R8 |
