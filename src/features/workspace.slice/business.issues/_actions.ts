/**
 * @fileoverview issue.commands.ts - Pure business logic for workspace issue operations.
 * @description Contains framework-agnostic action functions for creating issues and
 * posting comments. These functions can be called from React hooks, context, or
 * future Server Actions without any React dependencies.
 */

import {
  createIssue as createIssueFacade,
  addCommentToIssue as addCommentToIssueFacade,
  resolveIssue as resolveIssueFacade,
} from "@/shared/infra/firestore/firestore.facade"
import {
  type CommandResult,
  commandSuccess,
  commandFailureFrom,
} from '@/features/shared-kernel';

export async function createIssue(
  workspaceId: string,
  title: string,
  type: "technical" | "financial",
  priority: "high" | "medium",
  sourceTaskId?: string
): Promise<CommandResult> {
  try {
    await createIssueFacade(workspaceId, title, type, priority, sourceTaskId);
    return commandSuccess(workspaceId, Date.now());
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return commandFailureFrom('ISSUE_CREATE_FAILED', message);
  }
}

export async function addCommentToIssue(
  workspaceId: string,
  issueId: string,
  author: string,
  content: string
): Promise<CommandResult> {
  try {
    await addCommentToIssueFacade(workspaceId, issueId, author, content);
    return commandSuccess(issueId, Date.now());
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return commandFailureFrom('ISSUE_COMMENT_FAILED', message);
  }
}

export async function resolveIssue(
  workspaceId: string,
  issueId: string
): Promise<CommandResult> {
  try {
    await resolveIssueFacade(workspaceId, issueId);
    return commandSuccess(issueId, Date.now());
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return commandFailureFrom('ISSUE_RESOLVE_FAILED', message);
  }
}
