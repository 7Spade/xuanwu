# AGENTS.md — 可用 AI 代理人清單與職責

此檔列出專案中可呼叫的 AI 代理人（Subagents）與簡短職責說明，方便自動化調度與指令路由。

使用方式概覽：啟動子代理時請以 `runSubagent` 呼叫代理名稱並提供任務描述與上下文。

如何擴充：若要新增代理，請在 `.github/agents/` 中建立對應的 `NAME.agent.md` 或在中央 `AGENTS.md` 新增條目，並在 `.github/prompts/` 新增對應 prompt 範本。

注意事項：每個代理應該包含其輸入格式、預期輸出、可用工具（MCP）、以及限制或安全考量。

---

## 🚀 Gem 核心艦隊（8 Agent）

以下為通用 AI 開發艦隊，由 `gem-orchestrator` 作為總指揮統一調度：

### 核心工作流程

```
User 需求
  └─> gem-orchestrator（總指揮）
        ├─ gem-researcher        → 代碼庫上下文研究
        ├─ gem-planner           → DAG 計畫與任務分解
        ├─ gem-implementer       → TDD 代碼實作
        ├─ gem-browser-tester    → 瀏覽器自動化測試 & 無障礙審查
        ├─ gem-devops            → DevOps、CI/CD、容器部署
        ├─ gem-reviewer          → OWASP 安全稽核 & 規格驗證
        └─ gem-documentation-writer → 技術文件撰寫 & 圖表生成
```

### Gem 艦隊分工總覽

| 分組 | 檔案名稱 | 角色定位 |
|---|---|---|
| **編排** | `gem-orchestrator.agent.md` | 多代理工作流協調器（唯一有 `runSubagent` 調用權） |
| **研究** | `gem-researcher.agent.md` | 代碼庫上下文研究員（唯讀） |
| **規劃** | `gem-planner.agent.md` | DAG 計畫生成與任務分解 |
| **實作** | `gem-implementer.agent.md` | TDD 代碼實作（Red / Green / Verify） |
| **測試** | `gem-browser-tester.agent.md` | 瀏覽器自動化測試 & WCAG 無障礙審查 |
| **運維** | `gem-devops.agent.md` | 容器、CI/CD 管道、基礎設施部署 |
| **審查** | `gem-reviewer.agent.md` | OWASP 安全稽核、機密掃描、規格合規 |
| **文件** | `gem-documentation-writer.agent.md` | 技術文件撰寫、架構圖、文件同步 |

---

## 專案特定補充代理

以下為針對本專案（Next.js × Firebase × Vertical Slice Architecture）的領域專屬代理，作為 Gem 艦隊的補充：

| 檔案名稱 | 角色定位 |
|---|---|
| `architect.agent.md` | Next.js App Router & Firebase 平行路由架構師 |
| `api-architect.agent.md` | API 設計、契約、版本與演進策略 |
| `asset-manager.agent.md` | next/image 最佳化 & Lucide 圖示管理員 |
| `context7.agent.md` | 外部框架文件檢索（Next.js、Firebase 等） |
| `data-analyst.agent.md` | Firebase Analytics & Web Vitals 追蹤師 |
| `firebase-security.agent.md` | Firebase Security Rules & Auth 權限專家 |
| `i18n-specialist.agent.md` | 多語言路由 & RTL 布局專家 |
| `performance-expert.agent.md` | Firestore 索引 & Next.js 快取優化師 |
| `product-strategist.agent.md` | 需求精煉 & MVP 定義商業邏輯師 |
| `refine-issue.agent.md` | 細化需求與 Issue 規格 |
| `reliability-expert.agent.md` | 錯誤邊界 & 日誌系統監控官 |
| `seo-meta.agent.md` | generateMetadata & SSR SEO 策略師 |
| `style-designer.agent.md` | Tailwind & Shadcn 風格守門員 |

每個檔案包含輸入格式、可用工具清單（MCP 名稱）、預期輸出與限制，AI 在呼叫前應先閱讀對應檔案。
