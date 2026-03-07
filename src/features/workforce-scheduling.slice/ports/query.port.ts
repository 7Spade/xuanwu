/**
 * Module: query.port.ts
 * Purpose: Define VS6 read-side query port contracts.
 * Responsibilities: Describe schedule/timeline reads through L6 gateway-facing interfaces.
 * Constraints: deterministic logic, respect module boundaries
 */

import type {
  ImplementsStalenessContract,
  ScheduleItem,
  ScheduleStatus,
} from '@/shared-kernel';

import type {
  AccountScheduleAssignment,
  AccountScheduleProjection,
} from '../_projectors/account-schedule';
import type { OrgEligibleMemberView, OrgMemberSkillWithTier } from '../_queries';

export type QueryUnsubscribe = () => void;

export interface SchedulingQueryPort {
  getScheduleItems(accountId: string, workspaceId?: string): Promise<ScheduleItem[]>;
  getOrgScheduleItem(orgId: string, scheduleItemId: string): Promise<ScheduleItem | null>;
  subscribeToOrgScheduleProposals(
    orgId: string,
    onUpdate: (items: ScheduleItem[]) => void,
    opts?: { status?: ScheduleStatus; maxItems?: number }
  ): QueryUnsubscribe;
  subscribeToPendingProposals(orgId: string, onUpdate: (items: ScheduleItem[]) => void): QueryUnsubscribe;
  subscribeToConfirmedProposals(orgId: string, onUpdate: (items: ScheduleItem[]) => void): QueryUnsubscribe;
  getActiveDemands(orgId: string): Promise<ScheduleItem[]>;
  subscribeToDemandBoard(orgId: string, onChange: (items: ScheduleItem[]) => void): QueryUnsubscribe;
  getAllDemands(orgId: string): Promise<ScheduleItem[]>;
  getAccountScheduleProjection(accountId: string): Promise<AccountScheduleProjection | null>;
  getAccountActiveAssignments(accountId: string): Promise<AccountScheduleAssignment[]>;
  subscribeToWorkspaceScheduleItems(
    dimensionId: string,
    workspaceId: string,
    onUpdate: (items: ScheduleItem[]) => void,
    onError?: (err: Error) => void
  ): QueryUnsubscribe;
  getEligibleMemberForSchedule(orgId: string, accountId: string): Promise<OrgEligibleMemberView | null>;
  getEligibleMembersForSchedule(orgId: string): Promise<OrgEligibleMemberView[]>;
}

export interface SchedulingStalenessContractPort {
  DEMAND_BOARD_STALENESS: ImplementsStalenessContract;
}

export type { OrgEligibleMemberView, OrgMemberSkillWithTier };
