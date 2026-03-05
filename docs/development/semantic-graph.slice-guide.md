# 🧠 VS8 · Semantic Graph — The Brain
### `docs/development/semantic-graph.slice-guide.md`
> **語義神經網絡完全體規範** · SSOT for `src/features/semantic-graph.slice/`

---

## 1. 核心定位

VS8 是全系統的「**語義真相來源 (Semantic SSOT)**」。
它透過語義神經網絡架構，將靜態的標籤轉化為具備感知、進化與執行能力的數位大腦，
並作為「**全球語義維基（Semantic Wikipedia）**」——語義的權威不來自單一管理者，
而是來自**群眾共識**與**邏輯校驗**的結合。

| 神經類比 | 技術能力 | 說明 |
|---|---|---|
| 大腦的直覺 | **Embeddings**（語義向量） | 計算標籤間的模糊相似度 |
| 注意力機制 | **Selectors**（語義選擇器） | 精確提取當前場景所需數據 |
| 神經反射鏈 | **Workflows**（語義工作流） | 語義變更自動觸發跨系統行為 |
| 學習與進化 | **Plasticity**（語義可塑性） | 根據業務結果動態調整節點權重 |
| 數位腎上腺素 | **Propagation**（語義激發） | 一個節點活化時同步喚醒關聯節點 |
| 情境專注 | **Attention**（場景過濾） | 確保大腦在特定情境下聚焦相關維度 |
| 血腦屏障 | **Blood-Brain Barrier**（邏輯守衛） | 防止非法或髒數據污染語義共識 |
| 同義詞整合 | **Synonym Merging**（同義詞併購） | 允許用戶發起合併提案，消除語義冗餘 |
| 社群驅動 | **Community Consensus**（社群共識） | 透過權重投票與邏輯校驗，決定標籤結構 |

---

## 2. 目錄結構

