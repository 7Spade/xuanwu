---
title: Logic Overview v8 — Production-Grade Modernized Foundation
---

> ⚠️ **DEPRECATED** — This is a historical reference (v8).
> The current source of truth is `docs/overview/logic-overview_v10.md`.
> Do not use this file for implementation decisions.


%% ==========================================================================
%% LOGIC OVERVIEW v8 · 現代化生產級基礎架構（開發基礎確保無誤版本）
%% ==========================================================================
%%
%% v7 → v8：八項開發基礎確保無誤修正
%%
%%  [Q1] VS3 補 SKILL_OUTBOX
%%       OUTBOX 原則全面落地（所有切片統一）
%%       SKILL_AGG → SKILL_EVENTS(in-process) → SKILL_OUTBOX → IER
%%
%%  [Q2] VS0 補 TAG_OUTBOX
%%       centralized-tag.aggregate 事件走 OUTBOX，at-least-once 保證
%%       CTA → TAG_EVENTS(in-process) → TAG_OUTBOX → IER BACKGROUND_LANE
%%
%%  [Q3] event-envelope 加入 idempotency-key
%%       DLQ Replay 重注入無冪等保護會導致 eligible 狀態機雙重處理
%%       SK_ENV 欄位擴充：eventId + aggregateId + version = idempotency-key
%%       FUNNEL 所有消費方：upsert by idempotency-key（去重保護）
%%
%%  [Q4] ACTIVE_CTX 生命週期補全
%%       登入後建立 → TTL 到期/TokenExpired/OrgSwitched → 觸發重建
%%       新增 CONTEXT_LIFECYCLE_MANAGER：管理 CTX 的建立/刷新/失效
%%       CBG_AUTH 一致性規則：ACTIVE_CTX 與 Custom Claims 衝突時，以 ACTIVE_CTX 為準
%%
%%  [Q5] 跨片稽核補全
%%       WS_AUDIT 只有 Workspace 內部事件，跨片操作無法稽核
%%       新增 AUDIT_EVENT_COLLECTOR：訂閱 IER BACKGROUND_LANE → 統一稽核日誌
%%       ACC_AUDIT_VIEW 升格為 GLOBAL_AUDIT_VIEW（跨片完整日誌）
%%
%%  [Q6] Tag Stale Guard + Max Staleness 標示
%%       TAG_SNAPSHOT BACKGROUND_LANE SLA 30s 造成 SKILL_TAG_POOL 最長 30s 語義不一致
%%       新增 TAG_STALE_GUARD：
%%         排班/技能配對時以 TAG_SNAPSHOT 最新版本校驗
%%         Deprecated tagSlug 出現時觸發 StaleTagWarning 事件
%%
%%  [Q7] CBG_ENTRY 前置三層保護
%%       統一入口無限流/熔斷/隔板，高負載切片可拖垮所有切片
%%       前置：RATE_LIMITER → CIRCUIT_BREAKER → BULKHEAD_ROUTER → CBG_ENTRY
%%
%%  [Q8] WALLET 強一致事件走 CRITICAL_LANE
%%       WALLET_AGG 強一致 #A1，事件卻走異步 STANDARD_LANE 造成讀寫不一致
%%       WalletDeducted/WalletCredited → ACC_OUTBOX CRITICAL_LANE
%%       account-view 的 wallet-balance 標示 STRONG_READ（回源 WALLET_AGG）
%%
%% ─────────────────────────────────────────────────────
%% 完整優化累積索引（v4~v8）：
%%   E1~E6 : v6 邊界修正
%%   T1~T5 : Tag Authority 擴展規則
%%   P1~P7 : v7 深層效率修正
%%   Q1~Q8 : v8 開發基礎現代化確保
%% ─────────────────────────────────────────────────────
%% 閱讀順序：
%%   VS0) Shared Kernel + Tag Authority Center  ← [Q2][Q3][Q6]
%%   VS1) Identity Slice                        ← [Q4]
%%   VS2) Account Slice                         ← [Q8]
%%   VS3) Skill XP Slice                        ← [Q1]
%%   VS4) Organization Slice
%%   VS5) Workspace Slice                       ← [Q5]
%%   VS6) Scheduling Slice
%%   VS7) Notification Slice
%%   GW)  三閘道統一出入口                       ← [Q7]
%%   VS8) Projection Bus                        ← [Q3][Q5][Q6]
%%   VS9) Observability
%% ==========================================================================

flowchart TD

%% ==========================================================================
%% VS0) SHARED KERNEL + TAG AUTHORITY CENTER
%% [Q2] 補 TAG_OUTBOX：CTA 事件不再直連 IER
%% [Q3] event-envelope 擴充 idempotency-key
%% [Q6] TAG_STALE_GUARD：排班/技能配對的語義一致性保護
%% ==========================================================================

subgraph SK["🔷 VS0 · Shared Kernel + Tag Authority Center"]
    direction TB

    subgraph SK_CONTRACTS["📄 跨切片顯式契約 #8"]
        direction LR
        SK_ENV["event-envelope [Q3]\n統一事件信封\nversion / traceId / timestamp\n+ idempotency-key\n  = eventId＋aggregateId＋version\n所有 DomainEvent 必須遵循"]
        SK_AUTH_SNAP["authority-snapshot\n權限快照契約\nclaims / roles / scopes\nTTL 標示 [Q4]"]
        SK_SKILL_TIER["skill-tier\ngetTier(xp)→Tier\n純函式・永不存 DB #12"]
        SK_SKILL_REQ["skill-requirement\n跨片人力需求契約\ntagSlug × minXp"]
    end

    subgraph SK_TAG_AUTH["🏷 Tag Authority Center · 唯一權威 #A6 #17"]
        direction LR
        CTA["centralized-tag.aggregate\n【全域語義字典主數據】\ntagSlug / label / category\ndeprecatedAt / deleteRule"]
        TAG_EVENTS["TagLifecycleEvent\nTagCreated · TagUpdated\nTagDeprecated · TagDeleted\n(in-process)"]
        TAG_OUTBOX["tag-outbox [Q2]\nat-least-once 保證\nCTA → Events → Outbox → IER"]
        TAG_READONLY["🔒 消費方唯讀引用規則\ntagSlug 唯一真相來源\nT1：新切片訂閱事件即可擴展"]
        TAG_STALE_GUARD["⚠ TAG_STALE_GUARD [Q6]\nMax Staleness：≤ 30s\n排班/技能配對時\n以 TAG_SNAPSHOT 最新版本校驗\nDeprecated tagSlug\n→ StaleTagWarning 事件"]

        CTA -->|"標籤異動廣播"| TAG_EVENTS
        TAG_EVENTS -->|"pending"| TAG_OUTBOX
        CTA -.->|"唯讀引用契約 T1~T5"| TAG_READONLY
        CTA -.->|"Deprecated 通知"| TAG_STALE_GUARD
    end
