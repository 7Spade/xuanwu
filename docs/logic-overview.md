flowchart TD

%% ==========================================================================
%% VS0) SHARED KERNEL + TAG AUTHORITY CENTER
%% v10 主變更：S1~S6 六個跨切片模式下沉為顯式契約
%% 原有契約：SK_ENV / SK_AUTH_SNAP / SK_SKILL_TIER / SK_SKILL_REQ / SK_CMD_RESULT 沿用
%% ==========================================================================

subgraph SK["🔷 VS0 · Shared Kernel + Tag Authority Center"]
    direction TB

    subgraph SK_FOUNDATION["📄 基礎資料契約 #8（沿用 v9）"]
        direction LR
        SK_ENV["event-envelope\nversion · traceId · timestamp\nidempotency-key\n= eventId+aggId+version\n所有 DomainEvent 必須遵循\n[R8] traceId 整鏈共享不覆蓋"]
        SK_AUTH_SNAP["authority-snapshot\nclaims / roles / scopes\nTTL = Token 有效期"]
        SK_SKILL_TIER["skill-tier\ngetTier(xp)→Tier\n純函式・永不存 DB #12"]
        SK_SKILL_REQ["skill-requirement\ntagSlug × minXp\n跨片人力需求契約"]
        SK_CMD_RESULT["command-result-contract\nCommandSuccess { aggregateId, version }\nCommandFailure { DomainError }\n前端樂觀更新依據"]
    end

    subgraph SK_INFRA_CONTRACTS["⚙ 基礎設施行為契約 #8 【v10 S1~S5 新增】"]
        direction TB

        SK_OUTBOX_CONTRACT["📦 SK_OUTBOX_CONTRACT [S1]\n━━━━━━━━━━━━━━━━━━━━━━━\n所有 OUTBOX 必須遵守的三要素：\n① at-least-once\n   EventBus(in-process) → OUTBOX\n   → RELAY → IER\n② idempotency-key 必帶\n   格式：eventId + aggId + version\n③ DLQ 分級宣告（每個 OUTBOX 必填）\n   SAFE_AUTO     : 冪等事件，自動重試\n   REVIEW_REQUIRED: 金融/排班/角色，人工審\n   SECURITY_BLOCK : 安全事件，凍結+告警\n━━━━━━━━━━━━━━━━━━━━━━━\n新切片加 OUTBOX：引用此契約即可\n不得自行重新定義 at-least-once 語義"]

        SK_VERSION_GUARD["🔢 SK_VERSION_GUARD [S2]\n━━━━━━━━━━━━━━━━━━━━━━━\n所有 Projection 寫入必須遵守：\nevent.aggregateVersion\n  > view.lastProcessedVersion\n  → 允許更新\n  否則 → 丟棄（過期事件不覆蓋）\n━━━━━━━━━━━━━━━━━━━━━━━\n不變量 #19 泛化：\n適用全部 Projection，非僅 eligible-view\nFUNNEL compose 時統一引用此規則"]

        SK_READ_CONSISTENCY["📖 SK_READ_CONSISTENCY [S3]\n━━━━━━━━━━━━━━━━━━━━━━━\nSTRONG_READ\n  → Domain Aggregate 回源\n  適用：金融交易・安全操作・不可逆\n  特性：強一致，有延遲成本\nEVENTUAL_READ\n  → Projection 讀取\n  適用：顯示・統計・列表\n  特性：高效，允許短暫落後\n━━━━━━━━━━━━━━━━━━━━━━━\n決策規則：\n涉及餘額/授權/排班衝突 → STRONG_READ\n其餘顯示場景 → EVENTUAL_READ"]

        SK_STALENESS_CONTRACT["⏱ SK_STALENESS_CONTRACT [S4]\n━━━━━━━━━━━━━━━━━━━━━━━\n全系統 Staleness SLA 常數（單一真相）：\nTAG_MAX_STALENESS     ≤ 30s\n  tag 派生資料（SKILL_TAG_POOL / TAG_SNAPSHOT）\nPROJ_STALE_CRITICAL   ≤ 500ms\n  授權/排班 Projection\n  （WS_SCOPE_VIEW / ORG_ELIGIBLE_VIEW）\nPROJ_STALE_STANDARD   ≤ 10s\n  一般 Projection\n━━━━━━━━━━━━━━━━━━━━━━━\n各消費方節點標 [SK_STALENESS_CONTRACT]\n不得自行硬寫數值"]

        SK_RESILIENCE_CONTRACT["🛡 SK_RESILIENCE_CONTRACT [S5]\n━━━━━━━━━━━━━━━━━━━━━━━\n所有外部觸發入口的最低防護規格：\nR1 rate-limit\n   per user ∪ per org\n   超限 → 429 + retry-after header\nR2 circuit-break\n   連續 5xx → 熔斷\n   半開探針 → 漸進恢復\nR3 bulkhead\n   切片隔板・獨立執行緒池\n   故障不跨切片傳播\n━━━━━━━━━━━━━━━━━━━━━━━\n適用範圍：\n_actions.ts / Webhook / Edge Function\n所有觸達 CBG_ENTRY 之前的路徑"]
    end

    subgraph SK_AUTH_CONTRACTS["🔐 授權信號契約 #8 【v10 S6 新增】"]
        direction TB
        SK_TOKEN_REFRESH_CONTRACT["🔄 SK_TOKEN_REFRESH_CONTRACT [S6]\n━━━━━━━━━━━━━━━━━━━━━━━\nClaims 刷新三方握手協議\n（VS1 ↔ IER ↔ 前端）\n──────────────────────\n觸發條件：\n  RoleChanged | PolicyChanged\n  → IER CRITICAL_LANE → CLAIMS_HANDLER\n完成信號：\n  TOKEN_REFRESH_SIGNAL\n  （Claims 設定完成後發出）\n客端義務：\n  收到信號 → 強制重取 Firebase Token\n  下次 Request 帶新 Claims\n失敗處理：\n  ClaimsRefresh 失敗\n  → DLQ SECURITY_BLOCK\n  → DOMAIN_ERRORS 安全告警\n━━━━━━━━━━━━━━━━━━━━━━━\n三方共享此唯一握手規範"]
    end

    subgraph SK_TAG_AUTH["🏷 Tag Authority Center · 唯一權威 #A6 #17"]
        direction LR
        CTA["centralized-tag.aggregate\n【全域語義字典主數據】\ntagSlug / label / category\ndeprecatedAt / deleteRule"]
        TAG_EVENTS["TagLifecycleEvent\n(in-process)"]
        TAG_OUTBOX["tag-outbox\n[SK_OUTBOX_CONTRACT: SAFE_AUTO]"]
        TAG_READONLY["🔒 唯讀引用規則\nT1：新切片訂閱事件即可擴展"]
        TAG_STALE_GUARD["⚠ TAG_STALE_GUARD\n[SK_STALENESS_CONTRACT]\nTAG_MAX_STALENESS ≤ 30s\nDeprecated → StaleTagWarning"]

        CTA -->|"標籤異動廣播"| TAG_EVENTS
        TAG_EVENTS -->|pending| TAG_OUTBOX
        CTA -.->|"唯讀引用契約"| TAG_READONLY
        CTA -.->|"Deprecated 通知"| TAG_STALE_GUARD
    end
