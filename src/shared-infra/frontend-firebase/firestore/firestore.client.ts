/**
 * Module: firestore.client.ts
 * Purpose: Provide frontend Firestore singleton
 * Responsibilities: expose Firestore instance for frontend read/write adapters
 * Constraints: deterministic logic, respect module boundaries
 */

import { getFirestore, type Firestore } from 'firebase/firestore';

import { app } from '../app.client';

const db: Firestore = getFirestore(app);

export { db };
