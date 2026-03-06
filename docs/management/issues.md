# 🗂 Active Issues Register

> **憲法依據 / Constitutional Basis**: `docs/architecture/logic-overview.md`
> **資料來源 / Data Source**: `/audit` 全鏈路架構合規性審計 (2026-03-06)
> **格式說明**: 每條目包含 [❗ 違規] [🔍 現狀] [🛠 修正方案] [📈 影響評估]

---

## 🔴 P0 — Critical (必須立即修復 / Must Fix Immediately)

---

### ISSUE-001 · D21-9 / D21-H — BBB Weight Invariant Bypass in `semantic-edge-store.ts`

**優先級**: P0 · **狀態**: OPEN · **關聯規則**: D21-9, D21-H

- **[❗ 違規]**
  D21-9 (Synaptic Weight Invariant) 規定邊的權重必須屬於 `(0.0, 1.0]`（嚴格正值，不允許為零）。
  D21-H (Blood-Brain Barrier) 規定 `invariant-guard` 模組擁有語義衝突的最終否決權。
  但 `addEdge()` 完全繞過了 `validateEdgeProposal()`，導致 BBB 形同虛設。

- **[🔍 現狀]**
  `semantic-edge-store.ts` 中的 `_clampWeight()` 函數：
  ```typescript
  function _clampWeight(weight: number): number {
    return Math.min(1.0, Math.max(0.0, weight));
    //  Math.max(0.0, weight) where weight=0 yields 0.0 — stored as valid ← violates D21-9
  }
  ```
  `addEdge()` 直接呼叫 `_clampWeight(weight)` 並存儲邊，**從未呼叫**
  `centralized-guards/semantic-guard.ts` 中的 `validateEdgeProposal()`。
  結果：傳入 `weight = 0` 時，邊被靜默存儲而非被拒絕，D21-H BBB 守衛層完全失效。

- **[🛠 修正方案]**
  **方案 A（推薦）** — 在 `addEdge()` 內建 inline 驗證，直接拋出異常：
  ```typescript
  export function addEdge(
    fromTagSlug: string, toTagSlug: string,
    relationType: SemanticRelationType, weight = 1.0
  ): SemanticEdge {
    if (weight <= 0 || weight > 1) {
      throw new Error(`[D21-9] Edge weight must be in (0.0, 1.0]; received ${weight}`);
    }
    // ... 其餘邏輯不變
  }
  ```
  **方案 B** — 讓 `addEdge()` 在存儲前呼叫 `validateEdgeProposal()`，
  並在決策為 `REJECTED` 時拋出錯誤，確保 BBB 守衛層被執行。
  同時需修正 `_clampWeight()` 的下界：從 `0.0` 改為拒絕 `<= 0` 的輸入。

- **[📈 影響評估]**
  - **直接影響**: 所有呼叫 `addEdge()` 的程式碼（`_actions.ts` 命令路徑）需補充 `weight > 0` 的輸入驗證
  - **間接影響**: `neural-network.ts` 中 Dijkstra 加權最短路徑計算：`weight = 0` 邊會導致距離計算語義錯誤，影響 VS6 排程資格查詢結果
  - **測試影響**: `semantic-guard.test.ts` 已覆蓋 guard 層，需補充 `semantic-edge-store.test.ts` 直接路徑測試

---

## 🟠 P1 — High (需在下一個 Sprint 內修復 / Fix in Next Sprint)

---

### ISSUE-002 · D21-C — `hierarchy-manager.ts` 未實作，孤立節點無法被驗證

**優先級**: P1 · **狀態**: OPEN · **關聯規則**: D21-C

- **[❗ 違規]**
  D21-C 規定每個新標籤必須透過 `hierarchy-manager.ts` 掛載到父節點，禁止孤立節點存在。
  目前 `centralized-nodes/` 目錄下完全沒有 `hierarchy-manager.ts`，D21-C 約束無法被執行。

- **[🔍 現狀]**
  `centralized-nodes/tag-entity.factory.ts` 僅包含工廠函數（TE1~TE6），
  創建出的 `TagEntity` 對象沒有任何 `parentSlug` 欄位或父節點引用。
  新建標籤可在沒有父節點的情況下被成功持久化，違反節點層次結構不變式。

- **[🛠 修正方案]**
  在 `centralized-nodes/` 建立 `hierarchy-manager.ts`：
  ```typescript
  export function mountToParent(childSlug: TagSlugRef, parentSlug: TagSlugRef): void { ... }
  export function validateNotIsolated(slug: TagSlugRef): boolean { ... }
  export function getParent(slug: TagSlugRef): TagSlugRef | null { ... }
  ```
  修改 `centralized-tag/_actions.ts` 中的 `createTag()` 命令：建立節點時必須同步呼叫 `mountToParent()`。

