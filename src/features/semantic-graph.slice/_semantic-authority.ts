/**
 * Module: _semantic-authority.ts
 * Purpose: own semantic-domain authority constants for VS8 and search semantics
 * Responsibilities: provide runtime authority constants for search domains and taxonomy dimensions
 * Constraints: deterministic logic, respect module boundaries
 */

import type { SearchDomain, TaxonomyDimension } from '@/shared-kernel/data-contracts/semantic/semantic-contracts';

export const SEARCH_DOMAINS: readonly SearchDomain[] = [
  'workspace',
  'member',
  'schedule',
  'tag',
  'skill',
  'organization',
  'document',
];

export const TAXONOMY_DIMENSIONS: readonly TaxonomyDimension[] = [
  'skill',
  'location',
  'temporal',
  'organizational',
  'compliance',
];
