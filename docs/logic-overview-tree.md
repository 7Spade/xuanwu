# Logic Overview Tree（Next.js 16 適配版）

> 你提醒得很準：上一版太偏「純分層後端目錄」，不夠 Next.js 16 App Router。  
> 這版改為 **Next.js 16 可落地結構**：`app` 負責路由/入口，`features` 承載 VS 邏輯，`shared-kernel` + `infra` 提供契約與實作。

```text
src/
├─ app/                                               # Next.js 16 App Router（L0 入口）
│  ├─ (public)/
│  │  ├─ login/
│  │  └─ reset-password/
│  ├─ (portal)/
│  │  ├─ dashboard/
│  │  ├─ workspaces/
│  │  │  ├─ [workspaceId]/
│  │  │  │  ├─ @businesstab/                        # 平行路由
│  │  │  │  │  ├─ tasks/
│  │  │  │  │  ├─ schedule/
│  │  │  │  │  ├─ quality-assurance/
│  │  │  │  │  ├─ acceptance/
│  │  │  │  │  ├─ finance/
│  │  │  │  │  └─ document-parser/
│  │  │  │  ├─ @modal/                              # 平行路由 modal
│  │  │  │  └─ @panel/
│  │  │  └─ new/
│  │  └─ settings/
│  ├─ api/                                            # Route Handlers（L0 webhooks/api）
│  │  ├─ webhooks/
│  │  ├─ commands/
│  │  ├─ queries/
│  │  └─ health/
│  ├─ layout.tsx
│  ├─ error.tsx
│  ├─ loading.tsx
│  └─ not-found.tsx
│
├─ app-runtime/                                       # Next runtime wiring（providers/hooks/context）
│  ├─ providers/
│  ├─ contexts/
│  ├─ hooks/
│  └─ ai/
│
├─ features/                                          # L3 Domain Slices + Cross-cutting Authorities
│  ├─ vs1-identity.slice/
│  │  ├─ domain/
│  │  ├─ application/
│  │  │  ├─ actions/
│  │  │  └─ queries/
│  │  ├─ ui/
│  │  └─ index.ts
│  │
│  ├─ vs2-account.slice/
│  │  ├─ domain/
│  │  │  ├─ user-account/
│  │  │  ├─ wallet/
│  │  │  └─ governance/
│  │  ├─ application/
│  │  │  ├─ actions/
│  │  │  └─ queries/
│  │  ├─ ui/
│  │  └─ index.ts
│  │
│  ├─ vs3-skill-xp.slice/
│  │  ├─ domain/
│  │  ├─ application/
│  │  │  ├─ actions/
│  │  │  └─ queries/
│  │  ├─ ui/
│  │  └─ index.ts
│  │
│  ├─ vs4-organization.slice/
│  │  ├─ domain/
│  │  │  ├─ core/
│  │  │  ├─ governance/
│  │  │  └─ talent-repository/
│  │  ├─ application/
│  │  │  ├─ actions/
│  │  │  └─ queries/
│  │  ├─ ui/
│  │  └─ index.ts
│  │
│  ├─ vs5-workspace.slice/
│  │  ├─ domain/
│  │  │  ├─ core/
│  │  │  ├─ workflow/
│  │  │  └─ finance-lifecycle/
│  │  ├─ application/
│  │  │  ├─ command-handler/
│  │  │  ├─ scope-guard/
│  │  │  ├─ policy-engine/
│  │  │  └─ transaction-runner/
│  │  ├─ document-parser/
│  │  │  ├─ layer-1-raw-parse/
│  │  │  ├─ layer-2-semantic-classification/
│  │  │  └─ layer-3-semantic-router/
│  │  ├─ ui/
│  │  └─ index.ts
│  │
│  ├─ vs6-scheduling.slice/
│  │  ├─ domain/
│  │  ├─ application/
│  │  │  ├─ saga/
│  │  │  ├─ actions/
│  │  │  └─ queries/
│  │  ├─ ui/
│  │  └─ index.ts
│  │
│  ├─ vs7-notification-hub.slice/                    # Cross-cutting Authority（唯一副作用出口）
│  │  ├─ domain/
│  │  │  ├─ router/
│  │  │  └─ channel-policy/
│  │  ├─ application/
│  │  │  ├─ actions/
│  │  │  ├─ services/
│  │  │  └─ queries/
│  │  ├─ ui/
│  │  └─ index.ts
│  │
│  ├─ vs8-semantic-cognition.slice/
│  │  ├─ governance/                                 # Semantic Governance
│  │  │  ├─ semantic-registry/
│  │  │  ├─ semantic-protocol/
│  │  │  ├─ guards/
│  │  │  └─ wiki/
│  │  ├─ neural-core/                                # Semantic Neural Core
│  │  │  ├─ core/
│  │  │  ├─ graph/
│  │  │  ├─ neural/
│  │  │  ├─ routing/
│  │  │  └─ plasticity/
│  │  ├─ projection/                                 # Semantic Projection
│  │  │  ├─ projections/
│  │  │  ├─ io/
│  │  │  └─ decision/
│  │  ├─ application/
│  │  │  ├─ actions/
│  │  │  └─ queries/
│  │  ├─ ui/
│  │  └─ index.ts
│  │
│  ├─ global-search.slice/                           # Cross-cutting Authority（唯一跨域搜尋）
│  │  ├─ domain/
│  │  ├─ application/
│  │  │  ├─ actions/
│  │  │  ├─ services/
│  │  │  └─ queries/
│  │  ├─ ui/
│  │  └─ index.ts
│  │
│  ├─ infra.gateway-command/                         # L2 CMD
│  ├─ infra.event-router/                            # L4 IER
│  ├─ infra.outbox-relay/                            # L4 relay
│  ├─ projection.bus/                                # L5 Projection Bus
│  ├─ infra.gateway-query/                           # L6 Query Gateway
│  └─ observability/                                 # L9
│
├─ shared-kernel/                                    # L1 / VS0（契約 + 規則）
│  ├─ data-contracts/
│  ├─ infra-contracts/
│  ├─ ports/
│  ├─ semantic-primitives/
│  └─ index.ts
│
├─ shared/                                           # 可重用 UI 與通用程式
│  ├─ ui/
│  ├─ app-providers/
│  ├─ constants/
│  ├─ enums/
│  ├─ utils/
│  └─ infra/                                         # L7 Firebase ACL（對齊 D24）
│     ├─ auth/
│     │  ├─ auth.adapter.ts
│     │  └─ index.ts
│     ├─ firestore/
│     │  ├─ firestore.facade.ts
│     │  └─ index.ts
│     ├─ messaging/
│     │  ├─ messaging.adapter.ts
│     │  └─ index.ts
│     ├─ storage/
│     │  ├─ storage.facade.ts
│     │  └─ index.ts
│     └─ index.ts
│
├─ shared-infra/                                     # 平台整合與部署配套（非 Domain）
│  ├─ firebase/
│  │  ├─ app/
│  │  ├─ functions/
│  │  ├─ rules/
│  │  └─ indexes/
│  └─ platform-ops/
│
└─ governance/                                       # 架構治理（文件與檢核）
	├─ hard-invariants/
	├─ cross-cutting-authorities/
	├─ layering-rules/
	├─ semantic-governance/
	├─ extension-gates/
	└─ review-checklists/
```

