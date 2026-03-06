/**
 * semantic-graph.slice/centralized-causality ??Causality Tracer [D21-6]
 *
 * The CausalityTracer is the computation engine for L3 VS8_NG (Neural Computation).
 * It produces causality chains consumed by VS8_ROUT (L4 Reflection Arc)
 * (Routing Layer).  It answers: "If a TagLifecycleEvent is emitted for tag X,
 * which other tags are semantically affected, in what order, and what
 * downstream lifecycle transitions should be suggested?"
 *
 * Architecture:
 *   [D21-5] VS8_ROUT receives causality chains and dispatches downstream commands.
 *   [D21-6] Causality chains are computed here; no I/O, no infrastructure.
 *   [D3]    Downstream events are advisory; actual mutations go through _actions.ts.
 *   [D8]    Lives in semantic-graph.slice, not shared-kernel.
 *
 * Dependency rule: reads only from centralized-edges and centralized-neural-net.
 */

import { tagSlugRef } from '@/shared-kernel';

import { getEdgesFrom, getEdgesTo } from '../centralized-edges/semantic-edge-store';
import { computeRelationWeight } from '../centralized-neural-net/neural-network';
import type {
  AffectedNode,
  CausalityChain,
  CausalityReason,
  DownstreamEvent,
  TagLifecycleEvent,
  TagLifecycleState,
} from '../centralized-types';

// ?€?€?€ BFS traversal ?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€

interface _TraversalEntry {
  slug: string;
  hopCount: number;
  directReason: CausalityReason;
}

/**
 * BFS over outgoing edges from `sourceSlug` to find all reachable nodes within
 * `maxHops`.  Nodes reachable via multiple paths get the entry with the most
 * direct relationship reason and lowest hopCount.
 *
 * @param sourceSlug     ??slug of the source node
 * @param candidateSlugs ??allow-list; if non-empty, only slugs in this set are
 *                         included in the result (source itself is always excluded)
 * @param maxHops        ??maximum BFS depth
 */
function _bfsAffected(
  sourceSlug: string,
  candidateSlugs: ReadonlySet<string>,
  maxHops: number
): Map<string, _TraversalEntry> {
  const result = new Map<string, _TraversalEntry>();

  // Seed: direct IS_A children + direct REQUIRES dependants
  const queue: Array<_TraversalEntry> = [];

  for (const edge of getEdgesFrom(sourceSlug)) {
    const reason: CausalityReason =
      edge.relationType === 'IS_A' ? 'IS_A_CHILD' : 'REQUIRES_DEPENDENCY';
    queue.push({ slug: edge.toTagSlug, hopCount: 1, directReason: reason });
  }

  // Nodes that REQUIRE the source are also affected
  for (const edge of getEdgesTo(sourceSlug)) {
    if (edge.relationType === 'REQUIRES') {
      queue.push({
        slug: edge.fromTagSlug,
        hopCount: 1,
        directReason: 'REQUIRES_DEPENDENCY',
      });
    }
  }

  const visited = new Set<string>([sourceSlug]);

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (visited.has(current.slug)) continue;
    visited.add(current.slug);

    // Respect candidate allow-list when one is provided
    if (candidateSlugs.size > 0 && !candidateSlugs.has(current.slug)) {
      // Still traverse through this node (it may reach a candidate), but don't record it
    } else if (current.slug !== sourceSlug) {
      const existing = result.get(current.slug);
      if (!existing || current.hopCount < existing.hopCount) {
        result.set(current.slug, current);
      }
    }

    if (current.hopCount >= maxHops) continue;

    // Continue BFS for IS_A children (transitive)
    for (const edge of getEdgesFrom(current.slug)) {
      if (!visited.has(edge.toTagSlug)) {
        queue.push({
          slug: edge.toTagSlug,
          hopCount: current.hopCount + 1,
          directReason: 'TRANSITIVE',
        });
      }
    }
  }

  return result;
}

// ?€?€?€ Downstream event generation ?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€

/**
 * Suggest a downstream lifecycle transition for an affected node given the
 * source event and the node's relationship to the source.
 *
 * Rules:
 *   - TAG_DEPRECATED ??immediate Deprecated for direct IS_A children;
 *     deferred for REQUIRES-dependants and transitive nodes.
 *   - TAG_STALE_FLAGGED ??deferred Stale suggestion for IS_A children.
 *   - TAG_ACTIVATED ??deferred Active re-activation for IS_A children.
 *   - TAG_CREATED / TAG_DELETED ??no automatic downstream.
 */
