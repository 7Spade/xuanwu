# Schema Definition

> Source of truth: `docs/logic-overview.md`
> All collections are Firestore; subcollections shown as `{parent}/{id}/{subcollection}`.

---

## Collection Overview

| Collection | Aggregate / Owner | BC |
|-----------|------------------|----|
| `accounts/{accountId}` | `user-account`, `organization-account` | VS2 |
| `accounts/{userId}/walletTransactions` | `account-user.wallet` | VS2 |
| `accounts/{userId}/skillGrants` | `account-user.skill` | VS3 |
| `accounts/{userId}/xpLedger` | `account-skill-xp-ledger` | VS3 |
| `organizations/{orgId}` | `organization-core` | VS4 |
| `organizations/{orgId}/members` | `account-organization.member` | VS4 |
| `organizations/{orgId}/teams` | `account-organization.team` | VS4 |
| `organizations/{orgId}/partners` | `account-organization.partner` | VS4 |
| `organizations/{orgId}/schedules` | `account-organization.schedule` | VS6 |
| `workspaces/{workspaceId}` | `workspace-core` | VS5 |
| `workspaces/{workspaceId}/members` | `workspace-governance.members` | VS5 |
| `workspaces/{workspaceId}/roles` | `workspace-governance.role` | VS5 |
| `workspaces/{workspaceId}/tasks` | `workspace-business.tasks` | VS5 |
| `workspaces/{workspaceId}/workflows` | `workspace-business.workflow` | VS5 |
| `workspaces/{workspaceId}/issues` | `workspace-business.issues` | VS5 |
| `workspaces/{workspaceId}/dailyLogs` | `workspace-business.daily` | VS5 |
| `workspaces/{workspaceId}/files` | `workspace-business.files` | VS5 |
| `workspaces/{workspaceId}/scheduleItems` | `workspace-business.schedule` | VS5 |
| `workspaces/{workspaceId}/parsingIntents` | `workspace-business.parsing-intent` | VS5 |
| `workspaces/{workspaceId}/eventStore` | `workspace-core.event-store` | VS5 |
| `workspaces/{workspaceId}/auditLog` | `workspace-governance.audit` | VS5 |
| `tags/{tagId}` | `centralized-tag.aggregate` | VS0 |
| `outbox/acc-outbox/{id}` | OUTBOX_RELAY_WORKER target | Infra |
| `outbox/org-outbox/{id}` | OUTBOX_RELAY_WORKER target | Infra |
| `outbox/sched-outbox/{id}` | OUTBOX_RELAY_WORKER target | Infra |
| `outbox/skill-outbox/{id}` | OUTBOX_RELAY_WORKER target | Infra |
| `outbox/tag-outbox/{id}` | OUTBOX_RELAY_WORKER target | Infra |
| `outbox/ws-outbox/{id}` | OUTBOX_RELAY_WORKER target | Infra |
| `projections/account-view/{id}` | `projection.account-view` | VS8 |
| `projections/org-view/{id}` | `projection.organization-view` | VS8 |
| `projections/workspace-view/{id}` | `projection.workspace-view` | VS8 |
| `projections/account-skill-view/{id}` | `projection.account-skill-view` | VS8 |
| `projections/org-eligible-member-view/{id}` | `projection.org-eligible-member-view` | VS8 |
| `projections/workspace-scope-guard/{id}` | `projection.workspace-scope-guard` | VS8 |
| `projections/tag-snapshot/{id}` | `projection.tag-snapshot` | VS8 |
| `projections/account-schedule/{id}` | `projection.account-schedule` | VS8 |
| `projections/wallet-balance/{id}` | `projection.wallet-balance` | VS8 |
| `projections/global-audit-view/{id}` | `projection.global-audit-view` | VS8 |
| `projections/registry` | `projection.registry` | VS8 |
| `dlq/{id}` | `infra.dlq-manager` | Infra |

---

## Core Document Schemas

### `accounts/{accountId}`

