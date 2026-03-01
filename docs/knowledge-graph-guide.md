# Knowledge Graph Usage Guide

> **快速摘要**：在任何程式生成或重構任務前，必須先從 `docs/knowledge-graph.json` 載入治理知識圖譜。

## 什麼是知識圖譜？

`docs/knowledge-graph.json` 是本專案的**持久化架構治理知識圖譜**，記錄從 `docs/logic-overview.md`（SSOT）萃取的核心架構約束與設計決策。

它解決了一個根本問題：**AI Agent 的記憶（Memory MCP）在不同 session、不同環境之間無法保證持久**。

| 儲存方式 | 版本控制 | 跨 session 存活 | 可閱讀性 |
|---------|---------|----------------|---------|
| Memory MCP | ✗ | 不確定 | 需要 MCP server |
| `docs/knowledge-graph.json` | ✅ Git 追蹤 | ✅ 永久存在 | ✅ 標準 JSON |

`docs/knowledge-graph.json` 是**主要持久化存儲（Primary Durable Store）**，Memory MCP 僅為輔助加速用途。

---

## 知識圖譜結構

### Meta 資訊

```json
{
  "meta": {
    "version": "4.0.0",
    "initialized": "2026-02-26",
    "source": "docs/logic-overview.md (SSOT)",
    "ssot": "docs/logic-overview.md",
    "description": "..."
  }
}
```

### 實體（Entities）— 27 個

| 名稱 | 類型 | 說明 |
|------|------|------|
| `Logic_Overview_SSOT` | `Data_Schema` | **最高權威**：`docs/logic-overview.md`，所有衝突以此為準 |
| `Architecture_Governance_Principles` | `Architecture_Decision` | 整體架構治理原則與硬性約束 |
| `Technology_Stack` | `Framework_Feature` | Next.js ^15.5.12、Firebase、shadcn/ui、Genkit AI 技術棧 |
| `UI_Component_Standard` | `Component_Standard` | 僅允許 shadcn/ui，禁止 Material-UI / Chakra 等 |
| `DDD_Boundaries` | `Architecture_Decision` | DDD 邊界規則，禁止跨 BC 直接寫入 |
| `DDD_Aggregate_Protection` | `Architecture_Decision` | 任何繞過 Command Handler 的 Firestore 寫入是嚴重違規 |
| `Vertical_Slice_Architecture` | `Project_Convention` | VSA 目錄結構與切片隔離規則 |
| `Next_JS_Framework` | `Framework_Feature` | App Router、Parallel Routes、Server Components 規範 |
| `Server_Actions_Convention` | `Project_Convention` | 所有 `_actions.ts` 必須返回 `CommandResult` |
| `Command_Event_Flow` | `Project_Convention` | CBG_ENTRY → Command → Aggregate → Event → Outbox → IER → Projection |
| `Knowledge_Graph_Governance` | `Architecture_Decision` | 知識圖譜本身的使用與更新規則 |
| `Genkit_AI_Flow` | `Framework_Feature` | Genkit AI Flow 設計規範 |
| `Compliance_Audit_Standard` | `Architecture_Decision` | 合規審計工作流程，PR 前必須執行 |
| `MCP_Tool_Registry` | `Project_Convention` | MCP 工具清單與標準自動化工作流程 |
| `SK_Outbox_Contract` | `Architecture_Decision` | S1 — Outbox at-least-once + DLQ tier 分級 |
| `SK_Version_Guard` | `Architecture_Decision` | S2 — Projection aggregateVersion 版本守衛 |
| `SK_Read_Consistency` | `Architecture_Decision` | S3 — STRONG_READ vs EVENTUAL_READ 決策規則 |
| `SK_Staleness_Contract` | `Architecture_Decision` | S4 — SLA staleness 常數（TAG_MAX_STALENESS/PROJ_STALE_*） |
| `SK_Resilience_Contract` | `Architecture_Decision` | S5 — 速率限制、熔斷、隔艙 |
| `SK_Token_Refresh_Contract` | `Architecture_Decision` | S6 — Claims 三方同步刷新合約 |
| `Consistency_Invariants` | `Architecture_Decision` | #1-#19 一致性不變量 |
| `Atomicity_Rules` | `Architecture_Decision` | #A1-#A11 原子性規則 |
| `Development_Rules` | `Project_Convention` | D1-D23 開發守則 |
| `IER_Lane_Routing` | `Project_Convention` | IER CRITICAL/STANDARD/BACKGROUND lane 路由表 |
| `Tag_Authority` | `Architecture_Decision` | CTA tagSlug 語義唯一權威，T1-T5 規則 |
| `Vertical_Slice_Definitions` | `Architecture_Decision` | VS0-VS9 切片完整定義 |
| `Tag_Semantic_Entities` | `Architecture_Decision` | v11 TE1-TE6：六個 AI-ready 語義 tag 實體節點（D21-D23） |

