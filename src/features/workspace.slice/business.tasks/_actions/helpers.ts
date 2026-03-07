/**
 * Module: helpers.ts
 * Purpose: shared pure helpers for business.tasks actions
 * Responsibilities: normalize updates, build reconcile payloads, and map errors
 * Constraints: deterministic logic, respect module boundaries
 */

import type { WorkspaceTask } from '../_types';

export type ReconcileIncomingItem = {
  name: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  subtotal: number;
  sourceIntentIndex?: number;
  taskTypeName?: string;
  requiredSkills?: WorkspaceTask['requiredSkills'];
};

export const toErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

export const sanitizeTaskUpdates = (
  updates: Partial<WorkspaceTask>
): Partial<WorkspaceTask> => {
  const {
    sourceIntentId: _sourceIntentId,
    sourceIntentVersion: _sourceIntentVersion,
    sourceFileId: _sourceFileId,
    ...safeUpdates
  } = updates;
  return safeUpdates;
};

const withOptionalDiscount = (
  discount: number | undefined
): { discount: number } | Record<string, never> => (discount !== undefined ? { discount } : {});

const withOptionalSourceIntentIndex = (
  sourceIntentIndex: number | undefined
): { sourceIntentIndex: number } | Record<string, never> =>
  sourceIntentIndex !== undefined ? { sourceIntentIndex } : {};

export const buildReconcileUpdatePayload = (
  item: ReconcileIncomingItem,
  newIntentId: string,
  newIntentVersion: number
) => ({
  name: item.name,
  quantity: item.quantity,
  unitPrice: item.unitPrice,
  ...(item.taskTypeName !== undefined ? { type: item.taskTypeName } : {}),
  ...withOptionalDiscount(item.discount),
  subtotal: item.subtotal,
  ...(item.requiredSkills !== undefined ? { requiredSkills: item.requiredSkills } : {}),
  sourceIntentId: newIntentId,
  sourceIntentVersion: newIntentVersion,
  ...withOptionalSourceIntentIndex(item.sourceIntentIndex),
});

export const buildReconcileCreatePayload = (
  baseTaskData: Omit<WorkspaceTask, 'id' | 'createdAt' | 'updatedAt' | 'name' | 'quantity' | 'unitPrice' | 'discount' | 'subtotal' | 'sourceIntentId' | 'sourceIntentVersion'>,
  item: ReconcileIncomingItem,
  newIntentId: string,
  newIntentVersion: number
) => ({
  ...baseTaskData,
  ...buildReconcileUpdatePayload(item, newIntentId, newIntentVersion),
});
