---
title: Logic Overview v7 — Deep Runtime Efficiency & Consistency
---

%% ==========================================================================
%% LOGIC OVERVIEW v7 · 深層運行效率與一致性架構
%% ==========================================================================
%%
%% v6 → v7 七項深層問題修正：
%%
%%  [P1] IER 優先級分層
%%       問題：ClaimsRefresh 與 TagLifecycleEvent 搶同一管道，高頻低優先擠壓緊急路徑
%%       修正：IER 內部拆分三條處理道
%%             CRITICAL   → ClaimsRefresh・OrgContextProvisioned（同步/強一致）
%%             STANDARD   → ScheduleAssigned・MemberJoined・SkillXpAdded（非同步/最終一致）
%%             BACKGROUND → TagLifecycleEvent・AuditEvents（低頻/可延遲）
%%
%%  [P2] ORG_EVENT_BUS 迴圈風險
%%       問題：IER → ORG_EVENT_BUS → IER 雙向連接形成事件迴圈
%%       修正：ORG_EVENT_BUS 改為純 Producer-only
%%             SkillXpAdded/Deducted 由 IER 直接路由至 FUNNEL，不再過 ORG_EVENT_BUS
%%
%%  [P3] VS6 ORG_SCHEDULE 直連 ORG_EVENT_BUS，違反統一出口原則
%%       問題：E5 只封閉了 WS_OUTBOX，VS6 的直連問題未修正
%%       修正：新增 SCHED_OUTBOX，ORG_SCHEDULE → SCHED_OUTBOX → IER
%%
%%  [P4] WS_ROLE → QGWAY_SCHED 依賴方向語義不清
%%       問題：Governance 模組直接掛 Query Gateway 節點，職責邊界模糊
%%       修正：明確標示為 VS5_GOV 透過 Query Gateway 執行 policy-eligible-check
%%
%%  [P5] FUNNEL 單點故障 / 缺背壓分層
%%       問題：授權關鍵的 WS_SCOPE_VIEW 與低優先的 TAG_SNAPSHOT 競爭同一 FUNNEL
%%       修正：FUNNEL 拆分 CRITICAL_LANE（授權/排班）與 STANDARD_LANE（稽核/快照）
%%             每個 Projection 掛獨立 dead-letter 回補機制
%%
%%  [P6] 缺乏統一 Dead Letter Queue
%%       問題：事件投遞失敗無統一回補路徑，Saga 補償只局部存在於 VS6
%%       修正：IER 引入 DEAD_LETTER_QUEUE（DLQ），所有失敗事件統一回補
%%             DLQ → Replay → IER（可觸發人工審查或自動重試）
%%
%%  [P7] OUTBOX 模式不完整
%%       問題：只有 VS5 有 OUTBOX，VS2/VS4/VS6 的 Event Bus 直連 IER
%%             at-least-once 保證只覆蓋 VS5，其他切片事件可能在崩潰時遺失
%%       修正：統一原則 → Aggregate → EventBus(in-process) → OUTBOX → IER
%%             VS2 補 ACC_OUTBOX、VS4 補 ORG_OUTBOX、VS6 補 SCHED_OUTBOX
%%
%% 累積優化索引（v4~v7 全覽）：
%%   E1~E6  : v6 邊界修正（見 v6 說明）
%%   T1~T5  : Tag Authority 擴展規則（見 v5 說明）
%%   P1~P7  : v7 深層效率修正（本版本）
%%
%% 閱讀順序：
%%   VS0) Shared Kernel + Tag Authority Center
%%   VS1) Identity Slice
%%   VS2) Account Slice       ← [P7] 補 ACC_OUTBOX
%%   VS3) Skill XP Slice
%%   VS4) Organization Slice  ← [P2] ORG_EVENT_BUS 純生產者 + [P7] 補 ORG_OUTBOX
%%   VS5) Workspace Slice     ← [P4] WS_ROLE eligible-check 語義修正
%%   VS6) Scheduling Slice    ← [P3] 補 SCHED_OUTBOX
%%   VS7) Notification Slice
%%   GW)  三閘道統一出入口    ← [P1] IER 優先級分層 + [P6] DLQ
%%   VS8) Projection Bus      ← [P5] FUNNEL 雙 Lane 分層
%%   VS9) Observability
%% ==========================================================================

flowchart TD

%% ==========================================================================
%% VS0) SHARED KERNEL + TAG AUTHORITY CENTER
%% 規則 #8：所有跨切片共用型別必須顯式聲明於此；未聲明視為邊界侵入
%% ==========================================================================

subgraph SK["🔷 VS0 · Shared Kernel + Tag Authority Center"]
    direction TB

    subgraph SK_CONTRACTS["📄 跨切片顯式契約 #8"]
        direction LR
        SK_ENV["event-envelope\n統一事件信封\n所有 DomainEvent 必須遵循\nversion / traceId / timestamp"]
        SK_AUTH_SNAP["authority-snapshot\n權限快照契約\nclaims / roles / scopes"]
        SK_SKILL_TIER["skill-tier\ngetTier(xp)→Tier\n純函式・永不存 DB #12"]
        SK_SKILL_REQ["skill-requirement\n跨片人力需求契約\ntagSlug × minXp"]
    end

    subgraph SK_TAG_AUTH["🏷 Tag Authority Center · 標籤語義唯一權威 #A6 #17"]
        direction LR
        CTA["centralized-tag.aggregate\n【全域語義字典主數據】\ntagSlug / label / category\ndeprecatedAt / deleteRule\n唯一性 & 刪除規則管理"]
        TAG_EVENTS["TagLifecycleEvent\nTagCreated · TagUpdated\nTagDeprecated · TagDeleted\n→ IER BACKGROUND_LANE [P1]"]
        TAG_READONLY["🔒 消費方唯讀引用規則\ntagSlug 唯一真相來源\n禁止任何切片自行維護標籤主數據\nT1：新切片訂閱事件即可擴展"]
        CTA -->|"標籤異動廣播"| TAG_EVENTS
        CTA -.->|"唯讀引用契約 T1~T5"| TAG_READONLY
    end
end

TAG_EVENTS -->|"BACKGROUND_LANE [P1]"| IER

