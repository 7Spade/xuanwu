import { defineConfig } from "repomix";

export default defineConfig({
  output: {
    // 輸出檔案路徑
    filePath: "docs/ai/repomix-output.context.md",
    // AI 自訂指令檔案，嵌入於輸出開頭，讓 AI 了解架構與使用規範
    instructionFilePath: "repomix-instruction.md",
    // 輸出格式：'markdown' 對 Copilot 的代碼塊識別效果最好
    style: "markdown",
    // 移除代碼註解，大幅節省 Token
    removeComments: true,
    // 移除空行，進一步壓縮體積
    removeEmptyLines: true,
    // 顯示行號（可選，Copilot 有時能更精準定位行數）
    showLineNumbers: false,
    // 顯示前 N 個大檔案路徑
    topFilesLength: 10,
    // **核心壓縮功能**：使用 Tree-sitter 智能提取結構並移除細節（顯著降低 Token 使用量）
    compress: true,
  },
  include: ["**/*"],
  ignore: {
    // 排除不必要的路徑
    customPatterns: [
      "**/*.md",          // 排除所有文件檔
      "**/*.test.ts",     // 排除測試檔
      "**/*.svg",         // 排除向量圖代碼
      "**/types/generated.ts", // 排除自動生成的巨大類型檔
      "**/*.md",
      ".codacy/**",
      ".firebase/**",
      ".github/**",
      ".idx/**",
      ".next/**",
      "docs/**",
      "public/**",
      "skills/**",
      ".aiexclude",
      ".firebaserc",
      ".gitattributes",
      ".gitignore",
      ".modified",
      ".prettierrc",
      "apphosting.yaml",
      "components.json",
      "eslint.config.mts",
      "next.config.ts",
      "postcss.config.mjs",
      "README.md",
      "repomix.config.ts",
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/.git/**",
      "package-lock.json",
      "repomix-output.md",
    ],
    // 繼承 .gitignore 設定
    useGitignore: true,
    // 使用 Repomix 內建的預設排除清單
    useDefaultPatterns: true,
  },
  security: {
    // 啟用安全性掃描，防止 Secret 洩露給 AI
    enableSecurityCheck: true,
  },
});