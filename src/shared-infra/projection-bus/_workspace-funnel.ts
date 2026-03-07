/**
 * Module: _workspace-funnel
 * Purpose: Workspace event funnel registration
 * Responsibilities: subscribe workspace events and project to read models/version registry
 * Constraints: deterministic logic, respect module boundaries
 */

import type { WorkspaceEventBus } from '@/features/workspace.slice';

import { createVersionStamp } from './_funnel.shared';
import { upsertProjectionVersion } from './_registry';
import { appendAuditEntry } from './account-audit';
import {
  applyDemandProposed,
} from './demand-board';

export function registerWorkspaceFunnel(bus: WorkspaceEventBus): () => void {
  const unsubscribers: Array<() => void> = [];

  unsubscribers.push(
    bus.subscribe('workspace:tasks:assigned', async (payload) => {
      const stamp = createVersionStamp();
      await upsertProjectionVersion(
        `workspace-tasks-assigned-${payload.workspaceId}`,
        stamp.version,
        stamp.updatedAt
      );
    })
  );

  unsubscribers.push(
    bus.subscribe('workspace:tasks:blocked', async (payload) => {
      const actorId = payload.task.assigneeId ?? 'system';
      await appendAuditEntry(actorId, {
        accountId: actorId,
        eventType: 'workspace:tasks:blocked',
        actorId,
        targetId: payload.task.id,
        summary: `Task "${payload.task.name}" blocked: ${payload.reason ?? ''}`,
        ...(payload.traceId && { traceId: payload.traceId }),
      });

      const stamp = createVersionStamp();
      await upsertProjectionVersion('account-audit', stamp.version, stamp.updatedAt);
    })
  );

  unsubscribers.push(
    bus.subscribe('workspace:issues:resolved', async (payload) => {
      await appendAuditEntry(payload.resolvedBy, {
        accountId: payload.resolvedBy,
        eventType: 'workspace:issues:resolved',
        actorId: payload.resolvedBy,
        targetId: payload.issueId,
        summary: `Issue "${payload.issueTitle}" resolved`,
        ...(payload.traceId && { traceId: payload.traceId }),
      });

      const stamp = createVersionStamp();
      await upsertProjectionVersion('account-audit', stamp.version, stamp.updatedAt);

      if (payload.sourceTaskId) {
        await upsertProjectionVersion(
          `workflow-unblock-${payload.sourceTaskId}`,
          stamp.version,
          stamp.updatedAt
        );
      }
    })
  );

  unsubscribers.push(
    bus.subscribe('workspace:schedule:proposed', async (payload) => {
      await applyDemandProposed(payload);

      const stamp = createVersionStamp();
      await upsertProjectionVersion('org-schedule-proposals', stamp.version, stamp.updatedAt);
    })
  );

  unsubscribers.push(
    bus.subscribe('workspace:document-parser:itemsExtracted', async (payload) => {
      const stamp = createVersionStamp();
      await upsertProjectionVersion(
        `parsing-intent-${payload.intentId}`,
        stamp.version,
        stamp.updatedAt
      );
    })
  );

  unsubscribers.push(
    bus.subscribe('workspace:tasks:assigned', async (payload) => {
      const stamp = createVersionStamp();
      await upsertProjectionVersion(`task-assigned-${payload.taskId}`, stamp.version, stamp.updatedAt);
    })
  );

  return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
}
