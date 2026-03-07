/**
 * Module: analytics.client.ts
 * Purpose: Provide frontend Firebase Analytics singleton where supported
 * Responsibilities: initialize Analytics only in browser runtime
 * Constraints: deterministic logic, respect module boundaries
 */

import { getAnalytics, type Analytics } from 'firebase/analytics';

import { app } from '../app.client';

let analytics: Analytics | null = null;

if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { analytics };
