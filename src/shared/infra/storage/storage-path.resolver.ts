/**
 * storage-path.resolver.ts — Firebase Storage Path Rules
 *
 * [D24] All Storage path construction must go through this resolver.
 *       Feature slices must NOT build raw Storage paths directly.
 *
 * Usage:
 *   import { StoragePaths } from '@/shared/infra/storage/storage-path.resolver';
 *   const path = StoragePaths.dailyPhoto(accountId, workspaceId, fileId, fileName);
 */

export const StoragePaths = {
  /** Daily log photo: daily-photos/{accountId}/{workspaceId}/{fileId}/{fileName} */
  dailyPhoto(accountId: string, workspaceId: string, fileId: string, fileName: string): string {
    return `daily-photos/${accountId}/${workspaceId}/${fileId}/${fileName}`;
  },

  /** Task attachment: task-attachments/{workspaceId}/{fileId}/{fileName} */
  taskAttachment(workspaceId: string, fileId: string, fileName: string): string {
    return `task-attachments/${workspaceId}/${fileId}/${fileName}`;
  },

  /** User profile avatar: user-profiles/{userId}/avatar.jpg */
  userAvatar(userId: string): string {
    return `user-profiles/${userId}/avatar.jpg`;
  },

  /** Workspace document version: files-plugin/{workspaceId}/{fileId}/{versionId}/{fileName} */
  workspaceDocument(workspaceId: string, fileId: string, versionId: string, fileName: string): string {
    return `files-plugin/${workspaceId}/${fileId}/${versionId}/${fileName}`;
  },
} as const;
