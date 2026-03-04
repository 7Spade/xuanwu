import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { WorkflowAggregateState } from './_aggregate';
import {
  handleIssueCreatedForWorkflow,
  handleIssueResolvedForWorkflow,
} from './_issue-handler';

const {
  findWorkflowsBlockedByIssueMock,
  loadWorkflowStateMock,
  saveWorkflowStateMock,
} = vi.hoisted(() => ({
  findWorkflowsBlockedByIssueMock: vi.fn(),
  loadWorkflowStateMock: vi.fn(),
  saveWorkflowStateMock: vi.fn(),
}));

vi.mock('./_persistence', () => ({
  findWorkflowsBlockedByIssue: findWorkflowsBlockedByIssueMock,
  loadWorkflowState: loadWorkflowStateMock,
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

describe('workflow issue handlers', () => {
  beforeEach(() => {
    findWorkflowsBlockedByIssueMock.mockReset();
    loadWorkflowStateMock.mockReset();
    saveWorkflowStateMock.mockReset();
    vi.restoreAllMocks();
  });

  describe('handleIssueCreatedForWorkflow', () => {
    it('creates and persists workflow aggregate when missing', async () => {
      vi.spyOn(Date, 'now').mockReturnValue(1000);
      loadWorkflowStateMock.mockResolvedValue(null);

      const result = await handleIssueCreatedForWorkflow('ws-1', 'issue-1');

      expect(saveWorkflowStateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          workspaceId: 'ws-1',
          workflowId: 'ws-1',
          blockedBy: ['issue-1'],
        })
      );
      expect(result).toEqual({
        workflowId: 'ws-1',
        blockedByCount: 1,
        wasChanged: true,
      });
    });

    it('is idempotent when issue already exists in blockedBy', async () => {
      loadWorkflowStateMock.mockResolvedValue(
        createMockWorkflowAggregateState({ blockedBy: ['issue-1'] })
      );

      const result = await handleIssueCreatedForWorkflow('ws-1', 'issue-1', 'wf-1');

      expect(saveWorkflowStateMock).not.toHaveBeenCalled();
      expect(result).toEqual({
        workflowId: 'wf-1',
        blockedByCount: 1,
        wasChanged: false,
      });
    });
  });

  describe('handleIssueResolvedForWorkflow', () => {
    it('persists updated workflow state when issue exists in blockedBy', async () => {
      vi.spyOn(Date, 'now').mockReturnValue(1000);
      findWorkflowsBlockedByIssueMock.mockResolvedValue([createMockWorkflowAggregateState()]);

      const result = await handleIssueResolvedForWorkflow('ws-1', 'issue-1');

      expect(saveWorkflowStateMock).toHaveBeenCalledTimes(1);
      expect(saveWorkflowStateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          workflowId: 'wf-1',
          blockedBy: [],
          version: 4,
          updatedAt: 1000,
        })
      );
      expect(result).toEqual({
        touchedWorkflowIds: ['wf-1'],
        unblockedWorkflowIds: ['wf-1'],
      });
    });

    it('skips persistence when unblock is a no-op', async () => {
      findWorkflowsBlockedByIssueMock.mockResolvedValue([
        createMockWorkflowAggregateState({ workflowId: 'wf-2', blockedBy: ['another-issue'] }),
      ]);

      const result = await handleIssueResolvedForWorkflow('ws-1', 'issue-1');

      expect(saveWorkflowStateMock).not.toHaveBeenCalled();
      expect(result).toEqual({
        touchedWorkflowIds: [],
        unblockedWorkflowIds: [],
      });
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
});
