/**
 * Module: gov.skill/_types
 * Purpose: Domain types for organization-managed skill graph.
 * Responsibilities: Define node/edge shapes stored in Firestore and consumed by vis-network.
 * Constraints: deterministic logic, no async, no side effects.
 */

// ---------------------------------------------------------------------------
// Node types
// ---------------------------------------------------------------------------

/** The visual / semantic role of a skill node in the org graph. */
export type OrgSkillNodeGroup = 'category' | 'skill';

/** A single node in the org-owned skill graph. */
export interface OrgSkillNode {
  /** Stable document ID used by Firestore and as vis-network node id. */
  id: string;
  /** Human-readable display label shown in the graph. */
  label: string;
  /** Semantic role that determines visual rendering. */
  group: OrgSkillNodeGroup;
  /** Optional longer description surfaced in node tooltip. */
  description?: string;
  /** ISO-8601 timestamp of creation. */
  addedAt: string;
  /** Account ID of the admin who created this node. */
  addedBy: string;
}

// ---------------------------------------------------------------------------
// Edge types
// ---------------------------------------------------------------------------

/** A directed edge connecting two nodes in the org skill graph. */
export interface OrgSkillEdge {
  /** Stable document ID used by Firestore and as vis-network edge id. */
  id: string;
  /** Source node ID. */
  from: string;
  /** Target node ID. */
  to: string;
  /** Optional relationship label shown on the edge. */
  label?: string;
  /** ISO-8601 timestamp of creation. */
  addedAt: string;
  /** Account ID of the admin who created this edge. */
  addedBy: string;
}

// ---------------------------------------------------------------------------
// Graph aggregate
// ---------------------------------------------------------------------------

/** The full skill graph for one organization. */
export interface OrgSkillGraph {
  nodes: OrgSkillNode[];
  edges: OrgSkillEdge[];
}
