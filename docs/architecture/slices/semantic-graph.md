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

## Architecture: 10-Layer Semantic Neural Network (D21-1 ~ D21-10 + D21-A~D21-X)

The semantic brain is organized as 10 discrete processing layers.
Each layer has a single well-defined responsibility, and cross-layer
coupling is forbidden except via the public `index.ts` barrel [D7].

| Layer | ID | Name | Directory / File | Responsibility | Rule |
|-------|----|------|-----------------|---------------|------|
| L1  | VS8_CL (VS8_CORE)  | DNA 定義層 (Neuron DNA)        | `centralized-tag/`                                      | Tag entity definition + `Draft→Active→Stale→Deprecated` FSM; centralised schemas, hierarchy-manager, vector-store | [D21-A, D21-B, D21-C, D21-D] |
| L2  | VS8_SL (VS8_GRAPH) | 突觸層 (Synapse Layer)         | `centralized-edges/`                                    | `SemanticEdgeStore`: typed IS_A/REQUIRES edges; weight ∈ (0,1]; cost = 1/weight; context-attention; adjacency-list | [D21-E, D21-F, D21-9, D21-10] |
| L3  | VS8_NG             | 計算層 (Neural Computation)    | `centralized-neural-net/` + `centralized-causality/`    | Dijkstra weighted shortest path; BFS causality tracing (`CausalityTracer`); isolated-node detection | [D21-4, D21-6, D21-X] |
| L4  | VS8_ROUT           | 反射弧層 (Reflection Arc)      | `centralized-workflows/`                                | `PolicyMapper` + `DispatchBridge`: maps L3 output to business dispatch strategies | [D21-5, D27-A] |
| L5  | VS8_GUARD          | 血腦屏障 (BBB)                | `centralized-guards/`                                   | `SemanticGuard`: **supreme veto** over edge proposals; rejects self-loops, IS_A cycles, invalid weights, duplicates | [D21-H, D21-K, S4] |
| L6  | VS8_PLAST          | 可塑性層 (Plasticity)          | `centralized-learning/`                                 | `learning-engine.ts` weight feedback loop (driven by VS2/VS3 facts only); `decay-service.ts` natural decay | [D21-G] |
| L7  | VS8_PROJ           | 投影讀取層 (Projection)        | `projections/`                                          | `tag-snapshot.slice.ts` (sole legal read exit); `graph-selectors.ts`; `context-selectors.ts` — **read-only** | [D21-7, T5] |
| L8  | VS8_WIKI           | 維基治理層 (Governance) 🏛️    | `wiki-editor/` `proposal-stream/`                       | Knowledge governance: proposal review, consensus validation, `relationship-visualizer` | [D21-I~W] |
| L9  | VS8_RL             | 決策輸出層 (Cost-Output) 💰   | `_cost-classifier.ts`                                   | Pure-function cost keyword classifier → `CostItemType`; **no side effects, no async** | [D21-5, D8] |
| L10 | VS8_IO             | 訂閱廣播層 (I/O)              | `subscribers/` `outbox/`                                | `lifecycle-subscriber.ts` (inbound); `tag-outbox.ts` (outbound broadcast, SK_OUTBOX SAFE_AUTO) | [D21-6, S1] |

Additional invariants:
- **D21-9** Synaptic weight invariant — weight ∈ (0.0, 1.0]; cost = 1/weight; zero-weight edges are physically impossible.
- **D21-10** Topology observability — graph structure changes emit `SemanticTopologyChanged`; results written to L10 (VS8_IO).
- **D21-H** Blood-Brain Barrier — `validateEdgeProposal()` must be called before every `addEdge()`.
- **D21-K** Semantic-conflict arbitration — self-loops, IS_A cycles, and invalid weights are rejected at the L5 BBB layer.

> **Backward compatibility note:** `VS8_CL` is the subgraph ID for L1 (alias VS8_CORE); `VS8_SL` for L2 (alias VS8_GRAPH); `VS8_NG` for L3; `VS8_ROUT` for L4 (formerly VS8_RL in the superseded 4-layer model where VS8_RL was the "Routing Output" / dispatch-bridge layer); `VS8_RL` is now L9 (語義決策輸出層 — cost-output classifier).

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