%% ==========================================================================
%% VS1) IDENTITY SLICE — 身份驗證切片
%% [E6] Claims 刷新單一觸發點收斂於 CLAIMS_HANDLER
%% [P1] RoleChanged/PolicyChanged 由 IER CRITICAL_LANE 路由（同步快路徑）
%% ==========================================================================

subgraph VS1["🟦 VS1 · Identity Slice（身份驗證）"]
    direction TB

    subgraph VS1_IN["▶ External Trigger"]
        FIREBASE_AUTH["Firebase Authentication\n登入 / 註冊 / 重設密碼\n(外部 IdP)"]
    end

    subgraph VS1_DOMAIN["⚙ Identity Domain"]
        AUTH_IDENTITY["authenticated-identity\n已驗證身份主體"]
        IDENTITY_LINK["account-identity-link\nfirebaseUserId ↔ accountId"]
        ACTIVE_CTX["active-account-context\n組織 / 工作區作用中帳號"]
    end

    subgraph VS1_CLAIMS["📤 Claims Management [E6]"]
        CLAIMS_HANDLER["claims-refresh-handler\n【單一刷新觸發點 E6】\n登入後直接簽發（快路徑）\nRoleChanged/PolicyChanged\n→ IER CRITICAL_LANE → 此處重簽 [P1]"]
        CUSTOM_CLAIMS["custom-claims\n權限快照聲明 #5\n快路徑授權・非真實來源"]
        CLAIMS_HANDLER --> CUSTOM_CLAIMS
    end

    FIREBASE_AUTH --> AUTH_IDENTITY
    AUTH_IDENTITY --> IDENTITY_LINK
    IDENTITY_LINK --> ACTIVE_CTX
    AUTH_IDENTITY -->|"登入後觸發簽發"| CLAIMS_HANDLER
end

CUSTOM_CLAIMS -.->|"快照契約遵循"| SK_AUTH_SNAP

%% ==========================================================================
%% VS2) ACCOUNT SLICE — 帳號主體切片
%% [P7] 補齊 ACC_OUTBOX：ACC_EVENT_BUS 不再直連 IER
%%      Aggregate → (in-process) → ACC_EVENT_BUS → ACC_OUTBOX → IER
%% [E6] 帳號治理不寫 Custom Claims，僅發事件
%% ==========================================================================

subgraph VS2["🟩 VS2 · Account Slice（帳號主體）"]
    direction TB

    subgraph VS2_USER["👤 個人帳號域"]
        USER_AGG["user-account\n個人帳號 aggregate"]
        WALLET_AGG["account-user.wallet.aggregate\n強一致帳本 / 餘額不變量 #A1"]
        PROFILE["account-user.profile\n使用者資料 · FCM Token（弱一致）"]
    end

    subgraph VS2_ORG_ACC["🏢 組織帳號域"]
        ORG_ACC["organization-account\naggregate"]
        ORG_ACC_SETTINGS["organization-account.settings"]
        ORG_ACC_BINDING["organization-account.binding\n帳號↔組織主體綁定 ACL #A2"]
    end

    subgraph VS2_GOV["🛡 帳號治理域"]
        ACC_ROLE["account-governance.role"]
        ACC_POLICY["account-governance.policy"]
    end

    subgraph VS2_EVENT["📢 Account Events + Outbox [P7]"]
        ACC_EVENT_BUS["account-event-bus\nAccountCreated\nRoleChanged / PolicyChanged\n(in-process 內部訂閱)"]
        ACC_OUTBOX["acc-outbox\n【at-least-once 保證 P7】\nAggregate → EventBus → Outbox → IER"]
        ACC_EVENT_BUS -->|"pending events"| ACC_OUTBOX
    end

    USER_AGG --> WALLET_AGG
    USER_AGG -.->|弱一致| PROFILE
    ORG_ACC --> ORG_ACC_SETTINGS & ORG_ACC_BINDING
    ORG_ACC --> VS2_GOV
    ACC_ROLE --> ACC_EVENT_BUS
    ACC_POLICY --> ACC_EVENT_BUS
end

IDENTITY_LINK --> USER_AGG & ORG_ACC
ORG_ACC_BINDING -.->|"ACL / projection 防腐對接 #A2"| ORG_AGG
ACC_EVENT_BUS -.->|"事件契約遵循"| SK_ENV
ACC_OUTBOX -->|"CRITICAL_LANE: RoleChanged/PolicyChanged [P1]"| IER

%% ==========================================================================
%% VS3) SKILL XP SLICE — 能力成長切片
%% [P2] SkillXpAdded/Deducted → IER → 直接路由至 FUNNEL（不再過 ORG_EVENT_BUS）
%% 不變量：#11 XP 主權屬 Account BC；#12 Tier=純函式；#13 異動必寫 Ledger
%% ==========================================================================

subgraph VS3["🟩 VS3 · Skill XP Slice（能力成長）"]
    direction TB

    subgraph VS3_DOMAIN["⚙ Skill Domain"]
        SKILL_AGG["account-skill.aggregate\naccountId / skillId(→tagSlug)\nxp / version"]
        XP_LEDGER[("account-skill-xp-ledger\nentryId / delta / reason\nsourceId / timestamp\n稽核帳本 #13")]
    end

    subgraph VS3_EVENT["📢 Skill Events [P2]"]
        SKILL_EVENTS["SkillXpAdded / SkillXpDeducted\n（含 tagSlug 語義）\n→ IER STANDARD_LANE\n直接路由至 FUNNEL [P2]\n（不再過 ORG_EVENT_BUS）"]
    end

    SKILL_AGG -->|"#13 任何 XP 異動必寫 Ledger"| XP_LEDGER
    SKILL_AGG --> SKILL_EVENTS
end

SKILL_AGG -.->|"skillId=tagSlug 唯讀引用"| TAG_READONLY
SKILL_EVENTS -.->|"事件契約遵循"| SK_ENV
SKILL_EVENTS -.->|"tier 推導契約"| SK_SKILL_TIER
SKILL_EVENTS -->|"STANDARD_LANE [P1][P2]"| IER

