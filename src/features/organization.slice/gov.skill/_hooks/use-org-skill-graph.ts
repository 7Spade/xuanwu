/**
 * Module: gov.skill/_hooks/use-org-skill-graph
 * Purpose: React hook that subscribes to the org skill graph in real time.
 * Responsibilities: Subscribe on mount, unsubscribe on unmount, expose loading state.
 * Constraints: Client component context only ('use client' on the component using this hook).
 */

import { useEffect, useState } from 'react';

import { subscribeToOrgSkillGraph } from '@/shared-infra/frontend-firebase/firestore/firestore.facade';

import type { OrgSkillGraph } from '../_types';

/** Loading state wrapper for the org skill graph. */
export interface OrgSkillGraphState {
  graph: OrgSkillGraph;
  loading: boolean;
}

const EMPTY_GRAPH: OrgSkillGraph = { nodes: [], edges: [] };

/**
 * Subscribes to the organization skill graph and returns up-to-date nodes and edges.
 * @param orgId The organization ID to subscribe to.
 */
export function useOrgSkillGraph(orgId: string): OrgSkillGraphState {
  const [graph, setGraph] = useState<OrgSkillGraph>(EMPTY_GRAPH);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;

    setLoading(true);

    const unsubscribe = subscribeToOrgSkillGraph(orgId, (updated) => {
      setGraph(updated);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [orgId]);

  return { graph, loading };
}
