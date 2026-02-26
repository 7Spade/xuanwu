/**
 * @fileoverview workspace-business.daily — Read-only queries.
 * @description Server-side read functions for fetching daily log entries.
 * Callable from RSC pages, hooks, and context without React dependencies.
 *
 * Per logic-overview.md [R4]: read queries must NOT live in _actions.ts.
 */

import { getDailyLogs as getDailyLogsFacade } from "@/shared/infra/firestore/firestore.facade";
import type { DailyLog } from "@/shared/types";

/**
 * Fetches daily log entries for an account.
 * @param accountId The ID of the organization account.
 * @param limit Maximum number of logs to return (default: 30).
 */
export async function getDailyLogs(
  accountId: string,
  limit = 30
): Promise<DailyLog[]> {
  return getDailyLogsFacade(accountId, limit);
}
