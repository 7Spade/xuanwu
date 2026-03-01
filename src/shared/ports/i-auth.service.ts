/**
 * i-auth.service.ts — IAuthService Port Interface
 *
 * [D24] Feature slices depend on this interface, NOT on firebase/auth directly.
 * [D25] New auth features must implement this Port in auth.adapter.ts.
 *
 * VS1 identity.slice is the primary consumer.
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
