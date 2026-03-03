/**
 * @test VS9 Global Search — L6 Query Gateway + Actions
 *
 * Validates:
 *   1. executeGlobalSearch — cross-domain search returning CommandResult + SearchResponse
 *   2. executeSearch — simplified R4-only variant
 *   3. _services executeSearch — L6 Query Gateway grouping
 *
 * Architecture:
 *   [D3]  Search execution via _actions.ts only.
 *   [D26] Sole search authority — all cross-domain search routes here.
 */
import { describe, it, expect, beforeEach } from 'vitest';

import {
  indexEntity,
  removeFromIndex,
  querySemanticIndex,
} from '@/features/semantic-graph.slice';
import type { SemanticIndexEntry } from '@/features/semantic-graph.slice';

import { executeGlobalSearch, executeSearch } from './_actions';
import { executeSearch as executeSearchService } from './_services';

// ─── Index seeding ────────────────────────────────────────────────────────────

function clearIndex(): void {
  const hits = querySemanticIndex('', { limit: 1000 });
  for (const hit of hits) removeFromIndex(hit.domain, hit.id);
}

function seedIndex(): void {
  clearIndex();
  const entries: SemanticIndexEntry[] = [
    {
      id: 'ws-a',
      domain: 'workspace',
      title: 'Alpha Site',
      tags: ['loc-tp'],
      searchableText: 'alpha site construction',
      updatedAt: '2025-06-01T00:00:00Z',
    },
    {
      id: 'mem-b',
      domain: 'member',
      title: 'Bob Builder',
      tags: ['skill-welding'],
      searchableText: 'bob builder welding expert',
      updatedAt: '2025-06-01T00:00:00Z',
    },
    {
      id: 'ws-c',
      domain: 'workspace',
      title: 'Charlie Site',
      tags: ['loc-tp'],
      searchableText: 'charlie site maintenance',
      updatedAt: '2025-06-01T00:00:00Z',
    },
  ];
  for (const entry of entries) indexEntity(entry);
}

// ═══════════════════════════════════════════════════════════════════
// L6 Query Gateway (_services.ts)
// ═══════════════════════════════════════════════════════════════════

describe('Global Search — L6 Query Gateway', () => {
  beforeEach(seedIndex);

  it('returns grouped results by domain', () => {
    const response = executeSearchService({ query: '', limit: 50 });
    expect(response.groups.length).toBeGreaterThanOrEqual(1);

    const wsGroup = response.groups.find((g) => g.domain === 'workspace');
    expect(wsGroup).toBeDefined();
    expect(wsGroup!.count).toBeGreaterThanOrEqual(2);
  });

  it('filters by domain', () => {
    const response = executeSearchService({
      query: '',
      filters: { domains: ['member'] },
    });
    expect(response.groups.every((g) => g.domain === 'member')).toBe(true);
  });

  it('filters by tag slugs', () => {
    const response = executeSearchService({
      query: '',
      filters: { tagSlugs: ['loc-tp'] },
    });
    const allHits = response.groups.flatMap((g) => g.hits);
    expect(allHits.every((h) => h.tags.includes('loc-tp'))).toBe(true);
  });

  it('returns totalCount matching total hits', () => {
    const response = executeSearchService({ query: '' });
    const totalFromGroups = response.groups.reduce((sum, g) => sum + g.count, 0);
    expect(response.totalCount).toBe(totalFromGroups);
  });

  it('includes executedAt timestamp', () => {
    const response = executeSearchService({ query: 'alpha' });
    expect(response.executedAt).toBeDefined();
    expect(new Date(response.executedAt).getTime()).not.toBeNaN();
  });

  it('preserves traceId when provided', () => {
    const response = executeSearchService({
      query: 'alpha',
      traceId: 'trace-123',
    });
    expect(response.traceId).toBe('trace-123');
  });
});

// ═══════════════════════════════════════════════════════════════════
// executeGlobalSearch (_actions.ts)
// ═══════════════════════════════════════════════════════════════════

describe('executeGlobalSearch — Action', () => {
  beforeEach(seedIndex);

  it('returns CommandResult success + SearchResponse on valid query', async () => {
    const result = await executeGlobalSearch({ query: 'alpha' });
    expect(result.commandResult.success).toBe(true);
    expect(result.response).not.toBeNull();
    expect(result.response!.query).toBe('alpha');
  });

  it('response groups contain the matching hits', async () => {
    const result = await executeGlobalSearch({
      query: '',
      filters: { domains: ['workspace'] },
    });
    expect(result.response).not.toBeNull();
    const wsGroup = result.response!.groups.find((g) => g.domain === 'workspace');
    expect(wsGroup).toBeDefined();
    expect(wsGroup!.count).toBeGreaterThanOrEqual(1);
  });

  it('handles empty result set gracefully', async () => {
    const result = await executeGlobalSearch({ query: 'zzz_no_match_zzz' });
    expect(result.commandResult.success).toBe(true);
    expect(result.response).not.toBeNull();
    expect(result.response!.totalCount).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════
// executeSearch — simplified R4 variant
// ═══════════════════════════════════════════════════════════════════

describe('executeSearch — Simplified Action', () => {
  beforeEach(seedIndex);

  it('returns CommandResult only (no SearchResponse)', async () => {
    const result = await executeSearch({ query: 'bob' });
    expect(result).toHaveProperty('success');
    expect(result).not.toHaveProperty('response');
  });

  it('returns success for valid query', async () => {
    const result = await executeSearch({ query: '' });
    expect(result.success).toBe(true);
  });
});
