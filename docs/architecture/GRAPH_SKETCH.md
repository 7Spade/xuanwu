# Cross-Domain Graph Sketch

> Simplified relationship diagram for fast cross-domain navigation.
> This diagram shows **only domain names and relationships** — no implementation detail.
> For per-domain detail see `slices/*.md`.

```mermaid
graph TD
    EXT["External Triggers\n(Client · Auth · Webhook)"]
    SK["Shared Kernel\nVS0 — contracts & ports"]
    CMD["Command Gateway\nL2 — write entry point"]
    IER["IER\nL4 — event router & outbox"]
    PROJ["Projection Bus\nL5 — read models"]
    QGWY["Query Gateway\nL6 — read entry point"]
    FBACL["Firebase ACL\nL7 — only SDK call point"]

    VS1["VS1 · Identity\nAuth / Claims"]
    VS2["VS2 · Account\nProfile / Wallet"]
    VS3["VS3 · Skill\nXP / Tiers"]
    VS4["VS4 · Organization\nOrg / Members / Teams"]
    VS5["VS5 · Workspace\nTasks / Docs / Billing"]
    VS6["VS6 · Scheduling\nSchedules / Assignments"]
    VS7["VS7 · Notification\nDelivery / Queries"]
    VS8["VS8 · Semantic Graph\nThe Brain"]

    GSEARCH["global-search.slice\ncross-domain search authority"]
    NHUB["notification-hub\nside-effect outlet"]

    EXT --> CMD
    EXT --> VS1
    CMD --> SK
    SK --> VS1
    SK --> VS2
    SK --> VS3
    SK --> VS4
    SK --> VS5
    SK --> VS6
    SK --> VS7
    SK --> VS8

    VS1 -->|"OrgContextProvisioned"| IER
    VS2 -->|"AccountCreated"| IER
    VS3 -->|"SkillXpChanged"| IER
    VS4 -->|"OrgPolicyChanged"| IER
    VS5 -->|"WorkspaceEvents"| IER
    VS6 -->|"ScheduleAssigned"| IER
    VS7 -->|"NotificationEvents"| IER

    IER --> PROJ
    PROJ --> QGWY
    QGWY --> FBACL
    FBACL --> QGWY

    VS8 -->|"TagLifecycleEvent"| IER
    VS8 -.->|"semantic routing"| VS6
    VS8 -.->|"cost classification"| VS5
    VS3 -.->|"drives learning"| VS8
    VS2 -.->|"drives learning"| VS8

    VS5 -->|"search requests"| GSEARCH
    VS4 -->|"search requests"| GSEARCH
    VS6 -->|"dispatch via tags"| NHUB
    VS7 --> NHUB
    GSEARCH -.->|"indexes via"| VS8
    NHUB -.->|"routing via"| VS8
```

## Relationship Legend

| Arrow | Meaning |
|-------|---------|
| `-->` | Hard dependency / event emission |
| `-.->` | Soft dependency / semantic influence |

## Key Constraints Visible in This Diagram

- **VS8 is the single semantic authority** — all routing and search ultimately go through it.
- **IER is the only fan-out point** — no slice talks directly to another slice's write path.
- **FBACL is the only Firebase SDK boundary** — all slices reach storage via ports, not directly.
- **global-search and notification-hub** are the only two cross-cutting authorities; all slices must delegate to them.