end

TAG_OUTBOX -->|"BACKGROUND_LANE"| IER

%% ==========================================================================
%% VS1) IDENTITY SLICE — 身份驗證切片
%% [S6] TOKEN_REFRESH_SIGNAL 精簡：行為語義移至 SK_TOKEN_REFRESH_CONTRACT
%%      VS1 只保留「發信號」的動作，三方握手規則在 VS0 查閱
%% ==========================================================================

subgraph VS1["🟦 VS1 · Identity Slice（身份驗證）"]
    direction TB

    subgraph VS1_IN["▶ External Trigger"]
        FIREBASE_AUTH["Firebase Authentication\n登入 / 註冊 / 重設密碼"]
    end

    subgraph VS1_DOMAIN["⚙ Identity Domain"]
        AUTH_IDENTITY["authenticated-identity\n已驗證身份主體"]
        IDENTITY_LINK["account-identity-link\nfirebaseUserId ↔ accountId"]

        subgraph VS1_CTX["⚙ Context Lifecycle"]
            ACTIVE_CTX["active-account-context\nTTL = Token 有效期"]
            CTX_LIFECYCLE["context-lifecycle-manager\n建立：Login\n刷新：OrgSwitched / WorkspaceSwitched\n失效：TokenExpired / Logout"]
            CTX_LIFECYCLE -->|"建立/刷新/失效"| ACTIVE_CTX
        end
    end

    subgraph VS1_CLAIMS["📤 Claims Management [S6]"]
        CLAIMS_HANDLER["claims-refresh-handler\n單一刷新觸發點 [E6]\n握手規範 → [SK_TOKEN_REFRESH_CONTRACT]"]
        CUSTOM_CLAIMS["custom-claims\n快照聲明 #5\nTTL = Token 有效期"]
        TOKEN_REFRESH_SIGNAL["token-refresh-signal\nClaims 設定完成後發出\n完整握手規範見\n[SK_TOKEN_REFRESH_CONTRACT S6]"]
        CLAIMS_HANDLER --> CUSTOM_CLAIMS
        CLAIMS_HANDLER -->|"Claims 設定完成"| TOKEN_REFRESH_SIGNAL
    end

    FIREBASE_AUTH --> AUTH_IDENTITY
    AUTH_IDENTITY --> IDENTITY_LINK
    IDENTITY_LINK --> CTX_LIFECYCLE
    AUTH_IDENTITY -->|"登入觸發"| CLAIMS_HANDLER
end

CUSTOM_CLAIMS -.->|"快照契約 + TTL"| SK_AUTH_SNAP

%% ==========================================================================
%% VS2) ACCOUNT SLICE — 帳號主體切片
%% [S1] ACC_OUTBOX 精簡：at-least-once 語義移至 SK_OUTBOX_CONTRACT
%%      節點只宣告 DLQ 分級（引用契約即可）
%% [S3] WALLET_AGG 標示 STRONG_READ 引用 SK_READ_CONSISTENCY
%% ==========================================================================

subgraph VS2["🟩 VS2 · Account Slice（帳號主體）"]
    direction TB

    subgraph VS2_USER["👤 個人帳號域"]
        USER_AGG["user-account\naggregate"]
        WALLET_AGG["account-user.wallet.aggregate\n強一致帳本 / 餘額不變量 #A1\n[SK_READ_CONSISTENCY: STRONG_READ]\n精確交易 → 回源此 AGG"]
        PROFILE["account-user.profile\nFCM Token（弱一致）"]
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

    subgraph VS2_EVENT["📢 Account Events + Outbox [S1]"]
        ACC_EVENT_BUS["account-event-bus\nAccountCreated\nRoleChanged / PolicyChanged\nWalletDeducted / WalletCredited\n(in-process)"]
        ACC_OUTBOX["acc-outbox\n[SK_OUTBOX_CONTRACT S1]\n─────────────────\nDLQ 分級宣告：\nRoleChanged/PolicyChanged\n  → SECURITY_BLOCK\nWalletDeducted\n  → REVIEW_REQUIRED\nAccountCreated\n  → SAFE_AUTO\n─────────────────\nLane：Wallet/Role/Policy → CRITICAL\n其餘 → STANDARD"]
        ACC_EVENT_BUS -->|pending| ACC_OUTBOX
    end

    USER_AGG --> WALLET_AGG
    USER_AGG -.->|弱一致| PROFILE
    ORG_ACC --> ORG_ACC_SETTINGS & ORG_ACC_BINDING
    ORG_ACC --> VS2_GOV
    ACC_ROLE --> ACC_EVENT_BUS
    ACC_POLICY --> ACC_EVENT_BUS
    WALLET_AGG -->|"WalletDeducted/Credited"| ACC_EVENT_BUS
end

IDENTITY_LINK --> USER_AGG & ORG_ACC
ORG_ACC_BINDING -.->|"ACL #A2"| ORG_AGG
ACC_EVENT_BUS -.->|"事件契約"| SK_ENV
ACC_OUTBOX -->|"CRITICAL_LANE: Role/Policy/Wallet"| IER
ACC_OUTBOX -->|"STANDARD_LANE: AccountCreated"| IER

%% ==========================================================================
%% VS3) SKILL XP SLICE — 能力成長切片
%% [S1] SKILL_OUTBOX 精簡：引用 SK_OUTBOX_CONTRACT
%% #11 #12 #13 不變量沿用
%% ==========================================================================

subgraph VS3["🟩 VS3 · Skill XP Slice（能力成長）"]
    direction TB

    subgraph VS3_DOMAIN["⚙ Skill Domain"]
        SKILL_AGG["account-skill.aggregate\naccountId / skillId(→tagSlug)\nxp / version"]
        XP_LEDGER[("account-skill-xp-ledger\nentryId / delta / reason\nsourceId / timestamp #13")]
    end

    subgraph VS3_EVENT["📢 Skill Events + Outbox [S1]"]
        SKILL_EVENTS["SkillXpAdded / SkillXpDeducted\n（含 tagSlug 語義・含 aggregateVersion）\n(in-process)"]
        SKILL_OUTBOX["skill-outbox\n[SK_OUTBOX_CONTRACT S1]\nDLQ：SAFE_AUTO\n→ IER STANDARD_LANE"]
        SKILL_EVENTS --> SKILL_OUTBOX
    end

    SKILL_AGG -->|"#13 異動必寫 Ledger"| XP_LEDGER
    SKILL_AGG --> SKILL_EVENTS
end

SKILL_AGG -.->|"tagSlug 唯讀引用"| TAG_READONLY
SKILL_EVENTS -.->|"事件契約"| SK_ENV
SKILL_EVENTS -.->|"tier 推導契約"| SK_SKILL_TIER
SKILL_OUTBOX -->|"STANDARD_LANE"| IER

