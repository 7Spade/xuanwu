/**
 * Module: task-editor-dialog
 * Purpose: Task create/edit dialog UI
 * Responsibilities: render task editor form, bind local draft fields and attachments
 * Constraints: deterministic logic, respect module boundaries
 */

'use client';

import { Loader2, Settings2 } from 'lucide-react';

import { Button } from '@/shared/shadcn-ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/shadcn-ui/dialog';
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

import { type WorkspaceTask } from '../_types';

interface TaskEditorDialogProps {
  isOpen: boolean;
  editingTask: Partial<WorkspaceTask> | null;
  setEditingTask: React.Dispatch<React.SetStateAction<Partial<WorkspaceTask> | null>>;
  isUploading: boolean;
  onSave: () => void;
  onOpenChange: (open: boolean) => void;
}

export function TaskEditorDialog({
  isOpen,
  editingTask,
  setEditingTask,
  isUploading,
  onSave,
  onOpenChange,
}: TaskEditorDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl overflow-hidden rounded-2xl border bg-background p-0 shadow-xl">
        <div className="border-b bg-muted/20 p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-2xl font-bold tracking-tight">
              <Settings2 className="size-6 text-primary" />
              {editingTask?.id ? 'Calibrate WBS Node' : 'Define New Node'}
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="grid max-h-[70vh] grid-cols-2 gap-5 overflow-y-auto p-6">
          <div className="col-span-2 space-y-1.5">
            <Label className="ml-1 text-xs font-semibold text-foreground">Task Name</Label>
            <Input
              value={editingTask?.name || ''}
              onChange={(e) => setEditingTask({ ...editingTask, name: e.target.value })}
              className="h-11 rounded-lg border-input bg-background"
            />
          </div>

          <div className="col-span-2 space-y-1.5">
            <Label className="ml-1 text-xs font-semibold text-foreground">Description & Specs</Label>
            <Textarea
              value={editingTask?.description || ''}
              onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
              className="min-h-[96px] resize-none rounded-lg border-input bg-background"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="ml-1 text-xs font-semibold text-foreground">Status</Label>
            <Select
              value={editingTask?.progressState}
              onValueChange={(v) =>
                setEditingTask({
                  ...editingTask,
                  progressState: v as WorkspaceTask['progressState'],
                })
              }
            >
              <SelectTrigger className="h-11 rounded-lg border-input bg-background">
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
              <Label htmlFor="task-quantity" className="ml-1 text-xs font-semibold text-foreground">Quantity (Qty)</Label>
              <Input
                id="task-quantity"
                type="number"
                value={editingTask?.quantity || 0}
                onChange={(e) => setEditingTask({ ...editingTask, quantity: Number(e.target.value) })}
                className="h-11 rounded-lg border-input bg-background"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="task-unitprice" className="ml-1 text-xs font-semibold text-foreground">Unit Price</Label>
              <Input
                id="task-unitprice"
                type="number"
                value={editingTask?.unitPrice || 0}
                onChange={(e) => setEditingTask({ ...editingTask, unitPrice: Number(e.target.value) })}
                className="h-11 rounded-lg border-input bg-background"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="task-discount" className="ml-1 text-xs font-semibold text-foreground">Discount</Label>
              <Input
                id="task-discount"
                type="number"
                value={editingTask?.discount || 0}
                onChange={(e) => setEditingTask({ ...editingTask, discount: Number(e.target.value) })}
                className="h-11 rounded-lg border-input bg-background"
              />
            </div>
          </div>

          <div className="col-span-2 flex items-center justify-between rounded-xl border border-border bg-muted/20 p-4">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">Estimated Subtotal</p>
            </div>
            <span className="font-mono text-xl font-bold text-foreground">
              ${((editingTask?.quantity || 0) * (editingTask?.unitPrice || 0) - (editingTask?.discount || 0)).toLocaleString()}
            </span>
          </div>
        </div>

        <DialogFooter className="border-t bg-background p-4">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="rounded-lg"
          >
            Cancel
          </Button>
          <Button
            onClick={onSave}
            disabled={isUploading}
            className="rounded-lg px-6"
          >
            {isUploading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            {isUploading ? 'Saving...' : editingTask?.id ? 'Save Changes' : 'Create Node'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
