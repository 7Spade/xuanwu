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
