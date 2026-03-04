import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { WorkspaceTask } from '@/features/workspace.slice';

const { mockServerTimestamp, mockUpdateDocument, mockGetDocuments } = vi.hoisted(() => ({
  mockServerTimestamp: vi.fn(() => '__SERVER_TIMESTAMP__'),
  mockUpdateDocument: vi.fn(),
  mockGetDocuments: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  serverTimestamp: mockServerTimestamp,
  collection: vi.fn().mockReturnValue({ withConverter: vi.fn().mockReturnValue({}) }),
  query: vi.fn(),
  orderBy: vi.fn(),
  where: vi.fn(),
  limit: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
}));

vi.mock('../firestore.write.adapter', () => ({
  addDocument: vi.fn(),
  updateDocument: mockUpdateDocument,
  deleteDocument: vi.fn(),
}));

vi.mock('../firestore.read.adapter', () => ({
  getDocuments: mockGetDocuments,
}));

vi.mock('../firestore.converter', () => ({
  createConverter: vi.fn(),
}));

vi.mock('../firestore.client', () => ({
  db: {},
}));

import { updateTask, getTaskBySourceIntentId } from './workspace-business.tasks.repository';

describe('workspace-business.tasks repository', () => {
  beforeEach(() => {
    mockUpdateDocument.mockReset();
    mockGetDocuments.mockReset();
    mockServerTimestamp.mockClear();
    mockUpdateDocument.mockResolvedValue(undefined);
  });

  it('does not persist immutable SourcePointer fields on update', async () => {
    const updates: Partial<WorkspaceTask> = {
      title: 'Updated task',
      sourceIntentId: 'intent-2',
      sourceIntentVersion: 2,
      sourceFileId: 'file-2',
    };

    await updateTask('workspace-1', 'task-1', updates);

    expect(mockUpdateDocument).toHaveBeenCalledWith(
      'workspaces/workspace-1/tasks/task-1',
      {
        title: 'Updated task',
        updatedAt: '__SERVER_TIMESTAMP__',
      }
    );
  });

  it('persists only updatedAt when updates include immutable fields only', async () => {
    const updates: Partial<WorkspaceTask> = {
      sourceIntentId: 'intent-2',
      sourceIntentVersion: 2,
      sourceFileId: 'file-2',
    };

    await updateTask('workspace-1', 'task-2', updates);

    expect(mockUpdateDocument).toHaveBeenCalledWith(
      'workspaces/workspace-1/tasks/task-2',
      {
        updatedAt: '__SERVER_TIMESTAMP__',
      }
    );
  });

  it('persists only updatedAt when updates is empty', async () => {
    await updateTask('workspace-1', 'task-3', {});

    expect(mockUpdateDocument).toHaveBeenCalledWith(
      'workspaces/workspace-1/tasks/task-3',
      {
        updatedAt: '__SERVER_TIMESTAMP__',
      }
    );
  });

  describe('getTaskBySourceIntentId', () => {
    it('returns the first task when a matching sourceIntentId exists', async () => {
      const task: WorkspaceTask = { id: 'task-42', sourceIntentId: 'intent-abc' } as WorkspaceTask;
      mockGetDocuments.mockResolvedValue([task]);

      const result = await getTaskBySourceIntentId('workspace-1', 'intent-abc');

      expect(result).toBe(task);
      expect(mockGetDocuments).toHaveBeenCalledTimes(1);
    });

    it('returns null when no task matches the given sourceIntentId', async () => {
      mockGetDocuments.mockResolvedValue([]);

      const result = await getTaskBySourceIntentId('workspace-1', 'intent-xyz');

      expect(result).toBeNull();
    });
  });
});
