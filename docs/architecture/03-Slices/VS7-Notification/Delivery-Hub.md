# [索引 ID: @VS7-NOTIF] VS7 Notification - Delivery Hub

## Scope

VS7 是唯一副作用出口，負責通知路由與交付。

## Authority

- `#A13`, `D26`: 所有通知副作用必須經 `notification-hub.slice`。
- `#A10`: notification router 無狀態，只做路由決策。

## Routing

- 消費 IER STANDARD_LANE 事件（如 ScheduleAssigned）。
- 可結合 VS8 語義標籤做 channel policy 決策。

## Forbidden

- 其他 slice 直接呼叫 email/push/sms provider。
- 在 VS7 生成新 traceId（只能沿用 envelope.traceId，`R8`）。
