'use client';

/**
 * projection.demand-board — _components/demand-board.tsx
 *
 * Demand Board UI — org HR real-time view of open, assigned, and (optionally) closed demands.
 *
 * Per docs/prd-schedule-workforce-skills.md FR-W0:
 *   - Open + assigned demands are visible to org HR by default.
 *   - Closed demands are hidden from the default board view but can be toggled on.
 *
 * Per GEMINI.md §2.3 D3/D5:
 *   Data mutations use Server Actions from account-organization.schedule/_actions.ts.
 *   This component reads from projection.demand-board (read model) — it does NOT
 *   call any aggregate directly.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { subscribeToDemandBoard, subscribeToAllDemands } from '../_queries';
import {
  manualAssignScheduleMember,
  cancelScheduleProposalAction,
  cancelOrgScheduleAssignmentAction,
} from '@/features/account-organization.schedule';
import { useApp } from '@/shared/app-providers/app-context';
import { ROUTES } from '@/shared/constants/routes';
import { toast } from '@/shared/utility-hooks/use-toast';
import type { ScheduleDemand } from '@/shared/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/shadcn-ui/card';
import { ScrollArea } from '@/shared/shadcn-ui/scroll-area';
import { Button } from '@/shared/shadcn-ui/button';
import { Badge } from '@/shared/shadcn-ui/badge';
import { Switch } from '@/shared/shadcn-ui/switch';
import { Label } from '@/shared/shadcn-ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/shadcn-ui/select';
import { UserCheck, XCircle, Clock, CheckCircle2, Inbox, UserMinus } from 'lucide-react';
import { subscribeToOrgMembers } from '@/features/account-organization.member';
import type { MemberReference } from '@/shared/types';
import { getOrgEligibleMembersWithTier } from '@/features/projection.org-eligible-member-view';
import type { OrgEligibleMemberView } from '@/features/projection.org-eligible-member-view';
import { tierSatisfies } from '@/features/shared.kernel.skill-tier';
import type { SkillRequirement } from '@/shared/types';

// ---------------------------------------------------------------------------
// Named types (avoid inline type repetition)
// ---------------------------------------------------------------------------

/** Lightweight member descriptor used within the Demand Board. */
interface OrgMember {
  id: string;
  name: string;
}

// ---------------------------------------------------------------------------
// FR-W7 — Skill match helper (mirrors org-schedule-governance.tsx §FR-W2)
// ---------------------------------------------------------------------------

/**
 * Returns [matched, total] skill requirements satisfied by the given member.
 * Uses tierSatisfies() from shared.kernel.skill-tier to compare against
 * canonical SkillTier values ('apprentice'..'titan'), not ad-hoc strings.
 */
function computeSkillMatch(
  member: OrgEligibleMemberView,
  skillRequirements?: SkillRequirement[]
): [number, number] {
  if (!skillRequirements || skillRequirements.length === 0) return [0, 0];
  const matched = skillRequirements.filter((req) => {
    const skill = member.skills.find((s) => s.skillId === req.tagSlug);
    if (!skill) return false;
    return tierSatisfies(skill.tier, req.minimumTier);
  }).length;
  return [matched, skillRequirements.length];
}

// ---------------------------------------------------------------------------
// Demand row
// ---------------------------------------------------------------------------

interface DemandRowProps {
  demand: ScheduleDemand;
  orgMembers: OrgMember[];
  assignedBy: string;
  /** FR-W7: Eligible member projections — used to compute per-member skill match. */
  eligibleMembers: OrgEligibleMemberView[];
}

