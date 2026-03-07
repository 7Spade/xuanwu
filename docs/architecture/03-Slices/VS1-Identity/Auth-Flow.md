# [索引 ID: @VS1-Auth] Auth Flow & Session Lifecycle

VS1 (Identity Slice) 負責管理系統的使用者登入與 Context Lifecycle。

## 1. 當前登陸身份 (Authenticated Identity)
- 透過 \EXT_AUTH\ 取得身份，建立 \uthenticated-identity\。
- 經過 \ccount-identity-link\ 進行 Firebase User ID 與 internal \ccountId\ 的映射。

## 2. Context Lifecycle Manager
* **建立**：當使用者 \Login\ 時觸發。
* **刷新**：當 \OrgSwitched\ 或 \WorkspaceSwitched\ 時更新 ctive-account-context\。
* **失效**：當 Token 過期 (\TokenExpired\) 或登出 (\Logout\)。

## 3. Claims Refresh Handler [S6]
- 觸發條件：接收到 IER (CRITICAL_LANE) 廣播的 \RoleChanged\ 或 \PolicyChanged\。
- 對象：更新使用者的 Firebase Custom Claims。
- **[#5]** Custom Claims 只做快照，非真實權限來源，TTL = Token 有效期。
- 處理完成後，發出 \TOKEN_REFRESH_SIGNAL\。
