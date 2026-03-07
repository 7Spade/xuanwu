# ⚠️ 此檔案已遷移

> 原本 480 KB 的單體程式碼快照已拆分為模組化 Skill，請改用以下路徑：

## 新位置

| 檔案 | 用途 |
|------|------|
| [`skills/SKILL.md`](../../skills/SKILL.md) | Skill 入口 — 使用指引與索引 |
| [`skills/references/summary.md`](../../skills/references/summary.md) | 專案概覽、統計與 Top 檔案清單 |
| [`skills/references/project-structure.md`](../../skills/references/project-structure.md) | 目錄樹與各層行數 |
| [`skills/references/files.md`](../../skills/references/files.md) | 完整壓縮程式碼內容（Tree-sitter 壓縮） |

## 更新方式

```bash
# 重新生成 skills/ 快照
npx repomix --generate-skill
```

> 詳見 `repomix.config.ts` 的輸出設定。
