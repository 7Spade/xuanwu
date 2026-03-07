# Files

## File: src/shared-infra/backend-firebase/functions/src/claims/claims-refresh.fn.ts
```typescript
import { onRequest } from "firebase-functions/v2/https";
⋮----
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { initializeApp, getApps } from "firebase-admin/app";
import type { EventEnvelope } from "../types.js";
⋮----
interface ClaimsRefreshPayload {
  readonly userId: string;
  readonly orgId?: string;
  readonly roles?: string[];
  readonly scopes?: string[];
}
```

## File: src/shared-infra/backend-firebase/functions/src/dlq/dlq-block.fn.ts
```typescript
import { onRequest } from "firebase-functions/v2/https";
⋮----
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { initializeApp, getApps } from "firebase-admin/app";
⋮----
interface DlqBlockRecord {
  readonly eventId: string;
  readonly eventType: string;
  readonly aggregateId: string;
  readonly traceId: string;
  readonly [key: string]: unknown;
}
```

## File: src/shared-infra/backend-firebase/functions/src/dlq/dlq-review.fn.ts
```typescript
import { onRequest } from "firebase-functions/v2/https";
⋮----
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { initializeApp, getApps } from "firebase-admin/app";
⋮----
interface DlqReviewRecord {
  readonly eventId: string;
  readonly eventType: string;
  readonly aggregateId?: string;
  readonly traceId: string;
  readonly idempotencyKey: string;
  readonly [key: string]: unknown;
}
```

## File: src/shared-infra/backend-firebase/functions/src/dlq/dlq-safe.fn.ts
```typescript
import { onRequest } from "firebase-functions/v2/https";
⋮----
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { initializeApp, getApps } from "firebase-admin/app";
⋮----
interface DlqSafeRecord {
  readonly eventId: string;
  readonly traceId: string;
  readonly idempotencyKey: string;
  readonly [key: string]: unknown;
}
⋮----
function sleep(ms: number): Promise<void>
```

## File: src/shared-infra/backend-firebase/functions/src/gateway/command-gateway.fn.ts
```typescript
import { onRequest } from "firebase-functions/v2/https";
⋮----
import { randomUUID } from "crypto";
interface CommandSuccess {
  readonly success: true;
  readonly aggregateId: string;
  readonly version: number;
}
interface DomainError {
  readonly code: string;
  readonly message: string;
  readonly aggregateId?: string;
}
interface CommandFailure {
  readonly success: false;
  readonly error: DomainError;
}
type CommandResult = CommandSuccess | CommandFailure;
⋮----
function checkRateLimit(key: string): boolean
```

## File: src/shared-infra/backend-firebase/functions/src/gateway/webhook.fn.ts
```typescript
import { onRequest } from "firebase-functions/v2/https";
⋮----
import { randomUUID } from "crypto";
```

## File: src/shared-infra/backend-firebase/functions/src/ier/background.lane.fn.ts
```typescript
import { onRequest } from "firebase-functions/v2/https";
⋮----
import type { EventEnvelope } from "../types.js";
```

## File: src/shared-infra/backend-firebase/functions/src/ier/critical.lane.fn.ts
```typescript
import { onRequest } from "firebase-functions/v2/https";
⋮----
import type { EventEnvelope } from "../types.js";
```

## File: src/shared-infra/backend-firebase/functions/src/ier/ier.fn.ts
```typescript
import { onRequest } from "firebase-functions/v2/https";
⋮----
import type { EventEnvelope } from "../types.js";
⋮----
export function resolveLane(
  eventType: string
): "CRITICAL" | "STANDARD" | "BACKGROUND"
```

## File: src/shared-infra/backend-firebase/functions/src/ier/standard.lane.fn.ts
```typescript
import { onRequest } from "firebase-functions/v2/https";
⋮----
import type { EventEnvelope } from "../types.js";
```

## File: src/shared-infra/backend-firebase/functions/src/observability/domain-errors.fn.ts
```typescript
import { onRequest } from "firebase-functions/v2/https";
⋮----
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { initializeApp, getApps } from "firebase-admin/app";
⋮----
type ErrorLevel = "INFO" | "WARN" | "ERROR" | "CRITICAL";
type ErrorSource =
  | "WS_TX_RUNNER"
  | "SCHEDULE_SAGA"
  | "DLQ_SECURITY_BLOCK"
  | "STALE_TAG_WARNING"
  | "TOKEN_REFRESH_FAILURE"
  | "GENERIC";
interface DomainErrorEvent {
  readonly level: ErrorLevel;
  readonly source: ErrorSource;
  readonly traceId?: string;
  readonly aggregateId?: string;
  readonly eventType?: string;
  readonly message: string;
  readonly details?: unknown;
}
```

## File: src/shared-infra/backend-firebase/functions/src/observability/domain-metrics.fn.ts
```typescript
import { onRequest } from "firebase-functions/v2/https";
⋮----
import { getFirestore, Timestamp, FieldValue } from "firebase-admin/firestore";
import { initializeApp, getApps } from "firebase-admin/app";
⋮----
interface MetricEvent {
  readonly metricType:
    | "IER_THROUGHPUT"
    | "IER_LATENCY"
    | "FUNNEL_PROCESSING"
    | "RELAY_LAG"
    | "RATE_LIMIT_HIT"
    | "CIRCUIT_OPEN"
    | "CIRCUIT_HALF_OPEN"
    | "CLAIMS_REFRESH_SUCCESS";
  readonly lane?: "CRITICAL" | "STANDARD" | "BACKGROUND";
  readonly traceId?: string;
  readonly valueMs?: number;
  readonly labels?: Record<string, string>;
}
```

## File: src/shared-infra/backend-firebase/functions/src/projection/critical-proj.fn.ts
```typescript
import { onRequest } from "firebase-functions/v2/https";
⋮----
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { initializeApp, getApps } from "firebase-admin/app";
import type { EventEnvelope } from "../types.js";
import {
  PROJ_STALE_CRITICAL_MS,
} from "../staleness-contract.js";
```

## File: src/shared-infra/backend-firebase/functions/src/projection/event-funnel.fn.ts
```typescript
import { onRequest } from "firebase-functions/v2/https";
⋮----
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { initializeApp, getApps } from "firebase-admin/app";
import type { EventEnvelope } from "../types.js";
import {
  PROJ_STALE_CRITICAL_MS,
  PROJ_STALE_STANDARD_MS,
} from "../staleness-contract.js";
⋮----
async function applyVersionGuard(
  db: FirebaseFirestore.Firestore,
  viewCollection: string,
  aggregateId: string,
  incomingVersion: number
): Promise<boolean>
⋮----
interface ProjectionTarget {
  viewCollection: string;
  lane: "CRITICAL" | "STANDARD";
}
function resolveProjectionTarget(eventType: string): ProjectionTarget | null
function buildProjectionUpdate(envelope: EventEnvelope): Record<string, unknown>
function checkSla(lane: "CRITICAL" | "STANDARD", processingMs: number): boolean
```

## File: src/shared-infra/backend-firebase/functions/src/projection/standard-proj.fn.ts
```typescript
import { onRequest } from "firebase-functions/v2/https";
⋮----
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { initializeApp, getApps } from "firebase-admin/app";
import type { EventEnvelope } from "../types.js";
import {
  PROJ_STALE_STANDARD_MS,
} from "../staleness-contract.js";
```

## File: src/shared-infra/backend-firebase/functions/src/relay/outbox-relay.fn.ts
```typescript
import { onRequest } from "firebase-functions/v2/https";
⋮----
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { initializeApp, getApps } from "firebase-admin/app";
import type { EventEnvelope } from "../types.js";
import { dlqCollectionName } from "../types.js";
⋮----
interface OutboxRecord extends EventEnvelope {
  deliveryAttempts: number;
  lastAttemptAt?: Timestamp;
  status: "PENDING" | "DELIVERED" | "FAILED";
}
⋮----
async function deliverToIer(record: OutboxRecord): Promise<void>
async function moveToDlq(
  db: FirebaseFirestore.Firestore,
  record: OutboxRecord,
  error: unknown
): Promise<void>
function getDlqProcessorUrl(dlqTier: string): string | null
function sleep(ms: number): Promise<void>
```

## File: src/shared-infra/backend-firebase/functions/src/staleness-contract.ts
```typescript

```

## File: src/shared-infra/backend-firebase/functions/src/types.ts
```typescript
import { Timestamp } from "firebase-admin/firestore";
export interface EventEnvelope {
  readonly eventId: string;
  readonly aggregateId: string;
  readonly aggregateVersion: number;
  readonly traceId: string;
  readonly eventType: string;
  readonly payload: unknown;
  readonly idempotencyKey: string;
  readonly lane: "CRITICAL" | "STANDARD" | "BACKGROUND";
  readonly dlqTier: "SAFE_AUTO" | "REVIEW_REQUIRED" | "SECURITY_BLOCK";
  readonly createdAt: Timestamp;
}
export type DlqTier = "SAFE_AUTO" | "REVIEW_REQUIRED" | "SECURITY_BLOCK";
export function dlqCollectionName(tier: DlqTier): string
```

## File: src/shared-infra/frontend-firebase/analytics/analytics.client.ts
```typescript
import { getAnalytics, type Analytics } from 'firebase/analytics';
import { app } from '../app.client';
```

## File: src/shared-infra/frontend-firebase/app.client.ts
```typescript
import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { firebaseConfig } from './config/firebase.config';
```

## File: src/shared-infra/frontend-firebase/auth/auth.client.ts
```typescript
import { getAuth, type Auth } from 'firebase/auth';
import { app } from '../app.client';
```

## File: src/shared-infra/frontend-firebase/firestore/firestore.client.ts
```typescript
import { getFirestore, type Firestore } from 'firebase/firestore';
import { app } from '../app.client';
```

## File: src/shared-infra/frontend-firebase/firestore/index.ts
```typescript

```

## File: src/shared-infra/frontend-firebase/index.ts
```typescript

```

## File: src/shared-infra/frontend-firebase/messaging/messaging.client.ts
```typescript
import { getMessaging, type Messaging } from 'firebase/messaging';
import { app } from '../app.client';
```

## File: src/shared-infra/frontend-firebase/storage/storage.client.ts
```typescript
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { app } from '../app.client';
```

## File: src/shared-kernel/constants/location-units.ts
```typescript
export type LocationUnitKey =
  | 'dong'
  | 'lou'
  | 'qu'
  | 'shi'
  | 'hao'
  | 'chang'
  | 'cang'
  | 'qi'
  | 'zuo'
  | 'jidi'
  | 'zhu';
export interface LocationUnitMeta {
  key: LocationUnitKey;
  zhLabel: string;
  enLabel: string;
  description: string;
  example: string;
}
⋮----
export function findLocationUnit(key: string): LocationUnitMeta | undefined
```

## File: src/shared-kernel/constants/routes.ts
```typescript

```

## File: src/shared-kernel/constants/skills.ts
```typescript
export type SkillGroup =
  | 'CivilStructural'
  | 'MEP'
  | 'FinishingWorks'
  | 'Landscape'
  | 'TemporaryWorks'
  | 'SiteManagement'
  | 'Logistics'
  | 'BIM'
  | 'ProjectConsulting';
export type SkillSubCategory =
  | 'ConcreteFormwork'
  | 'MasonryStructural'
  | 'EarthSpecial'
  | 'ElectricalWorks'
  | 'MechanicalPlumbing'
  | 'FireProtection'
  | 'WetWorks'
  | 'DryWorks'
  | 'SoftLandscape'
  | 'HardLandscape'
  | 'TempScaffolding'
  | 'TempShoring'
  | 'TempSiteFacilities'
  | 'HeavyEquipmentOps'
  | 'SpecialistTrades'
  | 'EngineeringTechnical'
  | 'SafetyQuality'
  | 'ProjectMgmt'
  | 'MaterialLogistics'
  | 'Environmental'
  | 'BIMModeling'
  | 'DigitalConstruction'
  | 'ContractProcurement'
  | 'ConsultingAdvisory'
  | 'ClaimsDisputes';
export interface SkillGroupMeta {
  group: SkillGroup;
  zhLabel: string;
  enLabel: string;
  subCategories: readonly SkillSubCategory[];
}
export interface SkillSubCategoryMeta {
  subCategory: SkillSubCategory;
  group: SkillGroup;
  zhLabel: string;
  enLabel: string;
}
export interface SkillDefinition {
  slug: string;
  name: string;
  group: SkillGroup;
  subCategory: SkillSubCategory;
  description?: string;
}
⋮----
export type SkillSlug = (typeof SKILLS)[number]['slug'];
⋮----
export function findSkill(slug: string): SkillDefinition | undefined
```

## File: src/shared-kernel/constants/taiwan-address.ts
```typescript
export type TwCountyType =
  | 'municipality'
  | 'city'
  | 'county';
export interface TwDistrictMeta {
  name: string;
  zip: string;
}
export interface TwCountyMeta {
  name: string;
  type: TwCountyType;
  enName: string;
  districts: readonly TwDistrictMeta[];
}
⋮----
export type TwCountyName = (typeof TW_COUNTIES)[number]['name'];
⋮----
export function getTwDistricts(countyName: string): readonly TwDistrictMeta[]
```

## File: src/shared-kernel/data-contracts/account/account-contract.ts
```typescript
import type { Timestamp } from '@/shared-kernel/ports/i-firestore.repo';
import type { SkillGrant } from './skill-grant-contract';
export type AccountType = 'user' | 'organization';
export type OrganizationRole = 'Owner' | 'Admin' | 'Member' | 'Guest';
export type Presence = 'active' | 'away' | 'offline';
export type InviteState = 'pending' | 'accepted' | 'expired';
export type NotificationType = 'info' | 'alert' | 'success';
export interface ThemeConfig {
  primary: string;
  background: string;
  accent: string;
}
export interface Wallet {
  balance: number;
}
export interface ExpertiseBadge {
  id: string;
  name: string;
  icon?: string;
}
export interface MemberReference {
  id: string;
  name: string;
  email: string;
  role: OrganizationRole;
  presence: Presence;
  isExternal?: boolean;
  expiryDate?: Timestamp;
  skillGrants?: SkillGrant[];
}
export interface Team {
  id: string;
  name: string;
  description: string;
  type: 'internal' | 'external';
  memberIds: string[];
}
export interface PartnerInvite {
  id: string;
  email: string;
  teamId: string;
  role: OrganizationRole;
  inviteState: InviteState;
  invitedAt: Timestamp;
  protocol: string;
}
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  timestamp: number;
}
export interface Account {
  id: string;
  name: string;
  accountType: AccountType;
  email?: string;
  photoURL?: string;
  bio?: string;
  achievements?: string[];
  expertiseBadges?: ExpertiseBadge[];
  skillGrants?: SkillGrant[];
  wallet?: Wallet;
  description?: string;
  ownerId?: string;
  role?: OrganizationRole;
  theme?: ThemeConfig;
  members?: MemberReference[];
  memberIds?: string[];
  teams?: Team[];
  createdAt?: Timestamp;
}
```

## File: src/shared-kernel/data-contracts/account/skill-grant-contract.ts
```typescript
import type { Timestamp } from '@/shared-kernel/ports/i-firestore.repo';
import type { SkillTier } from '../skill-tier';
import type { TagSlugRef } from '../tag-authority';
export interface SkillTag {
  slug: string;
  name: string;
  category?: string;
  description?: string;
}
export interface SkillGrant {
  tagSlug: TagSlugRef;
  tagName?: string;
  tagId?: string;
  tier: SkillTier;
  xp: number;
  earnedInOrgId?: string;
  grantedAt?: Timestamp;
}
```

## File: src/shared-kernel/data-contracts/authority-snapshot/index.ts
```typescript
export interface AuthoritySnapshot {
  readonly subjectId: string;
  readonly claims?: Readonly<Record<string, unknown>>;
  readonly roles: readonly string[];
  readonly permissions: readonly string[];
  readonly scopes?: readonly string[];
  readonly snapshotAt: string;
  readonly tokenTtlMs?: number;
  readonly readModelVersion: number;
}
export interface ImplementsAuthoritySnapshotContract {
  readonly implementsAuthoritySnapshot: true;
}
```

## File: src/shared-kernel/data-contracts/command-result-contract/index.ts
```typescript
export interface DomainError {
  readonly code: string;
  readonly message: string;
  readonly context?: Record<string, unknown>;
}
export interface CommandSuccess {
  readonly success: true;
  readonly aggregateId: string;
  readonly version: number;
}
export interface CommandFailure {
  readonly success: false;
  readonly error: DomainError;
}
export type CommandResult = CommandSuccess | CommandFailure;
export function commandSuccess(aggregateId: string, version: number): CommandSuccess
export function commandFailure(error: DomainError): CommandFailure
export function commandFailureFrom(
  code: string,
  message: string,
  context?: Record<string, unknown>,
): CommandFailure
```

## File: src/shared-kernel/data-contracts/event-envelope/index.ts
```typescript
export interface EventEnvelope<TPayload = unknown> {
  readonly eventId: string;
  readonly eventType: string;
  readonly occurredAt: string;
  readonly sourceId: string;
  readonly payload: TPayload;
  readonly version?: number;
  readonly traceId?: string;
  readonly idempotencyKey?: string;
  readonly causationId?: string;
  readonly correlationId?: string;
}
export interface ImplementsEventEnvelopeContract {
  readonly implementsEventEnvelope: true;
}
```

## File: src/shared-kernel/data-contracts/scheduling/workspace-schedule-proposed.contract.ts
```typescript
import type { SkillRequirement } from '../skill-tier';
export interface WorkspaceScheduleProposedPayload {
  readonly scheduleItemId: string;
  readonly workspaceId: string;
  readonly orgId: string;
  readonly title: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly proposedBy: string;
  readonly intentId?: string;
  readonly skillRequirements?: SkillRequirement[];
  readonly locationId?: string;
  readonly traceId?: string;
}
export interface ImplementsScheduleProposedPayloadContract {
  readonly implementsScheduleProposedPayload: true;
}
```

## File: src/shared-kernel/data-contracts/semantic/semantic-contracts.ts
```typescript
export type SearchDomain =
  | 'workspace'
  | 'member'
  | 'schedule'
  | 'tag'
  | 'skill'
  | 'organization'
  | 'document';
export interface SemanticSearchQuery {
  readonly query: string;
  readonly domains: readonly SearchDomain[];
  readonly tagFilters?: readonly string[];
  readonly limit?: number;
  readonly cursor?: string;
  readonly traceId?: string;
}
export interface SemanticSearchHit {
  readonly id: string;
  readonly domain: SearchDomain;
  readonly title: string;
  readonly subtitle?: string;
  readonly score: number;
  readonly tags: readonly string[];
  readonly href?: string;
}
export interface SemanticSearchResult {
  readonly hits: readonly SemanticSearchHit[];
  readonly totalCount: number;
  readonly cursor?: string;
  readonly traceId?: string;
}
export type NotificationChannel = 'push' | 'in-app' | 'email' | 'sms';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'critical';
export type TaxonomyDimension =
  | 'skill'
  | 'location'
  | 'temporal'
  | 'organizational'
  | 'compliance';
export interface TaxonomyNode {
  readonly slug: string;
  readonly label: string;
  readonly dimension: TaxonomyDimension;
  readonly parentSlug?: string;
  readonly depth: number;
  readonly metadata?: Record<string, unknown>;
}
```

