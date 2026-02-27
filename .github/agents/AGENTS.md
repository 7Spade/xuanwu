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

## 🚀 專案核心艦隊（18 Agent）

以下為本專案量身打造的 18 人 AI 開發艦隊，由 `feature-builder` 作為總指揮統一調度：

### 核心工作流程

```
User 需求
  └─> feature-builder（總指揮）
        ├─ product-strategist  → 需求梳理、MVP 定義
        ├─ architect           → App Router 結構、平行路由規劃
        ├─ researcher          → 現有代碼模式掃描（唯讀）
        ├─ implementer         → 代碼實作、shadcn CLI 操作
        ├─ qa-reviewer         → TypeScript 類型、Build 測試
        ├─ firebase-security   → Security Rules、Auth 權限審查
        ├─ test-engineer       → Playwright E2E 測試
        ├─ style-designer      → Tailwind / Shadcn 風格一致性
        ├─ performance-expert  → 快取策略、Firestore 索引
        ├─ infra-master        → CI/CD、環境變數配置
        ├─ reliability-expert  → 錯誤邊界、日誌系統
        ├─ docs-manager        → 文件更新
        ├─ seo-meta            → Metadata API、SSR SEO
        ├─ refactor-scout      → 技術債掃描、DRY 重構
        ├─ i18n-specialist     → 多語言支援、RTL 布局
        ├─ data-analyst        → 用戶行為追蹤、Web Vitals
        └─ asset-manager       → 圖片最佳化、圖示管理
```

### 艦隊分工總覽

| 分組 | 檔案名稱 | 角色定位 | 核心工具 |
|---|---|---|---|
| **核心開發** | `feature-builder.agent.md` | 總指揮（唯一有 `agent` 調用權） | read, edit, search, agent |
| **核心開發** | `architect.agent.md` | App Router & 平行路由架構師 | read, search, edit |
| **核心開發** | `implementer.agent.md` | Server Actions & Shadcn CLI 實作者 | read, edit, search, execute |
| **質量與安全** | `qa-reviewer.agent.md` | TypeScript 類型 & Build 校驗員 | read, search, execute |
| **質量與安全** | `firebase-security.agent.md` | Security Rules & Auth 權限專家 | read, search, edit |
| **質量與安全** | `test-engineer.agent.md` | Playwright E2E 測試工程師 | read, edit, search, execute |
| **性能與運維** | `performance-expert.agent.md` | Firestore 索引 & Next.js 快取優化師 | read, search, edit, execute |
| **性能與運維** | `infra-master.agent.md` | CI/CD & 環境變數配置運維官 | read, edit, search, execute |
| **性能與運維** | `reliability-expert.agent.md` | 錯誤邊界 & 日誌系統監控官 | read, search, edit |
| **設計與體驗** | `style-designer.agent.md` | Tailwind & Shadcn 風格守門員 | read, search, edit |
| **設計與體驗** | `seo-meta.agent.md` | generateMetadata & SSR SEO 策略師 | read, search, edit |
| **設計與體驗** | `i18n-specialist.agent.md` | 多語言路由 & RTL 布局專家 | read, search, edit |
| **管理與策略** | `product-strategist.agent.md` | 需求精煉 & MVP 定義商業邏輯師 | read, search, edit |
| **管理與策略** | `researcher.agent.md` | 現有模式掃描研究員（唯讀） | read, search |
| **管理與策略** | `docs-manager.agent.md` | README & Schema 文件維護官 | read, search, edit |
| **資產與後續** | `refactor-scout.agent.md` | 技術債 & DRY 重構偵察兵 | read, search, edit |
| **資產與後續** | `data-analyst.agent.md` | Firebase Analytics & Web Vitals 追蹤師 | read, search, edit |
| **資產與後續** | `asset-manager.agent.md` | next/image & Lucide 圖示管理員 | read, search, edit |

### 呼叫範例

`feature-builder` 統一調度其他代理：

```
User: 「我想在工作區首頁加入平行路由儀表板，資料從 Firebase 取出，用 Shadcn Card 顯示。」

Feature Builder 執行流程：
1. product-strategist → 梳理需求邊界、確認 MVP 範圍
2. architect          → 規劃 @dashboard slot 結構、Server/Client 邊界
3. researcher         → 確認現有 Firebase 配置路徑、Card 組件是否已安裝
4. implementer        → 建立檔案、npx shadcn@latest add card、實作 Firebase fetch
5. qa-reviewer        → next build + tsc --noEmit 驗證
6. firebase-security  → 審查新 Firestore 查詢的 Security Rules
7. docs-manager       → 更新路由樹狀圖文件
Feature Builder: 「任務完成」
```

---

## 通用代理檔案清單

