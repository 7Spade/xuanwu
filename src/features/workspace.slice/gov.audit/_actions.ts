'use server';

/**
 * @fileoverview gov.audit/_actions.ts — Write-side audit log actions. [D3][D5]
 * @description Server actions for persisting audit log entries to Firestore.
 *
 * Architectural boundaries:
 *   [D3]  All write operations go through _actions.ts.
 *   [D5]  Infrastructure imports (Firestore adapters) belong here — not in
 *         components, providers, or client hooks.
 */

import { addDocument, serverTimestamp } from '@/shared/infra/firestore/firestore.write.adapter';
import type { AuditLog } from '@/shared/types';

export interface WriteAuditLogInput {
  accountId: string;
  actor: string;
  action: string;
  target: string;
  type: AuditLog['type'];
  workspaceId?: string;
}

/**
 * Persists an audit log entry to the account's auditLogs collection.
 * Replaces direct Firestore writes in components per D3/D5.
 *
 * Errors from the underlying `addDocument` call propagate as thrown exceptions
 * to the caller; wrap with try/catch when fire-and-forget semantics are needed.
 */
export async function writeAuditLog(input: WriteAuditLogInput): Promise<void> {
  const { accountId, actor, action, target, type, workspaceId } = input;

  const eventData = {
    actor,
    action,
    target,
    type,
    recordedAt: serverTimestamp(),
    accountId,
    workspaceId,
  };

  await addDocument(`accounts/${accountId}/auditLogs`, eventData);
}

export interface WriteDailyLogInput {
  accountId: string;
  content: string;
  author: { uid: string; name: string; avatarUrl: string };
  workspaceId?: string;
  workspaceName?: string;
  photoURLs?: string[];
}

/**
 * Persists a daily log entry to the account's dailyLogs collection.
 * Replaces direct Firestore writes in use-logger.ts per D3/D5.
 */
export async function writeDailyLog(input: WriteDailyLogInput): Promise<void> {
  const { accountId, content, author, workspaceId, workspaceName, photoURLs } = input;

  const dailyData = {
    content,
    author,
    recordedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    accountId,
    workspaceId: workspaceId ?? '',
    workspaceName: workspaceName ?? 'Dimension Level',
    photoURLs: photoURLs ?? [],
  };

  await addDocument(`accounts/${accountId}/dailyLogs`, dailyData);
}