## File: src/shared-kernel/data-contracts/tag-authority/index.ts
```typescript
export type TagCategory = (typeof TAG_CATEGORIES)[number];
export type TagDeleteRule = 'block' | 'archive' | 'cascade';
export type CentralizedTagDeleteRule = 'allow' | 'block-if-referenced';
export interface CentralizedTagEntry {
  readonly tagSlug: string;
  readonly label: string;
  readonly category: TagCategory;
  readonly deprecatedAt?: string;
  readonly replacedByTagSlug?: string;
  readonly deleteRule: CentralizedTagDeleteRule;
  readonly createdBy: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}
export type TagSlugRef = string & { readonly _brand: 'TagSlugRef' };
export function tagSlugRef(raw: string): TagSlugRef
export interface TagCreatedPayload {
  readonly tagSlug: string;
  readonly label: string;
  readonly category: TagCategory;
  readonly createdBy: string;
  readonly createdAt: string;
}
export interface TagUpdatedPayload {
  readonly tagSlug: string;
  readonly label: string;
  readonly category: TagCategory;
  readonly updatedBy: string;
  readonly updatedAt: string;
}
export interface TagDeprecatedPayload {
  readonly tagSlug: string;
  readonly replacedByTagSlug?: string;
  readonly deprecatedBy: string;
  readonly deprecatedAt: string;
}
export interface TagDeletedPayload {
  readonly tagSlug: string;
  readonly deletedBy: string;
  readonly deletedAt: string;
}
export interface TagLifecycleEventPayloadMap {
  'tag:created':    TagCreatedPayload;
  'tag:updated':    TagUpdatedPayload;
  'tag:deprecated': TagDeprecatedPayload;
  'tag:deleted':    TagDeletedPayload;
}
export type TagLifecycleEventKey = keyof TagLifecycleEventPayloadMap;
export interface ITagReadPort {
  getLabelBySlug(tagSlug: string): Promise<string | null>;
  getLabelsBySlug(tagSlugs: string[]): Promise<Record<string, string>>;
  isActive(tagSlug: string): Promise<boolean>;
}
⋮----
getLabelBySlug(tagSlug: string): Promise<string | null>;
getLabelsBySlug(tagSlugs: string[]): Promise<Record<string, string>>;
isActive(tagSlug: string): Promise<boolean>;
⋮----
export interface ImplementsTagStaleGuard {
  readonly implementsTagStaleGuard: true;
  readonly maxStalenessMs: number;
}
```

## File: src/shared-kernel/index.ts
```typescript

```

## File: src/shared-kernel/infra-contracts/outbox-contract/index.ts
```typescript
export type DlqTier = 'SAFE_AUTO' | 'REVIEW_REQUIRED' | 'SECURITY_BLOCK';
export type OutboxStatus = 'pending' | 'relayed' | 'dlq';
export interface OutboxRecord {
  readonly outboxId: string;
  readonly idempotencyKey: string;
  readonly dlqTier: DlqTier;
  readonly payload: string;
  readonly createdAt: string;
  readonly status: OutboxStatus;
}
export function buildIdempotencyKey(
  eventId: string,
  aggId: string,
  version: number,
): string
export interface ImplementsOutboxContract {
  readonly implementsOutboxContract: true;
}
```

## File: src/shared-kernel/infra-contracts/read-consistency/index.ts
```typescript
export type ReadConsistencyMode = 'STRONG_READ' | 'EVENTUAL_READ';
export interface ReadConsistencyContext {
  readonly isFinancial: boolean;
  readonly isSecurity: boolean;
  readonly isIrreversible: boolean;
}
export function resolveReadConsistency(ctx: ReadConsistencyContext): ReadConsistencyMode
export interface ImplementsReadConsistency {
  readonly readConsistencyMode: ReadConsistencyMode;
}
```

## File: src/shared-kernel/infra-contracts/resilience-contract/index.ts
```typescript
export interface RateLimitConfig {
  readonly perUserLimit: number;
  readonly perOrgLimit: number;
  readonly windowMs: number;
}
export interface CircuitBreakerConfig {
  readonly failureThreshold: number;
  readonly openDurationMs: number;
}
export interface BulkheadConfig {
  readonly sliceId: string;
  readonly maxConcurrency: number;
}
export interface ResilienceContract {
  readonly rateLimit: RateLimitConfig;
  readonly circuitBreaker: CircuitBreakerConfig;
  readonly bulkhead: BulkheadConfig;
}
⋮----
export interface ImplementsResilienceContract {
  readonly implementsResilienceContract: true;
}
```

## File: src/shared-kernel/infra-contracts/staleness-contract/index.ts
```typescript
export type StalenessTier = 'TAG' | 'CRITICAL' | 'STANDARD' | 'DEMAND_BOARD';
export function getSlaMs(tier: StalenessTier): number
export function isStale(ageMs: number, tier: StalenessTier): boolean
export interface ImplementsStalenessContract {
  readonly stalenessTier: StalenessTier;
}
```

## File: src/shared-kernel/infra-contracts/token-refresh-contract/index.ts
```typescript
export type ClaimsRefreshTrigger = 'RoleChanged' | 'PolicyChanged';
⋮----
export type TokenRefreshSignal = typeof TOKEN_REFRESH_SIGNAL;
export type ClaimsRefreshOutcome = 'success' | 'failure';
export interface ClaimsRefreshHandshake {
  readonly trigger: ClaimsRefreshTrigger;
  readonly accountId: string;
  readonly outcome: ClaimsRefreshOutcome;
  readonly completedAt: string;
  readonly traceId: string;
}
export interface ClientTokenRefreshObligation {
  readonly signal: TokenRefreshSignal;
  readonly action: 'force_refresh_and_reattach';
}
⋮----
export interface ImplementsTokenRefreshContract {
  readonly implementsTokenRefreshContract: true;
}
```

## File: src/shared-kernel/infra-contracts/version-guard/index.ts
```typescript
export interface VersionGuardInput {
  readonly eventVersion: number;
  readonly viewLastProcessedVersion: number;
}
export type VersionGuardResult = 'allow' | 'discard';
export function applyVersionGuard(input: VersionGuardInput): VersionGuardResult
export function versionGuardAllows(input: VersionGuardInput): boolean
export interface ImplementsVersionGuard {
  readonly implementsVersionGuard: true;
}
```

## File: src/shared-kernel/ports/i-auth.service.ts
```typescript
export interface AuthUser {
  readonly uid: string;
  readonly email: string | null;
  readonly displayName: string | null;
  readonly photoURL: string | null;
}
export interface IAuthService {
  signInWithEmailAndPassword(email: string, password: string): Promise<AuthUser>;
  createUserWithEmailAndPassword(email: string, password: string): Promise<AuthUser>;
  sendPasswordResetEmail(email: string): Promise<void>;
  signInAnonymously(): Promise<AuthUser>;
  updateProfile(user: AuthUser, profile: { displayName?: string; photoURL?: string }): Promise<void>;
  signOut(): Promise<void>;
  onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void;
  getCurrentUser(): AuthUser | null;
}
⋮----
signInWithEmailAndPassword(email: string, password: string): Promise<AuthUser>;
createUserWithEmailAndPassword(email: string, password: string): Promise<AuthUser>;
sendPasswordResetEmail(email: string): Promise<void>;
signInAnonymously(): Promise<AuthUser>;
updateProfile(user: AuthUser, profile:
signOut(): Promise<void>;
onAuthStateChanged(callback: (user: AuthUser | null)
getCurrentUser(): AuthUser | null;
```

## File: src/shared-kernel/ports/i-file-store.ts
```typescript
export interface UploadOptions {
  readonly contentType?: string;
}
export interface IFileStore {
  upload(path: string, file: File | Blob, options?: UploadOptions): Promise<string>;
  getDownloadURL(path: string): Promise<string>;
  deleteFile(path: string): Promise<void>;
}
⋮----
upload(path: string, file: File | Blob, options?: UploadOptions): Promise<string>;
getDownloadURL(path: string): Promise<string>;
deleteFile(path: string): Promise<void>;
```

## File: src/shared-kernel/ports/i-firestore.repo.ts
```typescript
export interface Timestamp {
  readonly seconds: number;
  readonly nanoseconds: number;
  toDate(): Date;
  toMillis(): number;
}
⋮----
toDate(): Date;
toMillis(): number;
⋮----
export interface FirestoreDoc<T = Record<string, unknown>> {
  readonly id: string;
  readonly data: T;
}
export interface WriteOptions {
  readonly aggregateVersion?: number;
  readonly merge?: boolean;
}
export interface IFirestoreRepo {
  getDoc<T>(collectionPath: string, docId: string): Promise<FirestoreDoc<T> | null>;
  getDocs<T>(collectionPath: string): Promise<FirestoreDoc<T>[]>;
  setDoc<T>(collectionPath: string, docId: string, data: T, opts?: WriteOptions): Promise<void>;
  deleteDoc(collectionPath: string, docId: string): Promise<void>;
  onSnapshot<T>(
    collectionPath: string,
    callback: (docs: FirestoreDoc<T>[]) => void,
  ): () => void;
}
⋮----
getDoc<T>(collectionPath: string, docId: string): Promise<FirestoreDoc<T> | null>;
getDocs<T>(collectionPath: string): Promise<FirestoreDoc<T>[]>;
setDoc<T>(collectionPath: string, docId: string, data: T, opts?: WriteOptions): Promise<void>;
deleteDoc(collectionPath: string, docId: string): Promise<void>;
onSnapshot<T>(
    collectionPath: string,
    callback: (docs: FirestoreDoc<T>[]) => void,
): ()
```

## File: src/shared-kernel/ports/i-messaging.ts
```typescript
export interface PushNotificationPayload {
  readonly title: string;
  readonly body: string;
  readonly data?: Record<string, string>;
}
export interface IMessaging {
  send(
    fcmToken: string,
    payload: PushNotificationPayload,
    traceId: string,
  ): Promise<void>;
  getToken(): Promise<string | null>;
  onForegroundMessage(
    callback: (payload: PushNotificationPayload) => void,
  ): () => void;
}
⋮----
send(
    fcmToken: string,
    payload: PushNotificationPayload,
    traceId: string,
  ): Promise<void>;
getToken(): Promise<string | null>;
onForegroundMessage(
    callback: (payload: PushNotificationPayload) => void,
): ()
```

## File: src/shared-kernel/ports/index.ts
```typescript

```

## File: src/features/workforce-scheduling.slice/application/commands/actions/index.ts
```typescript

```

## File: src/features/workforce-scheduling.slice/application/commands/actions/lifecycle.ts
```typescript
import {
  approveScheduleItemWithMemberThroughGateway,
  updateScheduleItemDateRangeThroughGateway,
  updateScheduleItemStatusThroughGateway,
} from '@/shared-infra/gateway-command';
import {
  type CommandResult,
  commandFailureFrom,
  commandSuccess,
} from '@/shared-kernel';
export async function approveScheduleItemWithMember(
  organizationId: string,
  itemId: string,
  memberId: string
): Promise<CommandResult>
export async function updateScheduleItemStatus(
  organizationId: string,
  itemId: string,
  newStatus: 'OFFICIAL' | 'REJECTED' | 'COMPLETED'
): Promise<CommandResult>
export async function updateScheduleItemDateRange(
  accountId: string,
  itemId: string,
  startDate: Date,
  endDate: Date
): Promise<CommandResult>
```

## File: src/features/workforce-scheduling.slice/application/commands/actions/timeline.ts
```typescript
import { updateScheduleItemDateRangeThroughGateway } from '@/shared-infra/gateway-command';
import {
  type CommandResult,
  commandFailureFrom,
  commandSuccess,
} from '@/shared-kernel';
export async function updateTimelineItemDateRange(
  accountId: string,
  itemId: string,
  startDate: Date,
  endDate: Date
): Promise<CommandResult>
```

## File: src/features/workforce-scheduling.slice/application/commands/actions/workspace.ts
```typescript
import { addDays, isSameDay, startOfDay } from 'date-fns';
import {
  createScheduleItemThroughGateway,
  assignMemberToScheduleItemThroughGateway,
  unassignMemberFromScheduleItemThroughGateway,
} from '@/shared-infra/gateway-command';
import {
  type CommandResult,
  commandFailureFrom,
  commandSuccess,
} from '@/shared-kernel';
import type { ScheduleItem } from '@/shared-kernel';
function isStartOfDay(date: Date): boolean
function resolveTemporalRange(
  startInput?: Date | null,
  endInput?: Date | null,
  now = new Date()
):
export async function createScheduleItem(
  itemData: Omit<ScheduleItem, 'id' | 'createdAt' | 'updatedAt' | 'startDate' | 'endDate'> & {
    startDate?: Date | null;
    endDate?: Date | null;
  }
): Promise<CommandResult>
export async function assignMember(
  accountId: string,
  itemId: string,
  memberId: string
): Promise<CommandResult>
export async function unassignMember(
  accountId: string,
  itemId: string,
  memberId: string
): Promise<CommandResult>
```

## File: src/features/workforce-scheduling.slice/application/commands/sched-outbox.ts
```typescript
import {
  publishOrgEvent,
  type OrganizationEventKey,
  type OrganizationEventPayloadMap,
} from '@/features/organization.slice';
import type { DlqTier } from '@/shared-kernel';
export type SchedulingOutboxLane = 'STANDARD_LANE' | 'CRITICAL_LANE';
export interface SchedulingOutboxRouting {
  lane: SchedulingOutboxLane;
  dlqTier: DlqTier;
}
export interface SchedulingOutboxAck {
  lane: SchedulingOutboxLane;
  dlqTier: DlqTier;
}
⋮----
export async function enqueueSchedulingOutboxEvent<K extends OrganizationEventKey>(
  eventKey: K,
  payload: OrganizationEventPayloadMap[K],
  routing: SchedulingOutboxRouting = DEFAULT_SCHEDULING_OUTBOX_ROUTING,
): Promise<SchedulingOutboxAck>
```

## File: src/features/workforce-scheduling.slice/application/projectors/runtime/account-schedule.ts
```typescript
type ProjectionUpdatedAt = unknown;
export interface AccountScheduleProjection {
  accountId: string;
  activeAssignmentIds: string[];
  assignmentIndex: Record<string, AccountScheduleAssignment>;
  readModelVersion: number;
  lastProcessedVersion?: number;
  traceId?: string;
  updatedAt: ProjectionUpdatedAt;
}
export interface AccountScheduleAssignment {
  scheduleItemId: string;
  workspaceId: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'active' | 'completed';
}
```

## File: src/features/workforce-scheduling.slice/application/queries/timeline.queries.ts
```typescript
import { subscribeToWorkspaceTimelineItemsFromGateway } from '@/shared-infra/gateway-query';
import type { ScheduleItem } from '@/shared-kernel';
type Unsubscribe = () => void;
export function subscribeToWorkspaceTimelineItems(
  accountId: string,
  workspaceId: string,
  onUpdate: (items: ScheduleItem[]) => void,
  onError?: (error: Error) => void
): Unsubscribe
```

## File: src/features/workforce-scheduling.slice/application/selectors/index.ts
```typescript
import { subDays, isFuture, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import type { ScheduleItem } from '@/shared-kernel';
export interface ScheduleItemWithWorkspace extends ScheduleItem {
  workspaceName: string;
}
export type ScheduleItemWithMembers<M> = ScheduleItemWithWorkspace & {
  members: M[];
};
export function selectAllScheduleItems(
  scheduleItems: Record<string, ScheduleItem>,
  workspaces: Record<string, { name?: string }>
): ScheduleItemWithWorkspace[]
export function selectPendingProposals(
  items: ScheduleItemWithWorkspace[]
): ScheduleItemWithWorkspace[]
export function selectDecisionHistory(
  items: ScheduleItemWithWorkspace[]
): ScheduleItemWithWorkspace[]
export function selectUpcomingEvents<M>(
  items: ScheduleItemWithWorkspace[],
  members: M[]
): ScheduleItemWithMembers<M>[]
export function selectPresentEvents<M>(
  items: ScheduleItemWithWorkspace[],
  members: M[]
): ScheduleItemWithMembers<M>[]
```

## File: src/features/workforce-scheduling.slice/domain/policy-mapper/index.ts
```typescript
import type { TagSlugRef, SkillRequirement, SkillTier } from '@/shared-kernel';
import { getTierRank } from '@/shared-kernel';
export interface SemanticContext {
  readonly workspaceId: string;
  readonly orgId: string;
  readonly skillRequirements: readonly SkillRequirement[];
  readonly startDate: string;
  readonly endDate: string;
  readonly locationId?: string;
}
export type AssignmentStrategy = 'open' | 'tier-gated' | 'skill-gated';
export interface AssignmentPolicy {
  readonly strategy: AssignmentStrategy;
  readonly maxCandidates: number;
  readonly requiredSkills: readonly SkillRequirement[];
  readonly minimumTier: SkillTier | undefined;
}
export interface ScheduleSlot {
  readonly tagSlug: TagSlugRef;
  readonly strategy: AssignmentStrategy;
  readonly minimumTier: SkillTier | undefined;
  readonly startDate: string;
  readonly endDate: string;
  readonly slotLabel: string;
}
function _isGenericTierSlug(tagSlug: TagSlugRef): boolean
function _highestTier(requirements: readonly SkillRequirement[]): SkillTier | undefined
export function resolveAssignmentPolicy(semanticContext: SemanticContext): AssignmentPolicy
export function mapToScheduleSlot(
  tagSlug: TagSlugRef,
  policy: AssignmentPolicy,
  startDate: string,
  endDate: string,
): ScheduleSlot
```

## File: src/features/workforce-scheduling.slice/domain/rules/schedule.rules.ts
```typescript
import type { ScheduleStatus } from '@/shared-kernel'
⋮----
export function canTransitionScheduleStatus(
  from: ScheduleStatus,
  to: ScheduleStatus
): boolean
```

## File: src/features/workforce-scheduling.slice/domain/types/aggregate.types.ts
```typescript
import { z } from 'zod';
⋮----
export type OrgScheduleStatus = (typeof ORG_SCHEDULE_STATUSES)[number];
⋮----
export type OrgScheduleProposal = z.infer<typeof orgScheduleProposalSchema>;
export interface WriteOp {
  path: string;
  data: Record<string, unknown>;
  arrayUnionFields?: Record<string, string[]>;
}
export type ScheduleApprovalResult =
  | { outcome: 'confirmed'; scheduleItemId: string; writeOp: WriteOp }
  | { outcome: 'rejected'; scheduleItemId: string; reason: string; writeOp: WriteOp };
```

