/**
 * notification.slice — Public API
 *
 * VS7 Notification vertical slice.
 * Covers: User Notification delivery (FCM Layer 3) and
 *         Notification Router (FCM Layer 2, stateless #A10).
 *
 * External consumers import exclusively from this file.
 */

// =================================================================
// User Notification (account-user.notification)
// FCM Layer 3 — personal push delivery [R8]
// =================================================================
export { deliverNotification, type NotificationDeliveryInput, type DeliveryResult } from './user.notification';
export { subscribeToNotifications, markNotificationRead } from './user.notification';
export { useUserNotifications } from './user.notification';
export { NotificationBadge, NotificationList } from './user.notification';

// =================================================================
// Governance: Notification Router (account-governance.notification-router)
// FCM Layer 2 — routes org events to target accounts [E3, #A10]
// =================================================================
export { registerNotificationRouter, type RouterRegistration } from './gov.notification-router';
