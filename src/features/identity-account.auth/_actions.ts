/**
 * @fileoverview auth.commands.ts - Pure business logic for authentication operations.
 * @description Contains framework-agnostic action functions for Firebase Auth operations.
 * These functions can be called from React components, hooks, or future Server Actions
 * without any React dependencies.
 */

import { authAdapter } from "@/shared/infra/auth/auth.adapter"
import { createUserAccount } from '@/features/account-user.profile'
import {
  type CommandResult,
  commandFailureFrom,
} from '@/features/shared.kernel.contract-interfaces'

/**
 * Signs in an existing user with email and password.
 */
export async function signIn(email: string, password: string): Promise<void> {
  await authAdapter.signInWithEmailAndPassword(email, password)
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
 */
export async function signInAnonymously(): Promise<void> {
  await authAdapter.signInAnonymously()
}

/**
 * Sends a password reset email.
 */
export async function sendPasswordResetEmail(email: string): Promise<void> {
  await authAdapter.sendPasswordResetEmail(email)
}

/**
 * Signs out the current user.
 */
export async function signOut(): Promise<void> {
  await authAdapter.signOut()
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