end

TAG_OUTBOX -->|"BACKGROUND_LANE [P1][Q2]"| IER

%% ==========================================================================
%% VS1) IDENTITY SLICE — 身份驗證切片
%% [Q4] ACTIVE_CTX 生命週期補全
%%      新增 CONTEXT_LIFECYCLE_MANAGER：建立/刷新/失效
%%      觸發點：Login / TokenExpired / OrgSwitched / WorkspaceSwitched
%%      CBG_AUTH 一致性規則：ACTIVE_CTX 與 Claims 衝突 → 以 ACTIVE_CTX 為準
%% ==========================================================================

subgraph VS1["🟦 VS1 · Identity Slice（身份驗證）"]
    direction TB

    subgraph VS1_IN["▶ External Trigger"]
        FIREBASE_AUTH["Firebase Authentication\n登入 / 註冊 / 重設密碼"]
    end

    subgraph VS1_DOMAIN["⚙ Identity Domain"]
        AUTH_IDENTITY["authenticated-identity\n已驗證身份主體"]
        IDENTITY_LINK["account-identity-link\nfirebaseUserId ↔ accountId"]

        subgraph VS1_CTX["⚙ Context Lifecycle [Q4]"]
            ACTIVE_CTX["active-account-context\n組織 / 工作區作用中帳號\nTTL：Token 有效期同步"]
            CTX_LIFECYCLE["context-lifecycle-manager [Q4]\n建立：Login 後\n刷新：OrgSwitched / WorkspaceSwitched\n失效：TokenExpired / Logout\n一致性規則：衝突時以 ACTIVE_CTX 為準"]
            CTX_LIFECYCLE -->|"建立 / 刷新 / 失效"| ACTIVE_CTX
        end
    end

    subgraph VS1_CLAIMS["📤 Claims Management [E6]"]
        CLAIMS_HANDLER["claims-refresh-handler\n【單一刷新觸發點 E6】\n登入簽發 / RoleChanged 重簽\nIER CRITICAL_LANE → 此處 [P1]"]
        CUSTOM_CLAIMS["custom-claims\n權限快照聲明 #5\nTTL：同 Token 有效期 [Q4]"]
        CLAIMS_HANDLER --> CUSTOM_CLAIMS
    end

    FIREBASE_AUTH --> AUTH_IDENTITY
    AUTH_IDENTITY --> IDENTITY_LINK
    IDENTITY_LINK --> CTX_LIFECYCLE
    AUTH_IDENTITY -->|"登入後觸發"| CLAIMS_HANDLER
end

CUSTOM_CLAIMS -.->|"快照契約 + TTL"| SK_AUTH_SNAP

%% ==========================================================================
%% VS2) ACCOUNT SLICE — 帳號主體切片
%% [Q8] WALLET 強一致事件走 CRITICAL_LANE
%%      WalletDeducted/WalletCredited → ACC_OUTBOX CRITICAL_LANE
%%      account-view.wallet-balance = STRONG_READ（回源 WALLET_AGG）
%% [P7] ACC_OUTBOX 補齊（沿用 v7）
%% ==========================================================================

subgraph VS2["🟩 VS2 · Account Slice（帳號主體）"]
    direction TB

    subgraph VS2_USER["👤 個人帳號域"]
        USER_AGG["user-account\n個人帳號 aggregate"]
        WALLET_AGG["account-user.wallet.aggregate\n強一致帳本 / 餘額不變量 #A1\n[Q8] STRONG_READ：回源此 AGG"]
        PROFILE["account-user.profile\n使用者資料 · FCM Token（弱一致）"]
    end

    subgraph VS2_ORG_ACC["🏢 組織帳號域"]
        ORG_ACC["organization-account\naggregate"]
        ORG_ACC_SETTINGS["organization-account.settings"]
        ORG_ACC_BINDING["organization-account.binding\nACL 防腐對接 #A2"]
    end

    subgraph VS2_GOV["🛡 帳號治理域"]
        ACC_ROLE["account-governance.role"]
        ACC_POLICY["account-governance.policy"]
    end

    subgraph VS2_EVENT["📢 Account Events + Outbox [P7][Q8]"]
        ACC_EVENT_BUS["account-event-bus\nAccountCreated\nRoleChanged / PolicyChanged\nWalletDeducted / WalletCredited [Q8]\n(in-process)"]
        ACC_OUTBOX["acc-outbox\nat-least-once 保證 [P7]\nWallet 事件 → CRITICAL_LANE [Q8]\nRole/Policy 事件 → CRITICAL_LANE\n其餘 → STANDARD_LANE"]
        ACC_EVENT_BUS -->|"pending events"| ACC_OUTBOX
    end

    USER_AGG --> WALLET_AGG
    USER_AGG -.->|弱一致| PROFILE
    ORG_ACC --> ORG_ACC_SETTINGS & ORG_ACC_BINDING
    ORG_ACC --> VS2_GOV
    ACC_ROLE --> ACC_EVENT_BUS
    ACC_POLICY --> ACC_EVENT_BUS
    WALLET_AGG -->|"WalletDeducted/Credited [Q8]"| ACC_EVENT_BUS
end

IDENTITY_LINK --> USER_AGG & ORG_ACC
ORG_ACC_BINDING -.->|"ACL / projection 防腐對接 #A2"| ORG_AGG
ACC_EVENT_BUS -.->|"事件契約 + idempotency-key [Q3]"| SK_ENV
ACC_OUTBOX -->|"CRITICAL_LANE: Role/Policy/Wallet [Q8]"| IER
ACC_OUTBOX -->|"STANDARD_LANE: AccountCreated 等"| IER

%% ==========================================================================
%% VS3) SKILL XP SLICE — 能力成長切片
%% [Q1] 補 SKILL_OUTBOX：OUTBOX 原則全面落地
%%      SKILL_AGG → SKILL_EVENTS(in-process) → SKILL_OUTBOX → IER
%% 不變量：#11 #12 #13
%% ==========================================================================

