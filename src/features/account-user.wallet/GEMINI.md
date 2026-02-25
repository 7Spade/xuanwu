# Feature Slice: `account-user.wallet`

## Domain

User wallet — personal balance, transaction history, and payment operations for an individual user account.

## Responsibilities

- Display user wallet balance (`Account.wallet.balance`)
- Wallet top-up / transfer operations (future)
- Transaction history (`accounts/{userId}/walletTransactions` sub-collection, future)

## Event Lane [Q8][R2][R5]

Per `logic-overview_v9.md`:
- `WalletDeducted` / `WalletCredited` → `ACC_OUTBOX` → **CRITICAL_LANE** [Q8][R2]
  - CRITICAL_LANE = 高優先最終一致（非同步，Firebase 架構限制）
  - Not "synchronous" — high-priority delivery with final consistency guarantee
- DLQ classification for `WalletDeducted` → **REVIEW_REQUIRED** [R5]
  - Reason: Auto-replay risks double-deduction; human review required before retry
- `STRONG_READ` for precise transactions: read back to `WALLET_AGG` aggregate directly (never rely solely on projection for financial operations) [Q8]

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
