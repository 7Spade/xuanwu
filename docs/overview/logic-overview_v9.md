---
title: Logic Overview v9 — Production-Ready Development Foundation
---

%% ==========================================================================
%% LOGIC OVERVIEW v9 · 生產就緒開發基礎（從「能跑」到「能維運、能安全擴展」）
%% ==========================================================================
%%
%% v8 → v9：八項生產就緒缺口修正
%%
%%  [R1] OUTBOX_RELAY_WORKER — 補全 OUTBOX 投遞機制
%%       問題：6 個 OUTBOX 定義了，但「誰讀取並投遞」完全缺失
%%             開發者不知道掃描策略（CDC/polling）、誰負責 retry、故障點在哪
%%       修正：新增共用 OUTBOX_RELAY_WORKER（Infra 層）
%%             掃描策略：Firestore onSnapshot（CDC）→ 投遞至 IER
%%             所有 OUTBOX 共享同一 Relay Worker，不重複建置
%%
%%  [R2] CRITICAL_LANE 語義修正 — Firebase 架構下不存在「同步」路徑
%%       問題：標示 SLA < 100ms / 同步快路徑，但 Firebase Functions 是異步
%%             ClaimsRefresh 本身是異步 I/O，根本無法同步
%%       修正：CRITICAL_LANE = 「高優先投遞 + 強制 Token Refresh Handshake」
%%             Claims 設定完成後 → 通知前端重取 Token → 下次 Request 帶新 Claims
%%             不再標示「同步」，改為「優先級最高的最終一致」
%%
%%  [R3] SKILL_TAG_POOL 更新路徑閉環
%%       問題：T2 標示被 TagLifecycleEvent 被動更新，但消費路徑在圖上斷開
%%             開發者不知道 SKILL_TAG_POOL 何時更新、由誰更新
%%       修正：IER BACKGROUND_LANE → VS4_TAG_SUBSCRIBER → SKILL_TAG_POOL
%%             明確標示 VS4 內部訂閱者負責消費 TagLifecycleEvent 更新本地 Pool
%%
%%  [R4] COMMAND_RESULT_CONTRACT — 補全 Command 結果回傳路徑
%%       問題：只有寫入路徑，前端不知道何時拿到結果、錯誤如何結構化回傳
%%       修正：新增 COMMAND_RESULT_CONTRACT：
%%             成功 → { aggregateId, version } 前端樂觀更新依據
%%             失敗 → DomainError { code, message, context } 結構化錯誤
%%             投影延遲 → 前端 OPTIMISTIC_UPDATE，IER 完成後靜默同步
%%
%%  [R5] DLQ 分級策略 — 防止高危事件自動 Replay
%%       問題：WalletDeducted 進 DLQ 後自動 Replay 可能雙重扣款
%%             DLQ_REPLAY 未區分安全等級
%%       修正：DLQ 三級策略：
%%             SAFE_AUTO：TagLifecycle・MemberJoined（冪等，自動重試）
%%             REVIEW_REQUIRED：WalletDeducted・ScheduleAssigned・RoleChanged（人工審查）
%%             SECURITY_BLOCK：ClaimsRefresh 失敗（安全事件，告警 + 凍結）
%%
%%  [R6] WORKFLOW_AGG State Contract — 補全狀態轉移 Guard
%%       問題：advanceStage/blockWorkflow/unblockWorkflow 無合法轉移定義
%%             開發者不知道哪些 Command 在哪些 Stage 合法
%%       修正：補充 WORKFLOW_STATE_CONTRACT：
%%             Stage：Draft→InProgress→QA→Acceptance→Finance→Completed
%%             blockWorkflow 可疊加（blockedBy: Set<issueId>）
%%             unblockWorkflow 前提：blockedBy.isEmpty()（所有 Issue resolved）
%%
%%  [R7] ELIGIBLE_UPDATE_GUARD — 防止時序競爭導致 eligible 狀態錯誤
%%       問題：ScheduleCompleted 先到、ScheduleAssigned 後到，eligible 會錯誤回到 false
%%             FUNNEL CRITICAL_PROJ_LANE 不保證事件按 aggregateVersion 順序處理
%%       修正：ORG_ELIGIBLE_VIEW 更新規則：
%%             event.aggregateVersion > view.lastProcessedVersion → 允許更新
%%             否則 → 丟棄（過期事件，不覆蓋新狀態）
%%             補充不變量 #19：eligible 更新必須以 aggregateVersion 單調遞增為前提
%%
%%  [R8] TRACE_PROPAGATION_RULE — TraceID 穿透整條事件鏈
%%       問題：TraceID 注入於 CBG_ENTRY，但事件鏈（IER/FUNNEL/FCM）無傳播規則
%%             排班失敗的 FCM 無法關聯到原始 Command，無法 End-to-End 追蹤
%%       修正：event-envelope.traceId = 原始 Command 的 traceId（整鏈共享）
%%             補充傳播規則：
%%             IER 投遞時：保留 envelope.traceId，不覆蓋
%%             FUNNEL 消費時：從 envelope 讀取 traceId，注入 VS9 DOMAIN_METRICS
%%             FCM 推播時：帶 traceId 至推播 metadata（可對應 FCM delivery receipt）
%%
%% ─────────────────────────────────────────────────────────────────────
%% 完整優化累積索引（v4~v9）：
%%   E1~E6 : v6 邊界修正
%%   T1~T5 : Tag Authority 擴展規則
%%   P1~P7 : v7 深層效率修正
%%   Q1~Q8 : v8 開發基礎現代化
%%   R1~R8 : v9 生產就緒缺口修正（本版本）
%% ─────────────────────────────────────────────────────────────────────
%% 閱讀順序：
%%   VS0) Shared Kernel + Tag Authority Center  ← [R2][R8]
%%   VS1) Identity Slice                        ← [R2] Token Refresh Handshake
%%   VS2) Account Slice                         ← [R5] DLQ 分級
%%   VS3) Skill XP Slice
%%   VS4) Organization Slice                    ← [R3] SKILL_TAG_POOL 閉環
%%   VS5) Workspace Slice                       ← [R4][R6]
%%   VS6) Scheduling Slice                      ← [R7]
%%   VS7) Notification Slice                    ← [R8] TraceID FCM
%%   GW)  三閘道統一出入口                       ← [R1][R4][R5]
%%   VS8) Projection Bus                        ← [R7][R8]
%%   VS9) Observability                         ← [R8]
%% ==========================================================================

