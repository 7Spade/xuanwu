/**
 * Module: auth.adapter.ts
 * Purpose: Implement IAuthService via Firebase Auth SDK (FIREBASE_ACL boundary [D24][D25])
 * Responsibilities: sole firebase/auth call point; maps FirebaseUser → AuthUser
 * Constraints: deterministic logic, respect module boundaries
 */
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInAnonymously,
  updateProfile,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';

import type { IAuthService, AuthUser } from '@/shared-kernel/ports';

import { auth } from './auth.client';

// ---------------------------------------------------------------------------
// Internal helper — strips Firebase-specific fields from FirebaseUser
// ---------------------------------------------------------------------------

function toAuthUser(user: FirebaseUser): AuthUser {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
  };
}

// ---------------------------------------------------------------------------
// Adapter class — satisfies IAuthService contract [D25]
// ---------------------------------------------------------------------------

class FirebaseAuthAdapter implements IAuthService {
  async signInWithEmailAndPassword(email: string, password: string): Promise<AuthUser> {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    return toAuthUser(user);
  }

  async createUserWithEmailAndPassword(email: string, password: string): Promise<AuthUser> {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    return toAuthUser(user);
  }

  async sendPasswordResetEmail(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
  }

  async signInAnonymously(): Promise<AuthUser> {
    const { user } = await signInAnonymously(auth);
    return toAuthUser(user);
  }

  async updateProfile(user: AuthUser, profile: { displayName?: string; photoURL?: string }): Promise<void> {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser || firebaseUser.uid !== user.uid) {
      throw new Error('[auth.adapter] updateProfile: user mismatch or not signed in');
    }
    await updateProfile(firebaseUser, profile);
  }

  async signOut(): Promise<void> {
    await signOut(auth);
  }

  onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void {
    return onAuthStateChanged(auth, (firebaseUser) => {
      callback(firebaseUser ? toAuthUser(firebaseUser) : null);
    });
  }

  getCurrentUser(): AuthUser | null {
    const user = auth.currentUser;
    return user ? toAuthUser(user) : null;
  }
}

export const authAdapter: IAuthService = new FirebaseAuthAdapter();

/** @deprecated Use authAdapter directly. Kept for backwards compatibility. */
export const authService: IAuthService = authAdapter;