```
src/features/semantic-graph.slice/
├── 🧬 core/                        # 1. 語義分類層 (Classification Layer · DNA)
│   ├── constants/                  # [D21] TE1~TE6 標籤類別系統常數
│   ├── schemas/                    # 標籤元數據結構定義 (JSON Schema)
│   ├── tag-definitions.ts          # 標籤實體類別 (Tag Entity) 權威定義（含 Alias 別名表）
│   └── validator.ts                # [D21] 唯一性、非法字串引用、循環併購衝突校驗
│
├── 🧠 graph/                       # 2. 語義節點圖譜層 (Node/Graph Layer · 突觸)
│   ├── embeddings/                 # 語義向量化模組（大腦的直覺聯想）
│   │   ├── vector-store.ts         # 標籤 Embedding 向量持久化存儲
│   │   └── distance-metrics.ts     # Cosine Similarity 相似度計算工具
│   ├── causality-tracer/           # 因果追蹤器：處理標籤連鎖反應（XP → Tier）
│   ├── hierarchy-manager.ts        # 處理 Parent/Child 語義層級、拓撲遍歷與「等價關係」
│   ├── weight-calculator.ts        # 綜合 Embedding 與路徑長度的統一權重計算
│   └── adjacency-list.ts           # 語義圖譜核心內存數據結構（禁止業務端直連）
│
├── ⚡ routing/                     # 3. 語義路由層 (Routing Layer · 反射弧)
│   ├── workflows/                  # 語義連鎖反應工作流（神經反射鏈）
│   │   ├── tag-promotion-flow.ts   # 標籤晉升自動流（技術升級 → 角色異動）
│   │   └── alert-routing-flow.ts   # 異常語義自動路由（#Risk → 緊急通知）
│   ├── policy-mapper/              # 語義到動作的策略映射 [D27]
│   ├── dispatch-bridge.ts          # 跨切片橋接器（對接 VS6 排班 / VS7 通知）
│   └── context-attention.ts        # 情境注意力過濾：根據 Workspace 調整語義權重
│
├── 🛡️ guards/                      # 邏輯血腦屏障 (Blood-Brain Barrier · 完全體)
│   ├── invariant-guard.ts          # 守護 [D21~D28] 架構不變量，防止髒數據污染語義共識
│   └── staleness-monitor.ts        # [S4] 標籤新鮮度監控（TAG_STALE_GUARD ≤ 30s）
│
├── 📈 plasticity/                  # 語義可塑性 (Learning · 完全體)
│   ├── learning-engine.ts          # 根據 VS3 回饋數據動態演化標籤權重
│   └── decay-service.ts            # 遺忘機制：衰減長期未激活的語義關係
│
├── 🖼️ projections/                 # 投影層 (Read-side)
│   ├── selectors/
│   │   ├── graph-selectors.ts      # 提取標籤間的複雜聯結與聯想
│   │   └── context-selectors.ts    # 提取針對特定任務情境的語義快照
│   ├── tag-snapshot.slice.ts       # [T5] 全系統唯一合法標籤快照讀取點
│   └── search-indexer.ts           # [#A12] 為 Global Search 提供語義加權索引
│
├── 📥 subscribers/                 # 事件訂閱（感官輸入）
│   └── lifecycle-subscriber.ts     # [T1] 監聽 IER (EVENT_LANE) 標籤生命週期事件
│
├── 📤 outbox/                      # 事件發送（訊號輸出）
│   └── tag-outbox.ts               # [T4] 將語義變更廣播至 BACKGROUND_LANE
│
├── 🏛️ ui/                          # 語義維基治理介面
│   ├── wiki-editor/                # 標籤編輯器（支援「宣告為同義詞」功能）
│   ├── proposal-stream/            # 提案流：全球用戶的修改建議與投票
│   ├── relationship-visualizer/    # 圖譜畫布：可視化標籤聯結與合併狀態
│   └── consensus-engine/           # 提案邏輯校驗與共識機制
│
├── index.ts                        # 外部唯一 Entry Point (Facade)
└── semantic-graph.slice.ts         # Redux Slice：大腦狀態主邏輯
```

---

## 3. 架構不變量（Architecture Invariants）

### 第一部分 · 定義與權威 `[D21-A ~ D22]`

| 規則 | 說明 |
|---|---|
| **[D21-A] 唯一註冊律** | 任何跨領域概念（Skill / Role / Task Category）必須在 `core/tag-definitions.ts` 註冊，禁止業務切片（VS1~VS6）私自創建隱性分類 |
| **[D21-B] Schema 鎖定** | 標籤元數據必須符合 `core/schemas` 定義，禁止附加未經 `validator.ts` 校驗的非結構化屬性 |
| **[D22] 強型別引用** | 程式碼中禁止出現裸字串 `"tag_name"`，必須引用 `TE1~TE6` 常數實體，確保重構時語義鏈不斷裂 |

### 第二部分 · 聯結與直覺 `[D21-C ~ D21-E]`

| 規則 | 說明 |
|---|---|
| **[D21-C] 無孤立節點** | 每個新標籤必須透過 `hierarchy-manager.ts` 掛載至少一個父級節點，確保全局搜尋的向上追蹤性 |
| **[D21-D] 向量一致性** | `embeddings/vector-store.ts` 內的向量點位必須隨標籤定義更新同步刷新，禁止存在「語義孤島」 |
| **[D21-E] 權重透明化** | 標籤相似度計算（Cosine Similarity）與物理路徑權重必須由 `weight-calculator.ts` 統一產出，禁止業務端自行加權 |

### 第三部分 · 路由與執行 `[D27-A, D21-F]`

| 規則 | 說明 |
|---|---|
| **[D27-A] 語義感知路由** | 所有涉及「分發」的邏輯（通知、排班、核帳）必須先調用 `policy-mapper/` 轉換語義標籤，禁止基於 ID 進行硬編碼路由 |
| **[D21-F] 注意力隔離** | `context-attention.ts` 必須根據當前 Workspace 情境過濾無關標籤（排班情境下自動屏蔽財務維度語義） |

