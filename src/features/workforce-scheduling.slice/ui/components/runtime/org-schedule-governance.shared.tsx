/**
 * Module: org-schedule-governance.shared
 * Purpose: Shared utilities and UI helpers for schedule governance rows
 * Responsibilities: timestamps, skill matching, avatar badges, shared row props
 * Constraints: deterministic logic, respect module boundaries
 */

'use client';

import { Avatar, AvatarFallback } from '@/shadcn-ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shadcn-ui/tooltip';
import { tierSatisfies } from '@/shared-kernel';
import type { ScheduleItem, SkillRequirement } from '@/shared-kernel';
import { findSkill } from '@/shared-kernel/constants/skills';
import type { Timestamp } from '@/shared-kernel/ports';

import type { OrgEligibleMemberView } from '../_queries';

type TimestampLike = { toDate: () => Date };

function isTimestampLike(value: unknown): value is TimestampLike {
  return typeof value === 'object' && value !== null && 'toDate' in value && typeof value.toDate === 'function';
}

export interface GovernanceMember {
  id: string;
  name: string;
}

export interface GovernanceProposalRowProps {
  item: ScheduleItem;
  orgMembers: GovernanceMember[];
  eligibleMembers: OrgEligibleMemberView[];
  orgId: string;
}

export interface GovernanceConfirmedRowProps {
  item: ScheduleItem;
  orgId: string;
  orgMembers: GovernanceMember[];
}

export function getSkillName(slug: string): string {
  return findSkill(slug)?.name ?? slug;
}

export function AssignedMemberAvatars({ members }: { members: GovernanceMember[] }) {
  if (members.length === 0) return null;
  return (
    <TooltipProvider>
      <div className="flex -space-x-1">
        {members.map((member) => (
          <Tooltip key={member.id}>
            <TooltipTrigger asChild>
              <Avatar className="size-6 border-2 border-background">
                <AvatarFallback className="text-[9px] font-bold">{member.name?.[0] ?? '?'}</AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>
              <p>{member.name}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}

export function formatTimestamp(ts: Timestamp | string | undefined): string {
  if (!ts) return '';
  if (typeof ts === 'string') return ts;
  if (isTimestampLike(ts)) {
    return ts.toDate().toLocaleDateString('zh-TW');
  }
  return String(ts);
}

export function computeSkillMatch(
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
