**VS0: 平台與基礎設施 (Platform & Infra)**
- **職責**: 提供整個系統共用的基礎服務（部署、身分驗證外掛、消息中介、DLQ、Outbox、觀測）。
- **關鍵元件**: infra.gateway-*, infra.dlq-manager, infra.observability、CI/CD、運維自動化。
- **邊界**: 不包含業務領域邏輯；負責可觀測性、錯誤復原與跨域授權。
- **事件/合約**: 服務註冊、健康檢查、審計事件、系統級錯誤重試。

**VS1: 身分與認證 (Identity & Auth)**
- **職責**: 使用者/服務身份驗證、授權、權杖管理與 Session 控制。
- **關鍵元件**: identity-account.auth、OAuth/OIDC 整合、權限快取。
- **邊界**: 只處理認證/授權相關資料，不包含使用者個人設定或業務資料。
- **事件/合約**: 登入/登出、Token 發行/撤銷、權限變更通知。

**VS2: 帳戶核心與治理 (Account Core & Governance)**
- **職責**: 帳戶生命週期、帳戶角色、政策與治理流程的實作。
- **關鍵元件**: account-governance.*, account-user.profile、政策評估、審批流程。
- **邊界**: 與組織/團隊相關的成員管理屬於組織切片，但帳戶層面的權限與安全屬於此切片。
- **事件/合約**: 帳戶建立/關閉、角色指派、違規審計事件。

**VS3: 組織與團隊 (Organization & Team Management)**
- **職責**: 組織、團隊、成員關係、合夥人與商業夥伴管理。
- **關鍵元件**: account-organization.*、成員邀請、角色同步、可見性範圍 (workspace scope)。
- **邊界**: 不直接存放個人帳戶敏感資料；與帳戶治理協同但分責。
- **事件/合約**: 成員加入/離開、團隊調整、範圍授權事件。

**VS4: 排程與任務流 (Scheduling & Sagas)**
- **職責**: 長周期工作、排程、補償與 Saga 協調（工作排程、重試、延遲任務）。
- **關鍵元件**: scheduling-core.saga、定時器、排程視圖、延遲隊列。
- **邊界**: 不處理業務資料建模本身，只管事件驅動的流程和補償邏輯。
- **事件/合約**: 定時 job 觸發、Saga 開始/完成/補償事件。

**VS5: 投影與查詢 (Projections & Read Models)**
- **職責**: 把事件或交易資料投影為可查詢的視圖、為 UI/API 優化讀取模型。
- **關鍵元件**: projection.*（account-view、workspace-view、registry 等）、同步/增量更新、投影一致性策略。
- **邊界**: 不承擔寫入主資料責任；投影可為最終一致性。
- **事件/合約**: 事件消費、投影更新、重新投影/回溯指令。

**VS6: 通知與外部整合 (Notifications & Integrations)**
- **職責**: 系統通知、訊息路由、第三方 webhook 與外部系統整合。
- **關鍵元件**: account-user.notification、infra.outbox-relay、webhook 驗証與重試。
- **邊界**: 不儲存核心業務資料副本（除非為投遞狀態）；外部呼叫須遵循 SSRF/安全策略。
- **事件/合約**: 通知事件、投遞回執、外部系統回調。

**VS7: 標籤、技能與搜尋 (Tags, Skills & Indexing)**
- **職責**: 集中標籤系統、技能索引、搜尋/過濾能力與標籤快照管理。
- **關鍵元件**: centralized-tag、account-user.skill、projection.tag-snapshot、搜尋索引服務。
- **邊界**: 與帳戶/組織的關聯屬於各自切片，但標籤定義與快照由此切片維護。
- **事件/合約**: 標籤/技能新增、更新、索引重建事件。

**VS8: 工作區與範圍治理 (Workspace & Scope Guard)**
- **職責**: 工作區級別範圍治理、訪問控制、資源隔離與範圍投影。
- **關鍵元件**: projection.workspace-scope-guard、workspace-view、ACL 快取機制。
- **邊界**: 協調組織與帳戶的訪問決策，但不實作認證流程本身。
- **事件/合約**: 範圍變更、訪問拒絕/授權事件、範圍同步。

**VS9: 可觀測性、事件路由與審計 (Observability, Event Router & Audit)**
- **職責**: 系統日誌、分散式追蹤、事件路由管理與審計記錄保存。
- **關鍵元件**: infra.event-router、infra.observability、projection.global-audit-view、審計 DB/Retention 策略。
- **邊界**: 不修改業務事件內容；提供不可變的審計流與查詢能力。
- **事件/合約**: 審計事件流、路由規則變更、稽核查詢 API。

---
說明：上述切片依據現有文件（架構、命令/事件、領域詞彙、基礎設施、邏輯、持久層模型、專案結構、請求執行、Schema、技術棧）彙整而成；每個切片強調責任分界、主要元件與事件合約，便於團隊依垂直切片獨立開發與部署。