flowchart TD

%% ==========================================================================
%% VS0) SHARED KERNEL + TAG AUTHORITY CENTER
%% [R2] CRITICAL_LANE 語義修正：移除「同步」，改為「高優先 + Token Refresh Handshake」
%% [R8] TRACE_PROPAGATION_RULE 加入 SK_ENV 契約
%% Q2/Q3/Q6 沿用 v8
%% ==========================================================================

subgraph SK["🔷 VS0 · Shared Kernel + Tag Authority Center"]
    direction TB

    subgraph SK_CONTRACTS["📄 跨切片顯式契約 #8"]
        direction LR
        SK_ENV["event-envelope [Q3][R8]\n─────────────────\nversion\ntraceId  ← 原始 Command TraceID [R8]\n           整條事件鏈共享，不覆蓋\ntimestamp\nidempotency-key = eventId+aggId+version\n─────────────────\n所有 DomainEvent 必須遵循\nFUNNEL/IER 消費時從 envelope 讀 traceId"]
        SK_AUTH_SNAP["authority-snapshot\n權限快照契約\nclaims / roles / scopes\nTTL = Token 有效期 [Q4]"]
        SK_SKILL_TIER["skill-tier\ngetTier(xp)→Tier\n純函式・永不存 DB #12"]
        SK_SKILL_REQ["skill-requirement\n跨片人力需求契約\ntagSlug × minXp"]
        SK_CMD_RESULT["command-result-contract [R4]\nCommandSuccess:\n  { aggregateId, version }\n  前端樂觀更新依據\nCommandFailure:\n  DomainError { code, message, context }\n  結構化錯誤回傳"]
    end

    subgraph SK_TAG_AUTH["🏷 Tag Authority Center · 唯一權威 #A6 #17"]
        direction LR
        CTA["centralized-tag.aggregate\n【全域語義字典主數據】\ntagSlug / label / category\ndeprecatedAt / deleteRule"]
        TAG_EVENTS["TagLifecycleEvent\n(in-process)"]
        TAG_OUTBOX["tag-outbox [Q2]\nat-least-once 保證"]
        TAG_READONLY["🔒 唯讀引用規則\nT1：新切片訂閱事件即可擴展"]
        TAG_STALE_GUARD["⚠ TAG_STALE_GUARD [Q6]\nMax Staleness ≤ 30s\n配對前校驗 tagSlug 新鮮度\nDeprecated → StaleTagWarning"]

        CTA -->|"標籤異動廣播"| TAG_EVENTS
        TAG_EVENTS -->|pending| TAG_OUTBOX
        CTA -.->|"唯讀引用契約"| TAG_READONLY
        CTA -.->|"Deprecated 通知"| TAG_STALE_GUARD
    end
end

TAG_OUTBOX -->|"BACKGROUND_LANE [Q2]"| IER

%% ==========================================================================
%% VS1) IDENTITY SLICE — 身份驗證切片
%% [R2] Token Refresh Handshake：
%%      Claims 設定完成後 → TOKEN_REFRESH_SIGNAL → 前端強制重取 Token
%%      CRITICAL_LANE 不再是「同步」，而是「高優先 + 強制客端刷新」
%% Q4 CONTEXT_LIFECYCLE_MANAGER 沿用 v8
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
            ACTIVE_CTX["active-account-context\nTTL = Token 有效期"]
            CTX_LIFECYCLE["context-lifecycle-manager\n建立：Login\n刷新：OrgSwitched / WorkspaceSwitched\n失效：TokenExpired / Logout\n衝突時以 ACTIVE_CTX 為準 [Q4]"]
            CTX_LIFECYCLE -->|"建立/刷新/失效"| ACTIVE_CTX
        end
    end

    subgraph VS1_CLAIMS["📤 Claims Management [E6][R2]"]
        CLAIMS_HANDLER["claims-refresh-handler\n單一刷新觸發點 [E6]\n登入簽發\nRoleChanged → IER → 此處重簽"]
        CUSTOM_CLAIMS["custom-claims\n快照聲明 #5\nTTL = Token 有效期"]
        TOKEN_REFRESH_SIGNAL["token-refresh-signal [R2]\nClaims 設定完成後發出\n→ 通知前端重取 Token\n前端下次 Request 帶新 Claims\n語義：高優先最終一致\n（非同步，Firebase 架構限制）"]
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
%% [R5] DLQ 分級：WalletDeducted 標示 REVIEW_REQUIRED
%% Q8 WALLET → CRITICAL_LANE 沿用 v8
%% ==========================================================================

