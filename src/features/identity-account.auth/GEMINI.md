# Feature Slice: `identity-account.auth`

## Domain

Authentication — login, register, reset password.

## Responsibilities

- Firebase Auth sign-in / register / sign-out / password reset
- Login and register form UI
- Auth page background and tab layout

## Internal Files

| File / Dir | Purpose |
|-----------|---------|
| `_actions.ts` | `signIn`, `registerUser`, `signOut`, `sendPasswordResetEmail` |
| `_types.ts` | `LoginFormValues`, `RegisterFormValues` |
| `_components/` | `LoginView`, `LoginForm`, `RegisterForm`, `ResetPasswordDialog`, `ResetPasswordForm`, `AuthTabsRoot`, `AuthBackground` |
| `index.ts` | Exports: `LoginView`, `ResetPasswordForm` |

## Public API (`index.ts`)

```ts
export { LoginView } from "./_components/login-view";
export { ResetPasswordForm } from "./_components/reset-password-form";
```

## Allowed Imports

```ts
import ... from "@/shared/types";          // domain types
import ... from "@/shared/infra";          // Firebase Auth adapter
import ... from "@/shared/ui/...";         // shadcn-ui, constants
```

## Who Uses This Slice?

- `app/(auth-routes)/login/page.tsx`
- `app/(auth-routes)/reset-password/page.tsx`
- `app/(auth-routes)/@modal/(.)reset-password/page.tsx`

## Architecture Note [R2]

Per `logic-overview_v9.md` R2 — Token Refresh Handshake:
After `RoleChanged` claims are set by `claims-refresh-handler`, a `token-refresh-signal`
is emitted to notify the frontend to re-fetch the token. The next request carries the
updated Claims. CRITICAL_LANE semantics: high-priority eventual consistency (NOT
synchronous — Firebase Functions are inherently async).
