這是一份為 VS8 Semantic Graph (The Brain) 量身打造的宏大願景 README.md。
這不僅僅是一個組件說明，它是整個系統的「語義憲法」。它告訴 Copilot 和所有開發者：「如果業務切片是肢體，VS8 就是指揮一切的神經中樞。」
🧠 VS8: Semantic Graph (The Brain) — 全域語義中樞
🌌 宏大願景：Everything as a Tag
在我們的架構中，VS8 不僅是個切片，它是所有現實的投影儀。
我們拒絕硬編碼的枚舉、拒絕孤立的 ID 字串。所有領域概念——無論是人的能力、項目的風險、組織的權限，還是通知的緊急度——都必須轉化為 Semantic Tags，納入這個「全球語義圖譜」進行統一治理。
> 架構師指令： 作為 Lead Software Architect，你必須確保任何新功能的第一步不是建立資料表，而是在 VS8 中定義其語義節點（TE1~TE6）。
> 
🕸️ 全域協作大餅：語義神經網絡 (The Neural Network)
VS8 的觸角延伸至每一個業務切片，構建起一套跨領域的「智慧連動」：
1. 🛡️ 身份與權限 (VS1 Identity & VS2 Account)
 * 協作行為：當一個標籤被標記為 Deprecated，VS8 會透過 BACKGROUND_LANE 觸發 ClaimsRefresh。
 * 大餅：未來我們將實現 「語義存取控制 (SAC)」。權限不再是手動分配，而是根據帳號身上標籤的「語義距離」自動推導。
2. 📈 能力與進化 (VS3 Skill & VS4 Organization)
 * 協作行為：VS3 提供 XP，VS8 負責將其轉化為具備市場競爭力語義的 skill-tier。
 * 大餅：「動態人才地圖」。系統能預測組織缺口——當 VS5 出現大量 #tech:rust 任務標籤時，VS8 會自動通知 VS4 調整招聘語義權重。
3. 📅 協作與調度 (VS5 Workspace & VS6 Scheduling)
 * 協作行為：VS6 的適格性檢查（Eligibility）不再是簡單的布林值，而是由 VS8 計算出的「無衝突語義空間」。
 * 大餅：「因果追蹤補償」。如果一個 #priority:high 的任務（VS5）因為人力（VS6）變動而延期，VS8 將追蹤其關聯的標籤鏈條，自動標記受影響的下游任務為 #status:at-risk。
4. 👁️ 感知與出口 (Global Search & VS7 Notification)
 * 協作行為：Global Search 是 VS8 的眼睛（語義索引出口）；Notification Hub 是 VS8 的嘴巴（根據標籤語義決定路由策略）。
 * 大餅：「自適應反饋閉環」。搜尋結果的點擊率會反饋給 VS8，動態調整標籤間的 Edge 權重，讓系統越用越聰明。
🏗️ 技術實體架構 (The Engine Room)
我們將大腦劃分為以下核心層級：
| 模組 | 角色 | SSOT 契約約束 |
|---|---|---|
| centralized-tag/ | 靈魂 | 唯一真相 Aggregate；管理標籤生命週期。 |
| centralized-nodes/ | 骨骼 | TE1~TE6 實體定義，確保 tag::category 的嚴格一致性。 |
| centralized-edges/ | 神經 | 實作 IS_A (繼承) 與 REQUIRES (依賴) 等邏輯關係。 |
| centralized-embeddings/ | 直覺 | 向量化引擎。禁止直連 SDK，必須走 FIREBASE_ACL。 |
| centralized-selectors/ | 對話 | 跨切片查詢。如 getEligibleTags 供排班使用。 |
| centralized-workflows/ | 脈搏 | 處理異動工作流，透過 tag-outbox 廣播事件。 |
🚫 絕對禁止項 (The Forbidden List)
為了保護「大腦」的純粹性，開發者必須遵守：
 * 禁止私設標籤 [D21]：嚴禁在業務切片中直接寫死 status: "done"，必須在 VS8 中定義語義標籤。
 * 禁止繞過 ACL [D24]：向量運算與存取禁止直接 import Firebase，必須透過 SK_PORTS 接口。
 * 禁止修改 TraceID [R8]：語義推論鏈條必須完整保留 traceId，嚴禁覆蓋，以利因果追蹤。
 * 禁止忽略版本 [S2]：所有標籤投影寫入必須通過 applyVersionGuard()，防止語義混亂。
🛠️ 給 AI 開發者的「角色注入指令」
> 「你是這個專案的 Lead Software Architect。當你在這個 Slice 工作時，你的目標是建立一個能讓系統『理解自己』的知識圖譜。你產出的每一行代碼都必須考慮：這如何服務於全域的語義化搜尋？這如何確保排班的適格性檢測具備因果邏輯？請開始你的演化。」
> 