subgraph VS2["🟩 VS2 · Account Slice（帳號主體）"]
    direction TB

    subgraph VS2_USER["👤 個人帳號域"]
        USER_AGG["user-account\naggregate"]
        WALLET_AGG["account-user.wallet.aggregate\n強一致帳本 / 餘額不變量 #A1\nSTRONG_READ：精確交易回源此 AGG [Q8]"]
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

    subgraph VS2_EVENT["📢 Account Events + Outbox [P7][Q8][R5]"]
        ACC_EVENT_BUS["account-event-bus\nAccountCreated\nRoleChanged / PolicyChanged\nWalletDeducted / WalletCredited [Q8]\n(in-process)"]
        ACC_OUTBOX["acc-outbox\nat-least-once 保證\nWallet/Role/Policy → CRITICAL [Q8]\n其餘 → STANDARD\n⚠ WalletDeducted → DLQ REVIEW_REQUIRED [R5]"]
        ACC_EVENT_BUS -->|pending| ACC_OUTBOX
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
ORG_ACC_BINDING -.->|"ACL #A2"| ORG_AGG
ACC_EVENT_BUS -.->|"事件契約 + idempotency-key + traceId [Q3][R8]"| SK_ENV
ACC_OUTBOX -->|"CRITICAL_LANE: Role/Policy/Wallet"| IER
ACC_OUTBOX -->|"STANDARD_LANE: AccountCreated"| IER

%% ==========================================================================
%% VS3) SKILL XP SLICE — 能力成長切片
%% Q1 SKILL_OUTBOX 沿用 v8
%% #11 #12 #13 不變量
%% ==========================================================================

subgraph VS3["🟩 VS3 · Skill XP Slice（能力成長）"]
    direction TB

    subgraph VS3_DOMAIN["⚙ Skill Domain"]
        SKILL_AGG["account-skill.aggregate\naccountId / skillId(→tagSlug)\nxp / version"]
        XP_LEDGER[("account-skill-xp-ledger\nentryId / delta / reason\nsourceId / timestamp #13")]
    end

    subgraph VS3_EVENT["📢 Skill Events + Outbox [Q1]"]
        SKILL_EVENTS["SkillXpAdded / SkillXpDeducted\n（含 tagSlug 語義）\n(in-process)"]
        SKILL_OUTBOX["skill-outbox [Q1]\nat-least-once 保證\n→ IER STANDARD_LANE"]
        SKILL_EVENTS --> SKILL_OUTBOX
    end

    SKILL_AGG -->|"#13 異動必寫 Ledger"| XP_LEDGER
    SKILL_AGG --> SKILL_EVENTS
end

SKILL_AGG -.->|"tagSlug 唯讀引用"| TAG_READONLY
SKILL_EVENTS -.->|"事件契約 + idempotency-key + traceId [R8]"| SK_ENV
SKILL_EVENTS -.->|"tier 推導契約"| SK_SKILL_TIER
SKILL_OUTBOX -->|"STANDARD_LANE [Q1]"| IER

%% ==========================================================================
%% VS4) ORGANIZATION SLICE — 組織治理切片
%% [R3] SKILL_TAG_POOL 更新路徑閉環
%%      VS4_TAG_SUBSCRIBER：訂閱 IER BACKGROUND_LANE TagLifecycleEvent
%%      → 切片內部更新 SKILL_TAG_POOL（明確消費責任歸屬）
%% P2 ORG_EVENT_BUS 純 Producer-only 沿用 v7
%% P7 ORG_OUTBOX 沿用 v7
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

    subgraph VS4_TAG_VIEW["🏷 Tag 組織作用域 [R3]"]
        VS4_TAG_SUBSCRIBER["tag-lifecycle-subscriber [R3]\n訂閱 IER BACKGROUND_LANE\nTagLifecycleEvent\n責任：更新本地 SKILL_TAG_POOL\n（切片內部消費，不穿透邊界）"]
        SKILL_TAG_POOL[("職能標籤庫\nTag Authority 組織作用域快照\n由 VS4_TAG_SUBSCRIBER 更新 [R3]\nMax Staleness ≤ 30s [Q6]")]
        TALENT_REPO[["人力資源池 #16\nMember + Partner + Team\n→ ORG_ELIGIBLE_MEMBER_VIEW"]]
        VS4_TAG_SUBSCRIBER -->|"TagLifecycleEvent 更新"| SKILL_TAG_POOL
    end

    subgraph VS4_EVENT["📢 Org Events + Outbox [P2][P7]"]
        ORG_EVENT_BUS["organization-core.event-bus\n【純 Producer-only P2】\nOrgContextProvisioned\nMemberJoined / MemberLeft\nSkillRecognitionGranted/Revoked\nPolicyChanged\n(in-process)"]
        ORG_OUTBOX["org-outbox [P7]\nat-least-once 保證"]
        ORG_EVENT_BUS -->|pending| ORG_OUTBOX
    end

    ORG_AGG --> ORG_EVENT_BUS
    ORG_POLICY --> ORG_EVENT_BUS
    ORG_MEMBER & ORG_PARTNER & ORG_TEAM --> TALENT_REPO
    ORG_SKILL_RECOG --> ORG_EVENT_BUS
    TALENT_REPO -.->|人力來源| SKILL_TAG_POOL
