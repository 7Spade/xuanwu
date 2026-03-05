# AI Agent Reading Guide — xuanwu Architecture

> **AI agents (GitHub Copilot, Codex, etc.): Start here.**
> This file is the entry point for understanding the system architecture.

## Recommended Reading Order

Read these documents in sequence for maximum context efficiency:

| Step | File | Purpose |
|------|------|---------|
| 1 | `docs/AI_AGENT_README.md` | ← **You are here.** Overview of reading order. |
| 2 | `docs/architecture/INDEX.md` | Domain slice directory — locate any domain quickly. |
| 3 | `docs/architecture/GRAPH_SKETCH.md` | Simplified cross-domain relationship diagram. |
| 4 | `docs/architecture/slices/*.md` | Per-domain detail: responsibilities, entities, dependencies, events. |
| 5 | `docs/knowledge-graph.json` | Machine-readable semantic memory graph (MCP memory server). |
| 6 | `docs/ai/repomix-output.context.md` | Full repository context snapshot for AI tools. |

## Document Purposes

### `docs/architecture/INDEX.md`
Lists every architecture slice with its file path and a one-line summary.
Use this to find which slice owns a specific domain concept.

### `docs/architecture/GRAPH_SKETCH.md`
A high-level Mermaid diagram showing only domain names and their relationships.
Use this for fast cross-domain navigation without reading per-domain detail.

### `docs/architecture/slices/*.md`
One file per domain slice (VS0–VS8 plus infrastructure).
Each file covers: responsibility, main entities, incoming/outgoing dependencies, and events.

### `docs/knowledge-graph.json`
The semantic memory graph consumed by the MCP memory server.
**Do not modify.** Machine-readable only.

### `docs/ai/repomix-output.context.md`
Full codebase context packed for AI tools.
Use when you need to reason about the actual source code structure.

## Architecture at a Glance

The system is layered as follows:

```
L0  External Triggers  (Next.js client · Firebase Auth · Webhooks)
L1  Shared Kernel       (contracts · ports · invariants)
L2  Command Gateway     (write entry point · rate-limit · auth)
L3  Domain Slices       VS1 Identity · VS2 Account · VS3 Skill
                        VS4 Organization · VS5 Workspace
                        VS6 Scheduling · VS7 Notification
                        VS8 SemanticGraph (The Brain)
L4  IER                 (Internal Event Router · outbox · relay)
L5  Projection Bus      (read-model projectors)
L6  Query Gateway       (read entry point)
L7  Firebase ACL        (only allowed Firebase SDK call point [D24])
L8  Firebase Infra      (Firestore · Auth · Storage · Messaging)
L9  Observability       (metrics · tracing)
```

Cross-cutting authorities:
- **global-search.slice** — the only cross-domain search authority [#A12]
- **notification-hub** — the only side-effect outlet [#A13]

## Key Rules for AI Code Generation

- Feature slices **must not** import `firebase/*` directly → use `SK_PORTS` adapters [D24]
- Cross-slice references **must** go through `{slice}/index.ts` public API only [D7]
- All domain events **must** carry an idempotency key (`eventId+aggId+version`) [S1]
- Business slices **must not** build their own search logic → use global-search [D26 #A12]
- Business slices **must not** call `sendEmail`/`push`/`SMS` → use notification-hub [D26 #A13]
- Cost classification **must** call VS8 `classifyCostItem()`, never re-implement [D27 #A14]
