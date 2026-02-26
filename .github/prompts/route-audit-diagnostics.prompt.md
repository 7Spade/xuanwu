---
name: route-audit-diagnostics
description: "App Router、Parallel Routes 與渲染效能診斷"
---

# 🚥 Route & Rendering Diagnostic

## 診斷目標
解決 Next.js 16 複雜路由下的狀態不一致與渲染瓶頸。

## 工具調度
1. **動態追蹤:** 啟動 `tool-next-devtools` 分析 RSC 邊界與 Streaming 行為。
2. **結構掃描:** 使用 `tool-repomix` 檢查 `@modal` 或 `@parallel` 路由的 Slot 配置。
3. **官方對齊:** 若出現渲染異常，呼叫 `tool-context7` 驗證 App Router 最新補丁行為。

## 審查指標
- 是否有不必要的客戶端組件滲透？
- `Suspense` 是否位於最大化 Streaming 效益的位置？