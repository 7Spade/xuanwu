// Firebase repositories - all data access functions
export * from "./firestore/repositories";

// Firebase facades - high-level business operations
export { uploadDailyPhoto } from "./storage/storage.facade";

// Firebase clients - for use in providers and initialization
export { app as firebaseApp } from "./app.client";
export { auth } from "./auth/auth.client";
export { db } from "./firestore/firestore.client";
export { storage } from "./storage/storage.client";

// OUTBOX_RELAY_WORKER — shared infra for all outbox collections [R1]
export { startOutboxRelay } from "./outbox-relay-worker";
export type { OutboxDocument, OutboxStatus, IerDeliveryFn } from "./outbox-relay-worker";

// DLQ tier classification [R5]
export { getDlqLevel } from "./dlq";
export type { DlqLevel, DlqEntry } from "./dlq";

