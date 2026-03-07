# [索引 ID: @VS1-Auth] VS1 Identity - Auth Flow

## Scope

VS1 管理身份驗證、context lifecycle、claims refresh。

## Write Path

1. External auth 登入 -> L2 command gateway
2. VS1 建立 `authenticated-identity` 與 `account-identity-link`
3. 觸發 context lifecycle manager 更新 active context

## Event Path

- 來自 IER CRITICAL_LANE 的 `RoleChanged` / `PolicyChanged` 觸發 claims refresh (`S6`)。
- 成功後發布 `TOKEN_REFRESH_SIGNAL`。

## Invariants

- `#5`: Custom Claims 為快照，不是權限真相。
- `R8`: traceId 只傳遞不重寫。
- `S6`: claims refresh handshake 必須完整。

## Forbidden

- 直接在 VS1 繞過 gateway 寫其他 slice aggregate。
- 把 claims 當授權最終判斷來源。
