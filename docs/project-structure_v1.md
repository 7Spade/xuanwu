# Project Structure
> 對應 `logic-overview-v1.md` · D2~D7 資料夾規範 · [D24] Firebase 隔離

---

## `src/features/` — 領域切片結構

```
src/features/
│
├── shared-kernel/                          # VS0 · L1 全域契約中心 [#8]
│   ├── index.ts                            # 唯一公開出口 [D7]
│   ├── contracts/
│   │   ├── event-envelope.ts               # SK_ENV · traceId 整鏈共享 [R8]
│   │   ├── authority-snapshot.ts           # SK_AUTH_SNAP
│   │   ├── skill-tier.ts                   # SK_SKILL_TIER · 純函式 getTier() [#12]
│   │   ├── skill-requirement.ts            # SK_SKILL_REQ
│   │   └── command-result.ts               # SK_CMD_RESULT
│   ├── infra-contracts/
│   │   ├── outbox.contract.ts              # SK_OUTBOX_CONTRACT [S1]
│   │   ├── version-guard.ts                # SK_VERSION_GUARD [S2]
│   │   ├── read-consistency.ts             # SK_READ_CONSISTENCY [S3]
│   │   ├── staleness.contract.ts           # SK_STALENESS_CONTRACT [S4]
│   │   ├── resilience.contract.ts          # SK_RESILIENCE_CONTRACT [S5]
│   │   └── token-refresh.contract.ts       # SK_TOKEN_REFRESH_CONTRACT [S6]
│   └── tag-authority/
│       ├── centralized-tag.aggregate.ts    # CTA · tagSlug 唯一真相 [#17 #A6]
│       ├── tag-lifecycle.event.ts          # TagLifecycleEvent
│       ├── tag.outbox.ts                   # [S1: SAFE_AUTO]
│       ├── tag-stale.guard.ts              # TAG_STALE_GUARD [S4]
│       └── entities/
│           ├── tag-user-level.entity.ts    # TE1 · tag::user-level
│           ├── tag-skill.entity.ts         # TE2 · tag::skill
│           ├── tag-skill-tier.entity.ts    # TE3 · tag::skill-tier
│           ├── tag-team.entity.ts          # TE4 · tag::team
│           ├── tag-role.entity.ts          # TE5 · tag::role
│           └── tag-partner.entity.ts       # TE6 · tag::partner
│
├── identity/                               # VS1 · 身份驗證切片
│   ├── index.ts
│   ├── _actions.ts                         # [D3] 所有 mutation 入口 [S5]
│   ├── _queries.ts                         # [D4] 所有 read 入口
│   ├── domain/
│   │   ├── authenticated-identity.ts       # AUTH_ID
│   │   ├── account-identity-link.ts        # ID_LINK
│   │   └── context-lifecycle/
│   │       ├── active-account-context.ts   # ACTIVE_CTX
│   │       └── context-lifecycle.manager.ts # CTX_MGR
│   └── claims/
│       ├── claims-refresh.handler.ts       # CLAIMS_H · [S6]
│       ├── custom-claims.ts                # CUSTOM_C [#5]
│       └── token-refresh.signal.ts         # TOKEN_SIG
│
├── account/                                # VS2 · 帳號主體切片
│   ├── index.ts
│   ├── _actions.ts                         # [D3]
│   ├── _queries.ts                         # [D4]
│   ├── domain/
│   │   ├── user/
│   │   │   ├── user-account.aggregate.ts   # USER_AGG
│   │   │   ├── wallet.aggregate.ts         # WALLET_AGG · [S3: STRONG_READ] [#A1]
│   │   │   └── account.profile.ts          # PROFILE · FCM Token 弱一致
│   │   ├── organization/
│   │   │   ├── organization-account.aggregate.ts  # ORG_ACC
│   │   │   ├── org-account.settings.ts     # ORG_SETT
│   │   │   └── org-account.binding.ts      # ORG_BIND · ACL [#A2]
│   │   └── governance/
│   │       ├── account-governance.role.ts  # ACC_ROLE → tag::role [TE5]
│   │       └── account-governance.policy.ts # ACC_POL
│   └── events/
│       ├── account-event.bus.ts            # ACC_EBUS · in-process
│       └── acc.outbox.ts                   # [S1] DLQ 宣告
│
├── skill/                                  # VS3 · 能力成長切片
│   ├── index.ts
│   ├── _actions.ts                         # [D3]
│   ├── _queries.ts                         # [D4]
│   ├── domain/
│   │   ├── account-skill.aggregate.ts      # SKILL_AGG → tag::skill [TE2] tag::skill-tier [TE3]
│   │   └── account-skill-xp.ledger.ts      # XP_LED · [#13] 異動必寫
│   └── events/
│       ├── skill-xp.events.ts              # SkillXpAdded / SkillXpDeducted
│       └── skill.outbox.ts                 # [S1: SAFE_AUTO] → STANDARD_LANE
│
├── organization/                           # VS4 · 組織治理切片
│   ├── index.ts
│   ├── _actions.ts                         # [D3]
│   ├── _queries.ts                         # [D4]
│   ├── domain/
│   │   ├── core/
│   │   │   └── organization-core.aggregate.ts  # ORG_AGG
│   │   ├── governance/
│   │   │   ├── org.member.ts               # ORG_MBR → tag::role [TE5] tag::user-level [TE1]
│   │   │   ├── org.partner.ts              # ORG_PTR → tag::partner [TE6]
│   │   │   ├── org.team.ts                 # ORG_TEAM → tag::team [TE4]
│   │   │   ├── org.policy.ts               # ORG_POL
│   │   │   └── org-skill-recognition.aggregate.ts  # ORG_RECOG [#11]
│   │   └── tag-view/
│   │       ├── tag-lifecycle.subscriber.ts # TAG_SUB · 訂閱 IER BACKGROUND_LANE [T1]
│   │       ├── skill-tag.pool.ts           # SKILL_POOL [S4: TAG_MAX_STALENESS]
│   │       └── talent.repository.ts        # TALENT [#16] member+partner+team
│   └── events/
│       ├── org-event.bus.ts                # ORG_EBUS · Producer-only [#2]
│       └── org.outbox.ts                   # [S1] DLQ 宣告
│
├── workspace/                              # VS5 · 工作區業務切片
│   ├── index.ts
│   ├── _actions.ts                         # [D3] [S5]
│   ├── _queries.ts                         # [D4]
│   ├── application/                        # Application Coordinator [#3]
│   │   ├── command.handler.ts              # WS_CMD_H → SK_CMD_RESULT
│   │   ├── scope.guard.ts                  # WS_SCP_G [#A9]
│   │   ├── policy.engine.ts                # WS_POL_E
│   │   ├── transaction.runner.ts           # WS_TX_R [#A8] 1cmd/1agg
│   │   └── ws.outbox.ts                    # WS_OB [S1: SAFE_AUTO] · 唯一 IER 投遞 [E5]
│   ├── acl/
│   │   └── org-context.acl.ts              # ORG_ACL · OrgContextProvisioned [E2] [#10]
│   ├── domain/
│   │   ├── core/
│   │   │   ├── workspace-core.aggregate.ts # WS_AGG
│   │   │   ├── workspace-core.event-bus.ts # WS_EBUS · in-process [E5]
│   │   │   ├── workspace-core.event-store.ts # WS_ESTORE · 重播/稽核 [#9]
│   │   │   └── workspace-core.settings.ts  # WS_SETT
│   │   ├── governance/
│   │   │   ├── workspace-governance.role.ts  # WS_ROLE → tag::role [TE5] [#18]
│   │   │   ├── policy-eligible.check.ts    # WS_PCHK [P4]
│   │   │   ├── workspace-governance.audit.ts # WS_AUDIT
│   │   │   └── audit-event.collector.ts    # AUDIT_COL → GLOBAL_AUDIT_VIEW
│   │   └── business/
│   │       ├── parsing/
│   │       │   ├── workspace.files.ts      # W_FILES
│   │       │   ├── document.parser.ts      # W_PARSER
│   │       │   └── parsing-intent.ts       # PARSE_INT · Digital Twin [#A4]
│   │       ├── workflow/
│   │       │   └── workflow.aggregate.ts   # WF_AGG · State Machine [R6] [#A3]
│   │       ├── a-track/                    # 主流程
│   │       │   ├── tasks.ts                # A_TASKS
│   │       │   ├── quality-assurance.ts    # A_QA
│   │       │   ├── acceptance.ts           # A_ACCEPT
│   │       │   └── finance.ts              # A_FINANCE
│   │       ├── b-track/                    # 異常處理
│   │       │   └── issues.ts               # B_ISSUES · [禁止回呼 A-track]
│   │       ├── daily.ts                    # W_DAILY · 施工日誌
│   │       └── workspace.schedule.ts       # W_SCHED · tagSlug T4 → VS6 [A5]
│   └── _components/                        # [D6] "use client" 葉節點
│
├── scheduling/                             # VS6 · 排班協作切片
│   ├── index.ts
│   ├── _actions.ts                         # [D3]
│   ├── _queries.ts                         # [D4]
│   ├── domain/
│   │   └── org.schedule.ts                 # ORG_SCH · tagSlug T4 [S4] [R7]
│   ├── saga/
│   │   └── scheduling.saga.ts              # SCH_SAGA [#A5] · compensating events
│   └── events/
│       └── sched.outbox.ts                 # [S1] DLQ: ScheduleAssigned → REVIEW_REQUIRED
│
├── notification/                           # VS7 · 通知交付切片
│   ├── index.ts
│   ├── _actions.ts                         # [D3]
│   ├── _queries.ts                         # [D4]
│   ├── domain/
│   │   ├── notification.router.ts          # NOTIF_R · 無狀態路由 [#A10] [R8]
│   │   └── account-user.notification.ts    # USER_NOTIF [#6]
│   └── _components/                        # [D6]
│
└── projection/                             # VS8 · 事件投影總線
    ├── index.ts
    ├── funnel/
    │   ├── event.funnel.ts                 # FUNNEL [#9 Q3 R8 S2] · 唯一 Projection 寫入路徑
    │   ├── critical-proj.lane.ts           # CRIT_PROJ [S4: ≤500ms]
    │   └── standard-proj.lane.ts           # STD_PROJ [S4: ≤10s]
    ├── meta/
    │   ├── projection.version.ts           # PROJ_VER · stream offset
    │   └── read-model.registry.ts          # READ_REG · 版本目錄
    ├── critical/                           # 🔴 Critical Projections [S2 S4]
    │   ├── workspace-scope-guard.view.ts   # WS_SCOPE_V [#A9]
    │   ├── org-eligible-member.view.ts     # ORG_ELIG_V [#14 #15 #16 T3 S2]
    │   └── wallet-balance.view.ts          # WALLET_V [S3: EVENTUAL_READ]
    └── standard/                           # ⚪ Standard Projections [S4]
        ├── workspace.view.ts               # WS_PROJ
        ├── account-schedule.view.ts        # ACC_SCHED_V
        ├── account.view.ts                 # ACC_PROJ_V
        ├── organization.view.ts            # ORG_PROJ_V
        ├── account-skill.view.ts           # SKILL_V [S2]
        ├── global-audit.view.ts            # AUDIT_V [R8]
        └── tag-snapshot.view.ts            # TAG_SNAP [S4: TAG_MAX_STALENESS] [T5]
```

