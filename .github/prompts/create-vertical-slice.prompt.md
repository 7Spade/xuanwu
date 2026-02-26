---
name: create-vertical-slice
description: "垂直功能切片實作指令"
tools: [software-planning, shadcn, sequential-thinking, repomix]
---

# 🍰 Vertical Slice Creator

## 實作目標
建立一個完整的垂直功能切片，包含 UI、Application、Domain 與 Infrastructure。

## 執行流程
1. **模組規劃：** 使用 `software-planning` 定義切片的目錄結構，確保與現有 BC 隔離。
2. **UI 構建：** 調用 `shadcn` MCP 獲取基礎組件，設計符合 Radix primitives 的組合式 UI。
3. **邏輯解耦：** - 定義該切片的 **Command** 與 **Query**。
   - 確保 Domain 規則內聚於 Aggregate 中。
4. **驗證：** 使用 `sequential-thinking` 檢查是否存在跨切片的循環依賴。

## 檔案結構規範
每個切片必須包含：
- `/ui`: Client/Server Components (shadcn/ui)
- `/application`: Flow Coordinators (Actions/Handlers)
- `/domain`: Business Logic & Entities
- `/infrastructure`: Firebase/GCP 具體實作