"use client";

import { OrgSettingsView } from "@/features/organization.slice";
import { useApp } from "@/shared/app-providers/app-context";

import { UserSettingsView } from "./user-settings-view";

/**
 * AccountSettingsRouter — context-aware router for the /account/settings page.
 *
 * Renders OrgSettingsView when the active account is an organization,
 * and UserSettingsView when the active account is a personal account.
 * This resolves the ambiguity described in the issue: the settings page
 * must reflect the currently active account context.
 */
export function AccountSettingsRouter() {
  const { state: appState } = useApp();
  const { activeAccount } = appState;

  if (activeAccount?.accountType === "organization") {
    return <OrgSettingsView />;
  }

  return <UserSettingsView />;
}
