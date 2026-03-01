/**
 * src/shared/infra/auth/index.ts
 *
 * [D24] Only exports the IAuthService Port interface.
 *       Firebase SDK types must NOT be re-exported from this boundary.
 */

export type { IAuthService, AuthUser } from '@/shared/ports/i-auth.service';
