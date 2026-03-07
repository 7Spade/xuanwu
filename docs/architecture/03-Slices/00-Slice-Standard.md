# [索引 ID: @VS-STD] 00 - Slice Standard

所有業務切片（垂直切片 VS1-VS8）必須遵守的標準結構。

## 1. 架構層級分佈 (Layer Topology)

一個標準的業務切片（Feature Slice）應包含以下層級參與：
* **[L2] Command Handling**: 接收入口指令，執行授權校驗與 Transaction Runner 呼叫。
* **[L3] Domain Model**: Aggregate 實體、Events、Policy Engine、以及切片私有的 Domain Services。
* **[L4] Outbox**: 所有的狀態異動必須產生 Domain Event，並存入 \[slice]-outbox\。
* **[L5] Projection**: 如果該切片需要被 UI 或其他切片查詢，必須通過 Projection Bus 建立 Read Model。
* **[L6] Query Handling**: 對 Projection Data 進行讀取暴露。

## 2. 嚴格不變量 (Slice Invariants)

- **[#1]** 每個 Bounded Context 只能修改自己的 Aggregate。
- **[#2]** 跨 BC 溝通僅能透過 Event (非同步) / Projection (唯獨同步) / ACL (防腐) 溝通。
- **[#3]** Application Layer 只協調，不承載領域規則。
- **[#4a]** Domain Event 僅由 Aggregate 產生（唯一生成者）。
- **[#4b]** TX Runner 只投遞 Outbox，不產生 Domain Event（分工界定）。
- **[#8]** Shared Kernel (L1) 必須顯式標示；未標示即代表私有實作。禁止跨片共享私有模組。
- **[#9]** Projection 必須可由事件完整重建。
- **[S1]** Outbox 必須定義 DLQ 分級宣告 (\SAFE_AUTO\, \REVIEW_REQUIRED\, \SECURITY_BLOCK\)。
- **[S2]** 投影更新必須檢查 \event.aggregateVersion\ 單調遞增。
