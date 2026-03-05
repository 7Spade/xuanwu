/**
 * Module: use-finance-lifecycle.ts
 * Purpose: Encapsulate finance lifecycle state machine, gate validation, and claim drafting.
 * Responsibilities: orchestrate A15/A16 lifecycle flow and claim-cycle transitions.
 * Constraints: deterministic logic, respect module boundaries
 */

import { useCallback, useEffect, useMemo, useState } from 'react';

import { classifyCostItem } from '@/features/semantic-graph.slice';
import { listWorkflowStates } from '@/features/workspace.slice/business.workflow';
import type { DocumentParserItemsExtractedPayload } from '@/features/workspace.slice/core.event-bus/_events';
import type { WorkspaceEventBus } from '@/features/workspace.slice/core.event-bus';

import { fetchFinanceStrongReadSnapshot } from '../_services/finance-strong-read';
import type {
  FinanceClaimDraftEntry,
  FinanceClaimLineItem,
  FinanceDirectiveItem,
  FinanceLifecycleStage,
  FinanceStrongReadSnapshot,
} from '../_types';

const EMPTY_SNAPSHOT: FinanceStrongReadSnapshot = {
  readConsistencyMode: 'STRONG_READ',
  source: 'aggregate',
  totalClaimableAmount: 0,
  receivedAmount: 0,
  outstandingClaimableAmount: 0,
};

function buildDirectiveItem(
  payload: DocumentParserItemsExtractedPayload,
  item: DocumentParserItemsExtractedPayload['items'][number],
): FinanceDirectiveItem {
  const classification = classifyCostItem(item.name, { includeSemanticTagSlug: true });
  return {
    id: `${payload.intentId}:${item.sourceIntentIndex}`,
    name: item.name,
    sourceDocument: payload.sourceDocument,
    intentId: payload.intentId,
    semanticTagSlug: classification.semanticTagSlug,
    costItemType: classification.costItemType,
    unitPrice: item.unitPrice,
    totalQuantity: item.quantity,
    remainingQuantity: item.quantity,
  };
}

function hasValidClaimSelection(
  directiveItems: readonly FinanceDirectiveItem[],
  claimDraft: Readonly<Record<string, FinanceClaimDraftEntry>>,
): boolean {
  return directiveItems.some((item) => {
    const draft = claimDraft[item.id];
    if (!draft?.selected) return false;
    return draft.quantity > 0 && draft.quantity <= item.remainingQuantity;
  });
}

function buildClaimLineItems(
  directiveItems: readonly FinanceDirectiveItem[],
  claimDraft: Readonly<Record<string, FinanceClaimDraftEntry>>,
): FinanceClaimLineItem[] {
  return directiveItems.flatMap((item) => {
    const draft = claimDraft[item.id];
    if (!draft?.selected) return [];
    if (draft.quantity <= 0 || draft.quantity > item.remainingQuantity) return [];

    return [{
      itemId: item.id,
      name: item.name,
      quantity: draft.quantity,
      unitPrice: item.unitPrice,
      lineAmount: item.unitPrice * draft.quantity,
    } satisfies FinanceClaimLineItem];
  });
}

function getNextStageFromAction(currentStage: FinanceLifecycleStage): FinanceLifecycleStage {
  if (currentStage === 'claim-submitted') return 'claim-approved';
  if (currentStage === 'claim-approved') return 'invoice-requested';
  if (currentStage === 'invoice-requested') return 'payment-term';
  if (currentStage === 'payment-term') return 'payment-received';
  return currentStage;
}

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
    let cancelled = false;

    async function refreshStrongReadSnapshot() {
      const snapshot = await fetchFinanceStrongReadSnapshot({
        directiveItems,
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
  }, [directiveItems, receivedAmount]);

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
  }, [currentClaimLineItems]);

  const closeCycle = useCallback(() => {
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
  }, [financeSnapshot.outstandingClaimableAmount]);

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