function _suggestDownstreamEvent(
  targetSlug: string,
  reason: CausalityReason,
  sourceEventType: TagLifecycleEvent['eventType']
): DownstreamEvent | null {
  if (sourceEventType === 'TAG_DEPRECATED') {
    const priority: DownstreamEvent['priority'] =
      reason === 'IS_A_CHILD' ? 'immediate' : 'deferred';
    return {
      targetTagSlug: tagSlugRef(targetSlug),
      suggestedTransition: 'Deprecated' as TagLifecycleState,
      reason: `Parent/dependency deprecated ??propagated via ${reason}`,
      priority,
    };
  }

  if (sourceEventType === 'TAG_STALE_FLAGGED') {
    const priority: DownstreamEvent['priority'] =
      reason === 'IS_A_CHILD' ? 'immediate' : 'deferred';
    return {
      targetTagSlug: tagSlugRef(targetSlug),
      suggestedTransition: 'Stale' as TagLifecycleState,
      reason: `Parent stale flag propagated via ${reason}`,
      priority,
    };
  }

  if (sourceEventType === 'TAG_ACTIVATED' && reason === 'IS_A_CHILD') {
    return {
      targetTagSlug: tagSlugRef(targetSlug),
      suggestedTransition: 'Active' as TagLifecycleState,
      reason: `Parent re-activated; child ${targetSlug} may be eligible for re-activation`,
      priority: 'deferred',
    };
  }

  return null;
}

// ?€?€?€ Public API ?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€

/**
 * Return all nodes directly or transitively affected by a lifecycle event,
 * filtered to the provided candidate slug allow-list.
 *
 * The source node itself is never included in the result.
 *
 * @param event          ??the lifecycle event that triggered the trace
 * @param candidateSlugs ??slugs to consider; pass an empty array to trace the
 *                         entire graph (no filtering)
 * @param maxHops        ??max BFS traversal depth (default 5)
 */
export function traceAffectedNodes(
  event: TagLifecycleEvent,
  candidateSlugs: readonly string[],
  maxHops = 5
): readonly AffectedNode[] {
  const sourceSlug = event.tagSlug as string;
  const candidateSet = new Set(candidateSlugs);

  const entries = _bfsAffected(sourceSlug, candidateSet, maxHops);

  // When a candidate allow-list is provided, drop any result not in the list
  const nodes: AffectedNode[] = Array.from(entries.values())
    .filter((e) => candidateSet.size === 0 || candidateSet.has(e.slug))
    .map((e) => ({
      tagSlug: tagSlugRef(e.slug),
      reason: e.directReason,
      hopCount: e.hopCount,
      semanticWeight: computeRelationWeight(sourceSlug, e.slug),
    }));

  return rankAffectedNodes(nodes);
}

/**
 * Sort affected nodes by (hopCount asc, semanticWeight desc).
 *
 * Returns a new array; the input is never mutated.
 */
export function rankAffectedNodes(nodes: readonly AffectedNode[]): readonly AffectedNode[] {
  return [...nodes].sort(
    (a, b) => a.hopCount - b.hopCount || b.semanticWeight - a.semanticWeight
  );
}

/**
 * Build the advisory downstream lifecycle events for a set of affected nodes.
 *
 * These are advisory signals; the caller (VS8_ROUT) decides whether to apply them.
 *
 * TAG_DELETED source ??no downstream events (nothing to lifecycle-manage).
 *
 * @param event         ??the lifecycle event that triggered the chain
 * @param affectedNodes ??nodes computed by traceAffectedNodes
 */
export function buildDownstreamEvents(
  event: TagLifecycleEvent,
  affectedNodes: readonly AffectedNode[]
): readonly DownstreamEvent[] {
  // TAG_DELETED: hard delete ??no cascading lifecycle management
  if (event.eventType === 'TAG_DELETED') return [];

  const downstream: DownstreamEvent[] = [];
  for (const node of affectedNodes) {
    const suggestion = _suggestDownstreamEvent(
      node.tagSlug as string,
      node.reason,
      event.eventType
    );
    if (suggestion) downstream.push(suggestion);
  }
  return downstream;
}

/**
 * Build the full CausalityChain for a TagLifecycleEvent [D21-6].
 *
 * The returned chain is consumed by VS8_ROUT to dispatch downstream commands
 * without hardcoding relationships (configuration-driven routing).
 *
 * @param event          ??the lifecycle event that triggered the chain
 * @param candidateSlugs ??slugs to consider; pass an empty array to trace the
 *                         entire graph (no filtering)
 * @param maxHops        ??max BFS traversal depth (default 5)
 */
export function buildCausalityChain(
  event: TagLifecycleEvent,
  candidateSlugs: readonly string[],
  maxHops = 5
): CausalityChain {
  const affectedNodes = traceAffectedNodes(event, candidateSlugs, maxHops);
  const downstreamEvents = buildDownstreamEvents(event, affectedNodes);

  return {
    sourceEvent: event,
    affectedNodes,
    downstreamEvents,
    computedAt: new Date().toISOString(),
  };
}
