# [索引 ID: @ACT-FIN] Finance Cycle (`#A15`, `#A16`)

本檔描述 VS5 財務生命週期與完成條件。

## 1. Finance Entry Gate (`#A15`)

- MUST: IF workflow 尚未 `Acceptance=OK` THEN MUST NOT 進入 Finance。
- MUST: IF 建立 Claim THEN payload 必含勾選 line items 且 `quantity > 0`。
- FORBIDDEN: 空請款、零數量、負數量。

## 2. Multi-Claim Loop (`#A16`)

固定流程：

1. Claim Preparation
2. Claim Submitted
3. Claim Approved
4. Invoice Requested
5. Payment Term (timer running)
6. Payment Received

## 3. Payment Term 計時規則

- MUST: 計時起點 = `Invoice Requested`。
- MUST: 計時終點 = `Payment Received`。
- FORBIDDEN: 未經 `Invoice Requested` 直接進 `Payment Term` 或 `Payment Received`。

## 4. Completion Gate

- MUST: IF `outstandingClaimableAmount > 0` THEN 流程回到 Claim Preparation。
- MUST: IF `outstandingClaimableAmount = 0` THEN 才允許進 `Completed`。
- FORBIDDEN: 仍有可請款餘額時標記 completed。

## 5. 與其他規則關聯

- 與 `D27` 相容：Finance 候選資料可由 parser 提供，但不代表自動跨階段。
- 與 `S2` 相容：涉及讀模型更新的事件仍需 version guard。
- 與 `R6` 相容：不得跳過狀態機定義節點。
