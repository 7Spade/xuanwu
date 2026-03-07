# [索引 ID: @VS6-Match] Resource Match

VS6 的核心調度邏輯，透過 \workforce-scheduling-saga\ [A5] 來處理。

## 1. 協調需求與分配 (Saga)
- 接收 \ScheduleProposed\ 事件起手。
- 發動 \eligibility check\ [#14] 來確保該成員是具備排班資格。
- 補償機制 (Compensating transactions): 若檢查不通過或發生其他業務異常，觸發 \ScheduleAssignRejected\ 或 \ScheduleProposalCancelled\。
- **原則**：需求引導執行，執行引導協作。

## 2. 資格查詢 [#14, #15]
- 必須僅讀取 \ORG_ELIGIBLE_MEMBER_VIEW\ (避免跨區調用內部模組)。
- eligibility 生命周期（非靜態）：\joined -> true\ -> \ssigned -> false\ -> \completed/cancelled -> true\。
