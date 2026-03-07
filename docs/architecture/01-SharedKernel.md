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

- `IAuthService`
- `IFirestoreRepo`
- `IMessaging`
- `IFileStore`

MUST: IF feature 需要 infra 能力 THEN 只能依賴 SK_PORTS；實作必須在 L7 ACL Adapter。

## 5. 審查重點

- 是否有 L1 內出現 async/SDK 呼叫。
- 是否有 `SK_CMD_RESULT` / SLA 常數 / event envelope 在 slice 重複定義。
- 是否有 feature 直接依賴 `@/shared-infra/*` 而非 SK_PORTS。
