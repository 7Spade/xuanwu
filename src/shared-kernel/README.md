# Shared Kernel（L1 · VS0）

此層為全域契約中心，對齊 `docs/00-LogicOverview.md` 的 L1（Shared Kernel）定義。

## 目錄結構

```text
src/
├── shared-kernel/              # 🔷 L1 · VS0 (全域契約中心)
│   ├── data-contracts/         # 📄 基礎資料契約 [#8]
│   ├── infra-contracts/        # ⚙️ 基礎設施行為契約 (S1-S6)
│   ├── ports/                  # 🔌 Infrastructure Ports [D24]
│   └── index.ts                # [D7] 唯一公開出口 (所有切片僅能從此引用)
```

## 子目錄職責

- `data-contracts/`
	- 放置跨切片共用的資料契約（例如 event envelope、authority snapshot、skill requirement、command result）。
	- 作為領域與基礎設施之間的共同語義基線（對應 [#8]）。

- `infra-contracts/`
	- 放置全域基礎設施行為契約與限制，包含 S1～S6（Outbox、Version Guard、Read Consistency、Staleness、Resilience、Token Refresh）。
	- 所有切片必須引用契約常數，禁止硬編碼行為與 SLA 數值。

- `ports/`
	- 定義依賴倒置介面（Infrastructure Ports），供 feature slices 透過介面使用底層能力。
	- 依 [D24]，feature slice 不可直接 `import firebase/*`，必須經由 ports/adapter 邊界存取。

- `index.ts`
	- 共享核心層的唯一公開出口。
	- 依 [D7]，跨切片引用只能透過公開 index，禁止深層路徑直引內部檔案。

## 使用原則

- Shared Kernel 僅承載「跨切片、跨層可重用」的契約與介面，不放業務流程邏輯。
- 若新規則未在 `docs/00-LogicOverview.md` / `docs/knowledge-graph.json` 定義，先補齊規格再實作。
- 新增契約時，請同步由 `index.ts` 顯式匯出，維持可觀測且可治理的公共 API 邊界。

## 共享核心層規範（必遵）

### 允許內容（Allowed in L1 / VS0）

- 基礎資料契約（Data Contracts）
	- 例如：`event-envelope`、`authority-snapshot`、`skill-requirement`、`command-result`。
	- 目標：提供跨切片一致語義，避免重複定義。

- 基礎設施行為契約（Infrastructure Invariants）
	- 例如：S1～S6（Outbox、Version Guard、Read Consistency、Staleness、Resilience、Token Refresh）。
	- 目標：行為約束與 SLA 常數集中治理，禁止各切片自行硬寫。

- 基礎設施埠口（Infrastructure Ports）
	- 例如：`IAuthService`、`IFirestoreRepo`、`IMessaging`、`IFileStore`。
	- 目標：依賴倒置，讓 feature slices 面向介面而非面向 SDK。

- 共享純函式邏輯（Pure Logic）
	- 僅允許可重用且無副作用的純函式（deterministic / no I/O / no async side effects）。
	- 適用：跨切片通用轉換、驗證、推導（如 tier 推導）。

### 禁止事項（Forbidden in L1 / VS0）

- 禁止寄生權威出口
	- 全域搜尋（Global Search）與通知中樞（Notification Hub）雖為跨切片能力，但必須保有各自獨立 Slice。
	- 不得寄生於 Shared Kernel（對齊 D26、D3、D8）。

- 禁止硬編碼業務邏輯
	- 任何具體業務決策（例如排班路由、成本分類）必須放在對應領域切片（如 VS6、VS8）。
	- Shared Kernel 不承載領域決策流程。

- 禁止直接實作外部 SDK
	- 具體 Firebase 呼叫必須留在 L7（Firebase ACL Adapters）。
	- L1 只定義契約與埠口，不實作 SDK 細節（對齊 D24、D25）。

## 共享核心層最佳化規則句

```rules
IF 內容可被 2 個以上切片重用，且不含業務決策
THEN 優先放入 Shared Kernel（L1）

IF 內容屬於資料語義（事件、快照、請求/回應契約）
THEN 放入 data-contracts/

IF 內容屬於全域行為不變量（S1~S6、SLA、一致性守衛）
THEN 放入 infra-contracts/ 並以常數/純函式形式輸出

IF 內容是基礎能力抽象（Auth/Firestore/Messaging/Storage）
THEN 只定義於 ports/，實作留在 L7 ACL adapters

IF 函式需要 I/O、SDK 呼叫、網路、時間依賴或副作用
THEN 不得放入 Shared Kernel

IF 內容涉及排班路由、成本分類、通知策略等領域決策
THEN 放入對應 Slice（VS6/VS8/VS7），不得上推 L1

IF 功能是跨切片權威出口（Global Search / Notification Hub）
THEN 必須維持獨立 Slice，不得寄生 Shared Kernel

IF 發現同一常數/型別在多切片重複宣告
THEN 收斂至 Shared Kernel 並由 index.ts 單一匯出

IF 新增 Shared Kernel 公開 API
THEN 必須同步更新 docs/architecture/00-LogicOverview.md 與本檔
```

## 相容遷移（Legacy → Canonical）

- Canonical 目標入口：`@/shared-kernel`（`src/shared-kernel/index.ts`）。
- 匯入入口統一為：`@/shared-kernel`（canonical）。
- 新增/修改程式碼時，優先使用 Canonical 入口；舊路徑以分批遷移方式逐步收斂。
