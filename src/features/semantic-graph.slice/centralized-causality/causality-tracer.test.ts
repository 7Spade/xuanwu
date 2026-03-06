/**
 * @test VS8 Semantic Graph ??Causality Tracer [D21-6]
 *
 * Validates pure business logic in centralized-causality/causality-tracer.ts:
 *   1. traceAffectedNodes   ??BFS from source; populates hopCount + semanticWeight
 *   2. rankAffectedNodes    ??order by (hopCount asc, semanticWeight desc)
 *   3. buildDownstreamEvents ??advisory lifecycle events for each AffectedNode
 *   4. buildCausalityChain  ??end-to-end CausalityChain assembly
 *
 * Architecture:
 *   [D21-6] Causality Tracer bridges Neural Network graph distances with
 *           lifecycle management ??triggered by TagLifecycleEvents, produces
 *           advisory DownstreamEvents for the VS8 Routing Layer (VS8_RL).
 *   [D21-3] Edge weights drive semanticWeight accumulation.
 *   [D8]    All tag logic stays in semantic-graph.slice.
 */
import { describe, it, expect, beforeEach } from 'vitest';

import { tagSlugRef } from '@/shared-kernel';

import { addEdge, _clearEdgesForTest } from '../centralized-edges/semantic-edge-store';
import type { TagLifecycleEvent } from '../centralized-types';

import {
  traceAffectedNodes,
  rankAffectedNodes,
  buildDownstreamEvents,
  buildCausalityChain,
} from './causality-tracer';

// ?€?€?€ Helpers ?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€

function makeEvent(
  tagSlug: string,
  eventType: TagLifecycleEvent['eventType'],
  from: TagLifecycleEvent['fromState'],
  to: TagLifecycleEvent['toState']
): TagLifecycleEvent {
  return {
    eventId: `evt-${Date.now()}-${Math.random()}`,
    tagSlug: tagSlugRef(tagSlug),
    eventType,
    fromState: from,
    toState: to,
    transitionedAt: new Date().toISOString(),
    triggeredBy: 'test',
    aggregateVersion: 1,
  };
}

// ?€?€?€ Setup ?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€

beforeEach(() => {
  _clearEdgesForTest();
});

// ?â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â???
// traceAffectedNodes
// ?â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â???

describe('traceAffectedNodes', () => {
  it('returns empty array when source node has no edges', () => {
    const event = makeEvent('orphan', 'TAG_DEPRECATED', 'Active', 'Deprecated');
    const result = traceAffectedNodes(event, []);
    expect(result).toHaveLength(0);
  });

  it('returns direct neighbours with hopCount=1 and semanticWeight=edge.weight', () => {
    addEdge('skill:expert', 'skill:senior', 'IS_A', 0.8);
    const event = makeEvent('skill:expert', 'TAG_DEPRECATED', 'Active', 'Deprecated');
    const result = traceAffectedNodes(event, ['skill:expert', 'skill:senior']);

    expect(result).toHaveLength(1);
    const node = result[0];
    expect(node.tagSlug).toBe('skill:senior');
    expect(node.hopCount).toBe(1);
    expect(node.semanticWeight).toBeCloseTo(0.8);
    expect(node.reason).toBe('IS_A_CHILD');
  });

  it('returns transitive nodes with hopCount=2', () => {
    addEdge('artisan', 'expert', 'IS_A', 0.9);
    addEdge('expert', 'senior', 'IS_A', 0.8);
    const event = makeEvent('artisan', 'TAG_DEPRECATED', 'Active', 'Deprecated');
    const result = traceAffectedNodes(event, ['artisan', 'expert', 'senior']);

    const senior = result.find((n) => n.tagSlug === 'senior');
    expect(senior).toBeDefined();
    expect(senior!.hopCount).toBe(2);
    expect(senior!.reason).toBe('TRANSITIVE');
    // semanticWeight = 0.9 * 0.8 = 0.72
    expect(senior!.semanticWeight).toBeCloseTo(0.72);
  });

  it('marks REQUIRES targets as REQUIRES_DEPENDENCY', () => {
    addEdge('role:lead', 'skill:leadership', 'REQUIRES', 1.0);
    const event = makeEvent('role:lead', 'TAG_DEPRECATED', 'Active', 'Deprecated');
    const result = traceAffectedNodes(event, ['role:lead', 'skill:leadership']);

    const dep = result.find((n) => n.tagSlug === 'skill:leadership');
    expect(dep).toBeDefined();
    expect(dep!.reason).toBe('REQUIRES_DEPENDENCY');
    expect(dep!.hopCount).toBe(1);
  });

  it('does not include the source node itself in the result', () => {
    addEdge('a', 'b', 'IS_A');
    const event = makeEvent('a', 'TAG_DEPRECATED', 'Active', 'Deprecated');
    const result = traceAffectedNodes(event, ['a', 'b']);
    const selfRef = result.find((n) => n.tagSlug === event.tagSlug);
    expect(selfRef).toBeUndefined();
  });

  it('does not traverse beyond maxHops', () => {
    addEdge('a', 'b', 'IS_A');
    addEdge('b', 'c', 'IS_A');
    addEdge('c', 'd', 'IS_A');
    const event = makeEvent('a', 'TAG_DEPRECATED', 'Active', 'Deprecated');
    const result = traceAffectedNodes(event, ['a', 'b', 'c', 'd'], 2);

    const dNode = result.find((n) => n.tagSlug === 'd');
    expect(dNode).toBeUndefined(); // beyond maxHops=2 (b=hop1, c=hop2, d=hop3)
  });

  it('handles cycles without infinite loop', () => {
    addEdge('a', 'b', 'IS_A');
    addEdge('b', 'a', 'IS_A'); // cycle
    const event = makeEvent('a', 'TAG_DEPRECATED', 'Active', 'Deprecated');
    // Should not hang; b should appear once
    const result = traceAffectedNodes(event, ['a', 'b']);
    expect(result.filter((n) => n.tagSlug === 'b')).toHaveLength(1);
  });

  it('excludes slugs not in the provided candidate list', () => {
    addEdge('a', 'b', 'IS_A');
    addEdge('b', 'c', 'IS_A');
    const event = makeEvent('a', 'TAG_DEPRECATED', 'Active', 'Deprecated');
    // Only pass ['a', 'b'] ??c should not appear
    const result = traceAffectedNodes(event, ['a', 'b']);
    const cNode = result.find((n) => n.tagSlug === 'c');
    expect(cNode).toBeUndefined();
  });
});