subgraph VS3["🟩 VS3 · Skill XP Slice（能力成長）"]
    direction TB

    subgraph VS3_DOMAIN["⚙ Skill Domain"]
        SKILL_AGG["account-skill.aggregate\naccountId / skillId(→tagSlug)\nxp / version"]
        XP_LEDGER[("account-skill-xp-ledger\nentryId / delta / reason\nsourceId / timestamp\n稽核帳本 #13")]
    end

    subgraph VS3_EVENT["📢 Skill Events + Outbox [Q1]"]
        SKILL_EVENTS["SkillXpAdded / SkillXpDeducted\n（含 tagSlug 語義）\n(in-process)"]
        SKILL_OUTBOX["skill-outbox [Q1]\nat-least-once 保證\nOUTBOX 原則全面落地\n→ IER STANDARD_LANE"]
        SKILL_EVENTS --> SKILL_OUTBOX
    end

    SKILL_AGG -->|"#13 任何 XP 異動必寫 Ledger"| XP_LEDGER
    SKILL_AGG --> SKILL_EVENTS
end

SKILL_AGG -.->|"skillId=tagSlug 唯讀引用"| TAG_READONLY
SKILL_EVENTS -.->|"事件契約 + idempotency-key [Q3]"| SK_ENV
SKILL_EVENTS -.->|"tier 推導契約"| SK_SKILL_TIER
SKILL_OUTBOX -->|"STANDARD_LANE [P1][Q1]"| IER

%% ==========================================================================
%% VS4) ORGANIZATION SLICE — 組織治理切片
%% [P2] ORG_EVENT_BUS 純 Producer-only（沿用 v7）
%% [P7] ORG_OUTBOX（沿用 v7）
%% ==========================================================================

subgraph VS4["🟧 VS4 · Organization Slice（組織治理）"]
    direction TB

    subgraph VS4_CORE["🏗 組織核心域"]
        ORG_AGG["organization-core.aggregate\n組織聚合實體"]
    end

    subgraph VS4_GOV["🛡 組織治理域"]
        ORG_MEMBER["account-organization.member\n內部成員 (tagSlug 唯讀)"]
        ORG_PARTNER["account-organization.partner\n外部夥伴 (tagSlug 唯讀)"]
        ORG_TEAM["account-organization.team\n團隊（組視圖）"]
        ORG_POLICY["account-organization.policy"]
        ORG_SKILL_RECOG["organization-skill-recognition.aggregate\nminXpRequired / status #11"]
    end

    subgraph VS4_TAG_VIEW["🏷 Tag 組織作用域視圖（唯讀 T2）"]
        SKILL_TAG_POOL[("職能標籤庫\nTag Authority 組織作用域快照\nTagLifecycleEvent 被動更新 T2\n[Q6] Max Staleness ≤ 30s")]
        TALENT_REPO[["人力資源池 Talent Repository #16\nMember + Partner + Team\n→ ORG_ELIGIBLE_MEMBER_VIEW"]]
    end

    subgraph VS4_EVENT["📢 Org Events + Outbox [P2][P7]"]
        ORG_EVENT_BUS["organization-core.event-bus\n【純 Producer-only P2】\nOrgContextProvisioned\nMemberJoined / MemberLeft\nSkillRecognitionGranted/Revoked\nPolicyChanged\n(in-process)"]
        ORG_OUTBOX["org-outbox [P7]\nat-least-once 保證"]
        ORG_EVENT_BUS -->|"pending events"| ORG_OUTBOX
    end

    ORG_AGG -->|"OrgContextProvisioned"| ORG_EVENT_BUS
    ORG_POLICY -->|"PolicyChanged"| ORG_EVENT_BUS
    ORG_MEMBER & ORG_PARTNER & ORG_TEAM --> TALENT_REPO
    ORG_SKILL_RECOG --> ORG_EVENT_BUS
    TALENT_REPO -.->|"人力來源"| SKILL_TAG_POOL
end

ORG_AGG -.->|"tagSlug 唯讀引用"| TAG_READONLY
ORG_MEMBER & ORG_PARTNER -.->|"tagSlug 唯讀引用"| TAG_READONLY
ORG_EVENT_BUS -.->|"事件契約 + idempotency-key [Q3]"| SK_ENV
ORG_OUTBOX -->|"CRITICAL_LANE: OrgContextProvisioned [P1]"| IER
ORG_OUTBOX -->|"STANDARD_LANE: MemberJoined/Left [P1]"| IER

%% ==========================================================================
%% VS5) WORKSPACE SLICE — 工作區業務切片
%% [Q5] 跨片稽核補全：新增 AUDIT_EVENT_COLLECTOR
%%      訂閱 IER BACKGROUND_LANE → 統一稽核日誌（不只 Workspace 內部）
%% [P4] policy-eligible-check via QGW（沿用 v7）
%% [E2][E5] ACL 防腐層 + WS_OUTBOX（沿用 v7）
%% ==========================================================================

