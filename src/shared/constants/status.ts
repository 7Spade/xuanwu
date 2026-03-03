/**
 * @fileoverview shared/constants/status.ts — Domain status / lifecycle state metadata.
 *
 * Centralises the labelled, coloured descriptors for every status / state string union
 * used across the domain model.  Note: ScheduleStatus is now canonical in
 * `@/features/shared-kernel`; other types remain in `@/shared/types/` as legacy.
 *
 * Covered union types:
 *   - ScheduleStatus          (→ @/features/shared-kernel/schedule-contract [D19])
 *   - WorkspaceLifecycleState (workspace.types.ts)
 *   - AuditLogType            (audit.types.ts)
 *   - InviteState             (account.types.ts → PartnerInvite.inviteState)
 *   - Presence                (account.types.ts → MemberReference.presence)
 *   - NotificationType        (account.types.ts → Notification.type)
 */

import type { ScheduleStatus } from '@/features/shared-kernel';
import type {
  InviteState,
  NotificationType,
  Presence,
} from '@/shared/types/account.types';
import type { AuditLogType } from '@/shared/types/audit.types';
import type { WorkspaceLifecycleState } from '@/shared/types/workspace.types';

// ---------------------------------------------------------------------------
// ScheduleStatus
// ---------------------------------------------------------------------------

/** Stable ordered list of ScheduleStatus values. */
export const SCHEDULE_STATUSES: readonly ScheduleStatus[] = [
  'PROPOSAL',
  'OFFICIAL',
  'REJECTED',
  'COMPLETED',
] as const;

export interface ScheduleStatusMeta {
  status: ScheduleStatus;
  zhLabel: string;
  enLabel: string;
  /** Tailwind colour class for badge / chip. */
  colorClass: string;
  /** Muted background Tailwind class — for row highlights. */
  bgClass: string;
}

export const SCHEDULE_STATUS_META: Record<ScheduleStatus, ScheduleStatusMeta> = {
  PROPOSAL: {
    status: 'PROPOSAL',
    zhLabel: '提案中',
    enLabel: 'Proposal',
    colorClass: 'bg-amber-100 text-amber-800',
    bgClass: 'bg-amber-50',
  },
  OFFICIAL: {
    status: 'OFFICIAL',
    zhLabel: '正式排班',
    enLabel: 'Official',
    colorClass: 'bg-green-100 text-green-800',
    bgClass: 'bg-green-50',
  },
  REJECTED: {
    status: 'REJECTED',
    zhLabel: '已拒絕',
    enLabel: 'Rejected',
    colorClass: 'bg-red-100 text-red-800',
    bgClass: 'bg-red-50',
  },
  COMPLETED: {
    status: 'COMPLETED',
    zhLabel: '已完成',
    enLabel: 'Completed',
    colorClass: 'bg-slate-100 text-slate-600',
    bgClass: 'bg-slate-50',
  },
} as const;

// ---------------------------------------------------------------------------
// WorkspaceLifecycleState
// ---------------------------------------------------------------------------

/** Stable ordered list of WorkspaceLifecycleState values. */
export const WORKSPACE_LIFECYCLE_STATES: readonly WorkspaceLifecycleState[] = [
  'preparatory',
  'active',
  'stopped',
] as const;

export interface WorkspaceLifecycleStateMeta {
  state: WorkspaceLifecycleState;
  zhLabel: string;
  enLabel: string;
  colorClass: string;
}

export const WORKSPACE_LIFECYCLE_STATE_META: Record<
  WorkspaceLifecycleState,
  WorkspaceLifecycleStateMeta
> = {
  preparatory: {
    state: 'preparatory',
    zhLabel: '籌備中',
    enLabel: 'Preparatory',
    colorClass: 'bg-sky-100 text-sky-800',
  },
  active: {
    state: 'active',
    zhLabel: '進行中',
    enLabel: 'Active',
    colorClass: 'bg-green-100 text-green-800',
  },
  stopped: {
    state: 'stopped',
    zhLabel: '已停止',
    enLabel: 'Stopped',
    colorClass: 'bg-gray-100 text-gray-500',
  },
} as const;

// ---------------------------------------------------------------------------
// AuditLogType
// ---------------------------------------------------------------------------

