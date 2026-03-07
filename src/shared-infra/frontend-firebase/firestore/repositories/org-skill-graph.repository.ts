/**
 * @fileoverview Org Skill Graph Repository.
 *
 * Firestore CRUD helpers for the organization-managed skill graph.
 * Nodes and edges are stored at:
 *   orgSkillGraph/{orgId}/nodes/{nodeId}
 *   orgSkillGraph/{orgId}/edges/{edgeId}
 *
 * This file is part of the FIREBASE_ACL infra boundary and may import
 * from 'firebase/firestore' directly ([D24] boundary enforcement).
 */

import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  type Query,
  type Unsubscribe,
} from 'firebase/firestore';

import { db } from '../firestore.client';
import { setDoc, deleteDoc } from 'firebase/firestore';

import type { OrgSkillNode, OrgSkillEdge, OrgSkillGraph } from '../../../../features/organization.slice/gov.skill/_types';

// ---------------------------------------------------------------------------
// Internal path helpers
// ---------------------------------------------------------------------------

const nodesPath = (orgId: string) => `orgSkillGraph/${orgId}/nodes`;
const edgesPath = (orgId: string) => `orgSkillGraph/${orgId}/edges`;

// ---------------------------------------------------------------------------
// Read helpers
// ---------------------------------------------------------------------------

/** Fetch the full org skill graph once (nodes + edges). */
export async function getOrgSkillGraph(orgId: string): Promise<OrgSkillGraph> {
  const nodeQuery: Query = query(collection(db, nodesPath(orgId)));
  const edgeQuery: Query = query(collection(db, edgesPath(orgId)));

  const [nodeSnap, edgeSnap] = await Promise.all([
    getDocs(nodeQuery),
    getDocs(edgeQuery),
  ]);

  const nodes = nodeSnap.docs.map((d) => ({ id: d.id, ...d.data() } as OrgSkillNode));
  const edges = edgeSnap.docs.map((d) => ({ id: d.id, ...d.data() } as OrgSkillEdge));

  return { nodes, edges };
}

/** Subscribe to real-time updates of the org skill graph.
 *  Returns a composite unsubscribe function.
 */
export function subscribeToOrgSkillGraph(
  orgId: string,
  onUpdate: (graph: OrgSkillGraph) => void
): Unsubscribe {
  let latestNodes: OrgSkillNode[] = [];
  let latestEdges: OrgSkillEdge[] = [];

  function emit() {
    onUpdate({ nodes: [...latestNodes], edges: [...latestEdges] });
  }

  const unsubNodes = onSnapshot(
    query(collection(db, nodesPath(orgId))),
    (snap) => {
      latestNodes = snap.docs.map((d) => ({ id: d.id, ...d.data() } as OrgSkillNode));
      emit();
    }
  );

  const unsubEdges = onSnapshot(
    query(collection(db, edgesPath(orgId))),
    (snap) => {
      latestEdges = snap.docs.map((d) => ({ id: d.id, ...d.data() } as OrgSkillEdge));
      emit();
    }
  );

  return () => {
    unsubNodes();
    unsubEdges();
  };
}

// ---------------------------------------------------------------------------
// Write helpers
// ---------------------------------------------------------------------------

/** Upsert a skill node (idempotent by node.id). */
export async function upsertOrgSkillNode(orgId: string, node: OrgSkillNode): Promise<void> {
  const { id, ...data } = node;
  await setDoc(doc(db, nodesPath(orgId), id), data);
}

/** Delete a skill node by ID. */
export async function deleteOrgSkillNode(orgId: string, nodeId: string): Promise<void> {
  await deleteDoc(doc(db, nodesPath(orgId), nodeId));
}

/** Upsert a skill edge (idempotent by edge.id). */
export async function upsertOrgSkillEdge(orgId: string, edge: OrgSkillEdge): Promise<void> {
  const { id, ...data } = edge;
  await setDoc(doc(db, edgesPath(orgId), id), data);
}

/** Delete a skill edge by ID. */
export async function deleteOrgSkillEdge(orgId: string, edgeId: string): Promise<void> {
  await deleteDoc(doc(db, edgesPath(orgId), edgeId));
}
