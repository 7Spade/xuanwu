
/**
 * @fileoverview use-schedule-actions.ts - Hook for managing schedule-related write operations.
 * @description This hook centralizes business logic for interactive features
 * on schedule items, such as assigning members and approving/rejecting proposals.
 * It acts as the bridge between UI components and the infrastructure layer,
 * respecting architectural boundaries.
 */
"use client";

import { useCallback } from "react";

import { useApp } from "@/app-runtime/providers/app-provider";
import { useAuth } from "@/app-runtime/providers/auth-provider";
import { getOrgMemberEligibilityWithTier } from "@/shared-infra/projection.bus";
import { toast } from "@/shadcn-ui/hooks/use-toast";
import { tierSatisfies } from "@/shared-kernel";
import type { ScheduleItem } from '@/shared-kernel';

import {
    assignMember,
    unassignMember,
    updateScheduleItemStatus,
  updateScheduleItemDateRange,
} from "../_actions";
import { getAccountActiveAssignments } from "../_queries";
import { canTransitionScheduleStatus } from "../_schedule.rules";


export function useScheduleActions() {
  const { state: appState } = useApp();
  const { state: authState } = useAuth();
  const { activeAccount } = appState;
  const { user } = authState;

  const assignMemberCommand = useCallback(async (item: ScheduleItem, memberId: string) => {
    if (!user || !activeAccount || activeAccount.accountType !== 'organization') {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "You must be in an organization to assign members.",
      });
      return;
    }

    // W_B_SCHEDULE -.??ACCOUNT_PROJECTION_SCHEDULE: filter available accounts via projection
    // (Invariant #2: read cross-BC data only via Projection, not Domain Core)
    const activeAssignments = await getAccountActiveAssignments(memberId).catch(() => []);
    const conflicting = activeAssignments.some(
      (a) => a.workspaceId !== item.workspaceId && a.status !== 'completed'
    );
    if (conflicting) {
      toast({
        variant: "destructive",
        title: "Member Unavailable",
        description: "This member already has an active assignment in another workspace.",
      });
      return;
    }

    // W_B_SCHEDULE -.??ORG_ELIGIBLE_MEMBER_VIEW: soft skill-eligibility check
    // (Invariant #14: only reads Projection ??never Account aggregate)
    // (Invariant #12: tier is derived via resolveSkillTier(xp) ??never stored in DB)
    // Warning-only guard; hard validation happens in approveOrgScheduleProposal.
    if (item.requiredSkills && item.requiredSkills.length > 0) {
      const memberView = await getOrgMemberEligibilityWithTier(activeAccount.id, memberId).catch(() => null);
      if (memberView) {
        const unmetSkills = item.requiredSkills.filter((req) => {
          const skillEntry = memberView.skills.find((s) => s.skillId === req.tagSlug);
          if (!skillEntry) return true;
          return !tierSatisfies(skillEntry.tier, req.minimumTier);
        });
        if (unmetSkills.length > 0) {
          toast({
            variant: "destructive",
            title: "Skill Requirements Not Met",
            description: `Member does not meet skill requirements: ${unmetSkills.map((r) => `${r.tagSlug} ??${r.minimumTier}`).join(', ')}.`,
          });
          return;
        }
      }
    }

    try {
      const result = await assignMember(item.accountId, item.id, memberId);
      if (!result.success) throw new Error(result.error.message);
      toast({ title: "Member Assigned", description: "The schedule item has been updated." });
    } catch (error) {
      console.error("Failed to assign member:", error);
      toast({
        variant: "destructive",
        title: "Action Failed",
        description:
          error instanceof Error ? error.message : "Could not assign member.",
      });
    }
  }, [user, activeAccount]);

  const unassignMemberCommand = useCallback(async (item: ScheduleItem, memberId: string) => {
    if (!user || !activeAccount || activeAccount.accountType !== 'organization') {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "You must be in an organization to unassign members.",
      });
      return;
    }

    try {
      const result = await unassignMember(item.accountId, item.id, memberId);
      if (!result.success) throw new Error(result.error.message);
      toast({ title: "Member Unassigned" });
    } catch (error) {
      console.error("Failed to unassign member:", error);
      toast({
        variant: "destructive",
        title: "Action Failed",
        description:
          error instanceof Error ? error.message : "Could not unassign member.",
      });
    }
  }, [user, activeAccount]);

  const approveItem = useCallback(async (item: ScheduleItem) => {
    if (!canTransitionScheduleStatus(item.status, "OFFICIAL")) {
      throw new Error(`Cannot approve: invalid transition ${item.status} ??OFFICIAL`);
    }
    const result = await updateScheduleItemStatus(item.accountId, item.id, "OFFICIAL");
    if (!result.success) throw new Error(result.error.message);
  }, []);

  const rejectItem = useCallback(async (item: ScheduleItem) => {
    if (!canTransitionScheduleStatus(item.status, "REJECTED")) {
      throw new Error(`Cannot reject: invalid transition ${item.status} ??REJECTED`);
    }
    const result = await updateScheduleItemStatus(item.accountId, item.id, "REJECTED");
    if (!result.success) throw new Error(result.error.message);
  }, []);

  const rescheduleItem = useCallback(async (item: ScheduleItem, startDate: Date, endDate: Date) => {
    if (!user || !activeAccount || activeAccount.accountType !== 'organization') {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'You must be in an organization to reschedule items.',
      });
      return false;
    }

    const result = await updateScheduleItemDateRange(item.accountId, item.id, startDate, endDate);
    if (!result.success) {
      toast({
        variant: 'destructive',
        title: 'Reschedule Failed',
        description: result.error.message,
      });
      return false;
    }

    toast({ title: 'Schedule Updated', description: 'Timeline move has been saved.' });
    return true;
  }, [user, activeAccount]);

  return {
    assignMember: assignMemberCommand,
    unassignMember: unassignMemberCommand,
    approveItem,
    rejectItem,
    rescheduleItem,
  };
}
