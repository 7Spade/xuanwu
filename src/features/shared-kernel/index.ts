/**
 * shared.kernel — VS0 Shared Kernel Public API
 *
 * The global contract centre. Every cross-BC contract is defined here.
 * Feature slices import from '@/features/shared-kernel' — never from the
 * individual sub-directories directly.
 *
 * Sub-module layout:
 *
 * ┌─ 📄 Foundational Data Contracts ───────────────────────────────────────────┐
 * │  event-envelope        SK_ENV      [R8][R7]   Universal event envelope      │
 * │  authority-snapshot    SK_AUTH_SNAP            Permission snapshot contract  │
 * │  skill-tier            SK_SKILL_TIER [#12]    Tier computation + staffing   │
 * │  command-result-contract SK_CMD_RESULT [R4]   Command success/failure union │
 * │  constants                                    WorkflowStatus + ErrorCodes   │
 * ├─ ⚙️ Infrastructure Behaviour Contracts ────────────────────────────────────┤
 * │  outbox-contract       SK_OUTBOX [S1]         At-least-once delivery        │
 * │  version-guard         SK_VERSION_GUARD [S2]  Monotonic projection writes   │
 * │  read-consistency      SK_READ_CONSISTENCY [S3] Strong vs eventual read     │
 * │  staleness-contract    SK_STALENESS [S4]      Global SLA constants          │
 * │  resilience-contract   SK_RESILIENCE [S5]     Entry-point resilience spec   │
 * │  token-refresh-contract SK_TOKEN_REFRESH [S6] Claims refresh handshake     │
 * ├─ 🏷️ Tag Authority Center ───────────────────────────────────────────────────┤
 * │  tag-authority         [#A6][#17][D21]        Tag contract types (RO only)  │
 * ├─ 🔍 Semantic Primitives ────────────────────────────────────────────────────┤
 * │  semantic-primitives   [D19][D21][D26]        Search + notification + taxonomy │
 * ├─ 🔌 Infrastructure Ports ───────────────────────────────────────────────────┤
 * │  infrastructure-ports  SK_PORTS [D24]         Dependency-inversion ports   │
 * │                        Timestamp               D24-compliant Timestamp type │
 * └────────────────────────────────────────────────────────────────────────────┘
 *
 * Dependency rule: zero infrastructure imports in any sub-module.
 * Invariant #8: contracts are explicitly agreed cross-BC; additions require
 *   updating docs/logic-overview.md and this index simultaneously.
 */

// ─── 📄 Foundational Data Contracts ──────────────────────────────────────────

// SK_ENV [R8][R7]
export type { EventEnvelope, ImplementsEventEnvelopeContract } from './event-envelope';

// SK_AUTH_SNAP
export type { AuthoritySnapshot, ImplementsAuthoritySnapshotContract } from './authority-snapshot';

// SK_SKILL_TIER + SK_SKILL_REQ + SK_SKILL_GRANT [#12][A5][D19]
export type {
  SkillTier,
  TierDefinition,
  SkillRequirement,
  SkillTag,
  SkillGrant,
  WorkspaceScheduleProposedPayload,
  ImplementsScheduleProposedPayloadContract,
} from './skill-tier';
export {
  TIER_DEFINITIONS,
  getTierDefinition,
  resolveSkillTier,
  getTier,
  getTierRank,
  tierSatisfies,
} from './skill-tier';

// SK_ACCOUNT_CONTRACT [D19]
export type {
  AccountType,
  OrganizationRole,
  Presence,
  InviteState,
  NotificationType,
  Account,
  MemberReference,
  Team,
  ThemeConfig,
  Wallet,
  ExpertiseBadge,
  Notification,
  PartnerInvite,
} from './account-contract';

// SK_CMD_RESULT [R4]
export type {
  DomainError,
  CommandSuccess,
  CommandFailure,
  CommandResult,
} from './command-result-contract';
export {
  commandSuccess,
  commandFailure,
  commandFailureFrom,
} from './command-result-contract';

// Cross-BC constants [R6]
export {
  WorkflowStatusValues,
  ErrorCodes,
} from './constants';
export type { WorkflowStatus, ErrorCode } from './constants';

// ─── ⚙️ Infrastructure Behaviour Contracts ────────────────────────────────────

// SK_OUTBOX [S1]
export type { DlqTier, OutboxRecord, OutboxStatus, ImplementsOutboxContract } from './outbox-contract';
export { buildIdempotencyKey } from './outbox-contract';

// SK_VERSION_GUARD [S2]
export type { VersionGuardInput, VersionGuardResult, ImplementsVersionGuard } from './version-guard';
export { applyVersionGuard, versionGuardAllows } from './version-guard';

// SK_READ_CONSISTENCY [S3]
export type { ReadConsistencyMode, ReadConsistencyContext, ImplementsReadConsistency } from './read-consistency';
export { resolveReadConsistency } from './read-consistency';

// SK_STALENESS [S4]
export type { StalenessTier, ImplementsStalenessContract } from './staleness-contract';
export { StalenessMs, getSlaMs, isStale } from './staleness-contract';

// SK_RESILIENCE [S5]
export type {
  RateLimitConfig,
  CircuitBreakerConfig,
  BulkheadConfig,
  ResilienceContract,
  ImplementsResilienceContract,
} from './resilience-contract';
export { DEFAULT_RATE_LIMIT, DEFAULT_CIRCUIT_BREAKER } from './resilience-contract';

// SK_TOKEN_REFRESH [S6]
export type {
  ClaimsRefreshTrigger,
  TokenRefreshSignal,
  ClaimsRefreshOutcome,
  ClaimsRefreshHandshake,
  ClientTokenRefreshObligation,
  ImplementsTokenRefreshContract,
} from './token-refresh-contract';
export { TOKEN_REFRESH_SIGNAL, CLIENT_TOKEN_REFRESH_OBLIGATION } from './token-refresh-contract';

// ─── 🏷️ Tag Authority Center [#A6][#17][D21] ──────────────────────────────────

export { TAG_CATEGORIES, tagSlugRef, onTagEvent } from './tag-authority';
export type {
  TagCategory,
  TagDeleteRule,
  TagSlugRef,
  TagCreatedPayload,
  TagUpdatedPayload,
  TagDeprecatedPayload,
  TagDeletedPayload,
  TagLifecycleEventPayloadMap,
  TagLifecycleEventKey,
  ITagReadPort,
  ImplementsTagStaleGuard,
} from './tag-authority';

// ─── 🔍 Semantic Primitives (VS8/VS9/VS7) [D19][D21][D26] ────────────────────

export {
  SEARCH_DOMAINS,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_PRIORITIES,
  TAXONOMY_DIMENSIONS,
} from './semantic-primitives';
export type {
  SearchDomain,
  SemanticSearchQuery,
  SemanticSearchHit,
  SemanticSearchResult,
  NotificationChannel,
  NotificationPriority,
  TaxonomyDimension,
  TaxonomyNode,
} from './semantic-primitives';

// ─── 🔌 Infrastructure Ports [D24] ───────────────────────────────────────────

export type { IAuthService, AuthUser } from './infrastructure-ports';
export type { IFirestoreRepo, FirestoreDoc, Timestamp, WriteOptions } from './infrastructure-ports';
export type { IMessaging, PushNotificationPayload } from './infrastructure-ports';
export type { IFileStore, UploadOptions } from './infrastructure-ports';

// ─── 📅 Schedule Contract [D19] ──────────────────────────────────────────────

export type { ScheduleStatus, ScheduleItem } from './schedule-contract';
