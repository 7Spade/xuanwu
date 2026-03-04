import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockCreateIssueFacade, mockAddCommentFacade, mockResolveIssueFacade } = vi.hoisted(() => ({
  mockCreateIssueFacade: vi.fn(),
  mockAddCommentFacade: vi.fn(),
  mockResolveIssueFacade: vi.fn(),
}))

vi.mock('@/shared/infra/firestore/firestore.facade', () => ({
  createIssue: mockCreateIssueFacade,
  addCommentToIssue: mockAddCommentFacade,
  resolveIssue: mockResolveIssueFacade,
}))

import { createIssue } from './_actions'

describe('workspace issues actions', () => {
  beforeEach(() => {
    mockCreateIssueFacade.mockReset()
    mockAddCommentFacade.mockReset()
    mockResolveIssueFacade.mockReset()
  })

  it('returns CommandSuccess with created issueId as aggregateId', async () => {
    mockCreateIssueFacade.mockResolvedValue('issue-123')

    const result = await createIssue('ws-1', 'Broken pipe', 'technical', 'high', 'task-1')

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.aggregateId).toBe('issue-123')
    }
  })

  it('returns CommandFailure when createIssue facade throws', async () => {
    mockCreateIssueFacade.mockRejectedValue(new Error('firestore down'))

    const result = await createIssue('ws-1', 'Broken pipe', 'technical', 'high', 'task-1')

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.code).toBe('ISSUE_CREATE_FAILED')
      expect(result.error.message).toContain('firestore down')
    }
  })
})
