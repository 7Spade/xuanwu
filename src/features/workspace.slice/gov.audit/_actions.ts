'use server';

/**
 * @fileoverview gov.audit/_actions.ts — Write-side audit log actions. [D3][D5][R4]
 * @description Server actions for persisting audit log entries to Firestore.
 *
 * Architectural boundaries:
 *   [D3]  All write operations go through _actions.ts.
 *   [D5]  Infrastructure imports (Firestore adapters) belong here — not in
 *         components, providers, or client hooks.
 *   [R4]  All exported command functions return CommandResult (SK_CMD_RESULT).
 */

import { commandSuccess, commandFailureFrom } from '@/features/shared-kernel';
import type { CommandResult } from '@/features/shared-kernel';
import { addDocument, serverTimestamp } from '@/shared/infra/firestore/firestore.write.adapter';
import type { AuditLog } from './_types';

export interface WriteAuditLogInput {
  accountId: string;
  actor: string;
  action: string;
  target: string;
  type: AuditLog['type'];
  workspaceId?: string;
}

/**
 * Persists an audit log entry to the account's auditLogs collection. [R4]
 * Returns CommandResult — callers check `.success` instead of catching exceptions.
 */
export async function writeAuditLog(input: WriteAuditLogInput): Promise<CommandResult> {
  const { accountId, actor, action, target, type, workspaceId } = input;

  try {
    const eventData = {
      actor,
      action,
      target,
      type,
      recordedAt: serverTimestamp(),
      accountId,
      workspaceId,
    };

    const ref = await addDocument(`accounts/${accountId}/auditLogs`, eventData);
    // version=0: audit logs are append-only records (no event-sourced versioning).
    return commandSuccess(ref.id, 0);
  } catch (err) {
    return commandFailureFrom(
      'AUDIT_LOG_WRITE_FAILED',
      err instanceof Error ? err.message : 'Failed to write audit log',
    );
  }
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
 * Persists a daily log entry to the account's dailyLogs collection. [R4]
 * Returns CommandResult — callers check `.success` instead of catching exceptions.
 */
export async function writeDailyLog(input: WriteDailyLogInput): Promise<CommandResult> {
  const { accountId, content, author, workspaceId, workspaceName, photoURLs } = input;

  try {
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

    const ref = await addDocument(`accounts/${accountId}/dailyLogs`, dailyData);
    // version=0: daily logs are append-only records (no event-sourced versioning).
    return commandSuccess(ref.id, 0);
  } catch (err) {
    return commandFailureFrom(
      'DAILY_LOG_WRITE_FAILED',
      err instanceof Error ? err.message : 'Failed to write daily log',
    );
  }
}
