/**
 * Module: firestore.client.ts
 * Purpose: Backward-compatible export for frontend Firestore client
 * Responsibilities: re-export db from shared-infra/frontend-firebase
 * Constraints: deterministic logic, respect module boundaries
 */

export { db } from '@/shared-infra/frontend-firebase';
