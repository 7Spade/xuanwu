%%  ╔══════════════════════════════════════════════════════════════════════════╗
%%  ║  LOGIC OVERVIEW v1 — ARCHITECTURE SSOT (FULL REDESIGN)                ║
%%  ║  設計原則：                                                              ║
%%  ║    ① 統一由上至下：外部入口 → 閘道 → 領域 → 事件總線 → 投影 → 查詢出口  ║
%%  ║    ② SK 契約集中定義，所有節點僅引用不重複宣告                           ║
%%  ║    ③ Firebase 邊界明確：FIREBASE_ACL 為唯一 SDK 呼叫點                   ║
%%  ║    ④ 三道閘道職責分離：CMD（寫）/ IER（事件）/ QGWAY（讀）               ║
%%  ║    ⑤ 所有不變量以 [#N] / [SN] / [RN] 行內索引，完整定義於文末            ║
%%  ╠══════════════════════════════════════════════════════════════════════════╣
%%  SSOT Mapping:
%%    Architecture rules   → docs/logic-overview.md  ← THIS FILE
%%    Domain vocabulary    → docs/domain-glossary.md
%%    Data persistence     → docs/persistence-model-overview.md
%%    TypeScript contracts → docs/schema-definition.md
%%    Runtime stack        → docs/tech-stack.md
%%    Folder ownership     → docs/project-structure.md
%%    Product intent       → docs/prd-schedule-workforce-skills.md
%%    Semantic relations   → docs/knowledge-graph.json
%%  ╠══════════════════════════════════════════════════════════════════════════╣
%%  KEY INVARIANTS（絕對遵守）:
%%    [R8]  traceId 在 CBG_ENTRY 注入一次，全鏈唯讀不可覆蓋
%%    [S2]  所有 Projection 寫入前必須呼叫 applyVersionGuard()
%%    [S4]  SLA 數值只能引用 SK_STALENESS_CONTRACT，禁止硬寫
%%    [D7]  跨切片引用只能透過 {slice}/index.ts 公開 API
%%    [D21] 新 tag 類別只在 CTA TAG_ENTITIES 定義
%%    [D24] Feature slice 禁止直接 import firebase/*，必須走 SK_PORTS
%%  FORBIDDEN:
%%    BC_X 禁止直接寫入 BC_Y aggregate → 必須透過 IER Domain Event
%%    TX Runner 禁止產生 Domain Event → 只有 Aggregate 可以 [#4b]
%%    SECURITY_BLOCK DLQ → 禁止自動 Replay，必須人工審查
%%    B-track 禁止回呼 A-track → 只能透過 Domain Event 溝通
%%    Feature slice 禁止直接 import firebase/* [D24]
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
        SK_ENV["event-envelope\nversion · traceId · timestamp\nidempotency-key = eventId+aggId+version\n[R8] traceId 整鏈共享・不可覆蓋"]
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

    subgraph SK_TAG["🏷️ Tag Authority Center [#A6 #17]"]
        direction TB
        CTA["centralized-tag.aggregate\n【全域語義字典・唯一真相】\ntagSlug / label / category\ndeprecatedAt / deleteRule"]

        subgraph TAG_ENTS["🏷️ AI-ready Semantic Tag Entities [D21]"]
            direction LR
            TE_UL["tag::user-level\ncategory: user_level"]
            TE_SK["tag::skill\ncategory: skill"]
            TE_ST["tag::skill-tier\ncategory: skill_tier"]
            TE_TM["tag::team\ncategory: team"]
            TE_RL["tag::role\ncategory: role"]
            TE_PT["tag::partner\ncategory: partner"]
        end

        TAG_EV["TagLifecycleEvent（in-process）"]
        TAG_OB["tag-outbox\n[SK_OUTBOX: SAFE_AUTO]"]
        TAG_RO["🔒 唯讀引用規則\nT1 新切片訂閱事件即可擴展"]
        TAG_SG["⚠️ TAG_STALE_GUARD\n[S4: TAG_MAX_STALENESS ≤ 30s]\nDeprecated → StaleTagWarning"]

        CTA --> TAG_ENTS
        CTA -->|"標籤異動廣播"| TAG_EV --> TAG_OB
        CTA -.->|"唯讀引用契約"| TAG_RO
        CTA -.->|"Deprecated 通知"| TAG_SG
    end

    subgraph SK_PORTS["🔌 Infrastructure Ports（依賴倒置介面）[D24]"]
        direction LR
        I_AUTH["IAuthService\n身份驗證 Port"]
        I_REPO["IFirestoreRepo\nFirestore 存取 Port [S2]"]
        I_MSG["IMessaging\n訊息推播 Port [R8]"]
        I_STORE["IFileStore\n檔案儲存 Port"]
    end
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
%% LAYER 3 ── DOMAIN SLICES（領域切片）
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

        subgraph VS5_PARSE["📄 文件解析閉環"]
            W_FILES["workspace.files"]
            W_PARSER["document-parser"]
            PARSE_INT[("ParsingIntent\nDigital Twin [#A4]")]
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

        PARSE_INT -->|任務草稿| A_TASKS
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

%% ── VS7 Notification ──
subgraph VS7["🩷 VS7 · Notification Slice（通知交付）"]
    direction TB

    NOTIF_R["notification-router\n無狀態路由 [#A10]\n消費 IER STANDARD_LANE\nScheduleAssigned [E3]\n從 envelope 讀取 traceId [R8]"]

    subgraph VS7_DEL["📤 Delivery"]
        USER_NOTIF["account-user.notification\n個人推播"]
        USER_DEV["使用者裝置"]
        USER_NOTIF --> USER_DEV
    end

    NOTIF_R -->|TargetAccountID 匹配| USER_NOTIF
    PROFILE -.->|"FCM Token（唯讀）"| USER_NOTIF
    USER_NOTIF -.->|"[#6] 投影"| QGWAY_NOTIF
end

USER_NOTIF -.->|"uses IMessaging [R8]"| I_MSG

%% ═══════════════════════════════════════════════════════════════
%% LAYER 4 ── INTEGRATION EVENT ROUTER（事件路由總線）
%% ═══════════════════════════════════════════════════════════════

subgraph GW_IER["🟠 L4 · Integration Event Router（IER）"]
    direction TB

    RELAY["outbox-relay-worker\n【共用 Infra・所有 OUTBOX 共享】\n掃描：Firestore onSnapshot (CDC)\n投遞：OUTBOX → IER 對應 Lane\n失敗：retry backoff → 3次失敗 → DLQ\n監控：relay_lag → VS9"]

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

subgraph VS8["🟡 L5 · Projection Bus（VS8）"]
    direction TB

    subgraph VS8_FUNNEL["▶ Event Funnel [S2 P5 R8]"]
        direction LR
        FUNNEL[["event-funnel\n[#9] 唯一 Projection 寫入路徑\n[Q3] upsert by idempotency-key\n[R8] 從 envelope 讀取 traceId → DOMAIN_METRICS\n[S2] 所有 Lane 遵守 SK_VERSION_GUARD\n     event.aggVersion > view.lastVersion\n     → 更新；否則 → 丟棄"]]
        CRIT_PROJ["🔴 CRITICAL_PROJ_LANE\n[S4: PROJ_STALE_CRITICAL ≤ 500ms]\n獨立重試 / dead-letter"]
        STD_PROJ["⚪ STANDARD_PROJ_LANE\n[S4: PROJ_STALE_STANDARD ≤ 10s]\n獨立重試 / dead-letter"]
        FUNNEL --> CRIT_PROJ & STD_PROJ
    end

    subgraph VS8_META["⚙️ Stream Meta"]
        PROJ_VER["projection.version\n事件串流偏移量"]
        READ_REG["read-model-registry\n版本目錄"]
        PROJ_VER -->|version mapping| READ_REG
    end

    subgraph VS8_CRIT["🔴 Critical Projections [S2 S4]"]
        WS_SCOPE_V["projection.workspace-scope-guard-view\n授權路徑 [#A9]\n[S2: SK_VERSION_GUARD]"]
        ORG_ELIG_V["projection.org-eligible-member-view\n[S2: SK_VERSION_GUARD]\nskills{tagSlug→xp} / eligible\n[#14 #15 #16 T3]\n→ tag::skill [TE_SK]\n→ tag::skill-tier [TE_ST]"]
        WALLET_V["projection.wallet-balance\n[S3: EVENTUAL_READ]\n顯示用・精確交易回源 AGG"]
        TIER_FN[["getTier(xp) → Tier\n純函式 [#12]"]]
    end

    subgraph VS8_STD["⚪ Standard Projections [S4]"]
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
    QGWAY --> QGWAY_SCHED & QGWAY_NOTIF & QGWAY_SCOPE & QGWAY_WALLET
end

ORG_ELIG_V -.-> QGWAY_SCHED
ACC_PROJ_V -.-> QGWAY_NOTIF
WS_SCOPE_V -.-> QGWAY_SCOPE
WALLET_V -.-> QGWAY_WALLET
ACTIVE_CTX -->|"查詢鍵"| QGWAY_SCOPE
QGWAY_SCOPE --> CBG_AUTH

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

subgraph VS9["⬜ L9 · Observability（橫切面）"]
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
class GW_QUERY,QGWAY,QGWAY_SCHED,QGWAY_NOTIF,QGWAY_SCOPE,QGWAY_WALLET qgway
class VS8,FUNNEL,PROJ_VER,READ_REG stdProj
class CRIT_PROJ,WS_SCOPE_V,ORG_ELIG_V,WALLET_V critProj
class STD_PROJ,WS_PROJ,ACC_SCHED_V,ACC_PROJ_V,ORG_PROJ_V,SKILL_V stdProj
class AUDIT_V auditView
class TAG_SNAP tagSub
class TIER_FN tierFn
class TALENT talent
class VS9,TRACE_ID,DOMAIN_METRICS,DOMAIN_ERRORS obs
class FIREBASE_ACL,AUTH_ADP,FSTORE_ADP,FCM_ADP,STORE_ADP aclAdapter
class FIREBASE_EXT,F_AUTH,F_DB,F_FCM,F_STORE firebaseExt
class EXT_CLIENT,EXT_AUTH,EXT_WEBHOOK serverAct

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
%%  #A6  CENTRALIZED_TAG_AGGREGATE 語義唯一權威
%%  #A7  Event Funnel 只做 compose
%%  #A8  TX Runner 1cmd/1agg 原子提交
%%  #A9  Scope Guard 快路徑；高風險回源 aggregate
%%  #A10 Notification Router 無狀態路由
%%  #A11 eligible = 「無衝突排班」快照，非靜態狀態
%%  ╠══════════════════════════════════════════════════════════════════════════╣
%%  TAG AUTHORITY 擴展規則
%%  T1  新切片訂閱 TagLifecycleEvent（BACKGROUND_LANE）即可擴展
%%  T2  SKILL_TAG_POOL = Tag Authority 組織作用域唯讀投影
%%  T3  ORG_ELIGIBLE_MEMBER_VIEW.skills{tagSlug→xp} 交叉快照
%%  T4  排班職能需求 = SK_SKILL_REQ × Tag Authority tagSlug
%%  T5  TAG_SNAPSHOT 消費方禁止寫入
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
%%  FIREBASE 隔離規則 [D24~D25]
%%  D24 feature slice / shared/types / app 層禁止直接 import firebase/*
%%      所有 Firebase SDK 呼叫必須透過 FIREBASE_ACL 對應 Adapter
%%      Adapter 路徑：src/shared/infra/{auth|firestore|messaging|storage}
%%  D25 新增 Firebase 功能必須在 FIREBASE_ACL 新增 Adapter 實作對應 SK_PORTS Port
%%  ╠══════════════════════════════════════════════════════════════════════════╣
%%  UNIFIED DEVELOPMENT RULES [D1~D25]
%%  ── 基礎路徑約束（D1~D12）──
%%  D1  事件傳遞只透過 infra.outbox-relay；domain slice 禁止直接 import infra.event-router
%%  D2  跨切片引用：import from '@/features/{slice}/index' only；_*.ts 為私有
%%  D3  所有 mutation：src/features/{slice}/_actions.ts only
%%  D4  所有 read：src/features/{slice}/_queries.ts only
%%  D5  src/app/ 與 UI 元件禁止 import src/shared/infra/firestore
%%  D6  "use client" 只在 _components/ 葉節點；layout/page server components 禁用
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
%%  ── 語義 Tag 守則（D21~D23）──
%%  D21 新增 tag 語義類別：必須在 CTA TAG_ENTITIES 定義，禁止各 slice 自行創建
%%  D22 跨切片 tag 語義引用：必須指向 TE1~TE6 實體節點，禁止隱式 tagSlug 字串引用
%%  D23 tag 語義標注格式：節點內 → tag::{category}；邊 → -.->|"{dim} tag 語義"|
%%  ╚══════════════════════════════════════════════════════════════════════════╝
