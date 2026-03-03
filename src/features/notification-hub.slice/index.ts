/**
 * notification-hub.slice — Public API
 *
 * Cross-cutting Authority: the system's sole side-effect outlet. [D26]
 *
 * Per logic-overview.md:
 *   notification-hub = 反應中樞 (Reaction Hub)
 *   VS7 enhanced — sole side-effect outlet with tag-aware routing via VS8
 *
 * All notification dispatch in the system MUST route through this slice.
 * Event subscriber monitors projection.bus tag changes and domain events,
 * then routes via VS8 tag semantics to appropriate delivery channels.
 *
 * Architecture:
 *   [D3]   Notification dispatch via _actions.ts.
 *   [D8]   Routing logic in _services.ts, not shared-kernel.
 *   [D19]  Core channel/priority contracts in shared-kernel/semantic-primitives.
 *   [D26]  Owns _actions.ts / _services.ts; does not parasitize shared-kernel.
 *   [#A10] Notification routing is stateless.
 *   [#A13] Atomicity invariant: notification boundary.
 *
 * External consumers import from '@/features/notification-hub.slice'.
 */

// =================================================================
// Domain Types
// =================================================================
export type {
  TagRoutingRule,
  TagRoutingDecision,
  NotificationSourceEvent,
  NotificationDispatch,
  NotificationDispatchResult,
  NotificationDispatchError,
  NotificationSubscription,
  NotificationHubStats,
} from './_types';

// Re-exported shared-kernel contracts for consumer convenience
export type { NotificationChannel, NotificationPriority } from './_types';

// =================================================================
// Server Actions (all notification operations go through here) [D3]
// =================================================================
export {
  dispatchNotification,
  registerRoutingRule,
  unregisterRoutingRule,
  triggerDispatch,
} from './_actions';
export type { DispatchNotificationResult } from './_actions';

// =================================================================
// Services (tag-aware routing engine + event subscription)
// =================================================================
export {
  evaluateTagRouting,
  getRoutingRules,
  registerSubscription,
  unregisterSubscription,
  getSubscriptions,
  getHubStats,
  subscribeToProjectionBus,
  emitProjectionBusEvent,
  initTagChangedSubscriber,
  TAG_CHANGED_EVENT_KEY,
} from './_services';

// =================================================================
// User Notification (FCM Layer 3 — personal push delivery [R8])
// =================================================================
export { deliverNotification, type NotificationDeliveryInput, type DeliveryResult } from './user.notification';
export { subscribeToNotifications, markNotificationRead } from './user.notification';
export { useUserNotifications } from './user.notification';
export { NotificationBadge, NotificationList } from './user.notification';

// =================================================================
// Governance: Notification Router (FCM Layer 2 — routes org events [E3, #A10])
// =================================================================
export { registerNotificationRouter, type RouterRegistration } from './gov.notification-router';
