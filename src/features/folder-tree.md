# `src/features` Folder Tree (SSOT: `docs/logic-overview.md` only)

> 本文件**只使用** `docs/logic-overview.md` 作為唯一事實來源整理。
> 目的：提供「傻瓜式」可讀的 `src/features` 垂直切片資料夾樹（以切片/模組命名為主）。
> 
> 說明：`logic-overview.md` 是架構/切片真相，不是實體檔案清單；因此本樹以「切片模組」為主，而非每個實際檔案。

```text
src/features/
├─ shared.kernel.*                                (VS0 Shared Kernel + Tag Authority)
│  ├─ event-envelope                              (SK_ENV)
│  ├─ authority-snapshot                          (SK_AUTH_SNAP)
│  ├─ skill-tier                                  (SK_SKILL_TIER)
│  ├─ skill-requirement                           (SK_SKILL_REQ)
│  ├─ command-result-contract                     (SK_CMD_RESULT)
│  ├─ outbox-contract                             (S1)
│  ├─ version-guard                               (S2)
│  ├─ read-consistency                            (S3)
│  ├─ staleness-contract                          (S4)
│  ├─ resilience-contract                         (S5)
│  └─ token-refresh-contract                      (S6)
│
├─ identity-account.auth                          (VS1 Identity Slice)
│
├─ account-user.profile                           (VS2 Account Slice)
├─ account-user.wallet                            (VS2 Account Slice)
├─ organization-account.settings                  (VS2 Account Slice)
├─ organization-account.binding                   (VS2 Account Slice)
├─ account-governance.role                        (VS2 Account Slice)
├─ account-governance.policy                      (VS2 Account Slice)
│
├─ account-skill                                  (VS3 Skill XP Slice)
│
├─ organization-core                              (VS4 Organization Slice)
├─ account-organization.member                    (VS4 Organization Slice)
├─ account-organization.partner                   (VS4 Organization Slice)
├─ account-organization.team                      (VS4 Organization Slice)
├─ account-organization.policy                    (VS4 Organization Slice)
├─ organization-skill-recognition                 (VS4 Organization Slice)
│
├─ org-context.acl                                (VS5 Workspace Slice / ACL)
├─ workspace-application                          (VS5 Workspace Slice / Application Coordinator)
│  ├─ command-handler
│  ├─ scope-guard
│  ├─ policy-engine
│  ├─ transaction-runner
│  └─ ws-outbox
├─ workspace-core                                 (VS5 Workspace Slice / Core)
│  ├─ workspace-core.aggregate
│  ├─ workspace-core.event-bus
│  ├─ workspace-core.event-store
│  └─ workspace-core.settings
├─ workspace-governance.role                      (VS5 Workspace Slice / Governance)
├─ workspace-governance.audit                     (VS5 Workspace Slice / Governance)
├─ workspace-business.files                       (VS5 Workspace Slice / Business)
├─ workspace-business.document-parser             (VS5 Workspace Slice / Business / Parsing)
├─ workspace-business.workflow                    (VS5 Workspace Slice / State Machine)
│  ├─ A-track/                                    (主流程)
│  │  ├─ tasks
│  │  ├─ quality-assurance
│  │  ├─ acceptance
│  │  └─ finance
│  └─ B-track/                                    (異常流程)
│     └─ issues
├─ workspace-business.daily                       (VS5 Workspace Slice / Business)
├─ workspace-business.schedule                    (VS5 Workspace Slice / Business)
│
├─ account-organization.schedule                  (VS6 Scheduling Slice)
├─ scheduling-saga                                (VS6 Scheduling Slice)
│
├─ notification-router                            (VS7 Notification Slice)
├─ account-user.notification                      (VS7 Notification Slice)
│
├─ projection-bus                                 (VS8 Projection Bus)
│  ├─ projection.workspace-view
│  ├─ projection.account-schedule
│  ├─ projection.account-view
│  ├─ projection.organization-view
│  ├─ projection.account-skill-view
│  ├─ projection.global-audit-view
│  ├─ projection.tag-snapshot
│  ├─ projection.version
│  └─ read-model-registry
│
└─ observability                                  (VS9 Cross-cutting)
   ├─ trace-identifier
   ├─ domain-metrics
   └─ domain-error-log
```

## How to use this tree (quick rule)

1. 先判斷需求屬於哪個 VS（VS1~VS9）。
2. 在對應切片內擴充，不跨切片偷放。
3. 跨切片契約先放 VS0 `shared.kernel.*`，不要先丟到其他共享桶。
4. `issues` 是 B-track（異常軌）節點，只能透過事件回到 A-track（見 `logic-overview.md` A/B 軌規則）。
5. VS5 的 `A-track/tasks|quality-assurance|acceptance|finance`、`B-track/issues`、`workspace-business.daily`、`workspace-business.schedule` 都是 **Workspace Slice 內部業務節點**，不是新的獨立切片。