function DemandRow({ demand, orgMembers, assignedBy, eligibleMembers }: DemandRowProps) {
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [loading, setLoading] = useState(false);

  // FR-W7: selected member's skill match against this demand's requirements.
  const selectedMemberSkillMatch = useMemo<[number, number] | null>(() => {
    if (!selectedMemberId || !demand.requiredSkills?.length) return null;
    const view = eligibleMembers.find((m) => m.accountId === selectedMemberId);
    if (!view) return null;
    return computeSkillMatch(view, demand.requiredSkills);
  }, [selectedMemberId, eligibleMembers, demand.requiredSkills]);

  const statusBadge =
    demand.status === 'open' ? (
      <Badge variant="outline" className="shrink-0 border-amber-500 text-[9px] text-amber-600 uppercase tracking-widest">
        <Clock className="mr-1 size-2.5" /> 待指派
      </Badge>
    ) : demand.status === 'assigned' ? (
      <Badge variant="outline" className="shrink-0 border-emerald-500 text-[9px] text-emerald-600 uppercase tracking-widest">
        <CheckCircle2 className="mr-1 size-2.5" /> 已指派
      </Badge>
    ) : (
      <Badge variant="outline" className="shrink-0 border-muted-foreground/50 text-[9px] text-muted-foreground uppercase tracking-widest">
        已結束
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
          proposedBy: demand.proposedBy,
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

  const handleCancelAssignment = useCallback(async () => {
    if (!demand.assignedMemberId) return;
    setLoading(true);
    try {
      const result = await cancelOrgScheduleAssignmentAction(
        demand.scheduleItemId,
        demand.orgId,
        demand.workspaceId,
        demand.assignedMemberId,
        assignedBy
      );
      if (result.success) {
        toast({ title: '指派已撤銷', description: `「${demand.title}」指派已由 HR 撤回，成員資格已恢復。` });
      } else {
        toast({ variant: 'destructive', title: '撤銷失敗', description: result.error.message });
      }
    } catch {
      toast({ variant: 'destructive', title: '操作失敗', description: '請稍後再試。' });
    } finally {
      setLoading(false);
    }
  }, [demand, assignedBy]);

  return (
    <div className="space-y-3 rounded-lg border bg-background p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <p className="text-sm font-semibold">{demand.title}</p>
          {demand.workspaceName && (
            <p className="text-[11px] text-muted-foreground font-medium">{demand.workspaceName}</p>
          )}
          <p className="text-xs text-muted-foreground">
            {demand.startDate} – {demand.endDate}
          </p>
          {assignedMemberName && (
            <p className="text-xs text-emerald-600">指派給：{assignedMemberName}</p>
          )}
          {demand.status === 'closed' && demand.closeReason && (
            <p className="text-[11px] text-muted-foreground">結束原因：{demand.closeReason}</p>
          )}
        </div>
        {statusBadge}
      </div>

      {/* Only show assign controls for open demands */}
      {demand.status === 'open' && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
              <SelectTrigger className="h-8 flex-1 text-xs">
                <SelectValue placeholder="選擇指派成員" />
              </SelectTrigger>
              <SelectContent>
                {orgMembers.map((m) => {
                  // FR-W7: compute skill match for each selectable member
                  const view = eligibleMembers.find((ev) => ev.accountId === m.id);
                  const match = view && demand.requiredSkills?.length
                    ? computeSkillMatch(view, demand.requiredSkills)
                    : null;
                  return (
                    <SelectItem key={m.id} value={m.id} className="text-xs">
                      <span className="flex items-center gap-1.5">
                        <span>{m.name}</span>
                        {match !== null && (
                          <span className={`text-[9px] font-semibold tabular-nums ${match[0] === match[1] ? 'text-emerald-600' : match[0] > 0 ? 'text-amber-600' : 'text-red-500'}`}>
                            {match[0]}/{match[1]}
                          </span>
                        )}
                      </span>
                    </SelectItem>
                  );
                })}
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
          {/* FR-W7: show selected member's skill-match score */}
          {selectedMemberSkillMatch !== null && (
            <p className={`text-[11px] ${selectedMemberSkillMatch[0] === selectedMemberSkillMatch[1] ? 'text-emerald-600' : selectedMemberSkillMatch[0] > 0 ? 'text-amber-600' : 'text-red-500'}`}>
              技能符合：{selectedMemberSkillMatch[0]} / {selectedMemberSkillMatch[1]} 項
            </p>
          )}
        </div>
      )}

      {/* Show cancel-assignment control for assigned demands (FR-S7) */}
      {demand.status === 'assigned' && demand.assignedMemberId && (
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1 px-2 text-[11px] text-destructive hover:text-destructive/80"
            disabled={loading}
            onClick={handleCancelAssignment}
          >
            <UserMinus className="size-3.5" />
            撤銷指派
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
 * DemandBoard — real-time org demand board (FR-W0 + FR-W6 + FR-S7).
 *
 * Shows open (amber) and assigned (green) demands for the active org account.
 * HR can manually assign a member to an open demand (FR-W6) or cancel the demand.
 * Assigned demands can be cancelled (FR-S7) with a "撤銷指派" button.
 * Closed demands are hidden by default but can be revealed via the "顯示已結束" toggle (FR-W0).
 */
export function DemandBoard() {
  const { state: appState } = useApp();
  const { activeAccount } = appState;
  const router = useRouter();

  const orgId =
    activeAccount?.accountType === 'organization' ? activeAccount.id : null;

  const [demands, setDemands] = useState<ScheduleDemand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showClosed, setShowClosed] = useState(false);

  useEffect(() => {
    if (!orgId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = showClosed
      ? subscribeToAllDemands(orgId, (d) => { setDemands(d); setLoading(false); })
      : subscribeToDemandBoard(orgId, (d) => { setDemands(d); setLoading(false); });
    return unsub;
  }, [orgId, showClosed]);

  const [orgMembers, setOrgMembers] = useState<OrgMember[]>([]);
  useEffect(() => {
    if (!orgId) { setOrgMembers([]); return; }
    const unsub = subscribeToOrgMembers(orgId, (members: MemberReference[]) => {
      setOrgMembers(members.map((m) => ({ id: m.id, name: m.name })));
    });
    return unsub;
  }, [orgId]);

  // FR-W7: Load eligible member projections for skill-match display in DemandRow.
  const [eligibleMembers, setEligibleMembers] = useState<OrgEligibleMemberView[]>([]);
  useEffect(() => {
    if (!orgId) { setEligibleMembers([]); return; }
    getOrgEligibleMembersWithTier(orgId).then(setEligibleMembers).catch(() => setEligibleMembers([]));
  }, [orgId]);

  const assignedBy = activeAccount?.id ?? 'system';

  const openDemands = demands.filter((d) => d.status === 'open');
  const assignedDemands = demands.filter((d) => d.status === 'assigned');
  const closedDemands = demands.filter((d) => d.status === 'closed');

  if (!orgId) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        需求看板僅在組織帳號下可用。
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex items-center justify-end gap-2">
        <Label htmlFor="show-closed-toggle" className="text-xs text-muted-foreground cursor-pointer select-none">
          顯示已結束需求
        </Label>
        <Switch
          id="show-closed-toggle"
          checked={showClosed}
          onCheckedChange={setShowClosed}
        />
      </div>

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
                  <Inbox className="mx-auto mb-2 size-5 text-muted-foreground opacity-40" />
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
                  eligibleMembers={eligibleMembers}
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
                  eligibleMembers={eligibleMembers}
                />
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Closed demands — only shown when toggle is on (FR-W0) */}
      {showClosed && (
        <Card>
          <CardHeader className="border-b py-3">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
              已結束需求 ({closedDemands.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="max-h-64">
              <div className="space-y-3 p-4">
                {!loading && closedDemands.length === 0 && (
                  <p className="py-6 text-center text-xs italic text-muted-foreground">
                    目前無已結束需求。
                  </p>
                )}
                {closedDemands.map((d) => (
                  <DemandRow
                    key={d.scheduleItemId}
                    demand={d}
                    orgMembers={orgMembers}
                    assignedBy={assignedBy}
                    eligibleMembers={eligibleMembers}
                  />
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
