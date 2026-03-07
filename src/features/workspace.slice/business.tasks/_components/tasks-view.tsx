
'use client';

import {
  BarChart3,
  Clock,
  Coins,
  Plus,
  View,
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { Button } from '@/shadcn-ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shadcn-ui/dialog';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shadcn-ui/dropdown-menu';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/shadcn-ui/empty';
import { toast } from '@/shadcn-ui/hooks/use-toast';
import { PageHeader } from '@/shadcn-ui/custom-ui/page-header';

import { buildTaskTree } from '@/features/workspace.slice/_task.rules';
import { useStorage } from '@/features/workspace.slice/business.files';
import { useWorkspace } from '@/features/workspace.slice/core';
import { useAttachmentsDialogController, useLocationDialogController } from '../_hooks';
import { type TaskWithChildren, type WorkspaceTask } from '../_types';

import { AttachmentsDialog } from './attachments-dialog';
import { LocationDialog } from './location-dialog';
import { ProgressReportDialog } from './progress-report-dialog';
import { TaskEditorDialog } from './task-editor-dialog';
import { TaskTreeNode } from './task-tree-node';

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;


/**
 * WorkspaceTasks - WBS Engineering Task Governance Center (Advanced)
 * Features: Infinite nesting, bi-directional budget constraints, dynamic column governance, auto-topology numbering.
 * ARCHITECTURE REFACTORED: Now consumes state from context.
 */
export function WorkspaceTasks() {
  const router = useRouter();
  const { workspace, logAuditEvent, eventBus, createTask, updateTask, deleteTask } = useWorkspace();
  const { uploadTaskAttachment } = useStorage(workspace.id);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Partial<WorkspaceTask> | null>(null);
  const [reportingTask, setReportingTask] = useState<TaskWithChildren | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [previewingImage, setPreviewingImage] = useState<string | null>(null);
  
  const [isUploading, setIsUploading] = useState(false);

  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(['type', 'priority', 'location', 'attachments', 'discount', 'subtotal', 'progress', 'status'])
  );

  const tasks = useMemo(
    () =>
      Object.values(workspace.tasks || {}).sort((a, b) => {
        const timeA = a.createdAt?.seconds ?? 0;
        const timeB = b.createdAt?.seconds ?? 0;
        if (timeA !== timeB) return timeA - timeB;
        // Within the same import batch (same createdAt second), sort by original
        // document position so the task list mirrors the source document order. [D27]
        return (a.sourceIntentIndex ?? 0) - (b.sourceIntentIndex ?? 0);
      }),
    [workspace.tasks]
  );

  const tree = useMemo(() => buildTaskTree(tasks), [tasks]);

  const {
    locationTask,
    locationDraft,
    isLocationSaving,
    openLocation,
    closeLocation,
    updateDraft: updateLocationDraft,
    saveLocation,
  } = useLocationDialogController({
    updateTask,
    logAuditEvent,
  });

  const {
    attachmentsTask,
    attachmentFiles,
    isAttachmentsSaving,
    openAttachments,
    closeAttachments,
    selectFiles: selectAttachmentFiles,
    removeFile: removeAttachmentFile,
    saveAttachments,
  } = useAttachmentsDialogController({
    updateTask,
    uploadTaskAttachment,
    logAuditEvent,
  });

  const handleSaveTask = async () => {
    if (!editingTask?.name) return;
    setIsUploading(true);

    try {
      const subtotal =
        (Number(editingTask.quantity) || 0) *
        (Number(editingTask.unitPrice) || 0) - (Number(editingTask.discount) || 0);

      if (editingTask.parentId) {
        const parent = tasks.find((t) => t.id === editingTask.parentId);
        if (parent) {
          const currentChildrenSum = tasks
            .filter(
              (t) => t.parentId === editingTask.parentId && t.id !== editingTask.id
            )
            .reduce((acc, t) => acc + (t.subtotal || 0), 0);

          if (currentChildrenSum + subtotal > (parent.subtotal || 0)) {
            toast({
              variant: 'destructive',
              title: 'Budget Overflow Intercepted',
              description: `Sum of child items cannot exceed the budget limit of "${parent.name}".`,
            });
            setIsUploading(false);
            return;
          }
        }
      }

      if (editingTask.id) {
        const childSum = tasks
          .filter((t) => t.parentId === editingTask.id)
          .reduce((acc, t) => acc + (t.subtotal || 0), 0);
        if (subtotal < childSum) {
          toast({
            variant: 'destructive',
            title: 'Budget Sovereignty Conflict',
            description: `Budget limit ($${subtotal}) cannot be less than the sum of existing child items ($${childSum}).`,
          });
          setIsUploading(false);
          return;
        }
      }

      const finalData: Partial<WorkspaceTask> = {
        ...editingTask,
        subtotal,
        progressState: editingTask.progressState || 'todo',
      };
      delete finalData.progress; // Ensure calculated progress is not saved

      if (editingTask.id) {
        await updateTask(editingTask.id, finalData);

        logAuditEvent(
          'Calibrated WBS Node',
          `${editingTask.name} [Subtotal: ${subtotal}]`,
          'update'
        );

        const updatedTaskForEvent: WorkspaceTask = {
          ...(workspace.tasks?.[editingTask.id] || {}),
          ...finalData,
        } as WorkspaceTask;
        
        if (finalData.progressState === 'completed') {
          eventBus.publish('workspace:tasks:completed', { task: updatedTaskForEvent });
        }
      } else {
        const taskToCreate: Omit<WorkspaceTask, 'id' | 'createdAt' | 'updatedAt'> = {
            ...finalData,
            name: finalData.name!,
            progressState: finalData.progressState!,
            subtotal: finalData.subtotal!,
            completedQuantity: 0,
        };
        await createTask(taskToCreate);
        logAuditEvent('Defined WBS Node', editingTask.name!, 'create');
      }

      setEditingTask(null);
      setIsAddOpen(false);
    } catch (error: unknown) {
      console.error('Error saving task:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to Save Task',
        description: getErrorMessage(error, 'An unknown error occurred.'),
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleReportProgress = async (taskId: string, newCompletedQuantity: number) => {
    try {
      await updateTask(taskId, { completedQuantity: newCompletedQuantity });
      toast({ title: "Progress Updated" });
      setReportingTask(null);
    } catch (error: unknown) {
      console.error("Error reporting progress:", error);
      toast({
        variant: 'destructive',
        title: 'Failed to Update Progress',
        description: getErrorMessage(error, "An unknown error occurred."),
      });
    }
  };

  const handleSubmitForQA = async (task: TaskWithChildren) => {
    const updates = { progressState: 'completed' as const };

    try {
      await updateTask(task.id, updates);
      
      const updatedTaskForEvent: WorkspaceTask = {
        ...task,
        progressState: 'completed',
      };
      
      eventBus.publish('workspace:tasks:completed', { task: updatedTaskForEvent });
      logAuditEvent('Submitted for QA', task.name, 'update');
      toast({
        title: 'Task Submitted for QA',
        description: `"${task.name}" is now in the QA queue.`,
      });
    } catch (error: unknown) {
      console.error('Error submitting for QA:', error);
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: getErrorMessage(error, 'An unknown error occurred.'),
      });
    }
  };


  const handleDeleteTask = async (node: TaskWithChildren) => {
    if (confirm('Confirm destruction of this node and all its descendants?')) {
      try {
        await deleteTask(node.id);
      } catch (error: unknown) {
        console.error('Error deleting task:', error);
        toast({
          variant: 'destructive',
          title: 'Failed to Delete Task',
          description: getErrorMessage(error, 'An unknown error occurred.'),
        });
      }
    }
  };
  
  const handleScheduleRequest = (task: WorkspaceTask) => {
    eventBus.publish('workspace:tasks:scheduleRequested', { taskName: task.name! });
    const proposalParams = new URLSearchParams({ taskId: task.id }).toString();
    router.push(`/workspaces/${workspace.id}/schedule-proposal?${proposalParams}`);
  };

  const handleMarkBlocked = async (task: TaskWithChildren) => {
    if (!['todo', 'doing'].includes(task.progressState)) return;
    try {
      await updateTask(task.id, { progressState: 'blocked' as const });
      const updatedTask: WorkspaceTask = { ...task, progressState: 'blocked' as WorkspaceTask['progressState'] };
      eventBus.publish('workspace:tasks:blocked', { task: updatedTask });
      logAuditEvent('Task Blocked', task.name, 'update');
      toast({ title: 'Task Blocked', description: `"${task.name}" is blocked. A B-track issue will be created.` });
    } catch (error: unknown) {
      toast({ variant: 'destructive', title: 'Failed to Block Task', description: getErrorMessage(error, 'Unknown error.') });
    }
  };

  const toggleColumn = (key: string) => {
    const next = new Set(visibleColumns);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setVisibleColumns(next);
  };
  
  return (
    <div className="space-y-6 pb-20 duration-500 animate-in fade-in">
      <PageHeader
        size="compact"
        title="WBS Governance"
        description="Real-time budget and topology monitoring"
        badge={
          <div className="inline-flex items-center gap-2 rounded-lg border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground">
            <BarChart3 className="size-3.5 text-primary" />
            <Clock className="size-3.5" />
            Task Engineering
          </div>
        }
      >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-2 rounded-xl text-[10px] font-black uppercase"
              >
                <View className="size-3.5" /> View Options
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl">
              <DropdownMenuLabel className="text-[10px] font-bold uppercase">
                Visible Columns
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={visibleColumns.has('type')}
                onCheckedChange={() => toggleColumn('type')}
              >
                Task Type
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.has('priority')}
                onCheckedChange={() => toggleColumn('priority')}
              >
                Priority
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.has('location')}
                onCheckedChange={() => toggleColumn('location')}
              >
                Location
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.has('attachments')}
                onCheckedChange={() => toggleColumn('attachments')}
              >
                Attachments
              </DropdownMenuCheckboxItem>
               <DropdownMenuCheckboxItem
                checked={visibleColumns.has('discount')}
                onCheckedChange={() => toggleColumn('discount')}
              >
                Discount
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.has('subtotal')}
                onCheckedChange={() => toggleColumn('subtotal')}
              >
                Budget
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.has('progress')}
                onCheckedChange={() => toggleColumn('progress')}
              >
                Progress
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.has('status')}
                onCheckedChange={() => toggleColumn('status')}
              >
                Status
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            size="sm"
            className="h-9 gap-2 rounded-full px-5 text-[10px] font-black uppercase"
            onClick={() => {
              setEditingTask({
                quantity: 1,
                completedQuantity: 0,
                unitPrice: 0,
                discount: 0,
                type: 'Top-level Project',
                priority: 'medium',
                progressState: 'todo',
                photoURLs: [],
                location: { description: '' }
              });
              setIsAddOpen(true);
            }}
          >
            <Plus className="size-3.5" /> Create Root Node
          </Button>
      </PageHeader>

       <ProgressReportDialog
        task={reportingTask}
        isOpen={!!reportingTask}
        onClose={() => setReportingTask(null)}
        onSubmit={handleReportProgress}
      />

      <Dialog open={!!previewingImage} onOpenChange={(open) => !open && setPreviewingImage(null)}>
        <DialogContent className="max-w-4xl border-none bg-transparent p-1 shadow-none">
          <DialogHeader>
            <DialogTitle className="sr-only">Image Preview</DialogTitle>
            <DialogDescription className="sr-only">A larger view of the attached image.</DialogDescription>
          </DialogHeader>
            {previewingImage && (
                <div className="relative aspect-video h-auto w-full">
                    <Image src={previewingImage} alt="Attachment preview" fill sizes="100vw" className="rounded-lg object-contain" />
                </div>
            )}
        </DialogContent>
      </Dialog>

      <LocationDialog
        isOpen={!!locationTask}
        draft={locationDraft}
        onDraftChange={updateLocationDraft}
        onSave={saveLocation}
        isSaving={isLocationSaving}
        onOpenChange={(open) => {
          if (!open) closeLocation();
        }}
      />

      <AttachmentsDialog
        isOpen={!!attachmentsTask}
        attachments={attachmentsTask?.photoURLs ?? []}
        files={attachmentFiles}
        onFilesSelected={selectAttachmentFiles}
        onRemoveFile={removeAttachmentFile}
        onSave={saveAttachments}
        isSaving={isAttachmentsSaving}
        onPreviewImage={setPreviewingImage}
        onOpenChange={(open) => {
          if (!open) closeAttachments();
        }}
      />

      <div className="space-y-1">
        {tree.length > 0 ? (
          tree.map((root) => (
            <TaskTreeNode
              key={root.id}
              node={root}
              expandedIds={expandedIds}
              setExpandedIds={setExpandedIds}
              visibleColumns={visibleColumns}
              onPreviewImage={setPreviewingImage}
              onOpenLocation={openLocation}
              onOpenAttachments={openAttachments}
              onReportProgress={setReportingTask}
              onScheduleRequest={handleScheduleRequest}
              onMarkBlocked={handleMarkBlocked}
              onCreateChild={(node) => {
                setEditingTask({
                  parentId: node.id,
                  quantity: 1,
                  completedQuantity: 0,
                  unitPrice: 0,
                  discount: 0,
                  type: 'Sub-task',
                  priority: 'medium',
                  progressState: 'todo',
                });
                setIsAddOpen(true);
              }}
              onEditNode={(node) => {
                setEditingTask({
                  ...node,
                  location: node.location || { description: '' },
                });
                setIsAddOpen(true);
              }}
              onDeleteNode={handleDeleteTask}
              onSubmitForQA={handleSubmitForQA}
            />
          ))
        ) : (
          <Empty className="rounded-2xl border-muted/40 bg-muted/5 py-16">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Coins className="size-5" />
              </EmptyMedia>
              <EmptyTitle>Awaiting Engineering Node Definition</EmptyTitle>
              <EmptyDescription>Create your first root task to start WBS planning.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>

      <TaskEditorDialog
        isOpen={isAddOpen}
        editingTask={editingTask}
        setEditingTask={setEditingTask}
        isUploading={isUploading}
        onSave={handleSaveTask}
        onOpenChange={(open) => {
          if (!open) {
            setEditingTask(null);
            setIsAddOpen(false);
          } else {
            setIsAddOpen(true);
          }
        }}
      />
    </div>
  );
}

    
