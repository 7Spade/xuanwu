/**
 * @fileoverview auth.commands.ts - Pure business logic for authentication operations.
 * @description Contains framework-agnostic action functions for Firebase Auth operations.
 * These functions can be called from React components, hooks, or future Server Actions
 * without any React dependencies.
 */

import { authAdapter } from "@/shared/infra/auth/auth.adapter"
import { createUserAccount } from '@/features/account.slice'
import {
  type CommandResult,
  commandSuccess,
  commandFailureFrom,
} from '@/features/shared-kernel'

/**
 * Signs in an existing user with email and password.
 * Returns CommandResult [R4] — callers should check `result.success` instead of using try/catch.
 *
 * aggregateId: Firebase Auth UID of the authenticated user.
 * version: 0 — sign-in authenticates an existing session; no versioned aggregate is written.
 */
export async function signIn(email: string, password: string): Promise<CommandResult> {
  try {
    const { user } = await authAdapter.signInWithEmailAndPassword(email, password)
    return commandSuccess(user.uid, 0)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return commandFailureFrom('SIGN_IN_FAILED', message)
  }
}

/**
 * Registers a new user with email and password, sets their display name,
 * and returns the new Firebase user's uid.
 *
 * Internal helper — not exported from the slice's public API (index.ts).
 * Called only by completeRegistration.
 */
async function registerUser(
  email: string,
  password: string,
  displayName: string
): Promise<string> {
  const { user } = await authAdapter.createUserWithEmailAndPassword(
    email,
    password
  )
  await authAdapter.updateProfile(user, { displayName })
  return user.uid
}

/**
 * Signs in anonymously.
 * Returns CommandResult [R4] — callers should check `result.success` instead of using try/catch.
 *
 * aggregateId: Firebase Auth UID of the newly-created anonymous session.
 * version: 0 — anonymous sign-in creates a transient credential; no versioned aggregate is written.
 */
export async function signInAnonymously(): Promise<CommandResult> {
  try {
    const { user } = await authAdapter.signInAnonymously()
    return commandSuccess(user.uid, 0)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return commandFailureFrom('SIGN_IN_ANONYMOUS_FAILED', message)
  }
}

/**
 * Sends a password reset email.
 * Returns CommandResult [R4] — callers should check `result.success` instead of using try/catch.
 *
 * Note on aggregateId: Firebase Auth password-reset is unauthenticated — no user UID is
 * available at call time. The email address is used as the request identifier.
 * version: 0 because no versioned domain aggregate is written by this operation.
 */
export async function sendPasswordResetEmail(email: string): Promise<CommandResult> {
  try {
    await authAdapter.sendPasswordResetEmail(email)
    return commandSuccess(email, 0)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return commandFailureFrom('PASSWORD_RESET_FAILED', message)
  }
}

/**
 * Signs out the current user.
 * Returns CommandResult [R4] — callers should check `result.success` instead of using try/catch.
 *
 * Uses the current user's UID as aggregateId when available, falling back to 'anonymous'.
 * version: 0 because sign-out does not write a new aggregate version.
 */
export async function signOut(): Promise<CommandResult> {
  // Capture UID before the session is cleared by signOut()
  const currentUser = authAdapter.getCurrentUser()
  const aggregateId = currentUser?.uid ?? 'anonymous'
  try {
    await authAdapter.signOut()
    return commandSuccess(aggregateId, 0)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return commandFailureFrom('SIGN_OUT_FAILED', message)
  }
}

/**
 * Registration use case: creates a Firebase Auth account and the VS2 user profile aggregate.
 * Returns CommandResult [R4] — callers should check `result.success` instead of using try/catch.
 */
export async function completeRegistration(
  email: string,
  password: string,
  name: string
): Promise<CommandResult> {
  try {
    const uid = await registerUser(email, password, name)
    return await createUserAccount(uid, name, email)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return commandFailureFrom('REGISTRATION_FAILED', message)
  }
}
