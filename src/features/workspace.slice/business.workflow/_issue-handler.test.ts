import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { WorkflowAggregateState } from './_aggregate';
import { handleIssueResolvedForWorkflow } from './_issue-handler';

const { findWorkflowsBlockedByIssueMock, saveWorkflowStateMock } = vi.hoisted(() => ({
  findWorkflowsBlockedByIssueMock: vi.fn(),
  saveWorkflowStateMock: vi.fn(),
}));

vi.mock('./_persistence', () => ({
  findWorkflowsBlockedByIssue: findWorkflowsBlockedByIssueMock,
  saveWorkflowState: saveWorkflowStateMock,
}));

const createMockWorkflowAggregateState = (
  overrides: Partial<WorkflowAggregateState> = {}
): WorkflowAggregateState => ({
  workflowId: 'wf-1',
  workspaceId: 'ws-1',
  stage: 'in-progress',
  blockedBy: ['issue-1'],
  version: 3,
  updatedAt: 100,
  ...overrides,
});

describe('handleIssueResolvedForWorkflow', () => {
  beforeEach(() => {
    findWorkflowsBlockedByIssueMock.mockReset();
    saveWorkflowStateMock.mockReset();
    vi.restoreAllMocks();
  });

  it('persists updated workflow state when issue exists in blockedBy', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1000);
    findWorkflowsBlockedByIssueMock.mockResolvedValue([createMockWorkflowAggregateState()]);

    await handleIssueResolvedForWorkflow('ws-1', 'issue-1');

    expect(saveWorkflowStateMock).toHaveBeenCalledTimes(1);
    expect(saveWorkflowStateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        workflowId: 'wf-1',
        blockedBy: [],
        version: 4,
        updatedAt: 1000,
      })
    );
  });

  it('skips persistence when unblock is a no-op', async () => {
    findWorkflowsBlockedByIssueMock.mockResolvedValue([
      createMockWorkflowAggregateState({ workflowId: 'wf-2', blockedBy: ['another-issue'] }),
    ]);

    await handleIssueResolvedForWorkflow('ws-1', 'issue-1');

    expect(saveWorkflowStateMock).not.toHaveBeenCalled();
  });

  it('propagates fetch errors from workflow lookup', async () => {
    findWorkflowsBlockedByIssueMock.mockRejectedValue(new Error('lookup failed'));

    await expect(
      handleIssueResolvedForWorkflow('ws-1', 'issue-1')
    ).rejects.toThrow('lookup failed');
  });

  it('propagates persistence errors from saveWorkflowState', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1000);
    findWorkflowsBlockedByIssueMock.mockResolvedValue([createMockWorkflowAggregateState()]);
    saveWorkflowStateMock.mockRejectedValue(new Error('save failed'));

    await expect(
      handleIssueResolvedForWorkflow('ws-1', 'issue-1')
    ).rejects.toThrow('save failed');
  });
});
