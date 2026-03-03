/**
 * workspace.slice/core — Firestore subscription factories (D5-compliant)
 *
 * Encapsulates all `onSnapshot` / Firestore read-adapter calls so that
 * `account-provider.tsx` (and any other client component) has zero direct
 * infra imports per D5.
 *
 * Pattern follows `business.files/_queries.ts` — all Firestore API surface
 * stays in this file; callbacks receive typed domain records.
 */

import type { ScheduleItem } from '@/features/shared-kernel';
import { db } from '@/shared/infra/firestore/firestore.client';
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  type Unsubscribe,
  where,
} from '@/shared/infra/firestore/firestore.read.adapter';
import { snapshotToRecord } from '@/shared/infra/firestore/firestore.utils';
import type {
  AuditLog,
  DailyLog,
  PartnerInvite,
  Workspace,
} from '@/shared/types';

// ---------------------------------------------------------------------------
// Account-scoped subscriptions
// ---------------------------------------------------------------------------

/**
 * Opens a real-time listener on `accounts/{accountId}/dailyLogs`.
 * Calls `onUpdate` with the latest records map on every change.
 */
export function subscribeToDailyLogsForAccount(
  accountId: string,
  onUpdate: (logs: Record<string, DailyLog>) => void,
): Unsubscribe {
  const q = query(
    collection(db, 'accounts', accountId, 'dailyLogs'),
    orderBy('recordedAt', 'desc'),
    limit(50),
  );
  return onSnapshot(q, (snap) => onUpdate(snapshotToRecord<DailyLog>(snap)));
}

/**
 * Opens a real-time listener on `accounts/{accountId}/auditLogs`.
 */
export function subscribeToAuditLogsForAccount(
  accountId: string,
  onUpdate: (logs: Record<string, AuditLog>) => void,
): Unsubscribe {
  const q = query(
    collection(db, 'accounts', accountId, 'auditLogs'),
    orderBy('recordedAt', 'desc'),
    limit(50),
  );
  return onSnapshot(q, (snap) => onUpdate(snapshotToRecord<AuditLog>(snap)));
}

/**
 * Opens a real-time listener on `accounts/{accountId}/invites`.
 */
export function subscribeToInvitesForAccount(
  accountId: string,
  onUpdate: (invites: Record<string, PartnerInvite>) => void,
): Unsubscribe {
  const q = query(
    collection(db, 'accounts', accountId, 'invites'),
    orderBy('invitedAt', 'desc'),
  );
  return onSnapshot(q, (snap) =>
    onUpdate(snapshotToRecord<PartnerInvite>(snap)),
  );
}

/**
 * Opens a real-time listener on `accounts/{accountId}/schedule_items`.
 */
export function subscribeToScheduleItemsForAccount(
  accountId: string,
  onUpdate: (items: Record<string, ScheduleItem>) => void,
): Unsubscribe {
  const q = query(
    collection(db, 'accounts', accountId, 'schedule_items'),
    orderBy('createdAt', 'desc'),
  );
  return onSnapshot(q, (snap) =>
    onUpdate(snapshotToRecord<ScheduleItem>(snap)),
  );
}

/**
 * Opens a real-time listener on `workspaces` filtered by `dimensionId`.
 */
export function subscribeToWorkspacesForAccount(
  dimensionId: string,
  onUpdate: (workspaces: Record<string, Workspace>) => void,
): Unsubscribe {
  const q = query(
    collection(db, 'workspaces'),
    where('dimensionId', '==', dimensionId),
  );
  return onSnapshot(q, (snap) => onUpdate(snapshotToRecord<Workspace>(snap)));
}
