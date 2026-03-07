'use client';

/**
 * workforce-scheduling.slice ??_components/demand-board.tsx
 *
 * Demand Board UI ??org HR real-time view of open and assigned demands.
 *
 * Single source of truth: accounts/{orgId}/schedule_items.
 * All three schedule tabs (Calendar, DemandBoard, HR Governance) read from this
 * same collection ??no separate projection collection required.
 *
 * Status mapping (FR-W0):
 *   PROPOSAL  = "待指派需求" (open / amber), drag-sortable for HR prioritisation
 *   OFFICIAL  = "已指派需求" (assigned / green)
 *   REJECTED / COMPLETED ??hidden from board
 */

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, UserCheck, XCircle, Clock, CheckCircle2 } from 'lucide-react';
import { useState, useCallback, useMemo, useEffect } from 'react';

import { useApp } from '@/app-runtime/providers/app-provider';
import { useAccount } from '@/features/workspace.slice';
import { Badge } from '@/shadcn-ui/badge';
import { Button } from '@/shadcn-ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shadcn-ui/card';
import { toast } from '@/shadcn-ui/hooks/use-toast';
import { ScrollArea } from '@/shadcn-ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shadcn-ui/select';
import type { ScheduleItem } from '@/shared-kernel';
import type { SkillRequirement } from '@/shared-kernel';
import { SKILLS } from '@/shared-kernel/constants/skills';
import type { Timestamp } from '@/shared-kernel/ports';

import {
  approveScheduleItemWithMember,
  updateScheduleItemStatus,
} from '../_actions';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type TimestampLike = { toDate: () => Date };

function isTimestampLike(value: unknown): value is TimestampLike {
  return typeof value === 'object' && value !== null && 'toDate' in value && typeof value.toDate === 'function';
}

function formatTimestamp(ts: Timestamp | string | undefined): string {
  if (!ts) return '';
  if (typeof ts === 'string') return ts;
  if (isTimestampLike(ts)) {
    return ts.toDate().toLocaleDateString('zh-TW');
  }
  return String(ts);
}

// ---------------------------------------------------------------------------
// Named types
// ---------------------------------------------------------------------------

interface OrgMember {
  id: string;
  name: string;
}

// ---------------------------------------------------------------------------
// Demand row ??driven by ScheduleItem (single source of truth)
// ---------------------------------------------------------------------------

interface DemandRowProps {
  item: ScheduleItem;
  orgMembers: OrgMember[];
  orgId: string;
}

