/**
 * account-organization.event-bus — _events.ts
 *
 * Organization domain event contracts.
 *
 * Per logic-overview.md:
 *   ORGANIZATION_EVENT_BUS → ORGANIZATION_SCHEDULE (ScheduleAssigned)
 *   ORGANIZATION_EVENT_BUS → |政策變更| WORKSPACE_ORG_POLICY_CACHE
 *   ORGANIZATION_EVENT_BUS → |ScheduleAssigned 含 TargetAccountID| ACCOUNT_NOTIFICATION_ROUTER
 *   ORGANIZATION_EVENT_BUS -.→ shared-kernel.event-envelope (契約遵循)
 */

// =================================================================
// == Payload Interfaces
// =================================================================

export interface ScheduleAssignedPayload {
  scheduleItemId: string;
  workspaceId: string;
  orgId: string;
  targetAccountId: string;
  assignedBy: string;
  startDate: string;
  endDate: string;
  title: string;
  /**
   * Aggregate version of the org-schedule aggregate when this event was produced. [R7]
   * Used by ELIGIBLE_UPDATE_GUARD in projection.org-eligible-member-view to enforce
   * monotonic aggregateVersion — prevents timing races from reverting eligible state.
   * Invariant #19: eligible update must use aggregateVersion monotonic increase as prerequisite.
   */
  aggregateVersion: number;
  /** TraceID from the originating command — MUST be forwarded to FCM metadata [R8]. */
  traceId?: string;
}

export interface OrgPolicyChangedPayload {
  orgId: string;
  policyId: string;
  changeType: 'created' | 'updated' | 'deleted';
  changedBy: string;
  /** TraceID from the originating command — forwarded to notification delivery [R8]. */
  traceId?: string;
}

export interface OrgMemberJoinedPayload {
  orgId: string;
  accountId: string;
  role: string;
  joinedBy: string;
  /** TraceID from the originating command — forwarded to notification delivery [R8]. */
  traceId?: string;
}

export interface OrgMemberLeftPayload {
  orgId: string;
  accountId: string;
  removedBy: string;
}

export interface OrgTeamUpdatedPayload {
  orgId: string;
  teamId: string;
  teamName: string;
  memberIds: string[];
  updatedBy: string;
}

/**
 * Fired when XP is added to a member's skill (ACCOUNT_SKILL_AGGREGATE).
 * Used by projection.account-skill-view and projection.org-eligible-member-view.
 * Per invariant #11: XP belongs to Account BC; Organization only receives the event.
 */
export interface SkillXpAddedPayload {
  accountId: string;
  orgId: string;
  /** tagSlug — portable skill identifier (matches SkillGrant.tagSlug) */
  skillId: string;
  xpDelta: number;
  /** New clamped XP value (0–525). Stored; tier must be derived via resolveSkillTier(xp). */
  newXp: number;
  reason?: string;
  /** Skill aggregate version after this write — used by ORG_ELIGIBLE_VIEW S2 guard. */
  aggregateVersion?: number;
  /** [R8] Trace identifier propagated from CBG_ENTRY. */
  traceId?: string;
}

/**
 * Fired when XP is deducted from a member's skill.
 * Mirror of SkillXpAddedPayload — same projection targets.
 */
export interface SkillXpDeductedPayload {
  accountId: string;
  orgId: string;
  skillId: string;
  xpDelta: number;
  newXp: number;
  reason?: string;
  /** Skill aggregate version after this write — used by ORG_ELIGIBLE_VIEW S2 guard. */
  aggregateVersion?: number;
  /** [R8] Trace identifier propagated from CBG_ENTRY. */
  traceId?: string;
}

/**
 * Compensating event (Invariant A5) — published when a schedule assignment is
 * rejected because the target member does not meet skill tier requirements.
 * Discrete Recovery: does NOT directly revert A-track tasks; consumers decide.
 */
export interface ScheduleAssignRejectedPayload {
  scheduleItemId: string;
  orgId: string;
  workspaceId: string;
  targetAccountId: string;
  /** AccountId of the workspace scheduler who submitted the proposal (FR-N2 notification target). */
  proposedBy?: string;
  /** Human-readable reason for rejection (e.g. skill tier insufficient). */
  reason: string;
  rejectedAt: string;
  /** [R8] TraceID propagated from the originating scheduling saga. */
  traceId?: string;
}

