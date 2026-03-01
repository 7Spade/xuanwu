**AGENTS Index**

**Docs:**
- **domain-glossary:** [docs/domain-glossary.md](docs/domain-glossary.md) — 領域術語與定義。
- **logic-overview:** [docs/logic-overview.md](docs/logic-overview.md) — 業務流程與決策邏輯（最高權威）。
- **persistence-model-overview:** [docs/persistence-model-overview.md](docs/persistence-model-overview.md) — 資料模型與儲存策略。
- **project-structure:** [docs/project-structure.md](docs/project-structure.md) — 專案目錄與分層規範。
- **schema-definition:** [docs/schema-definition.md](docs/schema-definition.md) — 重要資料結構規格。
- **tech-stack:** [docs/tech-stack.md](docs/tech-stack.md) — 使用技術與版本概覽。
- **prd-schedule-workforce-skills:** [docs/prd-schedule-workforce-skills.md](docs/prd-schedule-workforce-skills.md) — 排班與勞動力技能需求規格。

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
