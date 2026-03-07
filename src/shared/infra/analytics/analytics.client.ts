/**
 * Module: analytics.client.ts
 * Purpose: Backward-compatible export for frontend Analytics client
 * Responsibilities: re-export analytics from shared-infra/frontend-firebase
 * Constraints: deterministic logic, respect module boundaries
 */

export { analytics } from '@/shared-infra/frontend-firebase';
