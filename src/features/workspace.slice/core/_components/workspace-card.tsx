// [職責] 單個 Workspace 的卡片展示
"use client";

import {
  Building2,
  Eye,
  EyeOff,
  HardHat,
  Hash,
  MapPin,
  Settings,
  Shield,
  ShieldCheck,
  Trash2,
  UserPlus,
  User2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";

import { useI18n } from "@/app-runtime/providers/i18n-provider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shadcn-ui/alert-dialog";
import { Badge } from "@/shadcn-ui/badge";
import { Button } from "@/shadcn-ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/shadcn-ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shadcn-ui/card";
import { toast } from "@/shadcn-ui/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shadcn-ui/tooltip";
import { ROUTES } from "@/shared-kernel/constants/routes";

import { deleteWorkspace, updateWorkspaceSettings, uploadWorkspaceAvatar } from "../_actions";
import type { Workspace, WorkspaceLifecycleState, Address, WorkspacePersonnel } from "../_types";


import { WorkspaceSettingsDialog } from "./workspace-settings";

interface WorkspaceCardProps {
  workspace: Workspace;
}

/** Build a Google Maps search URL from an Address. */
function buildMapsUrl(address: Workspace["address"]): string {
  if (!address) return "#";
  const query = [address.street, address.city, address.state, address.country]
    .filter(Boolean)
    .join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/** Single personnel slot — shows initials badge when assigned, assign button when empty. */
function PersonnelSlot({
  icon: Icon,
  label,
  userId,
  onAssign,
}: {
  icon: React.FC<{ className?: string }>;
  label: string;
  userId?: string;
  onAssign: () => void;
}) {
  if (userId) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="flex size-8 cursor-default items-center justify-center rounded-full border-2 border-background bg-primary/10 text-[10px] font-bold shadow-sm"
            aria-label={`${label}: ${userId}`}
          >
            {userId[0].toUpperCase()}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="flex items-center gap-1.5 text-xs">
          <Icon className="size-3" />
          {label}: {userId}
        </TooltipContent>
      </Tooltip>
    );
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="size-8 rounded-full border-dashed text-muted-foreground hover:border-primary hover:text-primary"
          aria-label={`指派 ${label}`}
          onClick={(e) => {
            e.stopPropagation();
            onAssign();
          }}
        >
          <UserPlus className="size-3.5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top" className="flex items-center gap-1.5 text-xs">
        <Icon className="size-3" />
        指派 {label}
      </TooltipContent>
    </Tooltip>
  );
}

