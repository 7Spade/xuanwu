# [索引 ID: @VS6-Timeline] Timeline Rules

[D27-Order] 單向鏈與視圖呈現。

## 1. 排序不變量 [D27-Order]
* 處理層級為嚴格單向鏈：\WorkspaceItem -> WorkspaceTask -> Schedule\
* 絕對禁止「跳級」處理（例如沒有 TASK 直接建 SCHEDULE，或者不經過 ITEM 直建物化 TASK）。
* \sourceIntentIndex\ 必須在轉化過程中被保留，以維持原始順序。

## 2. Vis-timeline (L5 Projection)
* Timeline 呈現分為「日期維度 (\schedule-calendar-view\)」與「資源維度 (\schedule-timeline-view\)」。
* 日期或資源的「重疊計算 (Overlap)」或「分組邏輯 (Resource Grouping)」，必須在 **L5 (Projection Bus)** 完成預計算。
* 前端 UI **禁止直接讀取** Firebase 或 VS6 原生聚合（遵守 **[QGWAY]**），必須藉由 L6 查詢已計算過並符合要求的 Projection 視圖。
