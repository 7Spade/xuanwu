/**
 * @fileoverview intent-actions.ts — Firestore CRUD for ParsingIntent (Digital Twin)
 * and ParsingImport execution ledger.
 *
 * Called from workspace event orchestration to persist parser outcomes before and
 * during task materialization.
 */

import type { SkillRequirement } from '@/features/shared-kernel'
import {
  createParsingImport as createParsingImportFacade,
  createParsingIntent as createParsingIntentFacade,
  getParsingImportByIdempotencyKey as getParsingImportByIdempotencyKeyFacade,
  supersedeParsingIntent as supersedeParsingIntentFacade,
  updateParsingImportStatus as updateParsingImportStatusFacade,
  updateParsingIntentStatus as updateParsingIntentStatusFacade,
} from '@/shared/infra/firestore/firestore.facade'
import type { Timestamp } from '@/shared/ports'

import type {
  ParsedLineItem,
  IntentID,
  SourcePointer,
  ParsingImport,
  ParsingImportStatus,
  ParsingIntentReviewStatus,
  ParsingIntentSourceType,
} from './_types'

export const INITIAL_PARSING_INTENT_VERSION = 1

const DEFAULT_INTENT_SOURCE_TYPE: ParsingIntentSourceType = 'ai'
const DEFAULT_INTENT_REVIEW_STATUS: ParsingIntentReviewStatus = 'pending_review'

/**
 * Deterministic serializer for semantic hash payloads.
 *
 * - Sorts object keys recursively so property insertion order never changes output.
 * - Tracks visited objects via WeakSet and throws on circular structures.
 * - Produces a stable JSON-like string suitable for SHA-256 snapshot hashing.
 */
function stableSerialize(value: unknown, seen = new WeakSet<object>()): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item, seen)).join(',')}]`
  }
  if (value != null && typeof value === 'object') {
    if (seen.has(value as object)) {
      throw new Error('Circular structure is not supported in ParsingIntent semantic hash payload')
    }
    seen.add(value as object)
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, nested]) => `${JSON.stringify(key)}:${stableSerialize(nested, seen)}`)
    seen.delete(value as object)
    return `{${entries.join(',')}}`
  }
  return JSON.stringify(value)
}

/**
 * Computes the immutable semantic snapshot hash for ParsingIntent lineItems.
 *
 * The hash is used as a verification anchor: if parsed semantics change,
 * semanticHash must also change. SHA-256 is used for strong collision resistance.
 */
async function createSemanticHash(lineItems: ParsedLineItem[]): Promise<string> {
  try {
    const payload = stableSerialize(lineItems)
    const encoded = new TextEncoder().encode(payload)
    const digest = await crypto.subtle.digest('SHA-256', encoded)
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('')
  } catch (error) {
    throw new Error(
      `Failed to compute ParsingIntent semanticHash via Web Crypto SHA-256: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

export type ParsingImportStartResult = {
  importId: string
  idempotencyKey: string
  status: ParsingImportStatus
  isDuplicate: boolean
}

export type ParsingImportFinishInput = {
  status: ParsingImportStatus
  appliedTaskIds: string[]
  error?: {
    code: string
    message: string
  }
}

/**
 * Builds the canonical idempotency key for one intent materialization attempt.
 *
 * intentId      = ParsingIntent aggregate ID.
 * intentVersion = ParsingIntent version for that aggregate snapshot.
 *
 * Format: import:{intentId}:{intentVersion}
 */
export function buildParsingImportIdempotencyKey(
  intentId: string,
  intentVersion: number
): string {
  return `import:${intentId}:${intentVersion}`
}

export type SaveParsingIntentResult = {
  intentId: IntentID
  /** Present when a previous intent was superseded by this save. */
  oldIntentId?: IntentID
}

export async function saveParsingIntent(
  workspaceId: string,
  sourceFileName: string,
  lineItems: ParsedLineItem[],
  options?: {
    sourceFileDownloadURL?: SourcePointer
    sourceFileId?: string
    skillRequirements?: SkillRequirement[]
    intentVersion?: number
    parserVersion?: string
    modelVersion?: string
    sourceType?: ParsingIntentSourceType
    reviewStatus?: ParsingIntentReviewStatus
    reviewedBy?: string
    reviewedAt?: Timestamp
    semanticHash?: string
    baseIntentId?: IntentID
    /** When provided, the old intent is marked as superseded by the new intent [#A4]. */
    previousIntentId?: IntentID
  }
): Promise<SaveParsingIntentResult> {
  const semanticHash =
    options?.semanticHash ?? (await createSemanticHash(lineItems))
  const id = await createParsingIntentFacade(workspaceId, {
    workspaceId,
    sourceFileName,
    sourceFileDownloadURL: options?.sourceFileDownloadURL,
    sourceFileId: options?.sourceFileId,
    intentVersion: options?.intentVersion ?? INITIAL_PARSING_INTENT_VERSION,
    lineItems,
    skillRequirements: options?.skillRequirements,
    parserVersion: options?.parserVersion,
    modelVersion: options?.modelVersion,
    sourceType: options?.sourceType ?? DEFAULT_INTENT_SOURCE_TYPE,
    reviewStatus: options?.reviewStatus ?? DEFAULT_INTENT_REVIEW_STATUS,
    reviewedBy: options?.reviewedBy,
    reviewedAt: options?.reviewedAt,
    semanticHash,
    baseIntentId: options?.baseIntentId,
    status: 'pending',
  })
  const intentId = id as IntentID

  if (options?.previousIntentId) {
    await supersedeParsingIntentFacade(workspaceId, options.previousIntentId, intentId)
    return { intentId, oldIntentId: options.previousIntentId }
  }

  return { intentId }
}

export async function startParsingImport(
  workspaceId: string,
  intentId: string,
  intentVersion = INITIAL_PARSING_INTENT_VERSION
): Promise<ParsingImportStartResult> {
  const idempotencyKey = buildParsingImportIdempotencyKey(intentId, intentVersion)
  const existing = await getParsingImportByIdempotencyKeyFacade(
    workspaceId,
    idempotencyKey
  )

  if (existing) {
    return {
      importId: existing.id,
      idempotencyKey,
      status: existing.status,
      isDuplicate: true,
    }
  }

  const importId = await createParsingImportFacade(workspaceId, {
    workspaceId,
    intentId: intentId as ParsingImport['intentId'],
    intentVersion,
    idempotencyKey,
    status: 'started',
    appliedTaskIds: [],
  })

  await updateParsingIntentStatusFacade(workspaceId, intentId, 'importing')

  return {
    importId,
    idempotencyKey,
    status: 'started',
    isDuplicate: false,
  }
}

export async function finishParsingImport(
  workspaceId: string,
  importId: string,
  input: ParsingImportFinishInput
): Promise<void> {
  await updateParsingImportStatusFacade(workspaceId, importId, {
    status: input.status,
    appliedTaskIds: input.appliedTaskIds,
    ...(input.error ? { error: input.error } : {}),
  })
}

export async function markParsingIntentImported(
  workspaceId: string,
  intentId: string
): Promise<void> {
  return updateParsingIntentStatusFacade(workspaceId, intentId, 'imported')
}

export async function markParsingIntentFailed(
  workspaceId: string,
  intentId: string
): Promise<void> {
  return updateParsingIntentStatusFacade(workspaceId, intentId, 'failed')
}
