
"use client";

import { useCallback } from "react";

import { useApp } from "@/shared/app-providers/app-context";
import type { AuditLog, Account } from "@/shared/types";

import { writeDailyLog, writeAuditLog } from '../_actions';

/**
 * useLogger - Zero-cognition logging interface.
 * Automatically handles the physical separation of Daily and Audit logs.
 * [D3][D5] All Firestore writes delegated to _actions.ts — no infra imports here.
 */
export function useLogger(workspaceId?: string, workspaceName?: string) {
  const { state: appState } = useApp();
  const { activeAccount } = appState;

  const logDaily = useCallback(async (content: string, photoURLs: string[] | undefined, user: Account) => {
    if (!activeAccount || activeAccount.accountType !== 'organization' || !user) return;

    return writeDailyLog({
      accountId: activeAccount.id,
      content,
      author: {
        uid: user.id,
        name: user.name,
        avatarUrl: '', // populated at display time from the user's profile photo URL
      },
      workspaceId: workspaceId,
      workspaceName: workspaceName,
      photoURLs: photoURLs ?? [],
    });
  }, [activeAccount, workspaceId, workspaceName]);

  const logAudit = useCallback(async (action: string, target: string, type: AuditLog['type']) => {
    if (!activeAccount || activeAccount.accountType !== 'organization') return;

    return writeAuditLog({
      accountId: activeAccount.id,
      actor: activeAccount.name,
      action,
      target,
      type,
      workspaceId: workspaceId,
    });
  }, [activeAccount, workspaceId]);

  return { logDaily, logAudit };
}
