/**
 * Module: gov.semantic/_registry
 * Purpose: Organization semantic dictionary aggregate operations.
 * Responsibilities: Maintain org task-type and skill-type dictionary entries in Firestore.
 * Constraints: deterministic logic, respect module boundaries
 */

import { getDocument } from '@/shared-infra/frontend-firebase/firestore/firestore.read.adapter';
import {
  deleteDocument,
  setDocument,
  updateDocument,
} from '@/shared-infra/frontend-firebase/firestore/firestore.write.adapter';
import type { SkillRequirement } from '@/shared-kernel';

import type {
  OrgSkillTypeEntry,
  OrgTaskTypeEntry,
  ResolvedOrgTaskType,
} from './_types';

function taskTypePath(orgId: string, slug: string): string {
  return `orgSemanticRegistry/${orgId}/taskTypes/${slug}`;
}

function skillTypePath(orgId: string, slug: string): string {
  return `orgSemanticRegistry/${orgId}/skillTypes/${slug}`;
}

export async function addOrgTaskType(
  orgId: string,
  slug: string,
  name: string,
  actorId: string,
  options?: {
    aliases?: string[];
    description?: string;
    requiredSkills?: SkillRequirement[];
  }
): Promise<void> {
  const path = taskTypePath(orgId, slug);
  const existing = await getDocument<OrgTaskTypeEntry>(path);
  if (existing) return;

  await setDocument(path, {
    orgId,
    slug,
    name,
    namespace: 'task-type',
    aliases: options?.aliases ?? [],
    ...(options?.description ? { description: options.description } : {}),
    active: true,
    requiredSkills: options?.requiredSkills ?? [],
    addedBy: actorId,
    addedAt: new Date().toISOString(),
  } satisfies OrgTaskTypeEntry);
}

export async function updateOrgTaskType(
  orgId: string,
  slug: string,
  updates: {
    name?: string;
    aliases?: string[];
    description?: string;
    active?: boolean;
    requiredSkills?: SkillRequirement[];
  }
): Promise<void> {
  const path = taskTypePath(orgId, slug);
  const existing = await getDocument<OrgTaskTypeEntry>(path);
  if (!existing) {
    throw new Error(`Task type "${slug}" not found in organization "${orgId}".`);
  }

  await updateDocument(path, {
    ...(updates.name !== undefined ? { name: updates.name } : {}),
    ...(updates.aliases !== undefined ? { aliases: updates.aliases } : {}),
    ...(updates.description !== undefined ? { description: updates.description } : {}),
    ...(updates.active !== undefined ? { active: updates.active } : {}),
    ...(updates.requiredSkills !== undefined ? { requiredSkills: updates.requiredSkills } : {}),
    updatedAt: new Date().toISOString(),
  });
}

export async function removeOrgTaskType(orgId: string, slug: string): Promise<void> {
  const path = taskTypePath(orgId, slug);
  const existing = await getDocument<OrgTaskTypeEntry>(path);
  if (!existing) return;
  await deleteDocument(path);
}

export async function addOrgSkillType(
  orgId: string,
  slug: string,
  name: string,
  actorId: string,
  options?: {
    aliases?: string[];
    description?: string;
  }
): Promise<void> {
  const path = skillTypePath(orgId, slug);
  const existing = await getDocument<OrgSkillTypeEntry>(path);
  if (existing) return;

  await setDocument(path, {
    orgId,
    slug,
    name,
    namespace: 'skill-type',
    aliases: options?.aliases ?? [],
    ...(options?.description ? { description: options.description } : {}),
    active: true,
    addedBy: actorId,
    addedAt: new Date().toISOString(),
  } satisfies OrgSkillTypeEntry);
}

export async function updateOrgSkillType(
  orgId: string,
  slug: string,
  updates: {
    name?: string;
    aliases?: string[];
    description?: string;
    active?: boolean;
  }
): Promise<void> {
  const path = skillTypePath(orgId, slug);
  const existing = await getDocument<OrgSkillTypeEntry>(path);
  if (!existing) {
    throw new Error(`Skill type "${slug}" not found in organization "${orgId}".`);
  }

  await updateDocument(path, {
    ...(updates.name !== undefined ? { name: updates.name } : {}),
    ...(updates.aliases !== undefined ? { aliases: updates.aliases } : {}),
    ...(updates.description !== undefined ? { description: updates.description } : {}),
    ...(updates.active !== undefined ? { active: updates.active } : {}),
    updatedAt: new Date().toISOString(),
  });
}

export async function removeOrgSkillType(orgId: string, slug: string): Promise<void> {
  const path = skillTypePath(orgId, slug);
  const existing = await getDocument<OrgSkillTypeEntry>(path);
  if (!existing) return;
  await deleteDocument(path);
}

export function resolveOrgTaskTypeByItemName(
  itemName: string,
  taskTypes: OrgTaskTypeEntry[]
): ResolvedOrgTaskType | null {
  const normalized = itemName.trim().toLowerCase();
  if (normalized.length === 0) return null;

  const match = taskTypes.find((entry) => {
    if (!entry.active) return false;
    if (entry.name.trim().toLowerCase() === normalized) return true;
    return entry.aliases.some((alias) => alias.trim().toLowerCase() === normalized);
  });

  if (!match) return null;

  return {
    taskTypeSlug: match.slug,
    taskTypeName: match.name,
    requiredSkills: match.requiredSkills,
  };
}
