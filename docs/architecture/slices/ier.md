# IER · Internal Event Router

## Domain Responsibility

The Internal Event Router (IER) is the **only fan-out point between domain slices**.
It implements the outbox pattern, ensuring that events are delivered at-least-once and
routed to the correct downstream consumers. It also classifies failed events into DLQ levels.

## Lanes

| Lane | Priority | Use Cases |
|------|----------|-----------|
| `CRITICAL_LANE` | Highest | Token refresh, security events (`RoleChanged`, `PolicyChanged`) |
| `STANDARD_LANE` | Normal | All normal domain events |
| `DLQ` | Failure only | Failed events; classified as `SAFE_AUTO`, `REVIEW_REQUIRED`, or `SECURITY_BLOCK` |

## Outbox Contract [S1]

Every outbox entry must carry:
- `idempotency-key` = `eventId + aggId + version`
- `DLQ_CLASSIFICATION` ∈ `{ SAFE_AUTO, REVIEW_REQUIRED, SECURITY_BLOCK }`

Retry policy:
- `SAFE_AUTO` → automatic retry + auto-resolve
- `REVIEW_REQUIRED` → retry + human review queue
- `SECURITY_BLOCK` → immediate halt + alert

## Incoming Dependencies

All domain slices (VS1–VS8) emit events into IER via the outbox.

## Outgoing Dependencies

| Target | What is produced |
|--------|-----------------|
| VS1 Identity | `RoleChanged`, `PolicyChanged` via `CRITICAL_LANE` |
| Projection Bus [L5] | All domain events for read-model updates |
| notification-hub | Side-effect triggers |

## Key Invariants

- **[S1]** Idempotency key is mandatory on every outbox entry.
- **[E6]** Claims-refresh events must travel on `CRITICAL_LANE`.
- No domain slice may call another slice's write path directly; IER is the only conduit.
