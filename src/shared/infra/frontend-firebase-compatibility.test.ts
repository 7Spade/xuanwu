/**
 * Module: frontend-firebase-compatibility.test.ts
 * Purpose: verify legacy shared/infra exports remain functionally compatible
 * Responsibilities: assert legacy clients are aliases of frontend-firebase boundary exports
 * Constraints: deterministic logic, respect module boundaries
 */

import { describe, expect, it } from 'vitest';

import {
  analytics as analyticsFromNew,
  app as appFromNew,
  auth as authFromNew,
  db as dbFromNew,
  fileStore,
  firestoreRepo,
  messaging as messagingFromNew,
  messagingAdapter,
  storage as storageFromNew,
} from '@/shared-infra/frontend-firebase';

import { analytics as analyticsFromLegacy } from './analytics/analytics.client';
import { app as appFromLegacy } from './app.client';
import { auth as authFromLegacy } from './auth/auth.client';
import { db as dbFromLegacy } from './firestore/firestore.client';
import { storage as storageFromLegacy } from './storage/storage.client';
import { messaging as messagingFromLegacy } from './messaging/messaging.client';
import { firestoreRepo as firestoreRepoFromLegacyIndex } from './firestore';
import { fileStore as fileStoreFromLegacyIndex } from './storage';
import { messagingAdapter as messagingAdapterFromLegacyIndex } from './messaging';

describe('[Compatibility] shared/infra → shared-infra/frontend-firebase', () => {
  it('legacy clients are aliases of new frontend-firebase clients', () => {
    expect(appFromLegacy).toBe(appFromNew);
    expect(authFromLegacy).toBe(authFromNew);
    expect(dbFromLegacy).toBe(dbFromNew);
    expect(storageFromLegacy).toBe(storageFromNew);
    expect(messagingFromLegacy).toBe(messagingFromNew);
    expect(analyticsFromLegacy).toBe(analyticsFromNew);
  });

  it('legacy index exports expose the same SK_PORTS adapter instances', () => {
    expect(firestoreRepoFromLegacyIndex).toBe(firestoreRepo);
    expect(fileStoreFromLegacyIndex).toBe(fileStore);
    expect(messagingAdapterFromLegacyIndex).toBe(messagingAdapter);
  });
});
