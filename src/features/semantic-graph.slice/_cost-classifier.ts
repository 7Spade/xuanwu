/**
 * @fileoverview _cost-classifier.ts — Layer-2 Semantic Classification for cost line items.
 *
 * Architecture (per logic-overview.md):
 *   Layer 1: Document parsing → raw ParsedLineItem[]
 *   Layer 2: Semantic Classification (this module, VS8) → each item tagged with CostItemType
 *   Layer 3: Semantic Router → routes items to the correct domain model (tasks vs. finance etc.)
 *
 * This is a pure, side-effect-free module. No Firestore, no SDK imports [D24].
 *
 * [D8]  All tag/semantic logic resides in semantic-graph.slice, not shared-kernel.
 * [D21] Tag categories governed by VS8.
 */

// =================================================================
// CostItemType Enum — Semantic Classification for cost line items
// =================================================================

/**
 * Semantic type for a parsed cost line item.
 *
 * EXECUTABLE   — Physical work that can be decomposed into one or more tasks.
 *                Examples: "保護電驛安裝與配線", "Testing and commissioning", "Foundation"
 * MANAGEMENT   — Administrative, supervisory, or safety management overhead.
 *                Examples: "全職安裝工地一級品管及行政人員", "全職安裝工地領班一人及職安人員一人"
 * RESOURCE     — Warehouse, storage, manpower pool, or resource reservation.
 *                Examples: "倉儲", "設備拆箱 吊掛搬運"
 * FINANCIAL    — Payment milestones, retentions, or financial-only line items.
 *                Examples: "工程尾款"
 * PROFIT       — Profit margin entries not convertible to any executable work.
 *                Examples: "利潤"
 * ALLOWANCE    — Consumables, travel, transportation, or miscellaneous expenses.
 *                Examples: "Consumables 耗材", "配合差旅,運輸,勘查,與工安管理"
 */
export const CostItemType = {
  EXECUTABLE: 'EXECUTABLE',
  MANAGEMENT: 'MANAGEMENT',
  RESOURCE: 'RESOURCE',
  FINANCIAL: 'FINANCIAL',
  PROFIT: 'PROFIT',
  ALLOWANCE: 'ALLOWANCE',
} as const

export type CostItemType = (typeof CostItemType)[keyof typeof CostItemType]

// =================================================================
// Keyword Rules — ordered from most-specific to least-specific
// =================================================================

/**
 * Each rule maps a set of lower-cased keywords to a CostItemType.
 * Rules are evaluated in declaration order; the first match wins.
 */
const CLASSIFICATION_RULES: Array<{ keywords: string[]; type: CostItemType }> = [
  // PROFIT — profit margin entries (highest specificity)
  {
    keywords: ['利潤', 'profit margin', 'gross profit'],
    type: CostItemType.PROFIT,
  },

  // FINANCIAL — payment milestones, retentions, and financial-only items
  {
    keywords: ['尾款', 'final payment', 'retention', '預付款', 'advance payment', 'milestone payment'],
    type: CostItemType.FINANCIAL,
  },

  // EXECUTABLE OVERRIDE — physical testing / commissioning work that contains QC or inspection
  // keywords but is unambiguously executable field-work (must be checked BEFORE the MANAGEMENT rule
  // so that "機電檢測QC Test" is not mis-classified as management overhead).
  {
    keywords: ['機電檢測', 'qc test', 'commissioning test', '通電測試', '系統測試', 'pre-commissioning'],
    type: CostItemType.EXECUTABLE,
  },

  // MANAGEMENT — admin, supervisory, and work-safety overhead
  // Note: bare "qc" (too broad) was intentionally removed; "quality control" and "品管"
  // (Chinese equivalent) already cover the administrative QC use case precisely.
  {
    keywords: [
      '管理',
      '行政',
      '品管',
      '領班',
      '職安',
      '工安',
      'hse',
      'safety officer',
      'site manager',
      'site management',
      'administration',
      'quality control',
      '安全管理',
    ],
    type: CostItemType.MANAGEMENT,
  },

  // ALLOWANCE — consumables, travel, transport, and miscellaneous expenses
  {
    keywords: [
      '耗材',
      'consumables',
      '差旅',
      '運輸',
      '勘查',
      'travel',
      'transportation',
      'survey',
      'survey & travel',
      '雜支',
      'miscellaneous',
    ],
    type: CostItemType.ALLOWANCE,
  },

  // RESOURCE — storage, warehouse, equipment handling at rest, or manpower pools
  {
    keywords: ['倉儲', 'warehouse', 'storage', '人力', 'manpower', 'resource'],
    type: CostItemType.RESOURCE,
  },

  // EXECUTABLE — physical construction, installation, testing, and commissioning work
  // (catch-all; any item reaching this point is treated as executable work)
]

// =================================================================
// classifyCostItem — pure classification function
// =================================================================

/**
 * Classifies a cost line item by matching its name against keyword rules.
 *
 * Uses a case-insensitive full-text search across all registered keyword rules.
 * The first rule whose keyword appears anywhere in the name wins.
 * Falls back to `EXECUTABLE` when no rule matches.
 *
 * @param name - The cost item name / description string from the parsed document.
 * @returns The semantic CostItemType for this item.
 *
 * @pure No side effects; deterministic for the same input.
 */
export function classifyCostItem(name: string): CostItemType {
  const lower = name.toLowerCase()

  for (const rule of CLASSIFICATION_RULES) {
    // Keywords in CLASSIFICATION_RULES are already lowercase; compare against `lower` directly.
    if (rule.keywords.some((kw) => lower.includes(kw))) {
      return rule.type
    }
  }

  // Default: treat as executable work if no specific rule matched
  return CostItemType.EXECUTABLE
}

/**
 * Layer-3 semantic routing gate — the single source of truth for whether a cost
 * item may be materialised as a Task.
 *
 * Centralising this decision in `semantic-graph.slice` (VS8) prevents feature
 * slices from hard-coding `=== CostItemType.EXECUTABLE` and ensures any future
 * expansion of the materialisation rule set stays inside the semantic layer.
 *
 * @param costItemType - The semantic type assigned by `classifyCostItem`.
 * @returns `true` when the item should create a Task; `false` to silently skip.
 *
 * @pure No side effects; safe to call at any layer [D8].
 */
export function shouldMaterializeAsTask(costItemType: CostItemType): boolean {
  return costItemType === CostItemType.EXECUTABLE
}
