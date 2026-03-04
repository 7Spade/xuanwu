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
} from 'firebase/firestore';

import type { ParsingIntent } from '@/features/workspace.slice';

import { SUBCOLLECTIONS } from '../collection-paths';
import { db } from '../firestore.client';
import { createConverter } from '../firestore.converter';
import { getDocuments } from '../firestore.read.adapter';
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
