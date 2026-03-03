'use client';

/**
 * scheduling.slice — _components/org-skill-pool-manager.tsx
 *
 * Org Skill Pool Manager tab for Organization Schedule.
 *
 * Per logic-overview.md (VS4 / T2):
 *   SKILL_TAG_POOL is the org-scoped activation view of the global Tag Authority.
 *   Org admins explicitly activate tags they want to use; passively syncs with TagLifecycleEvents.
 *
 * UX:
 *   Displays all skills from the global dictionary (SKILLS constant) grouped by
 *   大項目 (SkillGroup) → 子項目 (SkillSubCategory) → individual skills.
 *   Activated skills (in org pool) are visually highlighted and can be removed.
 *   Inactive skills show an "加入" button to activate them into the org pool.
 *
 * This management UI removes the burden of browsing the entire global dictionary
 * every time HR creates a schedule proposal (FR-K5).
 */

import { BookOpen, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useOptimistic, useState, useTransition } from 'react';

import { addOrgSkillTagAction, removeOrgSkillTagAction } from '@/features/skill-xp.slice';
import { getOrgSkillTags } from '@/features/skill-xp.slice';
import { useApp } from '@/shared/app-providers/app-context';
import {
  SKILL_GROUPS,
  SKILL_SUB_CATEGORY_BY_KEY,
  SKILLS,
  type SkillGroup,
  type SkillSubCategory,
} from '@/shared/constants/skills';
import { Badge } from '@/shared/shadcn-ui/badge';
import { Button } from '@/shared/shadcn-ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/shadcn-ui/card';
import { ScrollArea } from '@/shared/shadcn-ui/scroll-area';
import { toast } from '@/shared/shadcn-ui/hooks/use-toast';

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * Org Skill Pool Manager.
 *
 * Lets org admins select which skills from the global dictionary are applicable
 * to their organization. Selected skills appear in ProposalDialog's skill picker
 * instead of the full global library (FR-K5).
 *
 * Writes to: orgSkillTagPool/{orgId}/tags/{tagSlug}  (via server actions)
 * Reads from: getOrgSkillTags(orgId)
 */
export function OrgSkillPoolManager() {
  const { state } = useApp();
  const { activeAccount } = state;

  const orgId = activeAccount?.accountType === 'organization' ? activeAccount.id : null;
  const actorId = activeAccount?.id ?? 'system';

  const [poolSlugs, setPoolSlugs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [optimisticSlugs, applyOptimistic] = useOptimistic(
    poolSlugs,
    (current: Set<string>, { slug, active }: { slug: string; active: boolean }) => {
      const next = new Set(current);
      if (active) next.add(slug);
      else next.delete(slug);
      return next;
    }
  );
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!orgId) {
      setLoading(false);
      return;
    }
    getOrgSkillTags(orgId)
      .then((tags) => setPoolSlugs(new Set(tags.map((t) => t.tagSlug))))
      .catch((err) => {
        setPoolSlugs(new Set());
        const message = err instanceof Error ? err.message : String(err);
        toast({ variant: 'destructive', title: '無法載入技能庫', description: message });
      })
      .finally(() => setLoading(false));
  }, [orgId]);

  const handleAdd = useCallback(
    (slug: string, name: string) => {
      if (!orgId) return;
      startTransition(async () => {
        applyOptimistic({ slug, active: true });
        const result = await addOrgSkillTagAction(orgId, slug, name, actorId);
        if (result.success) {
          setPoolSlugs((prev) => new Set([...prev, slug]));
          toast({ title: '已加入技能庫', description: `「${name}」已加入組織技能庫。` });
        } else {
          toast({ variant: 'destructive', title: '加入失敗', description: result.error.message });
        }
      });
    },
    [orgId, actorId, applyOptimistic, startTransition]
  );

  const handleRemove = useCallback(
    (slug: string, name: string) => {
      if (!orgId) return;
      startTransition(async () => {
        applyOptimistic({ slug, active: false });
        const result = await removeOrgSkillTagAction(orgId, slug);
        if (result.success) {
          setPoolSlugs((prev) => {
            const next = new Set(prev);
            next.delete(slug);
            return next;
          });
          toast({ title: '已從技能庫移除', description: `「${name}」已移出組織技能庫。` });
        } else {
          toast({ variant: 'destructive', title: '移除失敗', description: result.error.message });
        }
      });
    },
    [orgId, applyOptimistic, startTransition]
  );

  // Build a 2-level map: SkillGroup → SkillSubCategory → skills[]
  const grouped = useMemo(() => {
    const map = new Map<SkillGroup, Map<SkillSubCategory, (typeof SKILLS)[number][]>>();
    for (const skill of SKILLS) {
      let subMap = map.get(skill.group);
      if (!subMap) {
        subMap = new Map();
        map.set(skill.group, subMap);
      }
      const list = subMap.get(skill.subCategory) ?? [];
      list.push(skill);
      subMap.set(skill.subCategory, list);
    }
    return map;
  }, []);

  if (!orgId) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        技能庫管理僅在組織帳號下可用。
      </p>
    );
  }

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest">
          <BookOpen className="size-4" />
          組織技能庫
          <Badge variant="secondary" className="ml-auto text-[10px]">
            {optimisticSlugs.size} / {SKILLS.length} 已啟用
          </Badge>
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          從全域技能字典中選擇適用於本組織的技能。已啟用的技能將出現在排班提案的技能選項中，減輕每次瀏覽整份字典的負擔。
        </p>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full">
          {loading ? (
            <p className="py-8 text-center text-xs text-muted-foreground">載入中…</p>
          ) : (
            <div className="divide-y">
              {SKILL_GROUPS.map(({ group, zhLabel, enLabel, subCategories }) => {
                const subMap = grouped.get(group);
                if (!subMap) return null;
                return (
                  <div key={group} className="p-4">
                    {/* 大項目 header */}
                    <h3 className="mb-3 text-xs font-bold text-foreground">
                      {zhLabel}
                      <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">
                        {enLabel}
                      </span>
                    </h3>

                    <div className="space-y-4">
                      {subCategories.map((subCat) => {
                        const skills = subMap.get(subCat);
                        if (!skills?.length) return null;
                        const subMeta = SKILL_SUB_CATEGORY_BY_KEY.get(subCat);
                        return (
                          <div key={subCat}>
                            {/* 子項目 header */}
                            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                              {subMeta?.zhLabel ?? subCat}
                            </p>
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                              {skills.map((skill) => {
                                const active = optimisticSlugs.has(skill.slug);
                                return (
                                  <div
                                    key={skill.slug}
                                    className={`flex items-center gap-2 rounded-lg border p-2.5 transition-colors ${
                                      active
                                        ? 'border-primary/30 bg-primary/5'
                                        : 'border-border bg-background'
                                    }`}
                                  >
                                    <div className="min-w-0 flex-1">
                                      <p className="truncate text-xs font-medium">{skill.name}</p>
                                      {skill.description && (
                                        <p className="line-clamp-1 text-[10px] text-muted-foreground">
                                          {skill.description}
                                        </p>
                                      )}
                                    </div>
                                    <Button
                                      size="icon"
                                      variant={active ? 'destructive' : 'outline'}
                                      className="size-7 shrink-0"
                                      onClick={() =>
                                        active
                                          ? handleRemove(skill.slug, skill.name)
                                          : handleAdd(skill.slug, skill.name)
                                      }
                                      title={active ? '從技能庫移除' : '加入技能庫'}
                                    >
                                      {active ? (
                                        <Trash2 className="size-3" />
                                      ) : (
                                        <Plus className="size-3" />
                                      )}
                                    </Button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
