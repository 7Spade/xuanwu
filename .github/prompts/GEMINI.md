# 📂 GEMINI.md: AI 指令集與自動化調度索引

本文件定義了本專案中所有 AI Prompt 的職責與自動化工作流，旨在引導 AI 代理人透過 **MCP (Model Context Protocol)** 工具執行高精度的架構治理與代碼開發。

## 🤖 AI 代理人執行原則

1. **工具導向**：所有任務必須優先調用對應的 MCP 工具（見 `mcp.json`）。
2. **層級調度**：優先啟動「總控型」指令，由總控型指令拆解任務給「專才型」指令。
3. **文件為本**：任何決策必須對齊 `docs/` 資料夾下的 10 份核心文件，以 `logic-overview.md` 為最高權威。

---

## 🛠 MCP 工具對應表

AI 在執行指令前應確認以下 MCP 服務已啟動：

* **`sequential-thinking`**: 用於複雜邏輯的多步推演。
* **`software-planning`**: 用於生成實作藍圖與任務清單。
* **`repomix`**: 用於提取全域程式碼上下文。
* **`context7`**: 用於獲取最新技術文檔（Next.js 16, Genkit）。
* **`shadcn`**: 用於管理與安裝 UI 組件。
* **`next-devtools`**: 用於診斷 App Router 與渲染行為。

---

## 📋 指令目錄與功能索引

### 1. 指揮與治理 (Orchestration & Governance)

| 檔案名稱 | 功能描述 | 觸發場景 |
| --- | --- | --- |
| `ai-master-governance-controller.prompt.md` | **系統總控**：負責全局決策、流程調度與規範強制執行。 | 當開始一個全新的大型任務時。 |
| `master-architect.prompt.md` | **架構總綱**：定義技術棧原則與 DDD 宏觀設計藍圖。 | 需要進行系統設計或架構變更時。 |
| `ai-architecture-governance.prompt.md` | **治理基準**：提供 Serverless 與垂直切片的治理原則參考。 | 進行跨模組治理審計時。 |
| `architecture-governance.prompt.md` | **通用的架構審計**：適用於 DDD 與 Serverless 專案的標準規範。 | 審查現有實作是否合規時。 |

### 2. 審計與合規 (Audit & Compliance)

| 檔案名稱 | 功能描述 | 觸發場景 |
| --- | --- | --- |
| `compliance-audit.prompt.md` | **10 份文件合規性檢查**：自動檢查程式碼是否偏離核心文件。 | 提交 PR 前或進行全域審計時。 |
| `ddd-boundary-check.prompt.md` | **DDD 邊界審計**：專門檢查跨聚合寫入與邊界污染。 | 檢查 Bounded Context (BC) 隔離性時。 |
| `boundary-check.prompt.md` | **通用邊界防護**：防止跨模組直接通訊，確保單向依賴。 | 審查 Data Layer 寫入邏輯時。 |
| `architectural-audit-and-design-specialist.prompt.md` | **設計專家診斷**：深度分析實作缺口並提供重構建議。 | 系統出現架構腐化或複雜 Bug 時。 |
| `route-audit-diagnostics.prompt.md` | **路由診斷**：分析 App Router 與 Parallel Routes 的渲染效能。 | 解決 Parallel Routes 狀態不同步時。 |

### 3. 功能實作與迭代 (Implementation & Iteration)

| 檔案名稱 | 功能描述 | 觸發場景 |
| --- | --- | --- |
| `create-vertical-slice.prompt.md` | **功能切片實作**：引導從 UI 到 Infra 的完整功能開發。 | 需要新增功能模組時。 |
| `iterative-alignment-refactor.prompt.md` | **迭代重構**：多次循環掃描並強制修正程式碼以對齊文檔。 | 需要將舊程式碼自動修正至合規時。 |
| `genkit-flow-design.prompt.md` | **AI 邏輯設計**：設計 Genkit Flow 與其輸入輸出 Schema。 | 建立或修改 AI 業務邏輯時。 |
| `next-intl-add-language.prompt.md` | **多國語言擴充**：自動處理 i18n 翻譯與路由配置。 | 需要增加新的語言支援時。 |
| `nextjs-parallel-routes-modern-code.prompt.md` | **現代路由實作**：針對 Next.js 16 路由特性的專門實作指導。 | 實作複雜模態視窗或平行頁面時。 |

### 4. 工具原子封裝 (Atomic Tool Wrappers)

*這些 Prompt 專門負責正確調用 MCP 工具，不包含業務邏輯。*

* `repomix.prompt.md`: 呼叫 repomix 提取上下文。
* `sequential-thinking.prompt.md`: 啟動深度推理鏈。
* `software-planning.prompt.md`: 生成開發藍圖。
* `shadcn.prompt.md`: 元件庫自動化操作。
* `context7.prompt.md`: 外部技術文檔檢索。
* `next-devtools.prompt.md`: 渲染邊界偵測。

### 5. 部署、遺留系統與效能 (Deployment, Legacy & Performance)

| 檔案名稱 | 功能描述 | 觸發場景 |
| --- | --- | --- |
| `cicd-deployment-orchestrator.prompt.md` | **CI/CD 部署總控**：負責部署流水線編排、金絲雀發佈、回滾策略與環境一致性驗證。 | 需要部署、發行或回滾應用時。 |
| `performance-optimization-auditor.prompt.md` | **效能優化審計**：分析效能瓶頸（前端與後端）、生成優化任務與優先級清單，並建議監控指標與基準。 | 出現性能回歸、核心指標惡化或效能審查時。 |
| `legacy-decoupling-specialist.prompt.md` | **遺留系統解耦專家**：設計分階段解耦策略、API 遷移計畫與兼容層，最小化風險與停機時間。 | 需從單體或遺留模組分拆、逐步現代化時。 |
| `ui-ux-consistency-sync.prompt.md` | **UI/UX 一致性同步**：檢查設計系統一致性、元件樣式差異與可用性問題，並自動產生修正 PR 或樣式變更清單。 | 視覺/交互不一致或跨頁面元件行為差異時。 |

### 5. 測試與藍圖生成 (Testing & Generators)

* `playwright-mcp-web-test-and-optimize.prompt.md`: 自動生成 E2E 測試並優化頁面效能。
* `playwright-testing-guide.md`: 提供測試撰寫的最佳實踐準則。
* `technology-stack-blueprint-generator.prompt.md`: 自動產出技術棧對齊報告。
* `code-exemplars-blueprint-generator.prompt.md`: 生成高品質代碼範例以供開發參考。
* `documentation-writer.prompt.md`: 自動根據實作產出相關技術文檔。

---

## 🔄 自動化調度流水線 (Standard Workflow)

當接收到使用者指令時，AI 應遵循以下連鎖反應：

1. **[感知]** 啟動 `tool-repomix` 讀取專案與 `docs/`。
2. **[對齊]** 使用 `compliance-audit` 確認目前任務是否符合 10 份文件規範。
3. **[規劃]** 使用 `software-planning` 產出任務清單，並啟動 `sequential-thinking` 驗證邏輯可行性。
4. **[執行]** 根據任務類型調用 `create-vertical-slice` 或 `genkit-flow-design`。
5. **[校驗]** 執行 `ddd-boundary-check` 確保沒破壞邊界。
6. **[迭代]** 若不合規，自動觸發 `iterative-alignment-refactor` 直至 100% 對齊。

---

**⚠️ 注意：** 嚴禁繞過 `docs/logic-overview.md` 進行任何非標準化修改。所有 UI 異動必須調用 `tool-shadcn`。