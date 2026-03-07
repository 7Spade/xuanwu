# [索引 ID: @VS1-ACL] ACL Rules

## L7 Firebase ACL 與 RBAC 映射

* \ctive-account-context\ 作為目前的授權依據，其生命週期由 \context-lifecycle-manager\ 管理。
* **[#A9] Scope Guard**：
  * 作為授權的最快路徑。
  * 查詢來源：\QGWAY_SCOPE\ (\projection.workspace-scope-guard-view\)。
  * 高風險操作必須回源查 aggregate。
