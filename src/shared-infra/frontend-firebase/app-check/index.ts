/**
 * Module: index.ts
 * Purpose: App Check export surface for frontend-firebase boundary
 * Responsibilities: expose client singleton and adapter helpers
 * Constraints: deterministic logic, respect module boundaries
 */

export { appCheck, initAppCheck } from './app-check.client';
export {
  ensureAppCheckInitialized,
  getAppCheckToken,
} from './app-check.adapter';
