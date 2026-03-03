# scheduling.slice 互動邏輯 × UI/UX 設計開發指南

> Firebase × Next.js × Genkit × shadcn/ui
>
> 本指南以 **Command-Intent 模型** 為核心，橫跨 Workspace / Organization / Member 三個視角，完整定義任務排程系統的互動邏輯、狀態機與 UI/UX 設計規範。無代碼，只有設計決策。

---

## 0 ｜ 設計哲學：從 CRUD 到 Command-Intent

傳統 CRUD 讓使用者直接操作資料層，本系統改採單向資料流：

```
Intent → Command → Event → Projection → UI 更新
```

| 傳統 CRUD 思維 | Command-Intent 現代模型 |
|---|---|
| 使用者直接改資料 | 使用者產生 Intent，系統決定行為 |
| UI 立即樂觀更新 | 等待事件回流後才更新 UI |
| 任務是孤立文件 | 任務是語義圖（semantic-graph）的節點 |
| 成員是靜態角色 | 成員是隨任務動態增強的語義權重節點 |
| 排程靠手動搜尋 | 系統先建議，人類只做最後決策 |
| 狀態是字串欄位 | 狀態是有進度感的視覺流程 |

---

## 1 ｜ 三個角色視角定義

每個視角只暴露必要行為，視圖分離是本系統最重要的設計決策。

| 角色 | 定位 | 能看 ✅ | 不能看 ❌ |
|---|---|---|---|
| 🏢 Workspace | Demand Side（需求方） | 我的任務、安排進度、指派成員名單 | 排程工具、跨工作區資源 |
| 🏗 Organization | Supply Side（資源統籌方） | 所有任務池、所有成員、跨工作區狀態、資源熱圖 | 直接修改成員個資 |
| 👤 Member | Execution Side（執行方） | 被提議的任務、自己的排程日曆、XP 進度 | 其他成員排程、組織資源決策 |

---

## 2 ｜ 任務完整生命週期

### 任務狀態流

> 以進度條呈現，非抽象字串

```
⬜ 需求提出  →  🟡 等待安排  →  🔵 安排中  →  🟣 已安排  →  🟢 進行中  →  ✅ 完成
```

> ⚠ **重大條件變更**（時間 / 技能）→ 自動退回「等待安排」並清空所有指派

---

### Phase 1 — 需求建立（Workspace → Organization）

**Intent：`SubmitWorkIntent`**
使用者描述需求，系統轉換為語義節點發送給組織

#### UI 設計決策

> 💡 **核心心智模型：** 使用者感覺自己在「描述需求」，而非「排人」

- 表單欄位：做什麼事 / 什麼時間 / 什麼地點 / 需要哪些技能 / 每技能人數 / 優先級
- 提交後顯示提示：「此任務將提交給組織進行人力安排」
- **禁止**使用者自行指定成員姓名（心智模型保護）
- 提交後：任務卡片立即切換為 🟡 等待安排，禁止修改核心條件，允許補充說明

> 🚫 **禁止行為：** 提交後修改時間或技能需求，否則干擾進行中的排程決策

#### 跨 Slice 事件流

| 事件 / 命令 | 責任方 |
|---|---|
| `SubmitWorkIntent` | Workspace UI → gateway-command |
| `WorkRequested`（發出） | scheduling.slice → outbox-relay |
| 任務列表投影 + 組織待辦池更新 | projection.bus |
| 通知 Organization | notification-hub |
| 建立任務/技能/地點語義節點 | semantic-graph.slice（旁聽 WorkRequested） |

---

### Phase 2 — 組織審核視圖（Organization Dashboard）

**Organization 看到的不是清單，而是資源配置決策介面**

#### ① Demand Stream — 需求流

- 最新任務流，高優先級置頂，以**語義相關度排序**（非純時間）
- 任務卡片顯示：技能概覽 / 尚缺人數 / 優先級標籤 / 開始時間倒數
- 分三區塊：等待安排 / 部分已安排 / 已滿員

#### ② Resource Heatmap — 資源熱圖

- 由 semantic-graph + skill-xp.slice 聯合提供資料
- 顯示技能分佈密度、等級密度、成員時間負載（熱力色塊圖）

> 🧠 **設計意圖：** 管理者先感知全局資源狀態，再進入單任務決策，不是逐個任務排人

#### ③ Smart Assignment Panel — 智慧分派面板

- 點擊任務 → 進入排程面板，**左右雙欄結構**
  - 左欄：任務需求（技能 / 人數 / 時間）
  - 右欄：可用人員池（自動分群，無需管理者手動搜尋）
- 人員池自動分群：
  - ✅ 符合技能且等級足夠
  - ⚠ 技能足夠但時間衝突
  - ❌ 技能不足
- 系統自動產生候選名單 + Confidence Score
- **Confidence Score 計算來源：** 技能匹配度 / XP 等級接近度 / 當日負載 / 地點語義距離 / 歷史合作關係

---

