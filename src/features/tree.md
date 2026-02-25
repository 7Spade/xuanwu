src/
└── features/
    /* ==========================================================
       [VS0 / Core] 共享核心 (Shared Kernel)
       定義所有切片必須遵守的「法律」與「語言」
       ========================================================== */
    ├── shared.event-envelope          # 定義 TraceID [R8] 與 AggregateVersion [R7]
    ├── shared.tag-authority           # Tag Authority Center [VS0] 的權力定義
    ├── shared.constants               # 跨切片共用的狀態枚舉與錯誤代碼
    ├── shared.contract-interfaces     # 定義 CommandResult 與 QueryResult 格式

    /* ==========================================================
       [GW / Infra] 基礎設施與網關 (Building Blocks)
       系統的引擎：負責搬運 (Relay)、導航 (Router) 與急救 (DLQ)
       ========================================================== */
    ├── infra.gateway-command          # [GW] 統一指令入口、權限快照攔截
    ├── infra.gateway-query            # [GW] 統一查詢註冊表與分發
    ├── infra.outbox-relay             # [R1] 所有 OUTBOX 的掃描與投遞 Worker (CDC/Polling)
    ├── infra.event-router             # [IER] 事件路由中心，包含 CRITICAL_LANE 分流 [R2]
    ├── infra.dlq-manager              # [R5] DLQ 分級處理 (SAFE_AUTO / REVIEW_REQUIRED)
    ├── infra.observability            # [R8] TraceID 穿透追蹤、日誌彙總與 Metrics

    /* ==========================================================
       [VS1-VS3] 身份、帳號與錢包
       ========================================================== */
    ├── identity-account.auth          # [VS1] Token Refresh Handshake [R2]
    ├── account-user.profile           # 用戶基本資訊
    ├── account-user.skill             # 用戶個人能力標籤
    ├── account-user.wallet            # [VS2] 錢包、積分、支付流水
    ├── account-governance.policy      # [VS2] 治理策略定義

    /* ==========================================================
       [VS4] 組織與治理
       ========================================================== */
    ├── account-organization.core      # 組織基本 Aggregate
    ├── account-organization.skill-tag # [R3] 組織本地 Tag Pool 閉環
    ├── account-organization.member    # 成員管理
    ├── account-organization.policy    # 組織專屬政策
    ├── account-organization.team      # 團隊/部門結構

    /* ==========================================================
       [VS5-VS6] 工作區與排班 (核心業務邏輯)
       ========================================================== */
    ├── workspace-core.event-store     # [VS5] 專屬 Event Store
    ├── workspace-business.workflow    # [R6] Workflow 狀態機與狀態轉移限制
    ├── workspace-business.tasks       # [A3] Track A: 一般任務處理
    ├── workspace-business.issues      # [A3] Track B: 異常/議題處理
    ├── workspace-business.schedule    # 工作區內的排班逻辑
    ├── workspace-business.finance     # 工作區結算邏輯
    ├── workspace-governance.audit     # [R8] 業務審計日誌
    ├── scheduling-core.saga           # [VS6] 排班協作 Saga 協調器

    /* ==========================================================
       [VS8] 投影層 (Projections / Read Models)
       負責將分散的事件聚合成「好用的視圖」
       ========================================================== */
    ├── projection.event-funnel        # [VS8] 彙整所有切片事件進入投影流水線
    ├── projection.account-view        # 用戶視圖 (用於前端展示)
    ├── projection.organization-view   # 組織視圖
    ├── projection.workspace-view      # 工作區視圖
    ├── projection.org-eligible-member-view # [R7] 帶版本校驗的合規成員視圖
    ├── projection.tag-snapshot        # [R3] Tag 狀態快照供查詢使用

    /* ==========================================================
       [VS7] 通知交付
       ========================================================== */
    ├── account-user.notification      # 用戶通知設定
    └── notification-router.fcm        # [VS7] FCM 投遞、設備 Token 管理