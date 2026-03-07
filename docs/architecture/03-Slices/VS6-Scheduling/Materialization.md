# [索引 ID: @VS6-Mat] VS6 Scheduling - Materialization Gate

## Rule

- MUST: 任務物化一律經 `shouldMaterializeAsTask(costItemType)`。
- MUST: 只有 `EXECUTABLE` 可物化成 task (`D27-Gate`)。
- FORBIDDEN: 非 EXECUTABLE 項目直接進排程主鏈。

## Inputs

- `costItemType`
- `semanticTagSlug`
- `sourceIntentIndex`

## Outputs

- 可物化: 進 A-track task pipeline
- 不可物化: 保留為非任務資料並提示使用者
