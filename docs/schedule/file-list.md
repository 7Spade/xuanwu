# Schedule 相關檔案清單

> 產生時間：2026-02-28
> 目的：列出所有與「排程（Schedule）」領域相關的源碼檔案，供後續型別分析使用。

---

## 1. 共享型別定義（`src/shared/types/`）

| 檔案 | 說明 |
|------|------|
| `src/shared/types/schedule.types.ts` | 排程核心型別：`ScheduleItem`、`ScheduleStatus`、`ScheduleDemand`、`ScheduleDemandStatus`、`ScheduleDemandCloseReason` |
| `src/shared/types/skill.types.ts` | 技能相關型別：`SkillTier`、`SkillRequirement`、`SkillGrant`、`SkillTag`、`TierDefinition` |
| `src/shared/types/workspace.types.ts` | `Location`（被 `ScheduleItem.location` 參照）、`WorkspaceLocation` |

---

## 2. 共享函式庫（`src/shared/lib/`）

| 檔案 | 說明 |
|------|------|
| `src/shared/lib/schedule.rules.ts` | 排程狀態機規則：`VALID_STATUS_TRANSITIONS`、`canTransitionScheduleStatus` |

---

## 3. Shared Kernel（`src/features/shared.kernel.*`）

| 檔案 | 說明 |
|------|------|
| `src/features/shared.kernel.skill-tier/skill-tier.ts` | 技能層級計算：`TIER_DEFINITIONS`、`resolveSkillTier`、`getTier`、`tierSatisfies`、`getTierRank` |
| `src/features/shared.kernel.skill-tier/skill-requirement.ts` | 重新導出 `SkillRequirement`（來源：`@/shared/types/skill.types`） |
| `src/features/shared.kernel.skill-tier/schedule-proposed-payload.ts` | 跨 BC 事件契約：`WorkspaceScheduleProposedPayload`、`ImplementsScheduleProposedPayloadContract` |
| `src/features/shared.kernel.staleness-contract/staleness-contract.ts` | 陳舊性 SLA 常數（含 `PROJ_STALE_DEMAND_BOARD = 5000`） |
| `src/features/shared.kernel.version-guard/` | S2 版本守衛：`versionGuardAllows` |

---

## 4. Workspace BC — 工作區排程（`src/features/workspace-business.schedule/`）

| 檔案 | 說明 |
|------|------|
| `_actions.ts` | Server Actions：`createScheduleItem`、`assignMember`、`unassignMember`、`updateScheduleItemStatus` |
| `_queries.ts` | 讀取查詢：`getScheduleItems` |
| `_hooks/use-global-schedule.ts` | 全局排程 hook（訂閱 `subscribeToOrgMembers`） |
| `_hooks/use-workspace-schedule.ts` | 工作區排程 hook |
| `_hooks/use-schedule-commands.ts` | 排程命令 hook |
| `_hooks/use-schedule-event-handler.ts` | 排程事件處理 hook |
| `_components/schedule.account-view.tsx` | 帳號層排程視圖（含 `OrgScheduleGovernance`） |
| `_components/schedule.workspace-view.tsx` | 工作區排程視圖 |
| `_components/proposal-dialog.tsx` | 提案對話框（含 `locationId` 選擇器、`FR-K5` 技能標籤池） |
| `_components/governance-sidebar.tsx` | 治理側邊欄 |
| `_components/unified-calendar-grid.tsx` | 統一日曆格 |
| `_components/schedule-data-table.tsx` | 排程資料表 |
| `_components/schedule-proposal-content.tsx` | 排程提案內容 |
| `_components/decision-history-columns.tsx` | 決策歷史欄定義 |
| `_components/upcoming-events-columns.tsx` | 即將發生的事件欄定義 |
| `index.ts` | 公開 API 出口 |

---

## 5. Organization BC — 組織排程（`src/features/account-organization.schedule/`）

| 檔案 | 說明 |
|------|------|
| `_schedule.ts` | Aggregate Root：`OrgScheduleProposal`、`OrgScheduleStatus`、`orgScheduleProposalSchema`、`handleScheduleProposed`、`approveOrgScheduleProposal`、`cancelOrgScheduleProposal`、`completeOrgSchedule`、`cancelOrgScheduleAssignment` |
| `_actions.ts` | Server Actions：`manualAssignScheduleMember`、`cancelScheduleProposalAction`、`cancelOrgScheduleAssignmentAction`、`completeOrgScheduleAction` |
| `_queries.ts` | 讀取查詢：`getOrgScheduleProposal`、`subscribeToOrgScheduleProposals`、`subscribeToPendingProposals`、`subscribeToConfirmedProposals` |
| `_hooks/use-org-schedule.ts` | Org 排程 hook：`useOrgSchedule`、`usePendingScheduleProposals`、`useConfirmedScheduleProposals` |
| `_components/org-schedule-governance.tsx` | 組織排程治理 UI（技能配對 + 分配） |
| `index.ts` | 公開 API 出口 |

---

## 6. Projection — Demand Board（`src/features/projection.demand-board/`）

| 檔案 | 說明 |
|------|------|
| `_projector.ts` | 事件投影器：`applyDemandProposed`、`applyDemandAssigned`、`applyDemandCompleted`、`applyDemandAssignmentCancelled`、`applyDemandProposalCancelled`、`applyDemandAssignRejected` |
| `_queries.ts` | 讀取查詢：`getActiveDemands`、`getAllDemands`、`subscribeToDemandBoard`、`subscribeToAllDemands`、`DEMAND_BOARD_STALENESS` |
| `_components/demand-board.tsx` | 需求看板 UI |
| `index.ts` | 公開 API 出口 |

---

## 7. Organization Event Bus — 排程相關事件（`src/features/account-organization.event-bus/`）

| 檔案 | 說明 |
|------|------|
| `_events.ts` | 排程事件 Payload：`ScheduleAssignedPayload`、`ScheduleCompletedPayload`、`ScheduleAssignmentCancelledPayload`、`ScheduleAssignRejectedPayload`、`ScheduleProposalCancelledPayload` |
| `index.ts` | 公開 API 出口 |

---

## 8. Firestore 基礎設施（`src/shared/infra/firestore/repositories/`）

| 檔案 | 說明 |
|------|------|
| `schedule.repository.ts` | Firestore CRUD：`createScheduleItem`、`updateScheduleItemStatus`、`assignMemberToScheduleItem`、`unassignMemberFromScheduleItem`、`getScheduleItems` |

---

## 9. App 路由頁面（`src/app/`）

| 檔案 | 說明 |
|------|------|
| `src/app/(shell)/(account)/(dashboard)/dashboard/account/skills/page.tsx` | `FR-K1` 個人技能頁面 |
| `src/app/(shell)/(workspace)/(dashboard)/dashboard/workspaces/[id]/schedule-proposal/page.tsx` | 排程提案頁面（Workspace BC） |

---

## 10. Firestore 路徑摘要

| 集合路徑 | 型別 | 說明 |
|---------|------|------|
| `accounts/{accountId}/schedule_items/{itemId}` | `ScheduleItem` | 工作區排程項目（Workspace BC 寫入） |
| `orgScheduleProposals/{scheduleItemId}` | `OrgScheduleProposal` | 組織審批流程（Organization BC 寫入） |
| `orgDemandBoard/{orgId}/demands/{scheduleItemId}` | `ScheduleDemand` | 需求看板投影（projection 寫入，只讀） |