%% ==========================================================================
%% VS4) ORGANIZATION SLICE — 組織治理切片
%% [S1] ORG_OUTBOX 精簡：引用 SK_OUTBOX_CONTRACT
%% [S4] SKILL_TAG_POOL 精簡：Max Staleness 改為引用 SK_STALENESS_CONTRACT
%% ==========================================================================

subgraph VS4["🟧 VS4 · Organization Slice（組織治理）"]
    direction TB

    subgraph VS4_CORE["🏗 組織核心域"]
        ORG_AGG["organization-core.aggregate"]
    end

    subgraph VS4_GOV["🛡 組織治理域"]
        ORG_MEMBER["account-organization.member\n(tagSlug 唯讀)"]
        ORG_PARTNER["account-organization.partner\n(tagSlug 唯讀)"]
        ORG_TEAM["account-organization.team"]
        ORG_POLICY["account-organization.policy"]
        ORG_SKILL_RECOG["organization-skill-recognition.aggregate\nminXpRequired / status #11"]
    end

    subgraph VS4_TAG_VIEW["🏷 Tag 組織作用域 [S4]"]
        VS4_TAG_SUBSCRIBER["tag-lifecycle-subscriber\n訂閱 IER BACKGROUND_LANE\n責任：更新本地 SKILL_TAG_POOL"]
        SKILL_TAG_POOL[("職能標籤庫\nTag Authority 組織作用域快照\n[SK_STALENESS_CONTRACT: TAG_MAX_STALENESS]\n由 VS4_TAG_SUBSCRIBER 更新")]
        TALENT_REPO[["人力資源池 #16\nMember + Partner + Team\n→ ORG_ELIGIBLE_MEMBER_VIEW"]]
        VS4_TAG_SUBSCRIBER -->|"TagLifecycleEvent 更新"| SKILL_TAG_POOL
    end

    subgraph VS4_EVENT["📢 Org Events + Outbox [S1]"]
        ORG_EVENT_BUS["organization-core.event-bus\n【純 Producer-only P2】\nOrgContextProvisioned\nMemberJoined / MemberLeft\nSkillRecognitionGranted/Revoked\nPolicyChanged\n(in-process)"]
        ORG_OUTBOX["org-outbox\n[SK_OUTBOX_CONTRACT S1]\n─────────────────\nDLQ 分級宣告：\nOrgContextProvisioned\n  → REVIEW_REQUIRED\nMemberJoined/Left\n  → SAFE_AUTO\nSkillRecognitionGranted/Revoked\n  → REVIEW_REQUIRED\nPolicyChanged\n  → SECURITY_BLOCK"]
        ORG_EVENT_BUS -->|pending| ORG_OUTBOX
    end

    ORG_AGG --> ORG_EVENT_BUS
    ORG_POLICY --> ORG_EVENT_BUS
    ORG_MEMBER & ORG_PARTNER & ORG_TEAM --> TALENT_REPO
    ORG_SKILL_RECOG --> ORG_EVENT_BUS
    TALENT_REPO -.->|人力來源| SKILL_TAG_POOL
end

ORG_AGG & ORG_MEMBER & ORG_PARTNER -.->|"tagSlug 唯讀引用"| TAG_READONLY
ORG_EVENT_BUS -.->|"事件契約"| SK_ENV
ORG_OUTBOX -->|"CRITICAL_LANE: OrgContextProvisioned・PolicyChanged"| IER
ORG_OUTBOX -->|"STANDARD_LANE: MemberJoined/Left・SkillRecog"| IER
IER -.->|"BACKGROUND_LANE: TagLifecycleEvent"| VS4_TAG_SUBSCRIBER

%% ==========================================================================
%% VS5) WORKSPACE SLICE — 工作區業務切片
%% [S1] WS_OUTBOX 精簡：引用 SK_OUTBOX_CONTRACT
%% E2/E5/P4/Q5/R4/R6 沿用 v9
%% ==========================================================================

subgraph VS5["🟣 VS5 · Workspace Slice（工作區業務）"]
    direction TB

    subgraph VS5_ACL["🔌 ACL 防腐層 [E2]"]
        ORG_CONTEXT_ACL["org-context.acl\nIER → OrgContextProvisioned\n→ Workspace 本地 Context #10"]
    end

    subgraph VS5_APP["⚙ Application Coordinator（#3）"]
        direction LR
        WS_CMD_HANDLER["command-handler\n執行完成 → SK_CMD_RESULT"]
        WS_SCOPE_GUARD["scope-guard #A9"]
        WS_POLICY_ENG["policy-engine"]
        WS_TX_RUNNER["transaction-runner\n#A8 1cmd/1agg"]
        WS_OUTBOX["ws-outbox\n[SK_OUTBOX_CONTRACT S1]\nDLQ：SAFE_AUTO（業務事件冪等）\n唯一 IER 投遞來源 [E5]"]
    end

    subgraph VS5_CORE["⚙ Workspace Core Domain"]
        WS_AGG["workspace-core.aggregate"]
        WS_EVENT_BUS["workspace-core.event-bus\n【in-process only E5】"]
        WS_EVENT_STORE["workspace-core.event-store\n僅重播/稽核 #9"]
        WS_SETTINGS["workspace-core.settings"]
    end

    subgraph VS5_GOV["🛡 Workspace Governance"]
        WS_ROLE["workspace-governance.role\n繼承 org-governance.policy #18"]
        WS_POLICY_CHECK["policy-eligible-check [P4]\nvia Query Gateway"]
        WS_AUDIT["workspace-governance.audit"]
        AUDIT_COLLECTOR["audit-event-collector\n訂閱 IER BACKGROUND_LANE\n→ GLOBAL_AUDIT_VIEW"]
        WS_ROLE -.->|"#18 eligible 查詢"| WS_POLICY_CHECK
    end

    subgraph VS5_BIZ["⚙ Business Domain（A+B 雙軌）"]
        direction TB

        subgraph VS5_PARSE["📄 文件解析閉環"]
            W_FILES["workspace-business.files"]
            W_PARSER["document-parser"]
            PARSING_INTENT[("ParsingIntent\nDigital Twin #A4")]
        end

        subgraph VS5_WF["⚙ Workflow State Machine [R6]"]
            WORKFLOW_AGG["workflow.aggregate\n── STATE CONTRACT [R6] ──\nDraft→InProgress→QA\n→Acceptance→Finance→Completed\nblockedBy: Set‹issueId›\nunblockWorkflow 前提：\n  blockedBy.isEmpty() #A3"]
        end

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
        W_B_SCHEDULE["schedule\n(tagSlug T4)"]

        W_FILES -.->|原始檔案| W_PARSER
        W_PARSER -->|解析完成| PARSING_INTENT
        PARSING_INTENT -->|任務草稿| A_TASKS
        PARSING_INTENT -->|財務指令| A_FINANCE
        PARSING_INTENT -->|解析異常| B_ISSUES
        A_TASKS -.->|"SourcePointer #A4"| PARSING_INTENT
        PARSING_INTENT -.->|"IntentDeltaProposed #A4"| A_TASKS
        WORKFLOW_AGG -.->|stage-view| A_TASKS & A_QA & A_ACCEPT & A_FINANCE
        A_TASKS --> A_QA --> A_ACCEPT --> A_FINANCE
        WORKFLOW_AGG -->|"blockWorkflow #A3"| B_ISSUES
        A_TASKS -.-> W_B_DAILY
        A_TASKS -.->|任務分配| W_B_SCHEDULE
        PARSING_INTENT -.->|"職能需求 T4"| W_B_SCHEDULE
    end

    ORG_CONTEXT_ACL -.->|"本地 Org Context"| VS5_APP
    B_ISSUES -->|IssueResolved| WS_EVENT_BUS
    WS_EVENT_BUS -.->|"issues:resolved 解鎖 #A3\nblockedBy.delete(issueId)"| WORKFLOW_AGG
    WS_CMD_HANDLER --> WS_SCOPE_GUARD --> WS_POLICY_ENG --> WS_TX_RUNNER
    WS_TX_RUNNER -->|"#A8"| WS_AGG
    WS_TX_RUNNER -.->|執行業務邏輯| VS5_BIZ
    WS_TX_RUNNER -->|"pending events [E5]"| WS_OUTBOX
    WS_AGG --> WS_EVENT_STORE
    WS_AGG -->|"in-process [E5]"| WS_EVENT_BUS