/**
 * Fired by ORG_SKILL_RECOGNITION when an organization grants skill recognition
 * to a member.  Per logic-overview.md:
 *   ORG_SKILL_RECOGNITION →|SkillRecognitionGranted| ORGANIZATION_EVENT_BUS
 */
export interface SkillRecognitionGrantedPayload {
  organizationId: string;
  accountId: string;
  skillId: string;
  /** Org-controlled XP threshold (0 = no gate). */
  minXpRequired: number;
  grantedBy: string;
}

/**
 * Fired by ORG_SKILL_RECOGNITION when an organization revokes a skill recognition.
 * Per logic-overview.md:
 *   ORG_SKILL_RECOGNITION →|SkillRecognitionRevoked| ORGANIZATION_EVENT_BUS
 */
export interface SkillRecognitionRevokedPayload {
  organizationId: string;
  accountId: string;
  skillId: string;
  revokedBy: string;
}

/**
 * Published when a confirmed schedule assignment is completed (member returns to eligible).
 * Invariant #15: completed → eligible = true.
 */
export interface ScheduleCompletedPayload {
  scheduleItemId: string;
  workspaceId: string;
  orgId: string;
  targetAccountId: string;
  completedBy: string;
  completedAt: string;
  /**
   * Aggregate version when this event was produced. [R7]
   * Used by ELIGIBLE_UPDATE_GUARD to enforce monotonic aggregateVersion.
   */
  aggregateVersion: number;
  /** [R8] TraceID propagated from the originating command. */
  traceId?: string;
}

/**
 * Published when a confirmed schedule assignment is cancelled after it was confirmed
 * (post-assignment cancellation). The member's eligible flag is restored to true.
 * Invariant #15: cancelled → eligible = true.
 * Distinct from ScheduleProposalCancelledPayload (pre-assignment cancellation).
 */
export interface ScheduleAssignmentCancelledPayload {
  scheduleItemId: string;
  workspaceId: string;
  orgId: string;
  targetAccountId: string;
  cancelledBy: string;
  cancelledAt: string;
  reason?: string;
  /**
   * Aggregate version when this event was produced. [R7]
   * Used by ELIGIBLE_UPDATE_GUARD to enforce monotonic aggregateVersion.
   */
  aggregateVersion: number;
  /** [R8] TraceID propagated from the originating command. */
  traceId?: string;
}

/**
 * Compensating event (Invariant A5) — published when an HR operator manually cancels
 * a pending schedule proposal (SchedulingSlice Saga).
 * Mirrors ScheduleAssignRejectedPayload but represents a deliberate governance action
 * rather than an automatic skill-check failure.
 *
 * Per logic-overview.md VS6:
 *   SCHEDULE_SAGA["scheduling-saga\nScheduleAssignRejected\nScheduleProposalCancelled"]
 *   SCHEDULE_SAGA -.->|"#A5 compensating event"| ORG_EVENT_BUS
 */
export interface ScheduleProposalCancelledPayload {
  scheduleItemId: string;
  orgId: string;
  workspaceId: string;
  cancelledBy: string;
  cancelledAt: string;
  /** Human-readable reason for cancellation. */
  reason?: string;
  /** [R8] TraceID propagated from the originating scheduling saga. */
  traceId?: string;
}

// =================================================================
// == Event Key Map
// =================================================================

export interface OrganizationEventPayloadMap {
  'organization:schedule:assigned': ScheduleAssignedPayload;
  'organization:schedule:completed': ScheduleCompletedPayload;
  'organization:schedule:assignmentCancelled': ScheduleAssignmentCancelledPayload;
  'organization:schedule:assignRejected': ScheduleAssignRejectedPayload;
  'organization:schedule:proposalCancelled': ScheduleProposalCancelledPayload;
  'organization:policy:changed': OrgPolicyChangedPayload;
  'organization:member:joined': OrgMemberJoinedPayload;
  'organization:member:left': OrgMemberLeftPayload;
  'organization:team:updated': OrgTeamUpdatedPayload;
  'organization:skill:xpAdded': SkillXpAddedPayload;
  'organization:skill:xpDeducted': SkillXpDeductedPayload;
  'organization:skill:recognitionGranted': SkillRecognitionGrantedPayload;
  'organization:skill:recognitionRevoked': SkillRecognitionRevokedPayload;
}

export type OrganizationEventKey = keyof OrganizationEventPayloadMap;
