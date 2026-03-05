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
  getParsingIntentById as getParsingIntentByIdFacade,
  getParsingIntentBySourceFileId as getParsingIntentBySourceFileIdFacade,
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
/**
 * Builds a deterministic idempotency key used as the Firestore document ID
 * for a parsing-import record.
 *
 * **Firestore document ID constraint**: the returned string must never contain
 * forward-slashes (`/`), must not be `.` or `..`, and must not be surrounded
 * by double-underscores (`__…__`). The `import:<uuid>:<number>` format
 * satisfies all of these requirements as long as `intentId` is a valid UUID or
 * Firestore auto-ID (no `/`).  Callers MUST NOT pass a raw path segment as
 * `intentId`.
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

  // [D14/D15] Write-idempotency guard: when a sourceFileId is supplied, check
  // whether a non-superseded ParsingIntent already exists for this source file.
  //   • Same semanticHash  → content is identical; return the existing intent
  //                          without creating a duplicate document.
  //   • Different hash     → the file was re-parsed; automatically supersede the
  //                          previous intent and create a fresh one.
  if (options?.sourceFileId) {
    const existing = await getParsingIntentBySourceFileIdFacade(
      workspaceId,
      options.sourceFileId
    )
    if (existing) {
      if (existing.semanticHash === semanticHash) {
        // True duplicate — identical content; return the existing intent.
        // The caller receives the same intentId it would from a fresh create, so
        // all downstream consumers (document-parser-view, import ledger) behave
        // normally. No Firestore write is made and no side-effects are triggered.
        return { intentId: existing.id as IntentID }
      }
      // Content changed — supersede the previous intent.
      options = { ...options, previousIntentId: existing.id as IntentID }
    }
  }

  // [D14/D15] SECONDARY guard: when no sourceFileId is available (e.g. the
  // direct-upload path where handleFileChange does not set sourceFileIdRef),
  // but a previousIntentId IS provided, fetch the previous intent and compare
  // hashes.  If the content is identical the user just re-submitted the same
  // document without uploading a new file — return the existing intent as a
  // no-op to prevent a duplicate intent chain and the duplicate tasks it would
  // produce [D14].
  // Any fetch failure is non-fatal: log a warning and fall through to create a
  // new intent (original behaviour) so a transient network error never blocks
  // the import flow.
  if (!options?.sourceFileId && options?.previousIntentId) {
    try {
      const previous = await getParsingIntentByIdFacade(workspaceId, options.previousIntentId)
      if (previous && previous.semanticHash === semanticHash) {
        return { intentId: options.previousIntentId }
      }
    } catch (err) {
      console.warn(
        '[D14] secondary hash guard fetch failed; proceeding with intent creation.',
        err
      )
  // [D14/D15] Secondary hash-based guard for direct uploads (no sourceFileId).
  // When a file is uploaded directly (not via Files tab), sourceFileId is absent
  // but the UI tracks previousIntentId across re-parses within the same session.
  // Fetching the previous intent by ID and comparing semanticHash values prevents
  // a new ParsingIntent — and therefore duplicate tasks — from being created when
  // the user imports the same document content a second time.
  if (!options?.sourceFileId && options?.previousIntentId) {
    const previous = await getParsingIntentByIdFacade(workspaceId, options.previousIntentId)
    if (previous?.semanticHash === semanticHash) {
      // Same content as the previous intent — return it as-is without any write.
      return { intentId: options.previousIntentId }
    }
  }

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
