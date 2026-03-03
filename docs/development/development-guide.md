# 系統架構開發指南
### Logic Overview v2 — Architecture Design Guide

> **設計哲學**：統一由上至下，外部入口 → 閘道 → 領域 → 事件總線 → 投影 → 查詢出口。
> 所有設計決策以「可維護、可擴展、可觀測」為最高準則。

---

## 目錄

1. [架構全貌與設計原則](#1-架構全貌與設計原則)
2. [層級結構總覽（L0–L9）](#2-層級結構總覽-l0l9)
3. [共用核心契約（Shared Kernel · VS0）](#3-共用核心契約-shared-kernel--vs0)
4. [領域切片設計（VS1–VS8）](#4-領域切片設計-vs1vs8)
5. [閘道設計（Command · IER · Query）](#5-閘道設計-command--ier--query)
6. [投影總線設計（Projection Bus · L5）](#6-投影總線設計-projection-bus--l5)
7. [Firebase 隔離策略（ACL · L7）](#7-firebase-隔離策略-acl--l7)
8. [跨切片權威（Cross-cutting Authority）](#8-跨切片權威-cross-cutting-authority)
9. [可觀測性設計（Observability · L9）](#9-可觀測性設計-observability--l9)
10. [治理規則索引（Invariants & Development Rules）](#10-治理規則索引-invariants--development-rules)

---

## 1. 架構全貌與設計原則

### 核心設計哲學

本系統採用**垂直切片架構（Vertical Slice Architecture）** 結合**事件驅動（Event-Driven）** 設計，確保每個業務域擁有清晰邊界，透過統一的基礎設施契約協作，而非直接互相依賴。

### 六大設計原則

| 編號 | 原則 | 說明 |
|------|------|------|
| ① | **統一資料流向** | 外部入口 → 閘道 → 領域 → 事件總線 → 投影 → 查詢出口，禁止逆流 |
| ② | **契約集中定義** | 所有 SK（Shared Kernel）契約集中定義，各節點僅引用不重複宣告 |
| ③ | **Firebase 邊界明確** | `FIREBASE_ACL` 為唯一 Firebase SDK 呼叫點，業務層禁止直接引用 |
| ④ | **三道閘道職責分離** | CMD（寫）/ IER（事件路由）/ QGWAY（讀）嚴格分工 |
| ⑤ | **不變量索引化** | 所有不變量以 `[#N]` / `[SN]` / `[RN]` 行內索引，完整定義於文末 |
| ⑥ | **Everything as a Tag** | 所有領域概念以語義標籤建模，由 VS8（Semantic Graph）統一治理 |

### 絕對禁止事項（FORBIDDEN）

- 跨 Bounded Context 直接寫入另一個 Aggregate，必須透過 IER Domain Event
- TX Runner 產生 Domain Event（只有 Aggregate 可以）
- `SECURITY_BLOCK` DLQ 自動 Replay（必須人工審查）
- B-track 回呼 A-track（只能透過 Domain Event 溝通）
- Feature Slice 直接 `import firebase/*`
- Feature Slice 自建搜尋邏輯（必須透過 Global Search）
- Feature Slice 直接呼叫 `sendEmail` / `push` / `SMS`（必須透過 Notification Hub）

---

## 2. 層級結構總覽（L0–L9）

系統由 10 個層級構成，每層職責嚴格分離：

```
L0  External Triggers    外部觸發入口（Next.js / Firebase Auth / Webhook）
L1  Shared Kernel        全域契約中心（VS0）
L2  Command Gateway      統一寫入閘道
L3  Domain Slices        業務垂直切片（VS1–VS8）
L4  IER                  整合事件路由器
L5  Projection Bus       事件投影總線（Infrastructure）
L6  Query Gateway        統一讀取出口
L7  Firebase ACL         Firebase 防腐層
L8  Firebase Infra       Firebase 雲端平台
L9  Observability        橫切面可觀測性
```

### 業務域（Vertical Slices）對照表

| 切片 ID | 名稱 | 職責 |
|---------|------|------|
| VS0 | Shared Kernel | 全域契約定義中心 |
| VS1 | Identity | 身份驗證 / Context 生命週期 / Claims 管理 |
| VS2 | Account | 用戶帳號 / 組織帳號 / 錢包 / 治理 |
| VS3 | Skill XP | 技能成長 / XP 帳本 |
| VS4 | Organization | 組織治理 / 成員 / 合作夥伴 / 排班人才庫 |
| VS5 | Workspace | 工作區業務 / 文件解析 / 工作流狀態機 |
| VS6 | Scheduling | 排班協作 / Saga 補償流程 |
| VS7 | Notification Hub | 通知交付（跨切片權威）|
| VS8 | Semantic Graph | 語義中樞 / Tag 分類學 / The Brain |

> **注意**：L5（Projection Bus）與 L9（Observability）為 Infrastructure，不佔用 VS 編號。

---

## 3. 共用核心契約（Shared Kernel · VS0）

Shared Kernel 是整個系統的**唯一契約真相**，禁止包含 async functions、Firestore calls 或任何 side effects。`[D8]`

### 3.1 基礎資料契約

#### Event Envelope（事件信封）

所有 Domain Event 必須包裝在 Event Envelope 內，欄位定義如下：

| 欄位 | 說明 |
|------|------|
| `version` | 事件版本號 |
| `traceId` | 整鏈共享，**僅在 CBG_ENTRY 注入一次，全鏈唯讀不可覆蓋** `[R8]` |
| `causationId` | 觸發此事件的命令/事件 ID |
| `correlationId` | 同一 Saga / Replay 的關聯 ID |
| `timestamp` | 事件發生時間 |
| `idempotency-key` | 格式：`eventId + aggId + version` |

#### Authority Snapshot（授權快照）

包含 `claims` / `roles` / `scopes`，TTL 等同 Token 有效期。`[#5]`

#### Skill Tier（純函式）

`getTier(xp) → Tier` 為純函式，**永遠不存入 DB**。`[#12]`

#### Command Result Contract

```
Success: { aggregateId, version }
Failure: { DomainError }
```

前端樂觀更新的依據。

---

### 3.2 基礎設施行為契約

#### SK_OUTBOX_CONTRACT `[S1]`

所有 Outbox 必須遵守三要素：

1. **At-least-once**：EventBus → OUTBOX → RELAY → IER
2. **Idempotency-key 必帶**：格式 `eventId + aggId + version`
3. **DLQ 分級宣告**（每個 OUTBOX 新增時必填）：

| 等級 | 適用場景 | 行為 |
|------|----------|------|
| `SAFE_AUTO` | 冪等事件 | 自動重試 |
| `REVIEW_REQUIRED` | 金融 / 排班 / 角色 | 人工審查後 Replay |
| `SECURITY_BLOCK` | 安全事件 | 凍結 + 告警，禁止自動 Replay |

#### SK_VERSION_GUARD `[S2]`

```
event.aggregateVersion > view.lastProcessedVersion
  → 允許更新
  否則
  → 丟棄（過期事件不覆蓋）
```

適用所有 Projection 寫入前。`[#19]`

#### SK_READ_CONSISTENCY `[S3]`

| 模式 | 適用場景 |
|------|----------|
| `STRONG_READ` | 金融、安全、不可逆操作（回源 Aggregate）|
| `EVENTUAL_READ` | 顯示、統計、列表（讀 Projection）|

> 原則：餘額 / 授權 / 排班衝突 → 一律 `STRONG_READ`

#### SK_STALENESS_CONTRACT `[S4]`

| 常數 | 數值 |
|------|------|
| `TAG_MAX_STALENESS` | ≤ 30s |
| `PROJ_STALE_CRITICAL` | ≤ 500ms |
| `PROJ_STALE_STANDARD` | ≤ 10s |

> **SLA 數值禁止硬寫**，一律引用此常數。`[D16]`

#### SK_RESILIENCE_CONTRACT `[S5]`

適用於 `_actions.ts` / Webhook / Edge Function：

- **Rate Limit**：per user ∪ per org → 429 + retry-after
- **Circuit Break**：連續 5xx → 熔斷，半開探針恢復
- **Bulkhead**：切片隔板，獨立執行緒池

#### SK_TOKEN_REFRESH_CONTRACT `[S6]`

- 觸發條件：`RoleChanged` | `PolicyChanged`
- 流程：IER `CRITICAL_LANE` → `CLAIMS_HANDLER` → `TOKEN_REFRESH_SIGNAL`
- 客端義務：強制重取 Firebase Token
- 失敗處理：→ DLQ `SECURITY_BLOCK` + 告警

---

### 3.3 Infrastructure Ports（依賴倒置介面）`[D24]`

| Port 介面 | 職責 |
|-----------|------|
| `IAuthService` | 身份驗證 |
| `IFirestoreRepo` | Firestore 存取（含 Version Guard）|
| `IMessaging` | 訊息推播（含 traceId 注入）|
| `IFileStore` | 檔案儲存 |

所有 Feature Slice 必須透過 Port 介面存取基礎設施，**禁止直接 import firebase/\***。`[D24]`

---

## 4. 領域切片設計（VS1–VS8）

### 4.1 VS1 · Identity Slice（身份驗證）

**職責**：Firebase Auth 整合、Context 生命週期管理、Claims 刷新。

#### Context 生命週期設計

| 事件 | 行為 |
|------|------|
| `Login` | 建立 `active-account-context`，TTL = Token 有效期 |
| `OrgSwitched` / `WorkspaceSwitched` | 刷新 Context |
| `TokenExpired` / `Logout` | 失效 Context |

#### Claims 管理設計 `[S6]`

- `claims-refresh-handler` 為**唯一刷新觸發點**
- `custom-claims` 為快照聲明，非真實權限來源 `[#5]`
- 設定完成後發出 `token-refresh-signal`

> 衝突解決原則：以 `ACTIVE_CTX` 為準 `[#A9]`

---

### 4.2 VS2 · Account Slice（帳號主體）

**職責**：用戶帳號、組織帳號、錢包強一致帳本、帳號治理。

#### 帳號域設計

| 聚合 / 實體 | 一致性模型 | 說明 |
|------------|-----------|------|
| `user-account.aggregate` | 標準 | 主帳號 |
| `wallet.aggregate` | 強一致 `[S3: STRONG_READ]` | 金融帳本 `[#A1]` |
| `account.profile` | 弱一致 | FCM Token 存放處 |
| `organization-account.aggregate` | 標準 | 組織主帳號 |
| `org-account.binding` | ACL 防腐 | 跨 BC 防腐對接 `[#A2]` |

#### Outbox DLQ 分級宣告

| 事件 | DLQ 分級 | IER Lane |
|------|----------|----------|
| `RoleChanged` / `PolicyChanged` | `SECURITY_BLOCK` | CRITICAL |
| `WalletDeducted` | `REVIEW_REQUIRED` | CRITICAL |
| `AccountCreated` | `SAFE_AUTO` | STANDARD |

> XP 屬於 Account BC，Organization 只設門檻。`[#11]`

---

### 4.3 VS3 · Skill XP Slice（能力成長）

**職責**：技能 XP 累積、XP 帳本記錄、語義 Tag 關聯。

#### 設計要點

- `account-skill.aggregate` 以 `tagSlug` 作為技能識別 ID，唯讀引用 VS8 Tag
- **XP 異動必須寫 Ledger**，不可直接修改 Aggregate 數值 `[#13]`
- `getTier()` 為純函式推導，**Firestore 寫入禁帶 tier 欄位** `[#12]` `[D12]`
- 所有事件走 `STANDARD_LANE`，DLQ 等級 `SAFE_AUTO`

#### 語義關聯

- `skillId` → `tag::skill` `[TE_SK]`
- Tier 推導 → `tag::skill-tier` `[TE_ST]`

---

### 4.4 VS4 · Organization Slice（組織治理）

**職責**：組織核心、成員治理、合作夥伴、Tag 組織作用域快照、人才庫。

#### 人才庫設計 `[#16]`

`talent-repository` = Member + Partner + Team，三者匯聚後形成 `ORG_ELIGIBLE_MEMBER_VIEW`（排班用）。

#### Tag 組織作用域快照

- `tag-lifecycle-subscriber` 訂閱 IER `BACKGROUND_LANE`
- 維護 `skill-tag-pool`（組織作用域快照）
- SLA：`TAG_MAX_STALENESS ≤ 30s` `[S4]`

#### 語義標籤綁定

| 實體 | 綁定語義 Tag |
|------|------------|
| `org.member` | `tag::role` `[TE_RL]`、`tag::user-level` `[TE_UL]` |
| `org.partner` | `tag::partner` `[TE_PT]` |
| `org.team` | `tag::team` `[TE_TM]` |

#### Outbox DLQ 分級

| 事件 | DLQ 分級 |
|------|----------|
| `OrgContextProvisioned` | `REVIEW_REQUIRED` |
| `MemberJoined` / `MemberLeft` | `SAFE_AUTO` |
| `SkillRecognitionGranted` / `Revoked` | `REVIEW_REQUIRED` |
| `PolicyChanged` | `SECURITY_BLOCK` |

---

### 4.5 VS5 · Workspace Slice（工作區業務）

**職責**：工作區 CRUD、文件解析閉環、工作流狀態機、雙軌業務流程。

#### Application Layer 職責 `[#3]`

Application Layer **只協調，不承載領域規則**，由以下元件組成：

| 元件 | 職責 |
|------|------|
| `command-handler` | 接收命令，回傳 `SK_CMD_RESULT` |
| `scope-guard` | 快路徑授權查詢 `[#A9]`，高風險回源 Aggregate |
| `policy-engine` | 政策驗證 |
| `transaction-runner` | `[#A8]` 1 Command / 1 Aggregate 原子提交 |

#### 工作流狀態機設計 `[R6]`

```
狀態流轉：Draft → InProgress → QA → Acceptance → Finance → Completed
```

- `blockedBy: Set<issueId>` — 所有 Issue 解決後才可 unblock `[#A3]`
- Issue 解決 → `IssueResolved` 事件 → 從 `blockedBy` 移除

#### 文件解析閉環 `[#A4]`

- `ParsingIntent` 為 Digital Twin，只允許提議事件（`IntentDeltaProposed`）
- 解析結果分流：任務草稿 → A-track、財務指令 → Finance、解析異常 → B-track

#### 雙軌設計

| 軌道 | 組成 | 說明 |
|------|------|------|
| A-track（主流程）| Tasks → QA → Acceptance → Finance | 正常業務流 |
| B-track（異常處理）| Issues | **禁止回呼 A-track**，只能透過 Domain Event |

---

### 4.6 VS6 · Scheduling Slice（排班協作）

**職責**：組織排班管理、Saga 補償流程、排班衝突語義檢測。

#### 排班設計要點

- 排班前必須通過 `TAG_STALE_GUARD` 校驗 `[S4]`
- 排班只讀 `ORG_ELIGIBLE_MEMBER_VIEW`（`eligible = true`）`[#14]`
- 人力需求以 `SK_SKILL_REQ × Tag Authority tagSlug` 表示 `[T4]`

#### Scheduling Saga `[#A5]`

跨 BC 的排班流程使用 Saga 模式：

1. 接收 `ScheduleProposed`
2. 執行 Eligibility Check
3. 若失敗：發出補償事件（`ScheduleAssignRejected` / `ScheduleProposalCancelled`）

#### Eligible 生命週期 `[#15]`

```
joined       → eligible = true
assigned     → eligible = false
completed / cancelled → eligible = true
```

---

### 4.7 VS7 · Notification Hub（通知交付 · 跨切片權威）

**職責**：唯一副作用出口、標籤感知通知路由。

#### 設計要點

- `notification-router` 為**無狀態路由** `[#A10]`，消費 IER `STANDARD_LANE`
- 業務切片**只產生事件，不決定通知策略**
- `notification-hub._services.ts` 為唯一副作用出口，依標籤決定通知渠道

#### 通知渠道路由策略

| 語義 Tag | 路由渠道 |
|----------|----------|
| `#channel:slack` | Slack 推播 |
| `#urgency:high` | 電話通知 |
| 預設 | FCM 推播（讀 `account.profile` FCM Token）|

#### 重要約束

- `[#6]` Notification 只讀 Projection，禁止直接讀 Aggregate
- 讀取 `traceId` 從 envelope 中取得，不重新生成 `[R8]`

---

### 4.8 VS8 · Semantic Graph — The Brain（語義中樞）

**職責**：全域語義字典、Tag 分類學（Taxonomy）、因果追蹤、排班衝突語義檢測。

#### Centralized Tag Aggregate `[#17]`

`centralized-tag.aggregate` 為 `tagSlug` 的**唯一真相**，欄位：

- `tagSlug`：全域唯一識別
- `label`：顯示名稱
- `category`：分類
- `deprecatedAt`：廢棄時間
- `deleteRule`：刪除規則

#### 語義 Tag 實體（TE1–TE6）

| 實體 | Category | tagSlug 格式 |
|------|----------|-------------|
| `TE1` tag::user-level | `user_level` | `user-level:{slug}` |
| `TE2` tag::skill | `skill` | `skill:{slug}` |
| `TE3` tag::skill-tier | `skill_tier` | `skill-tier:{tier}` |
| `TE4` tag::team | `team` | `team:{slug}` |
| `TE5` tag::role | `role` | `role:{slug}` |
| `TE6` tag::partner | `partner` | `partner:{slug}` |

#### Tag 治理規則

- 新增 Tag 語義類別：**必須在 VS8 `CTA TAG_ENTITIES` 定義**，禁止各 Slice 自行創建 `[D21]`
- 跨切片 Tag 語義引用：**必須指向 TE1–TE6**，禁止隱式 tagSlug 字串引用 `[D22]`
- Tag 標注格式：節點內 → `tag::{category}`；邊 → `-.->|"{dim} tag 語義"|` `[D23]`
- 消費方**禁止寫入** TAG_SNAPSHOT `[T5]`
- 廢棄 Tag 觸發 `StaleTagWarning` → L9 Observability `[S4]`

---

## 5. 閘道設計（Command · IER · Query）

### 5.1 Command Gateway（L2 · 統一寫入入口）

所有寫入操作必須經過 Command Gateway，確保防護、追蹤、路由三層職責清晰分離。

#### 入口防護層 `[S5]`

```
rate-limiter → circuit-breaker → bulkhead-router
```

#### Command Pipeline

| 節點 | 職責 |
|------|------|
| `unified-command-gateway` | **唯一** TraceID 注入點 `[R8]` |
| `authority-interceptor` | 驗證 AuthoritySnapshot，衝突以 ACTIVE_CTX 為準 `[#A9]` |
| `command-router` | 路由至對應切片，回傳 `SK_CMD_RESULT` |

> `traceId` 在 `CBG_ENTRY` 注入一次後，全鏈唯讀不可覆蓋。`[R8]` `[D10]`

---

### 5.2 Integration Event Router（L4 · IER）

**職責**：統一事件出口、三道優先級分層、DLQ 三級處理。

#### Outbox Relay Worker

- 掃描方式：Firestore `onSnapshot`（CDC 模式）
- 投遞路徑：`OUTBOX → IER 對應 Lane`
- 失敗處理：retry backoff → 3 次失敗 → DLQ
- 監控：relay_lag → L9 Observability `[R1]`

#### IER 優先級三道分層 `[P1]`

| Lane | 優先級 | 適用事件 | SLA |
|------|--------|----------|-----|
| `CRITICAL_LANE` | 🔴 最高 | RoleChanged → Claims 刷新、WalletDeducted / Credited、OrgContextProvisioned | 盡快投遞 |
| `STANDARD_LANE` | 🟡 中 | SkillXpAdded / Deducted、ScheduleAssigned / Proposed、MemberJoined / Left、所有 Domain Events | < 2s |
| `BACKGROUND_LANE` | ⚪ 背景 | TagLifecycleEvent、Audit Events | < 30s |

#### DLQ 三級分類 `[R5]` `[S1]`

| 等級 | 行為 | 適用 |
|------|------|------|
| `SAFE_AUTO` 🟢 | 自動 Replay（保留 idempotency-key）| 冪等事件 |
| `REVIEW_REQUIRED` 🟡 | 人工確認後 Replay | 金融、排班、角色 |
| `SECURITY_BLOCK` 🔴 | 告警 + 凍結 + 人工確認，**禁止自動 Replay** | 安全事件 |

---

### 5.3 Query Gateway（L6 · 統一讀取出口）

**職責**：統一讀取入口，版本對照、快照路由，所有 Projection 遵守 `SK_VERSION_GUARD`。`[S2]`

#### 查詢出口路由

| 路由 | 目標 Projection | 適用規則 |
|------|----------------|----------|
| Scheduling | `org-eligible-member-view` | `[#14 #15 #16]` |
| Notification | `account-view` | FCM Token 取得 `[#6]` |
| Scope Guard | `workspace-scope-guard-view` | `[#A9]` |
| Wallet | `wallet-balance` | 顯示 → Projection；精確交易 → `STRONG_READ` `[S3]` |
| Search | `tag-snapshot` | 語義化索引檢索 |

---

## 6. 投影總線設計（Projection Bus · L5）

**職責**：基礎設施層，IER 事件 → Projection 寫入的唯一通道。`[#9]`

### Event Funnel 設計 `[P5]`

```
IER
 └→ event-funnel（唯一 Projection 寫入路徑）
      ├→ CRITICAL_PROJ_LANE（SLA ≤ 500ms）
      │    └→ workspace-scope-guard-view
      │    └→ org-eligible-member-view
      │    └→ wallet-balance
      └→ STANDARD_PROJ_LANE（SLA ≤ 10s）
           └→ workspace-view
           └→ account-schedule
           └→ account-view
           └→ organization-view
           └→ account-skill-view
           └→ global-audit-view
           └→ tag-snapshot
```

#### Event Funnel 核心規則

- `[Q3]` 以 `idempotency-key` 做 upsert，保證冪等
- `[R8]` 從 envelope 讀取 `traceId` → `DOMAIN_METRICS`
- `[S2]` 所有 Lane 遵守 `SK_VERSION_GUARD`，過期事件直接丟棄

### Projection 重播能力 `[#9]`

所有 Projection 必須可由事件完整重建，`workspace-core.event-store` 提供重播 / 稽核能力，須持續同步。`[D11]`

### Tier 推導設計 `[#12]`

`getTier(xp) → Tier` 為純函式，`account-skill-view` 和 `org-eligible-member-view` 均在 Projection 層推導 Tier，**不存入 DB**。

---

## 7. Firebase 隔離策略（ACL · L7）

### 防腐層設計原則 `[D24]` `[D25]`

Firebase ACL 層位於 `src/shared/infra/`，是**唯一合法呼叫 Firebase SDK 的點**。

### 四個 Adapter 設計

| Adapter | 實作 Port | 職責 | 重要約束 |
|---------|-----------|------|----------|
| `auth.adapter.ts` | `IAuthService` | Firebase Auth ↔ Auth Identity 橋接 | 唯一合法 `firebase/auth` 呼叫點 |
| `firestore.facade.ts` | `IFirestoreRepo` | Firestore 存取 + Version Guard | `[S2]` aggregateVersion 單調遞增守衛 |
| `messaging.adapter.ts` | `IMessaging` | FCM 推播 | `[R8]` 注入 `envelope.traceId` → FCM metadata，**禁止在此生成新 traceId** |
| `storage.facade.ts` | `IFileStore` | Cloud Storage Path Resolver / URL 簽發 | 唯一合法 `firebase/storage` 呼叫點 |

### Firebase 隔離規則

- `src/app/` 與 UI 元件禁止 import `src/shared/infra/firestore` `[D5]`
- Feature Slice 新增 Firebase 功能：**必須在 FIREBASE_ACL 新增 Adapter 並實作對應 Port** `[D25]`
- SK_INFRA 契約（S2 / R8 / S4）約束所有 Adapter 行為

---

## 8. 跨切片權威（Cross-cutting Authority）

系統有兩個跨切片權威，擁有全域管轄權，**各業務切片不得繞過**。`[D26]`

### 8.1 Global Search（語義門戶）`[#A12]`

- **唯一跨域搜尋出口**，禁止各 Slice 自建搜尋邏輯
- 主要消費 L6 Query Gateway 的 `tag-snapshot` 查詢
- 對接 VS8 語義索引，提供 `Cmd+K` 等全域搜尋功能
- 必須擁有自己的 `_actions.ts` / `_services.ts`，**不得寄生於 Shared Kernel** `[D3]` `[D8]`

### 8.2 Notification Hub（反應中樞）`[#A13]`

- **唯一副作用出口**（Email / Push / SMS）
- 業務 Slice 只產生事件，**不決定通知策略**
- 標籤感知路由，對接 VS8 語義索引決定渠道
- 必須擁有自己的 `_actions.ts` / `_services.ts`，**不得寄生於 Shared Kernel** `[D3]` `[D8]`

---

## 9. 可觀測性設計（Observability · L9）

Observability 為橫切面基礎設施，不屬於任何業務域。

### 三大監控維度

#### Trace Identifier `[R8]`

- 在 `CBG_ENTRY` 注入 `traceId`，整條事件鏈共享
- 每條 Audit 記錄均含 `traceId`，支援全鏈追蹤

#### Domain Metrics

| 監控項目 | 來源 |
|----------|------|
| IER 各 Lane Throughput / Latency | IER |
| FUNNEL 各 Lane 處理時間 | Event Funnel |
| OUTBOX_RELAY lag | Relay Worker `[R1]` |
| Rate Limit hit / Circuit open | Gateway 防護層 |
| Claims 刷新成功率 | Token Refresh `[S6]` |

#### Domain Errors

| 錯誤類型 | 來源 |
|----------|------|
| TX Runner 異常 | VS5 Workspace |
| Schedule Saga 補償失敗 | VS6 Scheduling |
| DLQ SECURITY_BLOCK 安全事件 | IER DLQ `[R5]` |
| Stale Tag Warning | VS8 TAG_STALE_GUARD `[S4]` |
| Token Refresh 失敗告警 | VS1 Claims `[S6]` |

---

## 10. 治理規則索引（Invariants & Development Rules）

### Consistency Invariants（#N）

| 編號 | 規則 |
|------|------|
| `#1` | 每個 BC 只能修改自己的 Aggregate |
| `#2` | 跨 BC 僅能透過 Event / Projection / ACL 溝通 |
| `#3` | Application Layer 只協調，不承載領域規則 |
| `#4a` | Domain Event 僅由 Aggregate 產生 |
| `#4b` | TX Runner 只投遞 Outbox，不產生 Domain Event |
| `#5` | Custom Claims 只做快照，非真實權限來源 |
| `#6` | Notification 只讀 Projection |
| `#7` | Scope Guard 僅讀本 Context Read Model |
| `#8` | Shared Kernel 必須顯式標示 |
| `#9` | Projection 必須可由事件完整重建 |
| `#10` | 任一模組需外部 Context 內部狀態 = 邊界設計錯誤 |
| `#11` | XP 屬 Account BC；Organization 只設門檻 |
| `#12` | Tier 永遠是推導值，不存 DB |
| `#13` | XP 異動必須寫 Ledger |
| `#14` | Schedule 只讀 ORG_ELIGIBLE_MEMBER_VIEW |
| `#15` | eligible 生命週期：joined→true · assigned→false · completed/cancelled→true |
| `#16` | Talent Repository = member + partner + team |
| `#17` | centralized-tag.aggregate 為 tagSlug 唯一真相 |
| `#18` | workspace-governance role 繼承 policy 硬約束 |
| `#19` | 所有 Projection 更新必須以 aggregateVersion 單調遞增為前提 |

### Infrastructure Contracts（S1–S6）

| 編號 | 契約 |
|------|------|
| `S1` | SK_OUTBOX_CONTRACT：at-least-once / idempotency-key / DLQ 分級 |
| `S2` | SK_VERSION_GUARD：aggregateVersion 單調遞增保護 |
| `S3` | SK_READ_CONSISTENCY：STRONG_READ vs EVENTUAL_READ |
| `S4` | SK_STALENESS_CONTRACT：SLA 常數單一真相 |
| `S5` | SK_RESILIENCE_CONTRACT：rate-limit / circuit-break / bulkhead |
| `S6` | SK_TOKEN_REFRESH_CONTRACT：Claims 刷新三方握手 |

### Atomicity Audit（A 系列）

| 編號 | 規則 |
|------|------|
| `#A1` | wallet 強一致；profile / notification 弱一致 |
| `#A2` | org-account.binding 只 ACL / projection 防腐對接 |
| `#A3` | blockWorkflow → blockedBy Set；allIssuesResolved → unblockWorkflow |
| `#A4` | ParsingIntent 只允許提議事件 |
| `#A5` | schedule 跨 BC saga / compensating event |
| `#A6` | CENTRALIZED_TAG_AGGREGATE 語義唯一權威 |
| `#A7` | Event Funnel 只做 compose |
| `#A8` | TX Runner 1 cmd / 1 agg 原子提交 |
| `#A9` | Scope Guard 快路徑；高風險回源 Aggregate |
| `#A10` | Notification Router 無狀態路由 |
| `#A11` | eligible = 「無衝突排班」快照，非靜態狀態 |
| `#A12` | Global Search = 跨切片權威，唯一跨域搜尋出口 |
| `#A13` | Notification Hub = 跨切片權威，唯一副作用出口 |

### Development Rules（D 系列）

| 編號 | 規則 |
|------|------|
| `D1` | 事件傳遞只透過 infra.outbox-relay |
| `D2` | 跨切片引用：`import from '@/features/{slice}/index'` only |
| `D3` | 所有 mutation：`_actions.ts` only |
| `D4` | 所有 read：`_queries.ts` only |
| `D5` | `src/app/` 與 UI 元件禁止 import `src/shared/infra/firestore` |
| `D6` | `"use client"` 只在 `_components/` 或 `_hooks/` 葉節點 |
| `D7` | 跨切片引用禁止 `_private` 引用 |
| `D8` | shared.kernel.\* 禁止 async functions / Firestore calls / side effects |
| `D9` | TX Runner 協調 mutation；slices 不得互相 mutate |
| `D10` | `EventEnvelope.traceId` 僅在 `CBG_ENTRY` 設定，其他地方唯讀 |
| `D11` | workspace-core.event-store 支援 projection rebuild，必須持續同步 |
| `D12` | `getTier()` 從 `shared.kernel.skill-tier` import，Firestore 禁帶 tier 欄位 |
| `D13` | 新增 OUTBOX 必須在 SK_OUTBOX_CONTRACT 宣告 DLQ 分級 |
| `D14` | 新增 Projection 必須引用 SK_VERSION_GUARD |
| `D15` | 讀取場景決策：先查 SK_READ_CONSISTENCY |
| `D16` | SLA 數值禁止硬寫，引用 SK_STALENESS_CONTRACT |
| `D17` | 新增外部觸發入口必須在 SK_RESILIENCE_CONTRACT 驗收後上線 |
| `D18` | Claims 刷新邏輯變更以 SK_TOKEN_REFRESH_CONTRACT 為唯一規範 |
| `D19` | 型別歸屬：跨 BC 契約優先放 shared.kernel.\* |
| `D20` | 匯入優先序：shared.kernel.\* > feature slice index.ts > shared/types |
| `D21` | 新 tag 語義類別必須在 VS8 定義 |
| `D22` | 跨切片 tag 語義引用必須指向 TE1–TE6 |
| `D23` | tag 語義標注格式統一 |
| `D24` | Feature Slice 禁止直接 import firebase/\* |
| `D25` | 新增 Firebase 功能必須在 FIREBASE_ACL 新增 Adapter |
| `D26` | Cross-cutting Authority 治理：Global Search + Notification Hub |

---

*本文件為純設計指南，無程式碼。所有架構決策皆有對應不變量索引，修改前請確認相關 Invariant。*
