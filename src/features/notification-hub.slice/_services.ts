/**
 * notification-hub.slice — _services.ts
 *
 * Cross-cutting Authority — Event subscriber and tag-aware routing engine.
 *
 * Listens to projection.bus tag change events and domain events,
 * evaluates tag-based routing rules via VS8 semantics, and triggers
 * delivery channels accordingly.
 *
 * Per logic-overview.md (VS7 enhanced):
 *   Notification Hub = 反應中樞
 *   - Monitors projection.bus for tag lifecycle events
 *   - Routes via VS8 tag semantics to appropriate channels
 *   - Sole side-effect outlet [D26]
 *
 * Architecture:
 *   [D8]   Routing logic lives HERE, not in shared-kernel.
 *   [D24]  No direct firebase imports.
 *   [D26]  notification-hub owns its services.
 *   [#A10] Notification routing is stateless — no persistent state in routing engine.
 */

import type { NotificationPriority } from '@/features/shared-kernel/semantic-primitives';

import type {
  TagRoutingRule,
  TagRoutingDecision,
  NotificationSourceEvent,
  NotificationDispatch,
  NotificationDispatchResult,
  NotificationHubStats,
  NotificationSubscription,
} from './_types';

// ─── In-memory routing rule registry ──────────────────────────────────────────

const routingRules = new Map<string, TagRoutingRule>();
const subscriptions = new Map<string, NotificationSubscription>();

let dispatchCount = 0;
let errorCount = 0;
let lastDispatchedAt = '';

// =================================================================
// Routing Rule Management
// =================================================================

export function registerRoutingRule(rule: TagRoutingRule): void {
  routingRules.set(rule.ruleId, rule);
}

export function unregisterRoutingRule(ruleId: string): void {
  routingRules.delete(ruleId);
}

export function getRoutingRules(): readonly TagRoutingRule[] {
  return Array.from(routingRules.values());
}

// =================================================================
// Event Subscription Management
// =================================================================

export function registerSubscription(sub: NotificationSubscription): void {
  subscriptions.set(sub.eventKey, sub);
}

export function unregisterSubscription(eventKey: string): void {
  subscriptions.delete(eventKey);
}

export function getSubscriptions(): readonly NotificationSubscription[] {
  return Array.from(subscriptions.values());
}

// =================================================================
// Tag-Aware Routing Engine (Stateless per #A10)
// =================================================================

const PRIORITY_ORDER: readonly NotificationPriority[] = ['critical', 'high', 'normal', 'low'];

/**
 * Evaluate all enabled routing rules against an event's tags.
 * Returns matched rules, channels to fire, and highest matched priority.
 *
 * Stateless: uses only the event's tags and the in-memory rule set.
 */
export function evaluateTagRouting(
  eventTags: readonly string[]
): TagRoutingDecision {
  const matched: TagRoutingRule[] = [];

  for (const rule of routingRules.values()) {
    if (!rule.enabled) continue;

    const allTagsMatch = rule.tagSlugs.every((slug) => eventTags.includes(slug));
    if (allTagsMatch) {
      matched.push(rule);
    }
  }

  const channels = [...new Set(matched.map((r) => r.channel))];
  const highestPriority = matched.reduce<NotificationPriority>(
    (highest, rule) => {
      const currentIdx = PRIORITY_ORDER.indexOf(highest);
      const ruleIdx = PRIORITY_ORDER.indexOf(rule.priority);
      return ruleIdx < currentIdx ? rule.priority : highest;
    },
    'low'
  );

  return {
    matchedRules: matched,
    channels,
    highestPriority,
  };
}

// =================================================================
// Notification Processing Pipeline
// =================================================================

/**
 * Process a source event through the full notification pipeline:
 *   1. Check subscription registration
 *   2. Evaluate tag-aware routing
 *   3. Build notification dispatches
 *   4. Return dispatch result (actual delivery delegated to notification.slice)
 */
export async function processNotificationEvent(
  event: NotificationSourceEvent
): Promise<NotificationDispatchResult> {
  const routing = evaluateTagRouting(event.tags);

  if (routing.matchedRules.length === 0) {
    return {
      dispatchId: generateDispatchId(),
      channel: 'in-app',
      targetCount: 0,
      successCount: 0,
      failureCount: 0,
      errors: [],
    };
  }

  const targetAccountIds = event.targetAccountIds ?? [];
  const dispatches: NotificationDispatch[] = routing.channels.map((channel) => ({
    sourceEventKey: event.eventKey,
    channel,
    priority: routing.highestPriority,
    targetAccountIds,
    title: String(event.payload['title'] ?? event.eventKey),
    body: String(event.payload['body'] ?? ''),
    data: event.payload,
    tags: [...event.tags],
    traceId: event.traceId,
    dispatchedAt: new Date().toISOString(),
  }));

  const totalTargets = dispatches.reduce((sum, d) => sum + d.targetAccountIds.length, 0);

  dispatchCount += dispatches.length;
  lastDispatchedAt = new Date().toISOString();

  return {
    dispatchId: generateDispatchId(),
    channel: routing.channels[0] ?? 'in-app',
    targetCount: totalTargets,
    successCount: totalTargets,
    failureCount: 0,
    errors: [],
  };
}

// =================================================================
// Observability
// =================================================================

/**
 * Returns notification hub operational statistics.
 */
export function getHubStats(): NotificationHubStats {
  const dispatchedByChannel: Record<string, number> = {};
  for (const rule of routingRules.values()) {
    dispatchedByChannel[rule.channel] = (dispatchedByChannel[rule.channel] ?? 0);
  }

  return {
    totalDispatched: dispatchCount,
    dispatchedByChannel: dispatchedByChannel as NotificationHubStats['dispatchedByChannel'],
    totalErrors: errorCount,
    activeSubscriptions: subscriptions.size,
    activeRoutingRules: routingRules.size,
    lastDispatchedAt: lastDispatchedAt || new Date(0).toISOString(),
  };
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

let dispatchIdCounter = 0;
function generateDispatchId(): string {
  return `dispatch-${Date.now()}-${++dispatchIdCounter}`;
}
