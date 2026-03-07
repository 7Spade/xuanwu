# [索引 ID: @VS7-NOTIF] VS7 - Notification Hub

這是整個系統 **唯一合法的副作用（Side-effect）出口**，負責統一派發所有外部通訊與廣播任務。

## 1. 隔離輸出準則 [D26, #A13]
* **禁止繞道**：任何其他的 Feature Slice (如 VS1-VS6) **絕對禁止** 直接在內部程式碼呼叫 \sendEmail()\, \push()\ 或 \SMS\ 函式。
* 所有通知的觸發都必須經過 \
otification-hub.slice\ 代理與記錄，保證架構「副作用出入口的單一性」。

## 2. 無狀態路由器 (Stateless Router) [#A10]
* **notification-router**: 監聽來自 IER STANDARD_LANE 的各種網域事件（如：\ScheduleAssigned\）。
* 路由器本身不持有狀態，只單純將接收到的 Envelope 與 \	raceId\ 解析後，呼叫對應的派發服務。

## 3. 語義決定遞送管道
* 與 VS8 (Semantic Graph) 深度結合，透過標籤（如：\#channel:slack\, \#urgency:high\）決定通知是要派發至 App 內訊息、Email，還是 Slack 等外部通道。
