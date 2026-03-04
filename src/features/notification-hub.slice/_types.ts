/**
 * notification-hub.slice — _types.ts
 *
 * Cross-cutting Authority — Domain Types for the system's sole side-effect outlet.
 *
 * Per logic-overview.md [D26]:
 *   notification-hub = 反應中樞 (Reaction Hub)
 *   VS7 enhanced — sole side-effect outlet with tag-aware routing via VS8.
 *
 * Architecture:
 *   [D3]  Notification dispatch via _actions.ts only.
 *   [D19] Core channel/priority contracts in shared-kernel/semantic-primitives.
 *   [D26] notification-hub owns _actions.ts / _services.ts per D3;
 *         does not parasitize shared-kernel per D8.
 *   [#A10] Notification routing is stateless.
 *   [#A13] Atomicity invariant: notification boundary.
 *
 * Dependency rule: ZERO infrastructure imports.
 */

import type {
  NotificationChannel,
  NotificationPriority,
} from '@/features/shared-kernel';

// ─── Tag-Aware Routing ────────────────────────────────────────────────────────

/**
 * Tag-based routing rule: maps a set of tag slugs to a delivery channel
 * and priority. Evaluated by the notification hub's event subscriber.
 *
 * Per logic-overview.md (VS7):
 *   Notification Hub routes events via VS8 tag semantics —
 *   tag slugs determine which channels fire and at what priority.
 */
export interface TagRoutingRule {
  readonly ruleId: string;
  readonly name: string;
  /** Tag slugs that trigger this rule (AND semantics — all must match). */
  readonly tagSlugs: readonly string[];
  readonly channel: NotificationChannel;
  readonly priority: NotificationPriority;
  /** Optional template ID for message formatting. */
  readonly templateId?: string;
  readonly enabled: boolean;
}

/**
 * Result of evaluating tag routing rules against an event's tags.
 */
export interface TagRoutingDecision {
  readonly matchedRules: readonly TagRoutingRule[];
  readonly channels: readonly NotificationChannel[];
  readonly highestPriority: NotificationPriority;
}

// ─── Notification Event Types ─────────────────────────────────────────────────

/**
 * Source event that the notification hub subscribes to.
 * Typically emitted by projection.bus or domain event buses.
 */
export interface NotificationSourceEvent {
  readonly eventKey: string;
  readonly payload: Record<string, unknown>;
  readonly tags: readonly string[];
  readonly orgId: string;
  readonly workspaceId?: string;
  /** Target account IDs for delivery (resolved by routing rules). */
  readonly targetAccountIds?: readonly string[];
  /** [R8] TraceID propagated from the originating command. */
  readonly traceId?: string;
  readonly occurredAt: string;
}

/**
 * Enriched notification ready for delivery (after tag-aware routing).
 */
export interface NotificationDispatch {
  readonly sourceEventKey: string;
  readonly channel: NotificationChannel;
  readonly priority: NotificationPriority;
  readonly targetAccountIds: readonly string[];
  readonly title: string;
  readonly body: string;
  readonly data?: Record<string, unknown>;
  readonly tags: readonly string[];
  readonly traceId?: string;
  readonly dispatchedAt: string;
}

// ─── Notification Dispatch Result ─────────────────────────────────────────────

/**
 * Result of a notification dispatch attempt.
 */
export interface NotificationDispatchResult {
  readonly dispatchId: string;
  readonly channel: NotificationChannel;
  readonly targetCount: number;
  readonly successCount: number;
  readonly failureCount: number;
  readonly errors: readonly NotificationDispatchError[];
}

/**
 * Individual delivery error within a dispatch batch.
 */
export interface NotificationDispatchError {
  readonly accountId: string;
  readonly channel: NotificationChannel;
  readonly reason: string;
}

// ─── Event Subscription Types ─────────────────────────────────────────────────

/**
 * Subscription registration for the notification hub's event listener.
 * Each subscription maps a domain event key to routing evaluation.
 */
export interface NotificationSubscription {
  readonly eventKey: string;
  readonly description: string;
  /** If true, routing rules are evaluated; otherwise, default routing is used. */
  readonly useTagRouting: boolean;
  readonly enabled: boolean;
}

// ─── Hub State (Observability) ────────────────────────────────────────────────

/**
 * Notification hub operational statistics.
 */
export interface NotificationHubStats {
  readonly totalDispatched: number;
  readonly dispatchedByChannel: Record<NotificationChannel, number>;
  readonly totalErrors: number;
  readonly activeSubscriptions: number;
  readonly activeRoutingRules: number;
  readonly lastDispatchedAt: string;
}

// ─── Re-exports ───────────────────────────────────────────────────────────────

export type { NotificationChannel, NotificationPriority };