### 關係類型（Relation Types）— 5 種

| 類型 | 語義 |
|------|------|
| `FOLLOWS` | 遵循某架構原則或慣例 |
| `DEPENDS_ON` | 依賴某實體才能運作 |
| `CONSTRAINS` | 對另一實體施加約束 |
| `IMPLEMENTS` | 具體實作某抽象規範 |
| `REPLACES` | 取代舊版規範（用於版本更新） |

### 依賴關係圖

```
Logic_Overview_SSOT  ← [DEPENDS_ON] ─ Architecture_Governance_Principles
       ↑                                         ↑
       │              [DEPENDS_ON] ──────────────┤
       ├── DDD_Boundaries ←──────────── Vertical_Slice_Architecture
       ├── Compliance_Audit_Standard              │
       └── Knowledge_Graph_Governance             └── Next_JS_Framework

Architecture_Governance_Principles
  ← [FOLLOWS] ── Next_JS_Framework
  ← [FOLLOWS] ── Technology_Stack
  ← [FOLLOWS] ── Server_Actions_Convention
  ← [FOLLOWS] ── Command_Event_Flow
  ← [FOLLOWS] ── Genkit_AI_Flow
  ← [FOLLOWS] ── UI_Component_Standard
  ← [FOLLOWS] ── Vertical_Slice_Architecture
  ← [CONSTRAINS] ── Knowledge_Graph_Governance
  ← [IMPLEMENTS] ── Compliance_Audit_Standard
  ← [IMPLEMENTS] ── MCP_Tool_Registry
```

---

## 使用方式

### 工作流程一：開始新任務前（必須執行）

**Step 1：檢查 Memory MCP 是否有資料**

```
呼叫：memory.read_graph
```

**Step 2a：若 Memory MCP 有資料（27 個 entities）**

直接使用 Memory MCP 中的資料，不需重新載入。

**Step 2b：若 Memory MCP 為空（0 個 entities）**

從 JSON 重新載入到 Memory MCP：

```typescript
// 1. 讀取 docs/knowledge-graph.json
const graph = JSON.parse(fs.readFileSync('docs/knowledge-graph.json', 'utf-8'));

// 2. 批量寫入 Memory MCP
await memory.create_entities(graph.entities);
await memory.create_relations(graph.relations);
```

**Step 3：查詢相關節點**

```
// 搜尋與任務相關的節點
呼叫：memory.search_nodes("Server Actions CommandResult")
呼叫：memory.search_nodes("DDD Boundaries Firestore")
呼叫：memory.search_nodes("UI Component shadcn")
```

**Step 4：以查詢結果作為設計約束**

根據 observations 中的規則驗證你的設計，再開始撰寫程式碼。

---

### 工作流程二：完成架構決策後（必須執行）

每當做出新的架構決策，或完成重大功能後：

**Step 1：更新 `docs/knowledge-graph.json`**

直接編輯 JSON 檔案，新增 entity 或 relation，或更新 observations。

**Step 2：同步更新 Memory MCP**

```
呼叫：memory.create_entities([{ name: "新實體", entityType: "...", observations: [...] }])
呼叫：memory.create_relations([{ from: "A", relationType: "FOLLOWS", to: "B" }])
```

**Step 3：Commit JSON 更新**

JSON 檔案是版本控制的一部分，必須隨程式碼一起提交。

---

## 查詢範例

### 查詢 Server Action 必須遵守的規則

```
memory.search_nodes("Server_Actions_Convention")
```

關鍵 observations：
- 所有 `_actions.ts` export 必須返回 `CommandResult`
- 禁止返回 `void`、`undefined`、或原始 Firestore `DocumentReference`
- `traceId` 由 CBG_ENTRY 注入，禁止在任何下游節點覆寫

