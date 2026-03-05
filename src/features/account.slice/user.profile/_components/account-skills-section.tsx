"use client"

import { useI18n } from "@/config/i18n/i18n-provider"
import { PersonalSkillPanel } from "@/features/skill-xp.slice"
import { PageHeader } from "@/shared/ui/page-header"

export function AccountSkillsSection() {
  const { t } = useI18n()

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("settings.skillProgressTitle")}
        description={t("settings.skillProgressDescription")}
      />
      <PersonalSkillPanel />
    </div>
  )
}