## 為什麼這版更適合 Next.js 16

- `app/` 作為唯一路由入口，直接符合 App Router 模式。
- 平行路由（`@businesstab/@modal/@panel`）保留 UI orchestration 能力。
- Domain 邏輯不塞在 `app/`，而是放 `features/`，避免 route 層污染。
- `actions/queries` 仍在各 slice 內，維持 D3/D4 與 D7 邊界。
- VS8 保留三大區塊（governance/neural-core/projection），可直接對應你的語義引擎定位。

## 與邏輯圖匹配檢查（對照 `docs/logic-overview.md`）

- L0：`src/app` + `src/app/api` 對應 External Triggers（Client / Webhook 入口）。
- L1：`src/shared-kernel` 對應 Shared Kernel（VS0）。
- L2：`src/features/infra.gateway-command` 對應 Command Gateway。
- L3：`src/features/vs1~vs8` + `global-search.slice` + `vs7-notification-hub.slice` 對應 Domain + Cross-cutting Authorities。
- L4：`src/features/infra.event-router` + `src/features/infra.outbox-relay` 對應 IER。
- L5：`src/features/projection.bus` 對應 Projection Bus。
- L6：`src/features/infra.gateway-query` 對應 Query Gateway。
- L7：`src/shared/infra/{auth|firestore|messaging|storage}` 對應 Firebase ACL（D24）。
- L8：`src/shared-infra/firebase/*` 作為平台整合支援（外部 Firebase Infra 對接層）。
- L9：`src/features/observability` 對應 Observability。

