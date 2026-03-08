"use client";

import { AlertTriangle, Building2, Loader2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { type ChangeEvent, useEffect, useRef, useState } from "react";

import { useApp } from "@/app-runtime/providers/app-provider";
import { useI18n } from "@/app-runtime/providers/i18n-provider";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/shadcn-ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/shadcn-ui/avatar";
import { Button } from "@/shadcn-ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/shadcn-ui/card";
import { toast } from "@/shadcn-ui/hooks/use-toast";
import { Input } from "@/shadcn-ui/input";
import { Label } from "@/shadcn-ui/label";
import { Textarea } from "@/shadcn-ui/textarea";
import { ROUTES } from "@/shared-kernel/constants/routes";

import { useOrganizationManagement } from "../_hooks/use-organization-management";

/**
 * OrgSettings — smart component for organization settings.
 * Manages state and delegates to card sub-components.
 */
export function OrgSettings() {
  const router = useRouter();
  const { t } = useI18n();
  const { state: appState } = useApp();
  const { activeAccount } = appState;
  const { updateOrganizationSettings, deleteOrganization, uploadAvatar } = useOrganizationManagement();

  const [isMounted, setIsMounted] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [orgDescription, setOrgDescription] = useState("");
  const [orgPhotoURL, setOrgPhotoURL] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setIsMounted(true); }, []);

  useEffect(() => {
    if (activeAccount?.accountType === "organization") {
      setOrgName(activeAccount.name ?? "");
      setOrgDescription(activeAccount.description ?? "");
      setOrgPhotoURL(activeAccount.photoURL ?? "");
    }
  }, [activeAccount]);

  if (!isMounted || activeAccount?.accountType !== "organization") return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateOrganizationSettings({ name: orgName, description: orgDescription });
      toast({ title: t("settings.dimensionSovereigntyUpdated"), description: t("settings.dimensionSovereigntyDescription") });
    } catch (e: unknown) {
      toast({ variant: "destructive", title: t("settings.failedToSaveSettings"), description: e instanceof Error ? e.message : String(e) });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setShowDeleteDialog(false);
    setIsDeleting(true);
    try {
      await deleteOrganization();
      toast({ title: t("settings.dimensionDestroyed") });
      router.push(ROUTES.DASHBOARD);
    } catch (e: unknown) {
      toast({ variant: "destructive", title: t("settings.failedToDestroyDimension"), description: e instanceof Error ? e.message : String(e) });
      setIsDeleting(false);
    }
  };

  const handleAvatarUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const uploadedPhotoURL = await uploadAvatar(file);
      setOrgPhotoURL(uploadedPhotoURL);
      toast({ title: "Avatar updated successfully" });
    } catch (e: unknown) {
      toast({
        variant: "destructive",
        title: t("settings.failedToSaveSettings"),
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  return (
    <div className="grid gap-6">
      {/* General Settings Card */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <div className="mb-1 flex items-center gap-2 text-primary">
            <Building2 className="size-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">{t("settings.dimensionSettings")}</span>
          </div>
          <CardTitle className="font-headline">{activeAccount.name}</CardTitle>
          <CardDescription>{t("settings.dimensionManagementDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="size-20 border-2 border-primary/20">
                <AvatarImage src={orgPhotoURL} />
                <AvatarFallback className="bg-primary/5 text-2xl font-bold text-primary">
                  {orgName?.[0]}
                </AvatarFallback>
              </Avatar>
              {isUploading ? (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/50">
                  <Loader2 className="animate-spin text-primary" />
                </div>
              ) : null}
            </div>
            <div className="space-y-2">
              <Button onClick={() => avatarInputRef.current?.click()} disabled={isUploading}>
                <Upload className="mr-2 size-4" /> Upload Image
              </Button>
              <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 5MB.</p>
              <input
                ref={avatarInputRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleAvatarUpload}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="org-name">{t("settings.dimensionName")}</Label>
            <Input id="org-name" value={orgName} onChange={(e) => setOrgName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="org-description">{t("settings.dimensionDescription")}</Label>
            <Textarea
              id="org-description"
              value={orgDescription}
              onChange={(e) => setOrgDescription(e.target.value)}
              placeholder={t("settings.dimensionDescriptionPlaceholder")}
              className="min-h-[80px]"
            />
          </div>
        </CardContent>
        <CardFooter className="border-t bg-muted/20">
          <Button onClick={handleSave} disabled={isSaving || isUploading} className="ml-auto text-xs font-bold uppercase tracking-widest">
            {isSaving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            {isSaving ? t("common.saving") : t("settings.saveChanges")}
          </Button>
        </CardFooter>
      </Card>

      {/* Danger Zone Card */}
      <Card className="border-2 border-destructive/30 bg-destructive/5 shadow-sm">
        <CardHeader>
          <div className="mb-1 flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">{t("settings.dangerZone")}</span>
          </div>
          <CardTitle className="font-headline text-destructive">{t("settings.destroyDimension")}</CardTitle>
          <CardDescription className="text-destructive/80">{t("settings.destroyDimensionDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={() => setShowDeleteDialog(true)} disabled={isDeleting} className="text-xs font-bold uppercase tracking-widest">
            {isDeleting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            {t("settings.destroy")}
          </Button>
        </CardContent>
      </Card>

      {/* Confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-sm rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("settings.destroyDimension")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("settings.confirmDestroy").replace("{name}", activeAccount.name ?? "")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDelete}>
              {t("settings.destroy")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
