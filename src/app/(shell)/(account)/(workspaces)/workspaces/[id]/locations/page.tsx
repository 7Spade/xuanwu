// [職責] Workspace sub-locations management route (FR-L1/FR-L2/FR-L3)
'use client';

import { useRouter } from 'next/navigation';
import { useWorkspace } from '@/features/workspace.slice';
import { WorkspaceLocationsPanel } from '@/features/workspace.slice';
import { Button } from '@/shared/shadcn-ui/button';
import { ROUTES } from '@/shared/constants/routes';

export default function WorkspaceLocationsPage() {
  const router = useRouter();
  const { workspace } = useWorkspace();

  return (
    <div className="mx-auto max-w-2xl py-8">
      <div className="mb-6 space-y-1">
        <h1 className="font-headline text-3xl font-bold tracking-tight">子地點管理</h1>
        <p className="text-sm text-muted-foreground">
          管理廠區「{workspace.name}」的子地點（FR-L1 / FR-L2 / FR-L3）。
        </p>
      </div>

      <WorkspaceLocationsPanel
        workspaceId={workspace.id}
        locations={workspace.locations ?? []}
      />

      <Button
        variant="ghost"
        size="sm"
        className="mt-4 text-xs text-muted-foreground"
        onClick={() => router.push(ROUTES.WORKSPACE(workspace.id))}
      >
        ← 返回廠區
      </Button>
    </div>
  );
}
