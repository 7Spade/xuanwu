# Architecture Consistency Audit Report

**Audited against:** `docs/architecture/00-LogicOverview.md` (v2 SSOT, 1239 lines)  
**Codebase root:** `src/features/`  
**Generated:** 2026-03-07  
**Auditor:** GitHub Copilot Architecture Agent (x-repomix-skill-generate-and-logic-overview-audit-v0)

---

## Executive Summary

| Category | Count | Severity |
|---|---|---|
| A – Missing Elements | 7 | 🔴 Critical / 🟠 High |
| B – Misplaced Elements | 3 | 🟠 High |
| C – Naming Inconsistencies | 3 | 🟡 Medium |
| D – Boundary Violations | 8 | 🔴 Critical |
| E – Event Flow Gaps | 5 | 🔴 Critical |
| F – Responsibility Violations | 5 | 🟠 High |
| **Total** | **31** | |

---

## CATEGORY A — Missing Elements

> Features, domain modules, or infrastructure layers required by architecture but absent in the codebase.

---

### A-01 🔴 VS2 Account Slice — Missing `account-event-bus` and `acc-outbox`

**Rules:** `S1` (OUTBOX-contract), `E5`, `R5` (DLQ-failure-rule)  
**Files missing:**
- `src/features/account.slice/account-event-bus.ts`
- `src/features/account.slice/acc-outbox.ts`

**Description:**  
Architecture requires VS2 to have an in-process `account-event-bus` and a Firestore-backed `acc-outbox` with:
- **CRITICAL_LANE** for `RoleChanged`, `PolicyChanged`, `WalletDeducted/Credited`
- **STANDARD_LANE** for `AccountCreated`
- **DLQ tiers:** `SECURITY_BLOCK` (RoleChanged/PolicyChanged), `REVIEW_REQUIRED` (WalletDeducted), `SAFE_AUTO` (AccountCreated)

The codebase has no `account-event-bus` or `acc-outbox` at all. Domain events for VS2 (`RoleChanged`, `AccountCreated`, `WalletDeducted`) are either missing or published ad-hoc with no at-least-once delivery guarantee. This is the most critical gap because `RoleChanged → CRITICAL_LANE → claims-refresh-handler [S6]` is the security-sensitive token refresh chain.

**Suggested Fix:**
```
src/features/account.slice/
  account-event-bus.ts       // in-process bus (mirrors org-event-bus pattern)
  acc-outbox.ts              // Firestore outbox writer (mirrors workspace _outbox.ts)
```
Events emitted in `gov.role/_actions.ts` and `gov.policy/_actions.ts` must write to `acc-outbox` instead of (or in addition to) any direct bus calls. The outbox-relay will then deliver to IER CRITICAL_LANE.

---

### A-02 🔴 VS3 Skill XP Slice — Missing `skill-outbox`

**Rules:** `S1`, `R1` (relay-lag-metrics), `E5`  
**File missing:** `src/features/skill-xp.slice/skill-outbox.ts`

**Description:**  
Architecture specifies `skill-outbox [SK_OUTBOX: SAFE_AUTO] → IER STANDARD_LANE`. Currently `skill-xp.slice/_actions.ts` calls `publishOrgEvent('organization:skill:xpAdded', ...)` directly — an in-process call to VS4's event bus. There is no Firestore persistence layer for `SkillXpAdded`/`SkillXpDeducted` events.

If the process crashes after the database write but before `publishOrgEvent`, the event is silently lost. The `org-eligible-member-view` projection will never receive the update.

**Suggested Fix:**  
Create `skill-outbox.ts` following `workspace.slice/application/_outbox.ts` pattern. After XP ledger write, persist to `skillOutbox/{id}` with `dlqTier: 'SAFE_AUTO'`, `lane: 'STANDARD_LANE'`. Remove direct `publishOrgEvent` calls from `_actions.ts`.

---

### A-03 🔴 VS6 Workforce-Scheduling Slice — Missing `sched-outbox`

**Rules:** `S1`, `R5`, `A5` (scheduling-saga), `E3`  
**File missing:** `src/features/workforce-scheduling.slice/sched-outbox.ts`

**Description:**  
Architecture specifies:
```
sched-outbox [SK_OUTBOX: S1]
  DLQ: ScheduleAssigned → REVIEW_REQUIRED
       Compensating Events → SAFE_AUTO
```
Instead, `_aggregate.ts` calls `publishOrgEvent(...)` directly for **every schedule lifecycle event** including `ScheduleAssigned`. Since `ScheduleAssigned` maps to `REVIEW_REQUIRED` DLQ tier, bypassing the outbox means financial/scheduling events lose human-review fallback on failure.

**Suggested Fix:**  
Create `sched-outbox.ts`. In `_aggregate.ts`, replace all `await publishOrgEvent(...)` calls with writes to the sched-outbox collection. The outbox-relay will deliver to IER STANDARD_LANE. The notification-hub `NOTIF_R` then subscribes to IER (not directly to the org event bus).

---

### A-04 🟠 VS4 Organization Slice — Missing `org-skill-recognition.aggregate`, `talent-repository`, `tag-lifecycle-subscriber`, `skill-tag-pool`

**Rules:** `T1` (tag-lifecycle-sub), `T3` (eligible-tag-logic), `#11`, `#16`  
**Files missing:** Sub-modules in `src/features/organization.slice/`

