# [索引 ID: @VS2-ACC] VS2 - Account Slice

涵蓋系統中所有實體使用者、組織帳號與其多租戶綁定的基礎邏輯。

## 1. 核心聚合根
* **user-account.aggregate**: 獨立使用者的核心帳號資料。
* **organization-account.aggregate**: 代表組織租戶的帳戶資料。
* **account.profile**: 使用者的個人設定檔，包含 FCM Token 的儲存與更新（由通知機制取用）。

## 2. 治理與權限綁定 (Governance)
* **org-account.binding**: 定義使用者與組織之間的 ACL 授權對應。
* **account-governance.role & policy**: 權限角色 (\	ag::role\) 與存取政策的管理容器。

## 3. 事件路由與 Outbox (S1)
根據事件嚴重程度分配至不同的 Outbox Lane：
* **CRITICAL**: RoleChanged, PolicyChanged（涉及安全阻擋 SECURITY_BLOCK）、WalletDeducted（資金異動）。
* **SAFE_AUTO**: AccountCreated。