%% ==========================================================================
%% VS4) ORGANIZATION SLICE — 組織治理切片
%% [P2] ORG_EVENT_BUS 改為純 Producer-only
%%      不再消費 IER 的 SkillXpAdded/Deducted（FUNNEL 直接訂閱）
%% [P7] 補齊 ORG_OUTBOX：ORG_EVENT_BUS 不再直連 IER
%%      Aggregate → (in-process) → ORG_EVENT_BUS → ORG_OUTBOX → IER
%% 不變量：#11 Organization 不改 XP；#A6 Tag Authority 唯讀
%% ==========================================================================

subgraph VS4["🟧 VS4 · Organization Slice（組織治理）"]
    direction TB

    subgraph VS4_CORE["🏗 組織核心域"]
        ORG_AGG["organization-core.aggregate\n組織聚合實體"]
    end

    subgraph VS4_GOV["🛡 組織治理域"]
        ORG_MEMBER["account-organization.member\n內部成員\n(tagSlug 唯讀引用)"]
        ORG_PARTNER["account-organization.partner\n外部夥伴\n(tagSlug 唯讀引用)"]
        ORG_TEAM["account-organization.team\n團隊（組視圖）"]
        ORG_POLICY["account-organization.policy\n政策管理"]
        ORG_SKILL_RECOG["organization-skill-recognition.aggregate\norgId / accountId / skillId\nminXpRequired / status #11"]
    end

    subgraph VS4_TAG_VIEW["🏷 Tag 組織作用域視圖（唯讀 T2）"]
        SKILL_TAG_POOL[("職能標籤庫\naccount-organization.skill-tag\n= Tag Authority 組織作用域快照\nTagLifecycleEvent 被動更新 T2")]
        TALENT_REPO[["人力資源池 Talent Repository #16\nMember(內部)+Partner(外部)+Team\n→ ORG_ELIGIBLE_MEMBER_VIEW 人力來源"]]
    end

    subgraph VS4_EVENT["📢 Organization Events + Outbox [P2][P7]"]
        ORG_EVENT_BUS["organization-core.event-bus\n【純 Producer-only [P2]】\nOrgContextProvisioned\nMemberJoined / MemberLeft\nSkillRecognitionGranted/Revoked\nPolicyChanged → AuthoritySnapshot\n⚠ 不再消費 SkillXpAdded/Deducted [P2]"]
        ORG_OUTBOX["org-outbox\n【at-least-once 保證 P7】\nAggregate → EventBus → Outbox → IER"]
        ORG_EVENT_BUS -->|"pending events"| ORG_OUTBOX
    end

    ORG_AGG -->|"OrgContextProvisioned"| ORG_EVENT_BUS
    ORG_POLICY -->|"PolicyChanged"| ORG_EVENT_BUS
    ORG_MEMBER & ORG_PARTNER & ORG_TEAM --> TALENT_REPO
    ORG_SKILL_RECOG --> ORG_EVENT_BUS
    TALENT_REPO -.->|"人力來源"| SKILL_TAG_POOL
end

ORG_AGG -.->|"tagSlug 唯讀引用"| TAG_READONLY
ORG_MEMBER -.->|"tagSlug 唯讀引用"| TAG_READONLY
ORG_PARTNER -.->|"tagSlug 唯讀引用"| TAG_READONLY
ORG_EVENT_BUS -.->|"事件契約遵循"| SK_ENV
ORG_OUTBOX -->|"CRITICAL_LANE: OrgContextProvisioned [P1]"| IER
ORG_OUTBOX -->|"STANDARD_LANE: MemberJoined/Left・SkillRecog [P1]"| IER

%% ==========================================================================
%% VS5) WORKSPACE SLICE — 工作區業務切片
%% [P4] WS_ROLE eligible-check 語義修正
%%      WS_ROLE 不直接掛 QGWAY_SCHED
%%      → 改為 VS5_GOV 透過 QGWAY 執行 policy-eligible-check（語義清晰）
%% [E5] WS_OUTBOX 為唯一 IER 投遞來源（沿用 v6）
%% [E2] ORG_CONTEXT_ACL 防腐層消費 IER 路由的 OrgContextProvisioned（沿用 v6）
%% ==========================================================================

