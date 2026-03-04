"use client";

import { BookOpen } from "lucide-react";

import { useI18n } from "@/config/i18n/i18n-provider";
import { PersonalSkillPanel } from "@/features/skill-xp.slice";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/shadcn-ui/card";

/**
 * AccountSkillsSection — Read-only skill XP display in the account settings page.
 *
 * [D7]  Data sourced exclusively from VS3 (skill-xp.slice) public API.
 * [D15] VS3 QGWAY uses EVENTUAL consistency (accountSkillView projection).
 *       Skills are earned via scheduled tasks; manual write operations are prohibited.
 */
export function AccountSkillsSection() {
  const { t } = useI18n();
  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader>
        <div className="mb-1 flex items-center gap-2 text-primary">
          <BookOpen className="size-4" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Skills</span>
        </div>
        <CardTitle className="font-headline">{t('settings.skillProgressTitle')}</CardTitle>
        <CardDescription>
          {t('settings.skillProgressDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <PersonalSkillPanel />
      </CardContent>
    </Card>
  );
}
