# [索引 ID: @INV-S] Stability Invariants (S)

本檔定義一致性、韌性與時間相關硬約束。

## 1. S1 SK_OUTBOX_CONTRACT

- MUST: 事件投遞符合 at-least-once。
- MUST: 每筆事件帶 idempotency-key。
- MUST: 每個 outbox 事件宣告 DLQ 等級 (SAFE_AUTO / REVIEW_REQUIRED / SECURITY_BLOCK)。

## 2. S2 SK_VERSION_GUARD

- MUST: Projection 更新前先做版本守衛。
- 規則: `event.aggregateVersion > view.lastProcessedVersion` 才允許更新。
- FORBIDDEN: 直接覆寫舊版本投影資料。

## 3. S3 SK_READ_CONSISTENCY

- STRONG_READ: 金融、安全、不可逆操作。
- EVENTUAL_READ: 列表、統計、一般展示。
- MUST: 查詢路由必須顯式選擇一致性等級。

## 4. S4 SK_STALENESS_CONTRACT

- MUST: SLA 常數集中定義，不得硬編碼。
- 典型門檻:
  - TAG_MAX_STALENESS <= 30s
  - PROJ_STALE_CRITICAL <= 500ms
  - PROJ_STALE_STANDARD <= 10s

## 5. S5 SK_RESILIENCE_CONTRACT

- MUST: 外部入口具備 rate-limit / circuit-breaker / bulkhead。
- MUST: 限流與熔斷狀態可被觀測並告警。

## 6. S6 SK_TOKEN_REFRESH_CONTRACT

- 觸發: RoleChanged / PolicyChanged。
- 路徑: IER CRITICAL_LANE -> claims handler -> token refresh signal。
- 失敗: 進 SECURITY_BLOCK + 告警。

## 7. 審查重點

- 是否存在 projection 寫入漏掉 S2。
- 是否存在 SLA 常數散落硬寫。
- 是否存在 outbox 事件無 DLQ 分級或缺 idempotency-key。
