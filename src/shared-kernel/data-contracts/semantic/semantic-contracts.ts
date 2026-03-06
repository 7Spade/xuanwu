/**
 * Module: semantic-contracts.ts
 * Purpose: define pure shared semantic contracts without domain-owned authority constants
 * Responsibilities: provide semantic search, notification, and taxonomy type contracts
 * Constraints: deterministic logic, respect module boundaries
 */

export type SearchDomain =
  | 'workspace'
  | 'member'
  | 'schedule'
  | 'tag'
  | 'skill'
  | 'organization'
  | 'document';

export interface SemanticSearchQuery {
  readonly query: string;
  readonly domains: readonly SearchDomain[];
  readonly tagFilters?: readonly string[];
  readonly limit?: number;
  readonly cursor?: string;
  readonly traceId?: string;
}

export interface SemanticSearchHit {
  readonly id: string;
  readonly domain: SearchDomain;
  readonly title: string;
  readonly subtitle?: string;
  readonly score: number;
  readonly tags: readonly string[];
  readonly href?: string;
}

export interface SemanticSearchResult {
  readonly hits: readonly SemanticSearchHit[];
  readonly totalCount: number;
  readonly cursor?: string;
  readonly traceId?: string;
}

export type NotificationChannel = 'push' | 'in-app' | 'email' | 'sms';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'critical';

export type TaxonomyDimension =
  | 'skill'
  | 'location'
  | 'temporal'
  | 'organizational'
  | 'compliance';

export interface TaxonomyNode {
  readonly slug: string;
  readonly label: string;
  readonly dimension: TaxonomyDimension;
  readonly parentSlug?: string;
  readonly depth: number;
  readonly metadata?: Record<string, unknown>;
}
