# [索引 ID: @LYR] 02 - Layering Rules (L0-L9)

本檔只定義一件事：層級之間「可以」與「不可以」如何互動。

## 1. 層級定義

- L0: External Triggers
- L1: Shared Kernel
- L2: Command Gateway
- L3: Domain Slices (VS1~VS8)
- L4: Integration Event Router (IER)
- L5: Projection Bus
- L6: Query Gateway
- L7: Firebase ACL Adapters
- L8: Firebase Infrastructure
- L9: Observability

## 2. 單向依賴鏈

### 2.1 寫鏈

- MUST: IF 是寫入流程 THEN 路徑必須是 `L0 -> L2 -> L3 -> L4 -> L5`。
- FORBIDDEN: IF 任意節點回跳前層 THEN MUST NOT 合併。

### 2.2 讀鏈

- MUST: IF 是 UI/應用讀取 THEN 路徑必須是 `UI/app -> L6 -> L5`。
- FORBIDDEN: IF UI 直讀 L3 aggregate 或 Firebase THEN MUST NOT 合併。

### 2.3 Infra 鏈

- MUST: IF L3/L5/L6 需要 infra 能力 THEN 依賴 `L1(SK_PORTS) -> L7(ACL) -> L8(Firebase)`。
- FORBIDDEN: IF feature 直接 import `firebase/*` 或 `@/shared-infra/*` THEN MUST NOT 合併 (`D24`)。

## 3. 橫向通訊規則

- MUST: IF L3 與 L3 互動 THEN 只能透過 L4 事件，不得直接 mutate (`#1`, `#2`, `D9`)。
- MUST: IF 需要寫投影 THEN 只能透過 L5 event-funnel (`#9`, `S2`)。
- MUST: IF 需要讀語義 THEN 走 `projection.tag-snapshot`，不得直讀 graph internals (`D21-7`, `T5`)。

## 4. IER 與 Projection

- L4 IER lanes
  - CRITICAL_LANE
  - STANDARD_LANE
  - BACKGROUND_LANE
- MUST: IF 事件投影寫入 THEN 必須通過 `applyVersionGuard()` (`S2`)。
- MUST: IF relay 連續失敗 >= 3 THEN 進 DLQ (`R5`)。

## 5. Observability

- MUST: IF 事件有 trace context THEN `traceId` 僅可沿途傳遞，不可覆寫 (`R8`)。
- MUST: IF 發生 security block / DLQ 事件 THEN 必須上報 L9。

## 6. 反向與旁路禁止清單

- 禁止 `L6 -> L2` 反向驅動。
- 禁止 `L3 -> L5` 直寫繞過 funnel。
- 禁止 VS8 直接命令 VS5/VS6（只能透過 L4 事件或 L5/L6 讀側互動）。
