import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import tseslint from "typescript-eslint";
import tailwind from "eslint-plugin-tailwindcss";
import importPlugin from "eslint-plugin-import";
import checkFile from "eslint-plugin-check-file";
import jsxA11y from "eslint-plugin-jsx-a11y";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 關鍵修正：將 'basePath' 改為 'baseDirectory'
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

export default tseslint.config(
  {
    // 忽略特定目錄
    ignores: [
      ".next/**",
      "node_modules/**",
      "src/shared-infra/firebase/**",
      "src/shared/shadcn-ui/**",
      "dist/**"
    ],
  },
  
  // 1. 以 Next.js 為核心的配置 (相容舊版格式)
  ...compat.extends("next/core-web-vitals"),
  
  // 2. 擴展功能插件
  {
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      "jsx-a11y": jsxA11y,
      import: importPlugin,
      "check-file": checkFile,
      tailwindcss: tailwind,
    },
    rules: {
      // --- Tailwind 優化 ---
      "tailwindcss/classnames-order": "warn",
      "tailwindcss/no-custom-classname": "off",

      // --- 自動排序 Import ---
      "import/order": ["warn", { 
        "groups": ["builtin", "external", "internal", "parent", "sibling", "index"],
        "newlines-between": "always",
        "alphabetize": { "order": "asc", "caseInsensitive": true }
      }],

      // --- 未使用變數 ---
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { "vars": "all", "varsIgnorePattern": "^_", "args": "after-used", "argsIgnorePattern": "^_" }
      ],

      // --- 檔案命名規範 ---
      // 允許 kebab-case 及 _ 前綴（架構慣例 _actions.ts / _gateway.ts / _funnel.ts）
      // ignoreMiddleExtensions: true 使 tailwind.config.ts 只驗證最外層名稱 tailwind
      "check-file/filename-naming-convention": [
        "warn",
        { "**/*.{tsx,ts}": "+([-a-z0-9_])" },
        { "ignoreMiddleExtensions": true }
      ],
      // --- 資料夾命名規範 ---
      // 允許 kebab-case、dot-notation（account.slice / infra.dlq-manager）及 _ 前綴
      // 不套用至 src/app/**（Next.js App Router 保留語法：(group)、@slot、[param]、(.)intercept）
      "check-file/folder-naming-convention": [
        "warn",
        {
          "src/features/**": "+([-a-z0-9_.])",
          "src/shared/**": "+([-a-z0-9_.])",
          "src/shared-infra/**": "+([-a-z0-9_.])",
          "src/config/**": "+([-a-z0-9_.])",
          "src/app-runtime/**": "+([-a-z0-9_.])"
        }
      ]
    },
  },

  // [D24] FIREBASE_ACL 邊界：features 切片禁止直接引用 firebase/* SDK
  // Scoped only to src/features/** — the shared/infra adapters are the ACL boundary themselves.
  {
    files: ["src/features/**/*.{ts,tsx}", "src/app/**/*.{ts,tsx}", "src/app-runtime/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "warn",
        {
          "paths": [
            {
              "name": "firebase/firestore",
              "message": "[D24] Import Firestore utilities from '@/shared/infra/firestore/firestore.read.adapter' or '@/shared/infra/firestore/firestore.write.adapter' instead of 'firebase/firestore'."
            },
            {
              "name": "firebase/auth",
              "message": "[D24] Import Auth utilities from '@/shared/infra/auth/auth.client' or auth adapter instead of 'firebase/auth'."
            },
            {
              "name": "firebase/storage",
              "message": "[D24] Import Storage utilities from '@/shared/infra/storage/storage.facade' instead of 'firebase/storage'."
            }
          ]
        }
      ]
    }
  }
);
