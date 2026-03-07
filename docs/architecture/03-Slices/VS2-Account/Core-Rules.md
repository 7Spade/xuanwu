# [索引 ID: @VS2-ACC] VS2 Account - Core Rules

## Scope

VS2 管理帳號主體、組織綁定、角色與政策快照。

## Core Aggregates

- `user-account.aggregate`
- `organization-account.aggregate`
- `wallet.aggregate` (強一致帳務)
- `account.profile` (弱一致展示與通知用途)

## Invariants

- `#A1`: wallet 強一致，profile 弱一致。
- `#A2`: org-account.binding 只做 ACL/projection 防腐對接。
- `#1/#2`: 不跨 slice 直接 mutate。

## Event & Outbox

- MUST: 帳號異動事件進 outbox (`S1`)。
- 建議 lane:
	- CRITICAL: RoleChanged / PolicyChanged / Wallet*
	- STANDARD: AccountCreated

## Forbidden

- 直接操作 notification side effects（應交 VS7）。
- 直接調用 Firebase SDK（應經 D24 ACL 路徑）。