// ?â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â???
// rankAffectedNodes
// ?â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â???

describe('rankAffectedNodes', () => {
  it('returns empty array for empty input', () => {
    expect(rankAffectedNodes([])).toHaveLength(0);
  });

  it('sorts by hopCount ascending first', () => {
    const nodes = [
      { tagSlug: tagSlugRef('c'), hopCount: 3, semanticWeight: 1.0, reason: 'TRANSITIVE' as const },
      { tagSlug: tagSlugRef('a'), hopCount: 1, semanticWeight: 0.5, reason: 'IS_A_CHILD' as const },
      { tagSlug: tagSlugRef('b'), hopCount: 2, semanticWeight: 0.9, reason: 'TRANSITIVE' as const },
    ];
    const ranked = rankAffectedNodes(nodes);
    expect(ranked[0].tagSlug).toBe('a');
    expect(ranked[1].tagSlug).toBe('b');
    expect(ranked[2].tagSlug).toBe('c');
  });

  it('breaks ties by semanticWeight descending', () => {
    const nodes = [
      { tagSlug: tagSlugRef('low'),  hopCount: 1, semanticWeight: 0.3, reason: 'IS_A_CHILD' as const },
      { tagSlug: tagSlugRef('high'), hopCount: 1, semanticWeight: 0.9, reason: 'IS_A_CHILD' as const },
      { tagSlug: tagSlugRef('mid'),  hopCount: 1, semanticWeight: 0.6, reason: 'IS_A_CHILD' as const },
    ];
    const ranked = rankAffectedNodes(nodes);
    expect(ranked[0].tagSlug).toBe('high');
    expect(ranked[1].tagSlug).toBe('mid');
    expect(ranked[2].tagSlug).toBe('low');
  });

  it('does not mutate the original array', () => {
    const nodes = [
      { tagSlug: tagSlugRef('b'), hopCount: 2, semanticWeight: 1.0, reason: 'TRANSITIVE' as const },
      { tagSlug: tagSlugRef('a'), hopCount: 1, semanticWeight: 0.5, reason: 'IS_A_CHILD' as const },
    ];
    const copy = [...nodes];
    rankAffectedNodes(nodes);
    expect(nodes[0].tagSlug).toBe(copy[0].tagSlug); // original order unchanged
  });
});

// ?â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â???
// buildDownstreamEvents
// ?â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â???

