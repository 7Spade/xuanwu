# Persistence Model Overview

> **SSOT**: `docs/logic-overview.md` (rules S1–S6, D1–D23) · `docs/schema-definition.md` (TypeScript contracts)
> Firestore collections: ownership, version semantics, read consistency. Data schema → `docs/schema-definition.md`.

---

## Aggregate Collections (Write Models)

### `user-accounts/{accountId}`

| Field | Type | Description |
|-------|------|-------------|
| `accountId` | `string` | Primary key |
| `firebaseUserId` | `string` | Firebase Auth UID |
| `displayName` | `string` | |
| `email` | `string` | |
| `createdAt` | `number` | Unix ms |
| `version` | `number` | Aggregate version (monotonic) |

**Consistency**: `STRONG_READ` for wallet operations [S3]; `EVENTUAL_READ` for display

---

### `account-wallets/{accountId}` (STRONG_READ)

| Field | Type | Description |
|-------|------|-------------|
| `accountId` | `string` | |
| `balance` | `number` | Authoritative balance (#A1) |
| `currency` | `string` | |
| `version` | `number` | |

**Rule**: `WALLET_AGG` is the STRONG_READ source for any financial transaction [S3, #A1]. The `walletBalance` projection is display-only.

---

### `organizations/{orgId}`

| Field | Type | Description |
|-------|------|-------------|
| `orgId` | `string` | |
| `name` | `string` | |
| `ownerAccountId` | `string` | |
| `createdAt` | `number` | |
| `version` | `number` | |

---

### `workspaces/{workspaceId}`

| Field | Type | Description |
|-------|------|-------------|
| `workspaceId` | `string` | |
| `orgId` | `string` | |
| `name` | `string` | |
| `workflowStatus` | `WorkflowStatus` | State machine value [R6] |
| `blockedBy` | `string[]` | Set of blocking issueIds (#A3) |
| `createdAt` | `number` | |
| `version` | `number` | |

---

### `skill-xp-ledger/{accountId}/entries/{entryId}` (#13)

| Field | Type | Description |
|-------|------|-------------|
| `entryId` | `string` | |
| `accountId` | `string` | |
| `tagSlug` | `string` | References centralized-tag authority (#17) |
| `delta` | `number` | Positive = added, negative = deducted |
| `reason` | `string` | Human-readable reason |
| `sourceId` | `string` | Links to originating command (#13) |
| `timestamp` | `number` | |
| `aggregateVersion` | `number` | |

---

### `centralized-tags/{tagSlug}` (Tag Authority #17, #A6)

| Field | Type | Description |
|-------|------|-------------|
| `tagSlug` | `string` | Unique semantic identifier — SOLE authority (#17) |
| `label` | `string` | Display name |
| `category` | `string` | Classification |
| `deprecatedAt` | `number?` | Epoch ms when deprecated; absent = active |
| `deleteRule` | `'soft' \| 'hard'` | Governs deletion behavior |
| `version` | `number` | |

---

### `accounts/{orgId}/schedule_items/{scheduleId}`

> **VS6 SSOT** — unified collection replacing legacy `schedules/` (removed). All VS6 scheduling writes and reads use this path.

| Field | Type | Description |
|-------|------|-------------|
| `scheduleId` | `string` | |
| `orgId` | `string` | Partition key |
| `workspaceId` | `string` | |
| `assignedAccountId` | `string` | |
| `tagSlug` | `string` | Skill requirement reference (T4) |
| `minXpRequired` | `number` | From SK_SKILL_REQ |
| `status` | `ScheduleStatus` | `PENDING\|OFFICIAL\|COMPLETED\|CANCELLED\|REJECTED` |
| `aggregateVersion` | `number` | Carried in envelope [R7] |

---

## Outbox Collections [S1]

All 6 outbox collections share the `OutboxRecord` schema. Each collection declares its own `dlqTier` per event type.

| Collection | DLQ Tier Declarations |
|-----------|----------------------|
| `tagOutbox` | `TagLifecycleEvent` → `SAFE_AUTO` |
| `accOutbox` | `RoleChanged/PolicyChanged` → `SECURITY_BLOCK`; `WalletDeducted` → `REVIEW_REQUIRED`; `AccountCreated` → `SAFE_AUTO` |
| `orgOutbox` | `OrgContextProvisioned` → `REVIEW_REQUIRED`; `MemberJoined/Left` → `SAFE_AUTO`; `SkillRecog*` → `REVIEW_REQUIRED` |
| `skillOutbox` | `SkillXpAdded/Deducted` → `SAFE_AUTO` |
| `wsOutbox` | Business events (idempotent) → `SAFE_AUTO` |
| `schedOutbox` | `ScheduleAssigned` → `REVIEW_REQUIRED`; compensating events → `SAFE_AUTO` |

### Common Outbox Document Schema

```
{outboxCollection}/{recordId}:
  id: string
  idempotencyKey: string          # eventId + aggregateId + aggregateVersion
  lane: IerLane
  dlqTier: DlqTier
  payload: EventEnvelope          # full event envelope
  status: 'pending' | 'delivered' | 'dlq'
  retryCount: number
  createdAt: number
  deliveredAt?: number
  dlqReason?: string
```

---

## Projection / View Collections [S2]

All projections enforce `SK_VERSION_GUARD [S2]`: writes MUST satisfy `event.aggregateVersion > view.lastProcessedVersion`. Stale events are discarded.

### CRITICAL Projections (SLA ≤ 500ms)

#### `workspaceScopeGuardView/{workspaceId}` (#A9, #7)

| Field | Type | Description |
|-------|------|-------------|
| `workspaceId` | `string` | |
| `orgId` | `string` | |
| `allowedAccountIds` | `string[]` | Fast-path authorization set |
| `roleMap` | `Record<string, string>` | accountId → role |
| `lastProcessedVersion` | `number` | [S2] SK_VERSION_GUARD anchor |
| `updatedAt` | `number` | |

---

#### `orgEligibleMemberView/{memberId}` (#14–#16, T3, #19)

| Field | Type | Description |
|-------|------|-------------|
| `memberId` | `string` | |
| `orgId` | `string` | |
| `skills` | `Record<string, number>` | `tagSlug → accumulated XP` cross-snapshot (T3) |
| `eligible` | `boolean` | No conflicting schedule assignment (#A11) |
| `eligibleLifecycle` | `'joined' \| 'assigned' \| 'released'` | Lifecycle per #15 |
| `lastProcessedVersion` | `number` | **MUST be monotonically increasing** (#19, [S2]) |
| `updatedAt` | `number` | |

> **#19 Enforcement**: `aggregateVersion` MUST be monotonically increasing. Events with `version ≤ lastProcessedVersion` MUST be discarded. This rule (originally limited to this collection in v9 R7) has been generalized to ALL projections in v10 via `SK_VERSION_GUARD [S2]`.

---

#### `walletBalance/{accountId}` (display only)

| Field | Type | Description |
|-------|------|-------------|
| `accountId` | `string` | |
| `balance` | `number` | Display-only. **NOT authoritative** [S3] |
| `currency` | `string` | |
| `lastProcessedVersion` | `number` | [S2] |
| `updatedAt` | `number` | |

> **Read Routing [S3]**: For display → use this projection (`EVENTUAL_READ`). For precise financial transactions → STRONG_READ via `account-wallets/{accountId}` aggregate.

---

### STANDARD Projections (SLA ≤ 10s)

#### `workspaceView/{workspaceId}`

| Field | Type | Description |
|-------|------|-------------|
| `workspaceId` | `string` | |
| `orgId` | `string` | |
| `name` | `string` | |
| `workflowStatus` | `WorkflowStatus` | |
| `lastProcessedVersion` | `number` | [S2] |
| `updatedAt` | `number` | |

---

#### `accountScheduleView/{accountId}`

| Field | Type | Description |
|-------|------|-------------|
| `accountId` | `string` | |
| `assignments` | `ScheduleAssignment[]` | List of current assignments |
| `lastProcessedVersion` | `number` | [S2] |
| `updatedAt` | `number` | |

---

#### `accountView/{accountId}` (#6)

| Field | Type | Description |
|-------|------|-------------|
| `accountId` | `string` | |
| `displayName` | `string` | |
| `fcmToken` | `string?` | Used by notification router (#6) |
| `lastProcessedVersion` | `number` | [S2] |
| `updatedAt` | `number` | |

---

#### `organizationView/{orgId}`

| Field | Type | Description |
|-------|------|-------------|
| `orgId` | `string` | |
| `name` | `string` | |
| `memberCount` | `number` | |
| `lastProcessedVersion` | `number` | [S2] |
| `updatedAt` | `number` | |

---

#### `accountSkillView/{accountId}/skills/{tagSlug}` (#12)

| Field | Type | Description |
|-------|------|-------------|
| `accountId` | `string` | |
| `tagSlug` | `string` | |
| `xp` | `number` | |
| `tier` | `SkillTier` | Derived by `getTier(xp)` — **NEVER stored as static value** (#12) |
| `lastProcessedVersion` | `number` | [S2] |
| `updatedAt` | `number` | |

---

#### `globalAuditView/{auditId}` [R8]

| Field | Type | Description |
|-------|------|-------------|
| `auditId` | `string` | |
| `traceId` | `string` | **MANDATORY** — every record must have traceId [R8] |
| `eventType` | `string` | |
| `aggregateId` | `string` | |
| `accountId` | `string` | |
| `orgId` | `string?` | |
| `workspaceId` | `string?` | |
| `lane` | `IerLane` | Which IER lane processed this |
| `payload` | `Record<string, unknown>` | Event data |
| `timestamp` | `number` | |

---

### BACKGROUND Projections (SLA ≤ 30s)

#### `tagSnapshot/{tagSlug}` (T5, [S4])

| Field | Type | Description |
|-------|------|-------------|
| `tagSlug` | `string` | |
| `label` | `string` | |
| `category` | `string` | |
| `deprecated` | `boolean` | |
| `lastProcessedVersion` | `number` | [S2] |
| `updatedAt` | `number` | |

> **T5**: Consumers MUST NOT write to this collection. Read-only projection of Tag Authority.
> **Staleness**: ≤ `TAG_MAX_STALENESS` (30s) per `SK_STALENESS_CONTRACT [S4]`.


