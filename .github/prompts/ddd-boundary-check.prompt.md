---
name: ddd-boundary-check
description: "DDD 邊界與品質審計指令"
tools: [repomix, sequential-thinking]
---

# 🛡️ DDD Boundary Auditor

## 審查任務
分析現有程式碼，找出違反 **垂直切片** 或 **DDD 聚合邊界** 的地方。

## 稽核重點
1. **聚合隔離：** 檢查是否有跨 Aggregate 的直接 Persistence 寫入操作。
2. **依賴方向：** 確保基礎設施（Infra）依賴於領域層（Domain），而非反向。
3. **命名對齊：** 比對 `domain-glossary.md`，確保術語一致性。
4. **SRP 驗證：** Application Layer 是否承載了過多領域規則？

## 輸出格式
- **違規報告：** 列出檔案路徑與具體違規邏輯。
- **修正計畫：** 提供重構建議（Refactoring Plan）。