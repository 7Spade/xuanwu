/**
 * Module: relationship-visualizer
 * Purpose: VS8_WIKI ??Semantic relationship graph visualization [D21-I~W]
 * Responsibilities: Build read-only structural snapshots of the semantic graph
 *   that can be consumed by UI renderers (e.g., force-directed graph, hierarchy
 *   trees); produces pure data ??no rendering logic lives here
 * Constraints: deterministic logic, ZERO infrastructure imports, ZERO React imports
 *
 * semantic-graph.slice/relationship-visualizer [D21-I~W]
 *
 * Produces serializable snapshots of the semantic graph topology for
 * visualization consumers.  This module is part of the VS8_WIKI governance
 * entry point and exposes a pure-data API; all rendering decisions belong to
 * the UI layer.
 *
 * [D21-I] ?典??梯?敺???visualization data is globally observable.
 * [D21-W] 頝函?蝜?????all tag change history is publicly queryable.
 *
 * Dependency rule: imports from centralized-edges (adjacency-list) ONLY.
 * ZERO infrastructure imports (no Firebase, no React, no I/O).
 */

import {
  buildAdjacencyList,
  buildIsAAdjacencyList,
  buildRequiresAdjacencyList,
} from '../../../graph/edges/adjacency-list';
import { getAllEdges } from '../../../graph/edges/semantic-edge-store';
import type { SemanticRelationType } from '../../../core/types';

// ??? Types ????????????????????????????????????????????????????????????????????

/** A node in the visualization graph. */
export interface VisNode {
  readonly id: string;
  /** Display label (falls back to the raw slug). */
  readonly label: string;
  /** Category used for coloring/grouping in the UI. */
  readonly category: 'tag' | 'workspace-tag' | 'global-tag';
}

/** An edge in the visualization graph. */
export interface VisEdge {
  readonly source: string;
  readonly target: string;
  readonly relationType: SemanticRelationType;
}

/** A serializable snapshot of the full semantic graph ready for rendering. */
export interface GraphSnapshot {
  readonly nodes: readonly VisNode[];
  readonly edges: readonly VisEdge[];
  readonly generatedAt: string;
}

// ??? Helpers ?????????????????????????????????????????????????????????????????

function _slugToCategory(slug: string): VisNode['category'] {
  if (slug.startsWith('ws:')) return 'workspace-tag';
  return 'global-tag';
}

function _slugToLabel(slug: string): string {
  return slug.replace(/^ws:[^:]+:/, '').replace(/-/g, ' ');
}

function _buildNodes(adjacency: ReturnType<typeof buildAdjacencyList>): VisNode[] {
  const seen = new Set<string>();
  const nodes: VisNode[] = [];

  for (const [from, neighbours] of adjacency) {
    if (!seen.has(from)) {
      seen.add(from);
      nodes.push({ id: from, label: _slugToLabel(from), category: _slugToCategory(from) });
    }
    for (const to of neighbours) {
      if (!seen.has(to)) {
        seen.add(to);
        nodes.push({ id: to, label: _slugToLabel(to), category: _slugToCategory(to) });
      }
    }
  }

  return nodes;
}

// ??? Public API ???????????????????????????????????????????????????????????????

/**
 * Build a full graph snapshot (all relation types) from the current edge store.
 * [D21-I] globally observable.
 */
export function buildFullGraphSnapshot(): GraphSnapshot {
  const adjacency = buildAdjacencyList();
  const nodes = _buildNodes(adjacency);

  const edges: VisEdge[] = getAllEdges().map(e => ({
    source: e.fromTagSlug as string,
    target: e.toTagSlug as string,
    relationType: e.relationType,
  }));

  return {
    nodes,
    edges,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Build an IS_A hierarchy snapshot for subsumption tree rendering.
 */
export function buildIsAHierarchySnapshot(): GraphSnapshot {
  const adjacency = buildIsAAdjacencyList();
  const nodes = _buildNodes(adjacency);

  const edges: VisEdge[] = getAllEdges()
    .filter(e => e.relationType === 'IS_A')
    .map(e => ({
      source: e.fromTagSlug as string,
      target: e.toTagSlug as string,
      relationType: e.relationType,
    }));

  return {
    nodes,
    edges,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Build a REQUIRES dependency snapshot for dependency graph rendering.
 */
export function buildRequiresDependencySnapshot(): GraphSnapshot {
  const adjacency = buildRequiresAdjacencyList();
  const nodes = _buildNodes(adjacency);

  const edges: VisEdge[] = getAllEdges()
    .filter(e => e.relationType === 'REQUIRES')
    .map(e => ({
      source: e.fromTagSlug as string,
      target: e.toTagSlug as string,
      relationType: e.relationType,
    }));

  return {
    nodes,
    edges,
    generatedAt: new Date().toISOString(),
  };
}

