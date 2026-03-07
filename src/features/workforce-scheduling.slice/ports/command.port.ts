/**
 * Module: command.port.ts
 * Purpose: Define VS6 write-side command port contracts.
 * Responsibilities: Describe command operations without binding to infrastructure.
 * Constraints: deterministic logic, respect module boundaries
 */

import type { CommandResult, ScheduleItem, SkillRequirement } from '@/shared-kernel';

export interface CreateScheduleItemInput
  extends Omit<ScheduleItem, 'id' | 'createdAt' | 'updatedAt' | 'startDate' | 'endDate'> {
  startDate?: Date | null;
  endDate?: Date | null;
}

export interface ManualAssignOptions {
  workspaceId: string;
  orgId: string;
  title: string;
  startDate: string;
  endDate: string;
  traceId?: string;
}

export interface SchedulingCommandPort {
  createScheduleItem(input: CreateScheduleItemInput): Promise<CommandResult>;
  assignMember(accountId: string, itemId: string, memberId: string): Promise<CommandResult>;
  unassignMember(accountId: string, itemId: string, memberId: string): Promise<CommandResult>;
  approveScheduleItemWithMember(organizationId: string, itemId: string, memberId: string): Promise<CommandResult>;
  updateScheduleItemStatus(
    organizationId: string,
    itemId: string,
    newStatus: 'OFFICIAL' | 'REJECTED' | 'COMPLETED'
  ): Promise<CommandResult>;
  updateScheduleItemDateRange(
    accountId: string,
    itemId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CommandResult>;
  manualAssignScheduleMember(
    scheduleItemId: string,
    targetAccountId: string,
    assignedBy: string,
    opts: ManualAssignOptions,
    skillRequirements?: SkillRequirement[]
  ): Promise<CommandResult>;
  cancelScheduleProposalAction(
    scheduleItemId: string,
    orgId: string,
    workspaceId: string,
    cancelledBy: string,
    reason?: string,
    traceId?: string
  ): Promise<CommandResult>;
  completeOrgScheduleAction(
    scheduleItemId: string,
    orgId: string,
    workspaceId: string,
    targetAccountId: string,
    completedBy: string,
    traceId?: string
  ): Promise<CommandResult>;
}
