/**
 * Module: org-schedule-governance.confirmed-row
 * Purpose: Confirmed row renderer for HR schedule governance
 * Responsibilities: show confirmed assignment and allow mark-completed action
 * Constraints: deterministic logic, respect module boundaries
 */

'use client';

import { Flag } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import { Badge } from '@/shared/shadcn-ui/badge';
import { Button } from '@/shared/shadcn-ui/button';
import { toast } from '@/shared/shadcn-ui/hooks/use-toast';

import { updateScheduleItemStatus } from '../_actions';

import {
  AssignedMemberAvatars,
  formatTimestamp,
  getSkillName,
  type GovernanceConfirmedRowProps,
} from './org-schedule-governance.shared';

export function ConfirmedRow({ item, orgId, orgMembers }: GovernanceConfirmedRowProps) {
  const [loading, setLoading] = useState(false);

  const assignedMembers = useMemo(() => {
    if (!item.assigneeIds?.length) return [];
    return item.assigneeIds.map((id) => ({
      id,
      name: orgMembers.find((member) => member.id === id)?.name ?? id,
    }));
  }, [item.assigneeIds, orgMembers]);

  const hasRequirements = (item.requiredSkills?.length ?? 0) > 0;
  const totalRequired = item.requiredSkills?.reduce((sum, requirement) => sum + (requirement.quantity ?? 1), 0) ?? 0;

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
          <p className="text-sm font-semibold">
            {item.workspaceName ? (
              <><span className="text-muted-foreground">{item.workspaceName}</span><span className="mx-0.5 text-muted-foreground">-</span>{item.title}</>
            ) : item.title}
          </p>
          <p className="text-xs text-muted-foreground">{formatTimestamp(item.startDate)} – {formatTimestamp(item.endDate)}</p>
        </div>
        <Badge variant="outline" className="shrink-0 border-green-500/40 text-[9px] uppercase tracking-widest text-green-600">已確認</Badge>
      </div>

      {(hasRequirements || assignedMembers.length > 0) && (
        <div className="space-y-1">
          {hasRequirements && (
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">所需技能</p>
              <span className="text-[10px] text-muted-foreground">已指派 {assignedMembers.length} / {totalRequired} 人</span>
            </div>
          )}

          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col gap-1.5">
              {item.requiredSkills?.map((requirement) => (
                <div key={requirement.tagSlug} className="flex items-center gap-1">
                  <Badge variant="secondary" className="text-[10px]">{getSkillName(requirement.tagSlug)} × {requirement.quantity}</Badge>
                </div>
              ))}
            </div>
            <AssignedMemberAvatars members={assignedMembers} />
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button size="sm" variant="outline" className="h-7 gap-1.5 border-green-500/40 text-[10px] font-bold uppercase tracking-widest text-green-600 hover:bg-green-500/10" disabled={loading} onClick={handleComplete}>
          <Flag className="size-3" />
          標記完成
        </Button>
      </div>
    </div>
  );
}