end

IER -.->|"CRITICAL: OrgContextProvisioned [E2]"| ORG_CONTEXT_ACL
IER -.->|"BACKGROUND: 跨片稽核"| AUDIT_COLLECTOR
W_B_SCHEDULE -.->|"tagSlug T4"| TAG_READONLY
W_B_SCHEDULE -.->|"人力需求契約"| SK_SKILL_REQ
WS_EVENT_BUS -.->|"事件契約"| SK_ENV
WS_OUTBOX -->|"STANDARD_LANE [E5]"| IER
WS_POLICY_CHECK -.->|"policy eligible-check [P4]"| QGWAY_SCHED
WS_CMD_HANDLER -.->|"執行結果"| SK_CMD_RESULT

%% ==========================================================================
%% VS6) SCHEDULING SLICE — 排班協作切片
%% [S1] SCHED_OUTBOX 精簡：引用 SK_OUTBOX_CONTRACT，DLQ 分級在此宣告
%% [S4] TAG_STALE_GUARD 校驗引用 SK_STALENESS_CONTRACT
%% P3/P7/R7 沿用 v9
%% ==========================================================================

subgraph VS6["🟨 VS6 · Scheduling Slice（排班協作）"]
    direction TB

    subgraph VS6_DOMAIN["⚙ Schedule Domain"]
        ORG_SCHEDULE["account-organization.schedule\nHR Scheduling (tagSlug T4)\n[SK_STALENESS_CONTRACT]\n配對前 TAG_STALE_GUARD 校驗\n事件帶 aggregateVersion [R7]"]
    end

    subgraph VS6_SAGA["⚙ Scheduling Saga（#A5）"]
        SCHEDULE_SAGA["scheduling-saga\nScheduleAssignRejected\nScheduleProposalCancelled"]
    end

    subgraph VS6_OUTBOX["📤 Schedule Outbox [S1]"]
        SCHED_OUTBOX["sched-outbox\n[SK_OUTBOX_CONTRACT S1]\n─────────────────\nDLQ 分級宣告：\nScheduleAssigned\n  → REVIEW_REQUIRED\nCompensating Events\n  → SAFE_AUTO"]
    end

    ORG_SCHEDULE -.->|"#14 只讀 eligible=true"| QGWAY_SCHED
    ORG_SCHEDULE -.->|"tagSlug 新鮮度校驗"| TAG_STALE_GUARD
    ORG_SCHEDULE -->|"ScheduleAssigned + aggregateVersion"| SCHED_OUTBOX
    ORG_SCHEDULE -.->|"人力需求契約"| SK_SKILL_REQ
    ORG_SCHEDULE -.->|"tagSlug 唯讀"| TAG_READONLY
    SCHEDULE_SAGA -->|"compensating event"| SCHED_OUTBOX
end

IER -.->|"ScheduleProposed #A5"| ORG_SCHEDULE
SCHED_OUTBOX -->|"STANDARD_LANE"| IER

%% ==========================================================================
%% VS7) NOTIFICATION SLICE — 通知交付切片
%% [R8] FCM 推播帶 traceId metadata（沿用 v9）
%% ==========================================================================

subgraph VS7["🩷 VS7 · Notification Slice（通知交付）"]
    direction TB

    subgraph VS7_ROUTE["⚙ Notification Router（無狀態 #A10）"]
        NOTIF_ROUTER["notification-router\n消費 IER STANDARD_LANE\nScheduleAssigned [E3]\n從 envelope 讀取 traceId [R8]"]
    end

    subgraph VS7_DELIVER["📤 Delivery"]
        USER_NOTIF["account-user.notification\n個人推播"]
        FCM[["Firebase Cloud Messaging\n推播帶 traceId metadata [R8]"]]
        USER_DEVICE["使用者裝置"]
    end

    NOTIF_ROUTER -->|TargetAccountID 匹配| USER_NOTIF
    PROFILE -.->|"FCM Token（唯讀）"| USER_NOTIF
    USER_NOTIF -.->|"#6 投影"| QGWAY_NOTIF
    USER_NOTIF --> FCM --> USER_DEVICE
end

