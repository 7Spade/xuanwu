# Knowledge Graph Guide

> **SSOT**: `docs/knowledge-graph.json` (v4 · 27 entities · 59 relations) — SSOT for semantic knowledge relations only.
> Architecture rules → `docs/logic-overview.md` · Domain vocabulary → `docs/domain-glossary.md`
> **Protocol**: `memory.read_graph()` is MANDATORY before code generation; `store_memory` + graph update MANDATORY after task completion.
> Two mandatory session workflows: **Start** (load graph) · **End** (persist facts).

---

## Workflow 1 — Session Start (MANDATORY)

### Step 1: Read graph
```javascript
memory.read_graph()
// If 0 entities → Cold-Start Recovery (Step 1b)
```

### Step 1b: Cold-Start Recovery
```javascript
// 1. Read docs/knowledge-graph.json
// 2. memory.create_entities(entities)
// 3. memory.create_relations(relations)
// 4. Verify: memory.read_graph() → expect 27 entities, 59 relations
```

### Step 2: Focus search (optional)
```javascript
memory.search_nodes({ query: "Architecture_Governance_Principles" })
memory.open_nodes({ names: ["Logic_Overview_SSOT", "Development_Rules"] })
```

### Step 3: Read SSOT
Read `docs/logic-overview.md` before modifying any code in the affected slice.

### Step 4: Plan
List all files to touch. Verify cross-slice imports use `index.ts` public API only (D2, D7).

---

## Workflow 2 — Session End (MANDATORY)

### Step 1: Persist memory
```javascript
store_memory({
  subject: "1-2 word topic",
  fact: "key fact (<200 chars)",
  reason: "why important for future tasks (2-3 sentences)",
  citations: "path/to/file:line",
  category: "general" | "file_specific" | "bootstrap_and_build" | "user_preferences"
})
```

### Step 2: Update graph
```javascript
// Add entity
memory.create_entities([{
  name: "EntityName",
  entityType: "Architecture_Decision",
  observations: ["constraint or decision text"]
}])

// Add relation
memory.create_relations([{
  from: "EntityA", to: "EntityB", relationType: "CONSTRAINS"
}])

// Extend entity
memory.add_observations([{
  entityName: "ExistingEntity",
  contents: ["new observation"]
}])

// Remove stale data
memory.delete_observations([{ entityName: "Entity", observations: ["stale text"] }])
memory.delete_entities(["ObsoleteEntity"])
```

### Step 3: Sync `docs/knowledge-graph.json`
Write graph changes back to `docs/knowledge-graph.json` for cross-session durability.

---

## Valid Entity and Relation Types

| entityType | Use for |
|------------|---------|
| `Framework_Feature` | Framework versions / features |
| `Project_Convention` | Workflow / process norms |
| `Component_Standard` | UI component usage standards |
| `Data_Schema` | Data models / contracts / schemas |
| `Architecture_Decision` | Governance / architecture choices |

| relationType | Meaning |
|--------------|---------|
| `FOLLOWS` | Adheres to a principle |
| `IMPLEMENTS` | Concrete realization of an abstraction |
| `CONSTRAINS` | Imposes a constraint on another entity |
| `DEPENDS_ON` | Requires another entity to operate |
| `REPLACES` | Supersedes an older spec |

---

## Invariants

- `docs/logic-overview.md` is the architecture SSOT — no agent may override it
- Cross-slice imports: `{slice}/index.ts` only; never `_{private}.ts` (D7)
- `memory.read_graph()` is MANDATORY before any code generation
- `store_memory` + graph update are MANDATORY after completing any task

---

## Related Files

| File | Role |
|------|------|
| `docs/knowledge-graph.json` | Persistent graph store (v4, 27 entities / 59 relations) |
| `docs/logic-overview.md` | Architecture SSOT (v11, rules D1–D23 + TE1–TE6) |
| `docs/domain-glossary.md` | Domain vocabulary |
| `.github/copilot-instructions.md` | Agent session protocol |
