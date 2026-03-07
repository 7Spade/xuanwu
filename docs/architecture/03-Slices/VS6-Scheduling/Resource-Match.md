# [索引 ID: @VS6-Match] VS6 Scheduling - Resource Match

## Scope

由 `workforce-scheduling-saga` 協調排班資格檢查與補償流程。

## Rules

- MUST: 只讀 `ORG_ELIGIBLE_MEMBER_VIEW` 做資格判斷 (`#14`, `#15`)。
- MUST: 能力需求以 `SK_SKILL_REQ` + `tag-snapshot` 對齊。
- MUST: 失敗情境產生 compensating events (`#A5`)。

## Forbidden

- 直讀其他 slice 私有模型做資格判定。
- 繞過 saga 直接寫 OrganizationSchedule。
