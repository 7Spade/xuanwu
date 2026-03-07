/**
 * @fileoverview _queries.ts ??Read-only queries for audit log retrieval.
 * @description Provides server-side read functions for fetching audit log history.
 * Callable from RSC pages, hooks, and context without React dependencies.
 */

import {
  getAuditLogs as getAuditLogsFacade,
} from "@/shared-infra/frontend-firebase/firestore/firestore.facade"

import type { AuditLog } from "./_types"

/**
 * Retrieves audit logs for an account, optionally scoped to a workspace.
 * @param accountId The ID of the organization account.
 * @param workspaceId Optional workspace ID to filter logs.
 * @param limit Maximum number of logs to return (default: 50).
 */
export async function getAuditLogs(
  accountId: string,
  workspaceId?: string,
  limit = 50
): Promise<AuditLog[]> {
  return getAuditLogsFacade(accountId, workspaceId, limit)
}
