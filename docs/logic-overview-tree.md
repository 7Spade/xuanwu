# Logic Overview Tree（Next.js 16 × Logic Overview 對齊版）

> 目的：同時滿足兩件事  
> 1) 與 `docs/logic-overview.md` 的 L0~L9 / VS0~VS8 / D24 / D26 / D27 對齊。  
> 2) 符合 Next.js 16 App Router 實作與 Server/Client 邊界。

```text
src/
├─ app/                                                  # L0 External Triggers（Next.js App Router）
│  ├─ (public)/
│  │  ├─ login/
│  │  │  └─ page.tsx
│  │  └─ reset-password/
│  │     └─ page.tsx
│  ├─ (portal)/
│  │  ├─ dashboard/
│  │  │  └─ page.tsx
│  │  └─ workspaces/
│  │     ├─ [workspaceId]/
│  │     │  ├─ page.tsx
│  │     │  ├─ @businesstab/                           # parallel routes
│  │     │  │  ├─ tasks/page.tsx
│  │     │  │  ├─ schedule/page.tsx
│  │     │  │  ├─ quality-assurance/page.tsx
│  │     │  │  ├─ acceptance/page.tsx
│  │     │  │  ├─ finance/page.tsx
│  │     │  │  └─ document-parser/page.tsx
│  │     │  ├─ @modal/
│  │     │  │  └─ default.tsx
│  │     │  └─ @panel/
│  │     │     └─ default.tsx
│  │     └─ new/page.tsx
│  ├─ api/                                               # route handlers（webhook/commands/queries）
│  │  ├─ webhooks/
│  │  ├─ commands/
│  │  ├─ queries/
│  │  └─ health/
│  ├─ layout.tsx
│  ├─ loading.tsx
│  ├─ error.tsx
│  └─ not-found.tsx
│
├─ app-runtime/                                          # runtime wiring（providers/hooks/contexts）
│  ├─ providers/
│  ├─ hooks/
│  ├─ contexts/
│  └─ ai/
│
├─ features/                                             # L3 Domain Slices + Authorities
│  ├─ vs1-identity.slice/
│  │  ├─ domain/
│  │  ├─ application/
│  │  │  ├─ _actions.ts                                 # D3
│  │  │  ├─ _queries.ts                                 # D4
│  │  │  └─ _services.ts
│  │  ├─ ui/
│  │  │  ├─ _components/
│  │  │  └─ _hooks/
│  │  └─ index.ts                                       # D7 public API
│  │
│  ├─ vs2-account.slice/
│  │  ├─ domain/
│  │  │  ├─ user-account/
│  │  │  ├─ wallet/
│  │  │  └─ governance/
│  │  ├─ application/
│  │  │  ├─ _actions.ts
│  │  │  ├─ _queries.ts
│  │  │  └─ _services.ts
│  │  ├─ ui/
│  │  └─ index.ts
│  │
│  ├─ vs3-skill-xp.slice/
│  │  ├─ domain/
│  │  ├─ application/
│  │  │  ├─ _actions.ts
│  │  │  ├─ _queries.ts
│  │  │  └─ _services.ts
│  │  ├─ ui/
│  │  └─ index.ts
│  │
│  ├─ vs4-organization.slice/
│  │  ├─ domain/
│  │  │  ├─ core/
│  │  │  ├─ governance/
│  │  │  └─ talent-repository/
│  │  ├─ application/
│  │  │  ├─ _actions.ts
│  │  │  ├─ _queries.ts
│  │  │  └─ _services.ts
│  │  ├─ ui/
│  │  └─ index.ts
│  │
│  ├─ vs5-workspace.slice/
│  │  ├─ domain/
│  │  │  ├─ core/
│  │  │  ├─ workflow/
│  │  │  └─ finance-lifecycle/
│  │  ├─ document-parser/
│  │  │  ├─ layer-1-raw-parse/
│  │  │  ├─ layer-2-semantic-classification/
│  │  │  └─ layer-3-semantic-router/
│  │  ├─ application/
│  │  │  ├─ _actions.ts
│  │  │  ├─ _queries.ts
│  │  │  └─ _services.ts
│  │  ├─ ui/
│  │  └─ index.ts
│  │
│  ├─ vs6-scheduling.slice/
│  │  ├─ domain/
│  │  ├─ saga/
│  │  ├─ application/
│  │  │  ├─ _actions.ts
│  │  │  ├─ _queries.ts
│  │  │  └─ _services.ts
│  │  ├─ ui/
│  │  └─ index.ts
│  │
│  ├─ vs7-notification-hub.slice/                     # Authority Exit（D26 #A13）
│  │  ├─ domain/
│  │  │  ├─ router/
│  │  │  └─ channel-policy/
│  │  ├─ application/
│  │  │  ├─ _actions.ts                               # required by D3
│  │  │  ├─ _queries.ts                               # read-model only
│  │  │  └─ _services.ts                              # required by D26
│  │  ├─ ui/
│  │  └─ index.ts
│  │
│  ├─ vs8-semantic-cognition.slice/                   # aka semantic-graph.slice
│  │  ├─ governance/                                  # Semantic Governance
│  │  │  ├─ semantic-registry/
│  │  │  ├─ semantic-protocol/
│  │  │  ├─ guards/
│  │  │  └─ wiki/
│  │  ├─ neural-core/                                 # Semantic Neural Core
│  │  │  ├─ core/
│  │  │  ├─ graph/
│  │  │  ├─ neural/
│  │  │  ├─ routing/
│  │  │  └─ plasticity/
│  │  ├─ projection/                                  # Semantic Projection
│  │  │  ├─ projections/
│  │  │  ├─ io/
│  │  │  └─ decision/
│  │  ├─ application/
│  │  │  ├─ _actions.ts
│  │  │  ├─ _queries.ts
│  │  │  └─ _services.ts
│  │  ├─ ui/
│  │  └─ index.ts
│  │
│  ├─ global-search.slice/                            # Authority Exit（D26 #A12）
│  │  ├─ domain/
│  │  ├─ application/
│  │  │  ├─ _actions.ts                               # required by D3
│  │  │  ├─ _queries.ts
│  │  │  └─ _services.ts                              # required by D26
│  │  ├─ ui/
│  │  └─ index.ts
│  │
│  ├─ infra.gateway-command/                          # L2 Command Gateway
│  │  ├─ _gateway.ts
│  │  └─ index.ts
│  ├─ infra.event-router/                             # L4 IER
│  │  ├─ _router.ts
│  │  └─ index.ts
│  ├─ infra.outbox-relay/                             # L4 relay worker
│  │  ├─ _relay.ts
│  │  └─ index.ts
│  ├─ projection.bus/                                 # L5 Projection Bus
│  │  ├─ _funnel.ts
│  │  ├─ _registry.ts
│  │  └─ index.ts
│  ├─ infra.gateway-query/                            # L6 Query Gateway
│  │  ├─ _registry.ts
│  │  └─ index.ts
│  └─ observability/                                  # L9
│     ├─ _trace.ts
│     ├─ _metrics.ts
│     ├─ _error-log.ts
│     └─ index.ts
│
├─ shared-kernel/                                     # L1 / VS0
│  ├─ data-contracts/
│  ├─ infra-contracts/
│  ├─ ports/
│  ├─ semantic-primitives/
│  └─ index.ts
│
├─ shared/
│  ├─ ui/
│  ├─ app-providers/
│  ├─ constants/
│  ├─ enums/
│  ├─ utils/
│  └─ infra/                                          # L7 Firebase ACL（D24）
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
├─ shared-infra/                                      # L8 Firebase Infra（平台配置/部署配套）
│  └─ firebase/
│     ├─ app/
│     ├─ functions/
│     ├─ rules/
│     └─ indexes/
│
└─ governance/
	├─ hard-invariants/
	├─ cross-cutting-authorities/
	├─ layering-rules/
	├─ semantic-governance/
	├─ extension-gates/
	└─ review-checklists/
```

## 匹配驗證矩陣（Deep Check）

- **邏輯圖 L0~L9 對位**：L0=`app/api`，L1=`shared-kernel`，L2/L4/L5/L6/L9=`features/infra* + projection.bus + observability`，L7=`shared/infra`，L8=`shared-infra/firebase`。
- **VS0~VS8 對位**：VS0=`shared-kernel`，VS1~VS8=`features/vs*-*.slice`。
- **Cross-cutting Authorities 對位**：`global-search.slice` 與 `vs7-notification-hub.slice` 均具 `_actions.ts` + `_services.ts`。
- **D3/D4/D7 對位**：每個 slice 明確有 `application/_actions.ts`、`application/_queries.ts`、`index.ts`。
- **D24 對位**：Firebase SDK 呼叫點集中在 `shared/infra/{auth|firestore|messaging|storage}`。
- **D27 對位**：VS5 保留 document-parser 三層；VS8 projection/decision 保留 cost-semantic routing 出口。
- **Next.js 16 對位**：App Router、parallel routes、route handlers、server-first 路由結構已就位。

