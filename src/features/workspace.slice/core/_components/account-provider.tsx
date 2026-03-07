"use client";

/**
 * Module: account-provider.tsx
 * Purpose: compatibility re-export surface for account provider symbols
 * Responsibilities: expose account provider/context from shared app-providers
 * Constraints: deterministic logic, respect module boundaries
 */

export { AccountProvider } from '@/shared/app-providers/account-provider'
export { AccountContext } from '@/shared/app-providers/account-context'
export type { AccountAction, AccountContextValue, AccountState } from '@/shared/app-providers/account-context'
