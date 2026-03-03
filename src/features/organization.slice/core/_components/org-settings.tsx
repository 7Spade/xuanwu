"use client";

import { AlertTriangle, Building2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useI18n } from "@/config/i18n/i18n-provider";
import { useApp } from "@/shared/app-providers/app-context";
import { ROUTES } from "@/shared/constants/routes";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/shared/shadcn-ui/alert-dialog";
import { Button } from "@/shared/shadcn-ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/shared/shadcn-ui/card";
import { Input } from "@/shared/shadcn-ui/input";
import { Label } from "@/shared/shadcn-ui/label";
import { Textarea } from "@/shared/shadcn-ui/textarea";
import { toast } from "@/shared/utility-hooks/use-toast";

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
  const { updateOrganizationSettings, deleteOrganization } = useOrganizationManagement();

  const [isMounted, setIsMounted] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [orgDescription, setOrgDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  useEffect(() => {
    if (activeAccount?.accountType === "organization") {
      setOrgName(activeAccount.name ?? "");
      setOrgDescription(activeAccount.description ?? "");
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
          <Button onClick={handleSave} disabled={isSaving} className="ml-auto text-xs font-bold uppercase tracking-widest">
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
