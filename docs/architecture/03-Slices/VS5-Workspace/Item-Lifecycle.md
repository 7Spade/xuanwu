# [索引 ID: @VS5-Item] VS5 Workspace - Item Lifecycle

## A-Track

`workspace.items -> tasks -> QA -> acceptance -> finance-stage-gateway`

## B-Track

`issues` 作為阻塞支線，透過 `blockedBy` 與主流程同步 (`#A3`)。

## Invariants

- `D27-Order`: `WorkspaceItem -> WorkspaceTask -> WorkspaceSchedule` 禁止跳級。
- `#A15`: `Acceptance=OK` 前不得進入 Finance。
- `#A16`: outstanding amount > 0 時不得 completed。

## Event Discipline

- 主流程與異常流程交互必須事件化。
- 跨 slice 協作走 IER，不直接 mutate 他 BC 狀態。
