# src/shadcn-ui — UI Component Library

shadcn/ui 原始組件層與配套資源。組件從 [ui.shadcn.com](https://ui.shadcn.com) 安裝後置於此目錄，不含業務邏輯。

## Directory Structure

```
src/shadcn-ui/
├── *.tsx              # shadcn/ui 原始組件（button、dialog、form …）
├── hooks/             # 配套 hooks（useIsMobile、useToast）
├── utils/             # 工具函式（cn、hexToHsl …）
├── lib/               # 路徑別名轉接層（@/shadcn-ui/lib/utils）
└── custom-ui/         # 基於 shadcn/ui 自訂的複合組件
```

## Import Paths

```ts
import { Button } from "@/shadcn-ui/button"
import { cn } from "@/shadcn-ui/utils/utils"
import { useToast } from "@/shadcn-ui/hooks/use-toast"
import { PageHeader } from "@/shadcn-ui/custom-ui/page-header"
```

## CLI

```bash
npx shadcn@latest add <component>   # 安裝至此目錄（由 components.json 配置）
```
