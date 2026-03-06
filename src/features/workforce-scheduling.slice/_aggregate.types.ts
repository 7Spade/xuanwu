/**
 * Module: _aggregate.types
 * Purpose: Shared aggregate types and schemas for scheduling aggregate
 * Responsibilities: define zod schemas, state unions, and write/result contracts
 * Constraints: deterministic logic, respect module boundaries
 */

import { z } from 'zod';

/**
 * Aggregate lifecycle states for organization.schedule.
 */
export const ORG_SCHEDULE_STATUSES = [
  'draft',
  'proposed',
  'confirmed',
  'cancelled',
  'completed',
  'assignmentCancelled',
] as const;

export type OrgScheduleStatus = (typeof ORG_SCHEDULE_STATUSES)[number];

const skillRequirementSchema = z.object({
  tagSlug: z.string().min(1),
  tagId: z.string().optional(),
  minimumTier: z.enum([
    'apprentice',
    'journeyman',
    'expert',
    'artisan',
    'grandmaster',
    'legendary',
    'titan',
  ]),
  quantity: z.number().int().min(1),
});

export const orgScheduleProposalSchema = z.object({
  scheduleItemId: z.string().min(1),
  workspaceId: z.string().min(1),
  orgId: z.string().min(1),
  title: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  proposedBy: z.string().min(1),
  status: z.enum(ORG_SCHEDULE_STATUSES),
  receivedAt: z.string(),
  intentId: z.string().optional(),
  skillRequirements: z.array(skillRequirementSchema).optional(),
  locationId: z.string().optional(),
  version: z.number().int().min(1).default(1),
  traceId: z.string().optional(),
  targetAccountId: z.string().optional(),
});

export type OrgScheduleProposal = z.infer<typeof orgScheduleProposalSchema>;

/** A pending Firestore write that the calling layer must execute. [D3] */
export interface WriteOp {
  path: string;
  data: Record<string, unknown>;
  arrayUnionFields?: Record<string, string[]>;
}

/**
 * Result type for approveOrgScheduleProposal — enables callers to handle
 * both outcomes without catching exceptions (Compensating Event pattern).
 */
export type ScheduleApprovalResult =
  | { outcome: 'confirmed'; scheduleItemId: string; writeOp: WriteOp }
  | { outcome: 'rejected'; scheduleItemId: string; reason: string; writeOp: WriteOp };
