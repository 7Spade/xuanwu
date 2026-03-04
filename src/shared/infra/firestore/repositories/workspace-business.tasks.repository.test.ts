import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { WorkspaceTask } from '@/features/workspace.slice';

const { mockServerTimestamp, mockUpdateDocument } = vi.hoisted(() => ({
  mockServerTimestamp: vi.fn(() => '__SERVER_TIMESTAMP__'),
  mockUpdateDocument: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  serverTimestamp: mockServerTimestamp,
  collection: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
}));

vi.mock('../firestore.write.adapter', () => ({
  addDocument: vi.fn(),
  updateDocument: mockUpdateDocument,
  deleteDocument: vi.fn(),
}));

vi.mock('../firestore.read.adapter', () => ({
  getDocuments: vi.fn(),
}));

vi.mock('../firestore.converter', () => ({
  createConverter: vi.fn(),
}));

vi.mock('../firestore.client', () => ({
  db: {},
}));

import { updateTask } from './workspace-business.tasks.repository';

describe('workspace-business.tasks repository', () => {
  beforeEach(() => {
    mockUpdateDocument.mockReset();
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
});