```ts
interface AccountDocument {
  id: string
  accountType: 'user' | 'organization'
  name: string
  email?: string
  photoURL?: string
  bio?: string
  // User-only
  wallet?: {
    balance: number
    currency?: string
  }
  skillGrants?: SkillGrant[]     // display cache; source of truth = accounts/{id}/skillGrants
  // Org-only
  ownerId?: string
  description?: string
  memberIds?: string[]
  members?: MemberReference[]    // display cache
  teams?: Team[]
  theme?: ThemeConfig
  role?: OrganizationRole        // current user's role within this org
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### `tags/{tagId}`

```ts
interface TagDocument {
  tagSlug: string          // globally unique identifier [#17]
  label: string            // display name
  category: string         // e.g. 'engineering', 'design'
  deprecatedAt?: Timestamp // set when deprecated; triggers TAG_STALE_GUARD [Q6]
  deleteRule?: string      // business rule governing deletion
  createdAt: Timestamp
  updatedAt: Timestamp
  version: number          // aggregate version
}
```

### `workspaces/{workspaceId}/workflows/{workflowId}`

```ts
type WorkflowStage = 'Draft' | 'InProgress' | 'QA' | 'Acceptance' | 'Finance' | 'Completed'

interface WorkflowDocument {
  id: string
  workspaceId: string
  stage: WorkflowStage           // [R6] WORKFLOW_STATE_CONTRACT
  blockedBy: string[]            // Set<issueId> — unblockWorkflow requires isEmpty() [A3][R6]
  title: string
  description?: string
  assigneeIds?: string[]
  dueDate?: Timestamp
  version: number                // aggregate version for ELIGIBLE_UPDATE_GUARD [R7]
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### `outbox/{lane}/{id}` — OUTBOX Document `[R1]`

```ts
interface OutboxDocument {
  id: string
  aggregateId: string
  aggregateType: string
  eventType: string
  payload: Record<string, unknown>
  traceId: string          // from original Command [R8]
  idempotencyKey: string   // eventId + aggId + version [Q3]
  version: number
  lane: 'CRITICAL_LANE' | 'STANDARD_LANE' | 'BACKGROUND_LANE'
  status: 'pending' | 'delivered' | 'failed'
  retryCount: number
  createdAt: Timestamp
  deliveredAt?: Timestamp
}
```

### `projections/org-eligible-member-view/{memberId}` — `[R7]`

```ts
interface OrgEligibleMemberView {
  memberId: string
  orgId: string
  eligible: boolean                      // #15
  skills: Record<string, number>         // { [tagSlug]: xp } — T3
  lastProcessedVersion: number           // monotonically increasing [R7][#19]
  updatedAt: Timestamp
}
```

### `projections/wallet-balance/{userId}` — `[Q8]`

```ts
interface WalletBalanceView {
  userId: string
  balance: number                // display-only; precise transactions use STRONG_READ [Q8]
  currency: string
  lastTransactionAt?: Timestamp
  updatedAt: Timestamp
}
```

### `dlq/{id}` — DLQ Document `[R5]`

```ts
type DlqPolicy = 'SAFE_AUTO' | 'REVIEW_REQUIRED' | 'SECURITY_BLOCK'

interface DlqDocument {
  id: string
  originalOutboxId: string
  eventType: string
  payload: Record<string, unknown>
  traceId: string
  idempotencyKey: string
  lane: string
  policy: DlqPolicy             // [R5]
  failureReason: string
  failedAt: Timestamp
  reviewedAt?: Timestamp
  reviewedBy?: string
  resolution?: 'replayed' | 'discarded' | 'escalated'
}
```

### `projections/registry`

```ts
interface ProjectionRegistryDocument {
  readModelId: string
  lastEventOffset: string      // Firestore document path or cursor
  version: number
  updatedAt: Timestamp
}
```

---

## Firestore Security Model

| Pattern | Rule |
|---------|------|
| Account read | Auth user = `accountId` OR member of the org |
| Workspace read | Member of the workspace (`workspace-scope-guard` snapshot) |
| Outbox write | Server-side only (Service Account) |
| Projections write | Server-side only (OUTBOX_RELAY_WORKER / Cloud Functions) |
| Tags read | Public within authenticated session |
| Tags write | Server-side only (centralized-tag aggregate via Service Account) |
| DLQ read/write | Admin Service Account only |

---

## Design Notes

- **`version`** field on every aggregate document enables `ELIGIBLE_UPDATE_GUARD` (`R7`) and optimistic concurrency in TX Runner (`#A8`).
- **`idempotencyKey`** in Outbox and Projection documents enables Funnel upsert (`Q3`) and safe DLQ replay (`D8`).
- **`traceId`** propagates from the original Command through every Outbox, IER delivery, Funnel write, and FCM push metadata (`R8`, `D9`).
- **Tier** (`SkillTier`) is never stored; it is derived at read time from `getTier(xp)` (`#12`).
- **wallet.balance** in `accounts/` is a fast-read display cache; precise balance must `STRONG_READ` the `WALLET_AGG` aggregate (`Q8`, `D5`).
