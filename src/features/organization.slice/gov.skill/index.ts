/**
 * organization.slice/gov.skill — Public API
 *
 * Organization-managed skill graph.
 * Each organization owns its own skill nodes and directed edges,
 * stored in Firestore under orgSkillGraph/{orgId}/nodes and /edges.
 *
 * The vis-network graph editor component provides an interactive UI
 * for adding, editing, and deleting nodes/edges directly.
 */

// Types
export type { OrgSkillNode, OrgSkillEdge, OrgSkillGraph, OrgSkillNodeGroup } from './_types';

// Server Actions
export {
  addOrgSkillNodeAction,
  editOrgSkillNodeAction,
  deleteOrgSkillNodeAction,
  addOrgSkillEdgeAction,
  deleteOrgSkillEdgeAction,
} from './_actions';
export type {
  AddOrgSkillNodeInput,
  EditOrgSkillNodeInput,
  DeleteOrgSkillNodeInput,
  AddOrgSkillEdgeInput,
  DeleteOrgSkillEdgeInput,
} from './_actions';

// React hook
export { useOrgSkillGraph } from './_hooks/use-org-skill-graph';
export type { OrgSkillGraphState } from './_hooks/use-org-skill-graph';

// Client component
export { OrgSkillGraphEditor } from './_components/org-skill-graph-editor';
