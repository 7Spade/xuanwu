---
name: ddd-boundary-check
description: "DDD 領域邊界與術語一致性審查"
---

# 🛡️ DDD Boundary Auditor

## 稽核重點
確保 Domain 規則內聚，且 Application Layer 僅負責流程協調。

## 工具串聯
1. **語意比對:** 呼叫 `tool-repomix` 提取程式碼，並對比 `domain-glossary.md` 檢查命名。
2. **依賴審查:** 呼叫 `tool-thinking` 掃描 import，標註任何從 Domain 引用 Infrastructure 的違規行為。
3. **聚合驗證:** 檢查是否符合 `persistence-model-overview.md` 定義的寫入規則。

## 輸出要求
列出所有違反「單一職責原則 (SRP)」或「邊界侵入」的具體位置與修正方案。