/**
 * Module: index.ts
 * Purpose: Firestore export surface for frontend-firebase boundary
 * Responsibilities: expose db, repo, read/write adapters, and facade exports
 * Constraints: deterministic logic, respect module boundaries
 */

export { db } from './firestore.client';
export { firestoreRepo } from './firestore.adapter';
export * from './firestore.read.adapter';
export * from './firestore.write.adapter';
export * from './firestore.facade';