- **[📈 影響評估]**
  - 影響 `centralized-tag/_actions.ts` 中的所有節點創建流程
  - 需新增 `hierarchy-manager.test.ts` 單元測試
  - 可能需要 Firestore 資料補丁：為已有標籤補充 `parentSlug` 欄位

---

### ISSUE-003 · D27-A — `policy-mapper/` 未實作，`scheduling.slice` 語義感知路由缺失

**優先級**: P1 · **狀態**: OPEN · **關聯規則**: D27-A

- **[❗ 違規]**
  D27-A 規定所有排班 dispatch 必須呼叫 `policy-mapper`，禁止在代碼中硬編碼 ID 進行路由。
  `scheduling.slice/` 目錄下沒有 `policy-mapper/` 模組，語義感知排班策略無法被套用。

- **[🔍 現狀]**
  `scheduling.slice/` 現有模組：`_actions.ts`, `_aggregate.ts`, `_eligibility.ts`, `_saga.ts`。
  `_eligibility.ts` 的資格判斷邏輯可能直接使用硬編碼 ID，沒有透過 semantic-graph 進行語義路由。
  `_saga.ts` 中的 dispatch 路徑未整合 `policy-mapper`，排班決策缺乏語義依據。

- **[🛠 修正方案]**
  建立 `scheduling.slice/policy-mapper/` 模組：
  ```typescript
  export function resolveAssignmentPolicy(
    semanticContext: SemanticContext
  ): AssignmentPolicy { ... }
  export function mapToScheduleSlot(
    tagSlug: TagSlugRef, policy: AssignmentPolicy
  ): ScheduleSlot { ... }
  ```
  修改 `_saga.ts` 中的 dispatch 邏輯，透過 `policy-mapper` 解析語義路由而非直接使用 ID。

- **[📈 影響評估]**
  - 影響 `_saga.ts` 排班工作流主幹邏輯和 `_eligibility.ts` 資格路由
  - 需要與 `semantic-graph.slice/projections/graph-selectors.ts` 整合
  - 可能影響排班行事曆視圖的渲染計算路徑

---

### ISSUE-004 · D21-E — `weight-calculator.ts` 未實作，語義相似度計算無依據

**優先級**: P1 · **狀態**: OPEN · **關聯規則**: D21-E

- **[❗ 違規]**
  D21-E 規定語義相似度必須且只能由 `weight-calculator.ts` 計算，確保權重的可解釋性與一致性。
  目前 `centralized-edges/` 中只有 `semantic-edge-store.ts`，
  邊的權重完全依賴呼叫方手動傳入，沒有語義計算依據，違反透明度原則。

- **[🔍 現狀]**
  `addEdge()` 的 `weight` 參數預設為 `1.0`（直接關係），呼叫方可傳入任意值。
  沒有任何函數基於語義特徵（如標籤語義距離、共同引用頻率、層次深度差）自動計算合理權重。
  這意味著圖的邊權重在語義上是不可信的。

- **[🛠 修正方案]**
  建立 `centralized-edges/weight-calculator.ts`：
  ```typescript
  export function calculateSimilarityWeight(
    fromSlug: TagSlugRef,
    toSlug: TagSlugRef,
    relationType: SemanticRelationType
  ): number { ... }
  ```
  此函數應參考 D21-G（學習反饋迴路）讓權重根據 VS3/VS2 事實事件動態調整。

- **[📈 影響評估]**
  - 影響 `centralized-edges/semantic-edge-store.ts` 的 `addEdge()` 呼叫界面
  - 與 VS8 L6 VS8_PLAST（`centralized-learning/`）的學習模組緊密耦合（見 TD-003）
  - 此修正前，ISSUE-001 的修復（D21-9 guard）應先完成

---

### ISSUE-005 · D21-F — `context-attention.ts` 未實作，Workspace 上下文過濾缺失

**優先級**: P1 · **狀態**: OPEN · **關聯規則**: D21-F

- **[❗ 違規]**
  D21-F 規定必須有 `context-attention` 模組根據當前 Workspace 上下文過濾相關標籤，
  確保不同 Workspace 的語義查詢結果相互隔離，防止跨域語義污染。
  `centralized-neural-net/` 目錄下目前只有 `neural-network.ts`，沒有 `context-attention.ts`。

- **[🔍 現狀]**
  `neural-network.ts` 的 `computeDistance()` 與 `buildDistanceMatrix()` 在**全局語義圖**上運行，
  完全沒有 Workspace-scoped 過濾機制。
  VS4 workspace 查詢可能接收到來自其他 Workspace 的標籤節點造成的語義干擾。

