/**
 * workspace-business.workflow — _persistence.ts
 *
 * Firestore persistence for the Workflow Aggregate State.
 * Stored at: workflowStates/{workspaceId}/workflows/{workflowId}
 *
 * Per logic-overview.md [R6]:
 *   WorkflowAggregateState is persisted and loaded by the command/event handlers.
 *   blockedBy is an array (Firestore serialization of a Set; no duplicates enforced by domain).
 */

import { collection, getDocs, query, type QueryDocumentSnapshot, type DocumentData, where } from 'firebase/firestore';
import { db } from '@/shared/infra/firestore/firestore.client';
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
import { setDocument, updateDocument } from '@/shared/infra/firestore/firestore.write.adapter';
import type { WorkflowAggregateState, WorkflowStage } from './_aggregate';

const workflowPath = (workspaceId: string, workflowId: string) =>
  `workflowStates/${workspaceId}/workflows/${workflowId}`;

const workflowCollectionPath = (workspaceId: string) =>
  `workflowStates/${workspaceId}/workflows`;

/** Load a single workflow aggregate state from Firestore. */
export async function loadWorkflowState(
  workspaceId: string,
  workflowId: string
): Promise<WorkflowAggregateState | null> {
  return getDocument<WorkflowAggregateState>(workflowPath(workspaceId, workflowId));
}

/** Persist a workflow aggregate state to Firestore. */
export async function saveWorkflowState(state: WorkflowAggregateState): Promise<void> {
  await setDocument(workflowPath(state.workspaceId, state.workflowId), state);
}

/** Update only the mutable fields of a workflow aggregate state. */
export async function updateWorkflowState(
  workspaceId: string,
  workflowId: string,
  patch: Partial<Pick<WorkflowAggregateState, 'stage' | 'blockedBy' | 'version' | 'updatedAt'>>
): Promise<void> {
  await updateDocument(workflowPath(workspaceId, workflowId), patch);
}

/**
 * Query all workflow states in a workspace that are blocked by the given issueId.
 * Used by the IssueResolved handler to find all workflows that need unblocking [R6].
 */
export async function findWorkflowsBlockedByIssue(
  workspaceId: string,
  issueId: string
): Promise<WorkflowAggregateState[]> {
  const colRef = collection(db, workflowCollectionPath(workspaceId));
  const q = query(colRef, where('blockedBy', 'array-contains', issueId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d: QueryDocumentSnapshot<DocumentData>) => d.data() as WorkflowAggregateState);
}

/**
 * Query all workflow states in a workspace by stage.
 * Used by UI to display workflows at a given lifecycle stage [R6].
 */
export async function findWorkflowsByStage(
  workspaceId: string,
  stage: WorkflowStage
): Promise<WorkflowAggregateState[]> {
  const colRef = collection(db, workflowCollectionPath(workspaceId));
  const q = query(colRef, where('stage', '==', stage));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d: QueryDocumentSnapshot<DocumentData>) => d.data() as WorkflowAggregateState);
}
