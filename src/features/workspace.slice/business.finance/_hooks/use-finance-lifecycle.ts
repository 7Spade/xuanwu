/**
 * Module: use-finance-lifecycle.ts
 * Purpose: Encapsulate finance lifecycle state machine, gate validation, and claim drafting.
 * Responsibilities: orchestrate A15/A16 lifecycle flow and claim-cycle transitions.
 * Constraints: deterministic logic, respect module boundaries
 */

import { useCallback, useEffect, useMemo, useState } from 'react';

import { listWorkflowStates } from '@/features/workspace.slice/business.workflow';
import type { WorkspaceEventBus } from '@/features/workspace.slice/core.event-bus';
import { getParsingIntents } from '@/shared/infra/firestore/firestore.facade';

import { saveFinanceAggregateState } from '../_actions';
import { getFinanceAggregateState } from '../_queries';
import { fetchFinanceStrongReadSnapshot } from '../_services/finance-strong-read';
import type {
  FinanceAggregateState,
  FinanceClaimDraftEntry,
  FinanceClaimLineItem,
  FinanceDirectiveItem,
  FinanceLifecycleStage,
  FinanceStrongReadSnapshot,
} from '../_types';

import {
  buildClaimLineItems,
  buildDirectiveItem,
  buildDirectiveItemFromParsingIntentLineItem,
  clampRemainingQuantity,
  getNextStageFromAction,
  hasValidClaimSelection,
  isActiveParsingIntentStatus,
  normalizeLifecycleStage,
} from './use-finance-lifecycle.helpers';

const EMPTY_SNAPSHOT: FinanceStrongReadSnapshot = {
  readConsistencyMode: 'STRONG_READ',
  source: 'aggregate',
  totalClaimableAmount: 0,
  receivedAmount: 0,
  outstandingClaimableAmount: 0,
};

interface UseFinanceLifecycleInput {
  readonly workspaceId: string;
  readonly eventBus: WorkspaceEventBus;
}

