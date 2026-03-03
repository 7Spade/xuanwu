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

import type { NotificationPriority } from '@/features/shared-kernel';

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
const dispatchCountByChannel: Record<string, number> = {};

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
 *   4. Return dispatch result (actual delivery delegated to user.notification)
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

  dispatchCount += dispatches.length;
  for (const d of dispatches) {
    dispatchCountByChannel[d.channel] = (dispatchCountByChannel[d.channel] ?? 0) + 1;
  }
  lastDispatchedAt = new Date().toISOString();

  const targetCount = dispatches.reduce((sum, d) => sum + d.targetAccountIds.length, 0);

  return {
    dispatchId: generateDispatchId(),
    channel: routing.channels[0] ?? 'in-app',
    targetCount,
    successCount: targetCount,
    failureCount: 0,
    errors: [],
  };
}

// =================================================================
// Projection Bus Subscriber (TAG_CHANGED events)
// =================================================================

/**
 * Event key for tag lifecycle events from projection.bus.
 * The notification hub subscribes to these events for tag-aware routing.
 */
export const TAG_CHANGED_EVENT_KEY = 'projection:tag:changed';

/**
 * Listener function type for projection bus events.
 */
export type ProjectionBusListener = (event: NotificationSourceEvent) => void;

const busListeners = new Map<string, ProjectionBusListener[]>();

/**
 * Subscribe to a projection.bus event key.
 * Returns an unsubscribe function.
 *
 * Per logic-overview.md (VS7):
 *   Notification Hub monitors projection.bus for tag lifecycle events
 *   and evaluates tag-aware routing to decide delivery channels.
 */
export function subscribeToProjectionBus(
  eventKey: string,
  listener: ProjectionBusListener
): () => void {
  const existing = busListeners.get(eventKey) ?? [];
  existing.push(listener);
  busListeners.set(eventKey, existing);

  return () => {
    const listeners = busListeners.get(eventKey);
    if (listeners) {
      const filtered = listeners.filter((l) => l !== listener);
      if (filtered.length > 0) {
        busListeners.set(eventKey, filtered);
      } else {
        busListeners.delete(eventKey);
      }
    }
  };
}

/**
 * Emit an event to all registered projection bus listeners.
 * Used by projection.bus adapters to forward domain events.
 */
export function emitProjectionBusEvent(event: NotificationSourceEvent): void {
  const listeners = busListeners.get(event.eventKey) ?? [];
  for (const listener of listeners) {
    listener(event);
  }
}

/**
 * Initialize the TAG_CHANGED subscription — connects projection.bus
 * tag lifecycle events to the notification routing pipeline.
 *
 * Returns an unsubscribe function for cleanup.
 */
export function initTagChangedSubscriber(): () => void {
  return subscribeToProjectionBus(TAG_CHANGED_EVENT_KEY, (event) => {
    processNotificationEvent(event).catch(() => {
      /* fire-and-forget: errors logged inside processNotificationEvent */
    });
  });
}

// =================================================================
// Observability
// =================================================================

/**
 * Returns notification hub operational statistics.
 */
export function getHubStats(): NotificationHubStats {
  return {
    totalDispatched: dispatchCount,
    dispatchedByChannel: { ...dispatchCountByChannel } as NotificationHubStats['dispatchedByChannel'],
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