%% ==========================================================================
%% GW) 三閘道統一出入口（CQRS Gateway Layer）
%% [S5] GW_GUARD 標示遵守 SK_RESILIENCE_CONTRACT：
%%      不再重複定義 rate-limit/circuit-break/bulkhead 規格，引用 VS0 即可
%% [S1] OUTBOX_RELAY 說明引用 SK_OUTBOX_CONTRACT
%% [S6] IER CRITICAL_LANE 標示引用 SK_TOKEN_REFRESH_CONTRACT
%%
%% ══ IER 完整路由規則表（v10 最終版）══
%%  CRITICAL_LANE（高優先最終一致）：
%%    RoleChanged/PolicyChanged     → CLAIMS_HANDLER [S6][E6]
%%                                    + TOKEN_REFRESH_SIGNAL [SK_TOKEN_REFRESH_CONTRACT]
%%    WalletDeducted/Credited       → FUNNEL CRITICAL_PROJ
%%    OrgContextProvisioned         → ORG_CONTEXT_ACL [E2]
%%  STANDARD_LANE（非同步最終一致 SLA < 2s）：
%%    SkillXpAdded/Deducted         → FUNNEL CRITICAL_PROJ [P2]
%%    ScheduleAssigned              → NOTIF_ROUTER + FUNNEL [E3]
%%    ScheduleProposed              → ORG_SCHEDULE Saga [A5]
%%    MemberJoined/Left             → FUNNEL [#16]
%%    All Domain Events             → FUNNEL [#9]
%%  BACKGROUND_LANE（低頻 SLA < 30s）：
%%    TagLifecycleEvent             → FUNNEL + VS4_TAG_SUBSCRIBER [T1][R3]
%%    AuditEvents                   → AUDIT_COLLECTOR [Q5]
%% ==========================================================================

subgraph GW["⚪ 三閘道統一出入口（CQRS Gateway Layer）"]
    direction TB

    subgraph GW_RELAY["⚙ OUTBOX Relay Worker [R1][S1]"]
        OUTBOX_RELAY["outbox-relay-worker\n【共用 Infra 組件・所有 OUTBOX 共享】\n掃描策略：Firestore onSnapshot (CDC)\n投遞：OUTBOX → IER 對應 Lane\n失敗處理（遵守 SK_OUTBOX_CONTRACT）：\n  retry with exponential backoff\n  3 次失敗 → DLQ（帶分級標記）\n監控：relay_lag → VS9"]
    end

    subgraph GW_GUARD["🛡 入口前置保護層 [S5]"]
        direction LR
        GUARD_LABEL["⬛ 遵守 SK_RESILIENCE_CONTRACT [S5]\n實作：rate-limit / circuit-break / bulkhead\n規格見 VS0 SK_RESILIENCE_CONTRACT\n不在此重複定義"]
        RATE_LIMITER["rate-limiter\nper user / per org\n429 + retry-after"]
        CIRCUIT_BREAKER["circuit-breaker\n5xx → 熔斷\n半開探針恢復"]
        BULKHEAD_ROUTER["bulkhead-router\n切片隔板\n獨立執行緒池"]
        RATE_LIMITER --> CIRCUIT_BREAKER --> BULKHEAD_ROUTER
    end

    subgraph GW_CMD["🔵 Command Bus Gateway（統一寫入入口）"]
        direction LR
        CBG_ENTRY["unified-command-gateway\nTraceID 注入\n→ event-envelope.traceId\n唯一入口 [E4][R8]"]
        CBG_AUTH["universal-authority-interceptor\nAuthoritySnapshot #A9\n衝突以 ACTIVE_CTX 為準"]
        CBG_ROUTE["command-router\n路由至對應切片\n結果回傳 SK_CMD_RESULT"]
        CBG_ENTRY --> CBG_AUTH --> CBG_ROUTE
        CBG_AUTH -.->|"高風險二次確認 #A9"| SKILL_AGG
        CBG_AUTH -.->|"高風險二次確認 #A9"| ORG_AGG
        WS_SCOPE_GUARD -.->|"高風險二次確認 #A9"| WS_AGG
    end

    subgraph GW_EVENT["🟠 Integration Event Router [P1][S6]"]
        direction TB
        IER[["integration-event-router\n統一事件出口 #9\n傳播規則 [R8]：\n  保留 envelope.traceId，禁止覆蓋"]]

        subgraph IER_LANES["優先級三道分層 [P1]"]
            direction LR
            CRITICAL_LANE["🔴 CRITICAL_LANE\n高優先最終一致\nRoleChanged → Claims刷新\n[SK_TOKEN_REFRESH_CONTRACT S6]\nSLA 目標：盡快投遞"]
            STANDARD_LANE["🟡 STANDARD_LANE\nSLA < 2s"]
            BACKGROUND_LANE["⚪ BACKGROUND_LANE\nSLA < 30s"]
        end

        subgraph DLQ_SYSTEM["💀 DLQ 三級分類 [R5][S1]"]
            DLQ["dead-letter-queue\n失敗 3 次後收容\n分級標記來自 SK_OUTBOX_CONTRACT"]
            DLQ_SAFE["🟢 SAFE_AUTO\n冪等事件・自動重試"]
            DLQ_REVIEW["🟡 REVIEW_REQUIRED\n金融/排班/角色\n人工審查後重試"]
            DLQ_BLOCK["🔴 SECURITY_BLOCK\n安全事件\n告警 + 凍結 + 人工確認"]
            DLQ --> DLQ_SAFE & DLQ_REVIEW & DLQ_BLOCK
            DLQ_SAFE -.->|"自動 Replay（保留 idempotency-key）"| IER
            DLQ_REVIEW -.->|"人工確認後 Replay"| IER
            DLQ_BLOCK -.->|"告警 → DOMAIN_ERRORS"| DOMAIN_ERRORS
        end

        IER --> IER_LANES
        IER_LANES -.->|"投遞失敗 3 次"| DLQ
    end

    subgraph GW_QUERY["🟢 Query Gateway（統一讀取入口）[S2][S3]"]
        direction TB
        QGWAY["read-model-registry\n統一讀取入口\n版本對照 / 快照路由\n[S2] 所有 Projection 遵守 SK_VERSION_GUARD"]
        QGWAY_SCHED["→ .org-eligible-member-view\n#14 #15 #16"]
        QGWAY_NOTIF["→ .account-view\n#6 FCM Token"]
        QGWAY_SCOPE["→ .workspace-scope-guard-view\n#A9"]
        QGWAY_WALLET["→ .wallet-balance\n[SK_READ_CONSISTENCY]\n顯示 → Projection\n精確交易 → STRONG_READ"]
        QGWAY --> QGWAY_SCHED & QGWAY_NOTIF & QGWAY_SCOPE & QGWAY_WALLET
    end

    BULKHEAD_ROUTER --> CBG_ENTRY
    OUTBOX_RELAY -.->|"掃描所有 OUTBOX → 投遞"| IER
    CBG_ROUTE -->|"Workspace Command"| WS_CMD_HANDLER
    CBG_ROUTE -->|"Skill Command"| SKILL_AGG
    CBG_ROUTE -->|"Org Command"| ORG_AGG
    CBG_ROUTE -->|"Account Command"| USER_AGG
    ACTIVE_CTX -->|"查詢鍵"| QGWAY_SCOPE
    QGWAY_SCOPE --> CBG_AUTH
end

SERVER_ACTIONS["_actions.ts\n統一觸發入口\n[SK_RESILIENCE_CONTRACT S5]"]
SERVER_ACTIONS --> RATE_LIMITER

IER -.->|"CRITICAL: RoleChanged/PolicyChanged [S6]"| CLAIMS_HANDLER
IER -.->|"STANDARD: ScheduleAssigned [E3]"| NOTIF_ROUTER
IER -.->|"CRITICAL: OrgContextProvisioned [E2]"| ORG_CONTEXT_ACL

ACC_OUTBOX & ORG_OUTBOX & SCHED_OUTBOX & SKILL_OUTBOX & TAG_OUTBOX & WS_OUTBOX -.->|"被 OUTBOX_RELAY 掃描 [R1]"| OUTBOX_RELAY

%% ==========================================================================
%% VS8) PROJECTION BUS — 事件投影總線
%% [S2] FUNNEL 標示遵守 SK_VERSION_GUARD：
%%      所有 Projection Lane 寫入皆遵守 aggregateVersion 單調遞增
%%      ORG_ELIGIBLE_VIEW 節點精簡（規則移至 VS0）
%% [S4] PROJ SLA 標示引用 SK_STALENESS_CONTRACT
%% R7/R8/Q3/P5 沿用 v9
%% ==========================================================================

subgraph VS8["🟡 VS8 · Projection Bus（事件投影總線）"]
    direction TB

    subgraph VS8_FUNNEL["▶ Event Funnel [S2][P5][R8]"]
        direction LR
        FUNNEL[["event-funnel\n#9 唯一 Projection 寫入路徑\n[Q3] upsert by idempotency-key\n[R8] 從 envelope 讀取 traceId → DOMAIN_METRICS\n[S2] 所有 Lane 遵守 SK_VERSION_GUARD\n     event.aggVersion > view.lastVersion\n     → 更新；否則 → 丟棄"]]
        CRITICAL_PROJ_LANE["🔴 CRITICAL_PROJ_LANE\n[SK_STALENESS_CONTRACT: PROJ_STALE_CRITICAL]\nSLA ≤ 500ms\n獨立重試 / dead-letter"]
        STANDARD_PROJ_LANE["⚪ STANDARD_PROJ_LANE\n[SK_STALENESS_CONTRACT: PROJ_STALE_STANDARD]\nSLA ≤ 10s\n獨立重試 / dead-letter"]
        FUNNEL --> CRITICAL_PROJ_LANE & STANDARD_PROJ_LANE
    end

    subgraph VS8_META["⚙ Stream Version & Registry"]
        PROJ_VER["projection.version\n事件串流偏移量"]
        READ_REG["read-model-registry"]
    end

    subgraph VS8_CRITICAL_VIEWS["🔴 Critical Projections [S2][S4]"]
        WS_SCOPE_VIEW["projection\n.workspace-scope-guard-view\n授權路徑 #A9\n[SK_VERSION_GUARD S2]"]
        ORG_ELIGIBLE_VIEW["projection\n.org-eligible-member-view\n[SK_VERSION_GUARD S2]\n※ aggregateVersion 單調遞增規則\n  已移至 VS0，此處引用契約\nskills{tagSlug→xp} / eligible\n#14 #15 #16 T3"]
        WALLET_PROJ["projection\n.wallet-balance\n[SK_READ_CONSISTENCY: EVENTUAL_READ]\n顯示用・精確交易回源 AGG"]
        TIER_FN[["getTier(xp) → Tier\n純函式 #12"]]
    end

    subgraph VS8_STANDARD_VIEWS["⚪ Standard Projections [S4]"]
        direction LR

        subgraph VS8_WS_VIEWS["Workspace Views"]
            WORKSPACE_PROJ["projection.workspace-view"]
            ACC_SCHED_VIEW["projection.account-schedule"]
        end

        subgraph VS8_ACC_VIEWS["Account + Org Views"]
            ACC_PROJ_VIEW_NODE["projection.account-view"]
            ORG_PROJ_VIEW["projection.organization-view"]
        end

        subgraph VS8_SKILL_VIEW["Skill View"]
            SKILL_VIEW["projection.account-skill-view\n[SK_VERSION_GUARD S2]"]
        end

        subgraph VS8_AUDIT_VIEW["Global Audit View"]
            GLOBAL_AUDIT_VIEW["projection.global-audit-view\n每條記錄含 traceId [R8]"]
        end

        subgraph VS8_TAG_VIEW["Tag View（BACKGROUND）"]
            TAG_SNAPSHOT["projection.tag-snapshot\n[SK_STALENESS_CONTRACT: TAG_MAX_STALENESS]\nT5 消費方禁止寫入"]
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

READ_REG -.->|"版本目錄"| QGWAY
WS_SCOPE_VIEW -.->|"快照契約"| SK_AUTH_SNAP
ACC_PROJ_VIEW_NODE -.->|"快照契約"| SK_AUTH_SNAP
SKILL_VIEW -.->|"tier 推導"| SK_SKILL_TIER
ORG_ELIGIBLE_VIEW -.->|"tier 推導"| SK_SKILL_TIER
ORG_ELIGIBLE_VIEW -.-> QGWAY_SCHED
ACC_PROJ_VIEW_NODE -.-> QGWAY_NOTIF
WS_SCOPE_VIEW -.-> QGWAY_SCOPE
WALLET_PROJ -.-> QGWAY_WALLET
AUDIT_COLLECTOR -.->|"跨片稽核"| GLOBAL_AUDIT_VIEW

%% ==========================================================================
%% VS9) OBSERVABILITY — 橫切面全域掛載
%% ==========================================================================

