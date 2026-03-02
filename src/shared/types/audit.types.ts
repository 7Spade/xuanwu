import type { Timestamp } from '@/shared/ports'

export type AuditLogType = 'create' | 'update' | 'delete' | 'security';

export interface AuditLog {
  id: string;
  accountId: string;
  workspaceId?: string;
  workspaceName?: string;
  recordedAt: Timestamp; // Event Timestamp
  actor: string;
  actorId?: string;
  action: string;
  target: string;
  type: AuditLogType;
  metadata?: {
    before?: unknown;
    after?: unknown;
    ip?: string;
  };
}
