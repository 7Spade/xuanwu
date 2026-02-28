# Schedule 型別定義彙整

> 產生時間：2026-02-28
> 目的：集中列出所有與「排程（Schedule）」領域相關的 TypeScript 型別，供一致性分析使用。

---

## 1. 工作區排程項目（`src/shared/types/schedule.types.ts`）

### `ScheduleStatus`
```typescript
export type ScheduleStatus = 'PROPOSAL' | 'OFFICIAL' | 'REJECTED';
```
- 工作區層（Workspace BC）排程項目的本地狀態機

### `ScheduleItem`
```typescript
export interface ScheduleItem {
  id: string;
  accountId: string;        // 擁有者 Organization ID
  workspaceId: string;
  workspaceName?: string;
  title: string;
  description?: string;
  createdAt: Timestamp;     // Firestore Timestamp
  updatedAt?: Timestamp;    // Firestore Timestamp
  startDate: Timestamp;     // Firestore Timestamp
  endDate: Timestamp;       // Firestore Timestamp
  status: ScheduleStatus;
  originType: 'MANUAL' | 'TASK_AUTOMATION';
  originTaskId?: string;
  assigneeIds: string[];
  location?: Location;
  locationId?: string;      // FR-L2 子地點
  requiredSkills?: SkillRequirement[];
}
```

### `ScheduleDemandStatus`
```typescript
export type ScheduleDemandStatus = 'open' | 'assigned' | 'closed';
```
- Demand Board 投影讀模型的狀態

### `ScheduleDemandCloseReason`
```typescript
export type ScheduleDemandCloseReason =
  | 'completed'            // 正常完成
  | 'assignmentCancelled'  // 已確認後取消
  | 'proposalCancelled'    // HR 主動取消提案
  | 'assignRejected';      // 技能審核失敗（補償事件 A5）
```

### `ScheduleDemand`
```typescript
export interface ScheduleDemand {
  scheduleItemId: string;
  orgId: string;
  workspaceId: string;
  title: string;
  startDate: string;          // ISO 8601（注意：非 Timestamp）
  endDate: string;            // ISO 8601（注意：非 Timestamp）
  proposedBy: string;
  assignedMemberId?: string;  // FR-W6
  status: ScheduleDemandStatus;
  closeReason?: ScheduleDemandCloseReason;
  requiredSkills?: SkillRequirement[];
  locationId?: string;        // FR-L2
  workspaceName?: string;
  lastProcessedVersion?: number; // S2 版本守衛
  traceId?: string;           // R8 端對端追蹤
  updatedAt: string;          // ISO 8601
}
```

---

## 2. 技能型別（`src/shared/types/skill.types.ts`）

### `SkillTier`
```typescript
export type SkillTier =
  | 'apprentice'   // Tier 1 — 0–75 XP
  | 'journeyman'   // Tier 2 — 75–150 XP
  | 'expert'       // Tier 3 — 150–225 XP
  | 'artisan'      // Tier 4 — 225–300 XP
  | 'grandmaster'  // Tier 5 — 300–375 XP
  | 'legendary'    // Tier 6 — 375–450 XP
  | 'titan';       // Tier 7 — 450–525 XP
```

### `SkillRequirement`（跨 BC 契約）
```typescript
export interface SkillRequirement {
  tagSlug: string;
  tagId?: string;
  minimumTier: SkillTier;
  quantity: number;
}
```

### `SkillGrant`
```typescript
export interface SkillGrant {
  tagSlug: string;
  tagName?: string;
  tagId?: string;
  tier: SkillTier;
  xp: number;
  earnedInOrgId?: string;
  grantedAt?: Timestamp;
}
```

---

## 3. 跨 BC 事件契約（`src/features/shared.kernel.skill-tier/`）

### `WorkspaceScheduleProposedPayload`
```typescript
export interface WorkspaceScheduleProposedPayload {
  scheduleItemId: string;
  workspaceId: string;
  orgId: string;
  title: string;
  startDate: string;         // ISO 8601
  endDate: string;           // ISO 8601
  proposedBy: string;
  intentId?: string;
  skillRequirements?: SkillRequirement[];
  locationId?: string;       // FR-L2
  workspaceName?: string;
  traceId?: string;          // R8
}
```

---

## 4. 組織層排程 Aggregate（`src/features/account-organization.schedule/_schedule.ts`）

### `OrgScheduleStatus`
```typescript
export const ORG_SCHEDULE_STATUSES = [
  'draft', 'proposed', 'confirmed', 'cancelled', 'completed', 'assignmentCancelled'
] as const;
export type OrgScheduleStatus = (typeof ORG_SCHEDULE_STATUSES)[number];
```
- 組織審批流程的狀態機（共 6 個狀態）