subgraph VS5["🟣 VS5 · Workspace Slice（工作區業務）"]
    direction TB

    subgraph VS5_ACL["🔌 ACL 防腐層 [E2]"]
        ORG_CONTEXT_ACL["org-context.acl\n防腐層\nIER → OrgContextProvisioned\n→ Workspace 本地 Context #10"]
    end

    subgraph VS5_APP["⚙ Application Coordinator（#3）"]
        direction LR
        WS_CMD_HANDLER["command-handler\n指令處理器"]
        WS_SCOPE_GUARD["scope-guard #A9"]
        WS_POLICY_ENG["policy-engine"]
        WS_TX_RUNNER["transaction-runner\n#A8 1cmd/1agg"]
        WS_OUTBOX["ws-outbox\n唯一 IER 投遞來源 [E5]\nat-least-once 保證"]
    end

    subgraph VS5_CORE["⚙ Workspace Core Domain"]
        WS_AGG["workspace-core.aggregate"]
        WS_EVENT_BUS["workspace-core.event-bus\n【in-process only E5】"]
        WS_EVENT_STORE["workspace-core.event-store\n僅重播 / 稽核 #9"]
        WS_SETTINGS["workspace-core.settings"]
    end

    subgraph VS5_GOV["🛡 Workspace Governance [P4][Q5]"]
        WS_ROLE["workspace-governance.role\n繼承 org-governance.policy #18"]
        WS_POLICY_CHECK["policy-eligible-check [P4]\nvia Query Gateway\norg-eligible-member-view"]
        WS_AUDIT["workspace-governance.audit\ntrace-identifier 事件溯源"]
        AUDIT_COLLECTOR["audit-event-collector [Q5]\n訂閱 IER BACKGROUND_LANE\n跨片稽核事件匯集\n→ GLOBAL_AUDIT_VIEW"]
        WS_ROLE -.->|"#18 eligible 查詢"| WS_POLICY_CHECK
        WS_AUDIT -.->|"Workspace 內部稽核"| WS_EVENT_STORE
    end

    subgraph VS5_BIZ["⚙ Business Domain（A+B 雙軌）"]
        direction TB

        subgraph VS5_PARSE["📄 文件解析閉環"]
            W_FILES["workspace-business.files"]
            W_PARSER["document-parser"]
            PARSING_INTENT[("ParsingIntent\nDigital Twin\n#A4")]
        end

        WORKFLOW_AGG["workflow.aggregate\nAnomaly State Machine\n#A3"]

        subgraph VS5_A["🟢 A軌：主流程"]
            direction LR
            A_TASKS["tasks"]
            A_QA["quality-assurance"]
            A_ACCEPT["acceptance"]
            A_FINANCE["finance"]
        end

        subgraph VS5_B["🔴 B軌：異常處理"]
            B_ISSUES{{"issues"}}
        end

        W_B_DAILY["daily\n施工日誌"]
        W_B_SCHEDULE["schedule\n任務排程 (tagSlug T4)"]

        W_FILES -.->|原始檔案| W_PARSER
        W_PARSER -->|解析完成| PARSING_INTENT
        PARSING_INTENT -->|任務批次草稿| A_TASKS
        PARSING_INTENT -->|財務指令| A_FINANCE
        PARSING_INTENT -->|解析異常| B_ISSUES
        A_TASKS -.->|"SourcePointer #A4"| PARSING_INTENT
        PARSING_INTENT -.->|"IntentDeltaProposed #A4"| A_TASKS
        WORKFLOW_AGG -.->|stage-view| A_TASKS & A_QA & A_ACCEPT & A_FINANCE
        A_TASKS --> A_QA --> A_ACCEPT --> A_FINANCE
        WORKFLOW_AGG -->|"blockWorkflow #A3"| B_ISSUES
        A_TASKS -.-> W_B_DAILY
        A_TASKS -.->|任務分配變動| W_B_SCHEDULE
        PARSING_INTENT -.->|"職能需求 tagSlug T4"| W_B_SCHEDULE
    end

    ORG_CONTEXT_ACL -.->|"本地 Org Context"| VS5_APP
    B_ISSUES -->|IssueResolved| WS_EVENT_BUS
    WS_EVENT_BUS -.->|"issues:resolved 中介解鎖 #A3"| WORKFLOW_AGG
    WS_CMD_HANDLER --> WS_SCOPE_GUARD --> WS_POLICY_ENG --> WS_TX_RUNNER
    WS_TX_RUNNER -->|"#A8"| WS_AGG
    WS_TX_RUNNER -.->|執行業務邏輯| VS5_BIZ
    WS_TX_RUNNER -->|"pending events [E5]"| WS_OUTBOX
    WS_AGG --> WS_EVENT_STORE
    WS_AGG -->|"in-process [E5]"| WS_EVENT_BUS
end

IER -.->|"CRITICAL: OrgContextProvisioned [E2]"| ORG_CONTEXT_ACL
IER -.->|"BACKGROUND: 跨片稽核事件 [Q5]"| AUDIT_COLLECTOR
W_B_SCHEDULE -.->|"tagSlug T4"| TAG_READONLY
W_B_SCHEDULE -.->|"人力需求契約"| SK_SKILL_REQ
WS_EVENT_BUS -.->|"事件契約 + idempotency-key [Q3]"| SK_ENV
WS_OUTBOX -->|"STANDARD_LANE [E5]"| IER
WS_POLICY_CHECK -.->|"policy eligible-check [P4]"| QGWAY_SCHED

%% ==========================================================================
%% VS6) SCHEDULING SLICE — 排班協作切片
%% [P3][P7] SCHED_OUTBOX（沿用 v7）
%% [Q6] TAG_STALE_GUARD 校驗排班職能需求 tagSlug
%% ==========================================================================

subgraph VS6["🟨 VS6 · Scheduling Slice（排班協作）"]
    direction TB

    subgraph VS6_DOMAIN["⚙ Schedule Domain"]
        ORG_SCHEDULE["account-organization.schedule\nHR Scheduling\n(tagSlug T4)\n[Q6] 配對前經 TAG_STALE_GUARD 校驗"]
    end

    subgraph VS6_SAGA["⚙ Scheduling Saga（#A5）"]
        SCHEDULE_SAGA["scheduling-saga\nScheduleAssignRejected\nScheduleProposalCancelled"]
    end

    subgraph VS6_OUTBOX["📤 Schedule Outbox [P3][P7]"]
        SCHED_OUTBOX["sched-outbox\nat-least-once 保證"]
    end

    ORG_SCHEDULE -.->|"#14 只讀 eligible=true"| QGWAY_SCHED
    ORG_SCHEDULE -.->|"[Q6] tagSlug 新鮮度校驗"| TAG_STALE_GUARD
    ORG_SCHEDULE -->|"ScheduleAssigned"| SCHED_OUTBOX
    ORG_SCHEDULE -.->|"人力需求契約"| SK_SKILL_REQ
    ORG_SCHEDULE -.->|"tagSlug 唯讀引用"| TAG_READONLY
    SCHEDULE_SAGA -->|"#A5 compensating"| SCHED_OUTBOX
end

IER -.->|"ScheduleProposed #A5"| ORG_SCHEDULE
SCHED_OUTBOX -->|"STANDARD_LANE [P1][P3]"| IER

%% ==========================================================================
%% VS7) NOTIFICATION SLICE — 通知交付切片
%% [E3] 消費 IER STANDARD_LANE ScheduleAssigned
%% 不變量：#6 #A10
%% ==========================================================================

subgraph VS7["🩷 VS7 · Notification Slice（通知交付）"]
    direction TB

    subgraph VS7_ROUTE["⚙ Notification Router（無狀態 #A10）"]
        NOTIF_ROUTER["account-governance\n.notification-router\n消費 IER STANDARD_LANE\nScheduleAssigned [E3]"]
    end

    subgraph VS7_DELIVER["📤 Delivery"]
        USER_NOTIF["account-user.notification\n個人推播"]
        FCM[["Firebase Cloud Messaging"]]
        USER_DEVICE["使用者裝置"]
    end

    NOTIF_ROUTER -->|TargetAccountID 匹配| USER_NOTIF
    PROFILE -.->|"FCM Token（唯讀）"| USER_NOTIF
    USER_NOTIF -.->|"#6 投影"| QGWAY_NOTIF
    USER_NOTIF --> FCM --> USER_DEVICE
