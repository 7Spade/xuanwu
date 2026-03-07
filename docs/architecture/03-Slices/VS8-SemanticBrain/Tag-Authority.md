# [索引 ID: @VS8-TA] Tag Authority

標籤的唯一定義與規範生命週期。

## 1. 唯一註冊律 [D21-A]
所有跨領域概念，必須先在 VS8 (\core/tag-definitions.ts\ 或 \centralized-tag.aggregate\) 完成註冊，才允許在業務切片使用。禁止任何切片私下創建隱性分類。

## 2. 標籤生命週期防腐
- **生命週期**：Draft -> Active -> Stale -> Deprecated。
- **命名規則 [D21-T]**：\	agSlug\ 作為唯一鍵，創建後永久不可變更。
- **同義重定向 [D21-S]**：標籤廢併不會消失，而是變為 Alias（別名）重定向至新詞，避免歷史資料斷鏈。
- **孤立防禦 [D21-C, D21-10]**：系統中不允許沒有連結至 Parent 的節點，拓撲服務 (\indIsolatedNodes\) 必須定期監測回報。
