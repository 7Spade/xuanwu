# [索引 ID: @ACT-COST] Cost Classifier (`#A14`, `D27`)

## 1. 責任定位

- VS8 `_cost-classifier.ts` 是唯一成本語義分類器。
- 輸出雙鍵：`(costItemType, semanticTagSlug)`。
- 分類器是純函式：無 async、無 DB、無 side effect (`D8`)。

## 2. 分類結果

- `EXECUTABLE`
- `MANAGEMENT`
- `RESOURCE`
- `FINANCIAL`
- `PROFIT`
- `ALLOWANCE`

## 3. 任務物化閘門

- MUST: IF `shouldMaterializeAsTask(costItemType)` THEN 只有 `EXECUTABLE` 回傳 `true` (`D27-Gate`)。
- FORBIDDEN: 直接把 `MANAGEMENT/RESOURCE/FINANCIAL/PROFIT/ALLOWANCE` 物化為 task。

## 4. 呼叫邊界

- VS5 `document-parser` 必須調用 VS8 classifier。
- FORBIDDEN: VS5 私建成本分類邏輯或硬編碼路由。
- MUST: Layer-3 semantic router 依 classifier 結果決定後續流程。

## 5. 實作檢查清單

- 是否保留 `semanticTagSlug` 與 `sourceIntentIndex`。
- 是否存在執行類 override（例如施工測試項歸 `EXECUTABLE`）。
- 是否把非 EXECUTABLE 項目做靜默跳過與 UI 提示，而非進 task pipeline。
