"use client";

import { useMemo } from "react";

import { useAccount } from "@/features/workspace.slice/core";
import type { DailyLog } from "../_types";


export function useAggregatedLogs() {
  const { state: accountState } = useAccount();
  const { dailyLogs } = accountState;

  const logs = useMemo(() =>
    Object.values(dailyLogs as Record<string, DailyLog>)
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)),
    [dailyLogs]
  );

  return { logs };
}
