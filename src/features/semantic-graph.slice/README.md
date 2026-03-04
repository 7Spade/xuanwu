這是一份專為 Semantic-graph.slice (VS8) 量身打造的 README.md。這份文件不僅定義了目前的架構，更為 Copilot 或其他 AI 開發代理畫出了一張「語義大腦」的擴展藍圖，讓它明白 VS8 是如何作為整個系統的智慧中樞與各業務切片協作。
🧠 VS8: Semantic Graph (The Brain) — README
📌 願景與角色設定 (The Vision)
Semantic-graph.slice 不僅僅是一個標籤管理工具，它是本系統的 「語義中樞 (The Brain)」。它將所有領域概念（技能、角色、組織、任務）轉化為具備語義特徵的「標籤 (Tags)」與「節點 (Nodes)」，並透過向量化 (Embeddings) 與圖譜關係 (Edges) 實現全域的智慧檢索與因果推理。
> 給 AI 開發者的指令： 你在處理此 Slice 時，必須扮演 Lead Software Architect，維護「Everything as a Tag」的核心原則。所有跨切片的邏輯協作都必須基於語義契約，而非硬編碼的 ID。
> 
🗺️ 跨切片語義協作大餅 (Cross-slice Collaboration Blueprint)
VS8 作為唯一語義權威，將與以下切片進行深度「腦機接口」協作：
1. 🔍 與 Global-search.slice：唯一語義門戶
 * 協作模式：VS8 提供底層向量索引 (Vector Index)，Global Search 作為前端唯一的搜尋權威。
 * 未來擴展：實現「意圖搜尋」，例如搜尋「急需焊接專家的項目」時，VS8 能自動關聯 tag::skill:welding + tag::urgency:high。
2. 🟨 與 VS6 Scheduling：智慧適格性校驗
 * 協作模式：VS6 進行排班時，透過 VS8 的 centralized-edges 判斷職能覆蓋關係。
 * 未來擴展：衝突語義檢測。不再只是時間重疊，而是透過標籤判斷「物理空間」或「工具依賴」的隱性衝突。
3. 🟩 與 VS3 Skill XP：能力演化路徑
 * 協作模式：VS3 提供 XP 數值，VS8 負責將其對應至語義層級 (Tier)。
 * 未來擴展：自動成長建議。當 VS8 發現多個項目需要某項新技能時，主動建議 VS3 更新相關人才的能力標籤。
4. 🟧 與 VS4 Organization：動態人才庫
 * 協作模式：VS4 定義成員與團隊，VS8 為其貼上語義標籤 (TE4-TE6)。
 * 未來擴展：跨組織影子標籤。允許跨組織的合作夥伴透過 VS8 的語義對等關係，實現「無縫人才租借」。
5. 🩷 與 VS7 Notification Hub：標籤感知路由
 * 協作模式：VS7 消費 IER 事件，並向 VS8 查詢標籤語義以決定通知通道。
 * 未來擴展：語義優先級。自動根據標籤的「緊急度語義」繞過靜音模式（例如 #urgency:critical 自動轉為電話通知）。
🏗️ 核心架構結構 (Architecture)
Semantic-graph.slice/
├─ index.ts                 # 唯一公開 API [D7]
├─ _actions.ts              # 唯一修改入口 [D3]
├─ centralized-tag/         # 標籤生命週期真相 [A6, 17]
├─ centralized-nodes/       # TE1~TE6 實體定義 [D21]
├─ centralized-edges/       # 標籤間的 IS_A/REQUIRES 關係
├─ centralized-embeddings/   # 向量生成與語義檢索 [D26]
├─ centralized-selectors/   # 跨切片語義查詢 (eligible queries) [P4]
├─ centralized-workflows/   # Tag Lifecycle (Draft -> Active) [T1]
└─ centralized-types/       # 內部型別定義 [D19]

📜 必須遵守的不變量 (Hard Invariants)
 * [D21] 唯一性：嚴禁在 VS8 以外的地方定義新標籤類別。
 * [S4] 鮮度契約：標籤語義異動必須在 30s 內反映至全域 (TAG_MAX_STALENESS)。
 * [D24] 隔離性：禁止直接使用 Firebase SDK，必須透過 FIREBASE_ACL。
 * [S2] 版本守則：所有圖譜寫入必須呼叫 applyVersionGuard() 以防事件亂序。
🛠️ 給 Copilot 的下一步建議
如果你正在開發新的業務功能：
 * 需要搜尋？ 請呼叫 global-search.slice，不要自建 Query。
 * 需要定義能力？ 請在 centralized-nodes/tag-skill 擴展語義，不要在業務代碼寫死字串。
 * 需要判斷資格？ 請使用 centralized-selectors/getEligibleTags。