## File: src/features/workforce-scheduling.slice/ports/command.port.ts
```typescript
import type { CommandResult, ScheduleItem, SkillRequirement } from '@/shared-kernel';
export interface CreateScheduleItemInput
  extends Omit<ScheduleItem, 'id' | 'createdAt' | 'updatedAt' | 'startDate' | 'endDate'> {
  startDate?: Date | null;
  endDate?: Date | null;
}
export interface ManualAssignOptions {
  workspaceId: string;
  orgId: string;
  title: string;
  startDate: string;
  endDate: string;
  traceId?: string;
}
export interface SchedulingCommandPort {
  createScheduleItem(input: CreateScheduleItemInput): Promise<CommandResult>;
  assignMember(accountId: string, itemId: string, memberId: string): Promise<CommandResult>;
  unassignMember(accountId: string, itemId: string, memberId: string): Promise<CommandResult>;
  approveScheduleItemWithMember(organizationId: string, itemId: string, memberId: string): Promise<CommandResult>;
  updateScheduleItemStatus(
    organizationId: string,
    itemId: string,
    newStatus: 'OFFICIAL' | 'REJECTED' | 'COMPLETED'
  ): Promise<CommandResult>;
  updateScheduleItemDateRange(
    accountId: string,
    itemId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CommandResult>;
  manualAssignScheduleMember(
    scheduleItemId: string,
    targetAccountId: string,
    assignedBy: string,
    opts: ManualAssignOptions,
    skillRequirements?: SkillRequirement[]
  ): Promise<CommandResult>;
  cancelScheduleProposalAction(
    scheduleItemId: string,
    orgId: string,
    workspaceId: string,
    cancelledBy: string,
    reason?: string,
    traceId?: string
  ): Promise<CommandResult>;
  completeOrgScheduleAction(
    scheduleItemId: string,
    orgId: string,
    workspaceId: string,
    targetAccountId: string,
    completedBy: string,
    traceId?: string
  ): Promise<CommandResult>;
}
⋮----
createScheduleItem(input: CreateScheduleItemInput): Promise<CommandResult>;
assignMember(accountId: string, itemId: string, memberId: string): Promise<CommandResult>;
unassignMember(accountId: string, itemId: string, memberId: string): Promise<CommandResult>;
approveScheduleItemWithMember(organizationId: string, itemId: string, memberId: string): Promise<CommandResult>;
updateScheduleItemStatus(
    organizationId: string,
    itemId: string,
    newStatus: 'OFFICIAL' | 'REJECTED' | 'COMPLETED'
  ): Promise<CommandResult>;
updateScheduleItemDateRange(
    accountId: string,
    itemId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CommandResult>;
manualAssignScheduleMember(
    scheduleItemId: string,
    targetAccountId: string,
    assignedBy: string,
    opts: ManualAssignOptions,
    skillRequirements?: SkillRequirement[]
  ): Promise<CommandResult>;
cancelScheduleProposalAction(
    scheduleItemId: string,
    orgId: string,
    workspaceId: string,
    cancelledBy: string,
    reason?: string,
    traceId?: string
  ): Promise<CommandResult>;
completeOrgScheduleAction(
    scheduleItemId: string,
    orgId: string,
    workspaceId: string,
    targetAccountId: string,
    completedBy: string,
    traceId?: string
  ): Promise<CommandResult>;
```

## File: src/features/workforce-scheduling.slice/ports/event.port.ts
```typescript
import type {
  OrganizationEventKey,
  OrganizationEventPayloadMap,
} from '@/features/organization.slice';
import type { DlqTier } from '@/shared-kernel';
export type SchedulingOutboxLane = 'STANDARD_LANE' | 'CRITICAL_LANE';
export interface SchedulingOutboxRouting {
  lane: SchedulingOutboxLane;
  dlqTier: DlqTier;
}
export interface SchedulingOutboxAck {
  lane: SchedulingOutboxLane;
  dlqTier: DlqTier;
}
export interface SchedulingEventPort {
  enqueueSchedulingOutboxEvent<K extends OrganizationEventKey>(
    eventKey: K,
    payload: OrganizationEventPayloadMap[K],
    routing?: SchedulingOutboxRouting,
  ): Promise<SchedulingOutboxAck>;
}
⋮----
enqueueSchedulingOutboxEvent<K extends OrganizationEventKey>(
    eventKey: K,
    payload: OrganizationEventPayloadMap[K],
    routing?: SchedulingOutboxRouting,
  ): Promise<SchedulingOutboxAck>;
```

## File: src/features/workforce-scheduling.slice/ports/index.ts
```typescript

```

## File: src/features/workforce-scheduling.slice/ui/components/runtime/decision-history-columns.tsx
```typescript
import { type ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { CheckCircle, XCircle, ArrowUpDown } from "lucide-react"
import { Badge } from "@/shadcn-ui/badge"
import { Button } from "@/shadcn-ui/button"
import type { ScheduleItem } from '@/shared-kernel'
export type DecisionHistoryItem = Pick<ScheduleItem, 'id' | 'title' | 'workspaceName' | 'status' | 'updatedAt'>
```

## File: src/features/workforce-scheduling.slice/ui/components/runtime/governance-sidebar.tsx
```typescript
import { Check, X } from "lucide-react";
import { Badge } from "@/shadcn-ui/badge";
import { Button } from "@/shadcn-ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shadcn-ui/card";
import { ScrollArea } from "@/shadcn-ui/scroll-area";
import type { ScheduleItem } from '@/shared-kernel';
import type { SkillRequirement } from '@/shared-kernel';
import { SKILLS } from '@/shared-kernel/constants/skills';
interface GovernanceSidebarProps {
  proposals: ScheduleItem[];
  onApprove: (item: ScheduleItem) => void;
  onReject: (item: ScheduleItem) => void;
}
```

## File: src/features/workforce-scheduling.slice/ui/components/runtime/org-schedule-governance.rows.tsx
```typescript

```

## File: src/features/workforce-scheduling.slice/ui/components/runtime/org-skill-pool-manager.tsx
```typescript
import { BookOpen, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useOptimistic, useState, useTransition } from 'react';
import { useApp } from '@/app-runtime/providers/app-provider';
import { getOrgSkillTags } from '@/features/skill-xp.slice';
import { addOrgSkillTagAction, removeOrgSkillTagAction } from '@/features/skill-xp.slice';
import { Badge } from '@/shadcn-ui/badge';
import { Button } from '@/shadcn-ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shadcn-ui/card';
import { toast } from '@/shadcn-ui/hooks/use-toast';
import { ScrollArea } from '@/shadcn-ui/scroll-area';
import {
  SKILL_GROUPS,
  SKILL_SUB_CATEGORY_BY_KEY,
  SKILLS,
  type SkillGroup,
  type SkillSubCategory,
} from '@/shared-kernel/constants/skills';
```

## File: src/features/workforce-scheduling.slice/ui/components/runtime/proposal-dialog.tsx
```typescript
import { format } from "date-fns";
import { CalendarIcon, ChevronsUpDown, MapPin, Plus, X } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { type DateRange } from "react-day-picker";
import { getOrgSkillTags } from "@/features/skill-xp.slice";
import { type Location } from "@/features/workspace.slice";
import { Badge } from "@/shadcn-ui/badge";
import { Button } from "@/shadcn-ui/button";
import { Calendar } from "@/shadcn-ui/calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shadcn-ui/command";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shadcn-ui/dialog";
import { toast } from "@/shadcn-ui/hooks/use-toast";
import { Input } from "@/shadcn-ui/input";
import { Label } from "@/shadcn-ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/shadcn-ui/popover";
import { cn } from "@/shadcn-ui/utils/utils";
import { tagSlugRef } from "@/shared-kernel";
import type { SkillRequirement } from "@/shared-kernel";
import { SKILLS, SKILL_GROUPS, SKILL_SUB_CATEGORY_BY_KEY } from "@/shared-kernel/constants/skills";
⋮----
interface ProposalDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (data: {
    taskId?: string;
    title: string;
    description: string;
    startDate?: Date;
    endDate?: Date;
    location: Location;
    requiredSkills: SkillRequirement[];
  }) => Promise<void>;
  initialDate: Date;
  orgId?: string;
  inheritedTitle?: string;
  inheritedTaskId?: string;
  inheritedLocation?: Location;
  initialRequiredSkills?: SkillRequirement[];
  taskOptions?: Array<{
    id: string;
    name: string;
    location?: Location;
    requiredSkills?: SkillRequirement[];
  }>;
}
⋮----
// FR-K5: Org skill tag pool ??loaded once per dialog open when orgId is provided.
⋮----
/** Value string for cmdk filtering ??covers zh + en + sub-category labels. */
⋮----
const handleAddSkillRequirement = () =>
const handleRemoveSkillRequirement = (slug: string) =>
const handleSelectTask = (taskId: string) =>
const handleSubmit = async () =>
⋮----
onSelect=
⋮----

⋮----
setSelectedSkillSlug(skill.slug);
setSkillPickerOpen(false);
```

## File: src/features/workforce-scheduling.slice/ui/components/runtime/schedule-capability-tabs.tsx
```typescript
import { useParams, usePathname, useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/shadcn-ui/tabs";
type CapabilityTabValue = "schedule" | "timeline";
function toCapabilityValue(pathname: string): CapabilityTabValue
export function AccountCapabilityTabs()
export function WorkspaceCapabilityTabs()
⋮----
value=
```

## File: src/features/workforce-scheduling.slice/ui/components/runtime/schedule-data-table.tsx
```typescript
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table"
import { ChevronDown } from "lucide-react"
import { useState } from "react"
import { Button } from "@/shadcn-ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/shadcn-ui/dropdown-menu"
import { Input } from "@/shadcn-ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shadcn-ui/table"
interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}
⋮----
column.toggleVisibility(!!value)
```

## File: src/features/workforce-scheduling.slice/ui/components/runtime/schedule-proposal-content.tsx
```typescript
import { parseISO } from "date-fns"
import { useRouter, useSearchParams } from "next/navigation"
import { useMemo } from "react"
import { useWorkspace } from "@/features/workspace.slice"
import type { Location } from "@/features/workspace.slice"
import { toast } from "@/shadcn-ui/hooks/use-toast"
import type { SkillRequirement } from "@/shared-kernel"
import { ProposalDialog } from "./proposal-dialog"
interface ScheduleProposalContentProps {
  fullPage?: boolean
}
⋮----
const handleSubmit = async (data: {
    taskId?: string
    title: string
    description?: string
    startDate?: Date
    endDate?: Date
    location: Location
    requiredSkills: SkillRequirement[]
}) =>
```

## File: src/features/workforce-scheduling.slice/ui/components/runtime/timeline-capability-tabs.tsx
```typescript
import { useParams, usePathname, useRouter } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/shadcn-ui/tabs';
type CapabilityTabValue = 'schedule' | 'timeline';
function toCapabilityValue(pathname: string): CapabilityTabValue
export function AccountTimelineCapabilityTabs()
export function WorkspaceTimelineCapabilityTabs()
⋮----
value=
```

## File: src/features/workforce-scheduling.slice/ui/components/runtime/unified-calendar-grid.tsx
```typescript
import { format, isWeekend, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday } from "date-fns";
import { Plus, Check, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { Avatar, AvatarFallback } from "@/shadcn-ui/avatar";
import { Badge } from "@/shadcn-ui/badge";
import { Button } from "@/shadcn-ui/button";
import { ScrollArea } from "@/shadcn-ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shadcn-ui/tooltip";
import { cn } from "@/shadcn-ui/utils/utils";
import { type MemberReference } from "@/shared-kernel";
import type { ScheduleItem } from "@/shared-kernel";
import { findSkill } from "@/shared-kernel/constants/skills";
import {
  buildCardsByDate,
  buildSpanSegmentsByDate,
  sortSegments,
  toCalendarDate,
} from "./unified-calendar-grid.utils";
⋮----
interface UnifiedCalendarGridProps {
  items: ScheduleItem[];
  members: MemberReference[];
  viewMode: 'workspace' | 'organization';
  currentDate: Date;
  onMonthChange: (direction: 'prev' | 'next') => void;
  onItemClick?: (item: ScheduleItem) => void;
  onAddClick?: (date: Date) => void;
  onApproveProposal?: (item: ScheduleItem) => void;
  onRejectProposal?: (item: ScheduleItem) => void;
  renderItemActions?: (item: ScheduleItem) => React.ReactNode;
}
⋮----
<div className=
⋮----
className=
⋮----
e.stopPropagation();
⋮----
<Button size="icon" variant="ghost" className="size-6 p-0 text-destructive" onClick=
⋮----
<Button size="icon" variant="ghost" className="size-6 p-0 text-green-600" onClick=
```

## File: src/features/workforce-scheduling.slice/ui/components/runtime/unified-calendar-grid.utils.ts
```typescript
import { eachDayOfInterval, format, isBefore } from "date-fns";
import type { ScheduleItem, Timestamp } from "@/shared-kernel";
export type CalendarTimestamp = Timestamp | Date | { seconds: number; nanoseconds: number } | null | undefined;
type TimestampLike = { toDate: () => Date };
type SecondsLike = { seconds: number };
function isTimestampLike(value: unknown): value is TimestampLike
function isSecondsLike(value: unknown): value is SecondsLike
export type SpanSegment = {
  item: ScheduleItem;
  isStart: boolean;
  isEnd: boolean;
};
export function toCalendarDate(timestamp: CalendarTimestamp): Date | null
export function normalizeScheduleRange(item: ScheduleItem):
export function buildCardsByDate(items: ScheduleItem[]): Map<string, ScheduleItem[]>
export function buildSpanSegmentsByDate(items: ScheduleItem[]): Map<string, SpanSegment[]>
export function sortSegments(segments: SpanSegment[]): SpanSegment[]
```

## File: src/features/workforce-scheduling.slice/ui/components/runtime/upcoming-events-columns.tsx
```typescript
import { type ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { ArrowUpDown } from "lucide-react"
import { Avatar, AvatarFallback } from "@/shadcn-ui/avatar"
import { Badge } from "@/shadcn-ui/badge"
import { Button } from "@/shadcn-ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shadcn-ui/tooltip"
import { type MemberReference } from "@/shared-kernel"
import type { ScheduleItem } from '@/shared-kernel'
import { SKILLS } from "@/shared-kernel/constants/skills"
export type UpcomingEventItem = Pick<ScheduleItem, 'id' | 'title' | 'workspaceName' | 'startDate' | 'endDate' | 'assigneeIds' | 'requiredSkills'> & { members: MemberReference[] }
```

## File: src/features/workforce-scheduling.slice/ui/hooks/runtime/index.ts
```typescript

```

## File: src/features/workforce-scheduling.slice/ui/hooks/runtime/use-schedule-event-handler.ts
```typescript
import { useEffect } from "react";
import { useWorkspace } from "@/features/workspace.slice";
import { toast } from "@/shadcn-ui/hooks/use-toast";
export function useScheduleEventHandler()
```

## File: src/features/workforce-scheduling.slice/ui/types/timeline.types.ts
```typescript
export interface TimelineMember {
  id: string;
  name: string;
}
```

## File: src/shared-infra/backend-firebase/functions/src/index.ts
```typescript
import { initializeApp, getApps } from "firebase-admin/app";
import { setGlobalOptions } from "firebase-functions/v2";
```

## File: src/shared-infra/dlq-manager/_dlq.ts
```typescript
export type DlqLevel = 'SAFE_AUTO' | 'REVIEW_REQUIRED' | 'SECURITY_BLOCK';
export interface DlqEntry {
  readonly dlqId: string;
  readonly dlqLevel: DlqLevel;
  readonly sourceLane: string;
  readonly originalEnvelopeJson: string;
  readonly firstFailedAt: string;
  readonly attemptCount: number;
  readonly lastError: string;
}
⋮----
export function getDlqLevel(eventType: string): DlqLevel
```

## File: src/shared-infra/dlq-manager/index.ts
```typescript

```

## File: src/shared-infra/event-router/_router.ts
```typescript
import type { EventEnvelope } from '@/shared-kernel';
export type IerLane = 'CRITICAL_LANE' | 'STANDARD_LANE' | 'BACKGROUND_LANE';
type EventHandler = (envelope: EventEnvelope) => Promise<void>;
interface Subscriber {
  readonly eventType: string | '*';
  readonly lane: IerLane | '*';
  readonly handler: EventHandler;
}
⋮----
export function registerSubscriber(
  eventType: string | '*',
  handler: EventHandler,
  lane: IerLane | '*' = '*'
): () => void
export async function routeEvent(envelope: EventEnvelope, lane: IerLane): Promise<void>
export async function publishToLane(
  lane: IerLane,
  envelope: unknown
): Promise<void>
```

## File: src/shared-infra/external-triggers/_guard.ts
```typescript
import type {
  RateLimitConfig,
  CircuitBreakerConfig,
  BulkheadConfig,
  ResilienceContract,
} from '@/shared-kernel';
import {
  DEFAULT_RATE_LIMIT,
  DEFAULT_CIRCUIT_BREAKER,
} from '@/shared-kernel';
export interface GuardCheckResult {
  readonly allowed: boolean;
  readonly retryAfterMs?: number;
  readonly reason?: 'RATE_LIMITED' | 'CIRCUIT_OPEN' | 'BULKHEAD_FULL';
  release?: (succeeded: boolean) => void;
}
export interface CallerContext {
  readonly uid: string;
  readonly orgId?: string;
}
interface WindowEntry {
  count: number;
  resetAt: number;
}
function checkWindow(
  store: Map<string, WindowEntry>,
  key: string,
  limit: number,
  windowMs: number
): boolean
type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';
interface CircuitStatus {
  state: CircuitState;
  failures: number;
  openedAt: number;
}
function evaluateCircuit(
  status: CircuitStatus,
  cfg: CircuitBreakerConfig
): boolean
export interface ResilienceGuard {
  check(caller: CallerContext): GuardCheckResult;
  withGuard<T>(caller: CallerContext, handler: () => Promise<T>): Promise<T | GuardCheckResult>;
  readonly contract: ResilienceContract;
}
⋮----
check(caller: CallerContext): GuardCheckResult;
withGuard<T>(caller: CallerContext, handler: ()
⋮----
export function createExternalTriggerGuard(
  sliceId: string,
  rateCfg: RateLimitConfig = DEFAULT_RATE_LIMIT,
  cbCfg: CircuitBreakerConfig = DEFAULT_CIRCUIT_BREAKER,
  bulkheadCfg?: Partial<BulkheadConfig>
): ResilienceGuard
⋮----
check(caller: CallerContext): GuardCheckResult
⋮----
const release = (succeeded: boolean): void =>
⋮----
async withGuard<T>(
      caller: CallerContext,
      handler: () => Promise<T>
): Promise<T | GuardCheckResult>
```

## File: src/shared-infra/frontend-firebase/analytics/analytics.adapter.ts
```typescript
import { logEvent } from 'firebase/analytics';
import { analytics } from './analytics.client';
export const logAnalyticsEvent = (eventName: string, eventParams?: Record<string, unknown>) =>
```

## File: src/shared-infra/frontend-firebase/auth/auth.types.ts
```typescript
import type { User as FirebaseUser, UserCredential } from 'firebase/auth';
import type { AuthUser } from '@/shared-kernel/ports/i-auth.service';
⋮----
export function mapFirebaseUser(user: FirebaseUser): AuthUser
```

## File: src/shared-infra/frontend-firebase/auth/index.ts
```typescript

```

