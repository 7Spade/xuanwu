/**
 * Module: attachments-action.tsx
 * Purpose: render attachments action button in WBS task row
 * Responsibilities: provide clickable attachments icon action with count
 * Constraints: deterministic logic, respect module boundaries
 */

'use client';

import { Paperclip } from 'lucide-react';

import { Button } from '@/shared/shadcn-ui/button';

import { type TaskWithChildren } from '../_types';

type AttachmentsActionProps = {
  node: TaskWithChildren;
  onOpenAttachments: (node: TaskWithChildren) => void;
};

export function AttachmentsAction({ node, onOpenAttachments }: AttachmentsActionProps) {
  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="size-6 rounded-md text-primary"
        onClick={() => onOpenAttachments(node)}
        title="View attachments"
        aria-label="View attachments"
      >
        <Paperclip className="size-3.5" />
      </Button>
      <span className="text-[9px] font-semibold text-muted-foreground">{node.photoURLs?.length ?? 0}</span>
    </>
  );
}
