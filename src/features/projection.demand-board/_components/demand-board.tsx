'use client';

/**
 * projection.demand-board — _components/demand-board.tsx
 *
 * Demand Board UI — org HR real-time view of open and assigned demands.
 *
 * Per docs/prd-schedule-workforce-skills.md FR-W0:
 *   - Open + assigned demands are visible to org HR.
 *   - Closed demands are hidden from the default board view.
 *
 * Per GEMINI.md §2.3 D3/D5:
 *   Data mutations use Server Actions from account-organization.schedule/_actions.ts.
 *   This component reads from projection.demand-board (read model) — it does NOT
 *   call any aggregate directly.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { subscribeToDemandBoard } from '../_queries';
import {
  manualAssignScheduleMember,
  cancelScheduleProposalAction,
} from '@/features/account-organization.schedule';
import { useApp } from '@/shared/app-providers/app-context';
import { ROUTES } from '@/shared/constants/routes';
import { toast } from '@/shared/utility-hooks/use-toast';
import type { ScheduleDemand } from '@/shared/types';
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

// ---------------------------------------------------------------------------
// Named types (avoid inline type repetition)
// ---------------------------------------------------------------------------

/** Lightweight member descriptor used within the Demand Board. */
interface OrgMember {
  id: string;
  name: string;
}

// ---------------------------------------------------------------------------
// Demand row
// ---------------------------------------------------------------------------

interface DemandRowProps {
  demand: ScheduleDemand;
  orgMembers: OrgMember[];
  assignedBy: string;
}

function DemandRow({ demand, orgMembers, assignedBy }: DemandRowProps) {
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [loading, setLoading] = useState(false);

  const statusBadge =
    demand.status === 'open' ? (
      <Badge variant="outline" className="shrink-0 border-amber-500 text-[9px] text-amber-600 uppercase tracking-widest">
        <Clock className="mr-1 size-2.5" /> 待指派
      </Badge>
    ) : (
      <Badge variant="outline" className="shrink-0 border-emerald-500 text-[9px] text-emerald-600 uppercase tracking-widest">
        <CheckCircle2 className="mr-1 size-2.5" /> 已指派
      </Badge>
    );

  // Resolve assignedMemberId to a display name from the orgMembers projection.
  const assignedMemberName = useMemo(() => {
    if (!demand.assignedMemberId) return null;
    return orgMembers.find((m) => m.id === demand.assignedMemberId)?.name ?? demand.assignedMemberId;
  }, [demand.assignedMemberId, orgMembers]);

  const handleAssign = useCallback(async () => {
    if (!selectedMemberId) return;
    setLoading(true);
    try {
      const result = await manualAssignScheduleMember(
        demand.scheduleItemId,
        selectedMemberId,
        assignedBy,
        {
          workspaceId: demand.workspaceId,
          orgId: demand.orgId,
          title: demand.title,
          startDate: demand.startDate,
          endDate: demand.endDate,
        }
      );
      if (result.success) {
        toast({ title: '排程已指派', description: `「${demand.title}」成員指派成功。` });
        setSelectedMemberId('');
      } else {
        toast({
          variant: 'destructive',
          title: '指派失敗',
          description: result.error.message,
        });
      }
    } catch {
      toast({ variant: 'destructive', title: '操作失敗', description: '請稍後再試。' });
    } finally {
      setLoading(false);
    }
  }, [selectedMemberId, demand, assignedBy]);

  const handleCancel = useCallback(async () => {
    setLoading(true);
    try {
      const result = await cancelScheduleProposalAction(
        demand.scheduleItemId,
        demand.orgId,
        demand.workspaceId,
        assignedBy
      );
      if (result.success) {
        toast({ title: '需求已取消', description: `「${demand.title}」已由 HR 撤回。` });
      } else {
        toast({ variant: 'destructive', title: '取消失敗', description: result.error.message });
      }
    } catch {
      toast({ variant: 'destructive', title: '操作失敗', description: '請稍後再試。' });
    } finally {
      setLoading(false);
    }
  }, [demand.scheduleItemId, demand.orgId, demand.workspaceId, demand.title, assignedBy]);

  return (
    <div className="space-y-3 rounded-lg border bg-background p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <p className="text-sm font-semibold">{demand.title}</p>
          <p className="text-xs text-muted-foreground">
            {demand.startDate} – {demand.endDate}
          </p>
          {assignedMemberName && (
            <p className="text-xs text-emerald-600">指派給：{assignedMemberName}</p>
          )}
        </div>
        {statusBadge}
      </div>

      {/* Only show assign controls for open demands */}
      {demand.status === 'open' && (
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
 * Shows open (amber) and assigned (green) demands for the active org account.
 * HR can manually assign a member to an open demand (FR-W6) or cancel the demand.
 * Closed demands are not shown (FR-W0).
 */
export function DemandBoard() {
  const { state: appState } = useApp();
  const { activeAccount, accounts } = appState;
  const router = useRouter();

  const orgId =
    activeAccount?.accountType === 'organization' ? activeAccount.id : null;

  const [demands, setDemands] = useState<ScheduleDemand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeToDemandBoard(orgId, (d) => {
      setDemands(d);
      setLoading(false);
    });
    return unsub;
  }, [orgId]);

  const orgMembers = useMemo<OrgMember[]>(() => {
    if (!orgId) return [];
    const org = accounts[orgId];
    return (org?.members ?? []).map((m: OrgMember) => ({
      id: m.id,
      name: m.name,
    }));
  }, [orgId, accounts]);

  const assignedBy = activeAccount?.id ?? 'system';

  const openDemands = demands.filter((d) => d.status === 'open');
  const assignedDemands = demands.filter((d) => d.status === 'assigned');

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
            待指派需求 ({openDemands.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="max-h-96">
            <div className="space-y-3 p-4">
              {loading && (
                <p className="py-6 text-center text-xs italic text-muted-foreground">載入中…</p>
              )}
              {!loading && openDemands.length === 0 && (
                <div className="py-6 text-center">
                  <Clock className="mx-auto mb-2 size-5 text-muted-foreground opacity-40" />
                  <p className="text-xs font-medium text-muted-foreground">目前無待指派需求</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    HR 核准工作空間排程提案後，需求將自動顯示於此。
                  </p>
                  <Button
                    variant="link"
                    size="sm"
                    className="mt-1.5 h-auto p-0 text-[11px] font-bold uppercase tracking-widest"
                    onClick={() => router.push(ROUTES.ACCOUNT_ORG_SCHEDULE)}
                  >
                    前往 HR 治理面板 →
                  </Button>
                </div>
              )}
              {openDemands.map((d) => (
                <DemandRow
                  key={d.scheduleItemId}
                  demand={d}
                  orgMembers={orgMembers}
                  assignedBy={assignedBy}
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
            已指派需求 ({assignedDemands.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="max-h-64">
            <div className="space-y-3 p-4">
              {!loading && assignedDemands.length === 0 && (
                <p className="py-6 text-center text-xs italic text-muted-foreground">
                  目前無已指派需求。
                </p>
              )}
              {assignedDemands.map((d) => (
                <DemandRow
                  key={d.scheduleItemId}
                  demand={d}
                  orgMembers={orgMembers}
                  assignedBy={assignedBy}
                />
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
