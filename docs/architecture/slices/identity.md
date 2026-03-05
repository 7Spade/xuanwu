# VS1 · Identity Slice

## Domain Responsibility

The Identity slice manages **authentication and active session context**.
It is the bridge between Firebase Auth external identity and the internal `accountId`-based domain model.
It owns the claims refresh lifecycle and is the sole producer of `AuthoritySnapshot`.

## Main Entities

| Entity | Description |
|--------|-------------|
| `authenticated-identity` | The currently signed-in Firebase user. |
| `account-identity-link` | Maps `firebaseUserId ↔ accountId`. |
| `active-account-context` | In-memory session context; TTL = token validity. Built by `context-lifecycle-manager`. |
| `custom-claims` | Fast-path authorisation snapshot [#5]; TTL = token validity. |

## Context Lifecycle

| Event | Effect on Context |
|-------|------------------|
| Login | Create `active-account-context` |
| `OrgSwitched` / `WorkspaceSwitched` | Refresh context |
| `TokenExpired` / Logout | Invalidate context |

## Claims Management [S6]

- `claims-refresh-handler` is the **only** trigger point for token refresh [E6].
- Trigger conditions: `RoleChanged` or `PolicyChanged` arrive via IER `CRITICAL_LANE`.
- On success → emit `TOKEN_REFRESH_SIGNAL`.
- On failure → DLQ `SECURITY_BLOCK` + alert.

## Incoming Dependencies

| Source | What is consumed |
|--------|-----------------|
| Firebase Auth (L0) | Login / register / token events |
| IER `CRITICAL_LANE` | `RoleChanged`, `PolicyChanged` events to trigger claims refresh |
| Shared Kernel [VS0] | `SK_TOKEN_REFRESH_CONTRACT` [S6], `authority-snapshot` shape |

## Outgoing Dependencies

| Target | What is produced |
|--------|-----------------|
| VS2 Account | Provides `accountId` lookup via `account-identity-link` |
| Command Gateway [L2] | Feeds `AuthoritySnapshot` into `authority-interceptor` |
| All domain slices | `active-account-context` consumed by client-side context hooks |

## Events Emitted

| Event | Lane | Description |
|-------|------|-------------|
| `OrgContextProvisioned` | NORMAL | Fired when org context is established after login |
| `TOKEN_REFRESH_SIGNAL` | CRITICAL | Claims refresh completed; client must re-fetch token |

## Key Invariants

- **[S6]** `claims-refresh-handler` is the unique claims refresh trigger.
- **[R8]** `traceId` passes through unchanged from `CBG_ENTRY`.
- **[E6]** Claims refresh initiated only via IER `CRITICAL_LANE`.
