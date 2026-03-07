/**
 * Module: messaging.client.ts
 * Purpose: Provide frontend Firebase Messaging singleton where supported
 * Responsibilities: initialize Messaging only in browser runtime
 * Constraints: deterministic logic, respect module boundaries
 */

import { getMessaging, type Messaging } from 'firebase/messaging';

import { app } from '../app.client';

let messaging: Messaging | null = null;

if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
  try {
    messaging = getMessaging(app);
  } catch {
    messaging = null;
  }
}

export { messaging };