## File: src/shared-infra/frontend-firebase/config/firebase.config.ts
```typescript

```

## File: src/shared-infra/frontend-firebase/firebase.config.ts
```typescript

```

## File: src/shared-infra/frontend-firebase/firestore/firestore.converter.ts
```typescript
import {
  type DocumentData,
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
  type SnapshotOptions,
  type WithFieldValue,
} from 'firebase/firestore';
export const createConverter = <T extends
⋮----
toFirestore(modelObject: WithFieldValue<T>): DocumentData
fromFirestore(
    snapshot: QueryDocumentSnapshot<DocumentData>,
    options?: SnapshotOptions
): T
```

## File: src/shared-infra/frontend-firebase/firestore/firestore.facade.ts
```typescript

```

## File: src/shared-infra/frontend-firebase/firestore/firestore.read.adapter.ts
```typescript
import {
	collection,
	collectionGroup,
	doc,
	getDoc,
	getDocs,
	onSnapshot,
	query,
	where,
	orderBy,
	limit,
	Timestamp,
	type CollectionReference,
	type DocumentChange,
	type DocumentData,
	type DocumentSnapshot,
	type FieldPath,
	type OrderByDirection,
	type Query,
	type QueryConstraint,
	type QueryDocumentSnapshot,
	type QuerySnapshot,
	type Unsubscribe,
	type WhereFilterOp,
	type FirestoreDataConverter,
} from 'firebase/firestore';
import { db } from './firestore.client';
⋮----
export const getDocument = async <T>(
	path: string,
	converter?: FirestoreDataConverter<T>
): Promise<T | null> =>
export const getDocuments = async <T>(query: Query<T>): Promise<T[]> =>
export const createSubscription = <T>(
	query: Query<T, DocumentData>,
	onUpdate: (data: T[]) => void
): Unsubscribe =>
export const subscribeToDocument = <T extends object>(
	path: string,
	onUpdate: (data: (T & { id: string }) | null) => void
): Unsubscribe =>
```

## File: src/shared-infra/frontend-firebase/firestore/firestore.types.ts
```typescript
import type {
  DocumentData,
  QuerySnapshot,
  DocumentSnapshot,
  CollectionReference,
  DocumentReference,
  Timestamp,
} from 'firebase/firestore';
⋮----
export interface FirestoreTimestampedDoc {
  readonly createdAt?: Timestamp;
  readonly updatedAt?: Timestamp;
}
export interface VersionedProjectionDoc extends FirestoreTimestampedDoc {
  readonly lastProcessedVersion: number;
  readonly traceId?: string;
}
```

## File: src/shared-infra/frontend-firebase/firestore/firestore.utils.ts
```typescript
import type { QuerySnapshot } from "firebase/firestore"
export function snapshotToRecord<T extends
```

## File: src/shared-infra/frontend-firebase/firestore/firestore.write.adapter.ts
```typescript
import {
	arrayRemove,
	arrayUnion,
	collection,
	doc,
	addDoc,
	setDoc,
	updateDoc,
	deleteDoc,
	runTransaction,
	serverTimestamp,
	type FieldValue,
	type Transaction,
	type WithFieldValue,
	type DocumentData,
	type FirestoreDataConverter,
} from 'firebase/firestore';
import { db } from './firestore.client';
⋮----
export const addDocument = <T>(
	path: string,
	data: WithFieldValue<T>,
	converter?: FirestoreDataConverter<T>
) =>
export const setDocument = <T>(
	path: string,
	data: WithFieldValue<T>,
	converter?: FirestoreDataConverter<T>
) =>
export const updateDocument = (path: string, data: DocumentData) =>
export const deleteDocument = (path: string) =>
```

## File: src/shared-infra/frontend-firebase/firestore/repositories/account.repository.ts
```typescript
import {
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  doc,
  getDoc,
  deleteDoc,
} from 'firebase/firestore'
import type {
  Account,
  MemberReference,
  Team,
  ThemeConfig,
} from '@/shared-kernel'
import { db } from '../firestore.client'
import { updateDocument, addDocument, setDocument } from '../firestore.write.adapter'
export const createUserAccount = async (userId: string, name: string, email: string): Promise<void> =>
export const createOrganization = async (organizationName: string, owner: Account): Promise<string> =>
export const recruitOrganizationMember = async (organizationId: string, newId: string, name: string, email: string): Promise<void> =>
export const dismissOrganizationMember = async (organizationId: string, member: MemberReference): Promise<void> =>
export const createTeam = async (organizationId: string, teamName: string, type: 'internal' | 'external'): Promise<void> =>
export const updateTeamMembers = async (organizationId: string, teamId: string, memberId: string, action: 'add' | 'remove'): Promise<void> =>
export const sendPartnerInvite = async (organizationId: string, teamId: string, email: string): Promise<void> =>
export const dismissPartnerMember = async (organizationId: string, teamId: string, member: MemberReference): Promise<void> =>
export const updateOrganizationSettings = async (organizationId: string, settings:
export const deleteOrganization = async (organizationId: string): Promise<void> =>
```

## File: src/shared-infra/frontend-firebase/firestore/repositories/audit.repository.ts
```typescript
import {
  collection,
  query,
  orderBy,
  limit as firestoreLimit,
  where,
} from 'firebase/firestore'
import type { AuditLog } from '@/features/workspace.slice'
import { db } from '../firestore.client'
import { createConverter } from '../firestore.converter'
import { getDocuments } from '../firestore.read.adapter'
export const getAuditLogs = async (
  accountId: string,
  workspaceId?: string,
  limitCount = 50
): Promise<AuditLog[]> =>
```

## File: src/shared-infra/frontend-firebase/firestore/repositories/daily.repository.ts
```typescript
import {
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  doc,
  increment,
  collection,
  query,
  orderBy,
  limit as firestoreLimit,
  runTransaction,
  writeBatch,
  type FieldValue,
} from 'firebase/firestore'
import type { DailyLog, DailyLogComment } from '@/features/workspace.slice'
import { db } from '../firestore.client'
import { createConverter } from '../firestore.converter'
import { getDocuments } from '../firestore.read.adapter'
export const toggleDailyLogLike = async (
  organizationId: string,
  logId: string,
  userId: string
): Promise<void> =>
export const addDailyLogComment = async (
  organizationId: string,
  logId: string,
  author: { uid: string; name: string; avatarUrl?: string },
  content: string
): Promise<void> =>
export const getDailyLogs = async (
  accountId: string,
  limitCount = 30
): Promise<DailyLog[]> =>
```

## File: src/shared-infra/frontend-firebase/firestore/repositories/index.ts
```typescript

```

## File: src/shared-infra/frontend-firebase/firestore/repositories/projection.registry.repository.ts
```typescript
import {
  serverTimestamp,
  doc,
  getDoc,
  setDoc,
  type Timestamp,
} from 'firebase/firestore';
import { db } from '../firestore.client';
export interface ProjectionVersionRecord {
  projectionName: string;
  lastEventOffset: number;
  readModelVersion: string;
  updatedAt: Timestamp;
}
export const getProjectionVersion = async (
  projectionName: string
): Promise<ProjectionVersionRecord | null> =>
export const upsertProjectionVersion = async (
  projectionName: string,
  lastEventOffset: number,
  readModelVersion: string
): Promise<void> =>
```

## File: src/shared-infra/frontend-firebase/firestore/repositories/schedule.repository.ts
```typescript
import {
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  doc,
  updateDoc,
  collection,
  query,
  orderBy,
  where,
} from 'firebase/firestore'
import type { ScheduleItem } from '@/shared-kernel'
import { db } from '../firestore.client'
import { createConverter } from '../firestore.converter'
import { getDocuments } from '../firestore.read.adapter'
import { addDocument, updateDocument } from '../firestore.write.adapter'
export const createScheduleItem = async (
  itemData: Omit<ScheduleItem, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> =>
export const updateScheduleItemStatus = async (
  organizationId: string,
  itemId: string,
  newStatus: 'OFFICIAL' | 'REJECTED' | 'COMPLETED'
): Promise<void> =>
export const updateScheduleItemDateRange = async (
  accountId: string,
  itemId: string,
  startDate: ScheduleItem['startDate'],
  endDate: ScheduleItem['endDate']
): Promise<void> =>
export const assignMemberAndApprove = async (
  organizationId: string,
  itemId: string,
  memberId: string
): Promise<void> =>
export const assignMemberToScheduleItem = async (
  accountId: string,
  itemId: string,
  memberId: string
): Promise<void> =>
export const unassignMemberFromScheduleItem = async (
  accountId: string,
  itemId: string,
  memberId: string
): Promise<void> =>
export const getScheduleItems = async (
  accountId: string,
  workspaceId?: string
): Promise<ScheduleItem[]> =>
```

## File: src/shared-infra/frontend-firebase/firestore/repositories/user.repository.ts
```typescript
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore'
import type { Account } from '@/shared-kernel'
import { db } from '../firestore.client'
import { setDocument } from '../firestore.write.adapter'
export const getUserProfile = async (
  userId: string
): Promise<Account | null> =>
export const updateUserProfile = async (
  userId: string,
  data: Partial<Account>
): Promise<void> =>
export const addBookmark = async (
  userId: string,
  logId: string
): Promise<void> =>
export const removeBookmark = async (
  userId: string,
  logId: string
): Promise<void> =>
```

## File: src/shared-infra/frontend-firebase/firestore/repositories/workspace-business.document-parser.repository.ts
```typescript
import {
  serverTimestamp,
  collection,
  query,
  orderBy,
  where,
  limit,
} from 'firebase/firestore';
import type { ParsingIntent } from '@/features/workspace.slice';
import { SUBCOLLECTIONS } from '../collection-paths';
import { db } from '../firestore.client';
import { createConverter } from '../firestore.converter';
import { getDocument, getDocuments } from '../firestore.read.adapter';
import {
  updateDocument,
  addDocument,
} from '../firestore.write.adapter';
export const createParsingIntent = async (
  workspaceId: string,
  intentData: Omit<ParsingIntent, 'id' | 'createdAt'>
): Promise<string> =>
export const updateParsingIntentStatus = async (
  workspaceId: string,
  intentId: string,
  status: 'importing' | 'imported' | 'failed' | 'superseded'
): Promise<void> =>
export const supersedeParsingIntent = async (
  workspaceId: string,
  oldIntentId: string,
  newIntentId: string
): Promise<void> =>
export const getParsingIntents = async (
  workspaceId: string
): Promise<ParsingIntent[]> =>
export const getParsingIntentBySourceFileId = async (
  workspaceId: string,
  sourceFileId: string
): Promise<ParsingIntent | null> =>
export const getParsingIntentById = async (
  workspaceId: string,
  intentId: string
): Promise<ParsingIntent | null> =>
```

## File: src/shared-infra/frontend-firebase/firestore/repositories/workspace-business.files.repository.ts
```typescript
import {
  serverTimestamp,
  collection,
  query,
  orderBy,
  arrayUnion,
  type FieldValue,
} from 'firebase/firestore';
import type { WorkspaceFile, WorkspaceFileVersion } from '@/features/workspace.slice';
import { db } from '../firestore.client';
import { createConverter } from '../firestore.converter';
import { getDocuments } from '../firestore.read.adapter';
import { updateDocument, addDocument } from '../firestore.write.adapter';
export const createWorkspaceFile = async (
  workspaceId: string,
  fileData: Omit<WorkspaceFile, 'id' | 'updatedAt'> & { updatedAt: FieldValue }
): Promise<string> =>
export const addWorkspaceFileVersion = async (
  workspaceId: string,
  fileId: string,
  version: WorkspaceFileVersion,
  currentVersionId: string
): Promise<void> =>
export const restoreWorkspaceFileVersion = async (
  workspaceId: string,
  fileId: string,
  versionId: string
): Promise<void> =>
export const getWorkspaceFilesFromSubcollection = async (
  workspaceId: string
): Promise<WorkspaceFile[]> =>
```

## File: src/shared-infra/frontend-firebase/firestore/repositories/workspace-business.issues.repository.ts
```typescript
import {
  serverTimestamp,
  arrayUnion,
  collection,
  query,
  orderBy,
  type FieldValue,
} from 'firebase/firestore';
import type { WorkspaceIssue, IssueComment } from '@/features/workspace.slice';
import { db } from '../firestore.client';
import { createConverter } from '../firestore.converter';
import { getDocuments } from '../firestore.read.adapter';
import {
  updateDocument,
  addDocument,
} from '../firestore.write.adapter';
export const createIssue = async (
  workspaceId: string,
  title: string,
  type: 'technical' | 'financial',
  priority: 'high' | 'medium',
  sourceTaskId?: string
): Promise<string> =>
export const addCommentToIssue = async (
  workspaceId: string,
  issueId: string,
  author: string,
  content: string
): Promise<void> =>
export const resolveIssue = async (
  workspaceId: string,
  issueId: string
): Promise<void> =>
export const getWorkspaceIssues = async (
  workspaceId: string
): Promise<WorkspaceIssue[]> =>
```

## File: src/shared-infra/frontend-firebase/firestore/repositories/workspace-business.parsing-imports.repository.ts
```typescript
import { serverTimestamp, doc, getDoc, runTransaction } from 'firebase/firestore';
import type { ParsingImport, ParsingImportStatus } from '@/features/workspace.slice';
import { SUBCOLLECTIONS } from '../collection-paths';
import { db } from '../firestore.client';
import { createConverter } from '../firestore.converter';
import { updateDocument } from '../firestore.write.adapter';
export const createParsingImport = async (
  workspaceId: string,
  importData: Omit<ParsingImport, 'id' | 'startedAt'>
): Promise<string> =>
export const getParsingImportByIdempotencyKey = async (
  workspaceId: string,
  idempotencyKey: string
): Promise<ParsingImport | null> =>
⋮----
const isTerminalParsingImportStatus = (status: ParsingImportStatus): boolean
export const updateParsingImportStatus = async (
  workspaceId: string,
  importId: string,
  updates: Pick<ParsingImport, 'status' | 'appliedTaskIds'> &
    Partial<Pick<ParsingImport, 'error'>>
): Promise<void> =>
```

## File: src/shared-infra/frontend-firebase/firestore/repositories/workspace-business.tasks.repository.ts
```typescript
import {
  serverTimestamp,
  collection,
  query,
  orderBy,
  where,
  limit,
  doc,
  getDoc,
} from 'firebase/firestore';
import type { WorkspaceTask } from '@/features/workspace.slice';
import { db } from '../firestore.client';
import { createConverter } from '../firestore.converter';
import { getDocuments } from '../firestore.read.adapter';
import {
  updateDocument,
  addDocument,
  deleteDocument,
} from '../firestore.write.adapter';
export const createTask = async (
  workspaceId: string,
  taskData: Omit<WorkspaceTask, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> =>
export const updateTask = async (
  workspaceId: string,
  taskId: string,
  updates: Partial<WorkspaceTask>
): Promise<void> =>
export const deleteTask = async (
  workspaceId: string,
  taskId: string
): Promise<void> =>
export const getWorkspaceTasks = async (
  workspaceId: string
): Promise<WorkspaceTask[]> =>
export const getWorkspaceTask = async (
  workspaceId: string,
  taskId: string
): Promise<WorkspaceTask | null> =>
export const getTaskBySourceIntentId = async (
  workspaceId: string,
  sourceIntentId: string
): Promise<WorkspaceTask | null> =>
export const getTasksBySourceIntentId = async (
  workspaceId: string,
  sourceIntentId: string
): Promise<WorkspaceTask[]> =>
export const reconcileTask = async (
  workspaceId: string,
  taskId: string,
  updates: {
    name: string
    quantity: number
    unitPrice: number
    discount?: number
    subtotal: number
    sourceIntentId: string
    sourceIntentVersion: number
  }
): Promise<void> =>
```

## File: src/shared-infra/frontend-firebase/firestore/repositories/workspace-core.event-store.repository.ts
```typescript
import {
  serverTimestamp,
  collection,
  query,
  orderBy,
  type Timestamp,
} from 'firebase/firestore';
import { db } from '../firestore.client';
import { createConverter } from '../firestore.converter';
import { getDocuments } from '../firestore.read.adapter';
import { addDocument } from '../firestore.write.adapter';
export interface StoredWorkspaceEvent {
  id: string;
  eventType: string;
  payload: Record<string, unknown>;
  aggregateId: string;
  occurredAt: Timestamp;
  correlationId?: string;
  causedBy?: string;
}
export const appendDomainEvent = async (
  workspaceId: string,
  event: Omit<StoredWorkspaceEvent, 'id' | 'occurredAt'>
): Promise<string> =>
export const getDomainEvents = async (
  workspaceId: string
): Promise<StoredWorkspaceEvent[]> =>
```

## File: src/shared-infra/frontend-firebase/firestore/repositories/workspace-core.repository.ts
```typescript
import {
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  doc,
  getDoc,
  runTransaction,
  type FieldValue,
} from 'firebase/firestore';
import type { Account } from '@/shared-kernel';
import type {
  Workspace,
  WorkspaceRole,
  WorkspaceGrant,
  WorkspaceFile,
  Capability,
  WorkspaceLifecycleState,
  WorkspaceLocation,
  Address,
  WorkspacePersonnel,
} from '@/features/workspace.slice';
import { db } from '../firestore.client';
import {
  updateDocument,
  addDocument,
  deleteDocument,
} from '../firestore.write.adapter';
export const createWorkspace = async (
  name: string,
  account: Account
): Promise<string> =>
export const authorizeWorkspaceTeam = async (
  workspaceId: string,
  teamId: string
): Promise<void> =>
export const revokeWorkspaceTeam = async (
  workspaceId: string,
  teamId: string
): Promise<void> =>
export const grantIndividualWorkspaceAccess = async (
  workspaceId: string,
  userId: string,
  role: WorkspaceRole,
  protocol?: string
): Promise<void> =>
export const revokeIndividualWorkspaceAccess = async (
  workspaceId: string,
  grantId: string
): Promise<void> =>
export const mountCapabilities = async (
  workspaceId: string,
  capabilities: Capability[]
): Promise<void> =>
export const unmountCapability = async (
  workspaceId: string,
  capability: Capability
): Promise<void> =>
export const updateWorkspaceSettings = async (
  workspaceId: string,
  settings: {
    name: string;
    visibility: 'visible' | 'hidden';
    lifecycleState: WorkspaceLifecycleState;
    address?: Address;
    personnel?: WorkspacePersonnel;
  }
): Promise<void> =>
export const deleteWorkspace = async (workspaceId: string): Promise<void> =>
export const getWorkspaceFiles = async (
  workspaceId: string
): Promise<WorkspaceFile[]> =>
export const getWorkspaceGrants = async (
  workspaceId: string
): Promise<WorkspaceGrant[]> =>
export const createWorkspaceLocation = async (
  workspaceId: string,
  location: WorkspaceLocation
): Promise<void> =>
export const updateWorkspaceLocation = async (
  workspaceId: string,
  locationId: string,
  updates: Partial<Pick<WorkspaceLocation, 'label' | 'description' | 'capacity'>>
): Promise<void> =>
export const deleteWorkspaceLocation = async (
  workspaceId: string,
  locationId: string
): Promise<void> =>
```

