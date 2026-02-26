---
name: boundary-check
description: "聚合寫入防護與跨模組通訊安全審核"
---

# ⚔️ Aggregate Protection Guard

## 防禦指令
防止跨模組直接寫入與資料污染，確保單向依賴。

## 執行流程
1. **代碼抽樣:** 透過 `tool-repomix` 抓取 Data Layer 與 Repository 的實作。
2. **路徑追蹤:** 呼叫 `tool-thinking` 追蹤 Request 從 Entry 到 Persistence 的完整調用鏈。
3. **規則比對:** 對齊 `persistence-model-overview.md` 與 `schema-definition.md`。

## 警示指標
任何未經 Command Handler 且直接操作 Firestore 集合的行為皆為嚴重違規。