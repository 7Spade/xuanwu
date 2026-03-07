# [索引 ID: @VS1-ACL] VS1 Identity - ACL Rules

## Scope

VS1 授權規則以 `active-account-context` + scope guard 為入口。

## Rules

- MUST: 授權快路徑走 `projection.workspace-scope-guard-view` (`#A9`)。
- MUST: 高風險操作回源 aggregate 做強校驗。
- MUST: 授權資料透過 L6 查詢出口，不直接讀 Firebase。

## D24 Boundary

- FORBIDDEN: VS1 feature 直接 import `firebase/*`。
- MUST: 若需 Firebase 能力，透過 L1 ports + L7 adapter。

## Audit Signals

- scope guard hit ratio
- fallback to strong check ratio
- token refresh failure events (security lane)