**Description:**  
Architecture requires VS4 to contain:
- `org-skill-recognition.aggregate` (minXpRequired / status [#11])
- `talent-repository [#16]` (Member + Partner + Team → ORG_ELIGIBLE_VIEW)
- `tag-lifecycle-subscriber` (subscribes IER BACKGROUND_LANE → updates `SKILL_TAG_POOL`)
- `skill-tag-pool` (Tag Authority org-scoped snapshot, staleness ≤ 30s [S4])

None of these are present in `src/features/organization.slice/`. The org-eligible-member-view in `projection.bus/` contains some of this logic, but the domain aggregate and tag lifecycle subscription are absent.

**Suggested Fix:**  
Add these as sub-modules under `organization.slice/`. The `tag-lifecycle-subscriber` should register on IER BACKGROUND_LANE and write the `skill-tag-pool` read model. `org-skill-recognition` should be a proper aggregate with `status` field.

---

### A-05 🟠 L5 Projection Bus — Missing `schedule-timeline-view` projection

**Rules:** `L5-Bus` (Timeline constraint), `S2` (VersionGuard), `[Timeline]`  
**File missing:** `src/features/projection.bus/schedule-timeline-view/`

**Description:**  
Architecture explicitly states:
> `TL_PROJ["projection.schedule-timeline-view — 資源維度 Read Model [L5-Bus] — overlap/resource-grouping 下沉 L5"]`  
> `[Timeline] overlap/resource-grouping 邏輯下沉 L5，前端僅渲染`

The codebase has `timelineing.slice` (client-side hook) doing direct Firestore subscription. There is no pre-computed L5 projection materializing overlap detection and resource grouping. The frontend is doing resource-dimension computation that belongs in the Projection Bus.

**Suggested Fix:**  
Create `projection.bus/schedule-timeline-view/_projector.ts` that builds the resource-dimension timeline view (with pre-computed overlaps and group assignments) as a Firestore projection. `timelineing.slice` should become a pure read-side consumer of this projection, not a Firestore subscriber.

---

### A-06 🟡 VS1 Identity Slice — Missing `account-identity-link` and `context-lifecycle-manager`

**Rules:** `S6` (TokenRefresh), `ACTIVE_CTX`  
**Files:** `src/features/identity.slice/`

**Description:**  
Architecture models VS1 with:
- `authenticated-identity`
- `account-identity-link` (firebaseUserId ↔ accountId)
- `active-account-context` with TTL = Token 有效期
- `context-lifecycle-manager` (builds on Login, refreshes on OrgSwitched/WorkspaceSwitched, invalidates on TokenExpired/Logout)

The codebase only has `_claims-handler.ts` and `_token-refresh-listener.ts`. There is no explicit `active-account-context` store or `context-lifecycle-manager` coordinating the lifecycle across Login/Logout/Switch events.

**Suggested Fix:**  
Create `identity.slice/active-account-context.ts` (TTL-aware context store) and `identity.slice/context-lifecycle-manager.ts` to coordinate transitions. The `account-identity-link` mapping (firebaseUserId ↔ accountId) should be an explicit module rather than scattered query logic.

---

### A-07 🟡 L5 Projection Bus — `workspace-scope-guard-view` not funnel-wired

**Rules:** `S2` (VersionGuard), `A9` (scope-guard), `S4` (Staleness-SLA)  
**File:** `src/features/projection.bus/workspace-scope-guard/`

**Description:**  
`projection.bus/workspace-scope-guard/_projector.ts` exists but it writes directly in response to in-process events rather than being fed by the IER event-funnel. Architecture specifies all critical projections must go through `event-funnel → CRITICAL_PROJ_LANE [S4: ≤ 500ms]`. Current wiring bypasses the funnel's idempotency-key upsert (`[Q3]`) and version guard enforcement.

---

## CATEGORY B — Misplaced Elements

> Files or modules located outside their correct domain boundary.

---

### B-01 🟠 `workforce-scheduling.slice/_projectors/` — Projection types in L3 Slice instead of L5

**Rules:** `L5-Bus` (Projection Bus), `[#9]` (唯一 Projection 寫入路徑)  
**Files:**
- `src/features/workforce-scheduling.slice/_projectors/account-schedule.ts`
- `src/features/workforce-scheduling.slice/_projectors/demand-board.ts`
- `src/features/workforce-scheduling.slice/_projectors/account-schedule-queries.ts`
- `src/features/workforce-scheduling.slice/_projectors/demand-board-queries.ts`

**Description:**  
These projector files live inside the VS6 domain slice. Architecture rule `[#9]` states the Projection Bus is the unique Projection write path; query functions (database reads) should also live in `projection.bus/` or `infra.gateway-query/`. The projection write logic has been migrated to `projection.bus/account-schedule/` (as noted in comments), but the type definitions and query functions remain in VS6.

**Suggested Fix:**  
Move `_projectors/account-schedule.ts` types and query functions into `projection.bus/account-schedule/` and expose via `projection.bus/index.ts`. VS6 consumers should import from `@/features/projection.bus`, not from their own `_projectors/` sub-directory. Delete `workforce-scheduling.slice/_projectors/` entirely after migration.

---

### B-02 🟠 `timelineing.slice` — UI-layer timeline logic that belongs in L5 Projection Bus

**Rules:** `L5-Bus` (Timeline constraint), `S2`, `[Timeline]`  
**Directory:** `src/features/timelineing.slice/`

**Description:**  
The entire `timelineing.slice` is a feature slice doing client-side Firestore subscriptions for timeline data. Architecture explicitly places `overlap/resource-grouping` logic in L5 (server-computed projection), with the UI as a pure renderer. By existing as a domain slice, this code:
1. Does not enforce `S2` version-guard on projection reads
2. Computes resource-dimension logic on the client (violating `[Timeline] overlap/resource-grouping 邏輯下沉 L5`)
3. Introduces a VS dependency on `workspace.slice` from a non-VS module

**Suggested Fix:**  
Dissolve `timelineing.slice`. Move server-side overlap/grouping computation into `projection.bus/schedule-timeline-view/`. Retain only a thin React hook (`useScheduleTimeline`) in `workforce-scheduling.slice/_hooks/` that reads the pre-computed projection.

---

### B-03 🟡 `portal.slice` — No architecture designation

**Rules:** Architecture lists VS0–VS8 and L0–L9 only; no `portal` layer defined  
**Directory:** `src/features/portal.slice/`

**Description:**  
`portal.slice` has no corresponding `VS*` or `L*` designation in `00-LogicOverview.md`. It appears to be a UI routing concern. If it purely orchestrates layout/routing with no domain logic, it should live in `src/app/` (Next.js App Router) or `src/portal/` (outside `features/`). Its presence in `features/` implies domain-slice responsibilities it doesn't have.

**Suggested Fix:**  
Relocate to `src/portal/` or `src/app/` (layout + routing). If it genuinely represents a cross-cutting concern, document it as `L0 = ExternalTriggers` extension and update `00-LogicOverview.md` to acknowledge it.

---

## CATEGORY C — Naming Inconsistencies

> Naming that deviates from conventions in `00-LogicOverview.md`.

---

### C-01 🟡 `timelineing.slice` — Incorrect name (grammatical error + wrong layer)

**Rules:** Architecture uses `projection.schedule-timeline-view`, `Timeline`, `[L5-Bus]`  
**Path:** `src/features/timelineing.slice/`

**Description:**  
"Timelineing" is not a valid English word (timeline is a noun, not a verb). The architecture names this concern `projection.schedule-timeline-view` (L5) or simply `Timeline`. The `timelineing` name appears nowhere in `00-LogicOverview.md`. Even if kept as a slice, it should be `timeline.slice`.

**Suggested Fix:**  
Rename to `timeline.slice` immediately as a minimal fix. Full fix: dissolve as per B-02.

---

### C-02 🟡 VS8 `semantic-graph.slice` internal layer names diverge from architecture's 8-layer model

**Rules:** `D21` (VS8-semantic-graph-complete-body, 8-layer model)  
**Directory:** `src/features/semantic-graph.slice/`

**Description:**  
Architecture defines 8 canonical VS8 layers. Codebase uses a `centralized-*` prefix naming scheme instead:

| Architecture Layer | Architecture Name | Codebase Directory |
|---|---|---|
| Layer 1 (DNA) | `core` | `centralized-nodes/`, `centralized-tag/`, `centralized-types/` |
| Layer 2 (突觸) | `graph` | `centralized-edges/` |
| Layer 3 (反射弧) | `routing` | `centralized-workflows/` |
| Layer 4 (BBB) | `guards` | `centralized-guards/` |
| Layer 5 (學習) | `plasticity` | `centralized-learning/`, `centralized-neural-net/` |
| Layer 6 (讀側) | `projections` | `projections/` ✓ |
| Layer 7 (維基治理) | `ui` | `wiki-editor/` |
| Layer 8 (訂閱廣播) | `io` | `subscribers/`, `outbox/` |

The `centralized-*` prefix pattern creates ambiguity and diverges from the spec naming used in reviews and documentation.

**Suggested Fix:**  
Either update `00-LogicOverview.md` to canonize the `centralized-*` naming, or align directories to the 8-layer names. At minimum, add a `README.md` inside `semantic-graph.slice/` mapping each `centralized-*` folder to its architecture layer.

---

### C-03 🟡 Duplicate `context-attention.ts` — violates `D21-U` (禁止重複定義)

**Rules:** `D21-U` (禁止重複定義)  
**Files:**
- `src/features/semantic-graph.slice/centralized-neural-net/context-attention.ts` (deprecated shim, ~9 lines)
- `src/features/semantic-graph.slice/centralized-edges/context-attention.ts` (canonical, ~72 lines)

**Description:**  
`centralized-neural-net/context-attention.ts` is a `@deprecated backward-compatibility re-export shim`. It still exists as a file, violating `D21-U`: "禁止重複定義". The shim has no active consumers but adds confusion about which is authoritative.

**Suggested Fix:**  
Delete `centralized-neural-net/context-attention.ts`. Update any remaining import paths to point to `centralized-edges/context-attention`. Verify with:
```bash
grep -r "centralized-neural-net/context-attention" src/
```

---

## CATEGORY D — Boundary Violations

> Illegal cross-slice imports, direct Firebase access bypassing FIREBASE_ACL [D24], or logic outside its designated layer.

---

### D-01 🔴 `workforce-scheduling.slice/_aggregate.ts` → `organization.slice` (cross-slice mutate)

**Rules:** `D9` (cross-slice mutate forbidden), `S1` (outbox required), `#2` (Producer-only)  
**File:** `src/features/workforce-scheduling.slice/_aggregate.ts`  
**Lines:** 29, 196, 229, 272, 323, 381

```typescript
// Line 29 — VIOLATION
import { publishOrgEvent } from '@/features/organization.slice';

// Lines 196, 229, 272, 323, 381 — VIOLATION: Direct mutation of VS4 state
await publishOrgEvent('organization:schedule:assigned', { ... });
await publishOrgEvent('organization:schedule:assignRejected', { ... });
await publishOrgEvent('organization:schedule:proposalCancelled', { ... });
```

**Description:**  
VS6's `org.schedule.aggregate` directly calls VS4's `publishOrgEvent`. Architecture rule: `BC_X 禁止直接寫入 BC_Y aggregate → 必須透過 IER Domain Event`. The VS6 aggregate is mutating VS4's in-process state. VS4's event bus is the only communication target here — there is no IER intermediary, no outbox persistence.

**Suggested Fix:**
1. Create `sched-outbox.ts` in VS6 (see A-03)
2. Replace `await publishOrgEvent(...)` with `await persistToSchedOutbox(eventType, payload, 'REVIEW_REQUIRED')`
3. Outbox-relay delivers to IER → VS4 event bus subscribers

---

### D-02 🔴 `skill-xp.slice/_actions.ts` and `_org-recognition.ts` → `organization.slice` (cross-slice mutate)

**Rules:** `D9`, `S1`, `#2`  
**Files:**
- `src/features/skill-xp.slice/_actions.ts` lines 22, 62, 107
- `src/features/skill-xp.slice/_org-recognition.ts` lines 30, 119, 148

```typescript
// VIOLATION in both files
import { publishOrgEvent } from '@/features/organization.slice';
await publishOrgEvent('organization:skill:xpAdded', { ... });
```

**Description:**  
VS3 Skill XP slice directly calls VS4's event bus after ledger writes. Same violation type as D-01. Architecture flow should be: `VS3 Aggregate → skill-outbox → IER STANDARD_LANE → VS4 event bus consumer`.

**Suggested Fix:**  
Create `skill-outbox.ts` in `skill-xp.slice`. Replace `publishOrgEvent` calls with outbox persistence. The skill events should flow through IER STANDARD_LANE.

---

### D-03 🔴 `account.slice/gov.role/_actions.ts` → `organization.slice` (cross-slice mutate)

**Rules:** `D9`, `S1`  
**File:** `src/features/account.slice/gov.role/_actions.ts` lines 24, 78, 120

```typescript
// VIOLATION
import { publishOrgEvent } from '@/features/organization.slice';
await publishOrgEvent('organization:member:joined', { ... });
await publishOrgEvent('organization:member:left', { ... });
```

**Description:**  
VS2 Account governance publishing `MemberJoined`/`MemberLeft` directly into VS4's event bus. These are critical org membership events that should flow through `acc-outbox → IER CRITICAL_LANE`.

**Suggested Fix:**  
Create `acc-outbox.ts` (A-01). Route all `publishOrgEvent` calls from VS2 through the account outbox.

---

### D-04 🔴 `workspace.slice/core/workspace-provider.tsx` → `workforce-scheduling.slice` (direct cross-slice command)

**Rules:** `D9`, `L3 Slice ↔ L3 Slice = 禁止直接 mutate`  
**File:** `src/features/workspace.slice/core/_components/workspace-provider.tsx` lines 10–11, 225–232

```typescript
// VIOLATION
import {
  createScheduleItem as createScheduleItemAction,
} from '@/features/workforce-scheduling.slice'

// Direct VS5 → VS6 invocation
const result = await createScheduleItemAction(itemData);
```

**Description:**  
VS5 `workspace-provider.tsx` directly invokes a VS6 server action (`createScheduleItemAction`). Architecture: L3 slices may not directly mutate other L3 slices; cross-slice coordination must go through IER. This is especially problematic because VS6 is a governance-level domain (scheduling approval workflow with compensating events [A5]).

**Suggested Fix:**  
Route the `workspace:schedule:proposed` event through IER instead. VS5 should emit the event to its own outbox (`ws-outbox`), the outbox-relay delivers to IER STANDARD_LANE, VS6's `workforce-scheduling-saga` subscribes and calls `createScheduleItem` internally.

---

### D-05 🟠 `workforce-scheduling.slice/_components/org-skill-pool-manager.tsx` → `skill-xp.slice`

**Rules:** `D7` (cross-slice-index-only), `D9`  
**File:** `src/features/workforce-scheduling.slice/_components/org-skill-pool-manager.tsx` lines 25–26

```typescript
// VIOLATION: VS6 calling VS3 domain actions directly
import { addOrgSkillTagAction, removeOrgSkillTagAction } from '@/features/skill-xp.slice';
import { getOrgSkillTags } from '@/features/skill-xp.slice';
```

**Description:**  
VS6 UI component directly invokes VS3 skill-tag management actions. Skill tag pool management belongs to VS4's `skill-tag-pool` (per architecture: `[S4: TAG_MAX_STALENESS ≤ 30s]`). This import couples a scheduling UI component to a skill-management domain.

**Suggested Fix:**  
`addOrgSkillTagAction`/`removeOrgSkillTagAction` should be accessed via VS4 `organization.slice` (which coordinates skill pool management via `org.binding [ACL #A2]`), or via the command gateway routing to the correct slice. VS6 should not import VS3 actions directly.

---

### D-06 🟠 `workspace.slice/application/_org-policy-cache.ts` → `organization.slice` (direct IER bypass)

**Rules:** `E2` (OrgContextProvisioned via IER), `D9`  
**File:** `src/features/workspace.slice/application/_org-policy-cache.ts` lines 18–19

```typescript
// VIOLATION: subscribes to VS4 in-process bus instead of IER CRITICAL_LANE
import type { OrgPolicyChangedPayload } from '@/features/organization.slice';
import { onOrgEvent } from '@/features/organization.slice';
```

**Description:**  
Architecture shows `ORG_ACL["org-context.acl [E2] — IER OrgContextProvisioned → Workspace 本地 Context"]`. The workspace org-policy ACL should consume `OrgContextProvisioned` from IER CRITICAL_LANE (for guaranteed delivery with at-least-once semantics), not subscribe directly to the VS4 in-process event bus which has no delivery guarantees across process boundaries.

**Suggested Fix:**  
Register this listener on IER CRITICAL_LANE via `registerSubscriber` (from `infra.event-router`). Remove the direct `onOrgEvent` subscription.

---

### D-07 🟡 `workspace.slice/core/workspace-provider.tsx` → `notification-hub.slice` (cross-slice bootstrapping)

**Rules:** `A13` (notification-hub-authority), `D26`  
**File:** `src/features/workspace.slice/core/_components/workspace-provider.tsx` lines 8, 101

```typescript
// VIOLATION
import { initTagChangedSubscriber } from '@/features/notification-hub.slice';
const unsubNotif = initTagChangedSubscriber();
```

**Description:**  
Architecture [A13]: "Notification Hub = 唯一副作用出口，業務 Slice 只產生事件不決定通知策略". VS5 should not manage VS7's lifecycle. Notification hub should self-register via app-level bootstrap (root layout or app-provider).

**Suggested Fix:**  
Move `initTagChangedSubscriber()` call to the application root level (`src/app/` layout or `app-runtime/providers/app-provider.tsx`), outside of any domain slice provider.

---

### D-08 🟡 `workspace-provider.tsx:234` — `traceId` injected outside `CBG_ENTRY`

**Rules:** `R8` (traceId-readonly — 唯一注入點 at `CBG_ENTRY`)  
**File:** `src/features/workspace.slice/core/_components/workspace-provider.tsx` line 234

```typescript
// VIOLATION: traceId must ONLY be injected at CBG_ENTRY (infra.gateway-command)
const traceId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
```

**Description:**  
Architecture invariant `[R8]`: "traceId 在 CBG_ENTRY 注入一次，全鏈唯讀不可覆蓋". `CBG_ENTRY` is `infra.gateway-command/_gateway.ts`. A second injection point in `workspace-provider.tsx` violates the uniqueness invariant and could produce conflicting traceIds for the same command chain.

**Suggested Fix:**  
Route the `workspace:schedule:proposed` event through `infra.gateway-command` (the command gateway). The gateway injects the traceId canonically. Remove the manual `crypto.randomUUID()` call from the UI provider.

---

## CATEGORY E — Event Flow Gaps

> Missing or incorrect use of outbox, IER lanes, or event routing.

---

### E-01 🔴 VS6/VS3/VS2 bypass Firestore-backed outbox — no at-least-once delivery guarantee

**Rules:** `S1` (OUTBOX-contract), `R1` (relay-lag-metrics), `R5` (DLQ-failure-rule)  
**Files:** Multiple (see D-01, D-02, D-03)

**Description:**  
Three slices (VS6 workforce-scheduling, VS3 skill-xp, VS2 account governance) publish domain events directly to VS4's in-process event bus via `publishOrgEvent(...)`. This in-process call is fire-and-forget with **no Firestore persistence**. The `infra.outbox-relay` scanner has nothing to pick up for these slices.

**Consequences:**
- Process crash between aggregate write and `publishOrgEvent` → event silently lost
- No DLQ classification for `ScheduleAssigned` (should be `REVIEW_REQUIRED`)
- `RoleChanged → CRITICAL_LANE → Claims refresh [S6]` chain is unguaranteed
- `outbox-relay` relay-lag metrics (`R1`) cannot monitor these slices

**Fix:** As per A-01, A-02, A-03 — add Firestore-backed outboxes for all three slices.

---

### E-02 🔴 VS7 `notification-router` consumes VS4 in-process bus instead of IER STANDARD_LANE

**Rules:** `E3` (ScheduleAssigned via IER), `S1`, `D26`  
**File:** `src/features/notification-hub.slice/gov.notification-router/_router.ts` line 19

```typescript
// VIOLATION: should subscribe to IER STANDARD_LANE, not VS4 direct bus
import { onOrgEvent } from '@/features/organization.slice';
```

**Description:**  
Architecture event flow `[E3]`: `STD_LANE → ScheduleAssigned → NOTIF_R`. The `notification-router` must consume `ScheduleAssigned` from IER STANDARD_LANE to benefit from at-least-once delivery, traceId propagation `[R8]`, and lane priority `[P1]`. Currently it subscribes to the VS4 in-process bus — if `ScheduleAssigned` was written to `sched-outbox`, this router would miss it entirely.

**Suggested Fix:**
1. Fix E-01/A-03 first (create sched-outbox so ScheduleAssigned flows through IER)
2. Migrate the notification-router to consume from IER STANDARD_LANE via `registerSubscriber`
3. Delete `gov.notification-router/_router.ts` and replace with an IER subscriber registration in `notification-hub.slice/_actions.ts`

---

### E-03 🔴 `workspace:schedule:proposed` traceId chain broken — injected at wrong layer

**Rules:** `R8`, `A5` (scheduling-saga)  
**File:** `src/features/workspace.slice/core/_components/workspace-provider.tsx:234`

**Description:**  
The scheduling saga chain `[A5]` requires a single `traceId` injected at `CBG_ENTRY` to propagate: `WorkspaceScheduleProposed → ScheduleAssigned → IER envelope → NOTIF_R`. Currently the traceId is generated in the UI layer (workspace-provider), bypassing the command gateway's canonical injection point. This means the envelope traceId is **not** set by the authoritative `CBG_ENTRY`.

---

### E-04 🟠 VS4 `org-outbox` not implemented — `OrgContextProvisioned → CRITICAL_LANE` flow unimplemented

**Rules:** `E2`, `S1`, CRITICAL_LANE for `OrgContextProvisioned`  
**Files:** `src/features/organization.slice/` (no outbox file)

**Description:**  
Architecture: `ORG_OB["org-outbox [SK_OUTBOX: S1] — DLQ: OrgContextProvisioned → REVIEW_REQUIRED"]` with `CRITICAL_LANE: OrgContextProvisioned`. No `org-outbox.ts` file exists. `OrgContextProvisioned` is critical for workspace provisioning [E2] — loss means workspaces can be created without org context.

**Suggested Fix:**  
Create `organization.slice/org-outbox.ts` mirroring workspace `_outbox.ts`. Wire `org.core/_actions.ts` to write `OrgContextProvisioned` to the outbox before completing.

---

### E-05 🟡 `projection.bus/_workspace-funnel.ts` directly calls `handleScheduleProposed` (VS6 action)

**Rules:** `[#9]` (event-funnel is unique write path), `D9`  
**File:** `src/features/projection.bus/_workspace-funnel.ts` line 8

```typescript
// Projection Bus calling a VS6 domain action directly
import { handleScheduleProposed } from '@/features/workforce-scheduling.slice';
```

**Description:**  
The Projection Bus (L5) is calling a domain command in VS6. Architecture rule `[#9]`: the event-funnel is the unique Projection write path. L5 should only write projections, not invoke domain commands. This inverts the dependency — L5 should consume events, not orchestrate domain logic.

**Suggested Fix:**  
`handleScheduleProposed` should be triggered by the workforce-scheduling-saga subscribing to IER STANDARD_LANE (`ScheduleProposed` event), not by the Projection Bus. Remove this import from `_workspace-funnel.ts`.

---

## CATEGORY F — Responsibility Violations

> Side-effects not via VS7 notification-hub, semantic tags outside VS8, cost-semantic logic duplicated outside VS8 [D27].

---

### F-01 🔴 VS6 has its own `policy-mapper/` — duplicates VS8's authoritative `D27-A` implementation

**Rules:** `D27-A` (語義感知路由 — must use `policy-mapper/` in VS8), `D21-U` (禁止重複定義)  
**Files:**
- `src/features/workforce-scheduling.slice/policy-mapper/index.ts` (VS6)
- `src/features/semantic-graph.slice/centralized-workflows/policy-mapper/index.ts` (VS8 — authoritative)

**Description:**  
Architecture `[D27-A]`: "所有分發邏輯必須先調用 policy-mapper/ 轉換語義標籤，禁止 ID 硬編碼路由". VS8 owns the authoritative `policy-mapper`. VS6 has built its own with different semantics (returns `AssignmentPolicy` with `strategy: 'open'|'tier-gated'|'skill-gated'`) while VS8's version returns `DispatchPolicy`. Two independently evolving policy mappers create semantic divergence over time.

**Suggested Fix:**  
Merge the VS6 logic into VS8's `centralized-workflows/policy-mapper/`. VS6 scheduling should call the VS8 policy-mapper for candidate selection. Delete `workforce-scheduling.slice/policy-mapper/`.

---

### F-02 🟠 `business.finance/_constants.ts` defines `NON_TASK_COST_ITEM_TYPES` — cost-semantic in VS5

**Rules:** `D27` (cost-semantic-routing), `#A14`, `#A13`  
**File:** `src/features/workspace.slice/business.finance/_constants.ts` lines 22–29

```typescript
// VIOLATION: VS5 Finance re-classifying cost items that belong to VS8
export const NON_TASK_COST_ITEM_TYPES: ReadonlySet<CostItemTypeValue> = new Set<CostItemTypeValue>([
  CostItemType.MANAGEMENT,
  CostItemType.RESOURCE,
  CostItemType.FINANCIAL,
  CostItemType.PROFIT,
  CostItemType.ALLOWANCE,
]);
```

**Description:**  
Architecture [#A14]: "Layer-3 Semantic Router 只允許 EXECUTABLE 項目物化為 tasks，其餘類型靜默跳過". This classification (which types are non-task) is cost-semantic logic that belongs exclusively in VS8's `_cost-classifier.ts`. VS5 Finance defining its own `NON_TASK_COST_ITEM_TYPES` set means two places determine which items are non-executable — a drift risk.

**Suggested Fix:**  
VS8 `_cost-classifier.ts` should export a `NON_EXECUTABLE_COST_TYPES` constant (or a `isExecutableCostType(type)` function). VS5 `business.finance/_constants.ts` should import and re-export it from VS8 rather than hard-coding the set.

---

### F-03 🟠 `workspace-provider.tsx` bootstraps VS7 (notification-hub) — violates A13

**Rules:** `A13` (notification-hub-authority), `D26`  
**File:** `src/features/workspace.slice/core/_components/workspace-provider.tsx` lines 8, 101

Already detailed in D-07. The responsibility violation: VS5 is deciding **when** the notification authority (VS7) is mounted. This couples VS7's lifecycle to VS5's lifecycle, violating VS7's cross-cutting authority independence.

**Suggested Fix:**  
VS7 should self-initialize via a root-level provider (`src/app/layout.tsx` or `app-runtime/providers/app-provider.tsx`). VS5 must not own VS7 lifecycle.

---

### F-04 🟡 `notification-hub.slice/gov.notification-router/_router.ts` — ID-based routing instead of semantic tag-aware routing

**Rules:** `A13`, `D26`, `D27-A` (semantic-aware routing)  
**File:** `src/features/notification-hub.slice/gov.notification-router/_router.ts`

**Description:**  
The router delivers notifications by matching event payload directly (`payload.targetAccountId`). Architecture requires VS7 to use VS8 semantic index for tag-aware routing decisions: `#channel:slack → Slack`, `#urgency:high → 電話`. The current implementation is ID-based routing, not semantic tag routing — violating `D27-A`.

**Suggested Fix:**  
`notification-hub.slice/_services.ts` should invoke VS8's `policy-mapper` before delivery to determine the correct channel strategy. Routing should be: `event → policy-mapper(semanticTagSlug) → channel strategy → delivery`.

---

### F-05 🟡 `workspace-provider.tsx:30` injects `writeAuditLog` directly — audit responsibility violation

**Rules:** `AUDIT_COL` (audit-event-collector subscribes IER BACKGROUND_LANE), `[#9]`  
**File:** `src/features/workspace.slice/core/_components/workspace-provider.tsx` line 30

```typescript
import { writeAuditLog } from '@/features/workspace.slice/gov.audit/_actions';
```

**Description:**  
Architecture specifies `AUDIT_COL["audit-event-collector — 訂閱 IER BACKGROUND_LANE → GLOBAL_AUDIT_VIEW"]`. Audit events should be produced automatically as a side-effect of events flowing through IER BACKGROUND_LANE, not manually injected from the workspace provider. Direct `writeAuditLog` calls in the UI provider layer bypass the proper audit trail.

**Suggested Fix:**  
Register an audit event subscriber on IER BACKGROUND_LANE in `gov.audit`. The workspace provider should emit standard domain events (which flow through IER) rather than calling `writeAuditLog` directly.

---

## Summary Table

| # | Category | Severity | Rule(s) | File(s) |
|---|---|---|---|---|
| A-01 | Missing | 🔴 Critical | S1, E5, R5 | `account.slice/` — no acc-outbox |
| A-02 | Missing | 🔴 Critical | S1, R1, E5 | `skill-xp.slice/` — no skill-outbox |
| A-03 | Missing | 🔴 Critical | S1, R5, A5, E3 | `workforce-scheduling.slice/` — no sched-outbox |
| A-04 | Missing | 🟠 High | T1, T3, #11, #16 | `organization.slice/` — no talent-repo, tag-lifecycle-sub, skill-tag-pool |
| A-05 | Missing | 🟠 High | L5-Bus, S2 | `projection.bus/` — no `schedule-timeline-view` |
| A-06 | Missing | 🟡 Medium | S6, ACTIVE_CTX | `identity.slice/` — no context-lifecycle-manager |
| A-07 | Missing | 🟡 Medium | S2, A9, S4 | `projection.bus/workspace-scope-guard` — not funnel-wired |
| B-01 | Misplaced | 🟠 High | L5-Bus, #9 | `workforce-scheduling.slice/_projectors/` → should be in `projection.bus/` |
| B-02 | Misplaced | 🟠 High | L5-Bus, S2 | `timelineing.slice/` → should be in `projection.bus/schedule-timeline-view` |
| B-03 | Misplaced | 🟡 Medium | VS0-VS8 scope | `portal.slice/` → no VS/L designation |
| C-01 | Naming | 🟡 Medium | L5-Bus, [Timeline] | `timelineing.slice` → should be `timeline.slice` or dissolved |
| C-02 | Naming | 🟡 Medium | D21 (8-layer) | `semantic-graph.slice/centralized-*` → diverges from architecture layer names |
| C-03 | Naming | 🟡 Medium | D21-U | Duplicate `context-attention.ts` in `centralized-neural-net/` (deprecated shim) |
| D-01 | Boundary | 🔴 Critical | D9, S1, #2 | `workforce-scheduling/_aggregate.ts:29,196,229,272,323,381` → `publishOrgEvent` |
| D-02 | Boundary | 🔴 Critical | D9, S1 | `skill-xp.slice/_actions.ts:22,62,107` and `_org-recognition.ts:30,119,148` |
| D-03 | Boundary | 🔴 Critical | D9, S1 | `account.slice/gov.role/_actions.ts:24,78,120` → `publishOrgEvent` |
| D-04 | Boundary | 🔴 Critical | D9, L3↔L3 | `workspace-provider.tsx:10-11` → `createScheduleItem` from VS6 |
| D-05 | Boundary | 🟠 High | D7, D9 | `org-skill-pool-manager.tsx:25-26` → VS3 actions from VS6 |
| D-06 | Boundary | 🟠 High | E2, D9 | `_org-policy-cache.ts:18-19` → `onOrgEvent` direct subscription |
| D-07 | Boundary | 🟡 Medium | A13, D26 | `workspace-provider.tsx:8,101` → `initTagChangedSubscriber` from VS7 |
| D-08 | Boundary | 🟡 Medium | R8 (唯一注入點) | `workspace-provider.tsx:234` → `crypto.randomUUID()` outside CBG_ENTRY |
| E-01 | Event Flow | 🔴 Critical | S1, R1, R5 | VS6/VS3/VS2 — no Firestore-backed outbox, fire-and-forget |
| E-02 | Event Flow | 🔴 Critical | E3, S1, D26 | `notification-router/_router.ts` → VS4 in-process bus (not IER STANDARD_LANE) |
| E-03 | Event Flow | 🔴 Critical | R8, A5 | Scheduling traceId chain broken — injected at UI layer |
| E-04 | Event Flow | 🟠 High | E2, S1 | VS4 `org-outbox` missing — `OrgContextProvisioned→CRITICAL_LANE` unimplemented |
| E-05 | Event Flow | 🟡 Medium | #9, D9 | `projection.bus/_workspace-funnel.ts` → calls VS6 domain action |
| F-01 | Responsibility | 🔴 Critical | D27-A, D21-U | VS6 has own `policy-mapper/` — duplicates VS8 authoritative mapper |
| F-02 | Responsibility | 🟠 High | D27, #A14 | `business.finance/_constants.ts` — `NON_TASK_COST_ITEM_TYPES` in VS5 |
| F-03 | Responsibility | 🟠 High | A13, D26 | `workspace-provider.tsx` — owns VS7 notification-hub lifecycle |
| F-04 | Responsibility | 🟡 Medium | A13, D27-A | `notification-router` — ID-based routing, not semantic tag-aware |
| F-05 | Responsibility | 🟡 Medium | AUDIT_COL, #9 | `workspace-provider.tsx:30` — direct `writeAuditLog` bypasses IER BACKGROUND_LANE |

---

## Priority Fix Order

### Immediate 🔴 (Critical — system integrity)

1. **Create outboxes for VS2/VS3/VS6** (A-01, A-02, A-03, E-01)  
   Without these, domain events have no delivery guarantees. Start with VS3 (simplest) → VS6 (sched-outbox with `REVIEW_REQUIRED`) → VS2 (acc-outbox with CRITICAL_LANE for claims refresh).

2. **Fix VS5→VS6 direct command call** (D-04)  
   `workspace-provider` directly invoking VS6 creates a tight coupling that prevents the VS6 scheduling saga from functioning as a proper compensating workflow.

3. **Fix notification-router to consume IER STANDARD_LANE** (E-02, D-01 prerequisite)  
   Once sched-outbox exists, the notification chain `ScheduleAssigned → IER → NOTIF_R` must be wired correctly.

4. **Fix traceId R8 violation** (D-08, E-03)  
   Route scheduling proposal through the command gateway.

### Short-term 🟠 (High — architectural coherence)

5. **Dissolve `timelineing.slice` → `projection.bus/schedule-timeline-view`** (A-05, B-02, C-01)
6. **Create VS4 `org-outbox`** (E-04)
7. **Merge VS6 policy-mapper into VS8** (F-01)
8. **Move `_projectors/` to `projection.bus/`** (B-01)
9. **Create VS4 missing aggregates/repos** (A-04)

### Maintenance 🟡 (Medium — code hygiene)

10. Remove deprecated `notification-router` code (E-02 tail)
11. Delete `centralized-neural-net/context-attention.ts` shim (C-03)
12. Export `NON_EXECUTABLE_COST_TYPES` from VS8 (F-02)
13. Move `portal.slice` out of `features/` (B-03)
14. Align VS8 directory names to 8-layer architecture (C-02)

---

## How to Read This Report

Each finding references:
- **Rule(s):** the specific D-rule, invariant (#N), or contract (S1–S6) from `00-LogicOverview.md`
- **File(s):** the exact file path and line numbers where the violation occurs
- **Suggested Fix:** the minimal code change required to comply with architecture SSOT

Before addressing any finding, verify it against the latest SSOT:
```bash
cat docs/architecture/00-LogicOverview.md
cat docs/knowledge-graph.json
```

---

## Remediation Checklist

> Track fix progress below. Check off each item when the PR that resolves it is merged to `main`.

### 🔴 Critical — Immediate (system integrity at risk)

- [ ] **A-01 / E-01** Create `src/features/account.slice/account-event-bus.ts` + `acc-outbox.ts`; wire `gov.role/_actions.ts` and `gov.policy/_actions.ts` to write to `acc-outbox` with `CRITICAL_LANE` / `SECURITY_BLOCK` DLQ tier instead of calling `publishOrgEvent` directly
- [ ] **A-02 / E-01** Create `src/features/skill-xp.slice/skill-outbox.ts`; replace `publishOrgEvent` calls in `_actions.ts` with outbox write, `STANDARD_LANE` / `SAFE_AUTO`
- [ ] **A-03 / E-01** Create `src/features/workforce-scheduling.slice/sched-outbox.ts`; replace all `publishOrgEvent(...)` calls in `_aggregate.ts` (lines 196, 229, 272, 323, 381) with outbox writes; `ScheduleAssigned → REVIEW_REQUIRED`, compensating events `→ SAFE_AUTO`
- [ ] **D-01** Remove `import { publishOrgEvent } from '@/features/organization.slice'` from `workforce-scheduling.slice/_aggregate.ts`; route all events through `sched-outbox`
- [ ] **D-02** Remove `import { publishOrgEvent }` from `skill-xp.slice/_actions.ts` (lines 22, 62, 107) and `_org-recognition.ts` (lines 30, 119, 148); route through `skill-outbox`
- [ ] **D-03** Remove `import { publishOrgEvent } from '@/features/organization.slice'` from `account.slice/gov.role/_actions.ts` (line 24); route through `acc-outbox`
- [ ] **D-04** Remove direct `import { createScheduleItem } from '@/features/workforce-scheduling.slice'` from `workspace.slice/core/_components/workspace-provider.tsx` (lines 9–11); route command via `infra.gateway-command` CMD_GWAY → VS6 aggregate
- [ ] **E-02** Rewrite `notification-hub.slice/gov.notification-router/_router.ts` to subscribe to IER STANDARD_LANE (not VS4 `onOrgEvent`); remove `import { onOrgEvent } from '@/features/organization.slice'`
- [ ] **E-03** Move `traceId = crypto.randomUUID()` from `workspace-provider.tsx:234` to CBG_ENTRY in `infra.gateway-command`; pass `traceId` down through the command pipeline
- [ ] **F-01** Dissolve `workforce-scheduling.slice/policy-mapper/`; move mapping logic into `semantic-graph.slice/routing/reflex-arc/policy-mapper/` (VS8 authoritative mapper); VS6 calls VS8 via read-only projection

### 🟠 High — Short-term (architectural coherence)

- [ ] **A-04** Create `organization.slice/org-skill-recognition.aggregate.ts`, `talent-repository.ts`, `tag-lifecycle-subscriber.ts`, and `skill-tag-pool.ts` as specified by rules T1, T3, #11, #16
- [ ] **A-05 / B-02 / C-01** Create `projection.bus/schedule-timeline-view/` with `_projector.ts` + `_queries.ts` + `index.ts`; dissolve `src/features/timelineing.slice/` (migrate its content here)
- [ ] **B-01** Move `workforce-scheduling.slice/_projectors/` to `projection.bus/`; each projector becomes its own sub-directory following the `account-schedule/` pattern
- [ ] **D-05** Remove `import { createScheduleItem, cancelScheduleItem } from '@/features/workforce-scheduling.slice'` from `organization.slice/*/org-skill-pool-manager.tsx` (lines 25–26); VS4 must not call VS6 actions directly
- [ ] **D-06** Remove `import { onOrgEvent } from '@/features/organization.slice'` from `account.slice/*/_org-policy-cache.ts` (lines 18–19); VS2 subscribes to IER STANDARD_LANE, not VS4's in-process bus
- [ ] **E-04** Create `organization.slice/org-outbox.ts`; ensure `OrgContextProvisioned` flows to IER CRITICAL_LANE via outbox (not ad-hoc)
- [ ] **F-02** Delete `NON_TASK_COST_ITEM_TYPES` constant from `workspace.slice/business.finance/_constants.ts` (line 23); export equivalent `NON_EXECUTABLE_COST_TYPES` from `semantic-graph.slice/decision/_cost-classifier.ts` [D27, #A14]
- [ ] **F-03** Remove `initTagChangedSubscriber` initialization from `workspace-provider.tsx` (line 7, 101); VS7 notification-hub should self-bootstrap on IER BACKGROUND_LANE, not be initialized by VS5

### 🟡 Medium — Maintenance (code hygiene)

- [ ] **A-06** Create `identity.slice/context-lifecycle-manager.ts` implementing ACTIVE_CTX-MANAGER as specified by S6 contract (listens for CRITICAL_LANE → clears stale context when `TokenRefreshSignal` fires)
- [ ] **A-07** Wire `projection.bus/workspace-scope-guard/` to `_workspace-funnel.ts`; ensure it receives events and updates its view (currently disconnected from the funnel)
- [ ] **B-03** Move `portal.slice/` outside of `src/features/`; it has no VS/L designation and is not a domain slice — suitable location: `src/shared/` or `src/app/(shell)/`
- [ ] **C-01** Rename `src/features/timelineing.slice/` to `src/features/timeline.slice/` (fix typo) or dissolve into `projection.bus/schedule-timeline-view/` (per A-05)
- [ ] **C-02** Align VS8 directory names to the 8-layer architecture: `centralized-tag-aggregate/` → `core/cta/`; `centralized-guards/` → `governance/bbb-guards/`; `centralized-neural-net/` → `neural-computation/`
- [ ] **C-03** Delete `src/features/semantic-graph.slice/centralized-neural-net/context-attention.ts` (deprecated shim that duplicates the authoritative file)
- [ ] **D-07** Remove `import { initTagChangedSubscriber } from '@/features/notification-hub.slice'` from `workspace-provider.tsx` (line 8); VS5 must not own VS7 lifecycle — fix is the same PR as F-03
- [ ] **D-08** Remove `crypto.randomUUID()` call from `workspace-provider.tsx:234`; same fix as E-03 (move to CBG_ENTRY)
- [ ] **E-05** Refactor `projection.bus/_workspace-funnel.ts` to remove `import { handleScheduleProposed } from '@/features/workforce-scheduling.slice'` (line 8); the projection bus must only call `ProjectorFn` — it should dispatch `ScheduleProposed` domain event to VS6 via IER, not call VS6 domain actions
- [ ] **F-04** Rewrite `notification-hub.slice/gov.notification-router/_router.ts` routing logic to invoke VS8 `policy-mapper(semanticTagSlug)` to determine delivery channel (Slack, Email, SMS, etc.) instead of hardcoded `payload.targetAccountId` matching
- [ ] **F-05** Remove `writeAuditLog` direct import and calls from `workspace.slice/core/_components/workspace-provider.tsx:30`; audit events must be produced by `gov.audit` subscribing IER BACKGROUND_LANE

---

*Last audited: 2026-03-07 · Auditor: GitHub Copilot Architecture Agent (x-repomix-skill-generate-and-logic-overview-audit-v0)*