export function WorkspaceCard({ workspace }: WorkspaceCardProps) {
  const router = useRouter();
  const { t } = useI18n();

  const [isDestroyOpen, setIsDestroyOpen] = useState(false);
  const [isDestroying, setIsDestroying] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  /* Optimistic visibility toggle ─────────────────────────────── */
  const [optimisticVisibility, setOptimisticVisibility] = useState<
    "visible" | "hidden"
  >(workspace.visibility);

  const handleVisibilityToggle = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      const next = optimisticVisibility === "visible" ? "hidden" : "visible";
      setOptimisticVisibility(next); // optimistic
      const result = await updateWorkspaceSettings(workspace.id, {
        name: workspace.name,
        visibility: next,
        lifecycleState: workspace.lifecycleState,
        address: workspace.address,
        personnel: workspace.personnel,
        photoURL: workspace.photoURL,
      });
      if (!result.success) {
        setOptimisticVisibility(optimisticVisibility); // rollback
        toast({ variant: "destructive", title: "Visibility update failed", description: result.error.message });
      }
    },
    [optimisticVisibility, workspace]
  );

  /* Settings save ─────────────────────────────────────────────── */
  const handleSettingsSave = async (settings: {
    name: string;
    visibility: "visible" | "hidden";
    lifecycleState: WorkspaceLifecycleState;
    address?: Address;
    personnel?: WorkspacePersonnel;
    photoURL?: string;
  }) => {
    setIsSavingSettings(true);
    const result = await updateWorkspaceSettings(workspace.id, settings);
    setIsSavingSettings(false);
    if (!result.success) {
      toast({ variant: "destructive", title: "Failed to Update Settings", description: result.error.message });
      return;
    }
    toast({ title: "Space settings synchronized" });
    setIsSettingsOpen(false);
  };

  const handleAvatarUpload = async (file: File): Promise<string> => {
    setIsUploadingAvatar(true);
    try {
      const photoURL = await uploadWorkspaceAvatar(workspace.id, file);
      const result = await updateWorkspaceSettings(workspace.id, {
        name: workspace.name,
        visibility: optimisticVisibility,
        lifecycleState: workspace.lifecycleState,
        address: workspace.address,
        personnel: workspace.personnel,
        photoURL,
      });
      if (!result.success) {
        throw new Error(result.error.message);
      }
      toast({ title: "Avatar updated successfully" });
      return photoURL;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({ variant: "destructive", title: "Failed to upload avatar", description: message });
      throw error instanceof Error ? error : new Error(message);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  /* Destroy ───────────────────────────────────────────────────── */
  const handleDestroyConfirm = async () => {
    setIsDestroying(true);
    const result = await deleteWorkspace(workspace.id);
    setIsDestroying(false);
    if (!result.success) {
      toast({ variant: "destructive", title: "Failed to Destroy Space", description: result.error.message });
      return;
    }
    toast({ variant: "default", title: "Workspace node destroyed", description: `Space "${workspace.name}" has been permanently removed.` });
    setIsDestroyOpen(false);
    router.push(ROUTES.WORKSPACES);
  };

  /* Helpers ───────────────────────────────────────────────────── */
  const formattedAddress = workspace.address
    ? [workspace.address.street, workspace.address.city, workspace.address.state, workspace.address.country]
        .filter(Boolean)
        .join(", ")
    : null;

  const openAssignSettings = useCallback(() => {
    setIsSettingsOpen(true);
  }, []);

  return (
    <>
      <Card
        className="group cursor-pointer border-border/60 bg-card/60 backdrop-blur-sm transition-all duration-300 hover:border-primary/40 hover:shadow-lg"
        onClick={() => router.push(ROUTES.WORKSPACE(workspace.id))}
      >
        {/* ── Card Header ─────────────────────────────────────── */}
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            {/* Left: workspace avatar */}
            <Avatar className="size-10 border border-primary/20">
              <AvatarImage src={workspace.photoURL} />
              <AvatarFallback className="bg-primary/5 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                {workspace.name?.[0] ?? <Shield className="size-5" />}
              </AvatarFallback>
            </Avatar>

            {/* Right: visibility toggle + settings + delete (separate, single-responsibility) */}
            <div className="flex items-center gap-1">
              {/* Visibility toggle — clickable badge */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-7 rounded-full text-muted-foreground"
                    aria-label={optimisticVisibility === "visible" ? "隱藏工作區" : "公開工作區"}
                    onClick={handleVisibilityToggle}
                  >
                    {optimisticVisibility === "visible" ? (
                      <Eye className="size-3.5" />
                    ) : (
                      <EyeOff className="size-3.5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  {optimisticVisibility === "visible" ? "公開" : "隱藏"} — 點擊切換
                </TooltipContent>
              </Tooltip>

              {/* Settings — single action */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground hover:bg-accent/10"
                    aria-label="Workspace Settings"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsSettingsOpen(true);
                    }}
                  >
                    <Settings className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">設定</TooltipContent>
              </Tooltip>

              {/* Delete — single action */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Destroy workspace"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsDestroyOpen(true);
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs text-destructive">刪除</TooltipContent>
              </Tooltip>
            </div>
          </div>

          <CardTitle className="mt-4 truncate font-headline text-lg transition-colors group-hover:text-primary">
            {workspace.name}
          </CardTitle>
          <CardDescription className="text-[9px] font-bold uppercase tracking-widest opacity-60">
            {t("workspaces.lifecycleState")}: {workspace.lifecycleState}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* ── Scope badges ────────────────────────────────────── */}
          <div className="flex min-h-[32px] flex-wrap gap-1.5">
            {(workspace.scope || []).slice(0, 3).map((s) => (
              <Badge
                key={s}
                variant="secondary"
                className="border-none bg-muted/50 px-1.5 py-0 text-[8px] uppercase tracking-tighter"
              >
                {s}
              </Badge>
            ))}
            {(workspace.scope || []).length > 3 && (
              <span className="text-[8px] text-muted-foreground opacity-60">
                +{(workspace.scope || []).length - 3}
              </span>
            )}
          </div>

          {/* ── Personnel row ────────────────────────────────────── */}
          <div className="flex items-center gap-3 rounded-xl border border-border/30 bg-muted/20 px-3 py-2">
            <PersonnelSlot
              icon={User2}
              label="經理"
              userId={workspace.personnel?.managerId}
              onAssign={openAssignSettings}
            />
            <PersonnelSlot
              icon={HardHat}
              label="督導"
              userId={workspace.personnel?.supervisorId}
              onAssign={openAssignSettings}
            />
            <PersonnelSlot
              icon={ShieldCheck}
              label="安衛"
              userId={workspace.personnel?.safetyOfficerId}
              onAssign={openAssignSettings}
            />
          </div>

          {/* ── Meta: ID / Address / Locations ──────────────────── */}
          <div className="space-y-1.5 border-t border-border/20 pt-3">
            <div className="flex items-center gap-1.5">
              <Hash className="size-3 shrink-0 text-muted-foreground/60" />
              <span className="font-mono text-[9px] text-muted-foreground">{workspace.id}</span>
            </div>

            {/* Address — always show with Google Maps link */}
            <div
              className="flex items-start gap-1.5"
              onClick={(e) => e.stopPropagation()}
            >
              <MapPin className="mt-px size-3 shrink-0 text-muted-foreground/60" />
              {formattedAddress ? (
                <a
                  href={buildMapsUrl(workspace.address)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[9px] leading-tight text-muted-foreground underline-offset-2 hover:text-primary hover:underline"
                >
                  {formattedAddress}
                </a>
              ) : (
                <button
                  className="text-[9px] leading-tight text-muted-foreground/40 hover:text-primary"
                  onClick={(e) => { e.stopPropagation(); openAssignSettings(); }}
                >
                  未設定地址
                </button>
              )}
            </div>

            {/* Locations — all sub-locations in the compound */}
            {(workspace.locations ?? []).length > 0 ? (
              workspace.locations!.map((loc) => (
                <div key={loc.locationId} className="flex items-start gap-1.5">
                  <Building2 className="mt-px size-3 shrink-0 text-muted-foreground/60" />
                  <span className="text-[9px] leading-tight text-muted-foreground">{loc.label}</span>
                </div>
              ))
            ) : (
              <div className="flex items-start gap-1.5">
                <Building2 className="mt-px size-3 shrink-0 text-muted-foreground/30" />
                <button
                  className="text-[9px] leading-tight text-muted-foreground/40 hover:text-primary"
                  onClick={(e) => { e.stopPropagation(); openAssignSettings(); }}
                >
                  未設定地點
                </button>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex items-center justify-between border-t border-border/20 pb-4 pt-3">
          <div className="flex flex-col">
            <span className="text-[8px] font-bold uppercase leading-none tracking-tighter text-muted-foreground">
              [{t("workspaces.defaultProtocol")}]
            </span>
            <span className="max-w-[120px] truncate font-mono text-[10px]">
              {workspace.protocol || t("workspaces.standard")}
            </span>
          </div>
          <div className="flex -space-x-1.5">
            {(workspace.grants || [])
              .filter((g) => g.status === "active")
              .slice(0, 3)
              .map((g, i) => (
                <div
                  key={g.userId ?? i}
                  className="flex size-6 items-center justify-center rounded-full border-2 border-background bg-primary/10 text-[8px] font-bold shadow-sm"
                >
                  {g.userId?.[0].toUpperCase() || "U"}
                </div>
              ))}
          </div>
        </CardFooter>
      </Card>

      {/* ── Settings Dialog (inline, no navigation) ───────────── */}
      <WorkspaceSettingsDialog
        workspace={workspace}
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        onSave={handleSettingsSave}
        onUploadAvatar={handleAvatarUpload}
        loading={isSavingSettings}
        isUploadingAvatar={isUploadingAvatar}
      />

      {/* ── Destroy Space confirmation ─────────────────────────── */}
      <AlertDialog open={isDestroyOpen} onOpenChange={setIsDestroyOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-headline text-xl text-destructive">
              Initiate Workspace Destruction Protocol
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-sm">
              <span>
                You are about to permanently destroy the workspace node{" "}
                <span className="font-bold text-foreground">
                  &quot;{workspace.name}&quot;
                </span>
                .
              </span>
              <span className="mt-2 block rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-[11px] italic text-destructive">
                This action will permanently erase this workspace and all its
                subordinate atomic data and technical specifications. This
                cannot be undone.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDestroying}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDestroyConfirm}
              disabled={isDestroying}
            >
              {isDestroying ? "Destroying..." : "Confirm Destruction"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
