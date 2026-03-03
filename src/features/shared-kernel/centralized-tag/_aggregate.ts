/**
 * centralized-tag — _aggregate.ts
 *
 * CENTRALIZED_TAG_AGGREGATE: pure domain types for the global semantic dictionary.
 *
 * Per logic-overview.md (VS0 Tag Authority Center):
 *   CTA["centralized-tag.aggregate\n【語義字典主數據】\ntagSlug / label / category\ndeprecatedAt / deleteRule\n唯一性 & 刪除規則管理"]
 *
 * [D8] This file is intentionally pure — no async functions, no Firestore calls, no side effects.
 *      All write operations (createTag, updateTag, deprecateTag, deleteTag, getTag) live in
 *      semantic-graph.slice/centralized-tag/_actions.ts per D3+D8.
 *
 * Invariants:
 *   #17 — This aggregate is the sole authority for tagSlug uniqueness and deletion rules.
 *   T1  — Consumers must subscribe to TagLifecycleEvent; they must not maintain their own tag data.
 *   A6  — Tag deletion enforced here; consumers hold read-only references.
 *
 * Stored at: tagDictionary/{tagSlug}
 */

import type { TagCategory } from '../tag-authority';

// ---------------------------------------------------------------------------
// Types [D8: pure types only — no infra imports, no async]
// ---------------------------------------------------------------------------

export type TagDeleteRule = 'allow' | 'block-if-referenced';

export interface CentralizedTagEntry {
  tagSlug: string;
  label: string;
  category: TagCategory;
  /** ISO timestamp when the tag was deprecated; absent if not deprecated. */
  deprecatedAt?: string;
  /** Optional replacement tag for consumers holding this slug. */
  replacedByTagSlug?: string;
  deleteRule: TagDeleteRule;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
