# [索引 ID: @MAP] 00 - Index (SSOT 總綱)

本文件庫為專案的 **Single Source of Truth (SSOT)**。
基於 00-LogicOverview.md 的設計原則與約定進行拆分與管理，以減輕開發時的上下文負擔。

## 系統宏觀模型

\\\	ext
[ 供給側 ]                    [ 決策側 ]                    [ 消費側 ]
VS1: Identity ───────┐      VS8: SemanticBrain ──────┐      VS6: Scheduling
                     │             │                 │             │
VS4: Organization ───┼─────▶ [ 核心處理層 ] ◀───────┴─────▶ [ 排班/產出 ]
                     │             ▲                 │             ▲
VS5: Workspace ──────┘             │                 └───────[ 財務路由: @ACT ]
                                   │
                           [ 契約層: @SK ]
\\\

## 架構指導原則：
1. **統一由上至下**：外部入口 → 閘道 → 領域 → 事件總線 → 投影 → 查詢出口
2. **SK 契約集中定義**：所有節點僅引用不重複宣告
3. **Firebase 邊界明確**：FIREBASE_ACL 為唯一 SDK 呼叫點
4. **三道閘道職責分離**：CMD（寫）/ IER（事件）/ QGWAY（讀）
5. **不變量強制引用**：所有不變量以 [#N] / [SN] / [RN] 索引
6. **Everything as a Tag**：所有領域概念以語義標籤建模，由 VS8 統一治理

## 目錄對照地圖

* **[索引 ID: @SK]** [01-SharedKernel.md](./01-SharedKernel.md) - 跨切片協議、事件信封 (SK_ENV)、S1-S6 穩定性契約
* **[索引 ID: @LYR]** [02-LayeringRules.md](./02-LayeringRules.md) - L0-L9 垂直通訊規則、D24 Firebase 邊界

### **[索引 ID: @VS] 垂直切片業務細則 (03-Slices/)**
* **[@VS-STD]** 00-Slice-Standard.md - 所有切片必須遵守的標準結構 (L2/L3/L5/L6)
* **[@VS1] VS1-Identity/** - 身份與權限
  * Auth-Flow.md - 登入流與 Session 生命周期
  * ACL-Rules.md - L7 Firebase ACL 與 RBAC 映射
* **[@VS4] VS4-Organization/** - 組織架構
  * Topology.md - 組織、部門、成員層級關係
  * Skill-Matrix.md - 成員專業技能與類別定義
* **[@VS5] VS5-Workspace/** - 工作空間與原始數據
  * Item-Lifecycle.md - 原始項目 (WorkspaceItem) 的 CRUD 邏輯
  * Document-Parser.md - 文件解析與 [#A14] 分類器接入點
* **[@VS6] VS6-Scheduling/** - 排班與任務物化 (核心)
  * Materialization.md - [D27-Gate] 物化閘門與 shouldMaterialize 邏輯
  * Timeline-Rules.md - [D27-Order] 排序不變量與 Vis-timeline 投影
  * Resource-Match.md - workspace 與 workforce 的匹配邏輯
* **[@VS8] VS8-SemanticBrain/** - 語義大腦 (系統靈魂)
  * D21-Body-8Layers.md - 語義網絡 8 層完全體結構
  * Tag-Authority.md - [D21-A] 唯一註冊律與標籤生命週期
  * Semantic-Router.md - 語義路由與語義決策邏輯

### **治理與檢查**
* **[索引 ID: @INV] 04-Invariants/** - 硬性物理定律與約束
  * R-Readability.md - [R] 唯讀與追蹤不變量 (如 R8 TraceId)
  * S-Stability.md - [S] 穩定性與冪等契約 (如 S1 Outbox)
  * A-Authority.md - [A] 權限與決策硬約束 (如 #A14 分類器)
* **[索引 ID: @ACT] 05-DecisionLogic/** - 複雜商業決策模型
  * CostClassifier.md - [#A14] 成本自動分類規則集
  * FinanceCycle.md - [#A15/16] 財務不變量、請款路由與狀態機
* **[索引 ID: @CHK]** [99-Checklist.md](./99-Checklist.md) - AI 審查清單、No-Smell 與拒絕路徑

## 跨切片權威（Cross-cutting Authorities）
- **global-search.slice**: 語義門戶（唯一跨域搜尋權威 · 對接 VS8 語義索引）。
- **notification-hub.slice**: 反應中樞（唯一副作用出口 · 標籤感知路由策略）。
- *上述兩者需有自己的 _actions.ts / _services.ts，禁止寄生於 shared-kernel [D3 D8]*
