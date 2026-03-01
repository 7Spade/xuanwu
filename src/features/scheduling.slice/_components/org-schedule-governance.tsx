'use client';

/**
 * account-organization.schedule — _components/org-schedule-governance.tsx
 *
 * Org HR governance panel for reviewing and acting on schedule items.
 *
 * Single source of truth: accounts/{orgId}/schedule_items.
 * Reads the same collection as the Calendar tab — all three schedule tabs
 * (Calendar, DemandBoard, HR Governance) are always consistent.
 *
 * Status mapping:
 *   PROPOSAL   → 待核准 (pending assignment / amber)
 *   OFFICIAL   → 已確認 (assigned, can be marked complete / green)
 *   COMPLETED  → hidden (completed)
 *   REJECTED   → hidden (cancelled/rejected)
 *
 * FR-S6: Confirmed proposals section — HR marks confirmed assignments as completed.
 * FR-W2: Skill match indicators — show per-member skill match against item requirements.
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useApp } from '@/shared/app-providers/app-context';
import { useAccount } from '@/features/workspace-core';
import {
  approveScheduleItemWithMember,
  updateScheduleItemStatus,
} from '../_actions';
import { toast } from '@/shared/utility-hooks/use-toast';
import type { ScheduleItem } from '@/shared/types';
import type { SkillRequirement } from '@/features/shared.kernel.skill-tier';
import { getOrgEligibleMembersWithTier } from '@/features/projection.org-eligible-member-view';
import type { OrgEligibleMemberView } from '@/features/projection.org-eligible-member-view';
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
import { CheckCircle, XCircle, Users, Flag } from 'lucide-react';
import type { Timestamp } from 'firebase/firestore';
import { tierSatisfies } from '@/features/shared.kernel.skill-tier';
import type { SkillTier } from '@/features/shared.kernel.skill-tier';

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
// FR-W2 — Skill match helper
// ---------------------------------------------------------------------------

function computeSkillMatch(
  member: OrgEligibleMemberView,
  skillRequirements?: SkillRequirement[]
): [number, number] {
  if (!skillRequirements || skillRequirements.length === 0) return [0, 0];
  const matched = skillRequirements.filter((req) => {
    const skill = member.skills.find((s) => s.skillId === req.tagSlug);
    if (!skill) return false;
    return tierSatisfies(skill.tier as SkillTier, req.minimumTier as SkillTier);
  }).length;
  return [matched, skillRequirements.length];
}

// ---------------------------------------------------------------------------
// Pending proposal row (PROPOSAL → assign or reject)
// ---------------------------------------------------------------------------

interface ProposalRowProps {
  item: ScheduleItem;
  orgMembers: Array<{ id: string; name: string }>;
  eligibleMembers: OrgEligibleMemberView[];
  orgId: string;
  approvedBy: string;
}

function ProposalRow({ item, orgMembers, eligibleMembers, orgId, approvedBy: _ }: ProposalRowProps) {
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleApprove = useCallback(async () => {
    if (!selectedMemberId) return;
    setLoading(true);
    try {
      const result = await approveScheduleItemWithMember(orgId, item.id, selectedMemberId);
      if (result.success) {
        toast({ title: '排程已指派', description: `「${item.title}」成員指派成功。` });
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
        toast({ title: '提案已取消', description: `「${item.title}」已由 HR 撤回。` });
      } else {
        toast({ variant: 'destructive', title: '取消失敗', description: result.error.message });
      }
    } catch {
      toast({ variant: 'destructive', title: '操作失敗', description: '請稍後再試。' });
    } finally {
      setLoading(false);
    }
  }, [orgId, item.id, item.title]);

  // FR-W2: compute skill match for the selected member
  const selectedMemberMatch = useMemo(() => {
    if (!selectedMemberId || !item.requiredSkills?.length) return null;
    const view = eligibleMembers.find((m) => m.accountId === selectedMemberId);
    if (!view) return null;
    return computeSkillMatch(view, item.requiredSkills);
  }, [selectedMemberId, eligibleMembers, item.requiredSkills]);

  return (
    <div className="space-y-3 rounded-lg border bg-background p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <p className="text-sm font-semibold">{item.title}</p>
          <p className="text-xs text-muted-foreground">
            {formatTimestamp(item.startDate as unknown as Timestamp)} – {formatTimestamp(item.endDate as unknown as Timestamp)}
          </p>
          {item.proposedBy && (
            <p className="text-xs text-muted-foreground">提案人：{item.proposedBy}</p>
          )}
        </div>
        <Badge variant="outline" className="shrink-0 text-[9px] uppercase tracking-widest">
          待指派
        </Badge>
      </div>

      {item.requiredSkills && item.requiredSkills.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {item.requiredSkills.map((req: SkillRequirement) => (
            <Badge key={req.tagSlug} variant="secondary" className="text-[10px]">
              {req.tagSlug} ≥ {req.minimumTier} × {req.quantity}
            </Badge>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
          <SelectTrigger className="h-8 flex-1 text-xs">
            <Users className="mr-1 size-3 shrink-0 text-muted-foreground" />
            <SelectValue placeholder="選擇指派成員" />
          </SelectTrigger>
          <SelectContent>
            {orgMembers.map((m) => {
              const view = eligibleMembers.find((e) => e.accountId === m.id);
              const [matched, total] = view
                ? computeSkillMatch(view, item.requiredSkills)
                : [0, 0];
              const isEligible = view?.eligible ?? false;
              return (
                <SelectItem key={m.id} value={m.id} className="text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className={`size-1.5 rounded-full ${isEligible ? 'bg-green-500' : 'bg-muted'}`} />
                    {m.name}
                    {total > 0 && (
                      <span className={`ml-1 text-[9px] font-bold ${matched === total ? 'text-green-600' : 'text-amber-500'}`}>
                        {matched}/{total}
                      </span>
                    )}
                  </span>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        {selectedMemberMatch && (
          <Badge
            variant="outline"
            className={`shrink-0 text-[9px] ${selectedMemberMatch[0] === selectedMemberMatch[1] ? 'border-green-500 text-green-600' : 'border-amber-500 text-amber-600'}`}
          >
            技能 {selectedMemberMatch[0]}/{selectedMemberMatch[1]}
          </Badge>
        )}

        <Button
          size="icon"
          variant="ghost"
          className="size-8 shrink-0 text-green-600 hover:text-green-700"
          disabled={!selectedMemberId || loading}
          onClick={handleApprove}
          title="核准指派"
        >
          <CheckCircle className="size-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="size-8 shrink-0 text-destructive hover:text-destructive/80"
          disabled={loading}
          onClick={handleCancel}
          title="取消提案"
        >
          <XCircle className="size-4" />
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// FR-S6 — Confirmed schedule row (OFFICIAL → COMPLETED)
// ---------------------------------------------------------------------------

interface ConfirmedRowProps {
  item: ScheduleItem;
  orgId: string;
  orgMembers: Array<{ id: string; name: string }>;
}

function ConfirmedRow({ item, orgId, orgMembers }: ConfirmedRowProps) {
  const [loading, setLoading] = useState(false);

  const assignedNames = useMemo(() => {
    if (!item.assigneeIds?.length) return null;
    return item.assigneeIds
      .map((id) => orgMembers.find((m) => m.id === id)?.name ?? id)
      .join('、');
  }, [item.assigneeIds, orgMembers]);

  const handleComplete = useCallback(async () => {
    setLoading(true);
    try {
      const result = await updateScheduleItemStatus(orgId, item.id, 'COMPLETED');
      if (result.success) {
        toast({ title: '排程已完成', description: `「${item.title}」標記完成成功。` });
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
    <div className="space-y-2 rounded-lg border border-green-500/20 bg-green-50/10 p-4 dark:bg-green-950/10">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <p className="text-sm font-semibold">{item.title}</p>
          <p className="text-xs text-muted-foreground">
            {formatTimestamp(item.startDate as unknown as Timestamp)} – {formatTimestamp(item.endDate as unknown as Timestamp)}
          </p>
          {assignedNames && (
            <p className="text-xs text-muted-foreground">指派成員：{assignedNames}</p>
          )}
        </div>
        <Badge variant="outline" className="shrink-0 border-green-500/40 text-[9px] uppercase tracking-widest text-green-600">
          已確認
        </Badge>
      </div>
      <div className="flex justify-end">
        <Button
          size="sm"
          variant="outline"
          className="h-7 gap-1.5 border-green-500/40 text-[10px] font-bold uppercase tracking-widest text-green-600 hover:bg-green-500/10"
          disabled={loading}
          onClick={handleComplete}
        >
          <Flag className="size-3" />
          標記完成
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main governance panel
// ---------------------------------------------------------------------------

/**
 * Org HR governance panel.
 *
 * Reads accounts/{orgId}/schedule_items via useAccount() — same collection as
 * Calendar and DemandBoard — so all three tabs are always in sync.
 *
 * Shows:
 *   PROPOSAL items  → assign or cancel (待核准)
 *   OFFICIAL items  → mark complete (已確認, FR-S6)
 *   REJECTED/COMPLETED → hidden
 */
