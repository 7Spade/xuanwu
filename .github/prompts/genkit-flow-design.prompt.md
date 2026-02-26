---
name: genkit-flow-design
description: "Genkit AI Flow 與可觀測性設計"
---

# 🤖 Genkit Flow Architect

## 設計原則
在 Serverless 前提下設計可演化的 AI Flow，必須與資料層解耦。

## 工具協作
1. **文檔同步:** 強制呼叫 `tool-context7` 查詢最新的 Genkit 插件與 Zod Schema 規範。
2. **架構規劃:** 使用 `tool-planning` 定義 Flow 的輸入輸出邊界。
3. **邏輯驗證:** 呼叫 `tool-thinking` 確保 AI 邏輯不會直接越權操作資料庫。

## 硬性約束
AI Flow 必須透過 Application Layer 觸發 Command，不得繞過 BC 邊界。