### `OrgScheduleProposal`（Zod 推導）
```typescript
// orgScheduleProposalSchema 推導出的型別：
export type OrgScheduleProposal = {
  scheduleItemId: string;
  workspaceId: string;
  orgId: string;
  title: string;
  description?: string;
  startDate: string;         // ISO 8601
  endDate: string;           // ISO 8601
  proposedBy: string;
  status: OrgScheduleStatus;
  receivedAt: string;
  intentId?: string;
  skillRequirements?: SkillRequirement[];
  locationId?: string;       // FR-L2
  version: number;           // 預設 1，用於 R7 aggregateVersion 守衛
  traceId?: string;          // R8
}
```

---

## 5. 組織事件 Payload（`src/features/account-organization.event-bus/_events.ts`）

### `ScheduleAssignedPayload`
```typescript
export interface ScheduleAssignedPayload {
  scheduleItemId: string;
  workspaceId: string;
  orgId: string;
  targetAccountId: string;
  assignedBy: string;
  startDate: string;          // ISO 8601
  endDate: string;            // ISO 8601
  title: string;
  aggregateVersion: number;   // R7 用於 ELIGIBLE_UPDATE_GUARD
  traceId?: string;           // R8
}
```

### `ScheduleCompletedPayload`
```typescript
export interface ScheduleCompletedPayload {
  scheduleItemId: string;
  workspaceId: string;
  orgId: string;
  targetAccountId: string;
  completedBy: string;
  completedAt: string;        // ISO 8601
  aggregateVersion: number;   // R7
  traceId?: string;           // R8
}
```

### `ScheduleAssignmentCancelledPayload`
```typescript
export interface ScheduleAssignmentCancelledPayload {
  scheduleItemId: string;
  workspaceId: string;
  orgId: string;
  targetAccountId: string;
  cancelledBy: string;
  cancelledAt: string;        // ISO 8601
  reason?: string;
  aggregateVersion: number;   // R7
  traceId?: string;           // R8
}
```

### `ScheduleAssignRejectedPayload`
```typescript
export interface ScheduleAssignRejectedPayload {
  scheduleItemId: string;
  orgId: string;
  workspaceId: string;
  targetAccountId: string;
  proposedBy?: string;        // FR-N2：通知工作區負責人
  reason: string;
  rejectedAt: string;         // ISO 8601
  traceId?: string;           // R8
  // 注意：無 aggregateVersion（補償事件）
}
```

### `ScheduleProposalCancelledPayload`
```typescript
export interface ScheduleProposalCancelledPayload {
  scheduleItemId: string;
  orgId: string;
  workspaceId: string;
  cancelledBy: string;
  cancelledAt: string;        // ISO 8601
  reason?: string;
  traceId?: string;           // R8
  // 注意：無 aggregateVersion（補償事件）
}
```

---

## 6. 狀態機規則（`src/shared/lib/schedule.rules.ts`）

```typescript
export const VALID_STATUS_TRANSITIONS: Record<ScheduleStatus, ScheduleStatus[]> = {
  PROPOSAL: ['OFFICIAL', 'REJECTED'],
  OFFICIAL: ['REJECTED'],
  REJECTED: ['PROPOSAL'],
}
```
- 僅涵蓋工作區層 `ScheduleStatus`（PROPOSAL / OFFICIAL / REJECTED）
- **不涵蓋** 組織層 `OrgScheduleStatus`（draft / proposed / confirmed / cancelled / completed / assignmentCancelled）

---

## 7. Staleness SLA（`src/features/shared.kernel.staleness-contract/staleness-contract.ts`）

```typescript
export const StalenessMs = {
  TAG_MAX_STALENESS:    30_000,  // tag 派生資料 ≤ 30s
  PROJ_STALE_CRITICAL:    500,   // 授權/排班 Projection ≤ 500ms
  PROJ_STALE_STANDARD:  10_000, // 一般 Projection ≤ 10s
  PROJ_STALE_DEMAND_BOARD: 5_000, // Demand Board ≤ 5s（FR-W0 NFR）
} as const;
```

---

## 8. Firestore 路徑對應型別

| Firestore 路徑 | TypeScript 型別 | 日期欄位格式 |
|---------------|----------------|-------------|
| `accounts/{id}/schedule_items/{itemId}` | `ScheduleItem` | `Timestamp`（Firestore） |
| `orgScheduleProposals/{scheduleItemId}` | `OrgScheduleProposal` | `string`（ISO 8601） |
| `orgDemandBoard/{orgId}/demands/{itemId}` | `ScheduleDemand` | `string`（ISO 8601） |
