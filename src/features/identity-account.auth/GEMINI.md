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

## Architecture Note [R2][S6]

Per `logic-overview.md` R2 / [SK_TOKEN_REFRESH_CONTRACT S6] — Claims refresh three-way handshake:

```
Trigger:  RoleChanged | PolicyChanged → IER CRITICAL_LANE → CLAIMS_HANDLER
Signal:   token-refresh-signal (emitted after Claims are set)
Client:   receives signal → force re-fetch Firebase Token → next request carries new Claims
Failure:  ClaimsRefresh fails → DLQ SECURITY_BLOCK → DOMAIN_ERRORS security alert
```

The complete three-party handshake specification (VS1 ↔ IER ↔ frontend) is defined in
`shared.kernel.token-refresh-contract [S6]`. VS1 only owns the "emit signal" step;
the full protocol lives in VS0.

CRITICAL_LANE semantics: high-priority eventual consistency (NOT synchronous — Firebase
Functions are inherently async). [S6] is the single source of truth for any future
changes to this refresh flow.
