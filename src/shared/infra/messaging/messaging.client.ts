/**
 * Module: messaging.client.ts
 * Purpose: Backward-compatible export for frontend Messaging client
 * Responsibilities: re-export messaging from shared-infra/frontend-firebase
 * Constraints: deterministic logic, respect module boundaries
 */

export { messaging } from '@/shared-infra/frontend-firebase';
