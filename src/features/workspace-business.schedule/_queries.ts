/**
 * @fileoverview workspace-business.schedule — Read-only queries.
 * @description Server-side read functions for fetching schedule items.
 * Callable from RSC pages, hooks, and context without React dependencies.
 *
 * Per logic-overview.md [R4]: read queries must NOT live in _actions.ts.
 */

import { getScheduleItems as getScheduleItemsFacade } from "@/shared/infra/firestore/firestore.facade";
import type { ScheduleItem } from "@/shared/types";

/**
 * Fetches all schedule items for an account, optionally filtered by workspace.
 * @param accountId The ID of the organization account.
 * @param workspaceId Optional workspace ID to filter items.
 */
export async function getScheduleItems(
  accountId: string,
  workspaceId?: string
): Promise<ScheduleItem[]> {
  return getScheduleItemsFacade(accountId, workspaceId);
}
