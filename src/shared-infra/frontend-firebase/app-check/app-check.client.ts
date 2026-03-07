/**
 * Module: app-check.client.ts
 * Purpose: Initialize and expose Firebase App Check for frontend runtime
 * Responsibilities: bootstrap App Check with ReCaptcha provider when configured
 * Constraints: deterministic logic, respect module boundaries
 */

import {
  ReCaptchaV3Provider,
  initializeAppCheck,
  type AppCheck,
} from 'firebase/app-check';

import { app } from '../app.client';

let appCheck: AppCheck | null = null;
let initialized = false;

export function initAppCheck(): AppCheck | null {
  if (initialized) {
    return appCheck;
  }
  initialized = true;

  if (typeof window === 'undefined') {
    return null;
  }

  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY;
  if (!siteKey) {
    return null;
  }

  appCheck = initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(siteKey),
    isTokenAutoRefreshEnabled: true,
  });

  return appCheck;
}

export { appCheck };
