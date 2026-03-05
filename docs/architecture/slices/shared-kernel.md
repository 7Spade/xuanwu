# VS0 · Shared Kernel

## Domain Responsibility

The Shared Kernel (VS0) is the **single source of truth for all cross-slice contracts**.
It defines data shapes, infrastructure behaviour contracts, and dependency-inversion ports
that every other vertical slice depends on. No business logic lives here — only contracts.

## Main Entities / Contracts

| Contract | Key Fields | Purpose |
|----------|-----------|---------|
| `event-envelope` | `version · traceId · causationId · correlationId · timestamp · idempotency-key` | Wraps every domain event. `traceId` is injected once at CBG_ENTRY and is read-only for the whole chain [R8]. |
| `authority-snapshot` | `claims / roles / scopes / TTL` | Carries authentication state; TTL = token validity period. |
| `skill-tier` | `getTier(xp) → Tier` | Pure function; never persisted to DB [#12]. |
| `skill-requirement` | `tagSlug × minXp` | Cross-slice human resource contract. |
| `command-result-contract` | `Success { aggregateId, version } \| Failure { DomainError }` | Basis for frontend optimistic updates. |
| `SK_OUTBOX_CONTRACT` [S1] | at-least-once · idempotency-key · DLQ classification | Every outbox entry must declare a DLQ level: `SAFE_AUTO`, `REVIEW_REQUIRED`, or `SECURITY_BLOCK`. |
| `SK_VERSION_GUARD` [S2] | `event.aggregateVersion > view.lastProcessedVersion` | Applied by every projection before writing; stale events are discarded. |
| `SK_READ_CONSISTENCY` [S3] | `STRONG_READ` vs `EVENTUAL_READ` | Balances / auth / scheduling conflicts → `STRONG_READ`. |
| `SK_STALENESS_CONTRACT` [S4] | `TAG_MAX_STALENESS ≤ 30s`, `PROJ_STALE_CRITICAL ≤ 500ms`, `PROJ_STALE_STANDARD ≤ 10s` | All nodes must reference these constants; hard-coding values is forbidden. |
| `SK_RESILIENCE_CONTRACT` [S5] | rate-limit · circuit-break · bulkhead | Applied to `_actions.ts`, webhooks, and edge functions. |
| `SK_TOKEN_REFRESH_CONTRACT` [S6] | Triggered by `RoleChanged \| PolicyChanged` → `CLAIMS_HANDLER` → `TOKEN_REFRESH_SIGNAL` | Failure → DLQ `SECURITY_BLOCK` + alert. |

## Infrastructure Ports (`SK_PORTS`) [D24]

| Port | Purpose |
|------|---------|
| `IAuthService` | Authentication adapter (only `src/shared/infra/auth/auth.adapter.ts` may call `firebase/auth`) |
| `IFirestoreRepo` | Firestore access port [S2] |
| `IMessaging` | Push messaging port [R8] |
| `IFileStore` | File storage port |

## Incoming Dependencies

None — the Shared Kernel has no upstream domain dependencies.

## Outgoing Dependencies

All other slices (VS1–VS8) import from this module.
Infrastructure adapters implement the ports defined here.

## Key Invariants

- **[R8]** `traceId` is injected exactly once at `CBG_ENTRY`; every node downstream reads it, never overwrites it.
- **[S1]** Idempotency key format: `eventId + aggId + version`.
- **[D24]** No feature slice may import `firebase/*` directly; all Firebase access goes through `SK_PORTS`.
- **[D7]** Cross-slice imports must go through `{slice}/index.ts` public barrel.