subgraph VS5["🟣 VS5 · Workspace Slice（工作區業務）"]
    direction TB

    subgraph VS5_ACL["🔌 ACL 防腐層 [E2]"]
        ORG_CONTEXT_ACL["org-context.acl\n防腐層\n消費 IER → OrgContextProvisioned\n轉譯為 Workspace 本地 Context\n不依賴 ORG_AGG 內部狀態 #10"]
    end

    subgraph VS5_APP["⚙ Application Coordinator（#3 不承載領域規則）"]
        direction LR
        WS_CMD_HANDLER["command-handler\n指令處理器"]
        WS_SCOPE_GUARD["scope-guard\n作用域守衛 #A9"]
        WS_POLICY_ENG["policy-engine\n政策引擎"]
        WS_TX_RUNNER["transaction-runner\n#A8 1cmd/1agg 原子提交"]
        WS_OUTBOX["ws-outbox\n【唯一 IER 投遞來源 E5】\nat-least-once 保證"]
    end

    subgraph VS5_CORE["⚙ Workspace Core Domain"]
        WS_SETTINGS["workspace-core.settings"]
        WS_AGG["workspace-core.aggregate\n核心聚合實體"]
        WS_EVENT_BUS["workspace-core.event-bus\n【切片內部 in-process E5】\n不對外連接 IER"]
        WS_EVENT_STORE["workspace-core.event-store\n僅重播 / 稽核 #9"]
    end

    subgraph VS5_GOV["🛡 Workspace Governance [P4]"]
        WS_ROLE["workspace-governance.role\n繼承 org-governance.policy 約束 #18"]
        WS_POLICY_CHECK["policy-eligible-check [P4]\n透過 Query Gateway 查詢\norg-eligible-member-view\n語義：policy 驗證成員可排班性\n（非直接掛 QGWAY_SCHED 節點）"]
        WS_AUDIT["workspace-governance.audit\ntrace-identifier 事件溯源"]
        WS_ROLE -.->|"#18 觸發 eligible 查詢"| WS_POLICY_CHECK
    end

    subgraph VS5_BIZ["⚙ Business Domain（A+B 雙軌）"]
        direction TB

        subgraph VS5_PARSE["📄 文件解析閉環"]
            W_FILES["workspace-business.files\n檔案管理"]
            W_PARSER["document-parser\n文件解析"]
            PARSING_INTENT[("ParsingIntent\n解析合約 Digital Twin\n#A4 唯讀・僅提議事件")]
        end

        WORKFLOW_AGG["workflow.aggregate\nAnomaly State Machine\nadvanceStage\nblockWorkflow / unblockWorkflow #A3"]

        subgraph VS5_A["🟢 A軌：主流程（workflow 階段視圖）"]
            direction LR
            A_TASKS["tasks\n任務管理"]
            A_QA["quality-assurance\n品質驗證"]
            A_ACCEPT["acceptance\n驗收"]
            A_FINANCE["finance\n財務處理"]
        end

        subgraph VS5_B["🔴 B軌：異常處理中心"]
            B_ISSUES{{"issues\n問題追蹤單"}}
        end

        W_B_DAILY["daily\n手寫施工日誌"]
        W_B_SCHEDULE["schedule\n任務排程產生\n(tagSlug 唯讀引用 T4)"]

        W_FILES -.->|提供原始檔案| W_PARSER
        W_PARSER -->|解析完成| PARSING_INTENT
        PARSING_INTENT -->|任務批次草稿| A_TASKS
        PARSING_INTENT -->|財務指令| A_FINANCE
        PARSING_INTENT -->|解析異常| B_ISSUES
        A_TASKS -.->|"SourcePointer 唯讀 IntentID #A4"| PARSING_INTENT
        PARSING_INTENT -.->|"IntentDeltaProposed 提議 #A4"| A_TASKS
        WORKFLOW_AGG -.->|stage-view| A_TASKS & A_QA & A_ACCEPT & A_FINANCE
        A_TASKS --> A_QA --> A_ACCEPT --> A_FINANCE
        WORKFLOW_AGG -->|"A軌異常 → blockWorkflow #A3"| B_ISSUES
        A_TASKS -.-> W_B_DAILY
        A_TASKS -.->|任務分配 / 時間變動| W_B_SCHEDULE
        PARSING_INTENT -.->|提取職能需求 tagSlug T4| W_B_SCHEDULE
    end

    ORG_CONTEXT_ACL -.->|"本地 Org Context"| VS5_APP
    B_ISSUES -->|IssueResolved| WS_EVENT_BUS
    WS_EVENT_BUS -.->|"issues:resolved 中介解鎖 #A3（內部）"| WORKFLOW_AGG
    WS_CMD_HANDLER --> WS_SCOPE_GUARD --> WS_POLICY_ENG --> WS_TX_RUNNER
    WS_TX_RUNNER -->|"#A8 1cmd/1agg"| WS_AGG
    WS_TX_RUNNER -.->|執行業務邏輯| VS5_BIZ
    WS_TX_RUNNER -->|"pending events → outbox [E5]"| WS_OUTBOX
    WS_AGG --> WS_EVENT_STORE
    WS_AGG -->|"in-process [E5]"| WS_EVENT_BUS
    WS_AUDIT -.->|"#9 store→funnel→audit"| WS_EVENT_STORE
end

IER -.->|"CRITICAL_LANE: OrgContextProvisioned [E2]"| ORG_CONTEXT_ACL
W_B_SCHEDULE -.->|"tagSlug 職能需求唯讀引用 T4"| TAG_READONLY
W_B_SCHEDULE -.->|"人力需求契約"| SK_SKILL_REQ
WS_EVENT_BUS -.->|"事件契約遵循"| SK_ENV
WS_OUTBOX -->|"STANDARD_LANE [P1][E5]"| IER
WS_POLICY_CHECK -.->|"policy eligible-check via QGW [P4]"| QGWAY_SCHED

%% ==========================================================================
%% VS6) SCHEDULING SLICE — 排班協作切片
%% [P3] 新增 SCHED_OUTBOX：ORG_SCHEDULE 不再直連 ORG_EVENT_BUS
%%      ORG_SCHEDULE → SCHED_OUTBOX → IER → FUNNEL（統一出口原則）
%% [P7] SCHED_OUTBOX 補齊 at-least-once 保證
%% 不變量：#14 只讀 ORG_ELIGIBLE_MEMBER_VIEW；#15 eligible 生命週期；#A5 Saga
%% ==========================================================================

subgraph VS6["🟨 VS6 · Scheduling Slice（排班協作）"]
    direction TB

    subgraph VS6_DOMAIN["⚙ Schedule Domain"]
        ORG_SCHEDULE["account-organization.schedule\nHR Scheduling\n(tagSlug 職能需求唯讀引用 T4)"]
    end

    subgraph VS6_SAGA["⚙ Scheduling Saga（補償事件 #A5）"]
        SCHEDULE_SAGA["scheduling-saga\nScheduleAssignRejected\nScheduleProposalCancelled"]
    end

    subgraph VS6_OUTBOX["📤 Schedule Outbox [P3][P7]"]
        SCHED_OUTBOX["sched-outbox\n【at-least-once 保證 P3/P7】\nORG_SCHEDULE 不再直連 ORG_EVENT_BUS\n→ 改走 SCHED_OUTBOX → IER"]
    end

    ORG_SCHEDULE -.->|"#14 只讀 eligible=true"| QGWAY_SCHED
    ORG_SCHEDULE -->|"ScheduleAssigned [P3]"| SCHED_OUTBOX
    ORG_SCHEDULE -.->|"人力需求契約"| SK_SKILL_REQ
    ORG_SCHEDULE -.->|"tagSlug 職能需求唯讀引用 T4"| TAG_READONLY
    SCHEDULE_SAGA -->|"#A5 compensating event"| SCHED_OUTBOX
end

IER -.->|"ScheduleProposed 路由 #A5"| ORG_SCHEDULE
SCHED_OUTBOX -->|"STANDARD_LANE: ScheduleAssigned [P1][P3]"| IER

%% ==========================================================================
%% VS7) NOTIFICATION SLICE — 通知交付切片
%% [E3] NOTIF_ROUTER 消費 IER STANDARD_LANE 路由的 ScheduleAssigned
%% 不變量：#6 只讀 Projection；#A10 無狀態路由
%% ==========================================================================