end

ORG_AGG & ORG_MEMBER & ORG_PARTNER -.->|"tagSlug 唯讀引用"| TAG_READONLY
ORG_EVENT_BUS -.->|"事件契約 [R8]"| SK_ENV
ORG_OUTBOX -->|"CRITICAL_LANE: OrgContextProvisioned"| IER
ORG_OUTBOX -->|"STANDARD_LANE: MemberJoined/Left"| IER
IER -.->|"BACKGROUND_LANE: TagLifecycleEvent [R3]"| VS4_TAG_SUBSCRIBER

%% ==========================================================================
%% VS5) WORKSPACE SLICE — 工作區業務切片
%% [R4] COMMAND_RESULT_CONTRACT：
%%      CBG_ROUTE → Command Handler 執行完成後返回 SK_CMD_RESULT
%%      前端接收 { aggregateId, version } 啟動 OPTIMISTIC_UPDATE
%% [R6] WORKFLOW_STATE_CONTRACT 補全
%%      Stage 合法轉移 + blockWorkflow 疊加規則 + unblockWorkflow 前提
%% E2/E5/P4/Q5 沿用 v8
%% ==========================================================================

subgraph VS5["🟣 VS5 · Workspace Slice（工作區業務）"]
    direction TB

    subgraph VS5_ACL["🔌 ACL 防腐層 [E2]"]
        ORG_CONTEXT_ACL["org-context.acl\nIER → OrgContextProvisioned\n→ Workspace 本地 Context #10"]
    end

    subgraph VS5_APP["⚙ Application Coordinator（#3）"]
        direction LR
        WS_CMD_HANDLER["command-handler\n指令處理器\n執行完成 → SK_CMD_RESULT [R4]"]
        WS_SCOPE_GUARD["scope-guard #A9"]
        WS_POLICY_ENG["policy-engine"]
        WS_TX_RUNNER["transaction-runner\n#A8 1cmd/1agg"]
        WS_OUTBOX["ws-outbox\n唯一 IER 投遞來源 [E5]"]
    end

    subgraph VS5_CORE["⚙ Workspace Core Domain"]
        WS_AGG["workspace-core.aggregate"]
        WS_EVENT_BUS["workspace-core.event-bus\n【in-process only E5】"]
        WS_EVENT_STORE["workspace-core.event-store\n僅重播/稽核 #9"]
        WS_SETTINGS["workspace-core.settings"]
    end

    subgraph VS5_GOV["🛡 Workspace Governance [P4][Q5]"]
        WS_ROLE["workspace-governance.role\n繼承 org-governance.policy #18"]
        WS_POLICY_CHECK["policy-eligible-check [P4]\nvia Query Gateway"]
        WS_AUDIT["workspace-governance.audit"]
        AUDIT_COLLECTOR["audit-event-collector [Q5]\n訂閱 IER BACKGROUND_LANE\n→ GLOBAL_AUDIT_VIEW"]
        WS_ROLE -.->|"#18 eligible 查詢"| WS_POLICY_CHECK
        WS_AUDIT -.->|"Workspace 內部稽核"| WS_EVENT_STORE
    end

    subgraph VS5_BIZ["⚙ Business Domain（A+B 雙軌）"]
        direction TB

        subgraph VS5_PARSE["📄 文件解析閉環"]
            W_FILES["workspace-business.files"]
            W_PARSER["document-parser"]
            PARSING_INTENT[("ParsingIntent\nDigital Twin #A4")]
        end

        subgraph VS5_WF["⚙ Workflow State Machine [R6]"]
            WORKFLOW_AGG["workflow.aggregate\n─── STATE CONTRACT [R6] ───\nStage:\n  Draft→InProgress→QA\n  →Acceptance→Finance→Completed\nblockWorkflow:\n  blockedBy: Set‹issueId›（可疊加）\nunblockWorkflow:\n  前提：blockedBy.isEmpty()\n  （所有 Issue resolved 才解鎖）\n#A3"]
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
IER -.->|"BACKGROUND: 跨片稽核 [Q5]"| AUDIT_COLLECTOR
W_B_SCHEDULE -.->|"tagSlug T4"| TAG_READONLY
W_B_SCHEDULE -.->|"人力需求契約"| SK_SKILL_REQ
WS_EVENT_BUS -.->|"事件契約 + traceId [R8]"| SK_ENV
WS_OUTBOX -->|"STANDARD_LANE [E5]"| IER
WS_POLICY_CHECK -.->|"policy eligible-check [P4]"| QGWAY_SCHED
WS_CMD_HANDLER -.->|"執行結果 [R4]"| SK_CMD_RESULT

%% ==========================================================================
%% VS6) SCHEDULING SLICE — 排班協作切片
%% [R7] ELIGIBLE_UPDATE_GUARD：防止時序競爭
%%      ORG_SCHEDULE 發出事件帶 aggregateVersion
%%      ORG_ELIGIBLE_VIEW 消費時檢查 version 單調遞增
%% P3/P7 SCHED_OUTBOX 沿用 v8
%% ==========================================================================

