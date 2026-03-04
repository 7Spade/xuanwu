import type { Timestamp } from '@/shared/ports'
import type { SkillRequirement } from '@/features/shared-kernel'

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
}

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
  lineItems: ParsedLineItem[];
  /** Skill requirements extracted from the document — fed to organization.schedule proposals. */
  skillRequirements?: SkillRequirement[];
  status: 'pending' | 'imported' | 'superseded' | 'failed';
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
