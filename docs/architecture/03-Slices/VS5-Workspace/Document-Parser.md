# [索引 ID: @VS5-Doc] VS5 Workspace - Document Parser

## Scope

將原始文件解析為 `ParsingIntent`，提供後續任務與財務路由決策。

## Pipeline

1. `workspace.files` 提供原始資料
2. parser 產生 `ParsedLineItem[]`
3. 調用 VS8 `classifyCostItem()`
4. 形成 `ParsingIntent.lineItems[]`

## Contract

- `#A4`: ParsingIntent 僅提案，不可直接變更下游 aggregate。
- `#A14`: 每個 line item 必須有 `(costItemType, semanticTagSlug, sourceIntentIndex)`。
- `D27`: 任務物化只能由 gate 決定。

## Forbidden

- VS5 私建分類器。
- parser 階段直接做 async/DB side effects。
