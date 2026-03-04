import type { Timestamp } from '@/shared/ports'

export interface WorkspaceFileVersion {
  versionId: string;
  versionNumber: number;
  versionName: string;
  size: number;
  uploadedBy: string;
  createdAt: Timestamp | Date; // Can be Date for client-side, becomes Timestamp on server
  downloadURL: string;
}

export interface WorkspaceFile {
  id: string;
  name: string;
  type: string;
  currentVersionId: string;
  updatedAt: Timestamp | Date; // Can be Date for client-side, becomes Timestamp on server
  versions: WorkspaceFileVersion[];
}
