# [索引 ID: @VS8-D21] D21-Body-8Layers

語義大腦完全體，由上至下分成三大區塊、8個特化網路：

## ① 第一領域 Semantic Governance
* **1.1 guards (血腦屏障 BBB) [D21-H, D21-K]**
  - \invariant-guard.ts\：處理最高裁決，具備衝突提案攔截能力。
  - \staleness-monitor.ts\：保證 TAG 快取的新鮮度 [S4, D21-8]。
* **1.2 wiki (語義治理) [D21-I~W]**
  - \wiki-editor\ 與 \proposal-stream\ 負責知識溯源與全區審核。
  - \consensus-engine\：保證全域共識律 [D21-I]。

## ② 第二領域 Semantic Neural Core
* **2.1 core (DNA 定義層) [D21-A~D]**
  - 統一匯集點，管理 \centralized-tag.aggregate\。
  - 保證每項節點有 \parentTagSlug\ [D21-C]。
* **2.2 graph (突觸聯接層) [D21-E~F]**
  - 邊操作入口 \semantic-edge-store.ts\：限定 weight ∈ [0,1]。
  - \weight-calculator.ts\：禁止外部自行加權。
* **2.3 neural (計算預測層) [D21-X]**
  - \causality-tracer\ 負責 BFS 動態預測傳播 [D21-6]。
* **2.4 routing (決策分發層) [D27-A]**
  - 語義到領域策略的反射中樞 (禁止硬編碼業務 ID)。
* **2.5 plasticity (可塑學習層) [D21-G]**
  - 依賴業務事實事件 (不接受隨機干預修改)。

## ③ 第三領域 Semantic Projection
* **3.1 projections (查詢輸出層) [D21-7, T5]**
  - 用戶與切片唯一的合法讀取點 \projection.tag-snapshot.slice.ts\。
* **3.2 io (訂閱廣播通知)**
  - \TagLifecycleEvent\ 背景同步分發出口 [S1]。
* **3.3 decision (領域特殊決策提供) [D8, D27]**
  - 如財務向成本分類邏輯 (\_cost-classifier\) 被打包並輸出給外部層。