## File: src/shared-infra/frontend-firebase/firestore/version-guard.middleware.ts
```typescript
export type VersionGuardResult = 'allow' | 'discard';
export function applyFirestoreVersionGuard(
  eventVersion: number,
  viewLastProcessedVersion: number
): VersionGuardResult
export function allowFirestoreWrite(
  eventVersion: number,
  viewLastProcessedVersion: number
): boolean
```

## File: src/shared-infra/frontend-firebase/messaging/index.ts
```typescript

```

## File: src/shared-infra/frontend-firebase/messaging/messaging.adapter.ts
```typescript
import { getToken, onMessage } from 'firebase/messaging';
import type { IMessaging, PushNotificationPayload } from '@/shared-kernel/ports';
import { messaging } from './messaging.client';
class FrontendMessagingAdapter implements IMessaging
⋮----
async send(
    _fcmToken: string,
    _payload: PushNotificationPayload,
    _traceId: string,
): Promise<void>
async getToken(): Promise<string | null>
onForegroundMessage(callback: (payload: PushNotificationPayload) => void): () => void
```

## File: src/shared-infra/frontend-firebase/messaging/messaging.types.ts
```typescript
export interface FcmData {
  readonly [key: string]: string;
}
export interface FcmMessage {
  readonly token: string;
  readonly notification: {
    readonly title: string;
    readonly body: string;
  };
  readonly data: FcmData & { readonly traceId: string };
}
```

## File: src/shared-infra/frontend-firebase/storage/index.ts
```typescript

```

## File: src/shared-infra/frontend-firebase/storage/storage.adapter.ts
```typescript
import type { IFileStore, UploadOptions } from '@/shared-kernel/ports/i-file-store';
import { getFileDownloadURL } from './storage.read.adapter';
import { deleteFile, uploadFile } from './storage.write.adapter';
export class StorageAdapter implements IFileStore
⋮----
async upload(path: string, file: File | Blob, options?: UploadOptions): Promise<string>
async getDownloadURL(path: string): Promise<string>
async deleteFile(path: string): Promise<void>
```

## File: src/shared-infra/frontend-firebase/storage/storage.facade.ts
```typescript
import { getFileDownloadURL } from './storage.read.adapter';
import { uploadFile } from './storage.write.adapter';
export const uploadDailyPhoto = async (
  accountId: string,
  workspaceId: string,
  file: File
): Promise<string> =>
export const uploadTaskAttachment = async (
  workspaceId: string,
  file: File
): Promise<string> =>
export const uploadProfilePicture = async (
  userId: string,
  file: File
): Promise<string> =>
export const uploadWorkspaceDocument = async (
  workspaceId: string,
  fileId: string,
  versionId: string,
  file: File
): Promise<string> =>
```

## File: src/shared-infra/frontend-firebase/storage/storage.read.adapter.ts
```typescript
import { ref, getDownloadURL, listAll, type ListResult } from 'firebase/storage';
import { storage } from './storage.client';
export const getFileDownloadURL = (path: string): Promise<string> =>
export const listFiles = (path: string): Promise<ListResult> =>
```

## File: src/shared-infra/frontend-firebase/storage/storage.types.ts
```typescript
import type {
  StorageReference,
  UploadMetadata,
  UploadResult,
} from 'firebase/storage';
⋮----
export interface UploadTaskResult {
  readonly downloadURL: string;
  readonly storagePath: string;
}
```

## File: src/shared-infra/frontend-firebase/storage/storage.write.adapter.ts
```typescript
import {
  ref,
  uploadBytes,
  deleteObject,
  type UploadResult,
  type UploadMetadata,
} from 'firebase/storage';
import { storage } from './storage.client';
export const uploadFile = (
  path: string,
  file: Blob | Uint8Array | ArrayBuffer,
  metadata?: UploadMetadata
): Promise<UploadResult> =>
export const deleteFile = (path: string): Promise<void> =>
```

## File: src/shared-infra/gateway-command/_gateway.ts
```typescript
import type { AuthoritySnapshot, CommandResult } from '@/shared-kernel';
import { commandFailureFrom } from '@/shared-kernel';
export interface GatewayCommand {
  readonly commandType: string;
  readonly aggregateId: string;
}
type CommandHandler<TCmd extends GatewayCommand = GatewayCommand> = (
  command: TCmd,
  traceId: string
) => Promise<CommandResult>;
⋮----
export function registerCommandHandler<TCmd extends GatewayCommand>(
  commandType: string,
  handler: CommandHandler<TCmd>
): void
export interface DispatchOptions {
  readonly traceId?: string;
  readonly authority?: AuthoritySnapshot | null;
}
function injectTraceId(opts?: DispatchOptions): string
function checkAuthority(
  command: GatewayCommand,
  authority: AuthoritySnapshot | null | undefined
): CommandResult | null
async function routeCommand(
  command: GatewayCommand,
  traceId: string
): Promise<CommandResult>
export async function dispatchCommand<TCmd extends GatewayCommand>(
  command: TCmd,
  opts?: DispatchOptions
): Promise<CommandResult>
```

## File: src/shared-infra/gateway-command/workforce-scheduling-command.ts
```typescript
import {
  assignMemberAndApprove,
  assignMemberToScheduleItem,
  saveScheduleItem,
  setScheduleItemDateRange,
  setScheduleItemStatus,
  unassignMemberFromScheduleItem,
} from '@/shared-infra/frontend-firebase/firestore/firestore.facade';
import {
  setDocument,
  updateDocument,
  arrayUnion,
} from '@/shared-infra/frontend-firebase/firestore/firestore.write.adapter';
import { Timestamp } from '@/shared-infra/frontend-firebase/firestore/firestore.read.adapter';
import type { ScheduleItem } from '@/shared-kernel';
export interface GatewayWriteOp {
  path: string;
  data: Record<string, unknown>;
  arrayUnionFields?: Record<string, unknown[]>;
}
export async function createScheduleItemThroughGateway(
  data: Omit<ScheduleItem, 'id' | 'createdAt' | 'updatedAt' | 'startDate' | 'endDate'> & {
    startDate: Date;
    endDate: Date;
  },
): Promise<string>
export async function assignMemberToScheduleItemThroughGateway(
  accountId: string,
  itemId: string,
  memberId: string,
): Promise<void>
export async function unassignMemberFromScheduleItemThroughGateway(
  accountId: string,
  itemId: string,
  memberId: string,
): Promise<void>
export async function approveScheduleItemWithMemberThroughGateway(
  organizationId: string,
  itemId: string,
  memberId: string,
): Promise<void>
export async function updateScheduleItemStatusThroughGateway(
  organizationId: string,
  itemId: string,
  newStatus: 'OFFICIAL' | 'REJECTED' | 'COMPLETED',
): Promise<void>
export async function updateScheduleItemDateRangeThroughGateway(
  accountId: string,
  itemId: string,
  startDate: Date,
  endDate: Date,
): Promise<void>
export async function executeWriteOpThroughGateway(op: GatewayWriteOp): Promise<void>
export async function setDocumentByPathThroughGateway<TData extends Record<string, unknown>>(
  path: string,
  data: TData,
): Promise<void>
export async function updateDocumentByPathThroughGateway<TData extends Record<string, unknown>>(
  path: string,
  data: TData,
): Promise<void>
```

## File: src/shared-infra/gateway-command/workspace-schedule-command.ts
```typescript
import { createScheduleItem } from '@/features/workforce-scheduling.slice';
import type { AuthoritySnapshot, CommandResult } from '@/shared-kernel';
import {
  dispatchCommand,
  registerCommandHandler,
  type GatewayCommand,
} from './_gateway';
⋮----
type CreateScheduleItemInput = Parameters<typeof createScheduleItem>[0];
interface CreateScheduleItemCommand extends GatewayCommand {
  readonly commandType: typeof CREATE_SCHEDULE_ITEM_COMMAND;
  readonly aggregateId: string;
  readonly input: CreateScheduleItemInput;
}
⋮----
function ensureScheduleCommandHandlerRegistered(): void
export async function dispatchCreateScheduleItemCommand(
  workspaceId: string,
  input: CreateScheduleItemInput,
  authority: AuthoritySnapshot | null,
): Promise<CommandResult>
```

## File: src/shared-infra/gateway-query/_registry.ts
```typescript
type QueryHandler<TParams = unknown, TResult = unknown> = (
  params: TParams
) => Promise<TResult>;
interface RegistryEntry<TParams = unknown, TResult = unknown> {
  readonly handler: QueryHandler<TParams, TResult>;
  readonly description?: string;
}
⋮----
export function registerQuery<TParams, TResult>(
  name: string,
  handler: QueryHandler<TParams, TResult>,
  description?: string
): () => void
export async function executeQuery<TParams, TResult>(
  name: string,
  params: TParams
): Promise<TResult>
export function listRegisteredQueries(): ReadonlyArray<
⋮----
export type QueryRouteName = (typeof QUERY_ROUTES)[keyof typeof QUERY_ROUTES];
```

## File: src/shared-infra/gateway-query/workforce-scheduling-query.ts
```typescript
import {
  getOrgMemberEligibilityWithTier,
  getOrgEligibleMembersWithTier,
  type OrgEligibleMemberView,
} from '@/shared-infra/projection.bus';
import { db } from '@/shared-infra/frontend-firebase';
import { fetchScheduleItems } from '@/shared-infra/frontend-firebase/firestore/firestore.facade';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  type Unsubscribe,
  type QueryDocumentSnapshot,
  type QuerySnapshot,
} from '@/shared-infra/frontend-firebase/firestore/firestore.read.adapter';
import { getDocument } from '@/shared-infra/frontend-firebase/firestore/firestore.read.adapter';
import type { ScheduleItem, ScheduleStatus } from '@/shared-kernel';
export async function getScheduleItemsFromGateway(
  accountId: string,
  workspaceId?: string,
): Promise<ScheduleItem[]>
export async function getOrgScheduleItemFromGateway(
  orgId: string,
  scheduleItemId: string,
): Promise<ScheduleItem | null>
export async function getDocumentByPathFromGateway<TData>(path: string): Promise<TData | null>
export function subscribeToOrgScheduleProposalsFromGateway(
  orgId: string,
  onUpdate: (items: ScheduleItem[]) => void,
  opts?: { status?: ScheduleStatus; maxItems?: number },
): Unsubscribe
export async function getActiveDemandsFromGateway(orgId: string): Promise<ScheduleItem[]>
export function subscribeToDemandBoardFromGateway(
  orgId: string,
  onChange: (items: ScheduleItem[]) => void,
): Unsubscribe
export async function getAllDemandsFromGateway(orgId: string): Promise<ScheduleItem[]>
export async function getAccountScheduleProjectionRawFromGateway(
  accountId: string,
): Promise<Record<string, unknown> | null>
export async function getEligibleMemberForScheduleFromGateway(
  orgId: string,
  accountId: string,
): Promise<OrgEligibleMemberView | null>
export async function getEligibleMembersForScheduleFromGateway(
  orgId: string,
): Promise<OrgEligibleMemberView[]>
export function subscribeToWorkspaceScheduleItemsFromGateway(
  dimensionId: string,
  workspaceId: string,
  onUpdate: (items: ScheduleItem[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe
export function subscribeToWorkspaceTimelineItemsFromGateway(
  accountId: string,
  workspaceId: string,
  onUpdate: (items: ScheduleItem[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe
```

## File: src/shared-infra/observability/_error-logger.ts
```typescript
import type { DomainErrorEntry, IErrorLogger } from '@/shared-kernel/observability';
export function logDomainError(entry: DomainErrorEntry): void
```

## File: src/shared-infra/observability/_metrics-recorder.ts
```typescript
import type { EventCounters, IMetricsRecorder } from '@/shared-kernel/observability';
⋮----
export function recordEventPublished(eventType: string): void
export function getEventCounters(): EventCounters
export function resetEventCounters(): void
```

## File: src/shared-infra/observability/_trace-provider.ts
```typescript
import type { ITraceProvider, TraceContext } from '@/shared-kernel/observability';
export function generateTraceId(): string
export function createTraceContext(source?: string): TraceContext
```

## File: src/shared-infra/observability/index.ts
```typescript

```

## File: src/shared-infra/outbox-relay/index.ts
```typescript

```

## File: src/shared-infra/projection.bus/_funnel.shared.ts
```typescript
import { arrayUnion, updateDocument } from '@/shared-infra/frontend-firebase/firestore/firestore.write.adapter';
export async function executeAggregateWriteOp(op: {
  path: string;
  data: Record<string, unknown>;
  arrayUnionFields?: Record<string, string[]>;
}): Promise<void>
export function createVersionStamp():
```

## File: src/shared-infra/projection.bus/_organization-funnel.ts
```typescript
import { onOrgEvent } from '@/features/organization.slice';
import { applySkillXpAdded, applySkillXpDeducted } from '@/features/skill-xp.slice';
import { createVersionStamp } from './_funnel.shared';
import { upsertProjectionVersion } from './_registry';
import { applyScheduleAssigned, applyScheduleCompleted } from './account-schedule';
import {
  applyDemandAssigned,
  applyDemandAssignmentCancelled,
  applyDemandAssignRejected,
  applyDemandCompleted,
  applyDemandProposalCancelled,
} from './demand-board';
import {
  applyOrgMemberSkillXp,
  initOrgMemberEntry,
  removeOrgMemberEntry,
  updateOrgMemberEligibility,
} from './org-eligible-member-view';
import { applyMemberJoined, applyMemberLeft } from './organization-view';
export function registerOrganizationFunnel(): () => void
```

## File: src/shared-infra/projection.bus/_query-registration.ts
```typescript
import { registerQuery, QUERY_ROUTES } from '@/shared-infra/gateway-query';
import { getAccountView } from './account-view';
import { getOrgEligibleMembersWithTier } from './org-eligible-member-view';
import { getDisplayWalletBalance } from './wallet-balance';
import { queryWorkspaceAccess } from './workspace-scope-guard';
export function registerAllQueryHandlers(): Array<() => void>
```

## File: src/shared-infra/projection.bus/_tag-funnel.ts
```typescript
import { onTagEvent } from '@/features/semantic-graph.slice';
import {
  handleTagDeletedForPool,
  handleTagDeprecatedForPool,
  handleTagUpdatedForPool,
} from '@/features/skill-xp.slice';
import { createVersionStamp } from './_funnel.shared';
import { upsertProjectionVersion } from './_registry';
import { applyTagCreated, applyTagDeleted, applyTagDeprecated, applyTagUpdated } from './tag-snapshot';
export function registerTagFunnel(): () => void
```

## File: src/shared-infra/projection.bus/_workspace-funnel.ts
```typescript
import type { WorkspaceEventBus } from '@/features/workspace.slice';
import { createVersionStamp } from './_funnel.shared';
import { upsertProjectionVersion } from './_registry';
import { appendAuditEntry } from './account-audit';
import {
  applyDemandProposed,
} from './demand-board';
export function registerWorkspaceFunnel(bus: WorkspaceEventBus): () => void
```

## File: src/shared-infra/projection.bus/account-audit/_projector.ts
```typescript
import { db } from '@/shared-infra/frontend-firebase';
import { doc, collection } from '@/shared-infra/frontend-firebase/firestore/firestore.read.adapter';
import { serverTimestamp, setDoc } from '@/shared-infra/frontend-firebase/firestore/firestore.write.adapter';
import { addDocument } from '@/shared-infra/frontend-firebase/firestore/firestore.write.adapter';
export interface AuditProjectionEntry {
  id: string;
  accountId: string;
  eventType: string;
  actorId: string;
  targetId?: string;
  summary: string;
  traceId?: string;
  metadata?: Record<string, unknown>;
  occurredAt: ReturnType<typeof serverTimestamp>;
}
export async function appendAuditEntry(
  accountId: string,
  entry: Omit<AuditProjectionEntry, 'id' | 'occurredAt'>,
  eventId?: string
): Promise<string>
```

## File: src/shared-infra/projection.bus/account-audit/_queries.ts
```typescript
import { db } from '@/shared-infra/frontend-firebase';
import { createConverter } from '@/shared-infra/frontend-firebase/firestore/firestore.converter';
import { collection, query, orderBy, limit } from '@/shared-infra/frontend-firebase/firestore/firestore.read.adapter';
import { getDocuments } from '@/shared-infra/frontend-firebase/firestore/firestore.read.adapter';
import type { AuditProjectionEntry } from './_projector';
export async function getAccountAuditEntries(
  accountId: string,
  maxEntries = 50
): Promise<AuditProjectionEntry[]>
```

## File: src/shared-infra/projection.bus/account-audit/index.ts
```typescript

```

## File: src/shared-infra/projection.bus/account-schedule/_projector.ts
```typescript
import { getDocument } from '@/shared-infra/frontend-firebase/firestore/firestore.read.adapter';
import { serverTimestamp } from '@/shared-infra/frontend-firebase/firestore/firestore.write.adapter';
import { setDocument } from '@/shared-infra/frontend-firebase/firestore/firestore.write.adapter';
import { versionGuardAllows } from '@/shared-kernel';
export interface AccountScheduleProjection {
  accountId: string;
  activeAssignmentIds: string[];
  assignmentIndex: Record<string, AccountScheduleAssignment>;
  readModelVersion: number;
  lastProcessedVersion?: number;
  traceId?: string;
  updatedAt: ReturnType<typeof serverTimestamp>;
}
export interface AccountScheduleAssignment {
  scheduleItemId: string;
  workspaceId: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'active' | 'completed';
}
export async function initAccountScheduleProjection(accountId: string): Promise<void>
export async function applyScheduleAssigned(
  accountId: string,
  assignment: AccountScheduleAssignment,
  aggregateVersion?: number,
  traceId?: string
): Promise<void>
export async function applyScheduleCompleted(
  accountId: string,
  scheduleItemId: string,
  aggregateVersion?: number,
  traceId?: string
): Promise<void>
```

## File: src/shared-infra/projection.bus/account-schedule/_queries.ts
```typescript
import { getDocument } from '@/shared-infra/frontend-firebase/firestore/firestore.read.adapter';
import type { AccountScheduleProjection, AccountScheduleAssignment } from './_projector';
export async function getAccountScheduleProjection(
  accountId: string
): Promise<AccountScheduleProjection | null>
export async function getAccountActiveAssignments(
  accountId: string
): Promise<AccountScheduleAssignment[]>
```

## File: src/shared-infra/projection.bus/account-schedule/index.ts
```typescript

```

