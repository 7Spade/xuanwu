import type { Timestamp } from '@/shared-kernel/ports'

export interface IssueComment {
  id: string;
  author: string;
  content: string;
  createdAt: Timestamp; // Firestore Timestamp
}

export interface WorkspaceIssue {
  id: string;
  title: string;
  type: 'technical' | 'financial';
  priority: 'high' | 'medium';
  issueState: 'open' | 'closed';
  /** SourcePointer to the A-track task that triggered this B-track issue. */
  sourceTaskId?: string;
  createdAt: Timestamp;
  comments?: IssueComment[];
}
