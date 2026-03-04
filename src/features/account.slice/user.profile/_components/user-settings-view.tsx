"use client"

import { useI18n } from "@/config/i18n/i18n-provider"
import { PageHeader } from "@/shared/ui/page-header"

import { AccountSkillsSection } from "./account-skills-section"
import { UserSettings } from "./user-settings"

export function UserSettingsView() {
  const { t } = useI18n()

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-12 duration-500 animate-in fade-in">
      <PageHeader 
        title={t('settings.userSettingsTitle')}
        description={t('settings.userSettingsDescription')}
      />
      <UserSettings />
      <AccountSkillsSection />
    </div>
  )
}
