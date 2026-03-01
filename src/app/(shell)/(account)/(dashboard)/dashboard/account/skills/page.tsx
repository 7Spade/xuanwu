// [職責] Personal Skill Profile — XP accumulation and tier visualization (FR-K1).
// Per docs/prd-schedule-workforce-skills.md FR-K1.
import { PersonalSkillPanel } from '@/features/account-skill';

export default function AccountSkillsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 py-8">
      <div className="space-y-1">
        <h1 className="font-headline text-3xl font-bold tracking-tight">個人技能</h1>
        <p className="text-sm text-muted-foreground">
          追蹤您的技能 XP 累積與等級進度（FR-K1）。
        </p>
      </div>
      <PersonalSkillPanel />
    </div>
  );
}