subgraph VS7["🩷 VS7 · Notification Slice（通知交付）"]
    direction TB

    subgraph VS7_ROUTE["⚙ Notification Router（無狀態 #A10）[E3]"]
        NOTIF_ROUTER["account-governance\n.notification-router\n路由至 TargetAccountID\n消費 IER STANDARD_LANE\nScheduleAssigned [E3]"]
    end

    subgraph VS7_DELIVER["📤 Delivery"]
        USER_NOTIF["account-user.notification\n個人推播通知"]
        FCM[["Firebase Cloud Messaging\n推播閘道"]]
        USER_DEVICE["使用者裝置\n手機 / 瀏覽器"]
    end

    NOTIF_ROUTER -->|TargetAccountID 匹配| USER_NOTIF
    PROFILE -.->|"提供 FCM Token（唯讀）"| USER_NOTIF
    USER_NOTIF -.->|"#6 過濾+投影"| QGWAY_NOTIF
    USER_NOTIF --> FCM --> USER_DEVICE
end

%% ==========================================================================
%% GW) 三閘道統一出入口（CQRS Gateway Layer）
%% [P1] IER 優先級三道分層（CRITICAL / STANDARD / BACKGROUND）
%% [P6] 引入 DEAD_LETTER_QUEUE：統一失敗回補路徑
%%
%% IER 完整路由規則表：
%%   CRITICAL_LANE（同步/強一致）：
%%     RoleChanged/PolicyChanged    → CLAIMS_HANDLER          [E6]
%%     OrgContextProvisioned        → ORG_CONTEXT_ACL         [E2]
%%   STANDARD_LANE（非同步/最終一致）：
%%     SkillXpAdded/Deducted        → FUNNEL (直接) [P2]
%%     ScheduleAssigned             → NOTIF_ROUTER             [E3]
%%     ScheduleProposed             → ORG_SCHEDULE Saga        [A5]
%%     MemberJoined/Left            → FUNNEL (直接)
%%     All Domain Events            → FUNNEL                   [#9]
%%   BACKGROUND_LANE（低頻/可延遲）：
%%     TagLifecycleEvent            → FUNNEL (TAG_SNAPSHOT)    [T1]
%%     AuditEvents                  → FUNNEL (ACC_AUDIT)
%% ==========================================================================

subgraph GW["⚪ 三閘道統一出入口（CQRS Gateway Layer）"]
    direction TB

    subgraph GW_CMD["🔵 Command Bus Gateway（統一寫入入口）"]
        direction TB
        CBG_ENTRY["unified-command-gateway\n統一指令入口\nTraceID 注入 [E4]\n所有 _actions.ts 唯一入口"]
        CBG_AUTH["universal-authority-interceptor\nAuthoritySnapshot 快照快路徑 #A9\nCustom Claims 快速驗證"]
        CBG_ROUTE["command-router\n路由至對應切片 Command Handler\n擴展：新切片只需註冊路由規則"]

        CBG_ENTRY --> CBG_AUTH --> CBG_ROUTE
        CBG_AUTH -.->|"高風險二次確認 #A9"| SKILL_AGG
        CBG_AUTH -.->|"高風險二次確認 #A9"| ORG_AGG
        WS_SCOPE_GUARD -.->|"高風險二次確認 #A9"| WS_AGG
    end

    subgraph GW_EVENT["🟠 Integration Event Router [P1][P6]"]
        direction TB

        IER[["integration-event-router\n跨 BC 事件路由器\n【統一事件出口 #9】\n擴展：新訂閱只需加路由規則"]]

        subgraph IER_LANES["優先級三道分層 [P1]"]
            direction TB
            CRITICAL_LANE["🔴 CRITICAL_LANE\n同步快路徑\nRoleChanged/PolicyChanged→CLAIMS_HANDLER\nOrgContextProvisioned→ORG_CONTEXT_ACL\n延遲 SLA：< 100ms"]
            STANDARD_LANE["🟡 STANDARD_LANE\n非同步最終一致\nSkillXpAdded→FUNNEL [P2]\nScheduleAssigned→NOTIF_ROUTER\nMemberJoined→FUNNEL\nAll Domain Events→FUNNEL\n延遲 SLA：< 2s"]
            BACKGROUND_LANE["⚪ BACKGROUND_LANE\n低頻可延遲\nTagLifecycleEvent→FUNNEL\nAuditEvents→FUNNEL\n延遲 SLA：< 30s"]
        end

        DLQ["💀 dead-letter-queue [P6]\n統一失敗事件收集\n觸發：投遞失敗 3 次後入 DLQ\n回補：DLQ → Replay → IER\n告警：DLQ.size > threshold → DOMAIN_ERRORS"]
        DLQ_REPLAY["dlq-replay-handler\n手動 / 自動重試\n→ 重新注入對應 Lane"]

        IER --> IER_LANES
        IER_LANES -.->|"投遞失敗 3 次"| DLQ
        DLQ --> DLQ_REPLAY
        DLQ_REPLAY -.->|"重新注入"| IER
    end

    subgraph GW_QUERY["🟢 Query Gateway（統一讀取入口）"]
        direction TB
        QGWAY["read-model-registry\n統一讀取入口\n版本對照 / 快照路由\n擴展：新 Read Model 只需註冊"]
        QGWAY_SCHED["→ .org-eligible-member-view\n#14 #15 #16 eligible 快照\n[P4] policy-eligible-check 消費點"]
        QGWAY_NOTIF["→ .account-view\n#6 FCM Token 消費"]
        QGWAY_SCOPE["→ .workspace-scope-guard-view\n#A9 Scope Guard 快路徑"]
        QGWAY --> QGWAY_SCHED & QGWAY_NOTIF & QGWAY_SCOPE
    end

    CBG_ROUTE -->|"Workspace Command"| WS_CMD_HANDLER
    CBG_ROUTE -->|"Skill Command"| SKILL_AGG
    CBG_ROUTE -->|"Org Command"| ORG_AGG
    CBG_ROUTE -->|"Account Command"| USER_AGG
    ACTIVE_CTX -->|"查詢鍵"| QGWAY_SCOPE
    QGWAY_SCOPE --> CBG_AUTH
end

SERVER_ACTIONS["_actions.ts\n所有切片 Server Action\n統一觸發入口"]
SERVER_ACTIONS --> CBG_ENTRY

IER -.->|"CRITICAL: RoleChanged/PolicyChanged [E6]"| CLAIMS_HANDLER
IER -.->|"STANDARD: ScheduleAssigned [E3]"| NOTIF_ROUTER

%% ==========================================================================
%% VS8) PROJECTION BUS — 事件投影總線
%% [P5] FUNNEL 雙 Lane 分層：
%%      CRITICAL_PROJ_LANE：WS_SCOPE_VIEW（授權）+ ORG_ELIGIBLE_VIEW（排班）
%%      STANDARD_PROJ_LANE：其餘稽核/快照類 Read Model
%%      每個 Projection 獨立 dead-letter 回補機制
%% [P2] SkillXpAdded/Deducted 由 IER STANDARD_LANE 直接路由此 FUNNEL（不再過 ORG_EVENT_BUS）
%% 不變量：#9 可完整重建；#A7 Funnel 只做 compose
%% ==========================================================================

