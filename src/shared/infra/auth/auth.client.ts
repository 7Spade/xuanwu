/**
 * Module: auth.client.ts
 * Purpose: Backward-compatible export for frontend Firebase Auth
 * Responsibilities: re-export auth from shared-infra/frontend-firebase
 * Constraints: deterministic logic, respect module boundaries
 */

export { auth } from '@/shared-infra/frontend-firebase';
