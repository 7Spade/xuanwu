/**
 * Module: finance-lifecycle-tracker.tsx
 * Purpose: Render the A16 multi-claim lifecycle tracker with payment-term timer.
 * Responsibilities: display lifecycle phase progression and financial completion gate.
 * Constraints: deterministic logic, respect module boundaries
 */

'use client';

import { useEffect, useMemo, useState } from 'react';

import { Badge } from '@/shared/shadcn-ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/shadcn-ui/card';

import { FINANCE_LIFECYCLE_STAGES } from '../_constants';
import type { FinanceLifecycleStage } from '../_types';

const STAGE_LABEL: Record<FinanceLifecycleStage, string> = {
  'claim-preparation': 'Claim Preparation',
  'claim-submitted': 'Claim Submitted',
  'claim-approved': 'Claim Approved',
  'invoice-requested': 'Invoice Requested',
  'payment-term': 'Payment Term',
  'payment-received': 'Payment Received',
  completed: 'Completed',
};

interface FinanceLifecycleTrackerProps {
  readonly stage: FinanceLifecycleStage;
  readonly cycleIndex: number;
  readonly outstandingClaimableAmount: number;
  readonly paymentTermStartAt: Date | null;
}

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
  const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

export function FinanceLifecycleTracker(props: FinanceLifecycleTrackerProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!props.paymentTermStartAt) {
      setElapsedSeconds(0);
      return;
    }

    const timer = globalThis.setInterval(() => {
      const elapsedMs = Date.now() - props.paymentTermStartAt!.getTime();
      setElapsedSeconds(Math.max(Math.floor(elapsedMs / 1000), 0));
    }, 1000);

    return () => {
      globalThis.clearInterval(timer);
    };
  }, [props.paymentTermStartAt]);

  const currentStageIndex = useMemo(
    () => FINANCE_LIFECYCLE_STAGES.indexOf(props.stage),
    [props.stage],
  );

  return (
    <Card className="border-primary/20 bg-card/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Finance Lifecycle · Cycle {props.cycleIndex}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
          {FINANCE_LIFECYCLE_STAGES.map((phase, index) => {
            const isDone = index < currentStageIndex;
            const isCurrent = index === currentStageIndex;
            return (
              <div key={phase} className="rounded-xl border border-border/60 bg-background/40 p-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{index + 1}</p>
                <p className="text-xs font-semibold">{STAGE_LABEL[phase]}</p>
                <Badge variant="outline" className="mt-2 text-[9px]">
                  {isCurrent ? 'IN PROGRESS' : isDone ? 'DONE' : 'PENDING'}
                </Badge>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-[11px]">
          <Badge variant="secondary">Outstanding: ${props.outstandingClaimableAmount.toLocaleString()}</Badge>
          <Badge variant="outline">Payment Term Timer: {formatDuration(elapsedSeconds)}</Badge>
          <Badge variant={props.outstandingClaimableAmount === 0 ? 'default' : 'outline'}>
            {props.outstandingClaimableAmount === 0 ? 'Completion Unlocked' : 'Completion Locked'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
