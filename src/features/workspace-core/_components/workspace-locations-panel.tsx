'use client';

/**
 * workspace-core — _components/workspace-locations-panel.tsx
 *
 * Management panel for workspace sub-locations (廠區子地點).
 * Per docs/prd-schedule-workforce-skills.md FR-L1/FR-L2/FR-L3.
 *
 * FR-L1: HR or Workspace OWNER can create sub-locations.
 * FR-L2: HR or Workspace OWNER can edit sub-location label/description/capacity.
 * FR-L3: HR or Workspace OWNER can delete sub-locations.
 *
 * Per GEMINI.md §2.3 D3/D5:
 *   All mutations use Server Actions from workspace-core/_actions.ts.
 */

import { useState, useCallback } from 'react';
import { createWorkspaceLocation, updateWorkspaceLocation, deleteWorkspaceLocation } from '../_actions';
import { toast } from '@/shared/utility-hooks/use-toast';
import type { WorkspaceLocation } from '@/shared/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/shadcn-ui/card';
import { Button } from '@/shared/shadcn-ui/button';
import { Input } from '@/shared/shadcn-ui/input';
import { Label } from '@/shared/shadcn-ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/shadcn-ui/dialog';
import { Plus, Pencil, Trash2, MapPin } from 'lucide-react';

// ---------------------------------------------------------------------------
// Location form dialog (create + edit)
// ---------------------------------------------------------------------------

interface LocationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  /** Populated only when editing an existing location. */
  existing?: WorkspaceLocation;
  onSaved: () => void;
}

function LocationFormDialog({
  open,
  onOpenChange,
  workspaceId,
  existing,
  onSaved,
}: LocationFormDialogProps) {
  const [label, setLabel] = useState(existing?.label ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [capacity, setCapacity] = useState<string>(
    existing?.capacity != null ? String(existing.capacity) : ''
  );
  const [loading, setLoading] = useState(false);

  const isEdit = existing != null;

  const handleSave = useCallback(async () => {
    if (!label.trim()) {
      toast({ variant: 'destructive', title: '請輸入子地點名稱。' });
      return;
    }
    setLoading(true);
    try {
      const capacityNum = capacity !== '' ? Number(capacity) : undefined;

      if (isEdit && existing) {
        // FR-L2: update
        const result = await updateWorkspaceLocation(workspaceId, existing.locationId, {
          label: label.trim(),
          description: description.trim() || undefined,
          capacity: capacityNum,
        });
        if (result.success) {
          toast({ title: '子地點已更新' });
          onSaved();
          onOpenChange(false);
        } else {
          toast({ variant: 'destructive', title: '更新失敗', description: result.error.message });
        }
      } else {
        // FR-L1: create
        const newLocation: WorkspaceLocation = {
          locationId: crypto.randomUUID(),
          label: label.trim(),
          description: description.trim() || undefined,
          capacity: capacityNum,
        };
        const result = await createWorkspaceLocation(workspaceId, newLocation);
        if (result.success) {
          toast({ title: '子地點已新增' });
          onSaved();
          onOpenChange(false);
        } else {
          toast({ variant: 'destructive', title: '新增失敗', description: result.error.message });
        }
      }
    } catch {
      toast({ variant: 'destructive', title: '操作失敗', description: '請稍後再試。' });
    } finally {
      setLoading(false);
    }
  }, [label, description, capacity, workspaceId, existing, isEdit, onSaved, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? '編輯子地點' : '新增子地點'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="loc-label">名稱 *</Label>
            <Input
              id="loc-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="例：A棟 2F 東北角"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="loc-desc">描述</Label>
            <Input
              id="loc-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="選填說明"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="loc-capacity">容納人數</Label>
            <Input
              id="loc-capacity"
              type="number"
              min={1}
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder="選填"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? '儲存中…' : '儲存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Main panel
// ---------------------------------------------------------------------------

interface WorkspaceLocationsPanelProps {
  workspaceId: string;
  /** Current locations from the workspace read model. */
  locations: WorkspaceLocation[];
  /** Called after a mutation so the parent can re-fetch/refresh. */
  onRefresh?: () => void;
}

/**
 * WorkspaceLocationsPanel — FR-L1/L2/L3 sub-location management UI.
 *
 * Displays the list of sub-locations for a workspace and provides create,
 * edit, and delete actions via Server Actions.
 */
export function WorkspaceLocationsPanel({
  workspaceId,
  locations,
  onRefresh,
}: WorkspaceLocationsPanelProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<WorkspaceLocation | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const openCreate = useCallback(() => {
    setEditTarget(undefined);
    setDialogOpen(true);
  }, []);

  const openEdit = useCallback((loc: WorkspaceLocation) => {
    setEditTarget(loc);
    setDialogOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (locationId: string) => {
      setDeletingId(locationId);
      try {
        const result = await deleteWorkspaceLocation(workspaceId, locationId);
        if (result.success) {
          toast({ title: '子地點已刪除' });
          onRefresh?.();
        } else {
          toast({ variant: 'destructive', title: '刪除失敗', description: result.error.message });
        }
      } catch {
        toast({ variant: 'destructive', title: '操作失敗', description: '請稍後再試。' });
      } finally {
        setDeletingId(null);
      }
    },
    [workspaceId, onRefresh]
  );

  const handleSaved = useCallback(() => {
    onRefresh?.();
  }, [onRefresh]);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b py-3">
          <CardTitle className="flex items-center gap-1.5 text-sm font-bold uppercase tracking-widest">
            <MapPin className="size-3.5" />
            子地點管理
          </CardTitle>
          <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={openCreate}>
            <Plus className="size-3" /> 新增
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {locations.length === 0 ? (
            <p className="py-6 text-center text-xs italic text-muted-foreground">
              尚未設定子地點。
            </p>
          ) : (
            <ul className="divide-y">
              {locations.map((loc) => (
                <li key={loc.locationId} className="flex items-center justify-between gap-2 px-4 py-3">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">{loc.label}</p>
                    {loc.description && (
                      <p className="text-xs text-muted-foreground">{loc.description}</p>
                    )}
                    {loc.capacity != null && (
                      <p className="text-xs text-muted-foreground">容納：{loc.capacity} 人</p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7"
                      onClick={() => openEdit(loc)}
                      title="編輯"
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7 text-destructive hover:text-destructive/80"
                      disabled={deletingId === loc.locationId}
                      onClick={() => handleDelete(loc.locationId)}
                      title="刪除"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <LocationFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        workspaceId={workspaceId}
        existing={editTarget}
        onSaved={handleSaved}
      />
    </>
  );
}
