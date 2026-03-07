"use client";

import { useI18n } from "@/shared/app-providers/i18n-provider";
import { PageHeader } from "@/shared/shadcn-ui/custom-ui/page-header";

import { OrgSettings } from "./org-settings";

/**
 * OrgSettingsView — entry-point view for organization settings.
 * Mirrors the shape of UserSettingsView in account.slice.
 */
export function OrgSettingsView() {
  const { t } = useI18n();

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-12 duration-500 animate-in fade-in">
      <PageHeader
        title={t("settings.dimensionSettings")}
        description={t("settings.dimensionManagementDescription")}
      />
      <OrgSettings />
    </div>
  );
}
