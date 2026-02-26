---
name: compliance-audit
description: "全域文檔對齊與專案規範合規性審查"
---

# ⚖️ Full-Docs Compliance Auditor

## 審核目標
確保開發成果與 10 份核心文件（`docs/*.md`）高度一致。

## 執行邏輯
1. **全域掃描:** 使用 `tool-repomix` 同步程式碼與文檔上下文。
2. **深度比對:** 呼叫 `tool-thinking` 逐一檢查：
   - 是否引入 `tech-stack.md` 未定義技術？
   - 請求流向是否符合 `request-execution-overview.md`？
   - 基礎設施是否超出 `infrastructure-overview.md` 範圍？

## 終極準則
若程式碼與 `logic-overview.md` 衝突，以文檔為準並提出重構計畫。