subgraph VS6["🟨 VS6 · Scheduling Slice（排班協作）"]
    direction TB

    subgraph VS6_DOMAIN["⚙ Schedule Domain"]
        ORG_SCHEDULE["account-organization.schedule\nHR Scheduling (tagSlug T4)\n[Q6] 配對前 TAG_STALE_GUARD 校驗\n[R7] 事件帶 aggregateVersion\n       供 ELIGIBLE_UPDATE_GUARD 使用"]
    end

    subgraph VS6_SAGA["⚙ Scheduling Saga（#A5）"]
        SCHEDULE_SAGA["scheduling-saga\nScheduleAssignRejected\nScheduleProposalCancelled\n⚠ DLQ → REVIEW_REQUIRED [R5]"]
    end

    subgraph VS6_OUTBOX["📤 Schedule Outbox [P3][P7]"]
        SCHED_OUTBOX["sched-outbox\nat-least-once 保證"]
    end

    ORG_SCHEDULE -.->|"#14 只讀 eligible=true"| QGWAY_SCHED
    ORG_SCHEDULE -.->|"tagSlug 新鮮度校驗 [Q6]"| TAG_STALE_GUARD
    ORG_SCHEDULE -->|"ScheduleAssigned + aggregateVersion [R7]"| SCHED_OUTBOX
    ORG_SCHEDULE -.->|"人力需求契約"| SK_SKILL_REQ
    ORG_SCHEDULE -.->|"tagSlug 唯讀"| TAG_READONLY
    SCHEDULE_SAGA -->|"compensating event"| SCHED_OUTBOX
end

IER -.->|"ScheduleProposed #A5"| ORG_SCHEDULE
SCHED_OUTBOX -->|"STANDARD_LANE [P3]"| IER

%% ==========================================================================
%% VS7) NOTIFICATION SLICE — 通知交付切片
%% [R8] FCM 推播帶 traceId metadata，可對應 FCM delivery receipt
%% E3 IER → NOTIF_ROUTER 沿用 v8
%% ==========================================================================

subgraph VS7["🩷 VS7 · Notification Slice（通知交付）"]
    direction TB

    subgraph VS7_ROUTE["⚙ Notification Router（無狀態 #A10）"]
        NOTIF_ROUTER["account-governance\n.notification-router\n消費 IER STANDARD_LANE\nScheduleAssigned [E3]\n從 envelope 讀取 traceId [R8]"]
    end

    subgraph VS7_DELIVER["📤 Delivery"]
        USER_NOTIF["account-user.notification\n個人推播"]
        FCM[["Firebase Cloud Messaging\n推播帶 traceId metadata [R8]\n可對應 FCM delivery receipt"]]
        USER_DEVICE["使用者裝置"]
    end

    NOTIF_ROUTER -->|TargetAccountID 匹配| USER_NOTIF
    PROFILE -.->|"FCM Token（唯讀）"| USER_NOTIF
    USER_NOTIF -.->|"#6 投影"| QGWAY_NOTIF
    USER_NOTIF --> FCM --> USER_DEVICE
end

