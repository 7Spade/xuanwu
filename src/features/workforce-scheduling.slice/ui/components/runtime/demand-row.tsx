/**
 * Module: demand-row.tsx
 * Purpose: Render one schedule demand card with assignment/cancel actions.
 * Responsibilities: present demand details and execute row-level commands.
 * Constraints: deterministic logic, respect module boundaries
 */
"use client";

import { UserCheck, XCircle, Clock, CheckCircle2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { Badge } from "@/shadcn-ui/badge";
import { Button } from "@/shadcn-ui/button";
import { toast } from "@/shadcn-ui/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn-ui/select";
import type { ScheduleItem, SkillRequirement } from "@/shared-kernel";
import { SKILLS } from "@/shared-kernel/constants/skills";
import type { Timestamp } from "@/shared-kernel/ports";

import {
  approveScheduleItemWithMember,
  updateScheduleItemStatus,
} from "../../../application/commands";

type TimestampLike = { toDate: () => Date };

function isTimestampLike(value: unknown): value is TimestampLike {
  return typeof value === "object" && value !== null && "toDate" in value && typeof (value as TimestampLike).toDate === "function";
}

function formatTimestamp(ts: Timestamp | string | undefined): string {
  if (!ts) return "";
  if (typeof ts === "string") return ts;
  if (isTimestampLike(ts)) {
    return ts.toDate().toLocaleDateString("zh-TW");
  }
  return String(ts);
}

export interface OrgMember {
  id: string;
  name: string;
}

export interface DemandRowProps {
  item: ScheduleItem;
  orgMembers: OrgMember[];
  orgId: string;
}

export function DemandRow({ item, orgMembers, orgId }: DemandRowProps) {
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [loading, setLoading] = useState(false);

  const isOpen = item.status === "PROPOSAL";

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
      .join("、");
  }, [item.assigneeIds, orgMembers]);

  const handleAssign = useCallback(async () => {
    if (!selectedMemberId) return;
    setLoading(true);
    try {
      const result = await approveScheduleItemWithMember(orgId, item.id, selectedMemberId);
      if (result.success) {
        toast({ title: "指派已完成", description: `${item.title} 已成功指派。` });
        setSelectedMemberId("");
      } else {
        toast({ variant: "destructive", title: "指派失敗", description: result.error.message });
      }
    } catch {
      toast({ variant: "destructive", title: "操作失敗", description: "請稍後再試。" });
    } finally {
      setLoading(false);
    }
  }, [selectedMemberId, orgId, item.id, item.title]);

  const handleCancel = useCallback(async () => {
    setLoading(true);
    try {
      const result = await updateScheduleItemStatus(orgId, item.id, "REJECTED");
      if (result.success) {
        toast({ title: "請求已取消", description: `${item.title} 已通知 HR 更新狀態。` });
      } else {
        toast({ variant: "destructive", title: "操作失敗", description: result.error.message });
      }
    } catch {
      toast({ variant: "destructive", title: "操作失敗", description: "請稍後再試。" });
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
              <>
                <span className="text-muted-foreground">{item.workspaceName}</span>
                <span className="mx-0.5 text-muted-foreground">-</span>
                {item.title}
              </>
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
