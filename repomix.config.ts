import { RepomixConfig } from "repomix";

const config: RepomixConfig = {
  output: {
    // 輸出檔案名稱
    filePath: "repomix-output.md",
    // 使用 markdown 格式，對 Copilot 來說結構最清晰
    style: "markdown",
    // 移除多餘的空白、換行與註解，極大化節省 Token
    removeComments: true,
    removeEmptyLines: true,
    // 在檔案頂部加入專案清單，幫助 AI 快速索引
    topFilesLength: 20,
    // 顯示目錄結構
    showDirectoryTree: true,
    // 加上複選框，有助於與 AI 溝通任務進度
    copyParameters: {
      useActionButtons: true,
    },
  },
  include: ["**/*"],
  ignore: {
    // 排除不必要的二進位檔、依賴包與快取
    customPatterns: [
      "node_modules/**",
      "dist/**",
      "build/**",
      ".git/**",
      "package-lock.json",
      "yarn.lock",
      "pnpm-lock.yaml",
      "*.png",
      "*.jpg",
      "*.jpeg",
      "*.gif",
      "*.svg",
      "*.ico",
      "repomix-output.md", // 避免把自己也打包進去
    ],
    // 排除常見的忽略檔案
    useGitignore: true,
    useDefaultPatterns: true,
  },
  security: {
    // 開啟安全性檢查，防止敏感資訊（如 API Key）流出給 AI
    enableSecurityCheck: true,
  },
};

export default config;