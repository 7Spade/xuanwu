/**
 * Module: attachments-dialog.tsx
 * Purpose: render standalone attachments dialog for WBS Governance
 * Responsibilities: list attachment thumbnails and emit preview action
 * Constraints: deterministic logic, respect module boundaries
 */

'use client';

import { Loader2, UploadCloud, X } from 'lucide-react';
import Image from 'next/image';

import { Button } from '@/shared/shadcn-ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/shadcn-ui/dialog';

type AttachmentsDialogProps = {
  isOpen: boolean;
  attachments: string[];
  files: File[];
  onFilesSelected: (files: FileList | null) => void;
  onRemoveFile: (index: number) => void;
  onSave: () => void;
  isSaving: boolean;
  onOpenChange: (open: boolean) => void;
  onPreviewImage: (url: string) => void;
};

export function AttachmentsDialog({
  isOpen,
  attachments,
  files,
  onFilesSelected,
  onRemoveFile,
  onSave,
  isSaving,
  onOpenChange,
  onPreviewImage,
}: AttachmentsDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-xl">
        <DialogHeader>
          <DialogTitle>Attachments</DialogTitle>
          <DialogDescription>Upload and manage attachments directly in WBS Governance.</DialogDescription>
        </DialogHeader>

        <input
          id="attachments-upload"
          type="file"
          multiple
          accept="image/*"
          className="sr-only"
          onChange={(event) => onFilesSelected(event.target.files)}
        />

        <Button asChild variant="outline" className="h-10 w-full cursor-pointer rounded-lg border-dashed">
          <label htmlFor="attachments-upload">
            <UploadCloud className="mr-2 size-4" /> Upload Images
          </label>
        </Button>

        <div className="grid grid-cols-4 gap-3">
          {attachments.map((url, index) => (
            <button
              key={`${url}-${index}`}
              onClick={() => onPreviewImage(url)}
              className="relative aspect-square overflow-hidden rounded-lg border transition-opacity hover:opacity-80"
            >
              <Image src={url} alt={`Attachment ${index + 1}`} fill sizes="200px" className="object-cover" />
            </button>
          ))}

          {files.map((file, index) => (
            <div key={`new-${index}`} className="group relative aspect-square overflow-hidden rounded-lg border">
              <Image src={URL.createObjectURL(file)} alt={`New attachment ${index + 1}`} fill sizes="200px" className="object-cover" />
              <Button
                variant="destructive"
                size="icon"
                className="absolute right-1 top-1 size-5 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={() => onRemoveFile(index)}
              >
                <X className="size-3" />
              </Button>
            </div>
          ))}
        </div>

        <Button asChild variant="outline" className="h-10 w-full cursor-pointer rounded-lg border-dashed">
          <label htmlFor="attachments-upload">
            <UploadCloud className="mr-2 size-4" /> Upload Images
          </label>
        </Button>

        <div className="flex justify-end">
          <Button onClick={onSave} disabled={isSaving} className="rounded-lg">
            {isSaving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            {isSaving ? 'Saving...' : 'Save Attachments'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
