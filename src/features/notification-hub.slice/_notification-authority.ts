/**
 * Module: _notification-authority.ts
 * Purpose: own notification-domain authority constants
 * Responsibilities: provide canonical channel and priority ordering constants for routing
 * Constraints: deterministic logic, respect module boundaries
 */

import type { NotificationChannel, NotificationPriority } from '@/shared-kernel/data-contracts/semantic/semantic-contracts';

export const NOTIFICATION_CHANNELS: readonly NotificationChannel[] = ['push', 'in-app', 'email', 'sms'];
export const NOTIFICATION_PRIORITIES: readonly NotificationPriority[] = ['low', 'normal', 'high', 'critical'];
export const NOTIFICATION_PRIORITY_ORDER: readonly NotificationPriority[] = ['critical', 'high', 'normal', 'low'];
