/**
 * account-governance.notification-router — _router.ts
 *
 * FCM Layer 2: Notification Router
 * Routes organization events to the correct target account notification slice
 * based on TargetAccountID.
 *
 * Per logic-overview.md [E3]:
 *   IER →|ScheduleAssigned| ACCOUNT_NOTIFICATION_ROUTER
 *   ACCOUNT_NOTIFICATION_ROUTER →|路由至目標帳號| ACCOUNT_USER_NOTIFICATION
 *
 * Current implementation: subscribes directly to the org event bus.
 * This is the consumer side — when a dedicated IER layer is introduced,
 * it will be the IER (not the org event bus) that calls this router.
 *
 * Does NOT generate content — only routes from event source to delivery slice.
 */

import { onOrgEvent } from '@/features/account-organization.event-bus';
import { deliverNotification } from '@/features/account-user.notification';

export interface RouterRegistration {
  unsubscribe: () => void;
}

/**
 * Registers the notification router on the organization event bus.
 * Should be called once at app startup (e.g., in the root layout or app-provider).
 *
 * Returns an unsubscribe function to clean up on unmount.
 */
export function registerNotificationRouter(): RouterRegistration {
  const unsubscribers: Array<() => void> = [];

  // Route ScheduleAssigned events to the target account's notification layer
  unsubscribers.push(
    onOrgEvent('organization:schedule:assigned', async (payload) => {
      await deliverNotification(payload.targetAccountId, {
        title: '排程指派通知',
        message: `您已被指派至排程：「${payload.title}」（${payload.startDate} ~ ${payload.endDate}）`,
        type: 'info',
        sourceEvent: 'organization:schedule:assigned',
        sourceId: payload.scheduleItemId,
        workspaceId: payload.workspaceId,
        // [R8] forward traceId from the originating event envelope
        traceId: payload.traceId,
      });
    })
  );

  // Route policy change events to org members (broadcast via member list)
  unsubscribers.push(
    onOrgEvent('organization:policy:changed', async (payload) => {
      // Policy changes are org-wide; notification delivery targets the org owner
      await deliverNotification(payload.changedBy, {
        title: '組織政策已更新',
        message: `組織政策 ${payload.policyId} 已${payload.changeType === 'created' ? '建立' : payload.changeType === 'updated' ? '更新' : '刪除'}`,
        type: 'info',
        sourceEvent: 'organization:policy:changed',
        sourceId: payload.policyId,
        workspaceId: payload.orgId,
        traceId: payload.traceId,
      });
    })
  );

  // Route member joined events to the new member
  unsubscribers.push(
    onOrgEvent('organization:member:joined', async (payload) => {
      await deliverNotification(payload.accountId, {
        title: '已加入組織',
        message: `您已成功加入組織，角色：${payload.role}`,
        type: 'success',
        sourceEvent: 'organization:member:joined',
        sourceId: payload.orgId,
        workspaceId: payload.orgId,
        traceId: payload.traceId,
      });
    })
  );

  return {
    unsubscribe: () => unsubscribers.forEach((u) => u()),
  };
}