### 第四部分 · 可塑性與守衛 `[D21-G, S4, D21-H]`

| 規則 | 說明 |
|---|---|
| **[D21-G] 演化回饋環** | `learning-engine.ts` 僅能根據 VS3（Performance）或 VS2（Account）的真實事實事件進行加權，禁止手動隨機修改神經元強度 |
| **[S4] 鮮度合約** | 語義大腦反應延遲必須遵守 `TAG_STALE_GUARD`；標籤版本落後當前事件 > 30s，`invariant-guard.ts` 必須拒絕該讀取請求 |
| **[D21-H] 血腦屏障 (BBB)** | 外部 Slice 的異動請求必須通過 `subscribers/` 非同步校驗；偵測到語義衝突（同一人同時擁有互斥角色標籤）時，必須觸發 `alert-routing-flow.ts` |

### 第五部分 · 投影與查詢 `[T5, #A12]`

| 規則 | 說明 |
|---|---|
| **[T5] 快照唯讀性** | 業務 Slice 僅能訂閱 `tag-snapshot.slice.ts`，嚴禁任何業務邏輯直接存取 `adjacency-list.ts`（大腦內存圖譜） |
| **[#A12] 搜尋主權** | `search-indexer.ts` 是 Global Search 的唯一餵料口，所有標籤權重必須在此完成預計算，確保搜尋回應速度 < 200ms |

### 第六部分 · 全球語義維基治理 `[D21-I ~ D21-X]`

| 規則 | 說明 |
|---|---|
| **[D21-I] 全域共識律** | 治理頁面開放所有組織用戶共同維護；任何用戶可「提案」新增或修改標籤，但必須通過 `consensus-engine` 邏輯驗證與自動化衝突檢查 |
| **[D21-J] 知識溯源** | 每條標籤關係建立皆須標註「貢獻者」與「參考依據」，語義調整具備版本控制與回溯能力 |
| **[D21-K] 語義衝突裁決** | 用戶嘗試建立違反物理邏輯的聯結時（標籤同時掛載互斥父節點），`invariant-guard` 擁有最高裁決權，可直接攔截提案 |
| **[D21-S] 同義詞重定向** | 用戶發現 A 與 B 語義相同應發起「併購提案」而非刪除；合併後舊標籤成為「Alias」，自動重定向至主標籤，確保歷史數據不斷鏈 |
| **[D21-T] 命名共識律** | 標籤顯示名稱以「社群貢獻度最高」或「官方定義」為準，但底層 `tagSlug` 保持永久不變 |
| **[D21-U] 禁止重複定義** | 用戶新增標籤時，`embeddings` 模組必須即時提示「檢測到相似標籤」，詢問是否使用現有標籤或發起別名定義 |
| **[D21-V] 提案鎖定機制** | 處於「併購爭議中」的標籤標註為 `Pending-Sync`，路由權重保持不變直到共識完成 |
| **[D21-W] 跨組織透明性** | 標籤修改紀錄對全域公開，任何組織皆可查看標籤演化歷程 |
| **[D21-X] 語義自動激發** | 用戶手動連結 A 與 B 時，`causality-tracer` 自動偵測並建議「標籤 C 與 A 有關，是否也與 B 有關？」 |

---

## 4. 規則實踐範例（Invariant Guard Log）

> *「當一個標籤被激發，其影響力應如漣漪般擴散，但邊界必須由憲法守衛。」*

| 觸發動作 | 檢查規則 | 執行組件 | 結果 |
|---|---|---|---|
| VS5 嘗試手動增加標籤 `#VIP` | `[D21-A]` | `core/validator.ts` | ❌ REJECT（未在 VS8 定義） |
| VS3 完成任務發出 `ExpAdded` | `[D21-G]` | `plasticity/learning-engine.ts` | ✅ UPDATE WEIGHT（技能關聯強化） |
| VS6 請求排班候選人 | `[D21-F]` | `routing/context-attention.ts` | ✅ FILTERED LIST（排除非當前情境標籤） |
| 用戶提案新增標籤 `#AI_Assistant` | `[D21-I]` | `ui/consensus-engine` | ⏳ PENDING（待邏輯校驗） |
| 用戶嘗試連結 `#Urgent` → `#Archived` | `[D21-H]` | `guards/invariant-guard.ts` | ❌ REJECT（邏輯衝突） |
| 用戶提案將 `#UI` 合併至 `#Frontend` | `[D21-S]` | `ui/proposal-stream` | 🗳️ VOTE START（發起投票） |
| 用戶嘗試建立重複標籤 `#Front_End` | `[D21-U]` | `graph/embeddings` | ⚠️ PROMPT（提示已有相似標籤） |
| 投票通過，標籤合併成功 | `[D21-S]` | `routing/workflows` | 🔄 DATA MIGRATION（所有引用自動重定向） |
| 用戶嘗試將「蘋果（水果）」合併至「蘋果（科技）」 | `[D21-H]` | `guards/invariant-guard.ts` | ❌ REJECT（語義距離過遠，禁止合併） |

---

## 5. 最終結論：VS8 完全體是一套「語義法律」

VS8 的規則句確保了數位大腦：

- **不會混亂（Governance）**：因為 DNA 是唯一的
- **具備直覺（Intelligence）**：因為向量與權重會進化
- **絕對安全（Resilience）**：因為有血腦屏障守護不變量
- **消除冗餘（Coherence）**：因為同義詞併購機制讓語義殊途同歸
- **群眾智慧（Community）**：因為治理責任由全體用戶共同承擔

> 本文件為 VS8 語義中樞之唯一架構 SSOT，所有針對標籤與圖譜的實作必須嚴格遵守上述規則。

---

---

## 🗺️ Mermaid — VS8 · Semantic Graph（待併入 `logic-overview.md`）

> **索引標籤**：`[#A6 #17]` · 對應 `logic-overview.md` 中 `#A6 = CENTRALIZED_TAG_AGGREGATE 語義唯一權威` / `#17 = centralized-tag.aggregate 為 tagSlug 唯一真相`

```mermaid
flowchart TD

subgraph VS8["🧠 VS8 · Semantic Graph — The Brain"]
    direction TB

    subgraph VS8_CORE["🧬 core · 語義分類層"]
        VS8_TAGDEF["tag-definitions.ts\nTE1~TE6 · Alias\nD21-A · D22"]
        VS8_SCHEMA["schemas/\nJSON Schema · D21-B"]
        VS8_VALID["validator.ts\n格式校驗 · D21-U"]
        VS8_CONST["constants/\nTE1~TE6 實體常數"]
    end

    subgraph VS8_GRAPH["🔗 graph · 圖譜層"]
        VS8_EMB["embeddings/\nCosine Similarity · D21-D"]
        VS8_HIER["hierarchy-manager.ts\nParent/Child · D21-C"]
        VS8_CAUSE["causality-tracer/\ntraceAffectedNodes · D21-6"]
        VS8_WEIGHT["weight-calculator.ts\nEmbedding 權重 · D21-E"]
        VS8_ADJ["adjacency-list.ts\n內存圖譜 · T5"]
    end

    subgraph VS8_ROUTING["⚡ routing · 路由層"]
        VS8_WF["workflows/\ntag-promotion · alert-routing"]
        VS8_POLICY["policy-mapper/\n語義到動作 · D27-A"]
        VS8_DISPATCH["dispatch-bridge.ts\nVS6 排班 / VS7 通知"]
        VS8_ATTN["context-attention.ts\n情境過濾 · D21-F"]
    end

    subgraph VS8_GUARD["🛡️ guards · 血腦屏障"]
        VS8_INV["invariant-guard.ts\nD21 to D28 · D21-K"]
        VS8_STALE["staleness-monitor.ts\nStale 30s · S4"]
    end

    subgraph VS8_PLAST["📈 plasticity · 可塑性"]
        VS8_LEARN["learning-engine.ts\nVS3/VS2 驅動 · D21-G"]
        VS8_DECAY["decay-service.ts\n衰減未激活關係"]
    end

    subgraph VS8_PROJ["🖼️ projections · 投影層"]
        VS8_SNAP["tag-snapshot.slice.ts\nT5 · 唯一合法讀取點"]
        VS8_SEL["selectors/\ngraph · context"]
        VS8_IDX["search-indexer.ts\nA12 · 200ms"]
    end

    subgraph VS8_WIKI["🏛️ ui · 語義維基"]
        VS8_EDITOR["wiki-editor/\n同義詞宣告 · D21-S"]
        VS8_PROP["proposal-stream/\n提案投票 · D21-I"]
        VS8_VIZ["relationship-visualizer/\n圖譜畫布"]
        VS8_CONS["consensus-engine/\n共識校驗 · D21-J"]
    end

    subgraph VS8_IO["📥📤 I/O"]
        VS8_SUB["lifecycle-subscriber.ts\nT1 · IER EVENT_LANE"]
        VS8_OUT["tag-outbox.ts\nT4 · BACKGROUND_LANE"]
    end

    VS8_FACADE["index.ts · Facade"]

    VS8_CORE --> VS8_GRAPH
    VS8_GRAPH --> VS8_ROUTING
    VS8_ROUTING --> VS8_GUARD
    VS8_GUARD --> VS8_PROJ
    VS8_PLAST -->|"演化權重"| VS8_GRAPH
    VS8_WIKI -->|"提案校驗"| VS8_GUARD
    VS8_SUB -->|"TagLifecycleEvent"| VS8_CAUSE
    VS8_CAUSE -->|"下游節點"| VS8_OUT
    VS8_SNAP -.->|"T5 唯讀"| VS8_FACADE
    VS8_IDX -.->|"A12 索引"| VS8_FACADE
    VS8_LEARN -.->|"D21-G 回饋"| VS8_DECAY
    VS8_DISPATCH -.->|"D27-A"| VS8_ATTN

end

classDef coreStyle fill:#1e1b4b,stroke:#818cf8,color:#c7d2fe
classDef routeStyle fill:#1e1b4b,stroke:#f59e0b,color:#fef3c7
classDef guardStyle fill:#1e1b4b,stroke:#ef4444,color:#fee2e2
classDef plastStyle fill:#1e1b4b,stroke:#22c55e,color:#dcfce7
classDef projStyle fill:#1e1b4b,stroke:#38bdf8,color:#e0f2fe
classDef wikiStyle fill:#1e1b4b,stroke:#a78bfa,color:#ede9fe
classDef ioStyle fill:#1e1b4b,stroke:#94a3b8,color:#e2e8f0
classDef facadeStyle fill:#312e81,stroke:#6366f1,color:#e0e7ff

class VS8_TAGDEF,VS8_SCHEMA,VS8_VALID,VS8_CONST coreStyle
class VS8_EMB,VS8_HIER,VS8_CAUSE,VS8_WEIGHT,VS8_ADJ coreStyle
class VS8_WF,VS8_POLICY,VS8_DISPATCH,VS8_ATTN routeStyle
class VS8_INV,VS8_STALE guardStyle
class VS8_LEARN,VS8_DECAY plastStyle
class VS8_SNAP,VS8_SEL,VS8_IDX projStyle
class VS8_EDITOR,VS8_PROP,VS8_VIZ,VS8_CONS wikiStyle
class VS8_SUB,VS8_OUT ioStyle
class VS8_FACADE facadeStyle
```