end

%% ==========================================================================
%% GW) 三閘道統一出入口（CQRS Gateway Layer）
%% [Q7] CBG_ENTRY 前置三層保護：RATE_LIMITER → CIRCUIT_BREAKER → BULKHEAD_ROUTER
%% [P1] IER 三道優先級分層（沿用 v7）
%% [P6] DLQ + DLQ_REPLAY（沿用 v7）
%% [Q4] CBG_AUTH 一致性規則：ACTIVE_CTX 與 Claims 衝突以 ACTIVE_CTX 為準
%%
%% ══ IER 完整路由規則表（v8 最終版）══
%%  CRITICAL_LANE（同步 SLA < 100ms）：
%%    RoleChanged/PolicyChanged     → CLAIMS_HANDLER         [E6]
%%    WalletDeducted/WalletCredited → FUNNEL CRITICAL_PROJ   [Q8]
%%    OrgContextProvisioned         → ORG_CONTEXT_ACL        [E2]
%%  STANDARD_LANE（非同步 SLA < 2s）：
%%    SkillXpAdded/Deducted         → FUNNEL CRITICAL_PROJ   [P2]
%%    ScheduleAssigned              → NOTIF_ROUTER + FUNNEL  [E3]
%%    ScheduleProposed              → ORG_SCHEDULE Saga      [A5]
%%    MemberJoined/Left             → FUNNEL                 [#16]
%%    All Domain Events             → FUNNEL                 [#9]
%%  BACKGROUND_LANE（低頻 SLA < 30s）：
%%    TagLifecycleEvent             → FUNNEL TAG_SNAPSHOT    [T1][Q2]
%%    AuditEvents（跨片稽核）        → AUDIT_COLLECTOR       [Q5]
%% ==========================================================================

subgraph GW["⚪ 三閘道統一出入口（CQRS Gateway Layer）"]
    direction TB

    subgraph GW_GUARD["🛡 入口前置保護層 [Q7]"]
        direction LR
        RATE_LIMITER["rate-limiter [Q7]\nper user / per org\n超限 → 429 + retry-after"]
        CIRCUIT_BREAKER["circuit-breaker [Q7]\n切片故障快速失敗\n半開狀態探針恢復"]
        BULKHEAD_ROUTER["bulkhead-router [Q7]\n切片隔板\nVS5 高負載不影響 VS3\n各切片獨立執行緒池"]
        RATE_LIMITER --> CIRCUIT_BREAKER --> BULKHEAD_ROUTER
    end

    subgraph GW_CMD["🔵 Command Bus Gateway（統一寫入入口）"]
        direction LR
        CBG_ENTRY["unified-command-gateway\nTraceID 注入 [E4]\n唯一入口"]
        CBG_AUTH["universal-authority-interceptor\nAuthoritySnapshot #A9\n[Q4] 衝突時以 ACTIVE_CTX 為準"]
        CBG_ROUTE["command-router\n路由至對應切片\n擴展：新切片只需註冊"]
        CBG_ENTRY --> CBG_AUTH --> CBG_ROUTE
        CBG_AUTH -.->|"高風險二次確認 #A9"| SKILL_AGG
        CBG_AUTH -.->|"高風險二次確認 #A9"| ORG_AGG
        WS_SCOPE_GUARD -.->|"高風險二次確認 #A9"| WS_AGG
    end

    subgraph GW_EVENT["🟠 Integration Event Router [P1][P6]"]
        direction TB
        IER[["integration-event-router\n統一事件出口 #9\n擴展：新訂閱只需加路由規則"]]

        subgraph IER_LANES["優先級三道分層 [P1]"]
            direction LR
            CRITICAL_LANE["🔴 CRITICAL_LANE\nSLA < 100ms\n同步快路徑"]
            STANDARD_LANE["🟡 STANDARD_LANE\nSLA < 2s\n非同步最終一致"]
            BACKGROUND_LANE["⚪ BACKGROUND_LANE\nSLA < 30s\n低頻可延遲"]
        end

        DLQ["💀 dead-letter-queue [P6]\n失敗 3 次後收容\n告警 → DOMAIN_ERRORS"]
        DLQ_REPLAY["dlq-replay-handler\n自動/手動重試\n攜帶原 idempotency-key [Q3]"]

        IER --> IER_LANES
        IER_LANES -.->|"投遞失敗 3 次"| DLQ
        DLQ --> DLQ_REPLAY
        DLQ_REPLAY -.->|"重新注入（保留 idempotency-key）"| IER
    end

    subgraph GW_QUERY["🟢 Query Gateway（統一讀取入口）"]
        direction TB
        QGWAY["read-model-registry\n統一讀取入口\n版本對照 / 快照路由"]
        QGWAY_SCHED["→ .org-eligible-member-view\n#14 #15 #16 [P4]"]
        QGWAY_NOTIF["→ .account-view\n#6 FCM Token"]
        QGWAY_SCOPE["→ .workspace-scope-guard-view\n#A9"]
        QGWAY_WALLET["→ .account-view.wallet-balance\n[Q8] STRONG_READ\n回源 WALLET_AGG"]
        QGWAY --> QGWAY_SCHED & QGWAY_NOTIF & QGWAY_SCOPE & QGWAY_WALLET
    end

    BULKHEAD_ROUTER --> CBG_ENTRY
    CBG_ROUTE -->|"Workspace Command"| WS_CMD_HANDLER
    CBG_ROUTE -->|"Skill Command"| SKILL_AGG
    CBG_ROUTE -->|"Org Command"| ORG_AGG
    CBG_ROUTE -->|"Account Command"| USER_AGG
    ACTIVE_CTX -->|"查詢鍵 [Q4]"| QGWAY_SCOPE
    QGWAY_SCOPE --> CBG_AUTH
end

SERVER_ACTIONS["_actions.ts\n所有切片 Server Action\n統一觸發入口"]
SERVER_ACTIONS --> RATE_LIMITER

IER -.->|"CRITICAL: RoleChanged/PolicyChanged [E6]"| CLAIMS_HANDLER
IER -.->|"STANDARD: ScheduleAssigned [E3]"| NOTIF_ROUTER
IER -.->|"CRITICAL: OrgContextProvisioned [E2]"| ORG_CONTEXT_ACL

%% ==========================================================================
%% VS8) PROJECTION BUS — 事件投影總線
%% [Q3] 所有 FUNNEL 消費方：upsert by idempotency-key（DLQ Replay 去重保護）
%% [Q5] 升格 GLOBAL_AUDIT_VIEW（跨片稽核日誌）
%% [Q8] wallet-balance → CRITICAL_PROJ_LANE + STRONG_READ 標示
%% [P5] FUNNEL 雙 Lane 分層（沿用 v7）
%% 不變量：#9 可完整重建；#A7 只做 compose
%% ==========================================================================

subgraph VS8["🟡 VS8 · Projection Bus（事件投影總線）"]
    direction TB

    subgraph VS8_FUNNEL["▶ Event Funnel [P5][Q3]"]
        direction LR
        FUNNEL[["event-funnel\n#9 唯一 Projection 寫入路徑\n[Q3] 所有消費方 upsert by idempotency-key\nMetrics 採集點 [E4]"]]
        CRITICAL_PROJ_LANE["🔴 CRITICAL_PROJ_LANE [P5]\nSLA < 500ms\n獨立重試 / dead-letter"]
        STANDARD_PROJ_LANE["⚪ STANDARD_PROJ_LANE [P5]\nSLA < 10s\n獨立重試 / dead-letter"]
        FUNNEL --> CRITICAL_PROJ_LANE & STANDARD_PROJ_LANE
    end

    subgraph VS8_META["⚙ Stream Version & Registry"]
        PROJ_VER["projection.version\n事件串流偏移量"]
        READ_REG["read-model-registry"]
    end

    subgraph VS8_CRITICAL_VIEWS["🔴 Critical Projections [P5][Q8]"]
        WS_SCOPE_VIEW["projection\n.workspace-scope-guard-view\n授權路徑 #A9"]
        ORG_ELIGIBLE_VIEW["projection\n.org-eligible-member-view\nskills{tagSlug→xp} / eligible\n[Q3] upsert by idempotency-key\n#14 #15 #16 T3"]
        WALLET_PROJ["projection\n.account-view.wallet-balance\n[Q8] CRITICAL_PROJ_LANE\n供一般餘額顯示\n精確交易 → STRONG_READ 回源 WALLET_AGG"]
        TIER_FN[["getTier(xp) → Tier\n純函式 #12"]]
    end

    subgraph VS8_STANDARD_VIEWS["⚪ Standard Projections [P5]"]
        direction LR

        subgraph VS8_WS_VIEWS["Workspace Views"]
            WORKSPACE_PROJ["projection.workspace-view"]
            ACC_SCHED_VIEW["projection.account-schedule"]
        end

        subgraph VS8_ACC_VIEWS["Account + Org Views"]
            ACC_PROJ_VIEW_NODE["projection.account-view\n[Q8] wallet-balance\nSTRONG_READ 標示"]
            ORG_PROJ_VIEW["projection.organization-view"]
        end

        subgraph VS8_SKILL_VIEW["Skill View"]
            SKILL_VIEW["projection.account-skill-view\naccountId / skillId / xp / tier\n[Q3] upsert by idempotency-key"]
        end

        subgraph VS8_AUDIT_VIEW["Global Audit View [Q5]"]
            GLOBAL_AUDIT_VIEW["projection.global-audit-view [Q5]\n跨片完整稽核日誌\n來源：AUDIT_COLLECTOR\n= Workspace 內部事件\n+ IER BACKGROUND_LANE 跨片事件"]
        end

        subgraph VS8_TAG_VIEW["Tag View（BACKGROUND T5）"]
            TAG_SNAPSHOT["projection.tag-snapshot\n[Q6] Max Staleness ≤ 30s\nDeprecated 觸發 StaleTagWarning\n消費方禁止寫入 T5"]
        end
    end

    IER ==>|"#9 唯一 Projection 寫入路徑"| FUNNEL
    CRITICAL_PROJ_LANE --> WS_SCOPE_VIEW & ORG_ELIGIBLE_VIEW & WALLET_PROJ
    STANDARD_PROJ_LANE --> WORKSPACE_PROJ & ACC_SCHED_VIEW
    STANDARD_PROJ_LANE --> ACC_PROJ_VIEW_NODE & ORG_PROJ_VIEW & SKILL_VIEW
    STANDARD_PROJ_LANE --> GLOBAL_AUDIT_VIEW & TAG_SNAPSHOT

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
WALLET_PROJ -.-> QGWAY_WALLET
AUDIT_COLLECTOR -.->|"跨片稽核事件"| GLOBAL_AUDIT_VIEW

%% ==========================================================================
%% VS9) OBSERVABILITY SLICE — 橫切面全域掛載
%% [Q7] 前置保護層 Metrics（Rate Limit hit / Circuit open / Bulkhead reject）
%% [P6] DLQ 告警接入 DOMAIN_ERRORS
%% [Q5] GLOBAL_AUDIT_VIEW 告警接入 DOMAIN_ERRORS
%% ==========================================================================

