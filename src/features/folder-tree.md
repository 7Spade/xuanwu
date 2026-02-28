根據 `logic-overview.md` 完整解析所有 VS0～VS9 切片，整理如下 👇

---

## 🗂️ `src/features/` 完整資料夾清單

```
src/features/

│
├── ── VS0 · Shared Kernel ──────────────────────────────────────
│
├── shared.kernel.event-envelope/
├── shared.kernel.authority-snapshot/
├── shared.kernel.skill-tier/
├── shared.kernel.skill-requirement/
├── shared.kernel.command-result-contract/
├── shared.kernel.outbox-contract/
├── shared.kernel.version-guard/
├── shared.kernel.read-consistency/
├── shared.kernel.staleness-contract/
├── shared.kernel.resilience-contract/
├── shared.kernel.token-refresh-contract/
├── shared.kernel.tag-authority/
│
├── ── VS1 · Identity Slice ─────────────────────────────────────
│
├── identity.firebase-auth/
├── identity.authenticated-identity/
├── identity.account-identity-link/
├── identity.active-account-context/
├── identity.context-lifecycle-manager/
├── identity.claims-refresh-handler/
├── identity.custom-claims/
├── identity.token-refresh-signal/
│
├── ── VS2 · Account Slice ──────────────────────────────────────
│
├── account.user-account/
├── account.user-wallet/
├── account.user-profile/
├── account.organization-account/
├── account.organization-settings/
├── account.organization-binding/
├── account.governance-role/
├── account.governance-policy/
├── account.event-bus/
├── account.outbox/
│
├── ── VS3 · Skill XP Slice ─────────────────────────────────────
│
├── skill.aggregate/
├── skill.xp-ledger/
├── skill.events/
├── skill.outbox/
│
├── ── VS4 · Organization Slice ─────────────────────────────────
│
├── organization.core-aggregate/
├── organization.member/
├── organization.partner/
├── organization.team/
├── organization.policy/
├── organization.skill-recognition/
├── organization.tag-lifecycle-subscriber/
├── organization.skill-tag-pool/
├── organization.talent-repository/
├── organization.event-bus/
├── organization.outbox/
│
├── ── VS5 · Workspace Slice ────────────────────────────────────
│
├── workspace.org-context-acl/
├── workspace.command-handler/
├── workspace.scope-guard/
├── workspace.policy-engine/
├── workspace.transaction-runner/
├── workspace.core-aggregate/
├── workspace.event-bus/
├── workspace.event-store/
├── workspace.settings/
├── workspace.governance-role/
├── workspace.policy-eligible-check/
├── workspace.audit/
├── workspace.audit-collector/
├── workspace.files/
├── workspace.document-parser/
├── workspace.parsing-intent/
├── workspace.workflow-aggregate/
├── workspace.tasks/
├── workspace.quality-assurance/
├── workspace.acceptance/
├── workspace.finance/
├── workspace.issues/
├── workspace.daily-log/
├── workspace.schedule/
├── workspace.outbox/
│
├── ── VS6 · Scheduling Slice ───────────────────────────────────
│
├── scheduling.org-schedule/
├── scheduling.saga/
├── scheduling.outbox/
│
├── ── VS7 · Notification Slice ─────────────────────────────────
│
├── notification.router/
├── notification.user-notification/
├── notification.fcm/
│
├── ── GW · Gateway Layer ───────────────────────────────────────
│
├── gateway.outbox-relay-worker/
├── gateway.rate-limiter/
├── gateway.circuit-breaker/
├── gateway.bulkhead-router/
├── gateway.command-gateway/
├── gateway.authority-interceptor/
├── gateway.command-router/
├── gateway.integration-event-router/
├── gateway.dlq/
├── gateway.query-gateway/
│
├── ── VS8 · Projection Bus ─────────────────────────────────────
│
├── projection.event-funnel/
├── projection.version-registry/
├── projection.workspace-scope-guard-view/
├── projection.org-eligible-member-view/
├── projection.wallet-balance/
├── projection.workspace-view/
├── projection.account-schedule/
├── projection.account-view/
├── projection.organization-view/
├── projection.account-skill-view/
├── projection.global-audit-view/
├── projection.tag-snapshot/
│
└── ── VS9 · Observability ──────────────────────────────────────
│
├── observability.trace-identifier/
├── observability.domain-metrics/
└── observability.domain-errors/
```

---

## 📊 統計

| 切片 | 資料夾數 |
|------|---------|
| VS0 Shared Kernel | 12 |
| VS1 Identity | 8 |
| VS2 Account | 10 |
| VS3 Skill XP | 4 |
| VS4 Organization | 11 |
| VS5 Workspace | 24 |
| VS6 Scheduling | 3 |
| VS7 Notification | 3 |
| GW Gateway | 10 |
| VS8 Projection | 12 |
| VS9 Observability | 3 |
| **總計** | **100** |

> 💡 每個資料夾對應 `logic-overview.md` 中一個明確節點，命名規則為 `{切片}.{功能名稱}/`，切片前綴與 VS 對應，方便直接 barrel export 管理 ✨