%% ==========================================================================
%% GW) 三閘道統一出入口（CQRS Gateway Layer）
%% [R1] OUTBOX_RELAY_WORKER — 所有 OUTBOX 共用 Relay Worker
%%      掃描策略：Firestore onSnapshot（CDC）
%%      投遞失敗 → retry with backoff → 3 次後 → DLQ
%% [R2] CRITICAL_LANE 語義修正：高優先最終一致 + Token Refresh Handshake
%% [R4] COMMAND_RESULT_CONTRACT 回傳路徑
%% [R5] DLQ 三級分類策略
%% [R8] TraceID 穿透規則標示
%%
%% ══ IER 完整路由規則表（v9 最終版）══
%%  CRITICAL_LANE（高優先最終一致 [R2]）：
%%    RoleChanged/PolicyChanged     → CLAIMS_HANDLER + TOKEN_REFRESH [E6][R2]
%%    WalletDeducted/WalletCredited → FUNNEL CRITICAL_PROJ [Q8]
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

    subgraph GW_RELAY["⚙ OUTBOX Relay Worker [R1]"]
        OUTBOX_RELAY["outbox-relay-worker [R1]\n【共用 Infra 組件・所有 OUTBOX 共享】\n掃描策略：Firestore onSnapshot (CDC)\n投遞：OUTBOX → IER 對應 Lane\n失敗處理：\n  retry with exponential backoff\n  3 次失敗 → DLQ（帶 DLQ 分級標記）\n監控：relay_lag / relay_error_rate → VS9"]
    end

    subgraph GW_GUARD["🛡 入口前置保護層 [Q7]"]
        direction LR
        RATE_LIMITER["rate-limiter\nper user / per org\n429 + retry-after"]
        CIRCUIT_BREAKER["circuit-breaker\n切片故障快速失敗\n半開探針恢復"]
        BULKHEAD_ROUTER["bulkhead-router\n切片隔板\n獨立執行緒池"]
        RATE_LIMITER --> CIRCUIT_BREAKER --> BULKHEAD_ROUTER
    end

    subgraph GW_CMD["🔵 Command Bus Gateway（統一寫入入口）"]
        direction LR
        CBG_ENTRY["unified-command-gateway\nTraceID 注入 [E4][R8]\n→ 寫入 event-envelope.traceId\n唯一入口"]
        CBG_AUTH["universal-authority-interceptor\nAuthoritySnapshot #A9\n衝突以 ACTIVE_CTX 為準 [Q4]"]
        CBG_ROUTE["command-router\n路由至對應切片\n結果回傳 SK_CMD_RESULT [R4]"]
        CBG_ENTRY --> CBG_AUTH --> CBG_ROUTE
        CBG_AUTH -.->|"高風險二次確認 #A9"| SKILL_AGG
        CBG_AUTH -.->|"高風險二次確認 #A9"| ORG_AGG
        WS_SCOPE_GUARD -.->|"高風險二次確認 #A9"| WS_AGG
    end

    subgraph GW_EVENT["🟠 Integration Event Router [P1][P6][R2]"]
        direction TB
        IER[["integration-event-router\n統一事件出口 #9\n傳播規則 [R8]：\n  保留 envelope.traceId，禁止覆蓋\n  FUNNEL/消費方從 envelope 讀取"]]

        subgraph IER_LANES["優先級三道分層 [P1][R2]"]
            direction LR
            CRITICAL_LANE["🔴 CRITICAL_LANE [R2]\n高優先最終一致\n（非同步，Firebase 架構限制）\n+ Token Refresh Handshake\nSLA 目標：盡快投遞"]
            STANDARD_LANE["🟡 STANDARD_LANE\nSLA < 2s"]
            BACKGROUND_LANE["⚪ BACKGROUND_LANE\nSLA < 30s"]
        end

        subgraph DLQ_SYSTEM["💀 DLQ 三級分類系統 [R5]"]
            DLQ["dead-letter-queue\n失敗 3 次後收容\n帶分級標記入隊"]
            DLQ_SAFE["🟢 SAFE_AUTO\nTagLifecycle・MemberJoined\n冪等・自動重試"]
            DLQ_REVIEW["🟡 REVIEW_REQUIRED\nWalletDeducted・ScheduleAssigned\nRoleChanged\n人工審查後重試"]
            DLQ_BLOCK["🔴 SECURITY_BLOCK\nClaimsRefresh 失敗\n安全事件\n告警 + 凍結 + 人工確認"]
            DLQ --> DLQ_SAFE & DLQ_REVIEW & DLQ_BLOCK
            DLQ_SAFE -.->|"自動 Replay（保留 idempotency-key）"| IER
            DLQ_REVIEW -.->|"人工確認後 Replay"| IER
            DLQ_BLOCK -.->|"告警 → DOMAIN_ERRORS + 凍結"| DOMAIN_ERRORS
        end

        IER --> IER_LANES
        IER_LANES -.->|"投遞失敗 3 次"| DLQ
    end

    subgraph GW_QUERY["🟢 Query Gateway（統一讀取入口）"]
        direction TB
        QGWAY["read-model-registry\n統一讀取入口\n版本對照 / 快照路由"]
        QGWAY_SCHED["→ .org-eligible-member-view\n#14 #15 #16 [P4][R7]"]
        QGWAY_NOTIF["→ .account-view\n#6 FCM Token"]
        QGWAY_SCOPE["→ .workspace-scope-guard-view\n#A9"]
        QGWAY_WALLET["→ .wallet-balance\nSTRONG_READ 回源 WALLET_AGG [Q8]"]
        QGWAY --> QGWAY_SCHED & QGWAY_NOTIF & QGWAY_SCOPE & QGWAY_WALLET
    end

    BULKHEAD_ROUTER --> CBG_ENTRY
    OUTBOX_RELAY -.->|"掃描所有 OUTBOX → 投遞"| IER
    CBG_ROUTE -->|"Workspace Command"| WS_CMD_HANDLER
    CBG_ROUTE -->|"Skill Command"| SKILL_AGG
    CBG_ROUTE -->|"Org Command"| ORG_AGG
    CBG_ROUTE -->|"Account Command"| USER_AGG
    ACTIVE_CTX -->|"查詢鍵 [Q4]"| QGWAY_SCOPE
    QGWAY_SCOPE --> CBG_AUTH
end

SERVER_ACTIONS["_actions.ts\n統一觸發入口"]
SERVER_ACTIONS --> RATE_LIMITER

IER -.->|"CRITICAL: RoleChanged/PolicyChanged [E6]"| CLAIMS_HANDLER
IER -.->|"STANDARD: ScheduleAssigned [E3]"| NOTIF_ROUTER
IER -.->|"CRITICAL: OrgContextProvisioned [E2]"| ORG_CONTEXT_ACL

%% OUTBOX → RELAY → IER（所有切片統一路徑 R1）
ACC_OUTBOX & ORG_OUTBOX & SCHED_OUTBOX & SKILL_OUTBOX & TAG_OUTBOX & WS_OUTBOX -.->|"被 OUTBOX_RELAY 掃描 [R1]"| OUTBOX_RELAY

%% ==========================================================================
%% VS8) PROJECTION BUS — 事件投影總線
%% [R7] ELIGIBLE_UPDATE_GUARD：單調遞增 aggregateVersion 保護
%%      event.aggregateVersion > view.lastProcessedVersion → 允許更新
%%      否則丟棄（過期事件不覆蓋新狀態）
%% [R8] FUNNEL 從 envelope 讀取 traceId，注入 DOMAIN_METRICS
%% Q3/Q5/Q8/P5 沿用 v8
%% ==========================================================================