export type { AuditLogType };

/** Stable ordered list of AuditLogType values. */
export const AUDIT_LOG_TYPES: readonly AuditLogType[] = [
  'create',
  'update',
  'delete',
  'security',
] as const;

export interface AuditLogTypeMeta {
  type: AuditLogType;
  zhLabel: string;
  enLabel: string;
  colorClass: string;
}

export const AUDIT_LOG_TYPE_META: Record<AuditLogType, AuditLogTypeMeta> = {
  create: {
    type: 'create',
    zhLabel: '建立',
    enLabel: 'Create',
    colorClass: 'bg-emerald-100 text-emerald-700',
  },
  update: {
    type: 'update',
    zhLabel: '更新',
    enLabel: 'Update',
    colorClass: 'bg-blue-100 text-blue-700',
  },
  delete: {
    type: 'delete',
    zhLabel: '刪除',
    enLabel: 'Delete',
    colorClass: 'bg-red-100 text-red-700',
  },
  security: {
    type: 'security',
    zhLabel: '安全事件',
    enLabel: 'Security',
    colorClass: 'bg-orange-100 text-orange-700',
  },
} as const;

// ---------------------------------------------------------------------------
// InviteState (PartnerInvite.inviteState)
// ---------------------------------------------------------------------------

export type { InviteState };

/** Stable ordered list of InviteState values. */
export const INVITE_STATES: readonly InviteState[] = [
  'pending',
  'accepted',
  'expired',
] as const;

export interface InviteStateMeta {
  state: InviteState;
  zhLabel: string;
  enLabel: string;
  colorClass: string;
}

export const INVITE_STATE_META: Record<InviteState, InviteStateMeta> = {
  pending: {
    state: 'pending',
    zhLabel: '待確認',
    enLabel: 'Pending',
    colorClass: 'bg-amber-100 text-amber-700',
  },
  accepted: {
    state: 'accepted',
    zhLabel: '已接受',
    enLabel: 'Accepted',
    colorClass: 'bg-green-100 text-green-700',
  },
  expired: {
    state: 'expired',
    zhLabel: '已過期',
    enLabel: 'Expired',
    colorClass: 'bg-gray-100 text-gray-500',
  },
} as const;

// ---------------------------------------------------------------------------
// Presence (MemberReference.presence)
// ---------------------------------------------------------------------------

export type { Presence };

/** Stable ordered list of Presence values. */
export const PRESENCES: readonly Presence[] = ['active', 'away', 'offline'] as const;

export interface PresenceMeta {
  presence: Presence;
  zhLabel: string;
  enLabel: string;
  /** CSS colour class for the presence dot indicator. */
  dotClass: string;
}

export const PRESENCE_META: Record<Presence, PresenceMeta> = {
  active: {
    presence: 'active',
    zhLabel: '在線',
    enLabel: 'Active',
    dotClass: 'bg-green-500',
  },
  away: {
    presence: 'away',
    zhLabel: '離開',
    enLabel: 'Away',
    dotClass: 'bg-amber-400',
  },
  offline: {
    presence: 'offline',
    zhLabel: '離線',
    enLabel: 'Offline',
    dotClass: 'bg-gray-300',
  },
} as const;

// ---------------------------------------------------------------------------
// NotificationType (Notification.type)
// ---------------------------------------------------------------------------

export type { NotificationType };

/** Stable ordered list of NotificationType values. */
export const NOTIFICATION_TYPES: readonly NotificationType[] = [
  'info',
  'alert',
  'success',
] as const;

export interface NotificationTypeMeta {
  type: NotificationType;
  zhLabel: string;
  enLabel: string;
  colorClass: string;
}

export const NOTIFICATION_TYPE_META: Record<NotificationType, NotificationTypeMeta> = {
  info: {
    type: 'info',
    zhLabel: '資訊',
    enLabel: 'Info',
    colorClass: 'bg-blue-100 text-blue-700',
  },
  alert: {
    type: 'alert',
    zhLabel: '警示',
    enLabel: 'Alert',
    colorClass: 'bg-orange-100 text-orange-700',
  },
  success: {
    type: 'success',
    zhLabel: '成功',
    enLabel: 'Success',
    colorClass: 'bg-green-100 text-green-700',
  },
} as const;
