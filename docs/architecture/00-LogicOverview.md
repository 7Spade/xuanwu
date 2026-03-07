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
%%    Architecture rules       → docs/architecture/00-LogicOverview.md  ← THIS FILE
%%    Semantic relations       → docs/knowledge-graph.json
%%    VS8 complete-body guide  → docs/architecture/03-Slices/VS8-SemanticBrain/D21-Body-8Layers.md  (companion spec)
%%  RULE SENTENCE TEMPLATE（規則句模板）:
%%    MUST     : IF <條件> THEN <必須行為>
%%    SHOULD   : IF <情境> THEN <建議行為>
%%    FORBIDDEN: IF <情境> THEN MUST NOT <禁止行為>
%%  RULE CLASSIFICATION（分類）:
%%    MUST(R/S/A/#) = 穩定不變量；SHOULD(D/P/T/E) = 治理演進；FORBIDDEN = 絕對禁止
%%  ╠══════════════════════════════════════════════════════════════════════════╣
%%  QUICK REFERENCE（快速索引 — 最速取得上下文）
%%  ── Vertical Index（領域編號 · VS0–VS8）──
%%    VS0=Foundation（SharedKernel + SharedInfra）  VS1=Identity   VS2=Account      VS3=Skill
%%    VS4=Organization  VS5=Workspace  VS6=Workforce-Scheduling   VS7=Notification
%%    VS8=SemanticGraphEngine
%%    Path Map: VS0=src/shared-kernel + src/shared-infra/frontend-firebase + src/shared-infra/observability
%%              VS1=src/features/identity.slice   VS2=src/features/account.slice
%%              VS3=src/features/skill-xp.slice   VS4=src/features/organization.slice
%%              VS5=src/features/workspace.slice  VS6=src/features/workforce-scheduling.slice
%%              VS7=src/features/notification-hub.slice  VS8=src/features/semantic-graph.slice
%%    VS0 內部分層（Foundation Plane）:
%%      src/shared-kernel                   = VS0-Kernel（L1 契約層）
%%      src/shared-kernel/observability     = VS0-Kernel（L1 Observability Contracts only：types/interfaces，非 runtime node）
%%      src/shared-infra/*                  = VS0-Infra Plane（L6/L7/L8/L9 執行層）
%%      L6 現況實作路徑（過渡）: src/features/infra.gateway-query（Ownership 屬 VS0-Infra）
%%      src/features/projection.bus         = L5 Projection Bus（非 VS0）
%%      src/shared-infra/observability      = VS0-Infra（L9 Observability Runtime）
%%    命名規則：VS0=Foundation Index（L1+L6+L7+L8+L9）；VS1~VS8=業務切片編號（L3）
%%    VS0 識別規格（文件/審查一律使用）:
%%      VS0-Kernel = src/shared-kernel/*（pure contracts/constants/functions，禁止 I/O）
%%      VS0-Infra  = src/shared-infra/*（L6/L7/L8/L9 execution plane；包含 adapter/gateway/observability 實作）
%%      Observability 分層規則：L1 只允許 observability contracts；L9 runtime sink/counter/trace provider 只允許在 src/shared-infra/observability
%%      禁止只寫「VS0」而不標註 -Kernel 或 -Infra（避免語義歧義）
%%      VS0 視圖分拆規則：同一 VS0 會在圖中拆為「L1 VS0-Kernel」與「L6~L9 VS0-Infra」兩塊呈現；
%%      此為 Layer 可讀性分圖，非領域切割（Domain Ownership 仍同屬 VS0/Foundation）
%%  ── Cross-cutting Authorities（跨切片權威）──
%%    global-search.slice  = 語義門戶（唯一跨域搜尋權威 · 對接 VS8 語義索引）
%%    notification-hub.slice = 反應中樞（VS7 增強 · 唯一副作用出口 · 標籤感知路由）
%%    ※ 兩者皆須擁有自己的 _actions.ts / _services.ts，不得寄生於 shared-kernel [D3 D8]
%%  ── Layer（系統層）──
%%    L0=ExternalTriggers   L1=SharedKernel       L2=CommandGateway
%%    L3=DomainSlices       L4=IER                L5=ProjectionBus
%%    L6=QueryGateway       L7=FirebaseACL         L8=FirebaseInfra      L9=Observability
%%    ※ L3 Domain Slices = VS1(Identity) · VS2(Account) · VS3(Skill) ·
%%                          VS4(Organization) · VS5(Workspace) · VS6(Workforce-Scheduling) ·
%%                          VS7(Notification) · VS8(SemanticGraph)
%%    ※ VS0(Foundation) 不屬於 L3 Domain Slices；其中 VS0-Kernel=L1，VS0-Infra=L6/L7/L8/L9
%%    ※ 邊界澄清：VS0-Kernel=L1（契約）；VS0-Infra=L6/L7/L8/L9（執行層，含觀測）
%%  ── 標準目錄結構（Standard Directory Structure · 單向依賴鏈對齊）──
%%    src/
%%      shared-kernel/                          # VS0-Kernel / L1: contracts/constants/pure zone
%%      shared-kernel/observability/            # VS0-Kernel / L1: observability contracts only (no side effects)
%%      shared-infra/frontend-firebase/         # VS0-Infra / L7: Firebase ACL adapters only
%%        auth/
%%        firestore/
%%        messaging/
%%        storage/
%%      shared-infra/observability/             # VS0-Infra / L9: metrics/errors/trace observability
%%      features/
%%        infra.external-triggers/              # L0: external triggers
%%        infra.gateway-command/                # L2: CBG_ENTRY/CBG_AUTH/CBG_ROUTE orchestration
%%        infra.event-router/                   # L4: IER core + lanes
%%        infra.outbox-relay/                   # L4: outbox relay worker
%%        infra.gateway-query/                  # L6: query gateway/read registry
%%        projection.bus/                       # L5: projection funnel + read model materialization
%%        identity.slice/                       # L3 VS1
%%        account.slice/                        # L3 VS2
%%        skill-xp.slice/                       # L3 VS3
%%        organization.slice/                   # L3 VS4
%%        workspace.slice/                      # L3 VS5
%%        workforce-scheduling.slice/           # L3 VS6
%%        notification-hub.slice/               # L3 VS7 (authority exit)
%%        semantic-graph.slice/                 # L3 VS8 (semantic authority)
%%        global-search.slice/                  # L3 cross-cut authority (search exit)
%%    app/                                      # UI entry; read-only via L6
%%  ── Logic-First Placement Matrix（新增檔案放置判斷：禁止以 token 最小化取代邏輯）──
%%    最高指標：邏輯正確（Layer+Boundary+Ownership）> 寫法簡短
%%    A. 層級與依賴規則（Layering & Dependency）
%%      - 純契約/常數/純函式（無 I/O）→ src/shared-kernel/*（VS0-Kernel / L1）
%%      - Observability 契約（TraceContext/DomainErrorEntry/interfaces）→ src/shared-kernel/observability/*（L1, contract-only）
%%      - Firebase SDK 邊界 → src/shared-infra/frontend-firebase/*（VS0-Infra / L7）
%%      - 讀取編排（Read registry）→ src/features/infra.gateway-query/*（L6, ownership=VS0-Infra）
%%      - 觀測執行能力（trace provider / metrics recorder / error logger）→ src/shared-infra/observability/*（L9, ownership=VS0-Infra）
%%      - 領域規則（aggregate/policy/invariant）→ src/features/{slice}.slice/*（L3）
%%    B. 邊界與上下文（Boundary & Context）
%%      - 跨業務共用且非業務語義 = VS0（Kernel 或 Infra）
%%      - 業務語義與狀態機 = 對應 Feature Slice（L3）
%%      - Cross-cutting Authority（搜尋/通知）= L3 權威切片，不得寄生 shared-kernel
%%    C. 通訊與協調機制（Communication & Coordination）
%%      - 寫入協調 = L2（infra.gateway-command）
%%      - 事件路由/relay/DLQ = L4（infra.event-router / infra.outbox-relay / infra.dlq-manager）
%%      - 投影物化 = L5（projection.bus）
%%      - 讀取出口 = L6（infra.gateway-query）
%%    D. 狀態與副作用（State & Side Effects）
%%      - shared-kernel 禁止 async/Firestore/side effects [D8]
%%      - shared-kernel/observability 禁止 runtime sink（console/network/db）、禁止 mutable counter、禁止 clock/random 實作
%%      - 任何 sink 寫入、runtime counter、clock/random、console 皆視為副作用，必須在 VS0-Infra 或對應執行層
%%    E. 權力歸屬（Authority Ownership）
%%      - Query 權威屬 L6（ownership=VS0-Infra）
%%      - Firebase SDK 權威屬 L7（FIREBASE_ACL）
%%      - Observability Contract Authority 屬 L1（src/shared-kernel/observability）
%%      - Observability Runtime Authority 屬 L9（src/shared-infra/observability）
%%      - Search/Notification 權威屬各自 cross-cutting slice [D26]
%%    F. 變動速率（Rate of Change）
%%      - 慢變契約（types/contracts）放 L1
%%      - 中變整合（adapter/gateway/observability）放 VS0-Infra
%%      - 快變業務流程放 L3
%%    判斷速記：先判斷邏輯層與權力歸屬，再決定路徑；不得反向以既有路徑合理化設計。
%%  ── 依賴方向約束（對應目錄）──
%%    寫鏈：infra.external-triggers → infra.gateway-command → *.slice → infra.event-router → projection.bus
%%    讀鏈：app/UI → infra.gateway-query → projection.bus
%%    Infra鏈：*.slice/projection/query → shared-kernel(SK_PORTS) → shared-infra/frontend-firebase(FIREBASE_ACL)
%%  ── RULESET-MUST（不可違反）: R · S · A · # ──
%%    R1=relay-lag-metrics   R5=DLQ-failure-rule   R6=workflow-state-rule
%%    R7=aggVersion-relay    R8=traceId-readonly
%%    S1=OUTBOX-contract     S2=VersionGuard       S3=ReadConsistency
%%    S4=Staleness-SLA       S5=Resilience         S6=TokenRefresh
%%    A3=workflow-blockedBy  A5=scheduling-saga    A8=1cmd-1agg
%%    A9=scope-guard         A10=notification-stateless
%%    A12=global-search-authority   A13=notification-hub-authority
%%    A14=cost-semantic-dual-key
%%    A15=finance-lifecycle-gate    A16=multi-claim-cycle   A17=skill-xp-award-contract
%%  ── RULESET-SHOULD（可演化治理）: D · P · T · E ──
%%    D7=cross-slice-index-only   D24=no-firebase-import D26=cross-cutting-authority
%%    D27=cost-semantic-routing   D27-A=semantic-aware-routing-policy
%%    D27-Order=single-direction-chain   D27-Gate=task-materialization-gate   D22=strong-typed-tag-ref
%%    D21=VS8-semantic-engine-governance（四層語義引擎 D21-1~D21-10 + D21-A~D21-X）
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
%%  ── RULESET-MUST · VS6 Workforce Scheduling SSOT（產品推導約束）──
%%    [D27-Order] 單向鏈：WorkspaceItem → WorkspaceTask → Schedule（禁止跳級）
%%    健康設計鏈：WorkspaceItem → WorkspaceTask（無時間） → WorkspaceSchedule（有時間） → OrganizationSchedule（人力指派）
%%    [D27-Gate] 任務物化唯一入口：shouldMaterializeAsTask()；僅 EXECUTABLE 可物化
%%    [SK_SKILL_REQ] 指派校驗必須引用跨片人力需求契約
%%    [VS8-Tag] 能力與視覺判定僅可讀 tag-snapshot（禁止讀 Account 原始技能資料）
%%    [L5-Bus] Calendar/Timeline 屬 Read Side，分別物化日期維度與資源維度
%%    [S2] 投影寫入必經 applyVersionGuard()，防止亂序覆寫
%%    [L6-Gateway] UI 禁止直讀 VS6/Firebase，僅可經 Query Gateway 讀取
%%    [Timeline] overlap/resource-grouping 邏輯下沉 L5，前端僅渲染
%%  ── RULESET-MUST · VS3 Skill XP SSOT（產品推導約束）──
%%    [A17] XP 授予來源必須是 VS5 任務事實（TaskCompleted）與品質事實（QualityAssessed）
%%    [A17] 計算公式：awardedXp = baseXp × qualityMultiplier × policyMultiplier（含 min/max clamp）
%%    [A17] VS8 僅提供 semanticTagSlug / policy lookup；XP ledger 寫入權限只在 VS3
%%  ── RULESET-MUST · Layering Rules（層級通訊規則）──
%%    External → L2 CMD_GWAY（寫） / L6 QGWAY（讀）
%%    單向依賴鏈（寫鏈）= L0 → L2 → L3 → L4 → L5（禁止回跳）
%%    單向依賴鏈（讀鏈）= L0/UI → L6 → L5（Read Model）
%%    基礎設施依賴鏈 = L3/L5/L6 → L1(SK_PORTS/Contracts) → L7(FIREBASE_ACL) → L8(Firebase)
%%    L3 Slice ↔ L3 Slice = 禁止直接 mutate；僅可透過 L4 IER 事件協作 [#2 D9]
%%    L3 → L5 Projection 寫入 = 禁止直寫；必須經 event-funnel [#9 S2]
%%    L3 讀取語義 = 僅可經 VS8 projection.tag-snapshot [D21-7 T5]
%%    任意層直連 firebase/* = 禁止；僅 L7 FIREBASE_ACL 可呼叫 SDK [D24 D25]
%%  ── RULESET-MUST · Authority Exits（權威出口白名單）──
%%    Search Exit     = global-search.slice（唯一跨域搜尋權威）[D26 #A12]
%%    Side-effect Exit= notification-hub.slice（唯一通知副作用出口）[D26 #A13]
%%    Semantic Exit   = VS8 Semantic Cognition Engine（語義註冊/推理/投影）[D21]
%%    Finance Routing = VS8 decision/_cost-classifier + VS5 Layer-3 gate [D27 #A14]
%%  ── RULESET-SHOULD · Governance Focus（治理與演化焦點）──
%%    Stable Core     = R/S/A/#（Hard Invariants，版本演進不可破壞）
%%    Evolution Track = D/P/T/E（可演化規則，以索引引用，不重複定義）
%%    Team Gate       = L/R/A 同時成立（Layer/Rule/Atomicity）
%%  ── RULESET-SHOULD · Downstream Priorities（下沉優先清單）──
%%    1) Shared Kernel Contracts：S4/R8/SK_CMD_RESULT 集中定義，禁止各 Slice 重複宣告
%%    2) Semantic Governance：D22 強型別標籤 + VS8 cost-classifier；業務端禁止自建分類邏輯
%%    3) Consistency Infrastructure：S2 下沉 Projection Bus/FIREBASE_ACL；S3 由 L6 Query Gateway 統一路由
%%    4) Firebase ACL：D24 嚴格防腐；Feature Slice 僅可依賴 SK_PORTS，不得直連 firebase/*
%%    5) Authority Exits：D26 收口 Global Search / Notification Hub，業務端只產生事實事件
%%  ── OPTIMIZATION ADOPTION（落地採納清單 · 單向依賴鏈版）──
%%    MUST: IF 需要呼叫 Firebase SDK THEN 必須經 L7 FIREBASE_ACL；且 aggregateVersion 守衛必須在 L5/L7 生效
%%    MUST: IF 事件鏈需要 traceId THEN 僅能由 CBG_ENTRY 注入；L9 僅可觀測不可生成
%%    MUST: IF UI 讀取業務資料 THEN 必須經 L6 Query Gateway；Timeline overlap/grouping 必須下沉 L5
%%    MUST: IF 涉及 SLA/Outbox/Resilience/EventEnvelope THEN 必須引用 L1 契約，不得切片內重定義
%%    MUST: IF 屬跨片共用契約（如 SK_SKILL_REQ）THEN 必須集中於 L1，切片僅可引用
%%    MUST: IF 涉及全域語義註冊 THEN 必須在 VS8 Core Domain（CTA/tag-definitions）定義，非 Shared Kernel
%%    SHOULD: IF 設計 L2 Command Gateway 下沉 THEN 僅下沉契約/型別到 L1；協調流程保留 L2
%%  ╠══════════════════════════════════════════════════════════════════════════╣
%%  ARCHITECTURE CONTROL PLANE（四大治理視圖 · 規則句版）
%%  ── CP1 MUST：Hard Invariants（系統穩定基石）──
%%    任何重構不得破壞：traceId 唯讀（R8）、版本守衛（S2）、SLA 常數單一真相（S4）、
%%    跨切片公開 API 邊界（D7）、副作用與搜尋權威出口（A12/A13）。
%%  ── CP2 MUST：Cross-cutting Authorities（職責邊界與權威出口）──
%%    全域搜尋只經 Global Search；通知副作用只經 Notification Hub；
%%    任務語義與成本決策只經 VS8（禁止切片私有實作）。
%%  ── CP3 MUST：Layering Rules（層級通訊）──
%%    命令由 L2 收口、事件由 L4 分發、投影由 L5 物化、讀取由 L6 暴露；
%%    Feature Slice 不得跨層旁路（含 Firebase SDK 旁路與 Projection 直寫）。
%%  ── CP4 SHOULD：Governance Rules（治理與演化）──
%%    新規則先索引、再實作；優先引用現有契約；未定義語義需先進 VS8 註冊；
%%    D27 屬 Extension Gate，僅影響 document-parser / finance-routing 變更。
%%  ╠══════════════════════════════════════════════════════════════════════════╣
%%  FINAL REVIEW BASELINE（最終態審查基準 · Team Gate）
%%  ── Scope（本輪必審）──
%%    1) VS0~VS8：每個編號域必須有明確層位與單一職責（VS0=L1+L6+L7+L8+L9；VS1~VS8=L3）
%%    1a) VS0 檢核：每個 VS0 路徑必須標明 VS0-Kernel 或 VS0-Infra（不得混稱）
%%    2) D1~D26：列為 Mandatory Gate（PR 必須全通過）
%%    3) TE1~TE6：語義引用必須強型別，禁止裸字串 tagSlug
%%    4) S1~S6：契約與 SLA 僅能引用 SK_* 常數，禁止硬寫
%%    5) L/R/A：Layer 合規 / Rule 合規 / Atomicity 合規 必須同時成立
%%  ── D27 定位（擴展）──
%%    D27（成本語義路由）為 Extension Gate；僅在 document-parser / finance-routing 變更時強制審查
%%  ── No-Smell 定義（可作為 Code Review Checklist）──
%%    - 無重複定義：同一規則只保留一個主定義，其他位置僅做索引引用
%%    - 無邊界污染：Feature Slice 不跨邊界 mutate、不直連 firebase/* [D24]
%%    - 無語義漂移：tag 語義只能透過 TE1~TE6 + VS8 CTA 來源 [D21-1 D22]
%%    - 無一致性破口：Projection 全量遵守 S2；SLA 全量遵守 S4
%%    - 無副作用旁路：通知與搜尋必須經 D26 權威出口
%%  ╠══════════════════════════════════════════════════════════════════════════╣
%%  KEY INVARIANTS（RULESET-MUST / 絕對遵守）:
%%    [R8]  traceId 在 CBG_ENTRY 注入一次，全鏈唯讀不可覆蓋
%%    [S2]  所有 Projection 寫入前必須呼叫 applyVersionGuard()
%%    [S4]  SLA 數值只能引用 SK_STALENESS_CONTRACT，禁止硬寫
%%    [D7]  跨切片引用只能透過 {slice}/index.ts 公開 API
%%    [D21] VS8 四層語義引擎：Governance → Core Domain → Compute Engine → Output
%%           （對應模組：registry/protocol/guards/portal → CTA/hierarchy/vector/tags → graph/reasoning/routing/learning → projections/io/decision）
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
%%    [T5] 業務 Slice 僅能訂閱 projections/tag-snapshot.slice.ts，嚴禁直接存取 graph/adjacency-list.ts；
%%         DocumentParser UI 視覺屬性（色彩/icon/分類顯示）必須透過 semantic-graph.slice 投影取得
%%    [D22] 程式碼禁止出現裸字串 tag_name，必須引用 TE1~TE6 常數實體確保重構時語義鏈不斷裂
%%    [D27-A] 語義感知路由：所有分發邏輯必須先調用 policy-mapper/ 轉換語義標籤，禁止 ID 硬編碼路由
%%    [D24] Feature slice 禁止直接 import firebase/*，必須走 SK_PORTS
%%    [D26] global-search = 唯一搜尋權威；notification-hub = 唯一副作用出口
%%    [#A12] Global Search = 唯一跨域搜尋出口，禁止各 Slice 自建搜尋邏輯
%%    [#A13] Notification Hub = 唯一副作用出口，業務 Slice 只產生事件不決定通知策略
%%    [#A14] ParsedLineItem.(costItemType, semanticTagSlug) (Layer-2) 由 VS8 _cost-classifier.ts 標注；
%%           Layer-3 Semantic Router 只允許 EXECUTABLE 項目物化為 tasks，且以 semanticTagSlug 對齊 tag-snapshot，
%%           其餘類型（MANAGEMENT/RESOURCE/FINANCIAL/PROFIT/ALLOWANCE）靜默跳過並 toast
%%    [#A15] Finance 進入閘門：僅 Acceptance=OK 才可進入 Finance；
%%           Claim Preparation 必須以「勾選項目 + 請款數量」建立 claim line items
%%    [#A16] Multi-Claim Cycle：Finance 為可重入循環；
%%           每輪固定為 Claim Preparation → Claim Submitted → Claim Approved → Invoice Requested
%%           → Payment Term（計時中）→ Payment Received（收款確認）；
%%           Payment Term 計時起點=Invoice Requested，終點=PaymentReceived；
%%           直到 outstandingClaimableAmount = 0 才允許 Completed
%%  FORBIDDEN（RULESET-FORBIDDEN）:
%%    BC_X 禁止直接寫入 BC_Y aggregate → 必須透過 IER Domain Event
%%    TX Runner 禁止產生 Domain Event → 只有 Aggregate 可以 [#4b]
%%    SECURITY_BLOCK DLQ → 禁止自動 Replay，必須人工審查
%%    B-track 禁止回呼 A-track → 只能透過 Domain Event 溝通
%%    Feature slice 禁止直接 import firebase/* [D24]
%%    Feature slice 禁止直接 import @/shared-infra/*；僅可依賴 SK_PORTS / Query Gateway / slice public API
%%    Feature slice 禁止自建搜尋邏輯，必須透過 Global Search [D26 #A12]
%%    Feature slice 禁止直接 call sendEmail/push/SMS，必須透過 Notification Hub [D26 #A13]
%%    禁止 L6 Query Gateway 反向驅動 L2 Command Gateway（讀寫鏈不得形成回饋環）
%%    禁止 VS8 直接下命令至 VS5/VS6；僅可透過 L4 事件或 L5/L6 投影互動
%%    VS5 document-parser 禁止自行實作成本語義邏輯，必須呼叫 VS8 classifyCostItem() [D27 #A14]
%%    Layer-3 Semantic Router 禁止繞過 costItemType 直接物化非 EXECUTABLE 項目為 tasks [D27]
%%    Workflow 禁止在 Acceptance 未達 OK 前進入 Finance [#A15]
%%    Claim Preparation 禁止送出空請款（未勾選任何項目）或 quantity ≤ 0 的 line item [#A15]
%%    Finance 禁止跳過 Claim/Invoice/PaymentTerm 任一步驟直接收款確認 [#A16]
%%    outstandingClaimableAmount > 0 時禁止標記 Completed [#A16]
%%    ParsingIntent.lineItems 禁止缺少 semanticTagSlug；UI 視覺屬性禁止直接讀 adjacency-list，必須讀 tag-snapshot [T5]
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
%%    VS8 禁止直接寫入 VS3 XP aggregate/ledger；僅可提供 semanticTag 與 policy lookup [A17]
%%    VS5 任務/品質流程禁止直接 mutate VS3 XP；必須透過 IER 事件進入 VS3 [#2 D9 A17]
%%  ╚══════════════════════════════════════════════════════════════════════════╝

flowchart TD

%% ═══════════════════════════════════════════════════════════════
%% LAYER 0 ── EXTERNAL TRIGGERS（外部觸發入口）
%% ═══════════════════════════════════════════════════════════════

subgraph EXT["🌐 L0 · External Triggers（app/* + src/features/infra.external-triggers）"]
    direction LR
    EXT_CLIENT["Next.js Client\n_actions.ts [S5]"]
    EXT_AUTH["Firebase Auth\n登入 / 註冊 / Token"]
    EXT_WEBHOOK["Webhook / Edge Fn\n[S5] 遵守 SK_RESILIENCE_CONTRACT"]
end

%% ═══════════════════════════════════════════════════════════════
%% LAYER 1 ── SHARED KERNEL（VS0-Kernel 共用核心契約）
%% ═══════════════════════════════════════════════════════════════

subgraph SK["🔷 L1 · Shared Kernel（VS0-Kernel · src/shared-kernel）— 契約/常數/純函式（No I/O）"]
    direction TB

    subgraph SK_DATA["📄 基礎資料契約（src/shared-kernel/data-contracts）[#8]"]
        direction LR
        SK_ENV["event-envelope\nversion · traceId · causationId · correlationId · timestamp\nidempotency-key = eventId+aggId+version\n[R8] traceId 整鏈共享・不可覆蓋\ncausationId = 觸發此事件的命令/事件 ID\ncorrelationId = 同一 saga/replay 的關聯 ID"]
        SK_AUTH_SNAP["authority-snapshot\nclaims / roles / scopes\nTTL = Token 有效期"]
        SK_SKILL_TIER["skill-tier（純函式）\ngetTier(xp)→Tier\n永不存 DB [#12]"]
        SK_SKILL_REQ["skill-requirement\ntagSlug × minXp\n跨片人力需求契約"]
        SK_CMD_RESULT["command-result-contract\nSuccess { aggregateId, version }\nFailure { DomainError }\n前端樂觀更新依據"]
    end

    subgraph SK_INFRA["⚙️ 基礎設施行為契約（src/shared-kernel/infra-contracts）[#8]"]
        direction LR

        SK_OUTBOX["📦 SK_OUTBOX_CONTRACT [S1]\n① at-least-once\n   EventBus → OUTBOX → RELAY → IER\n② idempotency-key 必帶\n   格式：eventId+aggId+version\n③ DLQ 分級宣告（每 OUTBOX 必填）\n   SAFE_AUTO      冪等事件・自動重試\n   REVIEW_REQUIRED 金融/排班/角色・人工審\n   SECURITY_BLOCK  安全事件・凍結+告警"]

        SK_VERSION["🔢 SK_VERSION_GUARD [S2]\nevent.aggregateVersion\n  > view.lastProcessedVersion → 允許更新\n  否則 → 丟棄（過期事件不覆蓋）\n適用全部 Projection [#19]"]

        SK_READ["📖 SK_READ_CONSISTENCY [S3]\nSTRONG_READ  → Aggregate 回源\n  適用：金融・安全・不可逆\nEVENTUAL_READ → Projection\n  適用：顯示・統計・列表\n規則：餘額/授權/排班衝突 → STRONG_READ"]

        SK_STALE["⏱ SK_STALENESS_CONTRACT [S4]\nTAG_MAX_STALENESS    ≤ 30s\nPROJ_STALE_CRITICAL  ≤ 500ms\nPROJ_STALE_STANDARD  ≤ 10s\n各節點引用此常數・禁止硬寫數值"]

        SK_RESILIENCE["🛡 SK_RESILIENCE_CONTRACT [S5]\nR1 rate-limit   per user ∪ per org → 429\nR2 circuit-break 連續 5xx → 熔斷\nR3 bulkhead     切片隔板・獨立執行緒池\n適用：_actions.ts / Webhook / Edge Function"]

        SK_TOKEN["🔄 SK_TOKEN_REFRESH_CONTRACT [S6]\n觸發：RoleChanged | PolicyChanged\n  → IER CRITICAL_LANE → CLAIMS_HANDLER\n完成：TOKEN_REFRESH_SIGNAL\n客端義務：強制重取 Firebase Token\n失敗：→ DLQ SECURITY_BLOCK + 告警"]
    end

    subgraph SK_PORTS["🔌 Infrastructure Ports（依賴倒置介面 src/shared-kernel/ports；由 L7 Adapter 實作）[D24]"]
        direction LR
        I_AUTH["IAuthService\n身份驗證 Port"]
        I_REPO["IFirestoreRepo\nFirestore 存取 Port [S2]"]
        I_MSG["IMessaging\n訊息推播 Port [R8]"]
        I_STORE["IFileStore\n檔案儲存 Port"]
    end

    subgraph SK_OBS_CONTRACT["📘 L1 · Observability Contracts（src/shared-kernel/observability）[D8]"]
        direction LR
        SK_TRACE_CTX["TraceContext / ITraceProvider\ncontract-only"]
        SK_METRICS_IF["EventCounters / IMetricsRecorder\ncontract-only"]
        SK_ERR_IF["DomainErrorEntry / IErrorLogger\ncontract-only"]
    end

end

subgraph SHARED_INFRA_PLANE["🧩 Shared Infrastructure Plane（VS0-Infra：L6/L7/L8/L9 Execution Plane；與 VS0-Kernel 同屬 VS0）"]
        direction TB

        subgraph GW_QUERY["🟢 L6 · Query Gateway（impl: src/features/infra.gateway-query；ownership: VS0-Infra）[S2 S3]"]
            direction LR
            QGWAY["read-model-registry\n統一讀取入口\n版本對照 / 快照路由\n[S2] 所有 Projection 遵守 SK_VERSION_GUARD"]
            QGWAY_SCHED["→ .org-eligible-member-view\n[#14 #15 #16]"]
            QGWAY_CAL["→ .schedule-calendar-view\n日期維度（UI 禁止直讀 VS6/Firebase）"]
            QGWAY_TL["→ .schedule-timeline-view\n資源維度（overlap/grouping 已預計算）"]
            QGWAY_NOTIF["→ .account-view\n[#6] FCM Token"]
            QGWAY_SCOPE["→ .workspace-scope-guard-view\n[#A9]"]
            QGWAY_WALLET["→ .wallet-balance\n[S3] 顯示 → Projection\n精確交易 → STRONG_READ"]
            QGWAY_SEARCH["→ .tag-snapshot\n語義化索引檢索"]
            QGWAY_SEM_GOV["→ .semantic-governance-view\n語義治理頁讀模型（提案/共識/關係）\n治理頁顯示必經 L5 投影"]
            QGWAY --> QGWAY_SCHED & QGWAY_CAL & QGWAY_TL & QGWAY_NOTIF & QGWAY_SCOPE & QGWAY_WALLET & QGWAY_SEARCH & QGWAY_SEM_GOV
        end

        subgraph FIREBASE_ACL["🔌 L7 · Firebase ACL Adapters（VS0-Infra · src/shared-infra/frontend-firebase）[D24 D25]"]
            direction LR

            AUTH_ADP["auth.adapter.ts\nAuthAdapter\n實作 IAuthService\nFirebase User ↔ Auth Identity\n[D24] 唯一合法 firebase/auth 呼叫點"]

            FSTORE_ADP["firestore.facade.ts\nFirestoreAdapter\n實作 IFirestoreRepo\n[S2] aggregateVersion 單調遞增守衛\n[D24] 唯一合法 firebase/firestore 呼叫點"]

            FCM_ADP["messaging.adapter.ts\nFCMAdapter\n實作 IMessaging\n[R8] 注入 envelope.traceId → FCM metadata\n禁止在此生成新 traceId\n[D24] 唯一合法 firebase/messaging 呼叫點"]

            STORE_ADP["storage.facade.ts\nStorageAdapter\n實作 IFileStore\nPath Resolver / URL 簽發\n[D24] 唯一合法 firebase/storage 呼叫點"]
        end

        subgraph FIREBASE_EXT["☁️ L8 · Firebase Infrastructure（外部平台 SDK Runtime）"]
            direction LR
            F_AUTH[("Firebase Auth\nfirebase/auth")]
            F_DB[("Firestore\nfirebase/firestore")]
            F_FCM[("Firebase Cloud Messaging\nfirebase/messaging")]
            F_STORE[("Cloud Storage\nfirebase/storage")]
        end

        subgraph OBS_LAYER["⬜ L9 · Observability（src/shared-infra/observability）"]
            direction LR
            TRACE_ID["trace-identifier\nCBG_ENTRY 注入 TraceID\n整條事件鏈共享 [R8]"]
            DOMAIN_METRICS["domain-metrics\nIER 各 Lane Throughput/Latency\nFUNNEL 各 Lane 處理時間\nOUTBOX_RELAY lag [R1]\nRATELIMIT hit / CIRCUIT open"]
            DOMAIN_ERRORS["domain-error-log\nWS_TX_RUNNER\nSCHEDULE_SAGA\nDLQ_BLOCK 安全事件 [R5]\nStaleTagWarning\nTOKEN_REFRESH 失敗告警 [S6]"]
        end
end

SK_OBS_CONTRACT -.->|"contract bind"| OBS_LAYER

%% ─── VS8 Semantic Cognition Engine（語義認知引擎）
%% ─── 四層架構（可維護視圖）：
%% ───   ① Governance（治理）: registry / protocol / guards / portal
%% ───   ② Core Domain（核心語義域）: CTA / hierarchy / vector / tag entities
%% ───   ③ Compute Engine（計算引擎）: graph / reasoning / routing / learning
%% ───   ④ Output（輸出）: projections / event-broadcast / decision-policy
%% ─── 向下相容：VS8_CL ≡ core-domain, VS8_SL ≡ graph-engine, VS8_NG ≡ reasoning-engine, VS8_RL ≡ decision-policy
%% ─── centralized-tag.aggregate 具備 lifecycle，為 domain authority [#A6 #17]
subgraph VS8["🧠 VS8 · Semantic Cognition Engine（src/features/semantic-graph.slice）[#A6 #17]"]
    direction TB

    subgraph VS8_GOV_LAYER["① 🏛️ Semantic Governance Layer（src/features/semantic-graph.slice/governance）"]
        direction TB
        SEM_REG["semantic-registry\n【Semantic SSOT】\n由 centralized-tag.aggregate 提供唯一註冊來源\n跨域語義必須先註冊再使用 [D21-A D21-T D21-U]"]
        SEM_PROTOCOL["semantic-protocol\n【訊號協議層】\ncommand/event envelope 與 TagLifecycleEvent 協議\n維持跨模組語義訊號一致 [D21-6 S1 R8]"]

        subgraph VS8_GUARD["1.1 🛡️ guards · Semantic Integrity（src/features/semantic-graph.slice/governance/guards）[D21-H D21-K S4]"]
            direction LR
            INV_GUARD["invariant-guard.ts\n【最高裁決權 · 語義衝突直接拒絕】\n違反物理邏輯聯結 → 攔截提案 [D21-H D21-K]"]
            STALE_MON["staleness-monitor.ts\nTAG_MAX_STALENESS ≤ 30s [S4 D21-8]"]
        end

        subgraph VS8_WIKI["1.2 🏛️ semantic-governance-portal（src/features/semantic-graph.slice/semantic-governance-portal）[D21-I~W]"]
            direction LR
            WIKI_ED["editor\n標籤定義編輯 [D21-J]\n讀取：L6 Query Gateway → semantic-governance-view\n寫入：L2 CMD_GWAY → VS8 CTA（禁止直寫 graph/projection）"]
            PROP_STREAM["proposal-stream/\n提案審議串流 [D21-I D21-V]"]
            REL_VIS["relationship-visualizer/\n語義關係圖視覺化"]
            CONS_ENG["consensus-engine/\n全域共識校驗 [D21-I D21-K]"]
            PROP_STREAM -->|"提案送驗"| CONS_ENG
        end
    end

    subgraph VS8_CORE_LAYER["② 🧬 Semantic Core Domain（src/features/semantic-graph.slice/core）"]
        direction TB

        subgraph VS8_CL["2.1 semantic-core-domain（src/features/semantic-graph.slice/core）[D21-A D21-B D21-C D21-D]"]
            direction LR
            CTA["centralized-tag.aggregate (CTA)\n【全域語義字典・唯一真相】\ntagSlug / label / category\ndeprecatedAt / deleteRule\n生命週期守護：Draft→Active→Stale→Deprecated [D21-4]"]
            HIER["hierarchy-manager.ts\n確保每個新標籤掛載至少一個父節點 [D21-C]"]
            VEC["embeddings/vector-store.ts\n向量隨標籤定義同步刷新 [D21-D]"]
            subgraph TAG_ENTS["🏷️ Semantic Tag Entities（src/shared-kernel/data-contracts/tag-authority）(TE1~TE6) [D21-A]"]
                direction LR
                TE_UL["TE1 · tag::user-level\ncategory: user_level"]
                TE_SK["TE2 · tag::skill\ncategory: skill"]
                TE_ST["TE3 · tag::skill-tier\ncategory: skill_tier"]
                TE_TM["TE4 · tag::team\ncategory: team"]
                TE_RL["TE5 · tag::role\ncategory: role"]
                TE_PT["TE6 · tag::partner\ncategory: partner"]
            end
            CTA --> TAG_ENTS
            CTA --> HIER
            CTA -.-> VEC
        end
    end

    subgraph VS8_ENGINE_LAYER["③ ⚙️ Semantic Compute Engine（src/features/semantic-graph.slice/{graph,reasoning,routing,learning}）"]
        direction TB

        subgraph VS8_SL["3.1 graph-engine（src/features/semantic-graph.slice/graph）[D21-E D21-F D21-9 D21-10]"]
            direction LR
            EDGE_STORE["semantic-edge-store.ts\n【邊關係登錄中心 · 唯一邊圖操作點】\nIS_A / REQUIRES 加權邊 weight ∈ [0,1] [D21-9]\ncost = 1/weight（強連結=近鄰）"]
            WT_CALC["weight-calculator.ts\n【語義相似度統一出口 · 禁止業務端自行加權】\ncomputeSimilarity(a,b) [D21-E]"]
            CTX_ATTN["context-attention.ts\n【Workspace 情境過濾 · 注意力隔離】\nfilterByContext(slugs, wsCtx) [D21-F]"]
            TOPO_OPS["adjacency-list.ts\n拓撲閉包計算（禁止業務端直連 [T5]）\nisSupersetOf / getTransitiveRequirements [D21-10]"]
            EDGE_STORE -.-> WT_CALC
            EDGE_STORE -.-> TOPO_OPS
        end

        subgraph VS8_NG["3.2 reasoning-engine（src/features/semantic-graph.slice/reasoning）[D21-4 D21-6 D21-X]"]
            direction LR
            NEURAL_NET["semantic-distance\ncomputeSemanticDistance(a,b)\nfindIsolatedNodes(slugs[]) [D21-10]\nDijkstra 加權最短路徑"]
            CAUSALITY["🔍 Causality Tracer [D21-6 D21-X]\ntraceAffectedNodes(event, candidates[])\nbuildCausalityChain(event, candidates[])\nBFS 因果傳播 · 語義自動激發"]
            TAG_EV["TagLifecycleEvent（in-process）\neventType: TAG_CREATED | TAG_ACTIVATED\n         | TAG_DEPRECATED | TAG_STALE_FLAGGED\n         | TAG_DELETED\n[D21-6] 因果自動觸發"]
            TAG_OB["tag-outbox\n[SK_OUTBOX: SAFE_AUTO]"]
            TAG_SG["⚠️ TAG_STALE_GUARD\n[S4 D21-8: TAG_MAX_STALENESS ≤ 30s]"]
            NEURAL_NET -.->|"語義距離 [D21-4]"| CAUSALITY
            CAUSALITY -->|"TagLifecycleEvent [D21-6]"| TAG_EV
            TAG_EV --> TAG_OB
            CAUSALITY -.->|"廢棄感知 [D21-8]"| TAG_SG
        end

        subgraph VS8_ROUT["3.3 routing-engine（src/features/semantic-graph.slice/routing）[D21-5 D27-A]"]
            direction LR
            POLICY_MAP["policy-mapper/\n語義標籤→分發策略 [D27-A]\n禁止 ID 硬編碼路由"]
            DISPATCH["dispatch-bridge/\n排班路由 · 通知分發出口"]
            subgraph WORKFLOWS["workflows/（src/features/semantic-graph.slice/workflows）"]
                direction LR
                TAG_PROMO["tag-promotion-flow.ts\n標籤晉升流程"]
                ALERT_FLOW["alert-routing-flow.ts\n告警路由流程"]
            end
            POLICY_MAP --> DISPATCH
        end

        subgraph VS8_PLAST["3.4 learning-engine（src/features/semantic-graph.slice/learning）[D21-G]"]
            direction LR
            LEARN["learning-engine.ts\n【僅 VS3/VS2 事實事件驅動 · 禁止手動隨機修改】\n加權演化回饋環 [D21-G]"]
            DECAY["semantic-decay\n語義強度自然衰退"]
            LEARN -.-> DECAY
        end
    end

    subgraph VS8_OUTPUT_LAYER["④ 📤 Semantic Output Layer（src/features/semantic-graph.slice/{projections,subscribers,outbox,decision}）"]
        direction TB

        subgraph VS8_PROJ["4.1 projections · 讀側投影（src/features/semantic-graph.slice/projections）[D21-7 T5]"]
            direction LR
            TAG_RO["semantic-tag-projection\n【業務端唯一合法讀取出口 · T5】\n[D21-7] 讀取必須經 projection.tag-snapshot\nT1 新切片訂閱事件即可擴展"]
            GRAPH_SEL["projections/graph-selectors.ts\n圖結構唯讀查詢"]
            CTX_SEL["projections/context-selectors.ts\nWorkspace 語義上下文"]
            TAG_RO -.-> GRAPH_SEL
            TAG_RO -.-> CTX_SEL
        end

        subgraph VS8_IO["4.2 event-broadcast · 語義訂閱廣播（src/features/semantic-graph.slice/{subscribers,outbox}）[D21-6 S1]"]
            direction LR
            LIFECYCLE_SUB["subscribers/lifecycle-subscriber.ts\n標籤生命週期事件訂閱"]
            TAG_OUTBOX["outbox/tag-outbox.ts\n[SK_OUTBOX: SAFE_AUTO]\n標籤異動廣播出口"]
        end

        subgraph VS8_RL["4.3 decision-policy · 語義決策輸出（src/features/semantic-graph.slice/decision）[D21-5 D8 D27]"]
            direction LR
            subgraph COST_CLASS["📊 成本語義分類器（src/features/semantic-graph.slice/_cost-classifier.ts）[D8][D24][D27]"]
                direction LR
                COST_CLASSIFIER["_cost-classifier.ts（純函式 [D8]）\nclassifyCostItem(name) → (costItemType, semanticTagSlug)\nshouldMaterializeAsTask(type) → boolean  ★[D27]\n──────────────────────────────\nEXECUTABLE  物理施工任務（預設出口）\nMANAGEMENT  行政/品管/職安管理（含 QC Inspection）\nRESOURCE    倉儲/人力資源儲備\nFINANCIAL   付款里程碑/預付款\nPROFIT      利潤項目（利潤）\nALLOWANCE   耗材/差旅/運輸補貼（含差旅、運輸）\n──────────────────────────────\nsemanticTagSlug 由 VS8 依內容語義掛載（對齊 tagSlug）\n★ EXECUTABLE override 優先：機電檢測/qc test 等施工測試→EXECUTABLE\n禁止 Firestore 存取・禁止 async\n可在任意 Layer 安全呼叫 [D8]"]
            end
        end
    end

    SEM_REG --> CTA
    SEM_PROTOCOL -.->|"protocol drives lifecycle events"| TAG_EV
    SEM_PROTOCOL -.->|"protocol constrains routing I/O"| VS8_ROUT
    SEM_PROTOCOL -.->|"protocol constrains outbox broadcast"| VS8_IO

    VS8_CL -->|"核心語義變更輸入 [D21-6]"| VS8_SL
    VS8_SL -->|"圖結構輸入 [D21-3 D21-9]"| VS8_NG
    VS8_WIKI -.->|"提案呈遞 BBB [D21-H]"| VS8_GUARD
    VS8_NG -.->|"推理結果 [D21-5]"| VS8_ROUT
    VS8_NG -.->|"事件廣播 [D21-6]"| VS8_IO
    VS8_PLAST -.->|"權重回饋 [D21-G]"| VS8_SL
    VS8_PROJ -.->|"唯讀語義輸出 [T5]"| VS8_ROUT
    CTA -.->|"唯讀引用契約 [D21-7]"| TAG_RO
    CTA -.->|"Deprecated 通知 [D21-8]"| TAG_SG
    VS8_NG -.->|"語義路由授權 [D21-5]"| VS8_RL
    CONS_ENG -.->|"治理通過 → BBB 最終裁決 [D21-I D21-K]"| INV_GUARD
end

%% ═══════════════════════════════════════════════════════════════
%% LAYER 2 ── COMMAND GATEWAY（統一寫入閘道）
%% ═══════════════════════════════════════════════════════════════

subgraph GW_CMD["🔵 L2 · Command Gateway（src/features/infra.gateway-command）"]
    direction LR

    subgraph GW_GUARD["🛡️ 入口防護層（src/features/infra.gateway-command）[S5]"]
        RATE_LIM["rate-limiter\nper user / per org\n429 + retry-after"]
        CIRCUIT["circuit-breaker\n5xx → 熔斷 / 半開探針恢復"]
        BULKHEAD["bulkhead-router\n切片隔板・獨立執行緒池"]
        RATE_LIM --> CIRCUIT --> BULKHEAD
    end

    subgraph GW_PIPE["⚙️ Command Pipeline（src/features/infra.gateway-command）"]
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
%% ── VS5=Workspace · VS6=Workforce-Scheduling · VS7=Notification
%% ── VS8=Semantic Graph Engine
%% ═══════════════════════════════════════════════════════════════

%% ── VS1 Identity ──
subgraph VS1["🟦 VS1 · Identity Slice（src/features/identity.slice）"]
    direction TB

    AUTH_ID["authenticated-identity"]
    ID_LINK["account-identity-link\nfirebaseUserId ↔ accountId"]

    subgraph VS1_CTX["⚙️ Context Lifecycle（src/features/identity.slice）"]
        ACTIVE_CTX["active-account-context\nTTL = Token 有效期"]
        CTX_MGR["context-lifecycle-manager\n建立：Login\n刷新：OrgSwitched / WorkspaceSwitched\n失效：TokenExpired / Logout"]
        CTX_MGR --> ACTIVE_CTX
    end

    subgraph VS1_CLAIMS["📤 Claims Management（src/features/identity.slice）[S6]"]
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
subgraph VS2["🟩 VS2 · Account Slice（src/features/account.slice）"]
    direction TB

    subgraph VS2_USER["👤 個人帳號域（src/features/account.slice/user.profile + user.wallet）"]
        USER_AGG["user-account.aggregate"]
        WALLET_AGG["wallet.aggregate\n強一致帳本 [#A1]\n[S3: STRONG_READ]"]
        PROFILE["account.profile\nFCM Token（弱一致）"]
    end

    subgraph VS2_ORG["🏢 組織帳號域（src/features/account.slice；org-account aggregate + settings + binding）"]
        ORG_ACC["organization-account.aggregate"]
        ORG_SETT["org-account.settings"]
        ORG_BIND["org-account.binding\nACL 防腐對接 [#A2]"]
    end

    subgraph VS2_GOV["🛡️ 帳號治理域（src/features/account.slice/gov.role + gov.policy）"]
        ACC_ROLE["account-governance.role\n→ tag::role [TE_RL]"]
        ACC_POL["account-governance.policy"]
    end

    subgraph VS2_EV["📢 Account Events + Outbox（src/features/account.slice）[S1]"]
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
subgraph VS3["🟩 VS3 · Skill XP Slice（src/features/skill-xp.slice）"]
    direction TB

    subgraph VS3_CORE["⚙️ Skill Domain（src/features/skill-xp.slice）"]
        SKILL_AGG["account-skill.aggregate\n【XP 寫入唯一權威】\naccountId / skillId(tagSlug)\nxp / version\n→ tag::skill [TE_SK]\n→ tag::skill-tier [TE_ST]"]
        XP_LED[("account-skill-xp-ledger\nentryId / delta / reason\nsourceId / timestamp [#13]")]
        XP_AWARD["xp-award-policy\n[A17] awardedXp = baseXp × qualityMultiplier × policyMultiplier\n含 min/max clamp，禁止業務端硬寫公式"]
    end

    subgraph VS3_EV["📢 Skill Events + Outbox（src/features/skill-xp.slice）[S1]"]
        SKILL_TASK_SRC["TaskCompleted（from VS5）\nbaseXp + semanticTagSlug"]
        SKILL_QA_SRC["QualityAssessed（from VS5）\nqualityScore"]
        SKILL_EV["SkillXpAdded / SkillXpDeducted\n（含 tagSlug 語義・aggregateVersion）"]
        SKILL_OB["skill-outbox\n[SK_OUTBOX: SAFE_AUTO]\n→ IER STANDARD_LANE"]
        SKILL_EV --> SKILL_OB
    end

    SKILL_TASK_SRC --> XP_AWARD
    SKILL_QA_SRC --> XP_AWARD
    XP_AWARD -->|"deltaXp"| SKILL_AGG
    SKILL_AGG -->|"[#13] 異動必寫 Ledger"| XP_LED
    SKILL_AGG --> SKILL_EV
end

SKILL_AGG -.->|"tagSlug 唯讀引用"| TAG_RO
SKILL_AGG -.->|"skill 語義"| TE_SK
SKILL_AGG -.->|"skill-tier 語義"| TE_ST
SKILL_EV -.->|"事件契約"| SK_ENV
SKILL_EV -.->|"tier 推導契約"| SK_SKILL_TIER

%% ── VS4 Organization ──
subgraph VS4["🟧 VS4 · Organization Slice（src/features/organization.slice）"]
    direction TB

    subgraph VS4_CORE["🏗️ 組織核心域（src/features/organization.slice/core）"]
        ORG_AGG["organization-core.aggregate"]
    end

    subgraph VS4_GOV["🛡️ 組織治理域（src/features/organization.slice/gov.members + gov.partners + gov.policy + gov.teams）"]
        ORG_MBR["org.member（tagSlug 唯讀）\n→ tag::role [TE_RL]\n→ tag::user-level [TE_UL]"]
        ORG_PTR["org.partner（tagSlug 唯讀）\n→ tag::partner [TE_PT]"]
        ORG_TEAM["org.team\n→ tag::team [TE_TM]"]
        ORG_POL["org.policy"]
        ORG_RECOG["org-skill-recognition.aggregate\nminXpRequired / status [#11]"]
    end

    subgraph VS4_TAG["🏷️ Tag 組織作用域（src/features/organization.slice）[S4]"]
        TAG_SUB["tag-lifecycle-subscriber\n訂閱 IER BACKGROUND_LANE\n責任：更新 SKILL_TAG_POOL"]
        SKILL_POOL[("skill-tag-pool\nTag Authority 組織作用域快照\n[S4: TAG_MAX_STALENESS ≤ 30s]")]
        TALENT[["talent-repository [#16]\nMember + Partner + Team\n→ ORG_ELIGIBLE_VIEW"]]
        TAG_SUB -->|"TagLifecycleEvent"| SKILL_POOL
        ORG_MBR & ORG_PTR & ORG_TEAM --> TALENT
        TALENT -.->|人力來源| SKILL_POOL
    end

    subgraph VS4_EV["📢 Org Events + Outbox（src/features/organization.slice）[S1]"]
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
subgraph VS5["🟣 VS5 · Workspace Slice（src/features/workspace.slice）"]
    direction TB

    ORG_ACL["org-context.acl [E2]\nIER OrgContextProvisioned\n→ Workspace 本地 Context [#10]"]

    subgraph VS5_APP["⚙️ Application Coordinator（src/features/workspace.slice）[#3]"]
        direction LR
        WS_CMD_H["command-handler\n→ SK_CMD_RESULT"]
        WS_SCP_G["scope-guard [#A9]"]
        WS_POL_E["policy-engine"]
        WS_TX_R["transaction-runner\n[#A8] 1cmd / 1agg"]
        WS_OB["ws-outbox\n[SK_OUTBOX: SAFE_AUTO]\n唯一 IER 投遞來源 [E5]"]
        WS_CMD_H --> WS_SCP_G --> WS_POL_E --> WS_TX_R
        WS_TX_R -->|"pending events [E5]"| WS_OB
    end

    subgraph VS5_CORE["⚙️ Workspace Core Domain（src/features/workspace.slice/core + core.event-bus + core.event-store）"]
        WS_AGG["workspace-core.aggregate"]
        WS_EBUS["workspace-core.event-bus（in-process [E5]）"]
        WS_ESTORE["workspace-core.event-store\n僅重播/稽核 [#9]"]
        WS_SETT["workspace-core.settings"]
    end

    subgraph VS5_GOV["🛡️ Workspace Governance（src/features/workspace.slice/gov.role + gov.audit + gov.members + gov.partners + gov.teams）"]
        WS_ROLE["workspace-governance.role\n繼承 org-policy [#18]\n→ tag::role [TE_RL]"]
        WS_PCHK["policy-eligible-check [P4]\nvia Query Gateway"]
        WS_AUDIT["workspace-governance.audit"]
        AUDIT_COL["audit-event-collector\n訂閱 IER BACKGROUND_LANE\n→ GLOBAL_AUDIT_VIEW"]
        WS_ROLE -.->|"[#18] eligible 查詢"| WS_PCHK
    end

    subgraph VS5_BIZ["⚙️ Business Domain（src/features/workspace.slice/business.{tasks,quality-assurance,acceptance,finance,daily,document-parser,files,issues,workflow}，A+B 雙軌）"]
        direction TB

        subgraph VS5_PARSE["📄 文件解析三層閉環（src/features/workspace.slice/business.document-parser）[Layer-1 → Layer-2 → Layer-3]"]
            W_FILES["workspace.files"]
            W_PARSER["document-parser\nLayer-1 原始解析\n→ raw ParsedLineItem[]\n+ classifyCostItem() [VS8 Layer-2]\n→ ParsedLineItem.(costItemType, semanticTagSlug)"]
            PARSE_INT[("ParsingIntent\nDigital Twin [#A4]\nlineItems[].(costItemType, semanticTagSlug, sourceIntentIndex)\n（Layer-2 語義標注 + 來源索引）")]
            W_FILES -.->|原始檔案| W_PARSER --> PARSE_INT
        end

        subgraph VS5_WF["⚙️ Workflow State Machine（src/features/workspace.slice/business.workflow）[R6]"]
            WF_AGG["workflow.aggregate\n狀態合約：Draft→InProgress→QA\n→Acceptance(OK)→Finance(Stage Gateway)→Completed\nFinance 子流程（可多輪循環）\nClaim Preparation(勾選+quantity)→Claim Submitted\n→Claim Approved→Invoice Requested\n→Payment Term(計時中)→Payment Received\n收斂條件：outstandingClaimableAmount=0 才可 Completed\nblockedBy: Set‹issueId›\n[#A3] blockedBy.isEmpty() 才可 unblock"]
        end

        subgraph VS5_A["🟢 A-track 主流程（src/features/workspace.slice/business.tasks + business.quality-assurance + business.acceptance + business.finance）"]
            direction LR
            A_ITEMS["workspace.items\n來源事項（Source of Work）\n保留 sourceIntentIndex"]
            A_TASKS["tasks"]
            A_QA["quality-assurance"]
            A_ACCEPT["acceptance"]
            A_FINANCE["finance-stage-gateway"]
        end

        subgraph VS5_FIN["💰 Finance Lifecycle（src/features/workspace.slice/business.finance，Multi-Claim）[#A15 #A16]"]
            direction TB
            FIN_CLAIM_PREP["claim-preparation\n(select line-items + quantity)"]
            FIN_CLAIM_SUB["claim-submitted"]
            FIN_CLAIM_APV["claim-approved"]
            FIN_INV_REQ["invoice-requested"]
            FIN_TERM["payment-term (timer-running)"]
            FIN_PAY_RECV["payment-received"]
            FIN_BALANCE{"outstandingClaimableAmount > 0 ?"}
            FIN_EXIT["finance-exit-gate\n(outstandingClaimableAmount=0)"]
        end

        subgraph VS5_B["🔴 B-track 異常處理（src/features/workspace.slice/business.issues）"]
            B_ISSUES{{"issues"}}
        end

        W_DAILY["daily\n施工日誌"]
        W_SCHED["workspace.schedule（WorkspaceSchedule）\n任務時間化（有時間）\nWorkspaceScheduleProposed（僅提案）\nTask → WorkspaceSchedule 單向橋接 [D27-Order #A5]"]

        PARSE_INT -->|"[Layer-3 Semantic Router]\nshouldMaterializeAsTask(costItemType) [D27-Gate]\n先形成 WorkspaceItem"| A_ITEMS
        A_ITEMS -->|"僅 EXECUTABLE 事項可物化任務\n保留 sourceIntentIndex 排序 [D27-Order]"| A_TASKS
        PARSE_INT -.->|"財務候選資料（非階段遷移）"| A_FINANCE
        PARSE_INT -->|解析異常| B_ISSUES
        A_TASKS -.->|"SourcePointer [#A4]"| PARSE_INT
        PARSE_INT -.->|"IntentDeltaProposed [#A4]"| A_TASKS
        WF_AGG -.->|stage-view| A_TASKS & A_QA & A_ACCEPT & A_FINANCE
        A_TASKS --> A_QA --> A_ACCEPT --> A_FINANCE
        A_FINANCE -->|"進入請款生命週期 [#A15]"| FIN_CLAIM_PREP
        FIN_CLAIM_PREP --> FIN_CLAIM_SUB
        FIN_CLAIM_SUB --> FIN_CLAIM_APV
        FIN_CLAIM_APV --> FIN_INV_REQ
        FIN_INV_REQ --> FIN_TERM
        FIN_TERM --> FIN_PAY_RECV
        FIN_INV_REQ -.->|"啟動 Payment Term 計時 [#A16]"| FIN_TERM
        FIN_PAY_RECV --> FIN_BALANCE
        FIN_BALANCE -->|"是：仍有可請款餘額 [#A16]"| FIN_CLAIM_PREP
        FIN_BALANCE -->|"否：本輪後已結清 [#A16]"| FIN_EXIT
        FIN_EXIT -->|"允許 Completed [#A16]"| WF_AGG
        WF_AGG -->|"blockWorkflow [#A3]"| B_ISSUES
        A_TASKS -.-> W_DAILY
        A_TASKS -.->|任務分配提案（Task→Schedule）| W_SCHED
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
A_TASKS -.->|"TaskCompleted(baseXp, semanticTagSlug) [A17]"| SKILL_TASK_SRC
A_QA -.->|"QualityAssessed(qualityScore) [A17]"| SKILL_QA_SRC
XP_AWARD -.->|"semanticTag policy lookup [D21-7 T5]"| TAG_RO

%% ── VS6 Workforce Scheduling ──
subgraph VS6["🟨 VS6 · Workforce Scheduling Slice（src/features/workforce-scheduling.slice · 排班協作）"]
    direction TB

    subgraph VS6_CMD_LAYER["⚙️ Command Layer（src/features/workforce-scheduling.slice，寫側）"]
        SCH_CMD["schedule-command-handler\n僅接收排班命令（禁止 UI 直寫）\n回傳 SK_CMD_RESULT"]
        SCH_CONFLICT["schedule-conflict-checker\n時間/資源衝突檢查（寫側守門）"]
        ORG_SCH["organization.schedule.aggregate（OrganizationSchedule）\n人力指派聚合（依 workspace schedule 提案）\nHR Scheduling (tagSlug T4)\n先驗證 SK_SKILL_REQ + TAG_STALE_GUARD\n事件帶 aggregateVersion [R7]"]
        SCH_CMD --> SCH_CONFLICT --> ORG_SCH
    end

    subgraph VS6_SAGA["⚙️ Workforce-Scheduling Saga（src/features/workforce-scheduling.slice）[#A5]"]
        SCH_SAGA["workforce-scheduling-saga\n接收 WorkspaceScheduleProposed\neligibility check [#14]\ncompensating:\n  ScheduleAssignRejected\n  ScheduleProposalCancelled\n（需求引導執行，執行引導協作）"]
    end

    subgraph VS6_OB["📤 Schedule Outbox（src/features/workforce-scheduling.slice）[S1]"]
        SCH_OB["sched-outbox\n[SK_OUTBOX: S1]\nDLQ: ScheduleAssigned → REVIEW_REQUIRED\n     Compensating Events → SAFE_AUTO"]
    end

    ORG_SCH -.->|"[#14] 只讀 eligible=true"| QGWAY_SCHED
    ORG_SCH -.->|"能力/視覺只讀 tag-snapshot [VS8-Tag T5]"| TAG_RO
    ORG_SCH -.->|"tagSlug 新鮮度校驗"| TAG_SG
    ORG_SCH -->|"ScheduleAssigned + aggregateVersion"| SCH_OB
    ORG_SCH -.->|"人力需求契約"| SK_SKILL_REQ
    SCH_SAGA -->|compensating event| SCH_OB
    SCH_SAGA -.->|"協調 handleScheduleProposed"| SCH_CMD
end

%% ── VS7 Notification（Cross-cutting Authority · 反應中樞）──
subgraph VS7["🩷 VS7 · Notification Hub（src/features/notification-hub.slice · 跨切片權威）"]
    direction TB

    NOTIF_R["notification-router\n無狀態路由 [#A10]\n消費 IER STANDARD_LANE\nScheduleAssigned [E3]\n從 envelope 讀取 traceId [R8]"]
    NOTIF_HUB_SVC["notification-hub._services.ts\n唯一副作用出口\n標籤感知路由策略\n對接 VS8 語義索引\n#channel:slack → Slack\n#urgency:high → 電話"]

    subgraph VS7_DEL["📤 Delivery（src/features/notification-hub.slice）"]
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

subgraph GW_IER["🟠 L4 · Integration Event Router（src/features/infra.event-router + infra.outbox-relay）"]
    direction TB

    RELAY["outbox-relay-worker\n【共用 Infra・所有 OUTBOX 共享】\n掃描：Firestore onSnapshot (CDC)\n投遞：OUTBOX → IER 對應 Lane\n失敗：retry backoff → 3次失敗 → DLQ\n監控：relay_lag → L9(Observability)"]

    subgraph IER_CORE["⚙️ IER Core（src/features/infra.event-router）"]
        IER[["integration-event-router\n統一事件出口 [#9]\n[R8] 保留 envelope.traceId 禁止覆蓋"]]
    end

    subgraph IER_LANES["🚦 優先級三道分層（src/features/infra.event-router）[P1]"]
        CRIT_LANE["🔴 CRITICAL_LANE\n高優先最終一致\nRoleChanged → Claims 刷新 [S6]\nWalletDeducted/Credited\nOrgContextProvisioned\nSLA：盡快投遞"]
        STD_LANE["🟡 STANDARD_LANE\n非同步最終一致\nSLA < 2s\nSkillXpAdded/Deducted\nScheduleAssigned / ScheduleProposed\nMemberJoined/Left\nAll Domain Events"]
        BG_LANE["⚪ BACKGROUND_LANE\nSLA < 30s\nTagLifecycleEvent\nAuditEvents"]
    end

    subgraph DLQ_SYS["💀 DLQ 三級分類（src/features/infra.dlq-manager）[R5 S1]"]
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

subgraph PROJ_BUS["🟡 L5 · Projection Bus（src/features/projection.bus）"]
    direction TB

    subgraph PROJ_BUS_FUNNEL["▶ Event Funnel（src/features/projection.bus）[S2 P5 R8]"]
        direction LR
        FUNNEL[["event-funnel\n[#9] 唯一 Projection 寫入路徑\n[Q3] upsert by idempotency-key\n[R8] 從 envelope 讀取 traceId → DOMAIN_METRICS\n[S2] 所有 Lane 遵守 SK_VERSION_GUARD\n     event.aggVersion > view.lastVersion\n     → 更新；否則 → 丟棄"]]
        CRIT_PROJ["🔴 CRITICAL_PROJ_LANE\n[S4: PROJ_STALE_CRITICAL ≤ 500ms]\n獨立重試 / dead-letter"]
        STD_PROJ["⚪ STANDARD_PROJ_LANE\n[S4: PROJ_STALE_STANDARD ≤ 10s]\n獨立重試 / dead-letter"]
        FUNNEL --> CRIT_PROJ & STD_PROJ
    end

    subgraph PROJ_BUS_META["⚙️ Stream Meta（src/features/projection.bus）"]
        PROJ_VER["projection.version\n事件串流偏移量"]
        READ_REG["read-model-registry\n版本目錄"]
        PROJ_VER -->|version mapping| READ_REG
    end

    subgraph PROJ_BUS_CRIT["🔴 Critical Projections（src/features/projection.bus）[S2 S4]"]
        WS_SCOPE_V["projection.workspace-scope-guard-view\n授權路徑 [#A9]\n[S2: SK_VERSION_GUARD]"]
        ORG_ELIG_V["projection.org-eligible-member-view\n[S2: SK_VERSION_GUARD]\nskills{tagSlug→xp} / eligible\n[#14 #15 #16 T3]\n→ tag::skill [TE_SK]\n→ tag::skill-tier [TE_ST]"]
        WALLET_V["projection.wallet-balance\n[S3: EVENTUAL_READ]\n顯示用・精確交易回源 AGG"]
        TIER_FN[["getTier(xp) → Tier\n純函式 [#12]"]]
    end

    subgraph PROJ_BUS_STD["⚪ Standard Projections（src/features/projection.bus）[S4]"]
        direction LR
        WS_PROJ["projection.workspace-view"]
        ACC_SCHED_V["projection.account-schedule"]
        CAL_PROJ["projection.schedule-calendar-view\n日期維度 Read Model [L5-Bus]\napplyVersionGuard() [S2]"]
        TL_PROJ["projection.schedule-timeline-view\n資源維度 Read Model [L5-Bus]\noverlap/resource-grouping 下沉 L5\napplyVersionGuard() [S2]"]
        ACC_PROJ_V["projection.account-view"]
        ORG_PROJ_V["projection.organization-view"]
        SKILL_V["projection.account-skill-view\n[S2: SK_VERSION_GUARD]"]
        AUDIT_V["projection.global-audit-view\n每條記錄含 traceId [R8]"]
        TAG_SNAP["projection.tag-snapshot\n[S4: TAG_MAX_STALENESS]\nT5 消費方禁止寫入"]
        SEM_GOV_V["projection.semantic-governance-view\n治理頁 Read Model（wiki/proposal/relationship）\n顯示線路：L5→L6→UI"]
    end

    IER ==>|"[#9] 唯一 Projection 寫入路徑"| FUNNEL
    CRIT_PROJ --> WS_SCOPE_V & ORG_ELIG_V & WALLET_V
    STD_PROJ --> WS_PROJ & ACC_SCHED_V & CAL_PROJ & TL_PROJ & ACC_PROJ_V & ORG_PROJ_V & SKILL_V & AUDIT_V & TAG_SNAP & SEM_GOV_V

    FUNNEL -->|stream offset| PROJ_VER
    WS_ESTORE -.->|"[#9] replay → rebuild"| FUNNEL
    SKILL_V -.->|"[#12] getTier"| TIER_FN
    ORG_ELIG_V -.->|"[#12] getTier"| TIER_FN
end

%% ═══════════════════════════════════════════════════════════════
%% CONNECTIVITY STITCH ZONE（集中連線區塊，避免線段分散）
%% ═══════════════════════════════════════════════════════════════

FUNNEL -.->|"uses IFirestoreRepo [S2]"| I_REPO
WS_SCOPE_V -.->|"快照契約"| SK_AUTH_SNAP
ACC_PROJ_V -.->|"快照契約"| SK_AUTH_SNAP
SKILL_V -.->|"tier 推導"| SK_SKILL_TIER
ORG_ELIG_V -.->|"skill tag 語義"| TE_SK
ORG_ELIG_V -.->|"skill-tier tag 語義"| TE_ST
AUDIT_COL -.->|"跨片稽核"| AUDIT_V

%% ── Connectivity A: Query Spine（L5 → L6）──
READ_REG -.->|"版本目錄"| QGWAY
ORG_ELIG_V -.-> QGWAY_SCHED
CAL_PROJ -.-> QGWAY_CAL
TL_PROJ -.-> QGWAY_TL
ACC_PROJ_V -.-> QGWAY_NOTIF
WS_SCOPE_V -.-> QGWAY_SCOPE
WALLET_V -.-> QGWAY_WALLET
TAG_SNAP -.-> QGWAY_SEARCH
SEM_GOV_V -.-> QGWAY_SEM_GOV
ACTIVE_CTX -->|"查詢鍵"| QGWAY_SCOPE
SK_AUTH_SNAP -.->|"AuthoritySnapshot 契約 [#A9]"| CBG_AUTH

%% ── Connectivity B: VS0 Foundation（VS0-Kernel ↔ VS0-Infra ↔ L8）──
AUTH_ADP -.->|"implements"| I_AUTH
FSTORE_ADP -.->|"implements [S2]"| I_REPO
FCM_ADP -.->|"implements [R8]"| I_MSG
STORE_ADP -.->|"implements"| I_STORE
SK_INFRA -.->|"S2/R8/S4 規則約束"| FIREBASE_ACL
AUTH_ADP --> F_AUTH
FSTORE_ADP --> F_DB
FCM_ADP --> F_FCM
STORE_ADP --> F_STORE

%% ── Connectivity C: Observability（L2/L4/L5 → L9）──
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

%% ── Global Search（Cross-cutting Authority · 語義門戶）──
GLOBAL_SEARCH["🔍 Global Search（src/features/global-search.slice · 跨切片權威）\nL6 Query Gateway 核心消費者\n語義化索引檢索\n唯一跨域搜尋權威\n對接 VS8 語義索引\nCmd+K 唯一服務提供者\n_actions.ts / _services.ts [D26]"]
GLOBAL_SEARCH -->|"語義化索引檢索"| QGWAY_SEARCH
GLOBAL_SEARCH -.->|"queries VS8 semantic index [D26]"| VS8

%% ── VS8 Semantic Graph 跨切片語義提供 ──
VS8 -.->|"語義投影輸出（唯讀）"| TAG_SNAP
VS5 -.->|"語義讀取僅經 L6 [D21-7 T5]"| QGWAY_SEARCH
VS6 -.->|"語義讀取僅經 L6 [D21-7 T5]"| QGWAY_SEARCH
COST_CLASSIFIER -.->|"classifyCostItem() [Layer-2 D27 #A14]"| W_PARSER

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
class FIN_CLAIM_PREP,FIN_CLAIM_SUB,FIN_CLAIM_APV,FIN_INV_REQ,FIN_TERM,FIN_PAY_RECV,FIN_BALANCE,FIN_EXIT wfNode
class AUDIT_COL auditView
class A_ITEMS,A_TASKS,A_QA,A_ACCEPT trackA
class A_FINANCE wfNode
class B_ISSUES,W_DAILY,W_SCHED wsSlice
class VS6,SCH_CMD,SCH_CONFLICT,ORG_SCH,SCH_SAGA schedSlice
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
class GW_QUERY,QGWAY,QGWAY_SCHED,QGWAY_CAL,QGWAY_TL,QGWAY_NOTIF,QGWAY_SCOPE,QGWAY_WALLET,QGWAY_SEARCH qgway
class PROJ_BUS,FUNNEL,PROJ_VER,READ_REG stdProj
class CRIT_PROJ,WS_SCOPE_V,ORG_ELIG_V,WALLET_V critProj
class STD_PROJ,WS_PROJ,ACC_SCHED_V,CAL_PROJ,TL_PROJ,ACC_PROJ_V,ORG_PROJ_V,SKILL_V stdProj
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
%%  #A14 Cost Semantic 雙鍵分類（Layer-2）= VS8 _cost-classifier.ts 純函式輸出 (costItemType, semanticTagSlug)；
%%       VS5 Layer-3 Semantic Router = use-workspace-event-handler，
%%       僅 EXECUTABLE 項目物化為 tasks；其餘六類靜默跳過並 toast [D27]
%%  #A15 Finance gate + payload contract：Acceptance=OK 才可進入 Finance；
%%       Claim Preparation 必須以「勾選項目 + quantity」建立 claim line items，禁止空請款與 quantity ≤ 0
%%  #A16 Multi-Claim cycle contract：Finance 可多次循環請款；
%%       每輪流程：Claim Preparation → Claim Submitted → Claim Approved → Invoice Requested → Payment Term(計時) → Payment Received；
%%       Payment Term 計時區間固定為 [Invoice Requested, PaymentReceived]；
%%       當 outstandingClaimableAmount > 0 時必須回到 Claim Preparation，僅 outstandingClaimableAmount = 0 可 Completed
%%  #A17 Skill XP Award contract：XP 僅能由 VS3 寫入；來源必須為 VS5 的 TaskCompleted(baseXp, semanticTagSlug)
%%       與 QualityAssessed(qualityScore) 事實事件；計算公式 awardedXp = baseXp × qualityMultiplier × policyMultiplier（含 clamp）
%%       VS8 僅提供語義標籤與政策查詢，禁止直接寫入 XP ledger
%%  ╠══════════════════════════════════════════════════════════════════════════╣
%%  TAG SEMANTICS 擴展規則（VS8 · 四層語義引擎擴展規則 [D21-1~D21-10 + D21-A~D21-X]）
%%  T1  新切片訂閱 TagLifecycleEvent（BACKGROUND_LANE）即可擴展 [D21-6]
%%  T2  SKILL_TAG_POOL = Tag Authority 組織作用域唯讀投影
%%  T3  ORG_ELIGIBLE_MEMBER_VIEW.skills{tagSlug→xp} 交叉快照
%%  T4  排班職能需求 = SK_SKILL_REQ × Tag Authority tagSlug [D21-5]
%%  T5  TAG_SNAPSHOT 消費方禁止寫入 [D21-7]；DocumentParser UI 視覺屬性必須由 semantic-graph.slice 投影讀取
%%      語義治理頁（wiki/proposal/relationship）顯示資料同樣必須走 L5 projection.semantic-governance-view → L6 Query Gateway
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
%%  UNIFIED DEVELOPMENT RULES [D1~D26 Mandatory + D27 Extension]
%%  ── 規則分層：Hard Invariants (D1~D20 核心不變量) / Semantic Governance D21(D21-1~D21-10+D21-A~D21-X)/D22~D23 / Infrastructure (D24~D25) / Authority Governance (D26) / Cost Semantic Routing Extension (D27) ──
%%  ── 基礎路徑約束（D1~D12）──
%%  D1  事件傳遞只透過 infra.outbox-relay；domain slice 禁止直接 import infra.event-router
%%  D2  跨切片引用：import from '@/features/{slice}/index' only；_*.ts 為私有
%%  D3  所有 mutation：src/features/{slice}/_actions.ts only
%%  D4  所有 read：src/features/{slice}/_queries.ts only
%%  D5  src/app/ 與 UI 元件禁止 import src/shared-infra/frontend-firebase/firestore
%%  D6  "use client" 只在 _components/ 或 _hooks/ 葉節點；layout/page server components 禁用
%%  D7  跨切片：import from '@/features/{other-slice}/index'；禁止 _private 引用
%%  D8  shared-kernel/* 禁止 async functions、Firestore calls、side effects
%%  D9  workspace-application/ TX Runner 協調 mutation；slices 不得互相 mutate
%%  D10 EventEnvelope.traceId 僅在 CBG_ENTRY 設定；其他地方唯讀
%%  D11 workspace-core.event-store 支援 projection rebuild；必須持續同步
%%  D12 getTier() 必須從 shared-kernel/skill-tier import；Firestore 寫入禁帶 tier 欄位
%%  ── 契約治理守則（D13~D20）──
%%  D13 新增 OUTBOX：必須在 SK_OUTBOX_CONTRACT 宣告 DLQ 分級
%%  D14 新增 Projection：必須引用 SK_VERSION_GUARD，不得跳過 aggregateVersion 比對
%%  D15 讀取場景決策：先查 SK_READ_CONSISTENCY（金融/授權 → STRONG；其餘 → EVENTUAL）
%%  D16 SLA 數值禁止硬寫，一律引用 SK_STALENESS_CONTRACT
%%  D17 新增外部觸發入口：必須在 SK_RESILIENCE_CONTRACT 驗收後上線
%%  D18 Claims 刷新邏輯變更：以 SK_TOKEN_REFRESH_CONTRACT 為唯一規範
%%  D19 型別歸屬規則：跨 BC 契約優先放 shared-kernel/*；shared/types 僅為 legacy fallback
%%  D20 匯入優先序：shared-kernel/* > feature slice index.ts > shared/types
%%  ── 語義 Tag 守則（D21~D23）── VS8 四層語義引擎正式規範 ──
%%  ── 層級結構：Governance → Core Domain → Compute Engine → Output ──
%%  ── 一、核心語義域（Core Domain · VS8_CL）──
%%  D21-1 語義唯一性：全域所有語義類別與標籤實體（Tag Entities）僅能在 VS8 CTA 定義，禁止業務切片（VS1~VS6）私自宣告
%%  D21-2 標籤強型別化：系統中禁止使用隱性字串傳遞語義，所有引用必須指向 TE1~TE6 有效 tagSlug
%%  ── 二、圖譜與推理引擎（Compute Engine · VS8_SL / VS8_NG）──
%%  D21-3 節點互聯律：語義節點必須具備層級或因果關係；孤立標籤（Isolated Tag）視為無效語義，須通過 parentTagSlug 歸入分類學
%%  D21-4 聚合體約束：CTA 守護標籤生命週期（Draft→Active→Stale→Deprecated）；reasoning-engine 計算關聯權重與語義距離
%%  ── 三、語義路由與執行 (Compute Engine · VS8_ROUT) ──
%%  D21-5 語義感知路由：跨切片決策（排班路由/通知分發）必須基於標籤語義權重，禁止硬編碼業務對象 ID
%%  D21-6 因果自動觸發：TagLifecycleEvent 發生時，VS8 透過 Causality Tracer 自動推導受影響節點並發布更新事件；
%%        traceAffectedNodes(event, candidateSlugs[]) 支援候選節點過濾（candidateSlugs=[] 表全圖追蹤）；
%%        rankAffectedNodes / buildDownstreamEvents 可作為獨立工具使用；TAG_DELETED 不產生下游事件
%%  ── 四、輸出與一致性 (Output Layer · Projection & Consistency) ──
%%  D21-7 讀寫分離原則：寫入操作必須經過 CMD_GWAY 進入 VS8 CTA；讀取嚴禁直連資料庫，必須經由 projection.tag-snapshot
%%  D21-8 新鮮度防禦：所有基於語義的查詢必須引用 SK_STALENESS_CONTRACT，TAG_STALE_GUARD ≤ 30 秒
%%  ── 五、圖關係物理約束 (VS8_SL · Graph Physics) ──
%%  D21-9 突觸權重不變量：SemanticEdge.weight ∈ [0.0, 1.0]；
%%        語義代價 cost = 1.0 / max(weight, MIN_EDGE_WEIGHT)（強連結 = 近鄰 = 短距離）；
%%        _clampWeight 在 addEdge 時強制執行；所有直接關係預設 weight=1.0；
%%        禁止任何消費方持有 weight > 1.0 或 weight < 0.0 的邊
%%  D21-10 拓撲可觀測性：findIsolatedNodes(slugs[]) 為 VS8_NG 唯一拓撲健康探針；
%%         每次 addEdge/removeEdge 後必須以非同步方式觸發孤立節點檢查；
%%         結果寫入 L9 Observability；D21-3 違規率 > 0 需觸發警告事件
%%  ── 六、擴展不變量 (D21-A~D21-X · 四層架構治理律) ──
%%  D21-A 唯一註冊律：跨領域概念必須在 core/tag-definitions.ts 集中註冊，禁止業務切片私自創建隱性語義分類
%%  D21-B Schema 鎖定：標籤元數據必須符合 core/schemas 定義，禁止附加任何未經校驗的非結構化屬性
%%  D21-C 無孤立節點：每個新標籤建立時必須透過 hierarchy-manager.ts 掛載至少一個有效父級節點（→ D21-3 強化版）
%%  D21-D 向量一致性：embeddings/vector-store.ts 中的向量必須隨 core/tag-definitions.ts 定義同步刷新，延遲 ≤ 60s
%%  D21-E 權重透明化：語義相似度計算與路徑權重生成必須由 weight-calculator.ts 統一輸出，禁止消費方自行推算
%%  D21-F 注意力隔離：context-attention.ts 必須根據當前 Workspace 情境過濾無關標籤，防止語義噪聲污染路由結果
%%  D21-G 演化回饋環：learning-engine.ts 僅能依據 VS3（排班）/ VS2（任務）的真實事實事件進行神經元強度調整，
%%                    禁止手動隨機修改或注入合成數據；每次調整須附帶來源事件溯源
%%  D21-H 血腦屏障（BBB）：執行管線：L8 consensus-engine 先行校驗治理邏輯一致性，通過後提案轉送 L5 BBB 做最終物理不變量裁決；
%%                          invariant-guard.ts 擁有最高否決權，可直接拒絕已通過治理共識但違反圖物理結構的提案，
%%                          其最終裁決權優先凌駕於 consensus-engine 與 learning-engine 之上
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
%%  D24 MUST: IF 位於 feature slice / shared/types / app THEN 必須禁止直接 import firebase/*
%%  D24 MUST: IF 需要呼叫 Firebase SDK THEN 必須透過 FIREBASE_ACL Adapter（src/shared-infra/frontend-firebase/{auth|firestore|messaging|storage}）
%%  D24 FORBIDDEN: IF 位於 Feature Slice THEN MUST NOT 直接 import @/shared-infra/* 實作細節（含 firestore.*.adapter / db client）
%%  D24 MUST: IF 位於 Feature Slice THEN 僅可依賴 SK_PORTS（L1）或 Query Gateway（L6）公開介面
%%  D25 MUST: IF 新增 Firebase 功能 THEN 必須在 FIREBASE_ACL 新增 Adapter 以實作對應 SK_PORTS Port
%%  ── Cross-cutting Authority 守則（D26）──
%%  D26 MUST: IF 執行跨域搜尋 THEN 必須經 global-search.slice；業務 Slice 不得自建搜尋邏輯
%%  D26 MUST: IF 執行通知副作用 THEN 必須經 notification-hub.slice（VS7）；業務 Slice 不得直接調用 sendEmail/push/SMS
%%  D26 MUST: IF 屬 global-search.slice 或 notification-hub.slice THEN 必須具備自己的 _actions.ts / _services.ts [D3]
%%  D26 FORBIDDEN: IF 屬 cross-cutting authority THEN MUST NOT 寄生於 shared-kernel [D8]
%%  ── L2 Command Gateway 下沉邊界（單向鏈防呆）──
%%      MUST: IF 元件為 GatewayCommand / DispatchOptions / Handler 介面型別 THEN 可下沉至 L1（Shared Kernel）
%%      MUST: IF 元件為 CommandResult/錯誤碼契約且為純資料或純函式 THEN 可下沉至 L1（Shared Kernel）
%%      MUST: IF 元件屬 CBG_ENTRY / CBG_AUTH / CBG_ROUTE 執行管線 THEN 必須保留在 L2（Infrastructure Orchestration）
%%      MUST: IF 元件屬 handler registry 或 resilience 接線（rate-limit/circuit-breaker/bulkhead）THEN 必須保留在 L2
%%      FORBIDDEN: IF 元件包含 async / side effects / routing registry THEN MUST NOT 下沉至 shared-kernel/* [D8]
%%      FORBIDDEN: IF 位於 L1 THEN MUST NOT 產生 traceId；traceId 僅允許 CBG_ENTRY 注入 [D10]
%%  ── 成本語義路由守則（D27 · Extension Gate）──
%%  D27 MUST: IF 處理成本語義路由 THEN 必須採用三層架構（Layer-1 原始解析 → Layer-2 語義分類 → Layer-3 語義路由）
%%  D27 MUST: IF 位於 Layer-2 THEN 必須呼叫 VS8 classifyCostItem(name) 輸出 (costItemType, semanticTagSlug)
%%  D27 MUST: IF 實作 classifyCostItem THEN 必須為純函式（禁止 async / Firestore / 副作用）[D8]
%%  D27 MUST: IF 產生 ParsedLineItem THEN 必須寫入 (costItemType, semanticTagSlug) 並隨 payload 傳遞
%%  D27 MUST: IF 位於 Layer-3 物化流程 THEN 必須以 shouldMaterializeAsTask() 作為唯一物化閘門 [D27-Gate]
%%  D27 FORBIDDEN: IF 位於 workspace.slice THEN MUST NOT 直接硬寫 `=== CostItemType.EXECUTABLE` 判斷
%%  D27 MUST: IF shouldMaterializeAsTask() 返回 true THEN 才可物化為 WorkspaceTask；否則必須靜默跳過並 toast [#A14]
%%  D27 MUST: IF 物化為任務 THEN 必須寫入 sourceIntentIndex 以維持排序不變量 [D27-Order]
%%  D27 MUST: IF tasks-view 呈現任務清單 THEN 必須先按 createdAt（批次間）再按 sourceIntentIndex（批次內）排序
%%  D27 MUST: IF 設計任務鏈路 THEN 必須遵守單向鏈 WorkspaceItem → WorkspaceTask → Schedule（禁止跳級）[D27-Order]
%%  D27 MUST: IF UI 顯示 DocumentParser icon/color/label THEN 必須讀取 tag-snapshot（不得分類器硬編碼）[T5]
%%  D27 MUST: IF 為排班視圖讀取 THEN 僅可經 L6 Query Gateway；UI 禁止直讀 VS6/Firebase [L6-Gateway]
%%  D27 MUST: IF 涉及 overlap/resource-grouping THEN 必須在 L5 Projection 層完成，前端僅渲染 [Timeline]
%%  D27 FORBIDDEN: IF 位於 VS5 document-parser THEN MUST NOT 自行實作成本語義邏輯；必須透過 VS8 classifyCostItem() [D27]
%%      禁止 Layer-3 Semantic Router 繞過 costItemType 直接物化非 EXECUTABLE 項目
%%  ╚══════════════════════════════════════════════════════════════════════════╝
