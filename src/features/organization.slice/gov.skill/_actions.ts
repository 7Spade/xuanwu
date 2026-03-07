/**
 * Module: gov.skill/_actions
 * Purpose: Server Actions for organization-managed skill graph (nodes + edges).
 * Responsibilities: Validate input, call infra repository helpers, return CommandResult.
 * Constraints: 'use server'; no direct Firebase SDK imports ([D3][D24]).
 */

'use server';

import { randomUUID } from 'crypto';

import {
  upsertOrgSkillNode,
  deleteOrgSkillNode,
  upsertOrgSkillEdge,
  deleteOrgSkillEdge,
} from '@/shared-infra/frontend-firebase/firestore/firestore.facade';
import {
  type CommandResult,
  commandSuccess,
  commandFailureFrom,
} from '@/shared-kernel';

import type { OrgSkillNode, OrgSkillEdge, OrgSkillNodeGroup } from './_types';

// ---------------------------------------------------------------------------
// Add node
// ---------------------------------------------------------------------------

export interface AddOrgSkillNodeInput {
  orgId: string;
  label: string;
  group: OrgSkillNodeGroup;
  description?: string;
  actorId: string;
}

export async function addOrgSkillNodeAction(
  input: AddOrgSkillNodeInput
): Promise<CommandResult> {
  try {
    const node: OrgSkillNode = {
      id: randomUUID(),
      label: input.label.trim(),
      group: input.group,
      description: input.description?.trim(),
      addedAt: new Date().toISOString(),
      addedBy: input.actorId,
    };
    await upsertOrgSkillNode(input.orgId, node);
    return commandSuccess(node.id, Date.now());
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return commandFailureFrom('ADD_ORG_SKILL_NODE_FAILED', message);
  }
}

// ---------------------------------------------------------------------------
// Edit node
// ---------------------------------------------------------------------------

export interface EditOrgSkillNodeInput {
  orgId: string;
  nodeId: string;
  label: string;
  group: OrgSkillNodeGroup;
  description?: string;
  actorId: string;
}

export async function editOrgSkillNodeAction(
  input: EditOrgSkillNodeInput
): Promise<CommandResult> {
  try {
    const node: OrgSkillNode = {
      id: input.nodeId,
      label: input.label.trim(),
      group: input.group,
      description: input.description?.trim(),
      addedAt: new Date().toISOString(),
      addedBy: input.actorId,
    };
    await upsertOrgSkillNode(input.orgId, node);
    return commandSuccess(input.nodeId, Date.now());
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return commandFailureFrom('EDIT_ORG_SKILL_NODE_FAILED', message);
  }
}

// ---------------------------------------------------------------------------
// Delete node
// ---------------------------------------------------------------------------

export interface DeleteOrgSkillNodeInput {
  orgId: string;
  nodeId: string;
}

export async function deleteOrgSkillNodeAction(
  input: DeleteOrgSkillNodeInput
): Promise<CommandResult> {
  try {
    await deleteOrgSkillNode(input.orgId, input.nodeId);
    return commandSuccess(input.nodeId, Date.now());
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return commandFailureFrom('DELETE_ORG_SKILL_NODE_FAILED', message);
  }
}

// ---------------------------------------------------------------------------
// Add edge
// ---------------------------------------------------------------------------

export interface AddOrgSkillEdgeInput {
  orgId: string;
  from: string;
  to: string;
  label?: string;
  actorId: string;
}

export async function addOrgSkillEdgeAction(
  input: AddOrgSkillEdgeInput
): Promise<CommandResult> {
  try {
    const edge: OrgSkillEdge = {
      id: randomUUID(),
      from: input.from,
      to: input.to,
      label: input.label?.trim(),
      addedAt: new Date().toISOString(),
      addedBy: input.actorId,
    };
    await upsertOrgSkillEdge(input.orgId, edge);
    return commandSuccess(edge.id, Date.now());
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return commandFailureFrom('ADD_ORG_SKILL_EDGE_FAILED', message);
  }
}

// ---------------------------------------------------------------------------
// Delete edge
// ---------------------------------------------------------------------------

export interface DeleteOrgSkillEdgeInput {
  orgId: string;
  edgeId: string;
}

export async function deleteOrgSkillEdgeAction(
  input: DeleteOrgSkillEdgeInput
): Promise<CommandResult> {
  try {
    await deleteOrgSkillEdge(input.orgId, input.edgeId);
    return commandSuccess(input.edgeId, Date.now());
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return commandFailureFrom('DELETE_ORG_SKILL_EDGE_FAILED', message);
  }
}
