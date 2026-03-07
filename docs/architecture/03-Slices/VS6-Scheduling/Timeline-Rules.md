# [索引 ID: @VS6-Timeline] VS6 Scheduling - Timeline Rules

## Order Invariant

- MUST: `WorkspaceItem -> WorkspaceTask -> WorkspaceSchedule` (`D27-Order`)。
- FORBIDDEN: 未有 task 直接建 schedule。

## Projection Boundary

- MUST: overlap/grouping 計算在 L5 完成。
- MUST: UI 只經 L6 Query Gateway 讀取 calendar/timeline views。
- FORBIDDEN: UI 直讀 VS6 aggregate 或 Firebase。

## Consistency

- Projection 更新需 `applyVersionGuard()` (`S2`)。
- 日期與資源視圖屬 read-side materialization，不承載寫側決策。
