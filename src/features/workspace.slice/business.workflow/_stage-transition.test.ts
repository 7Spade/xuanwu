import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { WorkflowAggregateState } from './_aggregate';
import { advanceWorkflowToStage } from './_stage-transition';

const {
  loadWorkflowStateMock,
  saveWorkflowStateMock,
} = vi.hoisted(() => ({
  loadWorkflowStateMock: vi.fn(),
  saveWorkflowStateMock: vi.fn(),
}));

vi.mock('./_persistence', () => ({
  loadWorkflowState: loadWorkflowStateMock,
  saveWorkflowState: saveWorkflowStateMock,
}));

const makeWorkflowState = (
  overrides: Partial<WorkflowAggregateState> = {},
): WorkflowAggregateState => ({
  workflowId: 'ws-1',
  workspaceId: 'ws-1',
  stage: 'draft',
  blockedBy: [],
  version: 1,
  updatedAt: 100,
  ...overrides,
});

describe('advanceWorkflowToStage', () => {
  beforeEach(() => {
    loadWorkflowStateMock.mockReset();
    saveWorkflowStateMock.mockReset();
    vi.restoreAllMocks();
  });

  it('advances across multiple stages and persists once', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(2000);
    loadWorkflowStateMock.mockResolvedValue(makeWorkflowState({ stage: 'draft' }));

    const result = await advanceWorkflowToStage('ws-1', 'finance');

    expect(result.stage).toBe('finance');
    expect(result.version).toBe(5);
    expect(saveWorkflowStateMock).toHaveBeenCalledTimes(1);
    expect(saveWorkflowStateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        workflowId: 'ws-1',
        workspaceId: 'ws-1',
        stage: 'finance',
      }),
    );
  });

  it('does not advance when workflow is blocked', async () => {
    const blocked = makeWorkflowState({ stage: 'quality-assurance', blockedBy: ['issue-1'] });
    loadWorkflowStateMock.mockResolvedValue(blocked);

    const result = await advanceWorkflowToStage('ws-1', 'finance');

    expect(result).toEqual(blocked);
    expect(saveWorkflowStateMock).not.toHaveBeenCalled();
  });

  it('is a no-op when target stage is not ahead of current', async () => {
    const current = makeWorkflowState({ stage: 'finance', version: 6 });
    loadWorkflowStateMock.mockResolvedValue(current);

    const result = await advanceWorkflowToStage('ws-1', 'acceptance');

    expect(result).toEqual(current);
    expect(saveWorkflowStateMock).not.toHaveBeenCalled();
  });

  it('creates from draft when workflow state does not exist', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(3000);
    loadWorkflowStateMock.mockResolvedValue(null);

    const result = await advanceWorkflowToStage('ws-1', 'quality-assurance');

    expect(result.stage).toBe('quality-assurance');
    expect(result.version).toBe(3);
    expect(saveWorkflowStateMock).toHaveBeenCalledTimes(1);
  });
});
