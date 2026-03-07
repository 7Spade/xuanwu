/**
 * Module: app.client.ts
 * Purpose: Initialize and export frontend Firebase App singleton
 * Responsibilities: provide one FirebaseApp instance for frontend adapters
 * Constraints: deterministic logic, respect module boundaries
 */

import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';

import { firebaseConfig } from './config/firebase.config';

const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export { app };
