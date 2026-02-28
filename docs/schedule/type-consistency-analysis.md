# Schedule 型別定義一致性分析

> 產生時間：2026-02-28
> 依據：`docs/schedule/type-definitions.md` 與實際源碼對比

---

## 分析摘要

| 編號 | 類別 | 問題 | 嚴重程度 |
|------|------|------|---------|
| C-01 | 日期格式不一致 | `ScheduleItem` 使用 Firestore `Timestamp`；`OrgScheduleProposal` 與 `ScheduleDemand` 使用 `string`（ISO 8601） | ⚠️ 中 |
| C-02 | 狀態機分層 | `ScheduleStatus`（工作區層 3 態）與 `OrgScheduleStatus`（組織層 6 態）映射未文件化 | ⚠️ 中 |
| C-03 | `aggregateVersion` 缺失 | 補償事件（`ScheduleAssignRejectedPayload`、`ScheduleProposalCancelledPayload`）無 `aggregateVersion`；投影器需用狀態守衛替代 | ℹ️ 低（已有因應） |
| C-04 | `ScheduleItem` 缺 `workspaceName` 欄位 | `ScheduleItem` 有 `workspaceName?: string` 但 `ScheduleDemand` 也有；下游查詢需兩層合併 | ℹ️ 低 |
| C-05 | `SkillRequirement` 欄位命名 | `ScheduleItem.requiredSkills` vs `ScheduleDemand.requiredSkills` 命名一致；但 Org 層 Schema 亦用 `skillRequirements` | ⚠️ 中 |

---

## 詳細分析

---

### C-01 日期格式不一致 ⚠️

#### 問題描述

排程系統中，日期欄位在不同層使用了不同格式：

| 型別 | 欄位 | 格式 | 儲存位置 |
|------|------|------|---------|
| `ScheduleItem` | `startDate`, `endDate`, `createdAt`, `updatedAt` | `Timestamp`（Firestore） | `accounts/{id}/schedule_items/` |
| `OrgScheduleProposal` | `startDate`, `endDate`, `receivedAt` | `string`（ISO 8601） | `orgScheduleProposals/` |
| `ScheduleDemand` | `startDate`, `endDate`, `updatedAt` | `string`（ISO 8601） | `orgDemandBoard/{orgId}/demands/` |
| `WorkspaceScheduleProposedPayload`（跨 BC 事件） | `startDate`, `endDate` | `string`（ISO 8601） | 事件匯流排傳輸 |

#### 影響

- 轉換邏輯已存在：`workspace-business.schedule/_actions.ts` 在建立 Org 提案前需將 `Timestamp` 轉為 ISO 8601 字串
- UI 層若直接從 `ScheduleItem` 和 `ScheduleDemand` 混合渲染日期，需分別處理

#### 建議

在 `src/shared/lib/schedule-date.utils.ts` 集中處理 `Timestamp ↔ string` 轉換，現已有類似工具函式散落在各 action 中，宜提取為共用函式。

---

### C-02 狀態機分層 ⚠️

#### 問題描述

排程狀態機分為兩層，但目前只有工作區層有 `schedule.rules.ts` 記錄轉換規則：

**工作區層 `ScheduleStatus`（3 態）**
```
PROPOSAL → OFFICIAL → REJECTED
                ↑
REJECTED ───────┘
```
- 規則記錄於：`src/shared/lib/schedule.rules.ts`

**組織層 `OrgScheduleStatus`（6 態）**
```
draft → proposed → confirmed → completed
                             → assignmentCancelled
                → cancelled
```
- 規則內嵌於：`src/features/account-organization.schedule/_schedule.ts`
- **無獨立規則檔案**

#### 兩層狀態映射

| 工作區狀態 | 觸發條件 | 對應組織狀態 |
|-----------|---------|------------|
| `PROPOSAL` | 工作區建立排程 | `proposed` |
| `OFFICIAL` | 組織層確認並分配 | `confirmed` |
| `REJECTED` | 組織層拒絕或取消 | `cancelled` |

#### 影響

- 工作區層的 `VALID_STATUS_TRANSITIONS` 規則不知曉組織層審批的存在
- 查詢工作區排程狀態無法直接得知是否因「技能不足」或「HR 主動取消」而被拒絕

#### 建議

1. 為組織層建立類似 `schedule.rules.ts` 的規則檔案
2. 在文件中明確記錄雙層狀態機的映射關係（可補充到 `docs/schedule/state-machine.md`）

---

### C-03 補償事件缺少 `aggregateVersion` ℹ️

#### 問題描述

`ScheduleAssignRejectedPayload` 和 `ScheduleProposalCancelledPayload` 沒有 `aggregateVersion` 欄位，而其他事件（`Assigned`、`Completed`、`AssignmentCancelled`）都有。

