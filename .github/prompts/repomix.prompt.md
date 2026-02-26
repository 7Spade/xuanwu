---
name: tool-repomix
description: "使用 Repomix 提取專案全域上下文"
tools: [repomix]
---

# 📂 Repository Context Extraction

## 任務
使用 `repomix` 掃描當前專案，並分析：
1. **目錄結構：** 確認是否符合 `project-structure.md`。
2. **依賴圖譜：** 檢查 `package.json` 與 import 關係。
3. **實作現狀：** 提取特定 BC (Bounded Context) 的代碼片段以供審計。

## 輸出
- 專案現狀摘要。
- 與架構文件不符的異常點。