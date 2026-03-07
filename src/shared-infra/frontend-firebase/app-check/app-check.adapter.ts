/**
 * Module: app-check.adapter.ts
 * Purpose: Expose safe App Check helper APIs through frontend Firebase ACL
 * Responsibilities: initialize App Check and read token best-effort
 * Constraints: deterministic logic, respect module boundaries
 */

import { getToken } from 'firebase/app-check';

import { appCheck, initAppCheck } from './app-check.client';

export function ensureAppCheckInitialized(): void {
  initAppCheck();
}

export async function getAppCheckToken(): Promise<string | null> {
  const instance = appCheck ?? initAppCheck();
  if (!instance) {
    return null;
  }

  try {
    const token = await getToken(instance, false);
    return token.token;
  } catch {
    return null;
  }
}
