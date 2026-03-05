/**
 * Module: task-editor-dialog
 * Purpose: Task create/edit dialog UI
 * Responsibilities: render task editor form, bind local draft fields and attachments
 * Constraints: deterministic logic, respect module boundaries
 */

'use client';

import { Loader2, MapPin, Paperclip, Settings2, UploadCloud, X } from 'lucide-react';
import Image from 'next/image';

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

import { type Location, type WorkspaceTask } from '../_types';

interface TaskEditorDialogProps {
  isOpen: boolean;
  editingTask: Partial<WorkspaceTask> | null;
  setEditingTask: React.Dispatch<React.SetStateAction<Partial<WorkspaceTask> | null>>;
  photos: File[];
  setPhotos: React.Dispatch<React.SetStateAction<File[]>>;
  isUploading: boolean;
  onSave: () => void;
  onLocationChange: (field: keyof Location, value: string) => void;
  onOpenChange: (open: boolean) => void;
}

export function TaskEditorDialog({
  isOpen,
  editingTask,
  setEditingTask,
  photos,
  setPhotos,
  isUploading,
  onSave,
  onLocationChange,
  onOpenChange,
}: TaskEditorDialogProps) {
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;
    setPhotos((prev) => [...prev, ...Array.from(selectedFiles)]);
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
            <Label className="ml-1 text-[10px] font-black uppercase text-muted-foreground">Task Name</Label>
            <Input
              value={editingTask?.name || ''}
              onChange={(e) => setEditingTask({ ...editingTask, name: e.target.value })}
              className="h-12 rounded-xl border-none bg-muted/30 font-bold"
            />
          </div>

          <div className="col-span-2 space-y-1.5">
            <Label className="ml-1 text-[10px] font-black uppercase text-muted-foreground">Description & Specs</Label>
            <Textarea
              value={editingTask?.description || ''}
              onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
              className="min-h-[100px] resize-none rounded-xl border-none bg-muted/30"
            />
          </div>

          <div className="col-span-2 space-y-2">
            <Label className="ml-1 flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground">
              <MapPin className="size-3" /> Location
            </Label>
            <div className="grid grid-cols-3 gap-4">
              <Input
                placeholder="Building"
                value={editingTask?.location?.building || ''}
                onChange={(e) => onLocationChange('building', e.target.value)}
                className="h-11 rounded-xl border-none bg-muted/30"
              />
              <Input
                placeholder="Floor"
                value={editingTask?.location?.floor || ''}
                onChange={(e) => onLocationChange('floor', e.target.value)}
                className="h-11 rounded-xl border-none bg-muted/30"
              />
              <Input
                placeholder="Room"
                value={editingTask?.location?.room || ''}
                onChange={(e) => onLocationChange('room', e.target.value)}
                className="h-11 rounded-xl border-none bg-muted/30"
              />
            </div>
            <Textarea
              placeholder="Location details (e.g., 'Behind the main server rack')"
              value={editingTask?.location?.description || ''}
              onChange={(e) => onLocationChange('description', e.target.value)}
              className="resize-none rounded-xl border-none bg-muted/30"
              rows={2}
            />
          </div>

          <div className="col-span-2 space-y-3">
            <Label className="ml-1 flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground">
              <Paperclip className="size-3" /> Attachments
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
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute right-1 top-1 size-5 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={() => handleRemovePhoto(index)}
                  >
                    <X className="size-3" />
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
            <Label className="ml-1 text-[10px] font-black uppercase text-muted-foreground">Status</Label>
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
              <Label htmlFor="task-quantity" className="ml-1 text-[10px] font-black uppercase text-muted-foreground">Quantity (Qty)</Label>
              <Input
                id="task-quantity"
                type="number"
                value={editingTask?.quantity || 0}
                onChange={(e) => setEditingTask({ ...editingTask, quantity: Number(e.target.value) })}
                className="h-11 rounded-xl border-none bg-muted/30"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="task-unitprice" className="ml-1 text-[10px] font-black uppercase text-muted-foreground">Unit Price</Label>
              <Input
                id="task-unitprice"
                type="number"
                value={editingTask?.unitPrice || 0}
                onChange={(e) => setEditingTask({ ...editingTask, unitPrice: Number(e.target.value) })}
                className="h-11 rounded-xl border-none bg-muted/30"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="task-discount" className="ml-1 text-[10px] font-black uppercase text-muted-foreground">Discount</Label>
              <Input
                id="task-discount"
                type="number"
                value={editingTask?.discount || 0}
                onChange={(e) => setEditingTask({ ...editingTask, discount: Number(e.target.value) })}
                className="h-11 rounded-xl border-none bg-muted/30"
              />
            </div>
          </div>

          <div className="col-span-2 flex items-center justify-between rounded-3xl border border-primary/10 bg-primary/5 p-6">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-primary">Subtotal</p>
            </div>
            <span className="font-mono text-2xl font-black text-primary">
              ${((editingTask?.quantity || 0) * (editingTask?.unitPrice || 0) - (editingTask?.discount || 0)).toLocaleString()}
            </span>
          </div>
        </div>

        <DialogFooter className="border-t bg-muted/30 p-6">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="rounded-xl text-[10px] font-black uppercase"
          >
            Cancel
          </Button>
          <Button
            onClick={onSave}
            disabled={isUploading}
            className="rounded-xl px-8 text-[10px] font-black uppercase shadow-xl shadow-primary/20"
          >
            {isUploading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            {isUploading ? 'Uploading & Syncing...' : 'Sync to Cloud Sovereignty'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
