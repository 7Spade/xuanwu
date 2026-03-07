
/**
 * Module: finance-view.tsx
 * Purpose: Compose Finance page from isolated lifecycle, table, and gate components.
 * Responsibilities: wire user actions to A15/A16 lifecycle hook and render status UI.
 * Constraints: deterministic logic, respect module boundaries
 */

'use client';

import { AlertCircle, CheckCircle2, FileSearch, Send } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { getTagSnapshotPresentationMap, type TagSnapshotPresentation } from '@/features/semantic-graph.slice';
import { Badge } from '@/shadcn-ui/badge';
import { Button } from '@/shadcn-ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shadcn-ui/card';
import { toast } from '@/shadcn-ui/hooks/use-toast';

import { useWorkspace } from '@/features/workspace.slice/core';
import { useFinanceLifecycle } from '../_hooks/use-finance-lifecycle';

import { FinanceItemTable } from './finance-item-table';
import { FinanceLifecycleTracker } from './finance-lifecycle-tracker';

export function WorkspaceFinance() {
  const { workspace, eventBus } = useWorkspace();
  const lifecycle = useFinanceLifecycle({ workspaceId: workspace.id, eventBus });

  const [tagPresentationMap, setTagPresentationMap] = useState<Record<string, TagSnapshotPresentation>>({});

  useEffect(() => {
    let cancelled = false;

    async function hydrateTagPresentationMap() {
      const map = await getTagSnapshotPresentationMap(
        lifecycle.directiveItems.map((item) => item.semanticTagSlug),
      );
      if (!cancelled) {
        setTagPresentationMap(map);
      }
    }

    void hydrateTagPresentationMap();

    return () => {
      cancelled = true;
    };
  }, [lifecycle.directiveItems]);

  const canSubmitClaim = lifecycle.stage === 'claim-preparation';
  const canAdvance = ['claim-submitted', 'claim-approved', 'invoice-requested'].includes(lifecycle.stage);
  const canCompletePayment = lifecycle.stage === 'payment-term';
  const canCloseCycle = lifecycle.stage === 'payment-received';

  const stageActionLabel = useMemo(() => {
    if (lifecycle.stage === 'claim-submitted') return '標記 Claim Approved';
    if (lifecycle.stage === 'claim-approved') return '標記 Invoice Requested';
    if (lifecycle.stage === 'invoice-requested') return '進入 Payment Term';
    return '下一階段';
  }, [lifecycle.stage]);

  const handleSubmitClaim = () => {
    const result = lifecycle.submitClaim();
    if (!result.ok) {
      toast({ variant: 'destructive', title: 'Claim Gate Rejected', description: result.message });
      return;
    }
    toast({ title: 'Claim Submitted', description: 'Claim 已送出，進入 Claim Submitted。' });
  };

  const handleAdvance = () => {
    lifecycle.advanceLifecycle();
    toast({ title: 'Lifecycle Updated', description: stageActionLabel });
  };

  const handlePaymentReceived = () => {
    try {
      lifecycle.completePayment();
      toast({ title: 'Payment Received', description: '已完成收款確認。' });
    } catch (error: unknown) {
      const firstLineItem = lifecycle.currentClaimLineItems[0];
      const reason = error instanceof Error ? error.message : 'Unknown disbursement failure';

      eventBus.publish('workspace:finance:disburseFailed', {
        taskId: firstLineItem?.itemId ?? 'finance-cycle',
        taskTitle: firstLineItem?.name ?? 'Finance Claim Cycle',
        amount: lifecycle.currentClaimAmount,
        reason,
      });

      toast({
        variant: 'destructive',
        title: 'Payment Confirmation Failed',
        description: reason,
      });
    }
  };

  const handleCloseCycle = () => {
    const hasOutstanding = lifecycle.financeSnapshot.outstandingClaimableAmount > 0;
    lifecycle.closeCycle();

    if (!hasOutstanding) {
      eventBus.publish('workspace:finance:completed', {
        cycleIndex: lifecycle.cycleIndex,
      });
    }

    toast({
      title: hasOutstanding ? 'Re-enter Claim Cycle' : 'Finance Completed',
      description: hasOutstanding
        ? '[#A16] outstandingClaimableAmount > 0，回到 Claim Preparation。'
        : 'outstandingClaimableAmount = 0，允許 Completed。',
    });
  };

  return (
    <div className="space-y-6 duration-500 animate-in fade-in">
      <FinanceLifecycleTracker
        stage={lifecycle.stage}
        cycleIndex={lifecycle.cycleIndex}
        outstandingClaimableAmount={lifecycle.financeSnapshot.outstandingClaimableAmount}
        paymentTermStartAt={lifecycle.paymentTermStartAt}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Read Consistency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline">{lifecycle.financeSnapshot.readConsistencyMode}</Badge>
            <p className="mt-2 text-[10px] text-muted-foreground">[S3] 餘額與支付狀態走 Aggregate 回源</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Acceptance Gate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={lifecycle.acceptanceReady ? 'default' : 'destructive'}>
              {lifecycle.acceptanceReady ? 'Acceptance=OK' : 'Blocked [#A15]'}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Current Claim
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">${lifecycle.currentClaimAmount.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">Claim line items: {lifecycle.currentClaimLineItems.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          <FileSearch className="size-4" /> Claim Preparation
        </h3>
        <FinanceItemTable
          items={lifecycle.directiveItems}
          claimDraft={lifecycle.claimDraft}
          isEditable={canSubmitClaim}
          tagPresentationMap={tagPresentationMap}
          onToggleItem={lifecycle.toggleClaimSelection}
          onChangeQuantity={lifecycle.updateClaimQuantity}
        />
        {lifecycle.directiveItems.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed p-12 text-center opacity-40">
            <AlertCircle className="mx-auto mb-2 size-8" />
            <p className="text-xs font-bold uppercase tracking-widest">等待 parser line items</p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          className="gap-2"
          disabled={!canSubmitClaim || !lifecycle.claimPreparationReady}
          onClick={handleSubmitClaim}
        >
          送出請款 <Send className="size-3.5" />
        </Button>
        <Button variant="outline" size="sm" disabled={!canAdvance} onClick={handleAdvance}>
          {stageActionLabel}
        </Button>
        <Button variant="outline" size="sm" disabled={!canCompletePayment} onClick={handlePaymentReceived}>
          確認收款
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!canCloseCycle}
          onClick={handleCloseCycle}
        >
          {lifecycle.financeSnapshot.outstandingClaimableAmount === 0 ? '標記 Completed' : '進入下一輪 Claim'}
        </Button>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/40 p-4 text-[11px] text-muted-foreground">
        <p className="flex items-center gap-2 font-semibold text-foreground">
          <CheckCircle2 className="size-4" /> Finance Gate Rules
        </p>
        <p className="mt-1">[#A15] 需 Acceptance=OK 且 Claim Preparation 至少一個勾選項目、quantity &gt; 0。</p>
        <p className="mt-1">[#A16] 付款後若 outstandingClaimableAmount &gt; 0，必須重入 Claim Preparation。</p>
      </div>
    </div>
  );
}