subgraph VS9["⬜ VS9 · Observability（橫切面全域掛載）"]
    direction LR
    TRACE_ID["trace-identifier\nTraceID 全域注入\n掛載：CBG_ENTRY [E4]"]
    DOMAIN_METRICS["domain-metrics\n掛載：IER 各 Lane\n+ FUNNEL 各 Lane\n+ RATE_LIMITER hit [Q7]\n+ CIRCUIT_BREAKER open [Q7]\nThroughput / Latency / ErrorRate"]
    DOMAIN_ERRORS["domain-error-log\n掛載：WS_TX_RUNNER\n+ SCHEDULE_SAGA\n+ DLQ 告警 [P6]\n+ StaleTagWarning [Q6]"]
end

CBG_ENTRY --> TRACE_ID
IER --> DOMAIN_METRICS
FUNNEL --> DOMAIN_METRICS
RATE_LIMITER -.->|"hit metrics [Q7]"| DOMAIN_METRICS
CIRCUIT_BREAKER -.->|"open/half-open [Q7]"| DOMAIN_METRICS
WS_TX_RUNNER --> DOMAIN_ERRORS
SCHEDULE_SAGA --> DOMAIN_ERRORS
DLQ -.->|"DLQ size 告警 [P6]"| DOMAIN_ERRORS
TAG_STALE_GUARD -.->|"StaleTagWarning [Q6]"| DOMAIN_ERRORS

