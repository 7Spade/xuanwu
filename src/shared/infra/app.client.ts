/**
 * Module: app.client.ts
 * Purpose: Backward-compatible export for frontend Firebase App
 * Responsibilities: re-export app from shared-infra/frontend-firebase
 * Constraints: deterministic logic, respect module boundaries
 */

export { app } from '@/shared-infra/frontend-firebase';