subgraph VS9["⬜ VS9 · Observability（橫切面）"]
    direction LR
    TRACE_ID["trace-identifier\nCBG_ENTRY 注入 TraceID\n整條事件鏈共享 [R8]"]
    DOMAIN_METRICS["domain-metrics\nIER 各 Lane Throughput/Latency\nFUNNEL 各 Lane 處理時間\nOUTBOX_RELAY lag [R1]\nRATELIMIT hit / CIRCUIT open"]
    DOMAIN_ERRORS["domain-error-log\nWS_TX_RUNNER\nSCHEDULE_SAGA\nDLQ_BLOCK 安全事件 [R5]\nStaleTagWarning\nTOKEN_REFRESH 失敗告警 [S6]"]
end

CBG_ENTRY --> TRACE_ID
IER --> DOMAIN_METRICS
FUNNEL --> DOMAIN_METRICS
OUTBOX_RELAY -.->|"relay_lag metrics"| DOMAIN_METRICS
RATE_LIMITER -.->|"hit metrics"| DOMAIN_METRICS
CIRCUIT_BREAKER -.->|"open/half-open"| DOMAIN_METRICS
WS_TX_RUNNER --> DOMAIN_ERRORS
SCHEDULE_SAGA --> DOMAIN_ERRORS
DLQ_BLOCK -.->|"安全告警"| DOMAIN_ERRORS
TAG_STALE_GUARD -.->|"StaleTagWarning"| DOMAIN_ERRORS
TOKEN_REFRESH_SIGNAL -.->|"Claims 刷新成功通知 [S6]"| DOMAIN_METRICS