### 查詢 UI 元件限制

```
memory.search_nodes("UI_Component_Standard")
```

關鍵 observations：
- shadcn/ui 是唯一允許的元件庫
- 禁止引入 Material-UI、Chakra UI 或其他元件系統
- Tailwind CSS 是唯一允許的樣式系統

### 查詢跨切片存取規則

```
memory.search_nodes("Vertical_Slice_Architecture")
```

關鍵 observations：
- 跨切片只能透過 `{slice}/index.ts` 的 public API 存取
- 禁止直接 import 其他切片的 `_*` 私有檔案

### 查詢 DLQ 安全規則

```
memory.search_nodes("Command_Event_Flow SECURITY_BLOCK")
```

關鍵 observations：
- `SECURITY_BLOCK` tier（RoleChanged、PolicyChanged）**禁止自動重播**
- 必須由安全團隊授權，且受影響實體處於 FROZEN 狀態

---

## 更新知識圖譜

### 新增 Entity

```json
// 在 docs/knowledge-graph.json 的 "entities" 陣列中新增：
{
  "name": "New_Feature_Convention",
  "entityType": "Project_Convention",
  "observations": [
    "Source file: .github/prompts/new-feature.prompt.md",
    "規則描述 1",
    "規則描述 2"
  ]
}
```

### 新增 Relation

```json
// 在 docs/knowledge-graph.json 的 "relations" 陣列中新增：
{ "from": "New_Feature_Convention", "relationType": "FOLLOWS", "to": "Architecture_Governance_Principles" }
```

### 更新既有 Entity 的 Observations

直接修改 JSON 中對應 entity 的 `observations` 陣列，然後提交。

---

## 不變量（Invariants）

以下是知識圖譜中記錄的核心不變量，任何程式碼變更都不得違反：

1. **SSOT 優先**：`Logic_Overview_SSOT`（`docs/logic-overview.md`）是絕對最高權威，任何衝突以此為準
2. **Command Handler 強制**：任何繞過 Command Handler 直接寫入 Firestore 是**嚴重違規**（`DDD_Aggregate_Protection`）
3. **traceId 不可覆寫**：`traceId` 在 `CBG_ENTRY` 注入一次，下游任何節點**不得重新生成或覆寫**（`Command_Event_Flow`）
4. **shadcn/ui 唯一性**：禁止引入任何其他 UI 元件庫（`UI_Component_Standard`）
5. **CommandResult 強制**：所有 `_actions.ts` export **必須**返回 `CommandResult`（`Server_Actions_Convention`）
6. **SECURITY_BLOCK 禁止自動重播**：`RoleChanged`、`PolicyChanged` 事件進入 DLQ 後不得自動重播（`Command_Event_Flow`）
7. **工作流程狀態機封閉**：`Draft → InProgress → QA → Acceptance → Finance → Completed` 是封閉轉換，不得新增轉換（`Command_Event_Flow`）

---

## 測試結果（驗證紀錄）

以下是 2026-02-26 的驗證結果，確認 JSON 作為 fallback 機制正常運作：

| 步驟 | 結果 |
|------|------|
| Memory MCP 初始狀態 | ✅ 空（0 entities，0 relations）|
| 讀取 `docs/knowledge-graph.json` | ✅ 成功（27 entities，59 relations）|
| 呼叫 `memory.create_entities()` | ✅ 成功（所有 27 個 entities 載入）|
| 呼叫 `memory.create_relations()` | ✅ 成功（所有 59 個 relations 載入）|
| 呼叫 `memory.read_graph()` 驗證 | ✅ 圖譜完整（27 entities，59 relations）|
| `memory.search_nodes()` 查詢 | ⚠️ 注意：需使用 `read_graph` 替代（search 在部分環境下返回空結果）|

---

## 相關檔案

| 檔案 | 說明 |
|------|------|
| `docs/knowledge-graph.json` | 主要持久化存儲（本指南所描述的資料檔案）|
| `.github/prompts/memory-governance.prompt.md` | AI Agent 使用知識圖譜的規則 |
| `.github/prompts/ai-architecture-governance.prompt.md` | 整體架構治理原則 |
| `docs/logic-overview.md` | SSOT — 最高權威架構文件 |