## File: src/shared-infra/projection.bus/account-view/_projector.ts
```typescript
import { getDocument } from '@/shared-infra/frontend-firebase/firestore/firestore.read.adapter';
import { serverTimestamp } from '@/shared-infra/frontend-firebase/firestore/firestore.write.adapter';
import { setDocument, updateDocument } from '@/shared-infra/frontend-firebase/firestore/firestore.write.adapter';
import { versionGuardAllows } from '@/shared-kernel';
import type { AuthoritySnapshot } from '@/shared-kernel';
import type { Account } from '@/shared-kernel';
export interface AccountViewRecord {
  readonly implementsAuthoritySnapshot: true;
  accountId: string;
  name: string;
  accountType: 'user' | 'organization';
  email?: string;
  photoURL?: string;
  orgRoles: Record<string, string>;
  skillTagSlugs: string[];
  membershipTag?: 'internal' | 'external';
  authoritySnapshot?: AuthoritySnapshot;
  readModelVersion: number;
  lastProcessedVersion?: number;
  traceId?: string;
  updatedAt: ReturnType<typeof serverTimestamp>;
}
export async function projectAccountSnapshot(
  account: Account,
  aggregateVersion?: number,
  traceId?: string
): Promise<void>
export async function applyOrgRoleChange(
  accountId: string,
  orgId: string,
  role: string,
  aggregateVersion?: number,
  traceId?: string
): Promise<void>
export async function applyAuthoritySnapshot(
  accountId: string,
  snapshot: AuthoritySnapshot,
  aggregateVersion?: number,
  traceId?: string
): Promise<void>
```

## File: src/shared-infra/projection.bus/account-view/_queries.ts
```typescript
import { getDocument } from '@/shared-infra/frontend-firebase/firestore/firestore.read.adapter';
import type { AuthoritySnapshot } from '@/shared-kernel';
import type { AccountViewRecord } from './_projector';
export async function getAccountView(accountId: string): Promise<AccountViewRecord | null>
export async function getAccountAuthoritySnapshot(
  accountId: string
): Promise<AuthoritySnapshot | null>
export async function getAccountMembershipTag(
  accountId: string
): Promise<'internal' | 'external' | null>
```

## File: src/shared-infra/projection.bus/account-view/index.ts
```typescript

```

## File: src/shared-infra/projection.bus/demand-board/_projector.ts
```typescript
import type {
  ScheduleAssignedPayload,
  ScheduleCompletedPayload,
  ScheduleAssignmentCancelledPayload,
  ScheduleProposalCancelledPayload,
  ScheduleAssignRejectedPayload,
} from '@/features/organization.slice';
import { getDocument } from '@/shared-infra/frontend-firebase/firestore/firestore.read.adapter';
import { arrayUnion, updateDocument } from '@/shared-infra/frontend-firebase/firestore/firestore.write.adapter';
import { versionGuardAllows } from '@/shared-kernel';
import type { WorkspaceScheduleProposedPayload } from '@/shared-kernel';
import type { ScheduleItem, ScheduleStatus } from '@/shared-kernel';
function scheduleItemPath(orgId: string, scheduleItemId: string): string
⋮----
export async function applyDemandProposed(
  payload: WorkspaceScheduleProposedPayload
): Promise<void>
export async function applyDemandAssigned(payload: ScheduleAssignedPayload): Promise<void>
export async function applyDemandCompleted(payload: ScheduleCompletedPayload): Promise<void>
export async function applyDemandAssignmentCancelled(
  payload: ScheduleAssignmentCancelledPayload
): Promise<void>
export async function applyDemandProposalCancelled(
  payload: ScheduleProposalCancelledPayload
): Promise<void>
export async function applyDemandAssignRejected(
  payload: ScheduleAssignRejectedPayload
): Promise<void>
async function _closeScheduleItem(
  orgId: string,
  scheduleItemId: string,
  status: 'COMPLETED' | 'REJECTED',
  aggregateVersion: number,
  traceId?: string
): Promise<void>
```

## File: src/shared-infra/projection.bus/demand-board/index.ts
```typescript

```

## File: src/shared-infra/projection.bus/global-audit-view/_projector.ts
```typescript
import { db } from '@/shared-infra/frontend-firebase';
import { doc } from '@/shared-infra/frontend-firebase/firestore/firestore.read.adapter';
import { setDoc, serverTimestamp } from '@/shared-infra/frontend-firebase/firestore/firestore.write.adapter';
import type { EventEnvelope } from '@/shared-kernel';
export interface GlobalAuditRecord {
  readonly auditEventId: string;
  readonly traceId: string;
  readonly accountId: string;
  readonly workspaceId?: string;
  readonly eventType: string;
  readonly payload: Record<string, unknown>;
  readonly timestamp: number;
}
export interface GlobalAuditQuery {
  accountId?: string;
  workspaceId?: string;
  limit?: number;
}
export async function applyAuditEvent(
  envelope: EventEnvelope,
  payload: Record<string, unknown>,
  context: { accountId: string; workspaceId?: string }
): Promise<void>
```

## File: src/shared-infra/projection.bus/global-audit-view/_queries.ts
```typescript
import { db } from '@/shared-infra/frontend-firebase';
import { collection, getDocs, where, limit, query as firestoreQuery } from '@/shared-infra/frontend-firebase/firestore/firestore.read.adapter';
import type { GlobalAuditRecord, GlobalAuditQuery } from './_projector';
export async function getGlobalAuditEvents(
  query: GlobalAuditQuery = {}
): Promise<GlobalAuditRecord[]>
export async function getGlobalAuditEventsByWorkspace(
  workspaceId: string,
  maxResults = 50
): Promise<GlobalAuditRecord[]>
```

## File: src/shared-infra/projection.bus/global-audit-view/index.ts
```typescript

```

## File: src/shared-infra/projection.bus/index.ts
```typescript

```

## File: src/shared-infra/projection.bus/org-eligible-member-view/_projector.ts
```typescript
import { getDocument } from '@/shared-infra/frontend-firebase/firestore/firestore.read.adapter';
import { serverTimestamp } from '@/shared-infra/frontend-firebase/firestore/firestore.write.adapter';
import { setDocument, updateDocument, deleteDocument } from '@/shared-infra/frontend-firebase/firestore/firestore.write.adapter';
import { versionGuardAllows } from '@/shared-kernel';
export interface OrgEligibleMemberEntry {
  orgId: string;
  accountId: string;
  skills: Record<string, { xp: number }>;
  eligible: boolean;
  lastProcessedVersion: number;
  lastProcessedSkillVersion: number;
  readModelVersion: number;
  traceId?: string;
  updatedAt: ReturnType<typeof serverTimestamp>;
}
function memberPath(orgId: string, accountId: string): string
export async function initOrgMemberEntry(
  orgId: string,
  accountId: string,
  traceId?: string
): Promise<void>
export async function removeOrgMemberEntry(
  orgId: string,
  accountId: string
): Promise<void>
export interface ApplyOrgMemberSkillXpInput {
  orgId: string;
  accountId: string;
  skillId: string;
  newXp: number;
  traceId?: string;
  aggregateVersion?: number;
}
export async function applyOrgMemberSkillXp(
  input: ApplyOrgMemberSkillXpInput
): Promise<void>
export async function updateOrgMemberEligibility(
  orgId: string,
  accountId: string,
  eligible: boolean,
  incomingAggregateVersion: number,
  traceId?: string
): Promise<void>
```

## File: src/shared-infra/projection.bus/org-eligible-member-view/_queries.ts
```typescript
import { db } from '@/shared-infra/frontend-firebase';
import { getDocs, collection, type QueryDocumentSnapshot } from '@/shared-infra/frontend-firebase/firestore/firestore.read.adapter';
import { getDocument } from '@/shared-infra/frontend-firebase/firestore/firestore.read.adapter';
import type { SkillTier } from '@/shared-kernel';
import { resolveSkillTier } from '@/shared-kernel';
import type { OrgEligibleMemberEntry } from './_projector';
export interface OrgMemberSkillWithTier {
  skillId: string;
  xp: number;
  tier: SkillTier;
}
export interface OrgEligibleMemberView {
  orgId: string;
  accountId: string;
  skills: OrgMemberSkillWithTier[];
  eligible: boolean;
}
function enrichWithTier(entry: OrgEligibleMemberEntry): OrgEligibleMemberView
export async function getOrgMemberEligibility(
  orgId: string,
  accountId: string
): Promise<OrgEligibleMemberEntry | null>
export async function getOrgEligibleMembers(
  orgId: string
): Promise<OrgEligibleMemberEntry[]>
export async function getOrgMemberEligibilityWithTier(
  orgId: string,
  accountId: string
): Promise<OrgEligibleMemberView | null>
export async function getAllOrgMembersView(
  orgId: string
): Promise<OrgEligibleMemberView[]>
export async function getOrgEligibleMembersWithTier(
  orgId: string
): Promise<OrgEligibleMemberView[]>
```

## File: src/shared-infra/projection.bus/org-eligible-member-view/index.ts
```typescript

```

## File: src/shared-infra/projection.bus/organization-view/_projector.ts
```typescript
import { getDocument } from '@/shared-infra/frontend-firebase/firestore/firestore.read.adapter';
import { serverTimestamp } from '@/shared-infra/frontend-firebase/firestore/firestore.write.adapter';
import { setDocument, updateDocument } from '@/shared-infra/frontend-firebase/firestore/firestore.write.adapter';
import type { Account } from '@/shared-kernel';
import { versionGuardAllows } from '@/shared-kernel';
export interface OrganizationViewRecord {
  orgId: string;
  name: string;
  ownerId: string;
  memberCount: number;
  teamCount: number;
  partnerCount: number;
  memberIds: string[];
  teamIndex: Record<string, string>;
  readModelVersion: number;
  lastProcessedVersion?: number;
  traceId?: string;
  updatedAt: ReturnType<typeof serverTimestamp>;
}
export async function projectOrganizationSnapshot(
  org: Account,
  aggregateVersion?: number,
  traceId?: string
): Promise<void>
export async function applyMemberJoined(
  orgId: string,
  memberId: string,
  aggregateVersion?: number,
  traceId?: string
): Promise<void>
export async function applyMemberLeft(
  orgId: string,
  memberId: string,
  aggregateVersion?: number,
  traceId?: string
): Promise<void>
```

## File: src/shared-infra/projection.bus/organization-view/_queries.ts
```typescript
import { getDocument } from '@/shared-infra/frontend-firebase/firestore/firestore.read.adapter';
import type { OrganizationViewRecord } from './_projector';
export async function getOrganizationView(orgId: string): Promise<OrganizationViewRecord | null>
export async function getOrganizationMemberIds(orgId: string): Promise<string[]>
```

## File: src/shared-infra/projection.bus/organization-view/index.ts
```typescript

```

## File: src/shared-infra/projection.bus/tag-snapshot/_projector.ts
```typescript
import { getDocument } from '@/shared-infra/frontend-firebase/firestore/firestore.read.adapter';
import { setDocument, updateDocument, deleteDocument } from '@/shared-infra/frontend-firebase/firestore/firestore.write.adapter';
import { versionGuardAllows } from '@/shared-kernel';
import type { TagCreatedPayload, TagUpdatedPayload, TagDeprecatedPayload, TagDeletedPayload } from '@/shared-kernel';
export interface TagSnapshotEntry {
  tagSlug: string;
  label: string;
  category: string;
  deprecatedAt?: string;
  replacedByTagSlug?: string;
  readModelVersion: number;
  lastProcessedVersion?: number;
  traceId?: string;
}
export async function applyTagCreated(payload: TagCreatedPayload, traceId?: string): Promise<void>
export async function applyTagUpdated(
  payload: TagUpdatedPayload,
  aggregateVersion?: number,
  traceId?: string
): Promise<void>
export async function applyTagDeprecated(
  payload: TagDeprecatedPayload,
  aggregateVersion?: number,
  traceId?: string
): Promise<void>
export async function applyTagDeleted(payload: TagDeletedPayload): Promise<void>
```

## File: src/shared-infra/projection.bus/tag-snapshot/_queries.ts
```typescript
import { db } from '@/shared-infra/frontend-firebase';
import { collection, getDocs, type QueryDocumentSnapshot } from '@/shared-infra/frontend-firebase/firestore/firestore.read.adapter';
import { getDocument } from '@/shared-infra/frontend-firebase/firestore/firestore.read.adapter';
import type { TagSnapshotEntry } from './_projector';
export async function getTagSnapshot(tagSlug: string): Promise<TagSnapshotEntry | null>
export async function getAllTagSnapshots(): Promise<TagSnapshotEntry[]>
export async function getActiveTagSnapshots(): Promise<TagSnapshotEntry[]>
```

## File: src/shared-infra/projection.bus/tag-snapshot/index.ts
```typescript

```

## File: src/shared-infra/projection.bus/wallet-balance/_projector.ts
```typescript
import { getDocument } from '@/shared-infra/frontend-firebase/firestore/firestore.read.adapter';
import { serverTimestamp } from '@/shared-infra/frontend-firebase/firestore/firestore.write.adapter';
import { setDocument } from '@/shared-infra/frontend-firebase/firestore/firestore.write.adapter';
import { versionGuardAllows } from '@/shared-kernel';
export interface WalletBalanceView {
  readonly accountId: string;
  balance: number;
  totalCredited: number;
  totalDebited: number;
  readModelVersion: number;
  lastProcessedVersion?: number;
  traceId?: string;
  updatedAt: ReturnType<typeof serverTimestamp>;
}
⋮----
export async function initWalletBalanceView(accountId: string): Promise<void>
export async function applyWalletCredited(
  accountId: string,
  amount: number,
  aggregateVersion?: number,
  traceId?: string
): Promise<void>
export async function applyWalletDebited(
  accountId: string,
  amount: number,
  aggregateVersion?: number,
  traceId?: string
): Promise<void>
export async function syncWalletBalanceFromAggregate(
  accountId: string,
  authoritative: { balance: number; aggregateVersion?: number; traceId?: string }
): Promise<void>
```

## File: src/shared-infra/projection.bus/wallet-balance/_queries.ts
```typescript
import { getDocument } from '@/shared-infra/frontend-firebase/firestore/firestore.read.adapter';
import type { WalletBalanceView } from './_projector';
export async function getWalletBalanceView(
  accountId: string
): Promise<WalletBalanceView | null>
export async function getDisplayWalletBalance(accountId: string): Promise<number>
```

## File: src/shared-infra/projection.bus/wallet-balance/index.ts
```typescript

```

## File: src/shared-infra/projection.bus/workspace-scope-guard/_projector.ts
```typescript
import { getDocument } from '@/shared-infra/frontend-firebase/firestore/firestore.read.adapter';
import { serverTimestamp } from '@/shared-infra/frontend-firebase/firestore/firestore.write.adapter';
import { setDocument, updateDocument } from '@/shared-infra/frontend-firebase/firestore/firestore.write.adapter';
import { versionGuardAllows } from '@/shared-kernel';
import type { WorkspaceScopeGuardView } from './_read-model';
export async function initScopeGuardView(
  workspaceId: string,
  ownerId: string,
  traceId?: string
): Promise<void>
export async function applyGrantEvent(
  workspaceId: string,
  userId: string,
  role: string,
  status: 'active' | 'revoked',
  aggregateVersion?: number,
  traceId?: string
): Promise<void>
```

## File: src/shared-infra/projection.bus/workspace-scope-guard/_queries.ts
```typescript
import { getDocument } from '@/shared-infra/frontend-firebase/firestore/firestore.read.adapter';
import type { AuthoritySnapshot } from '@/shared-kernel';
import type { WorkspaceScopeGuardView } from './_read-model';
import { buildAuthoritySnapshot } from './_read-model';
export async function getScopeGuardView(
  workspaceId: string
): Promise<WorkspaceScopeGuardView | null>
export async function queryWorkspaceAccess(
  workspaceId: string,
  userId: string
): Promise<
```

## File: src/shared-infra/projection.bus/workspace-scope-guard/_read-model.ts
```typescript
import type { AuthoritySnapshot } from '@/shared-kernel';
import type { Timestamp } from '@/shared-kernel/ports';
export interface WorkspaceScopeGuardView {
  readonly implementsAuthoritySnapshot: true;
  workspaceId: string;
  ownerId: string;
  grantIndex: Record<string, WorkspaceScopeGrantEntry>;
  readModelVersion: number;
  lastProcessedVersion?: number;
  traceId?: string;
  updatedAt: Timestamp;
}
export interface WorkspaceScopeGrantEntry {
  role: string;
  status: 'active' | 'revoked';
  snapshotAt: string;
}
export function buildAuthoritySnapshot(
  view: WorkspaceScopeGuardView,
  userId: string
): AuthoritySnapshot
function derivePermissions(roles: string[]): string[]
```

## File: src/shared-infra/projection.bus/workspace-scope-guard/index.ts
```typescript

```

## File: src/shared-infra/projection.bus/workspace-view/_projector.ts
```typescript
import type { Workspace } from '@/features/workspace.slice';
import { getDocument } from '@/shared-infra/frontend-firebase/firestore/firestore.read.adapter';
import { serverTimestamp } from '@/shared-infra/frontend-firebase/firestore/firestore.write.adapter';
import { setDocument, updateDocument } from '@/shared-infra/frontend-firebase/firestore/firestore.write.adapter';
import { versionGuardAllows } from '@/shared-kernel';
export interface WorkspaceViewRecord {
  workspaceId: string;
  name: string;
  dimensionId: string;
  lifecycleState: string;
  visibility: string;
  capabilities: string[];
  grantCount: number;
  readModelVersion: number;
  lastProcessedVersion?: number;
  traceId?: string;
  updatedAt: ReturnType<typeof serverTimestamp>;
}
export async function projectWorkspaceSnapshot(
  workspace: Workspace,
  aggregateVersion?: number,
  traceId?: string
): Promise<void>
export async function applyCapabilityUpdate(
  workspaceId: string,
  capabilities: string[],
  aggregateVersion?: number,
  traceId?: string
): Promise<void>
```

## File: src/shared-infra/projection.bus/workspace-view/_queries.ts
```typescript
import { getDocument } from '@/shared-infra/frontend-firebase/firestore/firestore.read.adapter';
import type { WorkspaceViewRecord } from './_projector';
export async function getWorkspaceView(workspaceId: string): Promise<WorkspaceViewRecord | null>
export async function getWorkspaceCapabilities(workspaceId: string): Promise<string[]>
```

## File: src/shared-infra/projection.bus/workspace-view/index.ts
```typescript

```

## File: src/shared-kernel/constants/settings.ts
```typescript

```

## File: src/shared-kernel/data-contracts/scheduling/schedule-contract.ts
```typescript
import type { SkillRequirement } from '@/shared-kernel/data-contracts/skill-tier';
import type { Timestamp } from '@/shared-kernel/ports/i-firestore.repo';
export interface Location {
  building?: string;
  floor?: string;
  room?: string;
  description: string;
}
export type ScheduleStatus = 'PROPOSAL' | 'OFFICIAL' | 'REJECTED' | 'COMPLETED';
export type ScheduleTemporalKind = 'point' | 'range' | 'allDay';
export interface ScheduleItem {
  id: string;
  accountId: string;
  workspaceId: string;
  workspaceName?: string;
  title: string;
  description?: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  startDate: Timestamp;
  endDate: Timestamp;
  temporalKind?: ScheduleTemporalKind;
  status: ScheduleStatus;
  originType: 'MANUAL' | 'TASK_AUTOMATION';
  originTaskId?: string;
  assigneeIds: string[];
  location?: Location;
  locationId?: string;
  requiredSkills?: SkillRequirement[];
  proposedBy?: string;
  version?: number;
  traceId?: string;
}
```

