# Schema Definition

> **SSOT**: This file is the canonical TypeScript type reference for the entire system.
> Architecture rules → `docs/logic-overview.md` · Persistence layout → `docs/persistence-model-overview.md`
> All interfaces: strict-mode (`no-any`). Constraints in JSDoc are invariants — treat as rules, not suggestions.

---

## VS0 Shared Kernel Contracts

### SK_ENV — Event Envelope

Every domain event in the system MUST conform to `EventEnvelope`. The `traceId` is injected at `CBG_ENTRY` and **MUST NOT** be overwritten downstream (`R8`).

```typescript
/**
 * Branded type for the idempotency key used in all Outbox records and EventEnvelopes.
 * Format: `"${eventId}:${aggregateId}:${aggregateVersion}"` — e.g. `"evt_123:acc_456:7"`.
 * Used for exactly-once delivery guarantee across OUTBOX_RELAY → IER.
 */
type IdempotencyKey = string & { readonly __brand: 'IdempotencyKey' };

interface EventEnvelope {
  /** Schema version of this envelope */
  version: number;
  /** Injected at CBG_ENTRY; shared across the full event chain [R8] */
  traceId: string;
  /** Unix epoch milliseconds */
  timestamp: number;
  /** Format: eventId + aggId + version — used for exactly-once delivery */
  idempotencyKey: IdempotencyKey;
  /** Unique identifier of this specific event */
  eventId: string;
  /** Owning aggregate's ID */
  aggregateId: string;
  /** Monotonically increasing version of the owning aggregate */
  aggregateVersion: number;
}
```

---

### SK_AUTH_SNAP — Authority Snapshot

```typescript
/**
 * Custom Claims snapshot (#5).
 * NOTE: This is a snapshot only — NOT the authoritative permission source.
 * TTL equals the Firebase token validity period.
 */
interface AuthoritySnapshot {
  /** Raw Firebase Custom Claims map */
  claims: Record<string, unknown>;
  /** Resolved role identifiers */
  roles: string[];
  /** Resolved permission scopes */
  scopes: string[];
  /** TTL = Firebase token expiry (seconds from issuedAt) */
  ttl: number;
}
```

---

### SK_SKILL_TIER — Skill Tier

```typescript
/**
 * Tier is ALWAYS derived — NEVER persisted to DB (#12).
 * Pure function: getTier(xp) → SkillTier
 */
type SkillTier = 'Novice' | 'Apprentice' | 'Journeyman' | 'Expert' | 'Master';

interface SkillTierBracket {
  tier: SkillTier;
  minXp: number;
  maxXp: number | null;
}

declare function getTier(xp: number): SkillTier;
```

---

### SK_SKILL_REQ — Skill Requirement

```typescript
/**
 * Cross-slice manpower requirement contract.
 * Used by VS5 (workspace.schedule) and VS6 (scheduling).
 */
interface SkillRequirement {
  tagSlug: string;
  minXp: number;
}
```

---

### SK_CMD_RESULT — Command Result Contract

```typescript
interface DomainError {
  code: string;
  message: string;
  aggregateId?: string;
}

type CommandSuccess = {
  success: true;
  aggregateId: string;
  version: number;
};

type CommandFailure = {
  success: false;
  error: DomainError;
};

/** R4: Returned to client for optimistic update decisions */
type CommandResult = CommandSuccess | CommandFailure;
```

---

### SK_OUTBOX_CONTRACT [S1] — Outbox Contract

```typescript
/**
 * DLQ tier MUST be declared per-outbox at definition time.
 * No outbox may redefine at-least-once semantics independently.
 */
type DlqTier = 'SAFE_AUTO' | 'REVIEW_REQUIRED' | 'SECURITY_BLOCK';

type IerLane = 'CRITICAL_LANE' | 'STANDARD_LANE' | 'BACKGROUND_LANE';

type OutboxStatus = 'pending' | 'delivered' | 'dlq';

interface OutboxRecord {
  id: string;
  /** Format: eventId + aggId + version */
  idempotencyKey: IdempotencyKey;
  lane: IerLane;
  dlqTier: DlqTier;
  payload: EventEnvelope;
  status: OutboxStatus;
  retryCount: number;
  createdAt: number;
  deliveredAt?: number;
  dlqReason?: string;
}

/** DLQ record preserved for audit and replay */
interface DlqRecord {
  id: string;
  originalOutboxRecord: OutboxRecord;
  tier: DlqTier;
  failureReason: string;
  requiresHumanReview: boolean;
  securityAlert: boolean;
  createdAt: number;
  resolvedAt?: number;
  resolvedBy?: string;
}
```

---

### SK_VERSION_GUARD [S2] — Version Guard

