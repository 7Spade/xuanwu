'use client';

/**
 * scheduling.slice — _components/org-schedule-governance.tsx
 *
 * Org HR governance panel for reviewing and acting on schedule items.
 *
 * Single source of truth: accounts/{orgId}/schedule_items.
 * Reads the same collection as the Calendar tab — all three schedule tabs
 * (Calendar, DemandBoard, HR Governance) are always consistent.
 *
 * Status mapping:
 *   PROPOSAL   → 待核准 (pending assignment / amber)
 *   OFFICIAL   → 已確認 (assigned, can be marked complete / green)
 *   COMPLETED  → hidden (completed)
 *   REJECTED   → hidden (cancelled/rejected)
 *
 * FR-S6: Confirmed proposals section — HR marks confirmed assignments as completed.
 * FR-W2: Skill match indicators — show per-member skill match against item requirements.
 */

import { useEffect, useMemo, useState } from 'react';

import { getOrgEligibleMembersWithTier } from '@/features/projection.bus';
import type { OrgEligibleMemberView } from '@/features/projection.bus';
import type { ScheduleItem } from '@/features/shared-kernel';
import { useAccount } from '@/features/workspace.slice';
import { useApp } from '@/shared/app-providers/app-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/shadcn-ui/card';
import { ScrollArea } from '@/shared/shadcn-ui/scroll-area';

import { ConfirmedRow, ProposalRow } from './org-schedule-governance.rows';

// ---------------------------------------------------------------------------
// Main governance panel
// ---------------------------------------------------------------------------

/**
 * Org HR governance panel.
 *
 * Reads accounts/{orgId}/schedule_items via useAccount() — same collection as
 * Calendar and DemandBoard — so all three tabs are always in sync.
 *
 * Shows:
 *   PROPOSAL items  → assign or cancel (待核准)
 *   OFFICIAL items  → mark complete (已確認, FR-S6)
 *   REJECTED/COMPLETED → hidden
 */
export function OrgScheduleGovernance() {
  const { state: appState } = useApp();
  const { activeAccount, accounts } = appState;
  const { state: accountState } = useAccount();

  const orgId = activeAccount?.accountType === 'organization' ? activeAccount.id : null;

  const allItems = useMemo(
    () => Object.values(accountState.schedule_items),
    [accountState.schedule_items]
  );

  const pending = useMemo(
    () => allItems.filter((i) => i.status === 'PROPOSAL'),
    [allItems]
  );
  const confirmed = useMemo(
    () => allItems.filter((i) => i.status === 'OFFICIAL'),
    [allItems]
  );

  const orgMembers = useMemo(() => {
    if (!orgId) return [];
    const org = accounts[orgId];
    return (org?.members ?? []).map((m: { id: string; name: string }) => ({ id: m.id, name: m.name }));
  }, [orgId, accounts]);

  const [eligibleMembers, setEligibleMembers] = useState<OrgEligibleMemberView[]>([]);
  useEffect(() => {
    if (!orgId) return;
    getOrgEligibleMembersWithTier(orgId)
      .then(setEligibleMembers)
      .catch(() => setEligibleMembers([]));
  }, [orgId]);

  if (!orgId) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        組織層級的 HR 排程僅在組織帳號下可用。
      </p>
    );
  }

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="border-b">
        <CardTitle className="text-sm font-bold uppercase tracking-widest">
          HR 排程治理 — 待核准（{pending.length}）已確認（{confirmed.length}）
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full">
          <div className="space-y-3 p-4">
            {pending.length === 0 && confirmed.length === 0 && (
              <p className="py-8 text-center text-xs italic text-muted-foreground">
                目前無待核准或確認中的提案。
              </p>
            )}
            {pending.map((item: ScheduleItem) => (
              <ProposalRow
                key={item.id}
                item={item}
                orgMembers={orgMembers}
                eligibleMembers={eligibleMembers}
                orgId={orgId}
              />
            ))}

            {/* FR-S6 — Confirmed section */}
            {confirmed.length > 0 && (
              <div className="border-t pt-3">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  已確認排程 — 可標記完成
                </p>
                {confirmed.map((item: ScheduleItem) => (
                  <ConfirmedRow
                    key={item.id}
                    item={item}
                    orgId={orgId}
                    orgMembers={orgMembers}
                  />
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
