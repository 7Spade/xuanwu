import { beforeEach, describe, expect, it, vi } from 'vitest';

import { updateTask, reconcileIntentTasks } from './_actions';
import type { WorkspaceTask } from './_types';


const {
  mockUpdateTaskFacade,
  mockCreateTaskFacade,
  mockGetTasksBySourceIntentIdFacade,
  mockReconcileTaskFacade,
} = vi.hoisted(() => ({
  mockUpdateTaskFacade: vi.fn(),
  mockCreateTaskFacade: vi.fn(),
  mockGetTasksBySourceIntentIdFacade: vi.fn(),
  mockReconcileTaskFacade: vi.fn(),
}));

vi.mock('@/shared-infra/frontend-firebase/firestore/firestore.facade', async () => {
  const actual = await vi.importActual<typeof import('@/shared-infra/frontend-firebase/firestore/firestore.facade')>(
    '@/shared-infra/frontend-firebase/firestore/firestore.facade'
  );

  return {
    ...actual,
    updateTask: mockUpdateTaskFacade,
    createTask: mockCreateTaskFacade,
    getTasksBySourceIntentId: mockGetTasksBySourceIntentIdFacade,
    reconcileTask: mockReconcileTaskFacade,
  };
});

describe('workspace business.tasks updateTask', () => {
  beforeEach(() => {
    mockUpdateTaskFacade.mockReset();
  });

  it('strips immutable SourcePointer fields from updates', async () => {
    mockUpdateTaskFacade.mockResolvedValue(undefined);

    const updates: Partial<WorkspaceTask> = {
      title: 'Updated title',
      sourceIntentId: 'intent-2',
      sourceIntentVersion: 2,
      sourceFileId: 'file-2',
    };

    await updateTask('ws-1', 'task-1', updates);

    expect(mockUpdateTaskFacade).toHaveBeenCalledTimes(1);
    expect(mockUpdateTaskFacade).toHaveBeenCalledWith('ws-1', 'task-1', {
      title: 'Updated title',
    });
  });

  it('passes through normal updates when SourcePointer fields are absent', async () => {
    mockUpdateTaskFacade.mockResolvedValue(undefined);

    const updates: Partial<WorkspaceTask> = {
      title: 'Only editable fields',
      progressState: 'doing',
    };

    await updateTask('ws-1', 'task-2', updates);

    expect(mockUpdateTaskFacade).toHaveBeenCalledWith('ws-1', 'task-2', updates);
  });

  it('returns structured failure when facade update throws', async () => {
    mockUpdateTaskFacade.mockRejectedValue(new Error('db down'));

    const result = await updateTask('ws-1', 'task-3', { title: 'x' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('TASK_UPDATE_FAILED');
      expect(result.error.message).toContain('db down');
    }
  });
});

// ---------------------------------------------------------------------------
// reconcileIntentTasks [#A4]
// ---------------------------------------------------------------------------

const makeTask = (overrides: Partial<WorkspaceTask> = {}): WorkspaceTask => ({
  id: 'task-existing',
  name: 'Widget A',
  quantity: 1,
  unitPrice: 10,
  subtotal: 10,
  progress: 0,
  type: 'Imported',
  priority: 'medium',
  progressState: 'todo',
  sourceIntentId: 'old-intent',
  sourceIntentVersion: 1,
  createdAt: { seconds: 0, nanoseconds: 0, toDate: () => new Date(0), toMillis: () => 0 } as unknown as import('firebase/firestore').Timestamp,
  updatedAt: { seconds: 0, nanoseconds: 0, toDate: () => new Date(0), toMillis: () => 0 } as unknown as import('firebase/firestore').Timestamp,
  ...overrides,
});

describe('reconcileIntentTasks', () => {
  const wsId = 'ws-reconcile';
  const oldIntentId = 'old-intent';
  const newIntentId = 'new-intent';
  const newIntentVersion = 2;
  const baseTaskData = {
    progress: 0,
    type: 'Imported' as const,
    priority: 'medium' as const,
    progressState: 'todo' as const,
  };

  beforeEach(() => {
    mockGetTasksBySourceIntentIdFacade.mockReset();
    mockReconcileTaskFacade.mockReset();
    mockCreateTaskFacade.mockReset();
  });

  it('reconciles existing todo tasks in-place and does not create duplicates', async () => {
    const existingTask = makeTask({ name: 'Widget A', progressState: 'todo' });
    mockGetTasksBySourceIntentIdFacade.mockResolvedValue([existingTask]);
    mockReconcileTaskFacade.mockResolvedValue(undefined);

    const items = [{ name: 'Widget A', quantity: 2, unitPrice: 15, subtotal: 30 }];

    const result = await reconcileIntentTasks(wsId, oldIntentId, newIntentId, newIntentVersion, items, baseTaskData);

    expect(result.success).toBe(true);
    expect(mockReconcileTaskFacade).toHaveBeenCalledTimes(1);
    expect(mockReconcileTaskFacade).toHaveBeenCalledWith(wsId, existingTask.id, {
      name: 'Widget A',
      quantity: 2,
      unitPrice: 15,
      subtotal: 30,
      sourceIntentId: newIntentId,
      sourceIntentVersion: newIntentVersion,
    });
    expect(mockCreateTaskFacade).not.toHaveBeenCalled();
  });

  it('creates a new task when an existing task is not in todo state', async () => {
    const existingTask = makeTask({ name: 'Widget B', progressState: 'doing' });
    mockGetTasksBySourceIntentIdFacade.mockResolvedValue([existingTask]);
    mockCreateTaskFacade.mockResolvedValue('new-task-id');

    const items = [{ name: 'Widget B', quantity: 5, unitPrice: 20, subtotal: 100 }];

    const result = await reconcileIntentTasks(wsId, oldIntentId, newIntentId, newIntentVersion, items, baseTaskData);

    expect(result.success).toBe(true);
    expect(mockCreateTaskFacade).toHaveBeenCalledTimes(1);
    expect(mockReconcileTaskFacade).not.toHaveBeenCalled();
  });

  it('creates a new task when there is no old task for an item name', async () => {
    mockGetTasksBySourceIntentIdFacade.mockResolvedValue([]);
    mockCreateTaskFacade.mockResolvedValue('new-task-id-2');

    const items = [{ name: 'Brand New Item', quantity: 1, unitPrice: 50, subtotal: 50 }];

    const result = await reconcileIntentTasks(wsId, oldIntentId, newIntentId, newIntentVersion, items, baseTaskData);

    expect(result.success).toBe(true);
    expect(mockCreateTaskFacade).toHaveBeenCalledTimes(1);
    expect(mockCreateTaskFacade).toHaveBeenCalledWith(wsId, expect.objectContaining({
      name: 'Brand New Item',
      sourceIntentId: newIntentId,
      sourceIntentVersion: newIntentVersion,
    }));
    expect(mockReconcileTaskFacade).not.toHaveBeenCalled();
  });

  it('produces the minimum number of writes for mixed scenarios (9 todo + 1 doing + 2 new)', async () => {
    // Simulate: 9 matching todo tasks, 1 matching doing task, 2 net-new items.
    const todoTasks = Array.from({ length: 9 }, (_, i) =>
      makeTask({ id: `t-${i}`, name: `Item ${i}`, progressState: 'todo' })
    );
    const doingTask = makeTask({ id: 't-doing', name: 'Item Doing', progressState: 'doing' });
    mockGetTasksBySourceIntentIdFacade.mockResolvedValue([...todoTasks, doingTask]);
    mockReconcileTaskFacade.mockResolvedValue(undefined);
    mockCreateTaskFacade.mockResolvedValue('new-id');

    const items = [
      // 9 items that match existing todo tasks
      ...Array.from({ length: 9 }, (_, i) => ({
        name: `Item ${i}`,
        quantity: 1,
        unitPrice: 10,
        subtotal: 10,
      })),
      // 1 item matching the doing task ??must create new
      { name: 'Item Doing', quantity: 1, unitPrice: 10, subtotal: 10 },
      // 2 net-new items
      { name: 'Net New A', quantity: 1, unitPrice: 5, subtotal: 5 },
      { name: 'Net New B', quantity: 2, unitPrice: 5, subtotal: 10 },
    ];

    const result = await reconcileIntentTasks(wsId, oldIntentId, newIntentId, newIntentVersion, items, baseTaskData);

    expect(result.success).toBe(true);
    // 9 todo matches ??9 reconcile calls
    expect(mockReconcileTaskFacade).toHaveBeenCalledTimes(9);
    // 1 doing + 2 net-new ??3 create calls (total 12, not 21)
    expect(mockCreateTaskFacade).toHaveBeenCalledTimes(3);
  });

  it('returns failure when the facade throws', async () => {
    mockGetTasksBySourceIntentIdFacade.mockRejectedValue(new Error('db error'));

    const result = await reconcileIntentTasks(wsId, oldIntentId, newIntentId, newIntentVersion, [], baseTaskData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('TASK_RECONCILE_FAILED');
    }
  });
});
