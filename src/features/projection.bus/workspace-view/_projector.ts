/**
 * projection.workspace-view — _projector.ts
 *
 * Maintains the workspace projection read model.
 * Stored at: workspaceView/{workspaceId}
 *
 * Fed by EVENT_FUNNEL_INPUT from workspace domain events.
 */

import { serverTimestamp } from 'firebase/firestore';
import { setDocument, updateDocument } from '@/shared/infra/firestore/firestore.write.adapter';
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
import { versionGuardAllows } from '@/features/shared-kernel/version-guard';
import type { Workspace } from '@/shared/types';

export interface WorkspaceViewRecord {
  workspaceId: string;
  name: string;
  dimensionId: string;
  lifecycleState: string;
  visibility: string;
  capabilities: string[];
  grantCount: number;
  readModelVersion: number;
  /** Last aggregate version processed by this projection [S2] */
  lastProcessedVersion?: number;
  /** TraceId from the originating EventEnvelope [R8] */
  traceId?: string;
  updatedAt: ReturnType<typeof serverTimestamp>;
}

/**
 * Projects a workspace document snapshot into the workspace-view read model.
 */
export async function projectWorkspaceSnapshot(
  workspace: Workspace,
  aggregateVersion?: number,
  traceId?: string
): Promise<void> {
  if (aggregateVersion !== undefined) {
    const existing = await getDocument<WorkspaceViewRecord>(`workspaceView/${workspace.id}`);
    if (!versionGuardAllows({
      eventVersion: aggregateVersion,
      viewLastProcessedVersion: existing?.lastProcessedVersion ?? 0,
    })) {
      return;
    }
  }

  const record: Omit<WorkspaceViewRecord, 'updatedAt'> & { updatedAt: ReturnType<typeof serverTimestamp> } = {
    workspaceId: workspace.id,
    name: workspace.name,
    dimensionId: workspace.dimensionId,
    lifecycleState: workspace.lifecycleState,
    visibility: workspace.visibility,
    capabilities: workspace.capabilities.map((c) => c.id),
    grantCount: workspace.grants?.length ?? 0,
    readModelVersion: Date.now(),
    ...(aggregateVersion !== undefined ? { lastProcessedVersion: aggregateVersion } : {}),
    ...(traceId !== undefined ? { traceId } : {}),
    updatedAt: serverTimestamp(),
  };
  await setDocument(`workspaceView/${workspace.id}`, record);
}

/**
 * Applies a capability-mounted event to the workspace view.
 */
export async function applyCapabilityUpdate(
  workspaceId: string,
  capabilities: string[],
  aggregateVersion?: number,
  traceId?: string
): Promise<void> {
  if (aggregateVersion !== undefined) {
    const existing = await getDocument<WorkspaceViewRecord>(`workspaceView/${workspaceId}`);
    if (!versionGuardAllows({
      eventVersion: aggregateVersion,
      viewLastProcessedVersion: existing?.lastProcessedVersion ?? 0,
    })) {
      return;
    }
  }

  await updateDocument(`workspaceView/${workspaceId}`, {
    capabilities,
    readModelVersion: Date.now(),
    ...(aggregateVersion !== undefined ? { lastProcessedVersion: aggregateVersion } : {}),
    ...(traceId !== undefined ? { traceId } : {}),
    updatedAt: serverTimestamp(),
  });
}