- **[🛠 修正方案]**
  建立 `centralized-neural-net/context-attention.ts`：
  ```typescript
  export function filterTagsByWorkspaceContext(
    allSlugs: TagSlugRef[],
    workspaceId: string
  ): TagSlugRef[] { ... }
  ```
  在 `projections/graph-selectors.ts` 的查詢層呼叫此過濾器，確保所有外部查詢先通過上下文隔離。

- **[📈 影響評估]**
  - 影響所有透過 `_queries.ts` 讀取語義圖的下游消費者（`workspace.slice`, `scheduling.slice`）
  - 需要明確定義 Workspace 語義邊界的業務規則（是否存在全局共享標籤？）
  - 可能影響 VS6 排程資格查詢的結果集範圍

---

## 🟡 P2 — Medium (計劃修復 / Planned Fix)

---

### ISSUE-006 · D21-D — `vector-store.ts` 未實作，標籤向量一致性無法驗證

**優先級**: P2 · **狀態**: OPEN · **關聯規則**: D21-D

- **[❗ 違規]**
  D21-D 規定向量一致性追蹤由 `vector-store.ts` 負責，確保每個標籤節點的語義嵌入向量唯一且可查詢。
  `centralized-embeddings/` 目錄僅有 `embedding-port.ts`（port interface 定義），
  沒有任何實作類別，標籤向量功能完全不可用。

- **[🔍 現狀]**
  `embedding-port.ts` 定義了 `EmbeddingPort` interface，
  但整個 `centralized-embeddings/` 沒有實作此 interface 的類別或模組。
  D21-D 的向量一致性約束形同虛設，任何依賴語義向量相似度的計算無法進行。

- **[🛠 修正方案]**
  建立 `centralized-embeddings/vector-store.ts` 實作 `EmbeddingPort`：
  ```typescript
  export class VectorStore implements EmbeddingPort {
    storeEmbedding(slug: TagSlugRef, vector: number[]): void { ... }
    getEmbedding(slug: TagSlugRef): number[] | null { ... }
    computeCosineSimilarity(a: TagSlugRef, b: TagSlugRef): number { ... }
  }
  ```

- **[📈 影響評估]**
  - 目前對生產行為無影響（沒有 consumer 依賴向量功能）
  - 實作後可為 ISSUE-004（weight-calculator.ts）提供更精確的語義相似度計算基礎
  - 未來 VS8 智能標籤推薦功能的先決條件

---

### ISSUE-007 · D21-G / D21-I / D21-S — VS8 L6/L8/L10 多層 Stub，學習與治理層癱瘓

**優先級**: P2 · **狀態**: OPEN · **關聯規則**: D21-G, D21-I, D21-S

- **[❗ 違規]**
  以下 VS8 架構層共 7 個文件是純 stub，無任何可執行邏輯：
  - **L6 VS8_PLAST** (Plasticity): `centralized-learning/decay-service.ts`, `learning-engine.ts`
  - **L8 VS8_WIKI** (Wiki Governance): `wiki-editor/index.ts`, `proposal-stream/index.ts`
  - **L10 VS8_IO** (I/O Broadcast): `subscribers/lifecycle-subscriber.ts`, `outbox/tag-outbox.ts`

- **[🔍 現狀]**
  每個文件僅包含 JSDoc 標頭與 `// TODO [VS8_*]` 注釋，沒有任何業務邏輯。
  D21-G（學習反饋迴路）、D21-I（全局共識同步）、D21-S（同義詞重定向）的能力均不可用。

- **[🛠 修正方案]**
  按依賴順序逐步實作（建議拆分為獨立 tickets）：
  1. `outbox/tag-outbox.ts` — 最小 I/O 廣播（影響面小，優先啟動）
  2. `subscribers/lifecycle-subscriber.ts` — 節點生命周期事件訂閱
  3. `centralized-learning/decay-service.ts` — 邊權重衰減計算
  4. `centralized-learning/learning-engine.ts` — 學習反饋引擎（依賴 decay-service）
  5. `proposal-stream/index.ts` — 語義邊修改提案佇列
  6. `wiki-editor/index.ts` — 語義標籤治理入口（依賴 proposal-stream）

- **[📈 影響評估]**
  - 目前對生產功能無影響（未被任何 consumer 調用）
  - L10 outbox 實作後將觸發 `infra.outbox-relay` 的新事件處理路徑，需協調 infra 層更新
  - L6 learning 實作後將影響 ISSUE-004（weight-calculator）的動態更新機制

---

*最後更新: 2026-03-06 | 治理官: EAGO /audit 掃描*
