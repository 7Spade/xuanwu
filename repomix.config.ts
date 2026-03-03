import { defineConfig } from "repomix";

export default defineConfig({
  output: {
    // 輸出檔案路徑
    filePath: "repomix-output.context.md",
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