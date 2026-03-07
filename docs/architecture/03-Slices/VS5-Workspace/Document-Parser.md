# [索引 ID: @VS5-Doc] Document Parser & Cost Classifier

負責將原始文件轉化為業務意圖數據。

## 1. Parsing Lifecycle
1. 接放原始檔案 (\workspace.files\)
2. \document-parser\ (Layer-1 原始圖文解析) 產出 raw \ParsedLineItem[]\
3. 呼叫 Layer-2 語義分類器 \classifyCostItem()\ [VS8]
4. 最終轉為 Digital Twin：\ParsingIntent\

## 2. Digital Twin (ParsingIntent) [#A4]
* 結構包含：\lineItems[].(costItemType, semanticTagSlug, sourceIntentIndex)\。
* 僅為「提議」狀態，不可直接操作下游業務狀態。

## 3. Cost Classifier 關聯 [D27, #A14]
* \classifyCostItem()\ 是由 VS8 提供的純函數。禁止在分類過程中進行 async/DB 存取。
* Parser 必須經過此函數標註 \costItemType\ 屬性。