```typescript
/**
 * ALL Projection writes MUST pass this guard (#19).
 * event.aggregateVersion > view.lastProcessedVersion → allow update
 * otherwise → discard (stale event must not overwrite newer state)
 */
interface VersionGuardInput {
  eventAggregateVersion: number;
  viewLastProcessedVersion: number;
}

interface VersionGuardResult {
  allowed: boolean;
  reason?: 'stale_event_discarded' | 'version_advanced';
}

declare function checkVersionGuard(input: VersionGuardInput): VersionGuardResult;
```

---

### SK_READ_CONSISTENCY [S3] — Read Consistency

```typescript
/**
 * Decision rule:
 *   - Financial transactions / security ops / irreversible → STRONG_READ
 *   - Display / statistics / lists → EVENTUAL_READ
 */
type ReadConsistencyMode = 'STRONG_READ' | 'EVENTUAL_READ';

interface ReadConsistencyDecision {
  mode: ReadConsistencyMode;
  /** STRONG_READ: route to Domain Aggregate; EVENTUAL_READ: route to Projection */
  target: 'aggregate' | 'projection';
  justification: string;
}
```

---

### SK_STALENESS_CONTRACT [S4] — Staleness SLA Constants

```typescript
/**
 * Single source of truth for all staleness SLA values.
 * Consumers MUST NOT hardcode these numbers — reference this constant.
 */
const StalenessMs = {
  /** Tag-derived data (SKILL_TAG_POOL / TAG_SNAPSHOT): max 30 s */
  TAG_MAX_STALENESS: 30_000,
  /** Authorization/scheduling projections (WS_SCOPE_VIEW / ORG_ELIGIBLE_VIEW): max 500 ms */
  PROJ_STALE_CRITICAL: 500,
  /** General projections: max 10 s */
  PROJ_STALE_STANDARD: 10_000,
} as const;

type StalenessKey = keyof typeof StalenessMs;
```

---

### SK_RESILIENCE_CONTRACT [S5] — Resilience Contract

```typescript
/**
 * Minimum protection spec for ALL external trigger entry points.
 * Applies to: _actions.ts / Webhook / Edge Function
 * Any entry point reaching CBG_ENTRY MUST satisfy this contract.
 */
interface RateLimitConfig {
  /** Max requests per user per window */
  perUser: number;
  /** Max requests per org per window */
  perOrg: number;
  /** Sliding window in milliseconds */
  windowMs: number;
  /** HTTP status returned on excess: 429 */
  responseStatus: 429;
}

interface CircuitBreakerConfig {
  /** Number of consecutive 5xx before opening circuit */
  failureThreshold: number;
  /** Allow half-open probe requests for gradual recovery */
  halfOpenProbe: boolean;
  /** Milliseconds to wait before half-open probe */
  halfOpenDelayMs: number;
}

interface BulkheadConfig {
  /** Maximum concurrent in-flight requests for this slice */
  maxConcurrent: number;
  /** Slice identifier for independent thread pool isolation */
  sliceId: string;
}

interface ResilienceContractConfig {
  rateLimit: RateLimitConfig;
  circuitBreaker: CircuitBreakerConfig;
  bulkhead: BulkheadConfig;
}
```

---

### SK_TOKEN_REFRESH_CONTRACT [S6] — Token Refresh Contract

```typescript
/**
 * Claims refresh three-way handshake: VS1 ↔ IER ↔ Frontend.
 * This is the ONLY specification for the refresh handshake.
 * All three parties MUST reference this contract.
 */
const TOKEN_REFRESH_SIGNAL = 'TOKEN_REFRESH_SIGNAL' as const;
type TokenRefreshSignal = typeof TOKEN_REFRESH_SIGNAL;

type ClaimsRefreshTrigger = 'RoleChanged' | 'PolicyChanged';

interface ClaimsRefreshHandshake {
  signal: TokenRefreshSignal;
  accountId: string;
  triggeredBy: ClaimsRefreshTrigger;
}

/**
 * Client obligation upon receiving TOKEN_REFRESH_SIGNAL:
 *   1. Force re-fetch Firebase Token
 *   2. Next request MUST carry new Claims
 *
 * Failure path:
 *   ClaimsRefresh failure → DLQ SECURITY_BLOCK → DOMAIN_ERRORS security alert
 */
interface ClaimsRefreshResult {
  success: boolean;
  accountId: string;
  triggeredBy: ClaimsRefreshTrigger;
  completedAt?: number;
  failureReason?: string;
}
```

---

## Domain Types

### Workflow Status (VS5)

```typescript
/**
 * Workflow state machine transitions [R6]:
 * Draft → InProgress → QA → Acceptance → Finance → Completed
 * Any state may transition to Blocked via blockWorkflow (#A3)
 */
type WorkflowStatus =
  | 'Draft'
  | 'InProgress'
  | 'QA'
  | 'Acceptance'
  | 'Finance'
  | 'Completed'
  | 'Blocked';

interface WorkflowAggregate {
  id: string;
  workspaceId: string;
  status: WorkflowStatus;
  /** Set of issueIds blocking this workflow (#A3) */
  blockedBy: Set<string>;
  version: number;
}
```

