'use server';

/**
 * Module: gov.semantic/_actions
 * Purpose: Server action wrappers for organization semantic dictionaries.
 * Responsibilities: Expose command-result-based mutation APIs for org task-type and skill-type dictionaries.
 * Constraints: deterministic logic, respect module boundaries
 */

import type { CommandResult, SkillRequirement } from '@/shared-kernel';
import { commandFailureFrom, commandSuccess } from '@/shared-kernel';

import {
  addOrgSkillType,
  addOrgTaskType,
  removeOrgSkillType,
  removeOrgTaskType,
  updateOrgSkillType,
  updateOrgTaskType,
} from './_registry';

export async function addOrgTaskTypeAction(
  orgId: string,
  slug: string,
  name: string,
  actorId: string,
  options?: {
    aliases?: string[];
    description?: string;
    requiredSkills?: SkillRequirement[];
  }
): Promise<CommandResult> {
  try {
    await addOrgTaskType(orgId, slug, name, actorId, options);
    return commandSuccess(slug, Date.now());
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return commandFailureFrom('ADD_ORG_TASK_TYPE_FAILED', message);
  }
}

export async function updateOrgTaskTypeAction(
  orgId: string,
  slug: string,
  updates: {
    name?: string;
    aliases?: string[];
    description?: string;
    active?: boolean;
    requiredSkills?: SkillRequirement[];
  }
): Promise<CommandResult> {
  try {
    await updateOrgTaskType(orgId, slug, updates);
    return commandSuccess(slug, Date.now());
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return commandFailureFrom('UPDATE_ORG_TASK_TYPE_FAILED', message);
  }
}

export async function removeOrgTaskTypeAction(
  orgId: string,
  slug: string
): Promise<CommandResult> {
  try {
    await removeOrgTaskType(orgId, slug);
    return commandSuccess(slug, Date.now());
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return commandFailureFrom('REMOVE_ORG_TASK_TYPE_FAILED', message);
  }
}

export async function addOrgSkillTypeAction(
  orgId: string,
  slug: string,
  name: string,
  actorId: string,
  options?: {
    aliases?: string[];
    description?: string;
  }
): Promise<CommandResult> {
  try {
    await addOrgSkillType(orgId, slug, name, actorId, options);
    return commandSuccess(slug, Date.now());
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return commandFailureFrom('ADD_ORG_SKILL_TYPE_FAILED', message);
  }
}

export async function updateOrgSkillTypeAction(
  orgId: string,
  slug: string,
  updates: {
    name?: string;
    aliases?: string[];
    description?: string;
    active?: boolean;
  }
): Promise<CommandResult> {
  try {
    await updateOrgSkillType(orgId, slug, updates);
    return commandSuccess(slug, Date.now());
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return commandFailureFrom('UPDATE_ORG_SKILL_TYPE_FAILED', message);
  }
}

export async function removeOrgSkillTypeAction(
  orgId: string,
  slug: string
): Promise<CommandResult> {
  try {
    await removeOrgSkillType(orgId, slug);
    return commandSuccess(slug, Date.now());
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return commandFailureFrom('REMOVE_ORG_SKILL_TYPE_FAILED', message);
  }
}
