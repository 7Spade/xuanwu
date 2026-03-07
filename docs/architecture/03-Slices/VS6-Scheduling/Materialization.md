# [索引 ID: @VS6-Mat] Materialization Gate [D27-Gate]

決定那些需求項目可以正式「物化」成排班任務。

## Layer-3 Semantic Router (D27-Gate)
- 進入 \shouldMaterializeAsTask(costItemType)\ 判斷。
- **唯一准入條件**：只有被歸類為 \EXECUTABLE\ 的 costItemType\ 才能被物化為 Tasks（進入 A-track）。
- 若為非 \EXECUTABLE\ (如 \MANAGEMENT\, \RESOURCE\, \PROFIT\, \ALLOWANCE\ 等) 則「靜默跳過並 toast 提示使用者」，不會形成排程。
- 此為嚴格的單出入口（唯一物化入口）。