subgraph VS8["🟡 VS8 · Projection Bus（事件投影總線）"]
    direction TB

    subgraph VS8_FUNNEL["▶ Event Funnel [P5]"]
        direction LR

        CRITICAL_PROJ_LANE["🔴 CRITICAL_PROJ_LANE [P5]\n授權 / 排班關鍵路徑\n獨立重試 / dead-letter\nSLA：< 500ms 完成投影"]
        STANDARD_PROJ_LANE["⚪ STANDARD_PROJ_LANE [P5]\n稽核 / 快照 / 一般視圖\n獨立重試 / dead-letter\nSLA：< 10s 完成投影"]

        FUNNEL[["event-funnel\n統一事件漏斗\n#9 唯一 Projection 寫入路徑\n[E4][P5] Metrics 採集點"]]
        FUNNEL --> CRITICAL_PROJ_LANE & STANDARD_PROJ_LANE
    end

    subgraph VS8_META["⚙ Stream Version & Registry"]
        PROJ_VER["projection.version\n事件串流偏移量 / 版本對照"]
        READ_REG["read-model-registry\n讀模型版本目錄"]
    end

    subgraph VS8_CRITICAL_VIEWS["🔴 Critical Projections（授權/排班路徑）[P5]"]
        WS_SCOPE_VIEW["projection\n.workspace-scope-guard-view\nScope Guard 專用 #A9\n授權關鍵路徑 CRITICAL"]
        ORG_ELIGIBLE_VIEW["projection\n.org-eligible-member-view\norgId / accountId\nskills{tagSlug→xp} / eligible\n來源: MemberJoined/Left\n· SkillXpAdded/Deducted [P2 直接路由]\n· ScheduleAssigned/Completed/Cancelled\n#14 #15 #16 T3\n排班關鍵路徑 CRITICAL"]
        TIER_FN[["getTier(xp) → Tier\n純函式・不存 DB #12\nApprentice→Titan"]]
    end

    subgraph VS8_STANDARD_VIEWS["⚪ Standard Projections（一般視圖）[P5]"]
        direction LR

        subgraph VS8_WS_VIEWS["Workspace Views"]
            WORKSPACE_PROJ["projection.workspace-view"]
            ACC_AUDIT_VIEW["projection.account-audit"]
            ACC_SCHED_VIEW["projection.account-schedule"]
        end

        subgraph VS8_ACC_VIEWS["Account Views"]
            ACC_PROJ_VIEW_NODE["projection.account-view"]
            ORG_PROJ_VIEW["projection.organization-view"]
        end

        subgraph VS8_SKILL_VIEWS["Skill View"]
            SKILL_VIEW["projection.account-skill-view\naccountId / skillId(=tagSlug) / xp / tier\n來源: SkillXpAdded/Deducted [P2]"]
        end

        subgraph VS8_TAG_VIEW["Tag View（BACKGROUND T5）"]
            TAG_SNAPSHOT["projection.tag-snapshot\ntagSlug / label / category\n全域語義快照\n來源: TagLifecycleEvent\n消費方禁止寫入 T5"]
        end
    end

    IER ==>|"#9 唯一 Projection 寫入路徑"| FUNNEL
    CRITICAL_PROJ_LANE --> WS_SCOPE_VIEW & ORG_ELIGIBLE_VIEW
    STANDARD_PROJ_LANE --> WORKSPACE_PROJ & ACC_AUDIT_VIEW & ACC_SCHED_VIEW
    STANDARD_PROJ_LANE --> ACC_PROJ_VIEW_NODE & ORG_PROJ_VIEW & SKILL_VIEW & TAG_SNAPSHOT

    FUNNEL -->|stream offset| PROJ_VER
    PROJ_VER -->|version mapping| READ_REG
    WS_EVENT_STORE -.->|"#9 replay → rebuild"| FUNNEL
    SKILL_VIEW -.->|"#12 getTier"| TIER_FN
    ORG_ELIGIBLE_VIEW -.->|"#12 getTier"| TIER_FN
end

READ_REG -.->|"版本目錄同步"| QGWAY
WS_SCOPE_VIEW -.->|"快照契約"| SK_AUTH_SNAP
ACC_PROJ_VIEW_NODE -.->|"快照契約"| SK_AUTH_SNAP
SKILL_VIEW -.->|"tier 推導契約"| SK_SKILL_TIER
ORG_ELIGIBLE_VIEW -.->|"tier 推導契約"| SK_SKILL_TIER
ORG_ELIGIBLE_VIEW -.-> QGWAY_SCHED
ACC_PROJ_VIEW_NODE -.-> QGWAY_NOTIF
WS_SCOPE_VIEW -.-> QGWAY_SCOPE

%% ==========================================================================
%% VS9) OBSERVABILITY SLICE — 可觀測性切片（橫切面全域掛載 [E4]）
%% 掛載點：CBG_ENTRY（入口層）+ IER（事件層）+ FUNNEL（投影層）+ TX_RUNNER（業務層）
%% [P6] DLQ.size > threshold → DOMAIN_ERRORS 告警路徑
%% ==========================================================================

