/**
 * Module: storage.client.ts
 * Purpose: Provide frontend Firebase Storage singleton
 * Responsibilities: expose FirebaseStorage instance for frontend uploads/downloads
 * Constraints: deterministic logic, respect module boundaries
 */

import { getStorage, type FirebaseStorage } from 'firebase/storage';

import { app } from '../app.client';

const storage: FirebaseStorage = getStorage(app);

export { storage };
