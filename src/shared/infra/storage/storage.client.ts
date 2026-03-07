/**
 * Module: storage.client.ts
 * Purpose: Backward-compatible export for frontend Storage client
 * Responsibilities: re-export storage from shared-infra/frontend-firebase
 * Constraints: deterministic logic, respect module boundaries
 */

export { storage } from '@/shared-infra/frontend-firebase';