以下為 `.github/agents/` 目錄中全部可用的 agent 檔案（包含通用框架代理）：

- `accessibility.agent.md` — WCAG 無障礙測試與修正
- `agent-governance-reviewer.agent.md` — 代理治理、政策、稽核審查
- `api-architect.agent.md` — API 設計、契約、版本策略
- `architect.agent.md` — **[艦隊]** App Router & 平行路由架構師
- `asset-manager.agent.md` — **[艦隊]** 圖片最佳化 & 圖示管理員
- `code-tour.agent.md` — VSCode CodeTour 檔案建立
- `context7.agent.md` — 外部框架文件檢索（next-intl、Firebase 等）
- `custom-agent-foundry.agent.md` — 設計與建立新 VS Code 代理
- `data-analyst.agent.md` — **[艦隊]** 用戶行為追蹤 & Analytics
- `debug.agent.md` — 錯誤定位與除錯
- `docs-manager.agent.md` — **[艦隊]** 文件更新維護官
- `expert-nextjs-developer.agent.md` — Next.js 16 App Router 專家
- `expert-react-frontend-engineer.agent.md` — React 19 前端工程師
- `feature-builder.agent.md` — **[艦隊]** 開發任務總指揮官
- `firebase-security.agent.md` — **[艦隊]** Firebase Security Rules 專家
- `gem-browser-tester.agent.md` — 瀏覽器自動化測試
- `gem-devops.agent.md` — DevOps、容器、CI/CD
- `gem-documentation-writer.agent.md` — 技術文件撰寫
- `gem-implementer.agent.md` — TDD 代碼實作
- `gem-orchestrator.agent.md` — 通用任務編排器
- `gem-planner.agent.md` — DAG 計畫與任務分解
- `gem-researcher.agent.md` — 代碼庫上下文研究
- `gem-reviewer.agent.md` — OWASP 安全稽核
- `github-actions-expert.agent.md` — GitHub Actions CI/CD 配置
- `hlbpa.agent.md` — 高層架構文件審查
- `i18n-specialist.agent.md` — **[艦隊]** 多語言路由 & RTL 專家
- `implementation-plan.agent.md` — 功能實作計畫生成
- `implementer.agent.md` — **[艦隊]** 代碼實作者
- `infra-master.agent.md` — **[艦隊]** CI/CD & 部署運維官
- `janitor.agent.md` — 代碼清理與技術債移除
- `modernization.agent.md` — 舊系統現代化升級
- `performance-expert.agent.md` — **[艦隊]** 效能優化師
- `plan.agent.md` — 策略規劃與架構分析
- `planner.agent.md` — 實作計畫生成
- `polyglot-test-builder.agent.md` — 跨語言測試建構
- `polyglot-test-fixer.agent.md` — 修復編譯錯誤
- `principal-software-engineer.agent.md` — 主任工程師技術指導
- `product-strategist.agent.md` — **[艦隊]** 需求精煉 & MVP 商業邏輯師
- `prompt-engineer.agent.md` — Prompt 優化與分析
- `qa-reviewer.agent.md` — **[艦隊]** 品質校驗員
- `qa-subagent.agent.md` — QA 測試規劃與 Bug 追蹤
- `refactor-scout.agent.md` — **[艦隊]** 技術債 & 重構偵察兵
- `refine-issue.agent.md` — 細化需求與 Issue 規格
- `reliability-expert.agent.md` — **[艦隊]** 錯誤邊界 & 監控官
- `research-technical-spike.agent.md` — 技術尖刺研究與驗證
- `researcher.agent.md` — **[艦隊]** 代碼模式掃描研究員
- `rug-orchestrator.agent.md` — 純編排代理（子任務分解）
- `seo-meta.agent.md` — **[艦隊]** SEO & Metadata 策略師
- `style-designer.agent.md` — **[艦隊]** UI/UX 風格守門員
- `task-planner.agent.md` — 可執行任務計畫建立
- `task-researcher.agent.md` — 全面專案分析研究
- `tdd-green.agent.md` — TDD Green 階段（讓測試通過）
- `tdd-red.agent.md` — TDD Red 階段（撰寫失敗測試）
- `tdd-refactor.agent.md` — TDD Refactor 階段（重構）
- `tech-debt-remediation-plan.agent.md` — 技術債修復計畫
- `technical-content-evaluator.agent.md` — 技術內容品質評估
- `test-engineer.agent.md` — **[艦隊]** E2E 測試工程師

> **[艦隊]** 標記表示屬於本專案 18 人核心開發艦隊，由 `feature-builder` 統一調度。

每個檔案包含輸入格式、可用工具清單（MCP 名稱）、預期輸出與限制，AI 在呼叫前應先閱讀對應檔案。
