---
name: tool-next-devtools
description: "使用 next-devtools 分析路由與渲染"
tools: [next-devtools]
---

# 🚥 Next.js Route Diagnostics

## 任務
調用 `next-devtools` 分析：
1. **RSC 邊界：** 檢查 Server/Client Component 的切分是否優化。
2. **路由槽位：** 驗證 Parallel Routes 的 `@slot` 是否正確渲染。
3. **Suspense 效能：** 分析 Streaming 是否達到預期效果。