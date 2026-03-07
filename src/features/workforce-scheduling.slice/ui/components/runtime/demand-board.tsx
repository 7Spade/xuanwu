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
import { GripVertical } from 'lucide-react';
import { useState, useCallback, useMemo, useEffect } from 'react';

import { useApp } from '@/app-runtime/providers/app-provider';
import { useAccount } from '@/features/workspace.slice';
import { Card, CardContent, CardHeader, CardTitle } from '@/shadcn-ui/card';
import { ScrollArea } from '@/shadcn-ui/scroll-area';
import type { ScheduleItem } from '@/shared-kernel';
import type { DemandRowProps, OrgMember } from './demand-row';
import { DemandRow } from './demand-row';

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
