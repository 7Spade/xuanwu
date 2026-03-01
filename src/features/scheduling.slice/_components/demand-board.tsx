'use client';

/**
 * scheduling.slice — _components/demand-board.tsx
 *
 * Demand Board UI — org HR real-time view of open and assigned demands.
 *
 * Single source of truth: accounts/{orgId}/schedule_items.
 * All three schedule tabs (Calendar, DemandBoard, HR Governance) read from this
 * same collection — no separate projection collection required.
 *
 * Status mapping (FR-W0):
 *   PROPOSAL  → "待指派需求" (open / amber)
 *   OFFICIAL  → "已指派需求" (assigned / green)
 *   REJECTED / COMPLETED → hidden from board
 */

import { useState, useCallback, useMemo } from 'react';
import { useAccount } from '@/features/workspace.slice';
import {
  approveScheduleItemWithMember,
  updateScheduleItemStatus,
} from '../_actions';
import { useApp } from '@/shared/app-providers/app-context';
import { toast } from '@/shared/utility-hooks/use-toast';
import type { ScheduleItem } from '@/shared/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/shadcn-ui/card';
import { ScrollArea } from '@/shared/shadcn-ui/scroll-area';
import { Button } from '@/shared/shadcn-ui/button';
import { Badge } from '@/shared/shadcn-ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/shadcn-ui/select';
import { UserCheck, XCircle, Clock, CheckCircle2 } from 'lucide-react';
import type { Timestamp } from '@/shared/ports';
import type { SkillRequirement } from '@/features/shared-kernel';
import { SKILLS } from '@/shared/constants/skills';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTimestamp(ts: Timestamp | string | undefined): string {
  if (!ts) return '';
  if (typeof ts === 'string') return ts;
  if (typeof (ts as Timestamp).toDate === 'function') {
    return (ts as Timestamp).toDate().toLocaleDateString('zh-TW');
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
// Demand row — driven by ScheduleItem (single source of truth)
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
    <Badge variant="outline" className="shrink-0 border-amber-500 text-[9px] text-amber-600 uppercase tracking-widest">
      <Clock className="mr-1 size-2.5" /> 待指派
    </Badge>
  ) : (
    <Badge variant="outline" className="shrink-0 border-emerald-500 text-[9px] text-emerald-600 uppercase tracking-widest">
      <CheckCircle2 className="mr-1 size-2.5" /> 已指派
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
        toast({ title: '排程已指派', description: `「${item.title}」成員指派成功。` });
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
        toast({ title: '需求已取消', description: `「${item.title}」已由 HR 撤回。` });
      } else {
        toast({ variant: 'destructive', title: '取消失敗', description: result.error.message });
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
          <p className="text-sm font-semibold">{item.title}</p>
          <p className="text-xs text-muted-foreground">
            {formatTimestamp(item.startDate as unknown as Timestamp)} – {formatTimestamp(item.endDate as unknown as Timestamp)}
          </p>
          {assignedMemberNames && (
            <p className="text-xs text-emerald-600">指派給：{assignedMemberNames}</p>
          )}
        </div>
        {statusBadge}
      </div>

      {item.requiredSkills && item.requiredSkills.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {item.requiredSkills.map((req: SkillRequirement) => {
            const skillName = SKILLS.find((s) => s.slug === req.tagSlug)?.name ?? req.tagSlug;
            return (
              <Badge key={req.tagSlug} variant="secondary" className="text-[10px]">
                {skillName} ≥ {req.minimumTier} × {req.quantity}
              </Badge>
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
            title="手動指派"
          >
            <UserCheck className="size-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="size-8 shrink-0 text-destructive hover:text-destructive/80"
            disabled={loading}
            onClick={handleCancel}
            title="取消需求"
          >
            <XCircle className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Demand Board
// ---------------------------------------------------------------------------

/**
 * DemandBoard — real-time org demand board (FR-W0 + FR-W6).
 *
 * Reads directly from accounts/{orgId}/schedule_items via useAccount() —
 * the same collection used by the Calendar tab — so all three schedule
 * tabs always show consistent data with zero extra subscriptions.
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

  const openItems = useMemo(
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
    return (org?.members ?? []).map((m) => ({ id: m.id as string, name: m.name as string }));
  }, [orgId, accounts]);

  if (!orgId) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        需求看板僅在組織帳號下可用。
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {/* Open demands */}
      <Card>
        <CardHeader className="border-b py-3">
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-amber-600">
            待指派需求 ({openItems.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="max-h-96">
            <div className="space-y-3 p-4">
              {openItems.length === 0 && (
                <p className="py-6 text-center text-xs italic text-muted-foreground">
                  目前無待指派需求。
                </p>
              )}
              {openItems.map((item) => (
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

      {/* Assigned demands */}
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
                  目前無已指派需求。
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
