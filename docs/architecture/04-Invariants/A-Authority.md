otification-hub.slice\ 接手轉拋。
# [索引 ID: @INV-A] Authority Invariants (A / #A)

本檔定義「誰有權做什麼」，任何違反都屬架構違規。

## 1. 邊界與原子性

- `#1` 每個 BC 只能修改自己的 aggregate。
- `#2` 跨 BC 僅可透過 Event / Projection / ACL 溝通。
- `#A8` 1 command -> 1 aggregate，TX Runner 不得同時寫多聚合。
- `#4a/#4b` Domain Event 只能由 aggregate 產生；TX Runner 僅負責 outbox 投遞。

## 2. 權威出口

- `#A12` Search Authority
	- MUST: 所有跨域搜尋必須走 `global-search.slice`。
	- FORBIDDEN: 任何 slice 自建跨域搜尋 API。
- `#A13` Side-effect Authority
	- MUST: 所有通知副作用必須走 `notification-hub.slice`。
	- FORBIDDEN: 業務 slice 直接呼叫 email/push/sms provider。

## 3. 授權與範圍

- `#A9` Scope Guard
	- 快速授權路徑可走 read model。
	- 高風險操作必須回源 aggregate 校驗。
- `#5` Custom Claims 為快照，不是最終授權真相。

## 4. 協作與補償

- `#A5` 排班跨片協作必須以 saga + compensating events 實現。
- MUST: IF compensation 觸發 THEN 必須產生可追蹤事件 (`ScheduleAssignRejected`, `ScheduleProposalCancelled`)。

## 5. 決策權邊界

- `#A14` 成本分類與任務物化決策由 VS8 + VS5 gate 主導。
- `#A15/#A16` Finance gate 與多輪請款循環不得被其他 slice 繞過。
- `A17` XP 寫入權限僅在 VS3，VS8 只提供語義與 policy lookup。
