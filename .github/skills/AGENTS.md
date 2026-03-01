# AGENTS.md — Skills 清單與快速參考

此檔為 `.github/skills/` 的總覽，讓 AI 代理與工程師快速了解可用的 skill（領域專長模組）、它們的用途與典型呼叫情境。

核心原則：每個 skill 應包含一個 `SKILL.md`，描述其輸入格式、輸出範例、邊界條件、以及可用的 MCP 工具。

現有 Skill（摘要）

- `agent-governance` — 審核代理人治理、政策合規與審計流程。
- `agentic-eval` — 自動化代理行為與效能評估測試套件。
- `ai-prompt-engineering-safety-review` — 分析 prompt 的安全性、偏見與改寫建議。
- `next-best-practices` — Next.js 實作建議、RSC 邊界、路由與部署最佳實務。
- `next-cache-components` — 管理 Next.js 16 Cache Components 的策略與實作範例。
- `next-upgrade` — 指引 Next.js 升級步驟、codemod 與相容性檢查。
- `quasi-coder` — 將非結構化需求或偽代碼轉為可執行實作。
- `refactor` / `refactor-plan` — 外科式重構與多階段重構計畫。
- `review-and-refactor` — 結合自動審查與安全修正的重構流程。
- `web-design-reviewer` — 視覺與響應式設計評估與修正建議。

如何使用（簡短）：

1. 若需某項專長，呼叫 `runSubagent` 或對應的 prompt（例如 `gem-browser-tester`）並提供最小必要上下文。
2. 在自動化流程中，請將 skill 名稱與版本（若有）寫入任務的 metadata 以便追蹤與審計。
3. 若要新增 skill，新增 `SKILL.md` 到此資料夾，並在本檔新增索引說明。

治理與安全要點：

- Skill 的可用工具必須經 allowlist 審核；禁止未授權的 shell、網路代理或刪除操作。
- 輸入/輸出紀錄應 append-only 並可被審計（時間戳、呼叫者、摘要）。

如需我根據專案自動掃描並列出 repo 中實際存在的 `SKILL.md` 檔案，我可以執行掃描並把結果加入本檔。

---

## 偵測到的 Skill 目錄

以下資料夾位於 `.github/skills/`，請在對應資料夾中查看 `SKILL.md` 以取得詳細介面：

- agent-governance/
- agentic-eval/
- ai-prompt-engineering-safety-review/
- next-best-practices/
- next-cache-components/
- next-upgrade/
- quasi-coder/
- refactor/
- refactor-plan/
- review-and-refactor/
- web-design-reviewer/

若要，我可以掃描每個資料夾的 `SKILL.md` 並將其第一段摘要自動匯入本檔，便於 AI 快速檢索。
