/**
 * @fileoverview Workspace Business — Parsing Imports Repository.
 *
 * Firestore operations for `parsingImports` under a workspace.
 * Stored at: workspaces/{workspaceId}/parsingImports/{idempotencyKey}
 *
 * [D14] IDEMPOTENCY STRATEGY:
 *   - Document ID is the `idempotencyKey` itself (deterministic, not random).
 *   - `createParsingImport` wraps the write in a Firestore transaction for
 *     atomic "create-if-not-exists": concurrent callers only create the
 *     document once; the loser silently no-ops.
 *   - `getParsingImportByIdempotencyKey` is now an O(1) direct get-by-ID
 *     instead of an O(n) where-query, because the document ID IS the key.
 */

import { serverTimestamp, doc, getDoc, runTransaction } from 'firebase/firestore';

import type { ParsingImport, ParsingImportStatus } from '@/features/workspace.slice';

import { SUBCOLLECTIONS } from '../collection-paths';
import { db } from '../firestore.client';
import { createConverter } from '../firestore.converter';
import { updateDocument } from '../firestore.write.adapter';

/**
 * Creates a new parsing-import record in Firestore.
 *
 * [D14] The `idempotencyKey` is used as the deterministic document ID.
 * The write is wrapped in a Firestore transaction so that if two callers race,
 * only the first one writes; the second finds an existing document and no-ops.
 *
 * **Firestore document ID constraint**: `idempotencyKey` must be produced by
 * `buildParsingImportIdempotencyKey` (format `import:<intentId>:<version>`) or
 * another generator that guarantees the absence of forward-slashes, `.`/`..`,
 * and `__…__` patterns.  Passing an arbitrary string here may cause a runtime
 * Firestore error.
 *
 * @returns The document ID (= idempotencyKey) of the created-or-existing record.
 */
export const createParsingImport = async (
  workspaceId: string,
  importData: Omit<ParsingImport, 'id' | 'startedAt'>
): Promise<string> => {
  const docId = importData.idempotencyKey;
  const docRef = doc(
    db,
    `workspaces/${workspaceId}/${SUBCOLLECTIONS.parsingImports}/${docId}`
  );

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(docRef);
    if (!snap.exists()) {
      tx.set(docRef, { ...importData, startedAt: serverTimestamp() });
    }
    // Document already created by a concurrent winner — silently no-op.
  });

  return docId;
};

/**
 * Looks up an existing parsing-import record by its idempotency key.
 *
 * [D14] O(1) direct get-by-ID — the idempotencyKey IS the document ID.
 * Replaces the previous O(n) `where('idempotencyKey', '==', key)` query.
 */
export const getParsingImportByIdempotencyKey = async (
  workspaceId: string,
  idempotencyKey: string
): Promise<ParsingImport | null> => {
  const converter = createConverter<ParsingImport>();
  const docRef = doc(
    db,
    `workspaces/${workspaceId}/${SUBCOLLECTIONS.parsingImports}/${idempotencyKey}`
  ).withConverter(converter);
  const snap = await getDoc(docRef);

  return snap.exists() ? snap.data() : null;
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
