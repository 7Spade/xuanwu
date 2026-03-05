// [職責] 監聽事件並執行副作用 (The Orchestrator)
"use client";
import { useEffect, useRef } from "react";

import { handleScheduleProposed } from "@/features/scheduling.slice";
import { shouldMaterializeAsTask } from "@/features/semantic-graph.slice";
import { toast } from "@/shared/shadcn-ui/hooks/use-toast";
import { ToastAction } from "@/shared/shadcn-ui/toast";

import {
  finishParsingImport,
  markParsingIntentFailed,
  markParsingIntentImported,
  startParsingImport,
} from "../../business.document-parser";
import { createIssue } from "../../business.issues";
import { createTask, hasTasksForSourceIntent, reconcileIntentTasks } from "../../business.tasks";
import type { WorkspaceTask } from "../../business.tasks/_types";
import {
  handleIssueCreatedForWorkflow,
  handleIssueResolvedForWorkflow,
} from "../../business.workflow";
import type { DocumentParserItemsExtractedPayload } from '../../core.event-bus';
import { useWorkspace } from '../_components/workspace-provider';

import { useApp } from './use-app';



// [S4] Named constant — disambiguates from PROJ_STALE_STANDARD (10s).
// This is a UI toast duration, not a staleness SLA value.
const TOAST_LONG_DURATION_MS = 10_000;
const PARSING_IMPORT_TERMINAL_STATUSES = new Set([
  'applied',
  'partial',
  'failed',
]);

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

    const unsubQAApproved = eventBus.subscribe(
      "workspace:quality-assurance:approved",
      (payload) => {
        pushNotification(
          "QA Approved",
          `Task "${payload.task.name}" is now ready for final acceptance.`,
          "info"
        );
      }
    );

    const unsubAcceptancePassed = eventBus.subscribe(
      "workspace:acceptance:passed",
      (payload) => {
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

    const handleImport = (payload: DocumentParserItemsExtractedPayload) => {
      const importItems = () => {
        // [D14] Synchronous in-memory guard — must fire before any async Firestore
        // call so that two concurrent executions of importItems() cannot both pass
        // the read-check-write boundary simultaneously (TOCTOU race fix).
        if (inProgressImports.current.has(payload.intentId)) {
          toast({
            title: "Import In Progress",
            description: "An import for this document is already running. Please wait.",
          });
          return;
        }
        inProgressImports.current.add(payload.intentId);

        toast({
          title: "Importing items...",
          description: "Please wait a moment.",
        });

        const items: Omit<WorkspaceTask, "id" | "createdAt" | "updatedAt">[] =
          payload.items
            // [VS8 Layer-3 Semantic Router] shouldMaterializeAsTask() is the single gate
            // for task materialisation — do not inline `=== CostItemType.EXECUTABLE` here.
            // flatMap is used instead of filter+map so we can capture the item's original
            // document position (originalIndex) and store it as `sourceIntentIndex`.
            // This allows the task list to be sorted back into document order at render time.
            .flatMap((item, originalIndex) =>
              shouldMaterializeAsTask(item.costItemType)
                ? [{
                    name: item.name,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    // Omit discount entirely when undefined to avoid Firestore "Unsupported field value: undefined"
                    ...(item.discount !== undefined ? { discount: item.discount } : {}),
                    subtotal: item.subtotal,
                    progress: 0,
                    type: "Imported",
                    priority: "medium",
                    progressState: "todo",
                    sourceIntentId: payload.intentId,
                    sourceIntentIndex: originalIndex,
                    // [TE_SK] ParsingIntent uses `skillRequirements`; WorkspaceTask uses `requiredSkills`
                    // to align with ScheduleItem's field name — intentional cross-model mapping.
                    ...(payload.skillRequirements?.length ? { requiredSkills: payload.skillRequirements } : {}),
                  }]
                : []
            );

        // Build a human-readable summary of skipped non-materializable items for the toast.
        const skippedItems = payload.items.filter(
          (item) => !shouldMaterializeAsTask(item.costItemType)
        );
        const skippedSummaryLines = skippedItems.map(
          (item) => `• [${item.costItemType}] ${item.name}`
        );

        // [D14] Source-based deduplication guard: check whether tasks from this
        // intent have already been materialised before touching the ledger or
        // writing any new documents.  This prevents duplicate tasks when the
        // same event fires more than once (e.g. React StrictMode, re-mount, or
        // user double-click).
        hasTasksForSourceIntent(workspace.id, payload.intentId)
          .then((alreadyImported) => {
            if (alreadyImported) {
              toast({
                title: "Already Imported",
                description: payload.sourceDocument
                  ? `Tasks for document "${payload.sourceDocument}" have already been imported.`
                  : "Tasks for this document have already been imported.",
              });
              return;
            }

            return startParsingImport(workspace.id, payload.intentId, payload.intentVersion)
              .then(async (startResult) => {
            if (startResult.isDuplicate) {
              const isTerminalStatus = PARSING_IMPORT_TERMINAL_STATUSES.has(
                startResult.status
              );
              if (isTerminalStatus) {
                toast({
                  title: "Import Already Processed",
                  description: `Idempotency key ${startResult.idempotencyKey} already processed with status ${startResult.status}.`,
                });
                return;
              }

              toast({
                title: "Import In Progress",
                description: `Idempotency key ${startResult.idempotencyKey} is already running. Please retry after it completes.`,
              });
              return;
            }

            // [#A4] Intent-reconciliation path: when the parse superseded a prior intent,
            // update existing `todo` tasks in-place so we don't accumulate duplicate tasks.
            // Tasks in any other state (doing / blocked / done) keep their current doc and
            // a new task is created for the re-parsed item instead.
            // [VS8 Layer-3] shouldMaterializeAsTask() gates reconciliation/creation.
            // flatMap captures each item's original document position as sourceIntentIndex.
            const executablePayloadItems = payload.items.flatMap((item, originalIndex) =>
              shouldMaterializeAsTask(item.costItemType)
                ? [{ ...item, sourceIntentIndex: originalIndex }]
                : []
            );
            const taskResults = payload.oldIntentId
              ? await reconcileIntentTasks(
                  workspace.id,
                  payload.oldIntentId,
                  payload.intentId,
                  payload.intentVersion,
                  executablePayloadItems,
                  {
                    progress: 0,
                    type: "Imported",
                    priority: "medium",
                    progressState: "todo",
                    ...(payload.skillRequirements?.length ? { requiredSkills: payload.skillRequirements } : {}),
                  }
                ).then((result) =>
                  // reconcileIntentTasks returns a single CommandResult — normalise to the
                  // same shape the batch-createTask path produces (one result per item)
                  // so the rest of the success/failure handling code stays unchanged.
                  executablePayloadItems.map(() => result)
                )
              : await Promise.all(
                  items.map((item) => createTask(workspace.id, item))
                );
            const successfulTaskIds = taskResults
              .filter((result) => result.success)
              .map((result) => result.aggregateId);
            const failedCount = taskResults.length - successfulTaskIds.length;

            if (failedCount > 0) {
              await finishParsingImport(workspace.id, startResult.importId, {
                status: successfulTaskIds.length > 0 ? "partial" : "failed",
                appliedTaskIds: successfulTaskIds,
                error: {
                  code:
                    successfulTaskIds.length > 0
                      ? "PARSING_IMPORT_PARTIAL"
                      : "PARSING_IMPORT_FAILED",
                  message: `${failedCount} task(s) failed during materialization.`,
                },
              });

              try {
                await markParsingIntentFailed(workspace.id, payload.intentId);
              } catch (error: unknown) {
                console.error("Error marking intent status as failed:", error);
              }

              toast({
                variant: "destructive",
                title:
                  successfulTaskIds.length > 0
                    ? "Import Partially Applied"
                    : "Import Failed",
                description:
                  successfulTaskIds.length > 0
                    ? `${successfulTaskIds.length} tasks imported, ${failedCount} failed.`
                    : "No tasks were imported.",
              });
              return;
            }

            await finishParsingImport(workspace.id, startResult.importId, {
              status: "applied",
              appliedTaskIds: successfulTaskIds,
            });

            let statusWritebackWarning: string | undefined;
            try {
              await markParsingIntentImported(workspace.id, payload.intentId);
            } catch (error: unknown) {
              statusWritebackWarning =
                error instanceof Error
                  ? error.message
                  : "Unknown error updating parsing intent status (check network/permissions)";
              console.error("Failed to mark intent imported:", error);
            }

            toast({
              title: statusWritebackWarning
                ? "Import Successful with Warning"
                : "Import Successful",
              description: statusWritebackWarning
                ? `${successfulTaskIds.length} tasks have been added; intent status update failed: ${statusWritebackWarning}`
                : skippedSummaryLines.length > 0
                  ? `${successfulTaskIds.length} task(s) added; ${skippedSummaryLines.length} non-executable item(s) skipped (financial, management, etc.).`
                  : `${successfulTaskIds.length} tasks have been added.`,
            });
            logAuditEvent(
              "Imported Tasks",
              `Imported ${successfulTaskIds.length} items from ${payload.sourceDocument}`,
              "create"
            );
          })
          .catch(async (error: unknown) => {
            try {
              await markParsingIntentFailed(workspace.id, payload.intentId);
            } catch (statusError: unknown) {
              console.error("Error marking intent status as failed:", statusError);
            }

            const message =
              error instanceof Error ? error.message : "Import failed";
            toast({
              variant: "destructive",
              title: "Import Failed",
              description: message,
            });
          });
      })
      .finally(() => {
        // [D14] Release the in-memory lock unconditionally so that a future
        // import attempt is not permanently blocked after an error.
        inProgressImports.current.delete(payload.intentId);
      });
  };

      if (payload.autoImport) {
        importItems();
        return;
      }

      const executableCount = payload.items.filter(
        (item) => shouldMaterializeAsTask(item.costItemType)
      ).length;
      const nonExecutableCount = payload.items.length - executableCount;
      const itemBreakdown =
        nonExecutableCount > 0
          ? `${executableCount} executable task(s), ${nonExecutableCount} non-task item(s) (e.g. financial, management) will be skipped.`
          : "Do you want to import them as new root tasks?";

      toast({
        title: `Found ${payload.items.length} items from "${payload.sourceDocument}".`,
        description: itemBreakdown,
        duration: TOAST_LONG_DURATION_MS,
        action: (
          <ToastAction altText="Import" onClick={importItems}>
            Import
          </ToastAction>
        ),
      });
    };

    const unsubDocParse = eventBus.subscribe(
      "workspace:document-parser:itemsExtracted",
      handleImport
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
      unsubScheduleRequest();
      unsubTaskCompleted();
      unsubTaskAssigned();
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
