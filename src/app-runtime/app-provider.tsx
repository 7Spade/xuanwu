"use client"

/**
 * Module: app-provider.tsx
 * Purpose: compatibility re-export surface for workspace core app provider symbols
 * Responsibilities: expose app provider/context/action hooks from shared providers
 * Constraints: deterministic logic, respect module boundaries
 */

// Re-exported from shared/app-providers/app-provider for backward compatibility.
// All new code should import directly from '@/shared/app-providers/app-provider'.
export { AppProvider, useApp } from '@/app-runtime/providers/app-provider'
export { AppContext } from '@/app-runtime/contexts/app-context'
export type { AppAction } from '@/app-runtime/contexts/app-context'
