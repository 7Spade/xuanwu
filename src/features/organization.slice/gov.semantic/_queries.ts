/**
 * Module: gov.semantic/_queries
 * Purpose: Read queries for organization semantic dictionaries.
 * Responsibilities: Provide task-type and skill-type dictionary read APIs for VS4/VS5 consumers.
 * Constraints: deterministic logic, respect module boundaries
 */

import { db } from '@/shared-infra/frontend-firebase';
import { collection, getDocs, type QueryDocumentSnapshot } from '@/shared-infra/frontend-firebase/firestore/firestore.read.adapter';
import { getDocument } from '@/shared-infra/frontend-firebase/firestore/firestore.read.adapter';

import type { OrgSkillTypeEntry, OrgTaskTypeEntry } from './_types';

export async function getOrgTaskType(
  orgId: string,
  slug: string
): Promise<OrgTaskTypeEntry | null> {
  return getDocument<OrgTaskTypeEntry>(`orgSemanticRegistry/${orgId}/taskTypes/${slug}`);
}

export async function getOrgTaskTypes(orgId: string): Promise<OrgTaskTypeEntry[]> {
  const snap = await getDocs(collection(db, `orgSemanticRegistry/${orgId}/taskTypes`));
  return snap.docs.map((d: QueryDocumentSnapshot) => d.data() as OrgTaskTypeEntry);
}

export async function getOrgSkillType(
  orgId: string,
  slug: string
): Promise<OrgSkillTypeEntry | null> {
  return getDocument<OrgSkillTypeEntry>(`orgSemanticRegistry/${orgId}/skillTypes/${slug}`);
}

export async function getOrgSkillTypes(orgId: string): Promise<OrgSkillTypeEntry[]> {
  const snap = await getDocs(collection(db, `orgSemanticRegistry/${orgId}/skillTypes`));
  return snap.docs.map((d: QueryDocumentSnapshot) => d.data() as OrgSkillTypeEntry);
}
