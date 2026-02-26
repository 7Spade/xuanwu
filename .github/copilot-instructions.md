# Copilot Instructions for `7Spade/xuanwu`

This repository is onboarding Copilot with a **minimal, architecture-first rule set**.

---

## 🧠 Memory MCP — 強制執行協議（MANDATORY SESSION PROTOCOL）

> ⚠️ **每次 session 開始時必須執行以下步驟，不得跳過。**

### Step 1 — Session Start: Read Knowledge Graph（強制讀取）

Session 開始的**第一個動作**必須是讀取架構知識圖譜（以下為 MCP tool 調用方式）：

```
// 優先使用（在大部分環境下更可靠）
memory.read_graph()

// 備用：針對特定主題搜尋
memory.search_nodes({ query: "Architecture_Governance_Principles" })
memory.open_nodes({ names: ["Logic_Overview_SSOT", "Development_Rules"] })
```

**若 MCP 圖譜為空（0 entities），執行 Cold-Start Recovery：**
1. 讀取 `docs/knowledge-graph.json`
2. 呼叫 `memory.create_entities(entities)` 載入所有實體
3. 呼叫 `memory.create_relations(relations)` 載入所有關係
4. 驗證：再次呼叫 `memory.read_graph()` 確認載入成功

詳細步驟參見 `docs/knowledge-graph-guide.md`。

### Step 2 — During Session: Write Ongoing（邊做邊記）

完成新功能、解決架構問題或做出設計決策後，立即更新圖譜：

```
// 新增實體
memory.create_entities([{
  name: "EntityName",
  entityType: "Architecture_Decision",  // 見下方實體類型
  observations: ["關鍵約束或決策描述"]
}])

// 新增關係
memory.create_relations([{
  from: "EntityA",
  to: "EntityB",
  relationType: "CONSTRAINS"  // 見下方關係類型
}])

// 補充現有實體的觀察
memory.add_observations([{
  entityName: "ExistingEntity",
  contents: ["新增的觀察或決策記錄"]
}])

// 刪除過時資訊
memory.delete_observations([{
  entityName: "EntityName",
  observations: ["需要移除的舊觀察"]
}])
memory.delete_relations([{ from: "A", to: "B", relationType: "FOLLOWS" }])
memory.delete_entities(["ObsoleteEntity"])
```

**合法的實體類型（entityType）：**
- `Framework_Feature` — 框架功能或版本特性
- `Project_Convention` — 專案慣例與工作流程規範
- `Component_Standard` — UI 元件使用標準
- `Data_Schema` — 資料模型、合約或 Schema
- `Architecture_Decision` — 架構決策與治理原則

**合法的關係類型（relationType）：**
- `FOLLOWS` — 遵循某架構原則
- `IMPLEMENTS` — 具體實作某抽象規範
- `CONSTRAINS` — 對另一實體施加約束
- `DEPENDS_ON` — 依賴某實體才能運作
- `REPLACES` — 取代舊版規範

### Step 3 — Session End: Store Persistent Memory（強制儲存）

Session 結束前，將本次 session 的**重要發現、修復或決策**儲存為持久記憶：

```
store_memory({
  subject: "簡短主題（1-2 個詞）",
  fact: "本次 session 確認或修改的關鍵事實（< 200 字元）",
  reason: "為什麼此事實重要，對未來任務有什麼影響（2-3 句話）",
  citations: "src/features/... 或 docs/... 相關來源",
  category: "general" | "file_specific" | "bootstrap_and_build" | "user_preferences"
})
```

**同時更新 `docs/knowledge-graph.json`** 以確保持久化（`docs/knowledge-graph.json` 是知識圖譜的跨-session 持久化存儲；`docs/logic-overview.md` 是架構規則的最高權威文件 — 兩者角色不同，互補而非衝突）。

---

## Core principles
- Follow **Occam's Razor**: prefer the simplest change that fully solves the task.
- Keep code in the repository's **Vertical Slice Architecture (VSA)**.
- Keep changes **small and local**; avoid creating new abstractions unless required.
- **SSOT**: `docs/logic-overview.md` 是本專案唯一最高權威文件，所有衝突以此為準。

