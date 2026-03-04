import { describe, expect, it, vi, beforeEach } from 'vitest';

import type { IntentID, ParsingIntent } from '@/features/workspace.slice';

const { mockAddDocument, mockServerTimestamp } = vi.hoisted(() => ({
  mockAddDocument: vi.fn(),
  mockServerTimestamp: vi.fn(() => '__SERVER_TIMESTAMP__'),
}));

vi.mock('firebase/firestore', () => ({
  serverTimestamp: mockServerTimestamp,
  collection: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
}));

vi.mock('../firestore.write.adapter', () => ({
  addDocument: mockAddDocument,
  updateDocument: vi.fn(),
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

import { createParsingIntent } from './workspace-business.document-parser.repository';

describe('workspace-business.document-parser repository', () => {
  beforeEach(() => {
    mockAddDocument.mockReset();
    mockServerTimestamp.mockClear();
    mockAddDocument.mockResolvedValue({ id: 'intent-001' });
  });

  it('persists supersededByIntentId when provided', async () => {
    const payload: Omit<ParsingIntent, 'id' | 'createdAt'> = {
      workspaceId: 'workspace-1',
      sourceFileName: 'quote.pdf',
      intentVersion: 2,
      supersededByIntentId: 'intent-002' as IntentID,
      lineItems: [],
      sourceType: 'ai',
      reviewStatus: 'pending_review',
      status: 'pending',
    };

    await createParsingIntent('workspace-1', payload);

    expect(mockAddDocument).toHaveBeenCalledWith(
      'workspaces/workspace-1/parsingIntents',
      expect.objectContaining({
        supersededByIntentId: 'intent-002',
        sourceType: 'ai',
        reviewStatus: 'pending_review',
      })
    );
  });

  it('omits supersededByIntentId when undefined', async () => {
    const payload: Omit<ParsingIntent, 'id' | 'createdAt'> = {
      workspaceId: 'workspace-1',
      sourceFileName: 'quote.pdf',
      intentVersion: 1,
      lineItems: [],
      sourceType: 'ai',
      reviewStatus: 'pending_review',
      status: 'pending',
    };

    await createParsingIntent('workspace-1', payload);

    const [, persistedData] = mockAddDocument.mock.calls[0];
    expect(persistedData).not.toHaveProperty('supersededByIntentId');
    expect(persistedData).not.toHaveProperty('baseIntentId');
    expect(persistedData).not.toHaveProperty('parserVersion');
    expect(persistedData).not.toHaveProperty('modelVersion');
    expect(persistedData).not.toHaveProperty('semanticHash');
  });
});
