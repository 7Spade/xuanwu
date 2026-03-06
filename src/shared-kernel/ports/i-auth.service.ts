/**
 * Module: i-auth.service.ts
 * Purpose: define SK_PORTS auth interface in shared-kernel
 * Responsibilities: provide authentication abstractions for feature slices
 * Constraints: deterministic logic, respect module boundaries
 */

export interface AuthUser {
  readonly uid: string;
  readonly email: string | null;
  readonly displayName: string | null;
  readonly photoURL: string | null;
}

export interface IAuthService {
  signInWithEmailAndPassword(email: string, password: string): Promise<AuthUser>;
  createUserWithEmailAndPassword(email: string, password: string): Promise<AuthUser>;
  sendPasswordResetEmail(email: string): Promise<void>;
  signInAnonymously(): Promise<AuthUser>;
  updateProfile(user: AuthUser, profile: { displayName?: string; photoURL?: string }): Promise<void>;
  signOut(): Promise<void>;
  onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void;
  getCurrentUser(): AuthUser | null;
}