---

### IER Lane

```typescript
type IerLane = 'CRITICAL_LANE' | 'STANDARD_LANE' | 'BACKGROUND_LANE';
```

---

## Firestore Document Schemas

### `user-accounts/{accountId}`

```typescript
interface UserAccountDocument {
  accountId: string;
  firebaseUserId: string;
  displayName: string;
  email: string;
  createdAt: number;
  version: number;
}
```

### `organizations/{orgId}`

```typescript
interface OrganizationDocument {
  orgId: string;
  name: string;
  ownerAccountId: string;
  createdAt: number;
  version: number;
}
```

### `workspaces/{workspaceId}`

```typescript
interface WorkspaceDocument {
  workspaceId: string;
  orgId: string;
  name: string;
  workflowStatus: WorkflowStatus;
  blockedBy: string[];
  createdAt: number;
  version: number;
}
```

### `skill-xp-ledger/{accountId}/entries/{entryId}`

```typescript
interface SkillXpLedgerEntry {
  entryId: string;
  accountId: string;
  tagSlug: string;
  delta: number;
  reason: string;
  /** sourceId links this entry to the originating command (#13) */
  sourceId: string;
  timestamp: number;
  aggregateVersion: number;
}
```

### `centralized-tags/{tagSlug}`

```typescript
interface CentralizedTagDocument {
  tagSlug: string;
  label: string;
  category: string;
  deprecatedAt?: number;
  /** 'soft' | 'hard' — governs deletion behavior */
  deleteRule: 'soft' | 'hard';
  version: number;
}
```

### `tagOutbox/{recordId}` (and all Outbox collections)

```typescript
type OutboxCollection =
  | 'tagOutbox'
  | 'accOutbox'
  | 'orgOutbox'
  | 'skillOutbox'
  | 'wsOutbox'
  | 'schedOutbox';

/** Schema is OutboxRecord above, stored in Firestore */
type FirestoreOutboxRecord = OutboxRecord & {
  _collection: OutboxCollection;
};
```

### Projection: `orgEligibleMemberView/{memberId}`

```typescript
interface OrgEligibleMemberViewDocument {
  memberId: string;
  orgId: string;
  /** Cross-snapshot: tagSlug → accumulated XP (#T3) */
  skills: Record<string, number>;
  /** True when member has no conflicting schedule assignments (#A11) */
  eligible: boolean;
  /** Lifecycle: joined→true · assigned→false · completed/cancelled→true (#15) */
  eligibleLifecycle: 'joined' | 'assigned' | 'released';
  lastProcessedVersion: number;
  updatedAt: number;
}
```

### Projection: `workspaceScopeGuardView/{workspaceId}`

```typescript
interface WorkspaceScopeGuardViewDocument {
  workspaceId: string;
  orgId: string;
  allowedAccountIds: string[];
  roleMap: Record<string, string>;
  lastProcessedVersion: number;
  updatedAt: number;
}
```

### Projection: `walletBalance/{accountId}`

```typescript
/**
 * EVENTUAL_READ: display only.
 * For precise transactions use STRONG_READ → WALLET_AGG [S3].
 */
interface WalletBalanceDocument {
  accountId: string;
  balance: number;
  currency: string;
  lastProcessedVersion: number;
  updatedAt: number;
}
```

### Projection: `globalAuditView/{traceId}`

```typescript
/** Every record MUST contain traceId for full chain traceability [R8] */
interface GlobalAuditViewDocument {
  auditId: string;
  traceId: string;
  eventType: string;
  aggregateId: string;
  accountId: string;
  orgId?: string;
  workspaceId?: string;
  payload: Record<string, unknown>;
  lane: IerLane;
  timestamp: number;
}
```

### Projection: `tagSnapshot/{tagSlug}`

```typescript
/**
 * Consumers MUST NOT write to this collection (T5).
 * Staleness ≤ TAG_MAX_STALENESS (30s) [S4].
 */
interface TagSnapshotDocument {
  tagSlug: string;
  label: string;
  category: string;
  deprecated: boolean;
  lastProcessedVersion: number;
  updatedAt: number;
}
```

### Projection: `accountSkillView/{accountId}/skills/{tagSlug}`

```typescript
interface AccountSkillViewDocument {
  accountId: string;
  tagSlug: string;
  xp: number;
  /**
   * Derived — NEVER persisted to Firestore (#12).
   * Computed on read via `getTier(xp)` from `shared.kernel.skill-tier`. MUST NOT be written to DB.
   */
  readonly tier: SkillTier;
  lastProcessedVersion: number;
  updatedAt: number;
}
```