export function useFinanceLifecycle(input: UseFinanceLifecycleInput) {
  const [directiveItems, setDirectiveItems] = useState<FinanceDirectiveItem[]>([]);
  const [claimDraft, setClaimDraft] = useState<Record<string, FinanceClaimDraftEntry>>({});
  const [stage, setStage] = useState<FinanceLifecycleStage>('claim-preparation');
  const [cycleIndex, setCycleIndex] = useState(1);
  const [paymentTermStartAt, setPaymentTermStartAt] = useState<Date | null>(null);
  const [paymentReceivedAt, setPaymentReceivedAt] = useState<Date | null>(null);
  const [currentClaimLineItems, setCurrentClaimLineItems] = useState<FinanceClaimLineItem[]>([]);
  const [receivedAmount, setReceivedAmount] = useState(0);
  const [financeSnapshot, setFinanceSnapshot] = useState<FinanceStrongReadSnapshot>(EMPTY_SNAPSHOT);
  const [acceptanceReady, setAcceptanceReady] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function hydrateFinanceAggregate() {
      try {
        const [persistedState, parsingIntents] = await Promise.all([
          getFinanceAggregateState(input.workspaceId),
          getParsingIntents(input.workspaceId),
        ]);

        if (cancelled) return;

        const hydratedItems = parsingIntents
          .filter((intent) => isActiveParsingIntentStatus(intent.status))
          .flatMap((intent) =>
            intent.lineItems.flatMap((lineItem, index) => {
              const mapped = buildDirectiveItemFromParsingIntentLineItem(intent, lineItem, index);
              return mapped ? [mapped] : [];
            }),
          );

        const persistedRemainingById = new Map(
          (persistedState?.directiveItems ?? []).map((item) => [item.id, item.remainingQuantity]),
        );

        const mergedDirectiveItems = hydratedItems.map((item) => ({
          ...item,
          remainingQuantity: clampRemainingQuantity(item, persistedRemainingById.get(item.id)),
        }));

        setDirectiveItems(mergedDirectiveItems);

        if (persistedState) {
          setStage(normalizeLifecycleStage(persistedState.stage));
          setCycleIndex(persistedState.cycleIndex);
          setReceivedAmount(persistedState.receivedAmount);
          setCurrentClaimLineItems(persistedState.currentClaimLineItems);
          setPaymentTermStartAt(
            persistedState.paymentTermStartAtISO ? new Date(persistedState.paymentTermStartAtISO) : null,
          );
          setPaymentReceivedAt(
            persistedState.paymentReceivedAtISO ? new Date(persistedState.paymentReceivedAtISO) : null,
          );
        }
      } finally {
        if (!cancelled) {
          setIsHydrated(true);
        }
      }
    }

    void hydrateFinanceAggregate();

    return () => {
      cancelled = true;
    };
  }, [input.workspaceId]);

  useEffect(() => {
    const unsubscribeParser = input.eventBus.subscribe('workspace:document-parser:itemsExtracted', (payload) => {
      const appendedItems = payload.items
        .filter((item) => item.quantity > 0 && item.unitPrice >= 0)
        .map((item) => buildDirectiveItem(payload, item));

      if (appendedItems.length === 0) return;

      setDirectiveItems((previous) => {
        const existingIds = new Set(previous.map((item) => item.id));
        const deduped = appendedItems.filter((item) => !existingIds.has(item.id));
        return deduped.length === 0 ? previous : [...previous, ...deduped];
      });
    });

    return () => {
      unsubscribeParser();
    };
  }, [input.eventBus]);

  useEffect(() => {
    let cancelled = false;

    async function hydrateAcceptanceGate() {
      try {
        const workflowStates = await listWorkflowStates(input.workspaceId);
        if (cancelled) return;
        const isGateOpen = workflowStates.some(
          (workflow) => workflow.stage === 'finance' || workflow.stage === 'completed',
        );
        setAcceptanceReady(isGateOpen);
      } catch {
        if (!cancelled) {
          setAcceptanceReady(false);
        }
      }
    }

    void hydrateAcceptanceGate();

    return () => {
      cancelled = true;
    };
  }, [input.workspaceId]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const aggregateState: FinanceAggregateState = {
      workspaceId: input.workspaceId,
      stage,
      cycleIndex,
      receivedAmount,
      directiveItems,
      currentClaimLineItems,
      paymentTermStartAtISO: paymentTermStartAt ? paymentTermStartAt.toISOString() : null,
      paymentReceivedAtISO: paymentReceivedAt ? paymentReceivedAt.toISOString() : null,
      updatedAt: Date.now(),
    };

    void saveFinanceAggregateState(aggregateState).catch((error: unknown) => {
      console.error('[finance-aggregate] failed to persist state:', error);
    });
  }, [
    currentClaimLineItems,
    cycleIndex,
    directiveItems,
    input.workspaceId,
    isHydrated,
    paymentReceivedAt,
    paymentTermStartAt,
    receivedAmount,
    stage,
  ]);

  useEffect(() => {
    let cancelled = false;

    async function refreshStrongReadSnapshot() {
      const snapshot = await fetchFinanceStrongReadSnapshot({
        workspaceId: input.workspaceId,
        receivedAmount,
      });
      if (!cancelled) {
        setFinanceSnapshot(snapshot);
      }
    }

    void refreshStrongReadSnapshot();

    return () => {
      cancelled = true;
    };
  }, [directiveItems, input.workspaceId, receivedAmount]);

  const currentClaimAmount = useMemo(
    () => currentClaimLineItems.reduce((sum, line) => sum + line.lineAmount, 0),
    [currentClaimLineItems],
  );

  const claimPreparationReady = useMemo(
    () => hasValidClaimSelection(directiveItems, claimDraft),
    [directiveItems, claimDraft],
  );

  const toggleClaimSelection = useCallback((itemId: string, selected: boolean) => {
    setClaimDraft((previous) => {
      const entry = previous[itemId] ?? { selected: false, quantity: 0 };
      return {
        ...previous,
        [itemId]: {
          ...entry,
          selected,
        },
      };
    });
  }, []);

  const updateClaimQuantity = useCallback((itemId: string, quantity: number) => {
    setClaimDraft((previous) => {
      const entry = previous[itemId] ?? { selected: false, quantity: 0 };
      return {
        ...previous,
        [itemId]: {
          ...entry,
          quantity,
        },
      };
    });
  }, []);

  const submitClaim = useCallback(() => {
    if (!acceptanceReady) {
      return {
        ok: false as const,
        message: '[#A15] Acceptance=OK 前不可送出請款。',
      };
    }

    const lineItems = buildClaimLineItems(directiveItems, claimDraft);
    if (lineItems.length === 0) {
      return {
        ok: false as const,
        message: '[#A15] Claim Preparation 需至少一個勾選項目且 quantity > 0。',
      };
    }

    setCurrentClaimLineItems(lineItems);
    setStage('claim-submitted');

    return { ok: true as const };
  }, [acceptanceReady, claimDraft, directiveItems]);

  const advanceLifecycle = useCallback(() => {
    setStage((previousStage) => {
      const nextStage = getNextStageFromAction(previousStage);
      if (nextStage === 'invoice-requested') {
        setPaymentTermStartAt(new Date());
      }
      return nextStage;
    });
  }, []);

  const completePayment = useCallback(() => {
    if (stage !== 'payment-term') {
      throw new Error('[#A16] 禁止跳過生命週期步驟直接確認收款。');
    }

    if (currentClaimLineItems.length === 0) {
      throw new Error('[#A16] 需先完成 Claim/Invoice/PaymentTerm 並具備有效請款項目。');
    }

    const paidAmount = currentClaimLineItems.reduce((sum, line) => sum + line.lineAmount, 0);

    setDirectiveItems((previous) => {
      const quantityByItemId = new Map(currentClaimLineItems.map((line) => [line.itemId, line.quantity]));

      return previous.map((item) => {
        const claimedQuantity = quantityByItemId.get(item.id) ?? 0;
        if (claimedQuantity <= 0) return item;

        return {
          ...item,
          remainingQuantity: Math.max(item.remainingQuantity - claimedQuantity, 0),
        };
      });
    });

    setReceivedAmount((previous) => previous + paidAmount);
    setPaymentReceivedAt(new Date());
    setStage('payment-received');
  }, [currentClaimLineItems, stage]);

  const closeCycle = useCallback(() => {
    if (stage !== 'payment-received') {
      throw new Error('[#A16] 需於 Payment Received 階段才能關閉本輪請款。');
    }

    const hasOutstanding = financeSnapshot.outstandingClaimableAmount > 0;

    if (hasOutstanding) {
      setCycleIndex((previous) => previous + 1);
      setStage('claim-preparation');
      setCurrentClaimLineItems([]);
      setClaimDraft({});
      setPaymentTermStartAt(null);
      setPaymentReceivedAt(null);
      return;
    }

    setStage('completed');
  }, [financeSnapshot.outstandingClaimableAmount, stage]);

  return {
    directiveItems,
    stage,
    cycleIndex,
    claimDraft,
    financeSnapshot,
    acceptanceReady,
    paymentTermStartAt,
    paymentReceivedAt,
    currentClaimLineItems,
    currentClaimAmount,
    claimPreparationReady,
    toggleClaimSelection,
    updateClaimQuantity,
    submitClaim,
    advanceLifecycle,
    completePayment,
    closeCycle,
  };
}