export function OrgScheduleGovernance() {
  const { state: appState } = useApp();
  const { activeAccount, accounts } = appState;
  const { state: accountState } = useAccount();

  const orgId = activeAccount?.accountType === 'organization' ? activeAccount.id : null;

  const allItems = useMemo(
    () => Object.values(accountState.schedule_items),
    [accountState.schedule_items]
  );

  const pending = useMemo(
    () => allItems.filter((i) => i.status === 'PROPOSAL'),
    [allItems]
  );
  const confirmed = useMemo(
    () => allItems.filter((i) => i.status === 'OFFICIAL'),
    [allItems]
  );

  const orgMembers = useMemo(() => {
    if (!orgId) return [];
    const org = accounts[orgId];
    return (org?.members ?? []).map((m: { id: string; name: string }) => ({ id: m.id, name: m.name }));
  }, [orgId, accounts]);

  const [eligibleMembers, setEligibleMembers] = useState<OrgEligibleMemberView[]>([]);
  useEffect(() => {
    if (!orgId) return;
    getOrgEligibleMembersWithTier(orgId)
      .then(setEligibleMembers)
      .catch(() => setEligibleMembers([]));
  }, [orgId]);

  const actorId = activeAccount?.id ?? 'system';

  if (!orgId) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        組織層級的 HR 排程僅在組織帳號下可用。
      </p>
    );
  }

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="border-b">
        <CardTitle className="text-sm font-bold uppercase tracking-widest">
          HR 排程治理 — 待核准（{pending.length}）已確認（{confirmed.length}）
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full">
          <div className="space-y-3 p-4">
            {pending.length === 0 && confirmed.length === 0 && (
              <p className="py-8 text-center text-xs italic text-muted-foreground">
                目前無待核准或確認中的提案。
              </p>
            )}
            {pending.map((item: ScheduleItem) => (
              <ProposalRow
                key={item.id}
                item={item}
                orgMembers={orgMembers}
                eligibleMembers={eligibleMembers}
                orgId={orgId}
                approvedBy={actorId}
              />
            ))}

            {/* FR-S6 — Confirmed section */}
            {confirmed.length > 0 && (
              <div className="border-t pt-3">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  已確認排程 — 可標記完成
                </p>
                {confirmed.map((item: ScheduleItem) => (
                  <ConfirmedRow
                    key={item.id}
                    item={item}
                    orgId={orgId}
                    orgMembers={orgMembers}
                  />
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
