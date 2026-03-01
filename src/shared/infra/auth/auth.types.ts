/**
 * auth.types.ts — Firebase Auth Internal Types
 *
 * [D24] These types must NOT be exported outside src/shared/infra/auth/.
 *       Use IAuthService / AuthUser from '@/shared/ports' in feature slices.
 */

import type { User as FirebaseUser, UserCredential } from 'firebase/auth';
import type { AuthUser } from '@/shared/ports/i-auth.service';

/** Re-alias Firebase SDK types for internal use only. */
export type { FirebaseUser, UserCredential };

/** Maps a Firebase User to the AuthUser Port type. */
export function mapFirebaseUser(user: FirebaseUser): AuthUser {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
  };
}
