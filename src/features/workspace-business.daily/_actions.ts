/**
 * @fileoverview daily.commands.ts - Pure business logic for daily log interactions.
 * @description Contains framework-agnostic action functions for interactive features
 * on daily log entries. These functions can be called from React hooks, context,
 * or future Server Actions without any React dependencies.
 *
 * Per logic-overview.md [R4] COMMAND_RESULT_CONTRACT:
 *   All mutations return CommandResult discriminated union.
 */

import {
  toggleDailyLogLike,
  addDailyLogComment as addDailyLogCommentFacade,
} from "@/shared/infra/firestore/firestore.facade";
import {
  type CommandResult,
  commandSuccess,
  commandFailureFrom,
} from "@/features/shared.kernel.contract-interfaces";

/**
 * Toggles a like on a daily log entry.
 * @param accountId The ID of the organization account that owns the log.
 * @param logId The ID of the daily log entry.
 * @param userId The ID of the user performing the like/unlike.
 */
export async function toggleLike(
  accountId: string,
  logId: string,
  userId: string
): Promise<CommandResult> {
  try {
    await toggleDailyLogLike(accountId, logId, userId);
    return commandSuccess(logId, Date.now());
  } catch (err) {
    return commandFailureFrom(
      "TOGGLE_DAILY_LOG_LIKE_FAILED",
      err instanceof Error ? err.message : "Failed to toggle daily log like"
    );
  }
}

/**
 * Adds a comment to a daily log entry.
 * @param organizationId The ID of the organization that owns the log.
 * @param logId The ID of the daily log entry.
 * @param author The author information for the comment.
 * @param content The text content of the comment.
 */
export async function addDailyLogComment(
  organizationId: string,
  logId: string,
  author: { uid: string; name: string; avatarUrl?: string },
  content: string
): Promise<CommandResult> {
  try {
    await addDailyLogCommentFacade(organizationId, logId, author, content);
    return commandSuccess(logId, Date.now());
  } catch (err) {
    return commandFailureFrom(
      "ADD_DAILY_LOG_COMMENT_FAILED",
      err instanceof Error ? err.message : "Failed to add daily log comment"
    );
  }
}