%% ==========================================================================
%% CONSISTENCY INVARIANTS 完整索引
%% ==========================================================================
%% #1  每個 BC 只能修改自己的 Aggregate
%% #2  跨 BC 僅能透過 Event/Projection/ACL 溝通
%% #3  Application Layer 只協調，不承載領域規則
%% #4a Domain Event 僅由 Aggregate 產生（唯一生成者）
%% #4b TX Runner 只投遞 Outbox，不產生 Domain Event（分工界定）
%% #5  Custom Claims 只做快照，非真實權限來源
%% #6  Notification 只讀 Projection
%% #7  Scope Guard 僅讀本 Context Read Model
%% #8  Shared Kernel 必須顯式標示；未標示跨 BC 共用視為侵入
%% #9  Projection 必須可由事件完整重建
%% #10 任一模組需外部 Context 內部狀態 = 邊界設計錯誤
%% #11 XP 屬 Account BC；Organization 只設門檻
%% #12 Tier 永遠是推導值，不存 DB
%% #13 XP 異動必須寫 Ledger
%% #14 Schedule 只讀 ORG_ELIGIBLE_MEMBER_VIEW
%% #15 eligible 生命週期：joined→true · assigned→false · completed/cancelled→true
%% #16 Talent Repository = member + partner + team
%% #17 centralized-tag.aggregate 為 tagSlug 唯一真相
%% #18 workspace-governance role 繼承 policy 硬約束
%% #19 所有 Projection 更新必須以 aggregateVersion 單調遞增為前提 [S2 泛化]
%%     （v9 R7 僅限 eligible-view → v10 S2 擴展為全部 Projection）
%% ==========================================================================
%% ATOMICITY AUDIT 完整索引（沿用 v9）
%% ==========================================================================
%% #A1  wallet 強一致；profile/notification 弱一致
%% #A2  org-account.binding 只 ACL/projection 防腐對接
%% #A3  blockWorkflow → blockedBy Set；allIssuesResolved → unblockWorkflow
%% #A4  ParsingIntent 只允許提議事件
%% #A5  schedule 跨 BC saga/compensating event
%% #A6  CENTRALIZED_TAG_AGGREGATE 語義唯一權威
%% #A7  Event Funnel 只做 compose
%% #A8  TX Runner 1cmd/1agg 原子提交
%% #A9  Scope Guard 快路徑；高風險回源 aggregate
%% #A10 Notification Router 無狀態路由
%% #A11 eligible = 「無衝突排班」快照，非靜態狀態
%% ==========================================================================
%% TAG AUTHORITY 擴展規則（沿用）
%% T1  新切片訂閱 TagLifecycleEvent（BACKGROUND_LANE）即可擴展
%% T2  SKILL_TAG_POOL = Tag Authority 組織作用域唯讀投影
%% T3  ORG_ELIGIBLE_MEMBER_VIEW.skills{tagSlug→xp} 交叉快照
%% T4  排班職能需求 = SK_SKILL_REQ × Tag Authority tagSlug
%% T5  TAG_SNAPSHOT 消費方禁止寫入
%% ==========================================================================
%% v10 VS0 下沉索引（本版本核心）
%% S1  SK_OUTBOX_CONTRACT：三要素（at-least-once / idempotency-key / DLQ分級）
%%     消除：6 個 OUTBOX 節點各自重複宣告 at-least-once
%%     消除：DLQ 分級標記散落 VS2/VS6 節點文字
%% S2  SK_VERSION_GUARD：aggregateVersion 單調遞增保護
%%     消除：規則僅定義於 ORG_ELIGIBLE_VIEW（#19 泛化為全 Projection）
%%     精簡：ORG_ELIGIBLE_VIEW 節點文字大幅縮短
%% S3  SK_READ_CONSISTENCY：STRONG_READ vs EVENTUAL_READ 路由契約
%%     消除：STRONG_READ 語義散落 VS2 WALLET_AGG / QGWAY_WALLET / VS8 WALLET_PROJ
%%     效益：未來 XP 精確查詢直接引用此契約
%% S4  SK_STALENESS_CONTRACT：SLA 常數單一真相
%%     消除：「Max Staleness ≤ 30s」寫在三個節點
%%     效益：調整 SLA 只改 VS0
%% S5  SK_RESILIENCE_CONTRACT：外部觸發入口最低防護規格
%%     消除：GW_GUARD 無全域契約依據，新入口缺乏遵守標準
%%     效益：Webhook / Edge Function 有明確可審計的遵守義務
%% S6  SK_TOKEN_REFRESH_CONTRACT：Claims 刷新三方握手協議
%%     消除：握手規則僅在 VS1 TOKEN_REFRESH_SIGNAL 節點文字
%%     效益：前端 / IER / VS1 三方共享唯一握手規範
%% ==========================================================================
%% ── v10 統一開發守則（D1~D12 沿用 v9，新增 D13~D18）──
%% D1~D12 : 沿用 v9（見 v9 說明）
%% D13 新增 OUTBOX：必須在 SK_OUTBOX_CONTRACT 宣告 DLQ 分級，
%%     不得自行在節點文字重新定義 at-least-once 語義 [S1]
%% D14 新增 Projection：必須在 FUNNEL 引用 SK_VERSION_GUARD，
%%     不得跳過 aggregateVersion 比對直接寫入 [S2]
%% D15 讀取場景決策：先查 SK_READ_CONSISTENCY，
%%     金融/授權/不可逆 → STRONG_READ；其餘 → EVENTUAL_READ [S3]
%% D16 SLA 數值禁止在節點文字硬寫，一律引用 SK_STALENESS_CONTRACT [S4]
%% D17 新增外部觸發入口（非 _actions.ts）：
%%     必須在 SK_RESILIENCE_CONTRACT 驗收後上線 [S5]
%% D18 Claims 刷新邏輯變更：
%%     以 SK_TOKEN_REFRESH_CONTRACT 為唯一規範，三方同步修改 [S6]
%% D19 型別歸屬規則：跨 BC 契約必須優先放在 shared.kernel.*；
%%     shared/types 僅可作 legacy/common DTO fallback，不得作為新跨片契約預設落點
%% D20 匯入優先序：shared.kernel.* > feature slice index.ts > shared/types
%%     若同一概念同時存在於 shared.kernel 與 shared/types，以 shared.kernel 為唯一權威
%% ==========================================================================

