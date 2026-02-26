# Feature Slice: `account-user.wallet`

## Domain

User wallet — personal balance, transaction history, and payment operations for an individual user account.

## Responsibilities

- Display user wallet balance (`Account.wallet.balance`)
- Wallet top-up / transfer operations (future)
- Transaction history (`accounts/{userId}/walletTransactions` sub-collection, future)

## Event Lane [Q8][R2][R5][S1][S3]

Per `logic-overview_v10.md` [SK_OUTBOX_CONTRACT S1][SK_READ_CONSISTENCY S3]:
- `WalletDeducted` / `WalletCredited` → `ACC_OUTBOX` → **CRITICAL_LANE** [Q8][R2]
  - CRITICAL_LANE = 高優先最終一致（非同步，Firebase 架構限制）
  - Not "synchronous" — high-priority delivery with final consistency guarantee
- DLQ classification declared in [SK_OUTBOX_CONTRACT S1]:
  - `WalletDeducted` → **REVIEW_REQUIRED** — auto-replay risks double-deduction
  - `WalletCredited` → **REVIEW_REQUIRED** — symmetric safety requirement
- `STRONG_READ` for precise transactions [SK_READ_CONSISTENCY S3]:
  - Decision rule: financial operation → `STRONG_READ` → read back to `WALLET_AGG` aggregate
  - Display/statistics → `EVENTUAL_READ` → wallet-balance Projection
  - Never rely solely on Projection for irreversible financial operations [Q8]

## Internal Files

| File / Dir | Purpose |
|-----------|---------|
| `_actions.ts` | Wallet mutations (topUp, transfer) |
| `_queries.ts` | Real-time balance subscription |
| `_components/` | `WalletCard`, `TransactionList` |
| `_hooks/` | `useWallet` |
| `index.ts` | Public API |

## Public API (`index.ts`)

```ts
// future exports
```

## Dependencies

- `@/shared/types` — `Account`, `Wallet`
- `@/shared/infra/firestore/` — Firestore reads/writes