## Architecture rules (must follow)
- Top-level structure:
  - `src/app`: Next.js App Router composition only
  - `src/features`: business-domain vertical slices
  - `src/shared`: cross-cutting infrastructure
  - `src/features/shared-kernel`: core domain models and utilities shared across features
- Dependency direction:
  - `app -> features/{slice}/index.ts -> shared`
- Cross-slice access:
  - Import from another slice via its `index.ts` public API only.
  - Do not import private `_` files across slices.

## Parallel routes + Next.js App Router
- The project uses **parallel routes** (for example `@sidebar`, `@modal`, `@header`, `@plugintab`) and route groups.
- Keep layouts thin: compose slots and shared chrome, do not add feature business logic in layout files.
- Preserve current route behavior when editing slot routes or intercepting routes.

## Next.js 16 & Data Mutations
- Prefer **Server Actions** placed in `src/features/{slice}/actions.ts` for data mutations.
- Use React 19 / Next.js 16 hooks like `useActionState` and `useFormStatus` for form handling. Do not use legacy `useFormState`.
- Ensure Server Actions return serializable objects or standard error formats (e.g., `{ success: boolean, error?: string, data?: any }`).

## UI & Styling
- Use Tailwind CSS v4 for styling. Do not write inline CSS or standard CSS modules.
- Use standard components from `src/shared/components/ui/` (shadcn/ui) **exclusively**. Do not add Material-UI, Chakra UI, Ant Design, or any other UI library.
- If shadcn/ui lacks a needed component, first check if a composition of existing shadcn/ui primitives can satisfy the requirement. Only build a custom component as a last resort, and place it in `src/shared/components/` with a comment explaining why shadcn/ui was insufficient.

## Agent Task Workflow & MCP

> All agents and sub-agents must follow the Memory MCP protocol above before any code changes.

- **READ FIRST**: Call `memory.read_graph()` before any code generation or refactoring.
- **Plan first**: Outline the files you will touch before writing code.
- **Context gathering**: If modifying database schemas or API contracts, utilize available MCP tools (e.g., Database MCP or GitHub MCP) to verify the current state first.
- **Test driven**: If modifying a feature, check for existing tests in the slice (e.g., `src/features/{slice}/__tests__`) and update them accordingly.
- **WRITE LAST**: After completing a task, update Memory MCP and `docs/knowledge-graph.json`, then call `store_memory` for key facts.

## Sub-Agent Capabilities

Sub-agents invoked by the primary agent (e.g., via the `Task` tool) **inherit the same Memory MCP protocol**:

1. **Sub-agent session start**: Call `memory.read_graph()` to load architecture context before executing the delegated task.
2. **Sub-agent focus**: Use `memory.search_nodes({ query: "..." })` or `memory.open_nodes({ names: [...] })` to narrow context to the relevant domain entities.
3. **Sub-agent session end**: Call `store_memory` and update `docs/knowledge-graph.json` with any new facts discovered during the sub-task.
4. **Sub-agent SSOT**: `docs/logic-overview.md` is authoritative for all sub-agents — no sub-agent may override or ignore its constraints.
5. **Sub-agent boundary**: Sub-agents must only import from another slice's `index.ts` public API; never from `_private` files.

Available MCP tools for agents and sub-agents:
- `memory.read_graph` / `memory.search_nodes` / `memory.open_nodes` — read
- `memory.create_entities` / `memory.create_relations` / `memory.add_observations` — write
- `memory.delete_entities` / `memory.delete_relations` / `memory.delete_observations` — delete
- `store_memory` — persist important facts across sessions
- `sequential-thinking` — for complex multi-step reasoning
- `software-planning` — for task decomposition and planning
- `context7` — for up-to-date external library/framework documentation

## Working style for Copilot
- Prioritize existing patterns in `src/features/*`, `src/app/*`, `src/shared`, and `src/features/shared-kernel/*`.
- Prefer server-first Next.js patterns and minimal client boundaries (use `"use client"` only at the leaf nodes).
- Validate with existing commands when relevant:
  - `npm run lint`
  - `npm run typecheck`