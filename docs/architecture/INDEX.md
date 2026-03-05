# Architecture Slice Index

> Quick-reference directory for all domain slices.
> AI agents: use this to locate the file for any given domain without reading the full logic overview.

## Domain Slices (VS0–VS8)

| ID | Domain | File | One-line Summary |
|----|--------|------|-----------------|
| VS0 | Shared Kernel | [`slices/shared-kernel.md`](./slices/shared-kernel.md) | Global contracts, ports, and invariants shared by all slices. |
| VS1 | Identity | [`slices/identity.md`](./slices/identity.md) | Firebase Auth, authenticated-identity, claims refresh. |
| VS2 | Account | [`slices/account.md`](./slices/account.md) | User account profiles, wallet, governance policy/role. |
| VS3 | Skill | [`slices/skill.md`](./slices/skill.md) | Skill XP, tiers, tag lifecycle; drives VS8 learning engine. |
| VS4 | Organization | [`slices/organization.md`](./slices/organization.md) | Org core, members, partners, teams, policy governance. |
| VS5 | Workspace | [`slices/workspace.md`](./slices/workspace.md) | Projects, tasks, document parsing, billing, workflows. |
| VS6 | Scheduling | [`slices/scheduling.md`](./slices/scheduling.md) | Schedule aggregates, assignments, saga orchestration. |
| VS7 | Notification | [`slices/notification.md`](./slices/notification.md) | User notification delivery and queries. |
| VS8 | Semantic Graph | [`slices/semantic-graph.md`](./slices/semantic-graph.md) | The Brain — semantic tag authority, neural routing, knowledge graph. |

## Infrastructure Layers (non-VS)

| Layer | Name | File | One-line Summary |
|-------|------|------|-----------------|
| L4 | IER (Internal Event Router) | [`slices/ier.md`](./slices/ier.md) | Outbox → relay → domain event fan-out; DLQ classification. |
| L5 | Projection Bus | [`slices/projection-bus.md`](./slices/projection-bus.md) | Read-model projectors; account-view, org-view, workspace-view, etc. |

## Cross-cutting Authorities

| Name | File | Role |
|------|------|------|
| global-search.slice | [`slices/global-search.md`](./slices/global-search.md) | Only cross-domain search authority [#A12] |
| notification-hub | [`slices/notification-hub.md`](./slices/notification-hub.md) | Only side-effect outlet — push/email/SMS [#A13] |

## Governance Rules Quick Reference

| Rule | Meaning |
|------|---------|
| D7 | Cross-slice import must go through `{slice}/index.ts` only |
| D24 | Feature slices must not import `firebase/*` directly |
| D26 | No private search or notification logic in business slices |
| D27 | Cost semantic classification belongs exclusively to VS8 |
| S1 | All events carry idempotency key (`eventId+aggId+version`) |
| S2 | All projections call `applyVersionGuard()` before writing |
| A8 | One command touches one aggregate |

See [`../logic-overview.md`](../logic-overview.md) for the full invariant and rule definitions.
