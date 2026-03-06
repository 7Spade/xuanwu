/**
 * @test VS7 Notification Hub ??Tag routing, dispatch, ProjectionBusSubscriber
 *
 * Validates:
 *   1. evaluateTagRouting ??tag-based routing rule matching
 *   2. dispatchNotification ??full dispatch pipeline
 *   3. registerRoutingRule / unregisterRoutingRule ??rule CRUD
 *   4. ProjectionBusSubscriber ??subscribeToProjectionBus, emitProjectionBusEvent
 *   5. triggerDispatch ??final transmission alias
 *
 * Architecture:
 *   [D3]   All dispatch side-effects via _actions.ts.
 *   [D8]   Routing logic in _services.ts, not shared-kernel.
 *   [D26]  Sole side-effect outlet.
 *   [#A10] Notification routing is stateless.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { tagSlugRef } from '@/shared-kernel';

import {
  dispatchNotification,
  registerRoutingRule,
  unregisterRoutingRule,
  triggerDispatch,
} from './_actions';
import {
  evaluateTagRouting,
  registerRoutingRule as registerRuleService,
  unregisterRoutingRule as unregisterRuleService,
  getRoutingRules,
  subscribeToProjectionBus,
  emitProjectionBusEvent,
  initTagChangedSubscriber,
  TAG_CHANGED_EVENT_KEY,
  getHubStats,
} from './_services';
import type {
  TagRoutingRule,
  NotificationSourceEvent,
} from './_types';

// ?€?€?€ Helpers ?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€

function makeRule(overrides: Partial<TagRoutingRule> = {}): TagRoutingRule {
  return {
    ruleId: 'rule-1',
    name: 'Urgent Slack Alert',
    tagSlugs: [tagSlugRef('compliance-urgent')],
    channel: 'push',
    priority: 'critical',
    enabled: true,
    ...overrides,
  };
}

function makeEvent(overrides: Partial<NotificationSourceEvent> = {}): NotificationSourceEvent {
  return {
    eventKey: 'test:event',
    payload: { title: 'Test Notification', body: 'Something happened' },
    tags: [tagSlugRef('compliance-urgent')],
    orgId: 'org-1',
    occurredAt: new Date().toISOString(),
    ...overrides,
  };
}

// ?â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â???
// Routing Rule Management (via _services.ts)
// ?â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â???

describe('Routing Rule Management', () => {
  beforeEach(() => {
    for (const rule of getRoutingRules()) {
      unregisterRuleService(rule.ruleId);
    }
  });

  it('registerRoutingRule adds a rule', () => {
    registerRuleService(makeRule());
    expect(getRoutingRules()).toHaveLength(1);
  });

  it('unregisterRoutingRule removes a rule', () => {
    registerRuleService(makeRule());
    unregisterRuleService('rule-1');
    expect(getRoutingRules()).toHaveLength(0);
  });

  it('unregisterRoutingRule is safe for non-existent IDs', () => {
    expect(() => unregisterRuleService('nonexistent')).not.toThrow();
  });
});

// ?â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â???
// Tag-Aware Routing Engine
// ?â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â???

describe('evaluateTagRouting ??Stateless (#A10)', () => {
  beforeEach(() => {
    for (const rule of getRoutingRules()) unregisterRuleService(rule.ruleId);
  });

  it('returns no matched rules when registry is empty', () => {
    const decision = evaluateTagRouting(['compliance-urgent']);
    expect(decision.matchedRules).toHaveLength(0);
    expect(decision.channels).toHaveLength(0);
  });

  it('matches rule when all tag slugs are present', () => {
    registerRuleService(makeRule({ tagSlugs: [tagSlugRef('tag-a'), tagSlugRef('tag-b')] }));
    const decision = evaluateTagRouting(['tag-a', 'tag-b', 'tag-c']);
    expect(decision.matchedRules).toHaveLength(1);
    expect(decision.channels).toContain('push');
  });

  it('does not match when tags are only partially present', () => {
    registerRuleService(makeRule({ tagSlugs: [tagSlugRef('tag-a'), tagSlugRef('tag-b')] }));
    const decision = evaluateTagRouting(['tag-a']);
    expect(decision.matchedRules).toHaveLength(0);
  });

  it('skips disabled rules', () => {
    registerRuleService(makeRule({ enabled: false }));
    const decision = evaluateTagRouting(['compliance-urgent']);
    expect(decision.matchedRules).toHaveLength(0);
  });

  it('returns highest priority from matched rules', () => {
    registerRuleService(makeRule({ ruleId: 'r1', priority: 'low', tagSlugs: [tagSlugRef('tag-x')] }));
    registerRuleService(makeRule({ ruleId: 'r2', priority: 'critical', tagSlugs: [tagSlugRef('tag-x')] }));
    const decision = evaluateTagRouting(['tag-x']);
    expect(decision.highestPriority).toBe('critical');
  });

  it('deduplicates channels from multiple rules', () => {
    registerRuleService(makeRule({ ruleId: 'r1', channel: 'email', tagSlugs: [tagSlugRef('tag-x')] }));
    registerRuleService(makeRule({ ruleId: 'r2', channel: 'email', tagSlugs: [tagSlugRef('tag-x')] }));
    const decision = evaluateTagRouting(['tag-x']);
    expect(decision.channels).toHaveLength(1);
    expect(decision.channels[0]).toBe('email');
  });

  it('defaults to "low" priority when no rules match', () => {
    const decision = evaluateTagRouting(['no-match']);
    expect(decision.highestPriority).toBe('low');
  });
});

// ?â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â???
// Dispatch Actions (_actions.ts)
// ?â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â???

describe('dispatchNotification ??Action (D3)', () => {
  beforeEach(() => {
    for (const rule of getRoutingRules()) unregisterRuleService(rule.ruleId);
  });

  it('returns success CommandResult + dispatch result with matching rule', async () => {
    registerRuleService(makeRule());
    const event = makeEvent({ targetAccountIds: ['acc-1', 'acc-2'] });
    const result = await dispatchNotification(event);
    expect(result.commandResult.success).toBe(true);
    expect(result.dispatch).not.toBeNull();
    expect(result.dispatch!.dispatchId).toBeTruthy();
  });

  it('returns success even when no routing rules match (no-op dispatch)', async () => {
    const event = makeEvent({ tags: [tagSlugRef('no-matching-tag')] });
    const result = await dispatchNotification(event);
    expect(result.commandResult.success).toBe(true);
    expect(result.dispatch!.targetCount).toBe(0);
  });

  it('triggerDispatch is an alias for dispatchNotification', async () => {
    registerRuleService(makeRule());
    const event = makeEvent({ targetAccountIds: ['acc-1'] });
    const result = await triggerDispatch(event);
    expect(result.commandResult.success).toBe(true);
    expect(result.dispatch).not.toBeNull();
  });
});

// ?â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â???
// Routing Rule Actions (D3 wrappers)
// ?â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â???

describe('registerRoutingRule / unregisterRoutingRule ??Actions', () => {
  beforeEach(() => {
    for (const rule of getRoutingRules()) unregisterRuleService(rule.ruleId);
  });

  it('registerRoutingRule returns CommandResult success', async () => {
    const result = await registerRoutingRule(makeRule());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.aggregateId).toBe('rule-1');
    }
  });

  it('unregisterRoutingRule returns CommandResult success', async () => {
    registerRuleService(makeRule());
    const result = await unregisterRoutingRule('rule-1');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.aggregateId).toBe('rule-1');
    }
  });
});

// ?â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â???
// ProjectionBusSubscriber
// ?â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â???

describe('ProjectionBusSubscriber', () => {
  it('subscribeToProjectionBus receives events via emitProjectionBusEvent', () => {
    const handler = vi.fn();
    const unsub = subscribeToProjectionBus('test:custom', handler);
    const event = makeEvent({ eventKey: 'test:custom' });
    emitProjectionBusEvent(event);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(event);
    unsub();
  });

  it('unsubscribe removes the listener', () => {
    const handler = vi.fn();
    const unsub = subscribeToProjectionBus('test:removal', handler);
    unsub();
    emitProjectionBusEvent(makeEvent({ eventKey: 'test:removal' }));
    expect(handler).not.toHaveBeenCalled();
  });

  it('multiple listeners for the same event key all fire', () => {
    const h1 = vi.fn();
    const h2 = vi.fn();
    const u1 = subscribeToProjectionBus('test:multi', h1);
    const u2 = subscribeToProjectionBus('test:multi', h2);
    emitProjectionBusEvent(makeEvent({ eventKey: 'test:multi' }));
    expect(h1).toHaveBeenCalledTimes(1);
    expect(h2).toHaveBeenCalledTimes(1);
    u1();
    u2();
  });

  it('TAG_CHANGED_EVENT_KEY is correct', () => {
    expect(TAG_CHANGED_EVENT_KEY).toBe('projection:tag:changed');
  });

  it('initTagChangedSubscriber auto-processes TAG_CHANGED events', async () => {
    for (const rule of getRoutingRules()) unregisterRuleService(rule.ruleId);
    registerRuleService(makeRule({ tagSlugs: [tagSlugRef('tag-change')] }));

    const unsub = initTagChangedSubscriber();
    const event = makeEvent({
      eventKey: TAG_CHANGED_EVENT_KEY,
      tags: [tagSlugRef('tag-change')],
      targetAccountIds: ['acc-1'],
    });
    emitProjectionBusEvent(event);

    // Flush microtask queue deterministically
    await vi.waitFor(() => Promise.resolve());
    unsub();
  });
});

// ?â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â???
// Hub Stats (Observability)
// ?â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â???

describe('getHubStats', () => {
  it('returns valid hub statistics', () => {
    const stats = getHubStats();
    expect(stats).toHaveProperty('totalDispatched');
    expect(stats).toHaveProperty('totalErrors');
    expect(stats).toHaveProperty('activeSubscriptions');
    expect(stats).toHaveProperty('activeRoutingRules');
    expect(stats).toHaveProperty('lastDispatchedAt');
    expect(typeof stats.totalDispatched).toBe('number');
  });
});