%% ==========================================================================
%% 完整不變量索引 + 新增 v8 開發守則
%% ==========================================================================
%% ── CONSISTENCY INVARIANTS ──
%% #1  每個 BC 只能修改自己的 Aggregate，禁止跨 BC 直接寫入
%% #2  跨 BC 僅能透過 Event/Projection/ACL 溝通
%% #3  Application Layer 只協調流程，不承載領域規則
%% #4  Domain Event 僅由 Aggregate 產生；Transaction Runner 只投遞 Outbox
%% #5  Custom Claims 只做快照，非真實權限來源
%% #6  Notification 只讀 Projection
%% #7  Scope Guard 僅讀本 Context Read Model
%% #8  Shared Kernel 必須顯式標示
%% #9  Projection 必須可由事件完整重建
%% #10 任一模組若需外部 Context 內部狀態 = 邊界設計錯誤
%% #11 XP 屬 Account BC；Organization 只設門檻
%% #12 Tier 永遠是推導值，不存 DB
%% #13 XP 任何異動必須寫 Ledger
%% #14 Schedule 只讀 ORG_ELIGIBLE_MEMBER_VIEW
%% #15 eligible 生命週期：joined→true · assigned→false · completed/cancelled→true
%% #16 Talent Repository = member + partner + team
%% #17 centralized-tag.aggregate 為 tagSlug 唯一真相
%% #18 workspace-governance role 繼承 policy 硬約束
%% ── ATOMICITY AUDIT ──
%% #A1  wallet 強一致；profile/notification 弱一致
%% #A2  org-account.binding 只 ACL/projection 防腐對接
%% #A3  blockWorkflow → issues:resolved 中介解鎖（禁 B→A 直寫）
%% #A4  ParsingIntent 只允許提議事件
%% #A5  schedule 跨 BC saga/compensating event
%% #A6  CENTRALIZED_TAG_AGGREGATE 唯一語義權威
%% #A7  Event Funnel 只做 compose
%% #A8  Transaction Runner 1cmd/1agg 原子提交
%% #A9  Scope Guard 快路徑；高風險回源 aggregate
%% #A10 Notification Router 無狀態路由
%% #A11 eligible = 「無衝突排班」快照，非靜態狀態
%% ── TAG AUTHORITY ──
%% T1  新切片訂閱 TagLifecycleEvent（BACKGROUND_LANE）即可擴展
%% T2  SKILL_TAG_POOL = Tag Authority 組織作用域唯讀投影
%% T3  ORG_ELIGIBLE_MEMBER_VIEW.skills{tagSlug→xp} 交叉快照
%% T4  排班職能需求標籤 = SK_SKILL_REQ × Tag Authority tagSlug
%% T5  TAG_SNAPSHOT 消費方禁止寫入
%% ── v6 邊界修正 ──
%% E1  SKILL_EVENTS → IER（不再直注入 ORG_EVENT_BUS）
%% E2  OrgContextProvisioned → IER → VS5 ACL 防腐層
%% E3  ScheduleAssigned → IER → NOTIF_ROUTER
%% E4  Observability CBG_ENTRY + IER + FUNNEL 全域掛載
%% E5  WS_OUTBOX 為 VS5 唯一 IER 投遞來源
%% E6  Claims 刷新單一觸發點：CLAIMS_HANDLER
%% ── v7 深層效率修正 ──
%% P1  IER 三道優先級分層 CRITICAL/STANDARD/BACKGROUND
%% P2  ORG_EVENT_BUS 純 Producer-only；SkillXp 直路由 FUNNEL
%% P3  VS6 補 SCHED_OUTBOX
%% P4  WS_ROLE eligible-check → policy-eligible-check via QGW
%% P5  FUNNEL 雙 Lane + 獨立 dead-letter
%% P6  DLQ 統一失敗回補
%% P7  OUTBOX 全面補齊 VS2/VS4/VS6
%% ── v8 開發基礎現代化 ──
%% Q1  VS3 補 SKILL_OUTBOX（OUTBOX 原則完整落地，所有切片統一）
%% Q2  VS0 補 TAG_OUTBOX（Tag Authority 自身 at-least-once 保證）
%% Q3  event-envelope 加 idempotency-key；FUNNEL upsert by key（DLQ Replay 去重）
%% Q4  ACTIVE_CTX TTL + CONTEXT_LIFECYCLE_MANAGER；衝突以 ACTIVE_CTX 為準
%% Q5  AUDIT_EVENT_COLLECTOR 訂閱 IER BACKGROUND_LANE → GLOBAL_AUDIT_VIEW（跨片稽核）
%% Q6  TAG_STALE_GUARD Max Staleness ≤ 30s；Deprecated → StaleTagWarning
%% Q7  CBG 前置三層保護：RATE_LIMITER → CIRCUIT_BREAKER → BULKHEAD_ROUTER
%% Q8  WALLET 事件走 CRITICAL_LANE；wallet-balance STRONG_READ 回源 WALLET_AGG
%% ==========================================================================
%% ── v8 統一開發守則（開發者落地規範）──
%% D1  所有切片 Aggregate 事件輸出路徑：
%%     Aggregate → EventBus(in-process) → OUTBOX → IER（禁止任何直連）
%% D2  所有 event-envelope 必須包含 idempotency-key；
%%     所有 FUNNEL 消費方必須 upsert by idempotency-key
%% D3  IER 路由新增規則前，必須在 GW 區段路由規則表同步更新
%% D4  新切片上線 checklist：
%%     □ 在 SK_CONTRACTS 聲明跨切片型別
%%     □ 實作 OUTBOX（不允許 EventBus 直連 IER）
%%     □ 在 CBG_ROUTE 註冊 Command 路由
%%     □ 在 IER 路由規則表登記事件訂閱
%%     □ 在 QGWAY 註冊 Read Model
%%     □ 掛載 VS9 Observability（TraceID 繼承 CBG_ENTRY）
%% D5  所有讀取 wallet-balance 必須先判斷精確度需求：
%%     顯示用 → QGWAY_WALLET（projection）
%%     交易用 → STRONG_READ 回源 WALLET_AGG
%% D6  排班/技能配對前必須呼叫 TAG_STALE_GUARD 校驗 tagSlug 新鮮度
%% D7  ACTIVE_CTX TTL 必須與 Firebase Token 有效期同步；
%%     OrgSwitched/WorkspaceSwitched 必須觸發 CTX_LIFECYCLE 重建
%% D8  DLQ Replay 重注入時必須攜帶原始 idempotency-key，不得重新生成
%% ==========================================================================

