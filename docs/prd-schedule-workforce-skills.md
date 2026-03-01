# PRD: 排程・人力・技能管理系統
## Schedule · Workforce · Skills Management System

**文件版本 / Document Version:** 1.1  
**最後更新 / Last Updated:** 2026-02-26  
**狀態 / Status:** Active  
**產品範疇 / Product Scope:** 玄武 (Xuanwu) 工作區平台 — VS4 / VS5 / VS6 / VS3  
**主要利害關係人 / Stakeholders:** 組織管理者、工作區擁有者、前線人員、系統架構師

> **v1.1 修訂重點（2026-02-26）：** 補充廠區（Workspace）領域模型定義、廠區子地點（Sub-location）資料結構、需求公告板（Demand Board）設計，並將「手動人力調度無法操作」列為最高優先缺口（Critical Gap #0）。

---

## 目錄 / Table of Contents

1. [需求背景 Background](#1-需求背景-background)
2. [問題陳述 Problem Statement](#2-問題陳述-problem-statement)
3. [痛點分析 Pain Points](#3-痛點分析-pain-points)
4. [目標 Goals](#4-目標-goals)
5. [非目標 Non-goals](#5-非目標-non-goals)
6. [使用者角色 User Personas](#6-使用者角色-user-personas)
7. [使用情境 Use Cases](#7-使用情境-use-cases)
8. [使用流程 User Flows](#8-使用流程-user-flows)
9. [功能需求 Functional Requirements](#9-功能需求-functional-requirements)
10. [非功能需求 Non-Functional Requirements](#10-非功能需求-non-functional-requirements)
11. [權限與角色模型 Permission Model](#11-權限與角色模型-permission-model)
12. [資料模型假設 Data Assumptions](#12-資料模型假設-data-assumptions)
13. [業務規則 Business Rules](#13-業務規則-business-rules)
14. [邊界條件與例外處理 Edge Cases](#14-邊界條件與例外處理-edge-cases)
15. [整合需求 Integrations](#15-整合需求-integrations)
16. [風險分析 Risks](#16-風險分析-risks)
17. [相依條件 Dependencies](#17-相依條件-dependencies)
18. [驗收標準 Acceptance Criteria](#18-驗收標準-acceptance-criteria)
19. [成功指標 KPI / Metrics](#19-成功指標-kpi--metrics)
20. [版本規劃 Milestones / Roadmap](#20-版本規劃-milestones--roadmap)

---

## 1. 需求背景 Background

### 1.1 領域術語釐清（Domain Glossary）

在本 PRD 中，以下術語具有特定的業務含義，**與日常用語不同，請嚴格遵守**：

| 術語 | 業務定義 | 對應英文 |
|------|---------|---------|
| **Account（帳號/公司）** | 代表一家真實存在的公司或個人組織。Account 持有一批員工（OrgMember），負責對外承接業務並調配自己的人力資源。 | Company / Organization entity |
| **Workspace（廠區）** | 一個**具有實際地址的廠區**（manufacturing site / worksite）。廠區有自己的業務需求，會向所屬 Account 提出人力需求。 | Physical worksite / factory zone |
| **WorkspaceLocation（廠區子地點）** | 廠區內的具體位置，例如「A 棟 3 樓倉儲室」。一個廠區可包含多個子地點。 | Sub-location within a worksite |
| **OrgMember（組織成員/員工）** | 屬於某 Account 的具體員工。其技能等級（SkillTier）決定其可接受的任務類型。 | Staff / Employee |
| **ScheduleDemand（排班需求）** | 工作區（廠區）向所屬 Account 提出的**人力需求單**，包含需要的技能組合、時段、地點。 | Staffing demand / work order |
| **ScheduleProposal（排班提案）** | Account 根據 ScheduleDemand 發起的指派流程，通過 Saga 驗證後形成正式指派（Assignment）。 | Assignment proposal |

### 1.2 業務場景模型

```
Account（帳號/公司）
  ├─ 持有員工（OrgMember × N）：每人有技能等級（SkillGrant / XP）
  ├─ 持有廠區（Workspace × N）：每個廠區是一個真實地點
  │    ├─ 廠區子地點（WorkspaceLocation × M）：棟/樓/室
  │    └─ 廠區業務：排班需求、任務、文件
  └─ 人力調度（核心功能）：
       Workspace 提出 ScheduleDemand（含技能標籤）
         ↓
       Account 從自己的員工中找到符合條件的人
         ↓
       發起 ScheduleProposal → Saga 驗證 → Assignment（指派到廠區）
```

**關鍵約束**：廠區（Workspace）**不擁有**員工，它只能**提需求**。員工屬於 Account（公司）。Account 負責媒合員工到廠區的需求。

### 1.3 系統現狀

目前系統已具備：
- **身份與帳號管理**（VS1–VS3）：帳號、角色、技能 XP 積累
- **組織結構管理**（VS4）：組織、成員、技能標籤池
- **工作區業務管理**（VS5）：工作、任務、排程提案界面
- **排班協作 Saga**（VS6）：`WorkspaceScheduleProposed → OrgEligibilityCheck → ScheduleAssigned` 跨 BC 事件鏈

然而，上述功能目前以領域事件與聚合狀態機的形式存在於後端，**缺乏完整的使用者操作界面、功能完整性，以及可用的端對端使用體驗**。本 PRD 旨在定義「使用者能實際操作並在真實場景產生業務價值」的排程・人力・技能完整產品需求。

---

## 2. 問題陳述 Problem Statement

**核心問題：Account（公司）目前根本無法有效調配自己的人力到廠區（Workspace），手動都做不到，更遑論 AI 輔助。**

### 🔴 Critical Gap #0 — 手動人力調度完全缺失

**現況**：雖然後端存在排班 Saga（`WorkspaceScheduleProposed → ScheduleAssigned`），但：
- Account 管理者**沒有一個「需求公告板」**可以看到哪些廠區有人力缺口
- Account 管理者**無法主動選擇「指派員工 X 去廠區 Y 的需求 Z」**
- 當前 UI 只有廠區（Workspace）側的提案表單，缺少 Account 側的需求審核與人工指派功能
- Saga 依賴自動比對，但**沒有手動指派的 fallback 路徑**，導致任何 Saga 失敗後流程卡死

**後果**：整個排程功能鏈（手動 + 自動 + AI）都建立在一個**無法被使用者操作的地基**上。

### 其他已確認問題

1. **排程提案流程不透明**：工作區管理者提出人力需求後，不清楚目前審核狀態、指派進度與候選人資訊。
2. **技能能見度不足**：組織無法一覽成員的技能組合與等級分佈，導致人力規劃依賴個人記憶或離線試算表。
3. **資格驗證缺乏自動化**：手動比對技能需求（如需要 2 名 `expert` 等級的 `TypeScript` 工程師）費時且易出錯。
4. **人力可用性不透明**：成員當前是否有衝突排班、是否 `eligible` 可接受新指派，目前無視覺化呈現。
5. **排程生命週期缺乏追蹤**：從 `proposed → confirmed → completed/assignmentCancelled` 的完整生命週期，使用者無法直觀跟蹤。
6. **廠區子地點缺失**：廠區（Workspace）沒有子地點（棟/樓/室）管理能力，排班無法指定到具體工作地點。

---

## 3. 痛點分析 Pain Points

| # | 角色 | 痛點 | 頻率 | 嚴重度 |
|---|------|------|------|--------|
| **P0** | **Account 管理者（公司 HR）** | **根本無法查看哪些廠區有開放的人力需求，無法手動指派員工** | 每日 | 🔴 Critical |
| **P0** | **Workspace 管理者（廠區）** | **廠區無法明確張貼「需要什麼技能、幾人、在哪個地點」的正式需求單** | 每日 | 🔴 Critical |
| P1 | 組織管理者 | 找不到符合技能需求的可用人員，需手動查詢多個系統 | 每日 | 🔴 高 |
| P1 | 工作區擁有者 | 提案送出後缺乏進度回饋，不知道何時會有人確認 | 每週 | 🟠 中高 |
| P2 | 前線人員 | 不清楚自己的技能等級與可接受哪類排班機會 | 不定期 | 🟡 中 |
| P2 | 組織管理者 | 排班完成或取消後，成員 `eligible` 狀態未及時更新，造成誤判 | 每月 | 🔴 高 |
| P2 | 前線人員 | 排班被取消時缺乏通知，造成出勤空窗 | 每月 | 🔴 高 |
| P3 | 組織管理者 | 技能 XP 分佈不透明，無法做長期人才培育規劃 | 季度 | 🟡 中 |

---

## 4. 目標 Goals

### 🔴 Critical Prerequisites（P0 — 手動路徑必須先跑通）

| # | 目標 | 可量化指標 |
|---|------|-----------|
| **G0a** | **需求公告板可操作**：廠區管理者能在 UI 張貼正式人力需求單（含技能標籤、時段、子地點），Account 管理者能在 UI 看到所有開放需求 | 需求張貼→可見時間 < 5 秒 |
| **G0b** | **手動人工指派可操作**：Account 管理者可在 UI 選擇員工、點擊「指派到此需求」，完成一次手動指派，觸發 ScheduleProposal 流程 | 手動指派操作 ≤ 3 步完成 |

### 主要目標

| # | 目標 | 可量化指標 |
|---|------|-----------|
| G1 | **排程提案可見性**：工作區可在 UI 發起排班需求，並實時看到審核狀態 | 提案→確認時間縮短 50% |
| G2 | **自動化人力比對**：依技能需求自動篩選 `eligible` 候選人（G0a/G0b 完成後可疊加） | 符合資格候選人召回精準率 ≥ 90% |
| G3 | **技能資訊可視化**：成員可查看自己的技能組合；組織可查看整體人才圖譜 | 技能查詢 UI 使用率 ≥ 60% |
| G4 | **生命週期完整性**：排班從提案到完成/取消的完整流程可操作、可追蹤 | 全流程操作完成率 ≥ 95% |
| G5 | **人力 `eligible` 狀態準確性**：指派完成或取消後，成員可用狀態自動更新 | 狀態誤報率 < 0.1% |
| G6 | **廠區子地點管理**：廠區（Workspace）可新增、編輯子地點（棟/樓/室），排班提案可指定子地點 | 子地點選擇 UI 可用 |

### 次要目標

- 提升組織對 XP 積累機制的理解，增加成員參與技能成長的動機
- 建立可延伸的人力規劃基礎設施，為未來 AI 排班建議做準備

---

## 5. 非目標 Non-goals

| 非目標 | 原因 |
|--------|------|
| 排班費用計算與薪資整合 | 超出當前平台財務模組範疇 |
| 跨組織人力共享（借調） | 需要獨立的跨 BC 人力市場設計，放入下一版本 |
| 技能認證與第三方驗證整合 | 外部 API 整合複雜度高，另行評估 |
| 客戶（Client）端排班可見性 | 現有架構不包含 Client BC，另行規劃 |
| AI 自動排班推薦 | 可作為 V2 特性，不納入 V1 範疇 |
| 打卡/出勤實際記錄 | 屬於 HR 系統範疇，現有平台不處理 |

---

## 6. 使用者角色 User Personas

### Persona 1 — Account 管理者 / 公司 HR（Company HR / Workforce Dispatcher）

- **背景**：代表一家真實的公司（Account），負責管理公司底下所有員工（OrgMember），掌管各廠區（Workspace）的人力調度
- **技術能力**：中高，熟悉業務操作系統
- **主要目標**：
  1. 看到所有廠區目前有哪些開放的人力需求
  2. 根據員工的技能等級與可用狀態，**手動或自動把員工調派到廠區需求**
  3. 最大化人力利用率，避免人員空窗或重複指派
- **挫折點（Critical）**：目前完全看不到廠區需求，無法手動指派，整個人力調度流程停擺
- **使用頻率**：每日使用，每週有 5–20 次排班決策

### Persona 2 — Workspace 管理者 / 廠區主管（Worksite Manager / Requester）

- **背景**：負責一個具有實際地址的廠區（Workspace）業務推進，廠區內有多個子地點（棟/室）。需要向所屬 Account（公司）申請人力支援
- **技術能力**：中等
- **主要目標**：
  1. 清楚填寫廠區的人力需求（需要什麼技能、幾人、在廠區哪個地點、哪個時段）
  2. 提出需求後能即時看到 Account 的回應進度
  3. 確保廠區業務不因人力缺口而延誤
- **挫折點**：排班需求送出後如石沉大海，不知何時有回應；無法指定到廠區具體子地點
- **使用頻率**：每週 2–5 次提案

### Persona 3 — 前線人員 / 員工（Staff / Assignee）

- **背景**：屬於某 Account（公司）的員工，接受排班指派後前往廠區（Workspace）執行任務
- **技術能力**：低至中
- **主要目標**：清楚知道自己的排班安排（去哪個廠區的哪個地點）與技能成長狀況
- **挫折點**：排班突然取消而沒有通知，技能等級不透明，不知道自己能被指派到哪類廠區
- **使用頻率**：每週查看 1–3 次排班狀態，被通知時確認

### Persona 4 — Account 擁有者 / 公司決策者（Company Owner / Strategist）

- **背景**：公司最高權限持有者，旗下有多個廠區（Workspace）與多名員工（OrgMember），關注整體人才結構與長期規劃
- **技術能力**：高
- **主要目標**：洞察公司技能分佈，做出人才培育決策；監控各廠區的人力需求滿足率
- **使用頻率**：每月查看人才圖譜與廠區人力報表 1–2 次

---

## 7. 使用情境 Use Cases

### UC-S (Schedule / 排程)

| ID | 情境 | 主要角色 | 觸發條件 |
|----|------|---------|---------|
| UC-S1 | 創建排班提案（含技能需求與子地點） | Workspace 管理者（廠區主管） | 廠區有業務需要人力支援 |
| UC-S2 | 審核並手動指派成員到排班（Critical P0） | Account 管理者（公司 HR） | 收到 `proposed` 狀態提案 |
| UC-S3 | 拒絕排班提案（技能不符/無可用人員） | Account 管理者 | 找不到符合條件的成員 |
| UC-S4 | 取消排班提案（工作區端撤回） | Workspace 管理者 | 業務需求改變 |
| UC-S5 | 完成排班（任務結束，釋放人員） | Account 管理者 | 排班期結束 |
| UC-S6 | 取消已確認的指派（緊急狀況） | Account 管理者 | 業務異常或成員無法出勤 |
| UC-S7 | 查看月曆排班概覽 | 所有角色 | 進入排程頁面 |

### UC-W (Workforce / 人力)

| ID | 情境 | 主要角色 | 觸發條件 |
|----|------|---------|---------|
| **UC-W0** | **查看需求公告板（廠區開放的人力需求列表）** | **Account 管理者** | **進入人力管理或排班頁面** |
| **UC-W1** | **手動指派員工到廠區需求（Force Assignment）** | **Account 管理者** | **選擇員工 → 點擊指派到需求** |
| UC-W2 | 查看組織人力總覽（可用/不可用成員列表） | Account 管理者 | 進行人力規劃 |
| UC-W3 | 查看個別成員的技能與 `eligible` 狀態 | Account 管理者 | 評估指派候選人 |
| UC-W4 | 依技能需求篩選可用人員 | Account 管理者 | 建立排班候選清單 |
| UC-W5 | 查看成員當前排班衝突 | Account 管理者 | 避免雙重指派 |

### UC-K (Skills / 技能)

| ID | 情境 | 主要角色 | 觸發條件 |
|----|------|---------|---------|
| UC-K1 | 查看個人技能組合與 XP 進度 | 前線人員 | 進入個人技能頁面 |
| UC-K2 | 查看技能等級定義（Apprentice → Titan） | 所有成員 | 了解技能體系 |
| UC-K3 | 透過任務完成獲得技能 XP | 前線人員 | 任務標記完成 |
| UC-K4 | 查看技能升級記錄（XP 帳本） | 前線人員 / Account 管理者 | 審計或成長追蹤 |
| UC-K5 | 查看組織技能人才分佈圖 | Account 擁有者 | 人才規劃決策 |

### UC-L (Location / 廠區子地點) — NEW

| ID | 情境 | 主要角色 | 觸發條件 |
|----|------|---------|---------|
| UC-L1 | 新增廠區子地點（棟/樓/室等） | Workspace 管理者 | 設定廠區地點結構 |
| UC-L2 | 在排班提案中指定子地點 | Workspace 管理者 | 提案需要指定到具體工作位置 |
| UC-L3 | 員工查看指派到的廠區子地點 | 前線人員 | 確認出勤地點 |

---

## 8. 使用流程 User Flows

### Flow 1 — 排班提案到指派確認 (Happy Path)

```
工作區擁有者
  │
  ├─ [打開工作區排程頁面]
  ├─ [點擊 + 新增排班]
  ├─ [填寫表單：標題、日期範圍、地點、技能需求（技能+等級+數量）]
  ├─ [送出提案]
  │
  └─ 系統觸發: workspace:schedule:proposed (含 traceId)
       │
       └─▶ [VS6 Scheduling Saga 啟動]
              │
              ├─ 查詢 orgEligibleMemberView（技能比對）
              ├─ 找到符合的 eligible 成員
              │
              └─ 系統觸發: organization:schedule:assigned
                   │
                   └─▶ 組織管理者收到通知
                          │
                          ├─ [進入 Governance Panel]
                          ├─ [查看候選人列表（技能、等級、可用性）]
                          ├─ [選擇成員，點擊確認指派]
                          │
                          └─ 排班狀態 → confirmed
                               │
                               └─▶ 前線人員收到 FCM 推播通知
                                      └─ [查看個人排班頁面確認]
```

### Flow 2 — 排班拒絕補償路徑

```
[VS6 Saga — 找不到符合技能需求的 eligible 成員]
  │
  └─ 系統觸發: organization:schedule:assignRejected (補償事件)
       │
       ├─▶ 工作區擁有者收到通知（提案被拒，含拒絕原因）
       └─▶ 排班狀態 → cancelled
              │
              └─ [工作區擁有者可修改需求後重新提案]
```

### Flow 3 — 排班完成，人員恢復可用

```
組織管理者
  │
  ├─ [任務結束，點擊「完成排班」]
  │
  └─ 系統觸發: organization:schedule:completed
       │
       ├─▶ eligible flag → true (projection.org-eligible-member-view 更新)
       ├─▶ 前線人員收到排班結束通知
       └─▶ 排班狀態 → completed
```

### Flow 4 — 技能 XP 積累

```
前線人員完成任務
  │
  └─ 工作區擁有者/管理者標記任務完成並給予技能獎勵
       │
       └─ 系統觸發: account:skill:xpAdded
              │
              ├─▶ XP 寫入帳本 (Invariant #13 — 帳本先於聚合)
              ├─▶ 聚合更新 (clamp 0~525)
              └─▶ 事件傳遞至 orgEligibleMemberView
                     │
                     └─▶ 技能等級推導更新（Invariant #12 — 等級不存 DB）
```

---

## 9. 功能需求 Functional Requirements

### FR-S — 排程功能 (Schedule)

| ID | 功能 | 優先級 | VS 歸屬 |
|----|------|--------|---------|
| FR-S1 | **排班提案表單**：標題、描述、日期範圍、地點、技能需求（技能×等級×數量，支援多項） | P0 | VS5 |
| FR-S2 | **月曆視圖**：以月曆方式顯示工作區內所有排班項目，支援月份切換 | P0 | VS5 |
| FR-S3 | **排班狀態標示**：在月曆和列表中以不同顏色/標籤顯示 `proposed/confirmed/completed/cancelled/assignmentCancelled` | P0 | VS5 |
| FR-S4 | **Governance Panel**：組織管理者可審核 `proposed` 提案，查看自動比對的候選人，確認或拒絕指派 | P0 | VS4 |
| FR-S5 | **排班詳情頁**：顯示完整排班資訊、指派的成員資訊、技能符合度 | P1 | VS5 |
| FR-S6 | **排班完成操作**：管理者可標記排班為完成，自動釋放人員 | P0 | VS4 |
| FR-S7 | **取消已確認指派**：緊急狀況下取消 `confirmed` 狀態的指派，自動恢復成員 eligible | P1 | VS4 |
| FR-S8 | **帳戶排班視圖**：前線人員可查看自己所有 `confirmed` 排班安排 | P1 | VS5 |
| FR-S9 | **工作區排班統計**：顯示排班數量、確認率、平均確認時間等摘要 | P2 | VS5 |

### FR-W — 人力功能 (Workforce)

> **Critical Gap #0 — 以下 FR-W0 / FR-W6 為 V1.0 最高優先缺口，是整個人力調度流程的前置條件。**

| ID | 功能 | 優先級 | VS 歸屬 |
|----|------|--------|---------|
| **FR-W0** | **需求公告板（Demand Board）**：Account 管理者可在專屬頁面看到所有所屬廠區的 ScheduleDemand。預設顯示 `open`（OrgScheduleStatus='proposed'，尚未指派）和 `assigned`（OrgScheduleStatus='confirmed'，已指派但進行中）的需求；`open` 需求以紅色標示（待處理），`assigned` 需求以綠色標示（進行中）。`closed` 需求預設隱藏，可透過「顯示已結案」篩選查看。每張需求卡顯示廠區名稱、所需技能標籤、時段、子地點；支援依技能/廠區/日期/狀態篩選 | **P0** | **VS4/VS5** |
| **FR-W6** | **手動指派（Force Assignment）**：Account 管理者在需求公告板或 Governance Panel 選擇某需求，展開可用人員清單（過濾 eligible + 技能符合），點擊指派即觸發 `workspace:schedule:proposed` + Saga 確認流程；整個操作不超過 3 步 | **P0** | **VS4/VS5** |
| **FR-W7** | **指派候選人快速篩選**：在手動指派流程中，依技能標籤和等級即時過濾候選人列表；不符合需求技能的成員以灰色顯示但仍可選擇（Override Assignment，附警告） | **P0** | **VS4** |
| FR-W1 | **人力總覽面板**：顯示組織全部成員列表，標示 `eligible/non-eligible` 狀態 | P0 | VS4 |
| FR-W2 | **技能比對面板**：依技能需求顯示符合條件的可用人員清單，含技能等級與 XP | P0 | VS6 |
| FR-W3 | **成員技能卡片**：查看特定成員的全部技能列表、等級與 XP 數值 | P1 | VS4 |
| FR-W4 | **成員排班衝突警示**：當嘗試指派已有排班衝突的成員時顯示警告 | P1 | VS4 |
| FR-W5 | **人力可用性過濾器**：依「全部/可用/不可用」篩選人力列表 | P1 | VS4 |

### FR-L — 廠區地點功能 (Location)

| ID | 功能 | 優先級 | VS 歸屬 |
|----|------|--------|---------|
| **FR-L1** | **廠區子地點管理**：Workspace OWNER 可在工作區設定中新增/編輯/刪除子地點（如「A棟3樓辦公室」、「B館裝配區」），每個子地點有名稱與用途描述 | **P0** | **VS5** |
| **FR-L2** | **排班需求綁定子地點**：提交排班提案時可選擇指定子地點；子地點資訊跟隨排班卡片顯示 | **P0** | **VS5/VS6** |
| FR-L3 | **子地點可用性概覽**：在排班月曆視圖中，可依子地點過濾顯示對應排班 | P1 | VS5 |

### FR-K — 技能功能 (Skills)

| ID | 功能 | 優先級 | VS 歸屬 |
|----|------|--------|---------|
| FR-K1 | **個人技能頁面**：顯示使用者所有技能、XP 進度條與等級 badge | P0 | VS3 |
| FR-K2 | **技能等級說明**：顯示 7 個等級定義（Apprentice → Titan）及 XP 門檻 | P1 | VS3 |
| FR-K3 | **XP 歷史紀錄**：顯示技能 XP 增減歷史，含來源、時間與 delta | P1 | VS3 |
| FR-K4 | **組織技能分佈圖**：以熱力圖或統計圖呈現組織各技能的人員等級分佈 | P2 | VS4 |
| FR-K5 | **技能需求標籤池**：排班提案可從組織定義的技能標籤池（`account-organization.skill-tag`）選取需求技能 | P0 | VS4 |

### FR-N — 通知功能 (Notifications)

| ID | 功能 | 優先級 |
|----|------|--------|
| FR-N1 | 排班提案被確認時，向指派成員發送 FCM 推播（含 traceId） | P0 |
| FR-N2 | 排班提案被拒絕時，向工作區擁有者發送通知（含拒絕原因） | P1 |
| FR-N3 | 排班被取消（`assignmentCancelled`）時，向相關成員發送通知 | P0 |
| FR-N4 | 排班即將開始（T-24h）時，發送提醒通知 | P2 |

---

## 10. 非功能需求 Non-Functional Requirements

### NFR-P — 效能 (Performance)

| 指標 | 目標值 | 依據 |
|------|--------|------|
| 候選人查詢回應時間 | ≤ 500ms (P95) | S4 `PROJ_STALE_CRITICAL` — 授權/排班 projection 更新 ≤ 500ms |
| 排班月曆載入 | ≤ 2s (P95) for 30 items | 標準使用情境 |
| Projection 更新延遲 | ≤ 10s (P99) | S4 `PROJ_STALE_STANDARD` |
| FCM 推播延遲 | ≤ 30s (P95) | S4 `TAG_MAX_STALENESS` |
| **需求公告板 ScheduleDemand 可見性** | **廠區張貼需求後 ≤ 5s 出現在 Account 管理者的需求公告板** | G0a；Demand Board projection 需比標準 projection 更快，建議新增 `SK_STALENESS.PROJ_STALE_DEMAND_BOARD = 5000ms` 常數（介於 `PROJ_STALE_CRITICAL` 500ms 與 `PROJ_STALE_STANDARD` 10s 之間；命名遵循 `PROJ_STALE_*` 慣例）|

### NFR-R — 可靠性 (Reliability)

| 需求 | 規格 |
|------|------|
| 事件冪等性 | 所有 projection 寫入必須使用 `versionGuardAllows` 防止重複處理 (S2) |
| Outbox 可靠投遞 | DLQ 三級策略：`organization:schedule:assigned` → REVIEW_REQUIRED；補償事件 → SAFE_AUTO (S1) |
| Saga 補償 | 所有排班 Saga 在失敗時必須觸發補償事件並恢復 eligible 狀態 (Invariant A5/#15) |
| TraceId 追蹤 | 每個排班請求必須有唯一 traceId 貫穿整個事件鏈 (R8) |

### NFR-S — 安全性 (Security)

| 需求 | 規格 |
|------|------|
| 跨工作區隔離 | 排班資料不得跨工作區洩漏，Scope Guard 負責驗證 |
| 組織邊界 | 成員技能資訊只在同一組織範圍內可見 |
| 輸入驗證 | 排班提案所有欄位使用 Zod schema 驗證 |
| 授權 | 僅組織管理者可確認/拒絕提案；僅工作區擁有者可提案 |

### NFR-A — 可用性 (Accessibility)

- 所有互動元件符合 WCAG 2.1 AA 標準
- 表單錯誤訊息需清晰且可被螢幕閱讀器辨識
- 月曆視圖支援鍵盤操作

---

## 11. 權限與角色模型 Permission Model

### 角色定義

| 角色 (Role) | 系統定義 | 層級 |
|-------------|---------|------|
| `OWNER` | 組織/工作區最高權限者 | 組織/工作區 |
| `ADMIN` | 具備管理與審核權限的管理者 | 組織/工作區 |
| `MEMBER` | 普通組織成員 | 組織 |
| `STAFF` | 前線可被指派人員 | 組織 |

### 操作權限矩陣

| 操作 | OWNER | ADMIN | MEMBER | STAFF |
|------|-------|-------|--------|-------|
| 創建排班提案 | ✅ | ✅ | ❌ | ❌ |
| 審核/確認指派 | ✅ | ✅ | ❌ | ❌ |
| 拒絕提案 | ✅ | ✅ | ❌ | ❌ |
| 取消自己提出的提案 | ✅ | ✅ | ❌ | ❌ |
| 完成排班 | ✅ | ✅ | ❌ | ❌ |
| 取消已確認指派 | ✅ | ✅ | ❌ | ❌ |
| 查看組織人力總覽 | ✅ | ✅ | ❌ | ❌ |
| 查看個人排班狀態 | ✅ | ✅ | ✅ | ✅ |
| 查看個人技能 XP | ✅ | ✅ | ✅ | ✅ |
| 查看組織技能分佈 | ✅ | ✅ | ❌ | ❌ |

### 授權驗證規則

1. **Scope Guard**（`workspace-scope-guard-view`）負責工作區層級的操作授權
2. **組織角色**從 `orgRoleView` projection 讀取（非 Custom Claims 直接判斷）
3. **Claims 為快照**，重要操作（如確認指派）必須重新驗證 Aggregate 狀態

---

## 12. 資料模型假設 Data Assumptions

### 廠區（Workspace）實體模型

> **領域校正**：每個 Workspace 對應一個真實存在、具有實際地址的廠區（工廠/辦公園區）。廠區內部可劃分多個子地點（棟/樓/室/區）。

```typescript
interface Workspace {
  workspaceId: string;      // 廠區唯一 ID
  name: string;             // 廠區名稱（如「台南二廠」）
  address: string;          // 廠區實際地址（必填）
  orgId: string;            // 所屬 Account（公司）
  locations: WorkspaceLocation[]; // 廠區內子地點列表
}

interface WorkspaceLocation {
  locationId: string;       // 子地點唯一 ID
  label: string;            // 顯示名（如「A棟3樓辦公室」、「B館裝配區-1」）
  description?: string;     // 用途說明
  capacity?: number;        // 可容納人數（可選）
}
```

### 排班需求（ScheduleDemand）

> **新增概念**：廠區提出的正式人力需求，是 Demand Board 的資料基礎，也是 Account 手動指派的輸入來源。

```typescript
interface ScheduleDemand {
  demandId: string;           // 全局唯一 ID
  workspaceId: string;        // 來源廠區
  locationId?: string;        // 指定子地點（可選，FR-L2）
  title: string;              // 需求標題
  description?: string;       // 需求描述
  startDate: string;          // ISO 8601
  endDate: string;            // ISO 8601
  requiredSkills: SkillRequirement[]; // [{ skillId, minTier, quantity }]
  status: 'open' | 'assigned' | 'closed';
  // 狀態對照表（Demand Board read-model ↔ OrgScheduleStatus aggregate）：
  //   'open'     ← OrgScheduleStatus 'proposed'  （廠區已提案，等待 Account 指派；Demand Board 主要顯示層）
  //   'assigned' ← OrgScheduleStatus 'confirmed' （已確認指派；Demand Board 顯示中，以不同樣式呈現；需求仍可見）
  //   'closed'   ← OrgScheduleStatus 'completed' | 'cancelled' | 'assignmentCancelled'
  //               具體原因保存在 closeReason 欄位以供稽核；Closed 預設在看板隱藏
  // 注意：'open' → 'assigned' 時 Demand Card 不從看板移除，而是以 "已指派" 標籤呈現（見 FR-W0 + BR-D1）
  closeReason?: 'completed' | 'cancelled' | 'assignmentCancelled';
  // ^ 當 status='closed' 時填入，對應 OrgScheduleStatus；status≠'closed' 時為 undefined
  // 此欄位保持 ScheduleDemand 讀取模型的稽核可追溯性（Demand Board 可過濾/顯示關閉原因）
  proposedScheduleItemId?: string; // 對應到 OrgScheduleProposal 的 ID（串接 closeReason 的 aggregate 來源）
  traceId?: string;           // R8 全鏈路追蹤 ID
  createdAt: string;
}
```

### 排班聚合 (OrgScheduleProposal)

```typescript
interface OrgScheduleProposal {
  scheduleItemId: string;       // 全局唯一 ID
  workspaceId: string;          // 來源工作區
  orgId: string;                // 所屬組織
  title: string;                // 排班標題
  description?: string;         // 排班描述
  startDate: string;            // ISO 8601
  endDate: string;              // ISO 8601
  locationId?: string;          // 子地點 ID（FR-L2）。locationId 與 location.address 互斥規則見 BR-D4
  location: Location;           // { type: 'on-site'|'remote'|'hybrid', address?: string }
                                // type 必填；address 的填寫要求見 BR-D4
  requiredSkills: SkillRequirement[]; // [{ skillId, minTier, quantity }]
  status: OrgScheduleStatus;    // 'draft'|'proposed'|'confirmed'|'cancelled'|'completed'|'assignmentCancelled'
  assignedAccountId?: string;   // 指派的成員 ID
  traceId?: string;             // R8 全鏈路追蹤 ID
  createdAt: string;
  updatedAt: string;
}
```

### 技能 XP 聚合 (AccountSkillRecord)

```typescript
interface AccountSkillRecord {
  accountId: string;
  skillId: string;    // tagSlug (e.g., 'typescript', 'project-management')
  xp: number;         // 0–525，tier 由 resolveSkillTier(xp) 推導，不存 DB
  version: number;    // 樂觀鎖版本號
}
```

### 人力可用性 Read Model (OrgEligibleMemberEntry)

```typescript
interface OrgEligibleMemberEntry {
  orgId: string;
  accountId: string;
  skills: Record<string, { xp: number }>; // skillId → { xp }，tier 推導
  eligible: boolean;          // 快速過濾標誌
  lastProcessedVersion: number;      // eligible 版本守衛 (R7/#19)
  lastProcessedSkillVersion: number; // XP 版本守衛 (S2)
  traceId?: string;                  // R8
}
```

### 技能等級定義 (SkillTier)

| 等級 | 名稱 | XP 範圍 |
|------|------|---------|
| 1 | Apprentice | 0–74 |
| 2 | Journeyman | 75–149 |
| 3 | Expert | 150–224 |
| 4 | Artisan | 225–299 |
| 5 | Grandmaster | 300–374 |
| 6 | Legendary | 375–449 |
| 7 | Titan | 450–525 |

---

## 13. 業務規則 Business Rules

### BR-D — 需求公告板與指派規則 ⚠️ **核心缺口**

| ID | 規則 | 實施層 |
|----|------|--------|
| **BR-D1** | **廠區需求公告**：工作區（廠區）在 `proposed` 狀態的排班，**必須在** Account 管理者的 Demand Board 上可見，不需要 Account 主動查詢每個廠區 | `workspace-business.schedule` + VS4 read model |
| **BR-D2** | **手動指派入口**：Account 管理者在 Demand Board 上選擇某需求並手動指定成員，等同於直接呼叫 `approveOrgScheduleProposal`（Saga 標準流程），無需等待 Saga 自動比對。手動指派**不繞過**業務校驗——Saga 仍進行 eligibility 驗證；若驗證失敗（如成員已被指派到衝突班次），系統回傳失敗原因 | `account-organization.schedule/_actions.ts` |
| **BR-D3** | **指派候選資格（Override 行為）**：手動指派時，系統顯示所有組織成員，對不符合技能需求或 `eligible=false` 的成員標示警告。管理者可選擇忽略警告送出（Override）。**V1.0 行為**：Override 送出後仍觸發標準 Saga (`approveOrgScheduleProposal`)；若 Saga 內部 eligibility 校驗失敗，則指派失敗並通知管理者——此為預期行為（UI Override ≠ 繞過業務規則）。**V1.1 增強（Roadmap）**：Saga 將新增 `forceAssign: true` 參數供授權角色（OWNER/ADMIN）強制跳過 eligibility 校驗。 | UI soft-warn; Saga hard-validates in V1.0 |
| **BR-D4** | **廠區地址不可為空**：建立或更新 Workspace 時，`address` 為必填欄位（廠區必有實體地址）。**排班子地點互斥規則（write-time）**：建立 OrgScheduleProposal 時——若 `locationId` 非空（廠區子地點），`location.address` 必須留空（`undefined`），由 projection 在 read-time 從 WorkspaceLocation.label 衍生顯示地址，不落庫；若 `locationId` 為空（遠端/跨站/僅廠區層級），`location.address` 必須填入廠區層級地址。兩者同時填入為驗證錯誤 | Zod schema validation（OrgScheduleProposal）; Action-layer guard |
| **BR-D5** | **子地點歸屬**：子地點（WorkspaceLocation）屬於特定廠區，不可在廠區間共享或移動；廠區刪除時子地點一同刪除 | `workspace-core` aggregate |

### BR-S — 排程規則

| ID | 規則 | 實施層 |
|----|------|--------|
| BR-S1 | 排班狀態機為**封閉**：只允許合法轉換 (`proposed→confirmed`, `confirmed→completed/assignmentCancelled`, `proposed→cancelled`) | `_schedule.ts` aggregate |
| BR-S2 | `completeOrgSchedule` / `cancelOrgScheduleAssignment` 只能在 `status === 'confirmed'` 時執行 | `_schedule.ts` guard |
| BR-S3 | `workspace:schedule:proposed` 觸發 VS6 Saga，Saga 負責跨 BC 協調 | `scheduling-core.saga` |
| BR-S4 | 排班提案的技能需求指派，必須以 `orgEligibleMemberView` 為唯一資料來源（Invariant #14） | `_saga.ts` |
| BR-S5 | 每個排班提案一次只能指派一名主要成員（當前版本，多人指派為 V2） | domain design |
| BR-S6 | 排班完成(`completed`)或指派取消(`assignmentCancelled`)後，必須將成員 `eligible` 恢復為 `true` | `_funnel.ts` Invariant #15 |

### BR-W — 人力規則

| ID | 規則 | 實施層 |
|----|------|--------|
| BR-W1 | 成員 `eligible` 判定基於：(1) 是否為組織成員 (2) 是否無衝突排班 | `orgEligibleMemberView` |
| BR-W2 | 技能等級**永遠**由 `resolveSkillTier(xp)` 純函式推導，不得存入 DB（Invariant #12） | VS0 `shared.kernel.skill-tier` |
| BR-W3 | 技能比對採用 `tierSatisfies(memberTier, requiredTier)` 進行等級驗證 | Saga eligibility check |

### BR-K — 技能規則

| ID | 規則 | 實施層 |
|----|------|--------|
| BR-K1 | XP 範圍限制：0–525，超過部分自動 clamp（Invariant #13） | `_aggregate.ts` |
| BR-K2 | XP 每次變動**必須先寫入 XP 帳本**，再更新聚合（Invariant #13，審計順序保證） | `_aggregate.ts` |
| BR-K3 | XP 屬於 Account BC；組織只能透過事件訂閱取得技能資訊（Invariant #11） | Event bus |
| BR-K4 | 技能 XP 版本守衛：只有 `incomingVersion > lastProcessedSkillVersion` 時才更新 XP | `orgEligibleMemberView` |

---

## 14. 邊界條件與例外處理 Edge Cases

### EX-W — 手動指派邊界條件 ⚠️ **新增**

| # | 情境 | 系統行為 | 使用者回饋 |
|---|------|---------|-----------|
| EX-W1 | 手動選擇的成員 `eligible=false`（已有確認排班） | 系統顯示衝突警告，但允許管理者覆蓋指派 | UI 紅色警告標示，確認按鈕改為「強制指派」 |
| EX-W2 | 手動選擇的成員技能不符合需求（等級不足） | 系統顯示技能缺口警告，但允許管理者覆蓋 | UI 橙色警告，列出缺口技能 |
| EX-W3 | 管理者嘗試指派後，成員在確認前離開組織 | Saga 觸發補償，需求退回 `open`；管理者收到通知 | Toast 通知「指派失敗，成員已離職」 |
| EX-W4 | Demand Board 無任何 `proposed` 需求 | 顯示空白狀態畫面，引導廠區提交需求 | 空狀態圖示 + 說明文字 |

### EX-S — 排程邊界條件

| # | 情境 | 系統行為 | 使用者回饋 |
|---|------|---------|-----------|
| EX-S1 | Saga 找不到符合技能的 eligible 成員 | 觸發 `organization:schedule:assignRejected` 補償事件，狀態→`cancelled` | 工作區擁有者收到含原因的拒絕通知 |
| EX-S2 | 重複提案（相同工作區、相同日期、相同技能） | 允許提案（由業務決定，不做唯一性約束） | 表單正常提交 |
| EX-S3 | 排班確認後被指派成員離開組織 | `organization:member:left` 事件 → eligible 移除 → 需要重新指派 | 管理者收到通知，排班狀態警示 |
| EX-S4 | 排班日期範圍與現有確認排班完全重疊 | Saga 在 eligibility check 時標記成員為不可用，排除候選名單 | 管理者看到「無可用成員」訊息 |
| EX-S5 | `ScheduleCompleted` 事件比 `ScheduleAssigned` 早到達 projection | `ELIGIBLE_UPDATE_GUARD` (`lastProcessedVersion`) 防止狀態回退 | 最終一致性，不影響結果 |
| EX-S6 | 工作區已被刪除但排班處於 `proposed` 中 | Saga 觸發補償取消；Outbox 確保至少一次投遞 | 無用戶操作，後台自動處理 |

### EX-K — 技能邊界條件

| # | 情境 | 系統行為 |
|---|------|---------|
| EX-K1 | XP 加到超過 525 | clamp 至 525，超出部分記錄但不反映在 xp 欄位 |
| EX-K2 | 嘗試扣除 XP 低於 0 | clamp 至 0 |
| EX-K3 | 相同版本的 XP 事件重複投遞 | `lastProcessedSkillVersion` 版本守衛過濾，忽略重複 |
| EX-K4 | 技能 XP 帳本寫入成功但聚合更新失敗 | 事務補償：下次聚合讀取時，從帳本重建最新 XP |

---

## 15. 整合需求 Integrations

### INT-1 — Firebase FCM (Push Notifications)

- **用途**：`organization:schedule:assigned` → 前線人員推播
- **規格**：FCM 通知 metadata 必須包含 `traceId` (R8)
- **觸發方**：`infra.outbox-relay` 監聽 Outbox，透過 FCM Layer 1 投遞
- **失敗處理**：DLQ `REVIEW_REQUIRED` tier，需人工審查後重播

### INT-2 — Firestore (主要資料庫)

| 集合 | 用途 | 寫入路徑 |
|------|------|---------|
| `accounts/{orgId}/schedule_items/{scheduleId}` | 排班聚合（VS6 SSOT） | `_schedule.ts` aggregate |
| `orgEligibleMemberView/{orgId}/members/{accountId}` | 人力 Read Model | `projection.org-eligible-member-view` |
| `accountSkills/{accountId}/skills/{skillId}` | 技能聚合 | `account-user.skill/_aggregate.ts` |
| `sagaStates/{sagaId}` | Saga 狀態持久化 | `scheduling-core.saga/_saga.ts` |
| `outbox/{docId}` | 可靠事件投遞 Outbox | `account-organization.event-bus` |

### INT-3 — Internal Event Bus (IER)

- `workspace:schedule:proposed` → Saga 啟動
- `organization:schedule:assigned` → FCM + eligible 更新
- `organization:schedule:completed` → eligible 恢復 (`true`)
- `organization:schedule:assignmentCancelled` → eligible 恢復 (`true`)
- `organization:skill:xpAdded/xpDeducted` → orgEligibleMemberView XP 更新

---

## 16. 風險分析 Risks

| ID | 風險 | 可能性 | 影響 | 緩解策略 |
|----|------|--------|------|---------|
| R1 | Saga 狀態機卡死（既不 `assigned` 也不 `compensated`） | 低 | 高 | Saga 設置超時機制；DLQ 人工介入流程 |
| R2 | orgEligibleMemberView 資料過時（Staleness > 10s） | 中 | 中 | Firestore 即時監聽；PROJ_STALE_STANDARD 監控告警 |
| R3 | 技能等級比對邏輯與顯示層不一致 | 低 | 中 | 所有等級推導統一使用 `resolveSkillTier(xp)` 純函式 |
| R4 | 重複 FCM 推播（網路重試導致） | 中 | 低 | Outbox idempotencyKey 防重；FCM message deduplication |
| R5 | 組織管理員帳號被竊用，大量誤指派 | 低 | 極高 | SECURITY_BLOCK DLQ for Claims change；強制 MFA（外部依賴） |
| R6 | 月曆視圖在大量排班時效能下降（>1000條/月） | 低 | 中 | 分頁載入；虛擬化列表；資料分片 |
| R7 | traceId 在某個環節斷鏈，無法追蹤 | 低 | 中 | 端對端 R8 合規測試；全鏈路監控 |

---

## 17. 相依條件 Dependencies

### 外部相依

| 相依項 | 類型 | 狀態 | 備註 |
|--------|------|------|------|
| Firebase / Firestore | 基礎設施 | ✅ 已部署 | 主要資料庫 |
| Firebase Cloud Messaging | 基礎設施 | ✅ 已設定 | 推播通知 |
| Firebase Auth | 基礎設施 | ✅ 已部署 | 身份驗證 |
| Next.js ^15.5.12 Server Actions | 框架 | ✅ 已使用 | 服務端入口 |

### 內部相依（需先實作或已完成）

| 功能 | VS | 狀態 | 被哪些 FR 依賴 |
|------|----|----|----------------|
| 帳號/成員管理 | VS1–VS2 | ✅ 已完成 | 所有功能 |
| 技能 XP 聚合 | VS3 | ✅ 已完成 | FR-W2, FR-K1–K4 |
| 組織管理 | VS4 | ✅ 已完成 | FR-S4, FR-W1 |
| orgEligibleMemberView Projection | VS4/VS6 | ✅ 已完成 | FR-W2, FR-W3 |
| Scheduling Saga | VS6 | ✅ 已完成 | FR-S1 (觸發鏈) |
| 技能標籤池 | VS4 | ✅ 已完成 | FR-K5 |
| 月曆 UI 元件 | VS5 | ✅ 已完成 | FR-S2 |
| Governance Panel | VS4/VS5 | ✅ 已完成 | FR-S4 |
| 通知路由 | GW/VS4 | ✅ 已完成 | FR-N1–N3 |

---

## 18. 驗收標準 Acceptance Criteria

### AC-S — 排程

```gherkin
Feature: 排班提案

Scenario: 成功提交排班提案
  Given 我是工作區 OWNER 或 ADMIN
  When 我填寫排班表單（標題、日期、技能需求）並送出
  Then 系統應在 UI 顯示 status = "proposed"（Demand Board 顯示為 "open"）的排班項目
  And 月曆上應顯示對應日期的排班標記
  And Saga 應在 5 秒內完成 eligibility check

Scenario: 排班確認指派
  Given 排班處於 proposed 狀態
  And Saga 已找到符合技能需求的 eligible 成員
  When 組織管理者在 Governance Panel 確認指派
  Then 排班狀態應更新為 "confirmed"
  And 指派的成員應收到 FCM 推播通知
  And 成員的 eligible 應更新為 false

Scenario: 排班完成釋放人員
  Given 排班處於 confirmed 狀態
  When 組織管理者點擊「完成排班」
  Then 排班狀態應更新為 "completed"
  And 被指派成員的 eligible 應更新為 true
  And 成員應收到排班結束通知

Scenario: 無符合人員時的補償
  Given 組織內沒有符合技能需求的 eligible 成員
  When 提交排班提案
  Then Saga 應觸發補償，排班狀態更新為 "cancelled"
  And 工作區擁有者應收到包含原因的拒絕通知
```

### AC-K — 技能

```gherkin
Feature: 技能 XP 與等級

Scenario: XP 上限截斷
  Given 成員某技能當前 XP = 510
  When 觸發 +50 XP 獎勵
  Then 系統應儲存 XP = 525（上限 clamp）
  And XP 帳本應記錄原始 delta = +50

Scenario: 等級推導一致性
  Given 成員 XP = 200
  When 在個人技能頁面和組織人力面板同時查看
  Then 兩處顯示的技能等級均應為 "Expert"
  And 等級不得從 DB 直接讀取（必須由 resolveSkillTier(200) 推導）
```

### AC-N — 通知

```gherkin
Scenario: FCM 通知攜帶 traceId
  Given 排班 Saga 正在處理 scheduleItemId = "X"
  When 排班被確認指派
  Then FCM 推播 metadata 應包含 traceId
  And traceId 應與 workspace:schedule:proposed 事件的 traceId 一致
```

---

## 19. 成功指標 KPI / Metrics

### 功能性指標

| 指標 | 基線 | 目標（V1 後 4 週） | 量測方式 |
|------|------|-------------------|---------|
| **提案→確認平均時間** | N/A（手動）→ 預估 2–4h | ≤ 1h | 事件時間戳差值 |
| **排班確認率** (proposals that reach `confirmed`) | 目標 ≥ 70% | ≥ 70% | 狀態統計 |
| **候選人自動比對成功率** | 目標 ≥ 90% | ≥ 90% | Saga 成功次數 / 總提案次數 |
| **eligible 狀態錯誤率** | 0 基線 | < 0.1% | projection 異常告警 |
| **FCM 推播送達率** | 目標 ≥ 95% | ≥ 95% | FCM delivery report |

### 使用者行為指標

| 指標 | 目標 |
|------|------|
| **工作區擁有者月均提案數** | ≥ 2 次/工作區 |
| **技能頁面月活躍率** | ≥ 40% 組織成員 |
| **Governance Panel 使用率** | ≥ 80% 管理者每週使用 |

### 系統健康指標

| 指標 | 目標 |
|------|------|
| Outbox DLQ `REVIEW_REQUIRED` 積壓量 | ≤ 10 條/天 |
| projection.org-eligible-member-view P99 更新延遲 | ≤ 10s |
| Saga 完成率（無 stuck 狀態） | ≥ 99.9% |

---

## 20. 版本規劃 Milestones / Roadmap

### V1.0 — 核心排程能力 (MVP)

**目標完成**：2026 Q1  
**範疇**：

- [ ] FR-S1: 排班提案表單（含技能需求選取）
- [ ] FR-S2: 月曆視圖（月份切換）
- [ ] FR-S3: 排班狀態標示
- [ ] FR-S4: Governance Panel（審核、確認指派）
- [ ] FR-S6: 排班完成操作
- [ ] FR-W1: 組織人力總覽（eligible 狀態）
- [ ] FR-W2: 技能比對面板（候選人列表）
- [ ] FR-K1: 個人技能頁面（XP + 等級）
- [ ] FR-K5: 技能標籤池整合
- [ ] FR-N1: 排班確認 FCM 推播
- [ ] FR-N3: 排班取消通知

**驗收條件**：全流程 `proposed → confirmed → completed` 可操作；候選人自動比對成功率 ≥ 90%；所有 AC 測試通過。

---

### V1.1 — 完整生命週期與通知

**目標完成**：2026 Q2  
**範疇**：

- [ ] FR-S5: 排班詳情頁
- [ ] FR-S7: 取消已確認指派
- [ ] FR-S8: 帳戶排班個人視圖
- [ ] FR-W3: 成員技能卡片
- [ ] FR-W4: 排班衝突警示
- [ ] FR-W5: 人力過濾器（可用/不可用）
- [ ] FR-K2: 技能等級說明頁
- [ ] FR-K3: XP 歷史紀錄
- [ ] FR-N2: 拒絕通知（含原因）
- [ ] FR-N4: T-24h 排班提醒

---

### V1.2 — 分析與洞察

**目標完成**：2026 Q3  
**範疇**：

- [ ] FR-S9: 工作區排班統計摘要
- [ ] FR-K4: 組織技能分佈圖（熱力圖）
- [ ] 排班歷史記錄存檔與查詢

---

### V2.0 — 進階能力（規劃中）

**目標完成**：2026 Q4  
**範疇**：

- [ ] 多人指派（一個排班需求指派多位成員）
- [ ] AI 排班建議（依歷史模式推薦最佳人選）
- [ ] 跨組織人力借調市場
- [ ] 行動裝置原生體驗（React Native）

---

## 附錄 Appendices

### A. 技能等級完整定義

| 等級 | 名稱 | XP 門檻 | 描述 |
|------|------|---------|------|
| 1 | Apprentice（學徒） | 0 | 入門，基礎技能習得中 |
| 2 | Journeyman（工匠） | 75 | 可獨立執行標準任務 |
| 3 | Expert（專家） | 150 | 精通核心技能，可指導他人 |
| 4 | Artisan（大師） | 225 | 技術深度廣度兼備 |
| 5 | Grandmaster（宗師） | 300 | 領域頂尖，具創新能力 |
| 6 | Legendary（傳奇） | 375 | 行業標竿，罕見水準 |
| 7 | Titan（巨人） | 450 | 最高階，定義領域標準 |

### B. 排班狀態機圖

```
                ┌─────────────┐
          ┌────▶│   proposed   │
          │     └──────┬───┬──┘
          │            │   │
          │    [approved]  [rejected/cancelled]
          │            │   │
          │     ┌──────▼──┐  └──▶ cancelled
          │     │confirmed│
          │     └────┬────┘
          │          │
          │  [completed]  [assignmentCancelled]
          │          │         │
          │    ┌─────▼──┐  ┌──▼──────────────────┐
          └────│completed│  │ assignmentCancelled  │
               └─────────┘  └──────────────────────┘
                    ↑                  ↑
              (eligible restored)  (eligible restored)
                  = true              = true
```

### C. 架構規範參考

- `docs/logic-overview.md` — 唯一架構 SSOT（含命令/事件流規範）
- `docs/domain-glossary.md` — 領域術語定義
- `docs/persistence-model-overview.md` — 資料模型細節

### D. 相關切片索引

| 切片 | 職責 | VS 層級 |
|------|------|---------|
| `account-user.skill` | 技能 XP 聚合與帳本 | VS3 |
| `account-organization.schedule` | 排班聚合狀態機 | VS4 |
| `account-organization.event-bus` | 組織事件發布 | VS4 |
| `scheduling-core.saga` | 排班協調 Saga（跨 BC） | VS6 |
| `workspace-business.schedule` | 工作區排程 UI 與操作 | VS5 |
| `projection.org-eligible-member-view` | 人力可用性 Read Model | VS8 |
| `projection.account-schedule` | 帳戶排班 Read Model | VS8 |
| `shared.kernel.skill-tier` | 技能等級契約（純函式） | VS0 |
| `infra.dlq-manager` | DLQ 三級策略管理 | GW |
