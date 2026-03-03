/**
 * @test VS8 Semantic Graph — Services: in-memory semantic index
 *
 * Validates _services.ts operations:
 *   1. indexEntity — adds entries to the semantic index
 *   2. removeFromIndex — removes entries by ID
 *   3. querySemanticIndex — full-text + tag + domain filtering
 *   4. getIndexStats — returns accurate statistics
 *
 * Architecture:
 *   [D8]  Index logic in _services.ts, not shared-kernel.
 *   [D24] No direct firebase imports — in-memory only.
 */
import { describe, it, expect, beforeEach } from 'vitest';

import { indexEntity, removeFromIndex, querySemanticIndex, getIndexStats } from './_services';
import type { SemanticIndexEntry } from './_types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeEntry(overrides: Partial<SemanticIndexEntry> = {}): SemanticIndexEntry {
  return {
    id: 'ws-1',
    domain: 'workspace',
    title: 'Alpha Workspace',
    subtitle: 'Construction site A',
    tags: ['location-taipei', 'compliance-iso9001'],
    searchableText: 'alpha workspace construction site a',
    updatedAt: '2025-06-01T00:00:00Z',
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════
// Index operations
// ═══════════════════════════════════════════════════════════════════

describe('Semantic Index — CRUD', () => {
  beforeEach(() => {
    const hits = querySemanticIndex('', { limit: 1000 });
    for (const hit of hits) {
      removeFromIndex(hit.domain, hit.id);
    }
  });

  it('indexEntity stores an entry retrievable by query', () => {
    indexEntity(makeEntry());
    const hits = querySemanticIndex('alpha');
    expect(hits.length).toBeGreaterThanOrEqual(1);
    expect(hits[0]!.id).toBe('ws-1');
    expect(hits[0]!.domain).toBe('workspace');
  });

  it('indexEntity updates an existing entry (same id + domain)', () => {
    indexEntity(makeEntry({ title: 'Old Title' }));
    indexEntity(makeEntry({ title: 'New Title', searchableText: 'new title' }));
    const hits = querySemanticIndex('new title');
    const match = hits.find((h) => h.id === 'ws-1');
    expect(match).toBeDefined();
    expect(match!.title).toBe('New Title');
  });

  it('removeFromIndex removes an entry', () => {
    indexEntity(makeEntry());
    removeFromIndex('workspace', 'ws-1');
    const hits = querySemanticIndex('alpha');
    const match = hits.find((h) => h.id === 'ws-1');
    expect(match).toBeUndefined();
  });

  it('removeFromIndex is safe for non-existent IDs', () => {
    expect(() => removeFromIndex('workspace', 'nonexistent')).not.toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════════
// Query filtering
// ═══════════════════════════════════════════════════════════════════

describe('Semantic Index — Query', () => {
  beforeEach(() => {
    const hits = querySemanticIndex('', { limit: 1000 });
    for (const hit of hits) removeFromIndex(hit.domain, hit.id);

    indexEntity(makeEntry({
      id: 'ws-1', domain: 'workspace', title: 'Alpha',
      searchableText: 'alpha construction', tags: ['loc-tp'],
    }));
    indexEntity(makeEntry({
      id: 'mem-1', domain: 'member', title: 'Bob Builder',
      searchableText: 'bob builder', tags: ['skill-welding'],
    }));
    indexEntity(makeEntry({
      id: 'sch-1', domain: 'schedule', title: 'Q1 Schedule',
      searchableText: 'q1 schedule planning', tags: ['loc-tp'],
    }));
  });

  it('filters by domain', () => {
    const hits = querySemanticIndex('', { domains: ['member'] });
    expect(hits.every((h) => h.domain === 'member')).toBe(true);
  });

  it('filters by tagFilters', () => {
    const hits = querySemanticIndex('', { tagFilters: ['loc-tp'] });
    expect(hits.length).toBeGreaterThanOrEqual(2);
    expect(hits.every((h) => h.tags.includes('loc-tp'))).toBe(true);
  });

  it('filters by both domain and tagFilters', () => {
    const hits = querySemanticIndex('', { domains: ['workspace'], tagFilters: ['loc-tp'] });
    expect(hits.length).toBe(1);
    expect(hits[0]!.id).toBe('ws-1');
  });

  it('respects limit parameter', () => {
    const hits = querySemanticIndex('', { limit: 1 });
    expect(hits.length).toBeLessThanOrEqual(1);
  });

  it('returns empty when query matches nothing', () => {
    const hits = querySemanticIndex('zzzzz_no_match_zzzzz');
    expect(hits).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Index Stats
// ═══════════════════════════════════════════════════════════════════

describe('getIndexStats', () => {
  it('returns a valid stats object', () => {
    const stats = getIndexStats();
    expect(stats).toHaveProperty('totalEntries');
    expect(stats).toHaveProperty('entriesByDomain');
    expect(stats).toHaveProperty('lastUpdatedAt');
    expect(typeof stats.totalEntries).toBe('number');
  });
});