%% ==========================================================================
%% STYLES
%% ==========================================================================
classDef sk fill:#ecfeff,stroke:#22d3ee,color:#000,font-weight:bold
classDef tagAuth fill:#cffafe,stroke:#0891b2,color:#000,font-weight:bold
classDef identity fill:#dbeafe,stroke:#93c5fd,color:#000
classDef ctxNode fill:#eff6ff,stroke:#1d4ed8,color:#000,font-weight:bold
classDef claimsNode fill:#dbeafe,stroke:#1d4ed8,color:#000,font-weight:bold
classDef account fill:#dcfce7,stroke:#86efac,color:#000
classDef outboxNode fill:#fef3c7,stroke:#d97706,color:#000,font-weight:bold
classDef skillSlice fill:#bbf7d0,stroke:#22c55e,color:#000
classDef orgSlice fill:#fff7ed,stroke:#fdba74,color:#000
classDef wsSlice fill:#ede9fe,stroke:#c4b5fd,color:#000
classDef wsAcl fill:#f5f3ff,stroke:#7c3aed,color:#000,stroke-dasharray:4 2
classDef schedSlice fill:#fef9c3,stroke:#ca8a04,color:#000
classDef notifSlice fill:#fce7f3,stroke:#db2777,color:#000
classDef projCritical fill:#fee2e2,stroke:#dc2626,color:#000,font-weight:bold
classDef projStandard fill:#fef9c3,stroke:#d97706,color:#000
classDef auditView fill:#f0fdf4,stroke:#15803d,color:#000,font-weight:bold
classDef tagProjSlice fill:#e0f2fe,stroke:#0284c7,color:#000
classDef walletProj fill:#fdf4ff,stroke:#9333ea,color:#000,font-weight:bold
classDef gateway fill:#f8fafc,stroke:#334155,color:#000,font-weight:bold
classDef guardLayer fill:#fff1f2,stroke:#e11d48,color:#000,font-weight:bold
classDef cmdGw fill:#eff6ff,stroke:#2563eb,color:#000
classDef eventGw fill:#fff7ed,stroke:#ea580c,color:#000
classDef criticalLane fill:#fee2e2,stroke:#dc2626,color:#000,font-weight:bold
classDef standardLane fill:#fef9c3,stroke:#ca8a04,color:#000
classDef backgroundLane fill:#f1f5f9,stroke:#64748b,color:#000
classDef dlqNode fill:#fca5a5,stroke:#b91c1c,color:#000,font-weight:bold
classDef queryGw fill:#f0fdf4,stroke:#15803d,color:#000
classDef staleGuard fill:#fef3c7,stroke:#b45309,color:#000,font-weight:bold
classDef observability fill:#f1f5f9,stroke:#64748b,color:#000
classDef trackA fill:#d1fae5,stroke:#059669,color:#000
classDef trackB fill:#fee2e2,stroke:#dc2626,color:#000
classDef tierFn fill:#fdf4ff,stroke:#9333ea,color:#000
classDef talent fill:#fff1f2,stroke:#f43f5e,color:#000
classDef serverAction fill:#fed7aa,stroke:#f97316,color:#000

class SK,SK_ENV,SK_AUTH_SNAP,SK_SKILL_TIER,SK_SKILL_REQ sk
class CTA,TAG_EVENTS,TAG_READONLY tagAuth
class TAG_OUTBOX outboxNode
class TAG_STALE_GUARD staleGuard
class VS1,FIREBASE_AUTH,AUTH_IDENTITY,IDENTITY_LINK identity
class ACTIVE_CTX,CTX_LIFECYCLE ctxNode
class CLAIMS_HANDLER,CUSTOM_CLAIMS claimsNode
class VS2,USER_AGG,WALLET_AGG,PROFILE,ORG_ACC,ORG_ACC_SETTINGS,ORG_ACC_BINDING,ACC_ROLE,ACC_POLICY,ACC_EVENT_BUS account
class ACC_OUTBOX,ORG_OUTBOX,SCHED_OUTBOX,WS_OUTBOX,SKILL_OUTBOX outboxNode
class VS3,SKILL_AGG,XP_LEDGER,SKILL_EVENTS skillSlice
class VS4,ORG_AGG,ORG_MEMBER,ORG_PARTNER,ORG_TEAM,ORG_POLICY,ORG_SKILL_RECOG,SKILL_TAG_POOL,ORG_EVENT_BUS orgSlice
class TALENT_REPO talent
class VS5,WS_CMD_HANDLER,WS_SCOPE_GUARD,WS_POLICY_ENG,WS_TX_RUNNER,WS_AGG,WS_EVENT_BUS,WS_EVENT_STORE,WS_SETTINGS,WS_ROLE,WS_POLICY_CHECK,WS_AUDIT wsSlice
class ORG_CONTEXT_ACL wsAcl
class AUDIT_COLLECTOR auditView
class A_TASKS,A_QA,A_ACCEPT,A_FINANCE trackA
class B_ISSUES,W_B_DAILY,W_B_SCHEDULE wsSlice
class VS6,ORG_SCHEDULE,SCHEDULE_SAGA,SCHED_OUTBOX schedSlice
class VS7,NOTIF_ROUTER,USER_NOTIF,FCM,USER_DEVICE notifSlice
class GW gateway
class GW_GUARD,RATE_LIMITER,CIRCUIT_BREAKER,BULKHEAD_ROUTER guardLayer
class CBG_ENTRY,CBG_AUTH,CBG_ROUTE cmdGw
class IER,IER_LANES eventGw
class CRITICAL_LANE criticalLane
class STANDARD_LANE standardLane
class BACKGROUND_LANE backgroundLane
class DLQ,DLQ_REPLAY dlqNode
class QGWAY,QGWAY_SCHED,QGWAY_NOTIF,QGWAY_SCOPE,QGWAY_WALLET queryGw
class VS8,FUNNEL,PROJ_VER,READ_REG,CRITICAL_PROJ_LANE projCritical
class STANDARD_PROJ_LANE,WORKSPACE_PROJ,ACC_SCHED_VIEW,ACC_PROJ_VIEW_NODE,ORG_PROJ_VIEW,SKILL_VIEW projStandard
class WS_SCOPE_VIEW,ORG_ELIGIBLE_VIEW projCritical
class WALLET_PROJ walletProj
class GLOBAL_AUDIT_VIEW auditView
class TAG_SNAPSHOT tagProjSlice
class TIER_FN tierFn
class VS9,TRACE_ID,DOMAIN_METRICS,DOMAIN_ERRORS observability
class SERVER_ACTIONS serverAction
