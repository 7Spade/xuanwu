# VS2 · Account Slice

## Domain Responsibility

The Account slice manages **user profiles, wallet, and account-level governance**.
It is the canonical record of who a user is within the platform after the Firebase identity
is resolved by VS1. It also drives VS8's learning engine via real skill-fact events.

## Main Entities

| Entity | Description |
|--------|-------------|
| `account` aggregate | Core account record; owns `accountId`, profile metadata, wallet balance. |
| `user-profile` | Display name, avatar, preferences. |
| `user-wallet` | Financial account; balance changes require `STRONG_READ` [S3]. |
| `gov.policy` | Account-level governance policy. |
| `gov.role` | Role assignments on the account. |

## Incoming Dependencies

| Source | What is consumed |
|--------|-----------------|
| VS1 Identity | `accountId` from `account-identity-link` |
| IER | `OrgContextProvisioned`, `OrgPolicyChanged` events |
| Shared Kernel [VS0] | `authority-snapshot`, `command-result-contract`, `SK_READ_CONSISTENCY` |

## Outgoing Dependencies

| Target | What is produced |
|--------|-----------------|
| VS8 Semantic Graph | Real skill-fact events that drive the learning engine [D21-G] |
| IER | `AccountCreated`, `ProfileUpdated`, wallet events |
| Projection Bus [L5] | `account-view` read model |

## Events Emitted

| Event | DLQ Level | Description |
|-------|-----------|-------------|
| `AccountCreated` | SAFE_AUTO | New account registered. |
| `ProfileUpdated` | SAFE_AUTO | User profile fields changed. |
| `WalletCredited` / `WalletDebited` | REVIEW_REQUIRED | Financial; requires human review on failure. |
| `RoleAssigned` / `RoleRevoked` | REVIEW_REQUIRED | Role change; triggers claims refresh via VS1. |
| `PolicyChanged` | REVIEW_REQUIRED | Account policy update; triggers claims refresh via VS1. |

## Key Invariants

- **[S3]** Wallet balance reads must use `STRONG_READ` (financial data).
- **[A8]** One command touches the `account` aggregate only.
- **[D21-G]** Only real fact events from VS2 (and VS3) may drive VS8 `learning-engine.ts`; no manual updates.
- **[D24]** No direct `firebase/*` imports; uses `SK_PORTS`.
