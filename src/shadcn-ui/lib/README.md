# src/shadcn-ui/lib

路徑別名轉接層。提供 `@/shadcn-ui/lib/utils` 別名，將 shadcn/ui CLI 生成的預設 import 路徑轉接至 `utils/utils.ts`。

## Files

| File | Purpose |
|------|---------|
| `utils.ts` | Re-export `cn` 等工具，供 `@/shadcn-ui/lib/utils` 別名使用 |

## Note

業務邏輯與新工具請放在 `utils/` 目錄；`lib/` 僅作路徑橋接用途。
