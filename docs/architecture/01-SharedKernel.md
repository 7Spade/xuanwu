# [索引 ID: @SK] Shared Kernel & Contracts (L1 / VS0)

L1 是跨切片的唯一契約中心，僅允許「可重用且無 side effect」的協議內容。

## 1. Shared Kernel 定義

- MUST: IF 模組放在 L1 THEN 必須是 contracts/constants/pure functions。
- FORBIDDEN: IF 模組在 L1 THEN MUST NOT 呼叫 Firebase SDK 或做 async I/O (`D8`, `D24`)。
- MUST: IF 規則已在 L1 定義 THEN 各 slice 只能引用，不得重複宣告。

## 2. SK_DATA 契約

- `event-envelope`
	- `traceId`, `causationId`, `correlationId`, `timestamp`, `idempotency-key`
	- `traceId` 僅可由 `L2 CBG_ENTRY` 注入一次 (`R8`)
- `authority-snapshot`
	- claims / roles / scopes 快照，作為讀側授權上下文。
- `skill-tier`
	- `getTier(xp) -> Tier`，純函式，不落地存儲 (`#12`)。
- `skill-requirement`
	- 跨片人力需求契約 `tagSlug x minXp`。
- `command-result-contract`
	- `Success { aggregateId, version }`
	- `Failure { DomainError }`

## 3. S 系列基礎設施契約

- `S1 SK_OUTBOX_CONTRACT`
	- at-least-once
	- idempotency-key 必帶
	- DLQ 分級 (SAFE_AUTO / REVIEW_REQUIRED / SECURITY_BLOCK)
- `S2 SK_VERSION_GUARD`
	- Projection 更新前必須驗證 `event.aggregateVersion > view.lastProcessedVersion`。
- `S3 SK_READ_CONSISTENCY`
	- STRONG_READ 與 EVENTUAL_READ 的路由準則。
- `S4 SK_STALENESS_CONTRACT`
	- SLA 常數單一真相，禁止硬寫。
- `S5 SK_RESILIENCE_CONTRACT`
	- rate-limit / circuit-breaker / bulkhead 基準。
- `S6 SK_TOKEN_REFRESH_CONTRACT`
	- Role/Policy 異動後 claims refresh 三方握手流程。

## 4. SK_PORTS（依賴倒置）

路徑：`src/shared-kernel/ports`

- `IAuthService`
- `IFirestoreRepo`
- `IMessaging`
- `IFileStore`

MUST: IF feature 需要 infra 能力 THEN 只能依賴 SK_PORTS；實作必須在 L7 ACL Adapter。

## 5. 審查重點

- 是否有 L1 內出現 async/SDK 呼叫。
- 是否有 `SK_CMD_RESULT` / SLA 常數 / event envelope 在 slice 重複定義。
- 是否有 feature 直接依賴 `@/shared-infra/*` 而非 SK_PORTS。

## 6. 邊界澄清（遷移前必讀）

`L1 Shared Kernel` 與 `Shared Infrastructure Plane (L6/L7/L8/L9)` 是平行治理面，不是同一層。

- `L1 Shared Kernel`（`src/shared-kernel`）:
	- 只放契約、常數、純函式。
	- 不允許 SDK 呼叫、不允許 I/O、不允許副作用。
- `L6 Query Gateway`（`src/shared-infra/gateway-query`）:
	- 統一 read-model 讀取出口，做讀一致性路由。
- `L7 Firebase ACL`（`src/shared-infra/frontend-firebase`）:
	- 唯一合法 Firebase SDK 呼叫點（`auth/firestore/messaging/storage`）。
- `L8 Firebase Infrastructure`（Firebase runtime）:
	- 外部平台本體，不屬於本地業務層。
- `L9 Observability`（`src/shared-infra/observability`）:
	- 指標、錯誤、追蹤觀測；不承擔業務決策。

遷移準則：
- 先整理 L1 契約與 Ports，再做 D24 依賴替換。
- 任何「需要呼叫 SDK」的邏輯都應下沉到 L7，而不是留在 slice。

圖表命名規則：
- Mermaid 的 layer/slice/authority 標題應附上實際目錄路徑（例如 `src/shared-infra/gateway-command`），避免責任邊界歧義。
