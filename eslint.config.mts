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
      "check-file/filename-naming-convention": [
        "warn",
        { "**/*.{tsx,ts}": "PASCAL_CASE" },
        { "ignoreMiddleExtensions": true }
      ],
      "check-file/folder-naming-convention": [
        "warn",
        { "src/**": "KEBAB_CASE" }
      ]
    },
  }
);