subgraph VS8["🟡 VS8 · Projection Bus（事件投影總線）"]
    direction TB

    subgraph VS8_FUNNEL["▶ Event Funnel [P5][Q3][R8]"]
        direction LR
        FUNNEL[["event-funnel\n#9 唯一 Projection 寫入路徑\n[Q3] upsert by idempotency-key\n[R8] 從 envelope 讀取 traceId\n      注入 DOMAIN_METRICS（End-to-End 追蹤）"]]
        CRITICAL_PROJ_LANE["🔴 CRITICAL_PROJ_LANE [P5]\nSLA < 500ms\n獨立重試 / dead-letter"]
        STANDARD_PROJ_LANE["⚪ STANDARD_PROJ_LANE [P5]\nSLA < 10s\n獨立重試 / dead-letter"]
        FUNNEL --> CRITICAL_PROJ_LANE & STANDARD_PROJ_LANE
    end

    subgraph VS8_META["⚙ Stream Version & Registry"]
        PROJ_VER["projection.version\n事件串流偏移量"]
        READ_REG["read-model-registry"]
    end

    subgraph VS8_CRITICAL_VIEWS["🔴 Critical Projections [P5][Q8][R7]"]
        WS_SCOPE_VIEW["projection\n.workspace-scope-guard-view\n授權路徑 #A9"]
        ORG_ELIGIBLE_VIEW["projection\n.org-eligible-member-view\n[R7] ELIGIBLE_UPDATE_GUARD\n─────────────────────\n更新規則：\n  event.aggregateVersion\n  > view.lastProcessedVersion\n  → 允許更新\n  否則 → 丟棄（過期事件）\n─────────────────────\nskills{tagSlug→xp} / eligible\n#14 #15 #16 T3"]
        WALLET_PROJ["projection\n.wallet-balance\nCRITICAL 通道 [Q8]\n一般顯示用\n精確交易 → STRONG_READ"]
        TIER_FN[["getTier(xp) → Tier\n純函式 #12"]]
    end

    subgraph VS8_STANDARD_VIEWS["⚪ Standard Projections [P5]"]
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
            SKILL_VIEW["projection.account-skill-view\n[Q3] upsert by idempotency-key"]
        end

        subgraph VS8_AUDIT_VIEW["Global Audit View [Q5][R8]"]
            GLOBAL_AUDIT_VIEW["projection.global-audit-view\n跨片完整稽核\n[R8] 每條記錄含 traceId\n      可追蹤至原始 Command"]
        end

        subgraph VS8_TAG_VIEW["Tag View（BACKGROUND T5）"]
            TAG_SNAPSHOT["projection.tag-snapshot\nMax Staleness ≤ 30s [Q6]\nT5 消費方禁止寫入"]
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
%% [R8] End-to-End TraceID 完整追蹤：
%%      Command → OUTBOX → IER → FUNNEL → Read Model → FCM
%%      每個環節都從 event-envelope.traceId 讀取，注入 DOMAIN_METRICS
%% [R1] OUTBOX_RELAY Metrics
%% Q7/P6 沿用 v8
%% ==========================================================================

subgraph VS9["⬜ VS9 · Observability（橫切面）"]
    direction LR
    TRACE_ID["trace-identifier [E4][R8]\nCBG_ENTRY 注入 TraceID\n整條事件鏈共享\n傳播規則：envelope.traceId 不覆蓋"]
    DOMAIN_METRICS["domain-metrics [R8]\nIER 各 Lane Throughput/Latency\nFUNNEL 各 Lane 處理時間\nOUTBOX_RELAY lag [R1]\nRATELIMIT hit / CIRCUIT open [Q7]\nEnd-to-End TraceID 追蹤鏈"]
    DOMAIN_ERRORS["domain-error-log\nWS_TX_RUNNER\nSCHEDULE_SAGA\nDLQ 告警 [P6]\nDLQ_BLOCK 安全事件 [R5]\nStaleTagWarning [Q6]"]
end

CBG_ENTRY --> TRACE_ID
IER --> DOMAIN_METRICS
FUNNEL --> DOMAIN_METRICS
OUTBOX_RELAY -.->|"relay_lag metrics [R1]"| DOMAIN_METRICS
RATE_LIMITER -.->|"hit metrics"| DOMAIN_METRICS
CIRCUIT_BREAKER -.->|"open/half-open"| DOMAIN_METRICS
WS_TX_RUNNER --> DOMAIN_ERRORS
SCHEDULE_SAGA --> DOMAIN_ERRORS
DLQ_BLOCK -.->|"安全告警 [R5]"| DOMAIN_ERRORS
TAG_STALE_GUARD -.->|"StaleTagWarning [Q6]"| DOMAIN_ERRORS
TOKEN_REFRESH_SIGNAL -.->|"刷新失敗告警 [R2]"| DOMAIN_ERRORS

