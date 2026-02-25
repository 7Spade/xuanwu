src/
└── features/
    /* --------------------------------------------------------------------------
       [VS0] Shared Kernel (共享核心)
       系統的「法律與度量衡」，定義所有切片公用的合約
       -------------------------------------------------------------------------- */
    ├── shared.kernel.event-envelope           # [R8/R7] 統一信封 (TraceID, AggregateVersion)
    ├── shared.kernel.tag-authority            # [VS0] 全域標籤權力中心定義
    ├── shared.kernel.contract-interfaces      # [D10] 狀態契約與 Result 接口 (Command/Query)
    ├── shared.kernel.constants                # 跨切片共用狀態 (如: WorkflowStatus, ErrorCodes)

    /* --------------------------------------------------------------------------
       [GW / Infra] Building Blocks (基礎設施引擎)
       系統的「排檔與救護車」，負責搬運、導航與例外處理
       -------------------------------------------------------------------------- */
    ├── infra.gateway-command                  # [GW] 指令閘道器 (驗權、RateLimit、Entry)
    ├── infra.gateway-query                    # [GW] 查詢閘道器 (Query Registry)
    ├── infra.outbox-relay                     # [R1] 搬運工 (掃描所有 OUTBOX 投遞至 IER)
    ├── infra.event-router                     # [IER] 事件路由中心 (分流不同 Lanes [R2])
    ├── infra.dlq-manager                      # [R5] 故障收容中心 (SAFE_AUTO / REVIEW)
    ├── infra.observability                    # [R8] 觀測站 (OpenTelemetry, Log Trace)

    /* --------------------------------------------------------------------------
       [VS1-VS3] Account & Identity (帳號與身份)
       -------------------------------------------------------------------------- */
    ├── identity-account.auth                  # [VS1] 認證與 Token Refresh Handshake [R2]
    ├── account-user.profile                   # 用戶基本資料
    ├── account-user.wallet                    # [VS2] 錢包與積分 (核心資產)
    ├── account-user.skill                     # 用戶個人技能成長 [VS3]
    ├── account-governance.policy              # [VS2] 錢包與治理政策定義

    /* --------------------------------------------------------------------------
       [VS4] Organization (組織治理)
       -------------------------------------------------------------------------- */
    ├── account-organization.core              # 組織基本 Aggregate (OrgId, Name)
    ├── account-organization.skill-tag         # [R3] 組織專屬 Tag Pool (更新閉環)
    ├── account-organization.member            # 成員身分管理 (Roles, Joins)
    ├── account-organization.team              # 團隊結構 (Department, Group)
    ├── account-organization.policy            # 組織層級策略 (Access Control)

    /* --------------------------------------------------------------------------
       [VS5-VS6] Workspace & Scheduling (業務執行層)
       -------------------------------------------------------------------------- */
    ├── workspace-core.event-store             # [VS5] 事件存儲與 Snapshot 機制
    ├── workspace-business.workflow            # [R6] 狀態機轉移合約 (Draft->Finance)
    ├── workspace-business.tasks               # [A3] Track A: 標準任務邏輯
    ├── workspace-business.issues              # [A3] Track B: 異常議題處理
    ├── workspace-business.schedule            # 工作區內部排班協作
    ├── workspace-business.finance             # 結算、單據與財務確認
    ├── workspace-governance.audit             # 業務合規審計軌跡
    ├── scheduling-core.saga                   # [VS6] 跨組織排班協作 Saga 協調器

    /* --------------------------------------------------------------------------
       [VS8] Projections (讀模型投影層)
       負責「接住事件並翻譯成前端好讀的視圖」
       -------------------------------------------------------------------------- */
    ├── projection.event-funnel                # [VS8] 事件漏斗 (彙整點)
    ├── projection.account-view                # 用戶個人視圖 (User Dashboard)
    ├── projection.organization-view           # 組織總覽視圖 (Org Dashboard)
    ├── projection.workspace-view              # 工作區即時視圖 (Workspace Board)
    ├── projection.org-eligible-member-view    # [R7] 帶版本校驗的合規成員清單
    ├── projection.tag-snapshot                # [R3] 標籤快照集

    /* --------------------------------------------------------------------------
       [VS7] Notification (通知交付層)
       -------------------------------------------------------------------------- */
    ├── account-user.notification              # 用戶通知開關與偏好
    └── notification-router.fcm                # [VS7] FCM 投遞引擎與裝置 Token 管理