'use client';

/**
 * account-organization.schedule — _components/org-schedule-governance.tsx
 *
 * Org HR governance panel for reviewing and acting on pending OrgScheduleProposals.
 *
 * Per logic-overview.v3.md:
 *   ORGANIZATION_SCHEDULE — org governance reads pending proposals and assigns members.
 *   Invariant #14: skill validation via projection.org-eligible-member-view happens inside
 *     approveOrgScheduleProposal (not in this component).
 *   Invariant A5: ScheduleAssignRejected is published by approveOrgScheduleProposal when
 *     skill validation fails.
 *
 * FR-S6: Confirmed proposals section — HR marks confirmed assignments as completed.
 * FR-W2: Skill match indicators — show per-member skill match against proposal requirements.
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/shared/app-providers/app-context';
import { ROUTES } from '@/shared/constants/routes';
import { usePendingScheduleProposals, useConfirmedScheduleProposals } from '../_hooks/use-org-schedule';
import { manualAssignScheduleMember, cancelScheduleProposalAction, completeOrgScheduleAction } from '../_actions';
import { toast } from '@/shared/utility-hooks/use-toast';
import type { OrgScheduleProposal } from '../_schedule';
import type { SkillRequirement } from '@/shared/types';
import { getOrgEligibleMembersWithTier } from '@/features/projection.org-eligible-member-view';
import type { OrgEligibleMemberView } from '@/features/projection.org-eligible-member-view';
import { tierSatisfies } from '@/features/shared.kernel.skill-tier';
import { subscribeToOrgMembers } from '@/features/account-organization.member';
import type { MemberReference } from '@/shared/types';
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

// ---------------------------------------------------------------------------
// FR-W2 — Skill match helper
// ---------------------------------------------------------------------------

/**
 * Computes how many of the proposal's skill requirements the given member satisfies.
 * Returns [matched, total].
 *
 * Uses tierSatisfies from shared.kernel.skill-tier so comparison is against
 * the canonical SkillTier values ('apprentice'..'titan'), not ad-hoc strings.
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
// Proposal row (pending → assign/cancel)
// ---------------------------------------------------------------------------

interface ProposalRowProps {
  proposal: OrgScheduleProposal;
  orgMembers: Array<{ id: string; name: string }>;
  eligibleMembers: OrgEligibleMemberView[];
  approvedBy: string;
  onApproved: () => void;
  onCancelled: () => void;
}

function ProposalRow({
  proposal,
  orgMembers,
  eligibleMembers,
  approvedBy,
  onApproved,
  onCancelled,
}: ProposalRowProps) {
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleApprove = useCallback(async () => {
    if (!selectedMemberId) return;
    setLoading(true);
    try {
      const result = await manualAssignScheduleMember(
        proposal.scheduleItemId,
        selectedMemberId,
        approvedBy,
        {
          workspaceId: proposal.workspaceId,
          orgId: proposal.orgId,
          title: proposal.title,
          startDate: proposal.startDate,
          endDate: proposal.endDate,
        },
        proposal.skillRequirements
      );
      if (result.success) {
        toast({ title: '排程已指派', description: `「${proposal.title}」成員指派成功。` });
        onApproved();
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
  }, [selectedMemberId, proposal, approvedBy, onApproved]);

  const handleCancel = useCallback(async () => {
    setLoading(true);
    try {
      await cancelScheduleProposalAction(
        proposal.scheduleItemId,
        proposal.orgId,
        proposal.workspaceId,
        approvedBy
      );
      toast({ title: '提案已取消', description: `「${proposal.title}」已由 HR 撤回。` });
      onCancelled();
    } catch {
      toast({ variant: 'destructive', title: '操作失敗', description: '請稍後再試。' });
    } finally {
      setLoading(false);
    }
  }, [proposal.scheduleItemId, proposal.orgId, proposal.workspaceId, proposal.title, approvedBy, onCancelled]);

  // FR-W2: compute skill match for the selected member
  const selectedMemberMatch = useMemo(() => {
    if (!selectedMemberId || !proposal.skillRequirements?.length) return null;
    const view = eligibleMembers.find((m) => m.accountId === selectedMemberId);
    if (!view) return null;
    return computeSkillMatch(view, proposal.skillRequirements);
  }, [selectedMemberId, eligibleMembers, proposal.skillRequirements]);

  return (
    <div className="space-y-3 rounded-lg border bg-background p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <p className="text-sm font-semibold">{proposal.title}</p>
          <p className="text-xs text-muted-foreground">
            {proposal.startDate} – {proposal.endDate}
          </p>
          <p className="text-xs text-muted-foreground">提案人：{proposal.proposedBy}</p>
        </div>
        <Badge variant="outline" className="shrink-0 text-[9px] uppercase tracking-widest">
          待指派
        </Badge>
      </div>

      {proposal.skillRequirements && proposal.skillRequirements.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {proposal.skillRequirements.map((req: SkillRequirement) => (
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
            {orgMembers.map((m: { id: string; name: string }) => {
              const view = eligibleMembers.find((e) => e.accountId === m.id);
              const [matched, total] = view
                ? computeSkillMatch(view, proposal.skillRequirements)
                : [0, 0];
              const isEligible = view?.eligible ?? false;
              return (
                <SelectItem key={m.id} value={m.id} className="text-xs">
                  <span className="flex items-center gap-1.5">
                    <span
                      className={`size-1.5 rounded-full ${isEligible ? 'bg-green-500' : 'bg-muted'}`}
                    />
                    {m.name}
                    {total > 0 && (
                      <span
                        className={`ml-1 text-[9px] font-bold ${matched === total ? 'text-green-600' : 'text-amber-500'}`}
                      >
                        {matched}/{total}
                      </span>
                    )}
                  </span>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        {/* FR-W2 skill match badge for selected member */}
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
// FR-S6 — Confirmed schedule row (confirmed → complete)
// ---------------------------------------------------------------------------

