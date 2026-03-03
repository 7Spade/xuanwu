# Files

## File: .aiexclude
````
# 過濾所有 node_modules 資料夾
node_modules/
**/node_modules/

# 過濾 Firebase Functions 的依賴項
functions/node_modules/

# 過濾建置後的檔案 (Build artifacts)
.next/

# 過濾 Firebase 本地的快取與日誌
.firebase/
firebase-debug.log
firestore-debug.log

# 過濾環境變數敏感檔案
.env
.env.*
````

## File: .idx/airules.md
````markdown
# SYSTEM OVERRIDE: AUTONOMOUS MODE

You are NOT a passive chat assistant. You are an **Autonomous Senior Engineer** operating in Firebase Studio.

## Your Operational Rules
1. **Initialization**: At the start of every session, read this file (`.idx/airules.md`).
2. **Bias for Action**: Do NOT ask "Should I use sequential-thinking?". JUST USE IT.
3. **Command Execution**: When you identify a need for a tool (e.g., `shadcn`), output the command in a terminal block immediately.
4. **Assumed Consent**: I have authorized all tools listed below. Do not request permission again.

---

# Firebase Studio (Xuanwu) AI 開發規範演算法（去重整理版）

# AI Auto-Tool Execution Protocol (IDX Edition)

## SYSTEM IDENTITY
You are an **Autonomous DevOps Agent**. Your goal is speed and precision. You function under a "Zero-Friction" policy.

---

## 1. Zero-Prompt Tool Policy
- **DO NOT ASK** for permission.
- **ASSUME** all CLI commands provided will be executed by the user immediately via the "Run" button.

---

## 2. Trigger-to-Action Mapping

| Context | Virtual Tool | MANDATORY ACTION |
| :--- | :--- | :--- |
| Complex Logic / Refactor | `sequential-thinking` | **Create a Markdown block** named `## 🧠 Thinking Process` and list step-by-step logic BEFORE code. |
| New Feature / Planning | `Software-planning-mcp` | **Generate a Checklist** using `- [ ]` markdown syntax for the implementation plan. |
| Lack of Context | `repomix` | **Output Command**: `npx repomix --style xml --output deps.xml` |
| New UI Component | `shadcn` | **Output Command**: `npx shadcn@latest add [component]` (Do not explain, just give command). |
| Debugging Next.js | `next-devtools` | **Analyze** `package.json` and suggest specific debug scripts. |

---

## 3. Execution Format

When suggesting a tool command, ALWAYS use this format so I can one-click run it:

```bash
# 🤖 Auto-Action: [Tool Name]
[Exact Command Here]
```

---

Remember, the XML structure you generate is the only mechanism for applying changes to the user's code. Therefore, when making changes to a file the `<changes>` block must always be fully present and correctly formatted as follows.

```xml
<changes>
  <description>[Provide a concise summary of the overall changes being made]</description>
  <change>
    <file>[Provide the ABSOLUTE, FULL path to the file being modified]</file>
    <content><![CDATA[
[Provide the ENTIRE, FINAL, intended content of the file here. Do NOT provide diffs or partial snippets. Ensure all code is properly escaped within the CDATA section.]
    ]]></content>
  </change>
</changes>
```

## 1. 核心開發哲學 (The Philosophy)

### 單一職責（SRP）
- Component 僅負責渲染
- Logic Hook 僅負責商業邏輯與狀態控制
- Repository 僅負責資料存取
- Adapter 僅負責 Firebase SDK 封裝與資料轉換
- 一個檔案只做一件事，禁止混合職責

### 嚴格邊界（Strict Boundaries）
- 禁止在 Page 或 Component 中直接調用 Firebase SDK
- 禁止 Component 直接 import Repository
- 禁止跨 Feature 直接互相依賴（必須透過 `features/{name}/index.ts`）
- 禁止在 app/ 目錄中撰寫商業邏輯
- 資料流必須為：
  Component → `_hooks/` → `_actions.ts` / `_queries.ts` → `@/shared/infra/`

### 高內聚 / 低耦合
- 同一功能的 UI / Logic / Types 必須集中在同一 Feature 區域
- Feature 不得洩漏內部實作細節
- UI 不得知道資料來源是 Firebase
- Repository 不得依賴 UI
- Context 不得承載 Feature 級商業邏輯
- 禁止將 Repository 注入 context

### 就近原則（Colocation）
- 僅供特定路由使用的組件必須放在該路徑 `_components/` 下


## 2. 檔案命名與結構規範 (Naming & Structure)

### 命名規範
- 所有檔案與目錄一律使用 kebab-case
- 禁止例外

### VSA 切片內部結構
每個 `features/{name}/` 切片遵循：
- `_components/`：切片私有 UI 組件
- `_hooks/`：切片私有 React Hooks
- `_actions.ts`：`"use server"` 異動操作
- `_queries.ts`：Firestore 讀取 / onSnapshot
- `_types.ts`：切片專屬型別擴充（可選）
- `index.ts`：公開 API（僅導出供其他切片使用的 symbols）

### Next.js App Router 結構邊界
- `app/`：僅存放路由、Layout、Server Components（含 route groups: `(shell)`, `(account)`, `(dashboard)`, `(workspaces)`, `(public)`）
- `app/**/_components/`：僅該路由可用的區域組件
- `shared/infra/`：Firebase 唯一操作層
  - `adapters/`
  - `repositories/`
- `shared/ui/`：shadcn-ui、app-providers、i18n、constants
- `features/{name}/`：垂直功能切片（20 個）


## 3. UI 組件優先準則 (UI Library Whitelist)

### 使用規則
- 構建 UI 時禁止直接使用原生 HTML 標籤（除非必要）
- 必須優先使用：`@/shared/ui/...`
- 若已有現成組件，禁止重寫
- 引用路徑必須使用別名 `@/shared/ui/...`

### Whitelist

基礎：
button, button-group, kbd, badge, spinner

佈局：
card, separator, scroll-area, aspect-ratio, collapsible

導航：
breadcrumb, navigation-menu, pagination, tabs, sidebar

表單 / 輸入：
form, field, label, input, input-group, input-otp, textarea,
checkbox, radio-group, select, switch, slider, calendar

彈窗 / 反饋：
dialog, alert-dialog, drawer, sheet, popover, hover-card,
tooltip, toast, sonner, toaster, alert

數據展示：
table, accordion, avatar, carousel, chart, timeline, empty, item

互動：
dropdown-menu, context-menu, menubar, command, toggle, toggle-group

加載：
skeleton, progress


## 4. 單一職責實作要求

### 超過 100 行的組件
必須拆分為：
- `_components/[name].tsx`（純 View）
- `_hooks/use-[name].ts`（邏輯與狀態）

限制：
- Component 僅接受 props
- 所有事件處理與狀態轉換移至 Logic
- 不得在 render 中做資料轉換

### Firebase 操作規則
- 禁止在 Component 的 useEffect 中直接操作 Firestore
- 必須透過 `@/shared/infra/`（repositories/adapters）
- Repository 必須包裹 try-catch
- 不得回傳 SDK 原始物件
- 必須提供錯誤轉換與安全資料模型


## 5. 代碼質量標準

### TypeScript
- 嚴禁使用 any
- 必須定義 Interface 或 Type
- Domain Types 與 ViewModel 分離

### Server / Client Components
- 預設為 Server Component
- 僅在需要互動時加 `'use client'`
- 優先在 Server Component 中取得資料

Client 僅允許情境：
- 需要 state
- 需要事件處理
- 需要瀏覽器 API

### 錯誤處理
- 所有 Repository 操作必須 try-catch
- 必須透過 use-toast 或統一錯誤處理器回饋用戶


## 6. 資料取得優先順序

1. Server Component → `_queries.ts` → `@/shared/infra/`
2. Client Component → `_hooks/` → `_actions.ts` / `_queries.ts` → `@/shared/infra/`

禁止：
- Client 直接調用 Firebase SDK


## 7. 狀態管理原則

- Local UI 狀態 → useState
- Feature 商業邏輯 → Logic Hook
- 跨頁共享 → context
- 禁止將 Feature 級狀態放入 context


## 8. 效能與可維護性

- 優先使用 Server Rendering
- 大型資料列表必須使用 pagination
- 使用 Suspense + Skeleton
- 不得在 render 中建立不必要函數
- 必要時使用 useCallback


## 9. 明確禁止事項

- 在 Component 中直接調用 Firebase
- 在 Page 中撰寫商業邏輯
- 跨 Feature import
- 使用 any
- 混合 UI 與資料轉換
- 在 useEffect 內撰寫資料層邏輯
- 跳過 Types 設計與 Repository 設計階段


## 10. 上下文讀取命令 (Context Commands)

- 開發新功能前必須先讀取該目錄下 GEMINI.md
- 若涉及 UI 修改，先檢查 `@/shared/ui` 是否已有可用組件
- 不得跳過 Types 與 Repository 設計
````

## File: .idx/dev.nix
````nix
{ pkgs }: {
  # 使用穩定版本頻道
  channel = "stable-24.11";

  # 安裝必要的軟體包
  packages = [
    pkgs.nodejs_20
    pkgs.zulu
    pkgs.git       # 版本控制
    pkgs.tree      # 用於產生地圖
  ];

  # 環境變數設定
  env = {
    # 設定全域 npm 路徑，避免權限問題
    NPM_CONFIG_PREFIX = "/home/user/.npm-global";
  };

  # Firebase 模擬器配置
  services.firebase.emulators = {
    detect = false;
    projectId = "demo-app";
    services = ["auth" "firestore"];
  };

  idx = {
    # VS Code 擴充套件
    extensions = [
      "esbenp.prettier-vscode"
      "dsznajder.es7-react-js-snippets"
    ];

    workspace = {
      # 僅在環境首次建立時執行
      onCreate = {
        setup-tools = ''
          # 1. 建立並配置 npm 全域目錄
          mkdir -p /home/user/.npm-global

          # 2. 開啟 Firebase 相關實驗性功能
          firebase experiments:enable webframeworks --force
          
          # 3. 安裝全域工具與 MCP 伺服器
          # 預先下載 Software-planning-mcp
          npx -y github:NightTrek/Software-planning-mcp --help
          
          # 安裝其他常規工具
          npm install -g shadcn@latest repomix @modelcontextprotocol/server-sequential-thinking next-devtools-mcp@latest @upstash/context7-mcp
          
          # 4. 安裝專案本地依賴
          npm install
        '';
        
        # 預設開啟的檔案
        default.openFiles = [
          "src/app/page.tsx"
        ];
      };

      # 每次環境啟動時執行
      onStart = {
        initialize = ''
          # 每次啟動時產生地圖檔案供 AI 參考，排除不必要的目錄
          tree -I 'node_modules|.git|.next|.firebase|.npm-global' > PROJECT_STRUCTURE.md
        '';
      };
    };

    # 預覽設定
    previews = {
      enable = true;
      previews = {
        web = {
          command = ["npm" "run" "dev" "--" "--port" "$PORT" "--hostname" "0.0.0.0"];
          manager = "web";
        };
      };
    };
  };
}
````

## File: .idx/integrations.json
````json
{
  "firebase_hosting": {}
}
````

## File: .idx/mcp.json
````json
{
  "mcpServers": {
    "sequential-thinking": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-sequential-thinking"
      ]
    },
    "software-planning": {
      "command": "npx",
      "args": [
        "-y",
        "github:NightTrek/Software-planning-mcp"
      ]
    },
    "repomix": {
      "command": "npx",
      "args": [
        "-y",
        "repomix",
        "--mcp"
      ]
    },
    "shadcn": {
      "command": "npx",
      "args": [
        "-y",
        "shadcn@latest",
        "mcp"
      ]
    },
    "next-devtools": {
      "command": "npx",
      "args": [
        "-y",
        "next-devtools-mcp@latest"
      ]
    },
    "context7": {
      "command": "npx",
      "args": [
        "-y",
        "@upstash/context7-mcp"
      ]
    }
  }
}
````

## File: .modified
````

````

## File: AGENTS.md
````markdown
# Agent Setup Instructions

This file is read by AI coding agents (GitHub Copilot Coding Agent, Codex, etc.) at the
start of every session. Follow these steps **before** running any validation commands.

## Environment Bootstrap (MANDATORY — run once per session)

```bash
npm install
```

> **Why this is required**: The sandbox starts without `node_modules`. Running
> `npm run lint` or `npm run typecheck` without installing dependencies produces
> thousands of false-positive "Cannot find module" errors that make quality reports
> completely untrustworthy. Always install first.

## Validation Commands

Run these **only after** `npm install` has completed successfully:

| Command | What it checks | Trustworthy only if |
|---------|---------------|---------------------|
| `npm run lint` | ESLint architecture rules (D1–D25) | `node_modules/.bin/eslint` exists |
| `npm run typecheck` | TypeScript types | `node_modules/.bin/tsc` exists |
| `npm run check` | Both in one pass | `node_modules` installed |

## Interpreting Results

- **`npm run lint`** — zero errors (warnings about existing D24 SDK calls are expected and tracked — see below)
- **`npm run typecheck`** — zero errors
- If you see `Cannot find module 'react'` or similar: **deps are not installed**, output is noise, do not report these as code errors

## Dev Server

```bash
npm run dev   # starts on http://localhost:9002
```

## Known Baseline (after `npm install`)

| Check | Expected result |
|-------|----------------|
| `npm run lint` | 0 errors, ~1390 warnings |
| `npm run typecheck` | 67 errors — ALL in `firebase/functions/` (separate sub-package, not the Next.js app) |

> `firebase/functions/` has its own `package.json`. Its 67 TypeScript errors require
> `npm install --prefix firebase/functions` and are unrelated to the Next.js application.
> Do NOT report them as app errors.

## Known D24 Architectural Debt (Tracked Warnings)

The `~1390 lint warnings` include **43 D24 warnings** — direct `firebase/firestore` imports in feature slices.
These are **tracked migration targets**, not regressions. Per `docs/logic-overview.md` [D24]:

> Feature slices must not import `firebase/*` directly. All SDK calls must go through `FIREBASE_ACL`
> adapters at `src/shared/infra/{auth,firestore,messaging,storage}/`, accessed via `SK_PORTS` interfaces.

Current D24 violation files (43 total):
- `src/features/account.slice/` — gov.policy, gov.role, user.profile, user.wallet (4 files)
- `src/features/identity.slice/` — `_token-refresh-listener.ts` (1 file)
- `src/features/notification.slice/` — user.notification delivery + queries (2 files)
- `src/features/organization.slice/` — core, gov.members, gov.partners, gov.policy, gov.teams (5 files)
- `src/features/projection.bus/` — account-audit, account-view, org-eligible-member-view, organization-view, tag-snapshot, workspace-scope-guard, workspace-view (9 files)
- `src/features/scheduling.slice/` — aggregate, components, hooks, projectors, queries (9 files)
- `src/features/skill-xp.slice/` — projector, queries, tag-lifecycle (3 files)
- `src/features/workspace.slice/` — business.daily, business.document-parser, business.files, business.workflow, core, gov.audit (10 files)

**Any new code must NOT add to this list.** D24 migration requires a dedicated PR.

## Workflow for Architecture Alignment

Before making changes, always follow the GEMINI.md workflow:

1. **`.github/prompts/GEMINI.md`** — master agent orchestration index
2. **`compliance-audit.prompt.md`** — run before PR to verify docs alignment
3. **`iterative-alignment-refactor.prompt.md`** — for fixing D-rule violations

## Key Files

- `docs/logic-overview.md` — **SSOT** architecture rules (D1–D25, invariants #1–#19)
- `eslint.config.mts` — enforces D1–D25 as ESLint rules
- `.github/copilot-instructions.md` — agent workflow instructions
- `.github/prompts/GEMINI.md` — AI prompt orchestration index
````

## File: components.json
````json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/shared/lib/utils",
    "ui": "@/shared/shadcn-ui",
    "lib": "@/shared/lib",
    "hooks": "@/shared/hooks"
  },
  "iconLibrary": "lucide"
}
````

## File: eslint.config.mts
````typescript
import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import tseslint from "typescript-eslint";
import tailwind from "eslint-plugin-tailwindcss";
import importPlugin from "eslint-plugin-import";
import checkFile from "eslint-plugin-check-file";
import jsxA11y from "eslint-plugin-jsx-a11y";
⋮----
// 關鍵修正：將 'basePath' 改為 'baseDirectory'
⋮----
// 忽略特定目錄
⋮----
// 1. 以 Next.js 為核心的配置 (相容舊版格式)
⋮----
// 2. 擴展功能插件
⋮----
// --- Tailwind 優化 ---
⋮----
// --- 自動排序 Import ---
⋮----
// --- 未使用變數 ---
⋮----
// --- 檔案命名規範 ---
// 允許 kebab-case 及 _ 前綴（架構慣例 _actions.ts / _gateway.ts / _funnel.ts）
// ignoreMiddleExtensions: true 使 tailwind.config.ts 只驗證最外層名稱 tailwind
⋮----
// --- 資料夾命名規範 ---
// 允許 kebab-case、dot-notation（account.slice / infra.dlq-manager）及 _ 前綴
// 不套用至 src/app/**（Next.js App Router 保留語法：(group)、@slot、[param]、(.)intercept）
⋮----
// [D24] FIREBASE_ACL 邊界：features 切片禁止直接引用 firebase/* SDK
// Scoped only to src/features/** — the shared/infra adapters are the ACL boundary themselves.
````

## File: next.config.ts
````typescript
import type {NextConfig} from 'next';
⋮----
/* config options here */
````

## File: package.json
````json
{
  "name": "nextn",
  "version": "0.1.0",
  "description": "x",
  "author": "7s.i@pm.me",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/7Spade/Ac-Xuanwu.git"
  },
  "bugs": {
    "url": "https://github.com/7Spade/Ac-Xuanwu/issues"
  },
  "homepage": "https://Ac-Xuanwu.com",
  "license": "MIT",
  "private": true,
  "engines": {
    "node": "22"
  },
  "scripts": {
    "dev": "next dev --turbopack -p 9002",
    "genkit:dev": "genkit start -- tsx src/ai/dev.ts",
    "genkit:watch": "genkit start -- tsx --watch src/ai/dev.ts",
    "build": "next build",
    "start": "next start",
    "lint": "eslint --cache --cache-location .eslintcache --config eslint.config.mts .",
    "lint:fix": "npm run lint -- --fix",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "check": "npm install && npm run lint && npm run typecheck",
    "deploy:functions": "firebase deploy --only functions --config ./src/shared-infra/firebase/firebase.json",
    "deploy:indexes": "firebase deploy --only firestore:indexes --config ./src/shared-infra/firebase/firebase.json",
    "deploy:firestore-rules": "firebase deploy --only firestore:rules --config ./src/shared-infra/firebase/firebase.json",
    "deploy:storage-rules": "firebase deploy --only storage --config ./src/shared-infra/firebase/firebase.json"
  },
  "dependencies": {
    "@dnd-kit/core": "^6.3.1",
    "@dnd-kit/sortable": "^10.0.0",
    "@genkit-ai/google-genai": "^1.20.0",
    "@genkit-ai/next": "^1.20.0",
    "@hookform/resolvers": "^4.1.3",
    "@radix-ui/react-accordion": "^1.2.12",
    "@radix-ui/react-alert-dialog": "^1.1.15",
    "@radix-ui/react-aspect-ratio": "^1.1.8",
    "@radix-ui/react-avatar": "^1.1.11",
    "@radix-ui/react-checkbox": "^1.3.3",
    "@radix-ui/react-collapsible": "^1.1.12",
    "@radix-ui/react-context-menu": "^2.2.16",
    "@radix-ui/react-dialog": "^1.1.15",
    "@radix-ui/react-dropdown-menu": "^2.1.16",
    "@radix-ui/react-hover-card": "^1.1.15",
    "@radix-ui/react-label": "^2.1.8",
    "@radix-ui/react-menubar": "^1.1.16",
    "@radix-ui/react-navigation-menu": "^1.2.14",
    "@radix-ui/react-popover": "^1.1.15",
    "@radix-ui/react-progress": "^1.1.8",
    "@radix-ui/react-radio-group": "^1.3.8",
    "@radix-ui/react-scroll-area": "^1.2.10",
    "@radix-ui/react-select": "^2.2.6",
    "@radix-ui/react-separator": "^1.1.8",
    "@radix-ui/react-slider": "^1.3.6",
    "@radix-ui/react-slot": "^1.2.4",
    "@radix-ui/react-switch": "^1.2.6",
    "@radix-ui/react-tabs": "^1.1.13",
    "@radix-ui/react-toast": "^1.2.15",
    "@radix-ui/react-toggle": "^1.1.10",
    "@radix-ui/react-toggle-group": "^1.1.11",
    "@radix-ui/react-tooltip": "^1.2.8",
    "@tanstack/react-table": "^8.21.3",
    "@xstate/react": "^6.1.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "cmdk": "^1.1.1",
    "date-fns": "^3.6.0",
    "dotenv": "^16.5.0",
    "embla-carousel-react": "^8.6.0",
    "eslint-plugin-tailwindcss": "^3.18.2",
    "eslint-plugin-xstate": "^3.2.1",
    "firebase": "^11.9.1",
    "genkit": "^1.20.0",
    "input-otp": "^1.4.2",
    "lucide-react": "^0.475.0",
    "next": "^15.5.12",
    "next-themes": "^0.4.6",
    "patch-package": "^8.0.0",
    "react": "^19.2.1",
    "react-day-picker": "^9.13.2",
    "react-dom": "^19.2.1",
    "react-hook-form": "^7.71.2",
    "react-resizable-panels": "^4.6.2",
    "recharts": "^2.15.4",
    "sonner": "^2.0.7",
    "tailwind-merge": "^3.5.0",
    "tailwindcss-animate": "^1.0.7",
    "vaul": "^1.1.2",
    "xstate": "^5.28.0",
    "zod": "^3.25.76",
    "zustand": "^5.0.3"
  },
  "devDependencies": {
    "@eslint/js": "^9.17.0",
    "@types/eslint-plugin-jsx-a11y": "^6.10.1",
    "@types/eslint-plugin-tailwindcss": "^3.17.0",
    "@types/node": "^20.17.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "eslint": "^9.17.0",
    "eslint-config-google": "^0.14.0",
    "eslint-config-next": "^15.5.12",
    "eslint-plugin-check-file": "^3.3.1",
    "eslint-plugin-import": "^2.31.0",
    "eslint-plugin-jsx-a11y": "^6.10.2",
    "eslint-plugin-react": "^7.37.2",
    "eslint-plugin-react-hooks": "^5.0.0",
    "genkit-cli": "^1.20.0",
    "globals": "^15.14.0",
    "jiti": "^2.6.1",
    "postcss": "^8.4.49",
    "prettier": "^3.4.2",
    "prettier-plugin-tailwindcss": "^0.6.11",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.7.3",
    "typescript-eslint": "^8.56.1",
    "vitest": "^4.0.18"
  },
  "overrides": {
    "eslint": "^9.17.0",
    "@typescript-eslint/eslint-plugin": "^8.56.1",
    "@typescript-eslint/parser": "^8.56.1"
  }
}
````

## File: postcss.config.mjs
````javascript
/** @type {import('postcss-load-config').Config} */
````

## File: public/localized-files/en.json
````json
{
  "common": {
    "appName": "OrgVerse",
    "appTitle": "OrgVerse | Modern Workspace Platform",
    "appDescription": "From Individual Productivity to Organizational Collaboration",
    "greeting": "Dashboard",
    "loading": "Loading...",
    "error": "Error",
    "success": "Success",
    "cancel": "Cancel",
    "confirm": "Confirm",
    "save": "Save",
    "delete": "Delete",
    "edit": "Edit",
    "close": "Close",
    "creating": "Creating...",
    "unknownError": "An unknown error occurred.",
    "enterOrgVerse": "Get Started",
    "visible": "Visible",
    "hidden": "Hidden",
    "filter": "Filter",
    "confirmCreation": "Confirm Creation"
  },
  "auth": {
    "login": "Login",
    "register": "Register",
    "logout": "Logout",
    "disconnect": "Disconnect",
    "email": "Email",
    "password": "Password",
    "displayName": "Display Name",
    "nickname": "Nickname",
    "forgotPassword": "Forgot Password?",
    "resetPassword": "Reset Password",
    "sendEmail": "Send Email",
    "enterDimension": "Sign In",
    "registerSovereignty": "Sign Up",
    "guestAccess": "Guest Access",
    "contactEndpoint": "Contact",
    "securityKey": "Password",
    "setSecurityKey": "Set Password",
    "digitalDesignation": "Display Name",
    "identityResonanceSuccessful": "Login successful",
    "authenticationFailed": "Authentication Failed",
    "resetProtocolSent": "Reset email sent",
    "resetFailed": "Reset Failed",
    "pleaseSetDisplayName": "Please set a display name",
    "dimensionSecurityProtocol": "Terms of Service",
    "byLoggingIn": "By logging in, you agree to the"
  },
  "sidebar": {
    "switchAccountContext": "Switch Account",
    "selectAccount": "Select Account",
    "createNewDimension": "Create Organization",
    "dimensionCore": "Organization",
    "accountGovernance": "Account Management",
    "quickAccess": "Quick Access",
    "userSettings": "User Settings",
    "owner": "Owner",
    "guest": "Guest"
  },
  "navigation": {
    "dashboard": "Dashboard",
    "settings": "Settings",
    "profile": "Profile",
    "account": "Account",
    "workspaces": "Workspaces",
    "teams": "Teams",
    "internalTeams": "Internal Teams",
    "partnerTeams": "Partner Teams",
    "partners": "Partners",
    "members": "Members",
    "permissions": "Permissions",
    "matrix": "Matrix",
    "schedule": "Schedule",
    "daily": "Daily",
    "audit": "Audit",
    "orgSchedule": "HR Schedule",
    "demandBoard": "Demand Board",
    "skills": "Skills"
  },
  "dimension": {
    "createTitle": "Create Organization",
    "createDescription": "Create a new organization to manage workspaces and team members.",
    "dimensionName": "Organization Name",
    "dimensionNamePlaceholder": "e.g., Acme Corporation",
    "createDimension": "Create Organization",
    "newDimensionCreated": "Organization created",
    "failedToCreate": "Failed to create organization"
  },
  "workspaces": {
    "title": "Workspaces",
    "description": "Manage independent workspaces within \"{name}\".",
    "createSpace": "Create Workspace",
    "createLogicalSpace": "Create Workspace",
    "createDescription": "Create a new workspace within \"{name}\".",
    "spaceName": "Workspace Name",
    "spaceNamePlaceholder": "e.g., Marketing Campaign",
    "searchPlaceholder": "Search workspaces...",
    "accessProtocol": "Access Policy",
    "defaultProtocol": "Default Policy",
    "lifecycleState": "Status",
    "spaceVoid": "No Workspaces",
    "noSpacesFound": "No workspaces match your search criteria.",
    "createInitialSpace": "Create Your First Workspace",
    "creationFailed": "Creation Failed",
    "accountNotFound": "Account not found or workspace name is empty.",
    "logicalSpaceCreated": "Workspace Created",
    "spaceSynchronized": "{name} has been created.",
    "failedToCreateSpace": "Failed to create workspace",
    "standard": "Standard"
  },
  "settings": {
    "title": "Settings",
    "identityParameters": "Profile Settings",
    "identityParametersUpdated": "Profile Updated",
    "identityParametersDescription": "Your profile has been updated successfully.",
    "displayName": "Display Name",
    "displayNamePlaceholder": "Your Name",
    "email": "Email Address",
    "emailReadonly": "Email address cannot be changed",
    "saveChanges": "Save Changes",
    "dangerZone": "Danger Zone",
    "identityWithdrawal": "Delete Account",
    "withdrawalDescription": "Permanently delete your account and all associated data",
    "withdraw": "Delete Account",
    "confirmWithdrawal": "Are you sure you want to delete your account? This will permanently remove all your data.",
    "identityDeregistered": "Account Deleted",
    "identityDeregisteredDescription": "Your account has been permanently deleted.",
    "dimensionSettings": "Organization Settings",
    "dimensionName": "Organization Name",
    "dimensionDescription": "Description",
    "dimensionDescriptionPlaceholder": "Optional description",
    "dimensionSovereigntyUpdated": "Organization Updated",
    "dimensionSovereigntyDescription": "Organization settings have been saved.",
    "failedToSaveSettings": "Failed to save settings",
    "themeCalibration": "Theme Settings",
    "recalibrate": "Apply Theme",
    "recalibratingColorResonance": "Applying Theme",
    "recalculatingUIColors": "Updating colors...",
    "failedToRecalibrate": "Failed to apply theme",
    "destroyDimension": "Delete Organization",
    "destroyDimensionDescription": "Permanently delete this organization and all data",
    "destroy": "Delete",
    "confirmDestroy": "Are you sure you want to delete \"{name}\"? This action cannot be undone.",
    "dimensionDestroyed": "Organization Deleted",
    "failedToDestroyDimension": "Failed to delete organization",
    "personalDimensionDescription": "This is your personal workspace. Projects created here are owned by you.",
    "dimensionManagementDescription": "Manage organization settings and member access."
  },
  "dashboard": {
    "welcome": "Welcome to Dashboard",
    "roleOwner": "Owner",
    "roleOwnerDescription": "Full administrative access and deletion rights.",
    "roleAdmin": "Admin",
    "roleAdminDescription": "Manage members, teams, and resource allocation.",
    "roleMember": "Member",
    "roleMemberDescription": "Full read and write access to assigned workspaces.",
    "roleGuest": "Guest",
    "roleGuestDescription": "Limited read-only access."
  },
  "workspace": {
    "capabilities": "Features",
    "tasks": "Tasks",
    "acceptance": "Acceptance",
    "finance": "Finance",
    "issues": "Issues",
    "files": "Files",
    "quality-assurance": "QA",
    "documentParser": "Document Parser"
  },
  "account": {
    "governanceNotAvailable": "Team Management Not Available",
    "governanceNotAvailableDescription": "Member and team management is only available within an organization.",
    "membersTitle": "Members",
    "membersDescription": "Manage all members of {name}.",
    "recruitNewMember": "Add Member",
    "identityResonanceActivated": "Member Added",
    "identityResonanceDescription": "New member has been added successfully.",
    "failedToRecruitMember": "Failed to add member",
    "identityDeregistered": "Member Removed",
    "memberRemoved": "{name} has been removed.",
    "failedToDismissMember": "Failed to remove member",
    "contact": "Contact",
    "teamsTitle": "Internal Teams",
    "teamsDescription": "Manage teams of organization members.",
    "createInternalTeam": "Create Team",
    "internalTeamCreated": "Team created",
    "failedToCreateTeam": "Failed to create team",
    "manageMembers": "Manage Members",
    "createNewTeam": "Create Team",
    "teamName": "Team Name",
    "teamNamePlaceholder": "e.g., Engineering Team",
    "members": "Members",
    "partnersTitle": "Partner Teams",
    "partnersDescription": "Manage external partner teams and collaborations.",
    "createPartnerTeam": "Create Partner Team",
    "partnerTeamCreated": "Partner team created",
    "resonatingPartners": "Active Partners",
    "manageAndRecruit": "Manage & Invite",
    "createCollaborationBoundary": "Create Partnership",
    "createPartnerTeamTitle": "Create Partner Team",
    "createPartnerTeamDescription": "Create a team for external partners and collaborators.",
    "partnerTeamNamePlaceholder": "e.g., Design Consultants",
    "matrixTitle": "Permission Matrix",
    "matrixDescription": "View and manage access permissions across all resources.",
    "scheduleTitle": "Schedule",
    "scheduleDescription": "Plan and coordinate project timelines.",
    "dailyTitle": "Daily Activity",
    "dailyDescription": "Monitor day-to-day activities and updates.",
    "auditTitle": "Audit Log",
    "auditDescription": "Review all changes and access history."
  },
  "tasks": {
    "title": "Tasks",
    "description": "Manage project tasks and workflows.",
    "addRootTask": "Add Task",
    "addSubtask": "Add Subtask",
    "progressReport": "Update Progress",
    "submitProgress": "Submit Progress",
    "currentProgress": "Current Progress",
    "submittingQuantity": "Update Quantity",
    "reportProgressTitle": "Update Progress for \"{name}\"",
    "invalidQuantity": "Invalid quantity",
    "quantityExceedsTotal": "Quantity exceeds total",
    "progressUpdated": "Progress Updated",
    "failedToUpdateProgress": "Failed to update progress",
    "taskName": "Task Name",
    "taskNamePlaceholder": "Enter task name",
    "quantity": "Quantity",
    "budget": "Budget",
    "assignee": "Assignee",
    "status": "Status",
    "priority": "Priority",
    "toDo": "To-Do",
    "inProgress": "In Progress",
    "completed": "Completed",
    "low": "Low",
    "medium": "Medium",
    "high": "High",
    "delete": "Delete",
    "taskCreated": "Task created",
    "failedToCreateTask": "Failed to create task",
    "taskUpdated": "Task updated",
    "failedToUpdateTask": "Failed to update task",
    "taskDeleted": "Task deleted",
    "failedToDeleteTask": "Failed to delete task",
    "uploadImages": "Upload Images",
    "newImage": "NEW",
    "fileTooLarge": "File too large. Max size 5MB.",
    "taskDetails": "Task Details",
    "attachments": "Attachments",
    "importTasks": "Import Tasks"
  },
  "toast": {
    "qaApproved": "QA Approved",
    "taskAccepted": "Task Accepted",
    "qaRejectedIssueLogged": "QA Rejected - Issue Created",
    "acceptanceFailedIssueLogged": "Acceptance Failed - Issue Created",
    "importingItems": "Importing items...",
    "pleaseWait": "Please wait.",
    "importSuccessful": "Import Successful",
    "itemsAdded": "{count} tasks added.",
    "importFailed": "Import Failed",
    "foundItems": "Found {count} items from \"{source}\".",
    "issueSubmitted": "Issue created",
    "failedToAddIssue": "Failed to create issue",
    "commentPosted": "Comment posted",
    "failedToPostComment": "Failed to post comment",
    "taskAcceptedDescription": "{name} has been accepted.",
    "acceptanceFailed": "Acceptance Failed",
    "acceptanceFailedDescription": "{name} has been reverted and a high-priority issue has been created.",
    "failedToUpdateTask": "Failed to update task",
    "qaPassed": "QA Passed",
    "qaPassedDescription": "{name} is ready for final acceptance.",
    "failedToApproveQA": "Failed to approve QA",
    "taskRejected": "Task Rejected",
    "taskRejectedDescription": "{name} has been rejected and an issue has been created.",
    "failedToRejectQA": "Failed to reject QA",
    "invalidQuantity": "Invalid quantity",
    "quantityExceedsTotal": "Quantity exceeds total",
    "budgetOverflow": "Budget Exceeded",
    "budgetOverflowDescription": "Sum of subtasks cannot exceed the budget of \"{name}\".",
    "budgetConflict": "Budget Conflict"
  }
}
````

## File: public/localized-files/zh-TW.json
````json
{
  "common": {
    "appName": "組織宇宙",
    "appTitle": "組織宇宙 | 現代工作空間平台",
    "appDescription": "從個人生產力到組織協作",
    "greeting": "儀表板",
    "loading": "載入中...",
    "error": "錯誤",
    "success": "成功",
    "cancel": "取消",
    "confirm": "確認",
    "save": "儲存",
    "delete": "刪除",
    "edit": "編輯",
    "close": "關閉",
    "creating": "建立中...",
    "unknownError": "發生未知錯誤。",
    "enterOrgVerse": "開始使用",
    "visible": "可見",
    "hidden": "隱藏",
    "filter": "篩選",
    "confirmCreation": "確認建立"
  },
  "auth": {
    "login": "登入",
    "register": "註冊",
    "logout": "登出",
    "disconnect": "中斷連接",
    "email": "電子郵件",
    "password": "密碼",
    "displayName": "顯示名稱",
    "nickname": "暱稱",
    "forgotPassword": "忘記密碼？",
    "resetPassword": "重置密碼",
    "sendEmail": "發送郵件",
    "enterDimension": "登入",
    "registerSovereignty": "註冊",
    "guestAccess": "訪客存取",
    "contactEndpoint": "聯絡方式",
    "securityKey": "密碼",
    "setSecurityKey": "設定密碼",
    "digitalDesignation": "顯示名稱",
    "identityResonanceSuccessful": "登入成功",
    "authenticationFailed": "驗證失敗",
    "resetProtocolSent": "重置郵件已發送",
    "resetFailed": "重置失敗",
    "pleaseSetDisplayName": "請設定顯示名稱",
    "dimensionSecurityProtocol": "服務條款",
    "byLoggingIn": "登入即表示您同意"
  },
  "sidebar": {
    "switchAccountContext": "切換帳戶",
    "selectAccount": "選擇帳戶",
    "createNewDimension": "建立組織",
    "dimensionCore": "組織",
    "accountGovernance": "帳戶管理",
    "quickAccess": "快速存取",
    "userSettings": "使用者設定",
    "owner": "擁有者",
    "guest": "訪客"
  },
  "navigation": {
    "dashboard": "儀表板",
    "settings": "設定",
    "profile": "個人檔案",
    "account": "帳戶",
    "workspaces": "工作空間",
    "teams": "團隊",
    "internalTeams": "內部團隊",
    "partnerTeams": "合作夥伴",
    "partners": "合作夥伴",
    "members": "成員",
    "permissions": "權限",
    "matrix": "矩陣",
    "schedule": "排程",
    "daily": "每日",
    "audit": "稽核",
    "orgSchedule": "HR 排程治理",
    "demandBoard": "需求看板",
    "skills": "個人技能"
  },
  "dimension": {
    "createTitle": "建立組織",
    "createDescription": "建立新的組織來管理工作空間和團隊成員。",
    "dimensionName": "組織名稱",
    "dimensionNamePlaceholder": "例如：企業集團",
    "createDimension": "建立組織",
    "newDimensionCreated": "組織已建立",
    "failedToCreate": "建立組織失敗"
  },
  "workspaces": {
    "title": "工作空間",
    "description": "管理「{name}」中的獨立工作空間。",
    "createSpace": "建立工作空間",
    "createLogicalSpace": "建立工作空間",
    "createDescription": "在「{name}」中建立新的工作空間。",
    "spaceName": "工作空間名稱",
    "spaceNamePlaceholder": "例如：行銷專案",
    "searchPlaceholder": "搜尋工作空間...",
    "accessProtocol": "存取政策",
    "defaultProtocol": "預設政策",
    "lifecycleState": "狀態",
    "spaceVoid": "無工作空間",
    "noSpacesFound": "沒有符合搜尋條件的工作空間。",
    "createInitialSpace": "建立您的第一個工作空間",
    "creationFailed": "建立失敗",
    "accountNotFound": "找不到帳戶或工作空間名稱為空。",
    "logicalSpaceCreated": "工作空間已建立",
    "spaceSynchronized": "{name} 已建立。",
    "failedToCreateSpace": "建立工作空間失敗",
    "standard": "標準"
  },
  "settings": {
    "title": "設定",
    "identityParameters": "個人資料設定",
    "identityParametersUpdated": "個人資料已更新",
    "identityParametersDescription": "您的個人資料已成功更新。",
    "displayName": "顯示名稱",
    "displayNamePlaceholder": "您的名稱",
    "email": "電子郵件地址",
    "emailReadonly": "無法變更電子郵件地址",
    "saveChanges": "儲存變更",
    "dangerZone": "危險區域",
    "identityWithdrawal": "刪除帳戶",
    "withdrawalDescription": "永久刪除您的帳戶及所有相關資料",
    "withdraw": "刪除帳戶",
    "confirmWithdrawal": "您確定要刪除您的帳戶嗎？這將永久移除您的所有資料。",
    "identityDeregistered": "帳戶已刪除",
    "identityDeregisteredDescription": "您的帳戶已永久刪除。",
    "dimensionSettings": "組織設定",
    "dimensionName": "組織名稱",
    "dimensionDescription": "描述",
    "dimensionDescriptionPlaceholder": "選填描述",
    "dimensionSovereigntyUpdated": "組織已更新",
    "dimensionSovereigntyDescription": "組織設定已儲存。",
    "failedToSaveSettings": "儲存設定失敗",
    "themeCalibration": "主題設定",
    "recalibrate": "套用主題",
    "recalibratingColorResonance": "套用主題中",
    "recalculatingUIColors": "更新顏色中...",
    "failedToRecalibrate": "套用主題失敗",
    "destroyDimension": "刪除組織",
    "destroyDimensionDescription": "永久刪除此組織及所有資料",
    "destroy": "刪除",
    "confirmDestroy": "您確定要刪除「{name}」嗎？此操作無法復原。",
    "dimensionDestroyed": "組織已刪除",
    "failedToDestroyDimension": "刪除組織失敗",
    "personalDimensionDescription": "這是您的個人工作空間。在此建立的專案由您擁有。",
    "dimensionManagementDescription": "管理組織設定和成員存取權限。"
  },
  "dashboard": {
    "welcome": "歡迎使用儀表板",
    "roleOwner": "擁有者",
    "roleOwnerDescription": "完整管理權限及刪除權限。",
    "roleAdmin": "管理員",
    "roleAdminDescription": "管理成員、團隊及資源分配。",
    "roleMember": "成員",
    "roleMemberDescription": "對指派的工作空間具有完整讀寫權限。",
    "roleGuest": "訪客",
    "roleGuestDescription": "受限的唯讀存取權限。"
  },
  "workspace": {
    "capabilities": "功能",
    "tasks": "任務",
    "acceptance": "驗收",
    "finance": "財務",
    "issues": "問題",
    "files": "檔案",
    "quality-assurance": "品質保證",
    "documentParser": "文件解析器"
  },
  "account": {
    "governanceNotAvailable": "團隊管理無法使用",
    "governanceNotAvailableDescription": "成員和團隊管理僅在組織內可用。",
    "membersTitle": "成員",
    "membersDescription": "管理 {name} 的所有成員。",
    "recruitNewMember": "新增成員",
    "identityResonanceActivated": "成員已新增",
    "identityResonanceDescription": "新成員已成功新增。",
    "failedToRecruitMember": "新增成員失敗",
    "identityDeregistered": "成員已移除",
    "memberRemoved": "{name} 已移除。",
    "failedToDismissMember": "移除成員失敗",
    "contact": "聯絡",
    "teamsTitle": "內部團隊",
    "teamsDescription": "管理組織成員的團隊。",
    "createInternalTeam": "建立團隊",
    "internalTeamCreated": "團隊已建立",
    "failedToCreateTeam": "建立團隊失敗",
    "manageMembers": "管理成員",
    "createNewTeam": "建立團隊",
    "teamName": "團隊名稱",
    "teamNamePlaceholder": "例如：工程團隊",
    "members": "成員",
    "partnersTitle": "合作夥伴",
    "partnersDescription": "管理合作夥伴及協作。",
    "createPartnerTeam": "建立合作夥伴",
    "partnerTeamCreated": "合作夥伴已建立",
    "resonatingPartners": "活躍合作夥伴",
    "manageAndRecruit": "管理與邀請",
    "createCollaborationBoundary": "建立合作關係",
    "createPartnerTeamTitle": "建立合作夥伴",
    "createPartnerTeamDescription": "為外部合作夥伴和協作者建立團隊。",
    "partnerTeamNamePlaceholder": "例如：設計顧問",
    "matrixTitle": "權限矩陣",
    "matrixDescription": "查看和管理所有資源的存取權限。",
    "scheduleTitle": "排程",
    "scheduleDescription": "規劃和協調專案時程。",
    "dailyTitle": "每日活動",
    "dailyDescription": "監控日常活動和更新。",
    "auditTitle": "稽核記錄",
    "auditDescription": "查看所有變更和存取歷史記錄。"
  },
  "tasks": {
    "title": "任務",
    "description": "管理專案任務和工作流程。",
    "addRootTask": "新增任務",
    "addSubtask": "新增子任務",
    "progressReport": "更新進度",
    "submitProgress": "提交進度",
    "currentProgress": "當前進度",
    "submittingQuantity": "更新數量",
    "reportProgressTitle": "更新「{name}」的進度",
    "invalidQuantity": "數量無效",
    "quantityExceedsTotal": "數量超過總數",
    "progressUpdated": "進度已更新",
    "failedToUpdateProgress": "更新進度失敗",
    "taskName": "任務名稱",
    "taskNamePlaceholder": "輸入任務名稱",
    "quantity": "數量",
    "budget": "預算",
    "assignee": "指派者",
    "status": "狀態",
    "priority": "優先級",
    "toDo": "待辦",
    "inProgress": "進行中",
    "completed": "已完成",
    "low": "低",
    "medium": "中",
    "high": "高",
    "delete": "刪除",
    "taskCreated": "任務已建立",
    "failedToCreateTask": "建立任務失敗",
    "taskUpdated": "任務已更新",
    "failedToUpdateTask": "更新任務失敗",
    "taskDeleted": "任務已刪除",
    "failedToDeleteTask": "刪除任務失敗",
    "uploadImages": "上傳圖片",
    "newImage": "新",
    "fileTooLarge": "檔案太大。最大大小為 5MB。",
    "taskDetails": "任務詳情",
    "attachments": "附件",
    "importTasks": "匯入任務"
  },
  "toast": {
    "qaApproved": "品質保證已批准",
    "taskAccepted": "任務已接受",
    "qaRejectedIssueLogged": "品質保證已拒絕 - 已建立問題",
    "acceptanceFailedIssueLogged": "驗收失敗 - 已建立問題",
    "importingItems": "匯入項目中...",
    "pleaseWait": "請稍候。",
    "importSuccessful": "匯入成功",
    "itemsAdded": "已新增 {count} 個任務。",
    "importFailed": "匯入失敗",
    "foundItems": "從「{source}」找到 {count} 個項目。",
    "issueSubmitted": "問題已建立",
    "failedToAddIssue": "建立問題失敗",
    "commentPosted": "評論已發布",
    "failedToPostComment": "發布評論失敗",
    "taskAcceptedDescription": "{name} 已被接受。",
    "acceptanceFailed": "驗收失敗",
    "acceptanceFailedDescription": "{name} 已還原且已建立高優先級問題。",
    "failedToUpdateTask": "更新任務失敗",
    "qaPassed": "品質保證通過",
    "qaPassedDescription": "{name} 已準備好進行最終驗收。",
    "failedToApproveQA": "批准品質保證失敗",
    "taskRejected": "任務已拒絕",
    "taskRejectedDescription": "{name} 已被拒絕且已建立問題。",
    "failedToRejectQA": "拒絕品質保證失敗",
    "invalidQuantity": "數量無效",
    "quantityExceedsTotal": "數量超過總數",
    "budgetOverflow": "超出預算",
    "budgetOverflowDescription": "子任務總和不能超過「{name}」的預算。",
    "budgetConflict": "預算衝突"
  }
}
````

## File: public/strings.json
````json
{
  "greeting": "Dimension Hub"
}
````

## File: README.md
````markdown
# Repo Layering Rules

* **src/app** → Next.js App Router, routing, layouts, pages. Only composition, no business logic or runtime wiring.
* **src/app-runtime** → Application runtime layer. Holds providers, runtime hooks, AI flows, and dependency wiring. Initializes SDKs and injects context. No domain logic.
* **src/config** → Static configuration: environment variables, feature flags, i18n, themes. Pure data, no runtime side effects.
* **src/features** → Business domain slices, rules, feature-specific logic. Depends on shared contracts and app-runtime, never on infra directly.
* **src/shared** → Contracts, interfaces, constants, pure utilities, shared types. No runtime side effects or business logic.
* **src/shared-infra** → External system adapters: Firebase, APIs, storage, messaging. Implements shared contracts. Features and app-runtime may depend on this, never the other way around.

---

# Dependency Direction

```
app
 ↓
app-runtime
 ↓
features
 ↓
shared
 ↓
shared-infra
```

* Flow is strictly downward.
* app-runtime may import shared or shared-infra, but never features.
* Features may import shared and shared-infra, but never app or app-runtime providers.
* Shared and shared-infra are leaf layers; they do not import anything higher.

---

# Layer Principles

1. **Separation of Concerns**: runtime, business, infrastructure, and config are strictly separated.
2. **No Runtime in Shared**: shared holds pure contracts, constants, types, and utils only.
3. **No Business Logic in Runtime**: app-runtime wires systems, initializes SDKs, and injects providers/hooks only.
4. **Infra Isolation**: shared-infra implements adapters but never contains domain logic.
5. **Feature Independence**: each feature depends only on shared contracts or infra, never on other features.

---

# One-Line Summary

Each folder has a single responsibility: app = UI, app-runtime = runtime wiring, config = static config, features = business logic, shared = contracts/utils, shared-infra = external adapters.
````

## File: repomix.config.ts
````typescript
/**
 * Repomix Configuration
 *
 * This is the primary configuration file for Repomix.
 * Note: repomix.config.ts is excluded from the app's tsconfig.json so that
 * this file can freely use repomix types when repomix is installed locally,
 * without breaking the application typecheck when it is not.
 *
 * All ignore patterns and configuration are centralized here.
 * Optimized for Copilot Browser Agent to reduce noise and improve context quality.
 */
⋮----
maxFileSize: 10485760, // 10MB - skip very large files
⋮----
removeComments: false, // Keep comments for context
removeEmptyLines: false, // Keep structure for readability
compress: true, // Full content for accurate understanding
topFilesLength: 10, // Show top 10 files by size
showLineNumbers: true, // Essential for debugging
truncateBase64: true, // Reduce noise from embedded data
⋮----
tokenCountTree: true, // Useful for token optimization
⋮----
includeDiffs: false, // Diffs add noise
includeLogs: false, // Logs add noise
⋮----
useGitignore: true, // Respect .gitignore
useDotIgnore: false, // We're deprecating .repomixignore
useDefaultPatterns: true, // Use repomix defaults
⋮----
/**
     * Custom ignore patterns optimized for Copilot Browser Agent.
     * Organized by category to reduce cognitive load.
     */
⋮----
// ==================== Dataconnect ====================
⋮----
// ==================== Dependencies ====================
⋮----
// ==================== Build Artifacts ====================
⋮----
// ==================== Firebase / Cloud ====================
⋮----
'dataconnect/', // Firebase Data Connect generated code
⋮----
// ==================== Cache / Temporary ====================
⋮----
// ==================== IDE / Editor ====================
⋮----
// ==================== Operating System ====================
⋮----
// ==================== Generated Files ====================
'*.map', // Source maps
'*.d.ts.map', // TypeScript declaration maps
'*.tsbuildinfo', // TypeScript build info
⋮----
// ==================== Lock Files ====================
⋮----
// ==================== Images & Media (Binary) ====================
⋮----
// ==================== Fonts (Binary) ====================
⋮----
// ==================== Test Files ====================
'*.spec.ts', // Unit tests
⋮----
'e2e/', // E2E tests
⋮----
'playwright.config.ts', // Already documented elsewhere
⋮----
// ==================== Git Internals ====================
⋮----
// ==================== GitHub / CI ====================
'.github/', // GitHub Actions, templates, etc.
'.husky/', // Git hooks
⋮----
// ==================== Documentation Archives ====================
'.github/instructions/archive/', // Archived instruction files
'docs/archive/', // Archived documentation
⋮----
// ==================== Configuration Files (Non-Code) ====================
⋮----
// ==================== Scripts & Tooling ====================
'scripts/', // Build/deploy scripts (not core code)
⋮----
// ==================== Documentation (Text) ====================
⋮----
'CHANGELOG.md', // History, not current state
'*.txt', // Generic text files
⋮----
// ==================== Temporary Asset Folders ====================
⋮----
// ==================== Repomix Output ====================
'repo-context.xml', // Our own output
⋮----
// ==================== Claude Skills Output ====================
// Keep SKILL.md but exclude large generated files if needed
// '.claude/skills/*/references/files.md', // Uncomment if too large
⋮----
enableSecurityCheck: true, // Prevent accidental exposure of secrets
⋮----
encoding: 'o200k_base', // OpenAI's encoding for GPT-4 and newer
````

## File: src/app-runtime/ai/dev.ts
````typescript
import { config } from 'dotenv';
````

## File: src/app-runtime/ai/flows/adapt-ui-color-to-account-context.ts
````typescript
/**
 * @fileOverview Adapts the UI color scheme to match the account's identity description.
 *
 * - adaptUIColorToAccountContext - Determines appropriate colors based on the dimension identity description.
 */
⋮----
import {z} from 'genkit';
⋮----
import {ai} from '@/app-runtime/ai/genkit';
⋮----
export type AdaptUIColorToAccountContextInput = z.infer<
  typeof AdaptUIColorToAccountContextInputSchema
>;
⋮----
export type AdaptUIColorToAccountContextOutput = z.infer<
  typeof AdaptUIColorToAccountContextOutputSchema
>;
⋮----
export async function adaptUIColorToAccountContext(
  input: AdaptUIColorToAccountContextInput
): Promise<AdaptUIColorToAccountContextOutput>
````

## File: src/app-runtime/ai/flows/extract-invoice-items.ts
````typescript
/**
 * @fileOverview Extracts line items from an invoice or quote document.
 */
⋮----
import { type z } from 'genkit';
⋮----
import { ai } from '@/app-runtime/ai/genkit';
import {
  ExtractInvoiceItemsInputSchema,
  ExtractInvoiceItemsOutputSchema,
} from '@/app-runtime/ai/schemas/docu-parse';
⋮----
export async function extractInvoiceItems(
  input: z.infer<typeof ExtractInvoiceItemsInputSchema>
): Promise<z.infer<typeof ExtractInvoiceItemsOutputSchema>>
````

## File: src/app-runtime/ai/genkit.ts
````typescript
import {googleAI} from '@genkit-ai/google-genai';
import {genkit} from 'genkit';
````

## File: src/app-runtime/ai/index.ts
````typescript
// AI Flows
⋮----
// AI Schemas
````

## File: src/app-runtime/ai/schemas/docu-parse.ts
````typescript
import { z } from 'genkit';
⋮----
/**
 * @fileOverview This file defines the Zod schemas and TypeScript types for the document parsing AI flow.
 */
⋮----
export type WorkItem = z.infer<typeof WorkItemSchema>;
````

## File: src/app-runtime/contexts/README.MD
````markdown
# contexts

Context defines shared state shape only.
It contains types and React contexts without runtime logic.
Context must not initialize services or contain side effects.
````

## File: src/app-runtime/providers/README.MD
````markdown
# providers

Providers implement runtime behavior.
They initialize services and inject values into React Context.
Providers may depend on config, shared, and shared-infra — never features.
````

## File: src/app-runtime/README.MD
````markdown
放置運行時組合與平台啟動代碼（Providers、服務組件）。
只允許向下依賴；向上 import 為架構違規。

app-runtime is the runtime wiring layer.
It initializes providers and connects config, shared, and infrastructure.
No business logic or feature code is allowed here.
````

## File: src/app/(public)/@modal/(.)reset-password/page.tsx
````typescript
// [職責] Intercepting route — renders ResetPasswordForm as Dialog overlay from within login page
// Client nav: modal overlay; direct URL: falls through to (auth)/reset-password/page.tsx
⋮----
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense } from "react"
⋮----
import { useI18n } from "@/config/i18n/i18n-provider"
import { ResetPasswordForm } from "@/features/identity.slice"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/shadcn-ui/dialog"
⋮----
function ResetPasswordModalContent()
⋮----
<Dialog open onOpenChange=
⋮----
onSuccess=
⋮----
onCancel=
⋮----
export default function ResetPasswordModalPage()
````

## File: src/app/(public)/@modal/default.tsx
````typescript
export default function AuthModalDefault()
````

## File: src/app/(public)/layout.tsx
````typescript
// [職責] Auth layout — provides @modal slot for dialog interception (reset-password)
import type { ReactNode } from "react"
⋮----
export default function AuthLayout({
  children,
  modal,
}: {
  children: ReactNode
  modal: ReactNode
})
````

## File: src/app/(public)/login/page.tsx
````typescript
import { LoginView } from "@/features/identity.slice"
⋮----
export default function LoginPage()
````

## File: src/app/(public)/reset-password/page.tsx
````typescript
// [職責] Canonical full-page reset-password — shown on direct URL access to /reset-password
⋮----
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense } from "react"
⋮----
import { useI18n } from "@/config/i18n/i18n-provider"
import { ResetPasswordForm } from "@/features/identity.slice"
⋮----
onCancel=
````

## File: src/app/(shell)/(account)/(dashboard)/dashboard/@header/default.tsx
````typescript
import { Header } from "@/features/workspace.slice";
⋮----
export default function HeaderSlot()
````

## File: src/app/(shell)/(account)/(dashboard)/dashboard/@modal/(.)account/new/page.tsx
````typescript
// [職責] Intercepting route — renders AccountNewForm as Dialog overlay from within dashboard
// Client nav: modal overlay; direct URL: falls through to dashboard/account/new/page.tsx
⋮----
import { useRouter } from "next/navigation"
⋮----
import { useI18n } from "@/config/i18n/i18n-provider"
import { AccountNewForm } from "@/features/organization.slice"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/shadcn-ui/dialog"
⋮----
<Dialog open onOpenChange=
⋮----
onCancel=
````

## File: src/app/(shell)/(account)/(dashboard)/dashboard/@modal/default.tsx
````typescript
export default function DashboardModalDefault()
````

## File: src/app/(shell)/(account)/(dashboard)/dashboard/account/audit/page.tsx
````typescript
import { AccountAuditView } from '@/features/workspace.slice';
````

## File: src/app/(shell)/(account)/(dashboard)/dashboard/account/daily/page.tsx
````typescript
import { AccountDailyView } from '@/features/workspace.slice';
````

## File: src/app/(shell)/(account)/(dashboard)/dashboard/account/matrix/page.tsx
````typescript
import { PermissionMatrixView } from "@/features/account.slice"
⋮----
export default function PermissionMatrixPage()
````

## File: src/app/(shell)/(account)/(dashboard)/dashboard/account/members/page.tsx
````typescript
import { MembersView } from "@/features/organization.slice"
⋮----
export default function AccountMembersPage()
````

## File: src/app/(shell)/(account)/(dashboard)/dashboard/account/new/page.tsx
````typescript
// [職責] Canonical full-page account creation — shown on direct URL access to /dashboard/account/new
⋮----
import { useRouter } from "next/navigation"
⋮----
import { useI18n } from "@/config/i18n/i18n-provider"
import { AccountNewForm } from "@/features/organization.slice"
⋮----
onSuccess=
````

## File: src/app/(shell)/(account)/(dashboard)/dashboard/account/partners/[id]/page.tsx
````typescript
import { PartnerDetailView } from "@/features/organization.slice"
⋮----
/**
 * PartnerTeamDetailPage - Manages recruitment and identity governance within a specific partner team.
 * REFACTORED: Now consumes invites from the global AppContext.
 */
export default function PartnerTeamDetailPage()
````

## File: src/app/(shell)/(account)/(dashboard)/dashboard/account/partners/page.tsx
````typescript
import { PartnersView } from "@/features/organization.slice"
⋮----
/**
 * PartnersPage - Manages logical groupings of EXTERNAL partners (Partner Teams).
 * Principle: Create a team first, then invite members into it.
 */
export default function PartnersPage()
````

## File: src/app/(shell)/(account)/(dashboard)/dashboard/account/schedule/page.tsx
````typescript
import { AccountScheduleSection } from "@/features/scheduling.slice";
⋮----
export default function AccountSchedulePage()
````

## File: src/app/(shell)/(account)/(dashboard)/dashboard/account/settings/page.tsx
````typescript
import { UserSettingsView } from "@/features/account.slice"
⋮----
export default function AccountSettingsPage()
````

## File: src/app/(shell)/(account)/(dashboard)/dashboard/account/skills/page.tsx
````typescript
// [職責] Personal Skill Profile — XP accumulation and tier visualization (FR-K1).
// Per docs/prd-schedule-workforce-skills.md FR-K1.
import { PersonalSkillPanel } from '@/features/skill-xp.slice';
⋮----
export default function AccountSkillsPage()
````

## File: src/app/(shell)/(account)/(dashboard)/dashboard/account/teams/[id]/page.tsx
````typescript
import { TeamDetailView } from "@/features/organization.slice"
⋮----
/**
 * AccountTeamDetailPage - 職責：管理特定團隊內的成員 (Team Member 清單)
 */
export default function AccountTeamDetailPage()
````

## File: src/app/(shell)/(account)/(dashboard)/dashboard/account/teams/page.tsx
````typescript
import { TeamsView } from "@/features/organization.slice"
⋮----
/**
 * AccountTeamsPage - Manages the logical groupings of INTERNAL members within the dimension.
 */
export default function AccountTeamsPage()
````

## File: src/app/(shell)/(account)/(dashboard)/dashboard/layout.tsx
````typescript
/**
 * Dashboard Layout
 *
 * Responsibility: Business layout for authenticated dashboard pages.
 * Auth guard and SidebarProvider live in (shell)/layout.tsx.
 * AccountProvider lives in the parent (account)/layout.tsx.
 *
 * Parallel route structure:
 *   @header  →  Header (SidebarTrigger + Breadcrumb, inside SidebarInset)
 *   @modal   →  route-specific dialog/overlay interceptions
 */
⋮----
import type { ReactNode } from "react";
⋮----
import { ThemeAdapter } from "@/features/workspace.slice";
import { SidebarInset } from "@/shared/shadcn-ui/sidebar";
⋮----
type DashboardLayoutProps = {
  children: ReactNode;
  /** @header parallel route slot — Header with SidebarTrigger + Breadcrumb */
  header: ReactNode;
  /** @modal parallel route slot — route-specific dialog/overlay surfaces */
  modal: ReactNode;
};
⋮----
/** @header parallel route slot — Header with SidebarTrigger + Breadcrumb */
⋮----
/** @modal parallel route slot — route-specific dialog/overlay surfaces */
⋮----
export default function DashboardLayout(
````

## File: src/app/(shell)/(account)/(dashboard)/dashboard/page.tsx
````typescript
import { DashboardView } from "@/features/workspace.slice"
⋮----
export default function DashboardPage()
````

## File: src/app/(shell)/(account)/(workspaces)/workspaces/[id]/@businesstab/acceptance/page.tsx
````typescript
import { WorkspaceAcceptance } from "@/features/workspace.slice"
⋮----
export default function AcceptanceCapabilityPage()
````

## File: src/app/(shell)/(account)/(workspaces)/workspaces/[id]/@businesstab/audit/loading.tsx
````typescript
import { Skeleton } from "@/shared/shadcn-ui/skeleton"
⋮----
export default function Loading()
````

## File: src/app/(shell)/(account)/(workspaces)/workspaces/[id]/@businesstab/audit/page.tsx
````typescript
import { WorkspaceAudit } from "@/features/workspace.slice"
⋮----
export default function AuditCapabilityPage()
````

## File: src/app/(shell)/(account)/(workspaces)/workspaces/[id]/@businesstab/capabilities/page.tsx
````typescript
import { WorkspaceCapabilities } from "@/features/workspace.slice"
⋮----
export default function CapabilitiesPage()
````

## File: src/app/(shell)/(account)/(workspaces)/workspaces/[id]/@businesstab/daily/loading.tsx
````typescript
import { Skeleton } from "@/shared/shadcn-ui/skeleton"
⋮----
export default function Loading()
````

## File: src/app/(shell)/(account)/(workspaces)/workspaces/[id]/@businesstab/daily/page.tsx
````typescript
import { WorkspaceDaily } from "@/features/workspace.slice"
⋮----
export default function DailyCapabilityPage()
````

## File: src/app/(shell)/(account)/(workspaces)/workspaces/[id]/@businesstab/default.tsx
````typescript
export default function DefaultBusinessTab()
````

## File: src/app/(shell)/(account)/(workspaces)/workspaces/[id]/@businesstab/document-parser/page.tsx
````typescript
import { WorkspaceDocumentParser } from "@/features/workspace.slice"
⋮----
export default function DocumentParserCapabilityPage()
````

## File: src/app/(shell)/(account)/(workspaces)/workspaces/[id]/@businesstab/error.tsx
````typescript
import { AlertCircle } from "lucide-react"
import { useEffect } from "react"
⋮----
import { Button } from "@/shared/shadcn-ui/button"
⋮----
export default function BusinessTabError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
})
````

## File: src/app/(shell)/(account)/(workspaces)/workspaces/[id]/@businesstab/files/page.tsx
````typescript
import { WorkspaceFiles } from "@/features/workspace.slice"
⋮----
export default function FilesCapabilityPage()
````

## File: src/app/(shell)/(account)/(workspaces)/workspaces/[id]/@businesstab/finance/page.tsx
````typescript
import { WorkspaceFinance } from "@/features/workspace.slice"
⋮----
export default function FinanceCapabilityPage()
````

## File: src/app/(shell)/(account)/(workspaces)/workspaces/[id]/@businesstab/issues/page.tsx
````typescript
import { WorkspaceIssues } from "@/features/workspace.slice"
⋮----
export default function IssuesCapabilityPage()
````

## File: src/app/(shell)/(account)/(workspaces)/workspaces/[id]/@businesstab/loading.tsx
````typescript
import { Skeleton } from "@/shared/shadcn-ui/skeleton"
⋮----
export default function Loading()
````

## File: src/app/(shell)/(account)/(workspaces)/workspaces/[id]/@businesstab/members/page.tsx
````typescript
import { WorkspaceMembers } from "@/features/workspace.slice"
⋮----
export default function MembersCapabilityPage()
````

## File: src/app/(shell)/(account)/(workspaces)/workspaces/[id]/@businesstab/quality-assurance/page.tsx
````typescript
import { WorkspaceQualityAssurance } from "@/features/workspace.slice"
⋮----
export default function QualityAssuranceCapabilityPage()
````

## File: src/app/(shell)/(account)/(workspaces)/workspaces/[id]/@businesstab/schedule/loading.tsx
````typescript
import { Skeleton } from "@/shared/shadcn-ui/skeleton"
⋮----
export default function Loading()
````

## File: src/app/(shell)/(account)/(workspaces)/workspaces/[id]/@businesstab/schedule/page.tsx
````typescript
import { WorkspaceSchedule } from "@/features/scheduling.slice"
⋮----
export default function ScheduleCapabilityPage()
````

## File: src/app/(shell)/(account)/(workspaces)/workspaces/[id]/@businesstab/tasks/loading.tsx
````typescript
import { Skeleton } from "@/shared/shadcn-ui/skeleton"
⋮----
export default function Loading()
````

## File: src/app/(shell)/(account)/(workspaces)/workspaces/[id]/@businesstab/tasks/page.tsx
````typescript
import { WorkspaceTasks } from "@/features/workspace.slice"
⋮----
export default function TasksCapabilityPage()
````

## File: src/app/(shell)/(account)/(workspaces)/workspaces/[id]/@modal/(.)daily-log/[logId]/page.tsx
````typescript
// Intercepting route: renders DailyLogDialog in the @modal slot when navigating
// to /workspaces/[id]/daily-log/[logId] from within the workspace layout.
⋮----
import { useRouter } from "next/navigation"
import { use } from "react"
⋮----
import { DailyLogDialog } from "@/features/workspace.slice"
import { useAccount } from "@/features/workspace.slice"
import { useAuth } from "@/shared/app-providers/auth-provider"
⋮----
interface PageProps {
  params: Promise<{ id: string; logId: string }>
}
⋮----
export default function DailyLogModalPage(
````

## File: src/app/(shell)/(account)/(workspaces)/workspaces/[id]/@modal/(.)schedule-proposal/page.tsx
````typescript
// Intercepting route: renders ProposalDialog in the @modal slot when navigating
// to /workspaces/[id]/schedule-proposal from within the workspace layout.
⋮----
import { ScheduleProposalContent } from "@/features/scheduling.slice"
⋮----
export default function ScheduleProposalModalPage()
````

## File: src/app/(shell)/(account)/(workspaces)/workspaces/[id]/@modal/(.)settings/page.tsx
````typescript
// [職責] @modal intercept: workspace settings dialog (deep-linkable)
⋮----
import { useRouter } from "next/navigation"
import { useState } from "react"
⋮----
import { WorkspaceSettingsDialog , useWorkspace } from "@/features/workspace.slice"
import type { WorkspaceLifecycleState, Address } from "@/shared/types"
⋮----
export default function WorkspaceSettingsModalPage()
⋮----
const onSave = async (settings: {
    name: string
    visibility: "visible" | "hidden"
    lifecycleState: WorkspaceLifecycleState
    address?: Address
}) =>
⋮----
onOpenChange=
````

## File: src/app/(shell)/(account)/(workspaces)/workspaces/[id]/@modal/default.tsx
````typescript
export default function DefaultModal()
````

## File: src/app/(shell)/(account)/(workspaces)/workspaces/[id]/@panel/(.)governance/page.tsx
````typescript
// [職責] @panel intercept: governance sidebar — pending proposals review panel
⋮----
import { useRouter } from "next/navigation"
import { useMemo } from "react"
⋮----
import { GovernanceSidebar , useScheduleActions } from "@/features/scheduling.slice"
import { useWorkspace } from "@/features/workspace.slice"
import { useAccount } from "@/features/workspace.slice"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/shared/shadcn-ui/sheet"
import type { ScheduleItem } from "@/shared/types"
⋮----
export default function GovernancePanelPage()
````

## File: src/app/(shell)/(account)/(workspaces)/workspaces/[id]/@panel/default.tsx
````typescript
export default function DefaultPanel()
````

## File: src/app/(shell)/(account)/(workspaces)/workspaces/[id]/daily-log/[logId]/page.tsx
````typescript
// Canonical route: direct URL access to a daily log entry.
// Renders a standalone full-page view when navigating outside the workspace layout
// or when the intercepting route is not active (e.g., hard refresh, direct URL).
⋮----
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { use } from "react"
⋮----
import { DailyLogDialog } from "@/features/workspace.slice"
import { useAccount } from "@/features/workspace.slice"
import { useAuth } from "@/shared/app-providers/auth-provider"
import { Button } from "@/shared/shadcn-ui/button"
⋮----
interface PageProps {
  params: Promise<{ id: string; logId: string }>
}
⋮----
export default function DailyLogPage(
⋮----
onClick={() => router.push(`/workspaces/${workspaceId}/daily`)}
      >
        <ArrowLeft className="size-3.5" /> Back to Daily
      </Button>
      <DailyLogDialog
        log={log}
        currentUser={currentUser}
        isOpen={true}
onOpenChange=
⋮----
onOpenChange=
````

## File: src/app/(shell)/(account)/(workspaces)/workspaces/[id]/governance/page.tsx
````typescript
// [職責] Canonical governance route — full-page fallback for direct URL access
⋮----
import { useRouter } from "next/navigation"
import { useMemo } from "react"
⋮----
import { GovernanceSidebar , useScheduleActions } from "@/features/scheduling.slice"
import { useWorkspace } from "@/features/workspace.slice"
import { useAccount } from "@/features/workspace.slice"
import type { ScheduleItem } from "@/shared/types"
⋮----
export default function GovernancePage()
⋮----
onClick=
````

## File: src/app/(shell)/(account)/(workspaces)/workspaces/[id]/layout.tsx
````typescript
// [職責] 為特定工作區的所有頁面提供共享的 Context 和 UI 佈局。
⋮----
import { ArrowLeft, Settings, Trash2, ChevronRight, MapPin } from "lucide-react";
import { useRouter, useSelectedLayoutSegment } from "next/navigation";
import { useEffect, useMemo, useRef, useState, use } from "react";
⋮----
import { WorkspaceProvider, useWorkspace , useWorkspaceEventHandler , WorkspaceStatusBar , WorkspaceNavTabs , useWorkspaceCommands, useApp } from "@/features/workspace.slice"
import { ROUTES } from "@/shared/constants/routes";
import { Button } from "@/shared/shadcn-ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/shadcn-ui/dialog";
import { PageHeader } from "@/shared/ui/page-header";
⋮----
/**
 * WorkspaceLayoutInner - The actual UI layout component.
 * It consumes the context provided by WorkspaceLayout.
 */
⋮----
const onDeleteWorkspace = async () =>
⋮----
/**
 * WorkspaceLayout - The main layout component.
 * Its sole responsibility is to provide the WorkspaceContext.
 */
````

## File: src/app/(shell)/(account)/(workspaces)/workspaces/[id]/locations/page.tsx
````typescript
// [職責] Workspace sub-locations management route (FR-L1/FR-L2/FR-L3)
⋮----
import { useRouter } from 'next/navigation';
⋮----
import { useWorkspace } from '@/features/workspace.slice';
import { WorkspaceLocationsPanel } from '@/features/workspace.slice';
import { ROUTES } from '@/shared/constants/routes';
import { Button } from '@/shared/shadcn-ui/button';
⋮----
export default function WorkspaceLocationsPage()
⋮----
onClick=
````

## File: src/app/(shell)/(account)/(workspaces)/workspaces/[id]/page.tsx
````typescript
// [職責] 詳情頁入口：重定向到默認能力。
import { redirect } from "next/navigation"
⋮----
/**
 * WorkspaceDetailPage - The entry point for a specific workspace.
 * Its SOLE RESPONSIBILITY is to redirect to the default capability (capabilities).
 * Server-side redirect — no client JS required.
 */
export default async function WorkspaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
})
````

## File: src/app/(shell)/(account)/(workspaces)/workspaces/[id]/schedule-proposal/page.tsx
````typescript
// Canonical route: full-page schedule proposal form for direct URL access.
// When navigated to within the workspace layout, the @modal slot intercepts.
⋮----
import { ScheduleProposalContent } from "@/features/scheduling.slice"
⋮----
export default function ScheduleProposalPage()
````

## File: src/app/(shell)/(account)/(workspaces)/workspaces/[id]/settings/page.tsx
````typescript
// [職責] Canonical workspace settings route — full-page fallback for direct URL access
⋮----
import { useRouter } from "next/navigation"
import { useState } from "react"
⋮----
import { WorkspaceSettingsDialog , useWorkspace } from "@/features/workspace.slice"
import type { WorkspaceLifecycleState, Address } from "@/shared/types"
⋮----
export default function WorkspaceSettingsPage()
⋮----
const onSave = async (settings: {
    name: string
    visibility: "visible" | "hidden"
    lifecycleState: WorkspaceLifecycleState
    address?: Address
}) =>
⋮----
onOpenChange=
````

## File: src/app/(shell)/(account)/(workspaces)/workspaces/@header/default.tsx
````typescript
import { Header } from "@/features/workspace.slice";
⋮----
export default function HeaderSlot()
````

## File: src/app/(shell)/(account)/(workspaces)/workspaces/@modal/(.)new/page.tsx
````typescript
// [職責] @modal intercept: create workspace dialog (deep-linkable)
⋮----
import { useRouter } from "next/navigation"
⋮----
import { CreateWorkspaceDialog } from "@/features/workspace.slice"
⋮----
export default function NewWorkspaceModalPage()
````

## File: src/app/(shell)/(account)/(workspaces)/workspaces/@modal/default.tsx
````typescript
export default function DefaultModal()
````

## File: src/app/(shell)/(account)/(workspaces)/workspaces/layout.tsx
````typescript
/**
 * Workspaces Layout
 *
 * Responsibility: Business layout for authenticated workspace pages.
 * Auth guard and SidebarProvider live in (shell)/layout.tsx.
 * AccountProvider lives in the parent (account)/layout.tsx.
 *
 * Parallel route structure:
 *   @header  →  Header (SidebarTrigger + Breadcrumb, inside SidebarInset)
 *   @modal   →  route-specific dialog/overlay interceptions
 */
⋮----
import type { ReactNode } from "react";
⋮----
import { ThemeAdapter } from "@/features/workspace.slice";
import { SidebarInset } from "@/shared/shadcn-ui/sidebar";
⋮----
type WorkspacesLayoutProps = {
  children: ReactNode;
  /** @header parallel route slot — Header with SidebarTrigger + Breadcrumb */
  header: ReactNode;
  /** @modal parallel route slot — route-specific dialog/overlay surfaces */
  modal: ReactNode;
};
⋮----
/** @header parallel route slot — Header with SidebarTrigger + Breadcrumb */
⋮----
/** @modal parallel route slot — route-specific dialog/overlay surfaces */
⋮----
export default function WorkspacesLayout(
````

## File: src/app/(shell)/(account)/(workspaces)/workspaces/new/page.tsx
````typescript
// [職責] Canonical create-workspace route — full-page fallback for direct URL access
⋮----
import { useRouter } from "next/navigation"
⋮----
import { CreateWorkspaceDialog } from "@/features/workspace.slice"
⋮----
export default function NewWorkspacePage()
````

## File: src/app/(shell)/(account)/(workspaces)/workspaces/page.tsx
````typescript
import { WorkspacesView } from "@/features/workspace.slice";
⋮----
export default function WorkspacesPage()
````

## File: src/app/(shell)/(account)/layout.tsx
````typescript
/**
 * Account Layout — Pass-through layout for (dashboard) and (workspaces) route groups.
 *
 * AccountProvider is provided by the parent (shell)/layout.tsx so that it wraps
 * both the @sidebar slot and the page children. This layout is intentionally
 * transparent — it exists only to group routes under the (account) segment.
 */
⋮----
import type { ReactNode } from "react";
⋮----
export default function AccountLayout(
````

## File: src/app/(shell)/@modal/default.tsx
````typescript
export default function ShellModalDefault()
````

## File: src/app/(shell)/@sidebar/default.tsx
````typescript
import { DashboardSidebar } from "@/features/workspace.slice";
⋮----
export default function SidebarSlot()
````

## File: src/app/(shell)/layout.tsx
````typescript
/**
 * Shell Layout — Global UI Container
 *
 * Responsibility: Outer visual frame shared by all authenticated routes.
 * - Auth guard: redirects unauthenticated users to /login
 * - SidebarProvider: owns global sidebar open/close state
 * - Slot composition:
 *     @sidebar  → DashboardSidebar (peer element for CSS transitions)
 *     @modal    → global overlay surface (null by default)
 *     children  → authenticated route content (wraps in SidebarInset via nested layout)
 * - [S6] useTokenRefreshListener: fulfils Frontend Party 3 of Claims refresh handshake
 *
 * Does NOT carry business logic.
 */
⋮----
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, type ReactNode } from "react";
⋮----
import { useTokenRefreshListener } from "@/features/identity.slice";
import { AccountProvider } from "@/features/workspace.slice";
import { useAuth } from "@/shared/app-providers/auth-provider";
import { SidebarProvider } from "@/shared/shadcn-ui/sidebar";
⋮----
type ShellLayoutProps = {
  children: ReactNode;
  /** @sidebar slot — DashboardSidebar */
  sidebar: ReactNode;
  /** @modal slot — global overlay (null by default) */
  modal: ReactNode;
};
⋮----
/** @sidebar slot — DashboardSidebar */
⋮----
/** @modal slot — global overlay (null by default) */
⋮----
export default function ShellLayout(
⋮----
// [S6] Frontend Party 3 — force-refresh Firebase token on TOKEN_REFRESH_SIGNAL
````

## File: src/app/(shell)/page.tsx
````typescript
import { useRouter } from "next/navigation";
import { useEffect } from "react";
⋮----
import { useI18n } from "@/config/i18n/i18n-provider";
import { useAuth } from "@/shared/app-providers/auth-provider";
import { Button } from "@/shared/shadcn-ui/button";
⋮----
/**
 * Home - Responsibility: Serves as the landing page and entry point.
 */
````

## File: src/app/globals.css
````css
@tailwind base;
@tailwind components;
@tailwind utilities;
⋮----
@layer base {
⋮----
:root {
⋮----
/* Skill-tier badge palette (light mode) */
⋮----
--tier-5-grandmaster: #23545B; /* core colour */
⋮----
.dark {
⋮----
/* Skill-tier badge palette (dark mode — same hues, slightly lighter for contrast) */
⋮----
--tier-5-grandmaster: #1c464d; /* core colour */
⋮----
* {
⋮----
@apply border-border;
⋮----
body {
⋮----
/* 效能優化：內容可見性優化與 GPU 加速 */
.content-visibility-auto {
⋮----
.gpu-accelerated {
⋮----
.glass-card {
⋮----
.dimension-glow {
````

## File: src/app/layout.tsx
````typescript
import type {Metadata} from 'next';
⋮----
import { I18nProvider } from '@/config/i18n/i18n-provider';
import { AppProvider } from '@/features/workspace.slice';
import { AuthProvider } from '@/shared/app-providers/auth-provider';
import { FirebaseClientProvider } from '@/shared/app-providers/firebase-provider';
import { ThemeProvider } from '@/shared/app-providers/theme-provider';
import { cn } from '@/shared/lib';
import {Toaster} from '@/shared/shadcn-ui/toaster';
⋮----
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>)
````

## File: src/app/README.MD
````markdown
放置框架入口：路由、layouts 與全域配置。
只允許向下依賴；向上 import 為架構違規。
````

## File: src/config/i18n/i18n-provider.tsx
````typescript
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
⋮----
import { getPreferredLocale, setLocalePreference, loadMessages, i18nConfig } from '@/config/i18n/i18n';
import { type Locale, type TranslationMessages } from '@/config/i18n/i18n-types';
⋮----
interface I18nContextValue {
  locale: Locale;
  messages: TranslationMessages | null;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  isLoading: boolean;
}
⋮----
export function I18nProvider(
⋮----
// Initialize locale on mount
⋮----
// Load messages when locale changes
⋮----
async function load()
⋮----
const setLocale = (newLocale: Locale) =>
⋮----
// Translation function with dot notation support
const t = (key: string, params?: Record<string, string | number>): string =>
⋮----
return key; // Return key if path not found
⋮----
export function useI18n()
````

## File: src/config/i18n/i18n-types.ts
````typescript
/**
 * i18n type contracts.
 *
 * Locale: supported locale codes.
 * I18nConfig: runtime configuration shape.
 * TranslationMessages: message schema imported from i18n.schema.
 */
⋮----
import type { TranslationMessages } from './i18n.schema';
⋮----
export type Locale = 'en' | 'zh-TW';
⋮----
export interface I18nConfig {
  defaultLocale: Locale;
  locales: Locale[];
}
````

## File: src/config/i18n/i18n.schema.ts
````typescript
export interface TranslationMessages {
  common: {
    appName: string;
    appTitle: string;
    appDescription: string;
    greeting: string;
    loading: string;
    error: string;
    success: string;
    cancel: string;
    confirm: string;
    save: string;
    delete: string;
    edit: string;
    close: string;
    creating: string;
    unknownError: string;
    enterOrgVerse: string;
    visible: string;
    hidden: string;
    filter: string;
    confirmCreation: string;
  };
  auth: {
    login: string;
    register: string;
    logout: string;
    disconnect: string;
    email: string;
    password: string;
    displayName: string;
    nickname: string;
    forgotPassword: string;
    resetPassword: string;
    sendEmail: string;
    enterDimension: string;
    registerSovereignty: string;
    guestAccess: string;
    contactEndpoint: string;
    securityKey: string;
    setSecurityKey: string;
    digitalDesignation: string;
    identityResonanceSuccessful: string;
    authenticationFailed: string;
    resetProtocolSent: string;
    resetFailed: string;
    pleaseSetDisplayName: string;
    dimensionSecurityProtocol: string;
    byLoggingIn: string;
  };
  sidebar: {
    switchAccountContext: string;
    selectAccount: string;
    createNewDimension: string;
    dimensionCore: string;
    accountGovernance: string;
    quickAccess: string;
    userSettings: string;
    owner: string;
    guest: string;
  };
  navigation: {
    dashboard: string;
    settings: string;
    profile: string;
    account: string;
    workspaces: string;
    teams: string;
    internalTeams: string;
    partnerTeams: string;
    partners: string;
    members: string;
    permissions: string;
    matrix: string;
    schedule: string;
    orgSchedule: string;
    demandBoard: string;
    daily: string;
    audit: string;
  };
  dimension: {
    createTitle: string;
    createDescription: string;
    dimensionName: string;
    dimensionNamePlaceholder: string;
    createDimension: string;
    newDimensionCreated: string;
    failedToCreate: string;
  };
  workspaces: {
    title: string;
    description: string;
    createSpace: string;
    createLogicalSpace: string;
    createDescription: string;
    spaceName: string;
    spaceNamePlaceholder: string;
    searchPlaceholder: string;
    accessProtocol: string;
    defaultProtocol: string;
    lifecycleState: string;
    spaceVoid: string;
    noSpacesFound: string;
    createInitialSpace: string;
    creationFailed: string;
    accountNotFound: string;
    logicalSpaceCreated: string;
    spaceSynchronized: string;
    failedToCreateSpace: string;
    standard: string;
  };
  workspace: {
    capabilities: string;
    tasks: string;
    acceptance: string;
    finance: string;
    issues: string;
    files: string;
    'quality-assurance': string;
    documentParser: string;
  };
  account: {
    governanceNotAvailable: string;
    governanceNotAvailableDescription: string;
    membersTitle: string;
    membersDescription: string;
    recruitNewMember: string;
    identityResonanceActivated: string;
    identityResonanceDescription: string;
    failedToRecruitMember: string;
    identityDeregistered: string;
    memberRemoved: string;
    failedToDismissMember: string;
    contact: string;
    teamsTitle: string;
    teamsDescription: string;
    createInternalTeam: string;
    internalTeamCreated: string;
    failedToCreateTeam: string;
    manageMembers: string;
    createNewTeam: string;
    teamName: string;
    teamNamePlaceholder: string;
    members: string;
    partnersTitle: string;
    partnersDescription: string;
    createPartnerTeam: string;
    partnerTeamCreated: string;
    resonatingPartners: string;
    manageAndRecruit: string;
    createCollaborationBoundary: string;
    createPartnerTeamTitle: string;
    createPartnerTeamDescription: string;
    partnerTeamNamePlaceholder: string;
    matrixTitle: string;
    matrixDescription: string;
    scheduleTitle: string;
    scheduleDescription: string;
    dailyTitle: string;
    dailyDescription: string;
    auditTitle: string;
    auditDescription: string;
  };
  tasks: {
    title: string;
    description: string;
    addRootTask: string;
    addSubtask: string;
    progressReport: string;
    submitProgress: string;
    currentProgress: string;
    submittingQuantity: string;
    reportProgressTitle: string;
    invalidQuantity: string;
    quantityExceedsTotal: string;
    progressUpdated: string;
    failedToUpdateProgress: string;
    taskName: string;
    taskNamePlaceholder: string;
    quantity: string;
    budget: string;
    assignee: string;
    status: string;
    priority: string;
    toDo: string;
    inProgress: string;
    completed: string;
    low: string;
    medium: string;
    high: string;
    delete: string;
    taskCreated: string;
    failedToCreateTask: string;
    taskUpdated: string;
    failedToUpdateTask: string;
    taskDeleted: string;
    failedToDeleteTask: string;
    uploadImages: string;
    newImage: string;
    fileTooLarge: string;
    taskDetails: string;
    attachments: string;
    importTasks: string;
  };
  toast: {
    qaApproved: string;
    taskAccepted: string;
    qaRejectedIssueLogged: string;
    acceptanceFailedIssueLogged: string;
    importingItems: string;
    pleaseWait: string;
    importSuccessful: string;
    itemsAdded: string;
    importFailed: string;
    foundItems: string;
    issueSubmitted: string;
    failedToAddIssue: string;
    commentPosted: string;
    failedToPostComment: string;
    taskAcceptedDescription: string;
    acceptanceFailed: string;
    acceptanceFailedDescription: string;
    failedToUpdateTask: string;
    qaPassed: string;
    qaPassedDescription: string;
    failedToApproveQA: string;
    taskRejected: string;
    taskRejectedDescription: string;
    failedToRejectQA: string;
    invalidQuantity: string;
    quantityExceedsTotal: string;
    budgetOverflow: string;
    budgetOverflowDescription: string;
    budgetConflict: string;
  };
}
````

## File: src/config/i18n/i18n.ts
````typescript
import { type Locale, type I18nConfig } from "@/config/i18n/i18n-types"
⋮----
/**
 * Get the locale from browser preferences or storage
 */
export function getPreferredLocale(): Locale
⋮----
// Check localStorage first
⋮----
// Check browser language
⋮----
// Direct match
⋮----
// Check for language prefix match (e.g., 'zh' matches 'zh-TW')
⋮----
/**
 * Save locale preference to localStorage
 */
export function setLocalePreference(locale: Locale): void
⋮----
/**
 * Load translation messages for a specific locale
 */
export async function loadMessages(locale: Locale)
⋮----
// Fallback to default locale
````

## File: src/config/README.MD
````markdown
放置專案配置與說明：環境變數範例與設定檔參考。
只允許向下依賴；向上 import 為架構違規。
````

## File: src/features/account.slice/gov.policy/_actions.ts
````typescript
/**
 * account-governance.policy — _actions.ts
 *
 * Server actions for account-level policy management.
 *
 * Per logic-overview.md:
 *   ACCOUNT_POLICY → CUSTOM_CLAIMS
 *   Policy changes are account-scoped; CUSTOM_CLAIMS refresh is triggered downstream
 *   by account governance logic (not via org event bus — this is an account-level BC).
 *
 * Invariant #1: This BC only writes its own aggregate.
 * Invariant #3: Application layer coordinates flow only.
 * [R8] TRACE_PROPAGATION_RULE: traceId is carried from CBG_ENTRY into the persisted
 *   policy record for auditability. Must NOT be regenerated here.
 */
⋮----
import {
  type CommandResult,
  commandSuccess,
  commandFailureFrom,
} from '@/features/shared-kernel';
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
import { addDocument, updateDocument, deleteDocument } from '@/shared/infra/firestore/firestore.write.adapter';
⋮----
// ---------------------------------------------------------------------------
// TOKEN_REFRESH_SIGNAL helper [S6]
// Defined locally per VSA cross-slice boundary rules (no import from account-governance.role).
// ---------------------------------------------------------------------------
⋮----
/**
 * Writes a TOKEN_REFRESH_SIGNAL document for the affected account.
 * Frontend onSnapshot on `tokenRefreshSignals/{accountId}` force-refreshes the token.
 * Per [SK_TOKEN_REFRESH_CONTRACT: CLIENT_TOKEN_REFRESH_OBLIGATION][S6].
 */
async function emitPolicyChangedRefreshSignal(accountId: string, traceId?: string): Promise<void>
⋮----
// Guard against path-traversal: accountId must be a safe Firestore document ID.
⋮----
export interface AccountPolicy {
  id: string;
  accountId: string;
  name: string;
  description: string;
  rules: PolicyRule[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  /** TraceID propagated from CBG_ENTRY for auditability [R8]. */
  traceId?: string;
}
⋮----
/** TraceID propagated from CBG_ENTRY for auditability [R8]. */
⋮----
export interface PolicyRule {
  resource: string;
  actions: string[];
  effect: 'allow' | 'deny';
}
⋮----
export interface CreatePolicyInput {
  accountId: string;
  name: string;
  description: string;
  rules: PolicyRule[];
  /** Optional trace identifier propagated from CBG_ENTRY [R8]. */
  traceId?: string;
}
⋮----
/** Optional trace identifier propagated from CBG_ENTRY [R8]. */
⋮----
export interface UpdatePolicyInput {
  /** Account that owns this policy. When provided, a TOKEN_REFRESH_SIGNAL is emitted [S6].
   *  Optional: callers that don't have accountId in scope may omit; Claims re-sync on next token expiry. */
  accountId?: string;
  name?: string;
  description?: string;
  rules?: PolicyRule[];
  isActive?: boolean;
  /** Optional trace identifier propagated from CBG_ENTRY [R8]. */
  traceId?: string;
}
⋮----
/** Account that owns this policy. When provided, a TOKEN_REFRESH_SIGNAL is emitted [S6].
   *  Optional: callers that don't have accountId in scope may omit; Claims re-sync on next token expiry. */
⋮----
/** Optional trace identifier propagated from CBG_ENTRY [R8]. */
⋮----
/**
 * Creates a new account policy.
 * CUSTOM_CLAIMS refresh is triggered by the governance layer reading updated policies.
 * Returns CommandSuccess with the created policy ID as aggregateId.
 * traceId is stored in the record for auditability [R8].
 */
export async function createAccountPolicy(input: CreatePolicyInput): Promise<CommandResult>
⋮----
/**
 * Updates an existing account policy.
 * Emits TOKEN_REFRESH_SIGNAL so the frontend refreshes Claims [S6].
 * traceId is stored in the record for auditability [R8].
 */
export async function updateAccountPolicy(
  policyId: string,
  input: UpdatePolicyInput
): Promise<CommandResult>
⋮----
// PolicyChanged → TOKEN_REFRESH_SIGNAL [S6]
// Best-effort: signal failure does NOT roll back the policy update.
// accountId is optional — signal is only emitted when the caller provides it.
⋮----
// Log signal failure for observability; Claims re-sync on next token expiry.
⋮----
/**
 * Deletes an account policy.
 * [R8] Reads the policy first to obtain accountId, then emits a token-refresh
 * signal so stale claims are invalidated — matching the create/update pattern.
 */
export async function deleteAccountPolicy(policyId: string, traceId?: string): Promise<CommandResult>
⋮----
// Read accountId before deletion so we can emit the refresh signal [R8].
⋮----
// If we found the policy, emit a token-refresh signal so stale claims are invalidated.
````

## File: src/features/account.slice/gov.policy/_hooks/use-account-policy.ts
````typescript
/**
 * account-governance.policy — _hooks/use-account-policy.ts
 *
 * React hook for subscribing to account policies.
 */
⋮----
import { useState, useEffect } from 'react';
⋮----
import type { AccountPolicy } from '../_actions';
import { subscribeToAccountPolicies } from '../_queries';
⋮----
export function useAccountPolicy(accountId: string | null)
````

## File: src/features/account.slice/gov.policy/_queries.ts
````typescript
/**
 * account-governance.policy — _queries.ts
 *
 * Read queries for account policy management.
 *
 * Per logic-overview.md: ACCOUNT_POLICY → CUSTOM_CLAIMS
 * Policies are read to determine effective permissions for an account.
 */
⋮----
import { db } from '@/shared/infra/firestore/firestore.client';
import { collection, query, where, onSnapshot, type Unsubscribe } from '@/shared/infra/firestore/firestore.read.adapter';
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
⋮----
import type { AccountPolicy } from './_actions';
⋮----
/**
 * Fetches a single account policy by ID.
 */
export async function getAccountPolicy(policyId: string): Promise<AccountPolicy | null>
⋮----
/**
 * Subscribes to all policies for an account.
 * Returns an unsubscribe function.
 */
export function subscribeToAccountPolicies(
  accountId: string,
  onUpdate: (policies: AccountPolicy[]) => void
): Unsubscribe
⋮----
/**
 * Fetches all active policies for an account.
 */
export async function getActiveAccountPolicies(accountId: string): Promise<AccountPolicy[]>
````

## File: src/features/account.slice/gov.policy/index.ts
````typescript
/**
 * account-governance.policy — Public API
 *
 * Account-level policy management. Policy changes trigger CUSTOM_CLAIMS refresh
 * downstream via account governance logic.
 *
 * Per logic-overview.md: ACCOUNT_POLICY → CUSTOM_CLAIMS
 */
````

## File: src/features/account.slice/gov.role/_actions.ts
````typescript
/**
 * account-governance.role — _actions.ts
 *
 * Server actions for account role management.
 *
 * Per logic-overview.md:
 *   ACCOUNT_ROLE → CUSTOM_CLAIMS
 *   Role changes trigger CUSTOM_CLAIMS refresh.
 *
 * Per logic-overview.md [R2] TOKEN_REFRESH_SIGNAL:
 *   After claims are set, write a TOKEN_REFRESH_SIGNAL document so the
 *   frontend can detect the change and force a token refresh.
 *   Semantics: high-priority eventual consistency (async — Firebase limitation).
 *   The frontend detects this via onSnapshot on `tokenRefreshSignals/{accountId}`.
 *
 * Invariants:
 *   #1 — This BC only writes its own aggregate.
 *   #5 — Custom Claims are a permission cache, not the source of truth.
 *   R2  — CRITICAL_LANE semantics: high-priority, not synchronous.
 */
⋮----
import { publishOrgEvent } from '@/features/organization.slice';
import {
  type CommandResult,
  commandSuccess,
  commandFailureFrom,
} from '@/features/shared-kernel';
import { setDocument, updateDocument } from '@/shared/infra/firestore/firestore.write.adapter';
import type { OrganizationRole } from '@/shared/types';
⋮----
export interface AccountRoleRecord {
  accountId: string;
  orgId: string;
  role: OrganizationRole;
  grantedBy: string;
  grantedAt: string;
  revokedAt?: string;
  isActive: boolean;
  /** TraceID propagated from CBG_ENTRY for auditability [R8]. */
  traceId?: string;
}
⋮----
/** TraceID propagated from CBG_ENTRY for auditability [R8]. */
⋮----
export interface AssignRoleInput {
  accountId: string;
  orgId: string;
  role: OrganizationRole;
  grantedBy: string;
  /** Optional trace identifier propagated from CBG_ENTRY [R8]. */
  traceId?: string;
}
⋮----
/** Optional trace identifier propagated from CBG_ENTRY [R8]. */
⋮----
/**
 * Assigns an org-level role to an account.
 * Publishes OrgMemberJoined event downstream — triggers CUSTOM_CLAIMS refresh.
 * Emits TOKEN_REFRESH_SIGNAL after role change so the frontend refreshes its token. [R2]
 */
export async function assignAccountRole(input: AssignRoleInput): Promise<CommandResult>
⋮----
// TOKEN_REFRESH_SIGNAL [R2]: notify frontend that claims have changed.
// Wrapped in try-catch: a signal failure must NOT roll back the role assignment.
// Frontend will re-sync on next token expiry / page reload in the worst case.
⋮----
/**
 * Revokes an org-level role from an account.
 * Publishes OrgMemberLeft event downstream — triggers CUSTOM_CLAIMS refresh.
 * Emits TOKEN_REFRESH_SIGNAL after role change so the frontend refreshes its token. [R2]
 * [R8] traceId propagated from CBG_ENTRY into event publish and signal document.
 */
export async function revokeAccountRole(
  accountId: string,
  orgId: string,
  revokedBy: string,
  traceId?: string
): Promise<CommandResult>
⋮----
// TOKEN_REFRESH_SIGNAL [R2]: notify frontend that claims have changed.
// Wrapped in try-catch: a signal failure must NOT roll back the role revocation.
⋮----
// ---------------------------------------------------------------------------
// TOKEN_REFRESH_SIGNAL helper [R2]
// ---------------------------------------------------------------------------
⋮----
/** Reason that triggered the token refresh signal. */
export type TokenRefreshReason = 'role:assigned' | 'role:revoked' | 'claims:refreshed';
⋮----
/** Shape of the signal document written to Firestore. */
export interface TokenRefreshSignal {
  accountId: string;
  reason: TokenRefreshReason;
  /** ISO 8601 timestamp. Frontend uses this to detect new signals (idempotent on repeat). */
  issuedAt: string;
  /** [R8] Trace identifier propagated from CBG_ENTRY for distributed tracing. */
  traceId?: string;
}
⋮----
/** ISO 8601 timestamp. Frontend uses this to detect new signals (idempotent on repeat). */
⋮----
/** [R8] Trace identifier propagated from CBG_ENTRY for distributed tracing. */
⋮----
/**
 * Writes a TOKEN_REFRESH_SIGNAL document that notifies the frontend to force a
 * token refresh. [R2]
 *
 * Stored at: tokenRefreshSignals/{accountId}
 * Frontend onSnapshot listener calls user.getIdToken(true) when this changes.
 *
 * Semantics: high-priority eventual consistency.
 * (Not synchronous — Firebase architecture does not allow synchronous claims propagation.)
 *
 * Security: accountId is validated against a safe Firestore document ID pattern
 * to prevent path-traversal injection [OWASP: A01 / CWE-22].
 */
async function emitTokenRefreshSignal(
  accountId: string,
  reason: TokenRefreshReason,
  traceId?: string
): Promise<void>
⋮----
// Guard against path-traversal: accountId must be a safe Firestore document ID
// (alphanumeric, hyphens, underscores only — no slashes or special chars).
````

## File: src/features/account.slice/gov.role/_components/permission-matrix-view.tsx
````typescript
import { ShieldCheck, ShieldAlert, Users, AlertCircle } from "lucide-react"
import { useState, useEffect, useMemo } from "react"
⋮----
import { useAccount } from "@/features/workspace.slice"
import { useApp } from "@/shared/app-providers/app-context"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/shadcn-ui/table"
⋮----
// DEPRECATED FOR WRITE: This permission matrix visualises mappings between internal teams and
// workspaces. The WorkspaceMembersManagement component handles writes. This is read-only.
//
// ARCHITECTURAL NOTE (cross-BC read):
// This view intentionally reads `workspaces` from WorkspaceContainer (useAccount) because its
// sole purpose is to display the CROSS-BC permission mapping between Subject Center teams and
// Workspace Container workspaces. This is an accepted read-only view-layer cross-BC dependency.
// Long-term: this component should migrate to workspace-governance.role (WorkspaceContainer)
// where the workspace data dependency is natural.
⋮----
const hasAccess = (teamId: string, workspaceId: string) =>
````

## File: src/features/account.slice/gov.role/_components/permission-tree.tsx
````typescript
import { Shield } from "lucide-react";
⋮----
import { Badge } from "@/shared/shadcn-ui/badge";
import { Card, CardContent } from "@/shared/shadcn-ui/card";
import { type OrganizationRole } from "@/shared/types";
⋮----
interface PermissionTreeProps {
  currentRole: OrganizationRole;
  t: (key: string) => string;
}
⋮----
function PermissionTier(
⋮----
name=
````

## File: src/features/account.slice/gov.role/_hooks/use-account-role.ts
````typescript
/**
 * account-governance.role — _hooks/use-account-role.ts
 *
 * React hook for subscribing to an account's org roles.
 */
⋮----
import { useState, useEffect } from 'react';
⋮----
import type { AccountRoleRecord } from '../_actions';
import { subscribeToAccountRoles } from '../_queries';
⋮----
export function useAccountRole(accountId: string | null)
````

## File: src/features/account.slice/gov.role/_queries.ts
````typescript
/**
 * account-governance.role — _queries.ts
 *
 * Read queries for account role management.
 */
⋮----
import { db } from '@/shared/infra/firestore/firestore.client';
import { collection, query, where, onSnapshot, type Unsubscribe } from '@/shared/infra/firestore/firestore.read.adapter';
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
⋮----
import type { AccountRoleRecord } from './_actions';
⋮----
/**
 * Fetches the role record for a specific account in an org.
 */
export async function getAccountRole(
  accountId: string,
  orgId: string
): Promise<AccountRoleRecord | null>
⋮----
/**
 * Subscribes to all active roles for an account across all orgs.
 * Returns an unsubscribe function.
 */
export function subscribeToAccountRoles(
  accountId: string,
  onUpdate: (roles: AccountRoleRecord[]) => void
): Unsubscribe
````

## File: src/features/account.slice/gov.role/index.ts
````typescript
/**
 * account-governance.role — Public API
 *
 * Account-level role management. Role changes trigger CUSTOM_CLAIMS refresh.
 *
 * Per logic-overview.md: ACCOUNT_ROLE → CUSTOM_CLAIMS
 */
````

## File: src/features/account.slice/index.ts
````typescript
/**
 * account.slice — Public API
 *
 * Consolidated VS2 Account vertical slice.
 * Covers: User Profile, User Wallet,
 *         Account Governance Role, Account Governance Policy.
 *
 * Organization sub-domains (Org Members, Org Partners, Org Policy,
 * Org Teams, Org Core, Org Event Bus) have been migrated to
 * @/features/organization.slice (VS4).
 *
 * Notification delivery (VS7) has been moved to notification-hub.slice.
 *
 * External consumers import exclusively from this file.
 */
⋮----
// =================================================================
// User Profile (account-user.profile)
// =================================================================
⋮----
// =================================================================
// User Wallet (account-user.wallet)
// Strong-consistency financial ledger [SK_READ_CONSISTENCY: STRONG_READ]
// =================================================================
⋮----
// =================================================================
// Governance: Account Role (account-governance.role)
// Role changes trigger CUSTOM_CLAIMS refresh [S6]
// =================================================================
⋮----
// =================================================================
// Governance: Account Policy (account-governance.policy)
// Policy changes trigger CUSTOM_CLAIMS refresh [S6]
// =================================================================
````

## File: src/features/account.slice/user.profile/_actions.ts
````typescript
/**
 * @fileoverview user.commands.ts - Pure business logic for user account operations.
 * @description Contains framework-agnostic action functions for creating user
 * accounts and managing user profiles. These functions can be called from React
 * hooks, context, or future Server Actions without any React dependencies.
 *
 * Per logic-overview.md [R4] COMMAND_RESULT_CONTRACT:
 *   All mutations return CommandResult discriminated union.
 */
⋮----
import {
  type CommandResult,
  commandSuccess,
  commandFailureFrom,
} from "@/features/shared-kernel";
import {
  createUserAccount as createUserAccountFacade,
  updateUserProfile as updateUserProfileFacade,
} from "@/shared/infra/firestore/firestore.facade";
import { uploadProfilePicture as uploadProfilePictureFacade } from "@/shared/infra/storage/storage.facade";
import type { Account } from "@/shared/types";
⋮----
export async function createUserAccount(
  userId: string,
  name: string,
  email: string
): Promise<CommandResult>
⋮----
export async function updateUserProfile(
  userId: string,
  data: Partial<Account>
): Promise<CommandResult>
⋮----
/**
 * Uploads a profile picture for the given user and returns the download URL.
 */
export async function uploadUserAvatar(
  userId: string,
  file: File,
): Promise<string>
````

## File: src/features/account.slice/user.profile/_components/preferences-card.tsx
````typescript
import { Bell } from "lucide-react";
⋮----
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/shadcn-ui/card";
import { Label } from "@/shared/shadcn-ui/label";
import { Separator } from "@/shared/shadcn-ui/separator";
import { Switch } from "@/shared/shadcn-ui/switch";
⋮----
export function PreferencesCard()
````

## File: src/features/account.slice/user.profile/_components/profile-card.tsx
````typescript
import { User, Loader2, Upload } from "lucide-react";
import type React from "react"
⋮----
import { SKILLS, SKILL_GROUPS, SKILL_SUB_CATEGORY_BY_KEY } from "@/shared/constants/skills"
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/shadcn-ui/avatar";
import { Badge } from "@/shared/shadcn-ui/badge";
import { Button } from "@/shared/shadcn-ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/shared/shadcn-ui/card";
import { Checkbox } from "@/shared/shadcn-ui/checkbox";
import { Input } from "@/shared/shadcn-ui/input";
import { Label } from "@/shared/shadcn-ui/label";
import { Textarea } from "@/shared/shadcn-ui/textarea";
import { type SkillGrant, type Account } from "@/shared/types"
⋮----
interface ProfileCardProps {
  account: Account | null
  name: string
  setName: (name: string) => void
  bio: string
  setBio: (bio: string) => void
  skillGrants: SkillGrant[]
  onSkillToggle: (slug: string) => void
  handleSaveProfile: () => void
  handleAvatarUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  isSaving: boolean
  isUploading: boolean
  avatarInputRef: React.RefObject<HTMLInputElement | null>
}
⋮----
<Button onClick=
⋮----
{/* 大項目 */}
⋮----
{/* 子項目 */}
````

## File: src/features/account.slice/user.profile/_components/security-card.tsx
````typescript
import { AlertTriangle } from "lucide-react";
⋮----
import { Button } from "@/shared/shadcn-ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/shadcn-ui/card";
⋮----
interface SecurityCardProps {
  onWithdraw: () => void;
  t: (key: string) => string;
}
````

## File: src/features/account.slice/user.profile/_components/user-settings-view.tsx
````typescript
import { useI18n } from "@/config/i18n/i18n-provider"
import { PageHeader } from "@/shared/ui/page-header"
⋮----
import { UserSettings } from "./user-settings"
⋮----
export function UserSettingsView()
⋮----
title=
````

## File: src/features/account.slice/user.profile/_components/user-settings.tsx
````typescript
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
⋮----
import { useI18n } from "@/config/i18n/i18n-provider";
import { useAuth } from "@/shared/app-providers/auth-provider";
import { findSkill } from "@/shared/constants/skills";
import { type SkillGrant } from "@/shared/types";
import { toast } from "@/shared/utility-hooks/use-toast";
⋮----
import { useUser } from "../_hooks/use-user";
⋮----
import { PreferencesCard } from "./preferences-card";
import { ProfileCard } from "./profile-card";
import { SecurityCard } from "./security-card";
⋮----
/**
 * UserSettings - The main "smart" component for all user settings.
 * Responsibility: Manages all state and business logic for the user settings
 * section, and delegates rendering to "dumb" card components.
 */
export function UserSettings()
⋮----
const handleSaveProfile = async () =>
⋮----
const handleWithdraw = () =>
⋮----
const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) =>
⋮----
const handleSkillToggle = (slug: string) =>
````

## File: src/features/account.slice/user.profile/_hooks/use-user.ts
````typescript
import { useState, useEffect, useCallback } from 'react'
⋮----
import { useAuth } from '@/shared/app-providers/auth-provider'
import type { Account } from '@/shared/types'
⋮----
import {
  updateUserProfile as updateUserProfileAction,
  uploadUserAvatar,
} from '../_actions'
import {
  getUserProfile as getUserProfileQuery,
  subscribeToUserProfile,
} from '../_queries'
⋮----
/**
 * @fileoverview A hook for managing the current user's profile data.
 * This hook acts as the designated bridge between UI components and the
 * underlying infrastructure for user profile management.
 */
export function useUser()
⋮----
// Set up a real-time listener for the user's profile document.
⋮----
// If profile doesn't exist, create a default one.
⋮----
// Cleanup subscription on unmount
````

## File: src/features/account.slice/user.profile/_queries.ts
````typescript
/**
 * account-user.profile — _queries.ts
 *
 * Read queries for user profile data.
 *
 * Per slice standard: reads live in _queries.ts; mutations live in _actions.ts.
 */
⋮----
import {
  getUserProfile as getUserProfileFacade,
} from "@/shared/infra/firestore/firestore.facade"
import { subscribeToDocument } from '@/shared/infra/firestore/firestore.read.adapter'
import type { Account } from "@/shared/types"
⋮----
/**
 * Fetches the user account/profile document by userId.
 */
export async function getUserProfile(userId: string): Promise<Account | null>
⋮----
/**
 * Opens a real-time listener for a user's account/profile document.
 * Returns an unsubscribe function.
 */
export function subscribeToUserProfile(
  userId: string,
  onUpdate: (profile: Account | null) => void,
): () => void
````

## File: src/features/account.slice/user.profile/index.ts
````typescript

````

## File: src/features/account.slice/user.wallet/_actions.ts
````typescript
/**
 * account-user.wallet — _actions.ts
 *
 * Server actions for user wallet balance management.
 *
 * Per logic-overview.md (A1):
 *   USER_WALLET_AGGREGATE — strong consistency balance invariant.
 *   Balance must never go negative.
 *
 * Architecture:
 *   Wallet balance is stored inline on accounts/{userId}.wallet.balance.
 *   Detailed transaction history will go in accounts/{userId}/walletTransactions (future).
 *
 * Invariant #1: This BC only writes its own aggregate (user account document).
 */
⋮----
import {
  type CommandResult,
  commandSuccess,
  commandFailureFrom,
} from '@/features/shared-kernel';
import { db } from '@/shared/infra/firestore/firestore.client';
import { collection, doc } from '@/shared/infra/firestore/firestore.read.adapter';
import { runTransaction, serverTimestamp, type Transaction } from '@/shared/infra/firestore/firestore.write.adapter';
⋮----
export interface WalletTransaction {
  id?: string;
  accountId: string;
  type: 'credit' | 'debit';
  amount: number;
  reason: string;
  referenceId?: string;
  occurredAt: ReturnType<typeof serverTimestamp>;
}
⋮----
export interface TopUpInput {
  accountId: string;
  amount: number;
  reason: string;
  referenceId?: string;
  /** Optional trace identifier propagated from CBG_ENTRY [R8]. */
  traceId?: string;
}
⋮----
/** Optional trace identifier propagated from CBG_ENTRY [R8]. */
⋮----
export interface DebitInput {
  accountId: string;
  amount: number;
  reason: string;
  referenceId?: string;
  /** Optional trace identifier propagated from CBG_ENTRY [R8]. */
  traceId?: string;
}
⋮----
/** Optional trace identifier propagated from CBG_ENTRY [R8]. */
⋮----
/**
 * Credits the wallet balance.
 * Uses a Firestore transaction to ensure atomic read-modify-write.
 * Appends a ledger entry to the walletTransactions sub-collection.
 */
export async function creditWallet(input: TopUpInput): Promise<CommandResult>
⋮----
/**
 * Debits the wallet balance.
 * Enforces non-negative balance invariant.
 */
export async function debitWallet(input: DebitInput): Promise<CommandResult>
````

## File: src/features/account.slice/user.wallet/_hooks/use-wallet.ts
````typescript
/**
 * account-user.wallet — _hooks/use-wallet.ts
 *
 * React hook for subscribing to a user's wallet balance.
 */
⋮----
import { useState, useEffect } from 'react';
⋮----
import type { Wallet } from '@/shared/types';
⋮----
import { subscribeToWalletBalance, subscribeToWalletTransactions } from '../_queries';
import type { WalletTransactionRecord } from '../_queries';
⋮----
export function useWallet(accountId: string | null)
⋮----
const checkReady = () =>
````

## File: src/features/account.slice/user.wallet/_queries.ts
````typescript
/**
 * account-user.wallet — _queries.ts
 *
 * Read queries for user wallet balance and transaction history.
 */
⋮----
import { db } from '@/shared/infra/firestore/firestore.client';
import { doc, collection, query, orderBy, limit, onSnapshot, type Unsubscribe } from '@/shared/infra/firestore/firestore.read.adapter';
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
import type { Account, Wallet } from '@/shared/types';
⋮----
/**
 * Fetches the wallet balance for a user account.
 */
export async function getWalletBalance(accountId: string): Promise<number>
⋮----
/**
 * Subscribes to real-time wallet balance updates for a user.
 */
export function subscribeToWalletBalance(
  accountId: string,
  onUpdate: (wallet: Wallet) => void
): Unsubscribe
⋮----
export interface WalletTransactionRecord {
  id: string;
  accountId: string;
  type: 'credit' | 'debit';
  amount: number;
  reason: string;
  referenceId?: string | null;
  occurredAt: { toMillis: () => number } | null;
}
⋮----
/**
 * Fetches recent wallet transaction history.
 */
export function subscribeToWalletTransactions(
  accountId: string,
  maxCount: number,
  onUpdate: (txs: WalletTransactionRecord[]) => void
): Unsubscribe
````

## File: src/features/account.slice/user.wallet/index.ts
````typescript
/**
 * account-user.wallet — Public API
 *
 * User personal wallet — balance management with strong consistency.
 *
 * Per logic-overview.md (A1): USER_WALLET_AGGREGATE — strong-consistency balance invariant.
 * Balance is stored inline on accounts/{userId}.wallet; transactions in sub-collection.
 */
````

## File: src/features/global-search.slice/_actions.ts
````typescript
/**
 * global-search.slice — _actions.ts
 *
 * Cross-cutting Authority — Server actions for the sole search portal. [D3]
 *
 * Per logic-overview.md [D26]:
 *   global-search.slice is the system's sole search authority.
 *   All cross-domain search requests route through these actions.
 *
 * Architecture:
 *   [D3]  All search mutations go through _actions.ts.
 *   [D26] Owns _actions.ts / _services.ts; does not parasitize shared-kernel.
 *
 * L6 Query Gateway: searches via semantic-graph's (VS8) semantic index.
 */
⋮----
import type { CommandResult } from '@/features/shared-kernel';
import { commandSuccess, commandFailureFrom } from '@/features/shared-kernel';
⋮----
import { executeSearch as executeSearchService } from './_services';
import type { ExecuteSearchInput, SearchResponse } from './_types';
⋮----
// =================================================================
// Search Execution Action
// =================================================================
⋮----
/**
 * Result wrapper for global search — carries both CommandResult and SearchResponse.
 */
export interface ExecuteGlobalSearchResult {
  readonly commandResult: CommandResult;
  readonly response: SearchResponse | null;
}
⋮----
/**
 * Execute a cross-domain search through the semantic index.
 * This is the ONLY entry point for cross-domain search in the system.
 *
 * Routes the query through semantic-graph.slice's (VS8) semantic index,
 * groups results by domain, and returns both CommandResult and SearchResponse.
 *
 * Returns CommandResult per [R4]. For search queries, aggregateId is the
 * traceId (or query string) and version is always 0 (read-only operation).
 */
export async function executeGlobalSearch(
  input: ExecuteSearchInput
): Promise<ExecuteGlobalSearchResult>
⋮----
/**
 * Simplified action that returns only CommandResult per [R4].
 * Use executeGlobalSearch when you need the SearchResponse data.
 */
export async function executeSearch(
  input: ExecuteSearchInput
): Promise<CommandResult>
````

## File: src/features/global-search.slice/_components/global-search-dialog.tsx
````typescript
/**
 * global-search.slice — GlobalSearchDialog component
 *
 * Cross-cutting Authority: the system's sole Cmd+K search portal. [D26][A12]
 *
 * Per logic-overview.md:
 *   GLOBAL_SEARCH["...Cmd+K 唯一服務提供者\n_actions.ts / _services.ts [D26]"]
 *
 * This component is the SOLE owner of the Cmd+K shortcut UI.
 * It MUST NOT live inside any business slice (D26/A12 invariant).
 *
 * Accepts pre-fetched navigation data (organizations, workspaces, members)
 * from the hosting shell; cross-domain display is mediated by this boundary.
 */
⋮----
import { Globe, Layers, User } from "lucide-react";
import { useRouter } from "next/navigation";
⋮----
import { ROUTES } from "@/shared/constants/routes";
import { Badge } from "@/shared/shadcn-ui/badge";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shared/shadcn-ui/command";
import { type Account, type Workspace, type MemberReference } from "@/shared/types";
⋮----
export interface GlobalSearchDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  organizations: Account[];
  workspaces: Workspace[];
  members: MemberReference[];
  activeOrganizationId: string | null;
  onSwitchOrganization: (organization: Account) => void;
}
⋮----
/**
 * GlobalSearchDialog — Cmd+K search portal owned by global-search.slice [D26].
 *
 * All business slices MUST use this component; they MUST NOT implement
 * their own cross-domain search or Cmd+K UI (A12 invariant).
 */
⋮----
const handleSelect = (callback: () => void) =>
⋮----
/**
 * GlobalSearch — canonical alias for GlobalSearchDialog.
 * Exposed for backward-compatible imports across the application shell.
 */
````

## File: src/features/global-search.slice/_search.test.ts
````typescript
/**
 * @test VS9 Global Search — L6 Query Gateway + Actions
 *
 * Validates:
 *   1. executeGlobalSearch — cross-domain search returning CommandResult + SearchResponse
 *   2. executeSearch — simplified R4-only variant
 *   3. _services executeSearch — L6 Query Gateway grouping
 *
 * Architecture:
 *   [D3]  Search execution via _actions.ts only.
 *   [D26] Sole search authority — all cross-domain search routes here.
 */
import { describe, it, expect, beforeEach } from 'vitest';
⋮----
import {
  indexEntity,
  removeFromIndex,
  querySemanticIndex,
} from '@/features/semantic-graph.slice';
import type { SemanticIndexEntry } from '@/features/semantic-graph.slice';
⋮----
import { executeGlobalSearch, executeSearch } from './_actions';
import { executeSearch as executeSearchService } from './_services';
⋮----
// ─── Index seeding ────────────────────────────────────────────────────────────
⋮----
function clearIndex(): void
⋮----
function seedIndex(): void
⋮----
// ═══════════════════════════════════════════════════════════════════
// L6 Query Gateway (_services.ts)
// ═══════════════════════════════════════════════════════════════════
⋮----
// ═══════════════════════════════════════════════════════════════════
// executeGlobalSearch (_actions.ts)
// ═══════════════════════════════════════════════════════════════════
⋮----
// ═══════════════════════════════════════════════════════════════════
// executeSearch — simplified R4 variant
// ═══════════════════════════════════════════════════════════════════
````

## File: src/features/global-search.slice/_services.ts
````typescript
/**
 * global-search.slice — _services.ts
 *
 * Cross-cutting Authority — L6 Query Gateway implementation.
 *
 * Queries semantic-graph.slice (VS8) semantic index for cross-domain
 * (Workspace / Member / Schedule / Tag) search results.
 *
 * Per logic-overview.md [D26]:
 *   global-search.slice is the sole search authority.
 *   Queries VS8 semantic index; does NOT access Firestore directly.
 *
 * Architecture:
 *   [D8]  Logic lives HERE, not in shared-kernel.
 *   [D24] No direct firebase imports — queries semantic index only.
 *   [D26] global-search.slice owns its services.
 */
⋮----
import { querySemanticIndex } from '@/features/semantic-graph.slice';
⋮----
import type {
  ExecuteSearchInput,
  SearchResponse,
  GroupedSearchResult,
  SearchDomain,
} from './_types';
⋮----
// =================================================================
// L6 Query Gateway — Cross-Domain Search
// =================================================================
⋮----
/**
 * Execute a cross-domain search via VS8's semantic index.
 * Groups results by domain for structured UI rendering.
 */
export function executeSearch(
  input: ExecuteSearchInput
): SearchResponse
````

## File: src/features/global-search.slice/_types.ts
````typescript
/**
 * global-search.slice — _types.ts
 *
 * Cross-cutting Authority — Domain Types for the system's sole search portal.
 *
 * Per logic-overview.md [D26]:
 *   global-search.slice = sole search authority.
 *   All cross-domain search MUST route through this slice.
 *
 * Architecture:
 *   [D3]  Search execution via _actions.ts only.
 *   [D19] Core search contracts in shared-kernel/semantic-primitives.
 *   [D26] global-search.slice owns _actions.ts / _services.ts per D3;
 *         must not parasitize shared-kernel per D8.
 *
 * Dependency rule: ZERO infrastructure imports.
 */
⋮----
import type {
  SearchDomain,
  SemanticSearchQuery,
  SemanticSearchHit,
  SemanticSearchResult,
} from '@/features/shared-kernel';
⋮----
// ─── Search Filter Types ──────────────────────────────────────────────────────
⋮----
/**
 * Date range filter for scoping search results.
 */
export interface DateRangeFilter {
  readonly from?: string;
  readonly to?: string;
}
⋮----
/**
 * Unified search filters combining domain, tag, and temporal constraints.
 */
export interface SearchFilters {
  readonly domains?: readonly SearchDomain[];
  readonly tagSlugs?: readonly string[];
  readonly dateRange?: DateRangeFilter;
  readonly orgId?: string;
  readonly workspaceId?: string;
  readonly createdBy?: string;
}
⋮----
// ─── Search State (Client-side) ───────────────────────────────────────────────
⋮----
/**
 * Client-side search state for the Cmd+K search portal.
 */
export interface SearchState {
  readonly query: string;
  readonly filters: SearchFilters;
  readonly results: SemanticSearchResult | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  /** Recent search queries for autocomplete. */
  readonly recentQueries: readonly string[];
}
⋮----
/** Recent search queries for autocomplete. */
⋮----
/**
 * Initial (empty) search state.
 */
⋮----
// ─── Search Action Input/Output ───────────────────────────────────────────────
⋮----
/**
 * Input for executing a cross-domain search.
 * Wraps SemanticSearchQuery with UI-level filters.
 */
export interface ExecuteSearchInput {
  readonly query: string;
  readonly filters?: SearchFilters;
  readonly limit?: number;
  readonly cursor?: string;
  readonly traceId?: string;
}
⋮----
/**
 * Aggregated search output with per-domain grouping.
 */
export interface GroupedSearchResult {
  readonly domain: SearchDomain;
  readonly hits: readonly SemanticSearchHit[];
  readonly count: number;
}
⋮----
/**
 * Final search response returned to the UI layer.
 */
export interface SearchResponse {
  readonly query: string;
  readonly groups: readonly GroupedSearchResult[];
  readonly totalCount: number;
  readonly cursor?: string;
  readonly executedAt: string;
  readonly traceId?: string;
}
⋮----
// ─── Re-exports ───────────────────────────────────────────────────────────────
````

## File: src/features/global-search.slice/index.ts
````typescript
/**
 * global-search.slice — Public API
 *
 * Cross-cutting Authority: the system's sole search portal. [D26]
 *
 * Per logic-overview.md:
 *   global-search.slice = 語義門戶 (Semantic Portal)
 *   唯一跨域搜尋權威 · 對接 VS8 語義索引
 *
 * All cross-domain search in the system MUST route through this slice.
 * Internally delegates to semantic-graph.slice (VS8) semantic index
 * for DRY search with multi-dimensional intersection.
 *
 * Architecture:
 *   [D3]  Search mutations via _actions.ts.
 *   [D8]  Search logic in _services.ts, not shared-kernel.
 *   [D19] Core contracts defined in shared-kernel/semantic-primitives.
 *   [D26] Owns _actions.ts / _services.ts; does not parasitize shared-kernel.
 *   [#A12] Atomicity invariant: search boundary.
 *
 * External consumers import from '@/features/global-search.slice'.
 */
⋮----
// =================================================================
// Domain Types
// =================================================================
⋮----
// Re-exported shared-kernel contracts for consumer convenience
⋮----
// =================================================================
// Server Actions (all search operations go through here) [D3]
// =================================================================
⋮----
// =================================================================
// Services (L6 Query Gateway — internal, re-exported for testing)
// =================================================================
⋮----
// =================================================================
// UI Components — Cmd+K Portal [D26][A12]
// All cross-domain search UI MUST be owned here; business slices
// MUST NOT implement their own Cmd+K or cross-domain search UI.
// =================================================================
````

## File: src/features/identity.slice/_actions.ts
````typescript
/**
 * @fileoverview auth.commands.ts - Pure business logic for authentication operations.
 * @description Contains framework-agnostic action functions for Firebase Auth operations.
 * These functions can be called from React components, hooks, or future Server Actions
 * without any React dependencies.
 */
⋮----
import { createUserAccount } from '@/features/account.slice'
import {
  type CommandResult,
  commandSuccess,
  commandFailureFrom,
} from '@/features/shared-kernel'
import { authAdapter } from "@/shared/infra/auth/auth.adapter"
⋮----
/**
 * Signs in an existing user with email and password.
 * Returns CommandResult [R4] — callers should check `result.success` instead of using try/catch.
 *
 * aggregateId: Firebase Auth UID of the authenticated user.
 * version: 0 — sign-in authenticates an existing session; no versioned aggregate is written.
 */
export async function signIn(email: string, password: string): Promise<CommandResult>
⋮----
/**
 * Registers a new user with email and password, sets their display name,
 * and returns the new Firebase user's uid.
 *
 * Internal helper — not exported from the slice's public API (index.ts).
 * Called only by completeRegistration.
 */
async function registerUser(
  email: string,
  password: string,
  displayName: string
): Promise<string>
⋮----
/**
 * Signs in anonymously.
 * Returns CommandResult [R4] — callers should check `result.success` instead of using try/catch.
 *
 * aggregateId: Firebase Auth UID of the newly-created anonymous session.
 * version: 0 — anonymous sign-in creates a transient credential; no versioned aggregate is written.
 */
export async function signInAnonymously(): Promise<CommandResult>
⋮----
/**
 * Sends a password reset email.
 * Returns CommandResult [R4] — callers should check `result.success` instead of using try/catch.
 *
 * Note on aggregateId: Firebase Auth password-reset is unauthenticated — no user UID is
 * available at call time. The email address is used as the request identifier.
 * version: 0 because no versioned domain aggregate is written by this operation.
 */
export async function sendPasswordResetEmail(email: string): Promise<CommandResult>
⋮----
/**
 * Signs out the current user.
 * Returns CommandResult [R4] — callers should check `result.success` instead of using try/catch.
 *
 * Uses the current user's UID as aggregateId when available, falling back to 'anonymous'.
 * version: 0 because sign-out does not write a new aggregate version.
 */
export async function signOut(): Promise<CommandResult>
⋮----
// Capture UID before the session is cleared by signOut()
⋮----
/**
 * Registration use case: creates a Firebase Auth account and the VS2 user profile aggregate.
 * Returns CommandResult [R4] — callers should check `result.success` instead of using try/catch.
 */
export async function completeRegistration(
  email: string,
  password: string,
  name: string
): Promise<CommandResult>
````

## File: src/features/identity.slice/_claims-handler.ts
````typescript
/**
 * identity.slice — _claims-handler.ts
 *
 * CLAIMS_HANDLER — single Claims refresh trigger point [E6][S6]
 *
 * Per logic-overview.md [S6]:
 *   RoleChanged | PolicyChanged → IER CRITICAL_LANE → CLAIMS_HANDLER
 *   CLAIMS_HANDLER emits TOKEN_REFRESH_SIGNAL on success.
 *   Failure routes to DLQ SECURITY_BLOCK → DOMAIN_ERRORS alert.
 *
 * Three-way handshake parties [SK_TOKEN_REFRESH_CONTRACT S6]:
 *   VS1 (this file) — CLAIMS_HANDLER, emitter of TOKEN_REFRESH_SIGNAL
 *   IER             — routes account:role:changed / account:policy:changed via CRITICAL_LANE
 *   Frontend        — force-refreshes Firebase token on TOKEN_REFRESH_SIGNAL
 *
 * Invariant: This is the ONLY place in VS1 that handles claims refresh dispatch.
 *            Do NOT duplicate this logic elsewhere in the identity slice.
 *
 * Architecture note — Dual-path TOKEN_REFRESH_SIGNAL pattern [S6]:
 *   In the current implementation, governance slices (account-governance.role,
 *   account-governance.policy) also write TOKEN_REFRESH_SIGNAL directly to Firestore
 *   as a "fast path" within the same process (zero-latency, no outbox round-trip).
 *   The IER subscriptions below act as a DEFENSIVE / FALLBACK path that handles
 *   role or policy changes arriving through the event bus from external systems
 *   or cross-process flows. Neither path is dead code — they serve different latency
 *   and isolation requirements:
 *     • Governance direct write = same-process, synchronous, low-latency [FAST PATH]
 *     • IER CRITICAL_LANE subscription = cross-process, async, fully audited [FALLBACK]
 *
 *   Migration guidance — when to move to IER-only dispatch:
 *   Consider removing the governance direct writes and routing exclusively through IER when:
 *   (a) outbox relay latency becomes acceptable for token refresh UX (< 500 ms P95), OR
 *   (b) stricter auditability / replay guarantees are required for ALL refresh events.
 *   Migration steps: (1) Remove emitTokenRefreshSignal calls from governance _actions.ts;
 *   (2) publish account:role:changed / account:policy:changed events through the outbox;
 *   (3) verify CLAIMS_HANDLER subscriptions here fire reliably in load testing.
 *   After migration, this handler becomes the sole claims dispatcher as the invariant states.
 */
⋮----
import { logDomainError } from '@/features/observability';
import type { EventEnvelope } from '@/features/shared-kernel';
import { setDocument } from '@/shared/infra/firestore/firestore.write.adapter';
⋮----
// ---------------------------------------------------------------------------
// Internal — TOKEN_REFRESH_SIGNAL emission
// ---------------------------------------------------------------------------
⋮----
/**
 * Writes the TOKEN_REFRESH_SIGNAL document that the frontend listens on
 * via `onSnapshot('tokenRefreshSignals/{accountId}')`.
 *
 * On receiving this signal, the frontend MUST force-refresh the Firebase token
 * (getIdToken(true)) so subsequent requests carry updated Claims.
 * Per [SK_TOKEN_REFRESH_CONTRACT: CLIENT_TOKEN_REFRESH_OBLIGATION].
 */
async function emitRefreshSignal(accountId: string, traceId: string): Promise<void>
⋮----
// Guard against path-traversal: accountId must be a safe Firestore document ID
// (alphanumeric, hyphens, underscores only — no slashes or special chars).
⋮----
// ---------------------------------------------------------------------------
// Internal — CRITICAL_LANE event handler
// ---------------------------------------------------------------------------
⋮----
/**
 * Processes a claims-refresh trigger event received from IER CRITICAL_LANE.
 *
 * Success path: emits TOKEN_REFRESH_SIGNAL for the affected account.
 * Failure path: logs a SECURITY_BLOCK severity domain error [GEMINI.md §4][S6].
 *               The SECURITY_BLOCK DLQ entry is written by infra.outbox-relay when
 *               `identity:claims:refreshFailed` is emitted; this log provides the alert.
 */
async function handleClaimsRefreshTrigger(envelope: EventEnvelope): Promise<void>
⋮----
// ClaimsRefresh failure → SECURITY_BLOCK alert [S6][GEMINI.md §4]
⋮----
// ---------------------------------------------------------------------------
// Public — registration
// ---------------------------------------------------------------------------
// Public — IER lane type (mirrored from infra.event-router to avoid direct import [D1])
// ---------------------------------------------------------------------------
⋮----
/** IER delivery lane — mirrors infra.event-router IerLane [D1 compliance].
 *  Keep in sync with `IerLane` in @/features/infra.event-router/_router.ts. */
type IerLane = 'CRITICAL_LANE' | 'STANDARD_LANE' | 'BACKGROUND_LANE';
⋮----
/**
 * Subscriber registrar function — injected by the caller so that identity.slice
 * does not import infra.event-router directly [D1].
 *
 * Callers (e.g., app bootstrap or infra.* coordinator) should pass
 * `registerSubscriber` from `@/features/infra.event-router`.
 */
export type ClaimsSubscriberRegistrar = (
  eventType: string,
  handler: (envelope: EventEnvelope) => Promise<void>,
  lane: IerLane
) => () => void;
⋮----
/**
 * Registers the CLAIMS_HANDLER on IER CRITICAL_LANE for all Claims refresh triggers.
 *
 * Must be called ONCE at app startup (e.g., in app-provider or root layout server init).
 * Returns an unsubscribe function for cleanup.
 *
 * The `registerFn` parameter is the IER `registerSubscriber` function, injected by the
 * caller to avoid a direct infra.event-router import from this domain slice [D1].
 *
 * Example:
 *   import { registerSubscriber } from '@/features/infra.event-router';
 *   import { registerClaimsHandler } from '@/features/identity.slice';
 *   const unsub = registerClaimsHandler(registerSubscriber);
 *
 * Covered trigger event types [SK_TOKEN_REFRESH_CONTRACT]:
 *   - `account:role:changed`   → RoleChanged trigger
 *   - `account:policy:changed` → PolicyChanged trigger
 */
export function registerClaimsHandler(registerFn: ClaimsSubscriberRegistrar): () => void
````

## File: src/features/identity.slice/_components/auth-background.tsx
````typescript
/**
 * AuthBackground - Responsibility: Renders the decorative background effect for the authentication pages.
 */
export function AuthBackground()
````

## File: src/features/identity.slice/_components/auth-tabs-root.tsx
````typescript
import { Ghost, Loader2 } from "lucide-react";
⋮----
import { useI18n } from "@/config/i18n/i18n-provider";
import { Button } from "@/shared/shadcn-ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/shared/shadcn-ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/shadcn-ui/tabs";
import { LanguageSwitcher } from "@/shared/ui/language-switcher";
⋮----
import { LoginForm } from "./login-form";
import { RegisterForm } from "./register-form";
⋮----
interface AuthTabsRootProps {
  isLoading: boolean;
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  name: string;
  setName: (value: string) => void;
  handleAuth: (type: 'login' | 'register') => void;
  handleAnonymous: () => void;
  openResetDialog: () => void;
}
⋮----
/**
 * AuthTabsRoot - Responsibility: Manages the main authentication card, including tabs for login/register and the anonymous access option.
 */
⋮----
handleRegister=
````

## File: src/features/identity.slice/_components/login-form.tsx
````typescript
import { Mail, Lock, Loader2 } from "lucide-react";
⋮----
import { useI18n } from "@/config/i18n/i18n-provider";
import { Button } from "@/shared/shadcn-ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/shared/shadcn-ui/input-group";
import { Label } from "@/shared/shadcn-ui/label";
⋮----
interface LoginFormProps {
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  handleLogin: () => void;
  isLoading: boolean;
  onForgotPassword: () => void;
}
⋮----
/**
 * LoginForm - Responsibility: Renders the input fields and button for user login.
 */
⋮----
<form className="flex flex-1 flex-col space-y-4" onSubmit=
⋮----
<div className="h-[80px]" /> {/* Spacer */}
````

## File: src/features/identity.slice/_components/login-view.tsx
````typescript
// [職責] Wave 3 — Auth login page view (client island)
// Extracted from app/(auth)/login/page.tsx to follow the features/ view pattern.
⋮----
import { useRouter } from "next/navigation"
import { useState } from "react"
⋮----
import { useI18n } from "@/config/i18n/i18n-provider"
import { toast } from "@/shared/utility-hooks/use-toast"
⋮----
import { completeRegistration , signIn, signInAnonymously } from "../_actions"
⋮----
import { AuthBackground } from "./auth-background"
import { AuthTabsRoot } from "./auth-tabs-root"
⋮----
/**
 * LoginView — The "smart" auth container.
 * Manages all auth state and delegates rendering to _components/.
 * Reset password is handled by @modal/(.)reset-password intercepting route.
 * app/(auth)/login/page.tsx is now a thin RSC wrapper that renders this.
 */
export function LoginView()
⋮----
const handleAuth = async (type: "login" | "register") =>
⋮----
const handleAnonymous = async () =>
````

## File: src/features/identity.slice/_components/register-form.tsx
````typescript
import { Mail, User, Lock, Loader2 } from "lucide-react";
⋮----
import { useI18n } from "@/config/i18n/i18n-provider";
import { Button } from "@/shared/shadcn-ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/shared/shadcn-ui/input-group";
import { Label } from "@/shared/shadcn-ui/label";
⋮----
interface RegisterFormProps {
  name: string;
  setName: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  handleRegister: () => void;
  isLoading: boolean;
}
⋮----
/**
 * RegisterForm - Responsibility: Renders the input fields and button for user registration.
 */
⋮----
<form className="flex flex-1 flex-col space-y-4" onSubmit=
⋮----
<InputGroupInput id="r-name" autoComplete="name" value=
````

## File: src/features/identity.slice/_components/reset-password-dialog.tsx
````typescript
import { Mail } from "lucide-react";
⋮----
import { useI18n } from "@/config/i18n/i18n-provider";
import { Button } from "@/shared/shadcn-ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/shared/shadcn-ui/dialog";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/shared/shadcn-ui/input-group";
import { Label } from "@/shared/shadcn-ui/label";
⋮----
interface ResetPasswordDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  setEmail: (value: string) => void;
  handleSendResetEmail: () => void;
}
⋮----
/**
 * ResetPasswordDialog - Responsibility: Encapsulates the UI and logic for the password reset modal.
 */
````

## File: src/features/identity.slice/_components/reset-password-form.tsx
````typescript
import { Mail } from "lucide-react";
import { useState } from "react";
⋮----
import { useI18n } from "@/config/i18n/i18n-provider";
import { Button } from "@/shared/shadcn-ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/shared/shadcn-ui/input-group";
import { Label } from "@/shared/shadcn-ui/label";
import { toast } from "@/shared/utility-hooks/use-toast";
⋮----
import { sendPasswordResetEmail } from "../_actions";
⋮----
interface ResetPasswordFormProps {
  defaultEmail?: string;
  onSuccess: () => void;
  onCancel: () => void;
}
⋮----
const handleSend = async () =>
````

## File: src/features/identity.slice/_token-refresh-listener.ts
````typescript
/**
 * identity.slice — _token-refresh-listener.ts
 *
 * Frontend Party [S6] — Client Token Refresh Listener
 *
 * Per logic-overview.md [S6] three-way Claims refresh handshake:
 *   Party 1 (VS1) — CLAIMS_HANDLER emits TOKEN_REFRESH_SIGNAL to `tokenRefreshSignals/{accountId}`
 *   Party 2 (IER) — routes RoleChanged / PolicyChanged via CRITICAL_LANE to CLAIMS_HANDLER
 *   Party 3 (Frontend — this file) — listens for TOKEN_REFRESH_SIGNAL and force-refreshes token
 *
 * Client obligation per SK_TOKEN_REFRESH_CONTRACT:
 *   On receiving TOKEN_REFRESH_SIGNAL → getIdToken(true) → new token attached to requests
 *
 * Invariant: this listener MUST be mounted once per authenticated session in the shell layout.
 */
⋮----
import { useEffect } from 'react';
⋮----
import type { ImplementsTokenRefreshContract } from '@/features/shared-kernel';
import { auth } from '@/shared/infra/auth/auth.client';
import { db } from '@/shared/infra/firestore/firestore.client';
import { onSnapshot, doc } from '@/shared/infra/firestore/firestore.read.adapter';
⋮----
// Marker — confirms this module fulfils Party 3 of the SK_TOKEN_REFRESH_CONTRACT [S6]
⋮----
/**
 * React hook — mounts an onSnapshot listener on `tokenRefreshSignals/{accountId}`.
 * When the document changes (TOKEN_REFRESH_SIGNAL received), force-refreshes the
 * Firebase ID token so subsequent requests carry updated Custom Claims.
 *
 * Call once per authenticated session (e.g. in (shell)/layout.tsx).
 *
 * @param accountId - The authenticated user's account ID, or null/undefined when not signed in.
 */
export function useTokenRefreshListener(accountId: string | null | undefined): void
⋮----
// Guard: accountId must be a valid Firestore document ID
⋮----
// onSnapshot fires on first attach (initial state) and on every subsequent change.
// We skip the first emission to avoid unnecessary token refreshes on mount.
⋮----
// [S6] CLIENT_TOKEN_REFRESH_OBLIGATION: force-refresh so subsequent requests
// carry updated Custom Claims reflecting the new role or policy.
void currentUser.getIdToken(/* forceRefresh */ true).catch(() => {
// Non-fatal: the token will be refreshed on the next natural expiry cycle.
// Governance slices will detect stale claims via DLQ SECURITY_BLOCK if required.
````

## File: src/features/identity.slice/index.ts
````typescript
// [S6] CLAIMS_HANDLER — must be registered once at app startup via injected registrar [D1]
⋮----
// [S6] Frontend Party 3 — must be mounted once per authenticated session
````

## File: src/features/infra.dlq-manager/_dlq.ts
````typescript
/**
 * infra.dlq-manager — _dlq.ts
 *
 * Dead-Letter Queue tier classification [R5]
 *
 * Per logic-overview.md [R5] DLQ 三級策略:
 *
 *   SAFE_AUTO       — TagLifecycle・MemberJoined/Left (idempotent, auto-retry)
 *   REVIEW_REQUIRED — WalletDeducted・ScheduleAssigned・SkillRecognitionGranted/Revoked
 *                     (financial/assignment, human review before replay)
 *   SECURITY_BLOCK  — RoleChanged・PolicyChanged・OrgPolicyChanged・ClaimsRefresh failure
 *                     (security event: alert + entity freeze + manual authorization before any replay)
 *                     [GEMINI.md §4: auto-replay FORBIDDEN for SECURITY_BLOCK]
 *
 * The infra.outbox-relay worker attaches a `dlqLevel` to every entry it routes to the DLQ
 * so that DLQ consumers can enforce the correct replay policy without inspecting the
 * event payload again.
 *
 * Invariant: WalletDeducted MUST NOT be auto-replayed — double-deduction risk.
 * Invariant: RoleChanged/PolicyChanged (account AND org) MUST route to SECURITY_BLOCK.
 *            [logic-overview.md VS2 ACC_OUTBOX, VS4 ORG_OUTBOX, GEMINI.md §4]
 * Invariant: SkillRecognitionGranted/Revoked MUST route to REVIEW_REQUIRED.
 *            [logic-overview.md VS4 ORG_OUTBOX: SkillRecog → REVIEW_REQUIRED]
 * Invariant: ClaimsRefresh failure MUST trigger security alert and account freeze.
 */
⋮----
/** The three DLQ safety tiers defined by v9 [R5]. */
export type DlqLevel = 'SAFE_AUTO' | 'REVIEW_REQUIRED' | 'SECURITY_BLOCK';
⋮----
/**
 * A single entry in the Dead-Letter Queue.
 *
 * `originalEnvelopeJson` preserves the exact bytes of the failed event so that
 * replay can re-submit it with the original `idempotencyKey` intact [D8].
 */
export interface DlqEntry {
  /** Unique DLQ entry identifier. */
  readonly dlqId: string;
  /** Safety tier — determines replay policy. */
  readonly dlqLevel: DlqLevel;
  /** The outbox/OUTBOX lane this event originated from. */
  readonly sourceLane: string;
  /** Serialized original EventEnvelope (preserves idempotencyKey for replay). */
  readonly originalEnvelopeJson: string;
  /** ISO 8601 timestamp of when the event first failed. */
  readonly firstFailedAt: string;
  /** Number of delivery attempts made before entering DLQ. */
  readonly attemptCount: number;
  /** Human-readable reason for the last failure. */
  readonly lastError: string;
}
⋮----
/** Unique DLQ entry identifier. */
⋮----
/** Safety tier — determines replay policy. */
⋮----
/** The outbox/OUTBOX lane this event originated from. */
⋮----
/** Serialized original EventEnvelope (preserves idempotencyKey for replay). */
⋮----
/** ISO 8601 timestamp of when the event first failed. */
⋮----
/** Number of delivery attempts made before entering DLQ. */
⋮----
/** Human-readable reason for the last failure. */
⋮----
/**
 * Maps an event type to its DLQ safety tier. [R5]
 *
 * Any event type not in this map defaults to SAFE_AUTO — add entries
 * explicitly when a new high-risk event type is introduced.
 */
⋮----
// SECURITY_BLOCK: security events — alert + entity freeze + manual authorization before any replay.
// [logic-overview.md VS2 ACC_OUTBOX] [GEMINI.md §4: auto-replay FORBIDDEN]
⋮----
// [logic-overview.md VS4 ORG_OUTBOX: "RoleChanged・PolicyChanged → SECURITY_BLOCK"]
// Org role changes affect access control with the same severity as account role changes.
⋮----
// SECURITY_BLOCK: org policy changes carry security implications identical to account
// policy changes — alert + org freeze + manual authorization required.
// [logic-overview.md VS4 ORG_OUTBOX: PolicyChanged → SECURITY_BLOCK]
⋮----
// REVIEW_REQUIRED: financial and irreversible assignment events must not auto-replay.
⋮----
// SkillRecognitionGranted/Revoked: org-level acknowledgment events that affect member
// standing — require human review before replay. [logic-overview.md VS4 ORG_OUTBOX]
⋮----
// Per logic-overview.md VS6 SCHED_OUTBOX: "Compensating Events → SAFE_AUTO".
⋮----
/**
 * Returns the DLQ tier for a given event type.
 *
 * Defaults to SAFE_AUTO for unknown/unlisted event types (e.g. TagLifecycle,
 * MemberJoined) which are idempotent and safe to auto-retry.
 */
export function getDlqLevel(eventType: string): DlqLevel
````

## File: src/features/infra.dlq-manager/index.ts
````typescript
/**
 * infra.dlq-manager — Public API
 *
 * Dead-Letter Queue (DLQ) fault-containment center. [R5]
 *
 * Per logic-overview.md [R5] DLQ 三級策略 and tree.md:
 *   infra.dlq-manager = [R5] 故障收容中心 (SAFE_AUTO / REVIEW_REQUIRED / SECURITY_BLOCK)
 *
 * Consumers:
 *   - infra.outbox-relay: attaches dlqLevel to every DLQ entry it writes.
 *   - DLQ admin tooling: reads dlqLevel to determine replay policy.
 */
````

## File: src/features/infra.event-router/_router.ts
````typescript
/**
 * infra.event-router — _router.ts
 *
 * [IER] Integration Event Router [R2]
 *
 * Per logic-overview.md [R2]:
 *   OUTBOX_RELAY_WORKER -->|deliver| IER
 *   IER -.->|CRITICAL_LANE|    WALLET_AGG / AUTH
 *   IER -.->|STANDARD_LANE|   SCHEDULE / MEMBER / ROLE
 *   IER -.->|BACKGROUND_LANE| TAG_SUBSCRIBER / AUDIT / FCM
 *
 * Responsibilities:
 *   - Receive events from infra.outbox-relay via publishToLane (IerDeliveryFn)
 *   - Route by lane + eventType to all registered subscribers (fan-out)
 *   - Provide registerSubscriber for slices to declare interest
 *
 * Invariants:
 *   D9 — traceId is read from the envelope and forwarded; never overwritten by IER.
 *   R8 — All events carry traceId from the originating Command.
 */
⋮----
import type { EventEnvelope } from '@/features/shared-kernel';
⋮----
// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
⋮----
/** IER delivery lane classification. [R2] */
export type IerLane = 'CRITICAL_LANE' | 'STANDARD_LANE' | 'BACKGROUND_LANE';
⋮----
type EventHandler = (envelope: EventEnvelope) => Promise<void>;
⋮----
interface Subscriber {
  readonly eventType: string | '*';
  readonly lane: IerLane | '*';
  readonly handler: EventHandler;
}
⋮----
// ---------------------------------------------------------------------------
// Subscriber registry (module-level singleton)
// ---------------------------------------------------------------------------
⋮----
// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
⋮----
/**
 * Register a handler for a specific event type and lane.
 * Use `'*'` for eventType to match all event types.
 * Use `'*'` for lane to receive events from all lanes.
 * Returns an unsubscribe function.
 *
 * Example (VS4_TAG_SUBSCRIBER):
 *   const unsub = registerSubscriber('tag:created', onTagCreated, 'BACKGROUND_LANE');
 */
export function registerSubscriber(
  eventType: string | '*',
  handler: EventHandler,
  lane: IerLane | '*' = '*'
): () => void
⋮----
/**
 * Route an event envelope to all subscribers matching the event type and lane.
 * Called by publishToLane after the relay delivers an outbox entry.
 */
export async function routeEvent(envelope: EventEnvelope, lane: IerLane): Promise<void>
⋮----
/**
 * IER delivery entry point — compatible with IerDeliveryFn from infra.outbox-relay.
 *
 * Wire this as the delivery function when starting outbox relay workers:
 *   startOutboxRelay('tagOutbox', publishToLane);
 *   startOutboxRelay('workspaceOutbox', publishToLane);
 */
export async function publishToLane(
  lane: IerLane,
  envelope: unknown
): Promise<void>
````

## File: src/features/infra.event-router/index.ts
````typescript
/**
 * infra.event-router — Public API
 *
 * [IER] Integration Event Router — CRITICAL/STANDARD/BACKGROUND lanes [R2]
 *
 * Per logic-overview.md [R2]:
 *   OUTBOX_RELAY_WORKER delivers to IER → IER fan-outs to lane subscribers.
 *
 * Lane definitions:
 *   CRITICAL_LANE:    WalletDeducted, ClaimsRefreshed, RoleChanged
 *   STANDARD_LANE:    ScheduleAssigned, MemberJoined, MemberRemoved
 *   BACKGROUND_LANE:  TagCreated, TagUpdated, AuditLogged, FCMDelivered
 *
 * Usage (application bootstrap):
 *   import { registerSubscriber, publishToLane } from '@/features/infra.event-router';
 *   import { startOutboxRelay } from '@/features/infra.outbox-relay';
 *
 *   registerSubscriber('tag:created', onTagCreated, 'BACKGROUND_LANE');
 *   startOutboxRelay('tagOutbox', publishToLane);
 */
⋮----
/** IER delivery lane classification. [R2] */
````

## File: src/features/infra.external-triggers/_guard.ts
````typescript
/**
 * infra.external-triggers — _guard.ts
 *
 * [L0] External Triggers — ResilienceGuard [S5]
 *
 * Per logic-overview_v1.md L0 · External Triggers:
 *   EXT_CLIENT  — Next.js _actions.ts → rate-limit → circuit-break → CBG_ENTRY
 *   EXT_WEBHOOK — Webhook / Edge Fn  → rate-limit → circuit-break → (handler)
 *   EXT_AUTH    — Firebase Auth      → AUTH_ID    → ID_LINK      → CTX_MGR
 *
 * This module provides an in-process ResilienceGuard implementing [S5]:
 *   R1 rate-limit   : per user ∪ per org → 429 + Retry-After
 *   R2 circuit-break: consecutive 5xx → open; half-open probe recovery
 *   R3 bulkhead     : slice isolation; fault does not cross slice boundary
 *
 * Usage (any _actions.ts entry point):
 *   const guard = createExternalTriggerGuard('workspace-application');
 *   const check = guard.check({ uid, orgId });
 *   if (!check.allowed) throw new RateLimitError(check.retryAfterMs);
 *
 * Invariants:
 *   D17 — All non-`_actions.ts` external entries must satisfy SK_RESILIENCE_CONTRACT [S5]
 *   D10 — traceId is NOT generated here; it is injected at CBG_ENTRY [R8]
 */
⋮----
import type {
  RateLimitConfig,
  CircuitBreakerConfig,
  BulkheadConfig,
  ResilienceContract,
} from '@/features/shared-kernel';
import {
  DEFAULT_RATE_LIMIT,
  DEFAULT_CIRCUIT_BREAKER,
} from '@/features/shared-kernel';
⋮----
// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
⋮----
/** Check result returned by ResilienceGuard.check(). */
export interface GuardCheckResult {
  /** Whether the request is allowed to proceed. */
  readonly allowed: boolean;
  /** When allowed=false, milliseconds the caller should wait before retrying. */
  readonly retryAfterMs?: number;
  /** Human-readable reason when allowed=false. */
  readonly reason?: 'RATE_LIMITED' | 'CIRCUIT_OPEN' | 'BULKHEAD_FULL';
  /**
   * When allowed=true, must be called exactly once when the request completes
   * (regardless of success or failure). Decrements the bulkhead counter and
   * updates the circuit-breaker state.
   *
   * Prefer using `withGuard` which calls release automatically in a finally block.
   */
  release?: (succeeded: boolean) => void;
}
⋮----
/** Whether the request is allowed to proceed. */
⋮----
/** When allowed=false, milliseconds the caller should wait before retrying. */
⋮----
/** Human-readable reason when allowed=false. */
⋮----
/**
   * When allowed=true, must be called exactly once when the request completes
   * (regardless of success or failure). Decrements the bulkhead counter and
   * updates the circuit-breaker state.
   *
   * Prefer using `withGuard` which calls release automatically in a finally block.
   */
⋮----
/** Caller context required for per-user and per-org rate limiting. [S5 R1] */
export interface CallerContext {
  readonly uid: string;
  readonly orgId?: string;
}
⋮----
// ---------------------------------------------------------------------------
// Internal sliding-window rate limiter [S5 R1]
// ---------------------------------------------------------------------------
⋮----
interface WindowEntry {
  count: number;
  resetAt: number;
}
⋮----
function checkWindow(
  store: Map<string, WindowEntry>,
  key: string,
  limit: number,
  windowMs: number
): boolean
⋮----
// ---------------------------------------------------------------------------
// Internal circuit breaker [S5 R2]
// ---------------------------------------------------------------------------
⋮----
type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';
⋮----
interface CircuitStatus {
  state: CircuitState;
  failures: number;
  openedAt: number;
}
⋮----
function evaluateCircuit(
  status: CircuitStatus,
  cfg: CircuitBreakerConfig
): boolean
⋮----
return true; // allow probe request
⋮----
// HALF_OPEN: allow one probe
⋮----
// ---------------------------------------------------------------------------
// ResilienceGuard
// ---------------------------------------------------------------------------
⋮----
/**
 * In-process resilience guard for an external-trigger entry point.
 * One instance per slice / entry-point — created via `createExternalTriggerGuard`.
 */
export interface ResilienceGuard {
  /**
   * Check whether the incoming request should be allowed.
   * Call before any business logic in the entry point.
   *
   * When `result.allowed === true`, `result.release(succeeded)` **must** be called
   * exactly once when the request completes (in a finally block).
   * Prefer `withGuard` to avoid forgetting the release call.
   */
  check(caller: CallerContext): GuardCheckResult;
  /**
   * Convenience wrapper that calls check(), runs `handler`, and releases
   * the bulkhead slot in a finally block regardless of outcome.
   */
  withGuard<T>(caller: CallerContext, handler: () => Promise<T>): Promise<T | GuardCheckResult>;
  /** The full resilience contract declaration for this guard. [S5] */
  readonly contract: ResilienceContract;
}
⋮----
/**
   * Check whether the incoming request should be allowed.
   * Call before any business logic in the entry point.
   *
   * When `result.allowed === true`, `result.release(succeeded)` **must** be called
   * exactly once when the request completes (in a finally block).
   * Prefer `withGuard` to avoid forgetting the release call.
   */
check(caller: CallerContext): GuardCheckResult;
/**
   * Convenience wrapper that calls check(), runs `handler`, and releases
   * the bulkhead slot in a finally block regardless of outcome.
   */
withGuard<T>(caller: CallerContext, handler: ()
/** The full resilience contract declaration for this guard. [S5] */
⋮----
/**
 * Factory that creates a `ResilienceGuard` for the given slice / entry point.
 *
 * @param sliceId     Identifies the protected slice (used for bulkhead isolation).
 * @param rateCfg     Optional rate-limit override (defaults to DEFAULT_RATE_LIMIT).
 * @param cbCfg       Optional circuit-breaker override (defaults to DEFAULT_CIRCUIT_BREAKER).
 * @param bulkheadCfg Optional bulkhead override.
 */
export function createExternalTriggerGuard(
  sliceId: string,
  rateCfg: RateLimitConfig = DEFAULT_RATE_LIMIT,
  cbCfg: CircuitBreakerConfig = DEFAULT_CIRCUIT_BREAKER,
  bulkheadCfg?: Partial<BulkheadConfig>
): ResilienceGuard
⋮----
check(caller: CallerContext): GuardCheckResult
⋮----
// R1 — per-user rate limit
⋮----
// R1 — per-org rate limit
⋮----
// R2 — circuit breaker
⋮----
// R3 — bulkhead
⋮----
// Increment BEFORE returning so the slot is held from this point on.
⋮----
// Return a release function to guarantee the slot is freed [S5 R3].
const release = (succeeded: boolean): void =>
⋮----
async withGuard<T>(
      caller: CallerContext,
      handler: () => Promise<T>
): Promise<T | GuardCheckResult>
````

## File: src/features/infra.external-triggers/index.ts
````typescript
/**
 * infra.external-triggers — Public API
 *
 * [L0] External Triggers — 外部觸發入口應用層模組 [S5]
 *
 * Per logic-overview_v1.md L0 · External Triggers:
 *   所有命令寫入路徑在到達 CBG_ENTRY 前，必須通過：
 *     rate-limiter → circuit-breaker → bulkhead
 *
 * Three external trigger entry types (L0):
 *
 *   ① EXT_CLIENT  — Next.js Server Actions (`_actions.ts`)
 *     Location:   src/features/{slice}/_actions.ts  (distributed, per VSA)
 *     Compliance: [S5] use `createExternalTriggerGuard` from this module
 *     Rule:       D17 — all _actions.ts must declare ResilienceContract conformance
 *
 *   ② EXT_AUTH    — Firebase Auth entry (登入 / 註冊 / Token)
 *     Location:   src/shared/infra/auth/auth.adapter.ts  (FIREBASE_ACL)
 *     Compliance: Handled by FIREBASE_ACL adapter; no separate S5 guard needed
 *     Rule:       D24 — only auth.adapter.ts may call firebase/auth
 *
 *   ③ EXT_WEBHOOK — Webhook / Edge Function
 *     Location:   firebase/functions/src/gateway/webhook.fn.ts  (Cloud Function)
 *     Compliance: [S5] rate-limit + HMAC signature verification built in
 *     Rule:       D17 — must satisfy SK_RESILIENCE_CONTRACT [S5]
 *
 * Design Location Summary (mirrors firebase-structure.md):
 * ┌────────────────────────────────────────────────────────────────────────────┐
 * │ EXT_CLIENT  (app-layer resilience guard)                                   │
 * │   → src/features/infra.external-triggers/  (this module)                  │
 * │                                                                            │
 * │ EXT_AUTH    (FIREBASE_ACL boundary)                                        │
 * │   → src/shared/infra/auth/auth.adapter.ts                                  │
 * │                                                                            │
 * │ EXT_WEBHOOK (Cloud Function entry)                                         │
 * │   → firebase/functions/src/gateway/webhook.fn.ts                          │
 * └────────────────────────────────────────────────────────────────────────────┘
 *
 * Usage (in any _actions.ts):
 *   import { createExternalTriggerGuard } from '@/features/infra.external-triggers';
 *
 *   const guard = createExternalTriggerGuard('workspace-application');
 *
 *   export async function myAction(...): Promise<CommandResult> {
 *     return guard.withGuard({ uid, orgId }, async () => {
 *       return dispatchCommand(...);
 *     });
 *   }
 */
````

## File: src/features/infra.gateway-command/_gateway.ts
````typescript
/**
 * infra.gateway-command — _gateway.ts
 *
 * [GW] Command Bus Gateway — unified write entry point. [E4][R4][R8][Q4][Q7]
 *
 * Per logic-overview.md GW_CMD:
 *   CBG_ENTRY  — unified-command-gateway: injects TraceID [E4][R8]
 *   CBG_AUTH   — universal-authority-interceptor: AuthoritySnapshot [Q4]
 *               ACTIVE_CTX takes precedence over Claims when they conflict.
 *   CBG_ROUTE  — command-router: routes to the correct slice handler,
 *               returns SK_CMD_RESULT [R4]
 *
 * Invariants:
 *   D9  — traceId written into every envelope at entry; never overwritten downstream.
 *   R8  — All commands carry a traceId shared across the full event chain.
 *   Q7  — Three-layer guard: rate-limit → circuit-breaker → bulkhead (stub hooks provided).
 */
⋮----
import type { AuthoritySnapshot, CommandResult } from '@/features/shared-kernel';
import { commandFailureFrom } from '@/features/shared-kernel';
⋮----
// ---------------------------------------------------------------------------
// Command descriptor
// ---------------------------------------------------------------------------
⋮----
/**
 * Minimum shape every command must satisfy to be routed by the gateway.
 * Slices extend this with their own typed payloads.
 */
export interface GatewayCommand {
  /** Namespaced command type, e.g. "workspace:tasks:assign". */
  readonly commandType: string;
  /** The aggregate the command targets. */
  readonly aggregateId: string;
}
⋮----
/** Namespaced command type, e.g. "workspace:tasks:assign". */
⋮----
/** The aggregate the command targets. */
⋮----
// ---------------------------------------------------------------------------
// Command handler registry
// ---------------------------------------------------------------------------
⋮----
type CommandHandler<TCmd extends GatewayCommand = GatewayCommand> = (
  command: TCmd,
  traceId: string
) => Promise<CommandResult>;
⋮----
/**
 * Register a command handler for a given commandType.
 * Slices call this during their module initialization.
 *
 * @example
 * // src/features/workspace-application/_command-handler.ts
 * registerCommandHandler('workspace:tasks:assign', assignTaskHandler);
 */
export function registerCommandHandler<TCmd extends GatewayCommand>(
  commandType: string,
  handler: CommandHandler<TCmd>
): void
⋮----
// ---------------------------------------------------------------------------
// Gateway options
// ---------------------------------------------------------------------------
⋮----
export interface DispatchOptions {
  /**
   * Caller-supplied traceId. If omitted, a new UUID is generated at entry [E4][R8].
   * Downstream events MUST carry this value unchanged.
   */
  readonly traceId?: string;
  /**
   * Authority snapshot for the acting subject.
   * The universal-authority-interceptor uses this to enforce access control [Q4].
   * When ACTIVE_CTX and Firebase Claims conflict, ACTIVE_CTX takes precedence.
   */
  readonly authority?: AuthoritySnapshot | null;
}
⋮----
/**
   * Caller-supplied traceId. If omitted, a new UUID is generated at entry [E4][R8].
   * Downstream events MUST carry this value unchanged.
   */
⋮----
/**
   * Authority snapshot for the acting subject.
   * The universal-authority-interceptor uses this to enforce access control [Q4].
   * When ACTIVE_CTX and Firebase Claims conflict, ACTIVE_CTX takes precedence.
   */
⋮----
// ---------------------------------------------------------------------------
// CBG_ENTRY — TraceID injection [E4][R8]
// ---------------------------------------------------------------------------
⋮----
function injectTraceId(opts?: DispatchOptions): string
⋮----
// Use Node.js built-in crypto for cross-runtime compatibility (Node 14.17+/18+).
// Next.js 16 / App Router runs on Node 18+, so this is always available.
⋮----
// ---------------------------------------------------------------------------
// CBG_AUTH — universal-authority-interceptor [Q4]
// ---------------------------------------------------------------------------
⋮----
/**
 * Validates that the caller is permitted to issue the given command.
 *
 * Current implementation: presence of an AuthoritySnapshot is sufficient.
 * TODO: Enforce per-commandType RBAC checks [D12] — track in architecture backlog
 *       as "gateway-command: role-based per-commandType permission enforcement".
 *
 * ACTIVE_CTX precedence: the authority snapshot passed in here represents
 * the currently active context and overrides token Claims when they diverge [Q4].
 */
function checkAuthority(
  command: GatewayCommand,
  authority: AuthoritySnapshot | null | undefined
): CommandResult | null
⋮----
// ---------------------------------------------------------------------------
// CBG_ROUTE — command-router [R4]
// ---------------------------------------------------------------------------
⋮----
async function routeCommand(
  command: GatewayCommand,
  traceId: string
): Promise<CommandResult>
⋮----
// ---------------------------------------------------------------------------
// Public entry point: dispatchCommand
// ---------------------------------------------------------------------------
⋮----
/**
 * Unified command dispatch entry point.
 *
 * Pipeline:
 *   [Q7 guard hooks] → CBG_ENTRY (TraceID) → CBG_AUTH (authority) → CBG_ROUTE
 *
 * @example
 * const result = await dispatchCommand(
 *   { commandType: 'workspace:task:assign', aggregateId: workspaceId, ...payload },
 *   { authority: authoritySnapshot, traceId: existingTraceId }
 * );
 */
export async function dispatchCommand<TCmd extends GatewayCommand>(
  command: TCmd,
  opts?: DispatchOptions
): Promise<CommandResult>
````

## File: src/features/infra.gateway-command/index.ts
````typescript
/**
 * infra.gateway-command — Public API
 *
 * [GW] Command Bus Gateway — unified write entry point. [E4][R4][R8][Q4][Q7]
 *
 * Per logic-overview.md GW_CMD:
 *   CBG_ENTRY  — TraceID injection [E4][R8]
 *   CBG_AUTH   — universal-authority-interceptor (AuthoritySnapshot [Q4];
 *               ACTIVE_CTX wins over Claims on conflict)
 *   CBG_ROUTE  — command-router → returns SK_CMD_RESULT [R4]
 *
 * Usage (Server Actions):
 *   import { dispatchCommand, registerCommandHandler } from '@/features/infra.gateway-command';
 *
 *   // register (slice init):
 *   registerCommandHandler('workspace:task:assign', assignTaskHandler);
 *
 *   // dispatch (Server Action):
 *   const result = await dispatchCommand(
 *     { commandType: 'workspace:task:assign', aggregateId: wsId, ...payload },
 *     { authority: authoritySnapshot }
 *   );
 */
````

## File: src/features/infra.gateway-query/_registry.ts
````typescript
/**
 * infra.gateway-query — _registry.ts
 *
 * [GW] Query Gateway — unified read entry point. [Q8][P4][R7]
 *
 * Per logic-overview.md GW_QUERY:
 *   QGWAY        — read-model-registry: version comparison / snapshot routing
 *   QGWAY_SCHED  — → projection.org-eligible-member-view  [#14][#15][#16][P4][R7]
 *   QGWAY_NOTIF  — → projection.account-view             [#6 FCM Token]
 *   QGWAY_SCOPE  — → projection.workspace-scope-guard-view [#A9]
 *   QGWAY_WALLET — → projection.wallet-balance (STRONG_READ 回源 WALLET_AGG [Q8])
 *
 * Pre-registered routes mirror the v9 GW_QUERY subgraph.
 * Additional routes can be added via registerQuery (open registry).
 *
 * D5 — Wallet balance display reads from projection; transactional operations
 *      must use STRONG_READ back to WALLET_AGG.
 */
⋮----
// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
⋮----
/** Generic query handler: receives typed params, returns typed result. */
type QueryHandler<TParams = unknown, TResult = unknown> = (
  params: TParams
) => Promise<TResult>;
⋮----
/** Metadata stored alongside each registered handler. */
interface RegistryEntry<TParams = unknown, TResult = unknown> {
  readonly handler: QueryHandler<TParams, TResult>;
  /** Optional description for observability / debugging. */
  readonly description?: string;
}
⋮----
/** Optional description for observability / debugging. */
⋮----
// ---------------------------------------------------------------------------
// Registry (module-level singleton)
// ---------------------------------------------------------------------------
⋮----
// Use unknown-bounded entry so we can store heterogeneous handlers without
// a type assertion on read — callers cast via the generic executeQuery<>.
⋮----
// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
⋮----
/**
 * Register a query handler under a given name.
 *
 * Projection slices call this during module init to advertise their queries.
 * Returns an un-register function (useful in tests or hot-reload scenarios).
 *
 * @example
 * registerQuery(
 *   'org-eligible-members',
 *   (params: { orgId: string }) => getEligibleMembers(params.orgId),
 *   '[P4][R7] org-eligible-member-view'
 * );
 */
export function registerQuery<TParams, TResult>(
  name: string,
  handler: QueryHandler<TParams, TResult>,
  description?: string
): () => void
⋮----
// Store with bounded unknown types; callers recover types via executeQuery<T>().
⋮----
/**
 * Execute a registered query by name.
 *
 * @throws Error if no handler is registered for the given name.
 *
 * @example
 * const members = await executeQuery('org-eligible-members', { orgId });
 */
export async function executeQuery<TParams, TResult>(
  name: string,
  params: TParams
): Promise<TResult>
⋮----
/**
 * Returns the names of all currently registered queries.
 * Useful for observability / admin tooling.
 */
export function listRegisteredQueries(): ReadonlyArray<
⋮----
// ---------------------------------------------------------------------------
// Pre-registered v9 routes (GW_QUERY subgraph)
// These are registered as placeholder pass-throughs so the registry is
// populated at startup. Actual implementations are provided by the
// corresponding projection slices at their init time via registerQuery().
// ---------------------------------------------------------------------------
⋮----
/**
 * QGWAY_SCHED — org-eligible-member-view [#14][#15][#16][P4][R7]
 * Route key: 'org-eligible-members'
 */
⋮----
/**
 * QGWAY_NOTIF — account-view [#6 FCM Token]
 * Route key: 'account-view'
 */
⋮----
/**
 * QGWAY_SCOPE — workspace-scope-guard-view [#A9]
 * Route key: 'workspace-scope-guard'
 */
⋮----
/**
 * QGWAY_WALLET — wallet-balance (STRONG_READ → WALLET_AGG [Q8][D5])
 * Route key: 'wallet-balance'
 */
⋮----
/** [P4][R7] org-eligible-member-view — schedule eligibility */
⋮----
/** [#6] account-view — FCM token / user profile */
⋮----
/** [#A9] workspace-scope-guard-view — scope resolution for CBG_AUTH */
⋮----
/** [Q8][D5] wallet-balance — STRONG_READ back to WALLET_AGG */
⋮----
export type QueryRouteName = (typeof QUERY_ROUTES)[keyof typeof QUERY_ROUTES];
````

## File: src/features/infra.gateway-query/index.ts
````typescript
/**
 * infra.gateway-query — Public API
 *
 * [GW] Query Gateway — unified read entry point. [Q8][P4][R7]
 *
 * Per logic-overview.md GW_QUERY:
 *   read-model-registry: version comparison / snapshot routing
 *   QGWAY_SCHED  → projection.org-eligible-member-view  [#14][#15][#16][P4][R7]
 *   QGWAY_NOTIF  → projection.account-view             [#6 FCM Token]
 *   QGWAY_SCOPE  → projection.workspace-scope-guard-view [#A9]
 *   QGWAY_WALLET → projection.wallet-balance (STRONG_READ [Q8][D5])
 *
 * Usage (Server Component data fetching):
 *   import { executeQuery, QUERY_ROUTES } from '@/features/infra.gateway-query';
 *
 *   const members = await executeQuery(QUERY_ROUTES.ORG_ELIGIBLE_MEMBERS, { orgId });
 *
 * Usage (projection slice registration):
 *   import { registerQuery, QUERY_ROUTES } from '@/features/infra.gateway-query';
 *
 *   registerQuery(QUERY_ROUTES.ACCOUNT_VIEW, getAccountView, '[#6] FCM token');
 */
````

## File: src/features/infra.outbox-relay/_relay.ts
````typescript
/**
 * infra.outbox-relay — _relay.ts
 *
 * OUTBOX_RELAY_WORKER [R1] — shared Relay Worker used by ALL outbox collections.
 *
 * Per logic-overview.md [R1] OUTBOX_RELAY_WORKER and tree.md:
 *   infra.outbox-relay = [R1] 搬運工 (掃描所有 OUTBOX 投遞至 IER)
 *
 *   - Scan strategy: Firestore onSnapshot (CDC) — listens for `pending` entries
 *   - Delivery: OUTBOX → IER corresponding Lane
 *   - Failure handling: retry with exponential backoff; after 3 attempts → DLQ
 *   - Monitoring: relay_lag / relay_error_rate → VS9 DOMAIN_METRICS
 *
 * All OUTBOX collections share this single Relay Worker — no per-BC duplication.
 *
 * Invariants:
 *   D8  — idempotencyKey must be preserved on DLQ entry (never regenerated).
 *   R5  — DLQ entries carry a `dlqLevel` tag (SAFE_AUTO / REVIEW_REQUIRED / SECURITY_BLOCK).
 *   D9  — traceId is read from the envelope and forwarded; never overwritten.
 */
⋮----
import { getDlqLevel, type DlqEntry } from '@/features/infra.dlq-manager';
import { logDomainError } from '@/features/observability';
import { db } from '@/shared/infra/firestore/firestore.client';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  type Unsubscribe,
  type QuerySnapshot,
  type DocumentData,
  type DocumentChange,
} from '@/shared/infra/firestore/firestore.read.adapter';
import { updateDoc, setDoc, type serverTimestamp } from '@/shared/infra/firestore/firestore.write.adapter';
⋮----
/** Delivery status of an outbox entry. */
export type OutboxStatus = 'pending' | 'delivered' | 'dlq';
⋮----
/** Shape of a document stored in any OUTBOX collection. */
export interface OutboxDocument {
  readonly outboxId: string;
  readonly eventType: string;
  /** Serialized EventEnvelope — includes idempotencyKey and traceId [D8][D9]. */
  readonly envelopeJson: string;
  /** Destination IER lane. */
  readonly lane: 'CRITICAL_LANE' | 'STANDARD_LANE' | 'BACKGROUND_LANE';
  status: OutboxStatus;
  readonly createdAt: ReturnType<typeof serverTimestamp>;
  /** Number of delivery attempts. */
  attemptCount: number;
  lastAttemptAt?: string;
  lastError?: string;
}
⋮----
/** Serialized EventEnvelope — includes idempotencyKey and traceId [D8][D9]. */
⋮----
/** Destination IER lane. */
⋮----
/** Number of delivery attempts. */
⋮----
/**
 * Exponential backoff delays (ms) per attempt index (0-based).
 * These are retry-timing constants, not SLA values.
 * Named explicitly to avoid confusion with SK_STALENESS_CONTRACT values. [S4]
 */
⋮----
/**
 * Callback invoked by the relay worker to deliver an event to IER.
 * The caller (application bootstrap) wires this to the actual IER publish function.
 *
 * @param lane  - Destination lane in IER.
 * @param envelope - Deserialized EventEnvelope object.
 */
export type IerDeliveryFn = (
  lane: OutboxDocument['lane'],
  envelope: unknown
) => Promise<void>;
⋮----
/**
 * Starts the OUTBOX_RELAY_WORKER for a given Firestore collection path.
 *
 * Usage (call once per OUTBOX collection at app startup):
 * ```ts
 * const stop = startOutboxRelay('workspaceOutbox', ierDeliveryFn);
 * // At shutdown:
 * stop();
 * ```
 *
 * @param outboxCollectionPath - Firestore collection path, e.g. "workspaceOutbox".
 * @param deliver - IER delivery callback.
 * @returns Cleanup function that unsubscribes the CDC listener.
 */
export function startOutboxRelay(
  outboxCollectionPath: string,
  deliver: IerDeliveryFn
): Unsubscribe
⋮----
// Log listener errors — network failure, permission denied, etc.
// The onSnapshot listener will NOT auto-reconnect after an error;
// the caller should restart the relay worker on app restart.
⋮----
/**
 * Attempts to relay a single outbox entry to IER.
 * Implements retry with exponential backoff; routes to DLQ after MAX_ATTEMPTS.
 */
async function relayEntry(
  collectionPath: string,
  docId: string,
  data: OutboxDocument,
  deliver: IerDeliveryFn
): Promise<void>
⋮----
// Malformed JSON is a data-corruption issue — skip retries and go directly to DLQ.
⋮----
// Back off and mark for retry (leave status as pending)
⋮----
/**
 * Routes a permanently-failed outbox entry to the DLQ with the correct tier. [R5]
 *
 * The original envelopeJson is preserved so that DLQ replay can re-submit with
 * the same idempotencyKey [D8].
 */
async function routeToDlq(
  collectionPath: string,
  docId: string,
  data: OutboxDocument,
  attemptCount: number,
  lastError: string
): Promise<void>
⋮----
// [GEMINI.md §4][S6] SECURITY_BLOCK tier: fire VS9 domain-error-log alert immediately.
// Auto-replay is FORBIDDEN for SECURITY_BLOCK — alert must be raised so ops can review.
⋮----
// Log parse failure so operators know the envelope was malformed on the alert path
````

## File: src/features/infra.outbox-relay/index.ts
````typescript
/**
 * infra.outbox-relay — Public API
 *
 * OUTBOX Relay Worker — shared infrastructure engine. [R1]
 *
 * Per logic-overview.md [R1] OUTBOX_RELAY_WORKER and tree.md:
 *   infra.outbox-relay = [R1] 搬運工 (掃描所有 OUTBOX 投遞至 IER)
 *
 * Usage: call `startOutboxRelay(collectionPath, deliveryFn)` once per OUTBOX
 * collection at application startup. All OUTBOX collections share this single
 * worker — no per-BC relay duplication.
 */
````

## File: src/features/notification-hub.slice/_actions.ts
````typescript
/**
 * notification-hub.slice — _actions.ts
 *
 * Cross-cutting Authority — Server actions for the sole side-effect outlet. [D3]
 *
 * Per logic-overview.md [D26]:
 *   notification-hub = sole side-effect outlet.
 *   All notification dispatch MUST route through these actions.
 *
 * Architecture:
 *   [D3]   All notification side-effects go through _actions.ts.
 *   [#A10] Notification routing is stateless.
 *   [D26]  Owns _actions.ts / _services.ts; does not parasitize shared-kernel.
 */
⋮----
import type { CommandResult } from '@/features/shared-kernel';
import { commandSuccess, commandFailureFrom } from '@/features/shared-kernel';
⋮----
import {
  processNotificationEvent,
  registerRoutingRule as registerRoutingRuleService,
  unregisterRoutingRule as unregisterRoutingRuleService,
} from './_services';
import type {
  NotificationSourceEvent,
  TagRoutingRule,
  NotificationDispatchResult,
} from './_types';
⋮----
// =================================================================
// Notification Dispatch Action
// =================================================================
⋮----
/**
 * Result wrapper for notification dispatch — carries both CommandResult
 * and the full dispatch result for status tracking.
 */
export interface DispatchNotificationResult {
  readonly commandResult: CommandResult;
  readonly dispatch: NotificationDispatchResult | null;
}
⋮----
/**
 * Process a source event through the notification hub's tag-aware routing
 * pipeline and dispatch to the appropriate channels.
 *
 * This is the SOLE entry point for triggering notifications in the system.
 * Returns both CommandResult per [R4] and the dispatch result for status tracking.
 */
export async function dispatchNotification(
  event: NotificationSourceEvent
): Promise<DispatchNotificationResult>
⋮----
// =================================================================
// Routing Rule Management Actions
// =================================================================
⋮----
/**
 * Register a new tag-aware routing rule.
 * Rules determine which channels fire based on event tags.
 */
export async function registerRoutingRule(
  rule: TagRoutingRule
): Promise<CommandResult>
⋮----
/**
 * Unregister an existing routing rule by ID.
 */
export async function unregisterRoutingRule(
  ruleId: string
): Promise<CommandResult>
⋮----
// =================================================================
// Final Dispatch Action (D3)
// =================================================================
⋮----
/**
 * Trigger the final notification dispatch — executes transmission
 * and records the dispatch status.
 *
 * This is an alias for dispatchNotification that emphasises the
 * "trigger → delivery" semantics requested by the event routing
 * architecture (VS7 · TagEventRouter pipeline).
 */
export async function triggerDispatch(
  event: NotificationSourceEvent
): Promise<DispatchNotificationResult>
````

## File: src/features/notification-hub.slice/_notification-hub.test.ts
````typescript
/**
 * @test VS7 Notification Hub — Tag routing, dispatch, ProjectionBusSubscriber
 *
 * Validates:
 *   1. evaluateTagRouting — tag-based routing rule matching
 *   2. dispatchNotification — full dispatch pipeline
 *   3. registerRoutingRule / unregisterRoutingRule — rule CRUD
 *   4. ProjectionBusSubscriber — subscribeToProjectionBus, emitProjectionBusEvent
 *   5. triggerDispatch — final transmission alias
 *
 * Architecture:
 *   [D3]   All dispatch side-effects via _actions.ts.
 *   [D8]   Routing logic in _services.ts, not shared-kernel.
 *   [D26]  Sole side-effect outlet.
 *   [#A10] Notification routing is stateless.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
⋮----
import {
  dispatchNotification,
  registerRoutingRule,
  unregisterRoutingRule,
  triggerDispatch,
} from './_actions';
import {
  evaluateTagRouting,
  registerRoutingRule as registerRuleService,
  unregisterRoutingRule as unregisterRuleService,
  getRoutingRules,
  subscribeToProjectionBus,
  emitProjectionBusEvent,
  initTagChangedSubscriber,
  TAG_CHANGED_EVENT_KEY,
  getHubStats,
} from './_services';
import type {
  TagRoutingRule,
  NotificationSourceEvent,
} from './_types';
⋮----
// ─── Helpers ──────────────────────────────────────────────────────────────────
⋮----
function makeRule(overrides: Partial<TagRoutingRule> =
⋮----
function makeEvent(overrides: Partial<NotificationSourceEvent> =
⋮----
// ═══════════════════════════════════════════════════════════════════
// Routing Rule Management (via _services.ts)
// ═══════════════════════════════════════════════════════════════════
⋮----
// ═══════════════════════════════════════════════════════════════════
// Tag-Aware Routing Engine
// ═══════════════════════════════════════════════════════════════════
⋮----
// ═══════════════════════════════════════════════════════════════════
// Dispatch Actions (_actions.ts)
// ═══════════════════════════════════════════════════════════════════
⋮----
// ═══════════════════════════════════════════════════════════════════
// Routing Rule Actions (D3 wrappers)
// ═══════════════════════════════════════════════════════════════════
⋮----
// ═══════════════════════════════════════════════════════════════════
// ProjectionBusSubscriber
// ═══════════════════════════════════════════════════════════════════
⋮----
// Flush microtask queue deterministically
⋮----
// ═══════════════════════════════════════════════════════════════════
// Hub Stats (Observability)
// ═══════════════════════════════════════════════════════════════════
````

## File: src/features/notification-hub.slice/_services.ts
````typescript
/**
 * notification-hub.slice — _services.ts
 *
 * Cross-cutting Authority — Event subscriber and tag-aware routing engine.
 *
 * Listens to projection.bus tag change events and domain events,
 * evaluates tag-based routing rules via VS8 semantics, and triggers
 * delivery channels accordingly.
 *
 * Per logic-overview.md (VS7 enhanced):
 *   Notification Hub = 反應中樞
 *   - Monitors projection.bus for tag lifecycle events
 *   - Routes via VS8 tag semantics to appropriate channels
 *   - Sole side-effect outlet [D26]
 *
 * Architecture:
 *   [D8]   Routing logic lives HERE, not in shared-kernel.
 *   [D24]  No direct firebase imports.
 *   [D26]  notification-hub owns its services.
 *   [#A10] Notification routing is stateless — no persistent state in routing engine.
 */
⋮----
import type { NotificationPriority } from '@/features/shared-kernel';
⋮----
import type {
  TagRoutingRule,
  TagRoutingDecision,
  NotificationSourceEvent,
  NotificationDispatch,
  NotificationDispatchResult,
  NotificationHubStats,
  NotificationSubscription,
} from './_types';
⋮----
// ─── In-memory routing rule registry ──────────────────────────────────────────
⋮----
// =================================================================
// Routing Rule Management
// =================================================================
⋮----
export function registerRoutingRule(rule: TagRoutingRule): void
⋮----
export function unregisterRoutingRule(ruleId: string): void
⋮----
export function getRoutingRules(): readonly TagRoutingRule[]
⋮----
// =================================================================
// Event Subscription Management
// =================================================================
⋮----
export function registerSubscription(sub: NotificationSubscription): void
⋮----
export function unregisterSubscription(eventKey: string): void
⋮----
export function getSubscriptions(): readonly NotificationSubscription[]
⋮----
// =================================================================
// Tag-Aware Routing Engine (Stateless per #A10)
// =================================================================
⋮----
/**
 * Evaluate all enabled routing rules against an event's tags.
 * Returns matched rules, channels to fire, and highest matched priority.
 *
 * Stateless: uses only the event's tags and the in-memory rule set.
 */
export function evaluateTagRouting(
  eventTags: readonly string[]
): TagRoutingDecision
⋮----
// =================================================================
// Notification Processing Pipeline
// =================================================================
⋮----
/**
 * Process a source event through the full notification pipeline:
 *   1. Check subscription registration
 *   2. Evaluate tag-aware routing
 *   3. Build notification dispatches
 *   4. Return dispatch result (actual delivery delegated to user.notification)
 */
export async function processNotificationEvent(
  event: NotificationSourceEvent
): Promise<NotificationDispatchResult>
⋮----
// =================================================================
// Projection Bus Subscriber (TAG_CHANGED events)
// =================================================================
⋮----
/**
 * Event key for tag lifecycle events from projection.bus.
 * The notification hub subscribes to these events for tag-aware routing.
 */
⋮----
/**
 * Listener function type for projection bus events.
 */
export type ProjectionBusListener = (event: NotificationSourceEvent) => void;
⋮----
/**
 * Subscribe to a projection.bus event key.
 * Returns an unsubscribe function.
 *
 * Per logic-overview.md (VS7):
 *   Notification Hub monitors projection.bus for tag lifecycle events
 *   and evaluates tag-aware routing to decide delivery channels.
 */
export function subscribeToProjectionBus(
  eventKey: string,
  listener: ProjectionBusListener
): () => void
⋮----
/**
 * Emit an event to all registered projection bus listeners.
 * Used by projection.bus adapters to forward domain events.
 */
export function emitProjectionBusEvent(event: NotificationSourceEvent): void
⋮----
/**
 * Initialize the TAG_CHANGED subscription — connects projection.bus
 * tag lifecycle events to the notification routing pipeline.
 *
 * Returns an unsubscribe function for cleanup.
 */
export function initTagChangedSubscriber(): () => void
⋮----
/* fire-and-forget: errors logged inside processNotificationEvent */
⋮----
// =================================================================
// Observability
// =================================================================
⋮----
/**
 * Returns notification hub operational statistics.
 */
export function getHubStats(): NotificationHubStats
⋮----
// ─── Internal helpers ─────────────────────────────────────────────────────────
⋮----
function generateDispatchId(): string
````

## File: src/features/notification-hub.slice/_types.ts
````typescript
/**
 * notification-hub.slice — _types.ts
 *
 * Cross-cutting Authority — Domain Types for the system's sole side-effect outlet.
 *
 * Per logic-overview.md [D26]:
 *   notification-hub = 反應中樞 (Reaction Hub)
 *   VS7 enhanced — sole side-effect outlet with tag-aware routing via VS8.
 *
 * Architecture:
 *   [D3]  Notification dispatch via _actions.ts only.
 *   [D19] Core channel/priority contracts in shared-kernel/semantic-primitives.
 *   [D26] notification-hub owns _actions.ts / _services.ts per D3;
 *         does not parasitize shared-kernel per D8.
 *   [#A10] Notification routing is stateless.
 *   [#A13] Atomicity invariant: notification boundary.
 *
 * Dependency rule: ZERO infrastructure imports.
 */
⋮----
import type {
  NotificationChannel,
  NotificationPriority,
} from '@/features/shared-kernel/semantic-primitives';
⋮----
// ─── Tag-Aware Routing ────────────────────────────────────────────────────────
⋮----
/**
 * Tag-based routing rule: maps a set of tag slugs to a delivery channel
 * and priority. Evaluated by the notification hub's event subscriber.
 *
 * Per logic-overview.md (VS7):
 *   Notification Hub routes events via VS8 tag semantics —
 *   tag slugs determine which channels fire and at what priority.
 */
export interface TagRoutingRule {
  readonly ruleId: string;
  readonly name: string;
  /** Tag slugs that trigger this rule (AND semantics — all must match). */
  readonly tagSlugs: readonly string[];
  readonly channel: NotificationChannel;
  readonly priority: NotificationPriority;
  /** Optional template ID for message formatting. */
  readonly templateId?: string;
  readonly enabled: boolean;
}
⋮----
/** Tag slugs that trigger this rule (AND semantics — all must match). */
⋮----
/** Optional template ID for message formatting. */
⋮----
/**
 * Result of evaluating tag routing rules against an event's tags.
 */
export interface TagRoutingDecision {
  readonly matchedRules: readonly TagRoutingRule[];
  readonly channels: readonly NotificationChannel[];
  readonly highestPriority: NotificationPriority;
}
⋮----
// ─── Notification Event Types ─────────────────────────────────────────────────
⋮----
/**
 * Source event that the notification hub subscribes to.
 * Typically emitted by projection.bus or domain event buses.
 */
export interface NotificationSourceEvent {
  readonly eventKey: string;
  readonly payload: Record<string, unknown>;
  readonly tags: readonly string[];
  readonly orgId: string;
  readonly workspaceId?: string;
  /** Target account IDs for delivery (resolved by routing rules). */
  readonly targetAccountIds?: readonly string[];
  /** [R8] TraceID propagated from the originating command. */
  readonly traceId?: string;
  readonly occurredAt: string;
}
⋮----
/** Target account IDs for delivery (resolved by routing rules). */
⋮----
/** [R8] TraceID propagated from the originating command. */
⋮----
/**
 * Enriched notification ready for delivery (after tag-aware routing).
 */
export interface NotificationDispatch {
  readonly sourceEventKey: string;
  readonly channel: NotificationChannel;
  readonly priority: NotificationPriority;
  readonly targetAccountIds: readonly string[];
  readonly title: string;
  readonly body: string;
  readonly data?: Record<string, unknown>;
  readonly tags: readonly string[];
  readonly traceId?: string;
  readonly dispatchedAt: string;
}
⋮----
// ─── Notification Dispatch Result ─────────────────────────────────────────────
⋮----
/**
 * Result of a notification dispatch attempt.
 */
export interface NotificationDispatchResult {
  readonly dispatchId: string;
  readonly channel: NotificationChannel;
  readonly targetCount: number;
  readonly successCount: number;
  readonly failureCount: number;
  readonly errors: readonly NotificationDispatchError[];
}
⋮----
/**
 * Individual delivery error within a dispatch batch.
 */
export interface NotificationDispatchError {
  readonly accountId: string;
  readonly channel: NotificationChannel;
  readonly reason: string;
}
⋮----
// ─── Event Subscription Types ─────────────────────────────────────────────────
⋮----
/**
 * Subscription registration for the notification hub's event listener.
 * Each subscription maps a domain event key to routing evaluation.
 */
export interface NotificationSubscription {
  readonly eventKey: string;
  readonly description: string;
  /** If true, routing rules are evaluated; otherwise, default routing is used. */
  readonly useTagRouting: boolean;
  readonly enabled: boolean;
}
⋮----
/** If true, routing rules are evaluated; otherwise, default routing is used. */
⋮----
// ─── Hub State (Observability) ────────────────────────────────────────────────
⋮----
/**
 * Notification hub operational statistics.
 */
export interface NotificationHubStats {
  readonly totalDispatched: number;
  readonly dispatchedByChannel: Record<NotificationChannel, number>;
  readonly totalErrors: number;
  readonly activeSubscriptions: number;
  readonly activeRoutingRules: number;
  readonly lastDispatchedAt: string;
}
⋮----
// ─── Re-exports ───────────────────────────────────────────────────────────────
````

## File: src/features/notification-hub.slice/gov.notification-router/_router.ts
````typescript
/**
 * notification-hub.slice/gov.notification-router — _router.ts
 *
 * FCM Layer 2: Notification Router
 * Routes organization events to the correct target account notification slice
 * based on TargetAccountID.
 *
 * Per logic-overview.md [E3]:
 *   IER →|ScheduleAssigned| ACCOUNT_NOTIFICATION_ROUTER
 *   ACCOUNT_NOTIFICATION_ROUTER →|路由至目標帳號| ACCOUNT_USER_NOTIFICATION
 *
 * Current implementation: subscribes directly to the org event bus.
 * This is the consumer side — when a dedicated IER layer is introduced,
 * it will be the IER (not the org event bus) that calls this router.
 *
 * Does NOT generate content — only routes from event source to delivery slice.
 */
⋮----
import { onOrgEvent } from '@/features/organization.slice';
⋮----
import { deliverNotification } from '../user.notification';
⋮----
export interface RouterRegistration {
  unsubscribe: () => void;
}
⋮----
/**
 * Registers the notification router on the organization event bus.
 * Should be called once at app startup (e.g., in the root layout or app-provider).
 *
 * Returns an unsubscribe function to clean up on unmount.
 *
 * @deprecated Use `initTagChangedSubscriber` from `@/features/notification-hub.slice` instead.
 * The notification-hub.slice is the D26-compliant sole side-effect outlet.
 * This function remains for backwards compatibility during the D26 migration.
 */
export function registerNotificationRouter(): RouterRegistration
⋮----
// Route ScheduleAssigned events to the target account's notification layer
⋮----
// [R8] forward traceId from the originating event envelope
⋮----
// Route policy change events to org members (broadcast via member list)
⋮----
// Policy changes are org-wide; notification delivery targets the org owner
⋮----
// [R8] forward traceId from the originating event envelope
⋮----
// Route assignment-cancelled events to the target member (FR-N3)
⋮----
// [R8] forward traceId from the originating event envelope
⋮----
// Route member joined events to the new member
⋮----
// [R8] forward traceId from the originating event envelope
````

## File: src/features/notification-hub.slice/gov.notification-router/index.ts
````typescript
// notification-hub.slice/gov.notification-router — FCM Layer 2: Notification Router
// Routes organization events to target accounts based on TargetAccountID.
````

## File: src/features/notification-hub.slice/index.ts
````typescript
/**
 * notification-hub.slice — Public API
 *
 * Cross-cutting Authority: the system's sole side-effect outlet. [D26]
 *
 * Per logic-overview.md:
 *   notification-hub = 反應中樞 (Reaction Hub)
 *   VS7 enhanced — sole side-effect outlet with tag-aware routing via VS8
 *
 * All notification dispatch in the system MUST route through this slice.
 * Event subscriber monitors projection.bus tag changes and domain events,
 * then routes via VS8 tag semantics to appropriate delivery channels.
 *
 * Architecture:
 *   [D3]   Notification dispatch via _actions.ts.
 *   [D8]   Routing logic in _services.ts, not shared-kernel.
 *   [D19]  Core channel/priority contracts in shared-kernel/semantic-primitives.
 *   [D26]  Owns _actions.ts / _services.ts; does not parasitize shared-kernel.
 *   [#A10] Notification routing is stateless.
 *   [#A13] Atomicity invariant: notification boundary.
 *
 * External consumers import from '@/features/notification-hub.slice'.
 */
⋮----
// =================================================================
// Domain Types
// =================================================================
⋮----
// Re-exported shared-kernel contracts for consumer convenience
⋮----
// =================================================================
// Server Actions (all notification operations go through here) [D3]
// =================================================================
⋮----
// =================================================================
// Services (tag-aware routing engine + event subscription)
// =================================================================
⋮----
// =================================================================
// User Notification (FCM Layer 3 — personal push delivery [R8])
// =================================================================
⋮----
// =================================================================
// Governance: Notification Router (FCM Layer 2 — routes org events [E3, #A10])
// =================================================================
````

## File: src/features/notification-hub.slice/user.notification/_components/notification-badge.tsx
````typescript
/**
 * notification-hub.slice/user.notification — _components/notification-badge.tsx
 *
 * Notification bell icon with unread count badge.
 * Used in the top navigation bar.
 */
⋮----
import { Bell } from 'lucide-react';
⋮----
import { Badge } from '@/shared/shadcn-ui/badge';
import { Button } from '@/shared/shadcn-ui/button';
⋮----
interface NotificationBadgeProps {
  unreadCount: number;
  onClick?: () => void;
}
⋮----
export function NotificationBadge(
````

## File: src/features/notification-hub.slice/user.notification/_components/notification-list.tsx
````typescript
/**
 * notification-hub.slice/user.notification — _components/notification-list.tsx
 *
 * Dropdown/panel displaying recent notifications.
 * Marks items as read when clicked.
 */
⋮----
import { cn } from '@/shared/lib';
import { ScrollArea } from '@/shared/shadcn-ui/scroll-area';
import type { Notification } from '@/shared/types';
⋮----
interface NotificationListProps {
  notifications: Notification[];
  onMarkRead: (id: string) => void;
}
````

## File: src/features/notification-hub.slice/user.notification/_delivery.ts
````typescript
/**
 * notification-hub.slice/user.notification — _delivery.ts
 *
 * FCM Layer 3: Notification Delivery
 * Receives routed notifications, stores them in Firestore, and pushes FCM.
 *
 * Per logic-overview.md:
 *   ACCOUNT_USER_NOTIFICATION → FCM_GATEWAY → USER_DEVICE
 *   USER_ACCOUNT_PROFILE -.→|提供 FCM Token（唯讀查詢）| ACCOUNT_USER_NOTIFICATION
 *
 * Architecture:
 *  - Reads FCM token from account-user.profile public API (never writes to profile)
 *  - Stores notification in Firestore: accounts/{accountId}/notifications/{notifId}
 *  - Pushes to FCM via Firebase Admin SDK pattern (server-side) or client SDK
 *
 * Account tag filtering: if the account is 'external' type, content is sanitized
 * (financial amounts, internal workspace IDs are redacted).
 */
⋮----
import { db } from '@/shared/infra/firestore/firestore.client';
import {
  collection,
  doc,
  getDoc,
} from '@/shared/infra/firestore/firestore.read.adapter';
import { addDoc, serverTimestamp } from '@/shared/infra/firestore/firestore.write.adapter';
⋮----
export interface NotificationDeliveryInput {
  title: string;
  message: string;
  type: 'info' | 'alert' | 'success';
  sourceEvent: string;
  sourceId: string;
  workspaceId: string;
  /** TraceID from the originating EventEnvelope — MUST be included in FCM metadata [R8]. */
  traceId?: string;
}
⋮----
/** TraceID from the originating EventEnvelope — MUST be included in FCM metadata [R8]. */
⋮----
export interface DeliveryResult {
  notificationId: string;
  delivered: boolean;
  fcmSent: boolean;
}
⋮----
/**
 * Delivers a notification to a specific account.
 *
 * Steps:
 * 1. Looks up account tags (internal/external) from Firestore
 * 2. Filters/sanitizes content based on account tag
 * 3. Persists notification to Firestore sub-collection
 * 4. Attempts FCM push (fire-and-forget, non-blocking)
 *
 * @param targetAccountId - The account to deliver the notification to
 * @param input - Notification content
 */
export async function deliverNotification(
  targetAccountId: string,
  input: NotificationDeliveryInput
): Promise<DeliveryResult>
⋮----
// Step 1: Resolve account metadata (external tag check)
⋮----
// Step 2: Filter content for external accounts (no workspace-internal IDs)
⋮----
// Step 3: Persist to Firestore
⋮----
// [R8] traceId carried from originating EventEnvelope for globalAuditView correlation
⋮----
// Step 4: Attempt FCM push (best-effort, non-blocking)
// FCM token is read from the account profile — we read it here inline
// to avoid a hard dependency on the account-user.profile slice.
⋮----
// In production: call Firebase Cloud Messaging REST API or Admin SDK.
// [R8] TRACE_PROPAGATION_RULE: traceId MUST be included in FCM message data field.
// The FCM message must carry traceId so the device-side handler can correlate
// push notifications with audit records in globalAuditView.
⋮----
// Example FCM Admin SDK call (server-side):
//   await fcmAdmin.send({
//     token: fcmToken,
//     notification: { title: sanitizedTitle, body: sanitizedMessage },
//     data: { traceId },   // ← [R8] required field
//   });
⋮----
// FCM failure is non-fatal — notification is already persisted
⋮----
/**
 * Sanitizes notification content for external account recipients.
 * Redacts internal workspace IDs, financial amounts, and internal-only details
 * to prevent leaking sensitive workspace-internal data to external participants.
 *
 * @example
 * sanitizeForExternal('Workspace abc12345-... has $1,234.56 balance')
 * // → 'Workspace [ID] has [金額] balance'
 *
 * @param message - Raw notification message text
 * @returns Sanitized message safe for external account delivery
 */
function sanitizeForExternal(message: string): string
⋮----
// Remove patterns like workspace IDs (UUIDs), financial amounts (e.g. $1,234.56)
````

## File: src/features/notification-hub.slice/user.notification/_hooks/use-user-notifications.ts
````typescript
/**
 * notification-hub.slice/user.notification — _hooks/use-user-notifications.ts
 *
 * React hook that subscribes to a user's personal notification stream.
 */
⋮----
import { useState, useEffect } from 'react';
⋮----
import type { Notification } from '@/shared/types';
⋮----
import { subscribeToNotifications, markNotificationRead } from '../_queries';
⋮----
export function useUserNotifications(accountId: string | undefined, maxCount = 20)
⋮----
const markRead = async (notificationId: string) =>
````

## File: src/features/notification-hub.slice/user.notification/_queries.ts
````typescript
/**
 * notification-hub.slice/user.notification — _queries.ts
 *
 * Firestore reads for a user's personal notification list.
 * Stored at: accounts/{accountId}/notifications/{notifId}
 */
⋮----
import { db } from '@/shared/infra/firestore/firestore.client';
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  doc,
  type Unsubscribe,
} from '@/shared/infra/firestore/firestore.read.adapter';
import { updateDoc } from '@/shared/infra/firestore/firestore.write.adapter';
import type { Notification } from '@/shared/types';
⋮----
/**
 * Subscribes to the latest notifications for a user.
 * Returns an unsubscribe function.
 */
export function subscribeToNotifications(
  accountId: string,
  maxCount: number,
  onUpdate: (notifications: Notification[]) => void
): Unsubscribe
⋮----
/**
 * Marks a notification as read.
 */
export async function markNotificationRead(
  accountId: string,
  notificationId: string
): Promise<void>
````

## File: src/features/notification-hub.slice/user.notification/index.ts
````typescript
// notification-hub.slice/user.notification — Personal push notification (FCM Layer 3)
// Receives routed notifications from gov.notification-router,
// filters content by account tag (internal/external), and pushes via FCM.
````

## File: src/features/observability/_error-log.ts
````typescript
/**
 * observability — _error-log.ts
 *
 * DOMAIN_ERROR_LOG node — structured domain error logger. [R8]
 *
 * Per logic-overview.md (OBSERVABILITY_LAYER):
 *   WORKSPACE_TRANSACTION_RUNNER --> DOMAIN_ERROR_LOG
 *
 * Provides a structured error-logging interface for domain/application errors.
 * In production, forward entries to your preferred logging backend (e.g. Cloud Logging).
 */
⋮----
export interface DomainErrorEntry {
  /** ISO 8601 timestamp. */
  readonly occurredAt: string;
  /** Correlation/trace ID of the originating command. */
  readonly traceId: string;
  /** The bounded context or module where the error occurred. */
  readonly source: string;
  /** Human-readable error message. */
  readonly message: string;
  /** Optional serialized error detail. */
  readonly detail?: string;
}
⋮----
/** ISO 8601 timestamp. */
⋮----
/** Correlation/trace ID of the originating command. */
⋮----
/** The bounded context or module where the error occurred. */
⋮----
/** Human-readable error message. */
⋮----
/** Optional serialized error detail. */
⋮----
/**
 * Logs a domain error in a structured format.
 * Currently writes to console.error; swap for a real sink in production.
 */
export function logDomainError(entry: DomainErrorEntry): void
````

## File: src/features/observability/_metrics.ts
````typescript
/**
 * observability — _metrics.ts
 *
 * DOMAIN_METRICS node — in-process domain event counter. [R8]
 *
 * Per logic-overview.md (OBSERVABILITY_LAYER):
 *   WORKSPACE_EVENT_BUS --> DOMAIN_METRICS
 *
 * Tracks published event counts per event type.
 * Metrics are in-memory and reset on page reload (client) or process restart (server).
 * For production, replace or extend with your preferred telemetry backend.
 */
⋮----
/** Counter per event type name. */
⋮----
/**
 * Increments the counter for the given event type.
 * Called by the WorkspaceEventBus on every publish.
 */
export function recordEventPublished(eventType: string): void
⋮----
/**
 * Returns a snapshot of all event counters.
 * Useful for debugging and observability dashboards.
 */
export function getEventCounters(): Readonly<Record<string, number>>
⋮----
/**
 * Resets all counters — intended for tests only.
 */
export function resetEventCounters(): void
````

## File: src/features/observability/_trace.ts
````typescript
/**
 * observability — _trace.ts
 *
 * TRACE_IDENTIFIER node — correlation/trace ID generation and propagation. [R8]
 *
 * Per logic-overview.md (OBSERVABILITY_LAYER):
 *   WORKSPACE_COMMAND_HANDLER --> TRACE_IDENTIFIER
 *   WORKSPACE_TRANSACTION_RUNNER --> TRACE_IDENTIFIER
 *   WORKSPACE_EVENT_BUS --> TRACE_IDENTIFIER
 */
⋮----
/**
 * Generates a unique correlation/trace identifier for a command or event chain.
 * Format: "<timestamp>-<random>" — lightweight, no external dependency.
 */
export function generateTraceId(): string
⋮----
/**
 * Structured trace context attached to commands and events.
 */
export interface TraceContext {
  /** Unique trace identifier for the entire command/event chain. */
  readonly traceId: string;
  /** ISO 8601 timestamp when the trace was initiated. */
  readonly initiatedAt: string;
  /** Optional: the command or event type that started this trace. */
  readonly source?: string;
}
⋮----
/** Unique trace identifier for the entire command/event chain. */
⋮----
/** ISO 8601 timestamp when the trace was initiated. */
⋮----
/** Optional: the command or event type that started this trace. */
⋮----
/**
 * Creates a TraceContext for a new command or event chain.
 */
export function createTraceContext(source?: string): TraceContext
````

## File: src/features/observability/index.ts
````typescript
/**
 * observability — Public API
 *
 * VS9 OBSERVABILITY_LAYER infrastructure engine. [R8]
 *
 * Nodes:
 *   - TRACE_IDENTIFIER: correlation/trace ID generation and propagation
 *   - DOMAIN_METRICS:   in-process domain event counter
 *   - DOMAIN_ERROR_LOG: structured domain error logger
 *
 * Consumers:
 *   - workspace-core.event-bus: recordEventPublished on every event publish.
 *   - workspace-application: createTraceContext at command entry; logDomainError on failure.
 *   - infra.outbox-relay: logDomainError on relay failure.
 *   - identity.slice: logDomainError on claims refresh failure.
 */
````

## File: src/features/organization.slice/core.event-bus/_bus.ts
````typescript
/**
 * account-organization.event-bus — _bus.ts
 *
 * In-process organization event bus.
 * Mirrors the workspace event bus pattern.
 *
 * Per logic-overview.md:
 *   ORGANIZATION_ENTITY → ORGANIZATION_EVENT_BUS
 *   ORGANIZATION_EVENT_BUS → all downstream listeners
 *   ORGANIZATION_EVENT_BUS -.→ shared-kernel.event-envelope（契約遵循）
 */
⋮----
import type { ImplementsEventEnvelopeContract } from '@/features/shared-kernel';
⋮----
import type { OrganizationEventPayloadMap, OrganizationEventKey } from './_events';
⋮----
type OrgEventHandler<K extends OrganizationEventKey> = (
  payload: OrganizationEventPayloadMap[K]
) => void | Promise<void>;
⋮----
type OrgEventHandlerMap = {
  [K in OrganizationEventKey]?: Array<OrgEventHandler<K>>;
};
⋮----
/** Marker: this module implements the shared-kernel.event-envelope contract (Invariant #8). */
⋮----
/**
 * Subscribe to an organization event.
 * Returns an unsubscribe function.
 */
export function onOrgEvent<K extends OrganizationEventKey>(
  eventKey: K,
  handler: OrgEventHandler<K>
): () => void
⋮----
/**
 * Publish an organization event to all subscribers.
 */
export async function publishOrgEvent<K extends OrganizationEventKey>(
  eventKey: K,
  payload: OrganizationEventPayloadMap[K]
): Promise<void>
````

## File: src/features/organization.slice/core.event-bus/_events.ts
````typescript
/**
 * account-organization.event-bus — _events.ts
 *
 * Organization domain event contracts.
 *
 * Per logic-overview.md:
 *   ORGANIZATION_EVENT_BUS → ORGANIZATION_SCHEDULE (ScheduleAssigned)
 *   ORGANIZATION_EVENT_BUS → |政策變更| WORKSPACE_ORG_POLICY_CACHE
 *   ORGANIZATION_EVENT_BUS → |ScheduleAssigned 含 TargetAccountID| ACCOUNT_NOTIFICATION_ROUTER
 *   ORGANIZATION_EVENT_BUS -.→ shared-kernel.event-envelope (契約遵循)
 */
⋮----
// =================================================================
// == Payload Interfaces
// =================================================================
⋮----
export interface ScheduleAssignedPayload {
  scheduleItemId: string;
  workspaceId: string;
  orgId: string;
  targetAccountId: string;
  assignedBy: string;
  startDate: string;
  endDate: string;
  title: string;
  /**
   * Aggregate version of the org-schedule aggregate when this event was produced. [R7]
   * Used by ELIGIBLE_UPDATE_GUARD in projection.org-eligible-member-view to enforce
   * monotonic aggregateVersion — prevents timing races from reverting eligible state.
   * Invariant #19: eligible update must use aggregateVersion monotonic increase as prerequisite.
   */
  aggregateVersion: number;
  /** TraceID from the originating command — MUST be forwarded to FCM metadata [R8]. */
  traceId?: string;
}
⋮----
/**
   * Aggregate version of the org-schedule aggregate when this event was produced. [R7]
   * Used by ELIGIBLE_UPDATE_GUARD in projection.org-eligible-member-view to enforce
   * monotonic aggregateVersion — prevents timing races from reverting eligible state.
   * Invariant #19: eligible update must use aggregateVersion monotonic increase as prerequisite.
   */
⋮----
/** TraceID from the originating command — MUST be forwarded to FCM metadata [R8]. */
⋮----
export interface OrgPolicyChangedPayload {
  orgId: string;
  policyId: string;
  changeType: 'created' | 'updated' | 'deleted';
  changedBy: string;
  /** TraceID from the originating command — forwarded to notification delivery [R8]. */
  traceId?: string;
}
⋮----
/** TraceID from the originating command — forwarded to notification delivery [R8]. */
⋮----
export interface OrgMemberJoinedPayload {
  orgId: string;
  accountId: string;
  role: string;
  joinedBy: string;
  /** TraceID from the originating command — forwarded to notification delivery [R8]. */
  traceId?: string;
}
⋮----
/** TraceID from the originating command — forwarded to notification delivery [R8]. */
⋮----
export interface OrgMemberLeftPayload {
  orgId: string;
  accountId: string;
  removedBy: string;
}
⋮----
export interface OrgTeamUpdatedPayload {
  orgId: string;
  teamId: string;
  teamName: string;
  memberIds: string[];
  updatedBy: string;
}
⋮----
/**
 * Fired when XP is added to a member's skill (ACCOUNT_SKILL_AGGREGATE).
 * Used by skill-xp.slice (_projector) and projection.org-eligible-member-view.
 * Per invariant #11: XP belongs to Account BC; Organization only receives the event.
 */
export interface SkillXpAddedPayload {
  accountId: string;
  orgId: string;
  /** tagSlug — portable skill identifier (matches SkillGrant.tagSlug) */
  skillId: string;
  xpDelta: number;
  /** New clamped XP value (0–525). Stored; tier must be derived via resolveSkillTier(xp). */
  newXp: number;
  reason?: string;
  /** Skill aggregate version after this write — used by ORG_ELIGIBLE_VIEW S2 guard. */
  aggregateVersion?: number;
  /** [R8] Trace identifier propagated from CBG_ENTRY. */
  traceId?: string;
}
⋮----
/** tagSlug — portable skill identifier (matches SkillGrant.tagSlug) */
⋮----
/** New clamped XP value (0–525). Stored; tier must be derived via resolveSkillTier(xp). */
⋮----
/** Skill aggregate version after this write — used by ORG_ELIGIBLE_VIEW S2 guard. */
⋮----
/** [R8] Trace identifier propagated from CBG_ENTRY. */
⋮----
/**
 * Fired when XP is deducted from a member's skill.
 * Mirror of SkillXpAddedPayload — same projection targets.
 */
export interface SkillXpDeductedPayload {
  accountId: string;
  orgId: string;
  skillId: string;
  xpDelta: number;
  newXp: number;
  reason?: string;
  /** Skill aggregate version after this write — used by ORG_ELIGIBLE_VIEW S2 guard. */
  aggregateVersion?: number;
  /** [R8] Trace identifier propagated from CBG_ENTRY. */
  traceId?: string;
}
⋮----
/** Skill aggregate version after this write — used by ORG_ELIGIBLE_VIEW S2 guard. */
⋮----
/** [R8] Trace identifier propagated from CBG_ENTRY. */
⋮----
/**
 * Compensating event (Invariant A5) — published when a schedule assignment is
 * rejected because the target member does not meet skill tier requirements.
 * Discrete Recovery: does NOT directly revert A-track tasks; consumers decide.
 */
export interface ScheduleAssignRejectedPayload {
  scheduleItemId: string;
  orgId: string;
  workspaceId: string;
  targetAccountId: string;
  /** Human-readable reason for rejection (e.g. skill tier insufficient). */
  reason: string;
  rejectedAt: string;
  /** [R8] TraceID propagated from the originating scheduling saga. */
  traceId?: string;
}
⋮----
/** Human-readable reason for rejection (e.g. skill tier insufficient). */
⋮----
/** [R8] TraceID propagated from the originating scheduling saga. */
⋮----
/**
 * Fired by ORG_SKILL_RECOGNITION when an organization grants skill recognition
 * to a member.  Per logic-overview.md:
 *   ORG_SKILL_RECOGNITION →|SkillRecognitionGranted| ORGANIZATION_EVENT_BUS
 */
export interface SkillRecognitionGrantedPayload {
  organizationId: string;
  accountId: string;
  skillId: string;
  /** Org-controlled XP threshold (0 = no gate). */
  minXpRequired: number;
  grantedBy: string;
}
⋮----
/** Org-controlled XP threshold (0 = no gate). */
⋮----
/**
 * Fired by ORG_SKILL_RECOGNITION when an organization revokes a skill recognition.
 * Per logic-overview.md:
 *   ORG_SKILL_RECOGNITION →|SkillRecognitionRevoked| ORGANIZATION_EVENT_BUS
 */
export interface SkillRecognitionRevokedPayload {
  organizationId: string;
  accountId: string;
  skillId: string;
  revokedBy: string;
}
⋮----
/**
 * Published when a confirmed schedule assignment is completed (member returns to eligible).
 * Invariant #15: completed → eligible = true.
 */
export interface ScheduleCompletedPayload {
  scheduleItemId: string;
  workspaceId: string;
  orgId: string;
  targetAccountId: string;
  completedBy: string;
  completedAt: string;
  /**
   * Aggregate version when this event was produced. [R7]
   * Used by ELIGIBLE_UPDATE_GUARD to enforce monotonic aggregateVersion.
   */
  aggregateVersion: number;
  /** [R8] TraceID propagated from the originating command. */
  traceId?: string;
}
⋮----
/**
   * Aggregate version when this event was produced. [R7]
   * Used by ELIGIBLE_UPDATE_GUARD to enforce monotonic aggregateVersion.
   */
⋮----
/** [R8] TraceID propagated from the originating command. */
⋮----
/**
 * Published when a confirmed schedule assignment is cancelled after it was confirmed
 * (post-assignment cancellation). The member's eligible flag is restored to true.
 * Invariant #15: cancelled → eligible = true.
 * Distinct from ScheduleProposalCancelledPayload (pre-assignment cancellation).
 */
export interface ScheduleAssignmentCancelledPayload {
  scheduleItemId: string;
  workspaceId: string;
  orgId: string;
  targetAccountId: string;
  cancelledBy: string;
  cancelledAt: string;
  reason?: string;
  /**
   * Aggregate version when this event was produced. [R7]
   * Used by ELIGIBLE_UPDATE_GUARD to enforce monotonic aggregateVersion.
   */
  aggregateVersion: number;
  /** [R8] TraceID propagated from the originating command. */
  traceId?: string;
}
⋮----
/**
   * Aggregate version when this event was produced. [R7]
   * Used by ELIGIBLE_UPDATE_GUARD to enforce monotonic aggregateVersion.
   */
⋮----
/** [R8] TraceID propagated from the originating command. */
⋮----
/**
 * Compensating event (Invariant A5) — published when an HR operator manually cancels
 * a pending schedule proposal (SchedulingSlice Saga).
 * Mirrors ScheduleAssignRejectedPayload but represents a deliberate governance action
 * rather than an automatic skill-check failure.
 *
 * Per logic-overview.md VS6:
 *   SCHEDULE_SAGA["scheduling-saga\nScheduleAssignRejected\nScheduleProposalCancelled"]
 *   SCHEDULE_SAGA -.->|"#A5 compensating event"| ORG_EVENT_BUS
 */
export interface ScheduleProposalCancelledPayload {
  scheduleItemId: string;
  orgId: string;
  workspaceId: string;
  cancelledBy: string;
  cancelledAt: string;
  /** Human-readable reason for cancellation. */
  reason?: string;
  /** [R8] TraceID propagated from the originating scheduling saga. */
  traceId?: string;
}
⋮----
/** Human-readable reason for cancellation. */
⋮----
/** [R8] TraceID propagated from the originating scheduling saga. */
⋮----
// =================================================================
// == Event Key Map
// =================================================================
⋮----
export interface OrganizationEventPayloadMap {
  'organization:schedule:assigned': ScheduleAssignedPayload;
  'organization:schedule:completed': ScheduleCompletedPayload;
  'organization:schedule:assignmentCancelled': ScheduleAssignmentCancelledPayload;
  'organization:schedule:assignRejected': ScheduleAssignRejectedPayload;
  'organization:schedule:proposalCancelled': ScheduleProposalCancelledPayload;
  'organization:policy:changed': OrgPolicyChangedPayload;
  'organization:member:joined': OrgMemberJoinedPayload;
  'organization:member:left': OrgMemberLeftPayload;
  'organization:team:updated': OrgTeamUpdatedPayload;
  'organization:skill:xpAdded': SkillXpAddedPayload;
  'organization:skill:xpDeducted': SkillXpDeductedPayload;
  'organization:skill:recognitionGranted': SkillRecognitionGrantedPayload;
  'organization:skill:recognitionRevoked': SkillRecognitionRevokedPayload;
}
⋮----
export type OrganizationEventKey = keyof OrganizationEventPayloadMap;
````

## File: src/features/organization.slice/core.event-bus/index.ts
````typescript
/**
 * organization.slice/core.event-bus — Public API
 *
 * Organization event bus — mirrors workspace-core.event-bus pattern.
 *
 * Per logic-overview.md:
 *   ORGANIZATION_ENTITY → ORGANIZATION_EVENT_BUS
 *   ORGANIZATION_EVENT_BUS → [ORGANIZATION_SCHEDULE, WORKSPACE_ORG_POLICY_CACHE, ACCOUNT_NOTIFICATION_ROUTER]
 *   ORGANIZATION_EVENT_BUS -.→ shared-kernel.event-envelope
 */
````

## File: src/features/organization.slice/core/_actions.ts
````typescript
/**
 * account-organization.core — _actions.ts
 *
 * Server actions for core organization lifecycle management.
 *
 * Per logic-overview.md [R4] COMMAND_RESULT_CONTRACT:
 *   All mutations return CommandResult discriminated union.
 *
 * Invariant #1: This BC only writes its own aggregate.
 */
⋮----
import {
  type CommandResult,
  commandSuccess,
  commandFailureFrom,
} from "@/features/shared-kernel";
import {
  createOrganization as createOrganizationFacade,
  updateOrganizationSettings as updateOrganizationSettingsFacade,
  deleteOrganization as deleteOrganizationFacade,
  createTeam as createTeamFacade,
} from "@/shared/infra/firestore/firestore.facade";
import type { Account, ThemeConfig } from "@/shared/types";
⋮----
export async function createOrganization(
  organizationName: string,
  owner: Account
): Promise<CommandResult>
⋮----
export async function updateOrganizationSettings(
  organizationId: string,
  settings: { name?: string; description?: string; theme?: ThemeConfig | null }
): Promise<CommandResult>
⋮----
export async function deleteOrganization(organizationId: string): Promise<CommandResult>
⋮----
export async function setupOrganizationWithTeam(
  organizationName: string,
  owner: Account,
  teamName: string,
  teamType: "internal" | "external" = "internal"
): Promise<CommandResult>
````

## File: src/features/organization.slice/core/_components/account-grid.tsx
````typescript
import { Globe, MoreVertical, Users, ArrowUpRight } from "lucide-react"
import { useRouter } from "next/navigation"
⋮----
import { useApp } from "@/shared/app-providers/app-context"
import { Button } from "@/shared/shadcn-ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/shadcn-ui/card"
import { type Account } from "@/shared/types"
⋮----
interface AccountGridProps {
    accounts: Account[]
}
⋮----
function AccountCard(
⋮----
const handleClick = () =>
````

## File: src/features/organization.slice/core/_components/account-new-form.tsx
````typescript
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
⋮----
import { useI18n } from "@/config/i18n/i18n-provider";
import { useApp } from "@/shared/app-providers/app-context";
import { Button } from "@/shared/shadcn-ui/button";
import { Input } from "@/shared/shadcn-ui/input";
import { Label } from "@/shared/shadcn-ui/label";
import { toast } from "@/shared/utility-hooks/use-toast";
⋮----
import { useOrganizationManagement } from "../_hooks/use-organization-management";
⋮----
interface AccountNewFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}
⋮----
const handleCreate = async () =>
⋮----
````

## File: src/features/organization.slice/core/_hooks/use-organization-management.ts
````typescript
import { useCallback } from 'react';
⋮----
import { useApp } from '@/shared/app-providers/app-context';
import { useAuth } from '@/shared/app-providers/auth-provider';
import type { ThemeConfig } from '@/shared/types';
⋮----
import {
  createOrganization as createOrganizationAction,
  updateOrganizationSettings as updateOrganizationSettingsAction,
  deleteOrganization as deleteOrganizationAction,
} from '../_actions';
⋮----
export function useOrganizationManagement()
````

## File: src/features/organization.slice/core/_queries.ts
````typescript
/**
 * account-organization.core — _queries.ts
 *
 * Read queries for the organization aggregate.
 *
 * Organization accounts are stored in accounts/{orgId}.
 * onSnapshot provides real-time updates.
 */
⋮----
import { db } from '@/shared/infra/firestore/firestore.client'
import { doc, onSnapshot, type Unsubscribe } from '@/shared/infra/firestore/firestore.read.adapter'
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter'
import type { Account } from '@/shared/types'
⋮----
/**
 * Fetches a single organization account by ID.
 */
export async function getOrganization(orgId: string): Promise<Account | null>
⋮----
/**
 * Subscribes to real-time updates of an organization account document.
 * Returns an unsubscribe function.
 */
export function subscribeToOrganization(
  orgId: string,
  onUpdate: (org: Account | null) => void
): Unsubscribe
````

## File: src/features/organization.slice/core/index.ts
````typescript

````

## File: src/features/organization.slice/gov.members/_actions.ts
````typescript
/**
 * account-organization.member — _actions.ts
 *
 * Server actions for organization member management.
 *
 * Per logic-overview.md [R4] COMMAND_RESULT_CONTRACT:
 *   All mutations return CommandResult discriminated union.
 *
 * Invariant #1: This BC only writes its own aggregate.
 */
⋮----
import {
  type CommandResult,
  commandSuccess,
  commandFailureFrom,
} from "@/features/shared-kernel";
import {
  recruitOrganizationMember,
  dismissOrganizationMember,
} from "@/shared/infra/firestore/firestore.facade";
import type { MemberReference } from "@/shared/types";
⋮----
export async function recruitMember(
  organizationId: string,
  newId: string,
  name: string,
  email: string
): Promise<CommandResult>
⋮----
export async function dismissMember(
  organizationId: string,
  member: MemberReference
): Promise<CommandResult>
````

## File: src/features/organization.slice/gov.members/_components/members-view.tsx
````typescript
import { UserPlus, Trash2, Mail, AlertCircle, Sparkles } from "lucide-react"
import { useState, useEffect, useMemo } from "react"
⋮----
import { useI18n } from "@/config/i18n/i18n-provider"
import { getAllOrgMembersView } from "@/features/projection.bus"
import type { OrgEligibleMemberView } from "@/features/projection.bus"
import { useApp } from "@/shared/app-providers/app-context"
import { Badge } from "@/shared/shadcn-ui/badge"
import { Button } from "@/shared/shadcn-ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/shadcn-ui/card"
import { type MemberReference } from "@/shared/types"
import { PageHeader } from "@/shared/ui/page-header"
import { toast } from "@/shared/utility-hooks/use-toast"
⋮----
import { useMemberManagement } from '../_hooks/use-member-management'
⋮----
// FR-W1: eligible status map
⋮----
// FR-W1: fetch eligible status for all org members
⋮----
title=
⋮----
{/* FR-W1: eligible status badge */}
````

## File: src/features/organization.slice/gov.members/_hooks/use-member-management.ts
````typescript
import { useCallback } from 'react';
⋮----
import { useApp } from '@/shared/app-providers/app-context';
import type { MemberReference } from '@/shared/types';
⋮----
import {
  recruitMember as recruitMemberAction,
  dismissMember as dismissMemberAction,
} from '../_actions';
⋮----
export function useMemberManagement()
````

## File: src/features/organization.slice/gov.members/_queries.ts
````typescript
/**
 * account-organization.member — _queries.ts
 *
 * Read queries for org-level member management.
 *
 * Org members are stored as an array in accounts/{orgId}.members.
 * onSnapshot on the org document provides real-time member list updates.
 */
⋮----
import { db } from '@/shared/infra/firestore/firestore.client'
import { doc, onSnapshot, type Unsubscribe } from '@/shared/infra/firestore/firestore.read.adapter'
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter'
import type { Account, MemberReference } from '@/shared/types'
⋮----
/**
 * Fetches the members array of an organization account.
 */
export async function getOrgMembers(orgId: string): Promise<MemberReference[]>
⋮----
/**
 * Subscribes to real-time updates of an organization's member list.
 * Members are stored inline on the organization account document.
 * Returns an unsubscribe function.
 */
export function subscribeToOrgMembers(
  orgId: string,
  onUpdate: (members: MemberReference[]) => void
): Unsubscribe
````

## File: src/features/organization.slice/gov.members/index.ts
````typescript

````

## File: src/features/organization.slice/gov.partners/_actions.ts
````typescript
/**
 * account-organization.partner — _actions.ts
 *
 * Server actions for organization partner management.
 *
 * Per logic-overview.md [R4] COMMAND_RESULT_CONTRACT:
 *   All mutations return CommandResult discriminated union.
 *
 * Invariant #1: This BC only writes its own aggregate.
 */
⋮----
import {
  type CommandResult,
  commandSuccess,
  commandFailureFrom,
} from "@/features/shared-kernel";
import {
  createTeam as createTeamFacade,
  sendPartnerInvite as sendPartnerInviteFacade,
  dismissPartnerMember as dismissPartnerMemberFacade,
} from "@/shared/infra/firestore/firestore.facade";
import type { MemberReference } from "@/shared/types";
⋮----
export async function createPartnerGroup(
  organizationId: string,
  groupName: string
): Promise<CommandResult>
⋮----
export async function sendPartnerInvite(
  organizationId: string,
  teamId: string,
  email: string
): Promise<CommandResult>
⋮----
export async function dismissPartnerMember(
  organizationId: string,
  teamId: string,
  member: MemberReference
): Promise<CommandResult>
````

## File: src/features/organization.slice/gov.partners/_components/partner-detail-view.tsx
````typescript
import { 
  ArrowLeft, 
  MailPlus, 
  Trash2, 
  Globe, 
  Clock, 
  ShieldCheck,
  SendHorizontal
} from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useState, useEffect, useMemo } from "react"
⋮----
import { useApp } from "@/shared/app-providers/app-context"
import { Badge } from "@/shared/shadcn-ui/badge"
import { Button } from "@/shared/shadcn-ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/shared/shadcn-ui/card"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/shared/shadcn-ui/dialog"
import { Input } from "@/shared/shadcn-ui/input"
import { Label } from "@/shared/shadcn-ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/shadcn-ui/tabs"
import type { PartnerInvite, MemberReference , Team } from "@/shared/types"
import { PageHeader } from "@/shared/ui/page-header"
import { toast } from "@/shared/utility-hooks/use-toast"
⋮----
import { usePartnerManagement } from "../_hooks/use-partner-management"
import { subscribeToOrgPartnerInvites } from "../_queries"
⋮----
/**
 * PartnerDetailView - Manages recruitment and identity governance within a specific partner team.
 * Invites are subscribed directly from `accounts/{orgId}/invites` (Account BC / Subject Center)
 * via subscribeToOrgPartnerInvites — NOT via useAccount (WorkspaceContainer).
 */
⋮----
// Subscribe to this org's invites directly (Account BC data — accounts/{orgId}/invites)
⋮----
const handleSendInvite = async () =>
⋮----
const handleDismissMember = async (member: MemberReference) =>
````

## File: src/features/organization.slice/gov.partners/_components/partners-view.tsx
````typescript
import { Handshake, Plus, ArrowRight, Globe, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect, useMemo } from "react"
⋮----
import { useI18n } from "@/config/i18n/i18n-provider"
import { useApp } from "@/shared/app-providers/app-context"
import { Badge } from "@/shared/shadcn-ui/badge"
import { Button } from "@/shared/shadcn-ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/shared/shadcn-ui/card"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/shared/shadcn-ui/dialog"
import { Input } from "@/shared/shadcn-ui/input"
import { Label } from "@/shared/shadcn-ui/label"
import type { Team } from "@/shared/types"
import { PageHeader } from "@/shared/ui/page-header"
import { toast } from "@/shared/utility-hooks/use-toast"
⋮----
import { usePartnerManagement } from "../_hooks/use-partner-management"
⋮----
/**
 * PartnersView - Manages logical groupings of EXTERNAL partners (Partner Teams).
 * Principle: Create a team first, then invite members into it.
 */
⋮----
title=
⋮----
<span className="font-mono text-[9px] text-muted-foreground">TID:
````

## File: src/features/organization.slice/gov.partners/_hooks/use-partner-management.ts
````typescript
import { useCallback } from 'react';
⋮----
import { useApp } from '@/shared/app-providers/app-context';
import type { MemberReference } from '@/shared/types';
⋮----
import {
  createPartnerGroup as createPartnerGroupAction,
  sendPartnerInvite as sendPartnerInviteAction,
  dismissPartnerMember as dismissPartnerMemberAction,
} from '../_actions';
⋮----
export function usePartnerManagement()
````

## File: src/features/organization.slice/gov.partners/_queries.ts
````typescript
/**
 * account-organization.partner — _queries.ts
 *
 * Read queries for org-level external partner management.
 *
 * Partners are stored as `accounts/{orgId}.teams[]` (type === 'external').
 * onSnapshot on the org account document provides real-time updates.
 *
 * Per logic-overview.md:
 *   ORGANIZATION_PARTNER["organization-governance.partner（合作夥伴 · 外部組視圖）"]
 *   ORGANIZATION_PARTNER -.->|外部帳號擁有標籤（唯讀引用）| SKILL_TAG_POOL
 *
 * Boundary constraint:
 *   These queries read ONLY from this org's account document and subcollections.
 *   Skill tag data is referenced by tagSlug — read from skill-xp.slice.
 */
⋮----
import { db } from '@/shared/infra/firestore/firestore.client';
import { collection, doc, onSnapshot, orderBy, query, type Unsubscribe } from '@/shared/infra/firestore/firestore.read.adapter';
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
import type { Account, PartnerInvite, Team } from '@/shared/types';
⋮----
/**
 * Fetches all external partner groups for an organization.
 * Partner groups have `type === 'external'`.
 */
export async function getOrgPartners(orgId: string): Promise<Team[]>
⋮----
/**
 * Subscribes to real-time updates of an organization's external partner list.
 * Partners are stored inline on the organization account document.
 * Returns an unsubscribe function.
 */
export function subscribeToOrgPartners(
  orgId: string,
  onUpdate: (partners: Team[]) => void
): Unsubscribe
⋮----
/**
 * Subscribes to real-time partner invite updates for an organization.
 *
 * Invites are stored at `accounts/{orgId}/invites` — this is Account BC (Subject Center) data.
 * Components in account-organization.partner MUST use this query instead of reading
 * invites through useAccount (WorkspaceContainer) to respect BC boundaries.
 *
 * Boundary invariant: Subject Center components must not cross into WorkspaceContainer
 * to read data that belongs to the Subject Center.
 */
export function subscribeToOrgPartnerInvites(
  orgId: string,
  onUpdate: (invites: PartnerInvite[]) => void
): Unsubscribe
````

## File: src/features/organization.slice/gov.partners/index.ts
````typescript

````

## File: src/features/organization.slice/gov.policy/_actions.ts
````typescript
/**
 * account-organization.policy — _actions.ts
 *
 * Server actions for organization-level policy management.
 *
 * Per logic-overview.md:
 *   ORGANIZATION_EVENT_BUS →|政策變更事件| WORKSPACE_ORG_POLICY_CACHE
 *   Policy changes flow through the org event bus to update workspace's local org-policy cache.
 *
 * Per logic-overview.md [R4] COMMAND_RESULT_CONTRACT:
 *   All mutations return CommandResult discriminated union.
 *
 * Invariant #1: This BC only writes its own aggregate.
 */
⋮----
import {
  type CommandResult,
  commandSuccess,
  commandFailureFrom,
} from '@/features/shared-kernel';
import { addDocument, updateDocument, deleteDocument } from '@/shared/infra/firestore/firestore.write.adapter';
⋮----
import { publishOrgEvent } from '../core.event-bus';
⋮----
export interface OrgPolicy {
  id: string;
  orgId: string;
  name: string;
  description: string;
  rules: OrgPolicyRule[];
  scope: 'workspace' | 'member' | 'global';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
⋮----
export interface OrgPolicyRule {
  resource: string;
  actions: string[];
  effect: 'allow' | 'deny';
  conditions?: Record<string, string>;
}
⋮----
export interface CreateOrgPolicyInput {
  orgId: string;
  name: string;
  description: string;
  rules: OrgPolicyRule[];
  scope: OrgPolicy['scope'];
}
⋮----
export interface UpdateOrgPolicyInput {
  name?: string;
  description?: string;
  rules?: OrgPolicyRule[];
  scope?: OrgPolicy['scope'];
  isActive?: boolean;
}
⋮----
/**
 * Creates a new organization policy.
 * Publishes OrgPolicyChanged event → workspace org-policy-cache updates downstream.
 */
export async function createOrgPolicy(input: CreateOrgPolicyInput): Promise<CommandResult>
⋮----
/**
 * Updates an existing organization policy.
 */
export async function updateOrgPolicy(
  policyId: string,
  orgId: string,
  input: UpdateOrgPolicyInput
): Promise<CommandResult>
⋮----
/**
 * Deletes an organization policy.
 */
export async function deleteOrgPolicy(policyId: string, orgId: string): Promise<CommandResult>
````

## File: src/features/organization.slice/gov.policy/_hooks/use-org-policy.ts
````typescript
/**
 * account-organization.policy — _hooks/use-org-policy.ts
 *
 * React hook for subscribing to organization policies.
 */
⋮----
import { useState, useEffect } from 'react';
⋮----
import type { OrgPolicy } from '../_actions';
import { subscribeToOrgPolicies } from '../_queries';
⋮----
export function useOrgPolicy(orgId: string | null)
````

## File: src/features/organization.slice/gov.policy/_queries.ts
````typescript
/**
 * account-organization.policy — _queries.ts
 *
 * Read queries for organization policy management.
 * Used by workspace-application._org-policy-cache to subscribe to policy changes.
 */
⋮----
import { db } from '@/shared/infra/firestore/firestore.client';
import { collection, query, where, onSnapshot, type Unsubscribe } from '@/shared/infra/firestore/firestore.read.adapter';
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
⋮----
import type { OrgPolicy } from './_actions';
⋮----
/**
 * Fetches a single org policy by ID.
 */
export async function getOrgPolicy(policyId: string): Promise<OrgPolicy | null>
⋮----
/**
 * Subscribes to all active policies for an organization.
 * Primary consumer: workspace-application._org-policy-cache (ACL anti-corruption layer).
 */
export function subscribeToOrgPolicies(
  orgId: string,
  onUpdate: (policies: OrgPolicy[]) => void
): Unsubscribe
⋮----
/**
 * Fetches all active policies for an org by scope.
 */
export async function getOrgPoliciesByScope(
  orgId: string,
  scope: OrgPolicy['scope']
): Promise<OrgPolicy[]>
````

## File: src/features/organization.slice/gov.policy/index.ts
````typescript
/**
 * organization.slice/gov.policy — Public API
 *
 * Organization-level policy management.
 * Policy changes publish via org event bus → workspace org-policy-cache updates downstream.
 *
 * Per logic-overview.md:
 *   ORGANIZATION_EVENT_BUS →|政策變更事件| WORKSPACE_ORG_POLICY_CACHE
 */
````

## File: src/features/organization.slice/gov.teams/_actions.ts
````typescript
/**
 * account-organization.team — _actions.ts
 *
 * Server actions for organization team management.
 *
 * Per logic-overview.md [R4] COMMAND_RESULT_CONTRACT:
 *   All mutations return CommandResult discriminated union.
 *
 * Invariant #1: This BC only writes its own aggregate.
 */
⋮----
import {
  type CommandResult,
  commandSuccess,
  commandFailureFrom,
} from "@/features/shared-kernel";
import {
  createTeam as createTeamFacade,
  updateTeamMembers as updateTeamMembersFacade,
} from "@/shared/infra/firestore/firestore.facade";
⋮----
export async function createTeam(
  organizationId: string,
  teamName: string,
  type: "internal" | "external"
): Promise<CommandResult>
⋮----
export async function updateTeamMembers(
  organizationId: string,
  teamId: string,
  memberId: string,
  action: "add" | "remove"
): Promise<CommandResult>
````

## File: src/features/organization.slice/gov.teams/_components/team-detail-view.tsx
````typescript
import { ArrowLeft, UserPlus, Trash2, Users } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useState, useEffect, useMemo } from "react"
⋮----
import { useTeamManagement } from "@/features/organization.slice"
import { useApp } from "@/shared/app-providers/app-context"
import { Button } from "@/shared/shadcn-ui/button"
import { Card, CardContent } from "@/shared/shadcn-ui/card"
import type { MemberReference, Team } from "@/shared/types"
import { PageHeader } from "@/shared/ui/page-header"
import { toast } from "@/shared/utility-hooks/use-toast"
⋮----
/**
 * TeamDetailView - 職責：管理特定團隊內的成員 (Team Member 清單)
 */
⋮----
const handleMemberToggle = async (memberId: string, action: 'add' | 'remove') =>
⋮----
<Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold uppercase text-primary" onClick=
````

## File: src/features/organization.slice/gov.teams/_components/teams-view.tsx
````typescript
import { Users, Plus, FolderTree, ArrowRight, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect, useMemo } from "react"
⋮----
import { useI18n } from "@/config/i18n/i18n-provider"
import { useTeamManagement } from "@/features/organization.slice"
import { useApp } from "@/shared/app-providers/app-context"
import { Badge } from "@/shared/shadcn-ui/badge"
import { Button } from "@/shared/shadcn-ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/shared/shadcn-ui/card"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/shared/shadcn-ui/dialog"
import { Input } from "@/shared/shadcn-ui/input"
import { Label } from "@/shared/shadcn-ui/label"
import type { Team } from "@/shared/types"
import { PageHeader } from "@/shared/ui/page-header"
import { toast } from "@/shared/utility-hooks/use-toast"
⋮----
/**
 * TeamsView - Manages the logical groupings of INTERNAL members within the dimension.
 */
⋮----
title=
⋮----
<span className="font-mono text-[9px] text-muted-foreground">ID:
````

## File: src/features/organization.slice/gov.teams/_hooks/use-team-management.ts
````typescript
import { useCallback } from 'react';
⋮----
import { useApp } from '@/shared/app-providers/app-context';
⋮----
import {
  createTeam as createTeamAction,
  updateTeamMembers as updateTeamMembersAction,
} from '../_actions';
⋮----
export function useTeamManagement()
````

## File: src/features/organization.slice/gov.teams/_queries.ts
````typescript
/**
 * account-organization.team — _queries.ts
 *
 * Read queries for org-level internal team management.
 *
 * Teams are stored as `accounts/{orgId}.teams[]` (type === 'internal').
 * onSnapshot on the org account document provides real-time updates.
 *
 * Per logic-overview.md:
 *   ORGANIZATION_TEAM["organization-governance.team（團隊管理 · 內部組視圖）"]
 *   ORGANIZATION_TEAM -.->|組內帳號標籤聚合視圖（唯讀）| SKILL_TAG_POOL
 *
 * Boundary constraint:
 *   These queries read ONLY from this org's account document.
 *   Skill tag data is referenced by tagSlug — read from skill-xp.slice.
 */
⋮----
import { db } from '@/shared/infra/firestore/firestore.client';
import { doc, onSnapshot, type Unsubscribe } from '@/shared/infra/firestore/firestore.read.adapter';
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
import type { Account, Team } from '@/shared/types';
⋮----
/**
 * Fetches all internal teams for an organization.
 * Internal teams have `type === 'internal'`.
 */
export async function getOrgTeams(orgId: string): Promise<Team[]>
⋮----
/**
 * Subscribes to real-time updates of an organization's internal team list.
 * Teams are stored inline on the organization account document.
 * Returns an unsubscribe function.
 */
export function subscribeToOrgTeams(
  orgId: string,
  onUpdate: (teams: Team[]) => void
): Unsubscribe
````

## File: src/features/organization.slice/gov.teams/index.ts
````typescript

````

## File: src/features/organization.slice/index.ts
````typescript
/**
 * organization.slice — Public API
 *
 * Consolidated VS4 Organization vertical slice.
 * Covers: Organization Core, Organization Event Bus,
 *         Gov Teams, Gov Members, Gov Partners, Gov Policy.
 *
 * External consumers import exclusively from this file.
 */
⋮----
// =================================================================
// Core (organization-core.aggregate + lifecycle)
// =================================================================
⋮----
// =================================================================
// Core Event Bus (organization-core.event-bus)
// =================================================================
⋮----
// =================================================================
// Gov Teams (account-organization.team)
// =================================================================
⋮----
// =================================================================
// Gov Members (account-organization.member)
// =================================================================
⋮----
// =================================================================
// Gov Partners (account-organization.partner)
// =================================================================
⋮----
// =================================================================
// Gov Policy (account-organization.policy)
// =================================================================
````

## File: src/features/projection.bus/_funnel.ts
````typescript
/**
 * projection.bus — _funnel.ts
 *
 * EVENT_FUNNEL_INPUT: unified entry point for the Projection Layer.
 *
 * Per logic-overview.md (L5 · ProjectionBus Infrastructure):
 *   WORKSPACE_EVENT_BUS  → |所有業務事件|  EVENT_FUNNEL_INPUT
 *   ORGANIZATION_EVENT_BUS → |所有組織事件| EVENT_FUNNEL_INPUT
 *   TAG_LIFECYCLE_BUS → |TagLifecycleEvent| EVENT_FUNNEL_INPUT  (v5 新增)
 *
 *   EVENT_FUNNEL_INPUT routes to:
 *     → WORKSPACE_PROJECTION_VIEW
 *     → WORKSPACE_SCOPE_READ_MODEL
 *     → ACCOUNT_PROJECTION_VIEW
 *     → ACCOUNT_PROJECTION_AUDIT
 *     → ACCOUNT_PROJECTION_SCHEDULE
 *     → ORGANIZATION_PROJECTION_VIEW
 *     → ACCOUNT_SKILL_VIEW
 *     → ORG_ELIGIBLE_MEMBER_VIEW
 *     → TAG_SNAPSHOT (v5 新增)
 *     → PROJECTION_VERSION (updates stream offset)
 *
 *   WORKSPACE_EVENT_STORE -.→ EVENT_FUNNEL_INPUT (replay rebuilds all projections)
 *
 * Call `registerWorkspaceFunnel(bus)`, `registerOrganizationFunnel()`, and
 * `registerTagFunnel()` once at app startup.
 */
⋮----
import { onOrgEvent } from '@/features/organization.slice';
import { handleScheduleProposed } from '@/features/scheduling.slice';
import {
  applyDemandProposed,
  applyDemandAssigned,
  applyDemandCompleted,
  applyDemandAssignmentCancelled,
  applyDemandProposalCancelled,
  applyDemandAssignRejected,
} from '@/features/scheduling.slice';
import { onTagEvent } from '@/features/shared-kernel';
import { applySkillXpAdded, applySkillXpDeducted } from '@/features/skill-xp.slice';
import {
  handleTagUpdatedForPool,
  handleTagDeprecatedForPool,
  handleTagDeletedForPool,
} from '@/features/skill-xp.slice';
import type { WorkspaceEventBus } from '@/features/workspace.slice';
⋮----
import { upsertProjectionVersion } from './_registry';
import { appendAuditEntry } from './account-audit';
import { applyScheduleAssigned, applyScheduleCompleted } from './account-schedule';
import {
  applyOrgMemberSkillXp,
  initOrgMemberEntry,
  removeOrgMemberEntry,
  updateOrgMemberEligibility,
} from './org-eligible-member-view';
import { applyMemberJoined, applyMemberLeft } from './organization-view';
import {
  applyTagCreated,
  applyTagUpdated,
  applyTagDeprecated,
  applyTagDeleted,
} from './tag-snapshot';
⋮----
/**
 * Registers workspace event handlers on the bus to keep projections in sync.
 * Returns a cleanup function.
 *
 * Note: projection updates are fire-and-forget (non-blocking to the UI event cycle).
 */
export function registerWorkspaceFunnel(bus: WorkspaceEventBus): () => void
⋮----
// workspace:tasks:assigned → PROJECTION_VERSION (stream offset, A-track → registry consistency)
// Per logic-overview.md: EVENT_FUNNEL_INPUT →|更新事件串流偏移量| PROJECTION_VERSION
⋮----
// workspace:tasks:blocked → ACCOUNT_PROJECTION_AUDIT
⋮----
// [R8] forward traceId from payload so globalAuditView record contains traceId
// Use truthy check to exclude both undefined AND empty strings per R8.
⋮----
// workspace:issues:resolved → ACCOUNT_PROJECTION_AUDIT + workflow unblock stream offset
// Per logic-overview.md:
//   TRACK_B_ISSUES →|IssueResolved 事件| WORKSPACE_EVENT_BUS
//   A 軌自行訂閱後恢復（Discrete Recovery Principle — not direct back-flow）
// The funnel records audit + stream offset for replay consistency (Invariant A7).
// A-track task recovery is handled by the tasks slice subscribing to this event.
⋮----
// [R8] forward traceId from payload so globalAuditView record contains traceId
// Use truthy check to exclude both undefined AND empty strings per R8.
⋮----
// Track stream offset for workflow unblock (per Invariant A7 — Event Funnel is projection compose only)
⋮----
// WORKSPACE_OUTBOX →|ScheduleProposed（跨層事件）| ORGANIZATION_SCHEDULE
⋮----
// Demand Board: create open demand entry. FR-W0.
⋮----
// workspace:document-parser:itemsExtracted → PROJECTION_VERSION (stream offset)
// ParsingIntent creates Firestore documents via direct writes; the funnel records
// the stream offset so the projection registry stays consistent.
// Per logic-overview.md: EVENT_FUNNEL_INPUT →|更新事件串流偏移量| PROJECTION_VERSION
⋮----
// workspace:tasks:assigned → PROJECTION_VERSION (stream offset)
// Per logic-overview.md: EVENT_FUNNEL_INPUT →|更新事件串流偏移量| PROJECTION_VERSION
// Tracking assignment events ensures the projection registry reflects the A-track
// task-assignment → schedule trigger flow (TRACK_A_TASKS -.→ W_B_SCHEDULE).
⋮----
/**
 * Registers organization event handlers to keep org and schedule projections in sync.
 * Returns a cleanup function.
 */
export function registerOrganizationFunnel(): () => void
⋮----
// ScheduleAssigned → ACCOUNT_PROJECTION_SCHEDULE + ORG_ELIGIBLE_MEMBER_VIEW (eligible = false) + DEMAND_BOARD
// Per Invariant #15: schedule:assigned must update the eligible flag so double-booking is prevented.
// Per Invariant #19 [R7]: pass aggregateVersion for ELIGIBLE_UPDATE_GUARD monotonic check.
// [R8] TRACE_PROPAGATION_RULE: forward traceId from ScheduleAssignedPayload to projector.
// FR-W6: demand board updated to 'assigned' with assignedMemberId.
⋮----
// ScheduleCompleted → ACCOUNT_PROJECTION_SCHEDULE + ORG_ELIGIBLE_MEMBER_VIEW (eligible = true) + DEMAND_BOARD (closed)
// Per Invariant #15: completed → eligible = true (member available for new assignments).
// [R8] traceId forwarded through the full saga chain.
⋮----
// ScheduleAssignmentCancelled → ORG_ELIGIBLE_MEMBER_VIEW (eligible = true) + DEMAND_BOARD (closed)
// Per Invariant #15: post-assignment cancellation restores eligible flag to true.
// No change to account-schedule projection status — the assignment record remains for audit.
// [R8] traceId forwarded through the full saga chain.
⋮----
// ScheduleProposalCancelled → DEMAND_BOARD (closed/proposalCancelled)
// Compensating event (Invariant A5): HR cancelled a pending proposal.
⋮----
// ScheduleAssignRejected → DEMAND_BOARD (closed/assignRejected)
// Compensating event (Invariant A5): skill-tier check failed — demand closed.
⋮----
// Member joined → ORGANIZATION_PROJECTION_VIEW + ORG_ELIGIBLE_MEMBER_VIEW
// [R8] TRACE_PROPAGATION_RULE: forward traceId from OrgMemberJoinedPayload to projector.
⋮----
// Member left → ORGANIZATION_PROJECTION_VIEW + ORG_ELIGIBLE_MEMBER_VIEW
⋮----
// SkillXpAdded → ACCOUNT_SKILL_VIEW + ORG_ELIGIBLE_MEMBER_VIEW
// Invariant #12: newXp is stored; tier is NEVER stored — derived at query time via resolveSkillTier(xp).
// [S2] aggregateVersion forwarded so the account-skill-view version guard fires.
// [R8] traceId forwarded into accountSkillView for end-to-end trace propagation.
⋮----
// SkillXpDeducted → ACCOUNT_SKILL_VIEW + ORG_ELIGIBLE_MEMBER_VIEW
// [S2] aggregateVersion forwarded so the account-skill-view version guard fires.
// [R8] traceId forwarded into accountSkillView for end-to-end trace propagation.
⋮----
// SkillRecognitionGranted / Revoked → track stream offset for replay consistency (Invariant A7)
// Recognition state is owned by ORG_SKILL_RECOGNITION aggregate; these events don't change
// XP or eligibility — they record the org's acknowledgment only.
⋮----
/**
 * Registers tag lifecycle event handlers to keep the TAG_SNAPSHOT projection in sync.
 * Also delegates to VS4_TAG_SUBSCRIBER to update SKILL_TAG_POOL. [R3]
 * Returns a cleanup function.
 *
 * Per logic-overview.md [R3]:
 *   IER BACKGROUND_LANE → VS4_TAG_SUBSCRIBER → SKILL_TAG_POOL
 *
 * Per logic-overview.md (L5 · ProjectionBus Infrastructure):
 *   IER ==>|"#9 唯一寫入路徑"| FUNNEL
 *   FUNNEL --> TAG_SNAPSHOT
 *
 * Invariant A7: Event Funnel only composes projections; does not enforce cross-BC invariants.
 */
export function registerTagFunnel(): () => void
⋮----
// tag:created → TAG_SNAPSHOT
⋮----
// tag:updated → TAG_SNAPSHOT + SKILL_TAG_POOL (via VS4_TAG_SUBSCRIBER [R3])
⋮----
// tag:deprecated → TAG_SNAPSHOT + SKILL_TAG_POOL (via VS4_TAG_SUBSCRIBER [R3])
⋮----
// tag:deleted → TAG_SNAPSHOT + SKILL_TAG_POOL (via VS4_TAG_SUBSCRIBER [R3])
⋮----
/**
 * Replays events from the event store to rebuild all workspace projections.
 * Implements: WORKSPACE_EVENT_STORE -.→ EVENT_FUNNEL_INPUT
 */
export async function replayWorkspaceProjections(
  workspaceId: string
): Promise<
````

## File: src/features/projection.bus/_query-registration.ts
````typescript
/**
 * projection.bus — _query-registration.ts
 *
 * Registers all v9 GW_QUERY routes with infra.gateway-query at startup.
 *
 * Per logic-overview.md GW_QUERY subgraph:
 *   QGWAY_SCHED  → projection.org-eligible-member-view  [#14][#15][#16][P4][R7]
 *   QGWAY_NOTIF  → projection.account-view             [#6 FCM Token]
 *   QGWAY_SCOPE  → projection.workspace-scope-guard    [#A9]
 *   QGWAY_WALLET → projection.wallet-balance (EVENTUAL_READ [Q8][D5])
 *
 * Call registerAllQueryHandlers() once at app startup, after all projection
 * slices are initialized. Follows the same pattern as registerWorkspaceFunnel().
 */
⋮----
import { registerQuery, QUERY_ROUTES } from '@/features/infra.gateway-query';
⋮----
import { getAccountView } from './account-view';
import { getOrgEligibleMembersWithTier } from './org-eligible-member-view';
import { getDisplayWalletBalance } from './wallet-balance';
import { queryWorkspaceAccess } from './workspace-scope-guard';
⋮----
/**
 * Register all four v9 QUERY_ROUTES with their projection handlers.
 *
 * Call once at app startup after all projection slices are initialized,
 * following the same pattern as registerWorkspaceFunnel().
 * Calling this multiple times is safe — registerQuery() overwrites any
 * existing handler with the same name.
 *
 * @returns Array of un-register functions for cleanup in tests or hot-reload.
 */
export function registerAllQueryHandlers(): Array<() => void>
````

## File: src/features/projection.bus/_registry.ts
````typescript
/**
 * projection.bus — _registry.ts
 *
 * Event stream offset + read model version table.
 *
 * Per logic-overview.md:
 * - EVENT_FUNNEL_INPUT →|更新事件串流偏移量| PROJECTION_VERSION
 * - PROJECTION_VERSION →|提供 read-model 對應版本| READ_MODEL_REGISTRY
 */
⋮----
import {
  getProjectionVersion as getProjectionVersionRepo,
  upsertProjectionVersion as upsertProjectionVersionRepo,
  type ProjectionVersionRecord,
} from '@/shared/infra/firestore/firestore.facade';
⋮----
/**
 * Retrieves the current event offset and version for a named projection.
 * Returns null if the projection has never been updated.
 */
export async function getProjectionVersion(
  projectionName: string
): Promise<ProjectionVersionRecord | null>
⋮----
/**
 * Updates the event offset and read model version for a named projection.
 * Called by EVENT_FUNNEL_INPUT after processing each event.
 */
export async function upsertProjectionVersion(
  projectionName: string,
  lastEventOffset: number,
  readModelVersion: string
): Promise<void>
````

## File: src/features/projection.bus/account-audit/_projector.ts
````typescript
/**
 * projection.account-audit — _projector.ts
 *
 * Maintains the account audit projection.
 * Stored at: auditProjection/{accountId}/entries/{entryId}
 *
 * Per logic-overview.md:
 *   EVENT_FUNNEL_INPUT → ACCOUNT_PROJECTION_AUDIT
 *
 * [S2] Append-Only Idempotency Model:
 *   Unlike state-update projections, this projection APPENDS a new document per
 *   event — there is no existing record to overwrite.  The traditional
 *   versionGuardAllows check (aggregateVersion > lastProcessedVersion) does not
 *   apply here; instead idempotency is achieved by using the event-store `eventId`
 *   as the Firestore document key when available.
 *
 *   • In-process event bus path  (funnel → addDocument) — events fire once;
 *     duplicate exposure is not possible at this layer.
 *   • Event-store replay path    (replay → setDoc(eventId)) — identical events
 *     overwrite with identical data, preventing duplicate log entries.
 *
 *   Callers SHOULD pass `eventId` whenever one is available to enable idempotent
 *   writes on replay.
 */
⋮----
import { db } from '@/shared/infra/firestore/firestore.client';
import { doc, collection } from '@/shared/infra/firestore/firestore.read.adapter';
import { serverTimestamp, setDoc } from '@/shared/infra/firestore/firestore.write.adapter';
import { addDocument } from '@/shared/infra/firestore/firestore.write.adapter';
⋮----
export interface AuditProjectionEntry {
  id: string;
  accountId: string;
  eventType: string;
  actorId: string;
  targetId?: string;
  summary: string;
  /** traceId carried from the originating EventEnvelope [R8] */
  traceId?: string;
  metadata?: Record<string, unknown>;
  occurredAt: ReturnType<typeof serverTimestamp>;
}
⋮----
/** traceId carried from the originating EventEnvelope [R8] */
⋮----
/**
 * Appends an audit event to the account audit projection.
 *
 * @param accountId - Account that owns this audit log.
 * @param entry     - Audit fields (traceId MUST be forwarded from the originating
 *                    EventEnvelope per [R8]).
 * @param eventId   - Optional: stable event-store identifier.  When supplied the
 *                    write uses `setDoc(eventId)` to guarantee idempotency on
 *                    event-store replay [S2].  When omitted (in-process bus path)
 *                    an auto-generated ID is used via `addDocument`.
 * @returns The Firestore document ID of the written entry.
 */
export async function appendAuditEntry(
  accountId: string,
  entry: Omit<AuditProjectionEntry, 'id' | 'occurredAt'>,
  eventId?: string
): Promise<string>
⋮----
// [S2] Event-store replay path: use eventId as document key for idempotency.
⋮----
// In-process event bus path: auto-generated ID (events fire exactly once).
````

## File: src/features/projection.bus/account-audit/_queries.ts
````typescript
/**
 * projection.account-audit — _queries.ts
 *
 * Read-side queries for the account audit projection.
 */
⋮----
import { db } from '@/shared/infra/firestore/firestore.client';
import { createConverter } from '@/shared/infra/firestore/firestore.converter';
import { collection, query, orderBy, limit } from '@/shared/infra/firestore/firestore.read.adapter';
import { getDocuments } from '@/shared/infra/firestore/firestore.read.adapter';
⋮----
import type { AuditProjectionEntry } from './_projector';
⋮----
export async function getAccountAuditEntries(
  accountId: string,
  maxEntries = 50
): Promise<AuditProjectionEntry[]>
````

## File: src/features/projection.bus/account-audit/index.ts
````typescript
/**
 * projection.account-audit — Public API
 *
 * Account audit projection.
 * Fed by EVENT_FUNNEL_INPUT.
 *
 * Per logic-overview.md:
 *   EVENT_FUNNEL_INPUT → ACCOUNT_PROJECTION_AUDIT
 */
````

## File: src/features/projection.bus/account-schedule/_projector.ts
````typescript
/**
 * projection.account-schedule — _projector.ts
 *
 * Maintains the account schedule projection read model.
 * Tracks active schedule assignments per account for availability filtering.
 *
 * Stored at: scheduleProjection/{accountId}
 *
 * Per logic-overview.md (PROJ_BUS STD_PROJ):
 *   ACC_SCHED_V["projection.account-schedule"]
 *   EVENT_FUNNEL_INPUT → ACCOUNT_PROJECTION_SCHEDULE
 *   ORG_SCH -.→ ACCOUNT_PROJECTION_SCHEDULE (過濾可用帳號)
 *
 * [S2] SK_VERSION_GUARD: versionGuardAllows enforced before every write.
 * [R8] traceId from the originating EventEnvelope is propagated into the record.
 */
⋮----
import { versionGuardAllows } from '@/features/shared-kernel';
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
import { serverTimestamp } from '@/shared/infra/firestore/firestore.write.adapter';
import { setDocument } from '@/shared/infra/firestore/firestore.write.adapter';
⋮----
export interface AccountScheduleProjection {
  accountId: string;
  /** Active schedule assignment IDs */
  activeAssignmentIds: string[];
  /** Map of scheduleItemId → assignment detail */
  assignmentIndex: Record<string, AccountScheduleAssignment>;
  readModelVersion: number;
  /** Last aggregate version processed by this projection [S2] */
  lastProcessedVersion?: number;
  /** TraceId from the originating EventEnvelope [R8] */
  traceId?: string;
  updatedAt: ReturnType<typeof serverTimestamp>;
}
⋮----
/** Active schedule assignment IDs */
⋮----
/** Map of scheduleItemId → assignment detail */
⋮----
/** Last aggregate version processed by this projection [S2] */
⋮----
/** TraceId from the originating EventEnvelope [R8] */
⋮----
export interface AccountScheduleAssignment {
  scheduleItemId: string;
  workspaceId: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'active' | 'completed';
}
⋮----
/**
 * Initialises or resets the schedule projection for an account.
 */
export async function initAccountScheduleProjection(accountId: string): Promise<void>
⋮----
/**
 * Adds a schedule assignment to the projection.
 * Updates both `assignmentIndex` (for detail lookups) and `activeAssignmentIds`
 * (for fast availability filtering).
 * [S2] versionGuardAllows enforced before write.
 * [R8] traceId forwarded from EventEnvelope.
 */
export async function applyScheduleAssigned(
  accountId: string,
  assignment: AccountScheduleAssignment,
  aggregateVersion?: number,
  traceId?: string
): Promise<void>
⋮----
/**
 * Marks a schedule assignment as completed in the projection.
 * Removes from `activeAssignmentIds` so availability filters exclude it.
 * [S2] versionGuardAllows enforced before write.
 * [R8] traceId forwarded from EventEnvelope.
 */
export async function applyScheduleCompleted(
  accountId: string,
  scheduleItemId: string,
  aggregateVersion?: number,
  traceId?: string
): Promise<void>
````

## File: src/features/projection.bus/account-schedule/_queries.ts
````typescript
/**
 * projection.account-schedule — _queries.ts
 *
 * Read-side queries for the account schedule projection.
 * Used by scheduling.slice to filter available accounts.
 *
 * [T5] TAG_SNAPSHOT consumers MUST NOT write — these are read-only queries.
 */
⋮----
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
⋮----
import type { AccountScheduleProjection, AccountScheduleAssignment } from './_projector';
⋮----
/**
 * Returns the full schedule projection for an account, or null if not initialised.
 */
export async function getAccountScheduleProjection(
  accountId: string
): Promise<AccountScheduleProjection | null>
⋮----
/**
 * Returns active (non-completed) assignments for an account.
 * Used by scheduling.slice to check availability before assigning.
 */
export async function getAccountActiveAssignments(
  accountId: string
): Promise<AccountScheduleAssignment[]>
````

## File: src/features/projection.bus/account-schedule/index.ts
````typescript
/**
 * projection.account-schedule — Public API
 *
 * Account schedule read model.
 * Tracks active assignments per account to support availability filtering.
 *
 * Per logic-overview.md (PROJ_BUS STD_PROJ):
 *   ACC_SCHED_V["projection.account-schedule"]
 *   Standard Projection: [S2 SK_VERSION_GUARD] [R8 traceId propagation]
 */
````

## File: src/features/projection.bus/account-view/_projector.ts
````typescript
/**
 * projection.account-view — _projector.ts
 *
 * Maintains the account projection read model + authority snapshot.
 * Implements shared-kernel.authority-snapshot contract.
 *
 * Stored at: accountView/{accountId}
 *
 * Per logic-overview.md:
 *   EVENT_FUNNEL_INPUT → ACCOUNT_PROJECTION_VIEW
 *   ACCOUNT_USER_NOTIFICATION -.→ ACCOUNT_PROJECTION_VIEW (content filtering by tag)
 *   ACCOUNT_PROJECTION_VIEW -.→ shared-kernel.authority-snapshot (contract)
 */
⋮----
import { versionGuardAllows } from '@/features/shared-kernel';
import type { AuthoritySnapshot } from '@/features/shared-kernel';
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
import { serverTimestamp } from '@/shared/infra/firestore/firestore.write.adapter';
import { setDocument, updateDocument } from '@/shared/infra/firestore/firestore.write.adapter';
import type { Account } from '@/shared/types';
⋮----
export interface AccountViewRecord {
  readonly implementsAuthoritySnapshot: true;
  accountId: string;
  name: string;
  accountType: 'user' | 'organization';
  email?: string;
  photoURL?: string;
  /** Roles this account holds across all org memberships (denormalized) */
  orgRoles: Record<string, string>; // orgId → role
  /** Skill tag slugs granted to this account */
  skillTagSlugs: string[];
  /** Internal/external membership flag for notification content filtering */
  membershipTag?: 'internal' | 'external';
  /** Latest authority snapshot */
  authoritySnapshot?: AuthoritySnapshot;
  readModelVersion: number;
  /** Last aggregate version processed by this projection [S2] */
  lastProcessedVersion?: number;
  /** TraceId from the originating EventEnvelope [R8] */
  traceId?: string;
  updatedAt: ReturnType<typeof serverTimestamp>;
}
⋮----
/** Roles this account holds across all org memberships (denormalized) */
orgRoles: Record<string, string>; // orgId → role
/** Skill tag slugs granted to this account */
⋮----
/** Internal/external membership flag for notification content filtering */
⋮----
/** Latest authority snapshot */
⋮----
/** Last aggregate version processed by this projection [S2] */
⋮----
/** TraceId from the originating EventEnvelope [R8] */
⋮----
export async function projectAccountSnapshot(
  account: Account,
  aggregateVersion?: number,
  traceId?: string
): Promise<void>
⋮----
export async function applyOrgRoleChange(
  accountId: string,
  orgId: string,
  role: string,
  aggregateVersion?: number,
  traceId?: string
): Promise<void>
⋮----
export async function applyAuthoritySnapshot(
  accountId: string,
  snapshot: AuthoritySnapshot,
  aggregateVersion?: number,
  traceId?: string
): Promise<void>
````

## File: src/features/projection.bus/account-view/_queries.ts
````typescript
/**
 * projection.account-view — _queries.ts
 *
 * Read-side queries for the account projection view.
 */
⋮----
import type { AuthoritySnapshot } from '@/features/shared-kernel';
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
⋮----
import type { AccountViewRecord } from './_projector';
⋮----
export async function getAccountView(accountId: string): Promise<AccountViewRecord | null>
⋮----
/**
 * Returns the latest authority snapshot for an account.
 * Used by notification content filtering (Layer 3).
 */
export async function getAccountAuthoritySnapshot(
  accountId: string
): Promise<AuthoritySnapshot | null>
⋮----
/**
 * Returns the membership tag ('internal' | 'external') for notification filtering.
 */
export async function getAccountMembershipTag(
  accountId: string
): Promise<'internal' | 'external' | null>
````

## File: src/features/projection.bus/account-view/index.ts
````typescript
/**
 * projection.account-view — Public API
 *
 * Account read model + authority snapshot contract.
 * Implements shared-kernel.authority-snapshot (invariant #8).
 *
 * Per logic-overview.md:
 *   EVENT_FUNNEL_INPUT → ACCOUNT_PROJECTION_VIEW
 *   ACCOUNT_USER_NOTIFICATION -.→ ACCOUNT_PROJECTION_VIEW (content filter)
 *   ACCOUNT_PROJECTION_VIEW -.→ shared-kernel.authority-snapshot
 */
````

## File: src/features/projection.bus/global-audit-view/_projector.ts
````typescript
// projection.global-audit-view · VS8 STANDARD_PROJ_LANE · logic-overview.md [S2][R8]
// GLOBAL_AUDIT_VIEW — cross-slice governance audit projection
// Feed path: AUDIT_COLLECTOR → IER BACKGROUND_LANE → FUNNEL → STANDARD_PROJ_LANE → here
⋮----
import type { EventEnvelope } from '@/features/shared-kernel';
import { db } from '@/shared/infra/firestore/firestore.client';
import { doc } from '@/shared/infra/firestore/firestore.read.adapter';
import { setDoc, serverTimestamp } from '@/shared/infra/firestore/firestore.write.adapter';
⋮----
export interface GlobalAuditRecord {
  readonly auditEventId: string;
  /** traceId carried through the full event chain [R8] */
  readonly traceId: string;
  readonly accountId: string;
  readonly workspaceId?: string;
  readonly eventType: string;
  readonly payload: Record<string, unknown>;
  readonly timestamp: number;
}
⋮----
/** traceId carried through the full event chain [R8] */
⋮----
export interface GlobalAuditQuery {
  accountId?: string;
  workspaceId?: string;
  limit?: number;
}
⋮----
/**
 * Appends a cross-slice audit record.
 * Extracts `traceId` from the EventEnvelope; MUST NOT omit it [R8].
 *
 * [S2] Idempotency: this projector uses `setDoc(envelope.eventId)` as the
 * document key.  Processing the same event twice overwrites with identical data
 * — preventing duplicate global-audit entries on event-store replay.
 * This is the append-only analogue of the versionGuardAllows check used by
 * state-update projections.
 */
export async function applyAuditEvent(
  envelope: EventEnvelope,
  payload: Record<string, unknown>,
  context: { accountId: string; workspaceId?: string }
): Promise<void>
````

## File: src/features/projection.bus/global-audit-view/_queries.ts
````typescript
// projection.global-audit-view · queries · logic-overview.md [R8]
// Read-only access to GLOBAL_AUDIT_VIEW. T5-equivalent: consumers MUST NOT write here.
⋮----
import { db } from '@/shared/infra/firestore/firestore.client';
import { collection, getDocs, where, limit, query as firestoreQuery } from '@/shared/infra/firestore/firestore.read.adapter';
⋮----
import type { GlobalAuditRecord, GlobalAuditQuery } from './_projector';
⋮----
/**
 * Returns global audit events, optionally filtered by accountId/workspaceId.
 */
export async function getGlobalAuditEvents(
  query: GlobalAuditQuery = {}
): Promise<GlobalAuditRecord[]>
⋮----
/**
 * Returns global audit events scoped to a specific workspace.
 */
export async function getGlobalAuditEventsByWorkspace(
  workspaceId: string,
  maxResults = 50
): Promise<GlobalAuditRecord[]>
````

## File: src/features/projection.bus/global-audit-view/index.ts
````typescript
// projection.global-audit-view · public API · logic-overview.md VS8 GLOBAL_AUDIT_VIEW [S2][R8]
````

## File: src/features/projection.bus/index.ts
````typescript
/**
 * projection.bus — Public API
 *
 * VS8 Projection Bus: the unified entry point, version registry, and home for
 * all projection view sub-slices.
 *
 * Nodes:
 *   - EVENT_FUNNEL_INPUT: routes events from all buses to individual projection handlers
 *   - PROJECTION_VERSION: event stream offset + read-model version table
 *   - READ_MODEL_REGISTRY: query handler registration for infra.gateway-query
 *
 * Sub-slices (projection views):
 *   account-audit            — ACCOUNT_PROJECTION_AUDIT
 *   account-view             — ACCOUNT_PROJECTION_VIEW (FCM token, authority snapshot)
 *   global-audit-view        — GLOBAL_AUDIT_VIEW [R8]
 *   org-eligible-member-view — ORG_ELIGIBLE_MEMBER_VIEW [#14–#16]
 *   organization-view        — ORGANIZATION_PROJECTION_VIEW
 *   tag-snapshot             — TAG_SNAPSHOT [T5]
 *   workspace-scope-guard    — WORKSPACE_SCOPE_READ_MODEL [#A9]
 *   workspace-view           — WORKSPACE_PROJECTION_VIEW
 *
 * Per logic-overview.md (VS8 Projection Bus):
 *   WORKSPACE_EVENT_BUS + ORGANIZATION_EVENT_BUS + TAG_LIFECYCLE_BUS
 *     → EVENT_FUNNEL_INPUT → all projection slices
 *
 * External consumers import from '@/features/projection.bus'.
 * Consumers call once at app startup:
 *   registerWorkspaceFunnel(bus)
 *   registerOrganizationFunnel()
 *   registerTagFunnel()
 *   registerAllQueryHandlers()
 */
⋮----
// =================================================================
// Event Funnel (EVENT_FUNNEL_INPUT — sole projection write path #9)
// =================================================================
⋮----
// =================================================================
// Projection Registry (PROJECTION_VERSION — event stream offset)
// =================================================================
⋮----
// =================================================================
// Query Registration (READ_MODEL_REGISTRY — GW_QUERY routes)
// =================================================================
⋮----
// =================================================================
// account-audit — ACCOUNT_PROJECTION_AUDIT
// =================================================================
⋮----
// =================================================================
// account-view — ACCOUNT_PROJECTION_VIEW [#6][#8]
// =================================================================
⋮----
// =================================================================
// global-audit-view — GLOBAL_AUDIT_VIEW [R8]
// =================================================================
⋮----
// =================================================================
// org-eligible-member-view — ORG_ELIGIBLE_MEMBER_VIEW [#14–#16][R7]
// =================================================================
⋮----
// =================================================================
// organization-view — ORGANIZATION_PROJECTION_VIEW
// =================================================================
⋮----
// =================================================================
// tag-snapshot — TAG_SNAPSHOT [T5][S4]
// =================================================================
⋮----
// =================================================================
// workspace-scope-guard — WORKSPACE_SCOPE_READ_MODEL [#A9] CRITICAL ≤500ms
// =================================================================
⋮----
// =================================================================
// workspace-view — WORKSPACE_PROJECTION_VIEW
// =================================================================
````

## File: src/features/projection.bus/org-eligible-member-view/_projector.ts
````typescript
/**
 * projection.org-eligible-member-view — _projector.ts
 *
 * Organization-scoped eligible member read model.
 * Used exclusively by organization.schedule to determine assignable members
 * and validate skill tier requirements WITHOUT querying Account aggregates directly.
 *
 * Per logic-overview.md invariants:
 *   #12 — Tier is NEVER stored; derived at query time via resolveSkillTier(xp).
 *   #14 — Schedule reads ONLY this projection (org-eligible-member-view).
 *
 * Stored at: orgEligibleMemberView/{orgId}/members/{accountId}
 *
 * Event sources (via EVENT_FUNNEL_INPUT):
 *   organization:skill:xpAdded   → applyOrgMemberSkillXp
 *   organization:skill:xpDeducted → applyOrgMemberSkillXp
 *   organization:member:joined    → initOrgMemberEntry
 *   organization:member:left      → removeOrgMemberEntry
 */
⋮----
import { versionGuardAllows } from '@/features/shared-kernel';
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
import { serverTimestamp } from '@/shared/infra/firestore/firestore.write.adapter';
import { setDocument, updateDocument, deleteDocument } from '@/shared/infra/firestore/firestore.write.adapter';
⋮----
/**
 * Per-member entry stored in Firestore.
 *
 * `skills` maps tagSlug → { xp }.
 * `tier` is intentionally absent — derived at read time via resolveSkillTier(xp).
 * `eligible` is a fast-path flag; consumers SHOULD re-verify via skill requirements.
 * `lastProcessedVersion` is the highest aggregateVersion seen for this member's
 *   eligibility-affecting events; used by ELIGIBLE_UPDATE_GUARD [R7][#19].
 */
export interface OrgEligibleMemberEntry {
  orgId: string;
  accountId: string;
  /** Map of skillId (tagSlug) → { xp }. Tier must be derived, never stored. */
  skills: Record<string, { xp: number }>;
  /** True when the member has no active conflicting assignments and is in the org. */
  eligible: boolean;
  /**
   * Highest aggregateVersion processed for this entry's eligibility. [R7][#19]
   * ELIGIBLE_UPDATE_GUARD: only update when incomingVersion > lastProcessedVersion.
   * Prevents out-of-order events (e.g. ScheduleCompleted arriving before ScheduleAssigned)
   * from reverting the eligible flag to an incorrect state.
   */
  lastProcessedVersion: number;
  /**
   * Highest skill-aggregate version processed for XP updates. [S2]
   * XP_VERSION_GUARD: only update when incomingSkillVersion > lastProcessedSkillVersion.
   * Prevents stale XP from overwriting a newer value due to out-of-order delivery.
   */
  lastProcessedSkillVersion: number;
  readModelVersion: number;
  /** TraceId from the originating EventEnvelope [R8] */
  traceId?: string;
  updatedAt: ReturnType<typeof serverTimestamp>;
}
⋮----
/** Map of skillId (tagSlug) → { xp }. Tier must be derived, never stored. */
⋮----
/** True when the member has no active conflicting assignments and is in the org. */
⋮----
/**
   * Highest aggregateVersion processed for this entry's eligibility. [R7][#19]
   * ELIGIBLE_UPDATE_GUARD: only update when incomingVersion > lastProcessedVersion.
   * Prevents out-of-order events (e.g. ScheduleCompleted arriving before ScheduleAssigned)
   * from reverting the eligible flag to an incorrect state.
   */
⋮----
/**
   * Highest skill-aggregate version processed for XP updates. [S2]
   * XP_VERSION_GUARD: only update when incomingSkillVersion > lastProcessedSkillVersion.
   * Prevents stale XP from overwriting a newer value due to out-of-order delivery.
   */
⋮----
/** TraceId from the originating EventEnvelope [R8] */
⋮----
function memberPath(orgId: string, accountId: string): string
⋮----
/**
 * Creates a bare eligible-member entry when a member joins the organization.
 */
export async function initOrgMemberEntry(
  orgId: string,
  accountId: string,
  traceId?: string
): Promise<void>
⋮----
/**
 * Removes a member entry when they leave the organization.
 */
export async function removeOrgMemberEntry(
  orgId: string,
  accountId: string
): Promise<void>
⋮----
export interface ApplyOrgMemberSkillXpInput {
  orgId: string;
  accountId: string;
  skillId: string;
  newXp: number;
  traceId?: string;
  /** Skill aggregate version — used by S2 XP_VERSION_GUARD. */
  aggregateVersion?: number;
}
⋮----
/** Skill aggregate version — used by S2 XP_VERSION_GUARD. */
⋮----
/**
 * Updates the XP for a specific skill on a member's eligible-member entry.
 * Creates the entry if it does not yet exist.
 *
 * Enforces SK_VERSION_GUARD [S2] via `versionGuardAllows` using
 * `lastProcessedSkillVersion` to discard stale out-of-order XP events.
 *
 * Called when organization:skill:xpAdded or organization:skill:xpDeducted fires.
 */
export async function applyOrgMemberSkillXp(
  input: ApplyOrgMemberSkillXpInput
): Promise<void>
⋮----
// [S2] XP_VERSION_GUARD: discard stale events when aggregateVersion is provided.
⋮----
/**
 * Updates the eligible flag for a member with ELIGIBLE_UPDATE_GUARD. [R7][#19][D11][S2]
 *
 * Uses SK_VERSION_GUARD [S2] via `versionGuardAllows` to enforce monotonic version.
 * If the incoming version is not strictly greater than the stored version, the event
 * is stale (out-of-order delivery) — discard silently.
 *
 * Called when:
 *   organization:schedule:assigned  → eligible = false (member is now busy)
 *   organization:schedule:completed / organization:schedule:cancelled → eligible = true (member is free)
 *
 * Per Invariant #15: eligible must reflect "no active conflicting assignments".
 * Per Invariant #19: eligible update must use aggregateVersion monotonic increase as prerequisite.
 */
export async function updateOrgMemberEligibility(
  orgId: string,
  accountId: string,
  eligible: boolean,
  incomingAggregateVersion: number,
  traceId?: string
): Promise<void>
⋮----
// SK_VERSION_GUARD [S2]: discard stale / out-of-order events
````

## File: src/features/projection.bus/org-eligible-member-view/_queries.ts
````typescript
/**
 * projection.org-eligible-member-view — _queries.ts
 *
 * Read-side queries for the org eligible member view.
 * Used by organization.schedule to find and validate assignable members.
 *
 * Tier is NEVER read from Firestore; it is computed at query time via resolveSkillTier(xp)
 * from shared/lib (Invariant #12).
 *
 * Per logic-overview.md:
 *   W_B_SCHEDULE -.→ ORG_ELIGIBLE_MEMBER_VIEW (查詢可用帳號 · eligible=true · 只讀)
 *   ORGANIZATION_SCHEDULE reads this view (Invariant #14)
 *   ORG_ELIGIBLE_MEMBER_VIEW -.→ getTier 計算（不存 DB）
 */
⋮----
import { resolveSkillTier } from '@/features/shared-kernel';
import type { SkillTier } from '@/features/shared-kernel';
import { db } from '@/shared/infra/firestore/firestore.client';
import { getDocs, collection, type QueryDocumentSnapshot } from '@/shared/infra/firestore/firestore.read.adapter';
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
⋮----
import type { OrgEligibleMemberEntry } from './_projector';
⋮----
// ---------------------------------------------------------------------------
// Computed view types (tier derived at query time — never from DB)
// ---------------------------------------------------------------------------
⋮----
/**
 * Per-skill entry with tier COMPUTED at query time via resolveSkillTier(xp).
 *
 * This is the shape consumers (Schedule) should use when they need tier for
 * validation or display.  Tier is NOT stored in Firestore (Invariant #12).
 *
 * Maps to the diagram node:
 *   ORG_ELIGIBLE_MEMBER_VIEW["...skillId / xp / tier / eligible..."]
 */
export interface OrgMemberSkillWithTier {
  skillId: string;
  xp: number;
  /** Derived at query time via getTier(xp) — never persisted. */
  tier: SkillTier;
}
⋮----
/** Derived at query time via getTier(xp) — never persisted. */
⋮----
/**
 * Full eligible-member view with tier computed for every skill entry.
 * Returned by getOrgMemberEligibilityWithTier / getOrgEligibleMembersWithTier.
 */
export interface OrgEligibleMemberView {
  orgId: string;
  accountId: string;
  /** Skill entries with computed tier. */
  skills: OrgMemberSkillWithTier[];
  eligible: boolean;
}
⋮----
/** Skill entries with computed tier. */
⋮----
// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------
⋮----
/**
 * Computes tier for every skill entry in a raw projection record.
 *
 * resolveSkillTier is a pure O(7) linear scan over the 7-tier table —
 * constant-time per skill.  For typical org sizes this is negligible.
 * Tier is NEVER cached here (Invariant #12); always derived fresh.
 */
function enrichWithTier(entry: OrgEligibleMemberEntry): OrgEligibleMemberView
⋮----
// ---------------------------------------------------------------------------
// Queries — raw (for internal projector use)
// ---------------------------------------------------------------------------
⋮----
/**
 * Returns the raw eligible-member entry (xp only, no tier).
 * Prefer getOrgMemberEligibilityWithTier for consumer-facing queries.
 */
export async function getOrgMemberEligibility(
  orgId: string,
  accountId: string
): Promise<OrgEligibleMemberEntry | null>
⋮----
/**
 * Returns all eligible raw member entries for an organization.
 * Filters by eligible=true so Schedule only sees available members.
 * Prefer getOrgEligibleMembersWithTier for consumer-facing queries.
 */
export async function getOrgEligibleMembers(
  orgId: string
): Promise<OrgEligibleMemberEntry[]>
⋮----
// ---------------------------------------------------------------------------
// Queries — with computed tier (for Schedule / consumer-facing use)
// ---------------------------------------------------------------------------
⋮----
/**
 * Returns the eligible-member view with COMPUTED tier for each skill.
 *
 * Satisfies diagram requirement:
 *   ORG_ELIGIBLE_MEMBER_VIEW["...orgId / accountId / skillId / xp / tier / eligible..."]
 *
 * Tier is computed via resolveSkillTier(xp) — never read from DB (Invariant #12).
 */
export async function getOrgMemberEligibilityWithTier(
  orgId: string,
  accountId: string
): Promise<OrgEligibleMemberView | null>
⋮----
/**
 * Returns all member entries for an organization (including non-eligible).
 * Used by FR-W1 members overview to display eligible status for all members.
 * NOTE: This returns ALL members, not just eligible ones.
 */
export async function getAllOrgMembersView(
  orgId: string
): Promise<OrgEligibleMemberView[]>
⋮----
/**
 * Returns all eligible members with COMPUTED tier for each skill.
 * Filters by eligible=true.
 */
export async function getOrgEligibleMembersWithTier(
  orgId: string
): Promise<OrgEligibleMemberView[]>
````

## File: src/features/projection.bus/org-eligible-member-view/index.ts
````typescript
/**
 * projection.org-eligible-member-view — Public API
 *
 * Organization-scoped eligible member read model — the ONLY source
 * organization.schedule may use to check member availability and skill tiers.
 *
 * Per logic-overview.md:
 *   EVENT_FUNNEL_INPUT → ORG_ELIGIBLE_MEMBER_VIEW
 *   ORG_ELIGIBLE_MEMBER_VIEW -.→ getTier 計算（不存 DB）
 *   W_B_SCHEDULE / ORGANIZATION_SCHEDULE read this view (Invariant #14)
 *
 * Consumer guidance:
 *   - Use getOrgMemberEligibilityWithTier / getOrgEligibleMembersWithTier for
 *     queries that need tier (Schedule, UI).  Tier is computed at query time.
 *   - Use getOrgMemberEligibility / getOrgEligibleMembers when only raw xp is needed
 *     (e.g., internal projector-to-projector data transfer).
 */
````

## File: src/features/projection.bus/organization-view/_projector.ts
````typescript
/**
 * projection.organization-view — _projector.ts
 *
 * Maintains the organization projection read model.
 * Stored at: organizationView/{orgId}
 *
 * Per logic-overview.md:
 *   EVENT_FUNNEL_INPUT → ORGANIZATION_PROJECTION_VIEW
 */
⋮----
import { versionGuardAllows } from '@/features/shared-kernel';
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
import { serverTimestamp } from '@/shared/infra/firestore/firestore.write.adapter';
import { setDocument, updateDocument } from '@/shared/infra/firestore/firestore.write.adapter';
import type { Account } from '@/shared/types';
⋮----
export interface OrganizationViewRecord {
  orgId: string;
  name: string;
  ownerId: string;
  memberCount: number;
  teamCount: number;
  partnerCount: number;
  /** Flat list of member account IDs */
  memberIds: string[];
  /** Map of teamId → team name */
  teamIndex: Record<string, string>;
  readModelVersion: number;
  /** Last aggregate version processed by this projection [S2] */
  lastProcessedVersion?: number;
  /** TraceId from the originating EventEnvelope [R8] */
  traceId?: string;
  updatedAt: ReturnType<typeof serverTimestamp>;
}
⋮----
/** Flat list of member account IDs */
⋮----
/** Map of teamId → team name */
⋮----
/** Last aggregate version processed by this projection [S2] */
⋮----
/** TraceId from the originating EventEnvelope [R8] */
⋮----
export async function projectOrganizationSnapshot(
  org: Account,
  aggregateVersion?: number,
  traceId?: string
): Promise<void>
⋮----
export async function applyMemberJoined(
  orgId: string,
  memberId: string,
  aggregateVersion?: number,
  traceId?: string
): Promise<void>
⋮----
export async function applyMemberLeft(
  orgId: string,
  memberId: string,
  aggregateVersion?: number,
  traceId?: string
): Promise<void>
````

## File: src/features/projection.bus/organization-view/_queries.ts
````typescript
/**
 * projection.organization-view — _queries.ts
 *
 * Read-side queries for the organization projection view.
 */
⋮----
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
⋮----
import type { OrganizationViewRecord } from './_projector';
⋮----
export async function getOrganizationView(orgId: string): Promise<OrganizationViewRecord | null>
⋮----
export async function getOrganizationMemberIds(orgId: string): Promise<string[]>
````

## File: src/features/projection.bus/organization-view/index.ts
````typescript
/**
 * projection.organization-view — Public API
 *
 * Organization projection read model.
 * Fed by EVENT_FUNNEL_INPUT from organization events.
 *
 * Per logic-overview.md:
 *   EVENT_FUNNEL_INPUT → ORGANIZATION_PROJECTION_VIEW
 */
````

## File: src/features/projection.bus/tag-snapshot/_projector.ts
````typescript
/**
 * projection.tag-snapshot — _projector.ts
 *
 * Tag Authority global read model.
 * Final-consistent snapshot of the global tag dictionary.
 *
 * Per logic-overview.md (VS8 Tag Lifecycle Views):
 *   TAG_SNAPSHOT["projection.tag-snapshot\ntagSlug / label / category\n組織作用域快照\n來源: TagLifecycleEvent\n消費方唯讀快取"]
 *
 * Invariants:
 *   T5 — TAG_SNAPSHOT is the final-consistent read model; consumers must not write.
 *   #9  — Projections must be fully rebuildable from events.
 *   A7  — Event Funnel composes projections; does not enforce cross-BC invariants.
 *
 * Stored at: tagSnapshot/{tagSlug}
 */
⋮----
import { versionGuardAllows } from '@/features/shared-kernel';
import type { TagCreatedPayload, TagUpdatedPayload, TagDeprecatedPayload, TagDeletedPayload } from '@/features/shared-kernel';
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
import { setDocument, updateDocument, deleteDocument } from '@/shared/infra/firestore/firestore.write.adapter';
⋮----
// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
⋮----
export interface TagSnapshotEntry {
  tagSlug: string;
  label: string;
  category: string;
  /** Present when the tag has been deprecated. */
  deprecatedAt?: string;
  /** Suggested replacement tag, if specified at deprecation time. */
  replacedByTagSlug?: string;
  readModelVersion: number;
  /** Last aggregate version processed by this projection [S2] */
  lastProcessedVersion?: number;
  /** TraceId from the originating EventEnvelope [R8] */
  traceId?: string;
}
⋮----
/** Present when the tag has been deprecated. */
⋮----
/** Suggested replacement tag, if specified at deprecation time. */
⋮----
/** Last aggregate version processed by this projection [S2] */
⋮----
/** TraceId from the originating EventEnvelope [R8] */
⋮----
// ---------------------------------------------------------------------------
// Projector functions (called by Event Funnel — Invariant A7)
// ---------------------------------------------------------------------------
⋮----
/** applyTagCreated — no version guard needed; creates are idempotent. */
export async function applyTagCreated(payload: TagCreatedPayload, traceId?: string): Promise<void>
⋮----
export async function applyTagUpdated(
  payload: TagUpdatedPayload,
  aggregateVersion?: number,
  traceId?: string
): Promise<void>
⋮----
export async function applyTagDeprecated(
  payload: TagDeprecatedPayload,
  aggregateVersion?: number,
  traceId?: string
): Promise<void>
⋮----
/** applyTagDeleted — no version guard needed; deletes are final. */
export async function applyTagDeleted(payload: TagDeletedPayload): Promise<void>
````

## File: src/features/projection.bus/tag-snapshot/_queries.ts
````typescript
/**
 * projection.tag-snapshot — _queries.ts
 *
 * Read-side queries for the tag snapshot read model.
 *
 * Per logic-overview.md (VS8 Tag Lifecycle Views):
 *   TAG_SNAPSHOT["projection.tag-snapshot\n消費方唯讀快取"]
 *
 * Invariant T5: consumers must not write to this collection.
 *
 * Stored at: tagSnapshot/{tagSlug}
 */
⋮----
import { db } from '@/shared/infra/firestore/firestore.client';
import { collection, getDocs, type QueryDocumentSnapshot } from '@/shared/infra/firestore/firestore.read.adapter';
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
⋮----
import type { TagSnapshotEntry } from './_projector';
⋮----
/**
 * Retrieves a single tag snapshot entry by tagSlug.
 * Returns null if the tag does not exist or has been deleted.
 */
export async function getTagSnapshot(tagSlug: string): Promise<TagSnapshotEntry | null>
⋮----
/**
 * Retrieves all tag snapshot entries (global dictionary).
 * Includes deprecated tags unless the caller filters them out.
 */
export async function getAllTagSnapshots(): Promise<TagSnapshotEntry[]>
⋮----
/**
 * Retrieves only active (non-deprecated) tag snapshot entries.
 */
export async function getActiveTagSnapshots(): Promise<TagSnapshotEntry[]>
````

## File: src/features/projection.bus/tag-snapshot/index.ts
````typescript
/**
 * projection.tag-snapshot — Public API
 *
 * TAG_SNAPSHOT: final-consistent global read model for tag lifecycle events.
 *
 * Per logic-overview.md (VS8 Tag Lifecycle Views):
 *   TAG_SNAPSHOT["projection.tag-snapshot\ntagSlug / label / category\n組織作用域快照\n來源: TagLifecycleEvent\n消費方唯讀快取"]
 *
 * Invariant T5: consumers must not write to this collection.
 *
 * Event funnel registration:
 *   Call registerTagFunnel() once at app startup (projection.event-funnel).
 */
⋮----
// Projector functions (called by Event Funnel)
⋮----
// Read queries
````

## File: src/features/projection.bus/wallet-balance/_projector.ts
````typescript
/**
 * projection.wallet-balance — _projector.ts
 *
 * Maintains the wallet balance projection read model.
 * Provides a cached EVENTUAL_READ view of account wallet balance
 * for display purposes.
 *
 * Stored at: walletBalanceView/{accountId}
 *
 * Per logic-overview.md (PROJ_BUS CRIT_PROJ):
 *   WALLET_V["projection.wallet-balance\n[S3: EVENTUAL_READ]\n顯示用・精確交易回源 AGG"]
 *   QGWAY_WALLET → projection.wallet-balance (STRONG_READ [Q8][D5])
 *
 * Read-consistency contract [S3]:
 *   - EVENTUAL_READ: this projection (display balance, refreshed on wallet events)
 *   - STRONG_READ: read directly from the Account aggregate (financial transactions)
 *
 * [S2] SK_VERSION_GUARD: aggregateVersion monotonic check before every write.
 * [R8] traceId from the originating EventEnvelope is propagated into the record.
 * [D5] Wallet balance display reads from this projection.
 *      Transactional operations MUST use STRONG_READ back to WALLET_AGG.
 */
⋮----
import { versionGuardAllows } from '@/features/shared-kernel';
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
import { serverTimestamp } from '@/shared/infra/firestore/firestore.write.adapter';
import { setDocument } from '@/shared/infra/firestore/firestore.write.adapter';
⋮----
export interface WalletBalanceView {
  /** Account identifier. */
  readonly accountId: string;
  /** Cached display balance (EVENTUAL_READ). For exact balance use STRONG_READ path. */
  balance: number;
  /** Running total credits (for display). */
  totalCredited: number;
  /** Running total debits (for display). */
  totalDebited: number;
  readModelVersion: number;
  /** Last aggregate version processed by this projection [S2] */
  lastProcessedVersion?: number;
  /** TraceId from the originating EventEnvelope [R8] */
  traceId?: string;
  updatedAt: ReturnType<typeof serverTimestamp>;
}
⋮----
/** Account identifier. */
⋮----
/** Cached display balance (EVENTUAL_READ). For exact balance use STRONG_READ path. */
⋮----
/** Running total credits (for display). */
⋮----
/** Running total debits (for display). */
⋮----
/** Last aggregate version processed by this projection [S2] */
⋮----
/** TraceId from the originating EventEnvelope [R8] */
⋮----
/**
 * Initialises or resets the wallet balance projection for an account.
 * Called when a new account is created.
 */
export async function initWalletBalanceView(accountId: string): Promise<void>
⋮----
/**
 * Applies a wallet credit event to the projection.
 * [S2] versionGuardAllows enforced before write.
 * [R8] traceId forwarded from EventEnvelope.
 */
export async function applyWalletCredited(
  accountId: string,
  amount: number,
  aggregateVersion?: number,
  traceId?: string
): Promise<void>
⋮----
/**
 * Applies a wallet debit event to the projection.
 * [S2] versionGuardAllows enforced before write.
 * [R8] traceId forwarded from EventEnvelope.
 */
export async function applyWalletDebited(
  accountId: string,
  amount: number,
  aggregateVersion?: number,
  traceId?: string
): Promise<void>
⋮----
/**
 * Syncs the projection balance from the authoritative Account aggregate.
 * Used for initial backfill or to reconcile after STRONG_READ operations.
 * [D5] This is the EVENTUAL_READ surface — true balance lives in the aggregate.
 */
export async function syncWalletBalanceFromAggregate(
  accountId: string,
  authoritative: { balance: number; aggregateVersion?: number; traceId?: string }
): Promise<void>
````

## File: src/features/projection.bus/wallet-balance/_queries.ts
````typescript
/**
 * projection.wallet-balance — _queries.ts
 *
 * Read-side queries for the wallet balance projection.
 *
 * [D5] Display reads use this projection (EVENTUAL_READ).
 *       Transactional / exact-balance reads MUST use STRONG_READ back to WALLET_AGG.
 * [S3] SK_READ_CONSISTENCY: EVENTUAL_READ (display) vs STRONG_READ (transactions).
 */
⋮----
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
⋮----
import type { WalletBalanceView } from './_projector';
⋮----
/**
 * Returns the wallet balance view for an account, or null if not initialised.
 *
 * [D5] Display-only — for financial transactions use STRONG_READ path.
 */
export async function getWalletBalanceView(
  accountId: string
): Promise<WalletBalanceView | null>
⋮----
/**
 * Returns the display balance for an account.
 * Falls back to 0 if no projection record exists.
 *
 * [D5] EVENTUAL_READ path — use for display only.
 *       For exact balance in financial operations, use STRONG_READ on the Account aggregate.
 */
export async function getDisplayWalletBalance(accountId: string): Promise<number>
````

## File: src/features/projection.bus/wallet-balance/index.ts
````typescript
/**
 * projection.wallet-balance — Public API
 *
 * Wallet balance projection read model.
 * EVENTUAL_READ surface for display; transactional operations use STRONG_READ.
 *
 * Per logic-overview.md (PROJ_BUS CRIT_PROJ):
 *   WALLET_V["projection.wallet-balance\n[S3: EVENTUAL_READ]"]
 *   QGWAY_WALLET → projection.wallet-balance (display)
 *                  STRONG_READ → WALLET_AGG (transactions [Q8][D5])
 */
````

## File: src/features/projection.bus/workspace-scope-guard/_projector.ts
````typescript
/**
 * projection.workspace-scope-guard — _projector.ts
 *
 * Applies workspace domain events to maintain the scope guard read model.
 * Called by the Event Funnel (EVENT_FUNNEL_INPUT) for workspace events.
 *
 * Stored at: scopeGuardView/{workspaceId}
 */
⋮----
import { versionGuardAllows } from '@/features/shared-kernel';
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
import { serverTimestamp } from '@/shared/infra/firestore/firestore.write.adapter';
import { setDocument, updateDocument } from '@/shared/infra/firestore/firestore.write.adapter';
⋮----
import type { WorkspaceScopeGuardView } from './_read-model';
⋮----
/**
 * Initialises the scope guard read model for a new workspace.
 */
export async function initScopeGuardView(
  workspaceId: string,
  ownerId: string,
  traceId?: string
): Promise<void>
⋮----
/**
 * Applies a grant event to the scope guard read model.
 */
export async function applyGrantEvent(
  workspaceId: string,
  userId: string,
  role: string,
  status: 'active' | 'revoked',
  aggregateVersion?: number,
  traceId?: string
): Promise<void>
````

## File: src/features/projection.bus/workspace-scope-guard/_queries.ts
````typescript
/**
 * projection.workspace-scope-guard — _queries.ts
 *
 * Read-side queries for the scope guard read model.
 * Used exclusively by workspace-application/_scope-guard.ts.
 */
⋮----
import type { AuthoritySnapshot } from '@/features/shared-kernel';
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
⋮----
import type { WorkspaceScopeGuardView } from './_read-model';
import { buildAuthoritySnapshot } from './_read-model';
⋮----
/**
 * Fetches the scope guard read model for a workspace.
 * Returns null if not yet projected (caller should fall back to direct read).
 */
export async function getScopeGuardView(
  workspaceId: string
): Promise<WorkspaceScopeGuardView | null>
⋮----
/**
 * Checks workspace access by querying the scope guard read model.
 * Returns the authority snapshot on success, or null if access denied.
 */
export async function queryWorkspaceAccess(
  workspaceId: string,
  userId: string
): Promise<
````

## File: src/features/projection.bus/workspace-scope-guard/_read-model.ts
````typescript
/**
 * projection.workspace-scope-guard — _scope-guard-read-model.ts
 *
 * Firestore schema for the scope guard read model.
 * Stored at: scopeGuardView/{workspaceId}
 *
 * Invariant #7: Scope Guard reads ONLY this local read model.
 * Invariant #8: Implements shared-kernel.authority-snapshot contract.
 */
⋮----
import type { AuthoritySnapshot } from '@/features/shared-kernel';
import type { Timestamp } from '@/shared/ports';
⋮----
export interface WorkspaceScopeGuardView {
  readonly implementsAuthoritySnapshot: true;
  workspaceId: string;
  ownerId: string;
  /** Map of userId → { role, status, snapshotAt } */
  grantIndex: Record<string, WorkspaceScopeGrantEntry>;
  /** Latest version processed from event stream */
  readModelVersion: number;
  /** Last aggregate version processed by this projection [S2] */
  lastProcessedVersion?: number;
  /** TraceId from the originating EventEnvelope [R8] */
  traceId?: string;
  updatedAt: Timestamp;
}
⋮----
/** Map of userId → { role, status, snapshotAt } */
⋮----
/** Latest version processed from event stream */
⋮----
/** Last aggregate version processed by this projection [S2] */
⋮----
/** TraceId from the originating EventEnvelope [R8] */
⋮----
export interface WorkspaceScopeGrantEntry {
  role: string;
  status: 'active' | 'revoked';
  snapshotAt: string;
}
⋮----
/**
 * Build an AuthoritySnapshot for a specific user from the read model.
 */
export function buildAuthoritySnapshot(
  view: WorkspaceScopeGuardView,
  userId: string
): AuthoritySnapshot
⋮----
function derivePermissions(roles: string[]): string[]
````

## File: src/features/projection.bus/workspace-scope-guard/index.ts
````typescript
/**
 * projection.workspace-scope-guard — Public API
 *
 * Scope Guard dedicated read model.
 * Implements shared-kernel.authority-snapshot contract.
 *
 * Per logic-overview.md:
 *   ACTIVE_ACCOUNT_CONTEXT → WORKSPACE_SCOPE_READ_MODEL → WORKSPACE_SCOPE_GUARD
 *   WORKSPACE_ORG_POLICY_CACHE → (update) → WORKSPACE_SCOPE_READ_MODEL
 */
````

## File: src/features/projection.bus/workspace-view/_projector.ts
````typescript
/**
 * projection.workspace-view — _projector.ts
 *
 * Maintains the workspace projection read model.
 * Stored at: workspaceView/{workspaceId}
 *
 * Fed by EVENT_FUNNEL_INPUT from workspace domain events.
 */
⋮----
import { versionGuardAllows } from '@/features/shared-kernel';
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
import { serverTimestamp } from '@/shared/infra/firestore/firestore.write.adapter';
import { setDocument, updateDocument } from '@/shared/infra/firestore/firestore.write.adapter';
import type { Workspace } from '@/shared/types';
⋮----
export interface WorkspaceViewRecord {
  workspaceId: string;
  name: string;
  dimensionId: string;
  lifecycleState: string;
  visibility: string;
  capabilities: string[];
  grantCount: number;
  readModelVersion: number;
  /** Last aggregate version processed by this projection [S2] */
  lastProcessedVersion?: number;
  /** TraceId from the originating EventEnvelope [R8] */
  traceId?: string;
  updatedAt: ReturnType<typeof serverTimestamp>;
}
⋮----
/** Last aggregate version processed by this projection [S2] */
⋮----
/** TraceId from the originating EventEnvelope [R8] */
⋮----
/**
 * Projects a workspace document snapshot into the workspace-view read model.
 */
export async function projectWorkspaceSnapshot(
  workspace: Workspace,
  aggregateVersion?: number,
  traceId?: string
): Promise<void>
⋮----
/**
 * Applies a capability-mounted event to the workspace view.
 */
export async function applyCapabilityUpdate(
  workspaceId: string,
  capabilities: string[],
  aggregateVersion?: number,
  traceId?: string
): Promise<void>
````

## File: src/features/projection.bus/workspace-view/_queries.ts
````typescript
/**
 * projection.workspace-view — _queries.ts
 *
 * Read-side queries for the workspace projection view.
 */
⋮----
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
⋮----
import type { WorkspaceViewRecord } from './_projector';
⋮----
export async function getWorkspaceView(workspaceId: string): Promise<WorkspaceViewRecord | null>
⋮----
export async function getWorkspaceCapabilities(workspaceId: string): Promise<string[]>
````

## File: src/features/projection.bus/workspace-view/index.ts
````typescript
/**
 * projection.workspace-view — Public API
 *
 * Workspace read model (workspace projection view).
 * Fed by EVENT_FUNNEL_INPUT from workspace domain events.
 *
 * Per logic-overview.md:
 *   EVENT_FUNNEL_INPUT → WORKSPACE_PROJECTION_VIEW
 */
````

## File: src/features/README.MD
````markdown
放置領域切片與系統能力：業務邏輯、use-cases、Server Actions 等。
只允許向下依賴；向上 import 為架構違規。
````

## File: src/features/scheduling.slice/_actions.ts
````typescript
/**
 * scheduling.slice — _actions.ts
 *
 * Server Actions for the VS6 Scheduling domain.
 *
 * Per GEMINI.md §1.3 SK_CMD_RESULT [R4]:
 *   All exports MUST return CommandResult.
 *
 * Per GEMINI.md §1.1 TRACE_PROPAGATION_RULE [R8]:
 *   traceId must NOT be regenerated here — threaded from CBG_ENTRY.
 *
 * Sections:
 *   A. Workspace-level mutations (createScheduleItem, assignMember, unassignMember)
 *   B. Lightweight facade mutations (approveScheduleItemWithMember, updateScheduleItemStatus)
 *   C. HR domain actions (manualAssignScheduleMember, cancelScheduleProposalAction, completeOrgScheduleAction)
 */
⋮----
import {
  type CommandResult,
  type SkillRequirement,
  commandSuccess,
  commandFailureFrom,
} from '@/features/shared-kernel';
import {
  assignMemberToScheduleItem,
  unassignMemberFromScheduleItem,
  createScheduleItem as createScheduleItemFacade,
  updateScheduleItemStatus as updateScheduleItemStatusFacade,
  assignMemberAndApprove,
} from '@/shared/infra/firestore/firestore.facade';
import { Timestamp } from '@/shared/infra/firestore/firestore.read.adapter';
import type { ScheduleItem } from '@/shared/types';
⋮----
import { approveOrgScheduleProposal, cancelOrgScheduleProposal, completeOrgSchedule } from './_aggregate';
⋮----
// =================================================================
// A. Workspace-level mutations
// =================================================================
⋮----
export async function createScheduleItem(
  itemData: Omit<ScheduleItem, 'id' | 'createdAt' | 'updatedAt' | 'startDate' | 'endDate'> & {
    startDate?: Date | null;
    endDate?: Date | null;
  }
): Promise<CommandResult>
⋮----
export async function assignMember(
  accountId: string,
  itemId: string,
  memberId: string
): Promise<CommandResult>
⋮----
export async function unassignMember(
  accountId: string,
  itemId: string,
  memberId: string
): Promise<CommandResult>
⋮----
// =================================================================
// B. Lightweight facade mutations (fast path for HR governance UI)
// =================================================================
⋮----
/**
 * Assigns a member to a schedule item and marks it OFFICIAL in one write.
 * Fast path: no domain-level skill-tier re-check. Use manualAssignScheduleMember
 * for the full validation flow.
 */
export async function approveScheduleItemWithMember(
  organizationId: string,
  itemId: string,
  memberId: string
): Promise<CommandResult>
⋮----
/**
 * Updates the approval status of a schedule item (OFFICIAL | REJECTED | COMPLETED).
 */
export async function updateScheduleItemStatus(
  organizationId: string,
  itemId: string,
  newStatus: 'OFFICIAL' | 'REJECTED' | 'COMPLETED'
): Promise<CommandResult>
⋮----
// =================================================================
// C. HR domain actions (FR-W6, FR-S6)
// =================================================================
⋮----
/**
 * FR-W6: HR manually assigns a member to an open demand.
 * Runs the full domain-level skill-tier check via approveOrgScheduleProposal.
 * [R8] traceId threaded from the originating CBG_ENTRY.
 */
export async function manualAssignScheduleMember(
  scheduleItemId: string,
  targetAccountId: string,
  assignedBy: string,
  opts: {
    workspaceId: string;
    orgId: string;
    title: string;
    startDate: string;
    endDate: string;
    traceId?: string;
  },
  skillRequirements?: SkillRequirement[]
): Promise<CommandResult>
⋮----
/**
 * HR cancels a pending schedule proposal.
 * [R8] traceId threaded from originating CBG_ENTRY.
 */
export async function cancelScheduleProposalAction(
  scheduleItemId: string,
  orgId: string,
  workspaceId: string,
  cancelledBy: string,
  reason?: string,
  traceId?: string
): Promise<CommandResult>
⋮----
/**
 * FR-S6: HR marks a confirmed schedule assignment as completed.
 * Invariant #15: member eligible flag restored to true.
 * [R8] traceId threaded from originating CBG_ENTRY.
 */
export async function completeOrgScheduleAction(
  scheduleItemId: string,
  orgId: string,
  workspaceId: string,
  targetAccountId: string,
  completedBy: string,
  traceId?: string
): Promise<CommandResult>
````

## File: src/features/scheduling.slice/_aggregate.ts
````typescript
/**
 * scheduling.slice — _aggregate.ts
 *
 * organization.schedule Aggregate Root — manages the Schedule lifecycle:
 *   draft → proposed → confirmed | cancelled
 *
 * Per logic-overview.md:
 *   WORKSPACE_OUTBOX →|ScheduleProposed（跨層事件 · saga）| ORGANIZATION_SCHEDULE
 *   ORGANIZATION_SCHEDULE → ORGANIZATION_EVENT_BUS → ACCOUNT_NOTIFICATION_ROUTER (FCM Layer 2+)
 *
 * Aggregate lifecycle (state machine):
 *   draft → proposed → confirmed → completed        (normal path)
 *                                 → assignmentCancelled  (post-approval cancellation)
 *                    → cancelled                    (proposal rejected / compensating path)
 *
 * Single source of truth: accounts/{orgId}/schedule_items/{scheduleItemId}
 * The workspace layer creates the document; this aggregate enriches and transitions it.
 *
 * Invariants respected:
 *   #1  — This BC only writes to accounts/{orgId}/schedule_items (ScheduleItem SSOT).
 *   #2  — Reads workspace schedule data only via the event payload (not domain model).
 *   #4a — Domain Events produced by ORGANIZATION_SCHEDULE aggregate only.
 *   #4b — Transaction Runner only delivers to Outbox; does not produce Domain Events.
 *   #12 — Tier is NEVER stored. Only xp is persisted; getTier(xp) is computed at runtime.
 *   #14 — Schedule reads ONLY projection.org-eligible-member-view, never Account aggregate.
 *   A5  — ScheduleAssignRejected is the compensating event when skill validation fails.
 */
⋮----
import { z } from 'zod';
⋮----
import { publishOrgEvent } from '@/features/organization.slice';
import { getOrgMemberEligibility } from '@/features/projection.bus';
import { resolveSkillTier, tierSatisfies } from '@/features/shared-kernel';
import type { WorkspaceScheduleProposedPayload, SkillRequirement } from '@/features/shared-kernel';
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
import { arrayUnion } from '@/shared/infra/firestore/firestore.write.adapter';
import { updateDocument } from '@/shared/infra/firestore/firestore.write.adapter';
import type { ScheduleItem, ScheduleStatus } from '@/shared/types';
⋮----
// =================================================================
// Aggregate State (DDD state machine)
// =================================================================
⋮----
/**
 * Aggregate lifecycle states for organization.schedule.
 *
 *   draft               — initial state; exists only in memory / not yet persisted
 *   proposed            — received from workspace layer; persisted, awaiting org approval
 *   confirmed           — skill check passed; ScheduleAssigned event published
 *   cancelled           — skill check failed or manually cancelled; ScheduleAssignRejected published
 *   completed           — assignment successfully fulfilled; ScheduleCompleted event published
 *   assignmentCancelled — confirmed assignment withdrawn post-approval; ScheduleAssignmentCancelled event published
 *
 * These domain states map to ScheduleStatus as follows:
 *   proposed            → PROPOSAL
 *   confirmed           → OFFICIAL
 *   cancelled           → REJECTED
 *   completed           → COMPLETED
 *   assignmentCancelled → REJECTED
 */
⋮----
export type OrgScheduleStatus = (typeof ORG_SCHEDULE_STATUSES)[number];
⋮----
// =================================================================
// Zod Schemas — strict validation on input data
// =================================================================
⋮----
/** SourcePointer: IntentID of the ParsingIntent that triggered this proposal (optional). */
⋮----
/** Skill requirements carried over from the workspace proposal — used during org approval. */
⋮----
/** Sub-location within the workspace. FR-L2. */
⋮----
/**
   * Aggregate version of this org-schedule proposal. [R7]
   * Incremented on each state transition (proposed → confirmed/cancelled).
   * Included in published events so ELIGIBLE_UPDATE_GUARD can enforce monotonic updates.
   */
⋮----
/** [R8] TraceID injected at CBG_ENTRY — persisted for end-to-end audit trail. */
⋮----
/** The member assigned to this proposal. Populated when status transitions to 'confirmed'.
   * Optional for backward compatibility — legacy confirmed proposals may not have this field. */
⋮----
export type OrgScheduleProposal = z.infer<typeof orgScheduleProposalSchema>;
⋮----
/** Firestore path for a schedule item (single source of truth). */
function scheduleItemPath(orgId: string, scheduleItemId: string): string
⋮----
// =================================================================
// Domain Service: handleScheduleProposed
// =================================================================
⋮----
/**
 * Handles a ScheduleProposed cross-layer event arriving from WORKSPACE_OUTBOX.
 *
 * The workspace layer already created the accounts/{orgId}/schedule_items document.
 * This function enriches it with org-domain fields (version, traceId, proposedBy,
 * skill requirements) so the org governance layer has all necessary context.
 *
 * Does NOT immediately assign — assignment requires explicit governance approval
 * via approveOrgScheduleProposal().
 */
export async function handleScheduleProposed(
  payload: WorkspaceScheduleProposedPayload
): Promise<void>
⋮----
// =================================================================
// Domain Service: approveOrgScheduleProposal
// =================================================================
⋮----
/**
 * Result type for approveOrgScheduleProposal — enables callers to handle
 * both outcomes without catching exceptions (Compensating Event pattern).
 */
export type ScheduleApprovalResult =
  | { outcome: 'confirmed'; scheduleItemId: string }
  | { outcome: 'rejected'; scheduleItemId: string; reason: string };
⋮----
/**
 * Called by org-layer governance when a pending proposal should be assigned.
 *
 * Skill Validation (Invariant #14 + #12):
 *   1. Reads projection.org-eligible-member-view (never Account aggregate).
 *   2. For each SkillRequirement, derives tier via resolveSkillTier(xp) — NOT from DB.
 *   3. If all requirements are met → confirms and publishes `organization:schedule:assigned`.
 *   4. If any requirement fails → cancels and publishes `organization:schedule:assignRejected`
 *      (Compensating Event per Invariant A5). B-track issues do NOT flow back to A-track tasks.
 *
 * @param scheduleItemId  The proposal to approve.
 * @param targetAccountId The member to assign.
 * @param assignedBy      Actor performing the approval.
 * @param opts            Proposal metadata (workspaceId, orgId, title, dates).
 * @param skillRequirements Optional skill requirements to validate against the member.
 */
export async function approveOrgScheduleProposal(
  scheduleItemId: string,
  targetAccountId: string,
  assignedBy: string,
  opts: {
    workspaceId: string;
    orgId: string;
    title: string;
    startDate: string;
    endDate: string;
    /** [R8] TraceID propagated from the originating WorkspaceScheduleProposed event. */
    traceId?: string;
  },
  skillRequirements?: SkillRequirement[]
): Promise<ScheduleApprovalResult>
⋮----
/** [R8] TraceID propagated from the originating WorkspaceScheduleProposed event. */
⋮----
// --- Skill Validation via Projection (Invariant #14) ---
⋮----
// Validate each skill requirement — tier derived via getTier(xp), never from DB (Invariant #12)
⋮----
// --- All checks passed → Confirm ---
// Read current version and increment to ensure proper aggregateVersion for ELIGIBLE_UPDATE_GUARD [R7]
⋮----
// [R8] Forward traceId to ScheduleAssigned event for end-to-end trace propagation.
⋮----
// =================================================================
// Internal helper
// =================================================================
⋮----
async function _cancelProposal(
  scheduleItemId: string,
  targetAccountId: string,
  opts: { workspaceId: string; orgId: string; traceId?: string },
  reason: string
): Promise<void>
⋮----
// Compensating Event (Invariant A5) — discrete recovery; B-track does NOT flow back to A-track.
⋮----
// [R8] Forward traceId to compensating event for end-to-end trace propagation.
⋮----
// =================================================================
// Domain Service: cancelOrgScheduleProposal
// =================================================================
⋮----
/**
 * Manually cancels a pending org schedule proposal by HR governance.
 *
 * Distinct from the compensating-event path inside approveOrgScheduleProposal:
 * this is an explicit HR decision to withdraw the proposal without
 * assigning any member.
 *
 * Publishes `organization:schedule:proposalCancelled` (Scheduling Saga, Invariant A5).
 *
 * Invariant #1: only writes to accounts/{orgId}/schedule_items (ScheduleItem SSOT).
 */
export async function cancelOrgScheduleProposal(
  scheduleItemId: string,
  orgId: string,
  workspaceId: string,
  cancelledBy: string,
  reason?: string,
  /** [R8] TraceID propagated from the originating scheduling saga. */
  traceId?: string
): Promise<void>
⋮----
/** [R8] TraceID propagated from the originating scheduling saga. */
⋮----
// [R8] Forward traceId to compensating event for end-to-end trace propagation.
⋮----
// =================================================================
// Domain Service: completeOrgSchedule
// =================================================================
⋮----
/**
 * Marks a confirmed schedule assignment as completed.
 *
 * Invariant #15: completed → eligible = true.
 * The `organization:schedule:completed` event published here is consumed by
 * the event funnel which calls both `applyScheduleCompleted` (account-schedule
 * projection) and `updateOrgMemberEligibility(orgId, accountId, true)` to
 * restore the member's eligible flag.
 *
 * Invariant #1: only writes to accounts/{orgId}/schedule_items (ScheduleItem SSOT).
 */
export async function completeOrgSchedule(
  scheduleItemId: string,
  orgId: string,
  workspaceId: string,
  targetAccountId: string,
  completedBy: string,
  /** [R8] TraceID propagated from the originating command. */
  traceId?: string
): Promise<void>
⋮----
/** [R8] TraceID propagated from the originating command. */
⋮----
// [R8] Forward traceId for end-to-end trace propagation.
⋮----
// =================================================================
// Domain Service: cancelOrgScheduleAssignment
// =================================================================
⋮----
/**
 * Cancels a previously confirmed schedule assignment (post-assignment cancellation).
 *
 * Distinct from `cancelOrgScheduleProposal` which operates on proposals that
 * have NOT yet been confirmed. This function handles the case where a confirmed
 * assignment is later withdrawn by HR, restoring the member's eligible flag.
 *
 * Invariant #15: cancelled → eligible = true.
 * Publishes `organization:schedule:assignmentCancelled` consumed by the event
 * funnel which calls `updateOrgMemberEligibility(orgId, accountId, true)`.
 *
 * Invariant #1: only writes to accounts/{orgId}/schedule_items (ScheduleItem SSOT).
 */
export async function cancelOrgScheduleAssignment(
  scheduleItemId: string,
  orgId: string,
  workspaceId: string,
  targetAccountId: string,
  cancelledBy: string,
  reason?: string,
  /** [R8] TraceID propagated from the originating command. */
  traceId?: string
): Promise<void>
⋮----
/** [R8] TraceID propagated from the originating command. */
⋮----
// [R8] Forward traceId for end-to-end trace propagation.
````

## File: src/features/scheduling.slice/_components/decision-history-columns.tsx
````typescript
import { type ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { CheckCircle, XCircle, ArrowUpDown } from "lucide-react"
⋮----
import { Badge } from "@/shared/shadcn-ui/badge"
import { Button } from "@/shared/shadcn-ui/button"
import { type ScheduleItem } from "@/shared/types"
⋮----
export type DecisionHistoryItem = Pick<ScheduleItem, 'id' | 'title' | 'workspaceName' | 'status' | 'updatedAt'>
````

## File: src/features/scheduling.slice/_components/demand-board.tsx
````typescript
/**
 * scheduling.slice — _components/demand-board.tsx
 *
 * Demand Board UI — org HR real-time view of open and assigned demands.
 *
 * Single source of truth: accounts/{orgId}/schedule_items.
 * All three schedule tabs (Calendar, DemandBoard, HR Governance) read from this
 * same collection — no separate projection collection required.
 *
 * Status mapping (FR-W0):
 *   PROPOSAL  → "待指派需求" (open / amber)
 *   OFFICIAL  → "已指派需求" (assigned / green)
 *   REJECTED / COMPLETED → hidden from board
 */
⋮----
import { UserCheck, XCircle, Clock, CheckCircle2 } from 'lucide-react';
import { useState, useCallback, useMemo } from 'react';
⋮----
import type { SkillRequirement } from '@/features/shared-kernel';
import { useAccount } from '@/features/workspace.slice';
import { useApp } from '@/shared/app-providers/app-context';
import { SKILLS } from '@/shared/constants/skills';
import type { Timestamp } from '@/shared/ports';
import { Badge } from '@/shared/shadcn-ui/badge';
import { Button } from '@/shared/shadcn-ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/shadcn-ui/card';
import { ScrollArea } from '@/shared/shadcn-ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/shadcn-ui/select';
import type { ScheduleItem } from '@/shared/types';
import { toast } from '@/shared/utility-hooks/use-toast';
⋮----
import {
  approveScheduleItemWithMember,
  updateScheduleItemStatus,
} from '../_actions';
⋮----
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
⋮----
function formatTimestamp(ts: Timestamp | string | undefined): string
⋮----
// ---------------------------------------------------------------------------
// Named types
// ---------------------------------------------------------------------------
⋮----
interface OrgMember {
  id: string;
  name: string;
}
⋮----
// ---------------------------------------------------------------------------
// Demand row — driven by ScheduleItem (single source of truth)
// ---------------------------------------------------------------------------
⋮----
interface DemandRowProps {
  item: ScheduleItem;
  orgMembers: OrgMember[];
  orgId: string;
}
⋮----
// ---------------------------------------------------------------------------
// Main Demand Board
// ---------------------------------------------------------------------------
⋮----
/**
 * DemandBoard — real-time org demand board (FR-W0 + FR-W6).
 *
 * Reads directly from accounts/{orgId}/schedule_items via useAccount() —
 * the same collection used by the Calendar tab — so all three schedule
 * tabs always show consistent data with zero extra subscriptions.
 */
⋮----
{/* Open demands */}
⋮----
{/* Assigned demands */}
````

## File: src/features/scheduling.slice/_components/governance-sidebar.tsx
````typescript
import { Check, X } from "lucide-react";
⋮----
import type { SkillRequirement } from '@/features/shared-kernel';
import { SKILLS } from '@/shared/constants/skills';
import { Badge } from "@/shared/shadcn-ui/badge";
import { Button } from "@/shared/shadcn-ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/shadcn-ui/card";
import { ScrollArea } from "@/shared/shadcn-ui/scroll-area";
import { type ScheduleItem } from "@/shared/types";
⋮----
interface GovernanceSidebarProps {
  proposals: ScheduleItem[];
  onApprove: (item: ScheduleItem) => void;
  onReject: (item: ScheduleItem) => void;
}
⋮----
/**
 * @fileoverview GovernanceSidebar - A dedicated component for displaying and acting on pending proposals.
 * @description This component is now a "dumb" component, receiving data and callbacks
 * via props. It is responsible for rendering the list of pending schedule items and
 * delegating approval/rejection actions to its parent.
 */
````

## File: src/features/scheduling.slice/_components/org-schedule-governance.tsx
````typescript
/**
 * scheduling.slice — _components/org-schedule-governance.tsx
 *
 * Org HR governance panel for reviewing and acting on schedule items.
 *
 * Single source of truth: accounts/{orgId}/schedule_items.
 * Reads the same collection as the Calendar tab — all three schedule tabs
 * (Calendar, DemandBoard, HR Governance) are always consistent.
 *
 * Status mapping:
 *   PROPOSAL   → 待核准 (pending assignment / amber)
 *   OFFICIAL   → 已確認 (assigned, can be marked complete / green)
 *   COMPLETED  → hidden (completed)
 *   REJECTED   → hidden (cancelled/rejected)
 *
 * FR-S6: Confirmed proposals section — HR marks confirmed assignments as completed.
 * FR-W2: Skill match indicators — show per-member skill match against item requirements.
 */
⋮----
import { CheckCircle, XCircle, Users, Flag } from 'lucide-react';
import { useState, useCallback, useMemo, useEffect } from 'react';
⋮----
import { getOrgEligibleMembersWithTier } from '@/features/projection.bus';
import type { OrgEligibleMemberView } from '@/features/projection.bus';
import type { SkillRequirement } from '@/features/shared-kernel';
import { tierSatisfies } from '@/features/shared-kernel';
import { useAccount } from '@/features/workspace.slice';
import { useApp } from '@/shared/app-providers/app-context';
import { findSkill } from '@/shared/constants/skills';
import type { Timestamp } from '@/shared/ports';
import { Badge } from '@/shared/shadcn-ui/badge';
import { Button } from '@/shared/shadcn-ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/shadcn-ui/card';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/shared/shadcn-ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/shadcn-ui/popover';
import { ScrollArea } from '@/shared/shadcn-ui/scroll-area';
import type { ScheduleItem } from '@/shared/types';
import { toast } from '@/shared/utility-hooks/use-toast';
⋮----
import {
  approveScheduleItemWithMember,
  updateScheduleItemStatus,
} from '../_actions';
⋮----
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
⋮----
/** Returns the human-readable display name for a skill slug. */
function getSkillName(slug: string): string
⋮----
function formatTimestamp(ts: Timestamp | string | undefined): string
⋮----
// ---------------------------------------------------------------------------
// FR-W2 — Skill match helper
// ---------------------------------------------------------------------------
⋮----
/**
 * Returns [matchedCount, totalRequired].
 * A skill is "matched" when the member holds it at the required tier or above.
 */
function computeSkillMatch(
  member: OrgEligibleMemberView,
  skillRequirements?: SkillRequirement[]
): [number, number]
⋮----
// ---------------------------------------------------------------------------
// Pending proposal row (PROPOSAL → assign or reject)
// ---------------------------------------------------------------------------
⋮----
interface ProposalRowProps {
  item: ScheduleItem;
  orgMembers: Array<{ id: string; name: string }>;
  eligibleMembers: OrgEligibleMemberView[];
  orgId: string;
  approvedBy: string;
}
⋮----
// FR-W2: compute skill match for the selected member
⋮----
/**
   * Pre-compute skill match for every org member so we can group the dropdown
   * into "全部符合" → "部分符合" → "其他成員" without re-computing per render.
   */
⋮----
// Members absent from eligibleMembers cannot be matched — treat as noMatch.
⋮----
onSelect=
⋮----
// ---------------------------------------------------------------------------
// FR-S6 — Confirmed schedule row (OFFICIAL → COMPLETED)
// ---------------------------------------------------------------------------
⋮----
// ---------------------------------------------------------------------------
// Main governance panel
// ---------------------------------------------------------------------------
⋮----
/**
 * Org HR governance panel.
 *
 * Reads accounts/{orgId}/schedule_items via useAccount() — same collection as
 * Calendar and DemandBoard — so all three tabs are always in sync.
 *
 * Shows:
 *   PROPOSAL items  → assign or cancel (待核准)
 *   OFFICIAL items  → mark complete (已確認, FR-S6)
 *   REJECTED/COMPLETED → hidden
 */
⋮----
{/* FR-S6 — Confirmed section */}
````

## File: src/features/scheduling.slice/_components/org-skill-pool-manager.tsx
````typescript
/**
 * scheduling.slice — _components/org-skill-pool-manager.tsx
 *
 * Org Skill Pool Manager tab for Organization Schedule.
 *
 * Per logic-overview.md (VS4 / T2):
 *   SKILL_TAG_POOL is the org-scoped activation view of the global Tag Authority.
 *   Org admins explicitly activate tags they want to use; passively syncs with TagLifecycleEvents.
 *
 * UX:
 *   Displays all skills from the global dictionary (SKILLS constant) grouped by
 *   大項目 (SkillGroup) → 子項目 (SkillSubCategory) → individual skills.
 *   Activated skills (in org pool) are visually highlighted and can be removed.
 *   Inactive skills show an "加入" button to activate them into the org pool.
 *
 * This management UI removes the burden of browsing the entire global dictionary
 * every time HR creates a schedule proposal (FR-K5).
 */
⋮----
import { BookOpen, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useOptimistic, useState, useTransition } from 'react';
⋮----
import { addOrgSkillTagAction, removeOrgSkillTagAction } from '@/features/skill-xp.slice';
import { getOrgSkillTags } from '@/features/skill-xp.slice';
import { useApp } from '@/shared/app-providers/app-context';
import {
  SKILL_GROUPS,
  SKILL_SUB_CATEGORY_BY_KEY,
  SKILLS,
  type SkillGroup,
  type SkillSubCategory,
} from '@/shared/constants/skills';
import { Badge } from '@/shared/shadcn-ui/badge';
import { Button } from '@/shared/shadcn-ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/shadcn-ui/card';
import { ScrollArea } from '@/shared/shadcn-ui/scroll-area';
import { toast } from '@/shared/utility-hooks/use-toast';
⋮----
// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
⋮----
/**
 * Org Skill Pool Manager.
 *
 * Lets org admins select which skills from the global dictionary are applicable
 * to their organization. Selected skills appear in ProposalDialog's skill picker
 * instead of the full global library (FR-K5).
 *
 * Writes to: orgSkillTagPool/{orgId}/tags/{tagSlug}  (via server actions)
 * Reads from: getOrgSkillTags(orgId)
 */
⋮----
// Build a 2-level map: SkillGroup → SkillSubCategory → skills[]
⋮----
{/* 大項目 header */}
⋮----
{/* 子項目 header */}
````

## File: src/features/scheduling.slice/_components/proposal-dialog.tsx
````typescript
import { format } from "date-fns";
import { CalendarIcon, ChevronsUpDown, MapPin, Plus, X } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { type DateRange } from "react-day-picker";
⋮----
import type { SkillRequirement } from "@/features/shared-kernel";
import { getOrgSkillTags } from "@/features/skill-xp.slice";
import { SKILLS, SKILL_GROUPS, SKILL_SUB_CATEGORY_BY_KEY } from "@/shared/constants/skills";
import { cn } from "@/shared/lib";
import { Badge } from "@/shared/shadcn-ui/badge";
import { Button } from "@/shared/shadcn-ui/button";
import { Calendar } from "@/shared/shadcn-ui/calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shared/shadcn-ui/command";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/shadcn-ui/dialog";
import { Input } from "@/shared/shadcn-ui/input";
import { Label } from "@/shared/shadcn-ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/shadcn-ui/popover";
import { Textarea } from "@/shared/shadcn-ui/textarea";
import { type Location } from "@/shared/types";
import { toast } from "@/shared/utility-hooks/use-toast";
⋮----
interface ProposalDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (data: {
    title: string;
    description: string;
    startDate?: Date;
    endDate?: Date;
    location: Location;
    requiredSkills: SkillRequirement[];
  }) => Promise<void>;
  initialDate: Date;
  /** FR-K5: Org ID used to load the org's skill tag pool instead of the global library. */
  orgId?: string;
}
⋮----
/** FR-K5: Org ID used to load the org's skill tag pool instead of the global library. */
⋮----
/**
 * @fileoverview ProposalDialog - A dedicated dialog component for creating schedule proposals.
 * @description This is a "dumb" component that receives its state and callbacks via props.
 * It encapsulates the entire form logic for submitting a new schedule item.
 * The requiredSkills section connects to SKILL_TAG_POOL (skill-xp.slice)
 * so that schedule proposals can specify staffing skill requirements.
 * FR-K5: When orgId is provided, loads the org's tag pool; otherwise falls back to global SKILLS.
 */
export function ProposalDialog({
  isOpen,
  onOpenChange,
  onSubmit,
  initialDate,
  orgId,
}: ProposalDialogProps)
⋮----
// FR-K5: Org skill tag pool — loaded once per dialog open when orgId is provided.
⋮----
// Fallback to global skills list when org pool is empty
⋮----
// Pre-compute a slug → SkillDefinition map for O(1) lookups in the grouped picker.
⋮----
// Pre-compute grouped structure: group → subCategory → skillOptions entries.
⋮----
/** Value string for cmdk filtering — covers zh + en + sub-category labels. */
⋮----
const handleLocationChange = (field: keyof Location, value: string) =>
⋮----
const handleAddSkillRequirement = () =>
⋮----
const handleRemoveSkillRequirement = (slug: string) =>
⋮----
const handleSubmit = async () =>
⋮----
<Input id="item-title" value=
⋮----

⋮----
<button
                        type="button"
                        onClick={() => handleRemoveSkillRequirement(req.tagSlug)}
                        className="ml-1 rounded-full hover:text-destructive"
                      >
                        <X className="size-3" />
                      </button>
                    </Badge>
                  );
⋮----
setSelectedSkillSlug(skill.slug);
setSkillPickerOpen(false);
````

## File: src/features/scheduling.slice/_components/schedule-data-table.tsx
````typescript
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table"
import { ChevronDown } from "lucide-react"
⋮----
import { Button } from "@/shared/shadcn-ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/shared/shadcn-ui/dropdown-menu"
import { Input } from "@/shared/shadcn-ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/shadcn-ui/table"
⋮----
interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}
⋮----
column.toggleVisibility(!!value)
````

## File: src/features/scheduling.slice/_components/schedule-proposal-content.tsx
````typescript
// [職責] Shared schedule proposal form logic for both canonical and intercepting routes.
⋮----
import { parseISO } from "date-fns"
import { useRouter, useSearchParams } from "next/navigation"
⋮----
import type { SkillRequirement } from "@/features/shared-kernel"
import { useWorkspace } from "@/features/workspace.slice"
import type { Location } from "@/shared/types"
import { toast } from "@/shared/utility-hooks/use-toast"
⋮----
import { ProposalDialog } from "./proposal-dialog"
⋮----
interface ScheduleProposalContentProps {
  /** Wrap the dialog in a full-page centering container (for canonical route). */
  fullPage?: boolean
}
⋮----
/** Wrap the dialog in a full-page centering container (for canonical route). */
⋮----
export function ScheduleProposalContent(
⋮----
const handleSubmit = async (data: {
    title: string
    description?: string
    startDate?: Date
    endDate?: Date
    location: Location
    requiredSkills: SkillRequirement[]
}) =>
⋮----
// Omit optional fields rather than passing undefined — Firestore rejects undefined values.
````

## File: src/features/scheduling.slice/_components/schedule.account-view.tsx
````typescript
/**
 * @fileoverview AccountScheduleSection - Organization-wide schedule view.
 * @description Aggregated view of all proposed and official schedule items across all
 * workspaces. Includes an org-only guard and uses the `useScheduleActions` hook for
 * all write operations (approve/reject/assign).
 *
 * Tabs:
 *   - 排程日曆 (Calendar): unified calendar grid + upcoming/present/history tables
 *   - 人力管理 (Workforce): skill-aware proposal assignment + lifecycle (OrgScheduleGovernance)
 *
 * Merge rationale:
 *   - DemandBoard (old Tab 2) removed: OrgScheduleGovernance covers the same lifecycle
 *     (PROPOSAL → assign + approve → OFFICIAL → complete) with superior skill-tier matching.
 *   - GovernanceSidebar removed from Calendar tab: having approve/reject in two places
 *     (sidebar + HR tab) fragmented the workflow. Calendar is now a clean read-only view.
 */
⋮----
import { addMonths, subMonths } from "date-fns";
import { AlertCircle, UserPlus, Calendar, ListChecks, History, Users, BookOpen, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";
⋮----
import { useApp } from "@/shared/app-providers/app-context";
import { cn } from "@/shared/lib";
import { Button } from "@/shared/shadcn-ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shared/shadcn-ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/shadcn-ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/shadcn-ui/tabs";
import type { MemberReference, ScheduleItem } from "@/shared/types";
⋮----
import { useGlobalSchedule } from "../_hooks/use-global-schedule";
import { useScheduleActions } from "../_hooks/use-schedule-commands";
⋮----
import { decisionHistoryColumns } from "./decision-history-columns";
import { OrgScheduleGovernance } from "./org-schedule-governance";
import { OrgSkillPoolManager } from "./org-skill-pool-manager";
import { ScheduleDataTable } from "./schedule-data-table";
import { UnifiedCalendarGrid } from "./unified-calendar-grid";
import { upcomingEventsColumns } from "./upcoming-events-columns";
⋮----
// ---------------------------------------------------------------------------
// Searchable member-assign popover (replaces plain DropdownMenu)
// ---------------------------------------------------------------------------
⋮----
interface MemberAssignPopoverProps {
  item: ScheduleItem;
  members: MemberReference[];
  onAssign: (item: ScheduleItem, memberId: string) => void;
  onUnassign: (item: ScheduleItem, memberId: string) => void;
}
⋮----
onUnassign(item, member.id);
⋮----
const onItemClick = (item: ScheduleItem) =>
⋮----
const handleMonthChange = (direction: 'prev' | 'next') =>
⋮----
{/* Tab 1: Calendar — full-width grid + upcoming/present/history tables */}
⋮----
{/* Tab 2: 人力管理 — unified workforce management
            Covers: PROPOSAL (skill-aware assign + approve/cancel) + OFFICIAL (mark complete).
            Supersedes the old DemandBoard tab (simple assign) and the GovernanceSidebar
            (approve-only, no assignment) that previously lived in the Calendar tab. */}
⋮----
{/* Tab 3: 技能庫 — manage which global skills apply to this organization.
            Activated skills appear in ProposalDialog's picker instead of the full
            global library, reducing browsing burden for HR (FR-K5). */}
````

## File: src/features/scheduling.slice/_components/schedule.workspace-view.tsx
````typescript
// [職責] Business — 單一 Workspace 排程提案與檢視
⋮----
import { Shield } from "lucide-react";
import { useRouter } from "next/navigation";
⋮----
import { useWorkspace } from "@/features/workspace.slice";
import { Button } from "@/shared/shadcn-ui/button";
⋮----
import { useWorkspaceSchedule } from "../_hooks/use-workspace-schedule";
⋮----
import { UnifiedCalendarGrid } from "./unified-calendar-grid";
⋮----
export function WorkspaceSchedule()
⋮----
onClick=
````

## File: src/features/scheduling.slice/_components/unified-calendar-grid.tsx
````typescript
import { format, isWeekend, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday } from "date-fns";
import { Plus, Check, X, Layers, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
⋮----
import type { Timestamp } from "@/features/shared-kernel";
import { findSkill } from "@/shared/constants/skills";
import { cn } from "@/shared/lib";
import { Avatar, AvatarFallback } from "@/shared/shadcn-ui/avatar";
import { Badge } from "@/shared/shadcn-ui/badge";
import { Button } from "@/shared/shadcn-ui/button";
import { ScrollArea } from "@/shared/shadcn-ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/shadcn-ui/tooltip";
import { type MemberReference, type ScheduleItem } from "@/shared/types";
⋮----
interface UnifiedCalendarGridProps {
  items: ScheduleItem[];
  members: MemberReference[];
  viewMode: 'workspace' | 'organization';
  currentDate: Date;
  onMonthChange: (direction: 'prev' | 'next') => void;
  onItemClick?: (item: ScheduleItem) => void;
  onAddClick?: (date: Date) => void;
  onApproveProposal?: (item: ScheduleItem) => void;
  onRejectProposal?: (item: ScheduleItem) => void;
  renderItemActions?: (item: ScheduleItem) => React.ReactNode;
}
⋮----
/**
 * @fileoverview UnifiedCalendarGrid - A dumb component for rendering schedule items.
 * @description REFACTORED: This component is now a pure presentation component.
 * It receives all data and callbacks via props and is responsible only for rendering
 * the calendar grid. All state management and dialogs have been moved to parent components.
 */
⋮----
const toDate = (timestamp: Timestamp | Date |
⋮----
// Handle plain-object serialized Timestamps (e.g. passed through React state)
⋮----
<div className=
⋮----
{/* Section 1: Workspace */}
⋮----
e.stopPropagation();
⋮----
{/* Section 2: Title */}
⋮----
{/* Section 2.5: Required Skills */}
⋮----
{/* Section 3: Assignees & Actions */}
⋮----
<Button size="icon" variant="ghost" className="size-6 p-0 text-destructive" onClick=
⋮----
<Button size="icon" variant="ghost" className="size-6 p-0 text-green-600" onClick=
````

## File: src/features/scheduling.slice/_components/upcoming-events-columns.tsx
````typescript
import { type ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { ArrowUpDown } from "lucide-react"
⋮----
import { SKILLS } from "@/shared/constants/skills"
import { Avatar, AvatarFallback } from "@/shared/shadcn-ui/avatar"
import { Badge } from "@/shared/shadcn-ui/badge"
import { Button } from "@/shared/shadcn-ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/shadcn-ui/tooltip"
import { type MemberReference, type ScheduleItem } from "@/shared/types"
⋮----
export type UpcomingEventItem = Pick<ScheduleItem, 'id' | 'title' | 'workspaceName' | 'startDate' | 'endDate' | 'assigneeIds' | 'requiredSkills'> & { members: MemberReference[] }
````

## File: src/features/scheduling.slice/_eligibility.ts
````typescript
/**
 * scheduling.slice — _eligibility.ts
 *
 * Pure eligibility matching utility — extracted from startSchedulingSaga [A5]
 * to enable unit testing without Firestore dependencies.
 *
 * Invariants respected:
 *   #12  — Tier is NEVER stored; only xp is persisted. getTier(xp) computed at runtime.
 *   #14  — Schedule reads ONLY projection.org-eligible-member-view, never Account aggregate.
 *   A5   — Eligibility gate: all SkillRequirements must be satisfied for a candidate match.
 *   P4   — Eligibility check: member.eligible must be true AND all skill tiers satisfied.
 *   TE_SK — skill-requirement = tagSlug × minimumTier.
 */
⋮----
import type { OrgEligibleMemberView } from '@/features/projection.bus';
import type { SkillRequirement } from '@/features/shared-kernel';
⋮----
// ─── Canonical tier ordering ─────────────────────────────────────────────────
⋮----
export type SagaTier = (typeof SAGA_TIER_ORDER)[number];
⋮----
/**
 * Returns the 0-based ordinal index of a tier string within SAGA_TIER_ORDER.
 * Unknown tiers default to 0 (apprentice rank) with a warning.
 */
export function sagaTierIndex(tier: string): number
⋮----
/**
 * Returns the first OrgEligibleMemberView that satisfies ALL skill requirements.
 *
 * Selection criteria:
 *   1. member.eligible must be true (no conflicting assignments)
 *   2. For each SkillRequirement, member must have a skill entry whose tier index
 *      is >= the required tier index.
 *   3. Empty requirements array means any eligible member matches (no skill filter).
 *
 * Returns undefined if no qualifying candidate exists → saga transitions to 'compensated'.
 *
 * @param members      Eligible member views from projection.org-eligible-member-view [#14]
 * @param requirements Skill requirements from WorkspaceScheduleProposedPayload [TE_SK]
 */
export function findEligibleCandidate(
  members: OrgEligibleMemberView[],
  requirements: SkillRequirement[]
): OrgEligibleMemberView | undefined
⋮----
// ─── Multi-member assignment ──────────────────────────────────────────────────
⋮----
/**
 * Represents a single assignment slot: one eligible member assigned to fulfill
 * one specific SkillRequirement slot. `requirement` is null when no skill filter
 * applies (empty-requirements case — any eligible member).
 */
export interface CandidateAssignment {
  candidate: OrgEligibleMemberView;
  /** The specific requirement this candidate was selected to fulfill. Null when no skill filter applies. */
  requirement: SkillRequirement | null;
}
⋮----
/** The specific requirement this candidate was selected to fulfill. Null when no skill filter applies. */
⋮----
/**
 * Finds eligible members to fulfill ALL skill requirements, respecting `quantity`.
 *
 * For each SkillRequirement with `quantity: N`, this function selects N distinct
 * eligible members that satisfy the requirement. A member can only be selected once
 * across all requirements (no double-counting).
 *
 * For empty requirements (no skill filter):
 *   Returns one eligible member — backward-compatible single-assignment behavior.
 *
 * Returns undefined if any requirement cannot be fully satisfied by the available
 * pool → caller must trigger saga compensation [A5].
 *
 * @param members      Eligible member views from projection.org-eligible-member-view [#14]
 * @param requirements Skill requirements from WorkspaceScheduleProposedPayload [TE_SK]
 */
export function findEligibleCandidatesForRequirements(
  members: OrgEligibleMemberView[],
  requirements: SkillRequirement[]
): CandidateAssignment[] | undefined
⋮----
// Empty requirements: assign one eligible member (backward-compatible)
⋮----
// Cannot fulfill this requirement — caller must compensate [A5]
````

## File: src/features/scheduling.slice/_hooks/use-global-schedule.ts
````typescript
import { subDays, isFuture, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { useMemo } from "react";
⋮----
import { useAccount } from "@/features/workspace.slice";
import { useApp } from "@/shared/app-providers/app-context";
⋮----
/**
 * @fileoverview useGlobalSchedule - Hook for filtering and preparing schedule data for the account view.
 * @description Encapsulates all data manipulation logic for the organization-level
 * schedule, keeping the main component clean and focused on rendering.
 */
export function useGlobalSchedule()
````

## File: src/features/scheduling.slice/_hooks/use-org-schedule.ts
````typescript
/**
 * scheduling.slice — _hooks/use-org-schedule.ts
 *
 * React hook for subscribing to org schedule items.
 * Used by the org governance UI to display and act on pending proposals.
 *
 * Per logic-overview.md:
 *   ORGANIZATION_SCHEDULE → (org governance reads pending proposals via this hook)
 *
 * Single source of truth: accounts/{orgId}/schedule_items
 */
⋮----
import { useState, useEffect } from 'react';
⋮----
import type { ScheduleItem, ScheduleStatus } from '@/shared/types';
⋮----
import { subscribeToOrgScheduleProposals, subscribeToPendingProposals, subscribeToConfirmedProposals } from '../_queries';
⋮----
/**
 * Subscribes to all org schedule items for the given orgId.
 * Optionally filter to a specific status.
 */
export function useOrgSchedule(
  orgId: string | null,
  opts?: { status?: ScheduleStatus }
)
⋮----
/**
 * Convenience hook that only returns pending proposals (status = 'PROPOSAL').
 * Used by the approval workflow in the org governance UI.
 */
export function usePendingScheduleProposals(orgId: string | null)
⋮----
/**
 * Convenience hook that returns confirmed items only (status = 'OFFICIAL').
 * Used by the FR-S6 "Complete Schedule" governance UI.
 */
export function useConfirmedScheduleProposals(orgId: string | null)
````

## File: src/features/scheduling.slice/_hooks/use-schedule-commands.ts
````typescript
/**
 * @fileoverview use-schedule-actions.ts - Hook for managing schedule-related write operations.
 * @description This hook centralizes business logic for interactive features
 * on schedule items, such as assigning members and approving/rejecting proposals.
 * It acts as the bridge between UI components and the infrastructure layer,
 * respecting architectural boundaries.
 */
⋮----
import { useCallback } from "react";
⋮----
import { getOrgMemberEligibilityWithTier } from "@/features/projection.bus";
import { tierSatisfies } from "@/features/shared-kernel";
import { useApp } from "@/shared/app-providers/app-context";
import { useAuth } from "@/shared/app-providers/auth-provider";
import { canTransitionScheduleStatus } from "@/shared/lib";
import type { ScheduleItem } from "@/shared/types";
import { toast } from "@/shared/utility-hooks/use-toast";
⋮----
import {
    assignMember as assignMemberAction,
    unassignMember as unassignMemberAction,
    updateScheduleItemStatus,
} from "../_actions";
import { getAccountActiveAssignments } from "../_queries";
⋮----
export function useScheduleActions()
⋮----
// W_B_SCHEDULE -.→ ACCOUNT_PROJECTION_SCHEDULE: filter available accounts via projection
// (Invariant #2: read cross-BC data only via Projection, not Domain Core)
⋮----
// W_B_SCHEDULE -.→ ORG_ELIGIBLE_MEMBER_VIEW: soft skill-eligibility check
// (Invariant #14: only reads Projection — never Account aggregate)
// (Invariant #12: tier is derived via resolveSkillTier(xp) — never stored in DB)
// Warning-only guard; hard validation happens in approveOrgScheduleProposal.
````

## File: src/features/scheduling.slice/_hooks/use-schedule-event-handler.ts
````typescript
// [職責] W_B_SCHEDULE — B 軌 IssueResolved 事件訂閱（離散恢復原則）
⋮----
import { useEffect } from "react";
⋮----
import { useWorkspace } from "@/features/workspace.slice";
import { toast } from "@/shared/utility-hooks/use-toast";
⋮----
/**
 * Subscribes to B-track `IssueResolved` events via the workspace event bus.
 *
 * Per logic-overview.md (AB dual-track discrete recovery):
 *   TRACK_B_ISSUES →|IssueResolved 事件| WORKSPACE_EVENT_BUS
 *   W_B_SCHEDULE subscribes (not direct coupling) and may resume blocked items.
 *
 * Invariant #2: cross-BC communication only via Event/Projection — no direct dependency
 * on TRACK_B_ISSUES internals.
 */
export function useScheduleEventHandler()
⋮----
// Discrete recovery: notify the schedule layer that an issue is resolved.
// Schedule items that were blocked pending this resolution may now proceed.
````

## File: src/features/scheduling.slice/_hooks/use-workspace-schedule.ts
````typescript
// [職責] Business — 單一 Workspace 排程提案與狀態邏輯
/**
 * @fileoverview useWorkspaceSchedule - Hook for workspace-scoped schedule state and actions.
 * @description Encapsulates data derivation, state management, side effects, and
 * write actions for the workspace schedule feature. Keeps the view component as a thin renderer.
 *
 * @responsibility
 * - Subscribe directly to accounts/{dimensionId}/schedule_items for this workspace so that
 *   proposals submitted by workspace members (whose activeAccount may be personal, not org)
 *   are always visible in the workspace calendar.
 * - Derive `organizationMembers` from AppContext active account.
 * - Handle `scheduleTaskRequest` cross-capability hint effect.
 * - Manage calendar navigation state: `currentDate`.
 */
⋮----
import { addMonths, subMonths, format } from "date-fns";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
⋮----
import { useWorkspace } from "@/features/workspace.slice";
import { useApp } from "@/shared/app-providers/app-context";
import type { ScheduleItem } from "@/shared/types";
import { toast } from "@/shared/utility-hooks/use-toast";
⋮----
import { subscribeToWorkspaceScheduleItems } from '../_queries';
⋮----
export function useWorkspaceSchedule()
⋮----
// Cross-capability hint: when a task triggers a schedule request, surface a toast.
⋮----
// Subscribe directly to the org's schedule_items for this workspace.
// AccountProvider only subscribes when activeAccount.accountType === 'organization'.
// Workspace members on a personal account would therefore see an empty calendar
// even after submitting a proposal. This direct subscription fixes that gap.
⋮----
const handleMonthChange = (direction: "prev" | "next") =>
⋮----
const handleOpenAddDialog = (date: Date) =>
````

## File: src/features/scheduling.slice/_projectors/account-schedule-queries.ts
````typescript
/**
 * scheduling.slice/_projectors — account-schedule-queries.ts
 *
 * @deprecated Queries have been merged into scheduling.slice/_queries.ts.
 * This file is retained only to avoid breaking any direct internal imports
 * and will be removed in a future cleanup pass.
 *
 * Read-side queries for the account schedule projection.
 * Canonical query logic now lives in scheduling.slice/_queries.ts.
 */
````

## File: src/features/scheduling.slice/_projectors/account-schedule.ts
````typescript
/**
 * scheduling.slice/_projectors — account-schedule.ts
 *
 * Type definitions for the account schedule projection read model.
 * Projection write logic has been migrated to projection.bus/account-schedule/_projector.ts
 * per logic-overview.md (ACC_SCHED_V is a PROJ_BUS Standard Projection).
 *
 * These type exports are retained here so that scheduling.slice/_queries.ts
 * can type its read functions without introducing a cross-slice dependency
 * on projection.bus.
 */
⋮----
import type { FieldValue } from '@/shared/infra/firestore/firestore.write.adapter';
⋮----
export interface AccountScheduleProjection {
  accountId: string;
  /** Active schedule assignment IDs */
  activeAssignmentIds: string[];
  /** Map of scheduleItemId → { workspaceId, startDate, endDate } */
  assignmentIndex: Record<string, AccountScheduleAssignment>;
  readModelVersion: number;
  /** Last aggregate version processed by this projection [S2] */
  lastProcessedVersion?: number;
  /** TraceId from the originating EventEnvelope [R8] */
  traceId?: string;
  updatedAt: FieldValue;
}
⋮----
/** Active schedule assignment IDs */
⋮----
/** Map of scheduleItemId → { workspaceId, startDate, endDate } */
⋮----
/** Last aggregate version processed by this projection [S2] */
⋮----
/** TraceId from the originating EventEnvelope [R8] */
⋮----
export interface AccountScheduleAssignment {
  scheduleItemId: string;
  workspaceId: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'active' | 'completed';
}
````

## File: src/features/scheduling.slice/_projectors/demand-board-queries.ts
````typescript
/**
 * scheduling.slice/_projectors — demand-board-queries.ts
 *
 * Read-side queries for the Demand Board projection.
 * Per docs/prd-schedule-workforce-skills.md FR-W0:
 *   - PROPOSAL + OFFICIAL items are visible to org HR (Demand Board view).
 *   - REJECTED / COMPLETED items are hidden from the default board view.
 *
 * Single source of truth: accounts/{orgId}/schedule_items
 * Staleness: PROJ_STALE_DEMAND_BOARD ≤ 5s (SK_STALENESS_CONTRACT).
 */
⋮----
import type { ImplementsStalenessContract } from '@/features/shared-kernel';
import { db } from '@/shared/infra/firestore/firestore.client';
import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  type Unsubscribe,
  type QueryDocumentSnapshot,
  type QuerySnapshot,
} from '@/shared/infra/firestore/firestore.read.adapter';
import type { ScheduleItem } from '@/shared/types';
⋮----
/** Demand Board staleness declaration. [S4] */
⋮----
/**
 * Fetches all visible (PROPOSAL + OFFICIAL) schedule items for a given org.
 * Per FR-W0: REJECTED / COMPLETED items are excluded from the default board.
 */
export async function getActiveDemands(orgId: string): Promise<ScheduleItem[]>
⋮----
/**
 * Real-time subscription to org schedule items visible on the Demand Board.
 * (PROPOSAL + OFFICIAL only.)
 * Returns an unsubscribe function.
 * Staleness: PROJ_STALE_DEMAND_BOARD ≤ 5s — Firestore onSnapshot satisfies this.
 */
export function subscribeToDemandBoard(
  orgId: string,
  onChange: (items: ScheduleItem[]) => void
): Unsubscribe
⋮----
/**
 * Fetches all schedule items for an org (including REJECTED/COMPLETED), for audit/history view.
 */
export async function getAllDemands(orgId: string): Promise<ScheduleItem[]>
````

## File: src/features/scheduling.slice/_projectors/demand-board.ts
````typescript
/**
 * scheduling.slice/_projectors — demand-board.ts
 *
 * Maintains the Demand Board read model.
 * Per docs/prd-schedule-workforce-skills.md FR-W0 / FR-W6:
 *   - PROPOSAL: proposal submitted, awaiting assignment (visible)
 *   - OFFICIAL: member confirmed (visible with assignee details)
 *   - REJECTED / COMPLETED: closed (hidden from default board view)
 *
 * Single source of truth: accounts/{orgId}/schedule_items/{scheduleItemId}
 * All projector functions write to this path (same document the workspace and
 * domain layers create/enrich), ensuring the UI always reads from one collection.
 *
 * Governance rules applied here:
 *   [S2] SK_VERSION_GUARD — versionGuardAllows enforced before every Firestore write.
 *   [R8] traceId — persisted from originating EventEnvelope.
 *   PROJ_STALE_DEMAND_BOARD ≤ 5s (SK_STALENESS_CONTRACT).
 *
 * Invariant #1 (cross-BC): this projector only writes to accounts/{orgId}/schedule_items
 *   — the ScheduleItem SSOT. It does NOT write to any other BC's aggregate.
 */
⋮----
import type {
  ScheduleAssignedPayload,
  ScheduleCompletedPayload,
  ScheduleAssignmentCancelledPayload,
  ScheduleProposalCancelledPayload,
  ScheduleAssignRejectedPayload,
} from '@/features/organization.slice';
import { versionGuardAllows } from '@/features/shared-kernel';
import type { WorkspaceScheduleProposedPayload } from '@/features/shared-kernel';
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
import { arrayUnion } from '@/shared/infra/firestore/firestore.write.adapter';
import { updateDocument } from '@/shared/infra/firestore/firestore.write.adapter';
import type { ScheduleItem, ScheduleStatus } from '@/shared/types';
⋮----
/** Firestore path for a schedule item (single source of truth). */
function scheduleItemPath(orgId: string, scheduleItemId: string): string
⋮----
/** Initial version for newly proposed schedule items. */
⋮----
/**
 * Called by projection.event-funnel on 'workspace:schedule:proposed'.
 *
 * The workspace layer already created the accounts/{orgId}/schedule_items document.
 * handleScheduleProposed (domain aggregate) also runs before this function and
 * sets version/traceId. This function is idempotent — if the domain already set
 * version=1, the version guard on subsequent projector functions will naturally
 * skip stale writes.
 *
 * [S2] No version guard on initial insert (create-or-overwrite is idempotent).
 */
export async function applyDemandProposed(
  payload: WorkspaceScheduleProposedPayload
): Promise<void>
⋮----
// The document already exists (created by workspace layer + enriched by domain).
// We ensure version/traceId are set so downstream version guards work correctly.
⋮----
/**
 * Marks a schedule item as assigned (OFFICIAL).
 * Called by projection.event-funnel on 'organization:schedule:assigned'.
 *
 * Note: approveOrgScheduleProposal (domain) sets status='OFFICIAL' and increments
 * version BEFORE publishing this event. The version guard therefore naturally skips
 * this write when the domain has already applied the update (nextVersion == existing.version).
 * [S2] versionGuardAllows enforced before write.
 */
export async function applyDemandAssigned(payload: ScheduleAssignedPayload): Promise<void>
⋮----
/**
 * Marks a schedule item as completed (COMPLETED).
 * Called by projection.event-funnel on 'organization:schedule:completed'.
 * [S2] versionGuardAllows enforced before write.
 */
export async function applyDemandCompleted(payload: ScheduleCompletedPayload): Promise<void>
⋮----
/**
 * Marks a schedule item as rejected due to assignment cancellation (REJECTED).
 * Called by projection.event-funnel on 'organization:schedule:assignmentCancelled'.
 * [S2] versionGuardAllows enforced before write.
 */
export async function applyDemandAssignmentCancelled(
  payload: ScheduleAssignmentCancelledPayload
): Promise<void>
⋮----
/**
 * Marks a schedule item as rejected due to proposal cancellation (REJECTED).
 * Called by projection.event-funnel on 'organization:schedule:proposalCancelled'.
 * [S2] No aggregateVersion in this payload — guard via status: skip if already closed.
 */
export async function applyDemandProposalCancelled(
  payload: ScheduleProposalCancelledPayload
): Promise<void>
⋮----
// [S2] Status-based guard: skip if item is already in a terminal state.
⋮----
/**
 * Marks a schedule item as rejected due to skill validation failure (REJECTED).
 * Called by projection.event-funnel on 'organization:schedule:assignRejected'.
 * [S2] No aggregateVersion in this payload — guard via status: skip if already closed.
 */
export async function applyDemandAssignRejected(
  payload: ScheduleAssignRejectedPayload
): Promise<void>
⋮----
// [S2] Status-based guard: skip if item is already in a terminal state.
⋮----
// =================================================================
// Internal helper
// =================================================================
⋮----
async function _closeScheduleItem(
  orgId: string,
  scheduleItemId: string,
  status: 'COMPLETED' | 'REJECTED',
  aggregateVersion: number,
  traceId?: string
): Promise<void>
````

## File: src/features/scheduling.slice/_queries.ts
````typescript
/**
 * scheduling.slice — _queries.ts
 *
 * Read-only queries for the VS6 Scheduling domain.
 * Single source of truth: accounts/{orgId}/schedule_items
 *
 * QGWAY_SCHED [#14 #15 #16]:
 *   Eligible-member queries route through projection.org-eligible-member-view
 *   via the QGWAY_SCHED channel only.  scheduling.slice must NOT query
 *   Firestore for member eligibility directly (D7 cross-slice isolation).
 */
⋮----
import {
  getOrgMemberEligibilityWithTier,
  getOrgEligibleMembersWithTier,
  type OrgEligibleMemberView,
  type OrgMemberSkillWithTier,
} from '@/features/projection.bus';
import type { ImplementsStalenessContract } from '@/features/shared-kernel';
import { db } from '@/shared/infra/firestore/firestore.client';
import { getScheduleItems as getScheduleItemsFacade } from '@/shared/infra/firestore/firestore.facade';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  type Unsubscribe,
  type QueryDocumentSnapshot,
  type QuerySnapshot,
} from '@/shared/infra/firestore/firestore.read.adapter';
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
import type { ScheduleItem, ScheduleStatus } from '@/shared/types';
⋮----
import type { AccountScheduleProjection, AccountScheduleAssignment } from './_projectors/account-schedule';
⋮----
// =================================================================
// Staleness declarations [S4]
// =================================================================
⋮----
// =================================================================
// Workspace-scoped queries
// =================================================================
⋮----
/**
 * Fetches all schedule items for an account, optionally filtered by workspace.
 */
export async function getScheduleItems(
  accountId: string,
  workspaceId?: string
): Promise<ScheduleItem[]>
⋮----
// =================================================================
// Org-scoped single-item lookup
// =================================================================
⋮----
/**
 * Fetches a single schedule item by orgId + scheduleItemId.
 */
export async function getOrgScheduleItem(
  orgId: string,
  scheduleItemId: string
): Promise<ScheduleItem | null>
⋮----
/** @deprecated Use getOrgScheduleItem. */
⋮----
// =================================================================
// Org-scoped subscriptions (real-time)
// =================================================================
⋮----
/**
 * Subscribes to schedule items for a given orgId, optionally filtered by status.
 */
export function subscribeToOrgScheduleProposals(
  orgId: string,
  onUpdate: (items: ScheduleItem[]) => void,
  opts?: { status?: ScheduleStatus; maxItems?: number }
): Unsubscribe
⋮----
export function subscribeToPendingProposals(
  orgId: string,
  onUpdate: (items: ScheduleItem[]) => void
): Unsubscribe
⋮----
export function subscribeToConfirmedProposals(
  orgId: string,
  onUpdate: (items: ScheduleItem[]) => void
): Unsubscribe
⋮----
// =================================================================
// Demand Board queries (FR-W0)
// =================================================================
⋮----
/**
 * Fetches all visible (PROPOSAL + OFFICIAL) schedule items for a given org.
 */
export async function getActiveDemands(orgId: string): Promise<ScheduleItem[]>
⋮----
/**
 * Real-time subscription for the Demand Board (PROPOSAL + OFFICIAL only).
 */
export function subscribeToDemandBoard(
  orgId: string,
  onChange: (items: ScheduleItem[]) => void
): Unsubscribe
⋮----
/**
 * Fetches all schedule items for an org (including REJECTED/COMPLETED), for audit/history.
 */
export async function getAllDemands(orgId: string): Promise<ScheduleItem[]>
⋮----
// =================================================================
// Account schedule projection queries
// =================================================================
⋮----
export async function getAccountScheduleProjection(
  accountId: string
): Promise<AccountScheduleProjection | null>
⋮----
export async function getAccountActiveAssignments(
  accountId: string
): Promise<AccountScheduleAssignment[]>
⋮----
// =================================================================
// QGWAY_SCHED — Eligible member queries [#14 #15 #16]
// =================================================================
// All scheduling eligibility reads must pass through these functions.
// Direct Firestore access for member eligibility is forbidden (D7 D24).
// The underlying data source is projection.org-eligible-member-view (L5).
⋮----
/**
 * Returns the full eligible-member view (with computed skill tiers) for a single
 * org member.  Routing: VS6 → QGWAY_SCHED → projection.org-eligible-member-view.
 *
 * Per logic-overview.md Invariant #14: scheduling reads ORG_ELIGIBLE_MEMBER_VIEW.
 */
export async function getEligibleMemberForSchedule(
  orgId: string,
  accountId: string
): Promise<OrgEligibleMemberView | null>
⋮----
/**
 * Returns all eligible members (eligible=true) for an org with computed tiers.
 * Used by the scheduling saga [A5] to find assignable candidates.
 *
 * Routing: VS6 → QGWAY_SCHED → projection.org-eligible-member-view [#14].
 */
export async function getEligibleMembersForSchedule(
  orgId: string
): Promise<OrgEligibleMemberView[]>
⋮----
// =================================================================
// Workspace-scoped schedule_items subscription
// =================================================================
⋮----
/**
 * Opens a real-time listener on schedule_items filtered to a specific workspace.
 * Used by workspace-facing hooks that need live schedule state regardless of
 * which account is currently active (personal vs org).
 *
 * Path: accounts/{dimensionId}/schedule_items where workspaceId == workspaceId
 */
export function subscribeToWorkspaceScheduleItems(
  dimensionId: string,
  workspaceId: string,
  onUpdate: (items: ScheduleItem[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe
````

## File: src/features/scheduling.slice/_saga.eligibility.test.ts
````typescript
/**
 * @fileoverview Tests for Scheduling Saga eligibility-check logic [A5][VS6]
 *
 * Validates the skill-matching algorithm used in `startSchedulingSaga` by testing
 * the `tierSatisfies` + candidate-selection logic in isolation (no Firestore).
 *
 * Tests cover:
 *   1. Candidate selection when skills match exactly
 *   2. Candidate selection when member has higher tier (should pass)
 *   3. Rejection when no member meets skill requirements
 *   4. Empty requirements → any eligible member is a candidate
 *   5. Multiple requirements — all must be satisfied (AND logic)
 *   6. WorkspaceScheduleProposedPayload carries skillRequirements correctly [A4×A5]
 */
⋮----
import { describe, it, expect } from 'vitest';
⋮----
import type { SkillTier, SkillRequirement, WorkspaceScheduleProposedPayload } from '@/features/shared-kernel';
import { tierSatisfies } from '@/features/shared-kernel/skill-tier';
⋮----
// ---------------------------------------------------------------------------
// Helpers — mirrors the eligibility logic inside _saga.ts
// ---------------------------------------------------------------------------
⋮----
/** Subset of the org eligible-member-view projection used by the saga. */
interface MockMember {
  accountId: string;
  eligible: boolean;
  skills: { skillId: string; tier: SkillTier }[];
}
⋮----
/**
 * Replicates the candidate-selection logic from `startSchedulingSaga`.
 * Tests this pure logic without Firestore dependencies.
 */
function selectCandidate(
  members: MockMember[],
  requirements: SkillRequirement[]
): MockMember | undefined
⋮----
// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
⋮----
// ---------------------------------------------------------------------------
// Candidate selection
// ---------------------------------------------------------------------------
⋮----
// EXPERT_MEMBER is the first eligible one (APPRENTICE_MEMBER is filtered out)
⋮----
[] // empty requirements
⋮----
// EXPERT_MEMBER: civil-structural=expert ✓, but has no bim skill ✗
⋮----
// GRANDMASTER_MEMBER: civil-structural=grandmaster ✓, bim=artisan ✓
⋮----
// EXPERT_MEMBER has civil-structural but not landscape
⋮----
// ---------------------------------------------------------------------------
// WorkspaceScheduleProposedPayload contract [A4 × A5]
// ---------------------------------------------------------------------------
````

## File: src/features/scheduling.slice/_saga.test.ts
````typescript
/**
 * @test [A5] Scheduling Saga — eligibility matching logic
 *
 * Validates the pure eligibility-matching logic used by `startSchedulingSaga`
 * to find the best candidate, imported directly from `_eligibility.ts`.
 *
 * [A5] Compensation: if no candidate matches all skill requirements, saga
 *      transitions to 'compensated' state.
 * [P4] Eligibility check: member.eligible must be true AND all skill requirements
 *      must be satisfied by the member's skill tiers.
 * [TE_SK] skill-requirement = tagSlug × minimumTier — cross-BC staffing contract.
 */
import { describe, it, expect } from 'vitest';
⋮----
import type { OrgEligibleMemberView } from '@/features/projection.bus';
import type { SkillRequirement } from '@/features/shared-kernel';
import { tierSatisfies, TIER_DEFINITIONS } from '@/features/shared-kernel/skill-tier';
⋮----
import {
  SAGA_TIER_ORDER,
  sagaTierIndex,
  findEligibleCandidate,
  findEligibleCandidatesForRequirements,
} from './_eligibility';
⋮----
// ─── Tests ────────────────────────────────────────────────────────────────────
⋮----
function makeMember(
      accountId: string,
      eligible: boolean,
      skills: Array<{ skillId: string; tier: string }>
): OrgEligibleMemberView
⋮----
{ tagSlug: 'site-management:safety', minimumTier: 'expert', quantity: 1 }, // expertMember only has journeyman here
⋮----
// Ensure the saga's tier ordering never silently diverges from the canonical
// TIER_DEFINITIONS defined in shared-kernel. If TIER_DEFINITIONS adds, removes,
// or reorders a tier, this test will catch the mismatch.
⋮----
// ─── findEligibleCandidatesForRequirements — multi-member assignment ──────────
⋮----
function makeMember(
    accountId: string,
    eligible: boolean,
    skills: Array<{ skillId: string; tier: string }>
): OrgEligibleMemberView
⋮----
// Only memberA and memberD qualify (expert+); memberB is journeyman → below expert
⋮----
// Only one eligible member — cannot satisfy quantity: 2
⋮----
// memberA covers civil; memberC covers bim
⋮----
// memberD has both skills — but is only assigned once (first requirement)
// memberC covers the second requirement
⋮----
// memberD assigned to civil-structural (first req), memberC to bim
⋮----
{ tagSlug: 'landscape:design', minimumTier: 'journeyman', quantity: 1 }, // no member has this
⋮----
// memberD could cover both civil and bim individually, but once assigned for civil it is gone
⋮----
// Only memberD available (no separate memberC)
⋮----
// memberA: civil expert, memberB: civil journeyman, memberC: bim artisan
````

## File: src/features/scheduling.slice/_saga.ts
````typescript
/**
 * scheduling-saga — _saga.ts
 *
 * [VS6] 跨組織排班協作 Saga 協調器
 *
 * Per logic-overview.md VS6:
 *   WorkspaceScheduleProposed → OrgEligibilityCheck → ScheduleAssigned
 *
 * State machine:
 *   pending → eligibility_check → assigned | compensated
 *
 * Compensation [A5]: if eligibility check fails, emits ScheduleAssignRejected
 * and transitions the saga to 'compensated'.
 *
 * Persistence: sagaStates/{sagaId} in Firestore.
 */
⋮----
import { getOrgEligibleMembersWithTier } from '@/features/projection.bus';
import type { WorkspaceScheduleProposedPayload } from '@/features/shared-kernel';
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
import { setDocument, updateDocument } from '@/shared/infra/firestore/firestore.write.adapter';
⋮----
import {
  handleScheduleProposed,
  approveOrgScheduleProposal,
} from './_aggregate';
import { findEligibleCandidatesForRequirements } from './_eligibility';
⋮----
// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
⋮----
/** Discrete steps the saga executes in order. */
export type SagaStep =
  | 'receive_proposal'
  | 'eligibility_check'
  | 'assign'
  | 'compensate';
⋮----
/** Lifecycle states of the saga instance. */
export type SagaStatus =
  | 'pending'
  | 'eligibility_check'
  | 'assigned'
  | 'compensated';
⋮----
/** Persisted saga state stored in Firestore. */
export interface SagaState {
  readonly sagaId: string;
  readonly scheduleItemId: string;
  readonly workspaceId: string;
  readonly orgId: string;
  status: SagaStatus;
  currentStep: SagaStep;
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
  compensationReason?: string;
  /** [R8] TraceID propagated from the originating WorkspaceScheduleProposed event. */
  traceId?: string;
}
⋮----
/** [R8] TraceID propagated from the originating WorkspaceScheduleProposed event. */
⋮----
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
⋮----
function sagaPath(sagaId: string): string
⋮----
async function persistSaga(state: SagaState): Promise<void>
⋮----
async function updateSagaStatus(
  sagaId: string,
  patch: Partial<
    Pick<
      SagaState,
      'status' | 'currentStep' | 'completedAt' | 'compensationReason' | 'updatedAt'
    >
  >
): Promise<void>
⋮----
// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
⋮----
/**
 * Retrieve a persisted saga state by ID.
 * Returns null if not found.
 */
export async function getSagaState(sagaId: string): Promise<SagaState | null>
⋮----
/**
 * Entry point for the VS6 scheduling saga.
 *
 * Called by the OUTBOX_RELAY_WORKER when it picks up a `workspace:schedule:proposed`
 * event from WORKSPACE_OUTBOX. Orchestrates the full saga:
 *
 *   Step 1 — receive_proposal: persist the OrgScheduleProposal
 *   Step 2 — eligibility_check: find the best eligible member [#14][R7]
 *   Step 3 — assign | compensate [A5]
 *
 * @param event   The WorkspaceScheduleProposedPayload cross-BC event.
 * @param sagaId  Caller-assigned idempotency key (`saga:${scheduleItemId}`).
 */
export async function startSchedulingSaga(
  event: WorkspaceScheduleProposedPayload,
  sagaId: string
): Promise<SagaState>
⋮----
// Step 1 — receive_proposal
⋮----
// [R8] Persist traceId so all subsequent saga steps can propagate it.
⋮----
// Step 2 — eligibility_check
⋮----
// requirements = [] means "any eligible member can be assigned" (no skill filtering)
⋮----
// Step 3 — assign or compensate [A5]
⋮----
// Approve each candidate sequentially [A5].
// NOTE: if an approval fails mid-loop, earlier assignments are NOT rolled back.
// This is an accepted saga limitation — partial compensation requires a dedicated
// undo command that is out of scope for this fix.
⋮----
// Pass only this candidate's specific requirement so downstream validation
// checks them against their assigned skill slot, not all requirements.
⋮----
// [R8] Forward traceId from event to the approval step so published events carry the trace.
````

## File: src/features/scheduling.slice/index.ts
````typescript
/**
 * scheduling.slice — Public API
 *
 * Unified VS6 Scheduling vertical slice.
 * Domain: accounts/{orgId}/schedule_items (single source of truth)
 * Staleness: DEMAND_BOARD ≤ 5s | STANDARD ≤ 10s (SK_STALENESS_CONTRACT)
 *
 * External consumers import exclusively from this file.
 */
⋮----
// =================================================================
// Domain Aggregate
// =================================================================
⋮----
// =================================================================
// Server Actions (all schedule mutations go through here)
// =================================================================
⋮----
// Workspace-level
⋮----
// Fast-path facade mutations
⋮----
// HR domain actions
⋮----
// =================================================================
// Queries (read-only)
// =================================================================
⋮----
// =================================================================
// Hooks (React)
// =================================================================
⋮----
// =================================================================
// UI Components
// =================================================================
// Account-level views
⋮----
// Workspace-level views
⋮----
// Shared schedule UI primitives
⋮----
// =================================================================
// Projectors (event handlers — used by projection.event-funnel)
// =================================================================
⋮----
// AccountScheduleProjection types — read model types for scheduling queries.
// Write-side projection logic lives in projection.bus/account-schedule/.
⋮----
// =================================================================
// Saga (cross-org coordination — used by event relay worker)
// =================================================================
````

## File: src/features/semantic-graph.slice/_actions.ts
````typescript
/**
 * semantic-graph.slice — _actions.ts
 *
 * VS8 Semantic Graph: server actions for tag management. [D3]
 *
 * Per logic-overview.md [D3] SIDE_EFFECT_FUNNELLING:
 *   All entity mutations (Firestore set/update) MUST go through _actions.ts.
 *   UI and external callers MUST NOT call Firestore directly.
 *
 * Architecture:
 *   [D3]  All writes funnelled through these actions.
 *   [D8]  Validation logic delegated to _aggregate.ts (pure).
 *   [D21] Tag categories governed by VS8.
 *   [D26] semantic-graph.slice owns _actions.ts; does not parasitize shared-kernel.
 */
⋮----
import { commandSuccess, commandFailureFrom } from '@/features/shared-kernel';
import type { CommandResult } from '@/features/shared-kernel';
import type { TaxonomyNode } from '@/features/shared-kernel';
⋮----
import { detectTemporalConflicts, validateTaxonomyAssignment } from './_aggregate';
import { indexEntity, removeFromIndex } from './_services';
import type {
  TemporalTagAssignment,
  SemanticIndexEntry,
} from './_types';
⋮----
// =================================================================
// Tag Upsert with Conflict Check
// =================================================================
⋮----
/**
 * Upserts a tag assignment after passing temporal conflict detection
 * and taxonomy validation.
 *
 * Flow:
 *   1. Validate taxonomy constraints via _aggregate.ts
 *   2. Detect temporal conflicts via _aggregate.ts
 *   3. If valid, index the entity in the semantic index
 *   4. Return CommandResult per [R4]
 *
 * Actual Firestore persistence is deferred to the infrastructure layer;
 * this action validates and updates the in-memory semantic index.
 */
export async function upsertTagWithConflictCheck(
  node: TaxonomyNode,
  temporalAssignment: TemporalTagAssignment | null,
  existingNodes: readonly TaxonomyNode[],
  existingAssignments: readonly TemporalTagAssignment[]
): Promise<CommandResult>
⋮----
// =================================================================
// Tag Removal
// =================================================================
⋮----
/**
 * Removes a tag from the semantic index.
 * Returns CommandResult per [R4].
 */
export async function removeTag(tagSlug: string): Promise<CommandResult>
⋮----
// =================================================================
// Tag Assignment Action (D3)
// =================================================================
⋮----
/**
 * Assigns a semantic tag — semantic alias for upsertTagWithConflictCheck.
 *
 * Provides the assignSemanticTag entry point requested by the VS8
 * architecture spec. Currently delegates all validation and indexing
 * to upsertTagWithConflictCheck; exists as a distinct API name for
 * clarity in consumer code and future extensibility.
 */
export async function assignSemanticTag(
  node: TaxonomyNode,
  temporalAssignment: TemporalTagAssignment | null,
  existingNodes: readonly TaxonomyNode[],
  existingAssignments: readonly TemporalTagAssignment[]
): Promise<CommandResult>
````

## File: src/features/semantic-graph.slice/_aggregate.test.ts
````typescript
/**
 * @test VS8 Semantic Graph — Aggregate: temporal conflict + taxonomy validation
 *
 * Validates pure business logic in _aggregate.ts:
 *   1. detectTemporalConflicts — scheduling-aware overlap detection
 *   2. checkTemporalConflict — convenience wrapper
 *   3. validateTaxonomyAssignment — node validation against tree
 *   4. validateTaxonomyPath — slug path validation against TaxonomyTree
 *
 * Architecture:
 *   [D8]  All tag logic resides in semantic-graph.slice, not shared-kernel.
 *   [D21] Tag categories governed by VS8.
 */
import { describe, it, expect } from 'vitest';
⋮----
import type { TaxonomyNode } from '@/features/shared-kernel/semantic-primitives';
⋮----
import {
  detectTemporalConflicts,
  checkTemporalConflict,
  validateTaxonomyAssignment,
  validateTaxonomyPath,
} from './_aggregate';
import type {
  TemporalTagAssignment,
  TaxonomyTree,
} from './_types';
⋮----
// ─── Helpers ──────────────────────────────────────────────────────────────────
⋮----
function makeAssignment(
  overrides: Partial<TemporalTagAssignment> = {}
): TemporalTagAssignment
⋮----
function makeNode(overrides: Partial<TaxonomyNode> =
⋮----
// ═══════════════════════════════════════════════════════════════════
// detectTemporalConflicts
// ═══════════════════════════════════════════════════════════════════
⋮----
// ═══════════════════════════════════════════════════════════════════
// checkTemporalConflict (convenience wrapper)
// ═══════════════════════════════════════════════════════════════════
⋮----
// ═══════════════════════════════════════════════════════════════════
// validateTaxonomyAssignment
// ═══════════════════════════════════════════════════════════════════
⋮----
// ═══════════════════════════════════════════════════════════════════
// validateTaxonomyPath
// ═══════════════════════════════════════════════════════════════════
````

## File: src/features/semantic-graph.slice/_aggregate.ts
````typescript
/**
 * semantic-graph.slice — _aggregate.ts
 *
 * VS8 Semantic Graph Aggregate:
 *   - Temporal Conflict Detection (scheduling-aware tag overlap)
 *   - Taxonomy Validation (hierarchical tag classification)
 *
 * Per logic-overview.md (VS8):
 *   ⑥ Everything as a Tag — conflict detection ensures tag assignments
 *      do not violate temporal or taxonomic constraints.
 *
 * Invariants:
 *   [D3]  Side-effects only in _actions.ts; this file is pure logic.
 *   [D8]  Tag logic lives HERE, not in shared-kernel.
 *   [D21] Tag categories governed by VS8.
 *
 * Dependency rule: ZERO infrastructure imports. Pure functions only.
 */
⋮----
import { TAXONOMY_DIMENSIONS } from '@/features/shared-kernel';
import type { TaxonomyDimension, TaxonomyNode } from '@/features/shared-kernel';
⋮----
import type {
  TemporalTagAssignment,
  TemporalConflict,
  TemporalConflictCheckInput,
  TemporalConflictCheckResult,
  TaxonomyTree,
  TaxonomyValidationResult,
  TaxonomyValidationError,
  TaxonomyErrorCode,
} from './_types';
⋮----
// =================================================================
// Temporal Conflict Detection
// =================================================================
⋮----
/**
 * Detects temporal (time-window) conflicts for a candidate tag assignment
 * against a set of existing assignments.
 *
 * Two assignments conflict when:
 *   1. Same entityId AND same tagSlug
 *   2. Time windows overlap (start < other.end AND end > other.start)
 *
 * Designed for scheduling use-cases where a member or workspace
 * cannot be double-booked for the same skill tag in overlapping periods.
 */
export function detectTemporalConflicts(
  input: TemporalConflictCheckInput
): TemporalConflictCheckResult
⋮----
function isOverlapping(a: TemporalTagAssignment, b: TemporalTagAssignment): boolean
⋮----
// =================================================================
// Taxonomy Validation
// =================================================================
⋮----
/**
 * Validates a proposed taxonomy node against the existing taxonomy tree.
 *
 * Checks:
 *   - Dimension is known
 *   - Parent exists (if specified)
 *   - No circular reference
 *   - No duplicate slugs
 *   - Depth does not exceed maximum
 */
export function validateTaxonomyAssignment(
  node: TaxonomyNode,
  existingNodes: readonly TaxonomyNode[],
  validDimensions: readonly TaxonomyDimension[] = TAXONOMY_DIMENSIONS
): TaxonomyValidationResult
⋮----
function hasCircularReference(
  nodeSlug: string,
  parentSlug: string,
  existingNodes: readonly TaxonomyNode[]
): boolean
⋮----
// =================================================================
// Convenience Wrappers (requested API surface)
// =================================================================
⋮----
/**
 * Simplified API for checking a single new assignment against
 * a set of existing assignments.
 *
 * Delegates to detectTemporalConflicts internally.
 */
export function checkTemporalConflict(
  newAssignment: TemporalTagAssignment,
  existingAssignments: readonly TemporalTagAssignment[]
): TemporalConflictCheckResult
⋮----
/**
 * Validates a taxonomy path (sequence of slugs from root to leaf)
 * against a TaxonomyTree, ensuring every segment exists, the chain is
 * unbroken (each node's parentSlug equals the previous), and the path
 * does not exceed maximum depth.
 */
export function validateTaxonomyPath(
  path: readonly string[],
  tree: TaxonomyTree
): TaxonomyValidationResult
⋮----
function buildNodeMap(tree: TaxonomyTree): Map<string, TaxonomyNode>
⋮----
// ─── Internal helpers ─────────────────────────────────────────────────────────
⋮----
function makeError(
  code: TaxonomyErrorCode,
  tagSlug: string,
  message: string,
  dimension?: TaxonomyDimension
): TaxonomyValidationError
````

## File: src/features/semantic-graph.slice/_services.test.ts
````typescript
/**
 * @test VS8 Semantic Graph — Services: in-memory semantic index
 *
 * Validates _services.ts operations:
 *   1. indexEntity — adds entries to the semantic index
 *   2. removeFromIndex — removes entries by ID
 *   3. querySemanticIndex — full-text + tag + domain filtering
 *   4. getIndexStats — returns accurate statistics
 *
 * Architecture:
 *   [D8]  Index logic in _services.ts, not shared-kernel.
 *   [D24] No direct firebase imports — in-memory only.
 */
import { describe, it, expect, beforeEach } from 'vitest';
⋮----
import { indexEntity, removeFromIndex, querySemanticIndex, getIndexStats } from './_services';
import type { SemanticIndexEntry } from './_types';
⋮----
// ─── Helpers ──────────────────────────────────────────────────────────────────
⋮----
function makeEntry(overrides: Partial<SemanticIndexEntry> =
⋮----
// ═══════════════════════════════════════════════════════════════════
// Index operations
// ═══════════════════════════════════════════════════════════════════
⋮----
// ═══════════════════════════════════════════════════════════════════
// Query filtering
// ═══════════════════════════════════════════════════════════════════
⋮----
// ═══════════════════════════════════════════════════════════════════
// Index Stats
// ═══════════════════════════════════════════════════════════════════
````

## File: src/features/semantic-graph.slice/_services.ts
````typescript
/**
 * semantic-graph.slice — _services.ts
 *
 * VS8 Semantic Index Service:
 *   In-memory semantic index for cross-domain entity search.
 *   Consumed by global-search.slice (VS9) via the public API.
 *
 * Per logic-overview.md (VS8):
 *   SemanticGraph maintains the searchable semantic index.
 *   global-search.slice queries this index for cross-domain results.
 *
 * Architecture:
 *   [D3]  Write operations (index/remove) are service calls, not direct DB ops.
 *   [D8]  Index logic lives HERE, not in shared-kernel.
 *   [D26] semantic-graph.slice owns its services; does not parasitize shared-kernel.
 *
 * Dependency rule: Pure in-memory index. No infrastructure imports.
 */
⋮----
import type { SearchDomain, SemanticSearchHit } from '@/features/shared-kernel';
import { SEARCH_DOMAINS } from '@/features/shared-kernel';
⋮----
import type { SemanticIndexEntry, SemanticIndexStats } from './_types';
⋮----
// ─── In-memory index store ────────────────────────────────────────────────────
⋮----
// =================================================================
// Index Mutations
// =================================================================
⋮----
/**
 * Add or update an entity in the semantic index.
 * Called by projection handlers when domain entities change.
 */
export function indexEntity(entry: SemanticIndexEntry): void
⋮----
/**
 * Remove an entity from the semantic index.
 */
export function removeFromIndex(domain: string, id: string): void
⋮----
// =================================================================
// Index Queries
// =================================================================
⋮----
/**
 * Query the semantic index with a text query and optional domain/tag filters.
 *
 * Search strategy:
 *   1. Text match: query terms matched against searchableText + title + subtitle
 *   2. Tag intersection: if tagFilters provided, results must include ALL specified tags
 *   3. Domain filter: if domains provided, results restricted to those domains
 *
 * Returns hits sorted by relevance score (descending).
 */
export function querySemanticIndex(
  query: string,
  options?: {
    domains?: readonly string[];
    tagFilters?: readonly string[];
    limit?: number;
  }
): SemanticSearchHit[]
⋮----
/**
 * Returns current semantic index statistics.
 */
export function getIndexStats(): SemanticIndexStats
⋮----
// ─── Internal helpers ─────────────────────────────────────────────────────────
⋮----
function isValidSearchDomain(domain: string): domain is SearchDomain
⋮----
function computeRelevanceScore(entry: SemanticIndexEntry, terms: string[]): number
````

## File: src/features/semantic-graph.slice/_types.ts
````typescript
/**
 * semantic-graph.slice — _types.ts
 *
 * VS8 Semantic Graph Domain Types.
 * The Brain — manages tag taxonomy, temporal conflict detection,
 * and semantic indexing for cross-domain queries.
 *
 * Per logic-overview.md (VS8):
 *   SemanticGraph = 語義圖譜引擎 / The Brain
 *   ⑥ Everything as a Tag: all domain concepts modelled as semantic tags,
 *      governed by VS8.
 *
 * Invariants:
 *   [D21] New tag categories only defined in VS8.
 *   [D3]  Side-effects only in _actions.ts.
 *   [D8]  Tag logic must NOT reside in shared-kernel — only contracts there.
 *
 * Dependency rule: ZERO infrastructure imports.
 */
⋮----
import type {
  TaxonomyDimension,
  TaxonomyNode,
  SemanticSearchHit,
} from '@/features/shared-kernel';
⋮----
// ─── Temporal Conflict (Scheduling-aware) ─────────────────────────────────────
⋮----
/**
 * Represents a time-bound tag assignment — used for detecting scheduling
 * conflicts where the same tag (e.g., a member skill) is assigned to
 * overlapping time windows.
 */
export interface TemporalTagAssignment {
  readonly tagSlug: string;
  readonly entityId: string;
  readonly entityType: 'member' | 'workspace' | 'schedule';
  readonly startDate: string;
  readonly endDate: string;
  /** Optional location scope for location-aware conflict detection. */
  readonly locationId?: string;
}
⋮----
/** Optional location scope for location-aware conflict detection. */
⋮----
/**
 * Result of temporal conflict detection.
 * A conflict occurs when the same entity has overlapping tag assignments
 * within the same time window.
 */
export interface TemporalConflict {
  readonly tagSlug: string;
  readonly entityId: string;
  readonly existingAssignment: TemporalTagAssignment;
  readonly conflictingAssignment: TemporalTagAssignment;
  readonly overlapStartDate: string;
  readonly overlapEndDate: string;
}
⋮----
/**
 * Input for the temporal conflict detection algorithm.
 */
export interface TemporalConflictCheckInput {
  readonly candidate: TemporalTagAssignment;
  readonly existingAssignments: readonly TemporalTagAssignment[];
}
⋮----
/**
 * Output of temporal conflict detection.
 */
export interface TemporalConflictCheckResult {
  readonly hasConflict: boolean;
  readonly conflicts: readonly TemporalConflict[];
}
⋮----
// ─── Taxonomy Validation ──────────────────────────────────────────────────────
⋮----
/**
 * Taxonomy tree structure — hierarchical view of all tags in a dimension.
 */
export interface TaxonomyTree {
  readonly dimension: TaxonomyDimension;
  readonly roots: readonly TaxonomyNode[];
  /** Flat list of ALL nodes in the tree (roots + descendants). */
  readonly nodes?: readonly TaxonomyNode[];
  readonly nodeCount: number;
}
⋮----
/** Flat list of ALL nodes in the tree (roots + descendants). */
⋮----
/**
 * Taxonomy validation result for a proposed tag assignment.
 */
export interface TaxonomyValidationResult {
  readonly valid: boolean;
  readonly errors: readonly TaxonomyValidationError[];
}
⋮----
/**
 * Taxonomy validation error.
 */
export interface TaxonomyValidationError {
  readonly code: TaxonomyErrorCode;
  readonly message: string;
  readonly tagSlug: string;
  readonly dimension?: TaxonomyDimension;
}
⋮----
export type TaxonomyErrorCode =
  | 'UNKNOWN_DIMENSION'
  | 'INVALID_PARENT'
  | 'CIRCULAR_REFERENCE'
  | 'DUPLICATE_SLUG'
  | 'DEPTH_EXCEEDED'
  | 'DEPRECATED_TAG';
⋮----
// ─── Semantic Index ───────────────────────────────────────────────────────────
⋮----
/**
 * An entry in the VS8 semantic index — the in-memory searchable representation
 * of a domain entity. Consumed by global-search.slice for cross-domain queries.
 */
export interface SemanticIndexEntry {
  readonly id: string;
  readonly domain: string;
  readonly title: string;
  readonly subtitle?: string;
  readonly tags: readonly string[];
  /** Indexed text content for full-text search. */
  readonly searchableText: string;
  readonly href?: string;
  readonly updatedAt: string;
}
⋮----
/** Indexed text content for full-text search. */
⋮----
/**
 * Semantic index statistics — used for observability.
 */
export interface SemanticIndexStats {
  readonly totalEntries: number;
  readonly entriesByDomain: Record<string, number>;
  readonly lastUpdatedAt: string;
}
⋮----
// ─── Re-export shared primitives for consumer convenience ─────────────────────
````

## File: src/features/semantic-graph.slice/centralized-tag/_actions.ts
````typescript
/**
 * semantic-graph.slice/centralized-tag — _actions.ts
 *
 * CTA (Centralized Tag Aggregate) Firestore-backed operations.
 *
 * [D3]  All entity mutations go through _actions.ts.
 * [D8]  Firestore calls are prohibited in shared-kernel; they live here instead.
 * [D24] Infra imports (firestore.read/write.adapter) are allowed in feature slices.
 *
 * Per logic-overview.md (VS8 + VS0):
 *   The centralized-tag CONTRACT (types, event bus) lives in shared-kernel.
 *   The centralized-tag IMPLEMENTATION (Firestore reads/writes) lives here.
 *
 * Consumers: import from '@/features/semantic-graph.slice'.
 */
⋮----
import {
  publishTagEvent,
  type CentralizedTagEntry,
  type TagDeleteRule,
} from '@/features/shared-kernel/centralized-tag';
import {
  buildIdempotencyKey,
  type DlqTier,
} from '@/features/shared-kernel/outbox-contract';
import type { TagCategory } from '@/features/shared-kernel/tag-authority';
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
import {
  setDocument,
  updateDocument,
  deleteDocument,
} from '@/shared/infra/firestore/firestore.write.adapter';
⋮----
// ---------------------------------------------------------------------------
// Outbox helper [Q2][S1][R8]
// Writes a pending OutboxDocument to tagOutbox/{id}.
// The OUTBOX_RELAY_WORKER (infra.outbox-relay) picks this up via CDC and
// delivers it to IER BACKGROUND_LANE → VS4_TAG_SUBSCRIBER.
//
// S1: uses buildIdempotencyKey(eventId, aggId, version) from shared.kernel.outbox-contract.
// R8: traceId carried in the envelope if supplied by the calling action.
// ---------------------------------------------------------------------------
⋮----
async function writeTagOutbox(
  eventType: string,
  tagSlug: string,
  payload: unknown,
  traceId?: string
): Promise<void>
⋮----
// NOTE: version=0 because centralized-tag does not maintain an event-sourced version counter.
// The idempotency key is still unique per outbox record because eventId (outboxId) is a UUID.
⋮----
// [S1] dlqTier required by OutboxRecord contract — tag events are idempotent
⋮----
// ---------------------------------------------------------------------------
// CTA Firestore operations [D3]
// ---------------------------------------------------------------------------
⋮----
/**
 * Creates a new tag in the global semantic dictionary.
 * Enforces uniqueness: throws if the tagSlug already exists.
 *
 * Publishes `tag:created`.
 */
export async function createTag(
  tagSlug: string,
  label: string,
  category: TagCategory,
  createdBy: string,
  deleteRule: TagDeleteRule = 'block-if-referenced',
  traceId?: string
): Promise<void>
⋮----
publishTagEvent('tag:created', createdPayload); // D8: sync fire-and-forget, no await
⋮----
/**
 * Updates the label or category of an existing tag.
 * tagSlug is immutable once created (it is the stable cross-BC reference key).
 *
 * Publishes `tag:updated`.
 */
export async function updateTag(
  tagSlug: string,
  updates: { label?: string; category?: TagCategory },
  updatedBy: string,
  traceId?: string
): Promise<void>
⋮----
publishTagEvent('tag:updated', updatedPayload); // D8: sync fire-and-forget, no await
⋮----
/**
 * Marks a tag as deprecated.
 * Deprecated tags remain valid references but consumers should migrate to replacedByTagSlug.
 *
 * Publishes `tag:deprecated`.
 */
export async function deprecateTag(
  tagSlug: string,
  deprecatedBy: string,
  replacedByTagSlug?: string,
  traceId?: string
): Promise<void>
⋮----
if (existing.deprecatedAt) return; // idempotent
⋮----
publishTagEvent('tag:deprecated', deprecatedPayload); // D8: sync fire-and-forget, no await
⋮----
/**
 * Deletes a tag from the global dictionary.
 *
 * Deletion rule: if `deleteRule === 'block-if-referenced'` the caller must
 * ensure all consumers have released their references before calling this.
 * This aggregate does NOT track cross-BC reference counts (that would violate #1).
 * The invariant is enforced by convention and governance process.
 *
 * Publishes `tag:deleted`.
 */
export async function deleteTag(
  tagSlug: string,
  deletedBy: string,
  traceId?: string
): Promise<void>
⋮----
if (!existing) return; // idempotent
⋮----
publishTagEvent('tag:deleted', deletedPayload); // D8: sync fire-and-forget, no await
⋮----
/**
 * Reads a single tag entry from the global dictionary.
 */
export async function getTag(tagSlug: string): Promise<CentralizedTagEntry | null>
````

## File: src/features/semantic-graph.slice/index.ts
````typescript
/**
 * semantic-graph.slice — Public API
 *
 * VS8 Semantic Graph: The Brain — manages tag taxonomy, temporal conflict
 * detection for scheduling, and semantic indexing for cross-domain queries.
 *
 * Per logic-overview.md (VS8):
 *   ⑥ Everything as a Tag: all domain concepts modelled as semantic tags,
 *      governed by VS8 (Semantic Graph).
 *
 * Sub-modules:
 *   _types      — Domain types (temporal conflict, taxonomy, semantic index)
 *   _aggregate  — Temporal conflict detection + taxonomy validation
 *   _services   — Semantic index management (to be implemented)
 *
 * Architecture rules:
 *   [D3]  All entity changes via _actions.ts only.
 *   [D8]  Tag logic resides HERE, not in shared-kernel (shared-kernel holds contracts only).
 *   [D19] Core contracts defined in shared-kernel/semantic-primitives.
 *   [D21] New tag categories only defined via VS8.
 *   [D26] semantic-graph.slice owns _actions.ts / _services.ts; does not parasitize shared-kernel.
 *
 * External consumers import from '@/features/semantic-graph.slice'.
 */
⋮----
// =================================================================
// Domain Types
// =================================================================
⋮----
// Re-export shared primitives for consumers who import from this slice
⋮----
// =================================================================
// Aggregate — Temporal Conflict Detection + Taxonomy Validation
// =================================================================
⋮----
// =================================================================
// Server Actions (all tag mutations go through here) [D3]
// =================================================================
⋮----
// =================================================================
// Services — Semantic Index (query interface for global-search)
// =================================================================
⋮----
// =================================================================
// CTA Operations — Centralized Tag Aggregate [D3][D8]
// Firestore-backed CRUD for tagDictionary; D8-compliant (not in shared-kernel).
// =================================================================
````

## File: src/features/shared-kernel/authority-snapshot/index.ts
````typescript
/**
 * shared.kernel/authority-snapshot — SK_AUTH_SNAP
 *
 * VS0 Shared Kernel: Authority snapshot contract.
 *
 * Per logic-overview.md:
 *   SK_AUTH_SNAP["authority-snapshot\nclaims / roles / scopes\nTTL = Token 有效期"]
 *
 * The AuthoritySnapshot is a point-in-time capture of an account's effective
 * roles and permissions. Its TTL equals the Firebase Token validity period.
 *
 * Implemented by:
 *   — projection.workspace-scope-guard  [#A9] critical path; STRONG_READ
 *   — projection.account-view           [#8]  general authority snapshot
 *
 * Consumers MUST use SK_READ_CONSISTENCY [S3] to choose between the live
 * Aggregate (STRONG_READ) and the Projection snapshot (EVENTUAL_READ).
 *
 * Dependency rule: ZERO infrastructure imports (no Firebase, no React, no I/O).
 */
⋮----
// ─── Core contract ────────────────────────────────────────────────────────────
⋮----
/**
 * Point-in-time authority snapshot for a subject (account).
 *
 * Lifetime: equal to the Firebase Token validity period (TTL).
 * After expiry consumers must force a token refresh [S6].
 */
export interface AuthoritySnapshot {
  /** Subject identifier (accountId / userId) this snapshot describes. */
  readonly subjectId: string;
  /** Roles currently held by this subject in the active context. */
  readonly roles: readonly string[];
  /** Scoped permissions derived from roles at snapshot time. */
  readonly permissions: readonly string[];
  /** ISO 8601 timestamp when this snapshot was last computed. */
  readonly snapshotAt: string;
  /** Read-model version from which this snapshot was built. [S2] */
  readonly readModelVersion: number;
}
⋮----
/** Subject identifier (accountId / userId) this snapshot describes. */
⋮----
/** Roles currently held by this subject in the active context. */
⋮----
/** Scoped permissions derived from roles at snapshot time. */
⋮----
/** ISO 8601 timestamp when this snapshot was last computed. */
⋮----
/** Read-model version from which this snapshot was built. [S2] */
⋮----
// ─── Conformance marker ───────────────────────────────────────────────────────
⋮----
/**
 * Marker interface — Projection implementations that expose an AuthoritySnapshot
 * must declare conformance to this contract. [#8]
 */
export interface ImplementsAuthoritySnapshotContract {
  readonly implementsAuthoritySnapshot: true;
}
````

## File: src/features/shared-kernel/centralized-tag/_aggregate.ts
````typescript
/**
 * centralized-tag — _aggregate.ts
 *
 * CENTRALIZED_TAG_AGGREGATE: pure domain types for the global semantic dictionary.
 *
 * Per logic-overview.md (VS0 Tag Authority Center):
 *   CTA["centralized-tag.aggregate\n【語義字典主數據】\ntagSlug / label / category\ndeprecatedAt / deleteRule\n唯一性 & 刪除規則管理"]
 *
 * [D8] This file is intentionally pure — no async functions, no Firestore calls, no side effects.
 *      All write operations (createTag, updateTag, deprecateTag, deleteTag, getTag) live in
 *      semantic-graph.slice/centralized-tag/_actions.ts per D3+D8.
 *
 * Invariants:
 *   #17 — This aggregate is the sole authority for tagSlug uniqueness and deletion rules.
 *   T1  — Consumers must subscribe to TagLifecycleEvent; they must not maintain their own tag data.
 *   A6  — Tag deletion enforced here; consumers hold read-only references.
 *
 * Stored at: tagDictionary/{tagSlug}
 */
⋮----
import type { TagCategory } from '../tag-authority';
⋮----
// ---------------------------------------------------------------------------
// Types [D8: pure types only — no infra imports, no async]
// ---------------------------------------------------------------------------
⋮----
export type TagDeleteRule = 'allow' | 'block-if-referenced';
⋮----
export interface CentralizedTagEntry {
  tagSlug: string;
  label: string;
  category: TagCategory;
  /** ISO timestamp when the tag was deprecated; absent if not deprecated. */
  deprecatedAt?: string;
  /** Optional replacement tag for consumers holding this slug. */
  replacedByTagSlug?: string;
  deleteRule: TagDeleteRule;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
⋮----
/** ISO timestamp when the tag was deprecated; absent if not deprecated. */
⋮----
/** Optional replacement tag for consumers holding this slug. */
````

## File: src/features/shared-kernel/centralized-tag/_bus.ts
````typescript
/**
 * centralized-tag — _bus.ts
 *
 * In-process tag lifecycle event bus.
 * Mirrors the organization event bus pattern.
 *
 * Per logic-overview.md (VS0):
 *   CTA -->|"標籤異動廣播"| TAG_EVENTS --> IER
 *   TAG_EVENTS -.->|"契約遵循"| SK_ENV
 */
⋮----
import type { ImplementsEventEnvelopeContract } from '../event-envelope';
⋮----
import type { TagLifecycleEventPayloadMap, TagLifecycleEventKey } from './_events';
⋮----
type TagEventHandler<K extends TagLifecycleEventKey> = (
  payload: TagLifecycleEventPayloadMap[K]
) => void | Promise<void>;
⋮----
type TagEventHandlerMap = {
  [K in TagLifecycleEventKey]?: Array<TagEventHandler<K>>;
};
⋮----
/** Marker: this module implements the shared-kernel.event-envelope contract (Invariant #8). */
⋮----
/**
 * Subscribe to a tag lifecycle event.
 * Returns an unsubscribe function.
 */
export function onTagEvent<K extends TagLifecycleEventKey>(
  eventKey: K,
  handler: TagEventHandler<K>
): () => void
⋮----
/**
 * Publish a tag lifecycle event to all subscribers.
 *
 * [D8] sync fire-and-forget — shared-kernel must not have async functions.
 * Handlers may themselves be async; their errors are swallowed to avoid
 * disrupting the caller.  Callers that need completion guarantees should
 * use the durable outbox pattern (tagOutbox) instead.
 */
export function publishTagEvent<K extends TagLifecycleEventKey>(
  eventKey: K,
  payload: TagLifecycleEventPayloadMap[K]
): void
````

## File: src/features/shared-kernel/centralized-tag/_events.ts
````typescript
/**
 * centralized-tag — _events.ts
 *
 * TagLifecycleEvent payload types — re-exported from the canonical tag-authority contract.
 *
 * Per logic-overview.md (VS0 Tag Authority Center):
 *   CTA -->|"標籤異動廣播"| TAG_EVENTS
 *   TAG_EVENTS["TagLifecycleEvent\nTagCreated · TagUpdated\nTagDeprecated · TagDeleted\n→ Integration Event Router"]
 *
 * Architecture: tag-authority owns the CONTRACT (payload interfaces).
 *   centralized-tag owns the IMPLEMENTATION (aggregate + event bus).
 *   All consumers subscribe via onTagEvent; payload types flow from the single source of truth.
 *
 * Invariant #17: CENTRALIZED_TAG_AGGREGATE manages tagSlug uniqueness and deletion rules;
 *   all consumers hold read-only tagSlug references.
 * Invariant T1: New slices needing tag semantics subscribe to TagLifecycleEvent only;
 *   they must not maintain their own tag master data.
 */
⋮----
// Re-export canonical payload types from the tag-authority contract layer.
// This ensures onTagEvent() callbacks and consumer handlers share a single type definition.
````

## File: src/features/shared-kernel/centralized-tag/index.ts
````typescript
/**
 * shared-kernel/centralized-tag — Public API
 *
 * CENTRALIZED_TAG_AGGREGATE: pure domain types + in-process event bus.
 *
 * [D8] This module is intentionally side-effect-free.  All Firestore-backed
 *      write operations (createTag / updateTag / deprecateTag / deleteTag / getTag)
 *      live in semantic-graph.slice/centralized-tag/_actions.ts per D3 + D8.
 *
 * Per logic-overview.md (VS0 · L1 Shared Kernel · SK_TAG):
 *   CTA["centralized-tag.aggregate\n【全域語義字典・唯一真相】\ntagSlug / label / category\ndeprecatedAt / deleteRule"]
 *
 * Invariants:
 *   #17 — This aggregate is the sole authority for tagSlug uniqueness and deletion rules.
 *   T1  — Consumers must subscribe to TagLifecycleEvent; they must not maintain their own tag data.
 *   A6  — Tag deletion enforced here; consumers hold read-only references.
 */
⋮----
// Domain types [D8: pure types only]
⋮----
// Event bus (publish / subscribe) [D8: publishTagEvent is sync fire-and-forget]
````

## File: src/features/shared-kernel/command-result-contract/index.ts
````typescript
/**
 * shared.kernel/command-result-contract — SK_CMD_RESULT [R4]
 *
 * VS0 Shared Kernel: Canonical command result shape.
 *
 * Per logic-overview.md [R4] COMMAND_RESULT_CONTRACT:
 *   Every Server Action (_actions.ts) MUST return CommandResult.
 *   CommandSuccess → { aggregateId, version }     (frontend optimistic-update basis)
 *   CommandFailure → DomainError { code, message } (structured error; never raw Error)
 *
 * Consumers:
 *   — All _actions.ts exports across every slice
 *   — infra.gateway-command (CBG_ROUTE response) [R4]
 *   — Frontend components performing optimistic updates
 *
 * Invariant [D4]: New slices MUST adopt CommandResult for all command outputs.
 * Dependency rule: ZERO infrastructure imports (no Firebase, no React, no I/O).
 */
⋮----
// ─── Structured error ─────────────────────────────────────────────────────────
⋮----
/**
 * Structured domain error returned in CommandFailure.
 *
 * Consumers MUST NOT catch raw `Error` objects for command results.
 * Always use DomainError for cross-BC structured error handling.
 */
export interface DomainError {
  /** Machine-readable error code, e.g. "SKILL_TIER_INSUFFICIENT". */
  readonly code: string;
  /** Human-readable description. */
  readonly message: string;
  /** Optional diagnostic context (aggregate IDs, field values, etc.) for observability. */
  readonly context?: Record<string, unknown>;
}
⋮----
/** Machine-readable error code, e.g. "SKILL_TIER_INSUFFICIENT". */
⋮----
/** Human-readable description. */
⋮----
/** Optional diagnostic context (aggregate IDs, field values, etc.) for observability. */
⋮----
// ─── Result shapes ────────────────────────────────────────────────────────────
⋮----
/**
 * Successful command result. [R4]
 *
 * Frontend uses { aggregateId, version } as the optimistic-update basis:
 * poll / subscribe to the Projection until the expected version appears.
 */
export interface CommandSuccess {
  readonly success: true;
  /** ID of the aggregate mutated by this command. */
  readonly aggregateId: string;
  /** Aggregate version AFTER the command was applied. */
  readonly version: number;
}
⋮----
/** ID of the aggregate mutated by this command. */
⋮----
/** Aggregate version AFTER the command was applied. */
⋮----
/**
 * Failed command result. [R4]
 *
 * Always carries a structured DomainError — no raw string messages.
 */
export interface CommandFailure {
  readonly success: false;
  readonly error: DomainError;
}
⋮----
/** Union returned by every Command Handler / _actions.ts export. */
export type CommandResult = CommandSuccess | CommandFailure;
⋮----
// ─── Factory helpers ──────────────────────────────────────────────────────────
⋮----
/** Creates a CommandSuccess result. */
export function commandSuccess(aggregateId: string, version: number): CommandSuccess
⋮----
/** Creates a CommandFailure from a DomainError. */
export function commandFailure(error: DomainError): CommandFailure
⋮----
/** Creates a CommandFailure from a plain code + message pair. */
export function commandFailureFrom(
  code: string,
  message: string,
  context?: Record<string, unknown>,
): CommandFailure
````

## File: src/features/shared-kernel/constants/index.ts
````typescript
/**
 * shared.kernel/constants — Cross-BC shared enumerations and error codes
 *
 * VS0 Shared Kernel: Canonical status enums and error codes shared across all BCs.
 *
 * Per logic-overview.md [R6] WORKFLOW_STATE_CONTRACT:
 *   WorkflowStatus defines the legal state transitions for workspace business workflows.
 *   Legal transitions only: Draft → InProgress → QA → Acceptance → Finance → Completed
 *
 * Per logic-overview.md [R4]:
 *   ErrorCodes are the canonical machine-readable codes used in CommandFailure.DomainError.
 *
 * Rule: Any BC may reference these constants; no BC may re-declare them locally.
 * Dependency rule: ZERO infrastructure imports (no Firebase, no React, no I/O).
 */
⋮----
// ─── Workflow status ──────────────────────────────────────────────────────────
⋮----
/**
 * Canonical workspace business workflow lifecycle statuses. [R6]
 *
 * Legal state transitions (closed set — additions require updating logic-overview.md):
 *   draft → in_review → approved → in_progress → completed
 *                     ↘ rejected
 *   any → cancelled
 */
⋮----
export type WorkflowStatus = (typeof WorkflowStatusValues)[number];
⋮----
// ─── Domain error codes ───────────────────────────────────────────────────────
⋮----
/**
 * Canonical domain error codes for CommandFailure.DomainError.code. [R4]
 *
 * Slices may define slice-local error codes alongside these shared ones,
 * but cross-BC errors MUST use these canonical codes.
 */
⋮----
export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
````

## File: src/features/shared-kernel/event-envelope/index.ts
````typescript
/**
 * shared.kernel/event-envelope — SK_ENV
 *
 * VS0 Shared Kernel: Universal domain event envelope contract.
 *
 * Per logic-overview.md [R8][R7]:
 *   ① traceId is injected ONCE at CBG_ENTRY (unified-command-gateway) and
 *      MUST NOT be overwritten by any downstream node (IER, FUNNEL, FCM).
 *   ② Every domain event on every in-process bus MUST satisfy EventEnvelope<T>.
 *   ③ idempotencyKey = eventId + aggregateId + version prevents duplicate writes [Q3][D8].
 *
 * Dependency rule: ZERO infrastructure imports (no Firebase, no React, no I/O).
 */
⋮----
// ─── Core envelope ───────────────────────────────────────────────────────────
⋮----
/**
 * Universal event envelope that every domain event published on any bus must satisfy.
 *
 * [R8]  traceId carries the original Command trace from CBG_ENTRY end-to-end.
 *        Downstream consumers READ it — they MUST NOT overwrite or regenerate it.
 * [R7]  version is the aggregate version when the event was produced;
 *        used for SK_VERSION_GUARD monotonic checks.
 * [Q3]  idempotencyKey = eventId + aggregateId + version; FUNNEL upserts by this key.
 * [D8]  DLQ replay MUST preserve the original idempotencyKey.
 */
export interface EventEnvelope<TPayload = unknown> {
  /** Globally unique event identifier (UUID). */
  readonly eventId: string;
  /** Namespaced event type, e.g. "workspace:tasks:assigned". */
  readonly eventType: string;
  /** ISO 8601 timestamp when the event occurred. */
  readonly occurredAt: string;
  /** ID of the aggregate or entity that produced the event. */
  readonly sourceId: string;
  /** Event-specific payload — typed per event bus contract. */
  readonly payload: TPayload;
  /**
   * Aggregate version at event production time. [R7][Q3]
   * Used by SK_VERSION_GUARD and for constructing idempotencyKey.
   */
  readonly version?: number;
  /**
   * Original Command TraceID. [R8]
   * Injected once at CBG_ENTRY. All downstream nodes MUST propagate unchanged.
   */
  readonly traceId?: string;
  /**
   * Idempotency key = eventId + aggregateId + version. [Q3][D8]
   * FUNNEL upserts by this key. DLQ replay MUST NOT regenerate it.
   */
  readonly idempotencyKey?: string;
  /**
   * ID of the command or event that directly caused this event. [SK_ENV]
   * Enables precise causal tracing across the event chain.
   * Set by the producing Aggregate or TX Runner; MUST NOT be overwritten downstream.
   */
  readonly causationId?: string;
  /**
   * Saga or replay correlation identifier. [SK_ENV]
   * All events belonging to the same saga/compensating-flow share this ID.
   * Injected at saga entry; propagated unchanged through the chain.
   */
  readonly correlationId?: string;
}
⋮----
/** Globally unique event identifier (UUID). */
⋮----
/** Namespaced event type, e.g. "workspace:tasks:assigned". */
⋮----
/** ISO 8601 timestamp when the event occurred. */
⋮----
/** ID of the aggregate or entity that produced the event. */
⋮----
/** Event-specific payload — typed per event bus contract. */
⋮----
/**
   * Aggregate version at event production time. [R7][Q3]
   * Used by SK_VERSION_GUARD and for constructing idempotencyKey.
   */
⋮----
/**
   * Original Command TraceID. [R8]
   * Injected once at CBG_ENTRY. All downstream nodes MUST propagate unchanged.
   */
⋮----
/**
   * Idempotency key = eventId + aggregateId + version. [Q3][D8]
   * FUNNEL upserts by this key. DLQ replay MUST NOT regenerate it.
   */
⋮----
/**
   * ID of the command or event that directly caused this event. [SK_ENV]
   * Enables precise causal tracing across the event chain.
   * Set by the producing Aggregate or TX Runner; MUST NOT be overwritten downstream.
   */
⋮----
/**
   * Saga or replay correlation identifier. [SK_ENV]
   * All events belonging to the same saga/compensating-flow share this ID.
   * Injected at saga entry; propagated unchanged through the chain.
   */
⋮----
// ─── Conformance marker ───────────────────────────────────────────────────────
⋮----
/**
 * Marker interface — event bus implementations declare conformance to SK_ENV. [R8]
 * Ensures every bus type-checks its events against the envelope contract.
 */
export interface ImplementsEventEnvelopeContract {
  readonly implementsEventEnvelope: true;
}
````

## File: src/features/shared-kernel/index.ts
````typescript
/**
 * shared.kernel — VS0 Shared Kernel Public API
 *
 * The global contract centre. Every cross-BC contract is defined here.
 * Feature slices import from '@/features/shared-kernel' — never from the
 * individual sub-directories directly.
 *
 * Sub-module layout:
 *
 * ┌─ 📄 Foundational Data Contracts ───────────────────────────────────────────┐
 * │  event-envelope        SK_ENV      [R8][R7]   Universal event envelope      │
 * │  authority-snapshot    SK_AUTH_SNAP            Permission snapshot contract  │
 * │  skill-tier            SK_SKILL_TIER [#12]    Tier computation + staffing   │
 * │  command-result-contract SK_CMD_RESULT [R4]   Command success/failure union │
 * │  constants                                    WorkflowStatus + ErrorCodes   │
 * ├─ ⚙️ Infrastructure Behaviour Contracts ────────────────────────────────────┤
 * │  outbox-contract       SK_OUTBOX [S1]         At-least-once delivery        │
 * │  version-guard         SK_VERSION_GUARD [S2]  Monotonic projection writes   │
 * │  read-consistency      SK_READ_CONSISTENCY [S3] Strong vs eventual read     │
 * │  staleness-contract    SK_STALENESS [S4]      Global SLA constants          │
 * │  resilience-contract   SK_RESILIENCE [S5]     Entry-point resilience spec   │
 * │  token-refresh-contract SK_TOKEN_REFRESH [S6] Claims refresh handshake     │
 * ├─ 🏷️ Tag Authority Center ───────────────────────────────────────────────────┤
 * │  tag-authority         [#A6][#17][D21]        Tag contract types (RO only)  │
 * ├─ 🔍 Semantic Primitives ────────────────────────────────────────────────────┤
 * │  semantic-primitives   [D19][D21][D26]        Search + notification + taxonomy │
 * ├─ 🔌 Infrastructure Ports ───────────────────────────────────────────────────┤
 * │  infrastructure-ports  SK_PORTS [D24]         Dependency-inversion ports   │
 * │                        Timestamp               D24-compliant Timestamp type │
 * └────────────────────────────────────────────────────────────────────────────┘
 *
 * Dependency rule: zero infrastructure imports in any sub-module.
 * Invariant #8: contracts are explicitly agreed cross-BC; additions require
 *   updating docs/logic-overview.md and this index simultaneously.
 */
⋮----
// ─── 📄 Foundational Data Contracts ──────────────────────────────────────────
⋮----
// SK_ENV [R8][R7]
⋮----
// SK_AUTH_SNAP
⋮----
// SK_SKILL_TIER + SK_SKILL_REQ [#12][A5]
⋮----
// SK_CMD_RESULT [R4]
⋮----
// Cross-BC constants [R6]
⋮----
// ─── ⚙️ Infrastructure Behaviour Contracts ────────────────────────────────────
⋮----
// SK_OUTBOX [S1]
⋮----
// SK_VERSION_GUARD [S2]
⋮----
// SK_READ_CONSISTENCY [S3]
⋮----
// SK_STALENESS [S4]
⋮----
// SK_RESILIENCE [S5]
⋮----
// SK_TOKEN_REFRESH [S6]
⋮----
// ─── 🏷️ Tag Authority Center [#A6][#17][D21] ──────────────────────────────────
⋮----
// ─── 🔍 Semantic Primitives (VS8/VS9/VS7) [D19][D21][D26] ────────────────────
⋮----
// ─── 🔌 Infrastructure Ports [D24] ───────────────────────────────────────────
````

## File: src/features/shared-kernel/infrastructure-ports/index.ts
````typescript
/**
 * shared.kernel/infrastructure-ports — SK_PORTS [D24]
 *
 * VS0 Shared Kernel: Dependency-inversion port interfaces for all infrastructure adapters.
 *
 * Per logic-overview.md [D24]:
 *   Feature slices MUST depend on these Port interfaces, NOT on firebase/* directly.
 *   Each Port is backed by an Adapter in src/shared/infra/:
 *
 *   IAuthService   → auth.adapter.ts      → firebase/auth       (VS1 primary consumer)
 *   IFirestoreRepo → firestore.facade.ts  → firebase/firestore  (VS8 primary; [S2] guard)
 *   IMessaging     → messaging.adapter.ts → firebase/messaging  (VS7 primary; [R8] traceId)
 *   IFileStore     → storage.facade.ts    → firebase/storage    (VS5 primary)
 *
 * [D25] When adding a new Firebase feature:
 *   1. Add a Port interface here.
 *   2. Add an Adapter implementation in src/shared/infra/.
 *   3. Register the Adapter in the composition root.
 *
 * [R8] IMessaging.send() carries traceId from EventEnvelope — do NOT regenerate it.
 * [S2] IFirestoreRepo.setDoc() supports aggregateVersion for SK_VERSION_GUARD.
 *
 * These interfaces are re-exported from @/shared/ports to maintain a single
 * canonical definition while making them accessible via the shared.kernel import path.
 * Dependency flows: shared → features (one-way); shared.kernel acts as the re-export
 * façade so feature slices never need to import from @/shared/ports directly.
 */
⋮----
// Re-export all Port interfaces from the canonical @/shared/ports location.
// The actual interface definitions live in src/shared/ports/ to avoid circular imports
// (shared → features is a one-way dependency; features/shared.kernel re-exports).
````

## File: src/features/shared-kernel/outbox-contract/index.ts
````typescript
/**
 * shared.kernel/outbox-contract — SK_OUTBOX_CONTRACT [S1]
 *
 * VS0 Shared Kernel: OUTBOX at-least-once delivery specification.
 *
 * Per logic-overview.md [S1]:
 *   ① Delivery guarantee: at-least-once
 *        EventBus(in-process) → OUTBOX → RELAY → IER
 *   ② Idempotency key is mandatory on every OUTBOX record
 *        Format: eventId + aggregateId + version
 *   ③ DLQ tier must be declared per OUTBOX type (no defaults)
 *        SAFE_AUTO       — idempotent events; auto-retry permitted
 *        REVIEW_REQUIRED — financial / scheduling / role events; requires human audit
 *        SECURITY_BLOCK  — security events (auth, claims); freeze aggregate + alert
 *
 * Rule: All OUTBOX implementations reference this contract.
 *   Do NOT re-define at-least-once semantics locally in each OUTBOX node.
 *
 * Dependency rule: ZERO infrastructure imports (no Firebase, no React, no I/O).
 */
⋮----
// ─── DLQ tier ─────────────────────────────────────────────────────────────────
⋮----
/**
 * DLQ tier classification for OUTBOX events. [S1][R5]
 *
 * Declared once per OUTBOX type — implementations MUST NOT default or override
 * this classification without an explicit logic-overview.md invariant reference.
 */
export type DlqTier = 'SAFE_AUTO' | 'REVIEW_REQUIRED' | 'SECURITY_BLOCK';
⋮----
// ─── OUTBOX record ────────────────────────────────────────────────────────────
⋮----
/** OUTBOX processing lifecycle statuses. */
export type OutboxStatus = 'pending' | 'relayed' | 'dlq';
⋮----
/**
 * Mandatory shape every OUTBOX record must satisfy. [S1]
 *
 * All three elements are non-negotiable:
 *   outboxId       — unique record identifier
 *   idempotencyKey — prevents duplicate IER delivery; MUST survive DLQ replay
 *   dlqTier        — routing tier declared per event type
 */
export interface OutboxRecord {
  /** Unique OUTBOX record identifier (UUID). */
  readonly outboxId: string;
  /** Idempotency key = eventId + aggId + version. MUST be preserved through replay. */
  readonly idempotencyKey: string;
  /** DLQ tier for this event type — declared once per OUTBOX type. */
  readonly dlqTier: DlqTier;
  /** Serialized EventEnvelope payload (JSON string). */
  readonly payload: string;
  /** ISO 8601 creation timestamp. */
  readonly createdAt: string;
  /** Processing status. */
  readonly status: OutboxStatus;
}
⋮----
/** Unique OUTBOX record identifier (UUID). */
⋮----
/** Idempotency key = eventId + aggId + version. MUST be preserved through replay. */
⋮----
/** DLQ tier for this event type — declared once per OUTBOX type. */
⋮----
/** Serialized EventEnvelope payload (JSON string). */
⋮----
/** ISO 8601 creation timestamp. */
⋮----
/** Processing status. */
⋮----
// ─── Key builder ─────────────────────────────────────────────────────────────
⋮----
/**
 * Builds the canonical idempotency key from the three required components. [S1][Q3]
 *
 * Format: `${eventId}:${aggId}:${version}`
 *
 * Invariant: DLQ replay MUST preserve the key — do NOT regenerate it.
 */
export function buildIdempotencyKey(
  eventId: string,
  aggId: string,
  version: number,
): string
⋮----
// ─── Conformance marker ───────────────────────────────────────────────────────
⋮----
/**
 * Marker interface — OUTBOX implementations declare SK_OUTBOX_CONTRACT conformance. [S1]
 */
export interface ImplementsOutboxContract {
  readonly implementsOutboxContract: true;
}
````

## File: src/features/shared-kernel/read-consistency/index.ts
````typescript
/**
 * shared.kernel/read-consistency — SK_READ_CONSISTENCY [S3]
 *
 * VS0 Shared Kernel: Unified read-pattern decision contract.
 *
 * Per logic-overview.md [S3]:
 *   STRONG_READ  → Domain Aggregate  (source of truth; strong consistency)
 *   EVENTUAL_READ → Projection       (read model; accepts short staleness window)
 *
 * Decision rule:
 *   financial | security | irreversible → STRONG_READ (mandatory)
 *   display   | statistics | listing   → EVENTUAL_READ (preferred)
 *
 * Enforced at:
 *   — account-user.wallet         (all balance reads) [D5]
 *   — infra.gateway-command       (authorization checks)
 *   — scheduling.slice            (conflict detection)
 *
 * Dependency rule: ZERO infrastructure imports (no Firebase, no React, no I/O).
 */
⋮----
// ─── Mode ─────────────────────────────────────────────────────────────────────
⋮----
/**
 * Read consistency mode. [S3]
 *
 * STRONG_READ   — queries the Domain Aggregate directly.
 *                 High latency; guarantees strong consistency.
 *                 Required for any financial, security, or irreversible operation.
 *
 * EVENTUAL_READ — queries the Projection (read model).
 *                 Low latency; accepts staleness within the SK_STALENESS_CONTRACT SLA [S4].
 *                 Suitable for display, statistics, list views.
 */
export type ReadConsistencyMode = 'STRONG_READ' | 'EVENTUAL_READ';
⋮----
// ─── Decision context ─────────────────────────────────────────────────────────
⋮----
/**
 * Inputs to the consistency routing decision. [S3]
 */
export interface ReadConsistencyContext {
  /** True when the operation involves financial data (wallet balance, transactions). */
  readonly isFinancial: boolean;
  /** True when the operation involves security decisions (auth, claims, ACL). */
  readonly isSecurity: boolean;
  /** True when the operation is irreversible (deduction, schedule assignment). */
  readonly isIrreversible: boolean;
}
⋮----
/** True when the operation involves financial data (wallet balance, transactions). */
⋮----
/** True when the operation involves security decisions (auth, claims, ACL). */
⋮----
/** True when the operation is irreversible (deduction, schedule assignment). */
⋮----
// ─── Resolver ─────────────────────────────────────────────────────────────────
⋮----
/**
 * Determine the required read consistency mode for a given operation. [S3]
 *
 * Returns STRONG_READ when ANY safety condition is true;
 * returns EVENTUAL_READ otherwise.
 */
export function resolveReadConsistency(ctx: ReadConsistencyContext): ReadConsistencyMode
⋮----
// ─── Conformance marker ───────────────────────────────────────────────────────
⋮----
/**
 * Marker interface — read-path implementations declare their consistency mode. [S3]
 */
export interface ImplementsReadConsistency {
  readonly readConsistencyMode: ReadConsistencyMode;
}
````

## File: src/features/shared-kernel/resilience-contract/index.ts
````typescript
/**
 * shared.kernel/resilience-contract — SK_RESILIENCE_CONTRACT [S5]
 *
 * VS0 Shared Kernel: Minimum resilience specification for all external entry points.
 *
 * Per logic-overview.md [S5]:
 *   R1 rate-limit:     per user ∪ per org — exceeded → 429 + Retry-After header
 *   R2 circuit-break:  5 consecutive 5xx → open circuit; half-open probe recovery
 *   R3 bulkhead:       slice isolation — a fault MUST NOT propagate across slice boundaries
 *
 * Applies to: _actions.ts / Webhook / Edge Function — any path reaching CBG_ENTRY.
 *
 * Rule: This is a CONTRACT (types + constants), not a runtime implementation.
 *   Each entry-point declares conformance; implementation lives in infra.external-triggers.
 *
 * Dependency rule: ZERO infrastructure imports (no Firebase, no React, no I/O).
 */
⋮----
// ─── Rate limit [R1] ──────────────────────────────────────────────────────────
⋮----
/**
 * Rate limit configuration for a single entry point. [S5 R1]
 *
 * Both per-user and per-org limits must pass; exceeded → HTTP 429.
 */
export interface RateLimitConfig {
  readonly perUserLimit: number;
  readonly perOrgLimit: number;
  /** Time window in milliseconds. */
  readonly windowMs: number;
}
⋮----
/** Time window in milliseconds. */
⋮----
// ─── Circuit breaker [R2] ─────────────────────────────────────────────────────
⋮----
/**
 * Circuit breaker configuration. [S5 R2]
 *
 * `failureThreshold` consecutive 5xx errors open the circuit.
 * After `openDurationMs` the circuit transitions to half-open for probe recovery.
 */
export interface CircuitBreakerConfig {
  readonly failureThreshold: number;
  readonly openDurationMs: number;
}
⋮----
// ─── Bulkhead [R3] ────────────────────────────────────────────────────────────
⋮----
/**
 * Bulkhead configuration. [S5 R3]
 *
 * Slice-level concurrency isolation: a fault or overload in one slice
 * MUST NOT cascade into other slices.
 */
export interface BulkheadConfig {
  readonly sliceId: string;
  readonly maxConcurrency: number;
}
⋮----
// ─── Full declaration ─────────────────────────────────────────────────────────
⋮----
/**
 * Complete resilience contract declaration for an entry point. [S5]
 *
 * Each external trigger path MUST declare a ResilienceContract.
 */
export interface ResilienceContract {
  readonly rateLimit: RateLimitConfig;
  readonly circuitBreaker: CircuitBreakerConfig;
  readonly bulkhead: BulkheadConfig;
}
⋮----
// ─── Recommended defaults ─────────────────────────────────────────────────────
⋮----
/** Default rate limit for standard Server Action entry points. [S5 R1] */
⋮----
/** Default circuit breaker configuration. [S5 R2] */
⋮----
// ─── Conformance marker ───────────────────────────────────────────────────────
⋮----
/**
 * Marker interface — entry-point files declare SK_RESILIENCE_CONTRACT conformance. [S5]
 */
export interface ImplementsResilienceContract {
  readonly implementsResilienceContract: true;
}
````

## File: src/features/shared-kernel/semantic-primitives/index.ts
````typescript
/**
 * shared-kernel/semantic-primitives — SK_SEMANTIC [D19][D21]
 *
 * VS0 Shared Kernel: Core tag taxonomy and semantic search contracts.
 *
 * Per logic-overview.md [D19] TYPE AUTHORITY:
 *   Core tag categories, search query contracts, and notification channel
 *   contracts are defined here — the single source of truth for cross-slice
 *   semantic interfaces.
 *
 * Consumers:
 *   - semantic-graph.slice (VS8): implements taxonomy validation + semantic index
 *   - global-search.slice:       implements cross-domain search via these contracts
 *   - notification-hub.slice:    implements tag-aware routing via these contracts
 *
 * Dependency rule: ZERO infrastructure imports (no Firebase, no React, no I/O).
 */
⋮----
// ─── Semantic Search Contracts ────────────────────────────────────────────────
⋮----
/**
 * Supported entity domains for cross-domain search.
 * Each domain maps to a VS or aggregate that the Global Search authority can query.
 */
⋮----
export type SearchDomain = (typeof SEARCH_DOMAINS)[number];
⋮----
/**
 * Cross-domain search query contract.
 * Global Search (VS9) is the sole consumer of this contract. [D26]
 */
export interface SemanticSearchQuery {
  /** Free-text query string. */
  readonly query: string;
  /** Restrict results to specific domains. Empty = search all. */
  readonly domains: readonly SearchDomain[];
  /** Optional tag-based filter (intersection — AND semantics). */
  readonly tagFilters?: readonly string[];
  /** Maximum results per domain. */
  readonly limit?: number;
  /** Pagination cursor (opaque string from previous result). */
  readonly cursor?: string;
  /** [R8] TraceID propagated from the originating command. */
  readonly traceId?: string;
}
⋮----
/** Free-text query string. */
⋮----
/** Restrict results to specific domains. Empty = search all. */
⋮----
/** Optional tag-based filter (intersection — AND semantics). */
⋮----
/** Maximum results per domain. */
⋮----
/** Pagination cursor (opaque string from previous result). */
⋮----
/** [R8] TraceID propagated from the originating command. */
⋮----
/**
 * A single search hit returned by the semantic index.
 */
export interface SemanticSearchHit {
  readonly id: string;
  readonly domain: SearchDomain;
  readonly title: string;
  readonly subtitle?: string;
  /** Relevance score (0–1). */
  readonly score: number;
  /** Tag slugs associated with this entity. */
  readonly tags: readonly string[];
  /** Navigation path within the application. */
  readonly href?: string;
}
⋮----
/** Relevance score (0–1). */
⋮----
/** Tag slugs associated with this entity. */
⋮----
/** Navigation path within the application. */
⋮----
/**
 * Paginated search result envelope.
 */
export interface SemanticSearchResult {
  readonly hits: readonly SemanticSearchHit[];
  readonly totalCount: number;
  readonly cursor?: string;
  readonly traceId?: string;
}
⋮----
// ─── Notification Channel Contracts ──────────────────────────────────────────
⋮----
/**
 * Delivery channels supported by the Notification Hub.
 */
⋮----
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];
⋮----
/**
 * Severity / urgency classification for notification routing.
 */
⋮----
export type NotificationPriority = (typeof NOTIFICATION_PRIORITIES)[number];
⋮----
// ─── Taxonomy Classification Contracts ───────────────────────────────────────
⋮----
/**
 * Taxonomy dimension for multi-dimensional tag classification.
 * VS8 (Semantic Graph) validates that every tag belongs to exactly one dimension.
 */
⋮----
export type TaxonomyDimension = (typeof TAXONOMY_DIMENSIONS)[number];
⋮----
/**
 * Taxonomy node — hierarchical classification entry managed by VS8.
 * Pure data contract; no infrastructure dependencies.
 */
export interface TaxonomyNode {
  readonly slug: string;
  readonly label: string;
  readonly dimension: TaxonomyDimension;
  readonly parentSlug?: string;
  readonly depth: number;
  readonly metadata?: Record<string, unknown>;
}
````

## File: src/features/shared-kernel/skill-tier/index.ts
````typescript
/**
 * shared.kernel/skill-tier — SK_SKILL_TIER + SK_SKILL_REQ
 *
 * VS0 Shared Kernel: Skill-tier computation contract and cross-BC staffing contract.
 *
 * Per logic-overview.md Invariant #12:
 *   "Tier 永遠是推導值（純函式 getTier(xp)），不得存入任何 DB 欄位"
 *   Tier is ALWAYS derived on-demand — NEVER persisted to any DB field.
 *
 * Per logic-overview.md SK_SKILL_REQ:
 *   skill-requirement = tagSlug × minXp — cross-BC staffing contract
 *   Flows: Workspace BC → Organization BC via WorkspaceScheduleProposed event [A5]
 *
 * Consumers:
 *   — skill-xp.slice         (SkillXpAdded / SkillXpDeducted events)
 *   — projection.org-eligible-member-view  (eligibility computed at query time)
 *   — scheduling.slice       (skill-tier eligibility gate)
 *   — workspace.slice/business.parsing-intent  (skill requirements from documents)
 *
 * Dependency rule: ZERO infrastructure imports (no Firebase, no React, no I/O).
 * [D19] Canonical type definitions live here; @/shared/types/skill.types re-exports for legacy consumers.
 */
⋮----
// ─── Canonical type definitions (D19 — owned by shared-kernel) ───────────────
⋮----
/**
 * Seven-tier proficiency scale.
 * Values are stable identifiers (safe for Firestore storage & AI prompts).
 */
export type SkillTier =
  | 'apprentice'    // Tier 1 — 0–75 XP
  | 'journeyman'    // Tier 2 — 75–150 XP
  | 'expert'        // Tier 3 — 150–225 XP
  | 'artisan'       // Tier 4 — 225–300 XP
  | 'grandmaster'   // Tier 5 — 300–375 XP  (core colour)
  | 'legendary'     // Tier 6 — 375–450 XP
  | 'titan';        // Tier 7 — 450–525 XP
⋮----
| 'apprentice'    // Tier 1 — 0–75 XP
| 'journeyman'    // Tier 2 — 75–150 XP
| 'expert'        // Tier 3 — 150–225 XP
| 'artisan'       // Tier 4 — 225–300 XP
| 'grandmaster'   // Tier 5 — 300–375 XP  (core colour)
| 'legendary'     // Tier 6 — 375–450 XP
| 'titan';        // Tier 7 — 450–525 XP
⋮----
/** Static metadata for a single tier. Used by UI and shared/lib. */
export interface TierDefinition {
  tier: SkillTier;
  /** Ordinal position (1 = lowest). Used for tier comparison without importing runtime functions. */
  rank: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  /** Display name shown in UI badges (e.g. "Apprentice", "Grandmaster"). */
  label: string;
  /** Inclusive lower XP bound for this tier. */
  minXp: number;
  /** Exclusive upper XP bound (last tier uses Number.MAX_SAFE_INTEGER as sentinel). */
  maxXp: number;
  /** Hex colour used for the badge background / ring (e.g. `"#9333ea"`). */
  color: string;
  /** CSS custom property name for theming (e.g. `"--tier-grandmaster"`). */
  cssVar: string;
}
⋮----
/** Ordinal position (1 = lowest). Used for tier comparison without importing runtime functions. */
⋮----
/** Display name shown in UI badges (e.g. "Apprentice", "Grandmaster"). */
⋮----
/** Inclusive lower XP bound for this tier. */
⋮----
/** Exclusive upper XP bound (last tier uses Number.MAX_SAFE_INTEGER as sentinel). */
⋮----
/** Hex colour used for the badge background / ring (e.g. `"#9333ea"`). */
⋮----
/** CSS custom property name for theming (e.g. `"--tier-grandmaster"`). */
⋮----
/**
 * Expresses a staffing need inside a ScheduleItem proposal.
 * Flows from Workspace BC → Organization BC via WORKSPACE_OUTBOX events.
 */
export interface SkillRequirement {
  tagSlug: string;
  tagId?: string;
  minimumTier: SkillTier;
  quantity: number;
}
⋮----
// ─── Canonical tier table ─────────────────────────────────────────────────────
⋮----
/**
 * Canonical seven-tier proficiency scale. [#12]
 *
 * Single source of truth for XP thresholds, display labels and design tokens.
 * All downstream helpers derive automatically from this table.
 */
⋮----
// ─── Tier computation (Invariant #12 canonical function) ─────────────────────
⋮----
/** Returns the full TierDefinition for a SkillTier identifier. */
export function getTierDefinition(tier: SkillTier): TierDefinition
⋮----
/**
 * Canonical getTier(xp) → SkillTier pure function. [#12]
 *
 * This is the ONLY legitimate way to derive a tier from XP.
 * Result MUST NOT be stored in any DB field.
 */
export function getTier(xp: number): SkillTier
⋮----
/** Alias for getTier — matches logic-overview.md canonical name. */
⋮----
/** Returns the numeric rank for a tier (1 = lowest, 7 = highest). */
export function getTierRank(tier: SkillTier): number
⋮----
/**
 * Returns true if `grantedTier` satisfies the `minimumTier` requirement.
 * Higher rank (or equal) always satisfies a lower minimum.
 */
export function tierSatisfies(grantedTier: SkillTier, minimumTier: SkillTier): boolean
⋮----
// ─── Cross-BC staffing contract (SK_SKILL_REQ) ───────────────────────────────
⋮----
/**
 * Cross-BC staffing requirement: a skill (identified by tagSlug) with a
 * minimum XP threshold.
 *
 * Re-exported from @/shared/types/skill.types to keep the dependency direction clean.
 * See top-of-file import for the consolidated re-export.
 */
⋮----
// ─── Cross-BC event payload (Workspace BC → Organization BC) [A5] ────────────
⋮----
/**
 * Payload carried by the `workspace:schedule:proposed` cross-BC event.
 *
 * Workspace BC emits → Organization BC consumes (scheduling.slice).
 * Placing this in shared.kernel removes the scheduling.slice dependency on
 * workspace internal event bus implementations.
 *
 * [R8] traceId MUST be propagated end-to-end through the scheduling saga.
 */
export interface WorkspaceScheduleProposedPayload {
  /** Workspace-local schedule item identifier. */
  readonly scheduleItemId: string;
  /** Workspace that initiated the proposal. */
  readonly workspaceId: string;
  /** Organization that owns the workspace. */
  readonly orgId: string;
  /** Human-readable schedule title. */
  readonly title: string;
  /** ISO 8601 start date. */
  readonly startDate: string;
  /** ISO 8601 end date. */
  readonly endDate: string;
  /** accountId of the proposer. */
  readonly proposedBy: string;
  /** SourcePointer: IntentID of the ParsingIntent that triggered this proposal. */
  readonly intentId?: string;
  /** Staffing requirements extracted from parsed document. */
  readonly skillRequirements?: SkillRequirement[];
  /** Sub-location within the workspace. [FR-L2] */
  readonly locationId?: string;
  /** [R8] TraceID from CBG_ENTRY — must propagate through the scheduling saga. */
  readonly traceId?: string;
}
⋮----
/** Workspace-local schedule item identifier. */
⋮----
/** Workspace that initiated the proposal. */
⋮----
/** Organization that owns the workspace. */
⋮----
/** Human-readable schedule title. */
⋮----
/** ISO 8601 start date. */
⋮----
/** ISO 8601 end date. */
⋮----
/** accountId of the proposer. */
⋮----
/** SourcePointer: IntentID of the ParsingIntent that triggered this proposal. */
⋮----
/** Staffing requirements extracted from parsed document. */
⋮----
/** Sub-location within the workspace. [FR-L2] */
⋮----
/** [R8] TraceID from CBG_ENTRY — must propagate through the scheduling saga. */
⋮----
/** Conformance marker for org schedule handlers consuming this payload. */
export interface ImplementsScheduleProposedPayloadContract {
  readonly implementsScheduleProposedPayload: true;
}
````

## File: src/features/shared-kernel/skill-tier/skill-tier.test.ts
````typescript
/**
 * @fileoverview Tests for shared-kernel skill-tier pure functions [SK_SKILL_TIER]
 *
 * Validates that:
 *   1. getTier(xp) returns the correct tier for each XP threshold [#12]
 *   2. getTierRank returns the correct ordinal rank
 *   3. tierSatisfies correctly evaluates minimum-tier requirements [A5][P4]
 *   4. resolveSkillTier is an alias for getTier
 *   5. TIER_DEFINITIONS covers all 7 tiers
 *
 * These pure functions power the scheduling eligibility check in `_saga.ts`.
 */
⋮----
import { describe, it, expect } from 'vitest';
⋮----
import {
  getTier,
  getTierRank,
  tierSatisfies,
  resolveSkillTier,
  getTierDefinition,
  TIER_DEFINITIONS,
} from '@/features/shared-kernel/skill-tier';
⋮----
// ---------------------------------------------------------------------------
// TIER_DEFINITIONS coverage
// ---------------------------------------------------------------------------
⋮----
// ---------------------------------------------------------------------------
// getTier [#12] — canonical XP → Tier mapping
// ---------------------------------------------------------------------------
⋮----
// ---------------------------------------------------------------------------
// resolveSkillTier alias
// ---------------------------------------------------------------------------
⋮----
// ---------------------------------------------------------------------------
// getTierRank
// ---------------------------------------------------------------------------
⋮----
// ---------------------------------------------------------------------------
// getTierDefinition
// ---------------------------------------------------------------------------
⋮----
// ---------------------------------------------------------------------------
// tierSatisfies — core eligibility gate [A5][P4]
// ---------------------------------------------------------------------------
⋮----
// Real-world: an expert site manager (grandmaster) assigned to a journeyman role
````

## File: src/features/shared-kernel/staleness-contract/index.ts
````typescript
/**
 * shared.kernel/staleness-contract — SK_STALENESS_CONTRACT [S4]
 *
 * VS0 Shared Kernel: Global staleness SLA — single source of truth.
 *
 * Per logic-overview.md [S4]:
 *   TAG_MAX_STALENESS    ≤ 30 s   — tag-derived data (SKILL_TAG_POOL, TAG_SNAPSHOT)
 *   PROJ_STALE_CRITICAL  ≤ 500 ms — authorization / scheduling Projections
 *   PROJ_STALE_STANDARD  ≤ 10 s   — general Projections
 *   PROJ_STALE_DEMAND_BOARD ≤ 5 s — Demand Board Projection
 *
 * Rule: ALL consumer nodes MUST reference `StalenessMs.*` from this contract.
 *   Direct numeric literals (e.g. `30000`, `500`) in staleness checks are FORBIDDEN.
 *   SLA numbers are FORBIDDEN in component/node text — use SK_STALENESS_CONTRACT constants.
 *
 * Dependency rule: ZERO infrastructure imports (no Firebase, no React, no I/O).
 */
⋮----
// ─── SLA constants ────────────────────────────────────────────────────────────
⋮----
/**
 * All staleness SLA values in milliseconds. [S4]
 *
 * Single source of truth — do NOT hardcode these values anywhere else.
 */
⋮----
/**
   * Tag-derived data maximum staleness.
   * Applies to: SKILL_TAG_POOL, TAG_SNAPSHOT, TAG_STALE_GUARD.
   */
⋮----
/**
   * Authorization / scheduling Projection critical SLA.
   * Applies to: WS_SCOPE_VIEW, ORG_ELIGIBLE_VIEW.
   */
⋮----
/**
   * General Projection SLA.
   * Applies to all Projections not covered by a stricter SLA.
   */
⋮----
/**
   * Demand Board Projection SLA.
   * Per docs/prd-schedule-workforce-skills.md NFR PROJ_STALE_DEMAND_BOARD.
   */
⋮----
// ─── Tier classification ──────────────────────────────────────────────────────
⋮----
/** Staleness tier used to look up the SLA constant. [S4] */
export type StalenessTier = 'TAG' | 'CRITICAL' | 'STANDARD' | 'DEMAND_BOARD';
⋮----
/**
 * Returns the SLA threshold (ms) for a staleness tier. [S4]
 */
export function getSlaMs(tier: StalenessTier): number
⋮----
/**
 * Returns true when the measured age exceeds the SLA for the given tier. [S4]
 */
export function isStale(ageMs: number, tier: StalenessTier): boolean
⋮----
// ─── Conformance marker ───────────────────────────────────────────────────────
⋮----
/**
 * Marker interface — consumer nodes declare their staleness tier. [S4]
 */
export interface ImplementsStalenessContract {
  readonly stalenessTier: StalenessTier;
}
````

## File: src/features/shared-kernel/tag-authority/index.ts
````typescript
/**
 * shared.kernel/tag-authority — Tag Authority Center CONTRACT [#A6][#17][D21]
 *
 * VS0 Shared Kernel: Canonical tag contract — READ-ONLY reference rules and
 * lifecycle event types for cross-BC subscription.
 *
 * ┌─ Architecture boundary ────────────────────────────────────────────────────┐
 * │  IMPLEMENTATION: src/features/centralized-tag/  ← sole write authority     │
 * │  CONTRACT (this file): types + event payload + read-only interface          │
 * │  All other slices import from HERE — never from centralized-tag directly.  │
 * └────────────────────────────────────────────────────────────────────────────┘
 *
 * Per logic-overview.md:
 *
 * [#17][T1] READ-ONLY REFERENCE RULES:
 *   T1 — New slices subscribe to TagLifecycleEvent; MUST NOT maintain their own tag data.
 *   T2 — tagSlug references are the only cross-BC link (store slug, not label/category).
 *   T3 — Consumers MUST listen to TagDeprecated/TagDeleted events to invalidate local refs.
 *   T4 — SKILL_TAG_POOL is the only allowed local materialization; subject to TAG_MAX_STALENESS.
 *   T5 — Queries requiring tag labels join at read time via TAG_SNAPSHOT (EVENTUAL_READ).
 *
 * [D21] AI-READY SEMANTIC TAG ENTITIES:
 *   Canonical tag categories for automated agent classification:
 *   skill | skill_tier | user_level | role | team | partner
 *
 * [D24] Infrastructure port: ITagReadPort (read-only query port for tag-authority).
 *
 * Dependency rule: ZERO infrastructure imports (no Firebase, no React, no I/O).
 */
⋮----
// ─── Canonical tag categories [D21] ──────────────────────────────────────────
⋮----
/**
 * Canonical set of tag categories for D21 AI-ready semantic classification. [D21]
 *
 * `skill`      — skill-domain tags (e.g. "masonry", "welding")
 * `skill_tier` — derived tier labels (e.g. "expert", "artisan") — computed, not persisted
 * `user_level` — account role / seniority classification
 * `role`       — position / function tags
 * `team`       — team / workgroup identity tags
 * `partner`    — external partner / vendor tags
 */
⋮----
export type TagCategory = (typeof TAG_CATEGORIES)[number];
⋮----
// ─── Delete rule ──────────────────────────────────────────────────────────────
⋮----
/**
 * Deletion policy when a tag still has active consumer references.
 *
 * `block`   — delete is rejected until all references are removed
 * `archive` — tag is archived (deprecated) and hidden from new use
 * `cascade` — consumer references are nullified (use with caution)
 */
export type TagDeleteRule = 'block' | 'archive' | 'cascade';
⋮----
// ─── Read-only tag reference ──────────────────────────────────────────────────
⋮----
/**
 * Read-only tagSlug reference.
 *
 * This is the ONLY cross-BC link allowed. Slices MUST store only the tagSlug,
 * never the label or category. [T2]
 */
export type TagSlugRef = string & { readonly _brand: 'TagSlugRef' };
⋮----
/** Create a type-safe TagSlugRef from a raw string. */
export function tagSlugRef(raw: string): TagSlugRef
⋮----
// ─── Tag lifecycle event payloads ─────────────────────────────────────────────
⋮----
/**
 * Payload emitted when a new tag is created.
 * Subscribers use this to populate local SKILL_TAG_POOL or TAG_SNAPSHOT. [T4][T5]
 */
export interface TagCreatedPayload {
  readonly tagSlug: string;
  readonly label: string;
  readonly category: TagCategory;
  readonly createdBy: string;
  readonly createdAt: string;
}
⋮----
/**
 * Payload emitted when a tag's label or category changes.
 * Subscribers must invalidate cached tag labels. [T3]
 */
export interface TagUpdatedPayload {
  readonly tagSlug: string;
  readonly label: string;
  readonly category: TagCategory;
  readonly updatedBy: string;
  readonly updatedAt: string;
}
⋮----
/**
 * Payload emitted when a tag is deprecated (superseded by another).
 * Subscribers must display a deprecation warning and migrate to replacedByTagSlug. [T3]
 */
export interface TagDeprecatedPayload {
  readonly tagSlug: string;
  /** Suggested replacement tagSlug. Subscribers should migrate to this slug. */
  readonly replacedByTagSlug?: string;
  readonly deprecatedBy: string;
  readonly deprecatedAt: string;
}
⋮----
/** Suggested replacement tagSlug. Subscribers should migrate to this slug. */
⋮----
/**
 * Payload emitted when a tag is permanently deleted.
 * Subscribers MUST remove all local references to this tagSlug. [T3]
 */
export interface TagDeletedPayload {
  readonly tagSlug: string;
  readonly deletedBy: string;
  readonly deletedAt: string;
}
⋮----
/** Map of all TagLifecycleEvent keys to their payload types. */
export interface TagLifecycleEventPayloadMap {
  'tag:created':    TagCreatedPayload;
  'tag:updated':    TagUpdatedPayload;
  'tag:deprecated': TagDeprecatedPayload;
  'tag:deleted':    TagDeletedPayload;
}
⋮----
export type TagLifecycleEventKey = keyof TagLifecycleEventPayloadMap;
⋮----
// ─── Read-only access port [D24] ──────────────────────────────────────────────
⋮----
/**
 * Minimal read-only port for accessing tag metadata at query time. [D24][T5]
 *
 * Implementations may query TAG_SNAPSHOT (EVENTUAL_READ) or
 * centralized-tag.aggregate directly (STRONG_READ).
 *
 * This interface is the ONLY legitimate way for other slices to read tag data.
 * Slices MUST NOT import from centralized-tag directly.
 */
export interface ITagReadPort {
  /** Look up the label for a tagSlug. Returns null if the tag does not exist or is deleted. */
  getLabelBySlug(tagSlug: string): Promise<string | null>;

  /** Resolve multiple tagSlugs to their labels in one batch. */
  getLabelsBySlug(tagSlugs: string[]): Promise<Record<string, string>>;

  /** Returns true if the tagSlug exists and is not deprecated. */
  isActive(tagSlug: string): Promise<boolean>;
}
⋮----
/** Look up the label for a tagSlug. Returns null if the tag does not exist or is deleted. */
getLabelBySlug(tagSlug: string): Promise<string | null>;
⋮----
/** Resolve multiple tagSlugs to their labels in one batch. */
getLabelsBySlug(tagSlugs: string[]): Promise<Record<string, string>>;
⋮----
/** Returns true if the tagSlug exists and is not deprecated. */
isActive(tagSlug: string): Promise<boolean>;
⋮----
// ─── Stale guard contract [S4][T4] ───────────────────────────────────────────
⋮----
/**
 * Tag-derived local cache conformance contract.
 *
 * Any slice that materializes a local tag cache (SKILL_TAG_POOL or similar)
 * MUST reference TAG_MAX_STALENESS from SK_STALENESS_CONTRACT [S4] and
 * declare this marker interface. [T4]
 */
export interface ImplementsTagStaleGuard {
  readonly implementsTagStaleGuard: true;
  /**
   * Maximum cache age in milliseconds.
   * MUST equal StalenessMs.TAG_MAX_STALENESS — never a hardcoded literal.
   */
  readonly maxStalenessMs: number;
}
⋮----
/**
   * Maximum cache age in milliseconds.
   * MUST equal StalenessMs.TAG_MAX_STALENESS — never a hardcoded literal.
   */
⋮----
// ─── Tag event bus subscription (re-exported for infrastructure consumers) ───
⋮----
/**
 * Re-exported from centralized-tag._bus.
 *
 * Infrastructure consumers (L5 ProjectionBus) MUST subscribe to tag lifecycle
 * events via this import path — never via centralized-tag directly. [D7]
 */
````

## File: src/features/shared-kernel/token-refresh-contract/index.ts
````typescript
/**
 * shared.kernel/token-refresh-contract — SK_TOKEN_REFRESH_CONTRACT [S6]
 *
 * VS0 Shared Kernel: Claims refresh three-way handshake protocol.
 *
 * Per logic-overview.md [S6]:
 *   Claims refresh spans three parties — VS1, IER, and the frontend client.
 *   It is NOT internal to VS1 alone.
 *
 *   Trigger : RoleChanged | PolicyChanged event
 *   Lane    : IER CRITICAL_LANE → CLAIMS_HANDLER (VS1)
 *   Signal  : TOKEN_REFRESH_SIGNAL (emitted after successful Claims write)
 *   Client  : MUST force-refresh Firebase Token on receiving the signal
 *   Failure : DLQ SECURITY_BLOCK → DOMAIN_ERRORS alert → aggregate frozen
 *
 * Rule: All three parties (VS1, IER, frontend) MUST reference this single contract.
 *   Do NOT declare TOKEN_REFRESH_SIGNAL or ClaimsRefreshTrigger locally in any party.
 *   Any change to Claims refresh logic MUST update all three parties simultaneously [D18].
 *
 * Dependency rule: ZERO infrastructure imports (no Firebase, no React, no I/O).
 */
⋮----
// ─── Trigger events ───────────────────────────────────────────────────────────
⋮----
/**
 * Domain events that trigger a Claims refresh cycle. [S6]
 *
 * These MUST be routed via IER CRITICAL_LANE to the CLAIMS_HANDLER.
 * Any new event that changes effective permissions MUST be added here.
 */
export type ClaimsRefreshTrigger = 'RoleChanged' | 'PolicyChanged';
⋮----
// ─── Signal ───────────────────────────────────────────────────────────────────
⋮----
/**
 * Signal emitted after Claims are successfully written. [S6]
 *
 * All three parties respond to this signal:
 *   VS1  — records outcome, updates audit log
 *   IER  — routes failure to DLQ SECURITY_BLOCK
 *   Client — force-refreshes Firebase Token (ClientTokenRefreshObligation)
 */
⋮----
export type TokenRefreshSignal = typeof TOKEN_REFRESH_SIGNAL;
⋮----
// ─── Handshake lifecycle ──────────────────────────────────────────────────────
⋮----
/** Outcome of a single Claims refresh attempt. [S6] */
export type ClaimsRefreshOutcome = 'success' | 'failure';
⋮----
/**
 * Metadata record for a single Claims refresh handshake cycle. [S6]
 *
 * VS1 emits this when CLAIMS_HANDLER completes (success or failure).
 * IER routes failure outcomes to DLQ SECURITY_BLOCK.
 */
export interface ClaimsRefreshHandshake {
  readonly trigger: ClaimsRefreshTrigger;
  readonly accountId: string;
  readonly outcome: ClaimsRefreshOutcome;
  readonly completedAt: string;
  /** [R8] TraceID from the originating command chain — must be propagated. */
  readonly traceId: string;
}
⋮----
/** [R8] TraceID from the originating command chain — must be propagated. */
⋮----
// ─── Client obligation ────────────────────────────────────────────────────────
⋮----
/**
 * Client-side obligation upon receiving TOKEN_REFRESH_SIGNAL. [S6]
 *
 * The frontend MUST:
 *   1. Force-refresh the Firebase ID token.
 *   2. Re-attach the new token to all subsequent requests.
 */
export interface ClientTokenRefreshObligation {
  readonly signal: TokenRefreshSignal;
  readonly action: 'force_refresh_and_reattach';
}
⋮----
/** Canonical client obligation constant. [S6] */
⋮----
// ─── Conformance marker ───────────────────────────────────────────────────────
⋮----
/**
 * Marker interface — VS1, IER, and frontend implementations declare conformance. [S6]
 */
export interface ImplementsTokenRefreshContract {
  readonly implementsTokenRefreshContract: true;
}
````

## File: src/features/shared-kernel/version-guard/index.ts
````typescript
/**
 * shared.kernel/version-guard — SK_VERSION_GUARD [S2]
 *
 * VS0 Shared Kernel: Monotonic version protection for all Projection writes.
 *
 * Per logic-overview.md [S2]:
 *   All Projection write paths MUST apply this guard before updating state:
 *     event.aggregateVersion > view.lastProcessedVersion → allow write
 *     otherwise → discard (stale or duplicate event; MUST NOT overwrite newer state)
 *
 * Generalization of Invariant #19: applies to ALL Projections, not only eligible-view.
 * FUNNEL compose-time must reference this rule uniformly.
 *
 * Consumers: every projection sub-dir inside projection.bus.
 *
 * Dependency rule: ZERO infrastructure imports (no Firebase, no React, no I/O).
 */
⋮----
// ─── Contract types ───────────────────────────────────────────────────────────
⋮----
/** Input to the version guard check. [S2] */
export interface VersionGuardInput {
  /** aggregateVersion carried by the incoming event. */
  readonly eventVersion: number;
  /** lastProcessedVersion currently stored in the Projection view. */
  readonly viewLastProcessedVersion: number;
}
⋮----
/** aggregateVersion carried by the incoming event. */
⋮----
/** lastProcessedVersion currently stored in the Projection view. */
⋮----
/** Result of the version guard decision. [S2] */
export type VersionGuardResult = 'allow' | 'discard';
⋮----
// ─── Guard function ───────────────────────────────────────────────────────────
⋮----
/**
 * Apply SK_VERSION_GUARD to an incoming event. [S2]
 *
 * Returns 'allow' when eventVersion is STRICTLY GREATER than the stored version.
 * Returns 'discard' for equal (duplicate) or lesser (out-of-order late delivery) versions.
 */
export function applyVersionGuard(input: VersionGuardInput): VersionGuardResult
⋮----
/** Boolean convenience wrapper for applyVersionGuard. */
export function versionGuardAllows(input: VersionGuardInput): boolean
⋮----
// ─── Conformance marker ───────────────────────────────────────────────────────
⋮----
/**
 * Marker interface — Projection implementations declare conformance to SK_VERSION_GUARD. [S2]
 */
export interface ImplementsVersionGuard {
  readonly implementsVersionGuard: true;
}
````

## File: src/features/skill-xp.slice/_actions.ts
````typescript
/**
 * skill-xp.slice — _actions.ts
 *
 * Server-side action wrappers for the AccountSkill aggregate.
 *
 * Call path per logic-overview.md [E1]:
 *   SERVER_ACTION_SKILL →|addXp / deductXp Command| ACCOUNT_SKILL_AGGREGATE
 *   ACCOUNT_SKILL_AGGREGATE →|clamp 0~525 · 寫入 Ledger| ACCOUNT_SKILL_XP_LEDGER
 *   ACCOUNT_SKILL_AGGREGATE →|return { newXp, xpDelta }| _actions.ts
 *   _actions.ts →|SkillXpAdded / SkillXpDeducted| ORGANIZATION_EVENT_BUS (via IER routing E1)
 *
 * Per Invariant #3: Application Layer (actions) coordinates cross-BC routing;
 * the Aggregate only enforces domain invariants (#11 #12 #13).
 *
 * Org Skill Tag Pool management actions:
 *   addOrgSkillTagAction  — activate a global skill into the org's pool (Invariant T2)
 *   removeOrgSkillTagAction — deactivate a skill from the org's pool
 */
⋮----
import { publishOrgEvent } from '@/features/organization.slice';
import {
  type CommandResult,
  commandSuccess,
  commandFailureFrom,
} from '@/features/shared-kernel';
import { setDocument } from '@/shared/infra/firestore/firestore.write.adapter';
⋮----
import { addXp, deductXp } from './_aggregate';
import { addSkillTagToPool, removeSkillTagFromPool } from './_tag-pool';
⋮----
export interface AddXpInput {
  accountId: string;
  skillId: string;
  delta: number;
  orgId: string;
  reason?: string;
  /** Optional reference to the source domain object (e.g. taskId). */
  sourceId?: string;
  /** Optional trace identifier propagated from CBG_ENTRY [R8]. */
  traceId?: string;
}
⋮----
/** Optional reference to the source domain object (e.g. taskId). */
⋮----
/** Optional trace identifier propagated from CBG_ENTRY [R8]. */
⋮----
/**
 * Server Action: add XP to an account's skill.
 * Enforces Ledger write before aggregate update (Invariant #13).
 * Publishes SkillXpAdded to the org event bus after the aggregate write.
 * Per E1: event publishing belongs in the application coordinator (_actions.ts),
 * not in the aggregate, to prevent VS3 → VS4 boundary invasion.
 */
export async function addSkillXp(input: AddXpInput): Promise<CommandResult>
⋮----
// D3: aggregate returns computed state; _actions.ts owns the persistence write.
⋮----
// Application coordinator publishes cross-BC skill event (E1 — not from aggregate)
⋮----
export interface DeductXpInput {
  accountId: string;
  skillId: string;
  delta: number;
  orgId: string;
  reason?: string;
  sourceId?: string;
  /** Optional trace identifier propagated from CBG_ENTRY [R8]. */
  traceId?: string;
}
⋮----
/** Optional trace identifier propagated from CBG_ENTRY [R8]. */
⋮----
/**
 * Server Action: deduct XP from an account's skill.
 * Enforces Ledger write before aggregate update (Invariant #13).
 * Publishes SkillXpDeducted to the org event bus after the aggregate write.
 * Per E1: event publishing belongs in the application coordinator (_actions.ts),
 * not in the aggregate, to prevent VS3 → VS4 boundary invasion.
 */
export async function deductSkillXp(input: DeductXpInput): Promise<CommandResult>
⋮----
// D3: aggregate returns computed state; _actions.ts owns the persistence write.
⋮----
// Application coordinator publishes cross-BC skill event (E1 — not from aggregate)
⋮----
// ---------------------------------------------------------------------------
// Org Skill Tag Pool — server action wrappers (Invariant T2)
// ---------------------------------------------------------------------------
⋮----
/**
 * Server Action: activate a skill from the global dictionary into the org's pool.
 * The tagSlug MUST already exist in the global centralized-tag dictionary (Invariant T2).
 * Idempotent: calling this when the tag already exists in the pool is a no-op.
 */
export async function addOrgSkillTagAction(
  orgId: string,
  tagSlug: string,
  tagName: string,
  actorId: string
): Promise<CommandResult>
⋮----
/**
 * Server Action: remove a skill from the org's pool.
 * Blocked when refCount > 0 (active member/partner references exist — Invariant A6).
 * Idempotent: calling this when the tag is absent is a no-op.
 */
export async function removeOrgSkillTagAction(
  orgId: string,
  tagSlug: string
): Promise<CommandResult>
````

## File: src/features/skill-xp.slice/_aggregate.ts
````typescript
/**
 * skill-xp.slice — _aggregate.ts
 *
 * AccountSkill Aggregate Root.
 *
 * Schema (stored at: accountSkills/{accountId}/skills/{skillId}):
 *   accountId — owner
 *   skillId   — tagSlug (portable identifier)
 *   xp        — accumulated XP, clamped 0–525 (Invariant #13)
 *   version   — optimistic concurrency counter
 *
 * Invariants enforced:
 *   #11 — XP belongs to Account BC; published to Organization via events only.
 *   #12 — Tier is NEVER stored here. Derive via resolveSkillTier(xp) / getTier(xp).
 *   #13 — Every xp change MUST write a ledger entry BEFORE updating the aggregate.
 *
 * Write path per logic-overview.md [E1]:
 *   Server Action → addXp/deductXp → clamp 0~525 → appendXpLedgerEntry
 *     → setDocument(aggregate) → return { newXp, xpDelta, version }
 *   Cross-BC event publishing (SkillXpAdded/Deducted → IER → ORG_EVENT_BUS) is handled
 *   by _actions.ts (application coordinator), NOT the aggregate (Invariant #3, E1).
 */
⋮----
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
⋮----
import { appendXpLedgerEntry } from './_ledger';
⋮----
// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
⋮----
/** Maximum XP value per skill — matches TIER_DEFINITIONS cap (Titan tier). */
⋮----
/** Minimum XP value per skill. */
⋮----
// ---------------------------------------------------------------------------
// Types — no `tier` field (Invariant #12)
// ---------------------------------------------------------------------------
⋮----
/**
 * Persisted aggregate state.
 * `tier` is intentionally absent — derived at query time via getTier(xp).
 */
export interface AccountSkillRecord {
  accountId: string;
  /** tagSlug — portable, hyphen-separated skill identifier. */
  skillId: string;
  /** Accumulated XP (0–525). The ONLY persisted skill attribute. */
  xp: number;
  /** Optimistic-concurrency version counter. Incremented on every write. */
  version: number;
}
⋮----
/** tagSlug — portable, hyphen-separated skill identifier. */
⋮----
/** Accumulated XP (0–525). The ONLY persisted skill attribute. */
⋮----
/** Optimistic-concurrency version counter. Incremented on every write. */
⋮----
// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------
⋮----
function clampXp(xp: number): number
⋮----
function aggregatePath(accountId: string, skillId: string): string
⋮----
// ---------------------------------------------------------------------------
// Domain operations
// ---------------------------------------------------------------------------
⋮----
/**
 * Adds XP to an account's skill aggregate.
 *
 * Write path (Invariant #13, E1):
 *   1. Read current aggregate (or default to xp=0).
 *   2. Compute new clamped XP.
 *   3. Append ledger entry (BEFORE aggregate write — audit ordering guarantee).
 *   4. Persist updated aggregate (no tier stored — Invariant #12).
 *   Returns { newXp, xpDelta, version } — caller (_actions.ts) is responsible for
 *   publishing SkillXpAdded to the org event bus (E1 — not the aggregate's concern).
 *
 * @param delta  Positive XP amount to add.
 * @param opts.orgId   Organization context (passed through to caller for event payload).
 * @param opts.reason  Human-readable reason for the ledger entry.
 * @param opts.sourceId  Optional source object ID (e.g. taskId, scheduleItemId).
 * @returns The new XP value, the actual applied delta (after clamping), the new aggregate version,
 *          and the record to persist — caller (_actions.ts) is responsible for the setDocument write (D3).
 */
export async function addXp(
  accountId: string,
  skillId: string,
  delta: number,
  opts: { orgId: string; reason?: string; sourceId?: string }
): Promise<
⋮----
// Invariant #13: ledger BEFORE aggregate write
⋮----
/**
 * Mirrors addXp; delta should be positive (the deduction amount).
 * Net XP is clamped at SKILL_XP_MIN (0).
 * Returns { newXp, xpDelta, version, record, path } — caller (_actions.ts) persists via setDocument (D3).
 */
export async function deductXp(
  accountId: string,
  skillId: string,
  delta: number,
  opts: { orgId: string; reason?: string; sourceId?: string }
): Promise<
⋮----
const actualDelta = newXp - oldXp; // negative
⋮----
// Invariant #13: ledger BEFORE aggregate write
⋮----
/**
 * Returns the current XP for an account's skill.
 * Returns 0 if no record exists.
 *
 * NOTE: Do NOT use this to get tier — call getTier(xp) from shared/lib.
 */
export async function getSkillXp(
  accountId: string,
  skillId: string
): Promise<number>
````

## File: src/features/skill-xp.slice/_components/personal-skill-panel.tsx
````typescript
/**
 * skill-xp.slice — _components/personal-skill-panel.tsx
 *
 * FR-K1: Personal skill profile page — XP bar and tier badge for each skill.
 *
 * Invariant #12: tier is NEVER read from DB; derived via resolveSkillTier(xp).
 */
⋮----
import { Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
⋮----
import { resolveSkillTier, TIER_DEFINITIONS } from '@/features/shared-kernel';
import { useApp } from '@/shared/app-providers/app-context';
import { Badge } from '@/shared/shadcn-ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/shadcn-ui/card';
import { Progress } from '@/shared/shadcn-ui/progress';
⋮----
import type { AccountSkillEntry } from '../_projector';
import { getAccountSkillView } from '../_queries';
⋮----
interface SkillRow {
  skillId: string;
  xp: number;
  tier: string;
  tierLabel: string;
  tierColor: string;
  progressPct: number;
  xpInTier: number;
  xpNeeded: number;
}
⋮----
function buildRows(entries: AccountSkillEntry[]): SkillRow[]
⋮----
export function PersonalSkillPanel()
⋮----
{/* Tier color accent bar */}
````

## File: src/features/skill-xp.slice/_ledger.ts
````typescript
/**
 * skill-xp.slice — _ledger.ts
 *
 * XP Ledger: immutable audit trail for every XP change.
 *
 * Schema (stored at: accountSkills/{accountId}/xpLedger/{entryId}):
 *   entryId   — auto-generated document ID (stable cross-BC reference)
 *   accountId — the owner of the XP
 *   skillId   — tagSlug of the skill being modified
 *   delta     — XP change (positive = added, negative = deducted)
 *   reason    — human-readable reason (e.g. "task:completed", "admin:correction")
 *   sourceId  — optional ID of the source event (taskId, scheduleItemId, etc.)
 *   timestamp — ISO 8601 creation time
 *
 * Invariant #13: XP changes MUST produce a ledger entry.
 *   Callers MUST call appendXpLedgerEntry() BEFORE updating the aggregate.
 *   This creates an auditable "happened-before" ordering in Firestore.
 *
 * NOTE: `tier` is intentionally absent from this schema (Invariant #12).
 */
⋮----
import { addDocument } from '@/shared/infra/firestore/firestore.write.adapter';
⋮----
// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
⋮----
export interface XpLedgerEntry {
  accountId: string;
  skillId: string;
  /**
   * XP change applied to the aggregate.
   * Positive = XP added, negative = XP deducted.
   * Represents the actual clamped delta (what actually changed), not the
   * requested delta (which may have been clamped at 0 or 525 boundary).
   */
  delta: number;
  /** Human-readable reason for the XP change. */
  reason: string;
  /**
   * Optional reference to the source domain object that caused this XP change
   * (e.g. a taskId, scheduleItemId, or "admin:manual").
   */
  sourceId?: string;
  /** ISO 8601 timestamp of when this ledger entry was created. */
  timestamp: string;
}
⋮----
/**
   * XP change applied to the aggregate.
   * Positive = XP added, negative = XP deducted.
   * Represents the actual clamped delta (what actually changed), not the
   * requested delta (which may have been clamped at 0 or 525 boundary).
   */
⋮----
/** Human-readable reason for the XP change. */
⋮----
/**
   * Optional reference to the source domain object that caused this XP change
   * (e.g. a taskId, scheduleItemId, or "admin:manual").
   */
⋮----
/** ISO 8601 timestamp of when this ledger entry was created. */
⋮----
// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------
⋮----
/**
 * Appends an immutable XP ledger entry.
 *
 * MUST be called BEFORE updating the aggregate xp value.
 * Uses addDocument to let Firestore generate a stable entryId.
 *
 * Stored at: accountSkills/{accountId}/xpLedger/{auto-id}
 */
export async function appendXpLedgerEntry(
  accountId: string,
  entry: Omit<XpLedgerEntry, 'accountId' | 'timestamp'>
): Promise<string>
````

## File: src/features/skill-xp.slice/_org-recognition.ts
````typescript
/**
 * skill-xp.slice — _org-recognition.ts
 *
 * Organization Skill Recognition Aggregate.
 *
 * Per logic-overview.md:
 *   ORG_SKILL_RECOGNITION["organization-skill-recognition.aggregate
 *     （organizationId / accountId / skillId / minXpRequired / status）"]
 *   ORG_SKILL_RECOGNITION →|SkillRecognitionGranted / SkillRecognitionRevoked| ORGANIZATION_EVENT_BUS
 *
 * Responsibilities:
 *   - Record that an organization has recognised a member's skill proficiency.
 *   - Set `minXpRequired` thresholds — organizations MAY gate recognition
 *     by requiring a minimum XP level.
 *   - Publish SkillRecognitionGranted / SkillRecognitionRevoked events.
 *
 * Integration (read-only reference to SKILL_DEFINITION_AGGREGATE):
 *   - Uses `skillId` (tagSlug) as the stable FK referencing the Capability BC.
 *   - NEVER writes to SKILL_DEFINITION_AGGREGATE or ACCOUNT_SKILL_AGGREGATE.
 *   - Reading skill definitions is read-only: uses the static shared/constants/skills
 *     library (no Firestore read needed for definitions).
 *
 * Boundary constraint:
 *   Organization may set `minXpRequired` (a threshold), but it CANNOT modify
 *   the account's XP — that belongs solely to Account BC (Invariant #11).
 *
 * Stored at: orgSkillRecognition/{orgId}/members/{accountId}/skills/{skillId}
 */
⋮----
import { publishOrgEvent } from '@/features/organization.slice';
import { findSkill } from '@/shared/constants/skills';
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
import {
  setDocument,
  updateDocument,
} from '@/shared/infra/firestore/firestore.write.adapter';
⋮----
// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
⋮----
export type SkillRecognitionStatus = 'active' | 'revoked';
⋮----
/**
 * Persisted recognition record.
 * `minXpRequired` is the ORG-controlled gate; the account's actual xp is
 * read from projection.org-eligible-member-view — never from this record.
 */
export interface OrgSkillRecognitionRecord {
  organizationId: string;
  accountId: string;
  /**
   * tagSlug — read-only reference to the Capability BC's SKILL_DEFINITION_AGGREGATE.
   * This is the only cross-BC coupling; it is a portable string FK, not a direct
   * object import.  The Capability BC owns the canonical definition; this BC
   * may only reference it by ID.
   */
  skillId: string;
  /**
   * Organization-controlled XP threshold.
   * When set, the organization declares that it only recognises the skill for
   * members who have earned at least this much XP.
   * NOTE: this is a GATE, not a write to Account BC (Invariant #11).
   */
  minXpRequired: number;
  status: SkillRecognitionStatus;
  grantedBy: string;
  grantedAt: string;
  revokedAt?: string;
}
⋮----
/**
   * tagSlug — read-only reference to the Capability BC's SKILL_DEFINITION_AGGREGATE.
   * This is the only cross-BC coupling; it is a portable string FK, not a direct
   * object import.  The Capability BC owns the canonical definition; this BC
   * may only reference it by ID.
   */
⋮----
/**
   * Organization-controlled XP threshold.
   * When set, the organization declares that it only recognises the skill for
   * members who have earned at least this much XP.
   * NOTE: this is a GATE, not a write to Account BC (Invariant #11).
   */
⋮----
// ---------------------------------------------------------------------------
// Domain operations
// ---------------------------------------------------------------------------
⋮----
/**
 * Grants skill recognition to an account within an organization.
 *
 * Read-only reference to SKILL_DEFINITION_AGGREGATE (Capability BC):
 *   Validates `skillId` against the static global skill library via findSkill().
 *   This enforces the Capability BC boundary — only skills that exist in the
 *   canonical definition library can be recognised.
 *
 * Publishes `organization:skill:recognitionGranted` event.
 *
 * @param minXpRequired  Org-controlled XP gate (0 = no threshold; max 525).
 * @throws Error when `skillId` is not a known skill in the global library.
 */
export async function grantSkillRecognition(
  organizationId: string,
  accountId: string,
  skillId: string,
  grantedBy: string,
  minXpRequired = 0
): Promise<void>
⋮----
// Read-only reference to SKILL_DEFINITION_AGGREGATE (Capability BC — Invariant #8)
⋮----
/**
 * Revokes a previously granted skill recognition.
 * Publishes `organization:skill:recognitionRevoked` event.
 */
export async function revokeSkillRecognition(
  organizationId: string,
  accountId: string,
  skillId: string,
  revokedBy: string
): Promise<void>
⋮----
if (!existing || existing.status === 'revoked') return; // already revoked or absent
````

## File: src/features/skill-xp.slice/_projector.ts
````typescript
/**
 * skill-xp.slice — _projector.ts
 *
 * Account skill read model: tracks accountId → skillId → xp.
 *
 * Per logic-overview.md invariants:
 *   #12 — Tier is NEVER stored; always computed via resolveSkillTier(xp).
 *   #14 — Schedule reads this projection; never queries Account aggregate directly.
 *
 * Stored at: accountSkillView/{accountId}/skills/{skillId}
 *
 * Event sources (via EVENT_FUNNEL_INPUT):
 *   organization:skill:xpAdded   → applySkillXpAdded
 *   organization:skill:xpDeducted → applySkillXpDeducted
 */
⋮----
import { versionGuardAllows } from '@/features/shared-kernel';
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
import { serverTimestamp } from '@/shared/infra/firestore/firestore.write.adapter';
import { setDocument } from '@/shared/infra/firestore/firestore.write.adapter';
⋮----
/**
 * Per-skill entry stored in Firestore.
 * NOTE: `tier` is intentionally absent — derived at read time via resolveSkillTier(xp).
 */
export interface AccountSkillEntry {
  accountId: string;
  /** tagSlug — portable skill identifier (matches SkillGrant.tagSlug). */
  skillId: string;
  /** Clamped XP 0–525. The ONLY persisted skill attribute (Invariant #12). */
  xp: number;
  readModelVersion: number;
  /** Last aggregate version processed by this projection [S2] */
  lastProcessedVersion?: number;
  /** TraceId from the originating EventEnvelope [R8] */
  traceId?: string;
  updatedAt: ReturnType<typeof serverTimestamp>;
}
⋮----
/** tagSlug — portable skill identifier (matches SkillGrant.tagSlug). */
⋮----
/** Clamped XP 0–525. The ONLY persisted skill attribute (Invariant #12). */
⋮----
/** Last aggregate version processed by this projection [S2] */
⋮----
/** TraceId from the originating EventEnvelope [R8] */
⋮----
function skillPath(accountId: string, skillId: string): string
⋮----
/**
 * Applies a SkillXpAdded event to the read model.
 */
export async function applySkillXpAdded(
  accountId: string,
  skillId: string,
  newXp: number,
  aggregateVersion?: number,
  traceId?: string
): Promise<void>
⋮----
/**
 * Applies a SkillXpDeducted event to the read model.
 */
export async function applySkillXpDeducted(
  accountId: string,
  skillId: string,
  newXp: number,
  aggregateVersion?: number,
  traceId?: string
): Promise<void>
````

## File: src/features/skill-xp.slice/_queries.ts
````typescript
/**
 * skill-xp.slice — _queries.ts
 *
 * Read queries for:
 *   1. Account skill XP read model (accountSkillView)
 *   2. Skill Tag Pool (orgSkillTagPool)
 *   3. Org Skill Recognition (orgSkillRecognition)
 *
 * Per logic-overview.md:
 *   W_B_SCHEDULE -.→ ACCOUNT_SKILL_VIEW (読み取り only — via ORG_ELIGIBLE_MEMBER_VIEW)
 *   SKILL_TAG_POOL_AGGREGATE → SKILL_TAG_POOL (read model)
 *   ORG_SKILL_RECOGNITION["...organizationId / accountId / skillId / minXpRequired / status"]
 *
 * Boundary constraint:
 *   These queries read ONLY this slice's own Firestore collections.
 *   They do NOT read Account aggregate data directly — use projection views for that.
 */
⋮----
import { db } from '@/shared/infra/firestore/firestore.client';
import { getDocs, collection, type QueryDocumentSnapshot } from '@/shared/infra/firestore/firestore.read.adapter';
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
⋮----
import type { OrgSkillRecognitionRecord } from './_org-recognition';
import type { AccountSkillEntry } from './_projector';
import type { OrgSkillTagEntry } from './_tag-pool';
⋮----
// ---------------------------------------------------------------------------
// Account skill view queries
// ---------------------------------------------------------------------------
⋮----
/**
 * Retrieves the skill XP entry for a specific account + skill combination.
 */
export async function getAccountSkillEntry(
  accountId: string,
  skillId: string
): Promise<AccountSkillEntry | null>
⋮----
/**
 * Returns all skill entries for a given account.
 * Callers derive tier via resolveSkillTier(entry.xp).
 */
export async function getAccountSkillView(
  accountId: string
): Promise<AccountSkillEntry[]>
⋮----
// ---------------------------------------------------------------------------
// Skill Tag Pool queries
// ---------------------------------------------------------------------------
⋮----
/**
 * Retrieves a single skill tag from the org pool by tagSlug.
 * Returns null if the tag is not in the pool.
 */
export async function getOrgSkillTag(
  orgId: string,
  tagSlug: string
): Promise<OrgSkillTagEntry | null>
⋮----
/**
 * Returns all skill tags currently in the organization's pool.
 * Used by UI to display and manage the org's skill tag library.
 */
export async function getOrgSkillTags(orgId: string): Promise<OrgSkillTagEntry[]>
⋮----
// ---------------------------------------------------------------------------
// Org Skill Recognition queries
// ---------------------------------------------------------------------------
⋮----
/**
 * Returns the current recognition record for a specific member skill, or null.
 */
export async function getSkillRecognition(
  organizationId: string,
  accountId: string,
  skillId: string
): Promise<OrgSkillRecognitionRecord | null>
⋮----
/**
 * Returns all skill recognition records for a specific member within an org.
 * Includes both active and revoked records for full audit visibility.
 */
export async function getMemberSkillRecognitions(
  organizationId: string,
  accountId: string
): Promise<OrgSkillRecognitionRecord[]>
````

## File: src/features/skill-xp.slice/_tag-lifecycle.ts
````typescript
/**
 * skill-xp.slice — _tag-lifecycle.ts
 *
 * VS4_TAG_SUBSCRIBER [R3] — keeps SKILL_TAG_POOL up to date when TagLifecycleEvents arrive.
 *
 * Per logic-overview.md [R3] SKILL_TAG_POOL 更新路徑閉環:
 *   IER BACKGROUND_LANE → VS4_TAG_SUBSCRIBER → SKILL_TAG_POOL
 *
 * This subscriber is the explicit named handler the Event Funnel delegates to.
 * It stays within the skill-xp.slice boundary (切片內部消費, 不穿透邊界) and
 * MUST NOT import from other feature slices.
 *
 * Cross-org fan-out strategy:
 *   Firestore collectionGroup query on `tags` sub-collections lets us find every
 *   org that has activated the affected tagSlug without needing a global org list.
 *
 * Invariant T2: SKILL_TAG_POOL = Tag Authority's org-scope projection.
 *   Only passive sync here — no active tag creation.
 * Invariant #17: centralized-tag is the sole authority for tagSlug semantics.
 */
⋮----
import type {
  TagUpdatedPayload,
  TagDeprecatedPayload,
  TagDeletedPayload,
} from '@/features/shared-kernel';
import { db } from '@/shared/infra/firestore/firestore.client';
import {
  collectionGroup,
  query,
  where,
  getDocs,
  type QueryDocumentSnapshot,
} from '@/shared/infra/firestore/firestore.read.adapter';
⋮----
import {
  syncTagUpdateToPool,
  syncTagDeprecationToPool,
  syncTagDeletionToPool,
} from './_tag-pool';
import type { OrgSkillTagEntry } from './_tag-pool';
⋮----
// ---------------------------------------------------------------------------
// Internal helper — find all orgs that have activated a given tagSlug
// ---------------------------------------------------------------------------
⋮----
/**
 * Returns the list of orgIds that have activated the given tagSlug in their pool.
 *
 * Uses Firestore collectionGroup so we can fan-out without a global org list.
 * Requires a Firestore collectionGroup index on `tags` collection group with `tagSlug`.
 */
async function getOrgsWithTag(tagSlug: string): Promise<string[]>
⋮----
// ---------------------------------------------------------------------------
// Public subscriber handlers — called by projection.event-funnel [R3]
// ---------------------------------------------------------------------------
⋮----
/**
 * Handles a tag:updated event by syncing the new label to all org pools
 * that have activated this tag. [R3][T2]
 *
 * Uses Promise.allSettled so a failure in one org does not block others.
 * Called by registerTagFunnel() on IER BACKGROUND_LANE.
 */
export async function handleTagUpdatedForPool(
  payload: TagUpdatedPayload
): Promise<void>
⋮----
/**
 * Handles a tag:deprecated event by marking the tag as deprecated in all org pools. [R3][T2]
 *
 * Uses Promise.allSettled so a failure in one org does not block others.
 * Called by registerTagFunnel() on IER BACKGROUND_LANE.
 */
export async function handleTagDeprecatedForPool(
  payload: TagDeprecatedPayload
): Promise<void>
⋮----
/**
 * Handles a tag:deleted event by removing the tag from all org pools where
 * refCount is 0. [R3][T2]
 *
 * Uses Promise.allSettled so a failure in one org does not block others.
 * Called by registerTagFunnel() on IER BACKGROUND_LANE.
 */
export async function handleTagDeletedForPool(
  payload: TagDeletedPayload
): Promise<void>
````

## File: src/features/skill-xp.slice/_tag-pool.ts
````typescript
/**
 * skill-xp.slice — _tag-pool.ts
 *
 * Skill Tag Pool: organization-scoped view of the global Tag Authority Center.
 *
 * Per logic-overview.md (VS4):
 *   SKILL_TAG_POOL[("職能標籤庫\nskill-xp.slice\n= Tag Authority 的組織作用域快照\n消費 TagLifecycleEvent 被動更新")]
 *
 * v5 Role Change:
 *   - CENTRALIZED_TAG_AGGREGATE (centralized-tag) is now the global semantic dictionary
 *     and sole authority for tagSlug uniqueness (Invariant #17, A6, T2).
 *   - This pool is the org-scoped activation view: an org activates tags it wants to use
 *     and passively syncs label/category changes from TagLifecycleEvents.
 *   - On tag:deprecated or tag:deleted, the pool entry is updated/removed passively
 *     via syncPoolFromTagEvent() (called by projection.event-funnel).
 *
 * Stored at: orgSkillTagPool/{orgId}/tags/{tagSlug}
 *
 * Invariant T2: SKILL_TAG_POOL = Tag Authority's org-scope read projection;
 *   only tagSlugs from centralized-tag may be activated here.
 */
⋮----
import type { TagUpdatedPayload, TagDeprecatedPayload, TagDeletedPayload } from '@/features/shared-kernel';
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
import {
  setDocument,
  updateDocument,
  deleteDocument,
} from '@/shared/infra/firestore/firestore.write.adapter';
⋮----
// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
⋮----
/** A single entry in the org's skill tag pool. */
export interface OrgSkillTagEntry {
  orgId: string;
  /** Portable slug — must match a tagSlug from centralized-tag (Invariant T2). */
  tagSlug: string;
  /** Human-readable display name (snapshot from Tag Authority at activation time, kept in sync via TagLifecycleEvent). */
  tagName: string;
  /** Number of members/partners currently holding this tag. Guards against removal from pool. */
  refCount: number;
  /** Set when the global tag has been deprecated; org-level indicator (passive update T2). */
  deprecatedAt?: string;
  addedBy: string;
  addedAt: string;
}
⋮----
/** Portable slug — must match a tagSlug from centralized-tag (Invariant T2). */
⋮----
/** Human-readable display name (snapshot from Tag Authority at activation time, kept in sync via TagLifecycleEvent). */
⋮----
/** Number of members/partners currently holding this tag. Guards against removal from pool. */
⋮----
/** Set when the global tag has been deprecated; org-level indicator (passive update T2). */
⋮----
// ---------------------------------------------------------------------------
// Active domain operations (org explicitly activates a tag from Tag Authority)
// ---------------------------------------------------------------------------
⋮----
/**
 * Adds a skill tag to the organization pool.
 * The tagSlug MUST already exist in the global centralized-tag dictionary (Invariant T2).
 *
 * Enforces uniqueness: if the tag already exists, returns without error.
 * Tags are referenced by `tagSlug` — a portable, stable identifier.
 */
export async function addSkillTagToPool(
  orgId: string,
  tagSlug: string,
  tagName: string,
  addedBy: string
): Promise<void>
⋮----
if (existing) return; // idempotent — tag already present
⋮----
/**
 * Removes a skill tag from the pool.
 *
 * Deletion rule (Invariant A6): a tag with active references (refCount > 0)
 * cannot be deleted. Callers must release all member/partner assignments first.
 *
 * @throws Error when the tag has active references.
 */
export async function removeSkillTagFromPool(
  orgId: string,
  tagSlug: string
): Promise<void>
⋮----
if (!existing) return; // already absent — idempotent
⋮----
/**
 * Increments the reference count when a member/partner is assigned this tag.
 * Called by account-organization.member and account-organization.partner.
 */
export async function incrementTagRefCount(
  orgId: string,
  tagSlug: string
): Promise<void>
⋮----
/**
 * Decrements the reference count when a member/partner's tag assignment is removed.
 */
export async function decrementTagRefCount(
  orgId: string,
  tagSlug: string
): Promise<void>
⋮----
// ---------------------------------------------------------------------------
// Passive consumer operations (called by projection.event-funnel on TagLifecycleEvents)
// Invariant T2: SKILL_TAG_POOL passively reflects Tag Authority changes.
// ---------------------------------------------------------------------------
⋮----
/**
 * Syncs label/category update from the global Tag Authority into all org pools
 * that have activated this tag.
 * Called by registerTagFunnel() on `tag:updated`.
 */
export async function syncTagUpdateToPool(
  orgId: string,
  payload: TagUpdatedPayload
): Promise<void>
⋮----
if (!existing) return; // org has not activated this tag — no-op
⋮----
/**
 * Marks a pool entry as deprecated when the global tag is deprecated.
 * Called by registerTagFunnel() on `tag:deprecated`.
 * The entry is kept (consumers may still hold references) but flagged.
 */
export async function syncTagDeprecationToPool(
  orgId: string,
  payload: TagDeprecatedPayload
): Promise<void>
⋮----
/**
 * Removes a pool entry when the global tag is deleted.
 * Called by registerTagFunnel() on `tag:deleted`.
 * Only proceeds if refCount is 0; otherwise logs a warning (governance responsibility).
 */
export async function syncTagDeletionToPool(
  orgId: string,
  payload: TagDeletedPayload
): Promise<void>
⋮----
// Governance gap: global tag deleted while org still has active references.
// Do not delete pool entry; leave for reconciliation.
````

## File: src/features/skill-xp.slice/index.ts
````typescript
/**
 * skill-xp.slice — Public API
 *
 * Consolidated skill-XP domain: Account skill XP, Org Skill Recognition,
 * Skill Tag Pool, and Account Skill View projection.
 *
 * Per logic-overview.md [E1]:
 *   SERVER_ACTION_SKILL → ACCOUNT_SKILL_AGGREGATE → ACCOUNT_SKILL_XP_LEDGER
 *   _actions.ts (application coordinator) → ORGANIZATION_EVENT_BUS (via IER routing)
 *   Aggregate does NOT publish to cross-BC buses directly (Invariant #3).
 *
 * Invariants enforced by this slice:
 *   #11 — XP belongs to Account BC; published to Organization only via events.
 *   #12 — Tier is NEVER stored; derive with resolveSkillTier(xp) from shared.kernel.skill-tier.
 *   #13 — Every XP change produces a Ledger entry BEFORE the aggregate write.
 *   T2  — SKILL_TAG_POOL = Tag Authority's org-scope projection (passive sync only).
 *   #17 — centralized-tag is the sole authority for tagSlug semantics.
 */
⋮----
// ---------------------------------------------------------------------------
// Account XP Aggregate — Server Actions (entry point for UI/API callers)
// ---------------------------------------------------------------------------
⋮----
// ---------------------------------------------------------------------------
// Org Skill Tag Pool — Server Actions (Invariant T2)
// ---------------------------------------------------------------------------
⋮----
// ---------------------------------------------------------------------------
// Account XP Aggregate — domain operations (for other server-side slices)
// ---------------------------------------------------------------------------
⋮----
// ---------------------------------------------------------------------------
// XP Ledger types (for projectors that consume ledger entries)
// ---------------------------------------------------------------------------
⋮----
// ---------------------------------------------------------------------------
// Account Skill View Projector — called by projection.event-funnel [E1][S2]
// ---------------------------------------------------------------------------
⋮----
// ---------------------------------------------------------------------------
// Skill Tag Pool — active operations and passive sync
// ---------------------------------------------------------------------------
⋮----
// Passive consumer operations (called by projection.event-funnel on TagLifecycleEvents)
⋮----
// ---------------------------------------------------------------------------
// Org Skill Recognition Aggregate
// ---------------------------------------------------------------------------
⋮----
// ---------------------------------------------------------------------------
// Tag Lifecycle Subscriber — VS4_TAG_SUBSCRIBER [R3]
// Called by projection.event-funnel on IER BACKGROUND_LANE TagLifecycleEvents
// ---------------------------------------------------------------------------
⋮----
// ---------------------------------------------------------------------------
// Read queries (Account Skill View + Skill Tag Pool + Org Skill Recognition)
// ---------------------------------------------------------------------------
⋮----
// ---------------------------------------------------------------------------
// FR-K1: Personal skill profile panel (XP + tier visualization)
// ---------------------------------------------------------------------------
````

## File: src/features/workspace.slice/application/_command-handler.ts
````typescript
/**
 * workspace-application/_command-handler.ts
 *
 * Primary entry point for all workspace commands.
 * Orchestrates the full command processing pipeline:
 *   ScopeGuard → PolicyEngine → TransactionRunner → Outbox flush
 *
 * Per logic-overview.md:
 * - SERVER_ACTION →|發送 Command| WORKSPACE_COMMAND_HANDLER
 * - WORKSPACE_COMMAND_HANDLER → WORKSPACE_SCOPE_GUARD
 * - WORKSPACE_COMMAND_HANDLER --> TRACE_IDENTIFIER (Observability)
 * - WORKSPACE_SCOPE_GUARD → WORKSPACE_POLICY_ENGINE
 * - WORKSPACE_POLICY_ENGINE → WORKSPACE_TRANSACTION_RUNNER
 * - WORKSPACE_OUTBOX → WORKSPACE_EVENT_BUS
 * - Invariant #3: Application layer coordinates flow only — no domain rules.
 *
 * Usage example (from a Server Action or Client Action):
 * ```ts
 * const result = await executeCommand(
 *   { workspaceId, userId, action: 'tasks:create' },
 *   async (ctx) => {
 *     const id = await createTask(workspaceId, taskData);
 *     ctx.outbox.collect('workspace:tasks:completed', { task: { ...taskData, id } });
 *     return id;
 *   },
 *   publish  // WorkspaceEventBus.publish
 * );
 * ```
 */
⋮----
import { createTraceContext, logDomainError } from '@/features/observability';
⋮----
import { evaluatePolicy, type WorkspaceRole } from './_policy-engine';
import { checkWorkspaceAccess } from './_scope-guard';
import { runTransaction, type TransactionContext } from './_transaction-runner';
⋮----
export interface WorkspaceCommand {
  workspaceId: string;
  userId: string;
  /** Action identifier, e.g. "tasks:create", "finance:disburse", "issues:resolve" */
  action: string;
}
⋮----
/** Action identifier, e.g. "tasks:create", "finance:disburse", "issues:resolve" */
⋮----
/**
 * Application-layer executor result — returned by executeCommand.
 * NOTE: This is NOT the domain-level CommandResult from shared.kernel.contract-interfaces [R4].
 * The canonical CommandResult (CommandSuccess | CommandFailure discriminated union) lives in
 * shared.kernel.contract-interfaces and is used by _actions.ts exports.
 * This type is workspace-application-internal only; do NOT re-export it.
 */
export interface WorkspaceExecutorResult<T = void> {
  success: boolean;
  value?: T;
  error?: string;
}
⋮----
/**
 * Executes a workspace command through the full application pipeline.
 *
 * @param command - The command metadata (workspaceId, userId, action).
 * @param handler - Domain logic to execute inside the transaction context.
 * @param publish - Optional event bus publish function for Outbox flush.
 */
export async function executeCommand<T>(
  command: WorkspaceCommand,
  handler: (ctx: TransactionContext) => Promise<T>,
  publish?: (type: string, payload: unknown) => void
): Promise<WorkspaceExecutorResult<T>>
⋮----
// TRACE_IDENTIFIER — create trace context for this command chain
⋮----
// 1. Scope Guard — verify workspace access
⋮----
// 2. Policy Engine — evaluate action permission
⋮----
// 3. Transaction Runner — execute handler with event collection
⋮----
// 4. Outbox flush — deliver collected events to the event bus
````

## File: src/features/workspace.slice/application/_org-policy-cache.ts
````typescript
/**
 * workspace-application/_org-policy-cache.ts
 *
 * Local org-policy cache for the workspace application layer.
 *
 * Per logic-overview.md:
 *   ORGANIZATION_EVENT_BUS →|政策變更事件| WORKSPACE_ORG_POLICY_CACHE
 *   WORKSPACE_ORG_POLICY_CACHE →|更新本地 read model| WORKSPACE_SCOPE_READ_MODEL
 *
 * This cache listens to OrgPolicyChanged events via the org event bus and
 * keeps a local in-memory snapshot of org policies that the Policy Engine
 * can consult without a round-trip to Firestore.
 *
 * The cache also updates the workspace scope read model (projection.workspace-scope-guard)
 * when policy changes affect workspace-level permissions.
 */
⋮----
import type { OrgPolicyChangedPayload } from '@/features/organization.slice';
import { onOrgEvent } from '@/features/organization.slice';
import { upsertProjectionVersion } from '@/features/projection.bus';
⋮----
export interface OrgPolicyEntry {
  policyId: string;
  orgId: string;
  changeType: 'created' | 'updated' | 'deleted';
  changedBy: string;
  cachedAt: string;
}
⋮----
// In-process policy cache (survives for the life of the workspace session)
⋮----
/**
 * Returns the cached policy entry for a given policy ID, if available.
 */
export function getCachedOrgPolicy(policyId: string): OrgPolicyEntry | undefined
⋮----
/**
 * Returns all currently cached org policies.
 */
export function getAllCachedPolicies(): OrgPolicyEntry[]
⋮----
/**
 * Registers the org policy cache listener on the organization event bus.
 * Should be called once at workspace startup (from workspace-provider.tsx).
 *
 * Returns an unsubscribe function.
 */
export function registerOrgPolicyCache(): () => void
⋮----
// Signal to the Workspace Scope Read Model that org policies have changed.
// Invariant #7: Scope Guard reads only the local read model, so we bump
// the projection version so any cache layer knows to re-evaluate access.
⋮----
/**
 * Clears the entire policy cache.
 * Useful when workspace session ends or org changes.
 */
export function clearOrgPolicyCache(): void
````

## File: src/features/workspace.slice/application/_outbox.ts
````typescript
/**
 * workspace-application/_outbox.ts
 *
 * In-process transaction outbox: collects domain events during a transaction,
 * then flushes them to the workspace event bus after commit.
 *
 * Per logic-overview.md invariants #4a / #4b:
 * Domain Events are produced only by Aggregates (#4a); Transaction Runner only
 * collects already-produced events and delivers them to the Outbox (#4b).
 *
 * Flow: WORKSPACE_TRANSACTION_RUNNER →|彙整事件後寫入| WORKSPACE_OUTBOX → WORKSPACE_EVENT_BUS
 *
 * Firestore Persistence Layer [S1][E5]:
 * Events flagged in WS_OUTBOX_PERSISTED_EVENTS are ALSO written to the
 * `wsOutbox/{id}` Firestore collection so the OUTBOX_RELAY_WORKER [R1] can
 * deliver them to IER via STANDARD_LANE with at-least-once semantics.
 *
 * Per logic-overview.md WS_OB [SK_OUTBOX: SAFE_AUTO][E5]:
 *   WS_TX_R -->|"pending events [E5]"| WS_OB
 *   WS_OB -->|"STANDARD_LANE [E5]"| IER
 */
⋮----
import { logDomainError } from '@/features/observability';
import { buildIdempotencyKey, type DlqTier } from '@/features/shared-kernel';
import { setDocument } from '@/shared/infra/firestore/firestore.write.adapter';
⋮----
import type {
  WorkspaceEventName,
  WorkspaceEventPayloadMap,
} from '../core.event-bus';
⋮----
export type OutboxEvent = {
  [K in WorkspaceEventName]: { type: K; payload: WorkspaceEventPayloadMap[K] };
}[WorkspaceEventName];
⋮----
export interface Outbox {
  /** Collect a domain event produced by the aggregate. */
  collect<T extends WorkspaceEventName>(type: T, payload: WorkspaceEventPayloadMap[T]): void;
  /** Flush all collected events to the event bus. Does not modify internal state. */
  flush(publish: (type: string, payload: unknown) => void): void;
  /** Drain and return all collected events (empties the buffer). */
  drain(): OutboxEvent[];
}
⋮----
/** Collect a domain event produced by the aggregate. */
collect<T extends WorkspaceEventName>(type: T, payload: WorkspaceEventPayloadMap[T]): void;
/** Flush all collected events to the event bus. Does not modify internal state. */
flush(publish: (type: string, payload: unknown)
/** Drain and return all collected events (empties the buffer). */
drain(): OutboxEvent[];
⋮----
// =============================================================================
// Firestore persistence layer [S1][E5]
// =============================================================================
⋮----
/**
 * Events that require Firestore Outbox persistence for at-least-once delivery [S1].
 *
 * Per logic-overview.md WS_OB [E5]: ws-outbox is the sole IER delivery path.
 * Add new event types here when they require cross-process at-least-once semantics.
 *
 * All workspace outbox entries use SAFE_AUTO tier and STANDARD_LANE.
 * [logic-overview.md: WS_OB["ws-outbox [SK_OUTBOX: SAFE_AUTO]"]]
 */
⋮----
/** DLQ tier for all ws-outbox entries — per logic-overview.md WS_OB annotation. */
⋮----
/** IER lane for ws-outbox delivery — per logic-overview.md WS_OB [E5]. */
⋮----
/** Firestore collection path for the workspace outbox. */
⋮----
/** Typed shape of each `wsOutbox/{id}` Firestore document. */
interface WsOutboxDocument {
  outboxId: string;
  eventType: WorkspaceEventName;
  envelopeJson: string;
  lane: typeof WS_OUTBOX_IER_LANE;
  dlqTier: DlqTier;
  idempotencyKey: string;
  status: 'pending';
  createdAt: string;
  attemptCount: 0;
}
⋮----
/** Extracts the traceId from an event payload when present, for [R8] audit trail. */
function extractTraceIdFromPayload(payload: unknown): string | undefined
⋮----
/**
 * Writes a single event to the `wsOutbox` Firestore collection [S1][E5].
 *
 * This enables at-least-once delivery via the OUTBOX_RELAY_WORKER [R1]:
 *   wsOutbox(pending) --[RELAY]--> IER(STANDARD_LANE)
 *
 * Fire-and-forget — failures are logged via the Observability Layer but do NOT
 * block the in-process event bus (dual-write best-effort pattern).
 */
async function persistToWsOutbox(
  event: OutboxEvent,
  workspaceId: string,
): Promise<void>
⋮----
// `crypto.randomUUID()` is available in all target runtimes (Node 18+, modern browsers).
⋮----
// [S1] idempotencyKey = eventId + aggId + version (version 0 for initial write)
⋮----
// =============================================================================
// Direct persistence helper (for client-side handlers outside runTransaction)
// =============================================================================
⋮----
/**
 * Persists an outbox event directly to Firestore — for use by client-side handlers
 * (e.g. document-parser-view) that cannot go through `runTransaction` but still
 * need at-least-once delivery semantics [S1][E5].
 *
 * Only persists event types registered in `WS_OUTBOX_PERSISTED_EVENTS`.
 * Fire-and-forget — the caller is responsible for `.catch()` handling.
 */
export async function persistWorkspaceOutboxEvent<T extends WorkspaceEventName>(
  workspaceId: string,
  type: T,
  payload: WorkspaceEventPayloadMap[T],
): Promise<void>
⋮----
/** Creates a new in-process Outbox for use within a single transaction.
 *
 * @param workspaceId - When provided, events in WS_OUTBOX_PERSISTED_EVENTS are
 *   ALSO persisted to the `wsOutbox` Firestore collection for at-least-once
 *   delivery via the OUTBOX_RELAY_WORKER [R1][S1][E5].
 */
export function createOutbox(workspaceId?: string): Outbox
⋮----
collect<T extends WorkspaceEventName>(type: T, payload: WorkspaceEventPayloadMap[T])
⋮----
// [S1][E5] Persist to Firestore for at-least-once delivery via OUTBOX_RELAY_WORKER.
// Fire-and-forget: failures are logged but must not block the in-process flow.
⋮----
flush(publish: (type: string, payload: unknown) => void)
⋮----
// Flush without draining — caller decides when to drain
⋮----
drain()
````

## File: src/features/workspace.slice/application/_policy-engine.ts
````typescript
/**
 * workspace-application/_policy-engine.ts
 *
 * Evaluates workspace-level policies based on role and requested action.
 *
 * Per logic-overview.md:
 * - WORKSPACE_SCOPE_GUARD → WORKSPACE_POLICY_ENGINE → WORKSPACE_TRANSACTION_RUNNER
 * - Application layer coordinates flow only — no domain rules (invariant #3)
 *
 * Current: simple role-based capability model.
 * Future: extended with org-policy-cache (WORKSPACE_ORG_POLICY_CACHE) when
 * organization.slice (core.event-bus) delivers policy change events.
 */
⋮----
export type WorkspaceRole = 'Manager' | 'Contributor' | 'Viewer';
⋮----
export interface PolicyDecision {
  permitted: boolean;
  reason?: string;
}
⋮----
// Role → allowed action patterns (resource:action, resource:* = all actions)
⋮----
/**
 * Evaluates whether a role may perform a given action.
 *
 * @param role - The workspace role of the caller (from ScopeGuard).
 * @param action - The requested action, e.g. "tasks:create", "finance:disburse".
 */
export function evaluatePolicy(role: WorkspaceRole, action: string): PolicyDecision
⋮----
if (p === 'workspace:*') return true; // Manager wildcard
if (p === `${resource}:*`) return true; // Resource wildcard
return p === action; // Exact match
````

## File: src/features/workspace.slice/application/_scope-guard.ts
````typescript
/**
 * workspace-application/_scope-guard.ts
 *
 * Validates workspace access for a given caller.
 *
 * Per logic-overview.md invariant #7:
 * Scope Guard reads ONLY local read model — never directly from external event buses.
 *
 * Implementation: queries projection.workspace-scope-guard read model exclusively.
 * Prohibition #7 forbids reading any other slice's state (including the raw workspaces/ collection).
 */
⋮----
import { queryWorkspaceAccess } from '@/features/projection.bus';
⋮----
export interface ScopeGuardResult {
  allowed: boolean;
  role?: string;
  reason?: string;
}
⋮----
/**
 * Checks whether a user has active access to a workspace.
 * Reads ONLY from projection.workspace-scope-guard read model (Prohibition #7).
 *
 * Returns { allowed: true, role } on success, or { allowed: false, reason } on denial.
 * If the projection is not yet available, access is denied to preserve security invariants.
 */
export async function checkWorkspaceAccess(
  workspaceId: string,
  userId: string
): Promise<ScopeGuardResult>
⋮----
// Query the scope guard projection read model (the only authorised source per Prohibition #7)
⋮----
// Projection returned denial or is not yet built — deny access.
// Per Prohibition #7, we must NOT fall back to the raw workspaces/ aggregate.
// If the projection is unavailable, callers should retry after the projection is rebuilt.
````

## File: src/features/workspace.slice/application/_transaction-runner.ts
````typescript
/**
 * workspace-application/_transaction-runner.ts
 *
 * Runs domain command handlers in a transaction context.
 * Provides an Outbox for collecting domain events during execution.
 * After handler completion, appends all events to the workspace event store.
 *
 * Per logic-overview.md:
 * - WORKSPACE_POLICY_ENGINE → WORKSPACE_TRANSACTION_RUNNER
 * - WORKSPACE_TRANSACTION_RUNNER → WORKSPACE_AGGREGATE
 * - WORKSPACE_AGGREGATE → WORKSPACE_EVENT_STORE
 * - WORKSPACE_TRANSACTION_RUNNER →|彙整 Aggregate 未提交事件後寫入| WORKSPACE_OUTBOX
 * - WORKSPACE_TRANSACTION_RUNNER --> TRACE_IDENTIFIER (Observability)
 * - WORKSPACE_TRANSACTION_RUNNER --> DOMAIN_ERROR_LOG (Observability)
 * - Invariant #4b: Transaction Runner only delivers to Outbox; does not produce Domain Events.
 */
⋮----
import { generateTraceId, logDomainError } from '@/features/observability';
⋮----
import { appendDomainEvent } from '../core.event-store';
⋮----
import { createOutbox, type Outbox, type OutboxEvent } from './_outbox';
⋮----
export interface TransactionContext {
  workspaceId: string;
  /** Trace / correlation ID — shared with the Observability Layer (TRACE_IDENTIFIER node). */
  correlationId: string;
  /** Collect domain events produced by the aggregate during this transaction. */
  outbox: Outbox;
}
⋮----
/** Trace / correlation ID — shared with the Observability Layer (TRACE_IDENTIFIER node). */
⋮----
/** Collect domain events produced by the aggregate during this transaction. */
⋮----
export interface TransactionResult<T> {
  value: T;
  /** Events collected during the transaction (already appended to event store). */
  events: OutboxEvent[];
}
⋮----
/** Events collected during the transaction (already appended to event store). */
⋮----
/**
 * Executes a domain command handler inside a transaction context.
 *
 * 1. Creates a TraceContext via the Observability Layer (TRACE_IDENTIFIER node).
 * 2. Creates a fresh Outbox for event collection.
 * 3. Runs the handler (which executes aggregate logic and collects events).
 * 4. Drains and appends all collected events to the workspace event store.
 * 5. Returns the handler result + collected events (for Outbox flush to event bus).
 *
 * Errors are recorded via the Observability Layer (DOMAIN_ERROR_LOG node) before
 * being re-thrown so callers are not required to handle observability themselves.
 */
export async function runTransaction<T>(
  workspaceId: string,
  userId: string,
  handler: (ctx: TransactionContext) => Promise<T>,
  correlationId?: string
): Promise<TransactionResult<T>>
⋮----
// Drain events from the outbox and append to the event store (best-effort)
⋮----
// Event store append is best-effort — do not fail the command
````

## File: src/features/workspace.slice/application/index.ts
````typescript
// workspace-application — Command Handler · Scope Guard · Policy Engine · Transaction Runner · Outbox · Org Policy Cache
// NOTE: CommandResult (canonical discriminated union) lives in shared.kernel.contract-interfaces [R4][D10].
````

## File: src/features/workspace.slice/business.acceptance/_components/acceptance-view.tsx
````typescript
import { Trophy, CheckCircle2, Search, XCircle, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
⋮----
import { useAuth } from "@/shared/app-providers/auth-provider";
import { Badge } from "@/shared/shadcn-ui/badge";
import { Button } from "@/shared/shadcn-ui/button";
import type { WorkspaceTask } from "@/shared/types";
import { toast } from "@/shared/utility-hooks/use-toast";
⋮----
import { useWorkspace } from '../../core';
⋮----
const getErrorMessage = (error: unknown, fallback: string)
⋮----
/**
 * WorkspaceAcceptance - A-Track final delivery threshold.
 * Determines if a task truly qualifies for "Accepted" status.
 * ARCHITECTURE REFACTORED: Now consumes state from context and events.
 */
export function WorkspaceAcceptance()
⋮----
// 1. Independent State Hydration: Consumes task data from the parent context on mount.
⋮----
// 2. Event-Driven Updates: Subscribes to events for real-time changes.
⋮----
// A task enters this queue when QA approves it.
⋮----
// A task leaves this queue when it is failed (sent back to todo).
⋮----
// A task also leaves this queue when it is passed (accepted).
⋮----
const handleAccept = async (task: WorkspaceTask) =>
⋮----
const handleFail = async (task: WorkspaceTask) =>
````

## File: src/features/workspace.slice/business.acceptance/index.ts
````typescript

````

## File: src/features/workspace.slice/business.daily/_actions.ts
````typescript
/**
 * @fileoverview daily.commands.ts - Pure business logic for daily log interactions.
 * @description Contains framework-agnostic action functions for interactive features
 * on daily log entries. These functions can be called from React hooks, context,
 * or future Server Actions without any React dependencies.
 *
 * Per logic-overview.md [R4] COMMAND_RESULT_CONTRACT:
 *   All mutations return CommandResult discriminated union.
 */
⋮----
import {
  type CommandResult,
  commandSuccess,
  commandFailureFrom,
} from "@/features/shared-kernel";
import {
  toggleDailyLogLike,
  addDailyLogComment as addDailyLogCommentFacade,
} from "@/shared/infra/firestore/firestore.facade";
⋮----
/**
 * Toggles a like on a daily log entry.
 * @param accountId The ID of the organization account that owns the log.
 * @param logId The ID of the daily log entry.
 * @param userId The ID of the user performing the like/unlike.
 */
export async function toggleLike(
  accountId: string,
  logId: string,
  userId: string
): Promise<CommandResult>
⋮----
/**
 * Adds a comment to a daily log entry.
 * @param organizationId The ID of the organization that owns the log.
 * @param logId The ID of the daily log entry.
 * @param author The author information for the comment.
 * @param content The text content of the comment.
 */
export async function addDailyLogComment(
  organizationId: string,
  logId: string,
  author: { uid: string; name: string; avatarUrl?: string },
  content: string
): Promise<CommandResult>
````

## File: src/features/workspace.slice/business.daily/_bookmark-actions.ts
````typescript
/**
 * @fileoverview bookmark.commands.ts - Pure business logic for bookmark operations.
 * @description Contains framework-agnostic action functions for managing a user's
 * personal bookmarks. These functions can be called from React hooks, context,
 * or future Server Actions without any React dependencies.
 */
⋮----
import {
  addBookmark,
  removeBookmark,
} from "@/shared/infra/firestore/firestore.facade"
⋮----
/**
 * Toggles a bookmark for a given log entry.
 * @param userId The ID of the user performing the action.
 * @param logId The ID of the log entry to bookmark or unbookmark.
 * @param shouldBookmark Whether to add (true) or remove (false) the bookmark.
 */
export async function toggleBookmark(
  userId: string,
  logId: string,
  shouldBookmark: boolean
): Promise<void>
````

## File: src/features/workspace.slice/business.daily/_components/actions/bookmark-button.tsx
````typescript
/**
 * @fileoverview bookmark-button.tsx - A self-contained component for the "bookmark" action.
 * @description This component encapsulates all UI and logic for bookmarking a daily log.
 * It uses a dedicated hook to manage its state and interactions, providing instant
 * optimistic UI feedback and a loading state to prevent race conditions.
 */
⋮----
import { Bookmark, Loader2 } from "lucide-react";
import { useState, useEffect, useCallback } from 'react';
⋮----
import { cn } from "@/shared/lib";
import { Button } from "@/shared/shadcn-ui/button";
⋮----
import { useBookmarkActions } from '../../_hooks/use-bookmark-commands';
⋮----
interface BookmarkButtonProps {
  logId: string;
}
⋮----
// Sync local state with the source of truth from the hook
⋮----
// Optimistic UI update
⋮----
// Revert on error
````

## File: src/features/workspace.slice/business.daily/_components/actions/comment-button.tsx
````typescript
/**
 * @fileoverview comment-button.tsx - A functional component for the "comment" action.
 * @description This component displays the comment count and triggers an action when clicked.
 */
⋮----
import { MessageCircle } from "lucide-react";
⋮----
import { Button } from "@/shared/shadcn-ui/button";
⋮----
interface CommentButtonProps {
  count?: number;
  onClick: () => void;
}
````

## File: src/features/workspace.slice/business.daily/_components/actions/like-button.tsx
````typescript
/**
 * @fileoverview like-button.tsx - A self-contained component for the "like" action.
 * @description This component encapsulates all UI and logic for liking a daily log.
 * It uses optimistic UI updates for a fast, responsive user experience and ensures
 * state is synced with the backend to prevent inconsistencies.
 */
⋮----
import { Heart } from "lucide-react";
import { useState, useEffect, useCallback } from 'react';
⋮----
import { cn } from "@/shared/lib";
import { Button } from "@/shared/shadcn-ui/button";
import { type DailyLog, type Account } from "@/shared/types";
⋮----
import { useDailyActions } from '../../_hooks/use-daily-commands';
⋮----
interface LikeButtonProps {
  log: DailyLog;
  currentUser: Account | null;
}
⋮----
// Internal state for optimistic UI and to be synced with props
⋮----
// Effect to synchronize component state with prop changes from Firestore
⋮----
// Optimistic UI Update
⋮----
// Backend call
⋮----
// Revert on error by re-syncing with the original prop state
⋮----
className=
````

## File: src/features/workspace.slice/business.daily/_components/actions/share-button.tsx
````typescript
/**
 * @fileoverview share-button.tsx - A self-contained component for the "share/forward" action.
 * @description This component encapsulates all UI (a dropdown menu) and logic for
 * forwarding a daily log to other parts of the application via the event bus,
 * adhering to the single-responsibility principle.
 */
⋮----
import { Share2 } from "lucide-react";
⋮----
import { Button } from "@/shared/shadcn-ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/shadcn-ui/dropdown-menu";
import { type DailyLog } from "@/shared/types";
import { toast } from "@/shared/utility-hooks/use-toast";
⋮----
import { useWorkspace } from "../../../core";
⋮----
interface ShareButtonProps {
  log: DailyLog;
}
⋮----
export function ShareButton(
⋮----
const handleForward = (target: "tasks") =>
⋮----
<DropdownMenuItem onSelect=
````

## File: src/features/workspace.slice/business.daily/_components/composer.tsx
````typescript
// @/features/workspace-business.daily/_components/composer.tsx
/**
 * @fileoverview Composer - The shared input component for creating daily logs.
 * @description This component encapsulates the UI and logic for the text area,
 * image previews, and submission button for daily log creation. It is designed
 * to be a controlled component, receiving its state and callbacks via props.
 *
 * @responsibility
 * - Renders the main text input area and image upload UI.
 * - Displays image previews with a removal option.
 * - Delegates form submission and file selection events to its parent.
 */
⋮----
import { ImagePlusIcon, Send, Loader2, X } from "lucide-react";
import Image from "next/image";
⋮----
import { Button } from "@/shared/shadcn-ui/button";
import { Card } from "@/shared/shadcn-ui/card";
import { Input } from "@/shared/shadcn-ui/input";
import { Textarea } from "@/shared/shadcn-ui/textarea";
⋮----
interface DailyLogComposerProps {
  content: string;
  setContent: (content: string) => void;
  photos: File[];
  setPhotos: (photos: File[] | ((prev: File[]) => File[])) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}
⋮----
const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) =>
⋮----
const handleRemovePhoto = (index: number) =>
⋮----
<Image src=
⋮----
onClick=
````

## File: src/features/workspace.slice/business.daily/_components/daily-log-card.tsx
````typescript
// @/features/workspace-business.daily/_components/daily-log-card.tsx
/**
 * @fileoverview DailyLogCard - The preview card for a single daily log entry.
 * @description This is a "dumb component" responsible for the visual representation
 * of a log. It composes independent, single-responsibility action components.
 *
 * @responsibility
 * - Renders author info, image carousel, and truncated content.
 * - Composes and renders action buttons from the `actions/` directory.
 * - Triggers `onOpen` when the main card body is clicked.
 */
⋮----
import { useEffect, useState } from "react";
⋮----
import type { Timestamp } from "@/shared/ports";
import { Avatar, AvatarFallback } from "@/shared/shadcn-ui/avatar";
import { Card } from "@/shared/shadcn-ui/card";
import { type DailyLog, type Account } from "@/shared/types";
⋮----
import { BookmarkButton } from "./actions/bookmark-button";
import { CommentButton } from "./actions/comment-button";
import { LikeButton } from "./actions/like-button";
import { ImageCarousel } from "./image-carousel";
⋮----
// Import the new single-responsibility action components
⋮----
// Internal component for displaying workspace avatar
function WorkspaceAvatar(
⋮----
// Internal component to display relative time.
function TimeAgo(
⋮----
const update = () =>
⋮----
const intervalId = setInterval(update, 60000); // Update every minute
⋮----
interface DailyLogCardProps {
  log: DailyLog;
  currentUser: Account | null;
  onOpen: () => void;
}
⋮----
{/* 1. Header: Workspace and author info */}
⋮----
{/* 2. Media: Image carousel, triggers onOpen */}
⋮----
{/* 3. Actions: Compose self-contained action components */}
⋮----
{/* 4. Content, triggers onOpen */}
````

## File: src/features/workspace.slice/business.daily/_components/daily-log-dialog.tsx
````typescript
// @/features/workspace-business.daily/_components/daily-log-dialog.tsx
/**
 * @fileoverview Daily Log Dialog - The detailed view for a single log entry.
 * @description This component displays a single daily log in a modal dialog.
 * It composes independent, single-responsibility action components for user interactions.
 *
 * @responsibility
 * - Renders a large, focused view of a single `DailyLog`.
 * - Provides space for detailed content and all images.
 * - Composes and renders action buttons from the `actions/` directory.
 * - Manages its own open/close state.
 */
⋮----
import { CornerUpLeft, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
⋮----
import { useAuth } from "@/shared/app-providers/auth-provider";
import type { Timestamp } from "@/shared/ports";
import { Avatar, AvatarFallback } from "@/shared/shadcn-ui/avatar";
import { Button } from "@/shared/shadcn-ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/shadcn-ui/dialog";
import { ScrollArea } from "@/shared/shadcn-ui/scroll-area";
import { Textarea } from "@/shared/shadcn-ui/textarea";
import { type DailyLog, type DailyLogComment, type Account } from "@/shared/types";
import { toast } from "@/shared/utility-hooks/use-toast";
⋮----
import { addDailyLogComment } from "../_actions";
import { subscribeToDailyLogComments } from '../_queries';
⋮----
import { BookmarkButton } from "./actions/bookmark-button";
import { CommentButton } from './actions/comment-button';
import { LikeButton } from './actions/like-button';
import { ShareButton } from './actions/share-button';
import { ImageCarousel } from "./image-carousel";
⋮----
interface DailyLogDialogProps {
  log: DailyLog | null;
  currentUser: Account | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}
⋮----
// Internal component for displaying workspace avatar
function WorkspaceAvatar(
⋮----
// Internal component to display relative time.
function TimeAgo(
⋮----
const update = () =>
⋮----
const intervalId = setInterval(update, 60000); // Update every minute
⋮----
const handlePostComment = async () =>
⋮----
{/* Image Section */}
⋮----
{/* Content Section */}
⋮----
{/* Header */}
⋮----
{/* Content & Comments Body */}
⋮----
{/* Actions & Comment Input Footer */}
````

## File: src/features/workspace.slice/business.daily/_components/daily.account-view.tsx
````typescript
// [職責] Projection — Account 層跨 Workspace 聚合日誌牆 (全維度、唯讀)
/**
 * @fileoverview AccountDailyComponent - Aggregated daily log wall across all workspaces.
 * @description Smart container that fetches all daily logs for the active account and
 * renders them in a masonry-style layout. Manages dialog state for log detail view.
 *
 * @responsibility
 * - Fetches and sorts all daily logs for the account using the `useAggregatedLogs` hook.
 * - Manages the state for the `DailyLogDialog`.
 * - Renders the masonry layout for the log cards.
 */
⋮----
import { AlertCircle, MessageSquare } from "lucide-react";
import { useState } from "react";
⋮----
import { useApp } from "@/shared/app-providers/app-context";
import { useAuth } from "@/shared/app-providers/auth-provider";
import type { DailyLog } from "@/shared/types";
⋮----
import { WorkspaceProvider } from "../../core";
import { useAggregatedLogs } from "../_hooks/use-aggregated-logs";
⋮----
import { DailyLogCard } from "./daily-log-card";
import { DailyLogDialog } from "./daily-log-dialog";
⋮----
onOpen=
````

## File: src/features/workspace.slice/business.daily/_components/daily.view.tsx
````typescript
import { AccountDailyComponent } from "./daily.account-view";
⋮----
/**
 * AccountDailyView - Responsibility: The dynamic wall for the entire dimension.
 */
export default function AccountDailyView()
````

## File: src/features/workspace.slice/business.daily/_components/daily.workspace-view.tsx
````typescript
// [職責] Business — 單一 Workspace 日誌撰寫與檢視
⋮----
import { MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
⋮----
import { useWorkspace } from "../../core";
import { useWorkspaceDailyLog } from "../_hooks/use-workspace-daily";
⋮----
import { DailyLogComposer } from "./composer";
import { DailyLogCard } from "./daily-log-card";
⋮----
router.push(
````

## File: src/features/workspace.slice/business.daily/_components/image-carousel.tsx
````typescript
import Image from "next/image";
⋮----
import { Card, CardContent } from "@/shared/shadcn-ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/shared/shadcn-ui/carousel";
⋮----
interface ImageCarouselProps {
    images: string[];
}
````

## File: src/features/workspace.slice/business.daily/_hooks/use-aggregated-logs.ts
````typescript
import { useMemo } from "react";
⋮----
import type { DailyLog } from "@/shared/types";
⋮----
import { useAccount } from "../../core";
⋮----
export function useAggregatedLogs()
````

## File: src/features/workspace.slice/business.daily/_hooks/use-bookmark-commands.ts
````typescript
/**
 * @fileoverview use-bookmark-actions.ts - Hook for managing a user's personal bookmarks.
 * @description This hook provides logic for fetching, adding, and removing bookmarks,
 * which are stored in a dedicated subcollection for each user. It's self-contained
 * and loads its own data.
 */
⋮----
import { useState, useEffect, useCallback } from 'react';
⋮----
import { useAuth } from '@/shared/app-providers/auth-provider';
import { toast } from '@/shared/utility-hooks/use-toast';
⋮----
import { toggleBookmark as toggleBookmarkAction } from '../_bookmark-actions';
import { subscribeToBookmarks } from '../_queries';
⋮----
export function useBookmarkActions()
⋮----
// Re-throw to allow the UI to revert its state
````

## File: src/features/workspace.slice/business.daily/_hooks/use-daily-commands.ts
````typescript
// @/features/workspace-business.daily/_hooks/use-daily-commands.ts
/**
 * @fileoverview useDailyActions - A hook for managing actions on daily logs.
 * @description This hook centralizes business logic for interactive features
 * on daily log entries, such as liking or bookmarking. It acts as the bridge
 * between UI components and the infrastructure layer, respecting architectural
 * boundaries.
 *
 * @responsibility
 * - Provide simple functions for UI components to call (e.g., `toggleLike`).
 * - Handle user authentication checks.
 * - Call the appropriate infrastructure repository functions.
 * - (Future) Implement optimistic UI updates.
 */
⋮----
import { useCallback } from "react";
⋮----
import { useApp } from "@/shared/app-providers/app-context";
import { useAuth } from "@/shared/app-providers/auth-provider";
import { toast } from "@/shared/utility-hooks/use-toast";
⋮----
import { toggleLike as toggleLikeAction } from "../_actions";
⋮----
export function useDailyActions()
⋮----
// Here we would revert the optimistic update if it failed.
````

## File: src/features/workspace.slice/business.daily/_hooks/use-daily-upload.ts
````typescript
/**
 * @fileoverview useDailyUpload - A hook for handling daily log image uploads.
 * @description This hook abstracts the logic for compressing, uploading, and
 * retrieving download URLs for images associated with a daily log. It uses the
 * `useStorage` hook internally to interact with the storage infrastructure,
 * ensuring architectural boundaries are respected.
 *
 * @responsibility
 * - Encapsulate file upload logic specific to daily logs.
 * - Provide a simple interface for components to upload files.
 * - Handle upload state (loading, error, success).
 */
⋮----
import { useState, useCallback } from "react";
⋮----
import { useStorage } from "../../business.files";
import { useWorkspace } from "../../core";
⋮----
export function useDailyUpload()
⋮----
// Depending on the desired UX, you might want to throw the error
// or handle it by showing a toast notification here.
````

## File: src/features/workspace.slice/business.daily/_hooks/use-workspace-daily.ts
````typescript
// [職責] Business — 單一 Workspace 日誌撰寫與狀態邏輯
/**
 * @fileoverview useWorkspaceDailyLog - Hook for workspace-scoped daily log state and actions.
 * @description Encapsulates all data derivation, state management, and write actions
 * for the workspace daily log feature. Keeps the view component as a thin renderer.
 *
 * @responsibility
 * - Derive `localLogs` (filtered + sorted) from AccountContext.
 * - Manage composer state: `content`, `photos`.
 * - Handle log post (upload + write) via `useDailyUpload` and `useLogger`.
 */
⋮----
import { useState, useMemo } from "react";
⋮----
import { useAuth } from "@/shared/app-providers/auth-provider";
import { type DailyLog } from "@/shared/types";
import { toast } from "@/shared/utility-hooks/use-toast";
⋮----
import { useWorkspace } from "../../core";
import { useAccount } from "../../core";
import { useLogger } from "../../gov.audit";
⋮----
import { useDailyUpload } from "./use-daily-upload";
⋮----
const getErrorMessage = (error: unknown, fallback: string)
⋮----
export function useWorkspaceDailyLog()
⋮----
const handlePost = async () =>
````

## File: src/features/workspace.slice/business.daily/_queries.ts
````typescript
/**
 * @fileoverview workspace-business.daily — Read-only queries.
 * @description Server-side read functions for fetching daily log entries.
 * Callable from RSC pages, hooks, and context without React dependencies.
 *
 * Per logic-overview.md [R4]: read queries must NOT live in _actions.ts.
 */
⋮----
import { db } from '@/shared/infra/firestore/firestore.client';
import { getDailyLogs as getDailyLogsFacade } from "@/shared/infra/firestore/firestore.facade";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  type Unsubscribe,
} from "@/shared/infra/firestore/firestore.read.adapter";
import type { DailyLog, DailyLogComment } from "@/shared/types";
⋮----
/**
 * Fetches daily log entries for an account.
 * @param accountId The ID of the organization account.
 * @param limit Maximum number of logs to return (default: 30).
 */
export async function getDailyLogs(
  accountId: string,
  limit = 30
): Promise<DailyLog[]>
⋮----
/**
 * Opens a real-time listener on the comments subcollection of a daily log.
 * Calls `onUpdate` with the latest comment array on every change.
 */
export function subscribeToDailyLogComments(
  accountId: string,
  logId: string,
  onUpdate: (comments: DailyLogComment[]) => void,
): Unsubscribe
⋮----
/**
 * Opens a real-time listener on a user's bookmarks subcollection.
 * Calls `onUpdate` with a Set of bookmarked log IDs on every change.
 * Calls `onError` on subscription errors.
 */
export function subscribeToBookmarks(
  userId: string,
  onUpdate: (bookmarkedIds: Set<string>) => void,
  onError?: (error: Error) => void,
): Unsubscribe
````

## File: src/features/workspace.slice/business.daily/index.ts
````typescript
// Views
⋮----
// Hooks
⋮----
// Default (AccountDailyView) — used by app/dashboard/account/daily/page.tsx
⋮----
// Queries (read-only)
````

## File: src/features/workspace.slice/business.document-parser/_components/document-parser-view.tsx
````typescript
import { Loader2, UploadCloud, File as FileIcon, ClipboardList, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { useActionState, useTransition, useRef, useEffect, useCallback, useState, type ChangeEvent } from 'react';
⋮----
import type { WorkItem } from '@/app-runtime/ai/schemas/docu-parse';
import { logDomainError } from '@/features/observability';
import { Badge } from '@/shared/shadcn-ui/badge';
import { Button } from '@/shared/shadcn-ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/shadcn-ui/card';
import type { SourcePointer, ParsingIntent } from '@/shared/types';
import { useToast } from '@/shared/utility-hooks/use-toast';
⋮----
import { persistWorkspaceOutboxEvent } from '../../application/_outbox';
import { useWorkspace } from '../../core';
import {
  extractDataFromDocument,
  type ActionState,
} from '../_form-actions';
import { saveParsingIntent } from '../_intent-actions';
import { subscribeToParsingIntents } from '../_queries';
⋮----
function WorkItemsTable({
  initialData,
  onImport,
}: {
  initialData: WorkItem[];
onImport: ()
⋮----
export function WorkspaceDocumentParser()
⋮----
// Tracks the WorkspaceFile ID when a file is sent from the Files tab for full traceability
⋮----
// Tracks the original download URL (SourcePointer) for the Digital Twin ParsingIntent
⋮----
// Real-time ParsingIntent history (Digital Twin 解析合約 list)
⋮----
// Helper: trigger the AI extraction pipeline from a Firebase Storage URL.
// The URL is passed directly to the Server Action which fetches it server-side,
// avoiding the browser CORS restriction on Firebase Storage URLs.
⋮----
// On mount: if files-view queued a file via WorkspaceProvider context, auto-trigger.
// This bridges the cross-tab gap — subscriber only exists when this component is mounted.
// Deps intentionally empty: pendingParseFile/setPendingParseFile are stable React state
// references, triggerParseFromURL is stable via useCallback, and we only want to run once
// on mount (not re-run whenever pendingParseFile changes later).
⋮----
// eslint-disable-next-line react-hooks/exhaustive-deps
⋮----
// PARSING_INTENT -->|解析異常| TRACK_B_ISSUES
⋮----
// Subscribe to files:sendToParser — handles same-tab publishes (edge case fallback).
// The primary cross-tab path uses WorkspaceProvider pendingParseFile state.
⋮----
const handleFileChange = (event: ChangeEvent<HTMLInputElement>) =>
⋮----
const handleUploadClick = () =>
⋮----
const handleImport = async () =>
⋮----
// Omit discount entirely when undefined to avoid Firestore "Unsupported field value: undefined"
⋮----
// SourcePointer: immutable link to the original file in Firebase Storage
⋮----
// Publish event with intentId so tasks and schedule proposals can reference the Digital Twin.
// skillRequirements is omitted here — the current AI flow extracts invoice line items only.
// When the AI flow is extended to extract skill requirements, pass them here.
⋮----
// Dispatch IntentDeltaProposed [#A4] — at-least-once delivery via wsOutbox [S1][E5].
// This cross-BC event notifies external consumers (e.g. scheduling.slice) that a new
// Digital Twin delta is available, without exposing document-parser internals [D7].
⋮----
// Reset source file references after successful import
⋮----
{/* ParsingIntent History — Digital Twin 解析合約 */}
````

## File: src/features/workspace.slice/business.document-parser/_form-actions.ts
````typescript
import { z } from 'zod';
⋮----
import { extractInvoiceItems } from '@/app-runtime/ai/flows/extract-invoice-items';
import type { WorkItem } from '@/app-runtime/ai/schemas/docu-parse';
⋮----
// [SEC-3] Allowlist for server-side file fetches to prevent SSRF.
// Only Firebase Storage hostnames are permitted.
⋮----
function isAllowedStorageUrl(url: string): boolean
⋮----
// Must be HTTPS, an allowed host, no embedded credentials, no non-standard port
⋮----
export type ActionState = {
  data?: { workItems: WorkItem[] };
  error?: string;
  fileName?: string;
};
⋮----
export async function extractDataFromDocument(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState>
⋮----
// Resolve the file buffer: either from a direct File upload or by fetching a
// Firebase Storage URL on the server (no CORS restrictions in Node.js).
⋮----
// [SEC-3] Validate URL against the Firebase Storage allowlist before fetching.
⋮----
// Prefer the authoritative content-type from the server response; fall
// back to the client-provided fileType only when the header is absent.
⋮----
// [SEC-1] Log a safe message only — do not log the raw error object which
// may contain internal path details or sensitive request metadata.
⋮----
// Sanitize AI output: coerce numeric strings to numbers and drop rows where
// required fields are still missing after coercion. This prevents TypeError
// in the UI (undefined.toLocaleString) and Firestore rejections (undefined).
const toNum = (v: unknown, fallback: number): number =>
⋮----
// quantity 0 is invalid for an invoice line — default to 1
⋮----
// 0 is a valid price (e.g. free/fully-discounted) — only fall back when null/undefined
⋮----
// [SEC-1] Log a safe message only — do not log the raw error object which
// may expose internal AI model details or stack traces to server logs.
````

## File: src/features/workspace.slice/business.document-parser/_intent-actions.ts
````typescript
/**
 * @fileoverview intent-actions.ts — Firestore CRUD for ParsingIntent (Digital Twin).
 * @description Called from the document-parser client component to persist parse results
 * before they are dispatched to the workspace event bus.
 * No 'use server' — runs in the browser with the authenticated user's Firestore context.
 */
⋮----
import type { SkillRequirement } from '@/features/shared-kernel'
import {
  createParsingIntent as createParsingIntentFacade,
  updateParsingIntentStatus as updateParsingIntentStatusFacade,
} from '@/shared/infra/firestore/firestore.facade'
import type { ParsedLineItem, IntentID, SourcePointer } from '@/shared/types'
⋮----
export async function saveParsingIntent(
  workspaceId: string,
  sourceFileName: string,
  lineItems: ParsedLineItem[],
  options?: {
    sourceFileDownloadURL?: SourcePointer
    sourceFileId?: string
    skillRequirements?: SkillRequirement[]
  }
): Promise<IntentID>
⋮----
export async function markParsingIntentImported(
  workspaceId: string,
  intentId: string
): Promise<void>
````

## File: src/features/workspace.slice/business.document-parser/_queries.ts
````typescript
/**
 * @fileoverview workspace-business.document-parser — Real-time Firestore subscription.
 *
 * Provides a reactive subscription to the `parsingIntents` subcollection so that
 * the DocumentParser view can display a live history of all ParsingIntents
 * (Digital Twin 解析合約) without additional one-shot fetches.
 *
 * Path: workspaces/{workspaceId}/parsingIntents/{intentId}
 */
⋮----
import { db } from '@/shared/infra/firestore/firestore.client';
import { collection, query, orderBy, onSnapshot, type Unsubscribe } from '@/shared/infra/firestore/firestore.read.adapter';
import type { ParsingIntent } from '@/shared/types';
⋮----
/**
 * Opens a real-time listener on the workspace parsingIntents subcollection.
 * @param workspaceId The workspace whose intents to subscribe to.
 * @param onUpdate    Callback receiving the latest intent array on every update.
 * @returns An unsubscribe function — call it on component unmount.
 */
export function subscribeToParsingIntents(
  workspaceId: string,
  onUpdate: (intents: ParsingIntent[]) => void
): Unsubscribe
````

## File: src/features/workspace.slice/business.document-parser/index.ts
````typescript

````

## File: src/features/workspace.slice/business.files/_actions.ts
````typescript
/**
 * @fileoverview workspace-business.files — Firestore CRUD actions.
 *
 * Wraps createWorkspaceFile, addWorkspaceFileVersion, and
 * restoreWorkspaceFileVersion so that UI components (files-view.tsx) do not
 * import from @/shared/infra directly.
 *
 * [D3]  All mutations live here — not in _components/.
 * [D5]  UI components must not import src/shared/infra; use this module.
 * [R4]  All exported functions return CommandResult (commandSuccess / commandFailureFrom).
 */
⋮----
import {
  type CommandResult,
  commandFailureFrom,
  commandSuccess,
} from '@/features/shared-kernel';
import {
  createWorkspaceFile as createFileFacade,
  addWorkspaceFileVersion as addVersionFacade,
  restoreWorkspaceFileVersion as restoreVersionFacade,
} from '@/shared/infra/firestore/firestore.facade';
import { serverTimestamp } from '@/shared/infra/firestore/firestore.write.adapter';
import type { WorkspaceFile, WorkspaceFileVersion } from '@/shared/types';
⋮----
export type CreateWorkspaceFileInput = Omit<WorkspaceFile, 'id' | 'updatedAt'>;
⋮----
/**
 * Creates a new file document in the workspace files subcollection.
 * Adds a server-generated `updatedAt` sentinel automatically so that UI
 * components do not need to import `serverTimestamp` from the infra layer.
 *
 * [R4] Returns CommandResult so callers handle failures without try/catch.
 *
 * @param workspaceId The ID of the workspace.
 * @param fileData    File metadata without `id` or `updatedAt`.
 */
export async function createWorkspaceFile(
  workspaceId: string,
  fileData: CreateWorkspaceFileInput
): Promise<CommandResult>
⋮----
/**
 * Appends a new version to an existing workspace file and marks it as current.
 *
 * [R4] Returns CommandResult so callers handle failures without try/catch.
 *
 * @param workspaceId      The ID of the workspace.
 * @param fileId           The ID of the file document.
 * @param version          The new version object to append.
 * @param currentVersionId The versionId to mark as the active version.
 */
export async function addWorkspaceFileVersion(
  workspaceId: string,
  fileId: string,
  version: WorkspaceFileVersion,
  currentVersionId: string
): Promise<CommandResult>
⋮----
/**
 * Restores a workspace file to a specific past version by updating
 * `currentVersionId`.
 *
 * [R4] Returns CommandResult so callers handle failures without try/catch.
 *
 * @param workspaceId The ID of the workspace.
 * @param fileId      The ID of the file document.
 * @param versionId   The versionId to restore as the active version.
 */
export async function restoreWorkspaceFileVersion(
  workspaceId: string,
  fileId: string,
  versionId: string
): Promise<CommandResult>
````

## File: src/features/workspace.slice/business.files/_components/files-view.tsx
````typescript
import { 
  FileText, 
  UploadCloud, 
  Clock, 
  History, 
  RotateCcw, 
  Trash2, 
  MoreVertical,
  ImageIcon,
  FileArchive,
  FileCode,
  FileJson,
  User,
  CheckCircle2,
  AlertCircle,
  Download,
  Loader2,
  FileScan,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
⋮----
import { useAuth } from "@/shared/app-providers/auth-provider";
import { ROUTES } from "@/shared/constants/routes";
import { cn, formatBytes } from "@/shared/lib";
import { Badge } from "@/shared/shadcn-ui/badge";
import { Button } from "@/shared/shadcn-ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/shadcn-ui/dropdown-menu";
import { ScrollArea } from "@/shared/shadcn-ui/scroll-area";
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle 
} from "@/shared/shadcn-ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/shadcn-ui/table";
import type { WorkspaceFile, WorkspaceFileVersion } from "@/shared/types";
import { toast } from "@/shared/utility-hooks/use-toast";
⋮----
import { useWorkspace } from '../../core';
import {
  createWorkspaceFile,
  addWorkspaceFileVersion,
  restoreWorkspaceFileVersion,
} from '../_actions';
import { subscribeToWorkspaceFiles } from '../_queries';
import { uploadRawFile } from '../_storage-actions';
⋮----
const getErrorMessage = (error: unknown, fallback: string)
⋮----
/**
 * WorkspaceFiles - High-sensory file version governance center.
 * Features: Smart type detection, version history visualization, and instant sovereignty restoration.
 */
⋮----
// Real-time subscription to the files subcollection.
// workspace.files (workspace document field) is not populated by the onSnapshot
// on the workspace collection — files live in the `workspaces/{id}/files` subcollection.
⋮----
const getFileIcon = (fileName: string) =>
⋮----
const handleUploadClick = () =>
⋮----
const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) =>
⋮----
// --- Versioning Logic ---
⋮----
// --- New File Logic ---
⋮----
// Reset file input
⋮----
const handleRestore = async (file: WorkspaceFile, versionId: string) =>
⋮----
<DropdownMenuItem onClick=
⋮----
// Store the file payload in WorkspaceProvider context so the
// document-parser tab can pick it up on mount.  The event bus
// subscriber only exists when document-parser is already rendered
// (same @businesstab slot), so we bridge the gap via context state.
⋮----
<div className=
````

## File: src/features/workspace.slice/business.files/_hooks/use-storage.ts
````typescript
import { useCallback } from 'react';
⋮----
import { useApp } from '@/shared/app-providers/app-context';
⋮----
import {
  uploadDailyPhoto as uploadDailyPhotoAction,
  uploadTaskAttachment as uploadTaskAttachmentAction,
} from '../_storage-actions';
⋮----
/**
 * @fileoverview A hook for abstracting file storage operations.
 * This hook acts as the designated bridge between UI components and the
 * underlying storage infrastructure, ensuring components do not directly
 * interact with SDKs, thus adhering to architectural boundaries.
 */
export function useStorage(workspaceId: string)
⋮----
/**
   * Uploads a photo for a daily log entry.
   * @param file The File object to upload.
   * @returns A promise that resolves with the public download URL of the uploaded file.
   */
⋮----
// Delegates the actual upload logic to the actions layer.
⋮----
/**
   * Uploads an image attachment for a workspace task.
   * @param file The file to upload.
   * @returns A promise resolving to the public download URL of the file.
   */
````

## File: src/features/workspace.slice/business.files/_hooks/use-workspace-filters.ts
````typescript
// [職責] 封裝搜尋與過濾邏輯
⋮----
import { useMemo, useDeferredValue } from "react";
⋮----
import type { Workspace } from "@/shared/types";
⋮----
export function useWorkspaceFilters(
  workspaces: Workspace[],
  searchQuery: string
)
````

## File: src/features/workspace.slice/business.files/_queries.ts
````typescript
/**
 * @fileoverview workspace-business.files — Queries and real-time Firestore subscriptions.
 *
 * Provides a reactive subscription to the `files` subcollection so that
 * `WorkspaceFiles` components reflect uploads and version updates instantly
 * without relying on the workspace document's optional `files` map field.
 *
 * Also exposes a one-shot read query for server-side consumption (RSC pages, loaders).
 *
 * Path: workspaces/{workspaceId}/files/{fileId}
 */
⋮----
import { db } from '@/shared/infra/firestore/firestore.client';
import { getWorkspaceFiles as getWorkspaceFilesFacade } from '@/shared/infra/firestore/firestore.facade';
import { collection, query, orderBy, onSnapshot, type Unsubscribe } from '@/shared/infra/firestore/firestore.read.adapter';
import type { WorkspaceFile } from '@/shared/types';
⋮----
/**
 * Opens a real-time listener on the workspace files subcollection.
 * Calls `onUpdate` with the sorted file list on every change.
 *
 * @param workspaceId The workspace whose files to subscribe to.
 * @param onUpdate    Callback receiving the latest file array on every update.
 * @returns An unsubscribe function — call it on component unmount.
 */
export function subscribeToWorkspaceFiles(
  workspaceId: string,
  onUpdate: (files: WorkspaceFile[]) => void
): Unsubscribe
⋮----
/**
 * One-shot read of the workspace file manifest.
 * Suitable for RSC pages and server-side loaders.
 *
 * @param workspaceId The ID of the workspace.
 */
export async function getWorkspaceFiles(workspaceId: string): Promise<WorkspaceFile[]>
````

## File: src/features/workspace.slice/business.files/_storage-actions.ts
````typescript
/**
 * @fileoverview storage.commands.ts - Pure business logic for file storage operations.
 * @description Contains framework-agnostic action functions for uploading files to
 * Firebase Storage. These functions can be called from React hooks, context, or
 * future Server Actions without any React dependencies.
 */
⋮----
import {
  uploadDailyPhoto as uploadDailyPhotoFacade,
  uploadTaskAttachment as uploadTaskAttachmentFacade,
  uploadProfilePicture as uploadProfilePictureFacade,
  uploadWorkspaceDocument,
} from "@/shared/infra/storage/storage.facade"
⋮----
/**
 * Uploads a photo for a daily log entry.
 * @param accountId The ID of the organization account.
 * @param workspaceId The ID of the workspace.
 * @param file The File object to upload.
 * @returns A promise resolving with the public download URL.
 */
export async function uploadDailyPhoto(
  accountId: string,
  workspaceId: string,
  file: File
): Promise<string>
⋮----
/**
 * Uploads a file as an attachment for a workspace task.
 * @param workspaceId The ID of the workspace.
 * @param file The file to upload.
 * @returns A promise resolving with the public download URL.
 */
export async function uploadTaskAttachment(
  workspaceId: string,
  file: File
): Promise<string>
⋮----
/**
 * Uploads a user's profile picture.
 * @param userId The ID of the user.
 * @param file The image file to upload.
 * @returns A promise resolving with the public download URL.
 */
export async function uploadProfilePicture(
  userId: string,
  file: File
): Promise<string>
⋮----
/**
 * Uploads a raw workspace document to Firebase Storage.
 *
 * Single-responsibility boundary for workspace-business.files:
 * all Firebase Storage SDK interaction lives in the storage facade and adapters,
 * not in UI components.
 *
 * @param workspaceId The workspace that owns the file.
 * @param fileId      The logical file document ID (stable across versions).
 * @param versionId   A unique ID for this specific version upload.
 * @param file        The raw file to store.
 * @returns A promise resolving with the public download URL for this version.
 */
export async function uploadRawFile(
  workspaceId: string,
  fileId: string,
  versionId: string,
  file: File
): Promise<string>
````

## File: src/features/workspace.slice/business.files/index.ts
````typescript

````

## File: src/features/workspace.slice/business.finance/_components/finance-view.tsx
````typescript
import { Wallet, Landmark, TrendingUp, CheckCircle2, AlertCircle, ArrowUpRight, FileSearch } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
⋮----
import { Badge } from "@/shared/shadcn-ui/badge";
import { Button } from "@/shared/shadcn-ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/shadcn-ui/card";
import { type WorkspaceTask } from "@/shared/types";
import { toast } from "@/shared/utility-hooks/use-toast";
⋮----
import { useWorkspace } from '../../core';
⋮----
type ParsedFinanceItem = {
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  sourceDocument: string;
  intentId: string;
};
⋮----
/**
 * WorkspaceFinance - Handles fund disbursement and budget tracking after acceptance.
 * Wired connections:
 * - workspace:acceptance:passed → accepted tasks queue
 * - workspace:document-parser:itemsExtracted → financial directives from parsing (PARSING_INTENT → TRACK_A_FINANCE)
 * - workspace:finance:disburseFailed → published to B-track on failure (TRACK_A_FINANCE → TRACK_B_ISSUES)
 */
⋮----
// Financial directives received directly from the document parser (PARSING_INTENT → TRACK_A_FINANCE)
⋮----
// 1. Independent State Hydration: Consumes task data from the parent context on mount.
⋮----
// 2. Event-Driven Updates: Subscribes to events for real-time changes.
⋮----
// PARSING_INTENT -->|財務指令| TRACK_A_FINANCE
// Receive financial line items directly from the parser for pre-acceptance visibility.
⋮----
const handleDisburse = async (task: WorkspaceTask) =>
⋮----
// TRACK_A_FINANCE -->|異常| TRACK_B_ISSUES — publish failure event for event handler to create B-track issue
````

## File: src/features/workspace.slice/business.finance/index.ts
````typescript

````

## File: src/features/workspace.slice/business.issues/_actions.ts
````typescript
/**
 * @fileoverview issue.commands.ts - Pure business logic for workspace issue operations.
 * @description Contains framework-agnostic action functions for creating issues and
 * posting comments. These functions can be called from React hooks, context, or
 * future Server Actions without any React dependencies.
 */
⋮----
import {
  type CommandResult,
  commandSuccess,
  commandFailureFrom,
} from '@/features/shared-kernel';
import {
  createIssue as createIssueFacade,
  addCommentToIssue as addCommentToIssueFacade,
  resolveIssue as resolveIssueFacade,
} from "@/shared/infra/firestore/firestore.facade"
⋮----
export async function createIssue(
  workspaceId: string,
  title: string,
  type: "technical" | "financial",
  priority: "high" | "medium",
  sourceTaskId?: string
): Promise<CommandResult>
⋮----
export async function addCommentToIssue(
  workspaceId: string,
  issueId: string,
  author: string,
  content: string
): Promise<CommandResult>
⋮----
export async function resolveIssue(
  workspaceId: string,
  issueId: string
): Promise<CommandResult>
````

## File: src/features/workspace.slice/business.issues/_components/issues-view.tsx
````typescript
import { format } from "date-fns";
import { AlertCircle, Plus, ArrowRight, ShieldAlert, DollarSign, PenTool, MessageSquare, CornerUpLeft, CheckCircle2 } from "lucide-react";
import { useMemo, useState } from "react";
⋮----
import { useAuth } from "@/shared/app-providers/auth-provider";
import { Badge } from "@/shared/shadcn-ui/badge";
import { Button } from "@/shared/shadcn-ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/shared/shadcn-ui/dialog";
import { Input } from "@/shared/shadcn-ui/input";
import { Label } from "@/shared/shadcn-ui/label";
import { ScrollArea } from "@/shared/shadcn-ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/shadcn-ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/shared/shadcn-ui/sheet";
import { Textarea } from "@/shared/shadcn-ui/textarea";
import { type WorkspaceIssue } from "@/shared/types";
import { toast } from "@/shared/utility-hooks/use-toast";
⋮----
import { useWorkspace } from '../../core';
⋮----
const getErrorMessage = (error: unknown, fallback: string)
⋮----
export function WorkspaceIssues()
⋮----
const handleAddIssue = async () =>
⋮----
const handleAddComment = async () =>
⋮----
const handleResolveIssue = async (issue: WorkspaceIssue) =>
⋮----
// Outbox pattern: resolveIssue routes through Transaction Runner in workspace context.
// The workspace:issues:resolved event is collected in the Outbox and flushed to the
// Event Bus only after the Firestore write commits — no direct publish from the view.
⋮----
const getIssueIcon = (type: string) =>
````

## File: src/features/workspace.slice/business.issues/index.ts
````typescript
// Actions (server)
````

## File: src/features/workspace.slice/business.parsing-intent/_contract.test.ts
````typescript
/**
 * @fileoverview Tests for ParsingIntentContract — Digital Twin [#A4]
 *
 * Validates that:
 *   1. createParsingIntentContract produces a valid contract with SkillRequirement[] [#A4][TE_SK]
 *   2. skillRequirements defaults to [] when not provided
 *   3. markParsingIntentImported transitions status to 'imported'
 *   4. supersedeParsingIntent transitions status to 'superseded'
 *   5. Immutability — operations return new objects without mutating the original
 *
 * Tags: [#A4] Digital Twin contract, [TE_SK] task::skill anchor, [A5] Scheduling Saga
 */
⋮----
import { describe, it, expect } from 'vitest';
⋮----
import type { SkillRequirement } from '@/features/shared-kernel';
import {
  createParsingIntentContract,
  markParsingIntentImported,
  supersedeParsingIntent,
} from '@/features/workspace.slice/business.parsing-intent/_contract';
import type { IntentDeltaProposedPayload } from '@/features/workspace.slice/core.event-bus';
⋮----
// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
⋮----
// ---------------------------------------------------------------------------
// createParsingIntentContract
// ---------------------------------------------------------------------------
⋮----
// ---------------------------------------------------------------------------
// markParsingIntentImported
// ---------------------------------------------------------------------------
⋮----
// Ensure a detectable time difference
⋮----
// ---------------------------------------------------------------------------
// supersedeParsingIntent
// ---------------------------------------------------------------------------
⋮----
// Original v1 still pending (not mutated)
⋮----
// ---------------------------------------------------------------------------
// IntentDeltaProposedPayload contract [#A4 — Digital Twin event]
// ---------------------------------------------------------------------------
⋮----
// Mirrors the shape built in handleImport() — prevents shape drift
const simulatedDispatch = (
      intentId: string,
      workspaceId: string,
      sourceFileName: string,
      taskDraftCount: number,
): IntentDeltaProposedPayload => (
````

## File: src/features/workspace.slice/business.parsing-intent/_contract.ts
````typescript
import type { SkillRequirement } from '@/features/shared-kernel';
⋮----
export type ParsingIntentStatus = 'pending' | 'imported' | 'superseded';
⋮----
export interface ParsingIntentContract {
  intentId: string;
  workspaceId: string;
  sourceFileId: string;
  sourceVersionId: string;
  taskDraftCount: number;
  skillRequirements: SkillRequirement[];
  status: ParsingIntentStatus;
  supersedesIntentId?: string;
  createdAt: number;
  updatedAt: number;
}
⋮----
export interface CreateParsingIntentInput {
  intentId: string;
  workspaceId: string;
  sourceFileId: string;
  sourceVersionId: string;
  taskDraftCount: number;
  skillRequirements?: SkillRequirement[];
}
⋮----
export function createParsingIntentContract(
  input: CreateParsingIntentInput
): ParsingIntentContract
⋮----
export function markParsingIntentImported(
  current: ParsingIntentContract
): ParsingIntentContract
⋮----
export function supersedeParsingIntent(
  current: ParsingIntentContract,
  nextIntentId: string
): ParsingIntentContract
````

## File: src/features/workspace.slice/business.parsing-intent/architecture-compliance.test.ts
````typescript
/**
 * @test Architecture compliance — VS5×VS6 integration invariants
 *
 * Verifies that the key structural requirements established by the problem statement
 * are correctly implemented in the domain model and event contracts:
 *
 *  [#A4] Digital Twin Protocol — ParsingIntent emits domain events with SourcePointer
 *  [S2]  aggregateVersion — WorkspaceTask supports optimistic concurrency
 *  [TE_SK] tag::skill — tasks carry SkillRequirement[] for VS6 eligibility gate
 *  [D24] Firebase ACL — no direct firebase/firestore imports in feature slices
 *  [D7]  Cross-slice integrity — scheduling reads workspace data via projection only
 *
 * Note: These are structural/contract tests. They verify that the implementation
 * has the correct shape without requiring a live Firebase connection.
 */
⋮----
import { describe, it, expect } from 'vitest';
⋮----
// ─── [#A4] ParsingIntentContract structural shape ─────────────────────────────
import type { WorkspaceScheduleProposedPayload } from '@/features/shared-kernel';
import type { SkillRequirement } from '@/features/shared-kernel';
import type { ParsingIntentContract } from '@/features/workspace.slice/business.parsing-intent/_contract';
import { createParsingIntentContract } from '@/features/workspace.slice/business.parsing-intent/_contract';
import type {
  IntentDeltaProposedPayload,
  WorkspaceTaskAssignedPayload,
} from '@/features/workspace.slice/core.event-bus/_events';
⋮----
// ─── Cross-BC contracts ────────────────────────────────────────────────────────
⋮----
// ─── D24 helpers ──────────────────────────────────────────────────────────────
⋮----
/** Recursively collect all .ts/.tsx source files under a directory, excluding tests and node_modules. */
function collectSourceFiles(dir: string): string[]
⋮----
/** Returns files that import directly from 'firebase/firestore' or 'firebase/app'. */
function findDirectFirebaseImports(dir: string): string[]
⋮----
// ─── Tests ────────────────────────────────────────────────────────────────────
⋮----
// ──────────────────────────────────────────────────────────────────────────
// [#A4] ParsingIntentContract — SourcePointer + SkillRequirements
// ──────────────────────────────────────────────────────────────────────────
⋮----
// SourcePointer [#A4]: must point to the originating file
⋮----
// ──────────────────────────────────────────────────────────────────────────
// [#A4] IntentDeltaProposedPayload — event payload structural shape
// ──────────────────────────────────────────────────────────────────────────
⋮----
// TypeScript compile-time proof — if this compiles, the interface exists
⋮----
// ──────────────────────────────────────────────────────────────────────────
// [TE_SK] WorkspaceTaskAssignedPayload — skill propagation [A5][P4]
// ──────────────────────────────────────────────────────────────────────────
⋮----
// ──────────────────────────────────────────────────────────────────────────
// [A5] WorkspaceScheduleProposedPayload — cross-BC scheduling contract
// ──────────────────────────────────────────────────────────────────────────
⋮----
// ──────────────────────────────────────────────────────────────────────────
// [D24] Firebase ACL compliance — feature slices must not import firebase directly
// ──────────────────────────────────────────────────────────────────────────
⋮----
// ──────────────────────────────────────────────────────────────────────────
// [D7] Cross-slice isolation — scheduling.slice MUST NOT import workspace.slice internals
// ──────────────────────────────────────────────────────────────────────────
⋮----
// D7: direct import of workspace.slice internals is forbidden.
// Only the public index re-exports via shared-kernel are allowed.
⋮----
// ──────────────────────────────────────────────────────────────────────────
// [ParsingIntentContract] Type-level completeness check
// ──────────────────────────────────────────────────────────────────────────
⋮----
// All fields required by the contract
⋮----
// ──────────────────────────────────────────────────────────────────────────
// [D25] IFileStore Adapter — StorageAdapter implements IFileStore
// ──────────────────────────────────────────────────────────────────────────
⋮----
// ──────────────────────────────────────────────────────────────────────────
// [QGWAY_SCHED] Scheduling queries route through projection.org-eligible-member-view
// ──────────────────────────────────────────────────────────────────────────
⋮----
// ──────────────────────────────────────────────────────────────────────────
// [D26] Cross-cutting Authority — global-search.slice is the sole Cmd+K owner
// Business slices MUST NOT implement their own cross-domain search or Cmd+K UI
// ──────────────────────────────────────────────────────────────────────────
⋮----
/** Returns source files that define a CommandDialog component inside a business slice. */
function findCommandDialogInSlices(sliceRoot: string): string[]
⋮----
// MUST import from global-search.slice (path alias @/ or relative)
⋮----
// The file must have been removed from workspace.slice
⋮----
// Allow CommandDialog only in files that import from global-search.slice
⋮----
// ──────────────────────────────────────────────────────────────────────────
// [D8] Shared-kernel purity — no async functions, Firestore calls, or side effects
// CTA (centralized-tag) Firestore operations must live in semantic-graph.slice
// ──────────────────────────────────────────────────────────────────────────
⋮----
/** Returns shared-kernel source files that import from @/shared/infra. */
function findInfraImportsInSharedKernel(): string[]
⋮----
// Must not be `async function publishTagEvent`
⋮----
// Must still export publishTagEvent
````

## File: src/features/workspace.slice/business.parsing-intent/index.ts
````typescript

````

## File: src/features/workspace.slice/business.quality-assurance/_components/quality-assurance-view.tsx
````typescript
import { ShieldCheck, XCircle, CheckCircle, Search, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
⋮----
import { useAuth } from "@/shared/app-providers/auth-provider";
import { Badge } from "@/shared/shadcn-ui/badge";
import { Button } from "@/shared/shadcn-ui/button";
import { type WorkspaceTask } from "@/shared/types";
import { toast } from "@/shared/utility-hooks/use-toast";
⋮----
import { useWorkspace } from '../../core';
⋮----
const getErrorMessage = (error: unknown, fallback: string)
⋮----
/**
 * WorkspaceQualityAssurance - A-Track quality threshold.
 * Determines if a task is qualified to enter the "Verified" stage.
 * ARCHITECTURE REFACTORED: Now stateful and fully event-driven.
 */
export function WorkspaceQualityAssurance()
⋮----
// 1. Independent State Hydration: Consumes task data from the parent context on mount.
⋮----
// 2. Event-Driven Updates: Subscribes to events for real-time changes.
⋮----
// When a task is marked as completed, add it to our QA queue.
⋮----
// When a task is approved in QA, remove it from our queue.
⋮----
// When a task is rejected in QA, remove it from our queue.
⋮----
// Cleanup subscriptions on component unmount
⋮----
const handleApprove = async (task: WorkspaceTask) =>
⋮----
const handleReject = async (task: WorkspaceTask) =>
⋮----
// Step 1: Publish an event. Decouples QA from Issue creation.
⋮----
// Step 2: Log the specific action for the audit trail.
⋮----
// Step 3: Inform the user.
````

## File: src/features/workspace.slice/business.quality-assurance/index.ts
````typescript

````

## File: src/features/workspace.slice/business.tasks/_actions.ts
````typescript
/**
 * @fileoverview task.commands.ts - Pure business logic for workspace task operations.
 * @description Contains framework-agnostic action functions for creating, updating,
 * and deleting workspace tasks. These functions can be called from React hooks,
 * context, or future Server Actions without any React dependencies.
 */
⋮----
import {
  type CommandResult,
  commandSuccess,
  commandFailureFrom,
} from '@/features/shared-kernel';
import {
  createTask as createTaskFacade,
  updateTask as updateTaskFacade,
  deleteTask as deleteTaskFacade,
} from "@/shared/infra/firestore/firestore.facade"
import type { WorkspaceTask } from "@/shared/types"
⋮----
export async function createTask(
  workspaceId: string,
  taskData: Omit<WorkspaceTask, "id" | "createdAt" | "updatedAt">
): Promise<CommandResult>
⋮----
export async function updateTask(
  workspaceId: string,
  taskId: string,
  updates: Partial<WorkspaceTask>
): Promise<CommandResult>
⋮----
// sourceIntentId is a readonly SourcePointer (Digital Twin anchor) — strip it from updates.
⋮----
export async function deleteTask(
  workspaceId: string,
  taskId: string
): Promise<CommandResult>
⋮----
/**
 * Imports multiple tasks into a workspace in parallel.
 * @param workspaceId The ID of the workspace.
 * @param items Array of task data objects to create (without id/timestamps).
 * @returns CommandResult reflecting overall success or the first failure encountered.
 */
export async function batchImportTasks(
  workspaceId: string,
  items: Omit<WorkspaceTask, "id" | "createdAt" | "updatedAt">[]
): Promise<CommandResult>
````

## File: src/features/workspace.slice/business.tasks/_components/tasks-view.tsx
````typescript
import {
  Plus,
  ChevronRight,
  ChevronDown,
  Settings2,
  Trash2,
  Coins,
  Clock,
  View,
  BarChart3,
  CalendarPlus,
  ClipboardPlus,
  OctagonX,
  Send,
  UploadCloud,
  X,
  Loader2,
  Paperclip,
  MapPin,
} from 'lucide-react';
import Image from "next/image";
import { useState, useMemo, useEffect } from 'react';
⋮----
import { cn } from '@/shared/lib';
import { buildTaskTree } from '@/shared/lib';
import { Badge } from '@/shared/shadcn-ui/badge';
import { Button } from '@/shared/shadcn-ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/shared/shadcn-ui/dialog';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/shadcn-ui/dropdown-menu';
import { Input } from '@/shared/shadcn-ui/input';
import { Label } from '@/shared/shadcn-ui/label';
import { Progress } from '@/shared/shadcn-ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/shadcn-ui/select';
import { Textarea } from '@/shared/shadcn-ui/textarea';
import { type WorkspaceTask, type Location , type TaskWithChildren } from '@/shared/types';
import { toast } from '@/shared/utility-hooks/use-toast';
⋮----
import { useStorage } from '../../business.files';
import { useWorkspace } from '../../core';
⋮----
const getErrorMessage = (error: unknown, fallback: string)
⋮----
function ProgressReportDialog({
  task,
  isOpen,
  onClose,
  onSubmit,
}: {
  task: TaskWithChildren | null;
  isOpen: boolean;
onClose: ()
⋮----
const handleSubmit = async () =>
⋮----
/**
 * WorkspaceTasks - WBS Engineering Task Governance Center (Advanced)
 * Features: Infinite nesting, bi-directional budget constraints, dynamic column governance, auto-topology numbering.
 * ARCHITECTURE REFACTORED: Now consumes state from context.
 */
⋮----
// Discrete Recovery Principle (AB dual-track):
//   TRACK_B_ISSUES →|IssueResolved 事件| WORKSPACE_EVENT_BUS
//   A 軌自行訂閱後恢復（not direct back-flow）
// When an issue is resolved with a sourceTaskId, unblock the blocked task.
⋮----
// Non-critical: task unblock is best-effort; user can manually update state.
⋮----
const handleLocationChange = (field: keyof Location, value: string) =>
⋮----
const handleSaveTask = async () =>
⋮----
delete finalData.progress; // Ensure calculated progress is not saved
⋮----
const handleReportProgress = async (taskId: string, newCompletedQuantity: number) =>
⋮----
const handleSubmitForQA = async (task: TaskWithChildren) =>
⋮----
const handleDeleteTask = async (node: TaskWithChildren) =>
⋮----
const handleScheduleRequest = (task: WorkspaceTask) =>
⋮----
const handleMarkBlocked = async (task: TaskWithChildren) =>
⋮----
const toggleColumn = (key: string) =>
⋮----
const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) =>
⋮----
const handleRemovePhoto = (index: number) =>
⋮----
className=
````

## File: src/features/workspace.slice/business.tasks/_queries.ts
````typescript
/**
 * @fileoverview workspace-business.tasks — Read-only queries.
 * @description Server-side read functions for fetching workspace tasks.
 * Callable from RSC pages, hooks, and context without React dependencies.
 *
 * Per logic-overview.md [R4]: read queries must NOT live in _actions.ts.
 */
⋮----
import {
  getWorkspaceTasks as getWorkspaceTasksFacade,
  getWorkspaceTask as getWorkspaceTaskFacade,
} from "@/shared/infra/firestore/firestore.facade";
import type { WorkspaceTask } from "@/shared/types";
⋮----
/**
 * Fetches all tasks for a workspace (one-time read, not real-time).
 * @param workspaceId The ID of the workspace.
 */
export async function getWorkspaceTasks(
  workspaceId: string
): Promise<WorkspaceTask[]>
⋮----
/**
 * Fetches a single task by ID from a workspace (one-time read, not real-time).
 * @param workspaceId The ID of the workspace.
 * @param taskId The ID of the task.
 */
export async function getWorkspaceTask(
  workspaceId: string,
  taskId: string
): Promise<WorkspaceTask | null>
````

## File: src/features/workspace.slice/business.tasks/index.ts
````typescript
// Actions (server)
⋮----
// Queries (read-only)
````

## File: src/features/workspace.slice/business.workflow/_aggregate.ts
````typescript
/**
 * workspace-business.workflow — _aggregate.ts
 *
 * Workflow Aggregate State Machine [R6] WORKFLOW_STATE_CONTRACT
 *
 * Stage lifecycle per v9 spec:
 *   Draft → InProgress → QA → Acceptance → Finance → Completed
 *
 * blockWorkflow:
 *   blockedBy is a Set of issueIds (array representation).
 *   Multiple issues can block simultaneously — they accumulate.
 *
 * unblockWorkflow:
 *   Removes the resolved issueId from blockedBy.
 *   The workflow is only truly unblocked when blockedBy is empty. [R6][D10][A3]
 *
 * Invariant A3: blockWorkflow → blockedBy Set; allIssuesResolved → unblockWorkflow
 * Invariant A8: TX Runner guarantees single-aggregate atomicity per command.
 * D10: Command must validate current Stage legality before execution.
 */
⋮----
export type WorkflowStage =
  | 'draft'
  | 'in-progress'
  | 'quality-assurance'
  | 'acceptance'
  | 'finance'
  | 'completed';
⋮----
export interface WorkflowAggregateState {
  workflowId: string;
  workspaceId: string;
  stage: WorkflowStage;
  /**
   * Set of issueIds currently blocking this workflow. [R6]
   * Uses array for Firestore serialization; semantically a Set (no duplicates enforced by blockWorkflow).
   * Workflow is blocked when blockedBy.length > 0.
   * unblockWorkflow only removes one issueId; full unlock requires blockedBy to be empty.
   */
  blockedBy: string[];
  version: number;
  updatedAt: number;
}
⋮----
/**
   * Set of issueIds currently blocking this workflow. [R6]
   * Uses array for Firestore serialization; semantically a Set (no duplicates enforced by blockWorkflow).
   * Workflow is blocked when blockedBy.length > 0.
   * unblockWorkflow only removes one issueId; full unlock requires blockedBy to be empty.
   */
⋮----
export function createWorkflowAggregate(
  workspaceId: string,
  workflowId: string
): WorkflowAggregateState
⋮----
export function canAdvanceWorkflowStage(
  current: WorkflowStage,
  next: WorkflowStage
): boolean
⋮----
export function advanceWorkflowStage(
  state: WorkflowAggregateState,
  next: WorkflowStage
): WorkflowAggregateState
⋮----
/**
 * Adds issueId to the blockedBy set, blocking the workflow. [R6][D10][A3]
 *
 * Multiple issues can block simultaneously — they accumulate in blockedBy.
 * If the issueId is already present, this is a no-op (idempotent).
 */
export function blockWorkflow(
  state: WorkflowAggregateState,
  issueId: string
): WorkflowAggregateState
⋮----
/**
 * Removes issueId from the blockedBy set. [R6][D10][A3]
 *
 * The workflow is only truly unblocked when blockedBy becomes empty
 * (i.e., all blocking issues have been resolved).
 * If the resolvedIssueId is not in the set, this is a no-op (idempotent).
 */
export function unblockWorkflow(
  state: WorkflowAggregateState,
  resolvedIssueId: string
): WorkflowAggregateState
⋮----
/** Returns true when the workflow has no active blocking issues. */
export function isWorkflowUnblocked(state: WorkflowAggregateState): boolean
````

## File: src/features/workspace.slice/business.workflow/_issue-handler.ts
````typescript
/**
 * workspace-business.workflow — _issue-handler.ts
 *
 * Handles the B-track `IssueResolved` domain event for the Workflow aggregate.
 *
 * Per logic-overview.md [R6] WORKFLOW_STATE_CONTRACT:
 *   IssueResolved event → blockedBy.delete(issueId)  (ONLY trigger)
 *   B-Track communicates back to A-Track ONLY via Domain Event — never a direct call.
 *
 * This handler subscribes to `workspace:issues:resolved` on the workspace event bus,
 * finds all workflows in the workspace blocked by the resolved issue,
 * and calls `unblockWorkflow` for each one before persisting the updated state.
 *
 * Per GEMINI.md A-Track / B-Track Recovery Principle:
 *   B-Track MUST NOT directly call back into A-Track.
 *   B-Track communicates back ONLY via Domain Event.
 *   Here: IssueResolved event → IER → this handler → unblockWorkflow (pure domain fn)
 */
⋮----
import { unblockWorkflow } from './_aggregate';
import { findWorkflowsBlockedByIssue, saveWorkflowState } from './_persistence';
⋮----
/**
 * Handles `workspace:issues:resolved` by removing the issueId from the `blockedBy`
 * set of every workflow in the workspace that was blocked by it. [R6]
 *
 * Call this from the workspace event bus subscriber at app startup.
 */
export async function handleIssueResolvedForWorkflow(
  workspaceId: string,
  issueId: string
): Promise<void>
````

## File: src/features/workspace.slice/business.workflow/_persistence.ts
````typescript
/**
 * workspace-business.workflow — _persistence.ts
 *
 * Firestore persistence for the Workflow Aggregate State.
 * Stored at: workflowStates/{workspaceId}/workflows/{workflowId}
 *
 * Per logic-overview.md [R6]:
 *   WorkflowAggregateState is persisted and loaded by the command/event handlers.
 *   blockedBy is an array (Firestore serialization of a Set; no duplicates enforced by domain).
 */
⋮----
import { db } from '@/shared/infra/firestore/firestore.client';
import { collection, getDocs, query, type QueryDocumentSnapshot, type DocumentData, where } from '@/shared/infra/firestore/firestore.read.adapter';
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
import { setDocument, updateDocument } from '@/shared/infra/firestore/firestore.write.adapter';
⋮----
import type { WorkflowAggregateState, WorkflowStage } from './_aggregate';
⋮----
const workflowPath = (workspaceId: string, workflowId: string)
⋮----
const workflowCollectionPath = (workspaceId: string)
⋮----
/** Load a single workflow aggregate state from Firestore. */
export async function loadWorkflowState(
  workspaceId: string,
  workflowId: string
): Promise<WorkflowAggregateState | null>
⋮----
/** Persist a workflow aggregate state to Firestore. */
export async function saveWorkflowState(state: WorkflowAggregateState): Promise<void>
⋮----
/** Update only the mutable fields of a workflow aggregate state. */
export async function updateWorkflowState(
  workspaceId: string,
  workflowId: string,
  patch: Partial<Pick<WorkflowAggregateState, 'stage' | 'blockedBy' | 'version' | 'updatedAt'>>
): Promise<void>
⋮----
/**
 * Query all workflow states in a workspace that are blocked by the given issueId.
 * Used by the IssueResolved handler to find all workflows that need unblocking [R6].
 */
export async function findWorkflowsBlockedByIssue(
  workspaceId: string,
  issueId: string
): Promise<WorkflowAggregateState[]>
⋮----
/**
 * Query all workflow states in a workspace by stage.
 * Used by UI to display workflows at a given lifecycle stage [R6].
 */
export async function findWorkflowsByStage(
  workspaceId: string,
  stage: WorkflowStage
): Promise<WorkflowAggregateState[]>
````

## File: src/features/workspace.slice/business.workflow/index.ts
````typescript
/** [R6] IssueResolved event handler — ONLY trigger for blockedBy.delete(issueId) */
````

## File: src/features/workspace.slice/core.event-bus/_bus.ts
````typescript
// [職責] 事件發布/訂閱引擎 (The Bus)
// Per logic-overview.md:
//   WORKSPACE_EVENT_BUS -.->|事件契約遵循| SK_EVENT_ENVELOPE
//   WORKSPACE_EVENT_BUS --> TRACE_IDENTIFIER (Observability)
//   WORKSPACE_EVENT_BUS --> DOMAIN_METRICS   (Observability)
import { recordEventPublished } from "@/features/observability"
import type { ImplementsEventEnvelopeContract } from '@/features/shared-kernel'
⋮----
import type {
  WorkspaceEventName,
  WorkspaceEventHandler,
  PublishFn,
  SubscribeFn,
  WorkspaceEventPayloadMap,
} from "./_events"
⋮----
// A map where keys are event names (strings) and values are arrays of handler functions (Observers).
⋮----
type HandlerRegistry = Map<WorkspaceEventName, WorkspaceEventHandler<any>[]>
⋮----
/**
 * The Subject in the Observer pattern. It maintains a list of Observers (handlers)
 * and notifies them when an event occurs.
 *
 * Implements shared-kernel.event-envelope contract (Invariant #8).
 */
export class WorkspaceEventBus implements ImplementsEventEnvelopeContract
/** Marker: this bus implements the shared-kernel.event-envelope contract. */
⋮----
/** Marker: this bus implements the shared-kernel.event-envelope contract. */
⋮----
constructor()
⋮----
// DOMAIN_METRICS — record every published event
````

## File: src/features/workspace.slice/core.event-bus/_context.ts
````typescript
// [職責] 提供輕量的 Workspace 事件匯流排 Context，
// 允許 feature 元件直接 publish/subscribe 而無需注入整個 WorkspaceContext。
⋮----
import { createContext, useContext } from "react"
⋮----
import type {
  PublishFn,
  SubscribeFn,
} from "./_events"
⋮----
export interface WorkspaceEventContextType {
  publish: PublishFn
  subscribe: SubscribeFn
}
⋮----
/**
 * useWorkspaceEvents — access the workspace event bus (publish + subscribe)
 * without importing the full WorkspaceContext.
 * Must be called within a WorkspaceProvider tree.
 */
export function useWorkspaceEvents(): WorkspaceEventContextType
````

## File: src/features/workspace.slice/core.event-bus/_event-funnel.ts
````typescript
/**
 * workspace-core.event-bus — _event-funnel.ts
 *
 * Re-exports the Event Funnel from its canonical location: `projection.bus`.
 *
 * Per logic-overview.md, EVENT_FUNNEL_INPUT belongs to the PROJECTION_LAYER subgraph,
 * not the WORKSPACE_CONTAINER. This file exists solely for backwards compatibility
 * with callers that import from `@/features/workspace-core.event-bus`.
 */
````

## File: src/features/workspace.slice/core.event-bus/_events.ts
````typescript
// [職責] 事件名稱與 Payload 的 TypeScript 類型定義 (Contract)
import type { SkillRequirement, WorkspaceScheduleProposedPayload } from "@/features/shared-kernel"
import type { WorkspaceTask, DailyLog } from "@/shared/types"
⋮----
// WorkspaceScheduleProposedPayload is a cross-BC contract — defined in shared-kernel.
// Re-exported for consumers that import from workspace-core.event-bus.
⋮----
// =================================================================
// == Payload Interfaces
// =================================================================
⋮----
export interface WorkspaceTaskCompletedPayload {
  task: WorkspaceTask
  /** TraceID from the originating EventEnvelope — required for R8 audit trail. */
  traceId?: string
}
⋮----
/** TraceID from the originating EventEnvelope — required for R8 audit trail. */
⋮----
export interface WorkspaceTaskScheduleRequestedPayload {
  taskName: string
}
⋮----
export interface QualityAssuranceRejectedPayload {
  task: WorkspaceTask
  rejectedBy: string
}
⋮----
export interface WorkspaceAcceptanceFailedPayload {
  task: WorkspaceTask
  rejectedBy: string
}
⋮----
export interface WorkspaceQualityAssuranceApprovedPayload {
  task: WorkspaceTask
  approvedBy: string
}
⋮----
export interface WorkspaceAcceptancePassedPayload {
  task: WorkspaceTask
  acceptedBy: string
}
⋮----
export interface DocumentParserItemsExtractedPayload {
  sourceDocument: string
  intentId: string
  /** When true, import should execute immediately without an extra confirmation toast. */
  autoImport?: boolean
  items: Array<{
    name: string
    quantity: number
    unitPrice: number
    discount?: number
    subtotal: number
  }>
  /** Skill requirements extracted from the document, forwarded to schedule proposals. */
  skillRequirements?: SkillRequirement[]
}
⋮----
/** When true, import should execute immediately without an extra confirmation toast. */
⋮----
/** Skill requirements extracted from the document, forwarded to schedule proposals. */
⋮----
/**
 * IntentDeltaProposed — emitted by a ParsingIntent Digital Twin [#A4].
 *
 * Per logic-overview.md: PARSE_INT -.->|"IntentDeltaProposed [#A4]"| A_TASKS
 * Invariant #A4: ParsingIntent only allows proposing events (CQS — no direct mutation).
 *
 * This event is persisted to the ws-outbox Firestore collection [S1][E5] for
 * at-least-once delivery via the OUTBOX_RELAY_WORKER [R1].
 */
export interface IntentDeltaProposedPayload {
  /** The ParsingIntent Digital Twin that produced this delta. */
  intentId: string
  workspaceId: string
  sourceFileName: string
  /** Number of line-item task drafts in this delta. */
  taskDraftCount: number
  /** Skill requirements forwarded to the tasks system for eligibility checks [TE_SK]. */
  skillRequirements?: SkillRequirement[]
  /** [R8] TraceID for end-to-end audit trail propagation. */
  traceId?: string
}
⋮----
/** The ParsingIntent Digital Twin that produced this delta. */
⋮----
/** Number of line-item task drafts in this delta. */
⋮----
/** Skill requirements forwarded to the tasks system for eligibility checks [TE_SK]. */
⋮----
/** [R8] TraceID for end-to-end audit trail propagation. */
⋮----
export interface DailyLogForwardRequestedPayload {
  log: DailyLog
  targetCapability: "tasks" | "issues"
  action: "create"
}
⋮----
export interface FileSendToParserPayload {
  fileName: string
  downloadURL: string
  fileType: string
  /** The WorkspaceFile document ID — used by the parser to record a SourcePointer in ParsingIntent. */
  fileId?: string
}
⋮----
/** The WorkspaceFile document ID — used by the parser to record a SourcePointer in ParsingIntent. */
⋮----
export interface WorkspaceIssueResolvedPayload {
  issueId: string
  issueTitle: string
  resolvedBy: string
  /** SourcePointer: ID of the A-track task to unblock after resolution (Discrete Recovery). */
  sourceTaskId?: string
  /** TraceID from the originating EventEnvelope — required for R8 audit trail. */
  traceId?: string
}
⋮----
/** SourcePointer: ID of the A-track task to unblock after resolution (Discrete Recovery). */
⋮----
/** TraceID from the originating EventEnvelope — required for R8 audit trail. */
⋮----
export interface WorkspaceFinanceDisbursementFailedPayload {
  taskId: string
  taskTitle: string
  amount: number
  reason: string
  /** TraceID from the originating EventEnvelope — required for R8 audit trail. */
  traceId?: string
}
⋮----
/** TraceID from the originating EventEnvelope — required for R8 audit trail. */
⋮----
export interface WorkspaceTaskBlockedPayload {
  task: WorkspaceTask
  reason?: string
  /** TraceID from the originating EventEnvelope — required for R8 audit trail. */
  traceId?: string
}
⋮----
/** TraceID from the originating EventEnvelope — required for R8 audit trail. */
⋮----
export interface WorkspaceTaskAssignedPayload {
  taskId: string
  taskName: string
  /** Branded assignee account ID */
  assigneeId: string
  workspaceId: string
  /** SourcePointer: the IntentID that originated this task, if any. */
  sourceIntentId?: string
  /** [TE_SK] Skill requirements from the originating task — forwarded to the schedule proposal for VS6 eligibility checks. */
  requiredSkills?: SkillRequirement[]
  /** TraceID from the originating EventEnvelope — required for R8 audit trail. */
  traceId?: string
}
⋮----
/** Branded assignee account ID */
⋮----
/** SourcePointer: the IntentID that originated this task, if any. */
⋮----
/** [TE_SK] Skill requirements from the originating task — forwarded to the schedule proposal for VS6 eligibility checks. */
⋮----
/** TraceID from the originating EventEnvelope — required for R8 audit trail. */
⋮----
// =================================================================
// Event Name Registry (Discriminated Union)
// =================================================================
⋮----
export type WorkspaceEventName =
  | "workspace:tasks:completed"
  | "workspace:tasks:scheduleRequested"
  | "workspace:tasks:blocked"
  | "workspace:tasks:assigned"
  | "workspace:schedule:proposed"
  | "workspace:quality-assurance:rejected"
  | "workspace:acceptance:failed"
  | "workspace:quality-assurance:approved"
  | "workspace:acceptance:passed"
  | "workspace:document-parser:itemsExtracted"
  | "workspace:files:sendToParser"
  | "workspace:issues:resolved"
  | "workspace:finance:disburseFailed"
  | "daily:log:forwardRequested"
  | "workspace:parsing-intent:deltaProposed"
⋮----
// =================================================================
// Event-to-Payload Mapping (Type-Safe Constraint)
// =================================================================
⋮----
export interface WorkspaceEventPayloadMap {
  "workspace:tasks:completed": WorkspaceTaskCompletedPayload
  "workspace:tasks:scheduleRequested": WorkspaceTaskScheduleRequestedPayload
  "workspace:tasks:blocked": WorkspaceTaskBlockedPayload
  "workspace:tasks:assigned": WorkspaceTaskAssignedPayload
  "workspace:schedule:proposed": WorkspaceScheduleProposedPayload
  "workspace:quality-assurance:rejected": QualityAssuranceRejectedPayload
  "workspace:acceptance:failed": WorkspaceAcceptanceFailedPayload
  "workspace:quality-assurance:approved": WorkspaceQualityAssuranceApprovedPayload
  "workspace:acceptance:passed": WorkspaceAcceptancePassedPayload
  "workspace:document-parser:itemsExtracted": DocumentParserItemsExtractedPayload
  "workspace:files:sendToParser": FileSendToParserPayload
  "workspace:issues:resolved": WorkspaceIssueResolvedPayload
  "workspace:finance:disburseFailed": WorkspaceFinanceDisbursementFailedPayload
  "daily:log:forwardRequested": DailyLogForwardRequestedPayload
  "workspace:parsing-intent:deltaProposed": IntentDeltaProposedPayload
}
⋮----
export type WorkspaceEventPayload<T extends WorkspaceEventName> =
  WorkspaceEventPayloadMap[T]
⋮----
// =================================================================
// Handler and Function Type Definitions
// =================================================================
⋮----
export type WorkspaceEventHandler<T extends WorkspaceEventName> = (
  payload: WorkspaceEventPayload<T>
) => Promise<void> | void
⋮----
export type PublishFn = <T extends WorkspaceEventName>(
  type: T,
  payload: WorkspaceEventPayload<T>
) => void
⋮----
export type SubscribeFn = <T extends WorkspaceEventName>(
  type: T,
  handler: WorkspaceEventHandler<T>
) => () => void // Returns an unsubscribe function
⋮----
) => () => void // Returns an unsubscribe function
````

## File: src/features/workspace.slice/core.event-bus/index.ts
````typescript
// Event bus engine
⋮----
// Event types and payload contracts
⋮----
// Context and hook for consuming the event bus
⋮----
// Event Funnel — routes events from both buses to the Projection Layer
````

## File: src/features/workspace.slice/core.event-store/_store.ts
````typescript
/**
 * workspace-core.event-store — Append-only domain event store.
 *
 * Per logic-overview.md:
 * - WORKSPACE_AGGREGATE → WORKSPACE_EVENT_STORE
 * - WORKSPACE_EVENT_STORE -.→ EVENT_FUNNEL_INPUT (replay only, dotted edge)
 * - Invariant #9: Projections MUST be fully rebuildable from events stored here.
 */
⋮----
import {
  appendDomainEvent as appendDomainEventRepo,
  getDomainEvents as getDomainEventsRepo,
  type StoredWorkspaceEvent,
} from '@/shared/infra/firestore/firestore.facade';
⋮----
/**
 * Appends a domain event to the workspace event store.
 * Called by the Transaction Runner after aggregate execution.
 */
export async function appendDomainEvent(
  workspaceId: string,
  event: Omit<StoredWorkspaceEvent, 'id' | 'occurredAt'>
): Promise<string>
⋮----
/**
 * Retrieves all domain events for replay or audit purposes.
 * Events are ordered by occurredAt (ascending).
 */
export async function getDomainEvents(
  workspaceId: string
): Promise<StoredWorkspaceEvent[]>
````

## File: src/features/workspace.slice/core.event-store/index.ts
````typescript
// workspace-core.event-store — Append-only domain event store (replay/audit only)
````

## File: src/features/workspace.slice/core/_actions.ts
````typescript
/**
 * @fileoverview workspace.commands.ts - Pure business logic for workspace write operations.
 * @description Contains framework-agnostic action functions for managing workspaces,
 * including team authorization, member access grants, capabilities, settings, and
 * lifecycle. These functions can be called from React hooks, context, or Server Actions
 * without any React dependencies.
 *
 * NOTE on CommandResult version field [R4]:
 *   CommandSuccess.version is `Date.now()` (millisecond timestamp) here because the
 *   workspace facade does not yet maintain an event-sourced aggregate version counter.
 *   This is a monotonically-increasing wall-clock version — sufficient to establish
 *   "happened after" ordering for optimistic UI updates until proper aggregate versioning
 *   is implemented as part of full event-sourcing adoption.
 */
⋮----
import {
  type CommandResult,
  commandSuccess,
  commandFailureFrom,
} from '@/features/shared-kernel';
import {
  createWorkspace as createWorkspaceFacade,
  authorizeWorkspaceTeam as authorizeWorkspaceTeamFacade,
  revokeWorkspaceTeam as revokeWorkspaceTeamFacade,
  grantIndividualWorkspaceAccess as grantIndividualWorkspaceAccessFacade,
  revokeIndividualWorkspaceAccess as revokeIndividualWorkspaceAccessFacade,
  mountCapabilities as mountCapabilitiesFacade,
  unmountCapability as unmountCapabilityFacade,
  updateWorkspaceSettings as updateWorkspaceSettingsFacade,
  deleteWorkspace as deleteWorkspaceFacade,
  createWorkspaceLocation as createWorkspaceLocationFacade,
  updateWorkspaceLocation as updateWorkspaceLocationFacade,
  deleteWorkspaceLocation as deleteWorkspaceLocationFacade,
} from "@/shared/infra/firestore/firestore.facade"
import type { Account, Capability, WorkspaceRole, WorkspaceLifecycleState, WorkspaceLocation } from "@/shared/types"
⋮----
export async function createWorkspace(
  name: string,
  account: Account
): Promise<CommandResult>
⋮----
export async function authorizeWorkspaceTeam(
  workspaceId: string,
  teamId: string
): Promise<CommandResult>
⋮----
export async function revokeWorkspaceTeam(
  workspaceId: string,
  teamId: string
): Promise<CommandResult>
⋮----
export async function grantIndividualWorkspaceAccess(
  workspaceId: string,
  userId: string,
  role: WorkspaceRole,
  protocol?: string
): Promise<CommandResult>
⋮----
export async function revokeIndividualWorkspaceAccess(
  workspaceId: string,
  grantId: string
): Promise<CommandResult>
⋮----
export async function mountCapabilities(
  workspaceId: string,
  capabilities: Capability[]
): Promise<CommandResult>
⋮----
export async function unmountCapability(
  workspaceId: string,
  capability: Capability
): Promise<CommandResult>
⋮----
export async function updateWorkspaceSettings(
  workspaceId: string,
  settings: {
    name: string
    visibility: "visible" | "hidden"
    lifecycleState: WorkspaceLifecycleState
  }
): Promise<CommandResult>
⋮----
export async function deleteWorkspace(workspaceId: string): Promise<CommandResult>
⋮----
// =================================================================
// WorkspaceLocation Commands — FR-L1/FR-L2/FR-L3
// =================================================================
⋮----
/**
 * Creates a new sub-location inside a workspace.
 * FR-L1: HR or Workspace OWNER can define sub-locations (zones within 廠區).
 */
export async function createWorkspaceLocation(
  workspaceId: string,
  location: WorkspaceLocation
): Promise<CommandResult>
⋮----
/**
 * Updates a sub-location inside a workspace.
 * FR-L2: HR or Workspace OWNER can edit sub-locations.
 */
export async function updateWorkspaceLocation(
  workspaceId: string,
  locationId: string,
  updates: Partial<Pick<WorkspaceLocation, 'label' | 'description' | 'capacity'>>
): Promise<CommandResult>
⋮----
/**
 * Deletes a sub-location from a workspace.
 * FR-L3: HR or Workspace OWNER can delete sub-locations.
 */
export async function deleteWorkspaceLocation(
  workspaceId: string,
  locationId: string
): Promise<CommandResult>
````

## File: src/features/workspace.slice/core/_components/account-provider.tsx
````typescript
import type React from 'react';
import {type ReactNode} from 'react';
import { createContext, useReducer, useEffect } from 'react';
⋮----
import { type Workspace, type DailyLog, type AuditLog, type PartnerInvite, type ScheduleItem } from '@/shared/types';
⋮----
import { useApp } from '../_hooks/use-app';
import {
  subscribeToDailyLogsForAccount,
  subscribeToAuditLogsForAccount,
  subscribeToInvitesForAccount,
  subscribeToScheduleItemsForAccount,
  subscribeToWorkspacesForAccount,
} from '../_queries';
⋮----
// State and Action Types
interface AccountState {
  workspaces: Record<string, Workspace>;
  dailyLogs: Record<string, DailyLog>;
  auditLogs: Record<string, AuditLog>;
  invites: Record<string, PartnerInvite>;
  schedule_items: Record<string, ScheduleItem>;
}
⋮----
type Action =
  | { type: 'SET_WORKSPACES'; payload: Record<string, Workspace> }
  | { type: 'SET_DAILY_LOGS'; payload: Record<string, DailyLog> }
  | { type: 'SET_AUDIT_LOGS'; payload: Record<string, AuditLog> }
  | { type: 'SET_INVITES'; payload: Record<string, PartnerInvite> }
  | { type: 'SET_SCHEDULE_ITEMS'; payload: Record<string, ScheduleItem> }
  | { type: 'RESET_STATE' };
⋮----
// Initial State
⋮----
// Reducer
const accountReducer = (state: AccountState, action: Action): AccountState =>
⋮----
// Preserve subcollections from old state when workspace list is updated
// This is important because subcollection listeners are in WorkspaceProvider now
⋮----
...(state.workspaces[id] || {}), // Keep existing sub-collection data
...newWorkspaces[id], // Overwrite with fresh top-level data
⋮----
// Also handle deletions
⋮----
// Context
⋮----
// Provider
export const AccountProvider = (
⋮----
// 1. Listen to top-level collections for the active account
````

## File: src/features/workspace.slice/core/_components/app-provider.tsx
````typescript
// Re-exported from shared/app-providers/app-context for backward compatibility.
// All new code should import directly from '@/shared/app-providers/app-context'.
````

## File: src/features/workspace.slice/core/_components/create-workspace-dialog.tsx
````typescript
// [職責] 建立空間的彈窗 UI
⋮----
import { useState } from "react";
⋮----
import { useI18n } from "@/config/i18n/i18n-provider";
import { Button } from "@/shared/shadcn-ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/shadcn-ui/dialog";
import { Input } from "@/shared/shadcn-ui/input";
import { Label } from "@/shared/shadcn-ui/label";
⋮----
import { useApp } from "../_hooks/use-app";
import { handleCreateWorkspace } from "../_use-cases";
⋮----
interface CreateWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
⋮----
const onCreate = async () =>
````

## File: src/features/workspace.slice/core/_components/dashboard-view.tsx
````typescript
// [職責] Wave 4 — Dashboard overview view (client island)
// Extracted from app/dashboard/page.tsx to follow the features/ view pattern.
⋮----
import { User as UserIcon } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
⋮----
import { useI18n } from "@/config/i18n/i18n-provider"
import { PermissionTree } from "@/features/account.slice"
import { AccountGrid } from "@/features/organization.slice"
import { useAuth } from "@/shared/app-providers/auth-provider"
import { Badge } from "@/shared/shadcn-ui/badge"
import { PageHeader } from "@/shared/ui/page-header"
⋮----
import { useApp } from "../_hooks/use-app"
import { useVisibleWorkspaces } from "../_hooks/use-visible-workspaces"
⋮----
import { StatCards } from "./stat-cards"
import { WorkspaceList } from "./workspace-list"
⋮----
/**
 * DashboardView — The "smart" dashboard overview container.
 * Manages all account/workspace state and delegates rendering to _components/.
 * app/dashboard/page.tsx is now a thin RSC wrapper that renders this.
 */
````

## File: src/features/workspace.slice/core/_components/stat-cards.tsx
````typescript
import { ShieldCheck, Activity, Layers, Zap } from "lucide-react";
import { useMemo } from "react";
⋮----
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/shadcn-ui/card";
import { Progress } from "@/shared/shadcn-ui/progress";
⋮----
import { useAccount } from "../_hooks/use-account";
import { useApp } from "../_hooks/use-app";
⋮----
export function StatCards()
````

## File: src/features/workspace.slice/core/_components/workspace-capabilities.tsx
````typescript
import { 
  Box, 
  Trash2, 
  FileText, 
  ListTodo, 
  ShieldCheck, 
  Trophy, 
  AlertCircle, 
  MessageSquare, 
  Layers, 
  Plus,
  Users,
  Settings2,
  Activity,
  Landmark,
  Info,
  Calendar,
  FileScan,
  Loader2,
} from "lucide-react";
import { useCallback, useState, useMemo } from "react";
⋮----
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/shadcn-ui/alert-dialog";
import { Badge } from "@/shared/shadcn-ui/badge";
import { Button } from "@/shared/shadcn-ui/button";
import { Card, CardDescription, CardHeader, CardTitle, CardFooter } from "@/shared/shadcn-ui/card";
import { Checkbox } from "@/shared/shadcn-ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/shared/shadcn-ui/dialog";
import { Label } from "@/shared/shadcn-ui/label";
import { type Capability } from "@/shared/types";
import { toast } from "@/shared/utility-hooks/use-toast";
⋮----
import { useApp } from '../_hooks/use-app';
⋮----
import { useWorkspace } from './workspace-provider';
⋮----
// Capabilities available for personal (user-owned) workspaces.
⋮----
// Capabilities that belong to permanent layers (Core, Governance, Projection) and
// must never appear in the mountable-capability picker.
⋮----
'capabilities', // Core
'members',      // Governance
'audit',        // Projection
⋮----
const getErrorMessage = (error: unknown, fallback: string)
⋮----
/**
 * WorkspaceCapabilities - Manages mounted "atomic capabilities" for the workspace.
 * REFACTORED: Now derives the owner type at runtime based on the workspace's `dimensionId`.
 */
⋮----
// Exclude capabilities from permanent layers (Core, Governance, Projection) — these are not mountable.
⋮----
const toggleCapSelection = (capId: string) =>
⋮----
const getIcon = (id: string) =>
⋮----
const getSpecIcon = (type: string) =>
⋮----
<span className="font-mono text-[9px] text-muted-foreground opacity-60">SPEC_ID:
⋮----
<Button size="sm" className="gap-2" onClick=
⋮----
{/* Mount Dialog */}
<Dialog open=
⋮----

⋮----
{/* Unmount Confirmation Dialog */}
````

## File: src/features/workspace.slice/core/_components/workspace-card.tsx
````typescript
// [職責] 單個 Workspace 的卡片展示
⋮----
import { MoreVertical, Eye, EyeOff, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
⋮----
import { useI18n } from "@/config/i18n/i18n-provider";
import { Badge } from "@/shared/shadcn-ui/badge";
import { Button } from "@/shared/shadcn-ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/shared/shadcn-ui/card";
import type { Workspace } from "@/shared/types";
⋮----
interface WorkspaceCardProps {
  workspace: Workspace;
}
⋮----
export function WorkspaceCard(
⋮----
const handleClick = () =>
````

## File: src/features/workspace.slice/core/_components/workspace-grid-view.tsx
````typescript
// [職責] 網格佈局容器
⋮----
import type { Workspace } from "@/shared/types";
⋮----
import { WorkspaceCard } from "./workspace-card";
⋮----
interface WorkspaceGridViewProps {
  workspaces: Workspace[];
}
⋮----
export function WorkspaceGridView(
````

## File: src/features/workspace.slice/core/_components/workspace-list-header.tsx
````typescript
// [職責] 標題、搜尋框與視圖切換 (Grid/List)
⋮----
import {
  Plus,
  Search,
  Filter,
  LayoutGrid,
  List as ListIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
⋮----
import { useI18n } from "@/config/i18n/i18n-provider";
import { ROUTES } from "@/shared/constants/routes";
import { Button } from "@/shared/shadcn-ui/button";
import { Input } from "@/shared/shadcn-ui/input";
import { PageHeader } from "@/shared/ui/page-header";
⋮----
interface WorkspaceListHeaderProps {
  activeAccountName: string;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
}
⋮----
title=
⋮----
placeholder=
⋮----
onChange=
````

## File: src/features/workspace.slice/core/_components/workspace-list.tsx
````typescript
import { Eye, EyeOff, Shield, Trash2, ArrowUpRight, Terminal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
⋮----
import { ROUTES } from "@/shared/constants/routes";
import { Badge } from "@/shared/shadcn-ui/badge";
import { Button } from "@/shared/shadcn-ui/button";
import { type Workspace } from "@/shared/types";
⋮----
interface WorkspaceListItemProps {
  workspace: Workspace;
  onDelete?: (id: string) => void;
}
⋮----
<span className="text-[10px] text-muted-foreground">ID:
⋮----
onClick=
````

## File: src/features/workspace.slice/core/_components/workspace-locations-panel.tsx
````typescript
/**
 * workspace-core — _components/workspace-locations-panel.tsx
 *
 * Management panel for workspace sub-locations (廠區子地點).
 * Per docs/prd-schedule-workforce-skills.md FR-L1/FR-L2/FR-L3.
 *
 * FR-L1: HR or Workspace OWNER can create sub-locations.
 * FR-L2: HR or Workspace OWNER can edit sub-location label/description/capacity.
 * FR-L3: HR or Workspace OWNER can delete sub-locations.
 *
 * Per GEMINI.md §2.3 D3/D5:
 *   All mutations use Server Actions from workspace-core/_actions.ts.
 */
⋮----
import { Plus, Pencil, Trash2, MapPin } from 'lucide-react';
import { useState, useCallback } from 'react';
⋮----
import { Button } from '@/shared/shadcn-ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/shadcn-ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/shadcn-ui/dialog';
import { Input } from '@/shared/shadcn-ui/input';
import { Label } from '@/shared/shadcn-ui/label';
import type { WorkspaceLocation } from '@/shared/types';
import { toast } from '@/shared/utility-hooks/use-toast';
⋮----
import { createWorkspaceLocation, updateWorkspaceLocation, deleteWorkspaceLocation } from '../_actions';
⋮----
// ---------------------------------------------------------------------------
// Location form dialog (create + edit)
// ---------------------------------------------------------------------------
⋮----
interface LocationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  /** Populated only when editing an existing location. */
  existing?: WorkspaceLocation;
  onSaved: () => void;
}
⋮----
/** Populated only when editing an existing location. */
⋮----
// FR-L2: update
⋮----
// FR-L1: create
⋮----
onChange=
⋮----
// ---------------------------------------------------------------------------
// Main panel
// ---------------------------------------------------------------------------
⋮----
/** Current locations from the workspace read model. */
⋮----
/** Called after a mutation so the parent can re-fetch/refresh. */
⋮----
/**
 * WorkspaceLocationsPanel — FR-L1/L2/L3 sub-location management UI.
 *
 * Displays the list of sub-locations for a workspace and provides create,
 * edit, and delete actions via Server Actions.
 */
⋮----
onClick=
````

## File: src/features/workspace.slice/core/_components/workspace-nav-tabs.tsx
````typescript
import Link from "next/link"
import { useSelectedLayoutSegment } from "next/navigation"
import { useMemo } from "react"
⋮----
import type { Capability } from "@/shared/types"
⋮----
import { useApp } from "../_hooks/use-app"
⋮----
import { useWorkspace } from "./workspace-provider";
⋮----
// =================================================================
// == Capability Registry — maps capability IDs to labels
// =================================================================
⋮----
// Core
⋮----
// Governance
⋮----
// Business (mountable)
⋮----
// Projection
⋮----
// =================================================================
// == Layer Boundaries — permanent tabs that are never dynamically mounted
// =================================================================
⋮----
// Layer 1 — Core: Workspace lifecycle & capability management
⋮----
// Layer 2 — Governance: Access control, roles & permissions
⋮----
// Layer 4 — Projection: Read models & event stream (always visible, never mountable)
⋮----
// All non-Business IDs (used to filter the dynamic Business capability list)
⋮----
interface WorkspaceNavTabsProps {
  workspaceId: string
}
⋮----
// Show governance tabs (Members) only for org-owned workspaces.
// We avoid hiding them unless we can definitively confirm a personal workspace
// (i.e., dimensionId matches the active user's own account ID).
⋮----
// Layer 3 — Business: dynamic capabilities mounted per workspace, excluding permanent layers.
⋮----
// Layer 2 — Governance: only relevant for org-owned workspaces.
⋮----
// Tab order: Core → Governance → Business → Projection
````

## File: src/features/workspace.slice/core/_components/workspace-provider.tsx
````typescript
import { Loader2 } from 'lucide-react';
import type React from 'react';
import { createContext, useContext, useMemo, useCallback, useEffect, useState } from 'react';
⋮----
import { initTagChangedSubscriber } from '@/features/notification-hub.slice';
import {
  createScheduleItem as createScheduleItemAction,
} from '@/features/scheduling.slice'
import type { CommandResult } from '@/features/shared-kernel';
import { firestoreTimestampToISO } from '@/shared/lib';
import { type Workspace, type AuditLog, type WorkspaceTask, type WorkspaceRole, type Capability, type WorkspaceLifecycleState, type ScheduleItem } from '@/shared/types';
⋮----
import { registerOrgPolicyCache, runTransaction } from '../../application';
import {
  createIssue as createIssueAction,
  addCommentToIssue as addCommentToIssueAction,
  resolveIssue as resolveIssueAction,
} from '../../business.issues'
import { 
  createTask as createTaskAction,
  updateTask as updateTaskAction,
  deleteTask as deleteTaskAction,
  getWorkspaceTask as getWorkspaceTaskAction,
} from '../../business.tasks'
import { WorkspaceEventBus , WorkspaceEventContext, registerWorkspaceFunnel, registerOrganizationFunnel, type WorkspaceEventName, type FileSendToParserPayload } from '../../core.event-bus';
import { writeAuditLog } from '../../gov.audit/_actions';
import {
  authorizeWorkspaceTeam as authorizeWorkspaceTeamAction,
  revokeWorkspaceTeam as revokeWorkspaceTeamAction,
  grantIndividualWorkspaceAccess as grantIndividualWorkspaceAccessAction,
  revokeIndividualWorkspaceAccess as revokeIndividualWorkspaceAccessAction,
  mountCapabilities as mountCapabilitiesAction,
  unmountCapability as unmountCapabilityAction,
  updateWorkspaceSettings as updateWorkspaceSettingsAction,
  deleteWorkspace as deleteWorkspaceAction,
} from '../_actions'
import { useAccount } from '../_hooks/use-account';
import { useApp } from '../_hooks/use-app';
⋮----
interface WorkspaceContextType {
  workspace: Workspace;
  localAuditLogs: AuditLog[];
  logAuditEvent: (action: string, detail: string, type: 'create' | 'update' | 'delete') => Promise<void>;
  eventBus: WorkspaceEventBus;
  protocol: string;
  scope: string[];
  // Task specific actions
  createTask: (task: Omit<WorkspaceTask, 'id' | 'createdAt' | 'updatedAt'>) => Promise<CommandResult>;
  updateTask: (taskId: string, updates: Partial<WorkspaceTask>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<CommandResult>;
  // Member management actions
  authorizeWorkspaceTeam: (teamId: string) => Promise<CommandResult>;
  revokeWorkspaceTeam: (teamId: string) => Promise<CommandResult>;
  grantIndividualWorkspaceAccess: (userId: string, role: WorkspaceRole, protocol?: string) => Promise<CommandResult>;
  revokeIndividualWorkspaceAccess: (grantId: string) => Promise<CommandResult>;
  // Capability management
  mountCapabilities: (capabilities: Capability[]) => Promise<CommandResult>;
  unmountCapability: (capability: Capability) => Promise<CommandResult>;
  // Workspace settings
  updateWorkspaceSettings: (settings: { name: string; visibility: 'visible' | 'hidden'; lifecycleState: WorkspaceLifecycleState }) => Promise<CommandResult>;
  deleteWorkspace: () => Promise<CommandResult>;
  // Issue Management
  createIssue: (title: string, type: 'technical' | 'financial', priority: 'high' | 'medium', sourceTaskId?: string) => Promise<CommandResult>;
  addCommentToIssue: (issueId: string, author: string, content: string) => Promise<CommandResult>;
  /** Resolves a B-track issue via the Transaction Runner + Outbox pipeline. */
  resolveIssue: (issueId: string, issueTitle: string, resolvedBy: string, sourceTaskId?: string) => Promise<void>;
  // Schedule Management
  createScheduleItem: (itemData: CreateScheduleItemInput) => Promise<CommandResult>;
  // Pending parse file — set by files-view when "Parse with AI" is clicked;
  // read by document-parser on mount to auto-trigger parsing cross-tab.
  pendingParseFile: FileSendToParserPayload | null;
  setPendingParseFile: (payload: FileSendToParserPayload | null) => void;
}
⋮----
// Task specific actions
⋮----
// Member management actions
⋮----
// Capability management
⋮----
// Workspace settings
⋮----
// Issue Management
⋮----
/** Resolves a B-track issue via the Transaction Runner + Outbox pipeline. */
⋮----
// Schedule Management
⋮----
// Pending parse file — set by files-view when "Parse with AI" is clicked;
// read by document-parser on mount to auto-trigger parsing cross-tab.
⋮----
/** Input type for createScheduleItem — accepts plain Date objects; the action converts to Timestamp internally. */
export type CreateScheduleItemInput = Omit<ScheduleItem, 'id' | 'createdAt' | 'updatedAt' | 'startDate' | 'endDate'> & {
  startDate?: Date | null;
  endDate?: Date | null;
};
⋮----
export function WorkspaceProvider(
⋮----
// eslint-disable-next-line react-hooks/exhaustive-deps -- workspaceId is an intentional reset key: recreate bus when active workspace changes
⋮----
// Pending parse file — bridges the cross-tab gap between files-view (publisher)
// and document-parser-view (subscriber), which are on separate @businesstab slots.
⋮----
// Register Event Funnel — routes events from both buses to the Projection Layer
// Also register Notification Router (FCM Layer 2) and Org Policy Cache
⋮----
// Schedule trigger chain: task assignment change → workspace:tasks:assigned → W_B_SCHEDULE.
// Only publish when a non-empty assigneeId is provided (assignment, not un-assignment).
⋮----
// Fetch task data from workspace-business.tasks BC boundary (not from workspace aggregate).
⋮----
// Outbox-encapsulated resolve: Firestore write + event collection happen inside
// Transaction Runner; events are flushed to the Event Bus only after the write commits.
⋮----
// Cross-layer Outbox event: WORKSPACE_OUTBOX →|workspace:schedule:proposed| ORGANIZATION_SCHEDULE
// Per logic-overview.md: W_B_SCHEDULE publishes this event so scheduling.slice
// can persist a schedule_item and start the HR governance approval flow.
⋮----
// [R8] Inject traceId at CBG_ENTRY (this is the top of the scheduling saga chain).
// Use Web Crypto API (available in modern browsers and Node 18+).
⋮----
export function useWorkspace()
````

## File: src/features/workspace.slice/core/_components/workspace-settings.tsx
````typescript
// [職責] 空間設定對話框
⋮----
import { useState, useEffect } from "react";
⋮----
import { Button } from "@/shared/shadcn-ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/shadcn-ui/dialog";
import { Input } from "@/shared/shadcn-ui/input";
import { Label } from "@/shared/shadcn-ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/shadcn-ui/select";
import { Switch } from "@/shared/shadcn-ui/switch";
import type { Workspace, WorkspaceLifecycleState, Address } from "@/shared/types";
⋮----
interface WorkspaceSettingsDialogProps {
  workspace: Workspace;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (settings: {
    name: string;
    visibility: "visible" | "hidden";
    lifecycleState: WorkspaceLifecycleState;
    address?: Address;
  }) => Promise<void>;
  loading: boolean;
}
⋮----
export function WorkspaceSettingsDialog({
  workspace,
  open,
  onOpenChange,
  onSave,
  loading,
}: WorkspaceSettingsDialogProps)
⋮----
const handleAddressChange = (field: keyof Address, value: string) =>
⋮----
const handleSave = () =>
⋮----
onChange={(e) => setName(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest opacity-60">
                Physical Address
            </Label>
            <div className="grid grid-cols-2 gap-4">
                <Input
                    placeholder="Country"
                    value={address.country}
                    onChange={(e) => handleAddressChange('country', e.target.value)}
                    className="h-11 rounded-xl"
                />
                <Input
                    placeholder="State / Province"
                    value={address.state}
                    onChange={(e) => handleAddressChange('state', e.target.value)}
                    className="h-11 rounded-xl"
                />
            </div>
            <Input
                placeholder="City"
                value={address.city}
                onChange={(e) => handleAddressChange('city', e.target.value)}
                className="h-11 rounded-xl"
            />
            <Input
                placeholder="Street Address"
                value={address.street}
                onChange={(e) => handleAddressChange('street', e.target.value)}
                className="h-11 rounded-xl"
            />
            <div className="grid grid-cols-2 gap-4">
                <Input
                    placeholder="Postal Code"
                    value={address.postalCode}
                    onChange={(e) => handleAddressChange('postalCode', e.target.value)}
                    className="h-11 rounded-xl"
                />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest opacity-60">
              Current Lifecycle State
            </Label>
            <Select
              value={lifecycleState}
onValueChange=
````

## File: src/features/workspace.slice/core/_components/workspace-status-bar.tsx
````typescript
// [職責] 顯示 Mounted/Isolated 狀態
⋮----
import { Eye, EyeOff } from "lucide-react";
⋮----
import { Badge } from "@/shared/shadcn-ui/badge";
⋮----
import { useWorkspace } from "./workspace-provider";
⋮----
export function WorkspaceStatusBar()
⋮----
ID:
````

## File: src/features/workspace.slice/core/_components/workspace-table-view.tsx
````typescript
// [職責] 列表佈局容器
⋮----
import { Eye, EyeOff, Shield, ArrowUpRight } from "lucide-react";
import { useRouter } from "next/navigation";
⋮----
import { useI18n } from "@/config/i18n/i18n-provider";
import { Badge } from "@/shared/shadcn-ui/badge";
import { Button } from "@/shared/shadcn-ui/button";
import type { Workspace } from "@/shared/types";
⋮----
interface WorkspaceListItemProps {
  workspace: Workspace;
}
⋮----
ID:
````

## File: src/features/workspace.slice/core/_components/workspaces-view.tsx
````typescript
// [職責] Workspaces list view — contains all state and rendering logic
⋮----
import { Terminal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
⋮----
import { useI18n } from "@/config/i18n/i18n-provider";
import { ROUTES } from "@/shared/constants/routes";
import { Button } from "@/shared/shadcn-ui/button";
⋮----
import { useWorkspaceFilters } from "../../business.files/_hooks/use-workspace-filters";
import { useApp } from "../_hooks/use-app";
import { useVisibleWorkspaces } from "../_hooks/use-visible-workspaces";
⋮----
import { WorkspaceGridView } from "./workspace-grid-view";
import { WorkspaceListHeader } from "./workspace-list-header";
import { WorkspaceTableView } from "./workspace-table-view";
````

## File: src/features/workspace.slice/core/_hooks/use-account.ts
````typescript
import { useContext } from 'react';
⋮----
import { AccountContext } from '../_components/account-provider';
⋮----
export const useAccount = () =>
````

## File: src/features/workspace.slice/core/_hooks/use-app.ts
````typescript
// Re-exported from shared/app-providers/app-context for backward compatibility.
// All new code should import directly from '@/shared/app-providers/app-context'.
````

## File: src/features/workspace.slice/core/_hooks/use-visible-workspaces.ts
````typescript
import { useMemo } from 'react'
⋮----
import { useAuth } from '@/shared/app-providers/auth-provider'
import { filterVisibleWorkspaces } from '@/shared/lib'
⋮----
import { useAccount } from './use-account'
import { useApp } from './use-app'
⋮----
/**
 * A hook that centralizes the logic for determining which workspaces are visible to the current user
 * based on the active account context.
 *
 * @returns A memoized array of `Workspace` objects that the current user is allowed to see in the active dimension.
 */
export function useVisibleWorkspaces()
````

## File: src/features/workspace.slice/core/_hooks/use-workspace-commands.ts
````typescript
/**
 * @fileoverview use-workspace-commands.ts - Hook for workspace lifecycle write operations.
 */
⋮----
import { useCallback } from "react";
⋮----
import { toast } from "@/shared/utility-hooks/use-toast";
⋮----
import { deleteWorkspace } from "../_actions";
⋮----
export function useWorkspaceCommands()
````

## File: src/features/workspace.slice/core/_hooks/use-workspace-event-handler.tsx
````typescript
// [職責] 監聽事件並執行副作用 (The Orchestrator)
⋮----
import { useEffect } from "react";
⋮----
import { handleScheduleProposed } from "@/features/scheduling.slice";
import { ToastAction } from "@/shared/shadcn-ui/toast";
import type { WorkspaceTask } from "@/shared/types";
import { toast } from "@/shared/utility-hooks/use-toast";
⋮----
import { markParsingIntentImported } from "../../business.document-parser";
import { createIssue } from "../../business.issues";
import { batchImportTasks } from "../../business.tasks";
import type { DocumentParserItemsExtractedPayload } from '../../core.event-bus';
import { useWorkspace } from '../_components/workspace-provider';
⋮----
import { useApp } from './use-app';
⋮----
// [S4] Named constant — disambiguates from PROJ_STALE_STANDARD (10s).
// This is a UI toast duration, not a staleness SLA value.
⋮----
/**
 * useWorkspaceEventHandler — side-effect hook (no render output).
 * Call inside any Client Component that is a descendant of WorkspaceProvider.
 * Subscribes to workspace-level events and orchestrates cross-capability reactions.
 */
export function useWorkspaceEventHandler()
⋮----
const pushNotification = (
      title: string,
      message: string,
      type: "info" | "success" | "alert"
) =>
⋮----
const handleImport = (payload: DocumentParserItemsExtractedPayload) =>
⋮----
const importItems = () =>
⋮----
// Omit discount entirely when undefined to avoid Firestore "Unsupported field value: undefined"
⋮----
// [TE_SK] ParsingIntent uses `skillRequirements`; WorkspaceTask uses `requiredSkills`
// to align with ScheduleItem's field name — intentional cross-model mapping.
⋮----
// Schedule trigger chain: task assignment change → W_B_SCHEDULE domain event flow.
// When a task is assigned to a member, a PROPOSAL schedule item is created so the
// organization can review and confirm the assignment window.
⋮----
// [TE_SK] Forward skill requirements so the scheduling saga can run
// eligibility checks (SK_SKILL_REQ) without knowing task details [D7].
⋮----
// B 軌 IssueResolved → A 軌自行恢復（Discrete Recovery Principle）
// B-track announces fact via event bus; A-track subscribes and self-recovers.
⋮----
// Discrete Recovery: if the issue has a sourceTaskId, auto-unblock the A-track task
⋮----
// TRACK_A_FINANCE -->|異常| TRACK_B_ISSUES
⋮----
// TRACK_A_TASKS -->|異常| TRACK_B_ISSUES
⋮----
// VS6 scheduling saga — enrich the proposal with org-domain fields
// (proposedBy, version, traceId, requiredSkills) as soon as it is published.
// The event is fired by createScheduleItem in workspace-provider after the
// Firestore document has been created with status=PROPOSAL.
````

## File: src/features/workspace.slice/core/_queries.ts
````typescript
/**
 * workspace.slice/core — Firestore subscription factories (D5-compliant)
 *
 * Encapsulates all `onSnapshot` / Firestore read-adapter calls so that
 * `account-provider.tsx` (and any other client component) has zero direct
 * infra imports per D5.
 *
 * Pattern follows `business.files/_queries.ts` — all Firestore API surface
 * stays in this file; callbacks receive typed domain records.
 */
⋮----
import { db } from '@/shared/infra/firestore/firestore.client';
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  type Unsubscribe,
  where,
} from '@/shared/infra/firestore/firestore.read.adapter';
import { snapshotToRecord } from '@/shared/infra/firestore/firestore.utils';
import type {
  AuditLog,
  DailyLog,
  PartnerInvite,
  ScheduleItem,
  Workspace,
} from '@/shared/types';
⋮----
// ---------------------------------------------------------------------------
// Account-scoped subscriptions
// ---------------------------------------------------------------------------
⋮----
/**
 * Opens a real-time listener on `accounts/{accountId}/dailyLogs`.
 * Calls `onUpdate` with the latest records map on every change.
 */
export function subscribeToDailyLogsForAccount(
  accountId: string,
  onUpdate: (logs: Record<string, DailyLog>) => void,
): Unsubscribe
⋮----
/**
 * Opens a real-time listener on `accounts/{accountId}/auditLogs`.
 */
export function subscribeToAuditLogsForAccount(
  accountId: string,
  onUpdate: (logs: Record<string, AuditLog>) => void,
): Unsubscribe
⋮----
/**
 * Opens a real-time listener on `accounts/{accountId}/invites`.
 */
export function subscribeToInvitesForAccount(
  accountId: string,
  onUpdate: (invites: Record<string, PartnerInvite>) => void,
): Unsubscribe
⋮----
/**
 * Opens a real-time listener on `accounts/{accountId}/schedule_items`.
 */
export function subscribeToScheduleItemsForAccount(
  accountId: string,
  onUpdate: (items: Record<string, ScheduleItem>) => void,
): Unsubscribe
⋮----
/**
 * Opens a real-time listener on `workspaces` filtered by `dimensionId`.
 */
export function subscribeToWorkspacesForAccount(
  dimensionId: string,
  onUpdate: (workspaces: Record<string, Workspace>) => void,
): Unsubscribe
````

## File: src/features/workspace.slice/core/_shell/account-create-dialog.tsx
````typescript
import { Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
⋮----
import { Button } from "@/shared/shadcn-ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/shared/shadcn-ui/dialog"
import { Input } from "@/shared/shadcn-ui/input"
import { Label } from "@/shared/shadcn-ui/label"
import { type Account } from "@/shared/types"
import { toast } from "@/shared/utility-hooks/use-toast"
⋮----
import type { AppAction } from '../_components/app-provider'
⋮----
interface AccountCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  createOrganization: (name: string) => Promise<string>
  dispatch: React.Dispatch<AppAction>
  accounts: Record<string, Account>
  t: (key: string) => string
}
⋮----
const handleCreate = async () =>
⋮----
````

## File: src/features/workspace.slice/core/_shell/account-switcher.tsx
````typescript
import { Check, ChevronsUpDown, Globe, Plus } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
⋮----
import { ROUTES } from "@/shared/constants/routes"
import { cn } from "@/shared/lib"
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/shadcn-ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/shadcn-ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/shared/shadcn-ui/sidebar"
import type { Account } from "@/shared/types"
⋮----
import type { AppAction } from '../_components/app-provider'
⋮----
interface AccountSwitcherProps {
  user: Account | null
  accounts: Record<string, Account>
  activeAccount: Account | null
  dispatch: React.Dispatch<AppAction>
  createOrganization: (name: string) => Promise<string>
  t: (key: string) => string
}
⋮----
const getAccountInitial = (name?: string)
⋮----
<AvatarFallback className=
⋮----
````

## File: src/features/workspace.slice/core/_shell/dashboard-sidebar.tsx
````typescript
/**
 * @fileoverview Dashboard Sidebar - Main Assembly Component
 *
 * @description This component acts as the "smart container" for the entire dashboard sidebar.
 * Its primary responsibility is to:
 * 1. Fetch all necessary application state from various contexts and hooks.
 * 2. Assemble the sidebar's visual structure using the core `<Sidebar>` UI components.
 * 3. Pass the fetched state and required functions down as props to its "dumb" child components.
 * This pattern ensures a clean separation of concerns and a clear, top-down data flow.
 */
⋮----
// ============================================================================
// Next.js & React Imports
// ============================================================================
import { usePathname } from 'next/navigation';
⋮----
// ============================================================================
// UI Components
// ============================================================================
import { useI18n } from "@/config/i18n/i18n-provider";
import { useUser } from "@/features/account.slice";
import { useOrganizationManagement } from "@/features/organization.slice";
import { useAuth } from "@/shared/app-providers/auth-provider";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarRail,
  SidebarSeparator,
} from "@/shared/shadcn-ui/sidebar";
⋮----
// ============================================================================
// Contexts & Hooks
// ============================================================================
⋮----
import { useApp } from "../_hooks/use-app";
import { useVisibleWorkspaces } from "../_hooks/use-visible-workspaces";
⋮----
// ============================================================================
// Sidebar Sub-components
// ============================================================================
import { AccountSwitcher } from "./account-switcher";
import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import { NavWorkspaces } from "./nav-workspaces";
⋮----
/**
 * The main sidebar component for the dashboard. It composes various
 * sub-components to build the complete, interactive sidebar.
 */
⋮----
// ========================================
// State Management - Data Fetching from Hooks
// ========================================
⋮----
// Merge Firestore profile with auth user: profile has photoURL etc., user is always available
⋮----
// ========================================
// Render - Assembling the Sidebar
// ========================================
⋮----
{/* Sidebar Header: Contains the logo and the account switcher dropdown */}
⋮----
{/* Sidebar Content: Contains the main navigation and workspace quick links */}
⋮----
{/* Main navigation section for core dashboard areas */}
⋮----
{/* Quick access section for visible workspaces */}
⋮----
{/* Sidebar Footer: Contains user profile info, settings, and logout */}
````

## File: src/features/workspace.slice/core/_shell/header.tsx
````typescript
import { Search, Command } from "lucide-react";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
⋮----
import { GlobalSearch } from "@/features/global-search.slice";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/shared/shadcn-ui/breadcrumb";
import { Button } from "@/shared/shadcn-ui/button";
import { Separator } from "@/shared/shadcn-ui/separator";
import { SidebarTrigger } from "@/shared/shadcn-ui/sidebar";
import type { Account } from '@/shared/types'
⋮----
import { useApp } from "../_hooks/use-app";
import { useVisibleWorkspaces } from '../_hooks/use-visible-workspaces';
⋮----
import { NotificationCenter } from "./notification-center";
⋮----
function usePageBreadcrumbs(pathname: string)
⋮----
const down = (e: KeyboardEvent) =>
⋮----
const handleSwitchOrganization = (organization: Account) =>
````

## File: src/features/workspace.slice/core/_shell/nav-main.tsx
````typescript
import {
  LayoutDashboard,
  Layers,
  FolderTree,
  ChevronRight,
  Users,
  Globe,
  Settings,
  Grid3X3,
  Calendar,
  MessageSquare,
  History,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
⋮----
import { ROUTES } from "@/shared/constants/routes";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/shadcn-ui/collapsible";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarMenuButton,
} from "@/shared/shadcn-ui/sidebar";
⋮----
interface NavMainProps {
  pathname: string;
  isOrganizationAccount: boolean;
  t: (key: string) => string;
}
⋮----
const isActive = (path: string)
const isPartiallyActive = (path: string)
⋮----
<SidebarMenuButton asChild isActive=
⋮----
<SidebarMenuSubButton asChild isActive=
````

## File: src/features/workspace.slice/core/_shell/nav-user.tsx
````typescript
import { UserCircle, LogOut, ChevronsUpDown } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo } from "react"
⋮----
import { ROUTES } from "@/shared/constants/routes"
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/shadcn-ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/shadcn-ui/dropdown-menu"
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton, useSidebar } from "@/shared/shadcn-ui/sidebar"
import type { Account } from "@/shared/types"
⋮----
interface NavUserProps {
  user: Account | null
  accounts: Record<string, Account>
  activeAccount: Account | null
  logout: () => void
  t: (key: string, params?: Record<string, string | number>) => string;
}
⋮----
const getAccountInitial = (name?: string)
⋮----
const handleLogout = () =>
⋮----
<AvatarFallback className="rounded-lg bg-primary/10 font-bold text-primary">
````

## File: src/features/workspace.slice/core/_shell/nav-workspaces.tsx
````typescript
import { Terminal } from "lucide-react";
import Link from "next/link";
⋮----
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/shared/shadcn-ui/sidebar";
import type { Workspace } from "@/shared/types";
⋮----
interface NavWorkspacesProps {
  workspaces: Workspace[];
  pathname: string;
  t: (key: string) => string;
}
````

## File: src/features/workspace.slice/core/_shell/notification-center.tsx
````typescript
import { Bell, Trash2, Check } from "lucide-react";
⋮----
import { Button } from "@/shared/shadcn-ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/shadcn-ui/popover";
import { ScrollArea } from "@/shared/shadcn-ui/scroll-area";
import { type Notification } from "@/shared/types";
⋮----
import type { AppAction } from '../_components/app-provider'
⋮----
interface NotificationCenterProps {
  notifications: Notification[];
  dispatch: React.Dispatch<AppAction>;
}
````

## File: src/features/workspace.slice/core/_shell/theme-adapter.tsx
````typescript
import { useEffect, useState, useRef } from "react";
⋮----
import { hexToHsl } from "@/shared/lib";
import { Skeleton } from "@/shared/shadcn-ui/skeleton";
⋮----
import { useApp } from "../_hooks/use-app";
⋮----
// [S4] Named constant — disambiguates from PROJ_STALE_CRITICAL (500ms).
// This is a placeholder AI-adapt simulation delay, not a staleness SLA value.
⋮----
interface ThemeAdapterProps {
    children: React.ReactNode;
}
⋮----
export function ThemeAdapter(
⋮----
async function adaptTheme()
⋮----
// This is a placeholder for a real AI call.
````

## File: src/features/workspace.slice/core/_use-cases.ts
````typescript
/**
 * @fileoverview features/workspace — Multi-step workspace use cases.
 * No React. No UI. Callable from hooks, context, or Server Actions.
 */
⋮----
import type { CommandResult } from '@/features/shared-kernel';
import type { Account, Capability, WorkspaceLifecycleState, Address } from "@/shared/types";
import { toast } from "@/shared/utility-hooks/use-toast";
⋮----
import { createWorkspace, mountCapabilities, updateWorkspaceSettings, deleteWorkspace } from "./_actions";
⋮----
/**
 * Creates a workspace and immediately mounts a set of initial capabilities.
 * Combines two action calls into one atomic use case.
 *
 * @param name         Workspace name
 * @param account      The owning account
 * @param capabilities Initial capabilities to mount (may be empty)
 * @returns            CommandResult — aggregateId is the new workspace ID on success
 */
export async function createWorkspaceWithCapabilities(
  name: string,
  account: Account,
  capabilities: Capability[] = []
): Promise<CommandResult>
⋮----
export const handleCreateWorkspace = async (
  name: string,
  activeAccount: Account | null,
  onSuccess: () => void,
  t: (key: string) => string
) =>
⋮----
export const handleUpdateWorkspaceSettings = async (
  workspaceId: string,
  settings: { name: string; visibility: 'visible' | 'hidden'; lifecycleState: WorkspaceLifecycleState; address?: Address },
  onSuccess: () => void
) =>
⋮----
export const handleDeleteWorkspace = async (workspaceId: string, onSuccess: () => void) =>
````

## File: src/features/workspace.slice/core/index.ts
````typescript
// Components
⋮----
// Providers
⋮----
// Hooks
⋮----
// Shell
⋮----
// GlobalSearch is owned by global-search.slice [D26]; re-exported here for backward compatibility
⋮----
// Hooks
⋮----
// WorkspaceLocation CRUD — FR-L1/FR-L2/FR-L3
````

## File: src/features/workspace.slice/gov.audit-convergence/_bridge.ts
````typescript
export interface AuditConvergenceInput {
  accountId: string;
  workspaceId?: string;
  limit?: number;
}
⋮----
export interface AuditProjectionQuery {
  accountId: string;
  workspaceId?: string;
  limit: number;
}
⋮----
function normalizeAuditLimit(limit?: number): number
⋮----
export function toAuditProjectionQuery(
  input: AuditConvergenceInput
): AuditProjectionQuery
````

## File: src/features/workspace.slice/gov.audit-convergence/index.ts
````typescript

````

## File: src/features/workspace.slice/gov.audit/_actions.ts
````typescript
/**
 * @fileoverview gov.audit/_actions.ts — Write-side audit log actions. [D3][D5]
 * @description Server actions for persisting audit log entries to Firestore.
 *
 * Architectural boundaries:
 *   [D3]  All write operations go through _actions.ts.
 *   [D5]  Infrastructure imports (Firestore adapters) belong here — not in
 *         components, providers, or client hooks.
 */
⋮----
import { addDocument, serverTimestamp } from '@/shared/infra/firestore/firestore.write.adapter';
import type { AuditLog } from '@/shared/types';
⋮----
export interface WriteAuditLogInput {
  accountId: string;
  actor: string;
  action: string;
  target: string;
  type: AuditLog['type'];
  workspaceId?: string;
}
⋮----
/**
 * Persists an audit log entry to the account's auditLogs collection.
 * Replaces direct Firestore writes in components per D3/D5.
 *
 * Errors from the underlying `addDocument` call propagate as thrown exceptions
 * to the caller; wrap with try/catch when fire-and-forget semantics are needed.
 */
export async function writeAuditLog(input: WriteAuditLogInput): Promise<void>
⋮----
export interface WriteDailyLogInput {
  accountId: string;
  content: string;
  author: { uid: string; name: string; avatarUrl: string };
  workspaceId?: string;
  workspaceName?: string;
  photoURLs?: string[];
}
⋮----
/**
 * Persists a daily log entry to the account's dailyLogs collection.
 * Replaces direct Firestore writes in use-logger.ts per D3/D5.
 */
export async function writeDailyLog(input: WriteDailyLogInput): Promise<void>
````

## File: src/features/workspace.slice/gov.audit/_components/audit-detail-sheet.tsx
````typescript
// [職責] 點擊事件後顯示的 JSON Diff 或詳細變更對照
⋮----
import { ScrollArea } from "@/shared/shadcn-ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/shared/shadcn-ui/sheet";
import { type AuditLog } from "@/shared/types";
⋮----
interface AuditDetailSheetProps {
    log: AuditLog | null;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}
⋮----
export function AuditDetailSheet(
````

## File: src/features/workspace.slice/gov.audit/_components/audit-event-item.tsx
````typescript
// [職責] 單個事件條目 (Dumb Component)
⋮----
import { format } from "date-fns";
⋮----
import { cn } from "@/shared/lib";
import { Badge } from "@/shared/shadcn-ui/badge";
import { type AuditLog } from "@/shared/types";
⋮----
import { AuditEventItemContainer } from "./audit-timeline";
import { AuditTypeIcon } from "./audit-type-icon";
⋮----
interface AuditEventItemProps {
    log: AuditLog;
    onSelect: () => void;
}
⋮----
<span className=
````

## File: src/features/workspace.slice/gov.audit/_components/audit-timeline.tsx
````typescript
// [職責] 基於 shadcn/ui timeline 的封裝，作為審計事件的容器
⋮----
import { cn } from "@/shared/lib";
⋮----
interface AuditTimelineProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}
⋮----
export function AuditTimeline(
⋮----
<div className=
⋮----
interface AuditEventItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}
⋮----
export function AuditEventItemContainer(
````

## File: src/features/workspace.slice/gov.audit/_components/audit-type-icon.tsx
````typescript
// [職責] 根據事件類型顯示對應 Icon (Zap, Shield, etc.)
⋮----
import { Zap, Shield, Activity, Terminal } from "lucide-react";
⋮----
import { type AuditLog } from "@/shared/types";
⋮----
interface AuditTypeIconProps {
    type: AuditLog['type'];
}
⋮----
export function AuditTypeIcon(
````

## File: src/features/workspace.slice/gov.audit/_components/audit.account-view.tsx
````typescript
// [職責] Projection — Account 層跨 Workspace 稽核事件流 (全維度、唯讀)
⋮----
import { AlertCircle, Terminal } from "lucide-react";
⋮----
import { useAccountAudit } from "../_hooks/use-account-audit";
⋮----
import { AuditDetailSheet } from "./audit-detail-sheet";
import { AuditEventItem } from "./audit-event-item";
import { AuditTimeline } from "./audit-timeline";
````

## File: src/features/workspace.slice/gov.audit/_components/audit.view.tsx
````typescript
import { AccountAuditComponent } from "./audit.account-view";
⋮----
/**
 * AccountAuditView - Responsibility: Displays the audit trail (Audit Logs) for the entire dimension.
 */
export default function AccountAuditView()
````

## File: src/features/workspace.slice/gov.audit/_components/audit.workspace-view.tsx
````typescript
// [職責] Projection — 單一 Workspace 事件流 (本地、唯讀)
⋮----
import { format } from "date-fns";
import { Activity } from "lucide-react";
⋮----
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/shadcn-ui/card";
import { ScrollArea } from "@/shared/shadcn-ui/scroll-area";
⋮----
import { useWorkspaceAudit } from "../_hooks/use-workspace-audit";
⋮----
import { AuditDetailSheet } from "./audit-detail-sheet";
import { AuditTypeIcon } from "./audit-type-icon";
⋮----
onOpenChange={(open) => { if (!open) clearSelection(); }}
      />
    </div>
  );
````

## File: src/features/workspace.slice/gov.audit/_hooks/use-account-audit.ts
````typescript
// [職責] Projection — Account 層跨 Workspace 稽核事件流狀態邏輯
/**
 * @fileoverview useAccountAudit - Hook for account-wide audit log state.
 * @description Converts the `auditLogs` record from AccountContext into a
 * sorted array and manages selection state. Also provides the org-context guard.
 *
 * @responsibility
 * - Read `auditLogs` record from AccountContext.
 * - Memoize conversion to array.
 * - Manage `selectedLog` detail-sheet state.
 * - Expose `isOrganizationContext` guard so the component stays dumb.
 */
⋮----
import { useMemo, useState } from "react";
⋮----
import { useApp } from "@/shared/app-providers/app-context";
import { type AuditLog } from "@/shared/types";
⋮----
import { useAccount } from "../../core";
⋮----
export function useAccountAudit()
````

## File: src/features/workspace.slice/gov.audit/_hooks/use-logger.ts
````typescript
import { useCallback } from "react";
⋮----
import { useApp } from "@/shared/app-providers/app-context";
import type { AuditLog, Account } from "@/shared/types";
⋮----
import { writeDailyLog, writeAuditLog } from '../_actions';
⋮----
/**
 * useLogger - Zero-cognition logging interface.
 * Automatically handles the physical separation of Daily and Audit logs.
 * [D3][D5] All Firestore writes delegated to _actions.ts — no infra imports here.
 */
export function useLogger(workspaceId?: string, workspaceName?: string)
⋮----
avatarUrl: '', // populated at display time from the user's profile photo URL
````

## File: src/features/workspace.slice/gov.audit/_hooks/use-workspace-audit.ts
````typescript
// [職責] Projection — 單一 Workspace 稽核事件流狀態邏輯
/**
 * @fileoverview useWorkspaceAudit - Hook for workspace-scoped audit log state.
 * @description Encapsulates selection state for the workspace audit tab.
 * Data arrives fully prepared from WorkspaceContext — no transformation needed.
 *
 * @responsibility
 * - Read `localAuditLogs` from WorkspaceContext.
 * - Manage `selectedLog` detail-sheet state.
 */
⋮----
import { useState } from "react";
⋮----
import { type AuditLog } from "@/shared/types";
⋮----
import { useWorkspace } from "../../core";
⋮----
export function useWorkspaceAudit()
````

## File: src/features/workspace.slice/gov.audit/_queries.ts
````typescript
/**
 * @fileoverview _queries.ts — Read-only queries for audit log retrieval.
 * @description Provides server-side read functions for fetching audit log history.
 * Callable from RSC pages, hooks, and context without React dependencies.
 */
⋮----
import {
  getAuditLogs as getAuditLogsFacade,
} from "@/shared/infra/firestore/firestore.facade"
import type { AuditLog } from "@/shared/types"
⋮----
/**
 * Retrieves audit logs for an account, optionally scoped to a workspace.
 * @param accountId The ID of the organization account.
 * @param workspaceId Optional workspace ID to filter logs.
 * @param limit Maximum number of logs to return (default: 50).
 */
export async function getAuditLogs(
  accountId: string,
  workspaceId?: string,
  limit = 50
): Promise<AuditLog[]>
````

## File: src/features/workspace.slice/gov.audit/index.ts
````typescript
// Views
⋮----
// Actions [D3][D5]
⋮----
// Hooks
⋮----
// Default (AccountAuditView) — used by app/dashboard/account/audit/page.tsx
⋮----
// Queries (read-only)
````

## File: src/features/workspace.slice/gov.members/_components/members-panel.tsx
````typescript
import { 
  Users, 
  Trash2, 
  ShieldCheck, 
  Globe, 
  Plus, 
  CheckCircle2,
  ShieldAlert,
  MoreVertical
} from "lucide-react";
import { useState, useMemo } from "react";
⋮----
import { useApp } from '@/shared/app-providers/app-context';
import { cn } from "@/shared/lib";
import { Badge } from "@/shared/shadcn-ui/badge";
import { Button } from "@/shared/shadcn-ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/shared/shadcn-ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/shared/shadcn-ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/shared/shadcn-ui/dropdown-menu";
import { Label } from "@/shared/shadcn-ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/shadcn-ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/shadcn-ui/tabs";
import { type Team, type WorkspaceRole, type MemberReference } from "@/shared/types";
import { toast } from "@/shared/utility-hooks/use-toast";
⋮----
import { useWorkspace } from '../../core';
⋮----
const getErrorMessage = (error: unknown, fallback: string)
⋮----
// TODO: [Refactor Grant Model] This component now uses a safer update pattern, but the core access model is still a composite of team-based access (`workspace.teamIds`) and individual-based access (`workspace.grants`). A more robust, unified model would represent team access as a special type of grant (e.g., a grant with a `teamId` instead of a `userId`). This would simplify both security rules and client-side logic into a single, expressive `grants` array.
⋮----
/**
 * WorkspaceMembers - Comprehensive access governance for the workspace.
 * Implements a unified authorization system for Internal and Partner Teams using WorkspaceGrant.
 */
export function WorkspaceMembers()
⋮----
const handleToggleTeam = async (team: Team, isAuthorized: boolean) =>
⋮----
const handleConfirmGrant = async () =>
⋮----
const handleRevokeGrant = async (grantId: string) =>
⋮----
<DropdownMenuItem onClick=
````

## File: src/features/workspace.slice/gov.members/_queries.ts
````typescript
/**
 * @fileoverview _queries.ts — Read-only queries for workspace member retrieval.
 * @description Provides server-side read functions for fetching workspace access grants.
 * Callable from RSC pages, hooks, and context without React dependencies.
 */
⋮----
import {
  getWorkspaceGrants as getWorkspaceGrantsFacade,
} from "@/shared/infra/firestore/firestore.facade"
import type { WorkspaceGrant } from "@/shared/types"
⋮----
/**
 * Retrieves all access grants for a workspace.
 * @param workspaceId The ID of the workspace.
 */
export async function getWorkspaceGrants(
  workspaceId: string
): Promise<WorkspaceGrant[]>
````

## File: src/features/workspace.slice/gov.members/index.ts
````typescript
// Queries (read-only)
````

## File: src/features/workspace.slice/gov.partners/index.ts
````typescript
// workspace-governance.partners — Views migrated to organization.slice/gov.partners
// This slice is now a stub; UI lives at the org layer per logic-overview.md.
````

## File: src/features/workspace.slice/gov.role/_actions.ts
````typescript
/**
 * workspace-governance.role — _actions.ts
 *
 * Server actions for workspace-level role management.
 *
 * Per logic-overview.md:
 *   WORKSPACE_ROLE — split from workspace-governance.members, workspace access control only.
 *   Does NOT sign CUSTOM_CLAIMS; that is account-governance.role's responsibility.
 *
 * Invariant #1: This BC only writes its own aggregate (workspace grants).
 */
⋮----
import {
  type CommandResult,
  commandSuccess,
  commandFailureFrom,
} from '@/features/shared-kernel';
import {
  grantIndividualWorkspaceAccess,
  revokeIndividualWorkspaceAccess,
} from '@/shared/infra/firestore/firestore.facade';
import type { WorkspaceRole } from '@/shared/types';
⋮----
export interface AssignWorkspaceRoleInput {
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  protocol?: string;
}
⋮----
export interface RevokeWorkspaceRoleInput {
  workspaceId: string;
  userId: string;
}
⋮----
/**
 * Assigns a workspace-level role to a user.
 * Delegates to the workspace core repository — atomic grant guard included.
 */
export async function assignWorkspaceRole(input: AssignWorkspaceRoleInput): Promise<CommandResult>
⋮----
/**
 * Revokes a workspace-level role from a user.
 */
export async function revokeWorkspaceRole(input: RevokeWorkspaceRoleInput): Promise<CommandResult>
````

## File: src/features/workspace.slice/gov.role/_hooks/use-workspace-role.ts
````typescript
/**
 * workspace-governance.role — _hooks/use-workspace-role.ts
 *
 * React hook for reading the current user's workspace role.
 */
⋮----
import { useState, useEffect } from 'react';
⋮----
import type { WorkspaceGrant } from '@/shared/types';
⋮----
import { getWorkspaceGrant } from '../_queries';
⋮----
export function useWorkspaceRole(workspaceId: string | null, userId: string | null)
````

## File: src/features/workspace.slice/gov.role/_queries.ts
````typescript
/**
 * workspace-governance.role — _queries.ts
 *
 * Read queries for workspace-level role management.
 */
⋮----
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
import type { Workspace, WorkspaceGrant } from '@/shared/types';
⋮----
/**
 * Returns the workspace grant for a specific user.
 */
export async function getWorkspaceGrant(
  workspaceId: string,
  userId: string
): Promise<WorkspaceGrant | null>
⋮----
/**
 * Returns all active grants for a workspace.
 */
export async function getWorkspaceGrants(workspaceId: string): Promise<WorkspaceGrant[]>
````

## File: src/features/workspace.slice/gov.role/index.ts
````typescript
/**
 * workspace-governance.role — Public API
 *
 * Workspace-level role management (split from workspace-governance.members).
 * Does NOT sign CUSTOM_CLAIMS — that is account-governance.role's responsibility.
 *
 * Per logic-overview.md: WORKSPACE_ROLE — workspace access control only.
 */
````

## File: src/features/workspace.slice/gov.teams/index.ts
````typescript
// workspace-governance.teams — Views migrated to organization.slice/gov.teams
// This slice is now a stub; UI lives at the org layer per logic-overview.md.
````

## File: src/features/workspace.slice/index.ts
````typescript
/**
 * workspace.slice — VS5 Workspace Slice Public API
 *
 * Consolidated workspace business domain. All VS5 sub-slices are re-exported
 * from this single entry point. External consumers import from '@/features/workspace.slice'.
 *
 * Sub-slices:
 *   core              — workspace aggregate, providers, shell, hooks
 *   core.event-bus    — in-process workspace event bus [E5]
 *   core.event-store  — append-only domain event store (replay/audit only)
 *   application       — command handler, scope guard, policy engine, tx-runner, outbox
 *   gov.role          — workspace-level role management
 *   gov.audit         — workspace and account audit views
 *   gov.audit-convergence — audit bridge / query adapter
 *   gov.members       — workspace member grants + UI
 *   gov.partners      — stub (views at account.slice/org.partner)
 *   gov.teams         — stub (views at account.slice)
 *   business.files    — workspace file storage
 *   business.document-parser — document parsing [A4]
 *   business.parsing-intent  — ParsingIntent digital twin contract
 *   business.tasks    — workspace task management
 *   business.daily    — 施工日誌 (A-track daily log)
 *   business.workflow — workflow aggregate + state machine [R6]
 *   business.quality-assurance — QA capability
 *   business.acceptance        — acceptance capability
 *   business.finance           — finance capability
 *   business.issues            — B-track issues [A3]
 */
⋮----
// ─── core ────────────────────────────────────────────────────────────────────
⋮----
// ─── core.event-bus ──────────────────────────────────────────────────────────
⋮----
// ─── core.event-store ────────────────────────────────────────────────────────
⋮----
// ─── application ─────────────────────────────────────────────────────────────
⋮----
// ─── gov.role ────────────────────────────────────────────────────────────────
⋮----
// ─── gov.audit ───────────────────────────────────────────────────────────────
⋮----
// ─── gov.audit-convergence ───────────────────────────────────────────────────
⋮----
// ─── gov.members ─────────────────────────────────────────────────────────────
⋮----
// Note: getWorkspaceGrants is already exported from gov.role; gov.members re-exports it too
// Avoiding duplicate export — consumers use gov.role or gov.members via workspace.slice
⋮----
// ─── business.files ──────────────────────────────────────────────────────────
⋮----
// ─── business.document-parser ────────────────────────────────────────────────
⋮----
// ─── business.parsing-intent ─────────────────────────────────────────────────
// Note: markParsingIntentImported (pure function) is exported as markParsingIntentContract
// to avoid collision with the server action of the same name in business.document-parser.
⋮----
// ─── business.tasks ──────────────────────────────────────────────────────────
⋮----
// ─── business.daily ──────────────────────────────────────────────────────────
⋮----
// ─── business.workflow ───────────────────────────────────────────────────────
⋮----
// ─── business.quality-assurance ──────────────────────────────────────────────
⋮----
// ─── business.acceptance ─────────────────────────────────────────────────────
⋮----
// ─── business.finance ────────────────────────────────────────────────────────
⋮----
// ─── business.issues ─────────────────────────────────────────────────────────
````

## File: src/shared-infra/firebase/.firebaserc
````
{
  "projects": {
    "default": "xuanwu-i-00708880-4e2d8"
  }
}
````

## File: src/shared-infra/firebase/firebase.json
````json
{
  "firestore": {
    "database": "(default)",
    "location": "asia-east1",
    "rules": "firestore/firestore.rules",
    "indexes": "firestore/firestore.indexes.json"
  },
  "storage": {
    "rules": "storage/storage.rules"
  },
  "hosting": {
    "public": "out",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "i18n": {
      "root": "/localized-files"
    },
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  },
  "functions": [
    {
      "source": "functions",
      "codebase": "default",
      "disallowLegacyRuntimeConfig": true,
      "ignore": [
        "node_modules",
        ".git",
        "firebase-debug.log",
        "firebase-debug.*.log",
        "*.local"
      ],
      "predeploy": [
        "npm --prefix functions run lint",
        "npm --prefix functions run build"
      ]
    }
  ]
}
````

## File: src/shared-infra/firebase/firestore/firestore.indexes.json
````json
{
  "indexes": [
    {
      "collectionGroup": "dailyLogs",
      "queryScope": "COLLECTION_GROUP",
      "fields": [
        { "fieldPath": "orgId", "order": "ASCENDING" },
        { "fieldPath": "recordedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "auditLogs",
      "queryScope": "COLLECTION_GROUP",
      "fields": [
        { "fieldPath": "orgId", "order": "ASCENDING" },
        { "fieldPath": "recordedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "organizations",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "memberIds",
          "arrayConfig": "CONTAINS"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    }
  ],
  "fieldOverrides": []
}
````

## File: src/shared-infra/firebase/firestore/firestore.rules
````
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
````

## File: src/shared-infra/firebase/functions/.eslintrc.js
````javascript
"/lib/**/*", // Ignore built files.
"/generated/**/*", // Ignore generated files.
````

## File: src/shared-infra/firebase/functions/.gitignore
````
# Compiled JavaScript files
lib/**/*.js
lib/**/*.js.map

# TypeScript v1 declaration files
typings/

# Node.js dependency directory
node_modules/
*.local
````

## File: src/shared-infra/firebase/functions/package.json
````json
{
  "name": "functions",
  "scripts": {
    "lint": "echo \"skip lint\"",
    "build": "tsc",
    "build:watch": "tsc --watch",
    "serve": "npm run build && firebase emulators:start --only functions",
    "shell": "npm run build && firebase functions:shell",
    "start": "npm run shell",
    "deploy": "firebase deploy --only functions",
    "logs": "firebase functions:log"
  },
  "engines": {
    "node": "22"
  },
  "main": "lib/index.js",
  "dependencies": {
    "firebase-admin": "^13.6.0",
    "firebase-functions": "^7.0.0"
  },
  "devDependencies": {
    "@typescript-eslint/eslint-plugin": "^5.12.0",
    "@typescript-eslint/parser": "^5.12.0",
    "eslint": "^8.9.0",
    "eslint-config-google": "^0.14.0",
    "eslint-plugin-import": "^2.25.4",
    "firebase-functions-test": "^3.4.1",
    "typescript": "^5.7.3"
  },
  "private": true
}
````

## File: src/shared-infra/firebase/functions/src/claims/claims-refresh.fn.ts
````typescript
/**
 * claims-refresh.fn.ts — CLAIMS_HANDLER
 *
 * [S6]  SK_TOKEN_REFRESH_CONTRACT
 *       觸發：RoleChanged | PolicyChanged (from IER CRITICAL_LANE)
 *       步驟：1. 讀取最新 role/policy
 *             2. 更新 Firebase Auth Custom Claims
 *             3. 發出 TOKEN_REFRESH_SIGNAL
 *       失敗：→ DLQ SECURITY_BLOCK + 告警
 * [R8]  traceId 從 envelope 讀取，禁止覆蓋
 */
⋮----
import { onRequest } from "firebase-functions/v2/https";
⋮----
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { initializeApp, getApps } from "firebase-admin/app";
import type { EventEnvelope } from "../types.js";
⋮----
interface ClaimsRefreshPayload {
  readonly userId: string;
  readonly orgId?: string;
  readonly roles?: string[];
  readonly scopes?: string[];
}
⋮----
/**
 * claims-refresh-handler — CLAIMS_H
 * [S6] Triggered by RoleChanged / PolicyChanged events from CRITICAL_LANE
 */
⋮----
// [S6] Only handle RoleChanged / PolicyChanged
⋮----
traceId: envelope.traceId, // [R8]
⋮----
// 1. Read latest authoritative role/policy from Firestore (STRONG_READ [S3])
⋮----
// 2. Build custom claims snapshot [#5]
⋮----
// 3. Update Firebase Auth Custom Claims [S6]
⋮----
// 4. Emit TOKEN_REFRESH_SIGNAL (write to Firestore signaling collection) [S6]
⋮----
traceId: envelope.traceId, // [R8]
⋮----
// [S6] Failure → DLQ SECURITY_BLOCK + alert
⋮----
// TODO: write to dlq-security-block collection for manual review
````

## File: src/shared-infra/firebase/functions/src/dlq/dlq-block.fn.ts
````typescript
/**
 * dlq-block.fn.ts — DLQ SECURITY_BLOCK
 *
 * [R5]  SECURITY_BLOCK: 安全事件
 *       ⛔ 禁止自動 Replay — 必須人工審查
 *       步驟: 1. 告警 (DOMAIN_ERRORS)
 *             2. 凍結受影響實體
 *             3. 等待 security team 人工確認後才可 Replay
 * [S6]  Claims refresh failure → SECURITY_BLOCK
 *
 * NOTE: Kept as onRequest (HTTPS) — Firebase blocks changing from HTTPS to
 *       background trigger without deleting the function first.
 *       Called by outbox-relay after writing the failed record to Firestore.
 */
⋮----
import { onRequest } from "firebase-functions/v2/https";
⋮----
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { initializeApp, getApps } from "firebase-admin/app";
⋮----
interface DlqBlockRecord {
  readonly eventId: string;
  readonly eventType: string;
  readonly aggregateId: string;
  readonly traceId: string;
  readonly [key: string]: unknown;
}
⋮----
/**
 * DLQ SECURITY_BLOCK processor
 * ⛔ NEVER auto-replays. Freezes entity + alerts security team.
 * POST body: DlqBlockRecord — called by outbox-relay after writing to dlq-security-block
 */
⋮----
// ⛔ [R5] Log as SECURITY_BLOCK — never auto-replay
⋮----
// Mark DLQ record as FROZEN
⋮----
// ⛔ autoReplayEnabled is explicitly false — security requirement
⋮----
// Freeze the affected aggregate entity
⋮----
traceId: record.traceId, // [R8]
// ⛔ No further operations are allowed until security team approves replay
⋮----
// Alert path: write to domain-error-log for VS9 observability alerting [R5]
⋮----
traceId: record.traceId, // [R8]
````

## File: src/shared-infra/firebase/functions/src/dlq/dlq-review.fn.ts
````typescript
/**
 * dlq-review.fn.ts — DLQ REVIEW_REQUIRED
 *
 * [R5]  REVIEW_REQUIRED: 金融/排班/角色事件・人工確認後 Replay
 *       包含: WalletDeducted / ScheduleAssigned / RoleChanged / OrgContextProvisioned
 * [S1]  idempotency-key 保留供 Replay 使用
 *
 * NOTE: Kept as onRequest (HTTPS) — Firebase blocks changing from HTTPS to
 *       background trigger without deleting the function first.
 *       Called by outbox-relay after writing the failed record to Firestore.
 */
⋮----
import { onRequest } from "firebase-functions/v2/https";
⋮----
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { initializeApp, getApps } from "firebase-admin/app";
⋮----
interface DlqReviewRecord {
  readonly eventId: string;
  readonly eventType: string;
  readonly aggregateId?: string;
  readonly traceId: string;
  readonly idempotencyKey: string;
  readonly [key: string]: unknown;
}
⋮----
/**
 * DLQ REVIEW_REQUIRED processor
 * Records the failed event and notifies for manual review.
 * Does NOT auto-replay — awaits explicit human approval.
 * POST body: DlqReviewRecord — called by outbox-relay after writing to dlq-review-required
 */
⋮----
idempotencyKey: record.idempotencyKey, // [S1] preserved for replay
⋮----
// Mark as awaiting review
⋮----
// Create review request document for operator dashboard
⋮----
// TODO: notify on-call team (e.g., via PagerDuty, Slack webhook, or FCM)
````

## File: src/shared-infra/firebase/functions/src/dlq/dlq-safe.fn.ts
````typescript
/**
 * dlq-safe.fn.ts — DLQ SAFE_AUTO
 *
 * [R5]  SAFE_AUTO: 冪等事件・自動 Replay（保留 idempotency-key）
 * [S1]  idempotency-key 格式：eventId+aggId+version
 *
 * NOTE: Kept as onRequest (HTTPS) — Firebase blocks changing from HTTPS to
 *       background trigger without deleting the function first.
 *       Called by outbox-relay after writing the failed record to Firestore.
 */
⋮----
import { onRequest } from "firebase-functions/v2/https";
⋮----
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { initializeApp, getApps } from "firebase-admin/app";
⋮----
interface DlqSafeRecord {
  readonly eventId: string;
  readonly traceId: string;
  readonly idempotencyKey: string;
  readonly [key: string]: unknown;
}
⋮----
/**
 * DLQ SAFE_AUTO processor: auto-replay idempotent events
 * POST body: DlqSafeRecord — called by outbox-relay after writing to dlq-safe-auto
 */
⋮----
idempotencyKey: record.idempotencyKey, // [S1] preserved
⋮----
// Check idempotency: if already delivered, skip
⋮----
// TODO: re-deliver to IER (publish to Pub/Sub or direct call)
⋮----
// await publishToIer(record);
⋮----
function sleep(ms: number): Promise<void>
````

## File: src/shared-infra/firebase/functions/src/gateway/command-gateway.fn.ts
````typescript
/**
 * command-gateway.fn.ts — CBG_ENTRY (L2 Command Gateway)
 *
 * [R8]  TraceID 在此處注入一次，全鏈唯讀不可覆蓋
 * [S5]  遵守 SK_RESILIENCE_CONTRACT: rate-limit / circuit-break / bulkhead
 */
⋮----
import { onRequest } from "firebase-functions/v2/https";
⋮----
import { randomUUID } from "crypto";
⋮----
/** SK_CMD_RESULT contract shape */
interface CommandSuccess {
  readonly success: true;
  readonly aggregateId: string;
  readonly version: number;
}
⋮----
interface DomainError {
  readonly code: string;
  readonly message: string;
  readonly aggregateId?: string;
}
⋮----
interface CommandFailure {
  readonly success: false;
  readonly error: DomainError;
}
⋮----
type CommandResult = CommandSuccess | CommandFailure;
⋮----
/** Simple in-process rate-limit counter (replace with Redis/Firestore in prod) */
⋮----
function checkRateLimit(key: string): boolean
⋮----
/**
 * unified-command-gateway
 * CBG_ENTRY: injects traceId → event-envelope [R8]
 * POST /command-gateway  body: { aggregateType, command, payload }
 */
⋮----
// [R8] TraceID injected ONCE at CBG_ENTRY
⋮----
// [S5] Rate limit per user / per org
⋮----
// TODO: authority-interceptor → authority-snapshot validation
// TODO: command-router → route to VS1/VS2/VS3/VS4/VS5/VS6 slice handlers
⋮----
void payload; // consumed by router (TODO)
````

## File: src/shared-infra/firebase/functions/src/gateway/webhook.fn.ts
````typescript
/**
 * webhook.fn.ts — Webhook / Edge Function Entry Point
 *
 * [S5]  遵守 SK_RESILIENCE_CONTRACT: rate-limit / circuit-break / bulkhead
 * [R8]  traceId 必須從入站 header 傳入或在此生成後全鏈傳遞（唯讀）
 */
⋮----
import { onRequest } from "firebase-functions/v2/https";
⋮----
import { randomUUID } from "crypto";
⋮----
/**
 * Webhook entry point — receives external event callbacks
 * (e.g., payment processor callbacks, third-party integrations)
 * POST /webhook  body: { source, eventType, data }
 */
⋮----
// [R8] Inject traceId at entry; propagate read-only downstream
⋮----
// TODO: verify HMAC signature against shared secret
// TODO: [S5] apply rate-limit per source identifier
// TODO: [S5] circuit-break on consecutive failures
⋮----
void data; // forwarded to command router (TODO)
⋮----
// TODO: route to command-gateway CBG_ENTRY with injected traceId
````

## File: src/shared-infra/firebase/functions/src/ier/background.lane.fn.ts
````typescript
/**
 * background.lane.fn.ts — IER BACKGROUND_LANE Processor
 *
 * [P1]  SLA < 30s
 *       TagLifecycleEvent → tag-lifecycle-subscriber [T1]
 *       AuditEvents → audit-event-collector
 * [R8]  envelope.traceId 禁止覆蓋
 */
⋮----
import { onRequest } from "firebase-functions/v2/https";
⋮----
import type { EventEnvelope } from "../types.js";
⋮----
/** BACKGROUND_LANE: eventual delivery, SLA < 30s */
⋮----
traceId: envelope.traceId, // [R8]
⋮----
// [T1] → tag-lifecycle-subscriber → update SKILL_TAG_POOL
// [S4] TAG_MAX_STALENESS ≤ 30s
⋮----
// → audit-event-collector → GLOBAL_AUDIT_VIEW
// [R8] audit record MUST include traceId
⋮----
traceId: envelope.traceId, // [R8] every audit record must contain traceId
````

## File: src/shared-infra/firebase/functions/src/ier/critical.lane.fn.ts
````typescript
/**
 * critical.lane.fn.ts — IER CRITICAL_LANE Processor
 *
 * [P1]  高優先最終一致
 *       RoleChanged → Claims 刷新 [S6]
 *       WalletDeducted / WalletCredited
 *       OrgContextProvisioned
 * [R8]  envelope.traceId 禁止覆蓋
 */
⋮----
import { onRequest } from "firebase-functions/v2/https";
⋮----
import type { EventEnvelope } from "../types.js";
⋮----
/** CRITICAL_LANE: high-priority delivery, invokes downstream handlers synchronously */
⋮----
traceId: envelope.traceId, // [R8]
⋮----
// [S6] → claims-refresh-handler
// TODO: call claims-refresh function or Pub/Sub
⋮----
// [E2] → org-context.acl → Workspace local Context
⋮----
// Wallet balance projection update [S3: STRONG_READ for balance queries]
⋮----
// TODO: route to CRITICAL_PROJ_LANE for projection writes [S2]
````

## File: src/shared-infra/firebase/functions/src/ier/ier.fn.ts
````typescript
/**
 * ier.fn.ts — Integration Event Router (IER) — Main Entry
 *
 * [#9]  統一事件出口
 * [R8]  保留 envelope.traceId — 禁止覆蓋
 * [P1]  優先級三道分層: CRITICAL / STANDARD / BACKGROUND
 */
⋮----
import { onRequest } from "firebase-functions/v2/https";
⋮----
import type { EventEnvelope } from "../types.js";
⋮----
// Re-export EventEnvelope so existing imports from this file continue to work
⋮----
/** Known event types for each lane */
⋮----
/**
 * Resolve IER lane from event type (CRITICAL > BACKGROUND > STANDARD default)
 */
export function resolveLane(
  eventType: string
): "CRITICAL" | "STANDARD" | "BACKGROUND"
⋮----
/**
 * integration-event-router (HTTP trigger)
 * Called by outbox-relay with the envelope payload.
 * Routes to the appropriate lane function.
 */
⋮----
// [R8] Preserve traceId — do NOT regenerate
⋮----
traceId, // [R8]
⋮----
// TODO: fan-out to lane-specific functions or Pub/Sub topics
// Critical: immediate delivery for Role/Policy/Wallet events
// Standard: async delivery for domain events
// Background: eventual delivery for Tag/Audit events
````

## File: src/shared-infra/firebase/functions/src/ier/standard.lane.fn.ts
````typescript
/**
 * standard.lane.fn.ts — IER STANDARD_LANE Processor
 *
 * [P1]  非同步最終一致, SLA < 2s
 *       SkillXpAdded / SkillXpDeducted
 *       ScheduleAssigned / ScheduleProposed
 *       MemberJoined / MemberLeft
 *       All remaining domain events
 * [R8]  envelope.traceId 禁止覆蓋
 */
⋮----
import { onRequest } from "firebase-functions/v2/https";
⋮----
import type { EventEnvelope } from "../types.js";
⋮----
/** STANDARD_LANE: async delivery for domain events, SLA < 2s */
⋮----
traceId: envelope.traceId, // [R8]
⋮----
// [E3] → notification-router
⋮----
// [#A5] → scheduling-saga
⋮----
// TODO: forward to STANDARD_PROJ_LANE for projection writes [S2]
````

## File: src/shared-infra/firebase/functions/src/index.ts
````typescript
/**
 * Firebase Cloud Functions — Entry Point
 *
 * Architecture per docs/logic-overview.md (SSOT)
 *
 * L2 Gateway:      command-gateway, webhook
 * L4 IER:          ier, criticalLane, standardLane, backgroundLane
 * L4 Relay:        outboxRelay
 * VS1 Claims:      claimsRefresh
 * DLQ:             dlqSafe, dlqReview, dlqBlock
 * L5 Projection:   eventFunnel, criticalProj, standardProj
 * L9 Observability: domainMetrics, domainErrors, domainErrorWatcher
 */
⋮----
import { initializeApp, getApps } from "firebase-admin/app";
import { setGlobalOptions } from "firebase-functions/v2";
⋮----
// Initialize Firebase Admin SDK once
⋮----
// Global defaults: region + max-instances for cost control
⋮----
// ── Shared Types (re-exported for consumers) ─────────────────────────────────
⋮----
// ── L2 Command Gateway ────────────────────────────────────────────────────────
⋮----
// ── L4 Outbox Relay ───────────────────────────────────────────────────────────
⋮----
// ── L4 Integration Event Router (IER) ────────────────────────────────────────
⋮----
// ── VS1 Claims Refresh ────────────────────────────────────────────────────────
⋮----
// ── DLQ Three-Tier ────────────────────────────────────────────────────────────
⋮----
// ── L5 Projection Bus ─────────────────────────────────────────────────────────
⋮----
// ── L9 Observability ──────────────────────────────────────────────────────────
````

## File: src/shared-infra/firebase/functions/src/observability/domain-errors.fn.ts
````typescript
/**
 * domain-errors.fn.ts — VS9 Observability · Domain Error Log
 *
 * Sources:
 *   - WS_TX_RUNNER errors
 *   - SCHEDULE_SAGA errors
 *   - DLQ_BLOCK security events [R5]
 *   - StaleTagWarning [S4]
 *   - TOKEN_REFRESH failures [S6]
 * [R8]  every error record MUST include traceId
 *
 * NOTE: domainErrorWatcher kept as onRequest (HTTPS) — Firebase blocks changing
 *       from HTTPS to background trigger without deleting the function first.
 */
⋮----
import { onRequest } from "firebase-functions/v2/https";
⋮----
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { initializeApp, getApps } from "firebase-admin/app";
⋮----
type ErrorLevel = "INFO" | "WARN" | "ERROR" | "CRITICAL";
type ErrorSource =
  | "WS_TX_RUNNER"
  | "SCHEDULE_SAGA"
  | "DLQ_SECURITY_BLOCK"
  | "STALE_TAG_WARNING"
  | "TOKEN_REFRESH_FAILURE"
  | "GENERIC";
⋮----
interface DomainErrorEvent {
  readonly level: ErrorLevel;
  readonly source: ErrorSource;
  /** [R8] traceId required on every error record */
  readonly traceId?: string;
  readonly aggregateId?: string;
  readonly eventType?: string;
  readonly message: string;
  readonly details?: unknown;
}
⋮----
/** [R8] traceId required on every error record */
⋮----
/**
 * domain-error-log HTTP endpoint
 * Accepts error events from any domain node and persists them.
 */
⋮----
traceId: errorEvent.traceId ?? null, // [R8]
⋮----
/**
 * domain-error-watcher: HTTPS endpoint for critical domain error alerts
 * Accepts CRITICAL error event notifications and triggers alerting logic.
 * NOTE: Kept as onRequest — Firebase blocks HTTPS→background trigger change.
 */
⋮----
traceId: entry.traceId, // [R8]
⋮----
// TODO: send alert via PagerDuty / Slack / email for CRITICAL events
// Especially for: DLQ_SECURITY_BLOCK, TOKEN_REFRESH_FAILURE
````

## File: src/shared-infra/firebase/functions/src/observability/domain-metrics.fn.ts
````typescript
/**
 * domain-metrics.fn.ts — VS9 Observability · Domain Metrics
 *
 * Tracks across the event pipeline:
 *   - IER Lane Throughput / Latency
 *   - FUNNEL Lane processing time
 *   - OUTBOX_RELAY lag [R1]
 *   - RATE_LIMIT hit / CIRCUIT open
 * [R8]  每條記錄必須帶 traceId
 */
⋮----
import { onRequest } from "firebase-functions/v2/https";
⋮----
import { getFirestore, Timestamp, FieldValue } from "firebase-admin/firestore";
import { initializeApp, getApps } from "firebase-admin/app";
⋮----
interface MetricEvent {
  readonly metricType:
    | "IER_THROUGHPUT"
    | "IER_LATENCY"
    | "FUNNEL_PROCESSING"
    | "RELAY_LAG"
    | "RATE_LIMIT_HIT"
    | "CIRCUIT_OPEN"
    | "CIRCUIT_HALF_OPEN"
    | "CLAIMS_REFRESH_SUCCESS";
  readonly lane?: "CRITICAL" | "STANDARD" | "BACKGROUND";
  readonly traceId?: string; // [R8]
  readonly valueMs?: number;
  readonly labels?: Record<string, string>;
}
⋮----
readonly traceId?: string; // [R8]
⋮----
/**
 * domain-metrics collector
 * Receives metric events from IER, FUNNEL, RELAY, CBG, and persists them.
 */
⋮----
traceId: metric.traceId, // [R8]
⋮----
// Append metric to time-series collection
⋮----
traceId: metric.traceId ?? null, // [R8]
⋮----
// Update rolling counter per metric type
````

## File: src/shared-infra/firebase/functions/src/projection/critical-proj.fn.ts
````typescript
/**
 * critical-proj.fn.ts — CRITICAL_PROJ_LANE Projection Processor
 *
 * [S4]  PROJ_STALE_CRITICAL ≤ 500ms
 *       Targets: workspace-scope-guard-view, org-eligible-member-view, wallet-balance
 * [S2]  SK_VERSION_GUARD: applyVersionGuard() before every write
 * [R8]  traceId carried in every projection record
 */
⋮----
import { onRequest } from "firebase-functions/v2/https";
⋮----
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { initializeApp, getApps } from "firebase-admin/app";
import type { EventEnvelope } from "../types.js";
import {
  PROJ_STALE_CRITICAL_MS,
} from "../staleness-contract.js";
⋮----
// [S4] PROJ_STALE_CRITICAL_MS imported from staleness-contract
⋮----
/**
 * critical-proj: processes CRITICAL_PROJ_LANE events
 * Independent retry / dead-letter from STANDARD_PROJ_LANE
 */
⋮----
traceId: envelope.traceId, // [R8]
⋮----
// workspace-scope-guard-view: authorization snapshot
⋮----
traceId: envelope.traceId, // [R8]
⋮----
// org-eligible-member-view
⋮----
traceId: envelope.traceId, // [R8]
⋮----
// wallet-balance: [S3] EVENTUAL_READ for display, STRONG_READ for transactions
⋮----
traceId: envelope.traceId, // [R8]
````

## File: src/shared-infra/firebase/functions/src/projection/event-funnel.fn.ts
````typescript
/**
 * event-funnel.fn.ts — Event Funnel (FUNNEL)
 *
 * [#9]  唯一 Projection 寫入路徑
 * [Q3]  upsert by idempotency-key
 * [R8]  從 envelope 讀取 traceId → DOMAIN_METRICS
 * [S2]  所有 Lane 遵守 SK_VERSION_GUARD
 *       event.aggregateVersion > view.lastProcessedVersion → 允許更新，否則丟棄
 */
⋮----
import { onRequest } from "firebase-functions/v2/https";
⋮----
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { initializeApp, getApps } from "firebase-admin/app";
import type { EventEnvelope } from "../types.js";
import {
  PROJ_STALE_CRITICAL_MS,
  PROJ_STALE_STANDARD_MS,
} from "../staleness-contract.js";
⋮----
/** [S4] SLA constants from staleness-contract — never hardcoded */
⋮----
/**
 * [S2] SK_VERSION_GUARD: discard stale events before any Projection write
 */
async function applyVersionGuard(
  db: FirebaseFirestore.Firestore,
  viewCollection: string,
  aggregateId: string,
  incomingVersion: number
): Promise<boolean>
⋮----
/**
 * event-funnel: [#9] the ONLY Projection write path
 * Receives events from IER lanes and writes to appropriate read-model views.
 */
⋮----
traceId: envelope.traceId, // [R8]
⋮----
// Determine target projection collection from event type
⋮----
// [S2] Version guard — discard stale events
⋮----
// [Q3] upsert by idempotency-key
⋮----
lastProcessedVersion: envelope.aggregateVersion, // [S2]
traceId: envelope.traceId, // [R8] every projection record must contain traceId
⋮----
// [R8] Emit metrics with traceId
⋮----
traceId: envelope.traceId, // [R8] → DOMAIN_METRICS
⋮----
interface ProjectionTarget {
  viewCollection: string;
  lane: "CRITICAL" | "STANDARD";
}
⋮----
function resolveProjectionTarget(eventType: string): ProjectionTarget | null
⋮----
// CRITICAL projections [S4: ≤500ms]
⋮----
// STANDARD projections [S4: ≤10s]
⋮----
function buildProjectionUpdate(envelope: EventEnvelope): Record<string, unknown>
⋮----
// Each event type may update different fields — extend per domain
⋮----
function checkSla(lane: "CRITICAL" | "STANDARD", processingMs: number): boolean
````

## File: src/shared-infra/firebase/functions/src/projection/standard-proj.fn.ts
````typescript
/**
 * standard-proj.fn.ts — STANDARD_PROJ_LANE Projection Processor
 *
 * [S4]  PROJ_STALE_STANDARD ≤ 10s
 *       Targets: workspace-view, account-schedule, account-view,
 *                organization-view, account-skill-view, global-audit-view, tag-snapshot
 * [S2]  SK_VERSION_GUARD: applyVersionGuard() before every write
 * [R8]  traceId carried in every projection record
 */
⋮----
import { onRequest } from "firebase-functions/v2/https";
⋮----
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { initializeApp, getApps } from "firebase-admin/app";
import type { EventEnvelope } from "../types.js";
import {
  PROJ_STALE_STANDARD_MS,
} from "../staleness-contract.js";
⋮----
// [S4] PROJ_STALE_STANDARD_MS imported from staleness-contract
⋮----
/** Standard projection view → collection name mapping */
⋮----
/**
 * standard-proj: processes STANDARD_PROJ_LANE events
 * Independent retry / dead-letter from CRITICAL_PROJ_LANE
 */
⋮----
traceId: envelope.traceId, // [R8]
⋮----
// [S2] Version guard
⋮----
// [Q3] upsert by idempotency-key
⋮----
lastProcessedVersion: envelope.aggregateVersion, // [S2]
traceId: envelope.traceId, // [R8] every projection record must contain traceId
⋮----
traceId: envelope.traceId, // [R8] → DOMAIN_METRICS
````

## File: src/shared-infra/firebase/functions/src/relay/outbox-relay.fn.ts
````typescript
/**
 * outbox-relay.fn.ts — OUTBOX Relay Worker
 *
 * [R1]  HTTPS endpoint: called by app-layer infra.outbox-relay CDC scanner
 *       POST body: OutboxRecord → delivers to IER → handles failures
 * [S1]  at-least-once delivery with idempotency-key
 *       失敗: retry backoff → 3 次 → DLQ
 *       監控: relay_lag → VS9
 * [R8]  traceId 從 envelope 讀取，禁止覆蓋
 */
⋮----
import { onRequest } from "firebase-functions/v2/https";
⋮----
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { initializeApp, getApps } from "firebase-admin/app";
import type { EventEnvelope } from "../types.js";
import { dlqCollectionName } from "../types.js";
⋮----
/** Timeout for DLQ HTTPS processor notification calls [memory: outbox relay DLQ integration]. */
⋮----
interface OutboxRecord extends EventEnvelope {
  deliveryAttempts: number;
  lastAttemptAt?: Timestamp;
  status: "PENDING" | "DELIVERED" | "FAILED";
}
⋮----
/**
 * outbox-relay: HTTPS endpoint called by app-layer CDC scanner [R1]
 * POST body: OutboxRecord (single event envelope from any outbox collection)
 * Returns: 202 Accepted on delivery, 500 on DLQ routing
 */
⋮----
traceId: record.traceId, // [R8] propagate read-only
⋮----
// TODO: call IER function URL directly based on record.lane
⋮----
/** Deliver envelope to IER via direct HTTP call [R1] */
async function deliverToIer(record: OutboxRecord): Promise<void>
⋮----
// TODO: call IER function URL directly based on record.lane
//   const ierUrl = process.env.IER_FUNCTION_URL;
//   await fetch(ierUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(record) });
⋮----
/** Move failed event to the appropriate DLQ collection [S1] and notify DLQ processor */
async function moveToDlq(
  db: FirebaseFirestore.Firestore,
  record: OutboxRecord,
  error: unknown
): Promise<void>
⋮----
// Notify the appropriate DLQ HTTPS processor endpoint [R5]
// Each DLQ tier has a dedicated onRequest handler that processes the record.
⋮----
// Non-fatal: the DLQ Firestore record is already written; processor will be retried separately
⋮----
/**
 * Returns the DLQ HTTPS processor URL for the given tier, or null if not configured.
 * Reads from environment variables:
 *   - DLQ_SAFE_URL     → dlqSafe Cloud Function URL (SAFE_AUTO tier)
 *   - DLQ_REVIEW_URL   → dlqReview Cloud Function URL (REVIEW_REQUIRED tier)
 *   - DLQ_BLOCK_URL    → dlqBlock Cloud Function URL (SECURITY_BLOCK tier)
 *
 * @param dlqTier - One of "SAFE_AUTO", "REVIEW_REQUIRED", "SECURITY_BLOCK"
 * @returns HTTPS URL string, or null if env var is unset
 */
function getDlqProcessorUrl(dlqTier: string): string | null
⋮----
function sleep(ms: number): Promise<void>
````

## File: src/shared-infra/firebase/functions/src/staleness-contract.ts
````typescript
/**
 * staleness-contract.ts — SK_STALENESS_CONTRACT constants [S4]
 *
 * [S4]  SLA numbers are FORBIDDEN in component/node text.
 *       Always reference these constants. Never hardcode 30000, 500, or 10000 ms.
 */
⋮----
/** [S4] TAG_MAX_STALENESS: tag-derived data ≤ 30s */
⋮----
/** [S4] PROJ_STALE_CRITICAL: authorization/scheduling projections ≤ 500ms */
⋮----
/** [S4] PROJ_STALE_STANDARD: general projections ≤ 10s */
````

## File: src/shared-infra/firebase/functions/src/types.ts
````typescript
/**
 * types.ts — Shared Firebase Functions types
 *
 * Single source of truth for EventEnvelope and related contracts.
 * Import from here instead of defining locally per function module.
 */
⋮----
import { Timestamp } from "firebase-admin/firestore";
⋮----
/** [R8] EventEnvelope: traceId injected ONCE at CBG_ENTRY, never overwritten */
export interface EventEnvelope {
  readonly eventId: string;
  readonly aggregateId: string;
  readonly aggregateVersion: number;
  /** [R8] Injected once at CBG_ENTRY. NEVER regenerate or overwrite in downstream nodes. */
  readonly traceId: string;
  readonly eventType: string;
  readonly payload: unknown;
  readonly idempotencyKey: string;
  readonly lane: "CRITICAL" | "STANDARD" | "BACKGROUND";
  readonly dlqTier: "SAFE_AUTO" | "REVIEW_REQUIRED" | "SECURITY_BLOCK";
  readonly createdAt: Timestamp;
}
⋮----
/** [R8] Injected once at CBG_ENTRY. NEVER regenerate or overwrite in downstream nodes. */
⋮----
/** [S1] DLQ tier enum */
export type DlqTier = "SAFE_AUTO" | "REVIEW_REQUIRED" | "SECURITY_BLOCK";
⋮----
/** [S1] DLQ collection name mapping — single source of truth */
export function dlqCollectionName(tier: DlqTier): string
````

## File: src/shared-infra/firebase/functions/tsconfig.dev.json
````json
{
  "include": [
    ".eslintrc.js"
  ]
}
````

## File: src/shared-infra/firebase/functions/tsconfig.json
````json
{
  "compilerOptions": {
    "module": "NodeNext",
    "esModuleInterop": true,
    "moduleResolution": "nodenext",
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "outDir": "lib",
    "sourceMap": true,
    "strict": true,
    "skipLibCheck": true,
    "target": "es2017"
  },
  "compileOnSave": true,
  "include": [
    "src"
  ]
}
````

## File: src/shared-infra/firebase/storage/storage.rules
````
rules_version = '2';

// Craft rules based on data in your Firestore database
// allow write: if firestore.get(
//    /databases/(default)/documents/users/$(request.auth.uid)).data.isAdmin;
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
````

## File: src/shared-infra/README.MD
````markdown
放置外部基礎設施適配器：資料庫、第三方 SDK、網路存取層，需透過 ports 封裝。
只允許向下依賴；向上 import 為架構違規。
````

## File: src/shared/app-providers/_queries.ts
````typescript
/**
 * @fileoverview shared/app-providers/_queries.ts
 *
 * Subscription factories for shared app-level providers.
 * All Firestore / infra imports are encapsulated here so that
 * `app-context.tsx` (and any future app-level provider) has zero direct
 * Firebase SDK or infra imports — satisfying D24 and D5.
 *
 * Pattern mirrors `workspace.slice/core/_queries.ts`.
 */
⋮----
import { db } from '@/shared/infra/firestore/firestore.client';
import {
  collection,
  onSnapshot,
  query,
  type Unsubscribe,
  where,
} from '@/shared/infra/firestore/firestore.read.adapter';
import { snapshotToRecord } from '@/shared/infra/firestore/firestore.utils';
import type { Account } from '@/shared/types';
⋮----
/**
 * Opens a real-time listener on accounts where `memberIds` contains `userId`.
 * Calls `onUpdate` with a parsed `Record<string, Account>` on every change.
 */
export function subscribeToAccountsForUser(
  userId: string,
  onUpdate: (accounts: Record<string, Account>) => void,
): Unsubscribe
````

## File: src/shared/app-providers/app-context.tsx
````typescript
/**
 * shared/app-providers/app-context.tsx
 *
 * Active Account Context — cross-cutting identity state.
 *
 * Holds the set of accounts visible to the current user plus the
 * currently active account selection.  This context is consumed by
 * both the Subject Center slices (account-organization.*, account-user.*,
 * account-governance.*) and the Workspace Container (workspace-core)
 * without creating a circular dependency.
 *
 * Dependency direction:
 *   Subject Center ──▶ shared/app-providers/app-context  ◀── workspace-core
 *
 * NOT a Workspace Container concern — account selection predates any
 * workspace context and must be accessible to Subject Center slices.
 */
⋮----
import type React from 'react'
import { type ReactNode, createContext, useReducer, useEffect } from 'react'
import { useContext } from 'react'
⋮----
import { type Account, type CapabilitySpec, type Notification } from '@/shared/types'
⋮----
import { subscribeToAccountsForUser } from './_queries'
import { useAuth } from './auth-provider'
⋮----
// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------
⋮----
export interface AppState {
  accounts: Record<string, Account>
  activeAccount: Account | null
  notifications: Notification[]
  capabilitySpecs: CapabilitySpec[]
  scheduleTaskRequest: { taskName: string; workspaceId: string } | null
}
⋮----
export type AppAction =
  | { type: 'SET_ACCOUNTS'; payload: { accounts: Record<string, Account>; user: Account } }
  | { type: 'SET_ACTIVE_ACCOUNT'; payload: Account | null }
  | { type: 'RESET_STATE' }
  | { type: 'ADD_NOTIFICATION'; payload: Omit<Notification, 'id' | 'timestamp' | 'read'> }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'CLEAR_NOTIFICATIONS' }
  | { type: 'REQUEST_SCHEDULE_TASK'; payload: { taskName: string; workspaceId: string } }
  | { type: 'CLEAR_SCHEDULE_TASK_REQUEST' }
⋮----
// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------
⋮----
// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------
⋮----
function appReducer(state: AppState, action: AppAction): AppState
⋮----
// ---------------------------------------------------------------------------
// Context + Provider
// ---------------------------------------------------------------------------
⋮----
// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
````

## File: src/shared/app-providers/auth-provider.tsx
````typescript
import { type User as FirebaseUser } from "firebase/auth";
import type React from 'react';
import {type ReactNode} from 'react';
import { createContext, useReducer, useContext, useEffect } from 'react';
⋮----
import { authAdapter } from '@/shared/infra/auth/auth.adapter';
import { type Account } from '@/shared/types';
⋮----
interface AuthState {
  user: Account | null;
  authInitialized: boolean;
}
⋮----
type Action =
  | { type: 'SET_AUTH_STATE'; payload: { user: Account | null, initialized: boolean } }
  | { type: 'UPDATE_USER_PROFILE'; payload: Partial<Account> };
⋮----
const authReducer = (state: AuthState, action: Action): AuthState =>
⋮----
// This action only updates the client-side state. The actual update happens in the adapter.
// We also need to trigger the Firebase SDK update.
⋮----
export const AuthProvider = (
⋮----
const logout = async () =>
⋮----
export const useAuth = () =>
````

## File: src/shared/app-providers/firebase-provider.tsx
````typescript
import { type FirebaseApp } from 'firebase/app';
import { type Auth } from 'firebase/auth';
import { type Firestore } from 'firebase/firestore';
import { type FirebaseStorage } from 'firebase/storage';
import { createContext, useContext, type ReactNode } from 'react';
⋮----
import { app } from '@/shared/infra/app.client';
import { auth } from '@/shared/infra/auth/auth.client';
import { db } from '@/shared/infra/firestore/firestore.client';
import { storage } from '@/shared/infra/storage/storage.client';
⋮----
interface FirebaseContextType {
  app: FirebaseApp;
  db: Firestore;
  auth: Auth;
  storage: FirebaseStorage;
}
⋮----
export function FirebaseClientProvider(
⋮----
export const useFirebase = () =>
````

## File: src/shared/app-providers/theme-provider.tsx
````typescript
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes";
⋮----
/**
 * Theme Context
 * 
 * Provides theme switching functionality using next-themes.
 * Supports light, dark, and system preference modes.
 * 
 * Usage:
 * - Wrap app with ThemeProvider in root layout
 * - Use useTheme hook in components to access/change theme
 * 
 * @example
 * ```tsx
 * import { useTheme } from '@/shared/app-providers/theme-provider';
 * 
 * function ThemeToggle() {
 *   const { theme, setTheme } = useTheme();
 *   return (
 *     <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
 *       Toggle theme
 *     </button>
 *   );
 * }
 * ```
 */
export function ThemeProvider(
⋮----
/**
 * useTheme Hook
 * 
 * Re-exported from next-themes for convenience.
 * Provides access to current theme state and setTheme function.
 * 
 * Returns:
 * - theme: Current theme ('light', 'dark', or 'system')
 * - setTheme: Function to change theme
 * - resolvedTheme: Actual theme being used (resolves 'system' to 'light' or 'dark')
 * - systemTheme: System's current theme preference
 * - themes: Available theme options
 * 
 * Note: Always check if component is mounted before using theme value
 * to avoid hydration mismatches.
 */
````

## File: src/shared/constants/location-units.ts
````typescript
/**
 * @fileoverview shared/constants/location-units.ts — Location measurement unit constants.
 *
 * Covers the common spatial / positional designators used in Taiwanese
 * technology parks, industrial estates, science parks and construction sites:
 *   棟 (building block), 樓 (floor), 區 (zone), 室 (room/unit), 號 (number),
 *   廠 (factory/plant), 倉 (warehouse), 期 (phase), 座 (tower), 基地 (campus/site),
 *   柱 (structural column / pillar position)
 *
 * Usage:
 *   import { LOCATION_UNITS, LOCATION_UNIT_BY_KEY, type LocationUnitKey }
 *     from '@/shared/constants/location-units';
 */
⋮----
// ---------------------------------------------------------------------------
// Type definitions
// ---------------------------------------------------------------------------
⋮----
/** Stable key for a location unit — used as the value in form fields / data models. */
export type LocationUnitKey =
  | 'dong'    // 棟 — building / block
  | 'lou'     // 樓 — floor / storey
  | 'qu'      // 區 — zone / section / area
  | 'shi'     // 室 — room / unit / suite
  | 'hao'     // 號 — number (address / door number)
  | 'chang'   // 廠 — factory / plant
  | 'cang'    // 倉 — warehouse / storage unit
  | 'qi'      // 期 — phase / stage (of a development)
  | 'zuo'     // 座 — tower / seat (high-rise identifier)
  | 'jidi'    // 基地 — campus / site / base
  | 'zhu';    // 柱 — structural column / pillar position
⋮----
| 'dong'    // 棟 — building / block
| 'lou'     // 樓 — floor / storey
| 'qu'      // 區 — zone / section / area
| 'shi'     // 室 — room / unit / suite
| 'hao'     // 號 — number (address / door number)
| 'chang'   // 廠 — factory / plant
| 'cang'    // 倉 — warehouse / storage unit
| 'qi'      // 期 — phase / stage (of a development)
| 'zuo'     // 座 — tower / seat (high-rise identifier)
| 'jidi'    // 基地 — campus / site / base
| 'zhu';    // 柱 — structural column / pillar position
⋮----
export interface LocationUnitMeta {
  key: LocationUnitKey;
  /** Chinese character / label */
  zhLabel: string;
  /** English equivalent */
  enLabel: string;
  /** Short usage description in Chinese */
  description: string;
  /** Typical example value (for placeholder / hint text) */
  example: string;
}
⋮----
/** Chinese character / label */
⋮----
/** English equivalent */
⋮----
/** Short usage description in Chinese */
⋮----
/** Typical example value (for placeholder / hint text) */
⋮----
// ---------------------------------------------------------------------------
// Canonical unit list
// ---------------------------------------------------------------------------
⋮----
// ---------------------------------------------------------------------------
// Derived helpers
// ---------------------------------------------------------------------------
⋮----
/** O(1) lookup map: LocationUnitKey → LocationUnitMeta */
⋮----
/** Ordered array of Chinese labels — useful for plain dropdown lists. */
⋮----
/** Returns the metadata for a unit key, or undefined if not found. */
export function findLocationUnit(key: string): LocationUnitMeta | undefined
````

## File: src/shared/constants/README.md
````markdown
# shared/constants

Stateless, infrastructure-free constant definitions shared across the entire app.

## Rules

- No Firebase / React imports — pure TypeScript only.
- No async code or side effects.
- Use `as const` and mapped meta objects; avoid the `enum` keyword (see `../enums/README.md`).
- Slugs and status strings that are stored in Firestore must **never be renamed** once shipped.

## Files

| File | Purpose |
|---|---|
| `location-units.ts` | 棟/樓/區/室/號/廠/倉/期/座/基地/柱 — spatial position designators for tech parks & construction sites |
| `roles.ts` | OrganizationRole & WorkspaceRole metadata (labels, ranks, display info) |
| `routes.ts` | Application route path constants |
| `settings.ts` | App-wide configuration defaults (pagination, file upload limits, XP bounds, feature flags) |
| `skills.ts` | Global skill taxonomy: 6 大項目 × 17 子項目 × 40 individual skill definitions |
| `status.ts` | Domain status / lifecycle state metadata (ScheduleStatus, WorkspaceLifecycleState, AuditLogType, InviteState, Presence, NotificationType) |
| `taiwan-address.ts` | Taiwan county/district registry with zip codes and English names (22 administrative divisions) |

## Adding a new constants file

1. Create `src/shared/constants/<name>.ts`.
2. Export at minimum one `as const` object or array.
3. For O(1) lookups export a `Map` alongside the array (see `location-units.ts` for the pattern).
4. Add an entry to the table above.
````

## File: src/shared/constants/roles.ts
````typescript
/**
 * @fileoverview shared/constants/roles.ts — Role metadata for OrganizationRole & WorkspaceRole.
 *
 * Provides ordered arrays and labelled metadata for dropdown rendering, badge colouring,
 * and permission-level comparisons.  The canonical string-union types themselves live in
 * `@/shared/types/account.types` (the source of truth for type-checking).
 *
 * Usage:
 *   import { ORG_ROLE_META, ORGANIZATION_ROLES } from '@/shared/constants/roles';
 */
⋮----
import type { OrganizationRole } from '@/shared/types/account.types';
import type { WorkspaceRole } from '@/shared/types/workspace.types';
⋮----
// ---------------------------------------------------------------------------
// Organization roles
// ---------------------------------------------------------------------------
⋮----
/** Stable ordered list of OrganizationRole values — lowest to highest rank. */
⋮----
export interface OrgRoleMeta {
  role: OrganizationRole;
  /** Chinese display label */
  zhLabel: string;
  /** English display label */
  enLabel: string;
  /** Numeric rank (1 = lowest, 4 = highest). Used for permission comparisons. */
  rank: 1 | 2 | 3 | 4;
  /** Tailwind colour class for badge / chip. */
  colorClass: string;
}
⋮----
/** Chinese display label */
⋮----
/** English display label */
⋮----
/** Numeric rank (1 = lowest, 4 = highest). Used for permission comparisons. */
⋮----
/** Tailwind colour class for badge / chip. */
⋮----
/** Metadata for each OrganizationRole, keyed by role string. */
⋮----
/**
 * Returns true if `actorRole` has at least the same permission level as `requiredRole`.
 * Useful for gating UI actions without importing the auth service.
 */
export function orgRoleAtLeast(
  actorRole: OrganizationRole,
  requiredRole: OrganizationRole,
): boolean
⋮----
// ---------------------------------------------------------------------------
// Workspace roles
// ---------------------------------------------------------------------------
⋮----
/** Stable ordered list of WorkspaceRole values — lowest to highest rank. */
⋮----
export interface WorkspaceRoleMeta {
  role: WorkspaceRole;
  zhLabel: string;
  enLabel: string;
  /** Numeric rank (1 = lowest, 3 = highest). */
  rank: 1 | 2 | 3;
  colorClass: string;
}
⋮----
/** Numeric rank (1 = lowest, 3 = highest). */
⋮----
/** Metadata for each WorkspaceRole, keyed by role string. */
⋮----
/**
 * Returns true if `actorRole` has at least the same permission level as `requiredRole`.
 */
export function workspaceRoleAtLeast(
  actorRole: WorkspaceRole,
  requiredRole: WorkspaceRole,
): boolean
````

## File: src/shared/constants/routes.ts
````typescript
/**
 * @fileoverview shared/constants/routes.ts — Application route path constants.
 * Use these instead of hardcoding path strings in components.
 */
⋮----
/** FR-K1: Personal skill profile page (XP + tier visualization). */
````

## File: src/shared/constants/settings.ts
````typescript
/**
 * @fileoverview shared/constants/settings.ts — App-wide configuration defaults.
 *
 * Single source of truth for numeric limits, defaults, and feature flags used
 * across the application.  Update values here instead of scattering magic numbers
 * throughout feature slices.
 *
 * Rules:
 *   - No Firebase / React imports.
 *   - All values must be `as const` (no mutable state).
 *   - Group related constants in namespaced objects.
 */
⋮----
// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------
⋮----
/** Default page size for list views (audit logs, members, schedule items…). */
⋮----
/** Compact page size used in sidebar / summary panels. */
⋮----
/** Maximum page size accepted by query helpers (prevents unbounded reads). */
⋮----
// ---------------------------------------------------------------------------
// Skill XP system
// ---------------------------------------------------------------------------
⋮----
/**
 * XP bounds — duplicated here for components that must not import from feature slices.
 * The canonical computation function (getTier / resolveSkillTier) remains in
 * `@/features/shared-kernel/skill-tier` per the dependency direction rule.
 */
⋮----
/** Maximum achievable XP (Titan tier ceiling). */
⋮----
/** XP awarded per completed task (default, may be overridden per-org). */
⋮----
/** XP deducted for a failed quality check (default). */
⋮----
// ---------------------------------------------------------------------------
// File uploads
// ---------------------------------------------------------------------------
⋮----
/** Maximum single-file size in bytes (10 MB). */
⋮----
/** Human-readable limit label for error messages. */
⋮----
/** Accepted MIME types for document parser intake. */
⋮----
/** Maximum number of files per upload batch. */
⋮----
// ---------------------------------------------------------------------------
// Schedule / shift rules
// ---------------------------------------------------------------------------
⋮----
/** Minimum shift duration in minutes. */
⋮----
/** Maximum shift duration in hours. */
⋮----
/** Maximum number of required skills per schedule item. */
⋮----
/** Maximum assignees per schedule item. */
⋮----
// ---------------------------------------------------------------------------
// Workspace governance
// ---------------------------------------------------------------------------
⋮----
/** Maximum number of sub-locations per workspace (FR-L1). */
⋮----
/** Maximum number of tasks that can be bulk-imported in one operation. */
⋮----
/** Default protocol template shown when creating a new workspace. */
⋮----
// ---------------------------------------------------------------------------
// Organisation membership
// ---------------------------------------------------------------------------
⋮----
/** Maximum number of members per organisation. */
⋮----
/** Maximum number of teams per organisation. */
⋮----
/** Default partner invite expiry in days. */
⋮----
// ---------------------------------------------------------------------------
// UI / UX
// ---------------------------------------------------------------------------
⋮----
/** Debounce delay in ms for search inputs. */
⋮----
/** Toast notification auto-dismiss duration in ms. */
⋮----
/** Skeleton loading placeholder count for list views. */
⋮----
// ---------------------------------------------------------------------------
// Application metadata
// ---------------------------------------------------------------------------
⋮----
/** Application name shown in page titles and emails. */
⋮----
/** Short English name used in metadata and alt text. */
⋮----
/** Support email address. */
````

## File: src/shared/constants/skills.ts
````typescript
/**
 * @fileoverview shared/constants/skills.ts — Global static skill library.
 *
 * Skills are defined here as plain constants — no Firestore, no org dependency.
 * Any user account can hold any of these skills via SkillGrant.tagSlug.
 *
 * Taxonomy (two-level):
 *   SkillGroup (大項目, 9 groups)  →  SkillSubCategory (子項目, 25 sub-categories)  →  SkillDefinition
 *
 * To add a new skill: append an entry to SKILLS.
 * The `slug` is the stable identifier used in SkillGrant.tagSlug and
 * SkillRequirement.tagSlug — never change an existing slug (it would
 * orphan existing grants stored in Firestore).
 */
⋮----
// ---------------------------------------------------------------------------
// Two-level taxonomy types
// ---------------------------------------------------------------------------
⋮----
/** 大項目 — nine top-level discipline groups. */
export type SkillGroup =
  | 'CivilStructural'   // 營建工程
  | 'MEP'               // 機電工程
  | 'FinishingWorks'    // 裝修工程
  | 'Landscape'         // 景觀工程
  | 'TemporaryWorks'    // 假設工程
  | 'SiteManagement'    // 現場管理與技術支援
  | 'Logistics'         // 物流與環保處理
  | 'BIM'               // 建築資訊模型與技術應用
  | 'ProjectConsulting'; // 專案管理與顧問服務
⋮----
| 'CivilStructural'   // 營建工程
| 'MEP'               // 機電工程
| 'FinishingWorks'    // 裝修工程
| 'Landscape'         // 景觀工程
| 'TemporaryWorks'    // 假設工程
| 'SiteManagement'    // 現場管理與技術支援
| 'Logistics'         // 物流與環保處理
| 'BIM'               // 建築資訊模型與技術應用
| 'ProjectConsulting'; // 專案管理與顧問服務
⋮----
/** 子項目 — granular discipline sub-categories within each group. */
export type SkillSubCategory =
  // CivilStructural
  | 'ConcreteFormwork'      // 混凝土與模板
  | 'MasonryStructural'     // 砌體與結構
  | 'EarthSpecial'          // 土方與特殊工程
  // MEP
  | 'ElectricalWorks'       // 電氣工程
  | 'MechanicalPlumbing'    // 機械與管道工程
  | 'FireProtection'        // 消防工程
  // FinishingWorks
  | 'WetWorks'              // 濕式作業
  | 'DryWorks'              // 乾式作業
  // Landscape
  | 'SoftLandscape'         // 植栽與綠化
  | 'HardLandscape'         // 硬景施作
  // TemporaryWorks
  | 'TempScaffolding'       // 鷹架工程
  | 'TempShoring'           // 支撐與擋土
  | 'TempSiteFacilities'    // 臨時設施
  // SiteManagement
  | 'HeavyEquipmentOps'     // 重型設備操作
  | 'SpecialistTrades'      // 特殊技藝
  | 'EngineeringTechnical'  // 工程技術
  | 'SafetyQuality'         // 安全與品質
  | 'ProjectMgmt'           // 工程管理
  // Logistics
  | 'MaterialLogistics'     // 物料搬運與物流
  | 'Environmental'         // 環保與廢棄物處理
  // BIM
  | 'BIMModeling'           // BIM建模與協調
  | 'DigitalConstruction'   // 數位施工技術
  // ProjectConsulting
  | 'ContractProcurement'   // 合約與採購管理
  | 'ConsultingAdvisory'    // 顧問諮詢服務
  | 'ClaimsDisputes';       // 索賠與爭議
⋮----
// CivilStructural
| 'ConcreteFormwork'      // 混凝土與模板
| 'MasonryStructural'     // 砌體與結構
| 'EarthSpecial'          // 土方與特殊工程
// MEP
| 'ElectricalWorks'       // 電氣工程
| 'MechanicalPlumbing'    // 機械與管道工程
| 'FireProtection'        // 消防工程
// FinishingWorks
| 'WetWorks'              // 濕式作業
| 'DryWorks'              // 乾式作業
// Landscape
| 'SoftLandscape'         // 植栽與綠化
| 'HardLandscape'         // 硬景施作
// TemporaryWorks
| 'TempScaffolding'       // 鷹架工程
| 'TempShoring'           // 支撐與擋土
| 'TempSiteFacilities'    // 臨時設施
// SiteManagement
| 'HeavyEquipmentOps'     // 重型設備操作
| 'SpecialistTrades'      // 特殊技藝
| 'EngineeringTechnical'  // 工程技術
| 'SafetyQuality'         // 安全與品質
| 'ProjectMgmt'           // 工程管理
// Logistics
| 'MaterialLogistics'     // 物料搬運與物流
| 'Environmental'         // 環保與廢棄物處理
// BIM
| 'BIMModeling'           // BIM建模與協調
| 'DigitalConstruction'   // 數位施工技術
// ProjectConsulting
| 'ContractProcurement'   // 合約與採購管理
| 'ConsultingAdvisory'    // 顧問諮詢服務
| 'ClaimsDisputes';       // 索賠與爭議
⋮----
// ---------------------------------------------------------------------------
// Metadata types
// ---------------------------------------------------------------------------
⋮----
export interface SkillGroupMeta {
  group: SkillGroup;
  /** Chinese display label (大項目) */
  zhLabel: string;
  /** English display label */
  enLabel: string;
  /** Ordered sub-categories belonging to this group */
  subCategories: readonly SkillSubCategory[];
}
⋮----
/** Chinese display label (大項目) */
⋮----
/** English display label */
⋮----
/** Ordered sub-categories belonging to this group */
⋮----
export interface SkillSubCategoryMeta {
  subCategory: SkillSubCategory;
  group: SkillGroup;
  /** Chinese display label (子項目) */
  zhLabel: string;
  /** English display label */
  enLabel: string;
}
⋮----
/** Chinese display label (子項目) */
⋮----
/** English display label */
⋮----
export interface SkillDefinition {
  slug: string;
  name: string;
  group: SkillGroup;
  subCategory: SkillSubCategory;
  description?: string;
}
⋮----
// ---------------------------------------------------------------------------
// Group & sub-category metadata tables (ordered for UI rendering)
// ---------------------------------------------------------------------------
⋮----
// CivilStructural
⋮----
// MEP
⋮----
// FinishingWorks
⋮----
// Landscape
⋮----
// TemporaryWorks
⋮----
// SiteManagement
⋮----
// Logistics
⋮----
// BIM
⋮----
// ProjectConsulting
⋮----
// ---------------------------------------------------------------------------
// Canonical skill list — add entries here to extend the global library
// ---------------------------------------------------------------------------
⋮----
// ---------------------------------------------------------------------------
// 1. 營建工程 — CivilStructural
// ---------------------------------------------------------------------------
⋮----
// 混凝土與模板 — ConcreteFormwork
⋮----
// 砌體與結構 — MasonryStructural
⋮----
// 土方與特殊工程 — EarthSpecial
⋮----
// ---------------------------------------------------------------------------
// 2. 機電工程 — MEP
// ---------------------------------------------------------------------------
⋮----
// 電氣工程 — ElectricalWorks
⋮----
// 機械與管道工程 — MechanicalPlumbing
⋮----
// 消防工程 — FireProtection
⋮----
// ---------------------------------------------------------------------------
// 3. 裝修工程 — FinishingWorks
// ---------------------------------------------------------------------------
⋮----
// 濕式作業 — WetWorks
⋮----
// 乾式作業 — DryWorks
⋮----
// ---------------------------------------------------------------------------
// 4. 景觀工程 — Landscape
// ---------------------------------------------------------------------------
⋮----
// 植栽與綠化 — SoftLandscape
⋮----
// 硬景施作 — HardLandscape
⋮----
// ---------------------------------------------------------------------------
// 5. 現場管理與技術支援 — SiteManagement
// ---------------------------------------------------------------------------
⋮----
// 重型設備操作 — HeavyEquipmentOps
⋮----
// 特殊技藝 — SpecialistTrades
⋮----
// 工程技術 — EngineeringTechnical
⋮----
// 安全與品質 — SafetyQuality
⋮----
// 工程管理 — ProjectMgmt
⋮----
// ---------------------------------------------------------------------------
// 6. 物流與環保處理 — Logistics
// ---------------------------------------------------------------------------
⋮----
// 物料搬運與物流 — MaterialLogistics
⋮----
// 環保與廢棄物處理 — Environmental
⋮----
// ---------------------------------------------------------------------------
// 7. 假設工程 — TemporaryWorks
// ---------------------------------------------------------------------------
⋮----
// 鷹架工程 — TempScaffolding
⋮----
// 支撐與擋土 — TempShoring
⋮----
// 臨時設施 — TempSiteFacilities
⋮----
// ---------------------------------------------------------------------------
// 8. 建築資訊模型與技術應用 — BIM
// ---------------------------------------------------------------------------
⋮----
// BIM建模與協調 — BIMModeling
⋮----
// 數位施工技術 — DigitalConstruction
⋮----
// ---------------------------------------------------------------------------
// 9. 專案管理與顧問服務 — ProjectConsulting
// ---------------------------------------------------------------------------
⋮----
// 合約與採購管理 — ContractProcurement
⋮----
// 顧問諮詢服務 — ConsultingAdvisory
⋮----
// 索賠與爭議 — ClaimsDisputes
⋮----
// ---------------------------------------------------------------------------
// Derived helpers
// ---------------------------------------------------------------------------
⋮----
/** All valid skill slug strings — derived from SKILLS at compile time. */
export type SkillSlug = (typeof SKILLS)[number]['slug'];
⋮----
/** O(1) lookup map: slug → SkillDefinition */
⋮----
/** O(1) lookup map: SkillGroup key → SkillGroupMeta */
⋮----
/** O(1) lookup map: SkillSubCategory key → SkillSubCategoryMeta */
⋮----
/** Returns the SkillDefinition for a slug, or undefined if not found. */
export function findSkill(slug: string): SkillDefinition | undefined
````

## File: src/shared/constants/status.ts
````typescript
/**
 * @fileoverview shared/constants/status.ts — Domain status / lifecycle state metadata.
 *
 * Centralises the labelled, coloured descriptors for every status / state string union
 * used across the domain model.  The canonical types remain in `@/shared/types/`; this
 * file adds the runtime metadata needed for dropdowns, badges, and filtering chips.
 *
 * Covered union types:
 *   - ScheduleStatus          (schedule.types.ts)
 *   - WorkspaceLifecycleState (workspace.types.ts)
 *   - AuditLogType            (audit.types.ts)
 *   - InviteState             (account.types.ts → PartnerInvite.inviteState)
 *   - Presence                (account.types.ts → MemberReference.presence)
 *   - NotificationType        (account.types.ts → Notification.type)
 */
⋮----
import type {
  InviteState,
  NotificationType,
  Presence,
} from '@/shared/types/account.types';
import type { AuditLogType } from '@/shared/types/audit.types';
import type { ScheduleStatus } from '@/shared/types/schedule.types';
import type { WorkspaceLifecycleState } from '@/shared/types/workspace.types';
⋮----
// ---------------------------------------------------------------------------
// ScheduleStatus
// ---------------------------------------------------------------------------
⋮----
/** Stable ordered list of ScheduleStatus values. */
⋮----
export interface ScheduleStatusMeta {
  status: ScheduleStatus;
  zhLabel: string;
  enLabel: string;
  /** Tailwind colour class for badge / chip. */
  colorClass: string;
  /** Muted background Tailwind class — for row highlights. */
  bgClass: string;
}
⋮----
/** Tailwind colour class for badge / chip. */
⋮----
/** Muted background Tailwind class — for row highlights. */
⋮----
// ---------------------------------------------------------------------------
// WorkspaceLifecycleState
// ---------------------------------------------------------------------------
⋮----
/** Stable ordered list of WorkspaceLifecycleState values. */
⋮----
export interface WorkspaceLifecycleStateMeta {
  state: WorkspaceLifecycleState;
  zhLabel: string;
  enLabel: string;
  colorClass: string;
}
⋮----
// ---------------------------------------------------------------------------
// AuditLogType
// ---------------------------------------------------------------------------
⋮----
/** Stable ordered list of AuditLogType values. */
⋮----
export interface AuditLogTypeMeta {
  type: AuditLogType;
  zhLabel: string;
  enLabel: string;
  colorClass: string;
}
⋮----
// ---------------------------------------------------------------------------
// InviteState (PartnerInvite.inviteState)
// ---------------------------------------------------------------------------
⋮----
/** Stable ordered list of InviteState values. */
⋮----
export interface InviteStateMeta {
  state: InviteState;
  zhLabel: string;
  enLabel: string;
  colorClass: string;
}
⋮----
// ---------------------------------------------------------------------------
// Presence (MemberReference.presence)
// ---------------------------------------------------------------------------
⋮----
/** Stable ordered list of Presence values. */
⋮----
export interface PresenceMeta {
  presence: Presence;
  zhLabel: string;
  enLabel: string;
  /** CSS colour class for the presence dot indicator. */
  dotClass: string;
}
⋮----
/** CSS colour class for the presence dot indicator. */
⋮----
// ---------------------------------------------------------------------------
// NotificationType (Notification.type)
// ---------------------------------------------------------------------------
⋮----
/** Stable ordered list of NotificationType values. */
⋮----
export interface NotificationTypeMeta {
  type: NotificationType;
  zhLabel: string;
  enLabel: string;
  colorClass: string;
}
````

## File: src/shared/constants/taiwan-address.ts
````typescript
/**
 * @fileoverview shared/constants/taiwan-address.ts — Taiwan administrative region constants.
 *
 * Covers all 22 top-level divisions (直轄市 / 省轄市 / 縣) and their
 * constituent districts / townships (區 / 鄉 / 鎮 / 市).
 *
 * Usage:
 *   import { TW_COUNTIES, TW_COUNTY_NAMES, getTwDistricts } from '@/shared/constants/taiwan-address';
 */
⋮----
// ---------------------------------------------------------------------------
// Type definitions
// ---------------------------------------------------------------------------
⋮----
export type TwCountyType =
  | 'municipality'   // 直轄市 (直轄市)
  | 'city'           // 省轄市 (省轄市)
  | 'county';        // 縣     (縣)
⋮----
| 'municipality'   // 直轄市 (直轄市)
| 'city'           // 省轄市 (省轄市)
| 'county';        // 縣     (縣)
⋮----
export interface TwDistrictMeta {
  /** Official district / township name (區 / 鄉 / 鎮 / 市) */
  name: string;
  /** Postal code prefix (3-digit) */
  zip: string;
}
⋮----
/** Official district / township name (區 / 鄉 / 鎮 / 市) */
⋮----
/** Postal code prefix (3-digit) */
⋮----
export interface TwCountyMeta {
  /** Official Chinese name */
  name: string;
  /** Administrative level */
  type: TwCountyType;
  /** English name */
  enName: string;
  /** Ordered list of districts / townships */
  districts: readonly TwDistrictMeta[];
}
⋮----
/** Official Chinese name */
⋮----
/** Administrative level */
⋮----
/** English name */
⋮----
/** Ordered list of districts / townships */
⋮----
// ---------------------------------------------------------------------------
// Canonical region list
// ---------------------------------------------------------------------------
⋮----
// ── 直轄市 ──────────────────────────────────────────────────────────────
⋮----
// ── 省轄市 ──────────────────────────────────────────────────────────────
⋮----
// ── 縣 ──────────────────────────────────────────────────────────────────
⋮----
// ---------------------------------------------------------------------------
// Derived helpers
// ---------------------------------------------------------------------------
⋮----
/** All Taiwan county / city names as a union type. */
export type TwCountyName = (typeof TW_COUNTIES)[number]['name'];
⋮----
/** Ordered array of just the county / city names — useful for dropdowns. */
⋮----
/** O(1) lookup map: county name → TwCountyMeta */
⋮----
/**
 * Returns the districts for a given county / city name.
 * Returns an empty array when the name is not found.
 */
export function getTwDistricts(countyName: string): readonly TwDistrictMeta[]
````

## File: src/shared/enums/README.md
````markdown
# shared/enums

Runtime-iterable representations of the string-union types defined in `src/shared/types/`.

## Why not TypeScript `enum`?

This project deliberately avoids the `enum` keyword. Reasons:

- Regular `enum` values compile to an IIFE object and don't tree-shake cleanly in all bundlers.
- `const enum` is inlined at compile time, which breaks across module boundaries in Next.js (transpile-only pipeline).
- String union types (`'active' | 'away' | 'offline'`) are more readable, type-safe, and JSON-compatible.

## Convention

```ts
// ✅ Preferred pattern — union type + const array
//    type lives in src/shared/types/
//    array lives here in src/shared/enums/ (or in src/shared/constants/ when metadata is rich)

// src/shared/types/account.types.ts
export type Presence = 'active' | 'away' | 'offline';

// src/shared/enums/presence.ts
import type { Presence } from '@/shared/types/account.types';
export const PRESENCES: readonly Presence[] = ['active', 'away', 'offline'] as const;
```

## When to put metadata-rich descriptors in `constants/` instead

If a value needs a display label, colour, rank, or other metadata, place the descriptor array
in `src/shared/constants/` (e.g. `roles.ts`, `status.ts`) and only keep the plain ordered array
here for iteration / validation use-cases.

## Files

| File | Covered union types |
|---|---|
| _(add files as needed)_ | |
````

## File: src/shared/infra/analytics/analytics.adapter.ts
````typescript
/**
 * @fileoverview Firebase Analytics Adapter.
 * This file contains functions for logging custom events to Firebase Analytics,
 * allowing for detailed tracking of user behavior and application performance.
 */
import { logEvent } from 'firebase/analytics';
⋮----
import { analytics } from './analytics.client';
⋮----
/**
 * Logs a custom event to Firebase Analytics.
 * @param eventName The name of the event to log.
 * @param eventParams Optional parameters to associate with the event.
 */
export const logAnalyticsEvent = (eventName: string, eventParams?: Record<string, unknown>) =>
````

## File: src/shared/infra/analytics/analytics.client.ts
````typescript
/**
 * @fileoverview Firebase Analytics Client Initializer.
 * This file is responsible for initializing and exporting the Firebase Analytics instance,
 * making it available for use throughout the application for event logging.
 * It ensures Analytics is only initialized on the client side.
 */
import { getAnalytics, type Analytics } from 'firebase/analytics';
⋮----
import { app } from '../app.client';
⋮----
// Ensure Analytics is only initialized in the browser.
````

## File: src/shared/infra/app.client.ts
````typescript
/**
 * @fileoverview Firebase Client Initializer.
 * This file is responsible for initializing the Firebase app singleton
 * and exporting the main app instance.
 */
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
⋮----
import { firebaseConfig } from "./firebase.config";
⋮----
// Singleton Pattern: Initialize Firebase only once.
````

## File: src/shared/infra/auth/auth.adapter.ts
````typescript
/**
 * @fileoverview Firebase Authentication Adapter.
 * This file contains all functions related to Firebase Authentication services,
 * serving as a single point of interaction for the UI layer with auth logic.
 */
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInAnonymously,
  updateProfile,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';
⋮----
import { auth } from './auth.client';
⋮----
// By exporting the functions directly, we create a clean, testable adapter.
````

## File: src/shared/infra/auth/auth.client.ts
````typescript
/**
 * @fileoverview Firebase Authentication Client Initializer.
 * This file is responsible for exporting the initialized Auth instance.
 */
import { getAuth, type Auth } from 'firebase/auth';
⋮----
import { app } from '../app.client';
````

## File: src/shared/infra/auth/auth.types.ts
````typescript
/**
 * auth.types.ts — Firebase Auth Internal Types
 *
 * [D24] These types must NOT be exported outside src/shared/infra/auth/.
 *       Use IAuthService / AuthUser from '@/shared/ports' in feature slices.
 */
⋮----
import type { User as FirebaseUser, UserCredential } from 'firebase/auth';
⋮----
import type { AuthUser } from '@/shared/ports/i-auth.service';
⋮----
/** Re-alias Firebase SDK types for internal use only. */
⋮----
/** Maps a Firebase User to the AuthUser Port type. */
export function mapFirebaseUser(user: FirebaseUser): AuthUser
````

## File: src/shared/infra/auth/index.ts
````typescript
/**
 * src/shared/infra/auth/index.ts
 *
 * [D24] Only exports the IAuthService Port interface.
 *       Firebase SDK types must NOT be re-exported from this boundary.
 */
````

## File: src/shared/infra/firebase.config.ts
````typescript
/**
 * @fileoverview Firebase Configuration.
 * This file exports the configuration object required to initialize the Firebase app.
 * It should be treated as sensitive and is typically populated from environment variables.
 */
⋮----
// Your web app's Firebase configuration
````

## File: src/shared/infra/firestore/collection-paths.ts
````typescript
/**
 * collection-paths.ts — Firestore Collection Path Constants
 *
 * [D24] All Firestore collection paths must be defined here.
 *       Feature slices must NOT hardcode collection paths directly.
 *
 * Usage:
 *   import { COLLECTIONS } from '@/shared/infra/firestore/collection-paths';
 *   const ref = db.collection(COLLECTIONS.accounts).doc(orgId);
 */
⋮----
/** Top-level collection path constants. */
⋮----
/** VS2 Account aggregate root. */
⋮----
/** VS2 User profiles (sub-collection not listed — use SUBCOLLECTIONS). */
⋮----
/** VS8 Projection: workspace scope guard view. */
⋮----
/** VS8 Projection: org eligible member view. */
⋮----
/** VS8 Projection: account view. */
⋮----
/** VS8 Projection: organization view. */
⋮----
/** VS8 Projection: global audit view [R8]. */
⋮----
/** VS8 Projection: tag snapshot [S4]. */
⋮----
/** VS8 Projection registry (version tracking) [S2]. */
⋮----
/** VS9 Domain error log. */
⋮----
/** Sub-collection paths (appended to an account document path). */
⋮----
/** accounts/{orgId}/workspaces */
⋮----
/** accounts/{orgId}/schedule_items — VS6 SSOT [S4] */
⋮----
/** accounts/{orgId}/audit_logs */
⋮----
/** accounts/{orgId}/daily_logs */
⋮----
/** workspaces/{workspaceId}/events — VS5 event store */
⋮----
/** workspaces/{workspaceId}/tasks */
⋮----
/** workspaces/{workspaceId}/issues */
⋮----
/** workspaces/{workspaceId}/files */
⋮----
/** workspaces/{workspaceId}/grants */
⋮----
/** workspaces/{workspaceId}/locations */
⋮----
/** workspaces/{workspaceId}/parsing_intents */
⋮----
/** Generic outbox sub-collection (per aggregate) */
````

## File: src/shared/infra/firestore/firestore.client.ts
````typescript
/**
 * @fileoverview Firestore Client Initializer.
 * This file is responsible for exporting the initialized Firestore instance.
 */
import { getFirestore, type Firestore } from 'firebase/firestore';
⋮----
import { app } from '../app.client';
````

## File: src/shared/infra/firestore/firestore.converter.ts
````typescript
/**
 * @fileoverview Firestore Data Converter.
 * Provides a generic FirestoreDataConverter for robust type safety between
 * the application's domain models and Firestore's data structure.
 * It automatically handles `id` field exclusion/inclusion.
 */
import {
  type DocumentData,
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
  type SnapshotOptions,
  type WithFieldValue,
} from 'firebase/firestore';
⋮----
export const createConverter = <T extends
⋮----
/**
   * Converts a domain object to a Firestore-compatible document data.
   * The `id` field is stripped from the object before sending it to Firestore,
   * as the ID is stored in the document path, not within the document itself.
   */
toFirestore(modelObject: WithFieldValue<T>): DocumentData
⋮----
/**
   * Converts a Firestore document snapshot into a domain object.
   * The document's ID is automatically included in the resulting object.
   */
fromFirestore(
    snapshot: QueryDocumentSnapshot<DocumentData>,
    options?: SnapshotOptions
): T
````

## File: src/shared/infra/firestore/firestore.facade.ts
````typescript
/**
 * @fileoverview Firestore Facade.
 *
 * This file acts as a simplified, high-level interface to the Firestore repositories.
 * Its purpose is to provide a single, unified entry point for all data operations,
 * abstracting away the underlying repository structure from the rest of the application.
 * This facade is now a "thin" layer, primarily responsible for re-exporting
 * functions from the more specialized repository modules.
 */
⋮----
// ==================================================================
// == Account Aggregate Exports (Organizations + User Profiles)
// ==================================================================
⋮----
// ==================================================================
// == Workspace Aggregate Exports
// ==================================================================
⋮----
// ==================================================================
// == Workspace Sub-Collection Exports
// ==================================================================
⋮----
// Issues
⋮----
// Tasks
⋮----
// Schedule
⋮----
// ==================================================================
// == Read-Only Aggregate Exports
// ==================================================================
⋮----
// Account reads
⋮----
// Workspace reads
⋮----
// workspace-business.files — subcollection CRUD
⋮----
// ParsingIntent (document-parser Digital Twin)
⋮----
// ==================================================================
// == workspace-core.event-store — Append-only domain event log
// ==================================================================
⋮----
// ==================================================================
// == projection.registry — Event stream offset + read model versions
// ==================================================================
````

## File: src/shared/infra/firestore/firestore.read.adapter.ts
````typescript
/**
 * @fileoverview Firestore Read Adapter.
 * This file contains all read-only operations for Firestore, such as getDoc,
 * getDocs, and creating real-time listeners with onSnapshot.
 *
 * [D24] FIREBASE_ACL boundary: feature slices MUST import Firestore SDK
 *       utilities from this adapter (or firestore.write.adapter) rather than
 *       directly from 'firebase/firestore'.
 */
⋮----
import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  type CollectionReference,
  type DocumentChange,
  type DocumentData,
  type DocumentSnapshot,
  type FieldPath,
  type OrderByDirection,
  type Query,
  type QueryConstraint,
  type QueryDocumentSnapshot,
  type QuerySnapshot,
  type Unsubscribe,
  type WhereFilterOp,
  type FirestoreDataConverter,
} from 'firebase/firestore';
⋮----
import { db } from './firestore.client';
⋮----
// ---------------------------------------------------------------------------
// [D24] Re-exports — feature slices import these instead of 'firebase/firestore'
// ---------------------------------------------------------------------------
⋮----
/**
 * Fetches a single document from Firestore.
 * @param path The full path to the document (e.g., 'collection/docId').
 * @param converter An optional FirestoreDataConverter for type safety.
 * @returns A promise that resolves to the document data or null if not found.
 */
export const getDocument = async <T>(
  path: string,
  converter?: FirestoreDataConverter<T>
): Promise<T | null> =>
⋮----
/**
 * Fetches multiple documents from a collection that match a query.
 * @param query The Firestore query to execute.
 * @returns A promise that resolves to an array of document data.
 */
export const getDocuments = async <T>(query: Query<T>): Promise<T[]> =>
⋮----
/**
 * Creates a real-time subscription to a Firestore query.
 * @param query The Firestore query to listen to.
 * @param onUpdate A callback function that fires every time the query results change.
 * @returns An unsubscribe function to detach the listener.
 */
export const createSubscription = <T>(
  query: Query<T, DocumentData>,
  onUpdate: (data: T[]) => void
): Unsubscribe =>
⋮----
/**
 * Creates a real-time subscription to a single Firestore document.
 * [D24] Use this instead of calling `onSnapshot(doc(...))` directly in feature slices.
 *
 * @param path The full path to the document (e.g., 'accounts/userId').
 * @param onUpdate Callback fired with the document data (or null if it doesn't exist).
 * @returns An unsubscribe function to detach the listener.
 */
export const subscribeToDocument = <T extends object>(
  path: string,
  onUpdate: (data: (T & { id: string }) | null) => void
): Unsubscribe =>
````

## File: src/shared/infra/firestore/firestore.types.ts
````typescript
/**
 * firestore.types.ts — Firestore Internal Types
 *
 * [D24] These types must NOT be exported outside src/shared/infra/firestore/.
 *       Feature slices use IFirestoreRepo / FirestoreDoc from '@/shared/ports'.
 */
⋮----
import type {
  DocumentData,
  QuerySnapshot,
  DocumentSnapshot,
  CollectionReference,
  DocumentReference,
  Timestamp,
} from 'firebase/firestore';
⋮----
/** Re-alias Firebase Firestore SDK types for internal use only. */
⋮----
/** Standard Firestore document with timestamps. */
export interface FirestoreTimestampedDoc {
  readonly createdAt?: Timestamp;
  readonly updatedAt?: Timestamp;
}
⋮----
/** Version-tracked Firestore projection document [S2]. */
export interface VersionedProjectionDoc extends FirestoreTimestampedDoc {
  /** [S2] Used by applyFirestoreVersionGuard to reject stale events. */
  readonly lastProcessedVersion: number;
  /** [R8] TraceId carried through from the originating EventEnvelope. */
  readonly traceId?: string;
}
⋮----
/** [S2] Used by applyFirestoreVersionGuard to reject stale events. */
⋮----
/** [R8] TraceId carried through from the originating EventEnvelope. */
````

## File: src/shared/infra/firestore/firestore.utils.ts
````typescript
import type { QuerySnapshot } from "firebase/firestore"
⋮----
/**
 * Converts a Firestore QuerySnapshot into a Record keyed by document ID.
 * Shared utility used by context reducers that process Firestore snapshots.
 */
export function snapshotToRecord<T extends
````

## File: src/shared/infra/firestore/firestore.write.adapter.ts
````typescript
/**
 * @fileoverview Firestore Write Adapter.
 * This file contains all write operations for Firestore, such as addDoc,
 * setDoc, updateDoc, and deleteDoc, ensuring a clear separation of concerns.
 *
 * [D24] FIREBASE_ACL boundary: feature slices MUST import Firestore SDK
 *       utilities from this adapter (or firestore.read.adapter) rather than
 *       directly from 'firebase/firestore'.
 */
⋮----
import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  runTransaction,
  serverTimestamp,
  type FieldValue,
  type Transaction,
  type WithFieldValue,
  type DocumentData,
  type FirestoreDataConverter,
} from 'firebase/firestore';
⋮----
import { db } from './firestore.client';
⋮----
// ---------------------------------------------------------------------------
// [D24] Re-exports — feature slices import these instead of 'firebase/firestore'
// ---------------------------------------------------------------------------
⋮----
/**
 * Adds a new document to a collection with a Firestore-generated ID.
 * @param path The path to the collection.
 * @param data The data for the new document.
 * @param converter An optional FirestoreDataConverter for type safety.
 * @returns A promise that resolves to the new document's reference.
 */
export const addDocument = <T>(
  path: string,
  data: WithFieldValue<T>,
  converter?: FirestoreDataConverter<T>
) =>
⋮----
/**
 * Creates or overwrites a single document with a specific ID.
 * @param path The full path to the document (e.g., 'collection/docId').
 * @param data The data to set in the document.
 * @param converter An optional FirestoreDataConverter for type safety.
 * @returns A promise that resolves when the write is complete.
 */
export const setDocument = <T>(
  path: string,
  data: WithFieldValue<T>,
  converter?: FirestoreDataConverter<T>
) =>
⋮----
/**
 * Updates fields in a document without overwriting the entire document.
 * @param path The full path to the document.
 * @param data An object containing the fields and values to update.
 * @returns A promise that resolves when the write is complete.
 */
export const updateDocument = (path: string, data: DocumentData) =>
⋮----
/**
 * Deletes a single document.
 * @param path The full path to the document to delete.
 * @returns A promise that resolves when the deletion is complete.
 */
export const deleteDocument = (path: string) =>
````

## File: src/shared/infra/firestore/index.ts
````typescript
/**
 * src/shared/infra/firestore/index.ts
 *
 * [D24] Only exports the IFirestoreRepo Port interface.
 *       Firebase SDK types must NOT be re-exported from this boundary.
 * [S2]  All Projection writes must pass through applyVersionGuard before calling IFirestoreRepo.
 */
````

## File: src/shared/infra/firestore/repositories/account.repository.ts
````typescript
/**
 * @fileoverview Account Repository.
 *
 * Firestore write operations for the `accounts` collection — organization and
 * user account management, teams, and member roster operations.
 */
⋮----
import {
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  doc,
  getDoc,
  deleteDoc,
} from 'firebase/firestore'
⋮----
import type {
  Account,
  MemberReference,
  Team,
  ThemeConfig,
} from '@/shared/types'
⋮----
import { db } from '../firestore.client'
import { updateDocument, addDocument, setDocument } from '../firestore.write.adapter'
⋮----
/**
 * Creates a user account in the accounts collection.
 * @param userId The ID of the user (from Firebase Auth).
 * @param name The user's display name.
 * @param email The user's email address.
 */
export const createUserAccount = async (userId: string, name: string, email: string): Promise<void> =>
⋮----
/**
 * Creates an organization account in the accounts collection.
 * @param organizationName The name of the organization.
 * @param owner The owner's account information.
 * @returns The ID of the newly created organization.
 */
export const createOrganization = async (organizationName: string, owner: Account): Promise<string> =>
⋮----
export const recruitOrganizationMember = async (organizationId: string, newId: string, name: string, email: string): Promise<void> =>
⋮----
export const dismissOrganizationMember = async (organizationId: string, member: MemberReference): Promise<void> =>
⋮----
export const createTeam = async (organizationId: string, teamName: string, type: 'internal' | 'external'): Promise<void> =>
⋮----
export const updateTeamMembers = async (organizationId: string, teamId: string, memberId: string, action: 'add' | 'remove'): Promise<void> =>
⋮----
export const sendPartnerInvite = async (organizationId: string, teamId: string, email: string): Promise<void> =>
⋮----
export const dismissPartnerMember = async (organizationId: string, teamId: string, member: MemberReference): Promise<void> =>
⋮----
export const updateOrganizationSettings = async (organizationId: string, settings:
⋮----
export const deleteOrganization = async (organizationId: string): Promise<void> =>
⋮----
// In a real app, this should trigger a Cloud Function to delete all subcollections and associated data.
````

## File: src/shared/infra/firestore/repositories/audit.repository.ts
````typescript
/**
 * @fileoverview Audit Log Repository.
 *
 * Read operations for the `auditLogs` sub-collection under an account.
 * Stored at: accounts/{accountId}/auditLogs/{logId}
 */
⋮----
import {
  collection,
  query,
  orderBy,
  limit as firestoreLimit,
  where,
} from 'firebase/firestore'
⋮----
import type { AuditLog } from '@/shared/types'
⋮----
import { db } from '../firestore.client'
import { createConverter } from '../firestore.converter'
import { getDocuments } from '../firestore.read.adapter'
⋮----
export const getAuditLogs = async (
  accountId: string,
  workspaceId?: string,
  limitCount = 50
): Promise<AuditLog[]> =>
````

## File: src/shared/infra/firestore/repositories/daily.repository.ts
````typescript
/**
 * @fileoverview Daily Log Repository.
 *
 * All Firestore read and write operations for the `dailyLogs` sub-collection
 * under an account. Stored at: accounts/{accountId}/dailyLogs/{logId}
 */
⋮----
import {
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  doc,
  increment,
  collection,
  query,
  orderBy,
  limit as firestoreLimit,
  runTransaction,
  writeBatch,
  type FieldValue,
} from 'firebase/firestore'
⋮----
import type { DailyLog, DailyLogComment } from '@/shared/types'
⋮----
import { db } from '../firestore.client'
import { createConverter } from '../firestore.converter'
import { getDocuments } from '../firestore.read.adapter'
⋮----
export const toggleDailyLogLike = async (
  organizationId: string,
  logId: string,
  userId: string
): Promise<void> =>
⋮----
export const addDailyLogComment = async (
  organizationId: string,
  logId: string,
  author: { uid: string; name: string; avatarUrl?: string },
  content: string
): Promise<void> =>
⋮----
export const getDailyLogs = async (
  accountId: string,
  limitCount = 30
): Promise<DailyLog[]> =>
````

## File: src/shared/infra/firestore/repositories/index.ts
````typescript
/**
 * @fileoverview Barrel file for Firestore repositories.
 * Domain-specific repositories — each owns both reads and writes for its aggregate.
 */
⋮----
export * from './account.repository'                           // createUserAccount, createOrganization, recruitOrganizationMember, dismissOrganizationMember, createTeam, updateTeamMembers, sendPartnerInvite, dismissPartnerMember, updateOrganizationSettings, deleteOrganization
export * from './user.repository'                              // getUserProfile, updateUserProfile, addBookmark, removeBookmark
export * from './workspace-core.repository'                    // createWorkspace, authorizeWorkspaceTeam, revokeWorkspaceTeam, grantIndividualWorkspaceAccess, revokeIndividualWorkspaceAccess, mountCapabilities, unmountCapability, updateWorkspaceSettings, deleteWorkspace, getWorkspaceFiles, getWorkspaceGrants
export * from './workspace-business.tasks.repository'          // createTask, updateTask, deleteTask, getWorkspaceTasks, getWorkspaceTask
export * from './workspace-business.files.repository'          // createWorkspaceFile, addWorkspaceFileVersion, restoreWorkspaceFileVersion, getWorkspaceFilesFromSubcollection
export * from './workspace-business.issues.repository'         // createIssue, addCommentToIssue, resolveIssue, getWorkspaceIssues
export * from './workspace-business.document-parser.repository'// createParsingIntent, updateParsingIntentStatus, getParsingIntents
export * from './workspace-core.event-store.repository'        // appendDomainEvent, getDomainEvents, StoredWorkspaceEvent
export * from './projection.registry.repository'               // getProjectionVersion, upsertProjectionVersion, ProjectionVersionRecord
export * from './schedule.repository'                          // createScheduleItem, updateScheduleItemStatus, assignMemberToScheduleItem, assignMemberAndApprove, unassignMemberFromScheduleItem, getScheduleItems
export * from './daily.repository'                             // toggleDailyLogLike, addDailyLogComment, getDailyLogs
export * from './audit.repository'                             // getAuditLogs
````

## File: src/shared/infra/firestore/repositories/projection.registry.repository.ts
````typescript
/**
 * @fileoverview Projection Registry Repository.
 *
 * Tracks event stream offsets and read model versions for all projections.
 * Stored at: projectionMeta/{projectionName}
 *
 * Per logic-overview.md:
 * - PROJECTION_VERSION: event stream offset ↔ read model version table
 * - READ_MODEL_REGISTRY: provides read-model version correspondence
 */
⋮----
import {
  serverTimestamp,
  doc,
  getDoc,
  setDoc,
  type Timestamp,
} from 'firebase/firestore';
⋮----
import { db } from '../firestore.client';
⋮----
export interface ProjectionVersionRecord {
  projectionName: string;
  lastEventOffset: number;
  readModelVersion: string;
  updatedAt: Timestamp;
}
⋮----
/**
 * Retrieves the current version record for a projection.
 */
export const getProjectionVersion = async (
  projectionName: string
): Promise<ProjectionVersionRecord | null> =>
⋮----
/**
 * Creates or updates the version record for a projection.
 * Called by the Event Funnel after each event is processed.
 */
export const upsertProjectionVersion = async (
  projectionName: string,
  lastEventOffset: number,
  readModelVersion: string
): Promise<void> =>
````

## File: src/shared/infra/firestore/repositories/schedule.repository.ts
````typescript
/**
 * @fileoverview Schedule Repository.
 *
 * All Firestore read and write operations for the `schedule_items` sub-collection
 * under an account. Stored at: accounts/{accountId}/schedule_items/{itemId}
 */
⋮----
import {
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  doc,
  updateDoc,
  collection,
  query,
  orderBy,
  where,
} from 'firebase/firestore'
⋮----
import type { ScheduleItem } from '@/shared/types'
⋮----
import { db } from '../firestore.client'
import { createConverter } from '../firestore.converter'
import { getDocuments } from '../firestore.read.adapter'
import { addDocument, updateDocument } from '../firestore.write.adapter'
⋮----
export const createScheduleItem = async (
  itemData: Omit<ScheduleItem, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> =>
⋮----
// Build the Firestore document explicitly.
// Firestore rejects documents containing `undefined` field values, so optional
// fields are only included when they carry a meaningful value.
⋮----
// Optional fields — omitted when undefined so Firestore never sees undefined.
// Use !== undefined (not truthy) so empty strings are preserved if ever valid.
⋮----
export const updateScheduleItemStatus = async (
  organizationId: string,
  itemId: string,
  newStatus: 'OFFICIAL' | 'REJECTED' | 'COMPLETED'
): Promise<void> =>
⋮----
/**
 * Assigns a member to a schedule item and marks it OFFICIAL in a single write.
 * Used by DemandBoard and HR Governance to keep all three tabs in sync via
 * the single source of truth: accounts/{orgId}/schedule_items.
 */
export const assignMemberAndApprove = async (
  organizationId: string,
  itemId: string,
  memberId: string
): Promise<void> =>
⋮----
export const assignMemberToScheduleItem = async (
  accountId: string,
  itemId: string,
  memberId: string
): Promise<void> =>
⋮----
export const unassignMemberFromScheduleItem = async (
  accountId: string,
  itemId: string,
  memberId: string
): Promise<void> =>
⋮----
export const getScheduleItems = async (
  accountId: string,
  workspaceId?: string
): Promise<ScheduleItem[]> =>
````

## File: src/shared/infra/firestore/repositories/user.repository.ts
````typescript
/**
 * @fileoverview User Repository.
 *
 * Firestore operations for user profiles and personal bookmarks.
 * Stored at: accounts/{userId} and accounts/{userId}/bookmarks/{logId}
 */
⋮----
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore'
⋮----
import type { Account } from '@/shared/types'
⋮----
import { db } from '../firestore.client'
import { setDocument } from '../firestore.write.adapter'
⋮----
export const getUserProfile = async (
  userId: string
): Promise<Account | null> =>
⋮----
export const updateUserProfile = async (
  userId: string,
  data: Partial<Account>
): Promise<void> =>
⋮----
export const addBookmark = async (
  userId: string,
  logId: string
): Promise<void> =>
⋮----
export const removeBookmark = async (
  userId: string,
  logId: string
): Promise<void> =>
````

## File: src/shared/infra/firestore/repositories/workspace-business.document-parser.repository.ts
````typescript
/**
 * @fileoverview Workspace Business — Document Parser Repository.
 *
 * All Firestore read and write operations for the `parsingIntents` sub-collection
 * under a workspace. Stored at: workspaces/{workspaceId}/parsingIntents/{intentId}
 * Corresponds to the `workspace-business.document-parser` feature slice.
 *
 * ParsingIntent is a Digital Twin (解析合約) produced by the document-parser.
 * Tasks reference it via `sourceIntentId` as an immutable SourcePointer.
 */
⋮----
import {
  serverTimestamp,
  collection,
  query,
  orderBy,
} from 'firebase/firestore';
⋮----
import type { ParsingIntent } from '@/shared/types';
⋮----
import { db } from '../firestore.client';
import { createConverter } from '../firestore.converter';
import { getDocuments } from '../firestore.read.adapter';
import {
  updateDocument,
  addDocument,
} from '../firestore.write.adapter';
⋮----
export const createParsingIntent = async (
  workspaceId: string,
  intentData: Omit<ParsingIntent, 'id' | 'createdAt'>
): Promise<string> =>
⋮----
export const updateParsingIntentStatus = async (
  workspaceId: string,
  intentId: string,
  status: 'imported' | 'failed' | 'superseded'
): Promise<void> =>
⋮----
export const getParsingIntents = async (
  workspaceId: string
): Promise<ParsingIntent[]> =>
````

## File: src/shared/infra/firestore/repositories/workspace-business.files.repository.ts
````typescript
/**
 * @fileoverview Workspace Business — Files Repository.
 *
 * All Firestore read and write operations for the `files` sub-collection
 * under a workspace. Stored at: workspaces/{workspaceId}/files/{fileId}
 * Corresponds to the `workspace-business.files` feature slice.
 */
⋮----
import {
  serverTimestamp,
  collection,
  query,
  orderBy,
  arrayUnion,
  type FieldValue,
} from 'firebase/firestore';
⋮----
import type { WorkspaceFile, WorkspaceFileVersion } from '@/shared/types';
⋮----
import { db } from '../firestore.client';
import { createConverter } from '../firestore.converter';
import { getDocuments } from '../firestore.read.adapter';
import { updateDocument, addDocument } from '../firestore.write.adapter';
⋮----
/**
 * Creates a new file document in the workspace files subcollection.
 * @param workspaceId The ID of the workspace.
 * @param fileData The file metadata (without id or server-generated updatedAt).
 * @returns The ID of the newly created file document.
 */
export const createWorkspaceFile = async (
  workspaceId: string,
  fileData: Omit<WorkspaceFile, 'id' | 'updatedAt'> & { updatedAt: FieldValue }
): Promise<string> =>
⋮----
/**
 * Adds a new version to an existing workspace file and updates the currentVersionId.
 * Uses arrayUnion to atomically append the version without race conditions.
 * @param workspaceId The ID of the workspace.
 * @param fileId The ID of the file document.
 * @param version The new version to append.
 * @param currentVersionId The ID of the new version to mark as current.
 */
export const addWorkspaceFileVersion = async (
  workspaceId: string,
  fileId: string,
  version: WorkspaceFileVersion,
  currentVersionId: string
): Promise<void> =>
⋮----
/**
 * Restores a workspace file to a previous version by updating currentVersionId.
 * @param workspaceId The ID of the workspace.
 * @param fileId The ID of the file document.
 * @param versionId The versionId to restore as current.
 */
export const restoreWorkspaceFileVersion = async (
  workspaceId: string,
  fileId: string,
  versionId: string
): Promise<void> =>
⋮----
/**
 * Fetches all files for a workspace (one-time read).
 * @param workspaceId The ID of the workspace.
 */
export const getWorkspaceFilesFromSubcollection = async (
  workspaceId: string
): Promise<WorkspaceFile[]> =>
````

## File: src/shared/infra/firestore/repositories/workspace-business.issues.repository.ts
````typescript
/**
 * @fileoverview Workspace Business — Issues Repository.
 *
 * All Firestore read and write operations for the `issues` sub-collection
 * under a workspace. Stored at: workspaces/{workspaceId}/issues/{issueId}
 * Corresponds to the `workspace-business.issues` feature slice.
 */
⋮----
import {
  serverTimestamp,
  arrayUnion,
  collection,
  query,
  orderBy,
  type FieldValue,
} from 'firebase/firestore';
⋮----
import type { WorkspaceIssue, IssueComment } from '@/shared/types';
⋮----
import { db } from '../firestore.client';
import { createConverter } from '../firestore.converter';
import { getDocuments } from '../firestore.read.adapter';
import {
  updateDocument,
  addDocument,
} from '../firestore.write.adapter';
⋮----
/**
 * Creates a new issue in a workspace (e.g., when a task is rejected).
 * @param sourceTaskId - Optional SourcePointer to the A-track task that created this issue.
 *                       Used by the Discrete Recovery Principle: when the issue is resolved,
 *                       the A-track task is automatically unblocked via IssueResolved event.
 */
export const createIssue = async (
  workspaceId: string,
  title: string,
  type: 'technical' | 'financial',
  priority: 'high' | 'medium',
  sourceTaskId?: string
): Promise<void> =>
⋮----
/**
 * Adds a comment to a specific issue.
 */
export const addCommentToIssue = async (
  workspaceId: string,
  issueId: string,
  author: string,
  content: string
): Promise<void> =>
⋮----
/**
 * Marks an issue as resolved (closes the B-track item).
 * Publishes `workspace:issues:resolved` via the event bus after calling this.
 */
export const resolveIssue = async (
  workspaceId: string,
  issueId: string
): Promise<void> =>
⋮----
export const getWorkspaceIssues = async (
  workspaceId: string
): Promise<WorkspaceIssue[]> =>
````

## File: src/shared/infra/firestore/repositories/workspace-business.tasks.repository.ts
````typescript
/**
 * @fileoverview Workspace Business — Tasks Repository.
 *
 * All Firestore read and write operations for the `tasks` sub-collection
 * under a workspace. Stored at: workspaces/{workspaceId}/tasks/{taskId}
 * Corresponds to the `workspace-business.tasks` feature slice.
 */
⋮----
import {
  serverTimestamp,
  collection,
  query,
  orderBy,
  doc,
  getDoc,
} from 'firebase/firestore';
⋮----
import type { WorkspaceTask } from '@/shared/types';
⋮----
import { db } from '../firestore.client';
import { createConverter } from '../firestore.converter';
import { getDocuments } from '../firestore.read.adapter';
import {
  updateDocument,
  addDocument,
  deleteDocument,
} from '../firestore.write.adapter';
⋮----
/**
 * Creates a new task in a specific workspace.
 * @param workspaceId The ID of the workspace.
 * @param taskData The data for the new task.
 * @returns The ID of the newly created task.
 */
export const createTask = async (
  workspaceId: string,
  taskData: Omit<WorkspaceTask, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> =>
⋮----
/**
 * Updates an existing task in a workspace.
 * @param workspaceId The ID of the workspace.
 * @param taskId The ID of the task to update.
 * @param updates The fields to update on the task.
 */
export const updateTask = async (
  workspaceId: string,
  taskId: string,
  updates: Partial<WorkspaceTask>
): Promise<void> =>
⋮----
/**
 * Deletes a task from a workspace.
 * @param workspaceId The ID of the workspace.
 * @param taskId The ID of the task to delete.
 */
export const deleteTask = async (
  workspaceId: string,
  taskId: string
): Promise<void> =>
⋮----
export const getWorkspaceTasks = async (
  workspaceId: string
): Promise<WorkspaceTask[]> =>
⋮----
export const getWorkspaceTask = async (
  workspaceId: string,
  taskId: string
): Promise<WorkspaceTask | null> =>
````

## File: src/shared/infra/firestore/repositories/workspace-core.event-store.repository.ts
````typescript
/**
 * @fileoverview Workspace Core — Event Store Repository.
 *
 * Append-only domain event log for workspace aggregates.
 * Stored at: workspaces/{workspaceId}/events/{eventId}
 *
 * Per logic-overview.md invariant #9:
 * If this event store exists, Projections MUST be fully rebuildable from events.
 * This slice is append-only — no delete or update operations.
 */
⋮----
import {
  serverTimestamp,
  collection,
  query,
  orderBy,
  type Timestamp,
} from 'firebase/firestore';
⋮----
import { db } from '../firestore.client';
import { createConverter } from '../firestore.converter';
import { getDocuments } from '../firestore.read.adapter';
import { addDocument } from '../firestore.write.adapter';
⋮----
export interface StoredWorkspaceEvent {
  id: string;
  eventType: string;
  payload: Record<string, unknown>;
  aggregateId: string; // workspaceId
  occurredAt: Timestamp;
  correlationId?: string;
  causedBy?: string; // userId who triggered the command
}
⋮----
aggregateId: string; // workspaceId
⋮----
causedBy?: string; // userId who triggered the command
⋮----
/**
 * Appends a domain event to the workspace event store (append-only).
 */
export const appendDomainEvent = async (
  workspaceId: string,
  event: Omit<StoredWorkspaceEvent, 'id' | 'occurredAt'>
): Promise<string> =>
⋮----
/**
 * Retrieves all domain events for a workspace (ordered by occurredAt).
 * Used for event replay and audit.
 */
export const getDomainEvents = async (
  workspaceId: string
): Promise<StoredWorkspaceEvent[]> =>
````

## File: src/shared/infra/firestore/repositories/workspace-core.repository.ts
````typescript
/**
 * @fileoverview Workspace Core Repository.
 *
 * Firestore read and write operations for the `workspaces` top-level collection:
 * workspace lifecycle, settings, capability management, member grants, and team access.
 * Corresponds to the `workspace-core` feature slice.
 */
⋮----
import {
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  doc,
  getDoc,
  runTransaction,
  type FieldValue,
} from 'firebase/firestore';
⋮----
import type {
  Workspace,
  WorkspaceRole,
  WorkspaceGrant,
  WorkspaceFile,
  Capability,
  WorkspaceLifecycleState,
  Account,
  WorkspaceLocation,
} from '@/shared/types';
⋮----
import { db } from '../firestore.client';
import {
  updateDocument,
  addDocument,
  deleteDocument,
} from '../firestore.write.adapter';
⋮----
/**
 * Creates a new workspace with default values, based on the active account context.
 * @param name The name of the new workspace.
 * @param account The active account (user or organization) creating the workspace.
 * @returns The ID of the newly created workspace.
 */
export const createWorkspace = async (
  name: string,
  account: Account
): Promise<string> =>
⋮----
dimensionId: account.id, // The single source of truth for ownership.
⋮----
/**
 * Authorizes a team to access a workspace.
 * @param workspaceId The ID of the workspace.
 * @param teamId The ID of the team to authorize.
 */
export const authorizeWorkspaceTeam = async (
  workspaceId: string,
  teamId: string
): Promise<void> =>
⋮----
/**
 * Revokes a team's access from a workspace.
 * @param workspaceId The ID of the workspace.
 * @param teamId The ID of the team to revoke.
 */
export const revokeWorkspaceTeam = async (
  workspaceId: string,
  teamId: string
): Promise<void> =>
⋮----
/**
 * Grants an individual member a specific role in a workspace.
 * Uses a transaction to atomically guard against duplicate active grants.
 * @param workspaceId The ID of the workspace.
 * @param userId The ID of the user to grant access to.
 * @param role The role to grant.
 * @param protocol The access protocol to apply.
 */
export const grantIndividualWorkspaceAccess = async (
  workspaceId: string,
  userId: string,
  role: WorkspaceRole,
  protocol?: string
): Promise<void> =>
⋮----
/**
 * Revokes an individual's direct access grant from a workspace.
 * Uses a transaction to atomically read-modify-write the grants array.
 * @param workspaceId The ID of the workspace.
 * @param grantId The ID of the grant to revoke.
 */
export const revokeIndividualWorkspaceAccess = async (
  workspaceId: string,
  grantId: string
): Promise<void> =>
⋮----
/**
 * Mounts (adds) capabilities to a workspace.
 * @param workspaceId The ID of the workspace.
 * @param capabilities An array of capability objects to mount.
 */
export const mountCapabilities = async (
  workspaceId: string,
  capabilities: Capability[]
): Promise<void> =>
⋮----
/**
 * Unmounts (removes) a capability from a workspace.
 * Uses a transaction with filter-by-id to avoid fragile deep-equality matching.
 * @param workspaceId The ID of the workspace.
 * @param capability The capability object to unmount.
 */
export const unmountCapability = async (
  workspaceId: string,
  capability: Capability
): Promise<void> =>
⋮----
/**
 * Updates the settings of a workspace.
 * @param workspaceId The ID of the workspace.
 * @param settings The settings to update.
 */
export const updateWorkspaceSettings = async (
  workspaceId: string,
  settings: {
    name: string;
    visibility: 'visible' | 'hidden';
    lifecycleState: WorkspaceLifecycleState;
  }
): Promise<void> =>
⋮----
/**
 * Deletes an entire workspace.
 * @param workspaceId The ID of the workspace to delete.
 */
export const deleteWorkspace = async (workspaceId: string): Promise<void> =>
⋮----
// This just deletes the doc. In a real app, we'd need a Cloud Function
// to delete all subcollections (tasks, issues, etc.).
⋮----
export const getWorkspaceFiles = async (
  workspaceId: string
): Promise<WorkspaceFile[]> =>
⋮----
export const getWorkspaceGrants = async (
  workspaceId: string
): Promise<WorkspaceGrant[]> =>
⋮----
// =================================================================
// WorkspaceLocation CRUD — FR-L1/FR-L2/FR-L3
// =================================================================
⋮----
/**
 * Adds a new sub-location to a workspace.
 * FR-L1: Workspace OWNER can create sub-locations.
 */
export const createWorkspaceLocation = async (
  workspaceId: string,
  location: WorkspaceLocation
): Promise<void> =>
⋮----
/**
 * Updates a sub-location label/description/capacity.
 * FR-L2: Workspace OWNER can edit sub-locations.
 */
export const updateWorkspaceLocation = async (
  workspaceId: string,
  locationId: string,
  updates: Partial<Pick<WorkspaceLocation, 'label' | 'description' | 'capacity'>>
): Promise<void> =>
⋮----
/**
 * Removes a sub-location from a workspace.
 * FR-L3: Workspace OWNER can delete sub-locations.
 */
export const deleteWorkspaceLocation = async (
  workspaceId: string,
  locationId: string
): Promise<void> =>
````

## File: src/shared/infra/firestore/version-guard.middleware.ts
````typescript
/**
 * version-guard.middleware.ts — Firestore Write Version Guard
 *
 * [S2] applyVersionGuard() must be called before EVERY Projection write.
 *      Wraps version-guard logic with Firestore-specific helpers.
 *
 * Usage in Projection write paths:
 *   const existing = await firestoreAdapter.getDoc(path, id);
 *   const lastVersion = (existing?.data as { lastProcessedVersion?: number })?.lastProcessedVersion ?? -1;
 *   if (!allowFirestoreWrite(envelope.aggregateVersion, lastVersion)) return; // stale event [S2]
 *
 * Note: Version guard logic is inlined here to avoid importing from features/ [D5].
 *       The canonical contract definition lives in features/shared-kernel/version-guard.
 *       If the monotonic-version rule changes, update BOTH locations in sync.
 */
⋮----
/** Result of the version guard decision [S2]. */
export type VersionGuardResult = 'allow' | 'discard';
⋮----
/**
 * Check whether an incoming event's version is newer than the currently stored version.
 *
 * [S2] Returns 'allow' if the Projection write should proceed.
 *      Returns 'discard' if the event is stale and must be silently dropped.
 *
 * @param eventVersion            aggregateVersion from the EventEnvelope
 * @param viewLastProcessedVersion lastProcessedVersion from the Firestore view document (-1 if not yet written)
 */
export function applyFirestoreVersionGuard(
  eventVersion: number,
  viewLastProcessedVersion: number
): VersionGuardResult
⋮----
/**
 * Boolean shorthand for applyFirestoreVersionGuard.
 * Returns true when the write is permitted.
 */
export function allowFirestoreWrite(
  eventVersion: number,
  viewLastProcessedVersion: number
): boolean
````

## File: src/shared/infra/index.ts
````typescript
// Firebase repositories - all data access functions
⋮----
// Firebase facades - high-level business operations
⋮----
// Firebase clients - for use in providers and initialization
````

## File: src/shared/infra/messaging/index.ts
````typescript
/**
 * src/shared/infra/messaging/index.ts
 *
 * [D24] Only exports the IMessaging Port interface.
 *       Firebase SDK types must NOT be re-exported from this boundary.
 * [R8]  Implementations must forward envelope.traceId into FCM metadata unchanged.
 */
````

## File: src/shared/infra/messaging/messaging.adapter.ts
````typescript
/**
 * @fileoverview Firebase Cloud Messaging (FCM) Adapter.
 * This file will contain functions for interacting with FCM, such as sending
 * push notifications, managing device tokens, and handling incoming messages.
 *
 * TODO: Implement FCM logic as needed, including obtaining tokens and
 * handling foreground messages.
 */
⋮----
// Example of a potential adapter function:
/*
import { messaging } from './messaging.client';
import { getToken, onMessage } from 'firebase/messaging';

export const getFCMToken = async () => {
  if (messaging && process.env.NEXT_PUBLIC_VAPID_KEY) {
    try {
      const currentToken = await getToken(messaging, { vapidKey: process.env.NEXT_PUBLIC_VAPID_KEY });
      if (currentToken) {
        console.log('FCM Token:', currentToken);
        return currentToken;
      } else {
        console.log('No registration token available. Request permission to generate one.');
        return null;
      }
    } catch (error) {
      console.error('An error occurred while retrieving token. ', error);
      return null;
    }
  }
  return null;
};

export const onForegroundMessage = (callback: (payload: unknown) => void) => {
  if (messaging) {
    return onMessage(messaging, callback);
  }
  return () => {};
};
*/
````

## File: src/shared/infra/messaging/messaging.client.ts
````typescript
/**
 * @fileoverview Firebase Cloud Messaging (FCM) Client Initializer.
 * This file is responsible for initializing the FCM service and handling
 * background message processing and token registration.
 * It ensures Messaging is only initialized on the client side.
 */
import { getMessaging, type Messaging } from 'firebase/messaging';
⋮----
import { app } from '../app.client';
⋮----
// Ensure Messaging is only initialized in the browser and is supported.
````

## File: src/shared/infra/messaging/messaging.types.ts
````typescript
/**
 * messaging.types.ts — FCM Internal Types
 *
 * [D24] These types must NOT be exported outside src/shared/infra/messaging/.
 *       Feature slices use IMessaging / PushNotificationPayload from '@/shared/ports'.
 * [R8]  traceId must appear in every FCM message metadata object.
 */
⋮----
/** Raw FCM message payload shape (matches firebase-admin MulticastMessage data field). */
export interface FcmData {
  readonly [key: string]: string;
}
⋮----
/** Internal FCM message envelope (includes traceId for [R8] compliance). */
export interface FcmMessage {
  readonly token: string;
  readonly notification: {
    readonly title: string;
    readonly body: string;
  };
  /** [R8] traceId forwarded from EventEnvelope. Never regenerated here. */
  readonly data: FcmData & { readonly traceId: string };
}
⋮----
/** [R8] traceId forwarded from EventEnvelope. Never regenerated here. */
````

## File: src/shared/infra/storage/index.ts
````typescript
/**
 * src/shared/infra/storage/index.ts
 *
 * [D24] Only exports the IFileStore Port interface + adapter implementation.
 *       Firebase SDK types must NOT be re-exported from this boundary.
 * [D25] StorageAdapter is the sole IFileStore implementation — the L7 FIREBASE_ACL
 *       boundary for firebase/storage.
 */
````

## File: src/shared/infra/storage/storage-path.resolver.ts
````typescript
/**
 * storage-path.resolver.ts — Firebase Storage Path Rules
 *
 * [D24] All Storage path construction must go through this resolver.
 *       Feature slices must NOT build raw Storage paths directly.
 *
 * Usage:
 *   import { StoragePaths } from '@/shared/infra/storage/storage-path.resolver';
 *   const path = StoragePaths.dailyPhoto(accountId, workspaceId, fileId, fileName);
 */
⋮----
/** Daily log photo: daily-photos/{accountId}/{workspaceId}/{fileId}/{fileName} */
dailyPhoto(accountId: string, workspaceId: string, fileId: string, fileName: string): string
⋮----
/** Task attachment: task-attachments/{workspaceId}/{fileId}/{fileName} */
taskAttachment(workspaceId: string, fileId: string, fileName: string): string
⋮----
/** User profile avatar: user-profiles/{userId}/avatar.jpg */
userAvatar(userId: string): string
⋮----
/** Workspace document version: files-plugin/{workspaceId}/{fileId}/{versionId}/{fileName} */
workspaceDocument(workspaceId: string, fileId: string, versionId: string, fileName: string): string
````

## File: src/shared/infra/storage/storage.adapter.ts
````typescript
/**
 * storage.adapter.ts — StorageAdapter
 *
 * [D24] Sole legitimate firebase/storage call site (all SDK calls are confined to
 *       storage.write.adapter.ts and storage.read.adapter.ts; this class orchestrates
 *       through those modules and never imports firebase/storage directly).
 * [D25] Implements IFileStore Port so feature slices never import firebase/storage directly.
 *
 * Architecture ref: FIREBASE_ACL → STORE_ADP (logic-overview.md)
 *   STORE_ADP = Storage Adapter — implements IFileStore, handles path resolution and URL
 *   signing. All firebase/storage SDK calls are confined to the write/read adapter modules.
 *
 * Consumers (VS5 workspace-business.files) inject IFileStore; they never reference
 * firebase/storage types directly (D24).
 */
⋮----
import type { IFileStore, UploadOptions } from '@/shared/ports/i-file-store';
⋮----
import { getFileDownloadURL } from './storage.read.adapter';
import { deleteFile, uploadFile } from './storage.write.adapter';
⋮----
/**
 * Adapter that implements the IFileStore port using Firebase Storage SDK calls.
 *
 * All firebase/storage SDK calls are confined to the write/read adapter modules;
 * this class only orchestrates and satisfies the IFileStore contract.
 */
export class StorageAdapter implements IFileStore
⋮----
/**
   * Upload a file to the given storage path.
   * @returns The public download URL of the uploaded file.
   */
async upload(path: string, file: File | Blob, options?: UploadOptions): Promise<string>
⋮----
/**
   * Get the public download URL for a file at the given storage path.
   */
async getDownloadURL(path: string): Promise<string>
⋮----
/**
   * Delete a file at the given storage path.
   */
async deleteFile(path: string): Promise<void>
⋮----
/**
 * Singleton adapter instance for injection into VS5 workspace-business.files.
 * Feature slices depend on IFileStore (the port), not on this concrete class.
 */
````

## File: src/shared/infra/storage/storage.client.ts
````typescript
/**
 * @fileoverview Cloud Storage Client Initializer.
 * This file is responsible for exporting the initialized Storage instance.
 */
import { getStorage, type FirebaseStorage } from 'firebase/storage';
⋮----
import { app } from '../app.client';
````

## File: src/shared/infra/storage/storage.facade.ts
````typescript
/**
 * @fileoverview Cloud Storage Facade.
 *
 * This file acts as a simplified, high-level interface to the Storage adapters.
 * Its purpose is to encapsulate more complex business-specific operations.
 */
⋮----
import { getFileDownloadURL } from './storage.read.adapter';
import { uploadFile } from './storage.write.adapter';
⋮----
/**
 * Uploads a photo for a daily log entry to a structured path and returns its public URL.
 * @param accountId The ID of the account.
 * @param workspaceId The ID of the workspace.
 * @param file The File object to upload.
 * @returns A promise that resolves with the public download URL of the uploaded file.
 */
export const uploadDailyPhoto = async (
  accountId: string,
  workspaceId: string,
  file: File
): Promise<string> =>
⋮----
/**
 * Uploads a file as an attachment for a workspace task.
 * @param workspaceId The ID of the workspace where the task resides.
 * @param file The file to be uploaded.
 * @returns A promise that resolves with the public download URL of the uploaded file.
 */
export const uploadTaskAttachment = async (
  workspaceId: string,
  file: File
): Promise<string> =>
⋮----
/**
 * Uploads a user's profile picture.
 * @param userId The ID of the user.
 * @param file The image file to upload.
 * @returns A promise that resolves with the public download URL of the uploaded image.
 */
export const uploadProfilePicture = async (
  userId: string,
  file: File
): Promise<string> =>
⋮----
// Use a consistent path to allow for easy overwriting.
⋮----
/**
 * Uploads a raw workspace document to Firebase Storage under a versioned path.
 * Returns both the download URL and the storage path for external reference.
 *
 * This is the single-responsibility upload boundary for workspace-business.files.
 * Firestore metadata writes remain the caller's responsibility so they can use
 * atomic operations (arrayUnion, serverTimestamp).
 *
 * @param workspaceId The workspace that owns the file.
 * @param fileId      The logical file ID (stable across versions).
 * @param versionId   A unique ID for this specific version.
 * @param file        The raw file to upload.
 * @returns The public download URL for the uploaded version.
 */
export const uploadWorkspaceDocument = async (
  workspaceId: string,
  fileId: string,
  versionId: string,
  file: File
): Promise<string> =>
````

## File: src/shared/infra/storage/storage.read.adapter.ts
````typescript
/**
 * @fileoverview Cloud Storage Read Adapter.
 * This file contains all read-only operations for Firebase Storage,
 * such as getting download URLs and listing files.
 */
⋮----
import { ref, getDownloadURL, listAll, type ListResult } from 'firebase/storage';
⋮----
import { storage } from './storage.client';
⋮----
/**
 * Gets the public download URL for a file in Storage.
 * @param path The full path to the file in the bucket.
 * @returns A promise that resolves to the public URL string.
 */
export const getFileDownloadURL = (path: string): Promise<string> =>
⋮----
/**
 * Lists all files and sub-directories within a given storage path.
 * @param path The path to the directory to list.
 * @returns A promise that resolves to a ListResult object.
 */
export const listFiles = (path: string): Promise<ListResult> =>
````

## File: src/shared/infra/storage/storage.types.ts
````typescript
/**
 * storage.types.ts — Firebase Storage Internal Types
 *
 * [D24] These types must NOT be exported outside src/shared/infra/storage/.
 *       Feature slices use IFileStore / UploadOptions from '@/shared/ports'.
 */
⋮----
import type {
  StorageReference,
  UploadMetadata,
  UploadResult,
} from 'firebase/storage';
⋮----
/** Re-alias Firebase Storage SDK types for internal use only. */
⋮----
/** Internal upload task result. */
export interface UploadTaskResult {
  readonly downloadURL: string;
  readonly storagePath: string;
}
````

## File: src/shared/infra/storage/storage.write.adapter.ts
````typescript
/**
 * @fileoverview Cloud Storage Write Adapter.
 * This file contains all write operations for Firebase Storage,
 * such as file uploads and deletions.
 */
⋮----
import {
  ref,
  uploadBytes,
  deleteObject,
  type UploadResult,
  type UploadMetadata,
} from 'firebase/storage';
⋮----
import { storage } from './storage.client';
⋮----
/**
 * Uploads a file to a specified path in Cloud Storage.
 * @param path The full path where the file will be stored.
 * @param file The file object (Blob or File) to upload.
 * @param metadata Optional metadata for the file.
 * @returns A promise that resolves with an UploadResult on success.
 */
export const uploadFile = (
  path: string,
  file: Blob | Uint8Array | ArrayBuffer,
  metadata?: UploadMetadata
): Promise<UploadResult> =>
⋮----
/**
 * Deletes a file from Cloud Storage.
 * @param path The full path of the file to delete.
 * @returns A promise that resolves when the deletion is complete.
 */
export const deleteFile = (path: string): Promise<void> =>
````

## File: src/shared/lib/account.rules.ts
````typescript
/**
 * @fileoverview entities/account — Pure account domain rules.
 * No async, no I/O, no React, no Firebase.
 */
⋮----
import type { Account, OrganizationRole, Team, MemberReference } from "@/shared/types"
⋮----
// ---------------------------------------------------------------------------
// Type guards
// ---------------------------------------------------------------------------
⋮----
/** Returns true if the account represents an organization. */
export function isOrganization(account: Account): boolean
⋮----
/** Returns true if the account represents a personal user account. */
export function isPersonalAccount(account: Account): boolean
⋮----
// ---------------------------------------------------------------------------
// Ownership & role queries
// ---------------------------------------------------------------------------
⋮----
/** Returns true if the given userId is the owner of this organization account. */
export function isOwner(account: Account, userId: string): boolean
⋮----
/**
 * Returns the OrganizationRole of a member within an account, or undefined
 * if the user is not a member.
 */
export function getMemberRole(
  account: Account,
  userId: string
): OrganizationRole | undefined
⋮----
// ---------------------------------------------------------------------------
// Team queries
// ---------------------------------------------------------------------------
⋮----
/**
 * Returns all teams inside the organization that the given user belongs to.
 */
export function getUserTeams(account: Account, userId: string): Team[]
⋮----
/**
 * Returns a Set of team IDs that the given user belongs to within the account.
 * Used for efficient membership checks.
 */
export function getUserTeamIds(account: Account, userId: string): Set<string>
````

## File: src/shared/lib/format-bytes.ts
````typescript
export const formatBytes = (bytes: number): string =>
````

## File: src/shared/lib/index.ts
````typescript
// Domain Rules
⋮----
// Utilities
````

## File: src/shared/lib/schedule.rules.ts
````typescript
/**
 * @fileoverview entities/schedule — Pure schedule domain rules.
 * No async, no I/O, no React, no Firebase.
 */
⋮----
import type { ScheduleStatus } from "@/shared/types"
⋮----
// ---------------------------------------------------------------------------
// Valid status transitions
// ---------------------------------------------------------------------------
⋮----
/**
 * Defines the allowed status transitions for a ScheduleItem.
 * Key: current status → Value: allowed next statuses.
 */
⋮----
// ---------------------------------------------------------------------------
// Predicates
// ---------------------------------------------------------------------------
⋮----
/**
 * Returns true if transitioning from `from` to `to` is a valid status change.
 */
export function canTransitionScheduleStatus(
  from: ScheduleStatus,
  to: ScheduleStatus
): boolean
````

## File: src/shared/lib/skill.rules.ts
````typescript
/**
 * @fileoverview shared/lib/skill — Skill domain utilities backed by shared-kernel.
 * No async, no I/O, no React, no Firebase.
 *
 * Type definitions live in @/shared/types/skill.types.
 * Runtime functions (resolveSkillTier, TIER_DEFINITIONS, etc.) live in
 * @/features/shared-kernel/skill-tier — import directly from there.
 */
⋮----
import type { SkillGrant, SkillTier, SkillRequirement } from '@/shared/types'
⋮----
// ---------------------------------------------------------------------------
// Local tier rank lookup (avoids a feature dependency for a trivial computation)
// ---------------------------------------------------------------------------
⋮----
// ---------------------------------------------------------------------------
// Account BC helper — requires SkillGrant (has Timestamp; stays in shared/lib)
// ---------------------------------------------------------------------------
⋮----
/**
 * Returns true if the given SkillGrant array satisfies a single SkillRequirement.
 * Matches on `tagSlug` (portable, primary key) with fallback to `tagId` for
 * backward compatibility with older grant records.
 * Does not check quantity — only verifies that the skill & tier threshold is met.
 */
export function grantSatisfiesRequirement(
  grants: SkillGrant[],
  requirement: SkillRequirement
): boolean
````

## File: src/shared/lib/task.rules.ts
````typescript
/**
 * @fileoverview shared/lib/task — Pure task domain rules.
 * No async, no I/O, no React, no Firebase.
 */
⋮----
import type { WorkspaceTask, TaskWithChildren } from "@/shared/types";
⋮----
/** A task is considered "divisible" (quantity-based) when its quantity exceeds this threshold. */
⋮----
/** Default quantity for tasks that do not explicitly set one. */
⋮----
/** Progress percentage representing full completion. */
⋮----
/** Terminal states that count as completed for atomic (non-divisible) tasks. */
⋮----
/**
 * Builds a recursive task tree from a flat list of WorkspaceTask records.
 * Calculates WBS numbering, descendant subtotal sums, and progress per node.
 */
export const buildTaskTree = (tasks: WorkspaceTask[]): TaskWithChildren[] =>
⋮----
const build = (
    node: TaskWithChildren,
    parentNo: string,
    index: number,
    path: Set<string>
) =>
````

## File: src/shared/lib/user.rules.ts
````typescript
/**
 * @fileoverview entities/user — Pure user domain rules.
 * No async, no I/O, no React, no Firebase.
 */
⋮----
import type { Account } from "@/shared/types"
⋮----
// ---------------------------------------------------------------------------
// Type guards
// ---------------------------------------------------------------------------
⋮----
/**
 * Returns true if the account represents an anonymous (guest) user.
 * Anonymous users have no email address.
 */
export function isAnonymousUser(account: Account): boolean
````

## File: src/shared/lib/utils.ts
````typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
⋮----
export function cn(...inputs: ClassValue[])
⋮----
/**
 * Converts a Firestore Timestamp (or any object with a `.toDate()` method) to
 * an ISO 8601 string. Falls back to `new Date().toISOString()` for non-Timestamp values.
 * Uses duck-typing to avoid a direct `firebase/firestore` import dependency.
 */
export function firestoreTimestampToISO(ts: unknown): string
⋮----
/**
 * Converts a hex color string to an HSL string compatible with ShadCN CSS variables.
 * Format returned: "H S% L%" (e.g., "221 83% 53%")
 */
export function hexToHsl(hex: string): string
⋮----
// Remove the hash if it exists
⋮----
// Parse r, g, b
````

## File: src/shared/lib/workspace.rules.ts
````typescript
/**
 * @fileoverview entities/workspace — Pure workspace domain rules.
 * No async, no I/O, no React, no Firebase.
 */
⋮----
import { isOwner, getUserTeamIds } from "@/shared/lib/account.rules"
import type { Workspace, Account } from "@/shared/types"
⋮----
// ---------------------------------------------------------------------------
// Access predicates
// ---------------------------------------------------------------------------
⋮----
/**
 * Returns true if the user has explicit access to the workspace
 * either via a direct individual grant or via a team grant.
 */
export function hasWorkspaceAccess(
  workspace: Workspace,
  userId: string,
  userTeamIds: Set<string>
): boolean
⋮----
/**
 * Returns true if the workspace should be visible to the given user,
 * taking into account the workspace's visibility setting and the
 * user's grants / team memberships.
 */
export function isWorkspaceVisibleToUser(
  workspace: Workspace,
  userId: string,
  userTeamIds: Set<string>
): boolean
⋮----
// ---------------------------------------------------------------------------
// Collection filter
// ---------------------------------------------------------------------------
⋮----
/**
 * Returns the subset of workspaces that are visible to the given user
 * in the context of the active account.
 *
 * Business rules:
 * - Personal accounts: user sees all workspaces they own.
 * - Organization accounts: org owners see everything;
 *   regular members see workspaces where visibility='visible'
 *   OR they have an explicit grant / team membership.
 */
export function filterVisibleWorkspaces(
  workspaces: Workspace[],
  userId: string,
  activeAccount: Account,
  allAccounts: Record<string, Account>
): Workspace[]
⋮----
// Filter to workspaces that belong to the active dimension
⋮----
// Personal account: the user owns all of their own workspaces
⋮----
// Organization account: apply visibility + access rules
⋮----
// Org owners see everything in their org
````

## File: src/shared/ports/i-auth.service.ts
````typescript
/**
 * i-auth.service.ts — IAuthService Port Interface
 *
 * [D24] Feature slices depend on this interface, NOT on firebase/auth directly.
 * [D25] New auth features must implement this Port in auth.adapter.ts.
 *
 * VS1 identity.slice is the primary consumer.
 */
⋮----
export interface AuthUser {
  readonly uid: string;
  readonly email: string | null;
  readonly displayName: string | null;
  readonly photoURL: string | null;
}
⋮----
export interface IAuthService {
  signInWithEmailAndPassword(email: string, password: string): Promise<AuthUser>;
  createUserWithEmailAndPassword(email: string, password: string): Promise<AuthUser>;
  sendPasswordResetEmail(email: string): Promise<void>;
  signInAnonymously(): Promise<AuthUser>;
  updateProfile(user: AuthUser, profile: { displayName?: string; photoURL?: string }): Promise<void>;
  signOut(): Promise<void>;
  onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void;
  getCurrentUser(): AuthUser | null;
}
⋮----
signInWithEmailAndPassword(email: string, password: string): Promise<AuthUser>;
createUserWithEmailAndPassword(email: string, password: string): Promise<AuthUser>;
sendPasswordResetEmail(email: string): Promise<void>;
signInAnonymously(): Promise<AuthUser>;
updateProfile(user: AuthUser, profile:
signOut(): Promise<void>;
onAuthStateChanged(callback: (user: AuthUser | null)
getCurrentUser(): AuthUser | null;
````

## File: src/shared/ports/i-file-store.ts
````typescript
/**
 * i-file-store.ts — IFileStore Port Interface
 *
 * [D24] Feature slices depend on this interface, NOT on firebase/storage directly.
 * [D25] New storage features must implement this Port in storage.facade.ts.
 *
 * VS5 workspace-business.files is the primary consumer.
 */
⋮----
export interface UploadOptions {
  readonly contentType?: string;
}
⋮----
export interface IFileStore {
  /**
   * Upload a file to the given storage path.
   * @returns The public download URL of the uploaded file.
   */
  upload(path: string, file: File | Blob, options?: UploadOptions): Promise<string>;

  /**
   * Get the public download URL for a file at the given storage path.
   */
  getDownloadURL(path: string): Promise<string>;

  /**
   * Delete a file at the given storage path.
   */
  deleteFile(path: string): Promise<void>;
}
⋮----
/**
   * Upload a file to the given storage path.
   * @returns The public download URL of the uploaded file.
   */
upload(path: string, file: File | Blob, options?: UploadOptions): Promise<string>;
⋮----
/**
   * Get the public download URL for a file at the given storage path.
   */
getDownloadURL(path: string): Promise<string>;
⋮----
/**
   * Delete a file at the given storage path.
   */
deleteFile(path: string): Promise<void>;
````

## File: src/shared/ports/i-firestore.repo.ts
````typescript
/**
 * i-firestore.repo.ts — IFirestoreRepo Port Interface
 *
 * [D24] Feature slices depend on this interface, NOT on firebase/firestore directly.
 * [D25] New Firestore features must implement this Port in firestore.facade.ts.
 * [S2]  aggregateVersion monotonic-increment guard must be applied before every write.
 *
 * VS8 projection.event-funnel is the primary consumer.
 */
⋮----
/**
 * Structural Firestore Timestamp interface — D24 compliant.
 *
 * Matches the shape of firebase/firestore Timestamp without importing the SDK.
 * Use this type throughout domain types and shared-kernel contracts instead of
 * importing Timestamp directly from firebase/firestore.
 *
 * The concrete firebase Timestamp satisfies this interface at runtime; the
 * FIREBASE_ACL adapters in src/shared/infra/firestore/ hold the only real
 * firebase/* imports per [D24].
 */
export interface Timestamp {
  readonly seconds: number;
  readonly nanoseconds: number;
  toDate(): Date;
  toMillis(): number;
}
⋮----
toDate(): Date;
toMillis(): number;
⋮----
export interface FirestoreDoc<T = Record<string, unknown>> {
  readonly id: string;
  readonly data: T;
}
⋮----
export interface WriteOptions {
  /** [S2] Provide incoming event's aggregateVersion; write is rejected if stale. */
  readonly aggregateVersion?: number;
  /** Whether to merge with existing document or overwrite. Default: overwrite. */
  readonly merge?: boolean;
}
⋮----
/** [S2] Provide incoming event's aggregateVersion; write is rejected if stale. */
⋮----
/** Whether to merge with existing document or overwrite. Default: overwrite. */
⋮----
export interface IFirestoreRepo {
  /** Read a single document. Returns null if not found. */
  getDoc<T>(collectionPath: string, docId: string): Promise<FirestoreDoc<T> | null>;

  /** Read all documents in a collection (with optional where filter). */
  getDocs<T>(collectionPath: string): Promise<FirestoreDoc<T>[]>;

  /**
   * Write a document.
   * [S2] If aggregateVersion is supplied, applies SK_VERSION_GUARD before writing:
   *   new.aggregateVersion > existing.lastProcessedVersion → write; else discard.
   */
  setDoc<T>(collectionPath: string, docId: string, data: T, opts?: WriteOptions): Promise<void>;

  /** Delete a document. */
  deleteDoc(collectionPath: string, docId: string): Promise<void>;

  /** Subscribe to real-time updates on a collection. Returns unsubscribe function. */
  onSnapshot<T>(
    collectionPath: string,
    callback: (docs: FirestoreDoc<T>[]) => void
  ): () => void;
}
⋮----
/** Read a single document. Returns null if not found. */
getDoc<T>(collectionPath: string, docId: string): Promise<FirestoreDoc<T> | null>;
⋮----
/** Read all documents in a collection (with optional where filter). */
getDocs<T>(collectionPath: string): Promise<FirestoreDoc<T>[]>;
⋮----
/**
   * Write a document.
   * [S2] If aggregateVersion is supplied, applies SK_VERSION_GUARD before writing:
   *   new.aggregateVersion > existing.lastProcessedVersion → write; else discard.
   */
setDoc<T>(collectionPath: string, docId: string, data: T, opts?: WriteOptions): Promise<void>;
⋮----
/** Delete a document. */
deleteDoc(collectionPath: string, docId: string): Promise<void>;
⋮----
/** Subscribe to real-time updates on a collection. Returns unsubscribe function. */
onSnapshot<T>(
    collectionPath: string,
    callback: (docs: FirestoreDoc<T>[]) => void
): ()
````

## File: src/shared/ports/i-messaging.ts
````typescript
/**
 * i-messaging.ts — IMessaging Port Interface
 *
 * [D24] Feature slices depend on this interface, NOT on firebase/messaging directly.
 * [D25] New messaging features must implement this Port in messaging.adapter.ts.
 * [R8]  traceId from EventEnvelope must be forwarded into FCM metadata.
 *        Adapters must NOT generate new traceIds here.
 *
 * VS7 account-user.notification is the primary consumer.
 */
⋮----
export interface PushNotificationPayload {
  readonly title: string;
  readonly body: string;
  readonly data?: Record<string, string>;
}
⋮----
export interface IMessaging {
  /**
   * Send a push notification to a device token.
   * [R8] traceId is forwarded into FCM message metadata unchanged.
   */
  send(
    fcmToken: string,
    payload: PushNotificationPayload,
    traceId: string
  ): Promise<void>;

  /** Obtain the current FCM registration token for this device. */
  getToken(): Promise<string | null>;

  /** Subscribe to foreground messages. Returns unsubscribe function. */
  onForegroundMessage(
    callback: (payload: PushNotificationPayload) => void
  ): () => void;
}
⋮----
/**
   * Send a push notification to a device token.
   * [R8] traceId is forwarded into FCM message metadata unchanged.
   */
send(
    fcmToken: string,
    payload: PushNotificationPayload,
    traceId: string
  ): Promise<void>;
⋮----
/** Obtain the current FCM registration token for this device. */
getToken(): Promise<string | null>;
⋮----
/** Subscribe to foreground messages. Returns unsubscribe function. */
onForegroundMessage(
    callback: (payload: PushNotificationPayload) => void
): ()
````

## File: src/shared/ports/index.ts
````typescript
/**
 * SK_PORTS — Infrastructure Port Interface unified exports
 *
 * [D24] Feature slices import from '@/shared/ports', NOT from firebase/* directly.
 * [D25] Every new Firebase feature must add a Port here and an Adapter in src/shared/infra/.
 *
 * Port → Adapter → Firebase mapping:
 *   IAuthService   → auth.adapter.ts      → firebase/auth       (VS1)
 *   IFirestoreRepo → firestore.facade.ts  → firebase/firestore  (VS8 [S2])
 *   IMessaging     → messaging.adapter.ts → firebase/messaging  (VS7 [R8])
 *   IFileStore     → storage.facade.ts    → firebase/storage    (VS5)
 */
````

## File: src/shared/README.MD
````markdown
放置無狀態共用程式庫：UI 元件、helpers、types 與工具函式。
只允許向下依賴；向上 import 為架構違規。
````

## File: src/shared/shadcn-ui/accordion.tsx
````typescript
import { ChevronDown } from "lucide-react"
⋮----
import { cn } from "@/shared/utils/utils"
````

## File: src/shared/shadcn-ui/alert-dialog.tsx
````typescript
import { cn } from "@/shared/utils/utils"
import { buttonVariants } from "@/shared/shadcn-ui/button"
⋮----
className=
````

## File: src/shared/shadcn-ui/alert.tsx
````typescript
import { cva, type VariantProps } from "class-variance-authority"
⋮----
import { cn } from "@/shared/utils/utils"
⋮----
className=
````

## File: src/shared/shadcn-ui/aspect-ratio.tsx
````typescript

````

## File: src/shared/shadcn-ui/avatar.tsx
````typescript
import { cn } from "@/shared/utils/utils"
````

## File: src/shared/shadcn-ui/badge.tsx
````typescript
import { cva, type VariantProps } from "class-variance-authority"
⋮----
import { cn } from "@/shared/utils/utils"
⋮----
export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}
⋮----
function Badge(
⋮----
<div className=
````

## File: src/shared/shadcn-ui/breadcrumb.tsx
````typescript
import { Slot } from "@radix-ui/react-slot"
import { ChevronRight, MoreHorizontal } from "lucide-react"
⋮----
import { cn } from "@/shared/utils/utils"
⋮----
className=
````

## File: src/shared/shadcn-ui/button-group.tsx
````typescript
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
⋮----
import { cn } from "@/shared/utils/utils"
import { Separator } from "@/shared/shadcn-ui/separator"
⋮----
className=
````

## File: src/shared/shadcn-ui/button.tsx
````typescript
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
⋮----
import { cn } from "@/shared/lib/utils"
⋮----
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}
⋮----
className=
````

## File: src/shared/shadcn-ui/calendar.tsx
````typescript
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"
import { DayButton, DayPicker, getDefaultClassNames } from "react-day-picker"
⋮----
import { cn } from "@/shared/utils/utils"
import { Button, buttonVariants } from "@/shared/shadcn-ui/button"
⋮----
className=
````

## File: src/shared/shadcn-ui/card.tsx
````typescript
import { cn } from "@/shared/utils/utils"
````

## File: src/shared/shadcn-ui/carousel.tsx
````typescript
import useEmblaCarousel, {
  type UseEmblaCarouselType,
} from "embla-carousel-react"
import { ArrowLeft, ArrowRight } from "lucide-react"
⋮----
import { cn } from "@/shared/utils/utils"
import { Button } from "@/shared/shadcn-ui/button"
⋮----
type CarouselApi = UseEmblaCarouselType[1]
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>
type CarouselOptions = UseCarouselParameters[0]
type CarouselPlugin = UseCarouselParameters[1]
⋮----
type CarouselProps = {
  opts?: CarouselOptions
  plugins?: CarouselPlugin
  orientation?: "horizontal" | "vertical"
  setApi?: (api: CarouselApi) => void
}
⋮----
type CarouselContextProps = {
  carouselRef: ReturnType<typeof useEmblaCarousel>[0]
  api: ReturnType<typeof useEmblaCarousel>[1]
  scrollPrev: () => void
  scrollNext: () => void
  canScrollPrev: boolean
  canScrollNext: boolean
} & CarouselProps
⋮----
function useCarousel()
⋮----
className=
````

## File: src/shared/shadcn-ui/chart.tsx
````typescript
import { cn } from "@/shared/utils/utils"
⋮----
// Format: { THEME_NAME: CSS_SELECTOR }
⋮----
export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  )
}
⋮----
type ChartContextProps = {
  config: ChartConfig
}
⋮----
function useChart()
⋮----
className=
⋮----
<div className=
⋮----
return <div className=
⋮----
// Helper to extract item config from a payload.
````

## File: src/shared/shadcn-ui/checkbox.tsx
````typescript
import { Check } from "lucide-react"
⋮----
import { cn } from "@/shared/utils/utils"
````

## File: src/shared/shadcn-ui/collapsible.tsx
````typescript

````

## File: src/shared/shadcn-ui/command.tsx
````typescript
import { type DialogProps } from "@radix-ui/react-dialog"
import { Command as CommandPrimitive } from "cmdk"
import { Search } from "lucide-react"
⋮----
import { cn } from "@/shared/utils/utils"
import { Dialog, DialogContent } from "@/shared/shadcn-ui/dialog"
⋮----
className=
````

## File: src/shared/shadcn-ui/context-menu.tsx
````typescript
import { Check, ChevronRight, Circle } from "lucide-react"
⋮----
import { cn } from "@/shared/utils/utils"
⋮----
className=
````

## File: src/shared/shadcn-ui/dialog.tsx
````typescript
import { X } from "lucide-react"
⋮----
import { cn } from "@/shared/utils/utils"
⋮----
className=
````

## File: src/shared/shadcn-ui/drawer.tsx
````typescript
import { Drawer as DrawerPrimitive } from "vaul"
⋮----
import { cn } from "@/shared/utils/utils"
⋮----
className=
````

## File: src/shared/shadcn-ui/dropdown-menu.tsx
````typescript
import { Check, ChevronRight, Circle } from "lucide-react"
⋮----
import { cn } from "@/shared/utils/utils"
⋮----
className=
````

## File: src/shared/shadcn-ui/empty.tsx
````typescript
import { cva, type VariantProps } from "class-variance-authority"
⋮----
import { cn } from "@/shared/utils/utils"
⋮----
className=
````

## File: src/shared/shadcn-ui/field.tsx
````typescript
import { useMemo } from "react"
import { cva, type VariantProps } from "class-variance-authority"
⋮----
import { cn } from "@/shared/utils/utils"
import { Label } from "@/shared/shadcn-ui/label"
import { Separator } from "@/shared/shadcn-ui/separator"
⋮----
className=
````

## File: src/shared/shadcn-ui/form.tsx
````typescript
import { Slot } from "@radix-ui/react-slot"
import {
  Controller,
  FormProvider,
  useFormContext,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form"
⋮----
import { cn } from "@/shared/utils/utils"
import { Label } from "@/shared/shadcn-ui/label"
⋮----
type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
  name: TName
}
⋮----
const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  ...props
}: ControllerProps<TFieldValues, TName>) =>
⋮----
const useFormField = () =>
⋮----
type FormItemContextValue = {
  id: string
}
⋮----
className=
````

## File: src/shared/shadcn-ui/hover-card.tsx
````typescript
import { cn } from "@/shared/utils/utils"
````

## File: src/shared/shadcn-ui/input-group.tsx
````typescript
import { cva, type VariantProps } from "class-variance-authority"
⋮----
import { cn } from "@/shared/utils/utils"
import { Button } from "@/shared/shadcn-ui/button"
import { Input } from "@/shared/shadcn-ui/input"
import { Textarea } from "@/shared/shadcn-ui/textarea"
⋮----
className=
⋮----
// Variants based on alignment.
⋮----
// Focus state.
⋮----
// Error state.
⋮----
if ((e.target as HTMLElement).closest("button"))
````

## File: src/shared/shadcn-ui/input-otp.tsx
````typescript
import { OTPInput, OTPInputContext } from "input-otp"
import { Dot } from "lucide-react"
⋮----
import { cn } from "@/shared/utils/utils"
⋮----
className=
````

## File: src/shared/shadcn-ui/input.tsx
````typescript
import { cn } from "@/shared/utils/utils"
````

## File: src/shared/shadcn-ui/item.tsx
````typescript
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
⋮----
import { cn } from "@/shared/utils/utils"
import { Separator } from "@/shared/shadcn-ui/separator"
⋮----
function ItemGroup(
⋮----
function ItemSeparator({
  className,
  ...props
}: React.ComponentProps<typeof Separator>)
⋮----
className=
````

## File: src/shared/shadcn-ui/kbd.tsx
````typescript
import { cn } from "@/shared/utils/utils"
⋮----
className=
````

## File: src/shared/shadcn-ui/label.tsx
````typescript
import { cva, type VariantProps } from "class-variance-authority"
⋮----
import { cn } from "@/shared/utils/utils"
````

## File: src/shared/shadcn-ui/menubar.tsx
````typescript
import { Check, ChevronRight, Circle } from "lucide-react"
⋮----
import { cn } from "@/shared/utils/utils"
⋮----
className=
````

## File: src/shared/shadcn-ui/navigation-menu.tsx
````typescript
import { cva } from "class-variance-authority"
import { ChevronDown } from "lucide-react"
⋮----
import { cn } from "@/shared/utils/utils"
⋮----
<div className=
⋮----
className=
````

## File: src/shared/shadcn-ui/pagination.tsx
````typescript
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
⋮----
import { cn } from "@/shared/utils/utils"
import { ButtonProps, buttonVariants } from "@/shared/shadcn-ui/button"
⋮----
const Pagination = (
⋮----
type PaginationLinkProps = {
  isActive?: boolean
} & Pick<ButtonProps, "size"> &
  React.ComponentProps<"a">
⋮----
const PaginationLink = (
⋮----
className=
⋮----
const PaginationPrevious = (
````

## File: src/shared/shadcn-ui/popover.tsx
````typescript
import { cn } from "@/shared/utils/utils"
````

## File: src/shared/shadcn-ui/progress.tsx
````typescript
import { cn } from "@/shared/utils/utils"
````

## File: src/shared/shadcn-ui/radio-group.tsx
````typescript
import { Circle } from "lucide-react"
⋮----
import { cn } from "@/shared/utils/utils"
⋮----
className=
````

## File: src/shared/shadcn-ui/scroll-area.tsx
````typescript
import { cn } from "@/shared/utils/utils"
⋮----
className=
````

## File: src/shared/shadcn-ui/select.tsx
````typescript
import { Check, ChevronDown, ChevronUp } from "lucide-react"
⋮----
import { cn } from "@/shared/utils/utils"
````

## File: src/shared/shadcn-ui/separator.tsx
````typescript
import { cn } from "@/shared/utils/utils"
````

## File: src/shared/shadcn-ui/sheet.tsx
````typescript
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"
⋮----
import { cn } from "@/shared/utils/utils"
⋮----
className=
````

## File: src/shared/shadcn-ui/sidebar.tsx
````typescript
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { PanelLeft } from "lucide-react"
⋮----
import { useIsMobile } from "@/shared/utility-hooks/use-mobile"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/shadcn-ui/button"
import { Input } from "@/shared/shadcn-ui/input"
import { Separator } from "@/shared/shadcn-ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/shared/shadcn-ui/sheet"
import { Skeleton } from "@/shared/shadcn-ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/shadcn-ui/tooltip"
⋮----
type SidebarContextProps = {
  state: "expanded" | "collapsed"
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
}
⋮----
function useSidebar()
⋮----
// This is the internal state of the sidebar.
// We use openProp and setOpenProp for control from outside the component.
⋮----
// This sets the cookie to keep the sidebar state.
⋮----
// Helper to toggle the sidebar.
⋮----
// Adds a keyboard shortcut to toggle the sidebar.
⋮----
const handleKeyDown = (event: KeyboardEvent) =>
⋮----
// We add a state so that we can do data-state="expanded" or "collapsed".
// This makes it easier to style the sidebar with Tailwind classes.
⋮----
className=
⋮----
{/* This is what handles the sidebar gap on desktop */}
⋮----
// Adjust the padding for floating and inset variants.
⋮----
onClick?.(event)
toggleSidebar()
⋮----
// Increases the hit area of the button on mobile.
⋮----
// Increases the hit area of the button on mobile.
⋮----
// Random width between 50 to 90%.
````

## File: src/shared/shadcn-ui/skeleton.tsx
````typescript
import { cn } from "@/shared/utils/utils"
⋮----
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>)
⋮----
className=
````

## File: src/shared/shadcn-ui/slider.tsx
````typescript
import { cn } from "@/shared/utils/utils"
````

## File: src/shared/shadcn-ui/sonner.tsx
````typescript
import {
  CircleCheck,
  Info,
  LoaderCircle,
  OctagonX,
  TriangleAlert,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"
⋮----
type ToasterProps = React.ComponentProps<typeof Sonner>
````

## File: src/shared/shadcn-ui/spinner.tsx
````typescript
import { Loader2Icon } from "lucide-react"
⋮----
import { cn } from "@/shared/utils/utils"
⋮----
function Spinner(
⋮----
className=
````

## File: src/shared/shadcn-ui/switch.tsx
````typescript
import { cn } from "@/shared/utils/utils"
⋮----
className=
````

## File: src/shared/shadcn-ui/table.tsx
````typescript
import { cn } from "@/shared/utils/utils"
````

## File: src/shared/shadcn-ui/tabs.tsx
````typescript
import { cn } from "@/shared/utils/utils"
````

## File: src/shared/shadcn-ui/textarea.tsx
````typescript
import { cn } from "@/shared/utils/utils"
⋮----
className=
````

## File: src/shared/shadcn-ui/timeline.tsx
````typescript
import { cn } from "@/shared/utils/utils";
⋮----
interface TimelineProps extends React.HTMLAttributes<HTMLOListElement> {
  children: React.ReactNode;
}
⋮----
interface TimelineItemProps extends React.LiHTMLAttributes<HTMLLIElement> {
  isLast?: boolean;
  isActive?: boolean;
}
⋮----
className=
````

## File: src/shared/shadcn-ui/toast.tsx
````typescript
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"
⋮----
import { cn } from "@/shared/utils/utils"
````

## File: src/shared/shadcn-ui/toaster.tsx
````typescript
import { useToast } from "@/shared/utility-hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/shared/shadcn-ui/toast"
````

## File: src/shared/shadcn-ui/toggle-group.tsx
````typescript
import { type VariantProps } from "class-variance-authority"
⋮----
import { cn } from "@/shared/utils/utils"
import { toggleVariants } from "@/shared/shadcn-ui/toggle"
````

## File: src/shared/shadcn-ui/toggle.tsx
````typescript
import { cva, type VariantProps } from "class-variance-authority"
⋮----
import { cn } from "@/shared/utils/utils"
````

## File: src/shared/shadcn-ui/tooltip.tsx
````typescript
import { cn } from "@/shared/utils/utils"
⋮----
className=
````

## File: src/shared/types/account.types.ts
````typescript
import type { Timestamp } from '@/shared/ports'
⋮----
import type { SkillGrant } from './skill.types'
⋮----
export type AccountType = 'user' | 'organization'
export type OrganizationRole = 'Owner' | 'Admin' | 'Member' | 'Guest';
export type Presence = 'active' | 'away' | 'offline';
export type InviteState = 'pending' | 'accepted' | 'expired';
export type NotificationType = 'info' | 'alert' | 'success';
⋮----
export interface Account {
  id: string
  name: string
  accountType: AccountType
  email?: string
  photoURL?: string
  bio?: string
  achievements?: string[]
  expertiseBadges?: ExpertiseBadge[]
  /**
   * Individual skill grants — permanently attached to this user.
   * Only meaningful on `accountType === 'user'` accounts.
   * Survives org/team deletion; matched by `tagSlug` against the global
   * static library in shared/constants/skills.ts.
   */
  skillGrants?: SkillGrant[]
  /**
   * Wallet — pre-embedded for future currency/reward system.
   * Only meaningful on `accountType === 'user'` accounts.
   * Balance is the authoritative figure; full transaction history lives in
   * the `accounts/{userId}/walletTransactions` sub-collection when needed.
   */
  wallet?: Wallet
  // org-specific
  description?: string
  ownerId?: string
  role?: OrganizationRole   // current user's role in this org
  theme?: ThemeConfig
  members?: MemberReference[]
  memberIds?: string[]
  teams?: Team[]
  createdAt?: Timestamp
}
⋮----
/**
   * Individual skill grants — permanently attached to this user.
   * Only meaningful on `accountType === 'user'` accounts.
   * Survives org/team deletion; matched by `tagSlug` against the global
   * static library in shared/constants/skills.ts.
   */
⋮----
/**
   * Wallet — pre-embedded for future currency/reward system.
   * Only meaningful on `accountType === 'user'` accounts.
   * Balance is the authoritative figure; full transaction history lives in
   * the `accounts/{userId}/walletTransactions` sub-collection when needed.
   */
⋮----
// org-specific
⋮----
role?: OrganizationRole   // current user's role in this org
⋮----
export interface MemberReference {
  id: string;
  name: string;
  email: string;
  role: OrganizationRole;
  presence: Presence;
  isExternal?: boolean;
  expiryDate?: Timestamp;
  /**
   * Display cache of this individual's skill grants.
   * Derived from accounts/{id}.skillGrants at read time — not the source of truth.
   * Do not write XP here; write to accounts/{userId}.skillGrants instead.
   */
  skillGrants?: SkillGrant[];
}
⋮----
/**
   * Display cache of this individual's skill grants.
   * Derived from accounts/{id}.skillGrants at read time — not the source of truth.
   * Do not write XP here; write to accounts/{userId}.skillGrants instead.
   */
⋮----
export interface Team {
  id: string;
  name: string;
  description: string;
  type: 'internal' | 'external';
  memberIds: string[];
}
⋮----
export interface ThemeConfig {
  primary: string;
  background: string;
  accent: string;
}
⋮----
/**
 * User wallet — inline balance summary stored on the user account document.
 *
 * Design contract:
 *   - `balance` is always the authoritative total (never negative).
 *   - Detailed transaction history goes in `accounts/{userId}/walletTransactions`
 *     sub-collection when that feature is built — this struct stays as the
 *     fast-read summary that loads with the profile in a single document fetch.
 *   - Extend this struct with optional fields (e.g. `currency`, `pendingBalance`)
 *     as needed — no migration required since all fields are optional beyond `balance`.
 */
export interface Wallet {
  /** Current coin balance. Incremented by XP rewards, decremented by spending. */
  balance: number;
}
⋮----
/** Current coin balance. Incremented by XP rewards, decremented by spending. */
⋮----
/** @deprecated Use SkillDefinition from shared/constants/skills for new code. */
export interface ExpertiseBadge {
  id: string;
  name: string;
  icon?: string; // e.g., a lucide-react icon name
}
⋮----
icon?: string; // e.g., a lucide-react icon name
⋮----
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  timestamp: number;
}
⋮----
export interface PartnerInvite {
  id: string;
  email: string;
  teamId: string;
  role: OrganizationRole;
  inviteState: InviteState;
  invitedAt: Timestamp; // Event Timestamp
  protocol: string;
}
⋮----
invitedAt: Timestamp; // Event Timestamp
````

## File: src/shared/types/audit.types.ts
````typescript
import type { Timestamp } from '@/shared/ports'
⋮----
export type AuditLogType = 'create' | 'update' | 'delete' | 'security';
⋮----
export interface AuditLog {
  id: string;
  accountId: string;
  workspaceId?: string;
  workspaceName?: string;
  recordedAt: Timestamp; // Event Timestamp
  actor: string;
  actorId?: string;
  action: string;
  target: string;
  type: AuditLogType;
  metadata?: {
    before?: unknown;
    after?: unknown;
    ip?: string;
  };
}
⋮----
recordedAt: Timestamp; // Event Timestamp
````

## File: src/shared/types/daily.types.ts
````typescript
import type { Timestamp } from '@/shared/ports'
⋮----
export interface DailyLogComment {
  id: string;
  author: {
    uid: string;
    name: string;
    avatarUrl?: string;
  };
  content: string;
  createdAt: Timestamp; // Firestore Timestamp
}
⋮----
createdAt: Timestamp; // Firestore Timestamp
⋮----
export interface DailyLog {
  id: string;
  accountId: string;
  workspaceId: string;
  workspaceName: string;
  author: {
    uid: string;
    name: string;
    avatarUrl?: string;
  };
  content: string;
  photoURLs: string[];
  recordedAt: Timestamp; // The actual time the event happened, editable by user
  createdAt: Timestamp; // The system time the log was created
  likes?: string[]; // Array of user IDs who liked the log
  likeCount?: number; // Denormalized count of likes
  commentCount?: number; // Denormalized count of comments
  comments?: DailyLogComment[]; // Locally held comments, not persisted
}
⋮----
recordedAt: Timestamp; // The actual time the event happened, editable by user
createdAt: Timestamp; // The system time the log was created
likes?: string[]; // Array of user IDs who liked the log
likeCount?: number; // Denormalized count of likes
commentCount?: number; // Denormalized count of comments
comments?: DailyLogComment[]; // Locally held comments, not persisted
````

## File: src/shared/types/index.ts
````typescript
// Legacy compatibility barrel for shared/common DTOs.
// Do not add new cross-BC domain contracts here.
// Priority: shared.kernel.* > feature slice public API > shared/types fallback.
````

## File: src/shared/types/schedule.types.ts
````typescript
import type { Timestamp } from '@/shared/ports'
⋮----
import type { SkillRequirement } from './skill.types'
import type { Location } from './workspace.types'
⋮----
export type ScheduleStatus = 'PROPOSAL' | 'OFFICIAL' | 'REJECTED' | 'COMPLETED';
⋮----
export interface ScheduleItem {
  id: string;
  accountId: string; // The owning Organization ID
  workspaceId: string;
  workspaceName?: string;
  title: string;
  description?: string;
  createdAt: Timestamp; // Firestore Timestamp
  updatedAt?: Timestamp; // Firestore Timestamp
  startDate: Timestamp; // Firestore Timestamp
  endDate: Timestamp; // Firestore Timestamp
  status: ScheduleStatus;
  originType: 'MANUAL' | 'TASK_AUTOMATION';
  originTaskId?: string;
  assigneeIds: string[];
  location?: Location;
  /** Sub-location within the workspace. FR-L2. */
  locationId?: string;
  /** Skill & staffing requirements proposed by the workspace. */
  requiredSkills?: SkillRequirement[];
  /** Who submitted this schedule proposal (workspace actor or automation). */
  proposedBy?: string;
  /**
   * Aggregate version — incremented on each state transition. [R7]
   * Used by domain functions and version guards to prevent stale writes.
   */
  version?: number;
  /** [R8] TraceID from the originating CBG_ENTRY — persisted for end-to-end audit. */
  traceId?: string;
}
⋮----
accountId: string; // The owning Organization ID
⋮----
createdAt: Timestamp; // Firestore Timestamp
updatedAt?: Timestamp; // Firestore Timestamp
startDate: Timestamp; // Firestore Timestamp
endDate: Timestamp; // Firestore Timestamp
⋮----
/** Sub-location within the workspace. FR-L2. */
⋮----
/** Skill & staffing requirements proposed by the workspace. */
⋮----
/** Who submitted this schedule proposal (workspace actor or automation). */
⋮----
/**
   * Aggregate version — incremented on each state transition. [R7]
   * Used by domain functions and version guards to prevent stale writes.
   */
⋮----
/** [R8] TraceID from the originating CBG_ENTRY — persisted for end-to-end audit. */
````

## File: src/shared/types/skill.types.ts
````typescript
/**
 * @fileoverview Skill & Tag-Badge system — core domain types.
 *
 * Design principles:
 *   - SkillTag        = a single entry from the GLOBAL static skill library
 *                       (see shared/constants/skills.ts — no Firestore, no org dependency)
 *   - SkillGrant      = assignment of a skill + tier to an individual user (the "who has it")
 *                       Stored permanently on accounts/{userId} — survives org deletion.
 *   - SkillRequirement = cross-BC staffing contract — see @/features/shared-kernel/skill-tier
 *
 * Key decisions:
 *   - The skill library is static code, not a Firestore collection.
 *     Any user can hold any skill; organisations do not own the library.
 *   - XP and skill grants belong to the PERSON, not the organisation.
 *   - `tagSlug` is the portable cross-org identifier (matches SkillSlug in constants/skills).
 * Naming is intentionally industry-semantic to support future AI-agent scheduling.
 *
 * [D19] SkillTier, TierDefinition, SkillRequirement canonical definitions live in
 *       @/features/shared-kernel/skill-tier; re-exported here as legacy fallback barrel.
 */
⋮----
import type { SkillTier } from '@/features/shared-kernel/skill-tier';
import type { Timestamp } from '@/shared/ports';
⋮----
// ---------------------------------------------------------------------------
// Global skill-tag library (static reference type)
// ---------------------------------------------------------------------------
⋮----
/**
 * A resolved skill entry, derived from the global static library
 * in shared/constants/skills.ts.
 *
 * This type is a pure value — no Firestore fields.
 * Use `findSkill(slug)` from constants/skills to resolve a slug into this shape.
 */
export interface SkillTag {
  /**
   * Stable hyphen-separated identifier — never change an existing slug.
   * Matches SkillSlug in shared/constants/skills.ts.
   */
  slug: string;
  /** Human-readable name (e.g. "Concrete Work", "Crane Operation"). */
  name: string;
  /** Grouping category (e.g. "Civil", "Electrical", "Management"). */
  category?: string;
  description?: string;
}
⋮----
/**
   * Stable hyphen-separated identifier — never change an existing slug.
   * Matches SkillSlug in shared/constants/skills.ts.
   */
⋮----
/** Human-readable name (e.g. "Concrete Work", "Crane Operation"). */
⋮----
/** Grouping category (e.g. "Civil", "Electrical", "Management"). */
⋮----
// ---------------------------------------------------------------------------
// Per-entity skill grants (assignments)
// ---------------------------------------------------------------------------
⋮----
/**
 * Records that an individual user holds a skill at a given tier.
 *
 * Stored on `accounts/{userId}.skillGrants[]` — permanently attached to the
 * person, not to the organisation.  Survives org deletion, team removal, and
 * partner-contract expiry.
 *
 * `tagSlug` is the portable cross-org identifier (e.g. "electrical-work").
 * `tagId`   is the org-local UUID and is optional for display/linking purposes.
 */
export interface SkillGrant {
  /**
   * Portable, hyphen-separated skill identifier — the primary lookup key.
   * Derived from SkillTag.slug at grant time so the record is self-contained
   * even after the originating organisation is deleted.
   * Example: "electrical-work", "project-management"
   */
  tagSlug: string;
  /** Snapshot of the human-readable tag name at grant time (for display). */
  tagName?: string;
  /** Org-local UUID — optional, only present when the org still exists. */
  tagId?: string;
  /**
   * Proficiency tier — set manually by an admin or derived from `xp` via
   * resolveSkillTier() in @/features/shared-kernel/skill-tier.
   */
  tier: SkillTier;
  /**
   * Accumulated XP (0–525).
   * Drives tier progression; use resolveSkillTier(xp) from @/features/shared-kernel/skill-tier.
   */
  xp: number;
  /** The organisation in which this XP was earned (audit trail). */
  earnedInOrgId?: string;
  /** When the skill was granted / last updated. */
  grantedAt?: Timestamp; // Firestore Timestamp
}
⋮----
/**
   * Portable, hyphen-separated skill identifier — the primary lookup key.
   * Derived from SkillTag.slug at grant time so the record is self-contained
   * even after the originating organisation is deleted.
   * Example: "electrical-work", "project-management"
   */
⋮----
/** Snapshot of the human-readable tag name at grant time (for display). */
⋮----
/** Org-local UUID — optional, only present when the org still exists. */
⋮----
/**
   * Proficiency tier — set manually by an admin or derived from `xp` via
   * resolveSkillTier() in @/features/shared-kernel/skill-tier.
   */
⋮----
/**
   * Accumulated XP (0–525).
   * Drives tier progression; use resolveSkillTier(xp) from @/features/shared-kernel/skill-tier.
   */
⋮----
/** The organisation in which this XP was earned (audit trail). */
⋮----
/** When the skill was granted / last updated. */
grantedAt?: Timestamp; // Firestore Timestamp
````

## File: src/shared/types/task.types.ts
````typescript
import type { WorkspaceTask } from './workspace.types'
⋮----
// ---------------------------------------------------------------------------
// Derived / computed task types (used by buildTaskTree in shared/lib/task)
// ---------------------------------------------------------------------------
⋮----
export type TaskWithChildren = WorkspaceTask & {
  children: TaskWithChildren[];
  descendantSum: number;
  wbsNo: string;
  progress: number;
}
````

## File: src/shared/types/workspace.types.ts
````typescript
export type WorkspaceRole = 'Manager' | 'Contributor' | 'Viewer';
export type WorkspaceLifecycleState = 'preparatory' | 'active' | 'stopped';
⋮----
import type { Timestamp } from '@/shared/ports'
⋮----
import type { SkillRequirement } from './skill.types'
⋮----
// =================================================================
// Brand Types — nominal type safety for cross-module references
// =================================================================
⋮----
/** Branded ID for a ParsingIntent document — prevents mixing with plain strings. */
export type IntentID = string & { readonly _brand: 'IntentID' }
⋮----
/** Branded pointer to a source file download URL — immutable contract anchor. */
export type SourcePointer = string & { readonly _brand: 'SourcePointer' }
⋮----
export interface Workspace {
  id: string;
  dimensionId: string; // The ID of the User or Organization this workspace belongs to.
  name: string;
  lifecycleState: WorkspaceLifecycleState;
  visibility: 'visible' | 'hidden';
  scope: string[];
  protocol: string; // Default protocol template
  capabilities: Capability[];
  grants: WorkspaceGrant[];
  teamIds: string[];
  tasks?: Record<string, WorkspaceTask>;
  issues?: Record<string, WorkspaceIssue>;
  files?: Record<string, WorkspaceFile>;
  address?: Address; // The physical address of the entire workspace.
  /** Sub-locations within this workspace (廠區子地點). FR-L1. */
  locations?: WorkspaceLocation[];
  createdAt: Timestamp;
}
⋮----
dimensionId: string; // The ID of the User or Organization this workspace belongs to.
⋮----
protocol: string; // Default protocol template
⋮----
address?: Address; // The physical address of the entire workspace.
/** Sub-locations within this workspace (廠區子地點). FR-L1. */
⋮----
export interface WorkspaceGrant {
  grantId: string;
  userId: string;
  role: WorkspaceRole;
  protocol: string; // Strategy Definition, immutable
  status: 'active' | 'revoked' | 'expired';
  grantedAt: Timestamp; // Event Timestamp
  revokedAt?: Timestamp; // Event Timestamp
  expiresAt?: Timestamp; // State Boundary
}
⋮----
protocol: string; // Strategy Definition, immutable
⋮----
grantedAt: Timestamp; // Event Timestamp
revokedAt?: Timestamp; // Event Timestamp
expiresAt?: Timestamp; // State Boundary
⋮----
export interface CapabilitySpec {
  id: string;
  name: string;
  type: 'ui' | 'api' | 'data' | 'governance' | 'monitoring';
  status: 'stable' | 'beta';
  description: string;
}
⋮----
export interface Capability extends CapabilitySpec {
  config?: object;
}
⋮----
export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  details?: string;
}
⋮----
/**
 * WorkspaceLocation — a sub-location within a workspace (廠區子地點).
 * Per docs/prd-schedule-workforce-skills.md FR-L1/FR-L2/FR-L3.
 * Workspace OWNER can create/edit/delete sub-locations.
 */
export interface WorkspaceLocation {
  locationId: string;
  label: string;        // e.g. "A棟 2F 東北角", "主會議室"
  description?: string;
  capacity?: number;    // max number of people (optional)
}
⋮----
label: string;        // e.g. "A棟 2F 東北角", "主會議室"
⋮----
capacity?: number;    // max number of people (optional)
⋮----
export interface Location {
  building?: string; // 棟
  floor?: string;    // 樓
  room?: string;     // 室
  description: string; // 一個自由文本欄位，用於描述更精確的位置，如 "主會議室" 或 "東北角機房"
}
⋮----
building?: string; // 棟
floor?: string;    // 樓
room?: string;     // 室
description: string; // 一個自由文本欄位，用於描述更精確的位置，如 "主會議室" 或 "東北角機房"
⋮----
// Workspace sub-collection types — all stored under workspaces/{id}/...
⋮----
export interface WorkspaceTask {
  id: string;
  name: string;
  description?: string;
  progressState: 'todo' | 'doing' | 'blocked' | 'completed' | 'verified' | 'accepted';
  priority: 'low' | 'medium' | 'high';
  type?: string;
  progress?: number;
  quantity?: number;
  completedQuantity?: number;
  unitPrice?: number;
  unit?: string;
  discount?: number;
  subtotal: number;
  parentId?: string;
  assigneeId?: string;
  dueDate?: Timestamp; // Firestore Timestamp
  photoURLs?: string[];
  location?: Location; // The specific place within the workspace address.
  sourceIntentId?: string; // SourcePointer —唯讀引用 ParsingIntent（Digital Twin）
  /** Skill requirements for this task — [TE_SK] tag::skill anchor for VS6 eligibility checks [#A4]. */
  requiredSkills?: SkillRequirement[];
  /** [S2] Monotonic version counter for optimistic concurrency control. */
  aggregateVersion?: number;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  [key: string]: unknown;
}
⋮----
dueDate?: Timestamp; // Firestore Timestamp
⋮----
location?: Location; // The specific place within the workspace address.
sourceIntentId?: string; // SourcePointer —唯讀引用 ParsingIntent（Digital Twin）
/** Skill requirements for this task — [TE_SK] tag::skill anchor for VS6 eligibility checks [#A4]. */
⋮----
/** [S2] Monotonic version counter for optimistic concurrency control. */
⋮----
export interface IssueComment {
  id: string;
  author: string;
  content: string;
  createdAt: Timestamp; // Firestore Timestamp
}
⋮----
createdAt: Timestamp; // Firestore Timestamp
⋮----
export interface WorkspaceIssue {
  id: string;
  title: string;
  type: 'technical' | 'financial';
  priority: 'high' | 'medium';
  issueState: 'open' | 'closed';
  /** SourcePointer to the A-track task that triggered this B-track issue. */
  sourceTaskId?: string;
  createdAt: Timestamp;
  comments?: IssueComment[];
}
⋮----
/** SourcePointer to the A-track task that triggered this B-track issue. */
⋮----
export interface WorkspaceFileVersion {
  versionId: string;
  versionNumber: number;
  versionName: string;
  size: number;
  uploadedBy: string;
  createdAt: Timestamp | Date; // Can be Date for client-side, becomes Timestamp on server
  downloadURL: string;
}
⋮----
createdAt: Timestamp | Date; // Can be Date for client-side, becomes Timestamp on server
⋮----
export interface WorkspaceFile {
  id: string;
  name: string;
  type: string;
  currentVersionId: string;
  updatedAt: Timestamp | Date; // Can be Date for client-side, becomes Timestamp on server
  versions: WorkspaceFileVersion[];
}
⋮----
updatedAt: Timestamp | Date; // Can be Date for client-side, becomes Timestamp on server
⋮----
// =================================================================
// ParsingIntent — Digital Twin 解析合約
// 由 workspace-business.document-parser 產出，唯讀合約供 tasks 引用
// =================================================================
⋮----
export interface ParsedLineItem {
  name: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  subtotal: number;
}
⋮----
export interface ParsingIntent {
  /** Branded ID — use `IntentID` cast when constructing references. */
  id: IntentID;
  workspaceId: string;
  sourceFileName: string;
  /** Immutable pointer to the original file in Firebase Storage. */
  sourceFileDownloadURL?: SourcePointer;
  /** Reference to the WorkspaceFile document that was parsed (for full traceability). */
  sourceFileId?: string;
  intentVersion: number;
  lineItems: ParsedLineItem[];
  /** Skill requirements extracted from the document — fed to organization.schedule proposals. */
  skillRequirements?: SkillRequirement[];
  status: 'pending' | 'imported' | 'superseded' | 'failed';
  createdAt: Timestamp;
  importedAt?: Timestamp;
}
⋮----
/** Branded ID — use `IntentID` cast when constructing references. */
⋮----
/** Immutable pointer to the original file in Firebase Storage. */
⋮----
/** Reference to the WorkspaceFile document that was parsed (for full traceability). */
⋮----
/** Skill requirements extracted from the document — fed to organization.schedule proposals. */
````

## File: src/shared/ui/language-switcher.tsx
````typescript
import { Globe } from "lucide-react"
⋮----
import { useI18n } from "@/config/i18n/i18n-provider"
import { type Locale } from "@/config/i18n/i18n-types"
import { Button } from "@/shared/shadcn-ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/shadcn-ui/dropdown-menu"
⋮----
export function LanguageSwitcher()
⋮----
onClick=
````

## File: src/shared/ui/page-header.tsx
````typescript
import type { ReactNode } from "react";
⋮----
interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: ReactNode;
  children?: ReactNode;
}
⋮----
/**
 * PageHeader — shared page-level heading component.
 * Used across all dashboard views for a consistent title/description/action layout.
 */
export function PageHeader(
````

## File: src/shared/utility-hooks/use-mobile.tsx
````typescript
export function useIsMobile()
⋮----
const onChange = () =>
````

## File: src/shared/utility-hooks/use-toast.ts
````typescript
// Inspired by react-hot-toast library
⋮----
import type {
  ToastActionElement,
  ToastProps,
} from "@/shared/shadcn-ui/toast"
⋮----
type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}
⋮----
function genId()
⋮----
type ActionType = typeof _actionTypes
⋮----
type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: ToasterToast["id"]
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: ToasterToast["id"]
    }
⋮----
interface State {
  toasts: ToasterToast[]
}
⋮----
const addToRemoveQueue = (toastId: string) =>
⋮----
export const reducer = (state: State, action: Action): State =>
⋮----
// ! Side effects ! - This could be extracted into a dismissToast() action,
// but I'll keep it here for simplicity
⋮----
function dispatch(action: Action)
⋮----
type Toast = Omit<ToasterToast, "id">
⋮----
function toast(
⋮----
const update = (props: ToasterToast)
const dismiss = () => dispatch(
⋮----
function useToast()
````

## File: src/shared/utils/format-bytes.ts
````typescript
export const formatBytes = (bytes: number): string =>
````

## File: src/shared/utils/utils.ts
````typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
⋮----
export function cn(...inputs: ClassValue[])
⋮----
/**
 * Converts a hex color string to an HSL string compatible with ShadCN CSS variables.
 * Format returned: "H S% L%" (e.g., "221 83% 53%")
 */
export function hexToHsl(hex: string): string
⋮----
// Remove the hash if it exists
⋮----
// Parse r, g, b
````

## File: tailwind.config.ts
````typescript
import type {Config} from 'tailwindcss';
````

## File: tsconfig.json
````json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"],
      "@/shared/shadcn-ui": ["./src/shared/shadcn-ui"],
      "@/shared/shadcn-ui/*": ["./src/shared/shadcn-ui/*"],
      "@/shared/lib/utils": ["./src/shared/lib/utils"],
      "@/shared/hooks": ["./src/shared/hooks"],
      "@/shared/hooks/*": ["./src/shared/hooks/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
````

## File: vitest.config.ts
````typescript
import path from 'path';
⋮----
import { defineConfig } from 'vitest/config';
````