describe('buildDownstreamEvents', () => {
  it('returns empty array for empty affected nodes', () => {
    const event = makeEvent('a', 'TAG_DEPRECATED', 'Active', 'Deprecated');
    expect(buildDownstreamEvents(event, [])).toHaveLength(0);
  });

  it('suggests Deprecated transition for IS_A_CHILD when source is deprecated', () => {
    addEdge('parent', 'child', 'IS_A');
    const event = makeEvent('parent', 'TAG_DEPRECATED', 'Active', 'Deprecated');
    const nodes = traceAffectedNodes(event, ['parent', 'child']);
    const downstream = buildDownstreamEvents(event, nodes);

    const childEvent = downstream.find((e) => e.targetTagSlug === 'child');
    expect(childEvent).toBeDefined();
    expect(childEvent!.suggestedTransition).toBe('Deprecated');
  });

  it('suggests Stale transition for IS_A_CHILD when source transitions to Stale', () => {
    addEdge('parent', 'child', 'IS_A');
    const event = makeEvent('parent', 'TAG_STALE_FLAGGED', 'Active', 'Stale');
    const nodes = traceAffectedNodes(event, ['parent', 'child']);
    const downstream = buildDownstreamEvents(event, nodes);

    const childEvent = downstream.find((e) => e.targetTagSlug === 'child');
    expect(childEvent).toBeDefined();
    expect(childEvent!.suggestedTransition).toBe('Stale');
  });

  it('marks direct neighbours as immediate priority', () => {
    addEdge('parent', 'child', 'IS_A', 1.0);
    const event = makeEvent('parent', 'TAG_DEPRECATED', 'Active', 'Deprecated');
    const nodes = traceAffectedNodes(event, ['parent', 'child']);
    const downstream = buildDownstreamEvents(event, nodes);

    const childEvent = downstream.find((e) => e.targetTagSlug === 'child');
    expect(childEvent!.priority).toBe('immediate');
  });

  it('marks transitive nodes as deferred priority', () => {
    addEdge('a', 'b', 'IS_A');
    addEdge('b', 'c', 'IS_A');
    const event = makeEvent('a', 'TAG_DEPRECATED', 'Active', 'Deprecated');
    const nodes = traceAffectedNodes(event, ['a', 'b', 'c']);
    const downstream = buildDownstreamEvents(event, nodes);

    const cEvent = downstream.find((e) => e.targetTagSlug === 'c');
    expect(cEvent!.priority).toBe('deferred');
  });

  it('includes a non-empty reason string', () => {
    addEdge('parent', 'child', 'IS_A');
    const event = makeEvent('parent', 'TAG_DEPRECATED', 'Active', 'Deprecated');
    const nodes = traceAffectedNodes(event, ['parent', 'child']);
    const downstream = buildDownstreamEvents(event, nodes);

    downstream.forEach((e) => {
      expect(typeof e.reason).toBe('string');
      expect(e.reason.length).toBeGreaterThan(0);
    });
  });
});

// ?â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â???
// buildCausalityChain [D21-6]
// ?â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â???

describe('buildCausalityChain', () => {
  it('returns a chain with the original source event', () => {
    const event = makeEvent('root', 'TAG_DEPRECATED', 'Active', 'Deprecated');
    const chain = buildCausalityChain(event, []);
    expect(chain.sourceEvent).toEqual(event);
  });

  it('affectedNodes are ranked by hopCount asc, semanticWeight desc', () => {
    addEdge('root', 'direct', 'IS_A', 0.9);
    addEdge('direct', 'transitive', 'IS_A', 0.7);
    const event = makeEvent('root', 'TAG_DEPRECATED', 'Active', 'Deprecated');
    const chain = buildCausalityChain(event, ['root', 'direct', 'transitive']);

    expect(chain.affectedNodes[0].tagSlug).toBe('direct'); // hopCount=1 first
    expect(chain.affectedNodes[1].tagSlug).toBe('transitive'); // hopCount=2 after
  });

  it('returns a computedAt ISO string', () => {
    const event = makeEvent('x', 'TAG_DEPRECATED', 'Active', 'Deprecated');
    const chain = buildCausalityChain(event, []);
    expect(() => new Date(chain.computedAt)).not.toThrow();
    expect(new Date(chain.computedAt).getTime()).toBeGreaterThan(0);
  });

  it('downstreamEvents contains one entry per affected node (when event type maps)', () => {
    addEdge('src', 'dest', 'IS_A', 1.0);
    const event = makeEvent('src', 'TAG_DEPRECATED', 'Active', 'Deprecated');
    const chain = buildCausalityChain(event, ['src', 'dest']);

    // 1 affected node ??at least 1 downstream event
    expect(chain.downstreamEvents.length).toBeGreaterThanOrEqual(1);
    const destEvent = chain.downstreamEvents.find((e) => e.targetTagSlug === 'dest');
    expect(destEvent).toBeDefined();
  });

  it('affectedNodes and downstreamEvents are readonly arrays', () => {
    const event = makeEvent('x', 'TAG_DEPRECATED', 'Active', 'Deprecated');
    const chain = buildCausalityChain(event, []);
    // TypeScript readonly arrays; check they behave as arrays at runtime
    expect(Array.isArray(chain.affectedNodes)).toBe(true);
    expect(Array.isArray(chain.downstreamEvents)).toBe(true);
  });

  it('TAG_ACTIVATED event does not produce Deprecated downstream suggestions', () => {
    addEdge('src', 'child', 'IS_A', 1.0);
    const event = makeEvent('src', 'TAG_ACTIVATED', 'Draft', 'Active');
    const chain = buildCausalityChain(event, ['src', 'child']);

    const deprecated = chain.downstreamEvents.filter(
      (e) => e.suggestedTransition === 'Deprecated'
    );
    expect(deprecated).toHaveLength(0);
  });

  it('TAG_DELETED event produces no downstream events (nothing to lifecycle-manage)', () => {
    addEdge('src', 'child', 'IS_A', 1.0);
    const event = makeEvent('src', 'TAG_DELETED', 'Deprecated', 'Deprecated');
    const chain = buildCausalityChain(event, ['src', 'child']);
    // Deleted source ??no further lifecycle suggestions
    expect(chain.downstreamEvents).toHaveLength(0);
  });
});
