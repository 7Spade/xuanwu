**AGENTS Index**

**Docs:**
- **architecture-overview:** [docs/architecture-overview.md](docs/architecture-overview.md) — 系統與元件架構總覽。
- **command-event-overview:** [docs/command-event-overview.md](docs/command-event-overview.md) — 命令/事件流與運作模型。
- **domain-glossary:** [docs/domain-glossary.md](docs/domain-glossary.md) — 領域術語與定義。
- **infrastructure-overview:** [docs/infrastructure-overview.md](docs/infrastructure-overview.md) — 基礎設施與運維架構。
- **logic-overview:** [docs/logic-overview.md](docs/logic-overview.md) — 業務流程與決策邏輯（最高權威）。
- **persistence-model-overview:** [docs/persistence-model-overview.md](docs/persistence-model-overview.md) — 資料模型與儲存策略。
- **project-structure:** [docs/project-structure.md](docs/project-structure.md) — 專案目錄與分層規範。
- **request-execution-overview:** [docs/request-execution-overview.md](docs/request-execution-overview.md) — 請求處理與執行流程。
- **schema-definition:** [docs/schema-definition.md](docs/schema-definition.md) — 重要資料結構規格。
- **tech-stack:** [docs/tech-stack.md](docs/tech-stack.md) — 使用技術與版本概覽。

**GitHub AGENTS/Prompts/Instructions/Skills:**
- **.github/agents AGENTS:** [.github/agents/AGENTS.md](.github/agents/AGENTS.md) — 列出可呼叫的 subagents 與檔案位置。
- **.github/prompts AGENTS:** [.github/prompts/AGENTS.md](.github/prompts/AGENTS.md) — Prompt 範本索引與用途說明。
- **.github/instructions AGENTS:** [.github/instructions/AGENTS.md](.github/instructions/AGENTS.md) — 代理人使用與治理指引索引。
- **.github/skills AGENTS:** [.github/skills/AGENTS.md](.github/skills/AGENTS.md) — Skill（領域專長模組）總覽與呼叫指南。

**Usage:**
- **Read First:** before dispatching work, AI should read `logic-overview` and the corresponding AGENTS.md to choose the correct agent/skill/prompt.
- **Inspect Interfaces:** open the target `*.agent.md` / `SKILL.md` / `*.prompt.md` to obtain input/output contracts and allowed MCP tools.
- **Audit Trail:** log every agent call with timestamp, agent name, input summary, and decision summary (append-only).
- **Auto-scan (optional):** maintainers can request an auto-scan to embed first-paragraph summaries from `SKILL.md` and `*.agent.md` into this index.
