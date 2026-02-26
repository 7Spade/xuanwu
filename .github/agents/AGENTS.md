# AGENTS.md — 可用 AI 代理人清單與職責

此檔列出專案中可呼叫的 AI 代理人（Subagents）與簡短職責說明，方便自動化調度與指令路由。

使用方式概覽：啟動子代理時請以 `runSubagent` 呼叫代理名稱並提供任務描述與上下文。

主要代理人（範例）：

- Accessibility Expert: WCAG、無障礙測試與修正建議。
- Agent Governance Reviewer: 審查代理治理、政策、稽核與安全邊界。
- API Architect: API 設計、契約、版本與演進策略。
- Context7-Expert: 檢索並引用外部權威文件（如 Next.js、框架文件）。
- Debug Mode Instructions: 除錯並定位程式錯誤的專用代理。
- Next.js Expert: Next.js App Router、Cache Components 與現代實作專家。
- Expert React Frontend Engineer: React 19 / Hooks / 性能優化專家。
- QA: 測試計畫、邊界案例與回歸測試策略。
- Refine Requirement or Issue: 將不明需求細化為可執行的接受準則與技術考量。
- TDD Green/Red/Refactor phases: 支援 TDD 三階段的實作代理（快速讓測試通過、撰寫失敗測試、重構）。
- Polyglot Test Builder / Fixer: 建構與修復跨語言測試與編譯錯誤。
- gem-devops / gem-implementer / gem-planner: DevOps、實作與規劃類代理。

如何擴充：若要新增代理，請在 `.github/agents/` 中建立對應的 `NAME.agent.md` 或在中央 `AGENTS.md` 新增條目，並在 `.github/prompts/` 新增對應 prompt 範本。

注意事項：每個代理應該包含其輸入格式、預期輸出、可用工具（MCP）、以及限制或安全考量。

---

## 偵測到的代理檔案

以下為 `.github/agents/` 目錄中可用的 agent 檔案（請參考對應檔案以取得詳細介面說明）：

- accessibility.agent.md
- agent-governance-reviewer.agent.md
- api-architect.agent.md
- code-tour.agent.md
- context7.agent.md
- custom-agent-foundry.agent.md
- debug.agent.md
- expert-nextjs-developer.agent.md
- expert-react-frontend-engineer.agent.md
- gem-devops.agent.md
- gem-documentation-writer.agent.md
- gem-implementer.agent.md
- gem-orchestrator.agent.md
- gem-planner.agent.md
- gem-researcher.agent.md
- gem-reviewer.agent.md
- github-actions-expert.agent.md
- hlbpa.agent.md
- implementation-plan.agent.md
- janitor.agent.md
- modernization.agent.md
- plan.agent.md
- planner.agent.md
- polyglot-test-builder.agent.md
- polyglot-test-fixer.agent.md
- principal-software-engineer.agent.md
- prompt-engineer.agent.md
- qa-subagent.agent.md
- refine-issue.agent.md
- research-technical-spike.agent.md
- rug-orchestrator.agent.md
- task-planner.agent.md
- task-researcher.agent.md
- tdd-green.agent.md
- tdd-red.agent.md
- tdd-refactor.agent.md
- tech-debt-remediation-plan.agent.md
- technical-content-evaluator.agent.md

每個檔案應包含輸入格式（JSON/YAML 範本）、可用工具清單（MCP 名稱）、以及預期輸出與限制，AI 在呼叫前應先閱讀對應檔案。
