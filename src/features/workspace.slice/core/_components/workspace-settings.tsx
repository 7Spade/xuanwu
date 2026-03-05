// [職責] 空間設定對話框
"use client";

import { HardHat, ShieldCheck, User2 } from "lucide-react";
import { useState, useEffect } from "react";

import { Button } from "@/shared/shadcn-ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/shadcn-ui/dialog";
import { Input } from "@/shared/shadcn-ui/input";
import { Label } from "@/shared/shadcn-ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/shadcn-ui/select";
import { Switch } from "@/shared/shadcn-ui/switch";

import type { Workspace, WorkspaceLifecycleState, Address, WorkspacePersonnel } from "../_types";

interface WorkspaceSettingsDialogProps {
  workspace: Workspace;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (settings: {
    name: string;
    visibility: "visible" | "hidden";
    lifecycleState: WorkspaceLifecycleState;
    address?: Address;
    personnel?: WorkspacePersonnel;
  }) => Promise<void>;
  loading: boolean;
}

const EMPTY_ADDRESS: Address = { street: "", city: "", state: "", postalCode: "", country: "" };

export function WorkspaceSettingsDialog({
  workspace,
  open,
  onOpenChange,
  onSave,
  loading,
}: WorkspaceSettingsDialogProps) {
  const [name, setName] = useState(workspace.name);
  const [visibility, setVisibility] = useState(workspace.visibility);
  const [lifecycleState, setLifecycleState] = useState<WorkspaceLifecycleState>(
    workspace.lifecycleState
  );
  const [address, setAddress] = useState<Address>(workspace.address || EMPTY_ADDRESS);
  const [personnel, setPersonnel] = useState<WorkspacePersonnel>(workspace.personnel || {});

  useEffect(() => {
    if (workspace) {
      setName(workspace.name);
      setVisibility(workspace.visibility);
      setLifecycleState(workspace.lifecycleState);
      setAddress(workspace.address || EMPTY_ADDRESS);
      setPersonnel(workspace.personnel || {});
    }
  }, [workspace]);

  const handleAddressChange = (field: keyof Address, value: string) => {
    setAddress(prev => ({ ...prev, [field]: value }));
  };

  const handlePersonnelChange = (field: keyof WorkspacePersonnel, value: string) => {
    setPersonnel(prev => ({ ...prev, [field]: value || undefined }));
  };

  const handleSave = () => {
    onSave({ name, visibility, lifecycleState, address, personnel });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">
            Workspace Sovereignty Settings
          </DialogTitle>
        </DialogHeader>
        <div className="max-h-[70vh] space-y-6 overflow-y-auto py-4 pr-4">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest opacity-60">
              Workspace Node Name
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>

          {/* ── Personnel ─────────────────────────────────────── */}
          <div className="space-y-3">
            <Label className="text-xs font-bold uppercase tracking-widest opacity-60">
              指派人員 Personnel
            </Label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <User2 className="h-3.5 w-3.5" />
                  <span>經理 Manager</span>
                </div>
                <Input
                  placeholder="User ID / 姓名"
                  value={personnel.managerId ?? ""}
                  onChange={(e) => handlePersonnelChange("managerId", e.target.value)}
                  className="h-9 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <HardHat className="h-3.5 w-3.5" />
                  <span>督導 Supervisor</span>
                </div>
                <Input
                  placeholder="User ID / 姓名"
                  value={personnel.supervisorId ?? ""}
                  onChange={(e) => handlePersonnelChange("supervisorId", e.target.value)}
                  className="h-9 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>安衛 Safety</span>
                </div>
                <Input
                  placeholder="User ID / 姓名"
                  value={personnel.safetyOfficerId ?? ""}
                  onChange={(e) => handlePersonnelChange("safetyOfficerId", e.target.value)}
                  className="h-9 rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* ── Physical Address ──────────────────────────────── */}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest opacity-60">
                Physical Address
            </Label>
            <div className="grid grid-cols-2 gap-4">
                <Input
                    placeholder="Country"
                    value={address.country}
                    onChange={(e) => handleAddressChange('country', e.target.value)}
                    className="h-11 rounded-xl"
                />
                <Input
                    placeholder="State / Province"
                    value={address.state}
                    onChange={(e) => handleAddressChange('state', e.target.value)}
                    className="h-11 rounded-xl"
                />
            </div>
            <Input
                placeholder="City"
                value={address.city}
                onChange={(e) => handleAddressChange('city', e.target.value)}
                className="h-11 rounded-xl"
            />
            <Input
                placeholder="Street Address"
                value={address.street}
                onChange={(e) => handleAddressChange('street', e.target.value)}
                className="h-11 rounded-xl"
            />
            <div className="grid grid-cols-2 gap-4">
                <Input
                    placeholder="Postal Code"
                    value={address.postalCode}
                    onChange={(e) => handleAddressChange('postalCode', e.target.value)}
                    className="h-11 rounded-xl"
                />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest opacity-60">
              Current Lifecycle State
            </Label>
            <Select
              value={lifecycleState}
              onValueChange={(v: WorkspaceLifecycleState) =>
                setLifecycleState(v)
              }
            >
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="preparatory">Preparatory</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="stopped">Stopped</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/30 p-4">
            <div className="space-y-0.5">
              <Label className="text-sm font-bold">Workspace Visibility</Label>
              <p className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
                {visibility === "visible"
                  ? "Publicly visible in dimension directory"
                  : "Hidden, visible only to authorized personnel"}
              </p>
            </div>
            <Switch
              checked={visibility === "visible"}
              onCheckedChange={(checked) =>
                setVisibility(checked ? "visible" : "hidden")
              }
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
