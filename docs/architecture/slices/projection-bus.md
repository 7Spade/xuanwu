# Projection Bus · Read-Model Projectors

## Domain Responsibility

The Projection Bus (L5) maintains all **read-model projections** from domain events.
Each projector listens to IER events and updates a denormalised Firestore read model.
All projectors call `applyVersionGuard()` [S2] before writing to prevent stale writes.

## Projectors

| Projector | Source Events | Output Collection |
|-----------|--------------|------------------|
| `account-view` | `AccountCreated`, `ProfileUpdated` | `account-views/` |
| `account-audit` | All account mutations | `account-audit-log/` |
| `organization-view` | `OrgContextProvisioned`, `OrgPolicyChanged`, `MemberJoined/Left` | `organization-views/` |
| `org-eligible-member-view` | Member + skill events | `org-eligible-member-views/` |
| `workspace-view` | All workspace events | `workspace-views/` |
| `workspace-scope-guard` | `OrgPolicyChanged`, `MemberLeft` | `workspace-scope-guards/` |
| `tag-snapshot` | `TagLifecycleEvent` | `tag-snapshots/` |
| `schedule-view` | `ScheduleCreated`, `ScheduleItemAssigned` | `schedule-views/` |
| `user-notification-view` | `NotificationDispatched` | `user-notification-views/` |

## Version Guard [S2]

Before every write:
```
if (event.aggregateVersion <= view.lastProcessedVersion) { discard; return; }
```

This ensures projections are idempotent and replay-safe.

## Circular Dependency Warning

`projection.bus` barrel re-exports `_funnel` which imports `scheduling.slice`.
Therefore:
- **VS6 must not import `projection.bus` barrel**.
- VS6 may import individual projector files directly.

## Incoming Dependencies

IER (all domain event lanes).

## Outgoing Dependencies

Firestore collections via `SK_PORTS` [D24].

## Key Invariants

- **[S2]** Every projection must call `applyVersionGuard()` before writing.
- **[D24]** No direct `firebase/*` imports; uses `IFirestoreRepo` port.
- **[D7]** External consumers query projections through `{slice}/index.ts`.
