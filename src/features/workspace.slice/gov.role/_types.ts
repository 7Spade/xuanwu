import type { Timestamp } from '@/shared/ports'

export type WorkspaceRole = 'Manager' | 'Contributor' | 'Viewer';

export interface WorkspaceGrant {
  grantId: string;
  userId: string;
  role: WorkspaceRole;
  protocol: string; // Strategy Definition, immutable
  status: 'active' | 'revoked' | 'expired';
  grantedAt: Timestamp; // Event Timestamp
  revokedAt?: Timestamp; // Event Timestamp
  expiresAt?: Timestamp; // State Boundary
}