## File: src/features/workforce-scheduling.slice/application/commands/actions/governance.ts
```typescript
import {
  type CommandResult,
  type SkillRequirement,
  commandFailureFrom,
  commandSuccess,
} from '@/shared-kernel';
import {
  approveOrgScheduleProposal,
  cancelOrgScheduleProposal,
  completeOrgSchedule,
} from '../../../domain/aggregate';
import { executeWriteOp } from '../write-op';
export async function manualAssignScheduleMember(
  scheduleItemId: string,
  targetAccountId: string,
  assignedBy: string,
  opts: {
    workspaceId: string;
    orgId: string;
    title: string;
    startDate: string;
    endDate: string;
    traceId?: string;
  },
  skillRequirements?: SkillRequirement[]
): Promise<CommandResult>
export async function cancelScheduleProposalAction(
  scheduleItemId: string,
  orgId: string,
  workspaceId: string,
  cancelledBy: string,
  reason?: string,
  traceId?: string
): Promise<CommandResult>
export async function completeOrgScheduleAction(
  scheduleItemId: string,
  orgId: string,
  workspaceId: string,
  targetAccountId: string,
  completedBy: string,
  traceId?: string
): Promise<CommandResult>
```

## File: src/features/workforce-scheduling.slice/application/commands/index.ts
```typescript

```

## File: src/features/workforce-scheduling.slice/application/commands/write-op.ts
```typescript
import { executeWriteOpThroughGateway } from '@/shared-infra/gateway-command';
import type { WriteOp } from '../../domain/aggregate';
export async function executeWriteOp(op: WriteOp): Promise<void>
```

## File: src/features/workforce-scheduling.slice/application/projectors/runtime/account-schedule-queries.ts
```typescript

```

## File: src/features/workforce-scheduling.slice/application/queries/index.ts
```typescript
import {
  getScheduleItemsFromGateway,
  getOrgScheduleItemFromGateway,
  subscribeToOrgScheduleProposalsFromGateway,
  getActiveDemandsFromGateway,
  subscribeToDemandBoardFromGateway,
  getAllDemandsFromGateway,
  getAccountScheduleProjectionRawFromGateway,
  getEligibleMemberForScheduleFromGateway,
  getEligibleMembersForScheduleFromGateway,
  subscribeToWorkspaceScheduleItemsFromGateway,
} from '@/shared-infra/gateway-query';
import type {
  OrgEligibleMemberView,
  OrgMemberSkillWithTier,
} from '@/shared-infra/projection.bus';
import type { ScheduleItem, ScheduleStatus } from '@/shared-kernel';
import type { ImplementsStalenessContract } from '@/shared-kernel';
import type {
  AccountScheduleProjection,
  AccountScheduleAssignment,
} from '../projectors/runtime/account-schedule';
type Unsubscribe = () => void;
⋮----
export async function getScheduleItems(
  accountId: string,
  workspaceId?: string
): Promise<ScheduleItem[]>
export async function getOrgScheduleItem(
  orgId: string,
  scheduleItemId: string
): Promise<ScheduleItem | null>
⋮----
export function subscribeToOrgScheduleProposals(
  orgId: string,
  onUpdate: (items: ScheduleItem[]) => void,
  opts?: { status?: ScheduleStatus; maxItems?: number }
): Unsubscribe
export function subscribeToPendingProposals(
  orgId: string,
  onUpdate: (items: ScheduleItem[]) => void
): Unsubscribe
export function subscribeToConfirmedProposals(
  orgId: string,
  onUpdate: (items: ScheduleItem[]) => void
): Unsubscribe
export async function getActiveDemands(orgId: string): Promise<ScheduleItem[]>
export function subscribeToDemandBoard(
  orgId: string,
  onChange: (items: ScheduleItem[]) => void
): Unsubscribe
export async function getAllDemands(orgId: string): Promise<ScheduleItem[]>
export async function getAccountScheduleProjection(
  accountId: string
): Promise<AccountScheduleProjection | null>
export async function getAccountActiveAssignments(
  accountId: string
): Promise<AccountScheduleAssignment[]>
⋮----
export async function getEligibleMemberForSchedule(
  orgId: string,
  accountId: string
): Promise<OrgEligibleMemberView | null>
export async function getEligibleMembersForSchedule(
  orgId: string
): Promise<OrgEligibleMemberView[]>
export function subscribeToWorkspaceScheduleItems(
  dimensionId: string,
  workspaceId: string,
  onUpdate: (items: ScheduleItem[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe
```

## File: src/features/workforce-scheduling.slice/application/sagas/index.ts
```typescript
import {
  getEligibleMembersForScheduleFromGateway,
  getDocumentByPathFromGateway,
} from '@/shared-infra/gateway-query';
import {
  setDocumentByPathThroughGateway,
  updateDocumentByPathThroughGateway,
} from '@/shared-infra/gateway-command';
import type { WorkspaceScheduleProposedPayload } from '@/shared-kernel';
import {
  handleScheduleProposed,
  approveOrgScheduleProposal,
} from '../../domain/aggregate';
import { findEligibleCandidatesForRequirements } from '../../domain/eligibility';
import { executeWriteOp } from '../commands/write-op';
export type SagaStep =
  | 'receive_proposal'
  | 'eligibility_check'
  | 'assign'
  | 'compensate';
export type SagaStatus =
  | 'pending'
  | 'eligibility_check'
  | 'assigned'
  | 'compensated';
export interface SagaState {
  readonly sagaId: string;
  readonly scheduleItemId: string;
  readonly workspaceId: string;
  readonly orgId: string;
  status: SagaStatus;
  currentStep: SagaStep;
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
  compensationReason?: string;
  traceId?: string;
}
⋮----
function sagaPath(sagaId: string): string
async function persistSaga(state: SagaState): Promise<void>
async function updateSagaStatus(
  sagaId: string,
  patch: Partial<
    Pick<
      SagaState,
      'status' | 'currentStep' | 'completedAt' | 'compensationReason' | 'updatedAt'
    >
  >
): Promise<void>
export async function getSagaState(sagaId: string): Promise<SagaState | null>
export async function startSchedulingSaga(
  event: WorkspaceScheduleProposedPayload,
  sagaId: string
): Promise<SagaState>
```

## File: src/features/workforce-scheduling.slice/domain/aggregate/index.ts
```typescript
import {
  getDocumentByPathFromGateway,
  getEligibleMemberForScheduleFromGateway,
  getOrgScheduleItemFromGateway,
} from '@/shared-infra/gateway-query';
import { resolveSkillTier, tierSatisfies } from '@/shared-kernel';
import type { WorkspaceScheduleProposedPayload, SkillRequirement } from '@/shared-kernel';
import type { ScheduleItem, ScheduleStatus } from '@/shared-kernel';
import {
  type ScheduleApprovalResult,
  type WriteOp,
} from '../types/aggregate.types';
import { enqueueSchedulingOutboxEvent } from '../../application/commands/sched-outbox';
⋮----
function scheduleItemPath(orgId: string, scheduleItemId: string): string
export function handleScheduleProposed(
  payload: WorkspaceScheduleProposedPayload
): WriteOp
export async function approveOrgScheduleProposal(
  scheduleItemId: string,
  targetAccountId: string,
  assignedBy: string,
  opts: {
    workspaceId: string;
    orgId: string;
    title: string;
    startDate: string;
    endDate: string;
    traceId?: string;
  },
  skillRequirements?: SkillRequirement[]
): Promise<ScheduleApprovalResult>
async function _buildCancelWriteOp(
  scheduleItemId: string,
  targetAccountId: string,
  opts: { workspaceId: string; orgId: string; traceId?: string },
  reason: string
): Promise<WriteOp>
export async function cancelOrgScheduleProposal(
  scheduleItemId: string,
  orgId: string,
  workspaceId: string,
  cancelledBy: string,
  reason?: string,
  traceId?: string
): Promise<WriteOp>
export async function completeOrgSchedule(
  scheduleItemId: string,
  orgId: string,
  workspaceId: string,
  targetAccountId: string,
  completedBy: string,
  traceId?: string
): Promise<WriteOp>
export async function cancelOrgScheduleAssignment(
  scheduleItemId: string,
  orgId: string,
  workspaceId: string,
  targetAccountId: string,
  cancelledBy: string,
  reason?: string,
  traceId?: string
): Promise<WriteOp>
```

## File: src/features/workforce-scheduling.slice/domain/eligibility/index.ts
```typescript
import type { OrgEligibleMemberView } from '@/shared-infra/projection.bus';
import type { SkillRequirement } from '@/shared-kernel';
⋮----
export type SagaTier = (typeof SAGA_TIER_ORDER)[number];
export function sagaTierIndex(tier: string): number
export function findEligibleCandidate(
  members: OrgEligibleMemberView[],
  requirements: SkillRequirement[]
): OrgEligibleMemberView | undefined
export interface CandidateAssignment {
  candidate: OrgEligibleMemberView;
  requirement: SkillRequirement | null;
}
export function findEligibleCandidatesForRequirements(
  members: OrgEligibleMemberView[],
  requirements: SkillRequirement[]
): CandidateAssignment[] | undefined
```

## File: src/features/workforce-scheduling.slice/domain/index.ts
```typescript

```

## File: src/features/workforce-scheduling.slice/ports/query.port.ts
```typescript
import type {
  ImplementsStalenessContract,
  ScheduleItem,
  ScheduleStatus,
} from '@/shared-kernel';
import type {
  AccountScheduleAssignment,
  AccountScheduleProjection,
} from '../application/projectors/runtime/account-schedule';
import type { OrgEligibleMemberView, OrgMemberSkillWithTier } from '../application/queries';
export type QueryUnsubscribe = () => void;
export interface SchedulingQueryPort {
  getScheduleItems(accountId: string, workspaceId?: string): Promise<ScheduleItem[]>;
  getOrgScheduleItem(orgId: string, scheduleItemId: string): Promise<ScheduleItem | null>;
  subscribeToOrgScheduleProposals(
    orgId: string,
    onUpdate: (items: ScheduleItem[]) => void,
    opts?: { status?: ScheduleStatus; maxItems?: number }
  ): QueryUnsubscribe;
  subscribeToPendingProposals(orgId: string, onUpdate: (items: ScheduleItem[]) => void): QueryUnsubscribe;
  subscribeToConfirmedProposals(orgId: string, onUpdate: (items: ScheduleItem[]) => void): QueryUnsubscribe;
  getActiveDemands(orgId: string): Promise<ScheduleItem[]>;
  subscribeToDemandBoard(orgId: string, onChange: (items: ScheduleItem[]) => void): QueryUnsubscribe;
  getAllDemands(orgId: string): Promise<ScheduleItem[]>;
  getAccountScheduleProjection(accountId: string): Promise<AccountScheduleProjection | null>;
  getAccountActiveAssignments(accountId: string): Promise<AccountScheduleAssignment[]>;
  subscribeToWorkspaceScheduleItems(
    dimensionId: string,
    workspaceId: string,
    onUpdate: (items: ScheduleItem[]) => void,
    onError?: (err: Error) => void
  ): QueryUnsubscribe;
  getEligibleMemberForSchedule(orgId: string, accountId: string): Promise<OrgEligibleMemberView | null>;
  getEligibleMembersForSchedule(orgId: string): Promise<OrgEligibleMemberView[]>;
}
⋮----
getScheduleItems(accountId: string, workspaceId?: string): Promise<ScheduleItem[]>;
getOrgScheduleItem(orgId: string, scheduleItemId: string): Promise<ScheduleItem | null>;
subscribeToOrgScheduleProposals(
    orgId: string,
    onUpdate: (items: ScheduleItem[]) => void,
    opts?: { status?: ScheduleStatus; maxItems?: number }
  ): QueryUnsubscribe;
subscribeToPendingProposals(orgId: string, onUpdate: (items: ScheduleItem[])
subscribeToConfirmedProposals(orgId: string, onUpdate: (items: ScheduleItem[])
getActiveDemands(orgId: string): Promise<ScheduleItem[]>;
subscribeToDemandBoard(orgId: string, onChange: (items: ScheduleItem[])
getAllDemands(orgId: string): Promise<ScheduleItem[]>;
getAccountScheduleProjection(accountId: string): Promise<AccountScheduleProjection | null>;
getAccountActiveAssignments(accountId: string): Promise<AccountScheduleAssignment[]>;
subscribeToWorkspaceScheduleItems(
    dimensionId: string,
    workspaceId: string,
    onUpdate: (items: ScheduleItem[]) => void,
    onError?: (err: Error) => void
  ): QueryUnsubscribe;
getEligibleMemberForSchedule(orgId: string, accountId: string): Promise<OrgEligibleMemberView | null>;
getEligibleMembersForSchedule(orgId: string): Promise<OrgEligibleMemberView[]>;
⋮----
export interface SchedulingStalenessContractPort {
  DEMAND_BOARD_STALENESS: ImplementsStalenessContract;
}
```

## File: src/features/workforce-scheduling.slice/ui/components/runtime/demand-board.tsx
```typescript
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, UserCheck, XCircle, Clock, CheckCircle2 } from 'lucide-react';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { useApp } from '@/app-runtime/providers/app-provider';
import { useAccount } from '@/features/workspace.slice';
import { Badge } from '@/shadcn-ui/badge';
import { Button } from '@/shadcn-ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shadcn-ui/card';
import { toast } from '@/shadcn-ui/hooks/use-toast';
import { ScrollArea } from '@/shadcn-ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shadcn-ui/select';
import type { ScheduleItem } from '@/shared-kernel';
import type { SkillRequirement } from '@/shared-kernel';
import { SKILLS } from '@/shared-kernel/constants/skills';
import type { Timestamp } from '@/shared-kernel/ports';
import {
  approveScheduleItemWithMember,
  updateScheduleItemStatus,
} from '../../../application/commands';
type TimestampLike = { toDate: () => Date };
function isTimestampLike(value: unknown): value is TimestampLike
function formatTimestamp(ts: Timestamp | string | undefined): string
interface OrgMember {
  id: string;
  name: string;
}
interface DemandRowProps {
  item: ScheduleItem;
  orgMembers: OrgMember[];
  orgId: string;
}
⋮----
```

## File: src/features/workforce-scheduling.slice/ui/components/runtime/org-schedule-governance.confirmed-row.tsx
```typescript
import { Flag } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { Badge } from '@/shadcn-ui/badge';
import { Button } from '@/shadcn-ui/button';
import { toast } from '@/shadcn-ui/hooks/use-toast';
import { updateScheduleItemStatus } from '../../../application/commands';
import {
  AssignedMemberAvatars,
  formatTimestamp,
  getSkillName,
  type GovernanceConfirmedRowProps,
} from './org-schedule-governance.shared';
⋮----
<p className="text-xs text-muted-foreground">
⋮----
<Badge variant="secondary" className="text-[10px]">
```

## File: src/features/workforce-scheduling.slice/ui/components/runtime/org-schedule-governance.proposal-row.tsx
```typescript
import { CheckCircle, UserPlus, Users, XCircle } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { Badge } from '@/shadcn-ui/badge';
import { Button } from '@/shadcn-ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/shadcn-ui/command';
import { toast } from '@/shadcn-ui/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/shadcn-ui/popover';
import { assignMember, updateScheduleItemStatus } from '../../../application/commands';
import {
  AssignedMemberAvatars,
  computeSkillMatch,
  formatTimestamp,
  getSkillName,
  type GovernanceProposalRowProps,
} from './org-schedule-governance.shared';
⋮----
<CommandItem key=
⋮----
<p className="text-xs text-muted-foreground">
⋮----
<Badge variant="secondary" className="text-[10px]">
```

## File: src/features/workforce-scheduling.slice/ui/components/runtime/org-schedule-governance.shared.tsx
```typescript
import { Avatar, AvatarFallback } from '@/shadcn-ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shadcn-ui/tooltip';
import { tierSatisfies } from '@/shared-kernel';
import type { ScheduleItem, SkillRequirement } from '@/shared-kernel';
import { findSkill } from '@/shared-kernel/constants/skills';
import type { Timestamp } from '@/shared-kernel/ports';
import type { OrgEligibleMemberView } from '../../../application/queries';
type TimestampLike = { toDate: () => Date };
function isTimestampLike(value: unknown): value is TimestampLike
export interface GovernanceMember {
  id: string;
  name: string;
}
export interface GovernanceProposalRowProps {
  item: ScheduleItem;
  orgMembers: GovernanceMember[];
  eligibleMembers: OrgEligibleMemberView[];
  orgId: string;
}
export interface GovernanceConfirmedRowProps {
  item: ScheduleItem;
  orgId: string;
  orgMembers: GovernanceMember[];
}
export function getSkillName(slug: string): string
export function AssignedMemberAvatars(
export function formatTimestamp(ts: Timestamp | string | undefined): string
export function computeSkillMatch(
  member: OrgEligibleMemberView,
  skillRequirements?: SkillRequirement[]
): [number, number]
```

## File: src/features/workforce-scheduling.slice/ui/components/runtime/timeline-canvas.tsx
```typescript
import { addDays, addMinutes, isSameDay, startOfDay } from "date-fns";
import { useEffect, useMemo, useRef } from "react";
import { DataSet } from "vis-data";
import {
  Timeline,
  type DataGroup,
  type DataItem,
  type TimelineItem,
  type TimelineOptions,
} from "vis-timeline/standalone";
⋮----
import { cn } from "@/shadcn-ui/utils/utils";
import type { ScheduleItem, Timestamp } from "@/shared-kernel";
import type { TimelineMember } from '../../types/timeline.types';
type CalendarTimestamp = Timestamp | Date | { seconds: number; nanoseconds: number } | null | undefined;
type ResolvedTemporalKind = NonNullable<ScheduleItem["temporalKind"]>;
interface TimelineCanvasProps {
  items: ScheduleItem[];
  members: TimelineMember[];
  enableDrag?: boolean;
  groupMode?: "none" | "workspace";
  onMoveItem?: (params: {
    itemId: string;
    start: Date;
    end: Date;
    groupId?: string;
  }) => Promise<boolean>;
  className?: string;
}
function toDate(timestamp: CalendarTimestamp): Date | null
function escapeHtml(input: string): string
function toTimelineClassName(item: ScheduleItem): string
function isStartOfDay(date: Date): boolean
function inferTemporalKind(start: Date, end?: Date, explicitKind?: ScheduleItem["temporalKind"]): ResolvedTemporalKind
function resolveTimelineInterval(item: ScheduleItem):
function resolveInitialWindow(items: DataItem[]):
export function TimelineCanvas({
  items,
  members,
  enableDrag = false,
  groupMode = "none",
  onMoveItem,
  className,
}: TimelineCanvasProps)
⋮----
<div className=
```

## File: src/features/workforce-scheduling.slice/ui/hooks/runtime/use-account-timeline.ts
```typescript
import { useMemo } from 'react';
import { useApp } from '@/app-runtime/providers/app-provider';
import { useAccount } from '@/features/workspace.slice';
import type { ScheduleItem } from '@/shared-kernel';
import type { TimelineMember } from '../../types/timeline.types';
export function useAccountTimeline()
```

