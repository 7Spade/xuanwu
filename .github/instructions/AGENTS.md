# AGENTS.md — 可用 AI 代理人總覽與指引

目的：在 `instructions` 目錄下放置一份機器可讀且供團隊參考的代理人總覽，說明每個代理的職責、可用工具（MCP）、及典型觸發場景。

核心要點：

- 每個代理需定義：名稱、簡短描述、可呼叫的 MCP 工具、輸入/輸出契約、與安全/治理考量。
- 範例代理（與 `.github/agents/AGENTS.md` 同步）：
  - Accessibility Expert — 用於無障礙檢測與改進建議；常用工具：`playwright-mcp`、`gem-browser-tester`。
  - Context7-Expert — 用於查詢外部官方文件與範例；常用工具：`mcp_io_github_ups_get-library-docs`。
  - Next.js Expert / Expert React Frontend Engineer — 用於路由、Server Component、效能診斷；常用工具：`next-devtools`、`sequential-thinking`。

擴充流程：

1. 在 `.github/agents/` 新增 `NAME.agent.md` 描述代理接口與限制。
2. 在 `.github/prompts/` 新增 `NAME.prompt.md` 做為呼叫該代理的標準化 prompt 範本。
3. 在 `AGENTS.md` 中新增索引條目並註明可用工具與觸發場景。

安全與治理：

- 每個代理的工具清單須經過 allowlist 審核，禁止未授權的 shell 或刪除操作。
- 代理呼叫需產生 append-only 的審計日誌，包含時間戳、代理名、輸入摘要與決策摘要。

---

## 偵測到的 Instruction 檔案

下列為 `.github/instructions/` 中可用的指引檔案（AI 可在調度時參考）：

- agent-skills.instructions.md
- agents.instructions.md
- AGENTS.md
- context-engineering.instructions.md
- context7.instructions.md
- github-actions-ci-cd-best-practices.instructions.md
- nextjs-parallel-routes-modern.instructions.md
- nextjs-tailwind.instructions.md
- nextjs.instructions.md
- performance-optimization.instructions.md
- security-and-owasp.instructions.md
- self-explanatory-code-commenting.instructions.md
- task-implementation.instructions.md
- typescript-5-es2022.instructions.md
- update-docs-on-code-change.instructions.md

AI 在執行任何跨專案或安全敏感操作前，應先查閱相關 instruction 檔以確保準則被遵守。
