# Domain Glossary

> **SSOT ownership**: `docs/logic-overview.md` (architecture) · `docs/domain-glossary.md` (vocabulary) · `docs/schema-definition.md` (TypeScript contracts)
> Canonical vocabulary for all domain entities, events, projections, and invariants. No synonyms — use identifiers exactly as listed.

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
| `workspace-scope-guard-view` | CRITICAL | ≤ 500ms | Authorization fast-path (#A9). Consumed by `CBG_AUTH`. Written by `projection.workspace-scope-guard`. |
| `org-eligible-member-view` | CRITICAL | ≤ 500ms | Schedule eligibility snapshot. Skills cross-snapshot (T3). Version monotonic (#19). |
| `wallet-balance` | CRITICAL | ≤ 500ms | Display-only wallet. Precise transactions use STRONG_READ directly on `account-user.wallet` aggregate [S3]. |
| `workspace-view` | STANDARD | ≤ 10s | Workspace list and status display. |
| `account-schedule` | STANDARD | ≤ 10s | Per-account assigned schedule view. |
| `account-view` | STANDARD | ≤ 10s | Account profile. Exposes FCM Token for notification routing (#6). |
| `organization-view` | STANDARD | ≤ 10s | Organization display data. |
| `account-skill-view` | STANDARD | ≤ 10s | Per-account skill XP + Tier (derived, not stored #12). |
| `account-audit` | STANDARD | ≤ 10s | Per-account audit log entries. Every record contains `traceId` [R8]. Written by `projection.account-audit`. |
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

| # | Constraint |
|---|------------|
| **#1** | Each BC modifies ONLY its own Aggregates. |
| **#2** | Cross-BC: ONLY via Domain Event, Projection read, or ACL. |
| **#3** | Application Layer coordinates only — domain logic lives in Aggregates. |
| **#4** | Domain Events produced by Aggregates only. TX Runner delivers to Outbox — MUST NOT create events. |
| **#5** | Custom Claims = snapshot. NOT authoritative permission source. |
| **#6** | Notification Router reads ONLY Projection data — MUST NOT query Aggregates. |
| **#7** | Scope Guard reads ONLY its own Context Read Model. |
| **#8** | Shared Kernel dependencies MUST be explicitly labelled. |
| **#9** | Every Projection MUST be fully rebuildable from its event stream. |
| **#10** | Requiring another module's internal context = boundary design error. |
| **#11** | XP belongs to Account BC. Org BC declares thresholds only — MUST NOT own XP. |
| **#12** | `SkillTier` is ALWAYS derived by `resolveSkillTier(xp)`. NEVER persisted. |
| **#13** | Every XP mutation MUST write `SkillXpLedgerEntry` with `sourceId` first. |
| **#14** | Schedule assignment MUST read only `ORG_ELIGIBLE_MEMBER_VIEW`. Direct aggregate queries forbidden. |
| **#15** | `eligible` lifecycle: `MemberJoined`→`true`; `ScheduleAssigned`→`false`; `ScheduleCompleted/Cancelled`→`true`. |
| **#16** | Talent Repository = Member + Partner + Team. All three included in `ORG_ELIGIBLE_MEMBER_VIEW`. |
| **#17** | `centralized-tag.aggregate` is SOLE authority for `tagSlug`. No other aggregate may define tag semantics. |
| **#18** | `workspace-governance.role` inherits `org-governance.policy` hard constraints. Workspace CANNOT override org policy. |
| **#19** | ALL Projection updates MUST satisfy `event.aggregateVersion > view.lastProcessedVersion`. Stale events discarded. |

---

## #A1–#A11 Atomicity Audit

| # | Constraint |
|---|------------|
| **#A1** | `account-user.wallet` requires STRONG_READ. Profile and notification are weakly consistent. |
| **#A2** | `organization-account.binding` communicates ONLY via ACL / Projection anti-corruption. |
| **#A3** | `blockWorkflow` inserts `issueId` into `blockedBy`. `unblockWorkflow` requires `blockedBy.isEmpty()`. Only `IssueResolved` event triggers `blockedBy.delete()`. |
| **#A4** | `ParsingIntent` may ONLY emit proposal events. MUST NOT directly mutate task/finance state. |
| **#A5** | Schedule cross-BC assignment uses Saga + compensating events (`ScheduleAssignRejected`, `ScheduleProposalCancelled`). |
| **#A6** | `CENTRALIZED_TAG_AGGREGATE` is SOLE semantic authority. No other aggregate may create or redefine `tagSlug`. |
| **#A7** | `event-funnel` composes/routes ONLY. MUST NOT apply domain logic or transform event payload. |
| **#A8** | TX Runner commits exactly 1 command to 1 aggregate per transaction. Multi-aggregate TX forbidden. |
| **#A9** | Scope Guard fast path: reads `workspace-scope-guard-view`. High-risk operations: re-source from aggregate. |
| **#A10** | `notification-router` is stateless. Routes by `TargetAccountID` only — no state accumulation. |
| **#A11** | `eligible` = "no conflicting schedule assignment" — dynamic snapshot, NOT a static status flag. |

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

## v11 Semantic Tag Entities (TE1–TE6)

Six AI-ready semantic tag entity nodes defined in `TAG_ENTITIES` (CTA). All cross-slice tag references **must** point to these nodes (D22). Slices must not create their own semantic tag categories (D21).

| Entity | Tag Category | `tagSlug` Format | Referenced By |
|--------|-------------|-----------------|---------------|
| `TAG_USER_LEVEL` (TE1) | `user_level` | `user-level:{slug}` | account-organization.member |
| `TAG_SKILL` (TE2) | `skill` | `skill:{slug}` | account-skill, org-eligible-member-view |
| `TAG_SKILL_TIER` (TE3) | `skill_tier` | `skill-tier:{tier}` | account-skill, org-eligible-member-view |
| `TAG_TEAM` (TE4) | `team` | `team:{slug}` | account-organization.team |
| `TAG_ROLE` (TE5) | `role` | `role:{slug}` | account-governance.role, workspace-governance.role, account-organization.member |
| `TAG_PARTNER` (TE6) | `partner` | `partner:{slug}` | account-organization.partner |

> **D23 annotation format**: node text `→ tag::{category} [{NODE_NAME}]`; semantic edge `-.->|"{dim} tag 語義"| NODE_NAME`.