interface ConfirmedRowProps {
  proposal: OrgScheduleProposal;
  completedBy: string;
  /** O(1) lookup map: accountId → display name. */
  orgMemberMap: Map<string, string>;
  onCompleted: () => void;
}

function ConfirmedRow({ proposal, completedBy, orgMemberMap, onCompleted }: ConfirmedRowProps) {
  const [loading, setLoading] = useState(false);

  const handleComplete = useCallback(async () => {
    setLoading(true);
    try {
      const result = await completeOrgScheduleAction(
        proposal.scheduleItemId,
        proposal.orgId,
        proposal.workspaceId,
        proposal.targetAccountId ?? '',
        completedBy
      );
      if (result.success) {
        toast({ title: '排程已完成', description: `「${proposal.title}」標記完成成功。` });
        onCompleted();
      } else {
        toast({ variant: 'destructive', title: '操作失敗', description: result.error.message });
      }
    } catch {
      toast({ variant: 'destructive', title: '操作失敗', description: '請稍後再試。' });
    } finally {
      setLoading(false);
    }
  }, [proposal, completedBy, onCompleted]);

  return (
    <div className="space-y-2 rounded-lg border border-green-500/20 bg-green-50/10 p-4 dark:bg-green-950/10">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <p className="text-sm font-semibold">{proposal.title}</p>
          <p className="text-xs text-muted-foreground">
            {proposal.startDate} – {proposal.endDate}
          </p>
          {proposal.targetAccountId && (
            <p className="text-xs text-muted-foreground">
              指派成員：{orgMemberMap.get(proposal.targetAccountId) ?? proposal.targetAccountId}
            </p>
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
 * Reads pending OrgScheduleProposals and allows HR to assign members or cancel proposals.
 * Also shows confirmed assignments and allows marking them as completed (FR-S6).
 * Only visible/useful when the active account is an organization.
 */
export function OrgScheduleGovernance() {
  const { state: appState } = useApp();
  const { activeAccount } = appState;
  const router = useRouter();

  const orgId = activeAccount?.accountType === 'organization' ? activeAccount.id : null;
  const { proposals: pending, loading: pendingLoading } = usePendingScheduleProposals(orgId);
  const { proposals: confirmed, loading: confirmedLoading } = useConfirmedScheduleProposals(orgId);

  const [orgMembers, setOrgMembers] = useState<Array<{ id: string; name: string }>>([]);
  useEffect(() => {
    if (!orgId) { setOrgMembers([]); return; }
    const unsub = subscribeToOrgMembers(orgId, (members: MemberReference[]) => {
      setOrgMembers(members.map((m) => ({ id: m.id, name: m.name })));
    });
    return unsub;
  }, [orgId]);

  // O(1) lookup map so ConfirmedRow doesn't scan the array on every render.
  const orgMemberMap = useMemo(
    () => new Map(orgMembers.map((m) => [m.id, m.name])),
    [orgMembers]
  );

  // FR-W2: load eligible members with tier for skill match display
  const [eligibleMembers, setEligibleMembers] = useState<OrgEligibleMemberView[]>([]);
  useEffect(() => {
    if (!orgId) return;
    getOrgEligibleMembersWithTier(orgId)
      .then(setEligibleMembers)
      .catch(() => setEligibleMembers([]));
  }, [orgId]);

  const actorId = activeAccount?.id ?? 'system';

  const handleChange = useCallback(() => {
    // No-op: real-time subscriptions auto-update lists after Firestore writes.
  }, []);

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
            {/* Pending proposals — assign or cancel */}
            {(pendingLoading) && (
              <p className="py-4 text-center text-xs italic text-muted-foreground">載入中…</p>
            )}
            {!pendingLoading && pending.length === 0 && confirmed.length === 0 && (
              <div className="py-8 text-center">
                <Flag className="mx-auto mb-3 size-6 text-muted-foreground opacity-40" />
                <p className="text-xs font-medium text-muted-foreground">目前無待審核的提案</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  廠區人員可至各工作空間的「排程」分頁，點選日期提交排程提案。
                </p>
                <Button
                  variant="link"
                  size="sm"
                  className="mt-2 h-auto p-0 text-[11px] font-bold uppercase tracking-widest"
                  onClick={() => router.push(ROUTES.WORKSPACES)}
                >
                  前往工作空間列表 →
                </Button>
              </div>
            )}
            {pending.map((proposal: OrgScheduleProposal) => (
              <ProposalRow
                key={proposal.scheduleItemId}
                proposal={proposal}
                orgMembers={orgMembers}
                eligibleMembers={eligibleMembers}
                approvedBy={actorId}
                onApproved={handleChange}
                onCancelled={handleChange}
              />
            ))}

            {/* FR-S6 — Confirmed proposals section */}
            {confirmed.length > 0 && (
              <>
                <div className="border-t pt-3">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    已確認排程 — 可標記完成
                  </p>
                  {confirmedLoading && (
                    <p className="py-2 text-center text-xs italic text-muted-foreground">載入中…</p>
                  )}
                  {confirmed.map((proposal: OrgScheduleProposal) => (
                    <ConfirmedRow
                      key={proposal.scheduleItemId}
                      proposal={proposal}
                      completedBy={actorId}
                      orgMemberMap={orgMemberMap}
                      onCompleted={handleChange}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
