/**
 * notification-hub.slice — _contract.ts
 *
 * Data contracts for the notification-hub slice. [D19]
 *
 * Per logic-overview.md:
 *   [D19] 型別歸屬 — domain contracts belong in the owning slice.
 *   [D15] EVENTUAL consistency — notifications are delivered with eventual consistency.
 *   [D21-D23] Semantic labels — NotificationSemanticType maps to VS8 semantic nodes.
 *
 * HubNotification extends the shared-kernel Notification with category and
 * VS8-aligned semantic type, enabling category filtering and intent-aware UI.
 */

import type { Notification } from '@/features/shared-kernel';

/** [D21-D23] Category groupings for the notification center tab filter. */
export type NotificationCategory = 'system' | 'task' | 'permission';

/**
 * [D21-D23] VS8 semantic type indicating action intent.
 *   ACTION_REQUIRED — the user must take an action (e.g., pending approval)
 *   INFO_ONLY       — informational, no action needed (e.g., task completed)
 */
export type NotificationSemanticType = 'ACTION_REQUIRED' | 'INFO_ONLY';

/**
 * HubNotification extends the shared-kernel Notification with
 * hub-specific classification fields required for category filtering
 * and VS8 semantic routing.
 */
export interface HubNotification extends Notification {
  /** Category for tab-based filtering in the NotificationBell popover. */
  category: NotificationCategory;
  /** VS8 semantic intent: determines visual priority cues in the UI. */
  semanticType: NotificationSemanticType;
}
