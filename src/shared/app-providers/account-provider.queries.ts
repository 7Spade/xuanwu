/**
 * Module: account-provider.queries.ts
 * Purpose: firestore subscription factories for account-provider
 * Responsibilities: provide account-scoped subscriptions for account-level projections
 * Constraints: deterministic logic, respect module boundaries
 */

import type { ScheduleItem } from '@/shared-kernel'
import type { PartnerInvite } from '@/shared-kernel'
import { db } from '@/shared/infra/firestore/firestore.client'
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  type Unsubscribe,
  where,
} from '@/shared/infra/firestore/firestore.read.adapter'
import { snapshotToRecord } from '@/shared/infra/firestore/firestore.utils'
import type { DailyLog } from '@/features/workspace.slice/business.daily/_types'
import type { AuditLog } from '@/features/workspace.slice/gov.audit/_types'
import type { Workspace } from '@/features/workspace.slice/core/_types'

export function subscribeToDailyLogsForAccount(
  accountId: string,
  onUpdate: (logs: Record<string, DailyLog>) => void,
): Unsubscribe {
  const dailyLogsQuery = query(
    collection(db, 'accounts', accountId, 'dailyLogs'),
    orderBy('recordedAt', 'desc'),
    limit(50),
  )

  return onSnapshot(dailyLogsQuery, (snap) => onUpdate(snapshotToRecord<DailyLog>(snap)))
}

export function subscribeToAuditLogsForAccount(
  accountId: string,
  onUpdate: (logs: Record<string, AuditLog>) => void,
): Unsubscribe {
  const auditLogsQuery = query(
    collection(db, 'accounts', accountId, 'auditLogs'),
    orderBy('recordedAt', 'desc'),
    limit(50),
  )

  return onSnapshot(auditLogsQuery, (snap) => onUpdate(snapshotToRecord<AuditLog>(snap)))
}

export function subscribeToInvitesForAccount(
  accountId: string,
  onUpdate: (invites: Record<string, PartnerInvite>) => void,
): Unsubscribe {
  const invitesQuery = query(
    collection(db, 'accounts', accountId, 'invites'),
    orderBy('invitedAt', 'desc'),
  )

  return onSnapshot(invitesQuery, (snap) => onUpdate(snapshotToRecord<PartnerInvite>(snap)))
}

export function subscribeToScheduleItemsForAccount(
  accountId: string,
  onUpdate: (items: Record<string, ScheduleItem>) => void,
): Unsubscribe {
  const scheduleItemsQuery = query(
    collection(db, 'accounts', accountId, 'schedule_items'),
    orderBy('createdAt', 'desc'),
  )

  return onSnapshot(scheduleItemsQuery, (snap) => onUpdate(snapshotToRecord<ScheduleItem>(snap)))
}

export function subscribeToWorkspacesForAccount(
  dimensionId: string,
  onUpdate: (workspaces: Record<string, Workspace>) => void,
): Unsubscribe {
  const workspacesQuery = query(
    collection(db, 'workspaces'),
    where('dimensionId', '==', dimensionId),
  )

  return onSnapshot(workspacesQuery, (snap) => onUpdate(snapshotToRecord<Workspace>(snap)))
}
