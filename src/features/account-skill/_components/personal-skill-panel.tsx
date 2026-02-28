'use client';

/**
 * account-skill — _components/personal-skill-panel.tsx
 *
 * FR-K1: Personal skill profile page — XP bar and tier badge for each skill.
 *
 * Invariant #12: tier is NEVER read from DB; derived via resolveSkillTier(xp).
 */

import { useEffect, useState } from 'react';
import { useApp } from '@/shared/app-providers/app-context';
import { getAccountSkillView } from '@/features/projection.account-skill-view';
import type { AccountSkillEntry } from '@/features/projection.account-skill-view';
import { resolveSkillTier, TIER_DEFINITIONS } from '@/features/shared.kernel.skill-tier';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/shadcn-ui/card';
import { Badge } from '@/shared/shadcn-ui/badge';
import { Progress } from '@/shared/shadcn-ui/progress';
import { Sparkles } from 'lucide-react';

interface SkillRow {
  skillId: string;
  xp: number;
  tier: string;
  tierLabel: string;
  tierColor: string;
  progressPct: number;
  xpInTier: number;
  xpNeeded: number;
}

function buildRows(entries: AccountSkillEntry[]): SkillRow[] {
  return entries.map((e) => {
    const tier = resolveSkillTier(e.xp);
    const def = TIER_DEFINITIONS.find((d) => d.tier === tier) ?? TIER_DEFINITIONS[0];
    const nextDef = TIER_DEFINITIONS.find((d) => d.rank === def.rank + 1);
    const xpInTier = e.xp - def.minXp;
    const xpNeeded = nextDef ? nextDef.minXp - def.minXp : def.maxXp - def.minXp;
    const progressPct = xpNeeded > 0 ? Math.min(100, Math.round((xpInTier / xpNeeded) * 100)) : 100;
    return {
      skillId: e.skillId,
      xp: e.xp,
      tier,
      tierLabel: def.label,
      tierColor: def.color,
      progressPct,
      xpInTier,
      xpNeeded,
    };
  });
}

export function PersonalSkillPanel() {
  const { state } = useApp();
  const { activeAccount } = state;
  const accountId = activeAccount?.id ?? '';

  const [rows, setRows] = useState<SkillRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accountId) return;
    setLoading(true);
    getAccountSkillView(accountId)
      .then((entries) => setRows(buildRows(entries)))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [accountId]);

  if (loading) {
    return (
      <p className="py-12 text-center text-sm italic text-muted-foreground">載入技能資料…</p>
    );
  }

  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Sparkles className="mx-auto mb-3 size-8 text-muted-foreground" />
          <p className="text-sm font-medium text-muted-foreground">尚無技能紀錄</p>
          <p className="mt-1 text-xs text-muted-foreground">
            完成排程任務後系統將自動累積 XP。
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((row) => (
        <Card key={row.skillId} className="overflow-hidden">
          {/* Tier color accent bar */}
          <div className="h-1" style={{ backgroundColor: row.tierColor }} />
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-3">
            <CardTitle className="text-xs font-bold uppercase tracking-wider">
              {row.skillId}
            </CardTitle>
            <Badge
              variant="outline"
              className="border-0 text-[9px] font-bold uppercase tracking-widest"
              style={{ backgroundColor: `${row.tierColor}30`, color: row.tierColor }}
            >
              {row.tierLabel}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-2 pb-4 pt-0">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold tabular-nums">{row.xp}</span>
              <span className="text-xs text-muted-foreground">XP</span>
            </div>
            <Progress value={row.progressPct} className="h-1.5" />
            <p className="text-[10px] text-muted-foreground">
              {row.xpInTier} / {row.xpNeeded} XP → 下一等級
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
