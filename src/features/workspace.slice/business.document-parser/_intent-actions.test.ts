import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CostItemType } from '@/features/semantic-graph.slice'

const {
  mockCreateParsingIntent,
  mockUpdateParsingIntentStatus,
  mockSupersedeParsingIntent,
  mockCreateParsingImport,
  mockGetParsingImportByIdempotencyKey,
  mockUpdateParsingImportStatus,
} = vi.hoisted(() => ({
  mockCreateParsingIntent: vi.fn(),
  mockUpdateParsingIntentStatus: vi.fn(),
  mockSupersedeParsingIntent: vi.fn(),
  mockCreateParsingImport: vi.fn(),
  mockGetParsingImportByIdempotencyKey: vi.fn(),
  mockUpdateParsingImportStatus: vi.fn(),
}))

vi.mock('@/shared/infra/firestore/firestore.facade', () => ({
  createParsingIntent: mockCreateParsingIntent,
  updateParsingIntentStatus: mockUpdateParsingIntentStatus,
  supersedeParsingIntent: mockSupersedeParsingIntent,
  createParsingImport: mockCreateParsingImport,
  getParsingImportByIdempotencyKey: mockGetParsingImportByIdempotencyKey,
  updateParsingImportStatus: mockUpdateParsingImportStatus,
}))

import {
  buildParsingImportIdempotencyKey,
  finishParsingImport,
  markParsingIntentFailed,
  markParsingIntentImported,
  saveParsingIntent,
  startParsingImport,
} from './_intent-actions'
import type { IntentID } from './_types'

describe('workspace document-parser intent actions', () => {
  beforeEach(() => {
    mockCreateParsingIntent.mockReset()
    mockUpdateParsingIntentStatus.mockReset()
    mockSupersedeParsingIntent.mockReset()
    mockCreateParsingImport.mockReset()
    mockGetParsingImportByIdempotencyKey.mockReset()
    mockUpdateParsingImportStatus.mockReset()
  })

  it('builds deterministic parsing import idempotency key', () => {
    expect(buildParsingImportIdempotencyKey('intent-1', 2)).toBe('import:intent-1:2')
  })

  it('saves parsing intent with default intentVersion=1', async () => {
    mockCreateParsingIntent.mockResolvedValue('intent-1')

    const result = await saveParsingIntent('workspace-1', 'invoice.pdf', [
      { name: 'item', quantity: 1, unitPrice: 100, subtotal: 100, costItemType: CostItemType.EXECUTABLE },
    ])

    expect(result).toEqual({ intentId: 'intent-1' })
    expect(mockCreateParsingIntent).toHaveBeenCalledWith(
      'workspace-1',
      expect.objectContaining({
        sourceFileName: 'invoice.pdf',
        intentVersion: 1,
        sourceType: 'ai',
        reviewStatus: 'pending_review',
        status: 'pending',
      })
    )
    const [, persistedData] = mockCreateParsingIntent.mock.calls[0]
    expect(persistedData.semanticHash).toMatch(/^[a-f0-9]{64}$/)
  })

  it('supersedes prior intent and returns oldIntentId when previousIntentId is provided', async () => {
    mockCreateParsingIntent.mockResolvedValue('intent-2')
    mockSupersedeParsingIntent.mockResolvedValue(undefined)

    const result = await saveParsingIntent('workspace-1', 'invoice-v2.pdf', [
      { name: 'item', quantity: 2, unitPrice: 50, subtotal: 100, costItemType: CostItemType.EXECUTABLE },
    ], { previousIntentId: 'intent-1' as IntentID })

    expect(result).toEqual({ intentId: 'intent-2', oldIntentId: 'intent-1' })
    expect(mockSupersedeParsingIntent).toHaveBeenCalledWith('workspace-1', 'intent-1', 'intent-2')
  })

  it('does not call supersedeParsingIntent when previousIntentId is absent', async () => {
    mockCreateParsingIntent.mockResolvedValue('intent-3')

    const result = await saveParsingIntent('workspace-1', 'invoice.pdf', [
      { name: 'item', quantity: 1, unitPrice: 100, subtotal: 100, costItemType: CostItemType.EXECUTABLE },
    ])

    expect(result.oldIntentId).toBeUndefined()
    expect(mockSupersedeParsingIntent).not.toHaveBeenCalled()
  })

  it('returns duplicate start result when parsing import already exists', async () => {
    // Duplicate execution keeps the previously persisted intent lifecycle untouched.
    mockGetParsingImportByIdempotencyKey.mockResolvedValue({
      id: 'import-existing',
      status: 'applied',
    })

    const result = await startParsingImport('workspace-1', 'intent-1', 3)

    expect(result).toEqual({
      importId: 'import-existing',
      idempotencyKey: 'import:intent-1:3',
      status: 'applied',
      isDuplicate: true,
    })
    expect(mockCreateParsingImport).not.toHaveBeenCalled()
    expect(mockUpdateParsingIntentStatus).not.toHaveBeenCalled()
  })

  it('creates started parsing import and marks intent as importing when idempotency key is new', async () => {
    mockGetParsingImportByIdempotencyKey.mockResolvedValue(null)
    mockCreateParsingImport.mockResolvedValue('import-1')

    const result = await startParsingImport('workspace-1', 'intent-1', 1)

    expect(mockCreateParsingImport).toHaveBeenCalledWith(
      'workspace-1',
      expect.objectContaining({
        workspaceId: 'workspace-1',
        intentId: 'intent-1',
        intentVersion: 1,
        idempotencyKey: 'import:intent-1:1',
        status: 'started',
        appliedTaskIds: [],
      })
    )
    expect(mockUpdateParsingIntentStatus).toHaveBeenCalledWith(
      'workspace-1',
      'intent-1',
      'importing'
    )
    expect(result).toEqual({
      importId: 'import-1',
      idempotencyKey: 'import:intent-1:1',
      status: 'started',
      isDuplicate: false,
    })
  })

  it('finishes parsing import with status payload', async () => {
    await finishParsingImport('workspace-1', 'import-1', {
      status: 'partial',
      appliedTaskIds: ['task-1'],
      error: {
        code: 'PARSING_IMPORT_PARTIAL',
        message: '1 task failed',
      },
    })

    expect(mockUpdateParsingImportStatus).toHaveBeenCalledWith(
      'workspace-1',
      'import-1',
      {
        status: 'partial',
        appliedTaskIds: ['task-1'],
        error: {
          code: 'PARSING_IMPORT_PARTIAL',
          message: '1 task failed',
        },
      }
    )
  })

  it('marks parsing intent imported', async () => {
    await markParsingIntentImported('workspace-1', 'intent-1')

    expect(mockUpdateParsingIntentStatus).toHaveBeenCalledWith(
      'workspace-1',
      'intent-1',
      'imported'
    )
  })

  it('marks parsing intent failed', async () => {
    await markParsingIntentFailed('workspace-1', 'intent-1')

    expect(mockUpdateParsingIntentStatus).toHaveBeenCalledWith(
      'workspace-1',
      'intent-1',
      'failed'
    )
  })
})