%% ==========================================================================
%% CONSISTENCY INVARIANTS 完整索引（含 v9 新增）
%% ==========================================================================
%% #1  每個 BC 只能修改自己的 Aggregate
%% #2  跨 BC 僅能透過 Event/Projection/ACL 溝通
%% #3  Application Layer 只協調，不承載領域規則
%% #4  Domain Event 僅由 Aggregate 產生；TX Runner 只投遞 Outbox
%% #5  Custom Claims 只做快照，非真實權限來源
%% #6  Notification 只讀 Projection
%% #7  Scope Guard 僅讀本 Context Read Model
%% #8  Shared Kernel 必須顯式標示
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
%% #19 ORG_ELIGIBLE_VIEW 更新必須以 aggregateVersion 單調遞增為前提 [R7 新增]
%% ==========================================================================
%% ATOMICITY AUDIT 完整索引
%% ==========================================================================
%% #A1  wallet 強一致；profile/notification 弱一致
%% #A2  org-account.binding 只 ACL/projection 防腐對接
%% #A3  blockWorkflow → blockedBy Set；allIssuesResolved → unblockWorkflow [R6]
%% #A4  ParsingIntent 只允許提議事件
%% #A5  schedule 跨 BC saga/compensating event
%% #A6  CENTRALIZED_TAG_AGGREGATE 語義唯一權威
%% #A7  Event Funnel 只做 compose
%% #A8  TX Runner 1cmd/1agg 原子提交
%% #A9  Scope Guard 快路徑；高風險回源 aggregate
%% #A10 Notification Router 無狀態路由
%% #A11 eligible = 「無衝突排班」快照，非靜態狀態
%% ==========================================================================
%% TAG AUTHORITY 擴展規則
%% T1  新切片訂閱 TagLifecycleEvent（BACKGROUND_LANE）即可擴展
%% T2  SKILL_TAG_POOL = Tag Authority 組織作用域唯讀投影，由 VS4_TAG_SUBSCRIBER 更新 [R3]
%% T3  ORG_ELIGIBLE_MEMBER_VIEW.skills{tagSlug→xp} 交叉快照
%% T4  排班職能需求 = SK_SKILL_REQ × Tag Authority tagSlug
%% T5  TAG_SNAPSHOT 消費方禁止寫入
%% ==========================================================================
%% v6 E1~E6 / v7 P1~P7 / v8 Q1~Q8（沿用，詳見各版本）
%% ==========================================================================
%% v9 生產就緒修正索引
%% R1  OUTBOX_RELAY_WORKER：共用 CDC Relay，補全所有 OUTBOX 投遞機制
%% R2  CRITICAL_LANE 語義修正：高優先最終一致 + Token Refresh Handshake（非同步）
%% R3  VS4_TAG_SUBSCRIBER：明確 SKILL_TAG_POOL 更新責任，閉合 T2 消費路徑
%% R4  COMMAND_RESULT_CONTRACT：{ aggregateId, version } + DomainError 結構化回傳
%% R5  DLQ 三級分類：SAFE_AUTO / REVIEW_REQUIRED / SECURITY_BLOCK
%% R6  WORKFLOW_STATE_CONTRACT：Stage 合法轉移 + blockedBy Set + unblockWorkflow 前提
%% R7  ELIGIBLE_UPDATE_GUARD：aggregateVersion 單調遞增防時序競爭（不變量 #19）
%% R8  TRACE_PROPAGATION_RULE：event-envelope.traceId 整鏈共享，不覆蓋，FCM 帶 metadata
%% ==========================================================================
%% ── v9 統一開發守則（D1~D8 沿用 v8，新增 D9~D12）──
%% D1  事件輸出：Aggregate → EventBus(in-process) → OUTBOX → RELAY → IER（禁直連）
%% D2  所有 event-envelope 含 idempotency-key；FUNNEL upsert by key
%% D3  IER 路由規則變更必須同步更新 GW 區段路由表
%% D4  新切片上線 checklist（同 v8）
%% D5  wallet-balance：顯示用 → Projection；交易用 → STRONG_READ 回源
%% D6  排班/技能配對前呼叫 TAG_STALE_GUARD 校驗
%% D7  ACTIVE_CTX TTL 與 Token 同步；切換觸發 CTX_LIFECYCLE 重建
%% D8  DLQ Replay 保留原始 idempotency-key，不重新生成
%% D9  所有 event-envelope.traceId = 原始 Command TraceID；禁止在 IER/FUNNEL 覆蓋 [R8]
%% D10 WORKFLOW_AGG Command 執行前必須驗證當前 Stage 合法性；
%%     blockWorkflow 使用 blockedBy.add(issueId)；
%%     unblockWorkflow 使用 blockedBy.delete(issueId)，isEmpty() 才真正解鎖 [R6]
%% D11 ORG_ELIGIBLE_VIEW 寫入必須先比對 aggregateVersion，過期事件直接丟棄 [R7]
%% D12 DLQ 處理分級：SAFE_AUTO 自動，REVIEW_REQUIRED 需人工，SECURITY_BLOCK 需安全審查 [R5]
%% ==========================================================================

%% ==========================================================================
%% STYLES
%% ==========================================================================
classDef sk fill:#ecfeff,stroke:#22d3ee,color:#000,font-weight:bold
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
classDef walletProj fill:#fdf4ff,stroke:#9333ea,color:#000,font-weight:bold
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

class SK,SK_ENV,SK_AUTH_SNAP,SK_SKILL_TIER,SK_SKILL_REQ sk
class SK_CMD_RESULT cmdResult
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
class GW_GUARD,RATE_LIMITER,CIRCUIT_BREAKER,BULKHEAD_ROUTER guardLayer
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
