# Logic Overview Tree（重新設計版）

> 目標：依照邏輯圖（L0~L9、VS0~VS8、Cross-cutting Authorities、Governance）建立全新 `src/**/**` 資料夾樹。  
> 原則：不對照現有專案、以架構責任分層優先、保留未來擴充空間。

```text
src/
├─ l0-external-triggers/
│  ├─ nextjs-client/
│  │  ├─ actions/
│  │  ├─ web-entry/
│  │  └─ dto/
│  ├─ webhooks/
│  │  ├─ handlers/
│  │  ├─ validators/
│  │  └─ dto/
│  └─ edge-functions/
│     ├─ adapters/
│     ├─ guards/
│     └─ dto/
│
├─ l1-shared-kernel/                                # VS0
│  ├─ data-contracts/
│  │  ├─ event-envelope/
│  │  ├─ authority-snapshot/
│  │  ├─ command-result/
│  │  ├─ skill-tier/
│  │  ├─ schedule-contract/
│  │  └─ semantic-contracts/
│  ├─ infra-contracts/
│  │  ├─ outbox-contract/
│  │  ├─ version-guard/
│  │  ├─ read-consistency/
│  │  ├─ staleness-contract/
│  │  ├─ resilience-contract/
│  │  └─ token-refresh-contract/
│  ├─ ports/
│  │  ├─ auth/
│  │  ├─ firestore/
│  │  ├─ messaging/
│  │  └─ storage/
│  ├─ semantic-primitives/
│  │  ├─ tag-entities/
│  │  ├─ tag-slug/
│  │  └─ type-guards/
│  └─ index/
│
├─ l2-command-gateway/
│  ├─ entry/
│  ├─ interceptors/
│  │  ├─ authority-interceptor/
│  │  └─ trace-interceptor/
│  ├─ resilience/
│  │  ├─ rate-limiter/
│  │  ├─ circuit-breaker/
│  │  └─ bulkhead-router/
│  ├─ router/
│  └─ command-pipeline/
│
├─ l3-domain-slices/
│  ├─ vs1-identity-slice/
│  │  ├─ core/
│  │  ├─ context-lifecycle/
│  │  ├─ claims-refresh/
│  │  ├─ actions/
│  │  ├─ queries/
│  │  └─ index/
│  │
│  ├─ vs2-account-slice/
│  │  ├─ user-account/
│  │  ├─ wallet/
│  │  ├─ org-account/
│  │  ├─ governance/
│  │  │  ├─ role/
│  │  │  └─ policy/
│  │  ├─ event-bus/
│  │  ├─ outbox/
│  │  ├─ actions/
│  │  ├─ queries/
│  │  └─ index/
│  │
│  ├─ vs3-skill-xp-slice/
│  │  ├─ aggregate/
│  │  ├─ xp-ledger/
│  │  ├─ event-bus/
│  │  ├─ outbox/
│  │  ├─ actions/
│  │  ├─ queries/
│  │  └─ index/
│  │
│  ├─ vs4-organization-slice/
│  │  ├─ core/
│  │  ├─ governance/
│  │  │  ├─ members/
│  │  │  ├─ partners/
│  │  │  ├─ teams/
│  │  │  └─ policy/
│  │  ├─ talent-repository/
│  │  ├─ tag-lifecycle-subscription/
│  │  ├─ event-bus/
│  │  ├─ outbox/
│  │  ├─ actions/
│  │  ├─ queries/
│  │  └─ index/
│  │
│  ├─ vs5-workspace-slice/
│  │  ├─ app-coordinator/
│  │  │  ├─ command-handler/
│  │  │  ├─ scope-guard/
│  │  │  ├─ policy-engine/
│  │  │  └─ transaction-runner/
│  │  ├─ core/
│  │  ├─ governance/
│  │  ├─ business/
│  │  │  ├─ files/
│  │  │  ├─ document-parser/
│  │  │  │  ├─ layer-1-raw-parse/
│  │  │  │  ├─ layer-2-semantic-classification/
│  │  │  │  └─ layer-3-semantic-router/
│  │  │  ├─ workflow-state-machine/
│  │  │  ├─ tasks/
│  │  │  ├─ quality-assurance/
│  │  │  ├─ acceptance/
│  │  │  ├─ finance-lifecycle/
│  │  │  ├─ issues/
│  │  │  ├─ daily/
│  │  │  └─ schedule/
│  │  ├─ event-bus/
│  │  ├─ event-store/
│  │  ├─ outbox/
│  │  ├─ actions/
│  │  ├─ queries/
│  │  └─ index/
│  │
│  ├─ vs6-scheduling-slice/
│  │  ├─ aggregate/
│  │  ├─ saga/
│  │  ├─ eligibility/
│  │  ├─ outbox/
│  │  ├─ actions/
│  │  ├─ queries/
│  │  └─ index/
│  │
│  ├─ vs7-notification-hub-slice/                  # Cross-cutting Authority
│  │  ├─ router/
│  │  ├─ channel-policy/
│  │  ├─ delivery/
│  │  ├─ templates/
│  │  ├─ actions/
│  │  ├─ services/
│  │  ├─ queries/
│  │  └─ index/
│  │
│  ├─ vs8-semantic-cognition-engine/
│  │  ├─ governance/                               # Semantic Governance
│  │  │  ├─ semantic-registry/
│  │  │  ├─ semantic-protocol/
│  │  │  ├─ guards/
│  │  │  │  ├─ invariant-guard/
│  │  │  │  └─ staleness-monitor/
│  │  │  └─ wiki/
│  │  │     ├─ wiki-editor/
│  │  │     ├─ proposal-stream/
│  │  │     ├─ consensus-engine/
│  │  │     └─ relationship-visualizer/
│  │  ├─ neural-core/                              # Semantic Neural Core
│  │  │  ├─ core/
│  │  │  │  ├─ centralized-tag-aggregate/
│  │  │  │  ├─ tag-definitions/
│  │  │  │  ├─ schemas/
│  │  │  │  ├─ hierarchy-manager/
│  │  │  │  └─ vector-store/
│  │  │  ├─ graph/
│  │  │  │  ├─ semantic-edge-store/
│  │  │  │  ├─ adjacency-list/
│  │  │  │  ├─ weight-calculator/
│  │  │  │  └─ context-attention/
│  │  │  ├─ neural/
│  │  │  │  ├─ semantic-distance/
│  │  │  │  ├─ causality-tracer/
│  │  │  │  └─ topology-observability/
│  │  │  ├─ routing/
│  │  │  │  ├─ policy-mapper/
│  │  │  │  ├─ dispatch-bridge/
│  │  │  │  └─ workflows/
│  │  │  └─ plasticity/
│  │  │     ├─ learning-engine/
│  │  │     └─ decay-service/
│  │  ├─ projection/                               # Semantic Projection
│  │  │  ├─ projections/
│  │  │  │  ├─ tag-snapshot/
│  │  │  │  ├─ graph-selectors/
│  │  │  │  └─ context-selectors/
│  │  │  ├─ io/
│  │  │  │  ├─ subscribers/
│  │  │  │  └─ outbox/
│  │  │  └─ decision/
│  │  │     ├─ cost-classifier/
│  │  │     └─ decision-contracts/
│  │  ├─ actions/
│  │  ├─ queries/
│  │  └─ index/
│  │
│  └─ global-search-slice/                         # Cross-cutting Authority
│     ├─ semantic-index/
│     ├─ query-composer/
│     ├─ ranking/
│     ├─ actions/
│     ├─ services/
│     ├─ queries/
│     └─ index/
│
├─ l4-integration-event-router/
│  ├─ relay-worker/
│  ├─ router-core/
│  ├─ lanes/
│  │  ├─ critical-lane/
│  │  ├─ standard-lane/
│  │  └─ background-lane/
│  ├─ dead-letter-queue/
│  │  ├─ safe-auto/
│  │  ├─ review-required/
│  │  └─ security-block/
│  └─ replay-control/
│
├─ l5-projection-bus/
│  ├─ event-funnel/
│  ├─ lanes/
│  │  ├─ critical-projection-lane/
│  │  └─ standard-projection-lane/
│  ├─ stream-meta/
│  │  ├─ projection-version/
│  │  └─ read-model-registry/
│  ├─ critical-projections/
│  │  ├─ workspace-scope-guard-view/
│  │  ├─ org-eligible-member-view/
│  │  └─ wallet-balance-view/
│  ├─ standard-projections/
│  │  ├─ workspace-view/
│  │  ├─ account-view/
│  │  ├─ organization-view/
│  │  ├─ account-skill-view/
│  │  ├─ account-schedule-view/
│  │  ├─ global-audit-view/
│  │  └─ tag-snapshot-view/
│  └─ projector-tooling/
│
├─ l6-query-gateway/
│  ├─ registry/
│  ├─ read-consistency-router/
│  ├─ query-endpoints/
│  │  ├─ schedule-query/
│  │  ├─ notification-query/
│  │  ├─ scope-query/
│  │  ├─ wallet-query/
│  │  └─ semantic-query/
│  └─ query-contracts/
│
├─ l7-firebase-acl/
│  ├─ auth-adapter/
│  ├─ firestore-adapter/
│  ├─ messaging-adapter/
│  ├─ storage-adapter/
│  ├─ port-bindings/
│  └─ acl-guards/
│
├─ l8-firebase-infra/
│  ├─ firestore/
│  ├─ auth/
│  ├─ messaging/
│  └─ storage/
│
├─ l9-observability/
│  ├─ trace/
│  ├─ metrics/
│  │  ├─ relay-lag/
│  │  ├─ lane-throughput/
│  │  ├─ stale-monitor/
│  │  └─ resilience-signals/
│  ├─ errors/
│  └─ audit/
│
└─ governance/
	├─ architecture-rules/
	│  ├─ hard-invariants/
	│  │  ├─ r-rules/
	│  │  ├─ s-rules/
	│  │  ├─ a-rules/
	│  │  └─ hash-invariants/
	│  ├─ layering-rules/
	│  ├─ cross-cutting-authorities/
	│  ├─ semantic-governance/
	│  └─ cost-routing-extension/
	├─ compliance/
	│  ├─ review-checklists/
	│  ├─ gate-policies/
	│  └─ drift-detection/
	└─ change-management/
		├─ proposals/
		├─ accepted-decisions/
		└─ migration-plans/
```

## 設計摘要（對應邏輯圖）

- `l0~l9` 對應系統層級與通訊方向。
- `l3-domain-slices` 收斂 VS1~VS8 + Cross-cutting Authorities（Global Search / Notification Hub）。
- VS8 採三大區塊：`governance / neural-core / projection`。
- `governance/architecture-rules` 將 Hard Invariants、Layering、Authority、Governance 規範獨立成可治理空間。

