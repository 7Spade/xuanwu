/**
 * Module: index.ts
 * Purpose: expose canonical shared-kernel public API
 * Responsibilities: provide a stable VS0 entrypoint with explicit named exports
 * Constraints: deterministic logic, respect module boundaries
 */

export type {
	EventEnvelope,
	ImplementsEventEnvelopeContract,
} from './data-contracts/event-envelope';

export type {
	AuthoritySnapshot,
	ImplementsAuthoritySnapshotContract,
} from './data-contracts/authority-snapshot';

export type {
	SkillTier,
	TierDefinition,
	SkillRequirement,
	SkillTag,
	SkillGrant,
	WorkspaceScheduleProposedPayload,
	ImplementsScheduleProposedPayloadContract,
} from './data-contracts/skill-tier';
export {
	TIER_DEFINITIONS,
	getTierDefinition,
	resolveSkillTier,
	getTier,
	getTierRank,
	tierSatisfies,
} from './data-contracts/skill-tier';

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
} from './data-contracts/account/account-contract';

export type {
	DomainError,
	CommandSuccess,
	CommandFailure,
	CommandResult,
} from './data-contracts/command-result-contract';
export {
	commandSuccess,
	commandFailure,
	commandFailureFrom,
} from './data-contracts/command-result-contract';

export type {
	DlqTier,
	OutboxRecord,
	OutboxStatus,
	ImplementsOutboxContract,
} from './infra-contracts/outbox-contract';
export { buildIdempotencyKey } from './infra-contracts/outbox-contract';

export type {
	VersionGuardInput,
	VersionGuardResult,
	ImplementsVersionGuard,
} from './infra-contracts/version-guard';
export { applyVersionGuard, versionGuardAllows } from './infra-contracts/version-guard';

export type {
	ReadConsistencyMode,
	ReadConsistencyContext,
	ImplementsReadConsistency,
} from './infra-contracts/read-consistency';
export { resolveReadConsistency } from './infra-contracts/read-consistency';

export type {
	StalenessTier,
	ImplementsStalenessContract,
} from './infra-contracts/staleness-contract';
export { StalenessMs, getSlaMs, isStale } from './infra-contracts/staleness-contract';

export type {
	RateLimitConfig,
	CircuitBreakerConfig,
	BulkheadConfig,
	ResilienceContract,
	ImplementsResilienceContract,
} from './infra-contracts/resilience-contract';
export { DEFAULT_RATE_LIMIT, DEFAULT_CIRCUIT_BREAKER } from './infra-contracts/resilience-contract';

export type {
	ClaimsRefreshTrigger,
	TokenRefreshSignal,
	ClaimsRefreshOutcome,
	ClaimsRefreshHandshake,
	ClientTokenRefreshObligation,
	ImplementsTokenRefreshContract,
} from './infra-contracts/token-refresh-contract';
export {
	TOKEN_REFRESH_SIGNAL,
	CLIENT_TOKEN_REFRESH_OBLIGATION,
} from './infra-contracts/token-refresh-contract';

export { TAG_CATEGORIES, tagSlugRef } from './data-contracts/tag-authority';
export type {
	TagCategory,
	CentralizedTagDeleteRule,
	CentralizedTagEntry,
	TagSlugRef,
	TagCreatedPayload,
	TagUpdatedPayload,
	TagDeprecatedPayload,
	TagDeletedPayload,
	TagLifecycleEventPayloadMap,
	TagLifecycleEventKey,
	ITagReadPort,
	ImplementsTagStaleGuard,
} from './data-contracts/tag-authority';

export type {
	SearchDomain,
	SemanticSearchQuery,
	SemanticSearchHit,
	SemanticSearchResult,
	NotificationChannel,
	NotificationPriority,
	TaxonomyDimension,
	TaxonomyNode,
} from './data-contracts/semantic/semantic-contracts';

export type { IAuthService, AuthUser } from './ports';
export type { IFirestoreRepo, FirestoreDoc, Timestamp, WriteOptions } from './ports';
export type { IMessaging, PushNotificationPayload } from './ports';
export type { IFileStore, UploadOptions } from './ports';

export type {
	ScheduleStatus,
	ScheduleItem,
	Location,
} from './data-contracts/scheduling/schedule-contract';
