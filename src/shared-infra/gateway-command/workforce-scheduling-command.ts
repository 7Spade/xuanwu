/**
 * Module: workforce-scheduling-command
 * Purpose: VS6 scheduling write adapters behind the L2 command gateway boundary.
 * Responsibilities: Centralize Firebase write operations used by schedule/timeline actions.
 * Constraints: deterministic logic, respect module boundaries
 */

import {
  assignMemberAndApprove,
  assignMemberToScheduleItem,
  saveScheduleItem,
  setScheduleItemDateRange,
  setScheduleItemStatus,
  unassignMemberFromScheduleItem,
} from '@/shared-infra/frontend-firebase/firestore/firestore.facade';
import {
  setDocument,
  updateDocument,
  arrayUnion,
} from '@/shared-infra/frontend-firebase/firestore/firestore.write.adapter';
import { Timestamp } from '@/shared-infra/frontend-firebase/firestore/firestore.read.adapter';
import type { ScheduleItem } from '@/shared-kernel';

export interface GatewayWriteOp {
  path: string;
  data: Record<string, unknown>;
  arrayUnionFields?: Record<string, unknown[]>;
}

export async function createScheduleItemThroughGateway(
  data: Omit<ScheduleItem, 'id' | 'createdAt' | 'updatedAt' | 'startDate' | 'endDate'> & {
    startDate: Date;
    endDate: Date;
  },
): Promise<string> {
  return saveScheduleItem({
    ...data,
    startDate: Timestamp.fromDate(data.startDate),
    endDate: Timestamp.fromDate(data.endDate),
  });
}

export async function assignMemberToScheduleItemThroughGateway(
  accountId: string,
  itemId: string,
  memberId: string,
): Promise<void> {
  await assignMemberToScheduleItem(accountId, itemId, memberId);
}

export async function unassignMemberFromScheduleItemThroughGateway(
  accountId: string,
  itemId: string,
  memberId: string,
): Promise<void> {
  await unassignMemberFromScheduleItem(accountId, itemId, memberId);
}

export async function approveScheduleItemWithMemberThroughGateway(
  organizationId: string,
  itemId: string,
  memberId: string,
): Promise<void> {
  await assignMemberAndApprove(organizationId, itemId, memberId);
}

export async function updateScheduleItemStatusThroughGateway(
  organizationId: string,
  itemId: string,
  newStatus: 'OFFICIAL' | 'REJECTED' | 'COMPLETED',
): Promise<void> {
  await setScheduleItemStatus(organizationId, itemId, newStatus);
}

export async function updateScheduleItemDateRangeThroughGateway(
  accountId: string,
  itemId: string,
  startDate: Date,
  endDate: Date,
): Promise<void> {
  await setScheduleItemDateRange(
    accountId,
    itemId,
    Timestamp.fromDate(startDate),
    Timestamp.fromDate(endDate),
  );
}

export async function executeWriteOpThroughGateway(op: GatewayWriteOp): Promise<void> {
  const data: Record<string, unknown> = { ...op.data };
  for (const [field, values] of Object.entries(op.arrayUnionFields ?? {})) {
    data[field] = arrayUnion(...values);
  }
  await updateDocument(op.path, data);
}

export async function setDocumentByPathThroughGateway<TData extends Record<string, unknown>>(
  path: string,
  data: TData,
): Promise<void> {
  await setDocument(path, data);
}

export async function updateDocumentByPathThroughGateway<TData extends Record<string, unknown>>(
  path: string,
  data: TData,
): Promise<void> {
  await updateDocument(path, data);
}
