/**
 * Module: index.ts
 * Purpose: Public export surface for frontend Firebase boundary
 * Responsibilities: expose frontend firebase clients and config
 * Constraints: deterministic logic, respect module boundaries
 */

export { firebaseConfig } from './config/firebase.config';
export { app } from './app.client';
export { auth } from './auth/auth.client';
export { authService } from './auth/auth.adapter';
export { db } from './firestore/firestore.client';
export { firestoreRepo } from './firestore/firestore.adapter';
export { storage } from './storage/storage.client';
export { fileStore } from './storage/storage.adapter';
export { messaging } from './messaging/messaging.client';
export { messagingAdapter } from './messaging/messaging.adapter';
export { analytics } from './analytics/analytics.client';
export { appCheck, initAppCheck } from './app-check/app-check.client';
export {
	ensureAppCheckInitialized,
	getAppCheckToken,
} from './app-check/app-check.adapter';
export {
	trackAnalyticsEvent,
	bindAnalyticsUser,
	logAnalyticsEvent,
} from './analytics/analytics.adapter';
export { rtdb } from './realtime-database/realtime-database.client';
export {
	subscribeAccountNotifications,
	createAccountNotification,
	setAccountNotificationRead,
} from './realtime-database/notification-rtdb.adapter';
