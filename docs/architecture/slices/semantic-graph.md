# VS8 · Semantic Graph Slice (The Brain)

## Domain Responsibility

VS8 is **the single semantic intelligence layer** for the entire platform.
It owns:
- Tag authority (the only legitimate source of tag entities).
- Cost item semantic classification.
- Neural network routing (Dijkstra-based skill-to-person matching).
- Causality tracing (downstream event impact analysis).
- Learning engine (weight updates driven by real facts from VS2/VS3).

No other slice may re-implement any of these capabilities [D26, D27].

## Architecture: 8-Layer Semantic Neural Network (D21-1 → D21-K)

The semantic brain is organized as 8 discrete processing layers.
Each layer has a single well-defined responsibility, and cross-layer
coupling is forbidden except via the public `index.ts` barrel [D7].

| Layer | ID | Name | Directory / File | Responsibility | Rule |
|-------|----|------|-----------------|---------------|------|
| L1 | VS8_DNA | DNA Layer | `centralized-tag/` | Tag entity definition + `Draft→Active→Stale→Deprecated` FSM | [D21-1, D21-2] |
| L2 | VS8_SL | Synapse Layer | `centralized-edges/` | `SemanticEdgeStore`: typed edges; weight ∈ (0,1]; cost = 1/weight | [D21-9] |
| L3 | VS8_NG | Neural Computation | `centralized-neural-net/` | Dijkstra / distance matrix; isolated-node detection | [D21-NG] |
| L4 | VS8_CL | Causality Layer | `centralized-causality/` | `CausalityTracer`: semantic activation; downstream impact chains | [D22] |
| L5 | VS8_RC | Route/Classify | `_cost-classifier.ts` | Pure keyword classifier → `CostItemType`; **no side effects** | [D27] |
| L6 | VS8_WF | Reflection Arc | `centralized-workflows/` | `PolicyMapper`: maps L3/L4 output to business dispatch strategies | [T5] |
| L7 | VS8_BBB | Blood-Brain Barrier | `centralized-guards/` | `SemanticGuard`: **supreme veto** over edge proposals; rejects semantic violations | [D21-H, D21-K] |
| L8 | VS8_GOV | Governance Layer | `index.ts` | Projects `TagSnapshot` as the **sole read exit**; external slices are barred from internal stores | [D7] |

Additional invariants:
- **D21-9** Synaptic weight invariant — weight ∈ (0.0, 1.0]; cost = 1/weight; zero-weight edges are physically impossible.
- **D21-10** Topology observability — graph structure changes emit `SemanticTopologyChanged`.
- **D21-H** Blood-Brain Barrier — `validateEdgeProposal()` must be called before every `addEdge()`.
- **D21-K** Semantic-conflict arbitration — self-loops, IS_A cycles, and invalid weights are rejected at the BBB layer.

## Tag Entity Types (TE)

| TE | Tag Kind | Example |
|----|----------|---------|
| TE1 | `tag::skill` | `plumbing`, `electrical`, `project-management` |
| TE2 | `tag::skill-tier` | `novice`, `intermediate`, `expert` |
| TE3 | `tag::cost-type` | `EXECUTABLE`, `MANAGEMENT`, `RESOURCE`, … |
| TE4 | `tag::role` | `org-admin`, `member`, `partner` |
| TE5 | `tag::team` | A named team within an org |
| TE6 | `tag::partner` | A linked external organisation |

## Cost Semantic Classification [D27 #A14]

`classifyCostItem(name: string): CostItemType` lives in `_cost-classifier.ts`.
`CostItemType` values: `EXECUTABLE | MANAGEMENT | RESOURCE | FINANCIAL | PROFIT | ALLOWANCE`.
The Layer-3 router in VS5 filters to `EXECUTABLE` before creating tasks.
**No other slice may re-implement this logic.**

## Neural Network Implementation

| File | Purpose |
|------|---------|
| `centralized-neural-net/neural-network.ts` | NeuralNetwork class: Dijkstra, distance matrix, isolated-node detection |
| `centralized-causality/causality-tracer.ts` | CausalityTracer: `traceAffectedNodes`, `rankAffectedNodes`, `buildDownstreamEvents` |
| `_queries.ts` | Public query surface |
| `index.ts` | Public barrel |

## Learning Engine [D21-G]

`learning-engine.ts` updates synaptic weights based on real fact events only:
- `AccountCreated` (VS2)
- `SkillXpChanged` (VS3)

Manual weight modifications are **forbidden**. Weights are monotonically non-decreasing.

## Incoming Dependencies

| Source | What is consumed |
|--------|-----------------|
| VS2 Account | `AccountCreated` → learning-engine |
| VS3 Skill | `SkillXpChanged` → learning-engine |
| VS5 Workspace | `classifyCostItem()` call for document parsing |
| VS6 Scheduling | `rankAffectedNodes()` call for assignment routing |

## Outgoing Dependencies

| Target | What is produced |
|--------|-----------------|
| IER | `TagLifecycleEvent`, `SemanticTopologyChanged` |
| global-search.slice | Tag-index updates via `TagLifecycleEvent` |
| Projection Bus [L5] | `tag-snapshot` read model |

## Events Emitted

| Event | DLQ Level | Description |
|-------|-----------|-------------|
| `TagLifecycleEvent` | SAFE_AUTO | Tag state transition (Draft→Active→Stale→Deprecated). |
| `SemanticTopologyChanged` | SAFE_AUTO | Graph topology changed; consumers may invalidate caches. |
| `NeuralWeightUpdated` | SAFE_AUTO | Learning engine updated a synaptic weight. |

## Key Invariants

- **[D21-9]** Weights are monotonically non-decreasing; only `learning-engine.ts` may write them.
- **[D21-10]** All topology mutations must emit `SemanticTopologyChanged`.
- **[D21-H]** Blood-Brain Barrier — `validateEdgeProposal()` must be called before every `addEdge()`. Bypassing the BBB is a critical architecture violation.
- **[D21-K]** Semantic-conflict arbitration — self-loops, IS_A cycles, invalid weights, and duplicate edges are vetoed at L7 and never enter the edge store.
- **[D27]** `classifyCostItem()` is the authoritative cost classifier; no slice may re-implement.
- **[#A12]** global-search must index through VS8 tag entities.
- **[D26]** Other slices must call VS8 APIs; they must not contain semantic logic.
