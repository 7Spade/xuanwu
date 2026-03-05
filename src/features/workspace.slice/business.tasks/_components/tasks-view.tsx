
'use client';

import {
  BarChart3,
  Clock,
  Coins,
  Loader2,
  MapPin,
  Paperclip,
  Plus,
  Settings2,
  UploadCloud,
  View,
  X,
} from 'lucide-react';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/shared/shadcn-ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/shadcn-ui/dialog';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/shadcn-ui/dropdown-menu';
import { toast } from '@/shared/shadcn-ui/hooks/use-toast';
import { Input } from '@/shared/shadcn-ui/input';
import { Label } from '@/shared/shadcn-ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/shadcn-ui/select';
import { Textarea } from '@/shared/shadcn-ui/textarea';

import { buildTaskTree } from '../../_task.rules';
import { useStorage } from '../../business.files';
import { useWorkspace } from '../../core';
import { type Location, type TaskWithChildren, type WorkspaceTask } from '../_types';

import { ProgressReportDialog } from './progress-report-dialog';
import { TaskTreeNode } from './task-tree-node';

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;


/**
 * WorkspaceTasks - WBS Engineering Task Governance Center (Advanced)
 * Features: Infinite nesting, bi-directional budget constraints, dynamic column governance, auto-topology numbering.
 * ARCHITECTURE REFACTORED: Now consumes state from context.
 */
