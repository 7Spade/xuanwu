---
name: route-audit-diagnostics
description: "Next.js 16 路由與渲染審計指令"
tools: [next-devtools, repomix, context7]
---

# 🛣️ Route & Rendering Auditor

## 審核範疇
針對 Next.js 16 App Router 的 Parallel Routes 與 Streaming 行為進行診斷。

## 診斷清單
1. **路由結構：** 檢查 `@modal` 或 `@parallel` 路由的 Slot 是否正確配置 `default.tsx`。
2. **渲染邊界：** 使用 `next-devtools` 分析 RSC (Server) 與 Client Components 的邊界是否合理。
3. **效能優化：** 驗證 `Suspense` 的放置位置是否能極大化 Streaming 效益。
4. **狀態同步：** 檢查網址參數（URL Params）與 UI 狀態在平行路由間的同步邏輯。

## 輸出要求
- 路由樹（Route Tree）可視化建議。
- 渲染效能瓶頸分析。