---

## `src/app/` — Next.js App Router 平行路由結構

> 僅列 `page.tsx`，Parallel Routes 以 `@slot` 標示

```
src/app/
│
├── page.tsx                                # 首頁 / 登入導向
│
├── (auth)/                                 # Route Group：未驗證公開頁
│   ├── login/
│   │   └── page.tsx                        # 登入
│   ├── register/
│   │   └── page.tsx                        # 註冊
│   └── reset-password/
│       └── page.tsx                        # 重設密碼
│
├── (platform)/                             # Route Group：需驗證主平台
│   ├── layout.tsx                          # 驗證守衛 + ACTIVE_CTX 注入
│   │
│   ├── dashboard/                          # 主 Dashboard（Parallel Routes）
│   │   ├── layout.tsx                      # 組合 @overview + @schedule + @notifications
│   │   ├── @overview/
│   │   │   └── page.tsx                    # 組織概覽 · projection.organization-view
│   │   ├── @schedule/
│   │   │   └── page.tsx                    # 今日排班快照 · projection.account-schedule
│   │   └── @notifications/
│   │       └── page.tsx                    # 即時通知 · account-user.notification
│   │
│   ├── org/
│   │   └── [orgId]/
│   │       ├── page.tsx                    # 組織首頁
│   │       ├── members/
│   │       │   └── page.tsx                # 成員列表 · org-eligible-member.view
│   │       ├── teams/
│   │       │   └── page.tsx                # 團隊管理 · tag::team
│   │       ├── partners/
│   │       │   └── page.tsx                # 夥伴管理 · tag::partner
│   │       ├── skills/
│   │       │   └── page.tsx                # 職能標籤庫 · skill-tag.pool
│   │       └── schedule/
│   │           ├── layout.tsx              # 組合 @calendar + @eligible
│   │           ├── @calendar/
│   │           │   └── page.tsx            # 排班日曆
│   │           └── @eligible/
│   │               └── page.tsx            # 可排班人員 · org-eligible-member.view [#14]
│   │
│   ├── workspace/
│   │   └── [workspaceId]/
│   │       ├── page.tsx                    # Workspace 首頁
│   │       ├── layout.tsx                  # 組合 @workflow + @issues + @daily
│   │       ├── @workflow/
│   │       │   └── page.tsx                # 主流程看板 · A-track · workflow.aggregate
│   │       ├── @issues/
│   │       │   └── page.tsx                # 異常管理 · B-track · issues
│   │       ├── @daily/
│   │       │   └── page.tsx                # 施工日誌 · daily
│   │       ├── tasks/
│   │       │   └── page.tsx                # 任務列表
│   │       ├── qa/
│   │       │   └── page.tsx                # 品質審查
│   │       ├── acceptance/
│   │       │   └── page.tsx                # 驗收
│   │       ├── finance/
│   │       │   └── page.tsx                # 財務
│   │       └── files/
│   │           └── page.tsx                # 文件解析 · parsing-intent
│   │
│   ├── account/
│   │   ├── page.tsx                        # 帳號概覽
│   │   ├── profile/
│   │   │   └── page.tsx                    # 個人資料 · account.profile
│   │   ├── wallet/
│   │   │   └── page.tsx                    # 錢包 · wallet.aggregate [S3: STRONG_READ]
│   │   └── skills/
│   │       └── page.tsx                    # 我的技能 · account-skill.view
│   │
│   └── admin/                              # 系統管理（需 admin role）
│       ├── page.tsx
│       ├── tags/
│       │   └── page.tsx                    # Tag Authority 管理 · CTA
│       ├── audit/
│       │   └── page.tsx                    # 全域稽核日誌 · global-audit.view [R8]
│       └── dlq/
│           └── page.tsx                    # DLQ 人工審查 · REVIEW_REQUIRED / SECURITY_BLOCK
│
└── api/
    └── webhooks/
        └── route.ts                        # Webhook 入口 [S5: SK_RESILIENCE_CONTRACT]
```

---

## 對應關係速查

| `src/app/` 路由 | 消費的 Projection / Aggregate |
|---|---|
| `dashboard/@overview` | `projection/standard/organization.view` |
| `dashboard/@schedule` | `projection/standard/account-schedule.view` |
| `dashboard/@notifications` | `notification/domain/account-user.notification` |
| `org/[orgId]/schedule/@eligible` | `projection/critical/org-eligible-member.view` |
| `workspace/[workspaceId]/@workflow` | `workspace/domain/business/workflow/workflow.aggregate` |
| `workspace/[workspaceId]/@issues` | `workspace/domain/business/b-track/issues` |
| `account/wallet` | `projection/critical/wallet-balance.view` + STRONG_READ [S3] |
| `admin/tags` | `shared-kernel/tag-authority/centralized-tag.aggregate` |
| `admin/audit` | `projection/standard/global-audit.view` |
| `admin/dlq` | IER DLQ · `REVIEW_REQUIRED` + `SECURITY_BLOCK` |
