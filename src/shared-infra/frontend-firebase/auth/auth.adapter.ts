/**
 * Module: auth.adapter.ts
 * Purpose: Implement IAuthService using Firebase Web Auth SDK
 * Responsibilities: map Firebase auth operations to SK_PORTS auth contract
 * Constraints: deterministic logic, respect module boundaries
 */

import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';

import type { AuthUser, IAuthService } from '@/shared-kernel/ports';

import { auth } from './auth.client';

function toAuthUser(user: FirebaseUser): AuthUser {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
  };
}

class FirebaseAuthService implements IAuthService {
  async signInWithEmailAndPassword(email: string, password: string): Promise<AuthUser> {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return toAuthUser(credential.user);
  }

  async createUserWithEmailAndPassword(email: string, password: string): Promise<AuthUser> {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    return toAuthUser(credential.user);
  }

  async sendPasswordResetEmail(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
  }

  async signInAnonymously(): Promise<AuthUser> {
    const credential = await signInAnonymously(auth);
    return toAuthUser(credential.user);
  }

  async updateProfile(user: AuthUser, profile: { displayName?: string; photoURL?: string }): Promise<void> {
    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.uid !== user.uid) {
      throw new Error('AUTH_USER_MISMATCH');
    }
    await updateProfile(currentUser, profile);
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
    const currentUser = auth.currentUser;
    return currentUser ? toAuthUser(currentUser) : null;
  }
}

export const authService: IAuthService = new FirebaseAuthService();
