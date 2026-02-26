---
name: create-vertical-slice
description: "垂直功能切片實作導引"
---

# 🍰 Vertical Slice Implementation Guide

## 任務方針
依據需求建立獨立切片，確保 UI、Application、Domain 與 Infrastructure 邊界清晰。

## 工具協作流程
1. **現狀掃描:** 呼叫 `tool-repomix` 確認新功能在 `project-structure.md` 中的位置。
2. **UI 構建:** 呼叫 `tool-shadcn` 確保僅使用組合式設計與 Radix primitives。
3. **邏輯推演:** 呼叫 `tool-thinking` 定義 Command/Event 流向，確保不產生循環依賴。
4. **技術查詢:** 若涉及 Next.js 新特性，呼叫 `tool-context7` 獲取權威文檔。

## 成功標準
- 程式碼結構符合 `docs/project-structure.md`。
- 寫入邊界符合聚合根限制，不跨 BC 直接寫入。