### Phase 3 — 指派交互設計（最關鍵）

**`AssignMembersCommand`**
`Accept Suggestion` 為主要操作，`Manual Override` 為次要操作

#### 指派互動方式

> ✋ **設計決策：** 不用下拉選單選人。採用**拖曳 / 點擊加入「任務名單區」的配額填滿模型**

- 名單區中間持續顯示：「尚缺 X / N 位 Expert」讓管理者自然補滿
- 主要操作：採用建議（Accept Suggestion）
- 次要操作：手動調整（Manual Override）

#### 即時回饋規則

| 觸發情境 | UI 回饋方式 |
|---|---|
| 加入成員 | 立即顯示技能匹配標記 + 當天已排任務數 |
| 時間衝突偵測 | 明顯 **Inline 紅色警示**（非 toast） |
| XP 等級顯示 | `Expert（182 / 225）` 進度條，不顯示冷冰冰數字 |
| 配額已滿 | 自動顯示「已滿員」狀態標記 |
| 指派失敗（DLQ） | ⚠ 指派處理中（重試）—— 來自 infra.dlq-manager |

#### 跨 Slice 事件流

| 事件 / 命令 | 責任方 |
|---|---|
| `AssignMembersCommand` | Organization UI → gateway-command |
| `MembersAssigned`（發出） | scheduling.slice |
| 通知成員 | notification-hub |
| 任務投影更新 | projection.bus |
| 語義圖關係更新 | semantic-graph.slice |

---

### Phase 4 — 雙階段確認流程

**避免「假滿員」問題，確保排程真實性**

- 成員收到通知：「你被提議參與任務」（狀態為 `Proposed`，非 `Confirmed`）
- 成員操作：Accept / Reject / Suggest Replacement（進階）

> 🔄 **拒絕自動流程：** `MemberRejectedAssignment` → 語義圖移除關係 → 重新計算候選 → 通知管理者

| 成員狀態 | 對應 UI 呈現 |
|---|---|
| `Proposed` | 卡片顯示「等待你確認」藍色標記 |
| `Accepted` | 任務進入已安排，綠色確認標記 |
| `Rejected` | 自動通知管理者，顯示「需補人」警示 |
| `Suggest Replacement` | 成員可提名他人，進入新一輪 Proposed |

---

### Phase 5 — 執行與 XP 增長

**`WorkCompleted` → XP 增長 → 語義圖強化**

- 任務完成：Workspace 或 Organization 任一方皆可標記完成

#### XP 增長事件鏈

| 事件 | 責任方 / 行為 |
|---|---|
| `WorkCompleted`（發出） | scheduling.slice |
| 增加 XP | skill-xp.slice 監聽 WorkCompleted |
| `SkillLevelUp`（若升級） | skill-xp.slice 發出 |
| 任務 → 成員關係權重強化 | semantic-graph 更新（未來推薦更精準） |

---

## 3 ｜ 任務狀態機完整定義

> 每個狀態轉移必須由事件驅動，不可直接修改 Firestore 欄位。

| 當前狀態 | 觸發事件 | 下一狀態 | 觸發者 |
|---|---|---|---|
| `Draft` | `WorkRequested` | `Pending` | Workspace |
| `Pending` | `AssignMembersCommand` | `Assigning` | Organization |
| `Assigning` | `AllMembersAccepted` | `Scheduled` | System |
| `Assigning` | `MemberRejectedAssignment` | `Partial` | System |
| `Partial` | `AssignMembersCommand` | `Assigning` | Organization |
| `Scheduled` | `TaskStarted` | `InProgress` | System / Auto |
| `InProgress` | `WorkCompleted` | `Completed` | Workspace / Org |
| `Assigning / *` | `CoreConditionChanged` | `Pending`（重置） | System（自動） |

---

## 4 ｜ UI/UX 設計規範

### 4.1 — shadcn/ui 組件選型

| UI 場景 | 建議組件 / 設計方式 |
|---|---|
| 任務卡片 | `Card` + `Badge`（狀態）+ `Progress`（進度條） |
| 需求流 | `ScrollArea` + `Separator` 分群 |
| 資源熱圖 | 自定義 Grid + `Tooltip`（hover 顯示成員細節） |
| 智慧分派面板 | `ResizablePanel` 左右分割 + DragDrop 區域 |
| 人員池分群 | `Tabs`（符合 / 衝突 / 不足） |
| 配額指示器 | `Progress` + `Badge` 組合，顯示 X / N 人 |
| XP 進度條 | `Progress` + `Label`（稱號 + 數字） |
| 成員確認通知 | `Alert` + `Dialog`（確認 / 拒絕） |
| 事件 Log | `Sheet`（側滑面板）顯示事件歷程 |
| 衝突警示 | `Alert variant="destructive"`，inline 顯示 |

---

### 4.2 — 互動回饋設計原則

> 🎯 **黃金法則：** UI 更新等待事件回流，不做 optimistic 假更新。顯示「處理中」而非立即完成

