import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ParsingImport } from '@/features/workspace.slice';

const {
  mockServerTimestamp,
  mockDoc,
  mockGetDoc,
  mockRunTransaction,
  mockUpdateDocument,
  mockCreateConverter,
} = vi.hoisted(() => ({
  mockServerTimestamp: vi.fn(() => '__SERVER_TIMESTAMP__'),
  mockDoc: vi.fn(),
  mockGetDoc: vi.fn(),
  mockRunTransaction: vi.fn(),
  mockUpdateDocument: vi.fn(),
  mockCreateConverter: vi.fn(() => 'CONVERTER'),
}));

vi.mock('firebase/firestore', () => ({
  serverTimestamp: mockServerTimestamp,
  doc: mockDoc,
  getDoc: mockGetDoc,
  runTransaction: mockRunTransaction,
}));

vi.mock('../firestore.write.adapter', () => ({
  updateDocument: mockUpdateDocument,
}));

vi.mock('../firestore.converter', () => ({
  createConverter: mockCreateConverter,
}));

vi.mock('../firestore.client', () => ({
  db: 'MOCK_DB',
}));

import {
  createParsingImport,
  getParsingImportByIdempotencyKey,
  updateParsingImportStatus,
} from './workspace-business.parsing-imports.repository';

describe('workspace-business.parsing-imports repository', () => {
  beforeEach(() => {
    mockDoc.mockReset();
    mockGetDoc.mockReset();
    mockRunTransaction.mockReset();
    mockUpdateDocument.mockReset();
    mockServerTimestamp.mockReturnValue('__SERVER_TIMESTAMP__');
    mockCreateConverter.mockReturnValue('CONVERTER');
  });

  // ---------------------------------------------------------------------------
  // createParsingImport
  // ---------------------------------------------------------------------------

  it('creates parsing import record with idempotencyKey as document ID', async () => {
    const mockDocRef = { id: 'import:intent-1:2', path: 'workspaces/workspace-1/parsingImports/import:intent-1:2' };
    mockDoc.mockReturnValue(mockDocRef);

    const mockTxSet = vi.fn();
    const mockTxGet = vi.fn().mockResolvedValue({ exists: () => false });
    mockRunTransaction.mockImplementation(
      async (_db: unknown, callback: (tx: { get: typeof mockTxGet; set: typeof mockTxSet }) => Promise<void>) => {
        await callback({ get: mockTxGet, set: mockTxSet });
      }
    );

    const payload: Omit<ParsingImport, 'id' | 'startedAt'> = {
      workspaceId: 'workspace-1',
      intentId: 'intent-1' as ParsingImport['intentId'],
      intentVersion: 2,
      idempotencyKey: 'import:intent-1:2',
      status: 'started',
      appliedTaskIds: [],
    };

    const result = await createParsingImport('workspace-1', payload);

    expect(result).toBe('import:intent-1:2');
    expect(mockDoc).toHaveBeenCalledWith(
      'MOCK_DB',
      'workspaces/workspace-1/parsingImports/import:intent-1:2'
    );
    expect(mockTxGet).toHaveBeenCalledWith(mockDocRef);
    expect(mockTxSet).toHaveBeenCalledWith(
      mockDocRef,
      expect.objectContaining({
        idempotencyKey: 'import:intent-1:2',
        startedAt: '__SERVER_TIMESTAMP__',
      })
    );
  });

  it('does not overwrite existing record when concurrent winner already created it', async () => {
    const mockDocRef = { id: 'import:intent-1:2', path: '...' };
    mockDoc.mockReturnValue(mockDocRef);

    const mockTxSet = vi.fn();
    const mockTxGet = vi.fn().mockResolvedValue({ exists: () => true }); // Already exists
    mockRunTransaction.mockImplementation(
      async (_db: unknown, callback: (tx: { get: typeof mockTxGet; set: typeof mockTxSet }) => Promise<void>) => {
        await callback({ get: mockTxGet, set: mockTxSet });
      }
    );

    const payload: Omit<ParsingImport, 'id' | 'startedAt'> = {
      workspaceId: 'workspace-1',
      intentId: 'intent-1' as ParsingImport['intentId'],
      intentVersion: 2,
      idempotencyKey: 'import:intent-1:2',
      status: 'started',
      appliedTaskIds: [],
    };

    const result = await createParsingImport('workspace-1', payload);

    expect(result).toBe('import:intent-1:2');
    expect(mockTxSet).not.toHaveBeenCalled(); // Silent no-op: concurrent winner already wrote
  });

  // ---------------------------------------------------------------------------
  // getParsingImportByIdempotencyKey
  // ---------------------------------------------------------------------------

  it('reads parsing import by direct document ID lookup (O(1) get)', async () => {
    const mockDocRefWithConverter = { path: '...' };
    const mockWithConverter = vi.fn().mockReturnValue(mockDocRefWithConverter);
    const mockDocRef = { withConverter: mockWithConverter };
    mockDoc.mockReturnValue(mockDocRef);
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        id: 'import:intent-1:2',
        workspaceId: 'workspace-1',
        intentId: 'intent-1',
        intentVersion: 2,
        idempotencyKey: 'import:intent-1:2',
        status: 'applied',
        appliedTaskIds: ['task-1'],
        startedAt: 123,
      }),
    });

    const row = await getParsingImportByIdempotencyKey('workspace-1', 'import:intent-1:2');

    expect(mockDoc).toHaveBeenCalledWith(
      'MOCK_DB',
      'workspaces/workspace-1/parsingImports/import:intent-1:2'
    );
    expect(mockWithConverter).toHaveBeenCalledWith('CONVERTER');
    expect(mockGetDoc).toHaveBeenCalledWith(mockDocRefWithConverter);
    expect(row?.id).toBe('import:intent-1:2');
  });

  it('returns null when no document exists for the given idempotency key', async () => {
    const mockDocRefWithConverter = {};
    mockDoc.mockReturnValue({ withConverter: vi.fn().mockReturnValue(mockDocRefWithConverter) });
    mockGetDoc.mockResolvedValue({ exists: () => false });

    const row = await getParsingImportByIdempotencyKey('workspace-1', 'import:intent-404:1');

    expect(row).toBeNull();
  });

  // ---------------------------------------------------------------------------
  // updateParsingImportStatus
  // ---------------------------------------------------------------------------

  it('stamps completedAt for terminal status', async () => {
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
