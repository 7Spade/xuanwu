/**
 * @fileoverview Workspace Business — Parsing Imports Repository.
 *
 * Firestore operations for `parsingImports` under a workspace.
 * Stored at: workspaces/{workspaceId}/parsingImports/{importId}
 *
 * This ledger tracks intent materialization execution and idempotency.
 */

import {
  serverTimestamp,
  collection,
  query,
  where,
  limit,
} from 'firebase/firestore';

import type { ParsingImport, ParsingImportStatus } from '@/features/workspace.slice';

import { SUBCOLLECTIONS } from '../collection-paths';
import { db } from '../firestore.client';
import { createConverter } from '../firestore.converter';
import { getDocuments } from '../firestore.read.adapter';
import { addDocument, updateDocument } from '../firestore.write.adapter';

export const createParsingImport = async (
  workspaceId: string,
  importData: Omit<ParsingImport, 'id' | 'startedAt'>
): Promise<string> => {
  const ref = await addDocument(
    `workspaces/${workspaceId}/${SUBCOLLECTIONS.parsingImports}`,
    {
      ...importData,
      startedAt: serverTimestamp(),
    }
  );

  return ref.id;
};

export const getParsingImportByIdempotencyKey = async (
  workspaceId: string,
  idempotencyKey: string
): Promise<ParsingImport | null> => {
  const converter = createConverter<ParsingImport>();
  const colRef = collection(
    db,
    `workspaces/${workspaceId}/${SUBCOLLECTIONS.parsingImports}`
  ).withConverter(converter);
  const q = query(colRef, where('idempotencyKey', '==', idempotencyKey), limit(1));
  const rows = await getDocuments(q);

  return rows[0] ?? null;
};

const TERMINAL_PARSING_IMPORT_STATUSES: ReadonlySet<ParsingImportStatus> = new Set([
  'applied',
  'partial',
  'failed',
]);

const isTerminalParsingImportStatus = (status: ParsingImportStatus): boolean =>
  TERMINAL_PARSING_IMPORT_STATUSES.has(status);

export const updateParsingImportStatus = async (
  workspaceId: string,
  importId: string,
  updates: Pick<ParsingImport, 'status' | 'appliedTaskIds'> &
    Partial<Pick<ParsingImport, 'error'>>
): Promise<void> => {
  const isTerminalStatus = isTerminalParsingImportStatus(updates.status);

  await updateDocument(
    `workspaces/${workspaceId}/${SUBCOLLECTIONS.parsingImports}/${importId}`,
    {
      ...updates,
      ...(isTerminalStatus ? { completedAt: serverTimestamp() } : {}),
    }
  );
};