subgraph VS9["⬜ VS9 · Observability（橫切面全域掛載）"]
    direction LR
    TRACE_ID["trace-identifier\ncorrelation-identifier\n掛載：CBG_ENTRY\nTraceID 全域注入 [E4]"]
    DOMAIN_METRICS["domain-metrics\n掛載：IER 各 Lane\n+ FUNNEL 各 Lane\nThroughput / Latency / ErrorRate"]
    DOMAIN_ERRORS["domain-error-log\n掛載：WS_TX_RUNNER\n+ SCHEDULE_SAGA\n+ DLQ 告警 [P6]"]
end

CBG_ENTRY --> TRACE_ID
IER --> DOMAIN_METRICS
FUNNEL --> DOMAIN_METRICS
WS_TX_RUNNER --> DOMAIN_ERRORS
SCHEDULE_SAGA --> DOMAIN_ERRORS
DLQ -.->|"DLQ size 告警 [P6]"| DOMAIN_ERRORS

%% ==========================================================================
%% CONSISTENCY INVARIANTS 完整索引
%% ==========================================================================
%% #1  每個 BC 只能修改自己的 Aggregate，禁止跨 BC 直接寫入
%% #2  跨 BC 僅能透過 Event/Projection/ACL 溝通，禁止直接讀取對方 Domain Model
%% #3  Application Layer 只協調流程，不承載領域規則
%% #4  Domain Event 僅由 Aggregate 產生；Transaction Runner 只彙整已產生事件並投遞 Outbox
%% #5  Custom Claims 只做權限快照，不是真實來源
%% #6  Notification 只讀 Projection，不依賴 Domain Core
%% #7  Scope Guard 僅讀本 Context Read Model，不直接依賴外部 Event Bus
%% #8  Shared Kernel 必須顯式標示；未標示跨 BC 共用視為侵入
%% #9  Projection 必須可由事件完整重建；否則不得宣稱 Event Sourcing
%% #10 任一模組若需外部 Context 內部狀態，代表邊界設計錯誤
%% #11 XP 屬 Account BC；Organization 只能設定門檻，不能修改 XP
%% #12 Tier 永遠是推導值 getTier(xp)，不得存入任何 DB 欄位
%% #13 XP 任何異動必須寫 Ledger；不可直接 update xp 欄位
%% #14 Schedule 只讀 ORG_ELIGIBLE_MEMBER_VIEW，不查 Domain Aggregate
%% #15 eligible 生命週期：member:joined→true · assigned→false · completed/cancelled→true
%% #16 Talent Repository = member(內部)+partner(外部)+team(組視圖) → ORG_ELIGIBLE_MEMBER_VIEW
%% #17 centralized-tag.aggregate 管理 tagSlug 唯一性與刪除規則；消費方唯讀引用
%% #18 workspace-governance = 策略執行層；role 繼承 policy 硬約束
%% ==========================================================================
%% ATOMICITY AUDIT DECISIONS 完整索引
%% ==========================================================================
%% #A1  wallet 獨立 aggregate 強一致；profile/notification 弱一致
%% #A2  org-account.binding 只允許 ACL/projection 防腐對接
%% #A3  A 軌異常 → blockWorkflow → WORKFLOW_AGGREGATE → issues:resolved 中介解鎖
%% #A4  ParsingIntent 對 Tasks 只允許提議事件，不可直接回寫
%% #A5  schedule 跨 BC 採 saga/compensating event
%% #A6  CENTRALIZED_TAG_AGGREGATE 為語義字典唯一權威
%% #A7  Event Funnel 僅負責 projection compose，不承擔跨 BC 不變量
%% #A8  Transaction Runner 僅保證 1 command / 1 aggregate 原子提交
%% #A9  Scope Guard 讀 projection 快路徑；高風險授權需回源 aggregate 再確認
%% #A10 Notification Router 僅做無狀態路由；跨 BC 業務決策留在來源 BC
%% #A11 eligible 旗標 = 「無衝突排班」快照，非靜態成員狀態
%% ==========================================================================
%% TAG AUTHORITY 擴展規則
%% T1  新切片若需標籤語義：只需訂閱 TagLifecycleEvent（BACKGROUND_LANE）
%% T2  SKILL_TAG_POOL = Tag Authority 組織作用域唯讀投影（TagLifecycleEvent 被動更新）
%% T3  ORG_ELIGIBLE_MEMBER_VIEW.skills{tagSlug→xp} = Tag Authority tagSlug × Skill XP 的交叉快照
%% T4  W_B_SCHEDULE / ORG_SCHEDULE 的職能需求標籤 = SK_SKILL_REQ × Tag Authority tagSlug
%% T5  TAG_SNAPSHOT = 全域語義字典最終一致讀模型；消費方禁止寫入
%% ==========================================================================
%% v6 效率優化索引（沿用）
%% E1  SKILL_EVENTS → IER（不再直注入 ORG_EVENT_BUS）
%% E2  OrgContextProvisioned → IER → VS5 ACL 防腐層
%% E3  ScheduleAssigned → IER → NOTIF_ROUTER
%% E4  Observability CBG_ENTRY + IER + FUNNEL 全域掛載
%% E5  WS_OUTBOX 為 VS5 唯一 IER 投遞來源
%% E6  Custom Claims 刷新單一觸發點：CLAIMS_HANDLER
%% ==========================================================================
%% v7 深層效率修正索引（本版本）
%% P1  IER 三道優先級分層：CRITICAL / STANDARD / BACKGROUND（解決高頻低優先擠壓問題）
%% P2  ORG_EVENT_BUS 純 Producer-only；SkillXpAdded/Deducted 直接路由 FUNNEL（消除迴圈）
%% P3  VS6 補 SCHED_OUTBOX；ORG_SCHEDULE 不再直連 ORG_EVENT_BUS（統一出口原則全面落地）
%% P4  WS_ROLE eligible-check 改為 policy-eligible-check via QGW（語義清晰化）
%% P5  FUNNEL 雙 Lane 分層：CRITICAL_PROJ / STANDARD_PROJ + 獨立 dead-letter
%% P6  IER 引入 DEAD_LETTER_QUEUE：統一失敗回補路徑 + DLQ 告警接入 DOMAIN_ERRORS
%% P7  OUTBOX 全面補齊：VS2/ACC_OUTBOX + VS4/ORG_OUTBOX + VS6/SCHED_OUTBOX
%%     統一原則：Aggregate → EventBus(in-process) → OUTBOX → IER（禁止直連）
%% ==========================================================================