function DemandRow({ item, orgMembers, orgId }: DemandRowProps) {
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [loading, setLoading] = useState(false);

  const isOpen = item.status === 'PROPOSAL';

  const statusBadge = isOpen ? (
    <Badge variant="outline" className="shrink-0 border-amber-500 text-[9px] uppercase tracking-widest text-amber-600">
      <Clock className="mr-1 size-2.5" /> 待處理
    </Badge>
  ) : (
    <Badge variant="outline" className="shrink-0 border-emerald-500 text-[9px] uppercase tracking-widest text-emerald-600">
      <CheckCircle2 className="mr-1 size-2.5" /> 已處理
    </Badge>
  );

  const assignedMemberNames = useMemo(() => {
    if (!item.assigneeIds?.length) return null;
    return item.assigneeIds
      .map((id) => orgMembers.find((m) => m.id === id)?.name ?? id)
      .join('、');
  }, [item.assigneeIds, orgMembers]);

  const handleAssign = useCallback(async () => {
    if (!selectedMemberId) return;
    setLoading(true);
    try {
      const result = await approveScheduleItemWithMember(orgId, item.id, selectedMemberId);
      if (result.success) {
        toast({ title: '指派已完成', description: `${item.title} 已成功指派。` });
        setSelectedMemberId('');
      } else {
        toast({ variant: 'destructive', title: '指派失敗', description: result.error.message });
      }
    } catch {
      toast({ variant: 'destructive', title: '操作失敗', description: '請稍後再試。' });
    } finally {
      setLoading(false);
    }
  }, [selectedMemberId, orgId, item.id, item.title]);

  const handleCancel = useCallback(async () => {
    setLoading(true);
    try {
      const result = await updateScheduleItemStatus(orgId, item.id, 'REJECTED');
      if (result.success) {
        toast({ title: '請求已取消', description: `${item.title} 已通知 HR 更新狀態。` });
      } else {
        toast({ variant: 'destructive', title: '操作失敗', description: result.error.message });
      }
    } catch {
      toast({ variant: 'destructive', title: '操作失敗', description: '請稍後再試。' });
    } finally {
      setLoading(false);
    }
  }, [orgId, item.id, item.title]);

  return (
    <div className="space-y-3 rounded-lg border bg-background p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <p className="text-sm font-semibold">
            {item.workspaceName ? (
              <><span className="text-muted-foreground">{item.workspaceName}</span><span className="mx-0.5 text-muted-foreground">-</span>{item.title}</>
            ) : (
              item.title
            )}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatTimestamp(item.startDate)} 至 {formatTimestamp(item.endDate)}
          </p>
          {assignedMemberNames && (
            <p className="text-xs text-emerald-600">已指派給：{assignedMemberNames}</p>
          )}
        </div>
        {statusBadge}
      </div>

      {item.requiredSkills && item.requiredSkills.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {item.requiredSkills.map((req: SkillRequirement) => {
            const skillName = SKILLS.find((s) => s.slug === req.tagSlug)?.name ?? req.tagSlug;
            return (
              <div key={req.tagSlug} className="flex items-center gap-2">
                <Badge variant="secondary" className="text-[10px]">
                  {skillName} 最低 {req.minimumTier} × {req.quantity}
                </Badge>
              </div>
            );
          })}
        </div>
      )}

      {isOpen && (
        <div className="flex items-center gap-2">
          <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
            <SelectTrigger className="h-8 flex-1 text-xs">
              <SelectValue placeholder="選擇指派成員" />
            </SelectTrigger>
            <SelectContent>
              {orgMembers.map((m) => (
                <SelectItem key={m.id} value={m.id} className="text-xs">
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="icon"
            variant="ghost"
            className="size-8 shrink-0 text-emerald-600 hover:text-emerald-700"
            disabled={!selectedMemberId || loading}
            onClick={handleAssign}
            title="確認指派"
          >
            <UserCheck className="size-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="size-8 shrink-0 text-destructive hover:text-destructive/80"
            disabled={loading}
            onClick={handleCancel}
            title="取消請求"
          >
            <XCircle className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SortableDemandRow ??thin wrapper that adds drag-handle affordance
// ---------------------------------------------------------------------------

function SortableDemandRow(props: DemandRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.item.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div className="flex items-start gap-1">
        {/* Drag handle: only activates drag; does not capture clicks. */}
        <button
          {...attributes}
          {...listeners}
          className="mt-5 cursor-grab touch-none text-muted-foreground hover:text-foreground focus:outline-none active:cursor-grabbing"
          aria-label="拖曳排序"
          type="button"
        >
          <GripVertical className="size-4" />
        </button>
        <div className="min-w-0 flex-1">
          <DemandRow {...props} />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Demand Board
// ---------------------------------------------------------------------------

/**
 * DemandBoard ??real-time org demand board (FR-W0 + FR-W6).
 *
 * Reads directly from accounts/{orgId}/schedule_items via useAccount() ??
 * the same collection used by the Calendar tab ??so all three schedule
 * tabs always show consistent data with zero extra subscriptions.
 *
 * "待指派需求" cards are drag-sortable so HR can prioritise visually.
 * The sort order is local-only (no server write required for reordering).
 */
export function DemandBoard() {
  const { state: appState } = useApp();
  const { activeAccount, accounts } = appState;
  const { state: accountState } = useAccount();

  const orgId =
    activeAccount?.accountType === 'organization' ? activeAccount.id : null;

  const allItems = useMemo(
    () => Object.values(accountState.schedule_items),
    [accountState.schedule_items]
  );

  const openItemsFromStore = useMemo(
    () => allItems.filter((i) => i.status === 'PROPOSAL'),
    [allItems]
  );
  const assignedItems = useMemo(
    () => allItems.filter((i) => i.status === 'OFFICIAL'),
    [allItems]
  );

  const orgMembers = useMemo<OrgMember[]>(() => {
    if (!orgId) return [];
    const org = accounts[orgId];
    return (org?.members ?? []).map((member) => ({
      id: String(member.id),
      name: member.name ? String(member.name) : String(member.id),
    }));
  }, [orgId, accounts]);

  // ---------------------------------------------------------------------------
  // Local drag-to-prioritise order for open demands.
  // null means "use store order".  Reset whenever items are added/removed so
  // new PROPOSAL entries automatically appear and deleted ones disappear.
  // ---------------------------------------------------------------------------
  const [openOrder, setOpenOrder] = useState<string[] | null>(null);

  useEffect(() => {
    // When the canonical set of PROPOSAL item IDs changes (add/remove), discard
    // the local order so the board reflects the live store state.
    setOpenOrder(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openItemsFromStore.map((i) => i.id).join(',')]);

  const openItems = useMemo<ScheduleItem[]>(() => {
    const ids = openOrder ?? openItemsFromStore.map((i) => i.id);
    const byId = new Map(openItemsFromStore.map((i) => [i.id, i]));
    return ids
      .map((id) => byId.get(id))
      .filter((item): item is ScheduleItem => item !== undefined);
  }, [openItemsFromStore, openOrder]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const ids = openItems.map((i) => i.id);
      const oldIndex = ids.indexOf(String(active.id));
      const newIndex = ids.indexOf(String(over.id));
      if (oldIndex === -1 || newIndex === -1) return;
      setOpenOrder(arrayMove(ids, oldIndex, newIndex));
    },
    [openItems]
  );

  if (!orgId) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        需使用組織帳號才能使用此功能
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {/* Open demands ??drag-sortable for HR prioritisation */}
      <Card>
        <CardHeader className="border-b py-3">
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-amber-600">
            待指派需求 ({openItems.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="max-h-96">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={openItems.map((i) => i.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3 p-4">
                  {openItems.length === 0 && (
                    <p className="py-6 text-center text-xs italic text-muted-foreground">
                      目前沒有待指派需求
                    </p>
                  )}
                  {openItems.map((item) => (
                    <SortableDemandRow
                      key={item.id}
                      item={item}
                      orgMembers={orgMembers}
                      orgId={orgId}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Assigned demands ??static list */}
      <Card>
        <CardHeader className="border-b py-3">
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-emerald-600">
            已指派需求 ({assignedItems.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="max-h-64">
            <div className="space-y-3 p-4">
              {assignedItems.length === 0 && (
                <p className="py-6 text-center text-xs italic text-muted-foreground">
                  目前沒有已指派需求
                </p>
              )}
              {assignedItems.map((item) => (
                <DemandRow
                  key={item.id}
                  item={item}
                  orgMembers={orgMembers}
                  orgId={orgId}
                />
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