- 提交操作 → 立即顯示 Skeleton，等事件回流才渲染真實數據
- 衝突偵測 → **Inline 紅色警示**，不用 toast
- 批次指派 → 顯示進度條（已處理 N / 總 N 人）
- 事件失敗 → ⚠ 標記於任務卡片，可點擊查看 DLQ 狀態
- 狀態轉移 → 動畫過渡（進度條前推），非瞬間切換

---

### 4.3 — 資訊密度分層

| 層級 | 顯示內容 |
|---|---|
| 一覽（卡片） | 狀態標籤 / 技能概覽 / 缺人數 / 倒數時間 |
| 展開（面板） | 完整技能需求 / 候選名單 / Confidence Score |
| 詳細（Drawer） | 成員排程日曆 / 衝突細節 / 事件歷程 |
| 系統層（Sheet） | DLQ 狀態 / Event Log / 投影同步狀態 |

---

### 4.4 — Design Token（Dark Mode）

| Token 名稱 | 用途與建議值 |
|---|---|
| `--color-intent-pending` | `#D97706`（🟡 等待安排） |
| `--color-intent-assigning` | `#3B82F6`（🔵 安排中） |
| `--color-intent-scheduled` | `#8B5CF6`（🟣 已安排） |
| `--color-intent-active` | `#10B981`（🟢 進行中） |
| `--color-intent-done` | `#6B7280`（✅ 完成） |
| `--color-conflict` | `#DC2626`（衝突紅） |
| `--color-confidence-high` | `#059669`（高匹配） |
| `--color-confidence-low` | `#D97706`（低匹配） |

---

## 5 ｜ 關鍵設計難點與解法

### 難點 A — 任務被改動怎麼辦？

> ⚙ **觸發條件：** 時間 / 技能需求（核心條件）被修改

- 自動觸發 `CoreConditionChanged` 事件
- 任務退回「等待安排（Pending）」
- 清空所有已指派成員關係
- 通知相關成員：「任務條件已更新，原指派已取消」
- UI：任務卡片高亮警示 + 退回動畫

---

### 難點 B — 多工作區同時搶人

- Organization 視圖提供**成員排程日曆視圖**，顯示跨工作區整體負載
- 指派面板顯示成員「當天已排任務數」
- Resource Heatmap 顯示跨工作區的負載熱力圖
- 設計原則：不在單任務內決策，先看全局再操作

---

### 難點 C — 假滿員問題

- 所有指派初始狀態為 `Proposed`，只有全員 `Accepted` 才轉為「已安排」
- Member 拒絕 → 系統自動降回「部分安排（Partial）」
- UI 顯示各成員確認狀態：🟢 綠色勾 / 🟠 橙色待確認 / 🔴 紅色拒絕

---

### 難點 D — 可靠性與事件失敗

- 所有命令透過 outbox-relay 保證 at-least-once 投遞
- 失敗事件進入 `infra.dlq-manager`
- UI 以 ⚠ 標記顯示於任務卡片，**非靜默失敗**
- 管理者可進入 `observability.slice` 查看事件處理狀態

---

## 6 ｜ Slice 責任邊界總表

| Slice | 負責 | 不負責 |
|---|---|---|
| `scheduling.slice` | 定義任務行為、發出領域事件、狀態機管理 | UI 渲染、跨 Slice 查詢、XP 計算 |
| `semantic-graph.slice` | 語義關係圖、Confidence Score 計算 | 任務狀態機、通知發送 |
| `skill-xp.slice` | XP 增長、等級計算、SkillLevelUp 事件 | 任務指派邏輯 |
| `projection.bus` | 維護只讀投影快取供 gateway-query 使用 | 寫入業務狀態 |
| `notification-hub` | 跨角色通知分發 | 通知內容業務邏輯 |
| `infra.dlq-manager` | 失敗事件捕捉與重試 | 業務規則判斷 |
| `observability.slice` | 事件歷程介面、系統狀態查看 | 業務行為觸發 |

---

## 7 ｜ 最終設計原則總結

| 設計原則 | 具體實踐 |
|---|---|
| 需求與資源分離 | Workspace 不看排程工具，Organization 才看 |
| 配額填滿模型 | 顯示「尚缺 N 人」，非勾選清單 |
| 雙階段確認 | Proposed → Accepted，避免假滿員 |
| 即時衝突提示 | Inline 紅色警示，非 toast |
| 視圖權限最小化 | 每個角色只看到必要資訊 |
| 狀態以進度呈現 | 進度條 + 圖示，非抽象字串 |
| 重大變更自動退回 | CoreConditionChanged → Pending + 清空指派 |
| 事件回流才更新 UI | 不做 optimistic 假更新 |
| 系統先建議，人類決策 | Confidence Score 候選名單為主，手動為輔 |
| 任務是圖節點 | semantic-graph 維護語義關係，推薦更精準 |

---

*End of scheduling.slice Design Guide*