%% ==========================================================================
%% STYLES
%% ==========================================================================
classDef sk fill:#ecfeff,stroke:#22d3ee,color:#000,font-weight:bold
classDef tagAuth fill:#cffafe,stroke:#0891b2,color:#000,font-weight:bold
classDef identity fill:#dbeafe,stroke:#93c5fd,color:#000
classDef claimsNode fill:#dbeafe,stroke:#1d4ed8,color:#000,font-weight:bold
classDef account fill:#dcfce7,stroke:#86efac,color:#000
classDef outboxNode fill:#fef9c3,stroke:#ca8a04,color:#000,font-weight:bold
classDef skillSlice fill:#bbf7d0,stroke:#22c55e,color:#000
classDef orgSlice fill:#fff7ed,stroke:#fdba74,color:#000
classDef wsSlice fill:#ede9fe,stroke:#c4b5fd,color:#000
classDef wsAcl fill:#f5f3ff,stroke:#7c3aed,color:#000,stroke-dasharray:4 2
classDef schedSlice fill:#fef9c3,stroke:#ca8a04,color:#000
classDef notifSlice fill:#fce7f3,stroke:#db2777,color:#000
classDef projCritical fill:#fee2e2,stroke:#dc2626,color:#000,font-weight:bold
classDef projStandard fill:#fef9c3,stroke:#d97706,color:#000
classDef tagProjSlice fill:#e0f2fe,stroke:#0284c7,color:#000
classDef gateway fill:#f8fafc,stroke:#334155,color:#000,font-weight:bold
classDef cmdGw fill:#eff6ff,stroke:#2563eb,color:#000
classDef eventGw fill:#fff7ed,stroke:#ea580c,color:#000
classDef criticalLane fill:#fee2e2,stroke:#dc2626,color:#000,font-weight:bold
classDef standardLane fill:#fef9c3,stroke:#ca8a04,color:#000
classDef backgroundLane fill:#f1f5f9,stroke:#64748b,color:#000
classDef dlqNode fill:#fca5a5,stroke:#b91c1c,color:#000,font-weight:bold
classDef queryGw fill:#f0fdf4,stroke:#15803d,color:#000
classDef observability fill:#f1f5f9,stroke:#64748b,color:#000
classDef trackA fill:#d1fae5,stroke:#059669,color:#000
classDef trackB fill:#fee2e2,stroke:#dc2626,color:#000
classDef ledger fill:#bbf7d0,stroke:#16a34a,color:#000
classDef tierFn fill:#fdf4ff,stroke:#9333ea,color:#000
classDef talent fill:#fff1f2,stroke:#f43f5e,color:#000
classDef serverAction fill:#fed7aa,stroke:#f97316,color:#000

class SK,SK_ENV,SK_AUTH_SNAP,SK_SKILL_TIER,SK_SKILL_REQ sk
class CTA,TAG_EVENTS,TAG_READONLY tagAuth
class VS1,FIREBASE_AUTH,AUTH_IDENTITY,IDENTITY_LINK,ACTIVE_CTX identity
class CLAIMS_HANDLER,CUSTOM_CLAIMS claimsNode
class VS2,USER_AGG,WALLET_AGG,PROFILE,ORG_ACC,ORG_ACC_SETTINGS,ORG_ACC_BINDING,ACC_ROLE,ACC_POLICY,ACC_EVENT_BUS account
class ACC_OUTBOX,ORG_OUTBOX,SCHED_OUTBOX,WS_OUTBOX outboxNode
class VS3,SKILL_AGG,XP_LEDGER,SKILL_EVENTS skillSlice
class VS4,ORG_AGG,ORG_MEMBER,ORG_PARTNER,ORG_TEAM,ORG_POLICY,ORG_SKILL_RECOG,SKILL_TAG_POOL,ORG_EVENT_BUS orgSlice
class TALENT_REPO talent
class VS5,WS_CMD_HANDLER,WS_SCOPE_GUARD,WS_POLICY_ENG,WS_TX_RUNNER,WS_SETTINGS,WS_AGG,WS_EVENT_BUS,WS_EVENT_STORE,WS_ROLE,WS_POLICY_CHECK,WS_AUDIT,W_FILES,W_PARSER,PARSING_INTENT,WORKFLOW_AGG wsSlice
class ORG_CONTEXT_ACL wsAcl
class A_TASKS,A_QA,A_ACCEPT,A_FINANCE trackA
class B_ISSUES,W_B_DAILY,W_B_SCHEDULE wsSlice
class VS6,ORG_SCHEDULE,SCHEDULE_SAGA schedSlice
class VS7,NOTIF_ROUTER,USER_NOTIF,FCM,USER_DEVICE notifSlice
class GW gateway
class CBG_ENTRY,CBG_AUTH,CBG_ROUTE cmdGw
class IER,IER_LANES eventGw
class CRITICAL_LANE criticalLane
class STANDARD_LANE standardLane
class BACKGROUND_LANE backgroundLane
class DLQ,DLQ_REPLAY dlqNode
class QGWAY,QGWAY_SCHED,QGWAY_NOTIF,QGWAY_SCOPE queryGw
class VS8,FUNNEL,PROJ_VER,READ_REG projStandard
class CRITICAL_PROJ_LANE,WS_SCOPE_VIEW,ORG_ELIGIBLE_VIEW projCritical
class STANDARD_PROJ_LANE,WORKSPACE_PROJ,ACC_AUDIT_VIEW,ACC_SCHED_VIEW,ACC_PROJ_VIEW_NODE,ORG_PROJ_VIEW,SKILL_VIEW projStandard
class TAG_SNAPSHOT tagProjSlice
class TIER_FN tierFn
class VS9,TRACE_ID,DOMAIN_METRICS,DOMAIN_ERRORS observability
class SERVER_ACTIONS serverAction
