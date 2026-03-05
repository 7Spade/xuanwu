/**
 * Module: task-tree-node
 * Purpose: Render recursive WBS task nodes
 * Responsibilities: task tree row UI, expand/collapse, node actions, recursive children rendering
 * Constraints: deterministic logic, respect module boundaries
 */

'use client';

import { CalendarPlus, ChevronDown, ChevronRight, ClipboardPlus, OctagonX, Plus, Send, Settings2, Trash2 } from 'lucide-react';

import { Badge } from '@/shared/shadcn-ui/badge';
import { Button } from '@/shared/shadcn-ui/button';
import { Progress } from '@/shared/shadcn-ui/progress';
import { cn } from '@/shared/shadcn-ui/utils/utils';

import { type TaskWithChildren, type WorkspaceTask } from '../_types';

import { AttachmentsAction } from './attachments-action';
import { LocationAction } from './location-action';

interface TaskTreeNodeProps {
  node: TaskWithChildren;
  level?: number;
  expandedIds: Set<string>;
  setExpandedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  visibleColumns: Set<string>;
  onPreviewImage: (url: string) => void;
  onOpenLocation: (node: TaskWithChildren) => void;
  onOpenAttachments: (node: TaskWithChildren) => void;
  onReportProgress: (node: TaskWithChildren) => void;
  onScheduleRequest: (node: WorkspaceTask) => void;
  onMarkBlocked: (node: TaskWithChildren) => void;
  onCreateChild: (node: TaskWithChildren) => void;
  onEditNode: (node: TaskWithChildren) => void;
  onDeleteNode: (node: TaskWithChildren) => void;
  onSubmitForQA: (node: TaskWithChildren) => void;
}

