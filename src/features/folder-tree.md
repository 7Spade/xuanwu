# `src/features` Folder Tree (SSOT: `docs/logic-overview.md` only)

> 本文件**只使用** `docs/logic-overview.md` 作為唯一事實來源整理。
> 目的：提供「傻瓜式」可讀的 `src/features` 垂直切片資料夾樹（以切片/模組命名為主）。
> 
> 說明：`logic-overview.md` 是架構/切片真相，不是實體檔案清單；因此本樹以「切片模組」為主，而非每個實際檔案。

```text
src/features/
├─ shared.kernel/                                 (VS0 Shared Kernel — unified; import: @/features/shared.kernel)
│  ├─ index.ts                                    (unified public API)
│  ├─ README.md                                   (structure guide)
│  ├─ GEMINI.md                                   (AI governance)
│  │
│  ├─ 📄 Foundational Data Contracts
│  ├─ event-envelope/                             (SK_ENV [R8][R7])
│  ├─ authority-snapshot/                         (SK_AUTH_SNAP)
│  ├─ skill-tier/                                 (SK_SKILL_TIER + SK_SKILL_REQ + SK_SCHEDULE_PAYLOAD [#12][A5])
│  ├─ command-result-contract/                    (SK_CMD_RESULT [R4])
│  ├─ constants/                                  (WorkflowStatus [R6] + ErrorCodes [R4])
│  │
│  ├─ ⚙️ Infrastructure Behaviour Contracts
│  ├─ outbox-contract/                            (SK_OUTBOX [S1])
│  ├─ version-guard/                              (SK_VERSION_GUARD [S2])
│  ├─ read-consistency/                           (SK_READ_CONSISTENCY [S3])
│  ├─ staleness-contract/                         (SK_STALENESS [S4])
│  ├─ resilience-contract/                        (SK_RESILIENCE [S5])
│  ├─ token-refresh-contract/                     (SK_TOKEN_REFRESH [S6])
│  │
│  ├─ 🏷️ Tag Authority Center
│  ├─ tag-authority/                              ([#A6][#17][D21] contract types ONLY — RO rules T1–T5)
│  │
│  └─ 🔌 Infrastructure Ports
│     └─ infrastructure-ports/                    (SK_PORTS [D24] — IAuthService, IFirestoreRepo, IMessaging, IFileStore)
│
│  ⚠️  Legacy shims (→ will be removed after consumers migrate):
│  ├─ shared.kernel.event-envelope/               (re-exports from shared.kernel/event-envelope/)
│  ├─ shared.kernel.authority-snapshot/           (re-exports from shared.kernel/authority-snapshot/)
│  ├─ shared.kernel.skill-tier/                   (re-exports from shared.kernel/skill-tier/)
│  ├─ shared.kernel.contract-interfaces/          (re-exports from shared.kernel/command-result-contract/)
│  ├─ shared.kernel.constants/                    (re-exports from shared.kernel/constants/)
│  ├─ shared.kernel.outbox-contract/              (re-exports from shared.kernel/outbox-contract/)
│  ├─ shared.kernel.version-guard/                (re-exports from shared.kernel/version-guard/)
│  ├─ shared.kernel.read-consistency/             (re-exports from shared.kernel/read-consistency/)
│  ├─ shared.kernel.staleness-contract/           (re-exports from shared.kernel/staleness-contract/)
│  ├─ shared.kernel.resilience-contract/          (re-exports from shared.kernel/resilience-contract/)
│  ├─ shared.kernel.token-refresh-contract/       (re-exports from shared.kernel/token-refresh-contract/)
│  └─ shared.kernel.tag-authority/               (NOTE: currently re-exports CRUD from centralized-tag — needs update)
│
├─ identity.slice                                 (VS1 Identity Slice)
│
├─ account.slice                                  (VS2 Account Slice — unified)
│  ├─ user.profile                                (user-account profile + FCM token)
│  ├─ user.wallet                                 (strong-consistency financial ledger [S3])
│  ├─ gov.role                                    (account-level role → CUSTOM_CLAIMS [S6])
│  └─ gov.policy                                  (account-level policy → CUSTOM_CLAIMS [S6])
│
├─ skill-xp.slice                                 (VS3 Skill XP Slice)
│
├─ organization.slice                             (VS4 Organization Slice — unified)
│  ├─ core                                        (org aggregate + lifecycle)
│  ├─ core.event-bus                              (org event bus [R8])
│  ├─ gov.teams                                   (org team management)
│  ├─ gov.members                                 (org member binding [ACL #A2])
│  ├─ gov.partners                                (partner team management)
│  └─ gov.policy                                  (org-level policy management)
│
├─ workspace.slice                                (VS5 Workspace Slice — unified)
│  ├─ core/                                       (workspace aggregate + lifecycle)
│  ├─ core.event-bus/                             (workspace event bus [R8])
│  ├─ core.event-store/                           (event store; enables projection rebuild [D11])
│  ├─ application/                                (Application Coordinator — CBG_AUTH, scope-guard, policy-engine, tx-runner, ws-outbox)
│  ├─ gov.role/                                   (workspace-level role management)
│  ├─ gov.audit/                                  (workspace audit governance)
│  ├─ gov.audit-convergence/                      (audit convergence bridge)
│  ├─ gov.members/                                (workspace member management)
│  ├─ gov.partners/                               (workspace partner management)
│  ├─ gov.teams/                                  (workspace team management)
│  ├─ business.files/                             (workspace file management [S3])
│  ├─ business.document-parser/                   (document → parsing intent AI flow)
│  ├─ business.parsing-intent/                    (parsing intent digital twin [#A4])
│  ├─ business.workflow/                          (workflow state machine [R6])
│  ├─ business.tasks/                             (A-track: task execution)
│  ├─ business.quality-assurance/                 (A-track: QA gate)
│  ├─ business.acceptance/                        (A-track: client acceptance)
│  ├─ business.finance/                           (A-track: finance settlement)
│  ├─ business.daily/                             (workspace daily log)
│  └─ business.issues/                            (B-track: issue resolution [#A3])
│
├─ scheduling.slice                               (VS6 Scheduling Slice — canonical unified implementation)
│  ├─ _aggregate                                  (HR schedule aggregate + state machine)
│  ├─ _actions                                    (unified server actions: workspace + HR domain)
│  ├─ _queries                                    (unified read queries)
│  ├─ _saga                                       (cross-org saga coordinator [A5])
│  ├─ _projectors/demand-board                    (demand board projector [S2])
│  ├─ _projectors/account-schedule                (account availability projector [S2])
│  ├─ _hooks/                                     (use-org-schedule, use-global-schedule, use-schedule-commands …)
│  └─ _components/                                (AccountScheduleSection, DemandBoard, OrgScheduleGovernance …)

│
├─ notification.slice                             (VS7 Notification Slice — unified)
│  ├─ user.notification/                          (FCM delivery + device token management [#A10])
│  └─ gov.notification-router/                    (stateless notification router — reads Projection only [#6][#A10])
│
├─ projection.bus                                 (VS8 Projection Bus — EVENT_FUNNEL_INPUT + PROJECTION_VERSION + READ_MODEL_REGISTRY)
│  ├─ account-audit/                              (ACCOUNT_PROJECTION_AUDIT)
│  ├─ account-view/                               (ACCOUNT_PROJECTION_VIEW — FCM token, authority snapshot [#6][#8])
│  ├─ global-audit-view/                          (GLOBAL_AUDIT_VIEW — cross-slice audit [R8])
│  ├─ org-eligible-member-view/                   (ORG_ELIGIBLE_MEMBER_VIEW — tier derived at query time [#12][#14–#16][R7])
│  ├─ organization-view/                          (ORGANIZATION_PROJECTION_VIEW)
│  ├─ tag-snapshot/                               (TAG_SNAPSHOT [T5][S4])
│  ├─ workspace-scope-guard/                      (WORKSPACE_SCOPE_READ_MODEL [#A9] CRITICAL ≤500ms)
│  ├─ workspace-view/                             (WORKSPACE_PROJECTION_VIEW)
│  ├─ _funnel.ts
│  ├─ _registry.ts
│  └─ _query-registration.ts
│
└─ observability                                  (VS9 Cross-cutting)
   ├─ trace-identifier
   ├─ domain-metrics
   └─ domain-error-log

infra.external-triggers                           (L0 External Triggers — ResilienceGuard [S5])
infra.gateway-command                             (L2 Command Gateway — app-layer dispatch [R4][R8])
infra.gateway-query                               (L6 Query Gateway — read-model registry [S2][S3])
infra.event-router                                (L4 IER — in-process fan-out [D1][R8])
infra.outbox-relay                                (L4 OUTBOX_RELAY — CDC scan → IER [S1])
infra.dlq-manager                                 (L4 DLQ Manager — SAFE_AUTO / REVIEW_REQUIRED / SECURITY_BLOCK [S1])
```

## How to use this tree (quick rule)

1. 先判斷需求屬於哪個 VS（VS1~VS9）。
2. 在對應切片內擴充，不跨切片偷放。
3. 跨切片契約先放 VS0 `shared.kernel.*`，不要先丟到其他共享桶。
4. `issues` 是 B-track（異常軌）節點，只能透過事件回到 A-track（見 `logic-overview.md` A/B 軌規則）。
5. VS5 的所有業務節點（tasks、quality-assurance、acceptance、finance、daily、issues 等）均位於 `workspace.slice/` 下各自的 `business.*` 子目錄中，不是獨立切片。
