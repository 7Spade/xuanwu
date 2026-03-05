/**
 * Module: finance-aggregate-query-gateway.ts
 * Purpose: Register and execute finance STRONG_READ aggregate query via Query Gateway.
 * Responsibilities: provide gateway route for finance-sensitive aggregate snapshot reads.
 * Constraints: deterministic logic, respect module boundaries
 */

import { executeQuery, registerQuery } from '@/features/infra.gateway-query';
import { getWorkspaceTasks } from '@/features/workspace.slice/business.tasks';

import type { FinanceStrongReadSnapshot } from '../_types';

export const FINANCE_STRONG_READ_QUERY_ROUTE = 'workspace-finance-strong-read';

interface FinanceStrongReadQueryParams {
  readonly workspaceId: string;
  readonly receivedAmount: number;
}

let isFinanceStrongReadQueryRegistered = false;

function normalizeAmount(value: number | undefined): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 0;
  }
  return value;
}

export function registerFinanceStrongReadQueryHandler(): void {
  if (isFinanceStrongReadQueryRegistered) {
    return;
  }

  registerQuery(
    FINANCE_STRONG_READ_QUERY_ROUTE,
    async ({ workspaceId, receivedAmount }: FinanceStrongReadQueryParams): Promise<FinanceStrongReadSnapshot> => {
      const tasks = await getWorkspaceTasks(workspaceId);
      const totalClaimableAmount = tasks.reduce((sum, task) => sum + normalizeAmount(task.subtotal), 0);
      const normalizedReceivedAmount = normalizeAmount(receivedAmount);

      return {
        readConsistencyMode: 'STRONG_READ',
        source: 'aggregate',
        totalClaimableAmount,
        receivedAmount: normalizedReceivedAmount,
        outstandingClaimableAmount: Math.max(totalClaimableAmount - normalizedReceivedAmount, 0),
      };
    },
    '[S3][#A16] workspace finance aggregate snapshot via Query Gateway',
  );

  isFinanceStrongReadQueryRegistered = true;
}

export async function executeFinanceStrongReadQuery(
  params: FinanceStrongReadQueryParams,
): Promise<FinanceStrongReadSnapshot> {
  registerFinanceStrongReadQueryHandler();
  return executeQuery<FinanceStrongReadQueryParams, FinanceStrongReadSnapshot>(
    FINANCE_STRONG_READ_QUERY_ROUTE,
    params,
  );
}
