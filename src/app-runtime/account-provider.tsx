"use client";

/**
 * Module: account-provider.tsx
 * Purpose: compatibility re-export surface for account provider symbols
 * Responsibilities: expose account provider/context from shared app-providers
 * Constraints: deterministic logic, respect module boundaries
 */

export { AccountProvider } from '@/app-runtime/providers/account-provider'
export { AccountContext } from '@/app-runtime/contexts/account-context'
export type { AccountAction, AccountContextValue, AccountState } from '@/app-runtime/contexts/account-context'
