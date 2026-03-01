'use server';

/**
 * account-organization.policy — _actions.ts
 *
 * Server actions for organization-level policy management.
 *
 * Per logic-overview.md:
 *   ORGANIZATION_EVENT_BUS →|政策變更事件| WORKSPACE_ORG_POLICY_CACHE
 *   Policy changes flow through the org event bus to update workspace's local org-policy cache.
 *
 * Per logic-overview.md [R4] COMMAND_RESULT_CONTRACT:
 *   All mutations return CommandResult discriminated union.
 *
 * Invariant #1: This BC only writes its own aggregate.
 */

import { addDocument, updateDocument, deleteDocument } from '@/shared/infra/firestore/firestore.write.adapter';
import { publishOrgEvent } from '../core.event-bus';
import {
  type CommandResult,
  commandSuccess,
  commandFailureFrom,
} from '@/features/shared-kernel';

export interface OrgPolicy {
  id: string;
  orgId: string;
  name: string;
  description: string;
  rules: OrgPolicyRule[];
  scope: 'workspace' | 'member' | 'global';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrgPolicyRule {
  resource: string;
  actions: string[];
  effect: 'allow' | 'deny';
  conditions?: Record<string, string>;
}

export interface CreateOrgPolicyInput {
  orgId: string;
  name: string;
  description: string;
  rules: OrgPolicyRule[];
  scope: OrgPolicy['scope'];
}

export interface UpdateOrgPolicyInput {
  name?: string;
  description?: string;
  rules?: OrgPolicyRule[];
  scope?: OrgPolicy['scope'];
  isActive?: boolean;
}

/**
 * Creates a new organization policy.
 * Publishes OrgPolicyChanged event → workspace org-policy-cache updates downstream.
 */
export async function createOrgPolicy(input: CreateOrgPolicyInput): Promise<CommandResult> {
  try {
    const now = new Date().toISOString();
    const ref = await addDocument<Omit<OrgPolicy, 'id'>>(
      `orgPolicies`,
      {
        orgId: input.orgId,
        name: input.name,
        description: input.description,
        rules: input.rules,
        scope: input.scope,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      }
    );

    await publishOrgEvent('organization:policy:changed', {
      orgId: input.orgId,
      policyId: ref.id,
      changeType: 'created',
      changedBy: input.orgId,
    });

    return commandSuccess(ref.id, Date.now());
  } catch (err) {
    return commandFailureFrom(
      'CREATE_ORG_POLICY_FAILED',
      err instanceof Error ? err.message : 'Failed to create org policy'
    );
  }
}

/**
 * Updates an existing organization policy.
 */
export async function updateOrgPolicy(
  policyId: string,
  orgId: string,
  input: UpdateOrgPolicyInput
): Promise<CommandResult> {
  try {
    await updateDocument(`orgPolicies/${policyId}`, {
      ...input,
      updatedAt: new Date().toISOString(),
    });

    await publishOrgEvent('organization:policy:changed', {
      orgId,
      policyId,
      changeType: 'updated',
      changedBy: orgId,
    });

    return commandSuccess(policyId, Date.now());
  } catch (err) {
    return commandFailureFrom(
      'UPDATE_ORG_POLICY_FAILED',
      err instanceof Error ? err.message : 'Failed to update org policy'
    );
  }
}

/**
 * Deletes an organization policy.
 */
export async function deleteOrgPolicy(policyId: string, orgId: string): Promise<CommandResult> {
  try {
    await deleteDocument(`orgPolicies/${policyId}`);

    await publishOrgEvent('organization:policy:changed', {
      orgId,
      policyId,
      changeType: 'deleted',
      changedBy: orgId,
    });

    return commandSuccess(policyId, Date.now());
  } catch (err) {
    return commandFailureFrom(
      'DELETE_ORG_POLICY_FAILED',
      err instanceof Error ? err.message : 'Failed to delete org policy'
    );
  }
}
