/**
 * @fileoverview Workspace Business — Document Parser Repository.
 *
 * All Firestore read and write operations for the `parsingIntents` sub-collection
 * under a workspace. Stored at: workspaces/{workspaceId}/parsingIntents/{intentId}
 * Corresponds to the `workspace-business.document-parser` feature slice.
 *
 * ParsingIntent is a Digital Twin (解析合約) produced by the document-parser.
 * Tasks reference it via `sourceIntentId` as an immutable SourcePointer.
 */

import {
  serverTimestamp,
  collection,
  query,
  orderBy,
  where,
  limit,
} from 'firebase/firestore';

import type { ParsingIntent } from '@/features/workspace.slice';

import { SUBCOLLECTIONS } from '../collection-paths';
import { db } from '../firestore.client';
import { createConverter } from '../firestore.converter';
import { getDocument, getDocuments } from '../firestore.read.adapter';
import {
  updateDocument,
  addDocument,
} from '../firestore.write.adapter';

export const createParsingIntent = async (
  workspaceId: string,
  intentData: Omit<ParsingIntent, 'id' | 'createdAt'>
): Promise<string> => {
  // Build the Firestore document explicitly.
  // Firestore rejects documents containing `undefined` field values, so optional
  // fields are only included when they carry a meaningful value.
  const data = {
    workspaceId: intentData.workspaceId,
    sourceFileName: intentData.sourceFileName,
    intentVersion: intentData.intentVersion,
    lineItems: intentData.lineItems,
    skillRequirements: intentData.skillRequirements ?? [],
    status: intentData.status,
    createdAt: serverTimestamp(),
    sourceType: intentData.sourceType,
    reviewStatus: intentData.reviewStatus,
    // Optional fields — omitted when undefined so Firestore never sees undefined.
    ...(intentData.sourceFileDownloadURL !== undefined ? { sourceFileDownloadURL: intentData.sourceFileDownloadURL } : {}),
    ...(intentData.sourceFileId !== undefined ? { sourceFileId: intentData.sourceFileId } : {}),
    ...(intentData.supersededByIntentId !== undefined ? { supersededByIntentId: intentData.supersededByIntentId } : {}),
    ...(intentData.baseIntentId !== undefined ? { baseIntentId: intentData.baseIntentId } : {}),
    ...(intentData.parserVersion !== undefined ? { parserVersion: intentData.parserVersion } : {}),
    ...(intentData.modelVersion !== undefined ? { modelVersion: intentData.modelVersion } : {}),
    ...(intentData.reviewedBy !== undefined ? { reviewedBy: intentData.reviewedBy } : {}),
    ...(intentData.reviewedAt !== undefined ? { reviewedAt: intentData.reviewedAt } : {}),
    ...(intentData.semanticHash !== undefined ? { semanticHash: intentData.semanticHash } : {}),
  };
  const ref = await addDocument(
    `workspaces/${workspaceId}/${SUBCOLLECTIONS.parsingIntents}`,
    data
  );
  return ref.id;
};

export const updateParsingIntentStatus = async (
  workspaceId: string,
  intentId: string,
  status: 'importing' | 'imported' | 'failed' | 'superseded'
): Promise<void> => {
  const updates: Record<string, unknown> = { status };
  if (status === 'imported') {
    updates.importedAt = serverTimestamp();
  }
  return updateDocument(
    `workspaces/${workspaceId}/${SUBCOLLECTIONS.parsingIntents}/${intentId}`,
    updates
  );
};

/**
 * Marks an existing ParsingIntent as superseded by a new intent.
 *
 * Sets `status = 'superseded'` and records `supersededByIntentId` so the
 * lineage chain (old → new) is queryable from the old intent document.
 * Called when a re-parse replaces a prior proposal [#A4].
 */
export const supersedeParsingIntent = async (
  workspaceId: string,
  oldIntentId: string,
  newIntentId: string
): Promise<void> => {
  return updateDocument(
    `workspaces/${workspaceId}/${SUBCOLLECTIONS.parsingIntents}/${oldIntentId}`,
    { status: 'superseded', supersededByIntentId: newIntentId }
  );
};

export const getParsingIntents = async (
  workspaceId: string
): Promise<ParsingIntent[]> => {
  const converter = createConverter<ParsingIntent>();
  const colRef = collection(
    db,
    `workspaces/${workspaceId}/${SUBCOLLECTIONS.parsingIntents}`
  ).withConverter(converter);
  const q = query(colRef, orderBy('createdAt', 'desc'));
  return getDocuments(q);
};

/**
 * Returns the most-recent non-superseded ParsingIntent for a given sourceFileId.
 *
 * Used by saveParsingIntent to implement write-idempotency [D14/D15]:
 * if a ParsingIntent already exists for this source file the caller can
 * decide to skip the create (same semanticHash) or supersede it (new hash).
 *
 * Uses an explicit `in` allowlist for status so Firestore does not require an
 * extra mandatory `orderBy('status')` clause (which `!=` inequality would force).
 */
export const getParsingIntentBySourceFileId = async (
  workspaceId: string,
  sourceFileId: string
): Promise<ParsingIntent | null> => {
  const converter = createConverter<ParsingIntent>();
  const colRef = collection(
    db,
    `workspaces/${workspaceId}/${SUBCOLLECTIONS.parsingIntents}`
  ).withConverter(converter);
  const q = query(
    colRef,
    where('sourceFileId', '==', sourceFileId),
    where('status', 'in', ['pending', 'importing', 'imported', 'failed']),
    orderBy('createdAt', 'desc'),
    limit(1)
  );
  const rows = await getDocuments(q);
  return rows[0] ?? null;
};

/**
 * Fetches a single ParsingIntent document by its Firestore document ID.
 *
 * Used by the secondary hash-based idempotency guard [D14/D15] in
 * saveParsingIntent: when a direct upload has no sourceFileId, the guard
 * looks up the previousIntentId by ID and compares semanticHash values to
 * avoid creating a duplicate ParsingIntent for identical content.
 */
export const getParsingIntentById = async (
  workspaceId: string,
  intentId: string
): Promise<ParsingIntent | null> => {
  const converter = createConverter<ParsingIntent>();
  return getDocument(
    `workspaces/${workspaceId}/${SUBCOLLECTIONS.parsingIntents}/${intentId}`,
    converter
  );
};
