// [職責] 監聽事件並執行副作用 (The Orchestrator)
"use client";
import { useEffect, useRef } from "react";

import { handleScheduleProposed } from "@/features/workforce-scheduling.slice";
import { toast } from "@/shadcn-ui/hooks/use-toast";

import { createIssue } from "@/features/workspace.slice/business.issues";
import {
  advanceWorkflowToStage,
  handleIssueCreatedForWorkflow,
  handleIssueResolvedForWorkflow,
  type WorkflowStage,
} from "@/features/workspace.slice/business.workflow";
import { useWorkspace } from '../_components/workspace-provider';

import { useApp } from './use-app';
import { createWorkspaceImportHandler } from './workspace-import-handler';



// [S4] Named constant — disambiguates from PROJ_STALE_STANDARD (10s).
// This is a UI toast duration, not a staleness SLA value.
const TOAST_LONG_DURATION_MS = 10_000;

/**
 * useWorkspaceEventHandler — side-effect hook (no render output).
 * Call inside any Client Component that is a descendant of WorkspaceProvider.
 * Subscribes to workspace-level events and orchestrates cross-capability reactions.
 */
export function useWorkspaceEventHandler() {
  const { eventBus, workspace, logAuditEvent, createScheduleItem } = useWorkspace();
  const { dispatch } = useApp();
  // [D14] In-memory idempotency lock — prevents concurrent importItems() calls
  // from both passing the async Firestore read-check-write boundary (TOCTOU race).
  // useRef gives a stable object that persists across renders without triggering re-renders.
  const inProgressImports = useRef(new Set<string>());

  useEffect(() => {
    const pushNotification = (
      title: string,
      message: string,
      type: "info" | "success" | "alert"
    ) => {
      dispatch({
        type: "ADD_NOTIFICATION",
        payload: { title, message, type },
      });
    };

    const createIssueAndBlockWorkflow = async (
      title: string,
      type: "technical" | "financial",
      sourceTaskId?: string,
      traceId?: string
    ) => {
      const issueResult = await createIssue(
        workspace.id,
        title,
        type,
        "high",
        sourceTaskId
      );
      if (!issueResult.success) {
        throw new Error(
          `Failed to create issue in workspace ${workspace.id} (${type}${sourceTaskId ? `, sourceTaskId=${sourceTaskId}` : ''}): ${issueResult.error.message}`
        );
      }

      const blockedResult = await handleIssueCreatedForWorkflow(
        workspace.id,
        issueResult.aggregateId
      );

      if (blockedResult.wasChanged) {
        eventBus.publish("workspace:workflow:blocked", {
          workflowId: blockedResult.workflowId,
          issueId: issueResult.aggregateId,
          blockedByCount: blockedResult.blockedByCount,
          ...(traceId ? { traceId } : {}),
        });
      }

      return issueResult.aggregateId;
    };

    const advanceWorkspaceWorkflowTo = async (targetStage: WorkflowStage) => {
      await advanceWorkflowToStage(workspace.id, targetStage);
    };

    const unsubQAApproved = eventBus.subscribe(
      "workspace:quality-assurance:approved",
      async (payload) => {
        await advanceWorkspaceWorkflowTo('acceptance').catch((error) => {
          console.error('[workflow-stage] failed to advance to acceptance:', error);
        });
        pushNotification(
          "QA Approved",
          `Task "${payload.task.name}" is now ready for final acceptance.`,
          "info"
        );
      }
    );

    const unsubAcceptancePassed = eventBus.subscribe(
      "workspace:acceptance:passed",
      async (payload) => {
        await advanceWorkspaceWorkflowTo('finance').catch((error) => {
          console.error('[workflow-stage] failed to advance to finance:', error);
        });
        pushNotification(
          "Task Accepted",
          `Task "${payload.task.name}" is now ready for financial settlement.`,
          "success"
        );
      }
    );

    const unsubQualityAssuranceRejected = eventBus.subscribe(
      "workspace:quality-assurance:rejected",
      async (payload) => {
        await createIssueAndBlockWorkflow(
          `QA Rejected: ${payload.task.name}`,
          "technical",
          payload.task.id,
          payload.traceId
        );
        pushNotification(
          "QA Rejected & Issue Logged",
          `Task "${payload.task.name}" was sent back. An issue has been automatically created.`,
          "alert"
        );
      }
    );

    const unsubAcceptanceFailed = eventBus.subscribe(
      "workspace:acceptance:failed",
      async (payload) => {
        await createIssueAndBlockWorkflow(
          `Acceptance Failed: ${payload.task.name}`,
          "technical",
          payload.task.id,
          payload.traceId
        );
        pushNotification(
          "Acceptance Failed & Issue Logged",
          `Task "${payload.task.name}" was sent back. An issue has been automatically created.`,
          "alert"
        );
      }
    );

    const handleImport = createWorkspaceImportHandler({
      workspaceId: workspace.id,
      inProgressImports,
      toastLongDurationMs: TOAST_LONG_DURATION_MS,
      logAuditEvent,
    });

    const unsubDocParse = eventBus.subscribe(
      "workspace:document-parser:itemsExtracted",
      handleImport
    );

    const unsubDocParseFailed = eventBus.subscribe(
      'workspace:document-parser:failed',
      async (payload) => {
        await createIssueAndBlockWorkflow(
          `Parser Error: ${payload.sourceDocument}`,
          'technical',
          undefined,
          payload.traceId,
        );
        pushNotification(
          'Parser Failed & Issue Logged',
          `Document "${payload.sourceDocument}" parse failed: ${payload.reason}`,
          'alert',
        );
      },
    );

    const unsubScheduleRequest = eventBus.subscribe(
      "workspace:tasks:scheduleRequested",
      (payload) => {
        dispatch({
          type: "REQUEST_SCHEDULE_TASK",
          payload: {
            taskName: payload.taskName,
            workspaceId: workspace.id,
          },
        });
      }
    );

    const unsubTaskCompleted = eventBus.subscribe(
      "workspace:tasks:completed",
      async (payload) => {
        await advanceWorkspaceWorkflowTo('quality-assurance').catch((error) => {
          console.error('[workflow-stage] failed to advance to quality-assurance:', error);
        });

        if (!workspace.dimensionId) return;
        try {
          await createScheduleItem({
            accountId: workspace.dimensionId,
            workspaceId: workspace.id,
            workspaceName: workspace.name,
            title: `Review: ${payload.task.name}`,
            startDate: new Date(),
            endDate: new Date(),
            status: "PROPOSAL",
            originType: "TASK_AUTOMATION",
            originTaskId: payload.task.id,
            assigneeIds: [],
          });

          toast({
            title: "Schedule Request Created",
            description: `A proposal for "${payload.task.name}" has been sent to the organization for approval.`,
          });
          logAuditEvent(
            "Auto-Generated Schedule Proposal",
            `From task: ${payload.task.name}`,
            "create"
          );
        } catch (error) {
          console.error("Failed to create schedule proposal:", error);
          toast({
            variant: "destructive",
            title: "Proposal Creation Failed",
            description:
              error instanceof Error
                ? error.message
                : "An unknown error occurred.",
          });
        }
      }
    );

    // Schedule trigger chain: task assignment change → W_B_SCHEDULE domain event flow.
    // When a task is assigned to a member, a PROPOSAL schedule item is created so the
    // organization can review and confirm the assignment window.
    const unsubTaskAssigned = eventBus.subscribe(
      "workspace:tasks:assigned",
      async (payload) => {
        if (!workspace.dimensionId) return;
        try {
          await createScheduleItem({
            accountId: workspace.dimensionId,
            workspaceId: workspace.id,
            workspaceName: workspace.name,
            title: `Assignment: ${payload.taskName}`,
            startDate: new Date(),
            endDate: new Date(),
            status: "PROPOSAL",
            originType: "TASK_AUTOMATION",
            originTaskId: payload.taskId,
            assigneeIds: [payload.assigneeId],
            // [TE_SK] Forward skill requirements so the scheduling saga can run
            // eligibility checks (SK_SKILL_REQ) without knowing task details [D7].
            ...(payload.requiredSkills?.length ? { requiredSkills: payload.requiredSkills } : {}),
          });
          logAuditEvent(
            "Auto-Generated Assignment Proposal",
            `Task "${payload.taskName}" assigned to ${payload.assigneeId}`,
            "create"
          );
        } catch (error) {
          console.error("Failed to create assignment schedule proposal:", error);
        }
      }
    );

    const unsubFinanceCompleted = eventBus.subscribe(
      "workspace:finance:completed",
      async () => {
        await advanceWorkspaceWorkflowTo('completed').catch((error) => {
          console.error('[workflow-stage] failed to advance to completed:', error);
        });
      }
    );

    const unsubForwardRequested = eventBus.subscribe(
      "daily:log:forwardRequested",
      (payload) => {
        toast({
          title: "Forward Action Triggered",
          description: `Received request to forward log to the '${payload.targetCapability}' capability.`,
        });
      }
    );

    const buildWorkflowBlockedMessage = (
      workflowId: string,
      issueId: string,
      blockedByCount: number
    ) =>
      `Workflow ${workflowId} blocked by issue ${issueId}. Active blockers: ${blockedByCount}.`;

    const unsubWorkflowBlocked = eventBus.subscribe(
      "workspace:workflow:blocked",
      (payload) => {
        pushNotification(
          "Workflow Blocked",
          buildWorkflowBlockedMessage(
            payload.workflowId,
            payload.issueId,
            payload.blockedByCount
          ),
          "alert"
        );
      }
    );

    const unsubWorkflowUnblocked = eventBus.subscribe(
      "workspace:workflow:unblocked",
      (payload) => {
        pushNotification(
          "Workflow Unblocked",
          `Workflow ${payload.workflowId} unblocked by issue ${payload.issueId}.`,
          "success"
        );
      }
    );

    // B-track announces fact via event bus; workflow aggregate owns blockedBy mutation [#A3].
    const buildIssueResolvedMessage = (
      issueTitle: string,
      resolvedBy: string,
      unblockedCount: number
    ) =>
      `Issue "${issueTitle}" closed by ${resolvedBy}. ${unblockedCount > 0 ? 'Workflow resumed.' : 'Workflow still blocked by other issues.'}`;

    const unsubIssueResolved = eventBus.subscribe(
      "workspace:issues:resolved",
      async (payload) => {
        const resolution = await handleIssueResolvedForWorkflow(
          workspace.id,
          payload.issueId
        ).catch((err: unknown) => {
          console.error('[A/B Handoff] Workflow unblock handling failed:', err);
          return { touchedWorkflowIds: [], unblockedWorkflowIds: [] };
        });

        for (const workflowId of resolution.unblockedWorkflowIds) {
          eventBus.publish("workspace:workflow:unblocked", {
            workflowId,
            issueId: payload.issueId,
            blockedByCount: 0,
            ...(payload.traceId ? { traceId: payload.traceId } : {}),
          });
        }

        pushNotification(
          "B-Track Issue Resolved",
          buildIssueResolvedMessage(
            payload.issueTitle,
            payload.resolvedBy,
            resolution.unblockedWorkflowIds.length
          ),
          "success"
        );
      }
    );

    // TRACK_A_FINANCE -->|異常| TRACK_B_ISSUES
    const unsubFinanceFailed = eventBus.subscribe(
      "workspace:finance:disburseFailed",
      async (payload) => {
        await createIssueAndBlockWorkflow(
          `Disbursement Failed: ${payload.taskTitle}`,
          "financial",
          payload.taskId,
          payload.traceId
        );
        pushNotification(
          "Finance Failure & Issue Logged",
          `Disbursement for "${payload.taskTitle}" failed. A financial issue has been created.`,
          "alert"
        );
      }
    );

    // TRACK_A_TASKS -->|異常| TRACK_B_ISSUES
    const unsubTaskBlocked = eventBus.subscribe(
      "workspace:tasks:blocked",
      async (payload) => {
        await createIssueAndBlockWorkflow(
          `Task Blocked: ${payload.task.name}`,
          "technical",
          payload.task.id,
          payload.traceId
        );
        pushNotification(
          "Task Blocked & Issue Logged",
          `Task "${payload.task.name}" is blocked. A B-track issue has been created.`,
          "alert"
        );
      }
    );

    // VS6 scheduling saga — enrich the proposal with org-domain fields
    // (proposedBy, version, traceId, requiredSkills) as soon as it is published.
    // The event is fired by createScheduleItem in workspace-provider after the
    // Firestore document has been created with status=PROPOSAL.
    const unsubScheduleProposed = eventBus.subscribe(
      "workspace:schedule:proposed",
      async (payload) => {
        try {
          await handleScheduleProposed(payload);
        } catch (err) {
          console.error("[W_B_SCHEDULE] handleScheduleProposed failed", { payload, err });
        }
      }
    );

    return () => {
      unsubQAApproved();
      unsubAcceptancePassed();
      unsubQualityAssuranceRejected();
      unsubAcceptanceFailed();
      unsubDocParse();
      unsubDocParseFailed();
      unsubScheduleRequest();
      unsubTaskCompleted();
      unsubTaskAssigned();
      unsubFinanceCompleted();
      unsubForwardRequested();
      unsubWorkflowBlocked();
      unsubWorkflowUnblocked();
      unsubIssueResolved();
      unsubFinanceFailed();
      unsubTaskBlocked();
      unsubScheduleProposed();
    };
  }, [eventBus, dispatch, workspace.id, workspace.dimensionId, workspace.name, logAuditEvent, createScheduleItem]);
}
