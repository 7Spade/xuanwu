/**
 * @fileoverview intent-actions.ts — Firestore CRUD for ParsingIntent (Digital Twin).
 * @description Called from the document-parser client component to persist parse results
 * before they are dispatched to the workspace event bus.
 * No 'use server' — runs in the browser with the authenticated user's Firestore context.
 *
 * [R4] COMMAND_RESULT_CONTRACT: All exported functions return Promise<CommandResult>.
 */

import {
  commandSuccess,
  commandFailureFrom,
  type CommandResult,
} from '@/features/shared-kernel'
import type { SkillRequirement } from '@/features/shared-kernel'
import {
  createParsingIntent as createParsingIntentFacade,
  updateParsingIntentStatus as updateParsingIntentStatusFacade,
} from '@/shared/infra/firestore/firestore.facade'
import type { ParsedLineItem, SourcePointer } from '@/shared/types'

export async function saveParsingIntent(
  workspaceId: string,
  sourceFileName: string,
  lineItems: ParsedLineItem[],
  options?: {
    sourceFileDownloadURL?: SourcePointer
    sourceFileId?: string
    skillRequirements?: SkillRequirement[]
  }
): Promise<CommandResult> {
  try {
    const id = await createParsingIntentFacade(workspaceId, {
      workspaceId,
      sourceFileName,
      sourceFileDownloadURL: options?.sourceFileDownloadURL,
      sourceFileId: options?.sourceFileId,
      intentVersion: 1,
      lineItems,
      skillRequirements: options?.skillRequirements,
      status: 'pending',
    })
    return commandSuccess(id, 0)  // version=0: non-event-sourced; no optimistic-concurrency guard needed
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to save parsing intent'
    return commandFailureFrom('PARSING_INTENT_SAVE_FAILED', message)
  }
}

export async function markParsingIntentImported(
  workspaceId: string,
  intentId: string
): Promise<CommandResult> {
  try {
    await updateParsingIntentStatusFacade(workspaceId, intentId, 'imported')
    return commandSuccess(intentId, 0)  // version=0: status update, non-event-sourced
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to mark intent as imported'
    return commandFailureFrom('PARSING_INTENT_MARK_IMPORTED_FAILED', message)
  }
}
