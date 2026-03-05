import type { SkillRequirement } from '@/features/shared-kernel'
import type { CostItemType } from '@/features/semantic-graph.slice'
import type { Timestamp } from '@/shared/ports'
// ParsingIntentSourceType, ParsingIntentReviewStatus, and ParsingIntentStatus are owned by
// business.parsing-intent/_contract.ts [D20] — the single source of truth for this sub-domain contract.
import type {
  ParsingIntentSourceType,
  ParsingIntentReviewStatus,
  ParsingIntentStatus,
} from '../business.parsing-intent/_contract'

// =================================================================
// Brand Types — nominal type safety for cross-module references
// =================================================================

/** Branded ID for a ParsingIntent document — prevents mixing with plain strings. */
export type IntentID = string & { readonly _brand: 'IntentID' }

/** Branded pointer to a source file download URL — immutable contract anchor. */
export type SourcePointer = string & { readonly _brand: 'SourcePointer' }

export interface ParsedLineItem {
  name: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  subtotal: number;
  /**
   * Layer-2 Semantic Classification (VS8) — set during the document parse phase.
   * Indicates whether this item can be decomposed into executable tasks or whether
   * it represents a non-task entry (financial, management overhead, profit, etc.).
   * The semantic router (Layer 3) uses this field to decide which domain model
   * receives the item.
   */
  costItemType: CostItemType;
}

// Re-export so existing consumers of this module continue to work [D20 — import from slice index].
export type { ParsingIntentSourceType, ParsingIntentReviewStatus };

export interface ParsingIntent {
  /** Branded ID — use `IntentID` cast when constructing references. */
  id: IntentID;
  workspaceId: string;
  sourceFileName: string;
  /** Immutable pointer to the original file in Firebase Storage. */
  sourceFileDownloadURL?: SourcePointer;
  /** Reference to the WorkspaceFile document that was parsed (for full traceability). */
  sourceFileId?: string;
  intentVersion: number;
  /** Old intent points to the newer intent that superseded it. */
  supersededByIntentId?: IntentID;
  /** Optional lineage root for multi-version intent chains. */
  baseIntentId?: IntentID;
  lineItems: ParsedLineItem[];
  /** Skill requirements extracted from the document — fed to organization.schedule proposals. */
  skillRequirements?: SkillRequirement[];
  /** Provenance metadata for AI/human/system origin tracing. */
  parserVersion?: string;
  modelVersion?: string;
  sourceType: ParsingIntentSourceType;
  /** Human-in-the-loop review metadata. */
  reviewStatus: ParsingIntentReviewStatus;
  reviewedBy?: string;
  reviewedAt?: Timestamp;
  /** SHA-256 hash for immutable semantic snapshot verification. */
  semanticHash?: string;
  /** Lifecycle (unidirectional): pending -> importing (import start) -> imported (all task writes succeed); importing -> failed (materialization error); any non-terminal intent -> superseded (newer intent replaces it). */
  status: ParsingIntentStatus;
  createdAt: Timestamp;
  importedAt?: Timestamp;
}

/**
 * ParsingImport tracks one intent materialization execution.
 * status transitions: started -> applied | partial | failed.
 */
export type ParsingImportStatus =
  /** Initial state when intent materialization starts. */
  | 'started'
  /** Terminal success state: all task writes were applied. */
  | 'applied'
  /** Terminal partial state: some task writes applied, some failed. */
  | 'partial'
  /** Terminal failure state: materialization failed. */
  | 'failed';

export interface ParsingImport {
  id: string;
  workspaceId: string;
  intentId: IntentID;
  intentVersion: number;
  idempotencyKey: string;
  status: ParsingImportStatus;
  appliedTaskIds: string[];
  startedAt: Timestamp;
  completedAt?: Timestamp;
  error?: {
    code: string;
    message: string;
  };
}
