import type { Timestamp } from '@/shared/ports'
import type { WorkspaceGrant } from '../gov.role/_types'
import type { WorkspaceTask } from '../business.tasks/_types'
import type { WorkspaceIssue } from '../business.issues/_types'
import type { WorkspaceFile } from '../business.files/_types'

export type WorkspaceLifecycleState = 'preparatory' | 'active' | 'stopped';

/** Designated role-holders for a workspace (經理/督導/安衛). */
export interface WorkspacePersonnel {
  managerId?: string;
  supervisorId?: string;
  safetyOfficerId?: string;
}

export interface CapabilitySpec {
  id: string;
  name: string;
  type: 'ui' | 'api' | 'data' | 'governance' | 'monitoring';
  status: 'stable' | 'beta';
  description: string;
}

export interface Capability extends CapabilitySpec {
  config?: object;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  details?: string;
}

/**
 * WorkspaceLocation — a sub-location within a workspace (廠區子地點).
 * Per docs/prd-schedule-workforce-skills.md FR-L1/FR-L2/FR-L3.
 * Workspace OWNER can create/edit/delete sub-locations.
 */
export interface WorkspaceLocation {
  locationId: string;
  label: string;        // e.g. "A棟 2F 東北角", "主會議室"
  description?: string;
  capacity?: number;    // max number of people (optional)
}

export interface Workspace {
  id: string;
  dimensionId: string; // The ID of the User or Organization this workspace belongs to.
  name: string;
  lifecycleState: WorkspaceLifecycleState;
  visibility: 'visible' | 'hidden';
  scope: string[];
  protocol: string; // Default protocol template
  capabilities: Capability[];
  grants: WorkspaceGrant[];
  teamIds: string[];
  tasks?: Record<string, WorkspaceTask>;
  issues?: Record<string, WorkspaceIssue>;
  files?: Record<string, WorkspaceFile>;
  address?: Address; // The physical address of the entire workspace.
  /** Sub-locations within this workspace (廠區子地點). FR-L1. */
  locations?: WorkspaceLocation[];
  /** Designated role-holders (經理 | 督導 | 安衛). */
  personnel?: WorkspacePersonnel;
  createdAt: Timestamp;
}