```typescript
// 有 aggregateVersion 的事件：
ScheduleAssignedPayload           → aggregateVersion: number  ✓
ScheduleCompletedPayload          → aggregateVersion: number  ✓
ScheduleAssignmentCancelledPayload → aggregateVersion: number ✓

// 沒有 aggregateVersion 的補償事件：
ScheduleAssignRejectedPayload     → 無 aggregateVersion       ✗
ScheduleProposalCancelledPayload  → 無 aggregateVersion       ✗
```

#### 因應措施

`projection.demand-board/_projector.ts` 已針對無 `aggregateVersion` 的事件改用「狀態守衛」（status-based guard）：
```typescript
// [S2] Status-based guard: idempotent — skip if demand is already closed.
if (!existing || existing.status === 'closed') {
  return;
}
```

#### 評估

現有因應措施有效，補償事件本質上不需要單調版本（事件本身是終態），但若未來需要重建投影，需注意此差異。

---

### C-04 `workspaceName` 傳遞路徑 ℹ️

#### 問題描述

`workspaceName` 欄位在多個型別中存在，但傳遞路徑需要追蹤：

```
ScheduleItem.workspaceName?         (optional)
    ↓ 透過 WorkspaceScheduleProposedPayload
WorkspaceScheduleProposedPayload.workspaceName?  (optional)
    ↓ 透過 applyDemandProposed
ScheduleDemand.workspaceName?       (optional)
```

`OrgScheduleProposal` **沒有** `workspaceName` 欄位，因此 Demand Board 的工作區名稱直接來自初始提案事件，不經過 Org 審批流程。

#### 評估

邏輯正確，但 `workspaceName` 是 Demand Board display-only 欄位，若工作區後來改名，舊需求卡片的名稱不會自動更新。

---

### C-05 技能需求欄位命名不一致 ⚠️

#### 問題描述

「技能需求」欄位在不同型別中使用了不同名稱：

| 型別 | 欄位名稱 |
|------|---------|
| `ScheduleItem` | `requiredSkills?: SkillRequirement[]` |
| `ScheduleDemand` | `requiredSkills?: SkillRequirement[]` |
| `WorkspaceScheduleProposedPayload` | `skillRequirements?: SkillRequirement[]` |
| `OrgScheduleProposal`（Zod Schema） | `skillRequirements?: SkillRequirement[]` |

**`requiredSkills`**（用於工作區層和 Demand Board 投影）
**`skillRequirements`**（用於跨 BC 事件契約和 Org Aggregate）

#### 追蹤路徑

```
ScheduleItem.requiredSkills
    ↓（Action 轉換）
WorkspaceScheduleProposedPayload.skillRequirements
    ↓（Org 接收）
OrgScheduleProposal.skillRequirements
    ↓（Demand Board 投影）
ScheduleDemand.requiredSkills
```

#### 評估

命名不一致需要在 Action 層進行屬性重新映射，增加了轉換誤差風險，且不符合 DRY 原則。

#### 建議

統一使用 `requiredSkills` 或 `skillRequirements`。若遵循 Payload 契約中的 `skillRequirements`，需同步更新 `ScheduleItem` 和 `ScheduleDemand`；若遵循讀模型的 `requiredSkills`，需同步更新 `WorkspaceScheduleProposedPayload` 和 `OrgScheduleProposal`。

---

## 一致性評分

| 面向 | 評分 | 說明 |
|------|------|------|
| 欄位存在性 | 🟢 90% | 核心欄位（scheduleItemId、orgId、workspaceId）在所有型別中一致存在 |
| 日期格式 | 🟡 60% | Workspace BC 用 Timestamp，其他層用 ISO 8601 字串 |
| 狀態機文件化 | 🟡 70% | 工作區層有規則檔案，組織層缺 |
| 技能需求命名 | 🟡 60% | 跨 BC 邊界存在 requiredSkills vs skillRequirements 命名分歧 |
| TraceId 一致性 | 🟢 95% | 所有型別都有 `traceId?: string`，R8 規則遵守良好 |
| 版本守衛 | 🟢 85% | 主要事件有 aggregateVersion，補償事件以狀態守衛替代，有效但不對稱 |

---

## 建議後續行動優先順序

1. **高優先（建議 V1.1）**：統一 `requiredSkills` vs `skillRequirements` 命名（C-05）
2. **中優先（建議 V1.1）**：為 `OrgScheduleStatus` 建立獨立規則檔案，文件化雙層狀態機映射（C-02）
3. **低優先（技術債）**：評估是否統一日期格式，或在 `shared/lib` 建立集中轉換工具（C-01）
4. **觀察中**：`workspaceName` 快照策略已知不更新，需確認 PRD 是否接受此設計（C-04）
