/**
 * organization.slice/gov.semantic — Public API
 *
 * Organization semantic dictionaries.
 * VS4 owner of organization-scoped task-type and skill-type registries.
 */

export type {
  OrgSemanticNamespace,
  OrgSkillTypeEntry,
  OrgTaskTypeEntry,
  OrgSemanticEntry,
  ResolveOrgTaskTypeInput,
  ResolvedOrgTaskType,
} from './_types';

export {
  addOrgTaskType,
  updateOrgTaskType,
  removeOrgTaskType,
  addOrgSkillType,
  updateOrgSkillType,
  removeOrgSkillType,
  resolveOrgTaskTypeByItemName,
} from './_registry';

export {
  getOrgTaskType,
  getOrgTaskTypes,
  getOrgSkillType,
  getOrgSkillTypes,
} from './_queries';

export {
  addOrgTaskTypeAction,
  updateOrgTaskTypeAction,
  removeOrgTaskTypeAction,
  addOrgSkillTypeAction,
  updateOrgSkillTypeAction,
  removeOrgSkillTypeAction,
} from './_actions';
