import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ParsingImport } from '@/features/workspace.slice';

const {
  mockServerTimestamp,
  mockCollection,
  mockWhere,
  mockLimit,
  mockQuery,
  mockAddDocument,
  mockUpdateDocument,
  mockGetDocuments,
  mockCreateConverter,
} = vi.hoisted(() => ({
  mockServerTimestamp: vi.fn(() => '__SERVER_TIMESTAMP__'),
  mockCollection: vi.fn(() => ({
    withConverter: vi.fn(() => 'COL_REF_WITH_CONVERTER'),
  })),
  mockWhere: vi.fn(() => 'WHERE_CLAUSE'),
  mockLimit: vi.fn(() => 'LIMIT_CLAUSE'),
  mockQuery: vi.fn(() => 'QUERY_REF'),
  mockAddDocument: vi.fn(),
  mockUpdateDocument: vi.fn(),
  mockGetDocuments: vi.fn(),
  mockCreateConverter: vi.fn(() => 'CONVERTER'),
}));

vi.mock('firebase/firestore', () => ({
  serverTimestamp: mockServerTimestamp,
  collection: mockCollection,
  query: mockQuery,
  where: mockWhere,
  limit: mockLimit,
}));

vi.mock('../firestore.write.adapter', () => ({
  addDocument: mockAddDocument,
  updateDocument: mockUpdateDocument,
}));

vi.mock('../firestore.read.adapter', () => ({
  getDocuments: mockGetDocuments,
}));

vi.mock('../firestore.converter', () => ({
  createConverter: mockCreateConverter,
}));

vi.mock('../firestore.client', () => ({
  db: {},
}));

import {
  createParsingImport,
  getParsingImportByIdempotencyKey,
  updateParsingImportStatus,
} from './workspace-business.parsing-imports.repository';

describe('workspace-business.parsing-imports repository', () => {
  beforeEach(() => {
    mockAddDocument.mockReset();
    mockUpdateDocument.mockReset();
    mockGetDocuments.mockReset();
    mockServerTimestamp.mockClear();
    mockCollection.mockClear();
    mockWhere.mockClear();
    mockLimit.mockClear();
    mockQuery.mockClear();
    mockCreateConverter.mockClear();
  });

  it('creates parsing import records with startedAt timestamp', async () => {
    mockAddDocument.mockResolvedValue({ id: 'import-1' });

    const payload: Omit<ParsingImport, 'id' | 'startedAt'> = {
      workspaceId: 'workspace-1',
      intentId: 'intent-1' as ParsingImport['intentId'],
      intentVersion: 2,
      idempotencyKey: 'import:intent-1:2',
      status: 'started',
      appliedTaskIds: [],
    };

    const result = await createParsingImport('workspace-1', payload);

    expect(result).toBe('import-1');
    expect(mockAddDocument).toHaveBeenCalledWith(
      'workspaces/workspace-1/parsingImports',
      expect.objectContaining({
        idempotencyKey: 'import:intent-1:2',
        startedAt: '__SERVER_TIMESTAMP__',
      })
    );
  });

  it('reads parsing import by idempotency key and returns first match', async () => {
    mockGetDocuments.mockResolvedValue([
      {
        id: 'import-1',
        workspaceId: 'workspace-1',
        intentId: 'intent-1',
        intentVersion: 2,
        idempotencyKey: 'import:intent-1:2',
        status: 'applied',
        appliedTaskIds: ['task-1'],
        startedAt: 123,
      },
    ]);

    const row = await getParsingImportByIdempotencyKey(
      'workspace-1',
      'import:intent-1:2'
    );

    expect(mockWhere).toHaveBeenCalledWith(
      'idempotencyKey',
      '==',
      'import:intent-1:2'
    );
    expect(mockLimit).toHaveBeenCalledWith(1);
    expect(mockGetDocuments).toHaveBeenCalledWith('QUERY_REF');
    expect(row?.id).toBe('import-1');
  });

  it('returns null when no idempotency-key match exists', async () => {
    mockGetDocuments.mockResolvedValue([]);

    const row = await getParsingImportByIdempotencyKey(
      'workspace-1',
      'import:intent-404:1'
    );

    expect(row).toBeNull();
  });

  it('updates parsing import status and stamps completedAt for terminal status', async () => {
    mockUpdateDocument.mockResolvedValue(undefined);

    await updateParsingImportStatus('workspace-1', 'import-1', {
      status: 'applied',
      appliedTaskIds: ['task-1', 'task-2'],
    });

    expect(mockUpdateDocument).toHaveBeenCalledWith(
      'workspaces/workspace-1/parsingImports/import-1',
      {
        status: 'applied',
        appliedTaskIds: ['task-1', 'task-2'],
        completedAt: '__SERVER_TIMESTAMP__',
      }
    );
  });

  it('does not stamp completedAt while import is still started', async () => {
    mockUpdateDocument.mockResolvedValue(undefined);

    await updateParsingImportStatus('workspace-1', 'import-1', {
      status: 'started',
      appliedTaskIds: [],
    });

    expect(mockUpdateDocument).toHaveBeenCalledWith(
      'workspaces/workspace-1/parsingImports/import-1',
      {
        status: 'started',
        appliedTaskIds: [],
      }
    );
  });
});
