# [索引 ID: @INV-A] Authority & Hard Constrains (A 系列與數字系列)

業務聚合之間的強制隔離法則。

* **[#1] 寫入隔離**：每個 BC 只能改自己的 Aggregate。
* **[#2] 溝通隔離**：跨 BC (Slice ↔ Slice) 不可互相呼叫 mutate，只能透過 Domain Event 與防腐 ACL。
* **[#4a/#4b] 職責分離**：Domain Event 只能由 Aggregate 本體內生產；Application Service 的 TX Runner 只做 Outbox 貯存投遞而已。
* **[#5/#6/#7] 查詢限制**：Notification Worker 與 \scope-guard\ 授權等服務，被要求只能走對應的 Projection 介面讀取。
* **[#A5] 補償機制 (Saga)**：VS6 對排班的跨邊界呼叫為典型的 Saga Pattern，若失敗退回則必定有 Compensating Events （如 \ScheduleAssignRejected\）。
* **[#A8] 單一原子提交**：每個 Command Handler 的 Transaction (1 CMD) 只能呼叫 / 鎖定 / 更新一個 Aggregate 的事務。
* **[#A9] Scope Guard**：此為權限攔截的最快路徑，防腐檢查若過複雜高風險必須回源呼叫 Aggregate。
* **[#A12] Global Search Authority**：所有切片禁止私自建 Search API，統一掛靠 \global-search.slice\。
* **[#A13] Notification Hub Authority**：所有切片禁止自寫信件寄送、推播，統一由 \
otification-hub.slice\ 接手轉拋。