## File: src/features/workforce-scheduling.slice/ui/hooks/runtime/use-global-schedule.ts
```typescript
import { useMemo } from "react";
import { useApp } from "@/app-runtime/providers/app-provider";
import { useAccount } from "@/features/workspace.slice";
import {
  selectAllScheduleItems,
  selectPendingProposals,
  selectDecisionHistory,
  selectUpcomingEvents,
  selectPresentEvents,
} from '../../../application/selectors';
export function useGlobalSchedule()
```

## File: src/features/workforce-scheduling.slice/ui/hooks/runtime/use-org-schedule.ts
```typescript
import { useState, useEffect } from 'react';
import type { ScheduleItem, ScheduleStatus } from '@/shared-kernel';
import { subscribeToOrgScheduleProposals, subscribeToPendingProposals, subscribeToConfirmedProposals } from '../../../application/queries';
export function useOrgSchedule(
  orgId: string | null,
  opts?: { status?: ScheduleStatus }
)
export function usePendingScheduleProposals(orgId: string | null)
export function useConfirmedScheduleProposals(orgId: string | null)
```

## File: src/features/workforce-scheduling.slice/ui/hooks/runtime/use-schedule-commands.ts
```typescript
import { useCallback } from "react";
import { useApp } from "@/app-runtime/providers/app-provider";
import { useAuth } from "@/app-runtime/providers/auth-provider";
import { getOrgMemberEligibilityWithTier } from "@/shared-infra/projection.bus";
import { toast } from "@/shadcn-ui/hooks/use-toast";
import { tierSatisfies } from "@/shared-kernel";
import type { ScheduleItem } from '@/shared-kernel';
import {
    assignMember,
    unassignMember,
    updateScheduleItemStatus,
  updateScheduleItemDateRange,
} from "../../../application/commands";
import { getAccountActiveAssignments } from "../../../application/queries";
import { canTransitionScheduleStatus } from "../../../domain/rules/schedule.rules";
export function useScheduleActions()
```

## File: src/features/workforce-scheduling.slice/ui/hooks/runtime/use-timeline-commands.ts
```typescript
import { useCallback } from 'react';
import { useApp } from '@/app-runtime/providers/app-provider';
import { useAuth } from '@/app-runtime/providers/auth-provider';
import { toast } from '@/shadcn-ui/hooks/use-toast';
import type { ScheduleItem } from '@/shared-kernel';
import { updateTimelineItemDateRange } from '../../../application/commands';
export function useTimelineCommands()
```

## File: src/features/workforce-scheduling.slice/ui/hooks/runtime/use-workspace-timeline.ts
```typescript
import { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/app-runtime/providers/app-provider';
import { useWorkspace } from '@/features/workspace.slice';
import type { ScheduleItem } from '@/shared-kernel';
import { subscribeToWorkspaceTimelineItems } from '../../../application/queries/timeline.queries';
import type { TimelineMember } from '../../types/timeline.types';
export function useWorkspaceTimeline()
```

## File: src/features/workforce-scheduling.slice/ui/index.ts
```typescript

```

## File: src/shared-infra/event-router/index.ts
```typescript

```

## File: src/shared-infra/external-triggers/index.ts
```typescript

```

## File: src/shared-infra/frontend-firebase/auth/auth.adapter.ts
```typescript
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInAnonymously,
  updateProfile,
  verifyBeforeUpdateEmail,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth } from './auth.client';
```

## File: src/shared-infra/frontend-firebase/firestore/collection-paths.ts
```typescript

```

## File: src/shared-infra/frontend-firebase/firestore/firestore.adapter.ts
```typescript
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  setDoc,
} from 'firebase/firestore';
import type { FirestoreDoc, IFirestoreRepo, WriteOptions } from '@/shared-kernel/ports';
import { db } from './firestore.client';
class FirebaseFirestoreRepo implements IFirestoreRepo
⋮----
async getDoc<T>(collectionPath: string, docId: string): Promise<FirestoreDoc<T> | null>
async getDocs<T>(collectionPath: string): Promise<FirestoreDoc<T>[]>
async setDoc<T>(collectionPath: string, docId: string, data: T, opts?: WriteOptions): Promise<void>
async deleteDoc(collectionPath: string, docId: string): Promise<void>
onSnapshot<T>(
    collectionPath: string,
    callback: (docs: FirestoreDoc<T>[]) => void,
): () => void
```

## File: src/shared-infra/frontend-firebase/firestore/repositories/workspace-business.finance.repository.ts
```typescript
import { getDocument } from '../firestore.read.adapter';
import { setDocument } from '../firestore.write.adapter';
import { tagSlugRef, type TagSlugRef } from '@/shared-kernel';
type PersistedCostItemType =
  | 'EXECUTABLE'
  | 'MANAGEMENT'
  | 'RESOURCE'
  | 'FINANCIAL'
  | 'PROFIT'
  | 'ALLOWANCE';
interface PersistedFinanceDirectiveItem {
  id: string;
  name: string;
  sourceDocument: string;
  intentId: string;
  semanticTagSlug: TagSlugRef;
  costItemType: PersistedCostItemType;
  unitPrice: number;
  totalQuantity: number;
  remainingQuantity: number;
}
interface PersistedFinanceClaimLineItem {
  itemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  lineAmount: number;
}
export interface PersistedFinanceAggregateState {
  workspaceId: string;
  stage: string;
  cycleIndex: number;
  receivedAmount: number;
  directiveItems: PersistedFinanceDirectiveItem[];
  currentClaimLineItems: PersistedFinanceClaimLineItem[];
  paymentTermStartAtISO: string | null;
  paymentReceivedAtISO: string | null;
  updatedAt: number;
}
interface PersistedFinanceDirectiveItemInput
  extends Omit<PersistedFinanceDirectiveItem, 'semanticTagSlug'> {
  semanticTagSlug: string;
}
interface PersistedFinanceAggregateStateInput
  extends Omit<PersistedFinanceAggregateState, 'directiveItems'> {
  directiveItems: PersistedFinanceDirectiveItemInput[];
}
const financeAggregatePath = (workspaceId: string) => `financeStates/$
export async function getFinanceAggregateState(
  workspaceId: string,
): Promise<PersistedFinanceAggregateState | null>
export async function saveFinanceAggregateState(
  state: PersistedFinanceAggregateStateInput,
): Promise<void>
```

## File: src/shared-infra/frontend-firebase/storage/storage-path.resolver.ts
```typescript
dailyPhoto(accountId: string, workspaceId: string, fileId: string, fileName: string): string
taskAttachment(workspaceId: string, fileId: string, fileName: string): string
userAvatar(userId: string): string
workspaceDocument(workspaceId: string, fileId: string, versionId: string, fileName: string): string
```

## File: src/shared-infra/projection.bus/_funnel.ts
```typescript
import type { WorkspaceEventBus } from '@/features/workspace.slice';
import { registerOrganizationFunnel as registerOrganizationFunnelImpl } from './_organization-funnel';
import { upsertProjectionVersion } from './_registry';
import { registerTagFunnel as registerTagFunnelImpl } from './_tag-funnel';
import { registerWorkspaceFunnel as registerWorkspaceFunnelImpl } from './_workspace-funnel';
export function registerWorkspaceFunnel(bus: WorkspaceEventBus): () => void
export function registerOrganizationFunnel(): () => void
export function registerTagFunnel(): () => void
export async function replayWorkspaceProjections(
  workspaceId: string
): Promise<
```

## File: src/shared-infra/projection.bus/_registry.ts
```typescript
import {
  getProjectionVersion as getProjectionVersionRepo,
  upsertProjectionVersion as upsertProjectionVersionRepo,
  type ProjectionVersionRecord,
} from '@/shared-infra/frontend-firebase/firestore/firestore.facade';
⋮----
export async function getProjectionVersion(
  projectionName: string
): Promise<ProjectionVersionRecord | null>
export async function upsertProjectionVersion(
  projectionName: string,
  lastEventOffset: number,
  readModelVersion: string
): Promise<void>
```

## File: src/shared-kernel/constants/roles.ts
```typescript
import type { WorkspaceRole } from '@/features/workspace.slice';
import type { OrganizationRole } from '@/shared-kernel';
⋮----
export interface OrgRoleMeta {
  role: OrganizationRole;
  zhLabel: string;
  enLabel: string;
  rank: 1 | 2 | 3 | 4;
  colorClass: string;
}
⋮----
export function orgRoleAtLeast(
  actorRole: OrganizationRole,
  requiredRole: OrganizationRole,
): boolean
⋮----
export interface WorkspaceRoleMeta {
  role: WorkspaceRole;
  zhLabel: string;
  enLabel: string;
  rank: 1 | 2 | 3;
  colorClass: string;
}
⋮----
export function workspaceRoleAtLeast(
  actorRole: WorkspaceRole,
  requiredRole: WorkspaceRole,
): boolean
```

## File: src/shared-kernel/constants/status.ts
```typescript
import type { AuditLogType } from '@/features/workspace.slice';
import type { WorkspaceLifecycleState } from '@/features/workspace.slice';
import type { ScheduleStatus, InviteState, NotificationType, Presence } from '@/shared-kernel';
⋮----
export interface ScheduleStatusMeta {
  status: ScheduleStatus;
  zhLabel: string;
  enLabel: string;
  colorClass: string;
  bgClass: string;
}
⋮----
export interface WorkspaceLifecycleStateMeta {
  state: WorkspaceLifecycleState;
  zhLabel: string;
  enLabel: string;
  colorClass: string;
}
⋮----
export interface AuditLogTypeMeta {
  type: AuditLogType;
  zhLabel: string;
  enLabel: string;
  colorClass: string;
}
⋮----
export interface InviteStateMeta {
  state: InviteState;
  zhLabel: string;
  enLabel: string;
  colorClass: string;
}
⋮----
export interface PresenceMeta {
  presence: Presence;
  zhLabel: string;
  enLabel: string;
  dotClass: string;
}
⋮----
export interface NotificationTypeMeta {
  type: NotificationType;
  zhLabel: string;
  enLabel: string;
  colorClass: string;
}
```

## File: src/shared-kernel/data-contracts/skill-tier/index.ts
```typescript
import type { Timestamp } from '../../ports'
import type { TagSlugRef } from '../tag-authority'
export type SkillTier =
  | 'apprentice'
  | 'journeyman'
  | 'expert'
  | 'artisan'
  | 'grandmaster'
  | 'legendary'
  | 'titan';
export interface TierDefinition {
  tier: SkillTier;
  rank: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  label: string;
  minXp: number;
  maxXp: number;
  color: string;
  cssVar: string;
}
export interface SkillRequirement {
  tagSlug: TagSlugRef;
  tagId?: string;
  minXp?: number;
  minimumTier: SkillTier;
  quantity: number;
}
⋮----
export function getTierDefinition(tier: SkillTier): TierDefinition
export function getTier(xp: number): SkillTier
⋮----
export function getTierRank(tier: SkillTier): number
export function tierSatisfies(grantedTier: SkillTier, minimumTier: SkillTier): boolean
export interface SkillTag {
  slug: string;
  name: string;
  category?: string;
  description?: string;
}
export interface SkillGrant {
  tagSlug: TagSlugRef;
  tagName?: string;
  tagId?: string;
  tier: SkillTier;
  xp: number;
  earnedInOrgId?: string;
  grantedAt?: Timestamp;
}
export interface WorkspaceScheduleProposedPayload {
  readonly scheduleItemId: string;
  readonly workspaceId: string;
  readonly orgId: string;
  readonly title: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly proposedBy: string;
  readonly intentId?: string;
  readonly skillRequirements?: SkillRequirement[];
  readonly locationId?: string;
  readonly traceId?: string;
}
export interface ImplementsScheduleProposedPayloadContract {
  readonly implementsScheduleProposedPayload: true;
}
```

## File: src/shared-kernel/observability/_error-log.ts
```typescript
export interface DomainErrorEntry {
  readonly occurredAt: string;
  readonly traceId: string;
  readonly source: string;
  readonly message: string;
  readonly detail?: string;
}
export interface IErrorLogger {
  logDomainError(entry: DomainErrorEntry): void;
}
⋮----
logDomainError(entry: DomainErrorEntry): void;
```

## File: src/shared-kernel/observability/_metrics.ts
```typescript
export type EventCounters = Readonly<Record<string, number>>;
export interface IMetricsRecorder {
  recordEventPublished(eventType: string): void;
  getEventCounters(): EventCounters;
  resetEventCounters(): void;
}
⋮----
recordEventPublished(eventType: string): void;
getEventCounters(): EventCounters;
resetEventCounters(): void;
```

## File: src/shared-kernel/observability/_trace.ts
```typescript
export interface TraceContext {
  readonly traceId: string;
  readonly initiatedAt: string;
  readonly source?: string;
}
export interface ITraceProvider {
  generateTraceId(): string;
  createTraceContext(source?: string): TraceContext;
}
⋮----
generateTraceId(): string;
createTraceContext(source?: string): TraceContext;
```

## File: src/shared-kernel/observability/index.ts
```typescript

```

## File: src/features/workforce-scheduling.slice/application/index.ts
```typescript

```

## File: src/shared-infra/gateway-command/index.ts
```typescript

```

## File: src/shared-infra/gateway-query/index.ts
```typescript

```

## File: src/features/workforce-scheduling.slice/index.ts
```typescript

```

## File: src/features/workforce-scheduling.slice/ui/components/runtime/org-schedule-governance.tsx
```typescript
import { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/app-runtime/providers/app-provider';
import { useAccount } from '@/features/workspace.slice';
import { Card, CardContent, CardHeader, CardTitle } from '@/shadcn-ui/card';
import { PageHeader } from '@/shadcn-ui/custom-ui/page-header';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/shadcn-ui/empty';
import { ScrollArea } from '@/shadcn-ui/scroll-area';
import type { ScheduleItem } from '@/shared-kernel';
import { getEligibleMembersForSchedule, type OrgEligibleMemberView } from '../../../application/queries';
import { ConfirmedRow, ProposalRow } from './org-schedule-governance.rows';
```

## File: src/features/workforce-scheduling.slice/ui/components/runtime/schedule.account-view.tsx
```typescript
import { addMonths, subMonths } from "date-fns";
import { AlertCircle, UserPlus, Calendar, ListChecks, History, Users, BookOpen, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import { useApp } from "@/app-runtime/providers/app-provider";
import { Button } from "@/shadcn-ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shadcn-ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/shadcn-ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shadcn-ui/tabs";
import { cn } from "@/shadcn-ui/utils/utils";
import type { MemberReference } from "@/shared-kernel";
import type { ScheduleItem } from '@/shared-kernel';
import { useGlobalSchedule } from "../../hooks/runtime/use-global-schedule";
import { useScheduleActions } from "../../hooks/runtime/use-schedule-commands";
import { decisionHistoryColumns } from "./decision-history-columns";
import { OrgScheduleGovernance } from "./org-schedule-governance";
import { OrgSkillPoolManager } from "./org-skill-pool-manager";
import { ScheduleDataTable } from "./schedule-data-table";
import { UnifiedCalendarGrid } from "./unified-calendar-grid";
import { upcomingEventsColumns } from "./upcoming-events-columns";
interface MemberAssignPopoverProps {
  item: ScheduleItem;
  members: MemberReference[];
  onAssign: (item: ScheduleItem, memberId: string) => void;
  onUnassign: (item: ScheduleItem, memberId: string) => void;
}
⋮----
onUnassign(item, member.id);
⋮----
const onItemClick = (item: ScheduleItem) =>
const handleMonthChange = (direction: 'prev' | 'next') =>
```

## File: src/features/workforce-scheduling.slice/ui/components/runtime/schedule.workspace-view.tsx
```typescript
import { Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { useWorkspace } from "@/features/workspace.slice";
import { Button } from "@/shadcn-ui/button";
import { useWorkspaceSchedule } from "../../hooks/runtime/use-workspace-schedule";
import { UnifiedCalendarGrid } from "./unified-calendar-grid";
export function WorkspaceSchedule()
⋮----
onClick=
```

## File: src/features/workforce-scheduling.slice/ui/components/runtime/timeline.account-view.tsx
```typescript
import { AlertCircle, Clock3 } from "lucide-react";
import { useCallback, useMemo } from "react";
import { useApp } from "@/app-runtime/providers/app-provider";
import type { ScheduleItem } from "@/shared-kernel";
import { useAccountTimeline, useTimelineCommands } from "../../hooks/runtime";
import { TimelineCanvas } from "./timeline-canvas";
export function AccountTimelineSection()
```

## File: src/features/workforce-scheduling.slice/ui/components/runtime/timeline.workspace-view.tsx
```typescript
import { Clock3 } from "lucide-react";
import { useCallback, useMemo } from "react";
import type { ScheduleItem } from "@/shared-kernel";
import { useTimelineCommands, useWorkspaceTimeline } from "../../hooks/runtime";
import { TimelineCanvas } from "./timeline-canvas";
export function WorkspaceTimeline()
```

## File: src/features/workforce-scheduling.slice/ui/hooks/runtime/use-workspace-schedule.ts
```typescript
import { addMonths, subMonths, format } from "date-fns";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { useApp } from "@/app-runtime/providers/app-provider";
import { useWorkspace } from "@/features/workspace.slice";
import { toast } from "@/shadcn-ui/hooks/use-toast";
import type { ScheduleItem } from '@/shared-kernel';
import { subscribeToWorkspaceScheduleItems } from '../../../application/queries';
export function useWorkspaceSchedule()
⋮----
const handleMonthChange = (direction: "prev" | "next") =>
const handleOpenAddDialog = (date: Date) =>
```

## File: src/shared-infra/outbox-relay/_relay.ts
```typescript
import { getDlqLevel, type DlqEntry } from '@/shared-infra/dlq-manager';
import { db } from '@/shared-infra/frontend-firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  type Unsubscribe,
  type QuerySnapshot,
  type DocumentData,
  type DocumentChange,
} from '@/shared-infra/frontend-firebase/firestore/firestore.read.adapter';
import { updateDoc, setDoc, type serverTimestamp } from '@/shared-infra/frontend-firebase/firestore/firestore.write.adapter';
import { logDomainError } from '@/shared-infra/observability';
import type { OutboxStatus as SharedOutboxStatus } from '@/shared-kernel';
export type OutboxStatus = SharedOutboxStatus;
export interface OutboxDocument {
  readonly outboxId: string;
  readonly eventType: string;
  readonly envelopeJson: string;
  readonly lane: 'CRITICAL_LANE' | 'STANDARD_LANE' | 'BACKGROUND_LANE';
  status: OutboxStatus;
  readonly createdAt: ReturnType<typeof serverTimestamp>;
  attemptCount: number;
  lastAttemptAt?: string;
  lastError?: string;
}
⋮----
export type IerDeliveryFn = (
  lane: OutboxDocument['lane'],
  envelope: unknown
) => Promise<void>;
export function startOutboxRelay(
  outboxCollectionPath: string,
  deliver: IerDeliveryFn
): Unsubscribe
⋮----
function install(): void
⋮----
async function relayEntry(
  collectionPath: string,
  docId: string,
  data: OutboxDocument,
  deliver: IerDeliveryFn
): Promise<void>
async function routeToDlq(
  collectionPath: string,
  docId: string,
  data: OutboxDocument,
  attemptCount: number,
  lastError: string
): Promise<void>
```