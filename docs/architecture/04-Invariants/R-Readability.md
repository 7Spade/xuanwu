# [索引 ID: @INV-R] Readability & Tracing (R 系列不變量)

與可視性、監控、資料追蹤有關的不可破壞不變量。

* **[R1] relay-lag-metrics**：Outbox Relay worker 的掃描滯後延遲（Lag）必須上報至 Obersvability [DOMAIN_METRICS]。
* **[R5] DLQ-failure-rule**：IER 轉拋失敗滿 3 次，無條件進入 DLQ 等待安全審查或復原，此機制不可有外卡例外。
* **[R6] workflow-state-rule**：Workflow State Machine 遷移路線強制鎖定，嚴禁跨越或反轉未定義的狀態鏈（如只能 \Draft -> QA\ 而不能反過來直接重設）。
* **[R7] aggVersion-relay**：Domain Event 傳遞過程，必須把聚合當下的版本 (\ggregateVersion\) 攜帶於事件體中作為併發與冪等參考。
* **[R8] traceId-readonly**：\	raceId\ 從前端進 L2 \unified-command-gateway\ 注射發起後，全段鏈式傳遞絕對為 [唯讀]，禁止任何 L3~L8 單元中綴或覆寫。
