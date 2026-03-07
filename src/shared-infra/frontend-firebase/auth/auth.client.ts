/**
 * Module: auth.client.ts
 * Purpose: Provide frontend Firebase Auth singleton
 * Responsibilities: expose Auth instance for frontend use cases
 * Constraints: deterministic logic, respect module boundaries
 */

import { getAuth, type Auth } from 'firebase/auth';

import { app } from '../app.client';

const auth: Auth = getAuth(app);

export { auth };
