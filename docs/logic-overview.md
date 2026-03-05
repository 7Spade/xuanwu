%%  ╔══════════════════════════════════════════════════════════════════════════╗
%%  ║  LOGIC OVERVIEW v2 — ARCHITECTURE SSOT                                ║
%%  ║  設計原則：                                                              ║
%%  ║    ① 統一由上至下：外部入口 → 閘道 → 領域 → 事件總線 → 投影 → 查詢出口  ║
%%  ║    ② SK 契約集中定義，所有節點僅引用不重複宣告                           ║
%%  ║    ③ Firebase 邊界明確：FIREBASE_ACL 為唯一 SDK 呼叫點                   ║
%%  ║    ④ 三道閘道職責分離：CMD（寫）/ IER（事件）/ QGWAY（讀）               ║
%%  ║    ⑤ 所有不變量以 [#N] / [SN] / [RN] 行內索引，完整定義於文末            ║
%%  ║    ⑥ Everything as a Tag：所有領域概念以語義標籤建模，由 VS8 統一治理      ║
%%  ╠══════════════════════════════════════════════════════════════════════════╣
%%  SSOT Mapping:
%%    Architecture rules       → docs/logic-overview.md  ← THIS FILE
%%    Semantic relations       → docs/knowledge-graph.json
%%    VS8 complete-body guide  → docs/development/semantic-graph.slice-guide.md  (companion spec)
%%  ╠══════════════════════════════════════════════════════════════════════════╣
%%  QUICK REFERENCE（快速索引 — 最速取得上下文）
%%  ── Vertical Slice（業務域 · VS0–VS8）──
%%    VS0=SharedKernel  VS1=Identity   VS2=Account      VS3=Skill
%%    VS4=Organization  VS5=Workspace  VS6=Scheduling   VS7=Notification
%%    VS8=SemanticGraph(The Brain)
%%    ※ L5(ProjectionBus) 與 L9(Observability) 為 Infrastructure，不佔用 VS 編號
%%  ── Cross-cutting Authorities（跨切片權威）──
%%    global-search.slice  = 語義門戶（唯一跨域搜尋權威 · 對接 VS8 語義索引）
%%    notification-hub     = 反應中樞（VS7 增強 · 唯一副作用出口 · 標籤感知路由）
%%    ※ 兩者皆須擁有自己的 _actions.ts / _services.ts，不得寄生於 shared-kernel [D3 D8]
%%  ── Layer（系統層）──
%%    L0=ExternalTriggers   L1=SharedKernel       L2=CommandGateway
%%    L3=DomainSlices       L4=IER                L5=ProjectionBus
%%    L6=QueryGateway       L7=FirebaseACL         L8=FirebaseInfra      L9=Observability
%%    ※ L3 Domain Slices = VS1(Identity) · VS2(Account) · VS3(Skill) ·
%%                          VS4(Organization) · VS5(Workspace) · VS6(Scheduling) ·
%%                          VS7(Notification) · VS8(SemanticGraph)
%%  ── Hard Invariants（不可違反）: R · S · A · # ──
%%    R1=relay-lag-metrics   R5=DLQ-failure-rule   R6=workflow-state-rule
%%    R7=aggVersion-relay    R8=traceId-readonly
%%    S1=OUTBOX-contract     S2=VersionGuard       S3=ReadConsistency
%%    S4=Staleness-SLA       S5=Resilience         S6=TokenRefresh
%%    A3=workflow-blockedBy  A5=scheduling-saga    A8=1cmd-1agg
%%    A9=scope-guard         A10=notification-stateless
%%    A12=global-search-authority   A13=notification-hub-authority
%%  ── Governance Rules（可演化治理）: D · P · T · E ──
%%    D7=cross-slice-index-only   D24=no-firebase-import D26=cross-cutting-authority
%%    D27=cost-semantic-routing   D27-A=semantic-aware-routing-policy   D22=strong-typed-tag-ref
%%    D21=VS8-semantic-graph-complete-body（8層完全體 D21-1~D21-10 + D21-A~D21-X）
%%    D21-1=semantic-uniqueness(→D21-A)   D21-2=strong-typed-tags(→D22)  D21-3=node-connectivity(→D21-C)
%%    D21-4=aggregate-constraint          D21-5=semantic-aware-routing(→D27-A)
%%    D21-6=causal-auto-trigger           D21-7=read-write-separation    D21-8=freshness-defense(→S4)
%%    D21-9=synaptic-weight-invariant     D21-10=topology-observability
%%    D21-A=唯一註冊律   D21-B=Schema鎖定   D21-C=無孤立節點    D21-D=向量一致性  D21-E=權重透明化
%%    D21-F=注意力隔離   D21-G=演化回饋環   D21-H=血腦屏障BBB   D21-I=全域共識律  D21-J=知識溯源
%%    D21-K=語義衝突裁決 D21-S=同義詞重定向 D21-T=命名共識律    D21-U=禁止重複定義
%%    D21-V=提案鎖定機制 D21-W=跨組織透明性 D21-X=語義自動激發
%%    D22=強型別引用   D27-A=語義感知路由
%%    P1=IER-lane-priority        P4=eligibility-query   P5=projection-funnel
%%    T1=tag-lifecycle-sub        T3=eligible-tag-logic  T5=tag-snapshot-readonly
%%    E2=OrgContextProvisioned    E3=ScheduleAssigned    E5=ws-event-flow   E6=claims-refresh
%%  ╠══════════════════════════════════════════════════════════════════════════╣
%%  KEY INVARIANTS（絕對遵守）:
%%    [R8]  traceId 在 CBG_ENTRY 注入一次，全鏈唯讀不可覆蓋
%%    [S2]  所有 Projection 寫入前必須呼叫 applyVersionGuard()
%%    [S4]  SLA 數值只能引用 SK_STALENESS_CONTRACT，禁止硬寫
%%    [D7]  跨切片引用只能透過 {slice}/index.ts 公開 API
%%    [D21] VS8 語義神經網絡完全體（8層）：core(DNA) → graph(突觸) → routing(反射弧) → guards(BBB)
%%           → plasticity(學習) → projections(讀側) → ui(維基治理) → io(訂閱廣播)
%%    [D21-A] 唯一註冊律：跨領域概念必須在 core/tag-definitions.ts 註冊，禁止業務切片私自創建隱性分類
%%    [D21-B] Schema 鎖定：標籤元數據必須符合 core/schemas，禁止附加未校驗的非結構化屬性
%%    [D21-C] 無孤立節點：每個新標籤必須透過 hierarchy-manager.ts 掛載至少一個父級節點
%%    [D21-D] 向量一致性：embeddings/vector-store.ts 向量必須隨標籤定義同步刷新
%%    [D21-E] 權重透明化：語義相似度與路徑權重必須由 weight-calculator.ts 統一產出，禁止業務端自行加權
%%    [D21-F] 注意力隔離：context-attention.ts 須根據 Workspace 情境過濾無關標籤
%%    [D21-G] 演化回饋環：learning-engine.ts 僅能由 VS3/VS2 真實事實事件驅動，禁止手動隨機修改
%%    [D21-H] 血腦屏障(BBB)：invariant-guard.ts 對語義衝突擁有最高裁決權，可直接攔截提案
%%    [D21-I] 全域共識律：標籤治理開放全部組織用戶提案，必須通過 consensus-engine 邏輯校驗
%%    [D21-J] 知識溯源：每條標籤關係建立須標註貢獻者與參考依據，具備版本回溯能力
%%    [D21-K] 語義衝突裁決：invariant-guard 偵測到違反物理邏輯的聯結時直接拒絕提案
%%    [D21-S] 同義詞重定向：標籤合併後舊標籤成為 Alias，自動重定向至主標籤，歷史數據不斷鏈
%%    [D21-T] 命名共識律：顯示名稱由社群貢獻度決定，tagSlug 永久不變
%%    [D21-U] 禁止重複定義：新增標籤時 embeddings 必須即時提示相似標籤
%%    [D21-V] 提案鎖定：處於「併購爭議中」的標籤標註 Pending-Sync，路由權重凍結直到共識完成
%%    [D21-W] 跨組織透明性：標籤修改紀錄對全域公開，任何組織可查看演化歷程
%%    [D21-X] 語義自動激發：用戶連結 A+B 時 causality-tracer 自動建議相關標籤 C
%%    [D21-6] TagLifecycleEvent → VS8 Causality Tracer 自動推導受影響節點並發布更新事件
%%    [D21-7] 語義讀取必須經由 projection.tag-snapshot，寫入必須經 CMD_GWAY 進入 VS8 CTA
%%    [D21-8] TAG_STALE_GUARD ≤ 30s，所有語義查詢必須引用 SK_STALENESS_CONTRACT
%%    [D21-9] 突觸權重不變量：SemanticEdge.weight ∈ [0.0, 1.0]；cost = 1/weight（強連結=近鄰）
%%    [D21-10] 拓撲可觀測性：findIsolatedNodes 必須定期回報孤立節點（D21-3 違規偵測）
%%    [T5] 業務 Slice 僅能訂閱 projections/tag-snapshot.slice.ts，嚴禁直接存取 graph/adjacency-list.ts
%%    [D22] 程式碼禁止出現裸字串 tag_name，必須引用 TE1~TE6 常數實體確保重構時語義鏈不斷裂
%%    [D27-A] 語義感知路由：所有分發邏輯必須先調用 policy-mapper/ 轉換語義標籤，禁止 ID 硬編碼路由
%%    [D24] Feature slice 禁止直接 import firebase/*，必須走 SK_PORTS
%%    [D26] global-search = 唯一搜尋權威；notification-hub = 唯一副作用出口
%%    [#A12] Global Search = 唯一跨域搜尋出口，禁止各 Slice 自建搜尋邏輯
%%    [#A13] Notification Hub = 唯一副作用出口，業務 Slice 只產生事件不決定通知策略
%%    [#A14] ParsedLineItem.costItemType (Layer-2) 由 VS8 _cost-classifier.ts 標注；
%%           Layer-3 Semantic Router 只允許 EXECUTABLE 項目物化為 tasks，
%%           其餘類型（MANAGEMENT/RESOURCE/FINANCIAL/PROFIT/ALLOWANCE）靜默跳過並 toast
%%  FORBIDDEN:
%%    BC_X 禁止直接寫入 BC_Y aggregate → 必須透過 IER Domain Event
%%    TX Runner 禁止產生 Domain Event → 只有 Aggregate 可以 [#4b]
%%    SECURITY_BLOCK DLQ → 禁止自動 Replay，必須人工審查
%%    B-track 禁止回呼 A-track → 只能透過 Domain Event 溝通
%%    Feature slice 禁止直接 import firebase/* [D24]
%%    Feature slice 禁止自建搜尋邏輯，必須透過 Global Search [D26 #A12]
%%    Feature slice 禁止直接 call sendEmail/push/SMS，必須透過 Notification Hub [D26 #A13]
%%    VS5 document-parser 禁止自行實作成本語義邏輯，必須呼叫 VS8 classifyCostItem() [D27 #A14]
%%    Layer-3 Semantic Router 禁止繞過 costItemType 直接物化非 EXECUTABLE 項目為 tasks [D27]
%%    業務切片（VS1~VS6）禁止私自宣告語義類別，必須透過 VS8 CTA [D21-1]
%%    禁止使用隱性字串傳遞語義，所有引用必須指向 TE1~TE6 有效 tagSlug [D21-2]
%%    孤立標籤（無 parentTagSlug 歸屬）禁止在系統中存在，須歸入分類學 [D21-3]
%%    跨切片決策（排班路由/通知分發）禁止硬編碼業務對象 ID，必須基於標籤語義權重 [D21-5]
%%    語義讀取禁止直連資料庫，必須經由 projection.tag-snapshot [D21-7]
%%    業務端禁止直接存取 graph/adjacency-list.ts，必須透過 tag-snapshot [T5]
%%    業務端禁止自行計算語義相似度/加權，必須透過 weight-calculator.ts [D21-E]
%%    通知/排班分發禁止基於業務 ID 硬編碼路由，必須走 policy-mapper/ 語義映射 [D27-A]
%%    learning-engine.ts 禁止手動隨機修改神經元強度，必須由 VS3/VS2 事實事件驅動 [D21-G]
%%    語義衝突提案禁止繞過 invariant-guard.ts，BBB 擁有最高裁決權 [D21-H D21-K]
%%    合併提案通過後禁止直接刪除舊標籤，必須轉為 Alias 自動重定向歷史引用 [D21-S]
%%    用戶新增重複語義標籤時禁止靜默建立，embeddings 必須即時提示相似標籤 [D21-U]
%%  ╚══════════════════════════════════════════════════════════════════════════╝

flowchart TD

%% ═══════════════════════════════════════════════════════════════
%% LAYER 0 ── EXTERNAL TRIGGERS（外部觸發入口）
%% ═══════════════════════════════════════════════════════════════

subgraph EXT["🌐 L0 · External Triggers"]
    direction LR
    EXT_CLIENT["Next.js Client\n_actions.ts [S5]"]
    EXT_AUTH["Firebase Auth\n登入 / 註冊 / Token"]
    EXT_WEBHOOK["Webhook / Edge Fn\n[S5] 遵守 SK_RESILIENCE_CONTRACT"]
end

%% ═══════════════════════════════════════════════════════════════
%% LAYER 1 ── SHARED KERNEL（共用核心契約）
%% ═══════════════════════════════════════════════════════════════

subgraph SK["🔷 L1 · Shared Kernel — 全域契約中心（VS0）"]
    direction TB

    subgraph SK_DATA["📄 基礎資料契約 [#8]"]
        direction LR
        SK_ENV["event-envelope\nversion · traceId · causationId · correlationId · timestamp\nidempotency-key = eventId+aggId+version\n[R8] traceId 整鏈共享・不可覆蓋\ncausationId = 觸發此事件的命令/事件 ID\ncorrelationId = 同一 saga/replay 的關聯 ID"]
        SK_AUTH_SNAP["authority-snapshot\nclaims / roles / scopes\nTTL = Token 有效期"]
        SK_SKILL_TIER["skill-tier（純函式）\ngetTier(xp)→Tier\n永不存 DB [#12]"]
        SK_SKILL_REQ["skill-requirement\ntagSlug × minXp\n跨片人力需求契約"]
        SK_CMD_RESULT["command-result-contract\nSuccess { aggregateId, version }\nFailure { DomainError }\n前端樂觀更新依據"]
    end

    subgraph SK_INFRA["⚙️ 基礎設施行為契約 [#8]"]
        direction LR

        SK_OUTBOX["📦 SK_OUTBOX_CONTRACT [S1]\n① at-least-once\n   EventBus → OUTBOX → RELAY → IER\n② idempotency-key 必帶\n   格式：eventId+aggId+version\n③ DLQ 分級宣告（每 OUTBOX 必填）\n   SAFE_AUTO      冪等事件・自動重試\n   REVIEW_REQUIRED 金融/排班/角色・人工審\n   SECURITY_BLOCK  安全事件・凍結+告警"]

        SK_VERSION["🔢 SK_VERSION_GUARD [S2]\nevent.aggregateVersion\n  > view.lastProcessedVersion → 允許更新\n  否則 → 丟棄（過期事件不覆蓋）\n適用全部 Projection [#19]"]

        SK_READ["📖 SK_READ_CONSISTENCY [S3]\nSTRONG_READ  → Aggregate 回源\n  適用：金融・安全・不可逆\nEVENTUAL_READ → Projection\n  適用：顯示・統計・列表\n規則：餘額/授權/排班衝突 → STRONG_READ"]

        SK_STALE["⏱ SK_STALENESS_CONTRACT [S4]\nTAG_MAX_STALENESS    ≤ 30s\nPROJ_STALE_CRITICAL  ≤ 500ms\nPROJ_STALE_STANDARD  ≤ 10s\n各節點引用此常數・禁止硬寫數值"]

        SK_RESILIENCE["🛡 SK_RESILIENCE_CONTRACT [S5]\nR1 rate-limit   per user ∪ per org → 429\nR2 circuit-break 連續 5xx → 熔斷\nR3 bulkhead     切片隔板・獨立執行緒池\n適用：_actions.ts / Webhook / Edge Function"]

        SK_TOKEN["🔄 SK_TOKEN_REFRESH_CONTRACT [S6]\n觸發：RoleChanged | PolicyChanged\n  → IER CRITICAL_LANE → CLAIMS_HANDLER\n完成：TOKEN_REFRESH_SIGNAL\n客端義務：強制重取 Firebase Token\n失敗：→ DLQ SECURITY_BLOCK + 告警"]
    end

    subgraph SK_PORTS["🔌 Infrastructure Ports（依賴倒置介面）[D24]"]
        direction LR
        I_AUTH["IAuthService\n身份驗證 Port"]
        I_REPO["IFirestoreRepo\nFirestore 存取 Port [S2]"]
        I_MSG["IMessaging\n訊息推播 Port [R8]"]
        I_STORE["IFileStore\n檔案儲存 Port"]
    end
end

%% ─── VS8 Semantic Graph（語義神經網絡完全體 · The Brain）
%% ─── 8層完全體架構（from semantic-graph.slice-guide.md）：
%% ───   L1 VS8_CORE  — 神經元 DNA 定義層   · core/tag-definitions · schemas · hierarchy-manager · vector-store    [D21-A D21-B D21-C D21-D]
%% ───   L2 VS8_GRAPH — 語義突觸層          · semantic-edge-store · weight-calculator · context-attention · adjacency-list [D21-E D21-F D21-9 D21-10]
%% ───   L3 VS8_NG    — 語義計算層          · Dijkstra 前向傳播 + BFS 因果注意力                                     [D21-4 D21-6 D21-X]
%% ───   L4 VS8_ROUT  — 語義反射弧層        · workflows · policy-mapper · dispatch-bridge                          [D21-5 D27-A]
%% ───   L5 VS8_GUARD — 血腦屏障(BBB)層    · invariant-guard · staleness-monitor                                  [D21-H D21-K S4]
%% ───   L6 VS8_PLAST — 語義可塑性層        · learning-engine · decay-service                                      [D21-G]
%% ───   L7 VS8_PROJ  — 語義投影讀取層      · projections/tag-snapshot · graph-selectors · context-selectors      [D21-7 T5]
%% ───   L8 VS8_WIKI  — 語義維基治理層 🏛️   · wiki-editor · proposal-stream · relationship-visualizer · consensus-engine [D21-I~W]
%% ───   L9 VS8_IO    — 語義訂閱廣播層      · subscribers/lifecycle-subscriber · outbox/tag-outbox                [D21-6 S1]
%% ─── 向下相容：VS8_CL ≡ L1 core, VS8_SL ≡ L2 graph, VS8_NG ≡ L3 neural-computation, VS8_RL ≡ L4 routing
%% ─── centralized-tag.aggregate 具備 lifecycle，為 domain authority [#A6 #17]
subgraph VS8["🧠 VS8 · Semantic Graph — The Brain [#A6 #17]（8層語義神經網路完全體）"]
    direction TB

    subgraph VS8_CL["① 🧬 神經元 DNA 定義層 VS8_CORE — 語義字典・定義權威 [D21-A D21-B D21-C D21-D]"]
        direction LR
        CTA["centralized-tag.aggregate (CTA)\n【全域語義字典・唯一真相】\ntagSlug / label / category\ndeprecatedAt / deleteRule\n生命週期守護：Draft→Active→Stale→Deprecated [D21-4]"]
        HIER["hierarchy-manager.ts\n確保每個新標籤掛載至少一個父節點 [D21-C]"]
        VEC["embeddings/vector-store.ts\n向量隨標籤定義同步刷新 [D21-D]"]
        subgraph TAG_ENTS["🏷️ AI-ready Semantic Tag Entities (TE1~TE6) [D21-A]"]
            direction LR
            TE_UL["TE3 · tag::user-level\ncategory: user_level"]
            TE_SK["TE1 · tag::skill\ncategory: skill"]
            TE_ST["TE2 · tag::skill-tier\ncategory: skill_tier"]
            TE_TM["TE5 · tag::team\ncategory: team"]
            TE_RL["TE4 · tag::role\ncategory: role"]
            TE_PT["TE6 · tag::partner\ncategory: partner"]
        end
        CTA --> TAG_ENTS
        CTA --> HIER
        CTA -.-> VEC
    end

    subgraph VS8_SL["② ⚡ 語義突觸層 VS8_GRAPH — 加權邊圖・網路拓撲 [D21-E D21-F D21-9 D21-10]"]
        direction LR
        EDGE_STORE["semantic-edge-store.ts\n【突觸登錄中心 · 唯一邊圖操作點】\nIS_A / REQUIRES 加權邊 weight ∈ [0,1] [D21-9]\ncost = 1/weight（強連結=近鄰）"]
        WT_CALC["weight-calculator.ts\n【語義相似度統一出口 · 禁止業務端自行加權】\ncomputeSimilarity(a,b) [D21-E]"]
        CTX_ATTN["context-attention.ts\n【Workspace 情境過濾 · 注意力隔離】\nfilterByContext(slugs, wsCtx) [D21-F]"]
        TOPO_OPS["adjacency-list.ts\n拓撲閉包計算（禁止業務端直連 [T5]）\nisSupersetOf / getTransitiveRequirements [D21-10]"]
        EDGE_STORE -.-> WT_CALC
        EDGE_STORE -.-> TOPO_OPS
    end

    subgraph VS8_NG["③ 🔗 語義計算層 VS8_NG — 前向傳播 + 因果注意力 [D21-4 D21-6 D21-X]"]
        direction LR
        NEURAL_NET["🧬 Neural Network [D21-3 D21-4]\ncomputeSemanticDistance(a,b)\nfindIsolatedNodes(slugs[]) [D21-10]\nDijkstra 加權最短路徑"]
        CAUSALITY["🔍 Causality Tracer [D21-6 D21-X]\ntraceAffectedNodes(event, candidates[])\nbuildCausalityChain(event, candidates[])\nBFS 因果傳播 · 語義自動激發"]
        TAG_EV["TagLifecycleEvent（in-process）\neventType: TAG_CREATED | TAG_ACTIVATED\n         | TAG_DEPRECATED | TAG_STALE_FLAGGED\n         | TAG_DELETED\n[D21-6] 因果自動觸發"]
        TAG_OB["tag-outbox\n[SK_OUTBOX: SAFE_AUTO]"]
        TAG_SG["⚠️ TAG_STALE_GUARD\n[S4 D21-8: TAG_MAX_STALENESS ≤ 30s]"]
        NEURAL_NET -.->|"語義距離 [D21-4]"| CAUSALITY
        CAUSALITY -->|"TagLifecycleEvent [D21-6]"| TAG_EV
        TAG_EV --> TAG_OB
        CAUSALITY -.->|"廢棄感知 [D21-8]"| TAG_SG
    end

    subgraph VS8_ROUT["④ 🚦 語義反射弧層 VS8_ROUTING — 策略映射・分發橋接 [D21-5 D27-A]"]
        direction LR
        POLICY_MAP["policy-mapper/\n語義標籤→分發策略 [D27-A]\n禁止 ID 硬編碼路由"]
        DISPATCH["dispatch-bridge/\n排班路由 · 通知分發出口"]
        subgraph WORKFLOWS["workflows/"]
            direction LR
            TAG_PROMO["tag-promotion-flow.ts\n標籤晉升流程"]
            ALERT_FLOW["alert-routing-flow.ts\n告警路由流程"]
        end
        POLICY_MAP --> DISPATCH
    end

    subgraph VS8_GUARD["⑤ 🛡️ 血腦屏障層 VS8_BBB — 語義完整性守護 [D21-H D21-K S4]"]
        direction LR
        INV_GUARD["invariant-guard.ts\n【最高裁決權 · 語義衝突直接拒絕】\n違反物理邏輯聯結 → 攔截提案 [D21-H D21-K]"]
        STALE_MON["staleness-monitor.ts\nTAG_MAX_STALENESS ≤ 30s [S4 D21-8]"]
    end

    subgraph VS8_PLAST["⑥ 🌱 語義可塑性層 VS8_PLAST — 演化學習 [D21-G]"]
        direction LR
        LEARN["learning-engine.ts\n【僅 VS3/VS2 事實事件驅動 · 禁止手動隨機修改】\n加權演化回饋環 [D21-G]"]
        DECAY["decay-service.ts\n語義強度自然衰退"]
        LEARN -.-> DECAY
    end

    subgraph VS8_PROJ["⑦ 📊 語義投影讀取層 VS8_PROJ — 唯讀出口 [D21-7 T5]"]
        direction LR
        TAG_RO["projections/tag-snapshot.slice.ts\n【業務端唯一合法讀取出口 · T5】\n[D21-7] 讀取必須經 projection.tag-snapshot\nT1 新切片訂閱事件即可擴展"]
        GRAPH_SEL["projections/graph-selectors.ts\n圖結構唯讀查詢"]
        CTX_SEL["projections/context-selectors.ts\nWorkspace 語義上下文"]
        TAG_RO -.-> GRAPH_SEL
        TAG_RO -.-> CTX_SEL
    end

    subgraph VS8_WIKI["⑧ 🏛️ 語義維基治理層 VS8_WIKI — 知識治理協作 [D21-I~W]"]
        direction LR
        WIKI_ED["wiki-editor/\n標籤定義編輯 [D21-J]"]
        PROP_STREAM["proposal-stream/\n提案審議串流 [D21-I D21-V]"]
        REL_VIS["relationship-visualizer/\n語義關係圖視覺化"]
        CONS_ENG["consensus-engine/\n全域共識校驗 [D21-I D21-K]"]
        PROP_STREAM -->|"提案送驗"| CONS_ENG
    end

    subgraph VS8_RL["⑨ 💰 語義決策輸出層 VS8_RL — 成本路由執行代理 [D21-5 D8]"]
        direction LR
        subgraph COST_CLASS["📊 成本語義分類器 [D8][D24][D27]"]
            direction LR
            COST_CLASSIFIER["_cost-classifier.ts（純函式 [D8]）\nclassifyCostItem(name) → CostItemType\nshouldMaterializeAsTask(type) → boolean  ★[D27]\n──────────────────────────────\nEXECUTABLE  物理施工任務（預設出口）\nMANAGEMENT  行政/品管/職安管理（含 QC Inspection）\nRESOURCE    倉儲/人力資源儲備\nFINANCIAL   付款里程碑/預付款\nPROFIT      利潤項目（利潤）\nALLOWANCE   耗材/差旅/運輸補貼（含差旅、運輸）\n──────────────────────────────\n★ EXECUTABLE override 優先：機電檢測/qc test 等施工測試→EXECUTABLE\n禁止 Firestore 存取・禁止 async\n可在任意 Layer 安全呼叫 [D8]"]
        end
    end

    subgraph VS8_IO["⑩ 📡 語義訂閱廣播層 VS8_IO — 事件進出口 [D21-6 S1]"]
        direction LR
        LIFECYCLE_SUB["subscribers/lifecycle-subscriber.ts\n標籤生命週期事件訂閱"]
        TAG_OUTBOX["outbox/tag-outbox.ts\n[SK_OUTBOX: SAFE_AUTO]\n標籤異動廣播出口"]
    end

    VS8_CL -->|"神經元激活信號 · 標籤異動廣播 [D21-6]"| VS8_SL
    VS8_SL -->|"突觸拓撲輸入 [D21-3 D21-9]"| VS8_NG
    VS8_GUARD -.->|"守護校驗 [D21-H]"| VS8_WIKI
    VS8_NG -.->|"因果計算 [D21-5]"| VS8_ROUT
    VS8_NG -.->|"事件廣播 [D21-6]"| VS8_IO
    VS8_PLAST -.->|"權重回饋 [D21-G]"| VS8_SL
    VS8_PROJ -.->|"唯讀服務 [T5]"| VS8_ROUT
    CTA -.->|"唯讀引用契約 [D21-7]"| TAG_RO
    CTA -.->|"Deprecated 通知 [D21-8]"| TAG_SG
    VS8_NG -.->|"語義路由授權 [D21-5]"| VS8_RL
    INV_GUARD -.->|"提案裁決 [D21-H]"| CONS_ENG
end

%% ═══════════════════════════════════════════════════════════════
%% LAYER 2 ── COMMAND GATEWAY（統一寫入閘道）
%% ═══════════════════════════════════════════════════════════════

subgraph GW_CMD["🔵 L2 · Command Gateway（統一寫入入口）"]
    direction LR

    subgraph GW_GUARD["🛡️ 入口防護層 [S5]"]
        RATE_LIM["rate-limiter\nper user / per org\n429 + retry-after"]
        CIRCUIT["circuit-breaker\n5xx → 熔斷 / 半開探針恢復"]
        BULKHEAD["bulkhead-router\n切片隔板・獨立執行緒池"]
        RATE_LIM --> CIRCUIT --> BULKHEAD
    end

    subgraph GW_PIPE["⚙️ Command Pipeline"]
        CBG_ENTRY["unified-command-gateway\n[R8] TraceID 注入（唯一注入點）\n→ event-envelope.traceId"]
        CBG_AUTH["authority-interceptor\nAuthoritySnapshot [#A9]\n衝突以 ACTIVE_CTX 為準"]
        CBG_ROUTE["command-router\n路由至對應切片\n回傳 SK_CMD_RESULT"]
        CBG_ENTRY --> CBG_AUTH --> CBG_ROUTE
    end

    BULKHEAD --> CBG_ENTRY
end

%% ═══════════════════════════════════════════════════════════════
%% LAYER 3 ── L3 · Domain Slices（領域切片 · VS1–VS8）
%% ── VS1=Identity · VS2=Account · VS3=Skill · VS4=Organization
%% ── VS5=Workspace · VS6=Scheduling · VS7=Notification
%% ── VS8=Semantic Graph (The Brain)
%% ═══════════════════════════════════════════════════════════════

%% ── VS1 Identity ──
subgraph VS1["🟦 VS1 · Identity Slice（身份驗證）"]
    direction TB

    AUTH_ID["authenticated-identity"]
    ID_LINK["account-identity-link\nfirebaseUserId ↔ accountId"]

    subgraph VS1_CTX["⚙️ Context Lifecycle"]
        ACTIVE_CTX["active-account-context\nTTL = Token 有效期"]
        CTX_MGR["context-lifecycle-manager\n建立：Login\n刷新：OrgSwitched / WorkspaceSwitched\n失效：TokenExpired / Logout"]
        CTX_MGR --> ACTIVE_CTX
    end

    subgraph VS1_CLAIMS["📤 Claims Management [S6]"]
        CLAIMS_H["claims-refresh-handler\n唯一刷新觸發點 [E6]\n規範 → [SK_TOKEN_REFRESH_CONTRACT]"]
        CUSTOM_C["custom-claims\n快照聲明 [#5]\nTTL = Token 有效期"]
        TOKEN_SIG["token-refresh-signal\nClaims 設定完成後發出 [S6]"]
        CLAIMS_H --> CUSTOM_C
        CLAIMS_H -->|"Claims 設定完成"| TOKEN_SIG
    end

    EXT_AUTH --> AUTH_ID --> ID_LINK --> CTX_MGR
    AUTH_ID -->|"登入觸發"| CLAIMS_H
end

CUSTOM_C -.->|"快照契約 + TTL"| SK_AUTH_SNAP
AUTH_ID -.->|"uses IAuthService"| I_AUTH

%% ── VS2 Account ──
subgraph VS2["🟩 VS2 · Account Slice（帳號主體）"]
    direction TB

    subgraph VS2_USER["👤 個人帳號域"]
        USER_AGG["user-account.aggregate"]
        WALLET_AGG["wallet.aggregate\n強一致帳本 [#A1]\n[S3: STRONG_READ]"]
        PROFILE["account.profile\nFCM Token（弱一致）"]
    end

    subgraph VS2_ORG["🏢 組織帳號域"]
        ORG_ACC["organization-account.aggregate"]
        ORG_SETT["org-account.settings"]
        ORG_BIND["org-account.binding\nACL 防腐對接 [#A2]"]
    end

    subgraph VS2_GOV["🛡️ 帳號治理域"]
        ACC_ROLE["account-governance.role\n→ tag::role [TE_RL]"]
        ACC_POL["account-governance.policy"]
    end

    subgraph VS2_EV["📢 Account Events + Outbox [S1]"]
        ACC_EBUS["account-event-bus（in-process）\nAccountCreated / RoleChanged\nPolicyChanged / WalletDeducted / WalletCredited"]
        ACC_OB["acc-outbox [SK_OUTBOX: S1]\nDLQ: RoleChanged/PolicyChanged → SECURITY_BLOCK\n     WalletDeducted → REVIEW_REQUIRED\n     AccountCreated → SAFE_AUTO\nLane: Wallet/Role/Policy → CRITICAL\n      其餘 → STANDARD"]
        ACC_EBUS -->|pending| ACC_OB
    end

    USER_AGG --> WALLET_AGG
    USER_AGG -.->|弱一致| PROFILE
    ORG_ACC --> ORG_SETT & ORG_BIND
    ORG_ACC --> VS2_GOV
    ACC_ROLE & ACC_POL --> ACC_EBUS
    WALLET_AGG -->|"WalletDeducted/Credited"| ACC_EBUS
end

ID_LINK --> USER_AGG & ORG_ACC
ORG_BIND -.->|"ACL [#A2]"| ORG_AGG
ACC_EBUS -.->|"事件契約"| SK_ENV
ACC_ROLE -.->|"role tag 語義"| TE_RL

%% ── VS3 Skill ──
subgraph VS3["🟩 VS3 · Skill XP Slice（能力成長）"]
    direction TB

    subgraph VS3_CORE["⚙️ Skill Domain"]
        SKILL_AGG["account-skill.aggregate\naccountId / skillId(tagSlug)\nxp / version\n→ tag::skill [TE_SK]\n→ tag::skill-tier [TE_ST]"]
        XP_LED[("account-skill-xp-ledger\nentryId / delta / reason\nsourceId / timestamp [#13]")]
    end

    subgraph VS3_EV["📢 Skill Events + Outbox [S1]"]
        SKILL_EV["SkillXpAdded / SkillXpDeducted\n（含 tagSlug 語義・aggregateVersion）"]
        SKILL_OB["skill-outbox\n[SK_OUTBOX: SAFE_AUTO]\n→ IER STANDARD_LANE"]
        SKILL_EV --> SKILL_OB
    end

    SKILL_AGG -->|"[#13] 異動必寫 Ledger"| XP_LED
    SKILL_AGG --> SKILL_EV
end

SKILL_AGG -.->|"tagSlug 唯讀引用"| TAG_RO
SKILL_AGG -.->|"skill 語義"| TE_SK
SKILL_AGG -.->|"skill-tier 語義"| TE_ST
SKILL_EV -.->|"事件契約"| SK_ENV
SKILL_EV -.->|"tier 推導契約"| SK_SKILL_TIER

%% ── VS4 Organization ──
subgraph VS4["🟧 VS4 · Organization Slice（組織治理）"]
    direction TB

    subgraph VS4_CORE["🏗️ 組織核心域"]
        ORG_AGG["organization-core.aggregate"]
    end

    subgraph VS4_GOV["🛡️ 組織治理域"]
        ORG_MBR["org.member（tagSlug 唯讀）\n→ tag::role [TE_RL]\n→ tag::user-level [TE_UL]"]
        ORG_PTR["org.partner（tagSlug 唯讀）\n→ tag::partner [TE_PT]"]
        ORG_TEAM["org.team\n→ tag::team [TE_TM]"]
        ORG_POL["org.policy"]
        ORG_RECOG["org-skill-recognition.aggregate\nminXpRequired / status [#11]"]
    end

    subgraph VS4_TAG["🏷️ Tag 組織作用域 [S4]"]
        TAG_SUB["tag-lifecycle-subscriber\n訂閱 IER BACKGROUND_LANE\n責任：更新 SKILL_TAG_POOL"]
        SKILL_POOL[("skill-tag-pool\nTag Authority 組織作用域快照\n[S4: TAG_MAX_STALENESS ≤ 30s]")]
        TALENT[["talent-repository [#16]\nMember + Partner + Team\n→ ORG_ELIGIBLE_VIEW"]]
        TAG_SUB -->|"TagLifecycleEvent"| SKILL_POOL
        ORG_MBR & ORG_PTR & ORG_TEAM --> TALENT
        TALENT -.->|人力來源| SKILL_POOL
    end

    subgraph VS4_EV["📢 Org Events + Outbox [S1]"]
        ORG_EBUS["org-event-bus（in-process）\n【Producer-only [#2]】\nOrgContextProvisioned / MemberJoined\nMemberLeft / SkillRecognitionGranted/Revoked\nPolicyChanged"]
        ORG_OB["org-outbox [SK_OUTBOX: S1]\nDLQ: OrgContextProvisioned → REVIEW_REQUIRED\n     MemberJoined/Left → SAFE_AUTO\n     SkillRecog → REVIEW_REQUIRED\n     PolicyChanged → SECURITY_BLOCK"]
        ORG_EBUS -->|pending| ORG_OB
    end

    ORG_AGG & ORG_POL & ORG_RECOG --> ORG_EBUS
end

ORG_MBR -.->|"role tag 語義"| TE_RL
ORG_MBR -.->|"user-level tag 語義"| TE_UL
ORG_PTR -.->|"partner tag 語義"| TE_PT
ORG_TEAM -.->|"team tag 語義"| TE_TM
ORG_EBUS -.->|"事件契約"| SK_ENV

%% ── VS5 Workspace ──
subgraph VS5["🟣 VS5 · Workspace Slice（工作區業務）"]
    direction TB

    ORG_ACL["org-context.acl [E2]\nIER OrgContextProvisioned\n→ Workspace 本地 Context [#10]"]

    subgraph VS5_APP["⚙️ Application Coordinator [#3]"]
        direction LR
        WS_CMD_H["command-handler\n→ SK_CMD_RESULT"]
        WS_SCP_G["scope-guard [#A9]"]
        WS_POL_E["policy-engine"]
        WS_TX_R["transaction-runner\n[#A8] 1cmd / 1agg"]
        WS_OB["ws-outbox\n[SK_OUTBOX: SAFE_AUTO]\n唯一 IER 投遞來源 [E5]"]
        WS_CMD_H --> WS_SCP_G --> WS_POL_E --> WS_TX_R
        WS_TX_R -->|"pending events [E5]"| WS_OB
    end

    subgraph VS5_CORE["⚙️ Workspace Core Domain"]
        WS_AGG["workspace-core.aggregate"]
        WS_EBUS["workspace-core.event-bus（in-process [E5]）"]
        WS_ESTORE["workspace-core.event-store\n僅重播/稽核 [#9]"]
        WS_SETT["workspace-core.settings"]
    end

    subgraph VS5_GOV["🛡️ Workspace Governance"]
        WS_ROLE["workspace-governance.role\n繼承 org-policy [#18]\n→ tag::role [TE_RL]"]
        WS_PCHK["policy-eligible-check [P4]\nvia Query Gateway"]
        WS_AUDIT["workspace-governance.audit"]
        AUDIT_COL["audit-event-collector\n訂閱 IER BACKGROUND_LANE\n→ GLOBAL_AUDIT_VIEW"]
        WS_ROLE -.->|"[#18] eligible 查詢"| WS_PCHK
    end

    subgraph VS5_BIZ["⚙️ Business Domain（A+B 雙軌）"]
        direction TB

        subgraph VS5_PARSE["📄 文件解析三層閉環 [Layer-1 → Layer-2 → Layer-3]"]
            W_FILES["workspace.files"]
            W_PARSER["document-parser\nLayer-1 原始解析\n→ raw ParsedLineItem[]\n+ classifyCostItem() [VS8 Layer-2]\n→ ParsedLineItem.costItemType"]
            PARSE_INT[("ParsingIntent\nDigital Twin [#A4]\nlineItems[].costItemType\n（Layer-2 語義標注）")]
            W_FILES -.->|原始檔案| W_PARSER --> PARSE_INT
        end

        subgraph VS5_WF["⚙️ Workflow State Machine [R6]"]
            WF_AGG["workflow.aggregate\n狀態合約：Draft→InProgress→QA\n→Acceptance→Finance→Completed\nblockedBy: Set‹issueId›\n[#A3] blockedBy.isEmpty() 才可 unblock"]
        end

        subgraph VS5_A["🟢 A-track 主流程"]
            direction LR
            A_TASKS["tasks"]
            A_QA["quality-assurance"]
            A_ACCEPT["acceptance"]
            A_FINANCE["finance"]
        end

        subgraph VS5_B["🔴 B-track 異常處理"]
            B_ISSUES{{"issues"}}
        end

        W_DAILY["daily\n施工日誌"]
        W_SCHED["workspace.schedule\n(tagSlug T4)\nWorkspaceScheduleProposed → VS6 [A5]"]

        PARSE_INT -->|"[Layer-3 Semantic Router]\ncostItemType=EXECUTABLE only → 任務草稿 [#A14 D27]"| A_TASKS
        PARSE_INT -->|財務指令| A_FINANCE
        PARSE_INT -->|解析異常| B_ISSUES
        A_TASKS -.->|"SourcePointer [#A4]"| PARSE_INT
        PARSE_INT -.->|"IntentDeltaProposed [#A4]"| A_TASKS
        WF_AGG -.->|stage-view| A_TASKS & A_QA & A_ACCEPT & A_FINANCE
        A_TASKS --> A_QA --> A_ACCEPT --> A_FINANCE
        WF_AGG -->|"blockWorkflow [#A3]"| B_ISSUES
        A_TASKS -.-> W_DAILY
        A_TASKS -.->|任務分配| W_SCHED
        PARSE_INT -.->|"職能需求 T4"| W_SCHED
    end

    ORG_ACL -.->|本地 Org Context| VS5_APP
    B_ISSUES -->|IssueResolved| WS_EBUS
    WS_EBUS -.->|"blockedBy.delete(issueId) [#A3]"| WF_AGG
    WS_TX_R -->|"[#A8]"| WS_AGG
    WS_TX_R -.->|執行業務邏輯| VS5_BIZ
    WS_AGG --> WS_ESTORE
    WS_AGG -->|"in-process [E5]"| WS_EBUS
end

W_FILES -.->|"uses IFileStore"| I_STORE
WS_EBUS -.->|"事件契約"| SK_ENV
WS_ROLE -.->|"role tag 語義"| TE_RL
WS_PCHK -.->|"[P4]"| QGWAY_SCHED
WS_CMD_H -.->|"執行結果"| SK_CMD_RESULT
W_SCHED -.->|"tagSlug T4"| TAG_RO
W_SCHED -.->|"人力需求契約"| SK_SKILL_REQ

%% ── VS6 Scheduling ──
subgraph VS6["🟨 VS6 · Scheduling Slice（排班協作）"]
    direction TB

    subgraph VS6_DOM["⚙️ Schedule Domain"]
        ORG_SCH["org.schedule\nHR Scheduling (tagSlug T4)\n[S4] 配對前 TAG_STALE_GUARD 校驗\n事件帶 aggregateVersion [R7]"]
    end

    subgraph VS6_SAGA["⚙️ Scheduling Saga [#A5]"]
        SCH_SAGA["scheduling-saga\n接收 ScheduleProposed\neligibility check [#14]\ncompensating:\n  ScheduleAssignRejected\n  ScheduleProposalCancelled"]
    end

    subgraph VS6_OB["📤 Schedule Outbox [S1]"]
        SCH_OB["sched-outbox\n[SK_OUTBOX: S1]\nDLQ: ScheduleAssigned → REVIEW_REQUIRED\n     Compensating Events → SAFE_AUTO"]
    end

    ORG_SCH -.->|"[#14] 只讀 eligible=true"| QGWAY_SCHED
    ORG_SCH -.->|"tagSlug 新鮮度校驗"| TAG_SG
    ORG_SCH -->|"ScheduleAssigned + aggregateVersion"| SCH_OB
    ORG_SCH -.->|"人力需求契約"| SK_SKILL_REQ
    ORG_SCH -.->|"tagSlug 唯讀"| TAG_RO
    SCH_SAGA -->|compensating event| SCH_OB
    SCH_SAGA -.->|"協調 handleScheduleProposed"| ORG_SCH
end

%% ── VS7 Notification（Cross-cutting Authority · 反應中樞）──
subgraph VS7["🩷 VS7 · Notification Hub（通知交付 · 跨切片權威）"]
    direction TB

    NOTIF_R["notification-router\n無狀態路由 [#A10]\n消費 IER STANDARD_LANE\nScheduleAssigned [E3]\n從 envelope 讀取 traceId [R8]"]
    NOTIF_HUB_SVC["notification-hub._services.ts\n唯一副作用出口\n標籤感知路由策略\n對接 VS8 語義索引\n#channel:slack → Slack\n#urgency:high → 電話"]

    subgraph VS7_DEL["📤 Delivery"]
        USER_NOTIF["account-user.notification\n個人推播"]
        USER_DEV["使用者裝置"]
        USER_NOTIF --> USER_DEV
    end

    NOTIF_R -->|TargetAccountID 匹配| NOTIF_HUB_SVC
    NOTIF_HUB_SVC -->|路由策略決定| USER_NOTIF
    PROFILE -.->|"FCM Token（唯讀）"| USER_NOTIF
    USER_NOTIF -.->|"[#6] 投影"| QGWAY_NOTIF
end

USER_NOTIF -.->|"uses IMessaging [R8]"| I_MSG
NOTIF_HUB_SVC -.->|"標籤感知路由"| VS8

%% ═══════════════════════════════════════════════════════════════
%% LAYER 4 ── INTEGRATION EVENT ROUTER（事件路由總線）
%% ═══════════════════════════════════════════════════════════════

subgraph GW_IER["🟠 L4 · Integration Event Router（IER）"]
    direction TB

    RELAY["outbox-relay-worker\n【共用 Infra・所有 OUTBOX 共享】\n掃描：Firestore onSnapshot (CDC)\n投遞：OUTBOX → IER 對應 Lane\n失敗：retry backoff → 3次失敗 → DLQ\n監控：relay_lag → L9(Observability)"]

    subgraph IER_CORE["⚙️ IER Core"]
        IER[["integration-event-router\n統一事件出口 [#9]\n[R8] 保留 envelope.traceId 禁止覆蓋"]]
    end

    subgraph IER_LANES["🚦 優先級三道分層 [P1]"]
        CRIT_LANE["🔴 CRITICAL_LANE\n高優先最終一致\nRoleChanged → Claims 刷新 [S6]\nWalletDeducted/Credited\nOrgContextProvisioned\nSLA：盡快投遞"]
        STD_LANE["🟡 STANDARD_LANE\n非同步最終一致\nSLA < 2s\nSkillXpAdded/Deducted\nScheduleAssigned / ScheduleProposed\nMemberJoined/Left\nAll Domain Events"]
        BG_LANE["⚪ BACKGROUND_LANE\nSLA < 30s\nTagLifecycleEvent\nAuditEvents"]
    end

    subgraph DLQ_SYS["💀 DLQ 三級分類 [R5 S1]"]
        DLQ["dead-letter-queue\n失敗 3 次後收容\n分級標記來自 SK_OUTBOX_CONTRACT"]
        DLQ_S["🟢 SAFE_AUTO\n自動 Replay（保留 idempotency-key）"]
        DLQ_R["🟡 REVIEW_REQUIRED\n金融/排班/角色\n人工確認後 Replay"]
        DLQ_B["🔴 SECURITY_BLOCK\n安全事件\n告警 + 凍結 + 人工確認\n禁止自動 Replay"]
        DLQ --> DLQ_S & DLQ_R & DLQ_B
        DLQ_S -.->|"自動 Replay"| IER
        DLQ_R -.->|"人工確認後 Replay"| IER
        DLQ_B -.->|"告警"| DOMAIN_ERRORS
    end

    RELAY -.->|"掃描所有 OUTBOX → 投遞"| IER
    IER --> IER_LANES
    IER_LANES -.->|"投遞失敗 3 次"| DLQ
end

%% 所有 OUTBOX → RELAY
ACC_OB & ORG_OB & SCH_OB & SKILL_OB & TAG_OB & WS_OB -.->|"被 RELAY 掃描 [R1]"| RELAY

%% IER → Domain Slice 消費
CRIT_LANE -.->|"RoleChanged/PolicyChanged [S6]"| CLAIMS_H
CRIT_LANE -.->|"OrgContextProvisioned [E2]"| ORG_ACL
STD_LANE -.->|"ScheduleAssigned [E3]"| NOTIF_R
STD_LANE -.->|"ScheduleProposed [#A5]"| SCH_SAGA
BG_LANE -.->|"TagLifecycleEvent [T1]"| TAG_SUB
BG_LANE -.->|"跨片稽核"| AUDIT_COL

%% Outbox Lane Declarations
ACC_OB -->|"CRITICAL_LANE: Role/Policy/Wallet"| IER
ACC_OB -->|"STANDARD_LANE: AccountCreated"| IER
ORG_OB -->|"CRITICAL_LANE: OrgContextProvisioned・PolicyChanged"| IER
ORG_OB -->|"STANDARD_LANE: MemberJoined/Left・SkillRecog"| IER
SKILL_OB -->|"STANDARD_LANE"| IER
SCH_OB -->|"STANDARD_LANE"| IER
WS_OB -->|"STANDARD_LANE [E5]"| IER
TAG_OB -->|"BACKGROUND_LANE"| IER

%% ═══════════════════════════════════════════════════════════════
%% LAYER 5 ── PROJECTION BUS（事件投影總線）
%% ═══════════════════════════════════════════════════════════════

subgraph PROJ_BUS["🟡 L5 · Projection Bus（基礎設施層 · 非業務域）"]
    direction TB

    subgraph PROJ_BUS_FUNNEL["▶ Event Funnel [S2 P5 R8]"]
        direction LR
        FUNNEL[["event-funnel\n[#9] 唯一 Projection 寫入路徑\n[Q3] upsert by idempotency-key\n[R8] 從 envelope 讀取 traceId → DOMAIN_METRICS\n[S2] 所有 Lane 遵守 SK_VERSION_GUARD\n     event.aggVersion > view.lastVersion\n     → 更新；否則 → 丟棄"]]
        CRIT_PROJ["🔴 CRITICAL_PROJ_LANE\n[S4: PROJ_STALE_CRITICAL ≤ 500ms]\n獨立重試 / dead-letter"]
        STD_PROJ["⚪ STANDARD_PROJ_LANE\n[S4: PROJ_STALE_STANDARD ≤ 10s]\n獨立重試 / dead-letter"]
        FUNNEL --> CRIT_PROJ & STD_PROJ
    end

    subgraph PROJ_BUS_META["⚙️ Stream Meta"]
        PROJ_VER["projection.version\n事件串流偏移量"]
        READ_REG["read-model-registry\n版本目錄"]
        PROJ_VER -->|version mapping| READ_REG
    end

    subgraph PROJ_BUS_CRIT["🔴 Critical Projections [S2 S4]"]
        WS_SCOPE_V["projection.workspace-scope-guard-view\n授權路徑 [#A9]\n[S2: SK_VERSION_GUARD]"]
        ORG_ELIG_V["projection.org-eligible-member-view\n[S2: SK_VERSION_GUARD]\nskills{tagSlug→xp} / eligible\n[#14 #15 #16 T3]\n→ tag::skill [TE_SK]\n→ tag::skill-tier [TE_ST]"]
        WALLET_V["projection.wallet-balance\n[S3: EVENTUAL_READ]\n顯示用・精確交易回源 AGG"]
        TIER_FN[["getTier(xp) → Tier\n純函式 [#12]"]]
    end

    subgraph PROJ_BUS_STD["⚪ Standard Projections [S4]"]
        direction LR
        WS_PROJ["projection.workspace-view"]
        ACC_SCHED_V["projection.account-schedule"]
        ACC_PROJ_V["projection.account-view"]
        ORG_PROJ_V["projection.organization-view"]
        SKILL_V["projection.account-skill-view\n[S2: SK_VERSION_GUARD]"]
        AUDIT_V["projection.global-audit-view\n每條記錄含 traceId [R8]"]
        TAG_SNAP["projection.tag-snapshot\n[S4: TAG_MAX_STALENESS]\nT5 消費方禁止寫入"]
    end

    IER ==>|"[#9] 唯一 Projection 寫入路徑"| FUNNEL
    CRIT_PROJ --> WS_SCOPE_V & ORG_ELIG_V & WALLET_V
    STD_PROJ --> WS_PROJ & ACC_SCHED_V & ACC_PROJ_V & ORG_PROJ_V & SKILL_V & AUDIT_V & TAG_SNAP

    FUNNEL -->|stream offset| PROJ_VER
    WS_ESTORE -.->|"[#9] replay → rebuild"| FUNNEL
    SKILL_V -.->|"[#12] getTier"| TIER_FN
    ORG_ELIG_V -.->|"[#12] getTier"| TIER_FN
end

FUNNEL -.->|"uses IFirestoreRepo [S2]"| I_REPO
READ_REG -.->|"版本目錄"| QGWAY
WS_SCOPE_V -.->|"快照契約"| SK_AUTH_SNAP
ACC_PROJ_V -.->|"快照契約"| SK_AUTH_SNAP
SKILL_V -.->|"tier 推導"| SK_SKILL_TIER
ORG_ELIG_V -.->|"skill tag 語義"| TE_SK
ORG_ELIG_V -.->|"skill-tier tag 語義"| TE_ST
AUDIT_COL -.->|"跨片稽核"| AUDIT_V

%% ═══════════════════════════════════════════════════════════════
%% LAYER 6 ── QUERY GATEWAY（統一讀取出口）
%% ═══════════════════════════════════════════════════════════════

subgraph GW_QUERY["🟢 L6 · Query Gateway（統一讀取出口）[S2 S3]"]
    direction LR
    QGWAY["read-model-registry\n統一讀取入口\n版本對照 / 快照路由\n[S2] 所有 Projection 遵守 SK_VERSION_GUARD"]
    QGWAY_SCHED["→ .org-eligible-member-view\n[#14 #15 #16]"]
    QGWAY_NOTIF["→ .account-view\n[#6] FCM Token"]
    QGWAY_SCOPE["→ .workspace-scope-guard-view\n[#A9]"]
    QGWAY_WALLET["→ .wallet-balance\n[S3] 顯示 → Projection\n精確交易 → STRONG_READ"]
    QGWAY_SEARCH["→ .tag-snapshot\n語義化索引檢索"]
    QGWAY --> QGWAY_SCHED & QGWAY_NOTIF & QGWAY_SCOPE & QGWAY_WALLET & QGWAY_SEARCH
end

ORG_ELIG_V -.-> QGWAY_SCHED
ACC_PROJ_V -.-> QGWAY_NOTIF
WS_SCOPE_V -.-> QGWAY_SCOPE
WALLET_V -.-> QGWAY_WALLET
TAG_SNAP -.-> QGWAY_SEARCH
ACTIVE_CTX -->|"查詢鍵"| QGWAY_SCOPE
QGWAY_SCOPE --> CBG_AUTH

%% ── Global Search（Cross-cutting Authority · 語義門戶）──
GLOBAL_SEARCH["🔍 Global Search（跨切片權威）\nL6 Query Gateway 核心消費者\n語義化索引檢索\n唯一跨域搜尋權威\n對接 VS8 語義索引\nCmd+K 唯一服務提供者\n_actions.ts / _services.ts [D26]"]
GLOBAL_SEARCH -->|"語義化索引檢索"| QGWAY_SEARCH
GLOBAL_SEARCH -.->|"queries VS8 semantic index [D26]"| VS8

%% ── VS8 Semantic Graph 跨切片語義提供 ──
VS8 -.->|"排班組合匹配"| VS6
VS8 -.->|"任務語義標籤"| VS5
COST_CLASSIFIER -.->|"classifyCostItem() [Layer-2 D27 #A14]"| W_PARSER

%% ═══════════════════════════════════════════════════════════════
%% LAYER 7 ── FIREBASE ACL（防腐層）
%% ═══════════════════════════════════════════════════════════════

subgraph FIREBASE_ACL["🔌 L7 · Firebase ACL Adapters（防腐層 · src/shared/infra）[D24 D25]"]
    direction LR

    AUTH_ADP["auth.adapter.ts\nAuthAdapter\n實作 IAuthService\nFirebase User ↔ Auth Identity\n[D24] 唯一合法 firebase/auth 呼叫點"]

    FSTORE_ADP["firestore.facade.ts\nFirestoreAdapter\n實作 IFirestoreRepo\n[S2] aggregateVersion 單調遞增守衛\n[D24] 唯一合法 firebase/firestore 呼叫點"]

    FCM_ADP["messaging.adapter.ts\nFCMAdapter\n實作 IMessaging\n[R8] 注入 envelope.traceId → FCM metadata\n禁止在此生成新 traceId\n[D24] 唯一合法 firebase/messaging 呼叫點"]

    STORE_ADP["storage.facade.ts\nStorageAdapter\n實作 IFileStore\nPath Resolver / URL 簽發\n[D24] 唯一合法 firebase/storage 呼叫點"]
end

%% Adapters implements Ports
AUTH_ADP -.->|"implements"| I_AUTH
FSTORE_ADP -.->|"implements [S2]"| I_REPO
FCM_ADP -.->|"implements [R8]"| I_MSG
STORE_ADP -.->|"implements"| I_STORE

%% ACL infra contracts constrain Adapters
SK_INFRA -.->|"S2/R8/S4 規則約束"| FIREBASE_ACL

%% ═══════════════════════════════════════════════════════════════
%% LAYER 8 ── FIREBASE EXTERNAL INFRASTRUCTURE
%% ═══════════════════════════════════════════════════════════════

subgraph FIREBASE_EXT["☁️ L8 · Firebase Infrastructure（外部雲端平台）"]
    direction LR
    F_AUTH[("Firebase Auth\nfirebase/auth")]
    F_DB[("Firestore\nfirebase/firestore")]
    F_FCM[("Firebase Cloud Messaging\nfirebase/messaging")]
    F_STORE[("Cloud Storage\nfirebase/storage")]
end

AUTH_ADP --> F_AUTH
FSTORE_ADP --> F_DB
FCM_ADP --> F_FCM
STORE_ADP --> F_STORE

%% ═══════════════════════════════════════════════════════════════
%% LAYER 9 ── OBSERVABILITY（橫切面可觀測性）
%% ═══════════════════════════════════════════════════════════════

subgraph OBS_LAYER["⬜ L9 · Observability（橫切面）"]
    direction LR
    TRACE_ID["trace-identifier\nCBG_ENTRY 注入 TraceID\n整條事件鏈共享 [R8]"]
    DOMAIN_METRICS["domain-metrics\nIER 各 Lane Throughput/Latency\nFUNNEL 各 Lane 處理時間\nOUTBOX_RELAY lag [R1]\nRATELIMIT hit / CIRCUIT open"]
    DOMAIN_ERRORS["domain-error-log\nWS_TX_RUNNER\nSCHEDULE_SAGA\nDLQ_BLOCK 安全事件 [R5]\nStaleTagWarning\nTOKEN_REFRESH 失敗告警 [S6]"]
end

CBG_ENTRY --> TRACE_ID
IER --> DOMAIN_METRICS
FUNNEL --> DOMAIN_METRICS
RELAY -.->|"relay_lag metrics"| DOMAIN_METRICS
RATE_LIM -.->|"hit metrics"| DOMAIN_METRICS
CIRCUIT -.->|"open/half-open"| DOMAIN_METRICS
WS_TX_R --> DOMAIN_ERRORS
SCH_SAGA --> DOMAIN_ERRORS
DLQ_B -.->|"安全告警"| DOMAIN_ERRORS
TAG_SG -.->|"StaleTagWarning"| DOMAIN_ERRORS
TOKEN_SIG -.->|"Claims 刷新成功 [S6]"| DOMAIN_METRICS

%% ═══════════════════════════════════════════════════════════════
%% MAIN FLOW：外部入口 → 閘道 → 切片
%% ═══════════════════════════════════════════════════════════════

EXT_CLIENT --> RATE_LIM
EXT_WEBHOOK --> RATE_LIM
CBG_ROUTE -->|"Workspace Command"| WS_CMD_H
CBG_ROUTE -->|"Skill Command"| SKILL_AGG
CBG_ROUTE -->|"Org Command"| ORG_AGG
CBG_ROUTE -->|"Account Command"| USER_AGG

%% ═══════════════════════════════════════════════════════════════
%% STYLES
%% ═══════════════════════════════════════════════════════════════

classDef sk fill:#ecfeff,stroke:#22d3ee,color:#000,font-weight:bold
classDef skInfra fill:#f0f9ff,stroke:#0369a1,color:#000,font-weight:bold
classDef skAuth fill:#fdf4ff,stroke:#7c3aed,color:#000,font-weight:bold
classDef tagAuth fill:#cffafe,stroke:#0891b2,color:#000,font-weight:bold
classDef tagEnt fill:#ecfdf5,stroke:#059669,color:#000,font-weight:bold,stroke-width:2px
classDef infraPort fill:#e0f7fa,stroke:#00838f,color:#000,font-weight:bold
classDef identity fill:#dbeafe,stroke:#93c5fd,color:#000
classDef ctxNode fill:#eff6ff,stroke:#1d4ed8,color:#000,font-weight:bold
classDef claimsNode fill:#dbeafe,stroke:#1d4ed8,color:#000,font-weight:bold
classDef tokenSig fill:#fef3c7,stroke:#d97706,color:#000,font-weight:bold
classDef account fill:#dcfce7,stroke:#86efac,color:#000
classDef outboxNode fill:#fef3c7,stroke:#d97706,color:#000,font-weight:bold
classDef relay fill:#f0fdf4,stroke:#15803d,color:#000,font-weight:bold
classDef skillSlice fill:#bbf7d0,stroke:#22c55e,color:#000
classDef orgSlice fill:#fff7ed,stroke:#fdba74,color:#000
classDef tagSub fill:#fef9c3,stroke:#ca8a04,color:#000,font-weight:bold
classDef wsSlice fill:#ede9fe,stroke:#c4b5fd,color:#000
classDef wfNode fill:#fdf4ff,stroke:#9333ea,color:#000,font-weight:bold
classDef cmdResult fill:#f0fdf4,stroke:#16a34a,color:#000,font-weight:bold
classDef schedSlice fill:#fef9c3,stroke:#ca8a04,color:#000
classDef notifSlice fill:#fce7f3,stroke:#db2777,color:#000
classDef critProj fill:#fee2e2,stroke:#dc2626,color:#000,font-weight:bold
classDef stdProj fill:#fef9c3,stroke:#d97706,color:#000
classDef eligGuard fill:#fee2e2,stroke:#b91c1c,color:#000,font-weight:bold
classDef auditView fill:#f0fdf4,stroke:#15803d,color:#000,font-weight:bold
classDef gateway fill:#f8fafc,stroke:#334155,color:#000,font-weight:bold
classDef guardLayer fill:#fff1f2,stroke:#e11d48,color:#000,font-weight:bold
classDef cmdGw fill:#eff6ff,stroke:#2563eb,color:#000
classDef eventGw fill:#fff7ed,stroke:#ea580c,color:#000
classDef critLane fill:#fee2e2,stroke:#dc2626,color:#000,font-weight:bold
classDef stdLane fill:#fef9c3,stroke:#ca8a04,color:#000
classDef bgLane fill:#f1f5f9,stroke:#64748b,color:#000
classDef dlqNode fill:#fca5a5,stroke:#b91c1c,color:#000,font-weight:bold
classDef dlqSafe fill:#d1fae5,stroke:#059669,color:#000,font-weight:bold
classDef dlqReview fill:#fef9c3,stroke:#ca8a04,color:#000,font-weight:bold
classDef dlqBlock fill:#fca5a5,stroke:#b91c1c,color:#000,font-weight:bold
classDef qgway fill:#f0fdf4,stroke:#15803d,color:#000
classDef staleGuard fill:#fef3c7,stroke:#b45309,color:#000,font-weight:bold
classDef obs fill:#f1f5f9,stroke:#64748b,color:#000
classDef trackA fill:#d1fae5,stroke:#059669,color:#000
classDef tierFn fill:#fdf4ff,stroke:#9333ea,color:#000
classDef talent fill:#fff1f2,stroke:#f43f5e,color:#000
classDef serverAct fill:#fed7aa,stroke:#f97316,color:#000
classDef aclAdapter fill:#fce4ec,stroke:#ad1457,color:#000,font-weight:bold
classDef firebaseExt fill:#fff9c4,stroke:#f9a825,color:#000,font-weight:bold
classDef semanticGraph fill:#e0e7ff,stroke:#4f46e5,color:#000,font-weight:bold
classDef crossCutAuth fill:#fde68a,stroke:#b45309,color:#000,font-weight:bold,stroke-width:3px

class SK,SK_ENV,SK_AUTH_SNAP,SK_SKILL_TIER,SK_SKILL_REQ,SK_CMD_RESULT sk
class SK_OUTBOX,SK_VERSION,SK_READ,SK_STALE,SK_RESILIENCE skInfra
class SK_TOKEN skAuth
class CTA,TAG_EV,TAG_RO tagAuth
class TE_UL,TE_SK,TE_ST,TE_TM,TE_RL,TE_PT tagEnt
class TAG_SG staleGuard
class TAG_OB outboxNode
class SK_PORTS,I_AUTH,I_REPO,I_MSG,I_STORE infraPort
class VS1,AUTH_ID,ID_LINK identity
class ACTIVE_CTX,CTX_MGR ctxNode
class CLAIMS_H,CUSTOM_C claimsNode
class TOKEN_SIG tokenSig
class VS2,USER_AGG,WALLET_AGG,PROFILE,ORG_ACC,ORG_SETT,ORG_BIND,ACC_ROLE,ACC_POL,ACC_EBUS account
class ACC_OB outboxNode
class VS3,SKILL_AGG,XP_LED skillSlice
class SKILL_EV,SKILL_OB skillSlice
class VS4,ORG_AGG,ORG_MBR,ORG_PTR,ORG_TEAM,ORG_POL,ORG_RECOG,ORG_EBUS orgSlice
class TAG_SUB tagSub
class ORG_OB outboxNode
class VS5,WS_CMD_H,WS_SCP_G,WS_POL_E,WS_TX_R,WS_OB,WS_AGG,WS_EBUS,WS_ESTORE,WS_SETT,WS_ROLE,WS_PCHK,WS_AUDIT wsSlice
class WF_AGG wfNode
class AUDIT_COL auditView
class A_TASKS,A_QA,A_ACCEPT,A_FINANCE trackA
class B_ISSUES,W_DAILY,W_SCHED wsSlice
class VS6,ORG_SCH,SCH_SAGA schedSlice
class SCH_OB outboxNode
class VS7,NOTIF_R,USER_NOTIF,USER_DEV notifSlice
class GW_CMD,GW_GUARD,GW_PIPE gateway
class RATE_LIM,CIRCUIT,BULKHEAD guardLayer
class CBG_ENTRY,CBG_AUTH,CBG_ROUTE cmdGw
class GW_IER,IER_CORE,IER eventGw
class RELAY relay
class CRIT_LANE critLane
class STD_LANE stdLane
class BG_LANE bgLane
class DLQ dlqNode
class DLQ_S dlqSafe
class DLQ_R dlqReview
class DLQ_B dlqBlock
class GW_QUERY,QGWAY,QGWAY_SCHED,QGWAY_NOTIF,QGWAY_SCOPE,QGWAY_WALLET,QGWAY_SEARCH qgway
class PROJ_BUS,FUNNEL,PROJ_VER,READ_REG stdProj
class CRIT_PROJ,WS_SCOPE_V,ORG_ELIG_V,WALLET_V critProj
class STD_PROJ,WS_PROJ,ACC_SCHED_V,ACC_PROJ_V,ORG_PROJ_V,SKILL_V stdProj
class AUDIT_V auditView
class TAG_SNAP tagSub
class TIER_FN tierFn
class TALENT talent
class OBS_LAYER,TRACE_ID,DOMAIN_METRICS,DOMAIN_ERRORS obs
class FIREBASE_ACL,AUTH_ADP,FSTORE_ADP,FCM_ADP,STORE_ADP aclAdapter
class FIREBASE_EXT,F_AUTH,F_DB,F_FCM,F_STORE firebaseExt
class EXT_CLIENT,EXT_AUTH,EXT_WEBHOOK serverAct
class VS8 semanticGraph
class GLOBAL_SEARCH crossCutAuth
class NOTIF_HUB_SVC crossCutAuth

%%  ╔══════════════════════════════════════════════════════════════════════════╗
%%  ║  CONSISTENCY INVARIANTS 完整索引                                         ║
%%  ╠══════════════════════════════════════════════════════════════════════════╣
%%  #1   每個 BC 只能修改自己的 Aggregate
%%  #2   跨 BC 僅能透過 Event / Projection / ACL 溝通
%%  #3   Application Layer 只協調，不承載領域規則
%%  #4a  Domain Event 僅由 Aggregate 產生（唯一生成者）
%%  #4b  TX Runner 只投遞 Outbox，不產生 Domain Event（分工界定）
%%  #5   Custom Claims 只做快照，非真實權限來源
%%  #6   Notification 只讀 Projection
%%  #7   Scope Guard 僅讀本 Context Read Model
%%  #8   Shared Kernel 必須顯式標示；未標示跨 BC 共用視為侵入
%%  #9   Projection 必須可由事件完整重建
%%  #10  任一模組需外部 Context 內部狀態 = 邊界設計錯誤
%%  #11  XP 屬 Account BC；Organization 只設門檻
%%  #12  Tier 永遠是推導值，不存 DB
%%  #13  XP 異動必須寫 Ledger
%%  #14  Schedule 只讀 ORG_ELIGIBLE_MEMBER_VIEW
%%  #15  eligible 生命週期：joined→true · assigned→false · completed/cancelled→true
%%  #16  Talent Repository = member + partner + team
%%  #17  centralized-tag.aggregate 為 tagSlug 唯一真相
%%  #18  workspace-governance role 繼承 policy 硬約束
%%  #19  所有 Projection 更新必須以 aggregateVersion 單調遞增為前提 [S2 泛化]
%%  ╠══════════════════════════════════════════════════════════════════════════╣
%%  ATOMICITY AUDIT 完整索引
%%  #A1  wallet 強一致；profile/notification 弱一致
%%  #A2  org-account.binding 只 ACL/projection 防腐對接
%%  #A3  blockWorkflow → blockedBy Set；allIssuesResolved → unblockWorkflow
%%  #A4  ParsingIntent 只允許提議事件
%%  #A5  schedule 跨 BC saga/compensating event
%%  #A6  CENTRALIZED_TAG_AGGREGATE 語義唯一權威（VS8 語義分類層 · Classification Layer [D21-1]）
%%  #A7  Event Funnel 只做 compose
%%  #A8  TX Runner 1cmd/1agg 原子提交
%%  #A9  Scope Guard 快路徑；高風險回源 aggregate
%%  #A10 Notification Router 無狀態路由
%%  #A11 eligible = 「無衝突排班」快照，非靜態狀態
%%  #A12 Global Search = 跨切片權威（語義門戶），唯一跨域搜尋出口，禁止各 Slice 自建搜尋邏輯
%%  #A13 Notification Hub = 跨切片權威（反應中樞），唯一副作用出口，業務 Slice 只產生事件不決定通知策略
%%  #A14 CostItemType 語義分類（Layer-2）= VS8 _cost-classifier.ts 純函式；
%%       VS5 Layer-3 Semantic Router = use-workspace-event-handler，
%%       僅 EXECUTABLE 項目物化為 tasks；其餘六類靜默跳過並 toast [D27]
%%  ╠══════════════════════════════════════════════════════════════════════════╣
%%  TAG SEMANTICS 擴展規則（VS8 · 8層語義神經網絡完全體 [D21-1~D21-10 + D21-A~D21-X]）
%%  T1  新切片訂閱 TagLifecycleEvent（BACKGROUND_LANE）即可擴展 [D21-6]
%%  T2  SKILL_TAG_POOL = Tag Authority 組織作用域唯讀投影
%%  T3  ORG_ELIGIBLE_MEMBER_VIEW.skills{tagSlug→xp} 交叉快照
%%  T4  排班職能需求 = SK_SKILL_REQ × Tag Authority tagSlug [D21-5]
%%  T5  TAG_SNAPSHOT 消費方禁止寫入 [D21-7]
%%  T6  突觸層（VS8_SL）寫入只能透過 semantic-edge-store.addEdge()；禁止直接操作 _edges 內部狀態 [D21-9]
%%  T7  findIsolatedNodes 在每次 addEdge/removeEdge 後由 VS8_NG 非同步觸發，孤立節點寫入 Observability [D21-10]
%%  ╠══════════════════════════════════════════════════════════════════════════╣
%%  SEMANTIC TAG ENTITIES 索引（AI-ready Semantic Graph）
%%  TE1 TAG_USER_LEVEL  tag::user-level    → tagSlug: user-level:{slug}
%%  TE2 TAG_SKILL       tag::skill         → tagSlug: skill:{slug}
%%  TE3 TAG_SKILL_TIER  tag::skill-tier    → tagSlug: skill-tier:{tier}
%%  TE4 TAG_TEAM        tag::team          → tagSlug: team:{slug}
%%  TE5 TAG_ROLE        tag::role          → tagSlug: role:{slug}
%%  TE6 TAG_PARTNER     tag::partner       → tagSlug: partner:{slug}
%%  ╠══════════════════════════════════════════════════════════════════════════╣
%%  INFRASTRUCTURE CONTRACTS [S1~S6] 索引
%%  S1  SK_OUTBOX_CONTRACT     三要素：at-least-once / idempotency-key / DLQ分級
%%  S2  SK_VERSION_GUARD       aggregateVersion 單調遞增保護（全 Projection）
%%  S3  SK_READ_CONSISTENCY    STRONG_READ vs EVENTUAL_READ 路由決策
%%  S4  SK_STALENESS_CONTRACT  SLA 常數單一真相（TAG/PROJ_CRITICAL/PROJ_STANDARD）
%%  S5  SK_RESILIENCE_CONTRACT 外部入口最低防護規格（rate-limit/circuit-break/bulkhead）
%%  S6  SK_TOKEN_REFRESH_CONTRACT Claims 刷新三方握手（VS1 ↔ IER ↔ 前端）
%%  ╠══════════════════════════════════════════════════════════════════════════╣
%%  FIREBASE 隔離規則 與 Cross-cutting Authority 治理 [D24~D26]
%%  （詳見 UNIFIED DEVELOPMENT RULES 完整定義）
%%  ╠══════════════════════════════════════════════════════════════════════════╣
%%  UNIFIED DEVELOPMENT RULES [D1~D26]
%%  ── 規則分層：Hard Invariants (D1~D20 核心不變量) / Semantic Governance D21(D21-1~D21-10+D21-A~D21-X)/D22~D23 / Infrastructure (D24~D25) / Authority Governance (D26) ──
%%  ── 基礎路徑約束（D1~D12）──
%%  D1  事件傳遞只透過 infra.outbox-relay；domain slice 禁止直接 import infra.event-router
%%  D2  跨切片引用：import from '@/features/{slice}/index' only；_*.ts 為私有
%%  D3  所有 mutation：src/features/{slice}/_actions.ts only
%%  D4  所有 read：src/features/{slice}/_queries.ts only
%%  D5  src/app/ 與 UI 元件禁止 import src/shared/infra/firestore
%%  D6  "use client" 只在 _components/ 或 _hooks/ 葉節點；layout/page server components 禁用
%%  D7  跨切片：import from '@/features/{other-slice}/index'；禁止 _private 引用
%%  D8  shared.kernel.* 禁止 async functions、Firestore calls、side effects
%%  D9  workspace-application/ TX Runner 協調 mutation；slices 不得互相 mutate
%%  D10 EventEnvelope.traceId 僅在 CBG_ENTRY 設定；其他地方唯讀
%%  D11 workspace-core.event-store 支援 projection rebuild；必須持續同步
%%  D12 getTier() 必須從 shared.kernel.skill-tier import；Firestore 寫入禁帶 tier 欄位
%%  ── 契約治理守則（D13~D20）──
%%  D13 新增 OUTBOX：必須在 SK_OUTBOX_CONTRACT 宣告 DLQ 分級
%%  D14 新增 Projection：必須引用 SK_VERSION_GUARD，不得跳過 aggregateVersion 比對
%%  D15 讀取場景決策：先查 SK_READ_CONSISTENCY（金融/授權 → STRONG；其餘 → EVENTUAL）
%%  D16 SLA 數值禁止硬寫，一律引用 SK_STALENESS_CONTRACT
%%  D17 新增外部觸發入口：必須在 SK_RESILIENCE_CONTRACT 驗收後上線
%%  D18 Claims 刷新邏輯變更：以 SK_TOKEN_REFRESH_CONTRACT 為唯一規範
%%  D19 型別歸屬規則：跨 BC 契約優先放 shared.kernel.*；shared/types 僅為 legacy fallback
%%  D20 匯入優先序：shared.kernel.* > feature slice index.ts > shared/types
%%  ── 語義 Tag 守則（D21~D23）── VS8 語義神經網絡完全體（8層）正式規範 ──
%%  ── 層級結構：core(DNA) → graph(突觸) → routing(反射弧) → guards(BBB)
%%              → plasticity(學習) → projections(讀側) → ui(維基治理) → I/O(訂閱廣播) ──
%%  ── 一、神經元定義層 (VS8_CL · Neuron Definition Authority) ──
%%  D21-1 語義唯一性：全域所有語義類別與標籤實體（Tag Entities）僅能在 VS8 CTA 定義，禁止業務切片（VS1~VS6）私自宣告
%%  D21-2 標籤強型別化：系統中禁止使用隱性字串傳遞語義，所有引用必須指向 TE1~TE6 有效 tagSlug
%%  ── 二、突觸層與計算層 (VS8_SL · VS8_NG · Structural Modeling) ──
%%  D21-3 節點互聯律：語義節點必須具備層級或因果關係；孤立標籤（Isolated Tag）視為無效語義，須通過 parentTagSlug 歸入分類學
%%  D21-4 聚合體約束：CTA 守護標籤生命週期（Draft→Active→Stale→Deprecated）；Neural Network 計算關聯權重與語義距離
%%  ── 三、語義路由與執行 (VS8_RL · Routing & Execution) ──
%%  D21-5 語義感知路由：跨切片決策（排班路由/通知分發）必須基於標籤語義權重，禁止硬編碼業務對象 ID
%%  D21-6 因果自動觸發：TagLifecycleEvent 發生時，VS8 透過 Causality Tracer 自動推導受影響節點並發布更新事件；
%%        traceAffectedNodes(event, candidateSlugs[]) 支援候選節點過濾（candidateSlugs=[] 表全圖追蹤）；
%%        rankAffectedNodes / buildDownstreamEvents 可作為獨立工具使用；TAG_DELETED 不產生下游事件
%%  ── 四、投影與一致性 (Projection & Consistency) ──
%%  D21-7 讀寫分離原則：寫入操作必須經過 CMD_GWAY 進入 VS8 CTA；讀取嚴禁直連資料庫，必須經由 projection.tag-snapshot
%%  D21-8 新鮮度防禦：所有基於語義的查詢必須引用 SK_STALENESS_CONTRACT，TAG_STALE_GUARD ≤ 30 秒
%%  ── 五、突觸物理學 (VS8_SL · Synaptic Physics) ──
%%  D21-9 突觸權重不變量：SemanticEdge.weight ∈ [0.0, 1.0]；
%%        語義代價 cost = 1.0 / max(weight, MIN_EDGE_WEIGHT)（強連結 = 近鄰 = 短距離）；
%%        _clampWeight 在 addEdge 時強制執行；所有直接關係預設 weight=1.0；
%%        禁止任何消費方持有 weight > 1.0 或 weight < 0.0 的邊
%%  D21-10 拓撲可觀測性：findIsolatedNodes(slugs[]) 為 VS8_NG 唯一拓撲健康探針；
%%         每次 addEdge/removeEdge 後必須以非同步方式觸發孤立節點檢查；
%%         結果寫入 L9 Observability；D21-3 違規率 > 0 需觸發警告事件
%%  ── 六、完全體擴展不變量 (D21-A~D21-X · 8層架構治理律) ──
%%  D21-A 唯一註冊律：跨領域概念必須在 core/tag-definitions.ts 集中註冊，禁止業務切片私自創建隱性語義分類
%%  D21-B Schema 鎖定：標籤元數據必須符合 core/schemas 定義，禁止附加任何未經校驗的非結構化屬性
%%  D21-C 無孤立節點：每個新標籤建立時必須透過 hierarchy-manager.ts 掛載至少一個有效父級節點（→ D21-3 強化版）
%%  D21-D 向量一致性：embeddings/vector-store.ts 中的向量必須隨 core/tag-definitions.ts 定義同步刷新，延遲 ≤ 60s
%%  D21-E 權重透明化：語義相似度計算與路徑權重生成必須由 weight-calculator.ts 統一輸出，禁止消費方自行推算
%%  D21-F 注意力隔離：context-attention.ts 必須根據當前 Workspace 情境過濾無關標籤，防止語義噪聲污染路由結果
%%  D21-G 演化回饋環：learning-engine.ts 僅能依據 VS3（排班）/ VS2（任務）的真實事實事件進行神經元強度調整，
%%                    禁止手動隨機修改或注入合成數據；每次調整須附帶來源事件溯源
%%  D21-H 血腦屏障（BBB）：invariant-guard.ts 對語義衝突具有最高裁決權，可直接攔截並拒絕違反物理邏輯的提案，
%%                          其決策優先於 consensus-engine 與 learning-engine
%%  D21-I 全域共識律：標籤治理決策開放全部組織用戶提案，所有提案必須通過 consensus-engine 的邏輯一致性校驗
%%  D21-J 知識溯源：每條標籤關係的建立必須標註貢獻者 ID 與參考依據（事件 ID / 文件 ID），具備完整版本回溯能力
%%  D21-K 語義衝突裁決：invariant-guard 偵測到違反物理邏輯（如循環繼承、矛盾語義）的聯結時直接拒絕提案並產生拒絕事件
%%  D21-S 同義詞重定向：標籤合併完成後舊標籤自動成為 Alias，所有歷史數據引用自動重定向至主標籤，禁止直接刪除舊標籤
%%  D21-T 命名共識律：標籤顯示名稱由社群貢獻度決定（可演化），tagSlug 作為永久技術識別碼不得修改
%%  D21-U 禁止重複定義：新增標籤時 embeddings 必須即時計算相似度並提示語義接近的現有標籤，阻止靜默重複
%%  D21-V 提案鎖定機制：處於「併購爭議中（Pending-Sync）」的標籤其路由權重凍結為 0.5 中性值，直到共識達成
%%  D21-W 跨組織透明性：所有標籤修改紀錄對全域公開，任何組織用戶均可查看完整演化歷程與責任歸屬
%%  D21-X 語義自動激發：用戶建立 A→B 關聯時，causality-tracer 自動建議語義相近的節點 C 作為潛在連結候選
%%  D22 跨切片 tag 語義引用：必須指向 TE1~TE6 實體節點，禁止隱式 tagSlug 字串引用
%%  D23 tag 語義標注格式：節點內 → tag::{category}；邊 → -.->|"{dim} tag 語義"|
%%  ── Firebase 隔離守則（D24~D25）──
%%  D24 feature slice / shared/types / app 層禁止直接 import firebase/*
%%      所有 Firebase SDK 呼叫必須透過 FIREBASE_ACL 對應 Adapter
%%      Adapter 路徑：src/shared/infra/{auth|firestore|messaging|storage}
%%  D25 新增 Firebase 功能必須在 FIREBASE_ACL 新增 Adapter 實作對應 SK_PORTS Port
%%  ── Cross-cutting Authority 守則（D26）──
%%  D26 Cross-cutting Authority 治理：
%%      global-search.slice 為唯一跨域搜尋權威，各業務 Slice 禁止自建搜尋邏輯
%%      notification-hub (VS7) 為唯一副作用出口，業務 Slice 禁止直接調用 sendEmail/push/SMS
%%      兩者須擁有自己的 _actions.ts / _services.ts [D3]，不得寄生於 shared-kernel [D8]
%%  ── 成本語義路由守則（D27）──
%%  D27 CostItemType Semantic Routing（成本語義路由三層架構）：
%%      Layer-1（原始解析）：document-parser 解析文件 → 產生 raw ParsedLineItem[]
%%      Layer-2（語義分類）：VS5 document-parser-view 呼叫 VS8 classifyCostItem(name) → CostItemType
%%                           classifyCostItem 為純函式（[D8] 禁止 async / Firestore / 副作用）
%%                           優先級：EXECUTABLE override > MANAGEMENT > RESOURCE > FINANCIAL > PROFIT > ALLOWANCE > EXECUTABLE(預設)
%%                           EXECUTABLE override 舉例：機電檢測、qc test、現場試驗、commissioning、調試 等施工測試關鍵字
%%                           ALLOWANCE 舉例：差旅、運輸、勘查、工安補貼（不可物化為 task）
%%                           PROFIT 舉例：利潤（不可物化為 task）
%%                           CostItemType：EXECUTABLE | MANAGEMENT | RESOURCE | FINANCIAL | PROFIT | ALLOWANCE
%%                           標注結果寫入 ParsedLineItem.costItemType，隨 DocumentParserItemsExtractedPayload 傳遞
%%      Layer-3（語義路由）：use-workspace-event-handler.tsx Semantic Router
%%                           [D27-gate] shouldMaterializeAsTask(item.costItemType) → 此函式是唯一的物化閘門
%%                           禁止在 workspace.slice 內直接寫 `=== CostItemType.EXECUTABLE`；必須呼叫 shouldMaterializeAsTask() [D27]
%%                           只有 shouldMaterializeAsTask() 返回 true 的項目才能物化為 WorkspaceTask
%%                           物化同時寫入 sourceIntentIndex（項目在原始文件中的位置）以確保任務清單排序一致 [D27-ORDER]
%%                           其餘類型：靜默跳過 + toast 通知（禁止物化為 tasks [#A14]）
%%      [D27-ORDER] 任務排序不變量：tasks-view.tsx 須先按 createdAt（批次間），再按 sourceIntentIndex（批次內），確保任務順序與來源文件一致。
%%      禁止 VS5 document-parser 自行實作成本語義邏輯；必須透過 VS8 classifyCostItem() [D27]
%%      禁止 Layer-3 Semantic Router 繞過 costItemType 直接物化非 EXECUTABLE 項目
%%  ╚══════════════════════════════════════════════════════════════════════════╝