%% ==========================================================================
%% STYLES
%% ==========================================================================
classDef sk fill:#ecfeff,stroke:#22d3ee,color:#000,font-weight:bold
classDef skInfra fill:#f0f9ff,stroke:#0369a1,color:#000,font-weight:bold
classDef skAuth fill:#fdf4ff,stroke:#7c3aed,color:#000,font-weight:bold
classDef tagAuth fill:#cffafe,stroke:#0891b2,color:#000,font-weight:bold
classDef identity fill:#dbeafe,stroke:#93c5fd,color:#000
classDef ctxNode fill:#eff6ff,stroke:#1d4ed8,color:#000,font-weight:bold
classDef claimsNode fill:#dbeafe,stroke:#1d4ed8,color:#000,font-weight:bold
classDef tokenSignal fill:#fef3c7,stroke:#d97706,color:#000,font-weight:bold
classDef account fill:#dcfce7,stroke:#86efac,color:#000
classDef outboxNode fill:#fef3c7,stroke:#d97706,color:#000,font-weight:bold
classDef relayWorker fill:#f0fdf4,stroke:#15803d,color:#000,font-weight:bold
classDef skillSlice fill:#bbf7d0,stroke:#22c55e,color:#000
classDef orgSlice fill:#fff7ed,stroke:#fdba74,color:#000
classDef tagSubscriber fill:#fef9c3,stroke:#ca8a04,color:#000,font-weight:bold
classDef wsSlice fill:#ede9fe,stroke:#c4b5fd,color:#000
classDef wsAcl fill:#f5f3ff,stroke:#7c3aed,color:#000,stroke-dasharray:4 2
classDef wfContract fill:#fdf4ff,stroke:#9333ea,color:#000,font-weight:bold
classDef cmdResult fill:#f0fdf4,stroke:#16a34a,color:#000,font-weight:bold
classDef schedSlice fill:#fef9c3,stroke:#ca8a04,color:#000
classDef notifSlice fill:#fce7f3,stroke:#db2777,color:#000
classDef projCritical fill:#fee2e2,stroke:#dc2626,color:#000,font-weight:bold
classDef projStandard fill:#fef9c3,stroke:#d97706,color:#000
classDef eligibleGuard fill:#fee2e2,stroke:#b91c1c,color:#000,font-weight:bold
classDef auditView fill:#f0fdf4,stroke:#15803d,color:#000,font-weight:bold
classDef tagProjSlice fill:#e0f2fe,stroke:#0284c7,color:#000
classDef gateway fill:#f8fafc,stroke:#334155,color:#000,font-weight:bold
classDef guardLayer fill:#fff1f2,stroke:#e11d48,color:#000,font-weight:bold
classDef cmdGw fill:#eff6ff,stroke:#2563eb,color:#000
classDef eventGw fill:#fff7ed,stroke:#ea580c,color:#000
classDef criticalLane fill:#fee2e2,stroke:#dc2626,color:#000,font-weight:bold
classDef standardLane fill:#fef9c3,stroke:#ca8a04,color:#000
classDef backgroundLane fill:#f1f5f9,stroke:#64748b,color:#000
classDef dlqNode fill:#fca5a5,stroke:#b91c1c,color:#000,font-weight:bold
classDef dlqSafe fill:#d1fae5,stroke:#059669,color:#000,font-weight:bold
classDef dlqReview fill:#fef9c3,stroke:#ca8a04,color:#000,font-weight:bold
classDef dlqBlock fill:#fca5a5,stroke:#b91c1c,color:#000,font-weight:bold
classDef queryGw fill:#f0fdf4,stroke:#15803d,color:#000
classDef staleGuard fill:#fef3c7,stroke:#b45309,color:#000,font-weight:bold
classDef observability fill:#f1f5f9,stroke:#64748b,color:#000
classDef trackA fill:#d1fae5,stroke:#059669,color:#000
classDef tierFn fill:#fdf4ff,stroke:#9333ea,color:#000
classDef talent fill:#fff1f2,stroke:#f43f5e,color:#000
classDef serverAction fill:#fed7aa,stroke:#f97316,color:#000

class SK,SK_ENV,SK_AUTH_SNAP,SK_SKILL_TIER,SK_SKILL_REQ,SK_FOUNDATION sk
class SK_CMD_RESULT cmdResult
class SK_OUTBOX_CONTRACT,SK_VERSION_GUARD,SK_READ_CONSISTENCY,SK_STALENESS_CONTRACT,SK_RESILIENCE_CONTRACT skInfra
class SK_TOKEN_REFRESH_CONTRACT skAuth
class CTA,TAG_EVENTS,TAG_READONLY tagAuth
class TAG_OUTBOX,WS_OUTBOX,ACC_OUTBOX,ORG_OUTBOX,SCHED_OUTBOX,SKILL_OUTBOX outboxNode
class TAG_STALE_GUARD staleGuard
class VS1,FIREBASE_AUTH,AUTH_IDENTITY,IDENTITY_LINK identity
class ACTIVE_CTX,CTX_LIFECYCLE ctxNode
class CLAIMS_HANDLER,CUSTOM_CLAIMS claimsNode
class TOKEN_REFRESH_SIGNAL tokenSignal
class VS2,USER_AGG,WALLET_AGG,PROFILE,ORG_ACC,ORG_ACC_SETTINGS,ORG_ACC_BINDING,ACC_ROLE,ACC_POLICY,ACC_EVENT_BUS account
class VS3,SKILL_AGG,XP_LEDGER,SKILL_EVENTS skillSlice
class VS4,ORG_AGG,ORG_MEMBER,ORG_PARTNER,ORG_TEAM,ORG_POLICY,ORG_SKILL_RECOG,SKILL_TAG_POOL,ORG_EVENT_BUS,ORG_OUTBOX orgSlice
class VS4_TAG_SUBSCRIBER tagSubscriber
class TALENT_REPO talent
class VS5,WS_CMD_HANDLER,WS_SCOPE_GUARD,WS_POLICY_ENG,WS_TX_RUNNER,WS_AGG,WS_EVENT_BUS,WS_EVENT_STORE,WS_SETTINGS,WS_ROLE,WS_POLICY_CHECK,WS_AUDIT wsSlice
class ORG_CONTEXT_ACL wsAcl
class WORKFLOW_AGG wfContract
class AUDIT_COLLECTOR auditView
class A_TASKS,A_QA,A_ACCEPT,A_FINANCE trackA
class B_ISSUES,W_B_DAILY,W_B_SCHEDULE wsSlice
class VS6,ORG_SCHEDULE,SCHEDULE_SAGA,SCHED_OUTBOX schedSlice
class VS7,NOTIF_ROUTER,USER_NOTIF,FCM,USER_DEVICE notifSlice
class GW gateway
class OUTBOX_RELAY relayWorker
class GW_GUARD,RATE_LIMITER,CIRCUIT_BREAKER,BULKHEAD_ROUTER,GUARD_LABEL guardLayer
class CBG_ENTRY,CBG_AUTH,CBG_ROUTE cmdGw
class IER,IER_LANES eventGw
class CRITICAL_LANE criticalLane
class STANDARD_LANE standardLane
class BACKGROUND_LANE backgroundLane
class DLQ dlqNode
class DLQ_SAFE dlqSafe
class DLQ_REVIEW dlqReview
class DLQ_BLOCK dlqBlock
class QGWAY,QGWAY_SCHED,QGWAY_NOTIF,QGWAY_SCOPE,QGWAY_WALLET queryGw
class VS8,FUNNEL,PROJ_VER,READ_REG projStandard
class CRITICAL_PROJ_LANE,WS_SCOPE_VIEW,WALLET_PROJ projCritical
class ORG_ELIGIBLE_VIEW eligibleGuard
class STANDARD_PROJ_LANE,WORKSPACE_PROJ,ACC_SCHED_VIEW,ACC_PROJ_VIEW_NODE,ORG_PROJ_VIEW,SKILL_VIEW projStandard
class GLOBAL_AUDIT_VIEW auditView
class TAG_SNAPSHOT tagProjSlice
class TIER_FN tierFn
class VS9,TRACE_ID,DOMAIN_METRICS,DOMAIN_ERRORS observability
class SERVER_ACTIONS serverAction
