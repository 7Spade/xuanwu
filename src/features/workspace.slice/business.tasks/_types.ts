import type { Timestamp } from '@/shared/ports'
import type { Location, SkillRequirement } from '@/features/shared-kernel'

// Location is owned by shared-kernel/schedule-contract [D19] — re-exported here for backward compatibility.
export type { Location };

export interface WorkspaceTask {
  id: string;
  name: string;
  description?: string;
  progressState: 'todo' | 'doing' | 'blocked' | 'completed' | 'verified' | 'accepted';
  priority: 'low' | 'medium' | 'high';
  type?: string;
  progress?: number;
  quantity?: number;
  completedQuantity?: number;
  unitPrice?: number;
  unit?: string;
  discount?: number;
  subtotal: number;
  parentId?: string;
  assigneeId?: string;
  dueDate?: Timestamp; // Firestore Timestamp
  photoURLs?: string[];
  location?: Location; // The specific place within the workspace address.
  sourceIntentId?: string; // SourcePointer —唯讀引用 ParsingIntent（Digital Twin）
  /** Skill requirements for this task — [TE_SK] tag::skill anchor for VS6 eligibility checks [#A4]. */
  requiredSkills?: SkillRequirement[];
  /** [S2] Monotonic version counter for optimistic concurrency control. */
  aggregateVersion?: number;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  [key: string]: unknown;
}

export type TaskWithChildren = WorkspaceTask & {
  children: TaskWithChildren[];
  descendantSum: number;
  wbsNo: string;
  progress: number;
}
