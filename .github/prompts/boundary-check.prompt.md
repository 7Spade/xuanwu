---
name: boundary-check
description: "嚴格檢查垂直切片隔離度與 DDD 聚合邊界"
tools: [repomix, sequential-thinking, software-planning]
---

# 🛡️ 邊界與聚合防護檢查 (Boundary Guard)

## ⚠️ 硬性約束（Hard Constraints）
根據專案規範，你必須嚴格執行以下檢查：
- **禁止跨切片寫入:** 不同垂直切片（Vertical Slice）之間不得直接操作對方的資料庫聚合。
- **聚合寫入邊界:** 寫入操作必須保持邊界清晰，不可跨模組直接操作聚合。
- **層級依賴:** Domain 層必須純粹，禁止引用 Infrastructure 或 UI 層的實作。
- **通訊限制:** 跨模組溝通必須透過 Command / Event 流程，禁止強耦合調用。

## 🔎 稽核清單
1. **依賴掃描:** 檢查 `import` 語句，是否存在跨 Boundary Context (BC) 的非必要依賴？
2. **職責驗證:** UI 層是否僅使用 **shadcn/ui**？是否有業務邏輯滲漏到 UI 或 AI Flow 中？
3. **副作用檢查:** Command 執行後產生的 Event 是否符合 `command-event-overview.md` 定義？
4. **狀態完整性:** 聚合根（Aggregate Root）是否能保證其內部的資料一致性？

## 🏁 輸出要求
- 使用 `sequential-thinking` 推導依賴關係圖。
- 若偵測到「循環依賴」或「邊界突破」，必須提供基於 Command/Event 的解耦重構方案。