export function TaskTreeNode({
  node,
  level = 0,
  expandedIds,
  setExpandedIds,
  visibleColumns,
  onPreviewImage,
  onOpenLocation,
  onOpenAttachments,
  onReportProgress,
  onScheduleRequest,
  onMarkBlocked,
  onCreateChild,
  onEditNode,
  onDeleteNode,
  onSubmitForQA,
}: TaskTreeNodeProps) {
  const isExpanded = expandedIds.has(node.id);
  const hasChildren = node.children.length > 0;
  const isViolating = node.descendantSum > node.subtotal;

  return (
    <div className="duration-300 animate-in slide-in-from-left-2">
      <div
        className={cn(
          'group flex items-center gap-3 p-3 rounded-2xl border transition-all mb-1',
          isViolating
            ? 'bg-destructive/5 border-destructive/30'
            : 'bg-card/40 border-border/60 hover:border-primary/40',
          level > 0 &&
            'ml-8 relative before:absolute before:left-[-20px] before:top-[-10px] before:bottom-[50%] before:w-[1.5px] before:bg-primary/20 after:absolute after:left-[-20px] after:top-[50%] after:w-[15px] after:h-[1.5px] after:bg-primary/20'
        )}
      >
        <button
          onClick={() => {
            const next = new Set(expandedIds);
            if (next.has(node.id)) next.delete(node.id);
            else next.add(node.id);
            setExpandedIds(next);
          }}
          className={cn(
            'p-1 hover:bg-primary/10 rounded-lg transition-colors',
            !hasChildren && 'opacity-0 pointer-events-none'
          )}
        >
          {isExpanded ? (
            <ChevronDown className="size-3.5 text-primary" />
          ) : (
            <ChevronRight className="size-3.5 text-primary" />
          )}
        </button>

        <div className="grid flex-1 grid-cols-12 items-center gap-3">
          <div className="col-span-4 flex items-center gap-2">
            <span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[9px] font-black text-primary">
              {node.wbsNo}
            </span>
            <div className="flex flex-1 flex-col truncate">
              <p className="truncate text-xs font-black tracking-tight">{node.name}</p>
            </div>
          </div>

          <div className="col-span-8 grid grid-cols-8 items-center gap-2">
            {visibleColumns.has('type') && (
              <div className="truncate text-[9px] font-bold uppercase text-muted-foreground">{node.type}</div>
            )}
            {visibleColumns.has('priority') && (
              <Badge
                variant="outline"
                className={cn('text-[7px] h-4 px-1 uppercase w-fit', node.priority === 'high' ? 'border-red-500/50 text-red-500' : '')}
              >
                {node.priority}
              </Badge>
            )}
            {visibleColumns.has('location') && (
              <div className="flex items-center gap-1 truncate text-[9px] text-muted-foreground">
                <LocationAction node={node} onOpenLocation={onOpenLocation} />
                <span className="truncate">
                  {[node.location?.building, node.location?.floor, node.location?.room, node.location?.description]
                    .filter(Boolean)
                    .join(' / ') || '—'}
                </span>
              </div>
            )}
            {visibleColumns.has('attachments') && (
              <div className="flex items-center justify-end gap-1">
                <AttachmentsAction node={node} onOpenAttachments={onOpenAttachments} />
              </div>
            )}
            {visibleColumns.has('discount') && (
              <div className="text-right">
                <p className="text-[8px] font-black uppercase leading-none text-muted-foreground">Discount</p>
                <p className="text-[10px] font-bold text-destructive">-${(node.discount || 0).toLocaleString()}</p>
              </div>
            )}
            {visibleColumns.has('subtotal') && (
              <div className="text-right">
                <p className="text-[8px] font-black uppercase leading-none text-muted-foreground">Budget</p>
                <p className={cn('text-[10px] font-bold', isViolating ? 'text-destructive' : 'text-primary')}>
                  ${node.subtotal?.toLocaleString()}
                </p>
              </div>
            )}
            {visibleColumns.has('progress') && (
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Progress value={node.progress || 0} className="h-1 flex-1" />
                  <span className="text-[8px] font-black">{node.progress || 0}%</span>
                </div>
                {(node.quantity ?? 1) > 1 && (
                  <span className="text-right font-mono text-[9px] font-bold text-muted-foreground">
                    {node.completedQuantity || 0} / {node.quantity}
                  </span>
                )}
              </div>
            )}
            {visibleColumns.has('status') && (
              <div className="flex items-center justify-end">
                {node.progress === 100 && ['todo', 'doing'].includes(node.progressState) ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 rounded-lg text-blue-500 hover:bg-blue-500/10 hover:text-blue-500"
                    onClick={() => onSubmitForQA(node)}
                    title="Submit for QA"
                  >
                    <Send className="size-4" />
                  </Button>
                ) : (
                  <div
                    className={cn(
                      'w-2 h-2 rounded-full self-center',
                      node.progressState === 'completed'
                        ? 'bg-blue-500'
                        : node.progressState === 'verified'
                        ? 'bg-purple-500'
                        : node.progressState === 'accepted'
                        ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]'
                        : node.progressState === 'blocked'
                        ? 'bg-red-500'
                        : 'bg-amber-500'
                    )}
                  />
                )}
              </div>
            )}
          </div>
        </div>

        <div className="ml-2 flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-7 rounded-lg text-primary"
            onClick={() => onCreateChild(node)}
            title="Split into sub-tasks"
            aria-label="Split into sub-tasks"
          >
            <Plus className="size-3.5" />
          </Button>
          {(node.quantity ?? 1) > 1 && !hasChildren && (
            <Button
              variant="ghost"
              size="icon"
              className="size-7 rounded-lg text-primary"
              onClick={() => onReportProgress(node)}
              title="Report progress"
              aria-label="Report progress"
            >
              <ClipboardPlus className="size-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="size-7 rounded-lg text-primary"
            onClick={() => onScheduleRequest(node)}
            title="Send schedule request"
            aria-label="Send schedule request"
          >
            <CalendarPlus className="size-3.5" />
          </Button>
          {['todo', 'doing'].includes(node.progressState) && (
            <Button
              variant="ghost"
              size="icon"
              className="size-7 rounded-lg text-destructive"
              onClick={() => onMarkBlocked(node)}
              title="Mark as Blocked (B-Track)"
            >
              <OctagonX className="size-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="size-7 rounded-lg text-primary"
            onClick={() => onEditNode(node)}
            title="Edit node"
            aria-label="Edit node"
          >
            <Settings2 className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 rounded-lg text-destructive"
            onClick={() => onDeleteNode(node)}
            title="Delete node"
            aria-label="Delete node"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>

      {isExpanded && hasChildren && (
        <div className="space-y-0.5">
          {node.children.map((child) => (
            <TaskTreeNode
              key={child.id}
              node={child}
              level={level + 1}
              expandedIds={expandedIds}
              setExpandedIds={setExpandedIds}
              visibleColumns={visibleColumns}
              onPreviewImage={onPreviewImage}
              onOpenLocation={onOpenLocation}
              onOpenAttachments={onOpenAttachments}
              onReportProgress={onReportProgress}
              onScheduleRequest={onScheduleRequest}
              onMarkBlocked={onMarkBlocked}
              onCreateChild={onCreateChild}
              onEditNode={onEditNode}
              onDeleteNode={onDeleteNode}
              onSubmitForQA={onSubmitForQA}
            />
          ))}
        </div>
      )}
    </div>
  );
}