export function WorkspaceTasks() {
  const { workspace, logAuditEvent, eventBus, createTask, updateTask, deleteTask } = useWorkspace();
  const { uploadTaskAttachment } = useStorage(workspace.id);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Partial<WorkspaceTask> | null>(null);
  const [reportingTask, setReportingTask] = useState<TaskWithChildren | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [previewingImage, setPreviewingImage] = useState<string | null>(null);
  
  const [photos, setPhotos] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(['type', 'priority', 'discount', 'subtotal', 'progress', 'status'])
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

  useEffect(() => {
    if (!isAddOpen) {
      setPhotos([]);
    }
  }, [isAddOpen]);


  const handleLocationChange = (field: keyof Location, value: string) => {
    setEditingTask(prev => ({
        ...prev,
        location: {
            ...prev?.location,
            description: prev?.location?.description || '',
            [field]: value
        }
    }))
  };

  const handleSaveTask = async () => {
    if (!editingTask?.name) return;
    setIsUploading(true);

    try {
      const newPhotoURLs = await Promise.all(
        photos.map(photo => uploadTaskAttachment(photo))
      );
      
      const existingPhotoURLs = editingTask.photoURLs || [];
      const finalPhotoURLs = [...existingPhotoURLs, ...newPhotoURLs];

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
        photoURLs: finalPhotoURLs,
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
    toast({
        title: 'Schedule Request Sent',
        description: `"${task.name}" was sent to the Schedule capability.`,
    });
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
  
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPhotos(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6 pb-20 duration-500 animate-in fade-in">
      <div className="flex items-center justify-between rounded-3xl border border-primary/20 bg-card/40 p-4 shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2 text-primary">
            <BarChart3 className="size-5" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-foreground">
              WBS Governance
            </h3>
            <p className="flex items-center gap-2 text-[9px] font-bold uppercase text-muted-foreground">
              <Clock className="size-3" /> Real-time Budget & Topology
              Monitoring
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
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
            className="h-9 gap-2 rounded-full px-5 text-[10px] font-black uppercase shadow-lg shadow-primary/20"
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
        </div>
      </div>

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
          <div className="flex flex-col items-center gap-3 rounded-3xl border-2 border-dashed bg-muted/5 p-20 text-center opacity-20">
            <Coins className="size-12" />
            <p className="text-[10px] font-black uppercase tracking-widest">
              Awaiting Engineering Node Definition...
            </p>
          </div>
        )}
      </div>

      <Dialog
        open={isAddOpen}
        onOpenChange={(open) => {
          if (!open) {
            setEditingTask(null);
            setIsAddOpen(false);
          } else {
            setIsAddOpen(true);
          }
        }}
      >
        <DialogContent className="max-w-3xl overflow-hidden rounded-[2.5rem] border-none p-0 shadow-2xl">
          <div className="bg-primary p-8 text-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 font-headline text-3xl">
                <Settings2 className="size-8" />{' '}
                {editingTask?.id ? 'Calibrate WBS Node' : 'Define New Node'}
              </DialogTitle>
            </DialogHeader>
          </div>

          <div className="grid max-h-[70vh] grid-cols-2 gap-6 overflow-y-auto p-8">
            <div className="col-span-2 space-y-1.5">
              <Label className="ml-1 text-[10px] font-black uppercase text-muted-foreground">
                Task Name
              </Label>
              <Input
                value={editingTask?.name || ''}
                onChange={(e) =>
                  setEditingTask({ ...editingTask, name: e.target.value })
                }
                className="h-12 rounded-xl border-none bg-muted/30 font-bold"
              />
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label className="ml-1 text-[10px] font-black uppercase text-muted-foreground">
                Description & Specs
              </Label>
              <Textarea
                value={editingTask?.description || ''}
                onChange={(e) =>
                  setEditingTask({
                    ...editingTask,
                    description: e.target.value,
                  })
                }
                className="min-h-[100px] resize-none rounded-xl border-none bg-muted/30"
              />
            </div>

            <div className="col-span-2 space-y-2">
                <Label className="ml-1 flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground">
                    <MapPin className="size-3"/> Location
                </Label>
                <div className="grid grid-cols-3 gap-4">
                    <Input
                        placeholder="Building"
                        value={editingTask?.location?.building || ''}
                        onChange={(e) => handleLocationChange('building', e.target.value)}
                        className="h-11 rounded-xl border-none bg-muted/30"
                    />
                    <Input
                        placeholder="Floor"
                        value={editingTask?.location?.floor || ''}
                        onChange={(e) => handleLocationChange('floor', e.target.value)}
                        className="h-11 rounded-xl border-none bg-muted/30"
                    />
                    <Input
                        placeholder="Room"
                        value={editingTask?.location?.room || ''}
                        onChange={(e) => handleLocationChange('room', e.target.value)}
                        className="h-11 rounded-xl border-none bg-muted/30"
                    />
                </div>
                <Textarea
                    placeholder="Location details (e.g., 'Behind the main server rack')"
                    value={editingTask?.location?.description || ''}
                    onChange={(e) => handleLocationChange('description', e.target.value)}
                    className="resize-none rounded-xl border-none bg-muted/30"
                    rows={2}
                />
            </div>
            
            <div className="col-span-2 space-y-3">
                <Label className="ml-1 flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground">
                    <Paperclip className="size-3"/> Attachments
                </Label>
                
                {editingTask?.photoURLs && editingTask.photoURLs.length > 0 && (
                   <div className="grid grid-cols-4 gap-2">
                    {editingTask.photoURLs.map((url, index) => (
                      <div key={index} className="group relative aspect-square">
                        <Image src={url} alt={`Existing attachment ${index + 1}`} fill sizes="200px" className="rounded-lg object-cover" />
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="grid grid-cols-4 gap-2">
                    {photos.map((photo, index) => (
                      <div key={index} className="group relative aspect-square">
                        <Image src={URL.createObjectURL(photo)} alt={`New attachment ${index}`} fill sizes="200px" className="rounded-lg object-cover" />
                        <Button variant="destructive" size="icon" className="absolute right-1 top-1 size-5 opacity-0 transition-opacity group-hover:opacity-100" onClick={() => handleRemovePhoto(index)}>
                            <X className="size-3"/>
                        </Button>
                      </div>
                    ))}
                </div>
                
                <Button asChild variant="outline" className="h-12 w-full cursor-pointer rounded-xl border-2 border-dashed bg-muted/30 hover:bg-muted/50">
                    <label htmlFor="photo-upload">
                        <UploadCloud className="mr-2 size-4" /> Upload Images
                        <input id="photo-upload" type="file" className="sr-only" multiple accept="image/*" onChange={handlePhotoSelect} />
                    </label>
                </Button>
            </div>

            <div className="space-y-1.5">
              <Label className="ml-1 text-[10px] font-black uppercase text-muted-foreground">
                Status
              </Label>
              <Select
                value={editingTask?.progressState}
                onValueChange={(v) =>
                  setEditingTask({
                    ...editingTask,
                    progressState: v as WorkspaceTask['progressState'],
                  })
                }
              >
                <SelectTrigger className="h-11 rounded-xl border-none bg-muted/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To-do</SelectItem>
                  <SelectItem value="doing">Doing</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="col-span-2 grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor="task-quantity" className="ml-1 text-[10px] font-black uppercase text-muted-foreground">
                    Quantity (Qty)
                    </Label>
                    <Input
                    id="task-quantity"
                    type="number"
                    value={editingTask?.quantity || 0}
                    onChange={(e) =>
                        setEditingTask({
                        ...editingTask,
                        quantity: Number(e.target.value),
                        })
                    }
                    className="h-11 rounded-xl border-none bg-muted/30"
                    />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="task-unitprice" className="ml-1 text-[10px] font-black uppercase text-muted-foreground">
                    Unit Price
                    </Label>
                    <Input
                    id="task-unitprice"
                    type="number"
                    value={editingTask?.unitPrice || 0}
                    onChange={(e) =>
                        setEditingTask({
                        ...editingTask,
                        unitPrice: Number(e.target.value),
                        })
                    }
                    className="h-11 rounded-xl border-none bg-muted/30"
                    />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="task-discount" className="ml-1 text-[10px] font-black uppercase text-muted-foreground">
                    Discount
                    </Label>
                    <Input
                    id="task-discount"
                    type="number"
                    value={editingTask?.discount || 0}
                    onChange={(e) =>
                        setEditingTask({
                        ...editingTask,
                        discount: Number(e.target.value),
                        })
                    }
                    className="h-11 rounded-xl border-none bg-muted/30"
                    />
                </div>
            </div>

            <div className="col-span-2 flex items-center justify-between rounded-3xl border border-primary/10 bg-primary/5 p-6">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">
                  Subtotal
                </p>
              </div>
              <span className="font-mono text-2xl font-black text-primary">
                $
                {(
                  (editingTask?.quantity || 0) * (editingTask?.unitPrice || 0) - (editingTask?.discount || 0)
                ).toLocaleString()}
              </span>
            </div>
          </div>

          <DialogFooter className="border-t bg-muted/30 p-6">
            <Button
              variant="ghost"
              onClick={() => {
                setIsAddOpen(false);
                setEditingTask(null);
              }}
              className="rounded-xl text-[10px] font-black uppercase"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveTask}
              disabled={isUploading}
              className="rounded-xl px-8 text-[10px] font-black uppercase shadow-xl shadow-primary/20"
            >
              {isUploading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              {isUploading ? "Uploading & Syncing..." : "Sync to Cloud Sovereignty"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

    
